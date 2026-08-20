# IR-003 — Atomic Group bootstrap

## 1. Status and freeze boundary

- Status: Authorised — pre-authorisation design freeze complete; physical
  implementation not started
- Wave: W3
- Physical owner: IR-003 / W3 for DBM-014 and TOP-001 only
- Implementation authorised: **Yes** —
  [`IR-003 authorisation`](../authorisations/IR-003-authorisation.md)
- GATE-031: **Satisfied** — evidence prerequisite; separate IR-003 authority recorded
- Physical trusted operation: **Authorised and not implemented**
- Future migration reservation only:
  `supabase/migrations/010_ir003_atomic_group_bootstrap.sql`

The completed freeze and authority record do not create the
reserved migration, a role, a function, a table, generated types, application
code, tests, artifacts, remote state, deployment, or a Group. The record does
not itself implement any of them or change a Verified packet or gate.

The verified inputs are IR-001, IR-002, IR-004, IR-007, and IR-008; GATE-013
is Satisfied, W2 is Complete, and the separate W3 entry decision GATE-015 is
Satisfied. Along with the satisfied GATE-031 evidence decision, those facts
support the recorded separate authorisation.

## 2. Authoritative inputs and inspected state

The accepted logical inputs remain authoritative: the Group-creation contract
in `docs/architecture/auth-groups-and-invitations.md` §6, configuration
contract in §13, security model §§5, 8.3, and 10–11, Domain and Data Model
§§6–7, ADR-0001, ADR-0002, ADR-0004, ADR-0006, ADR-0008, the accepted ONB
contracts, and the frozen IR-008 register.

Current verified physical state is deliberately narrower:

- `006_ir002_tenant_root.sql` supplies UUID `groups`, `profiles`, and the
  stable `group_members.id` Participant identity.
- `007_ir002_configuration_archive_audit.sql` supplies one
  `group_configurations` row per Group, `trip_name`, `destination`, dates,
  IANA `timezone`, ISO `accounting_currency`, archive support, the ISO table,
  and `group_audit_events`. It has **no** display-currency persistence.
- `008_ir004_profile_auth.sql` supplies nullable, unique,
  restrictive `profiles.auth_user_id`; the verified application boundary
  resolves the current session through that Profile.
- `009_ir007_base_rls_ownership.sql` has forced RLS on the Group primitives,
  direct browser mutations denied, and only narrow existing read/projection
  functions. It has no bootstrap operation.
- `src/lib/database.types.ts` has no TOP-001, display-context child, or
  idempotency types and remains DBM-013 output, not hand-authored contract.

No legacy Bali value, destination, timezone, currency, display text, persona,
local-storage value, or client-generated accounting meaning is an input to a
new Group. The controlled Bali migration bootstrap remains IR-016 work and is
not this new-Group operation.

## 3. DBM-014 and migration-010 ownership freeze

**DBM-014** is the next unused stable DBM identifier. It is owned solely by
IR-003 / W3 for physical atomic Group bootstrap support. Its only future SQL
file is exactly:

```text
supabase/migrations/010_ir003_atomic_group_bootstrap.sql
```

That file is reserved and absent at authorisation. It may be created only by
the authorised Lane A after the GATE-031 and IR-003 entry conditions are
rechecked. DBM-014 may own only all of the following, in that one migration:

1. the minimum display-context child persistence in §4;
2. the IR-003-specific TOP-001 idempotency table in §7 and its indexes,
   constraints, forced-RLS/no-direct-policy posture, and retention boundary;
3. the dedicated, no-login TOP-001 executor role and only the grants/revokes
   in §6; and
4. `public.bootstrap_group(jsonb, jsonb, uuid)` exactly as frozen in §5,
   including its audit write and no other callable operation.

DBM-014 may not rename, replace, or repurpose DBM-001–DBM-013. It explicitly
excludes all Invitation and membership lifecycle state or TOP-002–TOP-007
(IR-005); claiming and provenance (IR-006); Storage (IR-009); Realtime
(IR-010); finance (IR-014); broader configuration editing, display-context
maintenance, FX, or accounting-currency lifecycle (IR-015); and transforms,
source maps, or migration-stage activation (IR-016). DBM-013 remains the sole
generated-type provenance checkpoint: types are refreshed only after a future
authorised clean schema application and integration, never by this freeze.

## 4. Minimum currency-display persistence

### 4.1 Current state and exact addition

`public.group_configurations` is already the one-to-one Group configuration
authority. It already persists `trip_name`, `destination`, `start_date`,
`end_date`, `timezone`, and `accounting_currency TEXT NOT NULL REFERENCES
public.iso_4217_currency_codes(code) ON DELETE RESTRICT`. It has no display
context. Migration `007` is immutable and is not amended.

DBM-014 may add exactly one child relation, with no competing configuration
root:

