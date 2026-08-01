# IR-007 Authorisation — Base Ownership RLS

## Decision and bounded entry

- Decision: **Authorised — implementation not started**.
- Authorisation date: 2026-08-02.
- Required entry: branch `v2`, clean worktree, and IR-004/DBM-003 verified at
  `a52f29b24229ba5e8cd72cc234afbb7bec8bb80f` or an authorised descendant.
- GATE-013 remains **Not satisfied**. This authorisation enables the bounded
  IR-007 implementation only; it is not a W2 exit decision and does not
  authorise IR-008, IR-003, deployment, or cutover.

The completed IR-007 inspection candidate, IR-007 Security and Performance
Verification Contract, and four-agent execution-design files are not present
in this repository. Their complete frozen decisions are therefore recorded in
this authorisation from the accepted repository state and this authorisation
decision; no absent source is invented as a repository fact.

## Objective and stop rule

IR-007 makes the current Group/Profile schema fail closed for browser roles,
adds only the minimum current-schema RLS/read projections, and retires the
legacy product-table permissive policies. It does not convert legacy product
records into Group-owned records and does not establish a releasable W2 or
release-security state.

Stop and return to change control for a need to alter a legacy product table,
add a Group/ownership field to it, write tenant-aware product access, alter
Storage, Realtime, Invitations, lifecycle, bootstrap, trusted operations,
remote/production resources, dependencies, design, or any path outside this
allow-list. A performance failure is corrected only by the frozen index or
predicate design; it never weakens a policy.

## Scope

### Sole migration and database unit

Reserve exactly `supabase/migrations/009_ir007_base_rls_ownership.sql`.
`DBM-006` is the sole IR-007 database unit. No other migration filename or
database unit is authorised.

### Current-schema implementation scope

IR-007 owns only the following current-schema work:

- deny-by-default RLS for `profiles`, `groups`, `group_configurations`,
  `group_members`, `group_audit_events`, legacy `users`, and
  `iso_4217_currency_codes`;
- retirement of every permissive policy on `events`, `expenses`,
  `settlements`, `exchange_rates`, and `todos`, followed by fail-closed
  browser access to those legacy product tables;
- active-membership and active-Owner predicate helpers; own-Profile
  presentation update; minimum Group roster projection; minimum Owner audit
  projection; supporting indexes; grants/revokes; and local security and
  performance evidence.

IR-007 must not add `group_id`, target ownership, or other tenant fields to
legacy product tables. It must not implement tenant-aware Events, Todos,
finance, Settlements, or Documents access.

### Explicit deferrals and Storage boundary

The future-target security cases for target Events/Todos, normalized finance,
the Settlements target model, Documents, private Storage, Realtime,
Invitations, Group bootstrap, membership lifecycle, and trusted operations are
reusable requirements for their owning later packets only. They are neither
IR-007 implementation work nor IR-007 verification exit criteria.

The public `tickets` Storage bucket is a known eventual-release risk. IR-009
alone owns private Storage. IR-007 neither modifies nor verifies Storage
security completion; the public bucket does not prevent IR-007 itself from
being Verified. IR-007 alone cannot satisfy W2 completion or any
release-security gate.

For this packet, `group_members.status = 'inactive'` denies authority. A
future removed membership is represented for security purposes by absence of
an active relationship or an inactive state. IR-007 must not add a `removed`
status; removal provenance and transitions remain IR-005/IR-008 work.

## Frozen database object contract

### Private predicate schema and helpers

Create the private schema exactly as `ir007_private`. The following are the
only IR-007 private helpers:

| Exact signature | Contract |
|---|---|
| `ir007_private.current_profile_id() RETURNS uuid` | Resolves only `auth.uid()` to the linked `public.profiles.id`, or `NULL`; it accepts no caller-supplied actor. |
| `ir007_private.current_active_group_ids() RETURNS SETOF uuid` | Returns only unarchived Groups for which the current Profile has an active membership. |
| `ir007_private.current_active_owner_group_ids() RETURNS SETOF uuid` | Returns only unarchived Groups for which the current Profile has an active `owner` membership. |

