# IR-002 Authorisation — Tenant Data Foundation

## Decision

- Decision: **Authorised — implementation not started**.
- Authorisation date: 2026-08-01.
- Starting commit reviewed: `0f1954c4d0305b77b234b0b9125e3a189b322fd6`.
- Starting subject: `docs(ir-001): verify evidence foundation with accepted local limitations`.
- IR-001: Implemented and Verified.
- GATE-007 through GATE-010: Satisfied.
- W1: In progress; GATE-011 is not satisfied and W1 exit is not achieved.
- Deployment and cutover: not authorised.

This is the sole authorisation for the DBM-001, DBM-002, and DBM-013 work
defined below. It does not authorise an implementation outside this document,
the locked architecture, or the allow-list.

## Accepted physical contract

All SQL names below are exact. The implementation must create only these
target structures and their necessary keys, checks, indexes, and timestamp
trigger support; no `participants` table is permitted.

### DBM-001 — `006_ir002_tenant_root.sql`

`public.groups` has `id uuid`, `created_at timestamptz`, and
`updated_at timestamptz`; `id` is its primary key. `archived_at` is not part
of this unit.

`public.profiles` is structural only and has `id uuid`, `display_name text`,
`created_at timestamptz`, and `updated_at timestamptz`; `id` is its primary
key and `display_name` is non-empty. It has **no** `auth_user_id` column and
no foreign key to `auth.users`. An unlinked Profile grants no authority.
DBM-003 / IR-004 exclusively adds and owns the authoritative
`profiles.auth_user_id` linkage and its uniqueness, privacy, and
session-derived behavior. Legacy names, PINs, and persona constants are never
linkage evidence.

`public.group_members` has:

| Column | Contract |
|---|---|
| `id uuid` | Primary key and stable Participant identity. |
| `group_id uuid` | Non-null restrictive foreign key to `groups(id)`. |
| `profile_id uuid` | Nullable restrictive foreign key to `profiles(id)`; null represents an unclaimed structural Participant. |
| `role text` | Non-null structural value constrained to `owner` or `member`. |
| `status text` | Non-null structural value constrained to `active` or `inactive`. |
| `created_at`, `updated_at timestamptz` | Non-null timestamp foundation. |

It must have `UNIQUE (group_id, id)` for same-Group references and a unique
partial index on `(group_id, profile_id) WHERE profile_id IS NOT NULL`. This
permits more than one unclaimed legacy Participant while preventing duplicate
linked Profile membership in one Group. Possession of any of these identifiers
grants no authority.

DBM-004 / IR-005 retains Invitations, membership transitions, activation,
inactivation, removal, leave, last-Owner protection, lifecycle authorization,
and lifecycle-audit operations. DBM-001 supplies only the fields needed for
IR-003 to create the first active Owner. IR-003 already depends on IR-004 and
must therefore consume a linked Profile, not create an Auth relationship.

### DBM-002 — `007_ir002_configuration_archive_audit.sql`

`public.group_configurations` is the sole effective configuration relation.
Its `group_id uuid` is both the primary key and a restrictive foreign key to
`groups(id)`, enforcing exactly one configuration per Group. Its exact other
columns are `trip_name text`, `destination text`, `start_date date`,
`end_date date`, `timezone text`, `accounting_currency text`, `created_at
timestamptz`, and `updated_at timestamptz`. Both text presentation values are
non-empty; `end_date >= start_date`; all timestamps are non-null.

DBM-002 adds nullable `groups.archived_at timestamptz` with the check
`archived_at IS NULL OR archived_at >= created_at`. Archive and restore
operations remain IR-005; this unit establishes no archive authority.

Timezone validation is fixed as a `CHECK` using the migration-owned,
`STABLE`, schema-qualified `public.is_valid_iana_timezone(text)` function.
The function accepts a non-empty canonical slash-qualified name only when it
exists in `pg_catalog.pg_timezone_names`; it must not use a regex as the
authority. Its source is PostgreSQL's IANA tzdata catalogue in the isolated
Supabase local stack controlled by the pinned Supabase CLI `2.105.0`. The
migration header and provenance record must state that source, CLI version,
and the local image/version observed by the run. No network is used at
migration time. Rollback removes the configuration check before the function.

