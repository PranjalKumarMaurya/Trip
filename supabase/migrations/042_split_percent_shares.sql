-- Split tab: percent and shares split modes, alongside equal and exact.
--
-- Each share row of a 'percent' or 'shares' Expense keeps the input it came
-- from in trip_expense_shares.weight: the person's percent (above 0, at most
-- 100 and two decimals; an Expense's percents total exactly 100) or their whole
-- number of shares (1 to 1000). Equal and exact Expenses store no weight.
--
-- Weighted split rule, the same for both modes (largest remainder): with T
-- accounting minor units and integer weights w_i (each weight x 100) totalling
-- W, everyone gets floor(T x w_i / W); the T - sum(floor) leftover minor units
-- go one each to the largest remainders (T x w_i mod W), ties to the lower
-- group_members.id (UUID order, which equals lowercase hex string order).
-- Examples: 100.00 at 1:1:1 shares -> 33.34, 33.33, 33.33; 1000 JPY at
-- 33.33/33.33/33.34 % -> 333, 333, 334. Every weighted person gets a row, even
-- a zero one, so the rows always sum exactly to the accounting amount.
-- Mirrored by weightedSplit() in src/features/split/money.ts.
--
-- The RPCs check that the submitted share amounts are exactly this split of
-- the submitted weights, and the COMMIT-time balance check enforces the same
-- for every write path, so tampered rows are rejected.
BEGIN;

ALTER TABLE public.trip_expenses DROP CONSTRAINT trip_expenses_split_method_check;
ALTER TABLE public.trip_expenses ADD CONSTRAINT trip_expenses_split_method_check
  CHECK (split_method IN ('equal', 'exact', 'percent', 'shares'));

ALTER TABLE public.trip_expense_shares ADD COLUMN weight numeric
  CONSTRAINT trip_expense_shares_weight_range
  CHECK (weight IS NULL OR (weight > 0 AND weight <= 1000 AND weight = round(weight, 2)));

-- The weighted split of `p_total` (a decimal amount with `p_minor` places)
-- between `p_ids` by positive `p_weights` with at most two decimals. One row
-- per id, ordered by id. Exact: integer division and remainder only.
CREATE FUNCTION trip_private.split_weighted_amounts(
  p_total numeric,
  p_minor integer,
  p_ids uuid[],
  p_weights numeric[]
)
RETURNS TABLE (member_id uuid, amount numeric)
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  WITH line AS (
    SELECT input.id, round(input.weight * 100) AS weight, round(p_total * power(10::numeric, p_minor)) AS units
    FROM unnest(p_ids, p_weights) AS input(id, weight)
  ), part AS (
    SELECT line.id, line.units,
      div(line.units * line.weight, sum(line.weight) OVER ()) AS base,
      mod(line.units * line.weight, sum(line.weight) OVER ()) AS remainder
    FROM line
  ), ranked AS (
    SELECT part.id, part.base,
      row_number() OVER (ORDER BY part.remainder DESC, part.id) AS position,
      part.units - sum(part.base) OVER () AS leftover
    FROM part
  )
  SELECT ranked.id,
    round((ranked.base + CASE WHEN ranked.position <= ranked.leftover THEN 1 ELSE 0 END)
      / power(10::numeric, p_minor), p_minor)
  FROM ranked
  ORDER BY ranked.id;
$$;

-- The input behind one share line: a percent for 'percent', a whole number of
-- shares for 'shares', and nothing for 'equal' or 'exact'. JSON strings or
-- numbers are accepted, like amounts.
CREATE FUNCTION trip_private.split_parse_weight(p_value jsonb, p_method text)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $$
DECLARE
  v_text text := CASE WHEN p_value IS NULL OR jsonb_typeof(p_value) = 'null' THEN NULL ELSE p_value #>> '{}' END;
  v_weight numeric;