Each helper is `LANGUAGE sql`, `STABLE`, `SECURITY DEFINER`, and `SET
search_path = pg_catalog`; it uses fully qualified objects, no dynamic SQL,
and no caller-supplied identity. `SECURITY DEFINER` is permitted only for these
predicate helpers and the two approved public projections below, because it is
needed to avoid recursive RLS or to expose a deliberately narrow projection.

Revoke schema access on `ir007_private` from `PUBLIC`, `anon`, and
`authenticated`. Revoke all helper execution from `PUBLIC` and `anon`; grant
only the minimum `authenticated` execution needed for policy evaluation while
withholding `USAGE` on `ir007_private`, so raw browser/anon helper execution is
not available. No helper is exposed through PostgREST.

### Approved public projections

The only IR-007 public data projections are:

```text
public.get_group_roster(p_group_id uuid, p_limit integer DEFAULT 100)
RETURNS TABLE (
  participant_id uuid,
  group_id uuid,
  display_name text,
  role text,
  status text
)

public.get_group_audit_summary(p_group_id uuid, p_limit integer DEFAULT 100)
RETURNS TABLE (
  audit_event_id uuid,
  group_id uuid,
  actor_participant_id uuid,
  event_type text,
  occurred_at timestamptz
)
```

Both functions are `LANGUAGE sql`, `STABLE`, `SECURITY DEFINER`, and `SET
search_path = pg_catalog`; they use fully qualified objects, static SQL, and
clamp `p_limit` to `1..100`. `get_group_roster` requires the caller's active
same-Group relationship and returns only the five listed roster fields. It
never exposes `auth_user_id`, Auth metadata, email, credentials, Profile IDs,
or another Group's records. `get_group_audit_summary` requires active same-
Group Owner authority and returns only the five listed summary fields; it never
returns `details`, `request_id`, email, credentials, or other sensitive data.

Revoke execution on both projections from `PUBLIC` and `anon`; grant execution
only to `authenticated`. Do not grant browser roles direct access to
`group_members` or `group_audit_events` for equivalent raw data.

### Exact policies, policy retirement, triggers, indexes, and grants

The migration must enable and force RLS on every table in this packet's scope.
Its exact policy inventory is:

| Table | Exact policy name and permitted action |
|---|---|
| `public.profiles` | Retain/recreate `profiles_select_own_linked_profile` for own linked-profile SELECT; create `profiles_update_own_presentation` for own presentation UPDATE only. |
| `public.groups` | Create `groups_select_active_member` for active-membership, unarchived SELECT only. |
| `public.group_configurations` | Create `group_configurations_select_active_member` for active-membership, unarchived SELECT only. |
| `public.group_members` | Create no raw browser data policy; RLS deny-by-default is preserved and roster access is only `get_group_roster`. |
| `public.group_audit_events` | Create no raw browser data policy; RLS deny-by-default is preserved and Owner summary access is only `get_group_audit_summary`. |
| `public.users`, `public.iso_4217_currency_codes` | Create no browser policy; RLS deny-by-default is preserved. |
| `public.events`, `public.expenses`, `public.settlements`, `public.exchange_rates`, `public.todos` | Create no replacement browser policy; each remains fail closed. |

Retire exactly these legacy permissive policies:

```text
group_read_events
group_insert_events
group_update_events
group_delete_events
group_read_expenses
group_insert_expenses
group_update_expenses
group_delete_expenses
group_read_settlements
group_insert_settlements
group_read_rates
group_insert_rates
group_update_rates
todos_public
```

IR-007 creates, alters, or drops no trigger: its exact new trigger inventory is
empty. It must not alter the existing `events_updated_at`,
`groups_ir002_set_updated_at`, `profiles_ir002_set_updated_at`,
`group_members_ir002_set_updated_at`, or
`group_configurations_ir002_set_updated_at` triggers.

Create at minimum exactly:

```text
group_members_active_profile_group_role_idx
  ON public.group_members (profile_id, group_id, role)
  WHERE profile_id IS NOT NULL AND status = 'active'
```

