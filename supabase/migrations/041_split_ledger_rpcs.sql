-- Split tab RPCs. All run as the caller (SECURITY INVOKER), so the RLS policies
-- and grants from migration 040 apply. Each call is one transaction: an Expense
-- and all of its payers and shares are written together or not at all.
-- Money crosses the API as decimal strings to avoid any float rounding.
--
-- Equal split rule: with T minor units shared by n people, everyone gets
-- floor(T / n) and the T mod n leftover minor units go one each to the first
-- people ordered by group_members.id ascending (UUID order, which equals the
-- lowercase hex string order). Example: 100.00 / 3 -> 33.34, 33.33, 33.33.
BEGIN;

-- A non-negative decimal string with no more decimals than `p_minor`.
CREATE FUNCTION trip_private.split_parse_amount(p_text text, p_minor integer)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $$
DECLARE
  v_amount numeric;
BEGIN
  IF p_text IS NULL OR p_text !~ '^[0-9]{1,13}(\.[0-9]{1,12})?$' THEN
    RAISE EXCEPTION 'split_invalid_amount' USING ERRCODE = 'P0001';
  END IF;
  v_amount := p_text::numeric;
  IF v_amount <> round(v_amount, p_minor) THEN
    RAISE EXCEPTION 'split_amount_precision' USING ERRCODE = 'P0001';
  END IF;
  RETURN v_amount;
END;
$$;

-- Parse [{"member_id": uuid, "amount": "12.34"}, ...]; one line per person.
CREATE FUNCTION trip_private.split_parse_lines(p_lines jsonb, p_minor integer, p_allow_zero boolean)
RETURNS TABLE (member_id uuid, amount numeric)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $$
DECLARE
  v_line jsonb;
  v_member_text text;
  v_seen uuid[] := '{}';
BEGIN
  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'split_lines_required' USING ERRCODE = 'P0001';
  END IF;
  IF jsonb_array_length(p_lines) > 100 THEN
    RAISE EXCEPTION 'split_invalid_line' USING ERRCODE = 'P0001';
  END IF;
  FOR v_line IN SELECT line.value FROM jsonb_array_elements(p_lines) AS line LOOP
    v_member_text := CASE WHEN jsonb_typeof(v_line) = 'object' THEN v_line ->> 'member_id' END;
    IF v_member_text IS NULL
      OR v_member_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'split_invalid_line' USING ERRCODE = 'P0001';
    END IF;
    member_id := v_member_text::uuid;
    IF member_id = ANY (v_seen) THEN
      RAISE EXCEPTION 'split_duplicate_member' USING ERRCODE = 'P0001';
    END IF;
    v_seen := v_seen || member_id;
    amount := trip_private.split_parse_amount(v_line ->> 'amount', p_minor);
    IF amount = 0 AND NOT p_allow_zero THEN
      RAISE EXCEPTION 'split_invalid_amount' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Validate payer and share lines against an accounting total. Returns the
-- lines ordered by member id. Every person must be an active member of the Trip.
CREATE FUNCTION trip_private.split_checked_lines(
  p_group_id uuid,
  p_total numeric,
  p_currency text,
  p_split_method text,
  p_payers jsonb,
  p_shares jsonb,
  OUT payer_ids uuid[],
  OUT payer_amounts numeric[],
  OUT share_ids uuid[],
  OUT share_amounts numeric[]
)
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog
AS $$
DECLARE
  v_minor integer := trip_private.split_currency_minor_units(p_currency);
  v_scale numeric := power(10::numeric, v_minor);
  v_count integer;
  v_base numeric;
  v_extra numeric;
