-- IR-002 DBM-002: configuration, archive, and audit foundation.
-- IANA validation source: pg_catalog.pg_timezone_names in the local Supabase
-- PostgreSQL image selected by Supabase CLI 2.105.0; no network is used here.
-- ISO 4217 source: ISO 4217 Maintenance Agency List One, publication 2026-01-01,
-- retrieved 2026-08-01 from
-- https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml
-- XML SHA-256: 838dfb991648cf36df939edd5fe3811737962b75a32252847d239cedd1e291c9
-- Canonical sorted code-set SHA-256: 6bd74ecf83510ca425c07b1cef1117f9f5a7d76c3e5079365feb841ababa3466

CREATE FUNCTION public.is_valid_iana_timezone(candidate TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT candidate ~ '^[A-Za-z][A-Za-z0-9_+\-]*(?:/[A-Za-z0-9_+\-]+)+$'
    AND EXISTS (
      SELECT 1
      FROM pg_catalog.pg_timezone_names
      WHERE name = candidate
    );
$$;

CREATE TABLE public.iso_4217_currency_codes (
  code TEXT PRIMARY KEY CHECK (code ~ '^[A-Z]{3}$')
);

INSERT INTO public.iso_4217_currency_codes (code) VALUES
  ('AED'), ('AFN'), ('ALL'), ('AMD'), ('AOA'), ('ARS'), ('AUD'), ('AWG'),
  ('AZN'), ('BAM'), ('BBD'), ('BDT'), ('BHD'), ('BIF'), ('BMD'), ('BND'),
  ('BOB'), ('BOV'), ('BRL'), ('BSD'), ('BTN'), ('BWP'), ('BYN'), ('BZD'),
  ('CAD'), ('CDF'), ('CHE'), ('CHF'), ('CHW'), ('CLF'), ('CLP'), ('CNY'),
  ('COP'), ('COU'), ('CRC'), ('CUP'), ('CVE'), ('CZK'), ('DJF'), ('DKK'),
  ('DOP'), ('DZD'), ('EGP'), ('ERN'), ('ETB'), ('EUR'), ('FJD'), ('FKP'),
  ('GBP'), ('GEL'), ('GHS'), ('GIP'), ('GMD'), ('GNF'), ('GTQ'), ('GYD'),
  ('HKD'), ('HNL'), ('HTG'), ('HUF'), ('IDR'), ('ILS'), ('INR'), ('IQD'),
  ('IRR'), ('ISK'), ('JMD'), ('JOD'), ('JPY'), ('KES'), ('KGS'), ('KHR'),
  ('KMF'), ('KPW'), ('KRW'), ('KWD'), ('KYD'), ('KZT'), ('LAK'), ('LBP'),
  ('LKR'), ('LRD'), ('LSL'), ('LYD'), ('MAD'), ('MDL'), ('MGA'), ('MKD'),
  ('MMK'), ('MNT'), ('MOP'), ('MRU'), ('MUR'), ('MVR'), ('MWK'), ('MXN'),
  ('MXV'), ('MYR'), ('MZN'), ('NAD'), ('NGN'), ('NIO'), ('NOK'), ('NPR'),
  ('NZD'), ('OMR'), ('PAB'), ('PEN'), ('PGK'), ('PHP'), ('PKR'), ('PLN'),
  ('PYG'), ('QAR'), ('RON'), ('RSD'), ('RUB'), ('RWF'), ('SAR'), ('SBD'),
  ('SCR'), ('SDG'), ('SEK'), ('SGD'), ('SHP'), ('SLE'), ('SOS'), ('SRD'),
  ('SSP'), ('STN'), ('SVC'), ('SYP'), ('SZL'), ('THB'), ('TJS'), ('TMT'),
  ('TND'), ('TOP'), ('TRY'), ('TTD'), ('TWD'), ('TZS'), ('UAH'), ('UGX'),
  ('USD'), ('USN'), ('UYI'), ('UYU'), ('UYW'), ('UZS'), ('VED'), ('VES'),
  ('VND'), ('VUV'), ('WST'), ('XAD'), ('XAF'), ('XAG'), ('XAU'), ('XBA'),
  ('XBB'), ('XBC'), ('XBD'), ('XCD'), ('XCG'), ('XDR'), ('XOF'), ('XPD'),
  ('XPF'), ('XPT'), ('XSU'), ('XTS'), ('XUA'), ('XXX'), ('YER'), ('ZAR'),
  ('ZMW'), ('ZWG');

ALTER TABLE public.groups
  ADD COLUMN archived_at TIMESTAMPTZ,
  ADD CONSTRAINT groups_archived_at_after_created_at
    CHECK (archived_at IS NULL OR archived_at >= created_at);

CREATE INDEX groups_archived_at_idx
  ON public.groups (archived_at)
  WHERE archived_at IS NOT NULL;

CREATE TABLE public.group_configurations (
  group_id UUID PRIMARY KEY REFERENCES public.groups(id) ON DELETE RESTRICT,
  trip_name TEXT NOT NULL CHECK (btrim(trip_name) <> ''),
  destination TEXT NOT NULL CHECK (btrim(destination) <> ''),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  timezone TEXT NOT NULL CHECK (public.is_valid_iana_timezone(timezone)),
  accounting_currency TEXT NOT NULL
    REFERENCES public.iso_4217_currency_codes(code) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT group_configurations_date_order CHECK (end_date >= start_date)
);

CREATE TRIGGER group_configurations_ir002_set_updated_at
  BEFORE UPDATE ON public.group_configurations
  FOR EACH ROW EXECUTE FUNCTION public.ir002_set_updated_at();

CREATE TABLE public.group_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  actor_group_member_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('group_bootstrapped', 'membership_lifecycle')
  ),
  request_id UUID NOT NULL UNIQUE,
  details JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object'),
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE RESTRICT,
  FOREIGN KEY (group_id, actor_group_member_id)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT
);

CREATE INDEX group_audit_events_group_occurred_at_idx
  ON public.group_audit_events (group_id, occurred_at);