The only conditional additional index is
`group_members_active_owner_profile_group_idx` on `(profile_id, group_id)`
where `profile_id IS NOT NULL AND status = 'active' AND role = 'owner'`. It may
be created only when retained accepted-query-plan evidence proves the required
Owner audit limit cannot otherwise pass. No other IR-007 index is authorised.

Revoke all browser-role table privileges in scope before granting only:

- `authenticated`: `SELECT (id, display_name)` and `UPDATE (display_name)` on
  `public.profiles`;
- `authenticated`: `SELECT` on `public.groups` and
  `public.group_configurations`, subject to their policies; and
- `authenticated`: execute on the two approved public projections and only
  the policy-evaluation helper permissions above.

`anon` receives no table, helper, or projection privilege. `authenticated`
receives no direct legacy-product, legacy-`users`, currency-code,
`group_members`, or `group_audit_events` access. All direct configuration,
membership, and audit writes remain denied for Member and Owner roles.

## Current-schema security verification matrix

IR-007 exit evidence must pass the following current-schema cases, and only
these cases count toward its pass/fail result:

| Case | Required result |
|---|---|
| Anonymous Profile access | Denied. |
| Own Profile SELECT and approved presentation UPDATE | Allowed only for the linked authenticated user. |
| Cross-account Profile access | Denied. |
| Auth User without Profile | Denied. |
| Linked Profile without membership | Denied. |
| Active Member Group/configuration read | Allowed only for an active, unarchived same-Group relationship. |
| Cross-Group Group/configuration access | Denied. |
| Inactive membership | Denied. |
| Archived Group | Denied. |
| Direct configuration writes | Denied for Member and Owner. |
| Same-Group roster projection | Allowed with only the frozen fields. |
| Cross-Group roster projection | Denied. |
| Direct membership writes | INSERT, UPDATE, and DELETE denied. |
| Raw audit mutation | INSERT, UPDATE, and DELETE denied. |
| Active Owner audit projection | Allowed with only the frozen summary fields. |
| Forged Group/Profile/Participant ID | Denied without metadata leak. |
| Legacy product access | Anonymous and authenticated access denied. |
| Legacy permissive policies | Every named policy above is absent. |
| Browser/service-role boundary and recursion | No service-role/browser credential exposure and no recursive RLS. |

Future target cases named in this authorisation remain reusable documentation
only. They must not be inserted into the IR-007 pass/fail count or used to
block IR-007 verification retroactively.

## Performance and explain contract

Use a current-schema-only isolated large fixture of 200 Groups, 20 active
members per Group, inactive memberships, archived Groups, 20,000 audit rows,
and a performance actor who belongs only to Group A. Retain one cold execution
and five warmed executions for each probe; calculate p95 from the five warmed
executions and retain `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` output for the
cold and warmed evidence.

| Probe | p95 limit |
|---|---:|
| Active Group/configuration lookup | 40 ms |
| Same-Group roster with `LIMIT 100` | 40 ms |
| Direct Group or cross-Group denial lookup | 15 ms |
| Current Profile and active-membership lookup | 15 ms |
| Owner audit summary with `LIMIT 100` | 40 ms |

Every retained plan must show no sequential scan of `profiles` or
`group_members`, no authorization subplan loop proportional to protected result
rows, no temporary-file spill, and selective membership/index paths. Do not
benchmark nonexistent tenant-aware Events, Todos, finance, or Documents.

## Evidence, rollback, and integration freeze

The frozen order is: (1) Lane A migration; (2) Lane B adversarial cases; (3)
Lane C harness without retained final artifacts; (4) Lane D static checks and
aliases; (5) integration run; (6) Lane D type generation twice; (7) Lane C
retains immutable final evidence; (8) Lane D final integration checks; and
(9) separate independent verification.

Do not rerun or modify IR-001, IR-002, or IR-004 migration harnesses. Empty-
target rollback must never recreate a permissive policy. A populated-target
failure remains fail closed and uses a forward corrective migration; no
destructive rollback is authorised.

Evidence is local and isolated only. It must retain schema, policy, grant,
matrix, negative, performance/explain, type, rollback/reapplication, cleanup,
and final-manifest results without credentials, reusable session material,
email, passwords, secrets, service-role data, or private data.

## Exact implementation allow-list