```text
public.group_configuration_display_currencies
  group_id       UUID NOT NULL
  currency_code  TEXT NOT NULL
  PRIMARY KEY (group_id, currency_code)
  FOREIGN KEY (group_id)
    REFERENCES public.group_configurations(group_id) ON DELETE RESTRICT
  FOREIGN KEY (currency_code)
    REFERENCES public.iso_4217_currency_codes(code) ON DELETE RESTRICT
```

There are no other columns, no surrogate key, no ordering column, no display
label, no destination-derived value, no JSON duplicate, no browser cache, and
no default. `TEXT` is intentionally the same ISO-code representation already
used by `accounting_currency`; the existing reference table's uppercase
three-letter check remains the allowed-value authority. The composite primary
key prevents duplicate display currencies. Existing pre-IR-003 configuration
rows are not transformed by this packet; every Group successfully created by
TOP-001 must have a non-empty set at commit.

The relation is a subordinate part of the existing Group configuration, not a
second configuration authority. Presentation order is derived safely by the
consumer (accounting currency first, then a deterministic code order); it is
not stored as accounting semantics.

### 4.2 Bootstrap invariant and later ownership

TOP-001 validates a non-empty, duplicate-free set of ISO codes and requires
the request's `accounting_currency` to occur exactly once in that set. It then
creates the configuration row and every display-context child row in the same
transaction. It neither infers a code from destination/Bali/UI copy nor permits
the client to define accounting meaning. `accounting_currency` remains the
ledger authority; each child code is reference presentation context only.

During IR-003 the set is bootstrap-only and immutable: direct reads/writes are
fail closed and TOP-001 is the sole writer. IR-015 retains all later ownership
of owner-authorised add/remove/change behaviour, the invariant that accounting
currency cannot be removed from display context, version/stale-write handling,
history safety, accounting-currency transition rules, and FX context. IR-003
does not take any of those lifecycle responsibilities.

## 5. TOP-001 exact physical contract

### 5.1 Callable signature and request structure

The logical IR-008 signature is preserved exactly. The only future physical
RPC is:

```sql
public.bootstrap_group(
  group_request jsonb,
  configuration_request jsonb,
  request_id uuid
)
RETURNS TABLE (
  outcome text,
  group_id uuid,
  request_id uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog
```

It has exactly three arguments, no defaults, and no overload. The safe
successful result is exactly one row with `outcome = 'completed'`, the created
`group_id`, and the supplied `request_id`. The same completed request returns
that stored row byte-for-byte at the result-field level; it does not reveal an
Auth User, Profile, Group Member/Participant, Owner, role, audit details, or
privileged diagnostics. Failure returns no result row and is mapped only to
safe categories: `not_authenticated`, `auth_not_verified`,
`profile_unavailable`, `invalid_request`, `idempotency_conflict`, or
`operation_failed`. Internal constraint names, existence information, and
database diagnostics are not RPC output.

### 5.1.1 PostgreSQL implementation clarification

The public callable above remains the exact TOP-001 contract. PostgreSQL
rejects a PL/pgSQL declaration that uses `request_id` both as its input name
and as a `RETURNS TABLE` output name. To retain those frozen public names, one
implementation-only `public.ir003_bootstrap_group_impl(jsonb, jsonb, uuid)`
may be used only as the target of a SQL `SECURITY DEFINER` wrapper at the exact
public signature above. The helper's arguments use non-public names; its safe
three-field result is projected unchanged by the wrapper.

This is a compiler-required physical clarification, not a second logical TOP
or public callable. Both wrapper and helper, where privileged, are owned by
the sole `ir003_top001_executor` role and use fixed `search_path = pg_catalog`
with schema-qualified project references. The helper is revoked from `PUBLIC`,
`anon`, `authenticated`, and `service_role`; only `authenticated` receives
`EXECUTE` on the public wrapper. It has no defaults or overloads, cannot be a
PostgREST/browser alternate route, accepts no actor parameter, has no broader
privilege than the approved bootstrap operation, and performs no transaction
control. It executes in the caller transaction, so all successful writes and
all rollback/idempotency behaviour remain those of one TOP-001 operation.

Lane B and the independent verifier must prove the helper's direct
non-callability for every application role, the wrapper-only `EXECUTE` grant,
same owner/security-definer/search-path confinement, and inability to bypass
the public actor/request validation or create a separately committed result.

`group_request` must be a JSON object with exactly one key:

```json
{"trip_name":"non-blank text"}
```

`configuration_request` must be a JSON object with exactly these keys:

```json
{
  "destination":"non-blank text",
  "start_date":"YYYY-MM-DD",
  "end_date":"YYYY-MM-DD",
  "timezone":"IANA timezone name",
  "accounting_currency":"ISO 4217 uppercase code",
  "display_currency_codes":["ISO 4217 uppercase code", "..."]
}
```