BEGIN
  IF p_method NOT IN ('percent', 'shares') THEN
    IF v_text IS NOT NULL THEN
      RAISE EXCEPTION 'split_weight_not_applicable' USING ERRCODE = 'P0001';
    END IF;
    RETURN NULL;
  END IF;
  IF p_method = 'percent' THEN
    IF v_text IS NULL OR v_text !~ '^[0-9]{1,3}(\.[0-9]{1,2})?$' THEN
      RAISE EXCEPTION 'split_invalid_percent' USING ERRCODE = 'P0001';
    END IF;
    v_weight := v_text::numeric;
    IF v_weight <= 0 OR v_weight > 100 THEN
      RAISE EXCEPTION 'split_invalid_percent' USING ERRCODE = 'P0001';
    END IF;
    RETURN v_weight;
  END IF;
  IF v_text IS NULL OR v_text !~ '^[0-9]{1,4}$' THEN
    RAISE EXCEPTION 'split_invalid_shares' USING ERRCODE = 'P0001';
  END IF;
  v_weight := v_text::numeric;
  IF v_weight < 1 OR v_weight > 1000 THEN
    RAISE EXCEPTION 'split_invalid_shares' USING ERRCODE = 'P0001';
  END IF;
  RETURN v_weight;
END;
$$;

-- As in migration 041, plus percent and shares: their weights are returned in
-- share order and the share amounts must be exactly the weighted split.
DROP FUNCTION trip_private.split_checked_lines(uuid, numeric, text, text, jsonb, jsonb);
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
  OUT share_amounts numeric[],
  OUT share_weights numeric[]
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
  IF p_split_method IS NULL OR p_split_method NOT IN ('equal', 'exact', 'percent', 'shares') THEN
    RAISE EXCEPTION 'split_invalid_method' USING ERRCODE = 'P0001';
  END IF;

  SELECT array_agg(line.member_id ORDER BY line.member_id), array_agg(line.amount ORDER BY line.member_id)
  INTO payer_ids, payer_amounts
  FROM trip_private.split_parse_lines(p_payers, v_minor, false) AS line;

  SELECT array_agg(line.member_id ORDER BY line.member_id), array_agg(line.amount ORDER BY line.member_id)
  INTO share_ids, share_amounts
  FROM trip_private.split_parse_lines(p_shares, v_minor, true) AS line;

  -- Member ids were validated above, so they cast safely here.
  SELECT array_agg(trip_private.split_parse_weight(line.value -> 'weight', p_split_method)
    ORDER BY (line.value ->> 'member_id')::uuid)
  INTO share_weights
  FROM jsonb_array_elements(p_shares) AS line;

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
  ELSIF p_split_method IN ('percent', 'shares') THEN
    IF p_split_method = 'percent' AND (SELECT sum(value) FROM unnest(share_weights) AS value) <> 100 THEN
      RAISE EXCEPTION 'split_percent_total' USING ERRCODE = 'P0001';
    END IF;
    IF EXISTS (
      SELECT 1
      FROM unnest(share_ids, share_amounts) AS given(member_id, amount)
      JOIN trip_private.split_weighted_amounts(p_total, v_minor, share_ids, share_weights) AS expected
        ON expected.member_id = given.member_id
      WHERE expected.amount <> given.amount
    ) THEN
      RAISE EXCEPTION '%', CASE p_split_method WHEN 'percent' THEN 'split_percent_mismatch' ELSE 'split_shares_mismatch' END
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
END;
$$;