Implementation may modify only:

```text
supabase/migrations/009_ir007_base_rls_ownership.sql
src/lib/database.types.ts
tests/database/ir-007/**
tests/unit/ir-007-rls-ownership-matrix.test.mjs
tests/unit/ir-007-static-contract.test.mjs
tests/evidence/write-ir-007-evidence-manifest.mjs
artifacts/ir-007/**
package.json
docs/implementation-execution/authorisations/IR-007-authorisation.md
docs/implementation-execution/packets/IR-007-rls-and-ownership.md
docs/implementation-execution/database-migration-register.md
docs/implementation-execution/gate-ledger.md
docs/implementation-execution/change-control.md
docs/implementation-execution/execution-order.md
docs/implementation-execution/dependency-map.md
docs/implementation-execution/repository-change-map.md
docs/implementation-execution/implementation-traceability.md
docs/implementation-execution/waves/W2-auth-and-security-foundation.md
docs/implementation-execution/README.md
```

`package.json` is limited to dedicated `test:ir007*` aliases; dependencies do
not change and `package-lock.json` is prohibited. The inspected repository's
canonical dependency and W2 records are respectively
`dependency-graph.md` and `waves/W2-auth-security-and-trusted-operations.md`;
they are the required status-record targets in this authorisation session
instead of creating the absent alias paths listed above. This normalization is
documentation-only and does not broaden implementation scope.

## Parallel ownership freeze and executable prompts

### Lane A

Owns only `supabase/migrations/009_ir007_base_rls_ownership.sql`.

```text
Implement only DBM-006 in 009_ir007_base_rls_ownership.sql. Follow every
frozen helper, projection, policy, revoke/grant, legacy-policy retirement,
index, rollback, and fail-closed rule in IR-007-authorisation.md. Create no
trigger, product-table tenant field, Storage, Realtime, lifecycle, trusted
operation, test, artifact, type, package, or documentation change. Stop for
any conflict with the frozen current-schema contract.
```

### Lane B

Owns only:

```text
tests/database/ir-007/cases/fixtures.sql
tests/database/ir-007/cases/rls-ownership.matrix.json
tests/database/ir-007/cases/run-rls-ownership-cases.mjs
tests/unit/ir-007-rls-ownership-matrix.test.mjs
```

```text
Implement only the frozen current-schema IR-007 security matrix and fixture.
Cover every listed allow/deny case, exclude every deferred future-target case
from the pass/fail count, retain audit-safe machine results, and make no
migration, harness lifecycle, artifact, type, package, source, or documentation
change. Do not start or stop Docker/Supabase.
```

### Lane C

Owns only:

```text
tests/database/ir-007/run-rls-ownership-evidence.mjs
tests/database/ir-007/assert-cleanup.mjs
tests/database/ir-007/local-docker-cleanup.mjs
tests/database/ir-007/local-stack/supabase/config.toml
tests/database/ir-007/empty-target-rollback.sql
tests/database/ir-007/performance-probes.mjs
tests/evidence/write-ir-007-evidence-manifest.mjs
artifacts/ir-007/**
```

```text
Implement only the isolated IR-007 harness, cleanup, empty-target rollback,
performance/explain probes, immutable evidence writer, and artifact controls.
Only this lane may start or stop Docker/Supabase. Enforce the frozen fixture,
limits, plan requirements, secret-safe retention, and fail-closed rollback.
Do not change the migration, cases, static tests, types, package, source, or
documentation.
```

### Lane D

Owns only:

```text
tests/unit/ir-007-static-contract.test.mjs
src/lib/database.types.ts
package.json
```

```text
Implement only static contract checks, the generated database types, and
dedicated test:ir007* package aliases. Generate types twice after integration;
never hand-edit them and never change a dependency or package-lock.json. Make
no migration, case, harness, artifact, source, or documentation change.
```

## Status effect

If this frozen package remains internally consistent, IR-007 is **Authorised,
implementation not started** and DBM-006 is **Authorised**. GATE-013 remains
Not satisfied, W2 remains In progress, IR-008 and IR-003 remain Not authorised,
and deployment/cutover remain Not authorised. W2 must not be marked complete.
