-- Split tab ledger: Expenses with normalized payers and shares, and Settlements
-- (ADR-0005). Money is exact `numeric` in the currency's ISO 4217 minor units;
-- nothing is stored as a float. Settlements are bookkeeping only.
BEGIN;

-- ISO 4217 minor units (List One, 2026-01-01). Every code not listed uses 2,
-- including fund and metal codes whose ISO minor unit is "N.A.".
-- Mirrored by src/features/split/money.ts (a unit test keeps them in sync).
CREATE FUNCTION trip_private.split_currency_minor_units(p_code text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT CASE
    WHEN p_code IN ('BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG',
      'RWF', 'UGX', 'UYI', 'VND', 'VUV', 'XAF', 'XOF', 'XPF') THEN 0
    WHEN p_code IN ('BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND') THEN 3
    WHEN p_code IN ('CLF', 'UYW') THEN 4
    ELSE 2
  END;
$$;
REVOKE ALL ON FUNCTION trip_private.split_currency_minor_units(text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION trip_private.split_currency_minor_units(text) TO authenticated;

-- True when the caller is an active member of the Trip and `p_member_id` is an
-- active member of the same Trip. Owned by `postgres` (like current_member_id)
-- so policies can check other people's status without exposing group_members.
CREATE FUNCTION trip_private.split_is_active_member(p_group_id uuid, p_member_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT trip_private.current_member_id(p_group_id) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.group_members AS member
      WHERE member.group_id = p_group_id
        AND member.id = p_member_id
        AND member.status = 'active'
    );
$$;
REVOKE ALL ON FUNCTION trip_private.split_is_active_member(uuid, uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION trip_private.split_is_active_member(uuid, uuid) TO authenticated;

-- True when the caller is an active Owner of the Trip. A SQL-standard body is
-- resolved at creation, so callers need no USAGE on ir007_private.
CREATE FUNCTION trip_private.split_is_owner(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
BEGIN ATOMIC
  SELECT p_group_id IN (SELECT ir007_private.current_active_owner_group_ids());
END;
REVOKE ALL ON FUNCTION trip_private.split_is_owner(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION trip_private.split_is_owner(uuid) TO authenticated;

CREATE TABLE public.trip_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE RESTRICT,
  description text NOT NULL CHECK (btrim(description) <> '' AND char_length(description) <= 120),
  category text CHECK (category IN ('food', 'transport', 'stay', 'activity', 'shopping', 'other')),
  original_amount numeric NOT NULL CHECK (original_amount > 0 AND original_amount < 1000000000000),
  original_currency text NOT NULL REFERENCES public.iso_4217_currency_codes(code) ON DELETE RESTRICT,
  accounting_amount numeric NOT NULL CHECK (accounting_amount > 0 AND accounting_amount < 1000000000000),
  accounting_currency text NOT NULL REFERENCES public.iso_4217_currency_codes(code) ON DELETE RESTRICT,
  -- FX snapshot: 1 original unit = fx_rate accounting units, captured once.
  fx_rate numeric CHECK (fx_rate > 0 AND fx_rate = round(fx_rate, 12)),
  fx_source text CHECK (fx_source IN ('manual', 'open.er-api.com')),
  fx_captured_at timestamptz,
  split_method text NOT NULL CHECK (split_method IN ('equal', 'exact')),
  created_by uuid NOT NULL,
  request_id uuid,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, id),
  UNIQUE (group_id, request_id),
  CONSTRAINT trip_expenses_creator_same_group FOREIGN KEY (group_id, created_by)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT,
  CONSTRAINT trip_expenses_original_minor_units CHECK (
    original_amount = round(original_amount, trip_private.split_currency_minor_units(original_currency))),
  CONSTRAINT trip_expenses_accounting_minor_units CHECK (
    accounting_amount = round(accounting_amount, trip_private.split_currency_minor_units(accounting_currency))),
  -- Same currency: no snapshot and equal amounts. Different currency: a full
  -- snapshot, and the accounting amount reproduces from it (round half away from zero).
  CONSTRAINT trip_expenses_fx_snapshot CHECK (
    CASE WHEN original_currency = accounting_currency
      THEN fx_rate IS NULL AND fx_source IS NULL AND fx_captured_at IS NULL
        AND accounting_amount = original_amount
      ELSE fx_rate IS NOT NULL AND fx_source IS NOT NULL AND fx_captured_at IS NOT NULL
        AND accounting_amount = round(original_amount * fx_rate,
          trip_private.split_currency_minor_units(accounting_currency))
    END)
);
CREATE INDEX trip_expenses_group_created_idx ON public.trip_expenses (group_id, created_at);

-- Payer contributions and final shares, in the Expense's accounting currency.
-- Composite keys keep every row in the same Trip as its Expense and its person.
CREATE TABLE public.trip_expense_payers (
  expense_id uuid NOT NULL,
  group_id uuid NOT NULL,
  group_member_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  PRIMARY KEY (expense_id, group_member_id),
  CONSTRAINT trip_expense_payers_expense_same_group FOREIGN KEY (group_id, expense_id)
    REFERENCES public.trip_expenses(group_id, id) ON DELETE CASCADE,
  CONSTRAINT trip_expense_payers_member_same_group FOREIGN KEY (group_id, group_member_id)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT
);
CREATE INDEX trip_expense_payers_group_idx ON public.trip_expense_payers (group_id);

CREATE TABLE public.trip_expense_shares (
  expense_id uuid NOT NULL,
  group_id uuid NOT NULL,
  group_member_id uuid NOT NULL,
  -- Zero is allowed: an equal split of 0.01 among three gives 0.01, 0.00, 0.00.
  amount numeric NOT NULL CHECK (amount >= 0),
  PRIMARY KEY (expense_id, group_member_id),
  CONSTRAINT trip_expense_shares_expense_same_group FOREIGN KEY (group_id, expense_id)
    REFERENCES public.trip_expenses(group_id, id) ON DELETE CASCADE,
  CONSTRAINT trip_expense_shares_member_same_group FOREIGN KEY (group_id, group_member_id)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT
);
CREATE INDEX trip_expense_shares_group_idx ON public.trip_expense_shares (group_id);

-- A Settlement records that `from_member` paid `to_member` outside the app.
CREATE TABLE public.trip_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE RESTRICT,
  from_member uuid NOT NULL,
  to_member uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0 AND amount < 1000000000000),
  currency text NOT NULL REFERENCES public.iso_4217_currency_codes(code) ON DELETE RESTRICT,
  note text CHECK (note IS NULL OR (btrim(note) <> '' AND char_length(note) <= 200)),
  recorded_by uuid NOT NULL,
  request_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, id),
  UNIQUE (group_id, request_id),
  CONSTRAINT trip_settlements_distinct_people CHECK (from_member <> to_member),
  CONSTRAINT trip_settlements_minor_units CHECK (
    amount = round(amount, trip_private.split_currency_minor_units(currency))),
  CONSTRAINT trip_settlements_from_same_group FOREIGN KEY (group_id, from_member)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT,
  CONSTRAINT trip_settlements_to_same_group FOREIGN KEY (group_id, to_member)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT,
  CONSTRAINT trip_settlements_recorder_same_group FOREIGN KEY (group_id, recorded_by)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT
);
CREATE INDEX trip_settlements_group_created_idx ON public.trip_settlements (group_id, created_at);