Unknown keys, missing keys, nulls, non-string scalar values, duplicate display
codes, a blank trimmed name/destination, malformed dates, an end date before a
start date, a non-IANA timezone, a code absent from
`public.iso_4217_currency_codes`, or a display set that omits accounting
currency are validation failures. The allowed display codes are the existing
ISO reference codes only. This structure contains mutation values only.

The caller cannot provide, directly or under another key, an Auth User ID,
Profile ID, Group ID, Group Member/Participant ID, Owner identity, role,
actor, creator, recorder, uploader, authority state, audit actor, invitation,
invitation secret, or link. `request_id` is a UUID correlation/idempotency key
only; it is never authority.

### 5.2 Actor, validation, and one transaction

The implementation helper's first authority operation is `auth.uid()`. It rejects null,
then looks up exactly one `public.profiles` row where
`profiles.auth_user_id = auth.uid()`, and confirms that the same Auth User is
currently verified by `auth.users.email_confirmed_at IS NOT NULL` before
accepting the Profile. This is the
already verified Auth/Profile boundary, not a caller-provided identity. A
verified Profile with zero existing memberships is allowed to bootstrap; an
existing active membership does not grant extra authority and cannot choose the
new Group's Owner.

After strict request validation and normalization, one database transaction:

1. establishes/locks the IR-003 idempotency claim in §7;
2. creates one unarchived `public.groups` row;
3. creates its single `public.group_configurations` row;
4. creates its required display-context rows;
5. creates one `public.group_members` row linked to the resolved Profile with
   `role = 'owner'` and `status = 'active'`; its generated `id` is the first
   stable Participant identity;
6. writes exactly one `public.group_audit_events` `group_bootstrapped` event
   using that server-created Group Member as actor, the request UUID, server
   occurrence time, and safe object-only details; and
7. stores the completed safe result and Group reference in the idempotency row.

The function performs no transaction control of its own. Any validation,
authorization, constraint, injected, concurrency, or unexpected failure is
re-raised as a safe failure and causes the caller transaction to roll back.
There is therefore no committed orphan Group, configuration, display context,
membership/Participant, Owner, audit, or pending bootstrap claim.

### 5.3 Fingerprint, retry, and concurrency

Before creating the idempotency claim, the function constructs the canonical
JSONB fingerprint below after validation: trimmed trip name/destination,
canonical `YYYY-MM-DD` dates, exact validated IANA name, uppercase ISO codes,
and `display_currency_codes` sorted in bytewise code order. It includes the
literal `TOP-001`, `group_request`, and `configuration_request`; it excludes
request ID, actor identity, timestamps, and any server-created ID. JSONB's
canonical object representation plus sorted duplicate-free set makes JSON key
order and display-code order immaterial, while a changed effective request is
different.

```json
{
  "operation":"TOP-001",
  "group_request":{"trip_name":"..."},
  "configuration_request":{
    "destination":"...",
    "start_date":"YYYY-MM-DD",
    "end_date":"YYYY-MM-DD",
    "timezone":"Area/Location",
    "accounting_currency":"AAA",
    "display_currency_codes":["AAA","BBB"]
  }
}
```

For the same resolved actor and request UUID, the primary-key conflict path
locks the existing record. An equal fingerprint and completed record returns
its stored safe result. A different fingerprint returns only
`idempotency_conflict`. A concurrent same-key call waits for the unique-key
winner; it then returns the same completed result, or becomes the one creator
if the winner rolled back. A lost client response after commit is an unknown
client completion, not a new authority: retry finds the completed record and
converges. Failure before commit leaves no durable claim or Group authority.

## 6. SECURITY DEFINER execution model

Forced RLS from IR-007 means ordinary `authenticated` writes remain denied and
even a table owner is subject to FORCE RLS. The narrow technically valid model
is therefore one dedicated executor, not `postgres`, not a browser service
role, and not a generic trusted-operation proxy:

```text
Role:          ir003_top001_executor
Attributes:    NOLOGIN NOINHERIT BYPASSRLS
Membership:    no memberships; no login grant; no role may inherit it
Function:      public.bootstrap_group(jsonb, jsonb, uuid) owned by this role
Table/schema:  migration administrative owner retains ownership of tables and
               schemas; executor owns no table and has no DDL authority
```

`BYPASSRLS` is required only because the function must atomically insert into
the IR-007 forced-RLS Group primitives while direct browser writes are denied.
It is not an authority grant: the function revalidates `auth.uid()`, verified
Auth User, resolved Profile, complete request, and every bootstrap invariant
before every elevated write. The role has no login, no inherited path, no
server credential, no dynamic SQL, no generic dispatcher, no role switching,
and no capability outside TOP-001.

### 6.1 Exact executor privilege matrix

Future migration-010 must grant `ir003_top001_executor` only the following
object privileges. `YES` is a required privilege; `NONE` must not be granted.
Column lists in **Other** are part of the freeze. `REFERENCES` is `NONE` for
every table because TOP-001 creates no schema, foreign key, or other DDL.