-- As in migration 041; share rows now also store their weight.
CREATE OR REPLACE FUNCTION public.commit_expense(
  p_group_id uuid,
  p_description text,
  p_original_amount text,
  p_original_currency text,
  p_split_method text,
  p_payers jsonb,
  p_shares jsonb,
  p_category text DEFAULT NULL,
  p_fx_rate text DEFAULT NULL,
  p_fx_source text DEFAULT NULL,
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

  INSERT INTO public.trip_expense_shares (expense_id, group_id, group_member_id, amount, weight)
  SELECT v_expense_id, p_group_id, line.member_id, line.amount, line.weight
  FROM unnest(v_lines.share_ids, v_lines.share_amounts, v_lines.share_weights) AS line(member_id, amount, weight);

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

CREATE OR REPLACE FUNCTION public.update_expense(
  p_expense_id uuid,
  p_expected_version integer,
  p_description text,
  p_original_amount text,
  p_original_currency text,
  p_split_method text,
  p_payers jsonb,
  p_shares jsonb,
  p_category text DEFAULT NULL,
  p_fx_rate text DEFAULT NULL,
  p_fx_source text DEFAULT NULL
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

  INSERT INTO public.trip_expense_shares (expense_id, group_id, group_member_id, amount, weight)
  SELECT p_expense_id, v_expense.group_id, line.member_id, line.amount, line.weight
  FROM unnest(v_lines.share_ids, v_lines.share_amounts, v_lines.share_weights) AS line(member_id, amount, weight);

  RETURN v_version;
END;
$$;

-- As in migration 040, plus: a percent or shares Expense has a weight on every
-- share (percents totalling 100, shares whole numbers) and its share amounts
-- are exactly the weighted split; equal and exact Expenses carry no weights.
CREATE OR REPLACE FUNCTION trip_private.split_check_expense_balanced()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  v_expense_id uuid;
  v_total numeric;
  v_minor integer;
  v_method text;
  v_payers record;
  v_shares record;
BEGIN
  IF TG_TABLE_NAME = 'trip_expenses' THEN
    v_expense_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
  ELSIF TG_OP = 'DELETE' THEN
    v_expense_id := OLD.expense_id;
  ELSE
    v_expense_id := NEW.expense_id;
  END IF;

  SELECT expense.accounting_amount, trip_private.split_currency_minor_units(expense.accounting_currency),
    expense.split_method
  INTO v_total, v_minor, v_method
  FROM public.trip_expenses AS expense
  WHERE expense.id = v_expense_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT count(*) AS lines, coalesce(sum(payer.amount), 0) AS total,
    count(*) FILTER (WHERE payer.amount <> round(payer.amount, v_minor)) AS imprecise
  INTO v_payers
  FROM public.trip_expense_payers AS payer
  WHERE payer.expense_id = v_expense_id;

  SELECT count(*) AS lines, coalesce(sum(share.amount), 0) AS total,
    count(*) FILTER (WHERE share.amount <> round(share.amount, v_minor)) AS imprecise,
    count(share.weight) AS weighted,
    coalesce(sum(share.weight), 0) AS weight_total,
    count(*) FILTER (WHERE share.weight <> trunc(share.weight)) AS fractional,
    array_agg(share.group_member_id ORDER BY share.group_member_id) AS ids,
    array_agg(share.amount ORDER BY share.group_member_id) AS amounts,
    array_agg(share.weight ORDER BY share.group_member_id) AS weights
  INTO v_shares
  FROM public.trip_expense_shares AS share
  WHERE share.expense_id = v_expense_id;

  IF v_payers.lines = 0 OR v_payers.imprecise > 0 OR v_payers.total <> v_total
    OR v_shares.lines = 0 OR v_shares.imprecise > 0 OR v_shares.total <> v_total THEN
    RAISE EXCEPTION 'split_expense_unbalanced' USING ERRCODE = 'P0001';
  END IF;

  IF v_method NOT IN ('percent', 'shares') THEN
    IF v_shares.weighted > 0 THEN
      RAISE EXCEPTION 'split_expense_inputs_mismatch' USING ERRCODE = 'P0001';
    END IF;
    RETURN NULL;
  END IF;
  IF v_shares.weighted <> v_shares.lines THEN
    RAISE EXCEPTION 'split_expense_inputs_mismatch' USING ERRCODE = 'P0001';
  END IF;
  IF (v_method = 'percent' AND v_shares.weight_total <> 100)
    OR (v_method = 'shares' AND v_shares.fractional > 0) THEN
    RAISE EXCEPTION 'split_expense_inputs_mismatch' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM unnest(v_shares.ids, v_shares.amounts) AS given(member_id, amount)
    JOIN trip_private.split_weighted_amounts(v_total, v_minor, v_shares.ids, v_shares.weights) AS expected
      ON expected.member_id = given.member_id
    WHERE expected.amount <> given.amount
  ) THEN
    RAISE EXCEPTION 'split_expense_inputs_mismatch' USING ERRCODE = 'P0001';
  END IF;
  RETURN NULL;
END;
$$;

-- As in migration 041; each share also reports its weight (null for equal/exact).
CREATE OR REPLACE FUNCTION public.get_split_ledger(p_group_id uuid)
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
          SELECT jsonb_agg(jsonb_build_object('member_id', share.group_member_id, 'amount', share.amount::text,
              'weight', share.weight::text)
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
  trip_private.split_weighted_amounts(numeric, integer, uuid[], numeric[]),
  trip_private.split_parse_weight(jsonb, text),
  trip_private.split_checked_lines(uuid, numeric, text, text, jsonb, jsonb)
FROM PUBLIC, anon, service_role;

GRANT EXECUTE ON FUNCTION
  trip_private.split_weighted_amounts(numeric, integer, uuid[], numeric[]),
  trip_private.split_parse_weight(jsonb, text),
  trip_private.split_checked_lines(uuid, numeric, text, text, jsonb, jsonb)
TO authenticated;

COMMIT;