Currency validation is fixed as a restrictive foreign key to
`public.iso_4217_currency_codes(code text primary key)`. DBM-002 seeds this
reference relation in the same migration with the complete current-code
snapshot from the ISO 4217 Maintenance Agency **List One**, captured on
2026-08-01, from
`https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml`.
The migration header and provenance record must include that source URL,
retrieval date, and SHA-256 of the exact embedded List One snapshot.
The local migration executes only its committed values and therefore needs no
network. The reference relation is not product data and may be dropped only
after its consuming configuration relation is removed.

`public.group_audit_events` is the minimal audit destination. It has `id uuid`
(primary key), `group_id uuid`, `actor_group_member_id uuid`, `event_type
text`, `request_id uuid`, `details jsonb`, `occurred_at timestamptz`, and
`created_at timestamptz`. `group_id`, `actor_group_member_id`, `event_type`,
`request_id`, `details`, `occurred_at`, and `created_at` are non-null;
`details` defaults to an empty object; `event_type` is non-empty and limited
to `group_bootstrapped` or `membership_lifecycle`; `request_id` is unique.
The composite foreign key `(group_id, actor_group_member_id)` references
`group_members(group_id, id)`, preventing a cross-Group audit actor.

IR-002 creates this destination only. IR-003 writes the atomic
`group_bootstrapped` event; IR-005 owns membership-lifecycle audit operations;
later security packets own authorization. This is not event sourcing,
analytics, or a product feature.

## Migration and generated-type decisions

The repository continues its existing three-digit migration sequence. The
only approved IR-002 migration paths are:

```text
supabase/migrations/006_ir002_tenant_root.sql
supabase/migrations/007_ir002_configuration_archive_audit.sql
```

`DBM-*` identifiers remain logical ownership identifiers, not filenames.
Every later migration filename requires its owning packet's authorisation.

The approved generated output is `src/lib/database.types.ts`. It is generated
only from the isolated local schema with the already pinned Supabase CLI
`2.105.0`; no dependency change is authorised. It must not be hand-edited.
Two byte-identical generations are required. Provenance records the CLI
version, source schema (`public`), both migration identities and checksums,
the resulting file checksum, and the local schema source.

## Local-only authority and rollback

After implementation starts, this authorisation permits isolated local clean
migration application, constraint tests, empty-target rollback, clean
reapplication, local type generation, and exact project-scoped cleanup. It
does not permit a linked project, remote or production database, production
credential, deployment, production migration, Bali-data migration, or cutover.

Rollback is permitted only on an empty isolated target with no later consumer:
remove DBM-002 configuration/audit/reference objects first, then DBM-001
membership/Profile/Group objects. Legacy migrations and `supabase/seed.sql`
are never touched. Once target data or downstream schema exists, use reviewed
forward repair rather than destructive rollback.

## Evidence, corrections, and independent verification

IR-002 alone owns:

```text
tests/database/ir-002/**
tests/unit/ir-002-tenant-foundation.test.mjs
tests/evidence/write-ir-002-evidence-manifest.mjs
artifacts/ir-002/**
```

IR-001 evidence semantics and historical artifacts are immutable. Separate,
immutable records are required for `clean apply`, `constraint tests`,
`empty-target rollback`, `clean reapply`, `type generation pass 1`, `type
generation pass 2`, `cleanup`, and `final manifest`. The final manifest must
reference and checksum every stage; no recovery or later stage may overwrite
an earlier stage result.

The authorised verification sequence is: (1) clean isolated application;
(2) schema and constraint validation; (3) two-Group structural fixture
validation; (4) empty-target rollback; (5) clean reapplication; (6)
deterministic generated-type comparison; (7) exact cleanup; and (8) manifest
and secret-safety validation. IR-001's synthetic controlled-failure sequence
is not an IR-002 completion requirement.