| Object | USAGE | SELECT | INSERT | UPDATE | DELETE | EXECUTE | Other |
|---|---|---|---|---|---|---|---|
| Schema `auth` | YES | NONE | NONE | NONE | NONE | NONE | No `CREATE`, ownership, or default-privilege change. |
| Schema `public` | YES | NONE | NONE | NONE | NONE | NONE | No `CREATE`, ownership, or generic public-schema mutation capability. |
| `auth.uid()` | NONE | NONE | NONE | NONE | NONE | YES | Only session-actor derivation; no ownership. |
| `public.is_valid_iana_timezone(text)` | NONE | NONE | NONE | NONE | NONE | YES | Direct validation and the existing configuration check constraint; no ownership. |
| `public.ir002_set_updated_at()` | NONE | NONE | NONE | NONE | NONE | NONE | Existing UPDATE-trigger helper is not invoked because TOP-001 performs no update of its trigger-bearing tables. |
| `ir007_private.current_profile_id()` | NONE | NONE | NONE | NONE | NONE | NONE | TOP-001 resolves the Profile directly from `auth.uid()`; it receives no `USAGE` on schema `ir007_private`. |
| `ir007_private.current_active_group_ids()` | NONE | NONE | NONE | NONE | NONE | NONE | No active-Group lookup is an input to bootstrap authority. |
| `ir007_private.current_active_owner_group_ids()` | NONE | NONE | NONE | NONE | NONE | NONE | No existing-Owner lookup is an input to bootstrap authority. |
| `pg_catalog.gen_random_uuid()` | NONE | NONE | NONE | NONE | NONE | YES | Only the existing bound UUID defaults on `groups`, `group_members`, and `group_audit_events`; no sequence or extension ownership. |
| `pg_catalog.pg_timezone_names` | NONE | YES | NONE | NONE | NONE | NONE | Read only through `public.is_valid_iana_timezone(text)`; no system-catalog mutation or ownership. |
| `auth.users` | NONE | YES | NONE | NONE | NONE | NONE | `SELECT (id, email_confirmed_at)` only; no `REFERENCES`, ownership, or Auth mutation. |
| `public.profiles` | NONE | YES | NONE | NONE | NONE | NONE | `SELECT (id, auth_user_id)` only; no `REFERENCES`, ownership, or presentation update. |
| `public.groups` | NONE | YES | YES | NONE | NONE | NONE | `SELECT (id)` for `RETURNING`; `INSERT` only; no `REFERENCES` or ownership. |
| `public.group_configurations` | NONE | NONE | YES | NONE | NONE | NONE | `INSERT (group_id, trip_name, destination, start_date, end_date, timezone, accounting_currency)` only; no `REFERENCES` or ownership. |
| `public.group_members` | NONE | YES | YES | NONE | NONE | NONE | `SELECT (id)` for `RETURNING`; `INSERT (group_id, profile_id, role, status)` only; no `REFERENCES` or ownership. |
| `public.group_audit_events` | NONE | NONE | YES | NONE | NONE | NONE | `INSERT (group_id, actor_group_member_id, event_type, request_id, details, occurred_at)` only; no `REFERENCES` or ownership. |
| `public.iso_4217_currency_codes` | NONE | YES | NONE | NONE | NONE | NONE | `SELECT (code)` only for ISO validation; no ISO mutation, `REFERENCES`, or ownership. |
| `public.group_configuration_display_currencies` (future DBM-014) | NONE | NONE | YES | NONE | NONE | NONE | `INSERT (group_id, currency_code)` only; no direct application read, `REFERENCES`, or ownership. |
| `public.ir003_bootstrap_requests` (future DBM-014) | NONE | YES | YES | YES | NONE | NONE | `SELECT (operation, actor_profile_id, request_id, request_fingerprint, status, group_id, result, completed_at)`; `INSERT (operation, actor_profile_id, request_id, request_fingerprint, status)`; `UPDATE (status, group_id, result, completed_at)` only. No `DELETE`, `REFERENCES`, or ownership. |
| `public.bootstrap_group(jsonb, jsonb, uuid)` (future TOP-001) | NONE | NONE | NONE | NONE | NONE | NONE | **Owner:** `ir003_top001_executor`; ownership is required for SECURITY DEFINER. The executor needs no self-`EXECUTE` grant. |
| All sequences | NONE | NONE | NONE | NONE | NONE | NONE | No sequence exists in the TOP-001 write path; all affected identities are UUID/default-generated. |

No ISO helper exists beyond `public.iso_4217_currency_codes`, and TOP-001 may
not introduce one. No other project-defined function, table, view, extension,
sequence, policy helper, or schema is a TOP-001 dependency. Fixed
`pg_catalog` JSONB/text/date operators are language/runtime built-ins under the
fixed search path; they receive no additional project privilege, ownership, or
search-path grant.

