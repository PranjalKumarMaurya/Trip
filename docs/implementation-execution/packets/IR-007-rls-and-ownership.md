# IR-007 — RLS and ownership

## Status and authority

- Status: **Authorised — implementation not started**.
- Wave: W2; serial predecessor of IR-008.
- Authorisation: `../authorisations/IR-007-authorisation.md` is the sole
  executable scope, database-object, evidence, rollback, and parallel-ownership
  contract.
- Entry: IR-002, IR-004, DBM-001–003, GATE-012, and the clean repository are
  verified. GATE-013 remains Not satisfied and W2 remains In progress.

## Objective

Make the current Profile/Group schema fail closed for browser roles, establish
the minimum active-member/Owner read boundary, and retire every permissive
legacy product-table policy. IR-007 does not establish tenant-aware product
access, a release-security state, or W2 exit.

## Sole physical ownership

DBM-006 exclusively owns
`supabase/migrations/009_ir007_base_rls_ownership.sql`. It adds only the
frozen RLS, private predicates, public roster/audit projections, grants,
revokes, and supporting indexes in the authorisation. It does not add a
`group_id` or target ownership field to any legacy product table.

IR-007 owns current-schema deny-by-default handling for `profiles`, `groups`,
`group_configurations`, `group_members`, `group_audit_events`, legacy `users`,
and `iso_4217_currency_codes`; it retires the permissive policies on `events`,
`expenses`, `settlements`, `exchange_rates`, and `todos` and leaves them
browser fail closed.

## Current boundary and deferrals

An active membership permits only the frozen Group/configuration reads and
approved projections. `inactive` denies authority; future removal is represented
by no active relationship or an inactive state. IR-007 does not add a `removed`
status or any membership provenance/transition.

Future target Events/Todos, normalized finance, Settlements target ownership,
Documents, private Storage, Realtime, Invitations, bootstrap, lifecycle, and
trusted operations are reusable later-packet requirements only. They are not
IR-007 implementation or verification criteria.

The public `tickets` Storage bucket is a known eventual-release risk. IR-009
owns private Storage; IR-007 does not modify or verify Storage security
completion. That risk does not prevent IR-007 verification, but IR-007 alone
cannot close W2 or a release-security gate.

## Security and performance contract

IR-007 verifies the frozen current-schema Profile, membership, Group,
configuration, roster, audit, forged-ID, legacy-policy, secret-boundary, and
recursion matrix in its authorisation. Future-target cases are excluded from
its pass/fail count. The isolated performance fixture is 200 Groups, 20 active
members per Group, inactive memberships, archived Groups, and 20,000 audit
rows; the actor belongs only to Group A. It retains a cold run, five warmed
runs, and JSON explain evidence against the frozen p95/plan limits.

## Evidence and rollback

The implementation order is Lane A migration, Lane B adversarial cases, Lane C
harness, Lane D static checks/aliases, integration, two generated-type passes,
immutable evidence retention, final integration checks, then independent
verification. Only Lane C may start or stop Docker/Supabase. IR-001, IR-002,
and IR-004 harnesses and evidence remain untouched.

Empty-target rollback must never recreate a permissive policy. A populated-
target problem remains fail closed and is corrected only by a forward migration.

## Exit and downstream boundary

IR-007 becomes Verified only after its frozen local security, performance,
type, rollback/reapplication, cleanup, immutable-evidence, and independent-
verification contract passes. It then supplies the RLS/two-Group input to
GATE-013 and IR-008. It does not satisfy GATE-013 without IR-008's separate
service-role/trusted-operation evidence and does not authorise IR-003,
deployment, or cutover.