Implementation defects remain correctable under this authorisation only when
they stay within the allow-list, preserve this objective and locked
architecture, add no later-packet capability, and need no dependency,
credential, or external environment. This covers approved SQL, constraints,
tests, harness, manifest, type provenance, dedicated CI, and completion
documentation. Product-owner reauthorisation is required for architecture or
scope change, legacy migration modification, product/Auth/Invitation/RLS/
Storage/Realtime implementation, remote or production access, a dependency,
IR-003-or-later work, or any IR-001 evidence-semantic change.

A shared or external failure blocks IR-002 only when it is directly invoked by
an authorised IR-002 command, required evidence cannot be produced without
it, and it reproduces from the accepted clean starting state. Otherwise it is
recorded separately as non-blocking. The independent verifier may rerun
authorised commands and inspect authorised invariants, but may not add a new
failure sequence, shared harness, artifact format, environment, dependency, or
product scope; such a requirement enters change control.

## File boundaries

The future implementation allow-list is exactly:

```text
supabase/migrations/006_ir002_tenant_root.sql
supabase/migrations/007_ir002_configuration_archive_audit.sql
src/lib/database.types.ts
tests/database/ir-002/**
tests/unit/ir-002-tenant-foundation.test.mjs
tests/evidence/write-ir-002-evidence-manifest.mjs
package.json
artifacts/ir-002/**
.github/workflows/ir-002-evidence.yml
docs/implementation-execution/authorisations/IR-002-authorisation.md
docs/implementation-execution/packets/IR-002-tenant-data-foundation.md
docs/implementation-execution/database-migration-register.md
docs/implementation-execution/change-control.md
docs/implementation-execution/repository-change-map.md
docs/implementation-execution/implementation-traceability.md
docs/implementation-execution/waves/W1-evidence-and-tenant-foundation.md
docs/implementation-execution/README.md
```

`package.json` may gain only IR-002-specific scripts. `package-lock.json` is
prohibited. `.github/workflows/ir-002-evidence.yml` is explicitly allowed but
optional; if created it is local-only, non-deploy, project-scoped, and follows
the dedicated immutable-evidence contract.

The following remain prohibited: legacy migrations `001` through `005`,
`supabase/seed.sql`, all `src/**` except the generated type path,
`supabase/functions/**`, `tests/browser/**`, IR-001 database/evidence scripts,
`.github/workflows/ir-001-evidence.yml`, `artifacts/ir-001/**`,
`docs/architecture/**`, `docs/ui-design/**`, environment files, and deployment
files.

## Entry, exit, and GATE-011

Implementation entry requires a clean worktree on the authorised starting
line, the two exact migration paths, this contract, and a fresh isolated local
environment check. No implementation starts if a locked architecture decision,
allow-list, or local-only boundary would be changed.

IR-002 becomes Implemented only after its two migrations, generated types,
immutable evidence sequence, rollback/reapply proof, exact cleanup, completion
record, and allow-list review pass. It becomes Verified only after independent
review of those records, stable Participant identity, two-Group structural
separation, Profile/Auth ownership, configuration/audit constraints, type
provenance, secret safety, and absence of later-packet work. Neither status is
claimed by this document.

GATE-011 remains not satisfied. It requires GATE-007–010 plus independently
verified IR-002 parent/constraint and two-Group evidence, local-boundary
evidence, and an explicit W1-exit decision. IR-002 verification cannot
silently close the gate.

## Post-acceptance implementation prompt

```text
Implement authorised IR-002 only from
docs/implementation-execution/authorisations/IR-002-authorisation.md.
Start with clean-branch/HEAD/worktree preflight. Modify only its frozen
allow-list. Create only 006_ir002_tenant_root.sql and
007_ir002_configuration_archive_audit.sql, using its exact physical contract.
Use only an isolated local Supabase stack; never link, access, or deploy a
remote project. Create the dedicated IR-002 harness and immutable evidence
stages, regenerate src/lib/database.types.ts twice with Supabase CLI 2.105.0,
and run the authorised sequence. Do not modify legacy migrations, seed data,
product code, Auth/Invitation/RLS/Storage/Realtime, IR-001 evidence, or any
locked architecture/design document. Stop for any scope or architecture change.
Do not mark IR-002 Verified, GATE-011 satisfied, or W1 complete.
```

## Execution statement

This authorisation closure created no migration, schema implementation,
database execution, generated type, deployment, or cutover.
