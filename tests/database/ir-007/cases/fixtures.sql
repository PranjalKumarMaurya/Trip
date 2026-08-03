-- IR-007 Lane B current-schema adversarial fixture.
-- Apply only to a fresh, isolated database after migrations 001 through 009.
-- Every identifier is stable so the matrix can exercise authorization by identity,
-- never by display-name equality.

BEGIN;

INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES
  ('00000000-0000-4000-8000-000000007101', 'authenticated', 'authenticated', 'ir007-owner-a@example.test', 'not-a-credential', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Owner A"}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000007102', 'authenticated', 'authenticated', 'ir007-member-a@example.test', 'not-a-credential', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Member A"}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000007103', 'authenticated', 'authenticated', 'ir007-owner-b@example.test', 'not-a-credential', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Owner B"}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000007104', 'authenticated', 'authenticated', 'ir007-inactive@example.test', 'not-a-credential', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Inactive Member"}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000007105', 'authenticated', 'authenticated', 'ir007-archived@example.test', 'not-a-credential', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Archived Member"}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000007106', 'authenticated', 'authenticated', 'ir007-no-membership@example.test', 'not-a-credential', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"No Membership"}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000007107', 'authenticated', 'authenticated', 'ir007-no-profile@example.test', 'not-a-credential', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"No Profile"}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000007108', 'authenticated', 'authenticated', 'ir007-duplicate-one@example.test', 'not-a-credential', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Duplicate Display"}'::jsonb, now(), now()),
  ('00000000-0000-4000-8000-000000007109', 'authenticated', 'authenticated', 'ir007-duplicate-two@example.test', 'not-a-credential', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Duplicate Display"}'::jsonb, now(), now());

-- The Auth trigger creates linked Profiles. Replace their generated IDs with
-- fixture IDs before any membership rows reference them.
UPDATE public.profiles
SET
  id = CASE auth_user_id
    WHEN '00000000-0000-4000-8000-000000007101'::uuid THEN '00000000-0000-4000-8000-000000007201'::uuid
    WHEN '00000000-0000-4000-8000-000000007102'::uuid THEN '00000000-0000-4000-8000-000000007202'::uuid
    WHEN '00000000-0000-4000-8000-000000007103'::uuid THEN '00000000-0000-4000-8000-000000007203'::uuid
    WHEN '00000000-0000-4000-8000-000000007104'::uuid THEN '00000000-0000-4000-8000-000000007204'::uuid
    WHEN '00000000-0000-4000-8000-000000007105'::uuid THEN '00000000-0000-4000-8000-000000007205'::uuid
    WHEN '00000000-0000-4000-8000-000000007106'::uuid THEN '00000000-0000-4000-8000-000000007206'::uuid
    WHEN '00000000-0000-4000-8000-000000007108'::uuid THEN '00000000-0000-4000-8000-000000007208'::uuid
    WHEN '00000000-0000-4000-8000-000000007109'::uuid THEN '00000000-0000-4000-8000-000000007209'::uuid
  END,
  display_name = CASE auth_user_id
    WHEN '00000000-0000-4000-8000-000000007101'::uuid THEN 'Owner A'
    WHEN '00000000-0000-4000-8000-000000007102'::uuid THEN 'Member A'
    WHEN '00000000-0000-4000-8000-000000007103'::uuid THEN 'Owner B'
    WHEN '00000000-0000-4000-8000-000000007104'::uuid THEN 'Inactive Member'
    WHEN '00000000-0000-4000-8000-000000007105'::uuid THEN 'Archived Member'
    WHEN '00000000-0000-4000-8000-000000007106'::uuid THEN 'No Membership'
    WHEN '00000000-0000-4000-8000-000000007108'::uuid THEN 'Duplicate Display'
    WHEN '00000000-0000-4000-8000-000000007109'::uuid THEN 'Duplicate Display'
  END
WHERE auth_user_id IN (
  '00000000-0000-4000-8000-000000007101'::uuid,
  '00000000-0000-4000-8000-000000007102'::uuid,
  '00000000-0000-4000-8000-000000007103'::uuid,
  '00000000-0000-4000-8000-000000007104'::uuid,
  '00000000-0000-4000-8000-000000007105'::uuid,
  '00000000-0000-4000-8000-000000007106'::uuid,
  '00000000-0000-4000-8000-000000007108'::uuid,
  '00000000-0000-4000-8000-000000007109'::uuid
);

-- This account remains a real Auth User, but has no linked Profile.
DELETE FROM public.profiles
WHERE auth_user_id = '00000000-0000-4000-8000-000000007107'::uuid;

INSERT INTO public.groups (id, archived_at) VALUES
  ('00000000-0000-4000-8000-000000007301', NULL),
  ('00000000-0000-4000-8000-000000007302', NULL),
  ('00000000-0000-4000-8000-000000007303', now());

INSERT INTO public.group_configurations (
  group_id,
  trip_name,
  destination,
  start_date,
  end_date,
  timezone,
  accounting_currency
) VALUES
  ('00000000-0000-4000-8000-000000007301', 'IR-007 Group A', 'Denpasar', DATE '2030-05-01', DATE '2030-05-10', 'Asia/Makassar', 'IDR'),
  ('00000000-0000-4000-8000-000000007302', 'IR-007 Group B', 'Ubud', DATE '2030-06-01', DATE '2030-06-10', 'Asia/Makassar', 'IDR'),
  ('00000000-0000-4000-8000-000000007303', 'IR-007 Archived Group', 'Canggu', DATE '2030-07-01', DATE '2030-07-10', 'Asia/Makassar', 'IDR');

INSERT INTO public.group_members (id, group_id, profile_id, role, status) VALUES
  ('00000000-0000-4000-8000-000000007401', '00000000-0000-4000-8000-000000007301', '00000000-0000-4000-8000-000000007201', 'owner', 'active'),
  ('00000000-0000-4000-8000-000000007402', '00000000-0000-4000-8000-000000007301', '00000000-0000-4000-8000-000000007202', 'member', 'active'),
  ('00000000-0000-4000-8000-000000007403', '00000000-0000-4000-8000-000000007301', '00000000-0000-4000-8000-000000007208', 'member', 'active'),
  ('00000000-0000-4000-8000-000000007404', '00000000-0000-4000-8000-000000007301', '00000000-0000-4000-8000-000000007209', 'member', 'active'),
  ('00000000-0000-4000-8000-000000007405', '00000000-0000-4000-8000-000000007302', '00000000-0000-4000-8000-000000007203', 'owner', 'active'),
  ('00000000-0000-4000-8000-000000007406', '00000000-0000-4000-8000-000000007301', '00000000-0000-4000-8000-000000007204', 'member', 'inactive'),
  ('00000000-0000-4000-8000-000000007407', '00000000-0000-4000-8000-000000007303', '00000000-0000-4000-8000-000000007205', 'owner', 'active');

INSERT INTO public.group_audit_events (
  id,
  group_id,
  actor_group_member_id,
  event_type,
  request_id,
  details,
  occurred_at
) VALUES
  ('00000000-0000-4000-8000-000000007501', '00000000-0000-4000-8000-000000007301', '00000000-0000-4000-8000-000000007401', 'group_bootstrapped', '00000000-0000-4000-8000-000000007601', '{"fixture":"ir-007"}'::jsonb, TIMESTAMPTZ '2030-01-01 00:00:00+00'),
  ('00000000-0000-4000-8000-000000007502', '00000000-0000-4000-8000-000000007301', '00000000-0000-4000-8000-000000007402', 'membership_lifecycle', '00000000-0000-4000-8000-000000007602', '{"fixture":"ir-007"}'::jsonb, TIMESTAMPTZ '2030-01-02 00:00:00+00');

-- These rows prove that a retired permissive policy would disclose real data.
INSERT INTO public.events (id, type, title, date_ist, for_users, created_by) VALUES
  ('00000000-0000-4000-8000-000000007701', 'activity', 'IR-007 legacy event', TIMESTAMPTZ '2030-05-01 12:00:00+00', ARRAY['IR-007 Fixture'], 'IR-007 Fixture');

INSERT INTO public.expenses (id, event_id, description, amount, currency, paid_by, split_among) VALUES
  ('00000000-0000-4000-8000-000000007702', '00000000-0000-4000-8000-000000007701', 'IR-007 legacy expense', 1.00, 'IDR', 'IR-007 Fixture', ARRAY['IR-007 Fixture']);

INSERT INTO public.settlements (id, from_user, to_user, amount, currency, recorded_by) VALUES
  ('00000000-0000-4000-8000-000000007703', 'IR-007 Fixture', 'IR-007 Fixture', 1.00, 'IDR', 'IR-007 Fixture');

INSERT INTO public.exchange_rates (id, from_currency, to_currency, rate) VALUES
  ('00000000-0000-4000-8000-000000007704', 'USD', 'IDR', 1.000000);

INSERT INTO public.todos (id, user_name, text) VALUES
  ('00000000-0000-4000-8000-000000007705', 'IR-007 Fixture', 'IR-007 legacy todo');

COMMIT;