-- Server-owned fields: the FX capture time is stamped here and kept verbatim
-- while the snapshot is unchanged; every update bumps `version`.
CREATE FUNCTION trip_private.split_expense_before_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.version := OLD.version + 1;
    NEW.created_at := OLD.created_at;
    NEW.updated_at := now();
  END IF;
  IF NEW.fx_rate IS NULL THEN
    NEW.fx_captured_at := NULL;
  ELSIF TG_OP = 'UPDATE' AND NEW.fx_rate = OLD.fx_rate
    AND NEW.fx_source IS NOT DISTINCT FROM OLD.fx_source
    AND NEW.original_currency = OLD.original_currency THEN
    NEW.fx_captured_at := OLD.fx_captured_at;
  ELSE
    NEW.fx_captured_at := now();
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION trip_private.split_expense_before_write() FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER trip_expenses_before_write
  BEFORE INSERT OR UPDATE ON public.trip_expenses
  FOR EACH ROW EXECUTE FUNCTION trip_private.split_expense_before_write();

-- Checked at COMMIT for every touched Expense, whichever path wrote it: payers
-- and shares each exist, use the accounting currency's minor units, and sum
-- exactly to the accounting amount. A deleted Expense (children cascade) passes.
CREATE FUNCTION trip_private.split_check_expense_balanced()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  v_expense_id uuid;
  v_total numeric;
  v_minor integer;
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

  SELECT expense.accounting_amount, trip_private.split_currency_minor_units(expense.accounting_currency)
  INTO v_total, v_minor
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
    count(*) FILTER (WHERE share.amount <> round(share.amount, v_minor)) AS imprecise
  INTO v_shares
  FROM public.trip_expense_shares AS share
  WHERE share.expense_id = v_expense_id;

  IF v_payers.lines = 0 OR v_payers.imprecise > 0 OR v_payers.total <> v_total
    OR v_shares.lines = 0 OR v_shares.imprecise > 0 OR v_shares.total <> v_total THEN
    RAISE EXCEPTION 'split_expense_unbalanced' USING ERRCODE = 'P0001';
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION trip_private.split_check_expense_balanced() FROM PUBLIC, anon, authenticated, service_role;