BEGIN
  IF p_split_method IS NULL OR p_split_method NOT IN ('equal', 'exact') THEN
    RAISE EXCEPTION 'split_invalid_method' USING ERRCODE = 'P0001';
  END IF;

  SELECT array_agg(line.member_id ORDER BY line.member_id), array_agg(line.amount ORDER BY line.member_id)
  INTO payer_ids, payer_amounts
  FROM trip_private.split_parse_lines(p_payers, v_minor, false) AS line;

  SELECT array_agg(line.member_id ORDER BY line.member_id), array_agg(line.amount ORDER BY line.member_id)
  INTO share_ids, share_amounts
  FROM trip_private.split_parse_lines(p_shares, v_minor, true) AS line;

  IF EXISTS (
    SELECT 1 FROM unnest(payer_ids || share_ids) AS person(id)
    WHERE NOT trip_private.split_is_active_member(p_group_id, person.id)
  ) THEN
    RAISE EXCEPTION 'split_inactive_member' USING ERRCODE = 'P0001';
  END IF;

  IF (SELECT sum(value) FROM unnest(payer_amounts) AS value) <> p_total THEN
    RAISE EXCEPTION 'split_payers_total_mismatch' USING ERRCODE = 'P0001';
  END IF;
  IF (SELECT sum(value) FROM unnest(share_amounts) AS value) <> p_total THEN
    RAISE EXCEPTION 'split_shares_total_mismatch' USING ERRCODE = 'P0001';
  END IF;

  IF p_split_method = 'equal' THEN
    v_count := cardinality(share_ids);
    v_base := floor(p_total * v_scale / v_count);
    v_extra := p_total * v_scale - v_base * v_count;
    IF EXISTS (
      SELECT 1 FROM unnest(share_amounts) WITH ORDINALITY AS share(amount, position)
      WHERE share.amount * v_scale <> v_base + CASE WHEN share.position <= v_extra THEN 1 ELSE 0 END
    ) THEN
      RAISE EXCEPTION 'split_equal_mismatch' USING ERRCODE = 'P0001';
    END IF;
  END IF;
END;
$$;