`BYPASSRLS` bypasses RLS policy evaluation only; it does **not** grant schema,
table, column, function, sequence, or ownership privileges. The executor must
therefore receive exactly the `YES` privileges above and no other object
privilege. In particular it receives no `DELETE`, no broad `ALL PRIVILEGES`,
no table/schema/database ownership, no role membership, no `CREATE`, `ALTER`,
`TRUNCATE`, Storage, Realtime, legacy-table, or generic proxy privilege. The
future DBM-014 tables must be RLS-enabled and FORCE RLS with no
application-facing policy; direct application grants remain revoked.

### 6.2 Function and caller execution boundary

`ir003_top001_executor` remains the function owner, is `NOLOGIN`,
`NOINHERIT`, and `BYPASSRLS`, has no memberships, and owns no database, schema,
or table. The migration administrative owner retains every table/schema
ownership and all DDL. `public.bootstrap_group(jsonb, jsonb, uuid)` is
`SECURITY DEFINER` with fixed `search_path = pg_catalog`; its body
schema-qualifies every `auth` and `public` reference and never relies on the
caller search path or a writable schema.

The future migration must revoke `EXECUTE` on that exact three-argument
function from `PUBLIC`, `anon`, and `service_role`, then grant it only to
`authenticated`. The `service_role` revoke is intentional even though no
browser receives that credential: it prevents this user-facing operation from
becoming an alternate privileged server route. `authenticated` requires its
existing `USAGE` on schema `public` solely to resolve the RPC; it receives no
`USAGE` on `auth`, no executor-role membership, and no direct table privilege
through TOP-001. Invocation is not business authority: the function still
derives `auth.uid()` and revalidates verification, Profile, request, and
idempotency prerequisites. No browser service-role credential or reusable
elevated-operation proxy is introduced.

No browser receives a service-role credential. Calling the RPC is not itself
business authority; the same authenticated caller is denied if session,
verification, Profile, input, or idempotency rules fail.

## 7. TOP-001-specific idempotency persistence

Migration-010 may create exactly `public.ir003_bootstrap_requests`. It is not
a shared TOP table and grants no implied primitive or operation ownership to
TOP-002–TOP-012.

```text
operation                  TEXT NOT NULL CHECK (operation = 'TOP-001')
actor_profile_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT
request_id                 UUID NOT NULL
request_fingerprint        JSONB NOT NULL CHECK (jsonb_typeof(request_fingerprint) = 'object')
status                     TEXT NOT NULL CHECK (status IN ('pending', 'completed'))
group_id                   UUID NULL REFERENCES public.groups(id) ON DELETE RESTRICT
result                     JSONB NULL CHECK (result IS NULL OR jsonb_typeof(result) = 'object')
created_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
completed_at               TIMESTAMPTZ NULL
PRIMARY KEY (operation, actor_profile_id, request_id)
```

The table also has one completion-state check: a `pending` record has null
`group_id`, `result`, and `completed_at`; a `completed` record has all three
non-null, and `result` has exactly safe `outcome`, `group_id`, and
`request_id` fields matching the scalar columns. Pending exists only inside
the still-open bootstrap transaction and cannot commit. Required indexes are
the primary-key btree for actor/request conflict and
`ir003_bootstrap_requests_group_id_idx (group_id)` for controlled audit and
reconciliation lookup. There is no fingerprint-only lookup index and no
generic operation index.

Retention is indefinite for IR-003: a completed record is retained with its
Group for the full lifetime of the Group row, supports safe late retry, and is
not deleted, expired, recycled, or repurposed by this packet. Later retention
or purge policy needs its own reviewed owner and cannot weaken a still-valid
retry record. Request ID remains correlation/idempotency data, never an access
grant.

### 7.1 Audit request-ID compatibility clarification

`public.group_audit_events` is the immutable IR-002 / DBM-002 audit-table
baseline; IR-007 / DBM-006 later owns its RLS/read boundary, not its
idempotency semantics. The IR-002 authorisation required a unique
`request_id`, but does not define that column as a global trusted-operation
idempotency authority. The frozen common trusted-operation contract instead
defines request ID as correlation/idempotency data, and TOP-001 expressly owns
its idempotency persistence in `public.ir003_bootstrap_requests`.

The authoritative TOP-001 key is exactly
`(operation, actor_profile_id, request_id)`. Consequently, two distinct
validated actors may use the same UUID independently. TOP-001 continues to
write that caller request UUID unchanged to its one `group_bootstrapped` audit
row; the audit row is correlation evidence, not a substitute claim or replay
authority.

The inherited global constraint
`group_audit_events_request_id_key` is incompatible with that frozen key: it
would reject the second actor's otherwise valid, separately claimed bootstrap
solely because the UUID appears in another actor's audit row. It must therefore
be forward-altered, without rewriting migration `007`, inside the authorised
DBM-014 migration before the TOP-001 function is created:

```sql
ALTER TABLE public.group_audit_events
  DROP CONSTRAINT group_audit_events_request_id_key;

CREATE INDEX group_audit_events_request_id_idx
  ON public.group_audit_events (request_id);
```

The non-unique btree is required to retain efficient correlation lookup after
dropping the constraint-owned index. No composite audit uniqueness replacement
is authorised: the table has no authoritative TOP operation or actor-Profile
key, and an audit constraint must not recreate a hidden replay authority.
Same-actor/same-TOP duplicate prevention remains solely the
`ir003_bootstrap_requests` primary key; its completed replay path emits no
second bootstrap audit event. This is a bounded IR-003 compatibility evolution,
not an IR-002 or IR-007 correction and not an architecture reopening. Lane B
and the detached verifier must prove the cross-actor same-UUID cases and the
continued same-actor replay/conflict/race guarantees.

## 8. TOP-001 performance and evidence acceptance

This is a future test contract, not a benchmark result. It uses the Verified
IR-001 local isolated Supabase CLI/Docker capability and the established
IR-007 methodology: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`, one cold run,
five warmed samples for a small probe, exact cleanup, write-once JSON stage
records, and a SHA-256 final manifest. It does not establish a remote,
rehearsal, or production environment.

The fixture extends—not replaces—the accepted IR-007 scale: 200 pre-existing
Groups, 20 active members per Group (4,000 active memberships), 200 inactive
memberships, 20 archived Groups, 20,000 audit rows, 20,000 completed synthetic
IR-003 request records, ISO reference rows, and a verified Auth User/Profile
performance actor. All fixture identities, emails, request UUIDs, names, and
destinations are synthetic and artifact-redacted. `ANALYZE` precedes timing.

| Workload | Required procedure and numeric limit |
|---|---|
| Cold | Record one first committed, unique bootstrap after schema/fixture setup. It is reported separately and has no pass/fail latency threshold because cold-cache/startup behaviour is intentionally distinguished. |
| Warm-up | Commit 10 unique, valid bootstrap operations serially; do not include them in percentiles. |
| Distinct creation | Run 100 committed unique requests as 10 workers × 10 requests. Record p50, p95, and p99 from all 100 server-observed operation durations. p95 must be **≤ 40 ms** and p99 **≤ 75 ms**. |
| Same-key race | Start 10 concurrent calls with one verified actor, identical normalized request, and one request UUID. All must converge to one Group/result; p95 end-to-end RPC duration must be **≤ 40 ms** and maximum duration **≤ 75 ms**. |

The 40 ms p95 is deliberately the established IR-007 upper limit for its
largest bounded read probes; the 75 ms p99/max guard permits contention while
rejecting a tail more than the accepted local bounded-operation envelope. The
IR-007 verified observed p95 values (1.236–1.867 ms) are far below those
existing limits, so this is not a looser performance convention. Any missing
sample, p95/p99/max breach, wrong result count, duplicate Group, or cleanup
failure is a blocking regression.

Retain JSON explain evidence for the RPC wrapper and the equivalent supporting
lookups under the executor's fixed predicates: Profile-by-`auth_user_id`, ISO
code validation, and the idempotency primary-key lookup. Required index paths
are `profiles_auth_user_id_key`, the ISO primary key,
`ir003_bootstrap_requests_pkey`, the configuration primary key, and the
display-context primary key. Plans must have no sequential scan of
`profiles`, `group_members`, `iso_4217_currency_codes`, or
`ir003_bootstrap_requests`; no temporary-file spill; and no protected-row
proportional authorization/idempotency subplan loop. A plan violation is
blocking even if latency passes. Retained `performance-probes.json` records
fixture counts, cold/warm distinction, durations, percentiles, worker count,
operation count, plans, limits, outcome counts, and safe check categories;
the final immutable manifest references its SHA-256.

## 9. ONB-06 invitation reachability boundary

`F-IR003-FREEZE-001` recorded the former reachability defect: the prior
composite ONB-06 success state asserted an issued Invitation link even though
IR-003/TOP-001 creates no Invitation. `ONB-09` is IR-006 and `ONB-10` is
IR-011, so neither supplies an IR-003 continuation.

The product owner accepted `DCC-IR003-FREEZE-001` on 2026-08-12. The formal W3
design-contract blocker **BLK-IR003-FREEZE-001** and open item `OE-006` are
therefore resolved. The accepted lifecycle staging is:

```text
TOP-001 committed (IR-003) -> ONB-06 State A: Group created, Invitation not issued
TOP-002 committed (IR-005) -> ONB-06 State B: Group created, Invitation issued
```

State A retains the confirmed Group header and success treatment and gives the
Invitation area an explicit noninteractive not-issued state. It renders no
Invitation record, verifier, secret, link, code, recipient, copy/share
control, usable-looking placeholder, join claim, invitation-derived navigation,
IR-005 action, IR-006 action, IR-010 action, IR-011 action, or live Group
shell. It is a non-optimistic terminal confirmation. State B retains the
existing real Invitation/link, copy/share, confirmation, and
Invitation-lifecycle behaviour only after IR-005/TOP-002 has separately
server-confirmed an Invitation. IR-003 cannot render State B merely because
Group creation succeeded.

IR-003 never creates an Invitation record, verifier, secret, link, copy/share
behaviour, lifecycle action, or Invitation-derived navigation. IR-005 alone
owns all of those and the issued-Invitation state. Existing clean and annotated
ONB-06 PNGs remain byte-identical State B evidence; State A is accepted in the
contract and manifest only. The pre-authorisation design freeze is complete.
GATE-031 is Satisfied and the separate IR-003 authorisation is recorded; the
next activity is the frozen lane implementation. No agent may improvise a
different ONB-06 variant.

## 10. Future four-lane implementation allow-list

Every path marked **Proposed** is absent at this authorisation HEAD and must be
rechecked at lane start. The current existing shared inputs are read-only in all four
lanes. No lane writes documentation, existing migrations 001–009,
`package.json`, package-lock, deployment/CI, any `artifacts/ir-001/**`,
`artifacts/ir-002/**`, `artifacts/ir-004/**`, or `artifacts/ir-007/**`, or
another lane's paths.

### Lane A — Database / TOP implementation

- Writable: **Proposed**
  `supabase/migrations/010_ir003_atomic_group_bootstrap.sql` only.
- Read-only: this packet; DBM/TOP registers; migrations 006–009; generated
  types; IR-004/IR-007 evidence; accepted architecture/security; Lane B/C/D
  contracts.
- Forbidden: all source, test, evidence-harness/artifact, type, package,
  deployment, and documentation paths; every earlier migration; any later
  TOP/IR table/function/role.
- Prerequisites: GATE-031 Satisfied, separate IR-003 authorisation, fresh
  inspected baseline, and approved Lane A handoff.
- Output/handoff: migration 010 implementing only DBM-014 and TOP-001,
  including exact schema/index/role/grant/revoke contract; migration checksum
  and SQL object catalogue supplied read-only to integration and verification.

### Lane B — Database/contract adversarial tests

- Writable: **Proposed** `tests/database/ir-003/cases/fixtures.sql`,
  `tests/database/ir-003/cases/top-001.matrix.json`,
  `tests/database/ir-003/cases/run-top-001-cases.mjs`, and
  `tests/unit/ir-003-top-001-contract.test.mjs` only.
- Read-only: migration 010 after Lane A handoff, frozen packet/registers,
  current database harness conventions, and Lane C result schema.
- Forbidden: migration/function/role implementation; harness lifecycle,
  artifacts, application, generated types, package, CI, and documentation.
  Lane B must not start/stop Supabase or Docker.
- Prerequisites: a reviewable Lane A migration and the frozen exact contract.
- Output/handoff: audit-safe matrix/results for positive bootstrap,
  unauthenticated/unverified/Profile denial, forged-actor fields,
  cross-Group substitutions, direct-write denial, all-or-nothing injected
  rollback assertions, same-key replay, changed-fingerprint conflict, and
  same-key race assertions. Lane C consumes them as read-only inputs.

### Lane C — Evidence / failure / rollback / performance

- Writable: **Proposed** `tests/database/ir-003/run-top-001-evidence.mjs`,
  `tests/database/ir-003/assert-cleanup.mjs`,
  `tests/database/ir-003/local-docker-cleanup.mjs`,
  `tests/database/ir-003/local-stack/supabase/config.toml`,
  `tests/database/ir-003/empty-target-rollback.sql`,
  `tests/database/ir-003/performance-probes.mjs`,
  `tests/evidence/write-ir-003-evidence-manifest.mjs`, and **Proposed**
  `artifacts/ir-003/**` only.
- Read-only: migration 010, Lane B cases/results, existing local harness,
  DBM-013 generation instruction, and packet/register acceptance thresholds.
- Forbidden: migrations/functions/roles/tables, application/source, generated
  types, Lane B cases, package/CI, and documentation.
- Prerequisites: Lane A and B handoffs, isolated local environment only, and
  an approved evidence run identity. Only this lane starts/stops the isolated
  stack.
- Output/handoff: controlled failure, empty-target rollback/reapplication,
  cleanup, idempotency/concurrency orchestration, plan/performance, safe
  artifacts, write-once final manifest/checksums, and no secret material.

### Lane D — Application / onboarding

- Writable: existing `src/features/auth/AuthBoundary.tsx` only for the
  authenticated-linked onboarding handoff; **Proposed**
  `src/features/groups/bootstrapGroup.ts`, `src/features/onboarding/**`,
  `tests/browser/ir-003/onboarding-bootstrap.spec.ts`, and
  `tests/unit/ir-003-onboarding.test.ts` only.
- Read-only: `src/lib/supabase.ts`, `src/lib/database.types.ts`, `src/App.tsx`,
  accepted screen contract/manifest, TOP-001 result contract, and Lane A/B/C
  handoffs. `src/lib/database.types.ts` is read-only here because its required
  write is exclusively assigned to integration.
- Forbidden: Invitations/links/secrets/TOP-002, Active Group or product-shell
  conversion (`src/App.tsx`, legacy tabs/hooks, and ONB-10), migration/RLS,
  database tests/harness/artifacts, generated types, package/CI, and
  documentation.
- Prerequisites: authorised TOP-001 contract, generated types from integration
  before typed adapter completion, and an Accepted
  `DCC-IR003-FREEZE-001` state contract, GATE-031 Satisfied, and separate
  IR-003 authorisation before any committed-success route is implemented.
- Output/handoff: anonymous-key client adapter with exactly the three RPC
  arguments; ONB-01–05/07 and only the then-Accepted non-Invitation ONB-06
  running-build behaviour and browser/static tests; safe retry/unknown-
  completion handling; no reachable Invitation capability. It hands only
  source/test changes to integration.

The write sets above are disjoint. `src/lib/database.types.ts` is the one
cross-lane-consumed file and is writable by **integration only**, never A/B/C/D;
no shared file has multiple lane writers.

## 11. Integration and independent verification

### Integration worktree

One future integration worktree, after all lane handoffs, may only merge A/B/C/D,
resolve permitted integration conflicts, regenerate
`src/lib/database.types.ts` twice from the authorised clean local schema under
DBM-013 (compare byte-for-byte, then copy verbatim), run the complete frozen
IR-003 checks, verify lane boundaries, and produce one candidate implementation
commit. It owns the type file exclusively. It may not add a migration, field,
role, route, test scope, UI state, invitation capability, deployment change,
or new requirement.

### Fresh detached verifier

A verifier in a fresh detached worktree must independently inspect the
authorised diff rather than reuse implementation reasoning. Its exit evidence
must independently confirm: migration checksum and DBM-014-only ownership;
the exact three-argument RPC and no actor argument; role/BYPASSRLS/grant/search
path confinement; atomic Group/configuration/display-context/Member/Owner/audit
result; rollback under injected failure; same-key replay; changed-fingerprint
conflict; concurrency; forged actor and unverified-actor denial where
applicable; cross-Group/direct-write protection; secret-safe evidence;
performance/plans; ONB reachability; deterministic generated types; exact
cleanup; and absence of TOP-002–TOP-012 or later-packet scope. It retains its
own reviewed, checksum-verified result and cannot make a status decision from
the implementation team's assertions alone.

## 12. GATE-031 controlled evidence package

This section defines the required package schema. The protected package was
independently assessed and GATE-031 is **Satisfied** in
`../gate-031-decision.md`; this does not authorise IR-003. The controlled
non-Git manifest/package holds:

- the real initial Owner `auth.users.id`, approved verification evidence, and
  proof that exactly one Profile links through `profiles.auth_user_id`, with
  the real Profile reference where required;
- one real bootstrap request UUID; reviewed Group name, destination, start/end
  dates, IANA timezone, accounting currency, and frozen display-currency set;
- product, data, security, and architecture approvals;
- baseline and migration checksums, canonical manifest SHA-256,
  secret-safety classification, and retention/location reference.

Git may hold only an opaque controlled-evidence reference, canonical manifest
hash, approval result, and non-sensitive status. It must never contain a real
Auth/Profile UUID, email, access/refresh token, credential, password, service
key, invitation secret, production configuration, or plaintext controlled
manifest. A Git record without the controlled package cannot satisfy the gate.

## 13. Completion and stop conditions

Future IR-003 completion still requires its separately authorised physical
implementation, negative authorization evidence, injected-failure rollback,
race/retry/idempotency/audit/performance evidence, DBM-013 generated types,
ONB running-build evidence, exact cleanup, independent verification, and an
explicit exit decision. This freeze is none of those things.

Stop before implementation for a missing GATE-031 controlled package, an
architecture/security contradiction, a non-ISO or missing accounting display
set, inability to confine elevated capability, any client-supplied authority,
a duplicate/partial outcome, a cross-Group success, a secret leak, a plan or
latency regression, a contradiction of the Accepted
`DCC-IR003-FREEZE-001` state contract, an attempt to render a post-commit
success visual before GATE-031 is Satisfied and IR-003 is separately
authorised, or an attempt to render/alter the issued-Invitation ONB-06 state before IR-005. A
post-commit visual success before IR-005 must follow the Accepted staged
ONB-06 contract and cannot be improvised.