CREATE CONSTRAINT TRIGGER trip_expenses_balanced
  AFTER INSERT OR UPDATE ON public.trip_expenses
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION trip_private.split_check_expense_balanced();
CREATE CONSTRAINT TRIGGER trip_expense_payers_balanced
  AFTER INSERT OR UPDATE OR DELETE ON public.trip_expense_payers
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION trip_private.split_check_expense_balanced();
CREATE CONSTRAINT TRIGGER trip_expense_shares_balanced
  AFTER INSERT OR UPDATE OR DELETE ON public.trip_expense_shares
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION trip_private.split_check_expense_balanced();

ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expenses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expense_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expense_payers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expense_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expense_shares FORCE ROW LEVEL SECURITY;
ALTER TABLE public.trip_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_settlements FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.trip_expenses, public.trip_expense_payers, public.trip_expense_shares,
  public.trip_settlements FROM PUBLIC, anon, authenticated, service_role;

-- Writes go through the RPCs in migration 041, which run as the caller. The
-- grants below are what those RPCs need; policies and the COMMIT-time balance
-- check hold whichever path is used. group_id, created_by, accounting_currency
-- and request_id are fixed after insert.
GRANT SELECT, DELETE ON TABLE public.trip_expenses TO authenticated;
GRANT INSERT (group_id, description, category, original_amount, original_currency, accounting_amount,
  accounting_currency, fx_rate, fx_source, split_method, created_by, request_id)
  ON TABLE public.trip_expenses TO authenticated;
GRANT UPDATE (description, category, original_amount, original_currency, accounting_amount,
  fx_rate, fx_source, split_method)
  ON TABLE public.trip_expenses TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.trip_expense_payers, public.trip_expense_shares TO authenticated;
GRANT SELECT, DELETE ON TABLE public.trip_settlements TO authenticated;
GRANT INSERT (group_id, from_member, to_member, amount, currency, note, recorded_by, request_id)
  ON TABLE public.trip_settlements TO authenticated;

-- Active members of a Trip read its whole ledger; nobody else reads anything.
CREATE POLICY trip_expenses_select_member ON public.trip_expenses
  FOR SELECT TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()));

CREATE POLICY trip_expenses_insert_member ON public.trip_expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND created_by = trip_private.current_member_id(group_id)
    AND accounting_currency = (
      SELECT config.accounting_currency FROM public.group_configurations AS config
      WHERE config.group_id = trip_expenses.group_id)
  );