-- Original amount, FX snapshot, and the accounting amount it reproduces to.
CREATE FUNCTION trip_private.split_converted_amount(
  p_original_amount text,
  p_original_currency text,
  p_accounting_currency text,
  p_fx_rate text,
  p_fx_source text,
  OUT original_amount numeric,
  OUT original_currency text,
  OUT fx_rate numeric,
  OUT fx_source text,
  OUT accounting_amount numeric
)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $$
BEGIN
  original_currency := upper(btrim(coalesce(p_original_currency, '')));
  IF original_currency !~ '^[A-Z]{3}$' THEN
    RAISE EXCEPTION 'split_invalid_currency' USING ERRCODE = 'P0001';
  END IF;
  original_amount := trip_private.split_parse_amount(p_original_amount,
    trip_private.split_currency_minor_units(original_currency));
  IF original_amount <= 0 OR original_amount >= 1000000000000 THEN
    RAISE EXCEPTION 'split_invalid_amount' USING ERRCODE = 'P0001';
  END IF;

  IF original_currency = p_accounting_currency THEN
    IF p_fx_rate IS NOT NULL OR p_fx_source IS NOT NULL THEN
      RAISE EXCEPTION 'split_fx_not_applicable' USING ERRCODE = 'P0001';
    END IF;
    accounting_amount := original_amount;
    RETURN;
  END IF;

  IF p_fx_rate IS NULL OR p_fx_rate !~ '^[0-9]{1,9}(\.[0-9]{1,12})?$' OR p_fx_rate::numeric <= 0 THEN
    RAISE EXCEPTION 'split_fx_rate_required' USING ERRCODE = 'P0001';
  END IF;
  IF p_fx_source IS NULL OR p_fx_source NOT IN ('manual', 'open.er-api.com') THEN
    RAISE EXCEPTION 'split_fx_source_invalid' USING ERRCODE = 'P0001';
  END IF;
  fx_rate := p_fx_rate::numeric;
  fx_source := p_fx_source;
  accounting_amount := round(original_amount * fx_rate,
    trip_private.split_currency_minor_units(p_accounting_currency));
  IF accounting_amount <= 0 THEN
    RAISE EXCEPTION 'split_amount_too_small' USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE FUNCTION trip_private.split_clean_description(p_description text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $$
BEGIN
  IF p_description IS NULL OR btrim(p_description) = '' OR char_length(btrim(p_description)) > 120 THEN
    RAISE EXCEPTION 'split_invalid_description' USING ERRCODE = 'P0001';
  END IF;
  RETURN btrim(p_description);
END;
$$;

CREATE FUNCTION trip_private.split_clean_category(p_category text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $$
BEGIN
  IF nullif(btrim(coalesce(p_category, '')), '') IS NULL THEN
    RETURN NULL;
  END IF;
  IF btrim(p_category) NOT IN ('food', 'transport', 'stay', 'activity', 'shopping', 'other') THEN
    RAISE EXCEPTION 'split_invalid_category' USING ERRCODE = 'P0001';
  END IF;
  RETURN btrim(p_category);
END;
$$;

-- Add an Expense with its payers and shares. Retrying with the same
-- p_request_id returns the Expense created by the first call.
CREATE FUNCTION public.commit_expense(
  p_group_id uuid,
  p_description text,
  p_category text,
  p_original_amount text,
  p_original_currency text,
  p_fx_rate text,
  p_fx_source text,
  p_split_method text,
  p_payers jsonb,
  p_shares jsonb,
  p_request_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_member uuid := trip_private.current_member_id(p_group_id);
  v_accounting_currency text;
  v_existing record;
  v_amount record;
  v_lines record;
  v_expense_id uuid;
BEGIN
  IF v_member IS NULL THEN
    RAISE EXCEPTION 'split_not_a_member' USING ERRCODE = 'P0001';
  END IF;

  IF p_request_id IS NOT NULL THEN
    SELECT expense.id, expense.created_by INTO v_existing
    FROM public.trip_expenses AS expense
    WHERE expense.group_id = p_group_id AND expense.request_id = p_request_id;
    IF FOUND THEN
      IF v_existing.created_by <> v_member THEN
        RAISE EXCEPTION 'split_request_conflict' USING ERRCODE = 'P0001';
      END IF;
      RETURN v_existing.id;
    END IF;
  END IF;

  SELECT config.accounting_currency INTO v_accounting_currency
  FROM public.group_configurations AS config
  WHERE config.group_id = p_group_id;
  IF v_accounting_currency IS NULL THEN
    RAISE EXCEPTION 'split_not_a_member' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_amount FROM trip_private.split_converted_amount(
    p_original_amount, p_original_currency, v_accounting_currency, p_fx_rate, p_fx_source);
  SELECT * INTO v_lines FROM trip_private.split_checked_lines(
    p_group_id, v_amount.accounting_amount, v_accounting_currency, p_split_method, p_payers, p_shares);

  INSERT INTO public.trip_expenses (group_id, description, category, original_amount, original_currency,
    accounting_amount, accounting_currency, fx_rate, fx_source, split_method, created_by, request_id)
  VALUES (p_group_id, trip_private.split_clean_description(p_description),
    trip_private.split_clean_category(p_category), v_amount.original_amount, v_amount.original_currency,
    v_amount.accounting_amount, v_accounting_currency, v_amount.fx_rate, v_amount.fx_source,
    p_split_method, v_member, p_request_id)
  RETURNING id INTO v_expense_id;

  INSERT INTO public.trip_expense_payers (expense_id, group_id, group_member_id, amount)
  SELECT v_expense_id, p_group_id, line.member_id, line.amount
  FROM unnest(v_lines.payer_ids, v_lines.payer_amounts) AS line(member_id, amount);

  INSERT INTO public.trip_expense_shares (expense_id, group_id, group_member_id, amount)
  SELECT v_expense_id, p_group_id, line.member_id, line.amount
  FROM unnest(v_lines.share_ids, v_lines.share_amounts) AS line(member_id, amount);

  RETURN v_expense_id;
EXCEPTION
  WHEN unique_violation THEN
    -- A concurrent retry with the same request id won the race.
    SELECT expense.id, expense.created_by INTO v_existing
    FROM public.trip_expenses AS expense
    WHERE expense.group_id = p_group_id AND expense.request_id = p_request_id;
    IF FOUND AND v_existing.created_by = v_member THEN
      RETURN v_existing.id;
    END IF;
    RAISE;
END;
$$;

-- The caller's Expense row if they may change it (creator or Trip Owner), locked.
CREATE FUNCTION trip_private.split_editable_expense(p_expense_id uuid, p_expected_version integer)
RETURNS public.trip_expenses
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  v_expense public.trip_expenses;
  v_member uuid;
BEGIN
  SELECT expense.* INTO v_expense FROM public.trip_expenses AS expense WHERE expense.id = p_expense_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'split_expense_not_found' USING ERRCODE = 'P0001';
  END IF;
  v_member := trip_private.current_member_id(v_expense.group_id);
  IF v_member IS NULL THEN
    RAISE EXCEPTION 'split_not_a_member' USING ERRCODE = 'P0001';
  END IF;
  IF v_expense.created_by <> v_member
    AND NOT trip_private.split_is_owner(v_expense.group_id) THEN
    RAISE EXCEPTION 'split_not_allowed' USING ERRCODE = 'P0001';
  END IF;

  SELECT expense.* INTO v_expense FROM public.trip_expenses AS expense
  WHERE expense.id = p_expense_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'split_expense_not_found' USING ERRCODE = 'P0001';
  END IF;
  IF p_expected_version IS NOT NULL AND v_expense.version <> p_expected_version THEN
    RAISE EXCEPTION 'split_expense_stale' USING ERRCODE = 'P0001';
  END IF;
  RETURN v_expense;
END;
$$;

-- Replace an Expense's details, payers and shares in one step. The accounting
-- currency stays the one it was recorded in. An unchanged FX rate keeps its
-- original capture time; a new rate is a new snapshot.
CREATE FUNCTION public.update_expense(
  p_expense_id uuid,
  p_expected_version integer,
  p_description text,
  p_category text,
  p_original_amount text,
  p_original_currency text,
  p_fx_rate text,
  p_fx_source text,
  p_split_method text,
  p_payers jsonb,
  p_shares jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_expense public.trip_expenses;
  v_amount record;
  v_lines record;
  v_version integer;
BEGIN
  v_expense := trip_private.split_editable_expense(p_expense_id, p_expected_version);

  SELECT * INTO v_amount FROM trip_private.split_converted_amount(
    p_original_amount, p_original_currency, v_expense.accounting_currency, p_fx_rate, p_fx_source);
  SELECT * INTO v_lines FROM trip_private.split_checked_lines(
    v_expense.group_id, v_amount.accounting_amount, v_expense.accounting_currency, p_split_method,
    p_payers, p_shares);

  DELETE FROM public.trip_expense_payers AS payer WHERE payer.expense_id = p_expense_id;
  DELETE FROM public.trip_expense_shares AS share WHERE share.expense_id = p_expense_id;

  UPDATE public.trip_expenses AS expense SET
    description = trip_private.split_clean_description(p_description),
    category = trip_private.split_clean_category(p_category),
    original_amount = v_amount.original_amount,
    original_currency = v_amount.original_currency,
    accounting_amount = v_amount.accounting_amount,
    fx_rate = v_amount.fx_rate,
    fx_source = v_amount.fx_source,
    split_method = p_split_method
  WHERE expense.id = p_expense_id
  RETURNING expense.version INTO v_version;

  INSERT INTO public.trip_expense_payers (expense_id, group_id, group_member_id, amount)
  SELECT p_expense_id, v_expense.group_id, line.member_id, line.amount
  FROM unnest(v_lines.payer_ids, v_lines.payer_amounts) AS line(member_id, amount);

  INSERT INTO public.trip_expense_shares (expense_id, group_id, group_member_id, amount)
  SELECT p_expense_id, v_expense.group_id, line.member_id, line.amount
  FROM unnest(v_lines.share_ids, v_lines.share_amounts) AS line(member_id, amount);

  RETURN v_version;
END;
$$;

CREATE FUNCTION public.delete_expense(p_expense_id uuid, p_expected_version integer DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM trip_private.split_editable_expense(p_expense_id, p_expected_version);
  DELETE FROM public.trip_expenses AS expense WHERE expense.id = p_expense_id;
END;
$$;

-- Record that one member paid another outside the app. Nothing moves money.
CREATE FUNCTION public.record_settlement(
  p_group_id uuid,
  p_from_member uuid,
  p_to_member uuid,
  p_amount text,
  p_note text DEFAULT NULL,
  p_request_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_member uuid := trip_private.current_member_id(p_group_id);
  v_currency text;
  v_amount numeric;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_existing record;
  v_settlement_id uuid;
BEGIN
  IF v_member IS NULL THEN
    RAISE EXCEPTION 'split_not_a_member' USING ERRCODE = 'P0001';
  END IF;

  IF p_request_id IS NOT NULL THEN
    SELECT settlement.id, settlement.recorded_by INTO v_existing
    FROM public.trip_settlements AS settlement
    WHERE settlement.group_id = p_group_id AND settlement.request_id = p_request_id;
    IF FOUND THEN
      IF v_existing.recorded_by <> v_member THEN
        RAISE EXCEPTION 'split_request_conflict' USING ERRCODE = 'P0001';
      END IF;
      RETURN v_existing.id;
    END IF;
  END IF;

  IF p_from_member IS NULL OR p_to_member IS NULL OR p_from_member = p_to_member THEN
    RAISE EXCEPTION 'split_settlement_same_person' USING ERRCODE = 'P0001';
  END IF;
  IF NOT trip_private.split_is_active_member(p_group_id, p_from_member)
    OR NOT trip_private.split_is_active_member(p_group_id, p_to_member) THEN
    RAISE EXCEPTION 'split_inactive_member' USING ERRCODE = 'P0001';
  END IF;
  IF v_member NOT IN (p_from_member, p_to_member)
    AND NOT trip_private.split_is_owner(p_group_id) THEN
    RAISE EXCEPTION 'split_not_allowed' USING ERRCODE = 'P0001';
  END IF;
  IF v_note IS NOT NULL AND char_length(v_note) > 200 THEN
    RAISE EXCEPTION 'split_invalid_note' USING ERRCODE = 'P0001';
  END IF;

  SELECT config.accounting_currency INTO v_currency
  FROM public.group_configurations AS config
  WHERE config.group_id = p_group_id;
  v_amount := trip_private.split_parse_amount(p_amount, trip_private.split_currency_minor_units(v_currency));
  IF v_amount <= 0 OR v_amount >= 1000000000000 THEN
    RAISE EXCEPTION 'split_invalid_amount' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.trip_settlements (group_id, from_member, to_member, amount, currency, note,
    recorded_by, request_id)
  VALUES (p_group_id, p_from_member, p_to_member, v_amount, v_currency, v_note, v_member, p_request_id)
  RETURNING id INTO v_settlement_id;
  RETURN v_settlement_id;
EXCEPTION
  WHEN unique_violation THEN
    SELECT settlement.id, settlement.recorded_by INTO v_existing
    FROM public.trip_settlements AS settlement
    WHERE settlement.group_id = p_group_id AND settlement.request_id = p_request_id;
    IF FOUND AND v_existing.recorded_by = v_member THEN
      RETURN v_existing.id;
    END IF;
    RAISE;
END;
$$;

-- The recorder or a Trip Owner may delete a Settlement record.
CREATE FUNCTION public.delete_settlement(p_settlement_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_settlement record;
  v_member uuid;
BEGIN
  SELECT settlement.group_id, settlement.recorded_by INTO v_settlement
  FROM public.trip_settlements AS settlement WHERE settlement.id = p_settlement_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'split_settlement_not_found' USING ERRCODE = 'P0001';
  END IF;
  v_member := trip_private.current_member_id(v_settlement.group_id);
  IF v_member IS NULL THEN
    RAISE EXCEPTION 'split_not_a_member' USING ERRCODE = 'P0001';
  END IF;
  IF v_settlement.recorded_by <> v_member
    AND NOT trip_private.split_is_owner(v_settlement.group_id) THEN
    RAISE EXCEPTION 'split_not_allowed' USING ERRCODE = 'P0001';
  END IF;
  DELETE FROM public.trip_settlements AS settlement WHERE settlement.id = p_settlement_id;
END;
$$;

-- The whole Trip ledger in one consistent snapshot, money as decimal strings.
CREATE FUNCTION public.get_split_ledger(p_group_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
  IF trip_private.current_member_id(p_group_id) IS NULL THEN
    RAISE EXCEPTION 'split_not_a_member' USING ERRCODE = 'P0001';
  END IF;
  RETURN jsonb_build_object(
    'accounting_currency', (
      SELECT config.accounting_currency FROM public.group_configurations AS config
      WHERE config.group_id = p_group_id),
    'expenses', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', expense.id,
        'description', expense.description,
        'category', expense.category,
        'original_amount', expense.original_amount::text,
        'original_currency', expense.original_currency,
        'accounting_amount', expense.accounting_amount::text,
        'accounting_currency', expense.accounting_currency,
        'fx_rate', expense.fx_rate::text,
        'fx_source', expense.fx_source,
        'fx_captured_at', expense.fx_captured_at,
        'split_method', expense.split_method,
        'created_by', expense.created_by,
        'version', expense.version,
        'created_at', expense.created_at,
        'updated_at', expense.updated_at,
        'payers', coalesce((
          SELECT jsonb_agg(jsonb_build_object('member_id', payer.group_member_id, 'amount', payer.amount::text)
            ORDER BY payer.group_member_id)
          FROM public.trip_expense_payers AS payer WHERE payer.expense_id = expense.id), '[]'::jsonb),
        'shares', coalesce((
          SELECT jsonb_agg(jsonb_build_object('member_id', share.group_member_id, 'amount', share.amount::text)
            ORDER BY share.group_member_id)
          FROM public.trip_expense_shares AS share WHERE share.expense_id = expense.id), '[]'::jsonb)
      ) ORDER BY expense.created_at DESC, expense.id DESC)
      FROM public.trip_expenses AS expense
      WHERE expense.group_id = p_group_id), '[]'::jsonb),
    'settlements', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', settlement.id,
        'from_member', settlement.from_member,
        'to_member', settlement.to_member,
        'amount', settlement.amount::text,
        'currency', settlement.currency,
        'note', settlement.note,
        'recorded_by', settlement.recorded_by,
        'created_at', settlement.created_at
      ) ORDER BY settlement.created_at DESC, settlement.id DESC)
      FROM public.trip_settlements AS settlement
      WHERE settlement.group_id = p_group_id), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION
  trip_private.split_parse_amount(text, integer),
  trip_private.split_parse_lines(jsonb, integer, boolean),
  trip_private.split_checked_lines(uuid, numeric, text, text, jsonb, jsonb),
  trip_private.split_converted_amount(text, text, text, text, text),
  trip_private.split_clean_description(text),
  trip_private.split_clean_category(text),
  trip_private.split_editable_expense(uuid, integer),
  public.commit_expense(uuid, text, text, text, text, text, text, text, jsonb, jsonb, uuid),
  public.update_expense(uuid, integer, text, text, text, text, text, text, text, jsonb, jsonb),
  public.delete_expense(uuid, integer),
  public.record_settlement(uuid, uuid, uuid, text, text, uuid),
  public.delete_settlement(uuid),
  public.get_split_ledger(uuid)
FROM PUBLIC, anon, service_role;

GRANT EXECUTE ON FUNCTION
  trip_private.split_parse_amount(text, integer),
  trip_private.split_parse_lines(jsonb, integer, boolean),
  trip_private.split_checked_lines(uuid, numeric, text, text, jsonb, jsonb),
  trip_private.split_converted_amount(text, text, text, text, text),
  trip_private.split_clean_description(text),
  trip_private.split_clean_category(text),
  trip_private.split_editable_expense(uuid, integer),
  public.commit_expense(uuid, text, text, text, text, text, text, text, jsonb, jsonb, uuid),
  public.update_expense(uuid, integer, text, text, text, text, text, text, text, jsonb, jsonb),
  public.delete_expense(uuid, integer),
  public.record_settlement(uuid, uuid, uuid, text, text, uuid),
  public.delete_settlement(uuid),
  public.get_split_ledger(uuid)
TO authenticated;

COMMIT;