-- Only the creator or a Trip Owner may change or delete an Expense.
CREATE POLICY trip_expenses_update_editor ON public.trip_expenses
  FOR UPDATE TO authenticated
  USING (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND (created_by = trip_private.current_member_id(group_id)
      OR group_id IN (SELECT ir007_private.current_active_owner_group_ids()))
  )
  WITH CHECK (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND (created_by = trip_private.current_member_id(group_id)
      OR group_id IN (SELECT ir007_private.current_active_owner_group_ids()))
  );

CREATE POLICY trip_expenses_delete_editor ON public.trip_expenses
  FOR DELETE TO authenticated
  USING (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND (created_by = trip_private.current_member_id(group_id)
      OR group_id IN (SELECT ir007_private.current_active_owner_group_ids()))
  );

CREATE POLICY trip_expense_payers_select_member ON public.trip_expense_payers
  FOR SELECT TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()));

CREATE POLICY trip_expense_payers_insert_editor ON public.trip_expense_payers
  FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND trip_private.split_is_active_member(group_id, group_member_id)
    AND EXISTS (
      SELECT 1 FROM public.trip_expenses AS expense
      WHERE expense.id = trip_expense_payers.expense_id
        AND expense.group_id = trip_expense_payers.group_id
        AND (expense.created_by = trip_private.current_member_id(expense.group_id)
          OR expense.group_id IN (SELECT ir007_private.current_active_owner_group_ids())))
  );

CREATE POLICY trip_expense_payers_delete_editor ON public.trip_expense_payers
  FOR DELETE TO authenticated
  USING (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND EXISTS (
      SELECT 1 FROM public.trip_expenses AS expense
      WHERE expense.id = trip_expense_payers.expense_id
        AND (expense.created_by = trip_private.current_member_id(expense.group_id)
          OR expense.group_id IN (SELECT ir007_private.current_active_owner_group_ids())))
  );

CREATE POLICY trip_expense_shares_select_member ON public.trip_expense_shares
  FOR SELECT TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()));

CREATE POLICY trip_expense_shares_insert_editor ON public.trip_expense_shares
  FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND trip_private.split_is_active_member(group_id, group_member_id)
    AND EXISTS (
      SELECT 1 FROM public.trip_expenses AS expense
      WHERE expense.id = trip_expense_shares.expense_id
        AND expense.group_id = trip_expense_shares.group_id
        AND (expense.created_by = trip_private.current_member_id(expense.group_id)
          OR expense.group_id IN (SELECT ir007_private.current_active_owner_group_ids())))
  );

CREATE POLICY trip_expense_shares_delete_editor ON public.trip_expense_shares
  FOR DELETE TO authenticated
  USING (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND EXISTS (
      SELECT 1 FROM public.trip_expenses AS expense
      WHERE expense.id = trip_expense_shares.expense_id
        AND (expense.created_by = trip_private.current_member_id(expense.group_id)
          OR expense.group_id IN (SELECT ir007_private.current_active_owner_group_ids())))
  );

CREATE POLICY trip_settlements_select_member ON public.trip_settlements
  FOR SELECT TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()));

-- The recorder is the caller and is one of the two people, unless an Owner
-- records it for others. Both people are active members of the Trip.
CREATE POLICY trip_settlements_insert_member ON public.trip_settlements
  FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND recorded_by = trip_private.current_member_id(group_id)
    AND (recorded_by IN (from_member, to_member)
      OR group_id IN (SELECT ir007_private.current_active_owner_group_ids()))
    AND trip_private.split_is_active_member(group_id, from_member)
    AND trip_private.split_is_active_member(group_id, to_member)
    AND currency = (
      SELECT config.accounting_currency FROM public.group_configurations AS config
      WHERE config.group_id = trip_settlements.group_id)
  );

CREATE POLICY trip_settlements_delete_recorder ON public.trip_settlements
  FOR DELETE TO authenticated
  USING (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND (recorded_by = trip_private.current_member_id(group_id)
      OR group_id IN (SELECT ir007_private.current_active_owner_group_ids()))
  );

-- Realtime delivers INSERT/UPDATE only for rows the subscriber can SELECT.
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_expenses, public.trip_expense_payers,
  public.trip_expense_shares, public.trip_settlements;

COMMIT;
