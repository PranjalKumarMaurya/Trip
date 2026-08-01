# IR-004 Authorisation — Auth, Profile and Session

## Decision

- Decision: **Implemented — not Verified**.
- Authorisation date: 2026-08-01.
- Starting branch: `v2`.
- Starting commit: `9898dd81a60131e7c757465b0b5e2592d8fb1aed`
  (`docs(ir-002): verify tenant foundation and close W1`).
- Entry result: **pass**. The worktree was clean; `git diff --check` passed;
  the accepted IR-001 and IR-002 verification/closure commits are ancestors;
  DBM-001, DBM-002, DBM-013, GATE-007–011, and W1 are verified/complete.
- GATE-012: **Satisfied by this bounded W2 entry decision**. Its sole existing
  requirement is the W1 exit record, which is present in
  `ir-002-verification.md`; this decision is the required separate W2
  product-owner authorisation. It does not satisfy GATE-013 or authorise any
  other W2 packet.

The authorised objective is to replace browser-local persona authority with
Supabase Auth session authority, create one private structural Profile for an
Auth User, and establish the minimum sign-in, recovery, session, sign-out, and
protected-entry experience. A valid linked account stops at the explicit
IR-004 workspace-unavailable boundary. It must not enter the legacy global
Trip workspace until IR-003, IR-007, IR-008, and IR-011 supply their separate
contracts.

## Resolved contract

### DBM-003 — exact Profile/Auth contract

Create exactly `supabase/migrations/008_ir004_profile_auth.sql`.

1. Add nullable `public.profiles.auth_user_id uuid` with a unique constraint
   named `profiles_auth_user_id_key`, referencing `auth.users(id)` with
   `ON DELETE RESTRICT`. `NULL` preserves the IR-002 unlinked structural and
   legacy-compatible state; PostgreSQL unique semantics permit multiple nulls.
   The unique constraint is also the required Auth lookup index.
2. Enable RLS on `public.profiles` and create only the authenticated own-profile
   `SELECT` policy named `profiles_select_own_linked_profile`, using the
   database-derived `auth.uid() = auth_user_id` predicate. There is no browser
   `INSERT`, `UPDATE`, or `DELETE` policy in IR-004. This is Profile privacy
   support, not the Group policy unit DBM-006.
3. Create exactly one `SECURITY DEFINER`, schema-qualified, fixed-search-path
   trigger function named `public.ir004_create_profile_for_auth_user()` and
   one `AFTER INSERT` trigger named `on_auth_user_created` on `auth.users`.
   The function inserts a Profile only for `NEW.id`, stores that ID in
   `auth_user_id`, and derives the required non-empty `display_name` from the
   non-empty `NEW.raw_user_meta_data->>'display_name'`, otherwise the literal
   `Account`. Raw metadata is presentation input only; it is never authority.
   It must use `ON CONFLICT (auth_user_id) DO NOTHING`.
4. The migration must backfill missing Profile rows for existing `auth.users`
   through that same authenticated-account identity, never by matching a
   Profile ID, email, display name, persona, PIN, or legacy `users` row. It
   must not attach any existing unlinked Profile. There is no update/sync
   trigger: later Profile-editing work needs separate authorisation.

An Auth User therefore has at most one Profile and a Profile has at most one
Auth User. The only automatic creation is the one-to-one structural Profile
row. It creates no Group, configuration, membership, Participant, role,
Invitation, audit event, or access grant. The restrictive foreign key prevents
account deletion from silently detaching, transferring, or rewriting Profile
ownership. Account deletion and any resulting membership lifecycle remain
IR-005/IR-007 work.

### Browser/session contract

- `src/lib/supabase.ts` remains the one browser anon-key client and is typed
  with generated `Database`; it may configure only the normal browser Auth
  persistence/refresh/detection options. No service-role key, privileged
  client, remote endpoint, or provider configuration is allowed.
- `src/features/auth/authSession.ts` owns a single session state source:
  `loading`, `signed-out`, `authenticated-linked`, `authenticated-unlinked`,
  and `error`. It initializes from `supabase.auth.getSession()` and subscribes
  to `onAuthStateChange`; the session's `user.id`, never a prop, URL, storage
  value, Profile ID, persona, name, or request value, is the actor.
- `src/features/auth/AuthBoundary.tsx` owns session initialization, refresh and
  terminal-expiry handling, profile lookup, cache clearing, and route choice.
  It must not render a legacy data tab while state is loading, signed out,
  errored, unlinked, or merely authenticated.
- `src/features/auth/AuthEntry.tsx` owns the accepted AUTH forms and invokes
  only Supabase Auth email/password APIs: sign-up with `display_name` metadata,
  password sign-in, password-recovery request, reset completion, and sign-out.
  Provider delivery, verification-link lifetime, redirect allow-list
  configuration, OAuth, MFA, social login, account linking, and remote Auth
  configuration are not authorised. UI can show only the accepted safe
  continuation/error states; it cannot promise delivery or provider lifetime.
- `src/App.tsx` becomes the protected application entry only: it hosts
  `AuthBoundary` and no longer renders a selectable persona, user chip rail,
  navigation, global query tab, or legacy workspace as an authenticated
  fallback. Existing dormant persona/constants code remains source-preserving
  and may not be deleted or repurposed in this packet.

The authorised UI is exactly `SHL-02`, `AUTH-01` through `AUTH-11`, and
`PERM-19` from the accepted manifest, using existing visual tokens/components
without redesign. The linked/no-workspace state is a bounded generic
non-authorizing holding state, not IR-003 onboarding, Group creation,
selection, membership discovery, or Invitation continuation.

## Invariants and security boundary

- Supabase Auth User and its valid session are the only account and actor
  authority. A Profile is structural presentation data, never credentials,
  session proof, role, membership, or Participant identity.
- One Auth User cannot link to multiple Profiles, and one Profile cannot link
  to multiple Auth Users. Cross-account attachment fails by the unique
  constraint, restrictive FK, RLS, and absence of a client attachment path.
- Client-supplied Auth IDs are never trusted. Display names, persona names,
  email text, and legacy plaintext PINs are never credentials or linkage proof.
- An unlinked Profile grants no access. Auth linkage never rewrites stable
  `group_members.id`; account disablement/deletion must preserve historical
  Participant references and never silently transfer ownership.
- Browser persona state ceases to be authority when this boundary is active:
  it neither chooses a session actor nor opens a protected route.

IR-004 establishes session-derived identity, an own-Profile privacy predicate,
and safe no-session/terminal-session boundaries. It does **not** claim complete
RLS, Group membership/Owner authorization, Group data access, Storage,
Realtime, trusted operations, service-role access, production security, or
deployment. DBM-006 / IR-007 later adds deny-by-default Group predicates using
the stable `profiles.auth_user_id` lookup; it must separately establish active
membership, role, archive, and cross-Group denial.

## Session and application flow

1. Start in `loading`; render only AUTH-11-safe shell/loading, no legacy data.
2. `getSession`/Auth event reports no session: clear in-memory UI intent and
   show sign-in (AUTH-01), never PersonaPicker.
3. A valid session supplies the actor. Load only its own Profile through the
   DBM-003 policy.
4. A linked Profile goes to the non-authorizing workspace-unavailable boundary;
   no Group inference and no legacy data query occurs.
5. A missing Profile is `authenticated-unlinked`: show a generic safe state,
   allow sign-out/retry, and grant no access. It must not create/attach a
   Profile from browser input; the Auth trigger/backfill is the sole creator.
6. Supabase refresh updates the state. Terminal expiry, invalid/revoked session,
   or `SIGNED_OUT` clears actor/profile/memory and returns to AUTH-08 then
   AUTH-01. A transient error retains no protected content and shows AUTH-09
   or AUTH-10 with safe retry/input preservation.
7. Sign-out calls Supabase Auth and clears local session/profile/legacy
   navigation state on success. On a network failure, show an error but keep
   the protected entry closed; retry is safe and sign-out is idempotent.
8. Browser reload repeats this state machine. Two test accounts may see only
   their own Profiles; neither gains Group or legacy data authority.

## Allow-list and rollback

### Required paths

| Path | Purpose / change | Rollback |
|---|---|---|
| `supabase/migrations/008_ir004_profile_auth.sql` | DBM-003 schema, trigger, backfill and Profile RLS policy. | Empty isolated target only: drop trigger/function/policy/constraint/column after proving no dependent data; otherwise controlled forward repair. |
| `src/lib/database.types.ts` | DBM-013 generated output after DBM-003. | Regenerate from the prior approved local schema; never edit manually. |
| `src/lib/supabase.ts` | Typed browser Auth client/session options. | Revert only with the AuthBoundary change; no old persona fallback. |
| `src/App.tsx` | Replace active legacy shell with protected Auth entry. | Revert the bounded client release only if it does not reopen persona/global data authority; otherwise secured forward fix. |
| `src/features/auth/authSession.ts` | Session-derived actor state and Auth API adapter. | Revert with the bounded Auth entry. |
| `src/features/auth/AuthBoundary.tsx` | Loading, profile lookup, protected-entry and cache-clearing boundary. | Revert with the bounded Auth entry. |
| `src/features/auth/AuthEntry.tsx` | AUTH screen forms, sign-out and safe errors. | Revert with the bounded Auth entry. |
| `tests/database/ir-004/**` | Isolated local DBM-003 application, Auth fixture, rollback/reapply and cleanup harness. | Remove only the dedicated isolated resources/artifacts. |
| `tests/browser/ir-004/auth-profile-session.spec.ts` | Browser session/entry/Auth-state tests using a local mock/isolated endpoint only. | Delete/revert only this dedicated test. |
| `tests/unit/ir-004-auth-profile-session.test.mjs` | Static contract and no-persona-authority tests. | Delete/revert only this dedicated test. |
| `tests/evidence/write-ir-004-evidence-manifest.mjs` | Immutable IR-004 manifest writer. | Remove only unconsumed IR-004 evidence. |
| `artifacts/ir-004/**` | Dedicated immutable local evidence namespace. | Delete only project-scoped, validated local artifacts. |
| `package.json` | IR-004-only script aliases; no dependency changes. | Remove unconsumed aliases without weakening shared checks. |
| `.github/workflows/ir-004-evidence.yml` | Optional dedicated local-only CI evidence lane. | Revert/disable that workflow only. |
| `docs/implementation-execution/authorisations/IR-004-authorisation.md` | Frozen scope and implementation prompt. | Revert documentation; never use it to undo schema/data. |
| `docs/implementation-execution/packets/IR-004-auth-profile-and-session.md` | Packet status and handoff. | Revert documentation only. |
| `docs/implementation-execution/{database-migration-register,gate-ledger,repository-change-map,implementation-traceability,dependency-graph,execution-order,change-control,README}.md` | DBM/gate/path/traceability/status decision records. | Revert documentation only. |
| `docs/implementation-execution/waves/W2-auth-security-and-trusted-operations.md` | W2 limited-authorisation status. | Revert documentation only. |

### Conditional paths

`tests/database/ir-004/local-stack/supabase/config.toml` and
`tests/database/ir-004/empty-target-rollback.sql` are permitted only when the
dedicated harness needs an isolated Auth-enabled local stack and explicit
empty-target rollback. `src/components/ui/Modal.tsx` is permitted only if the
accepted non-dismissible expiry dialog cannot be composed without a narrowly
reviewed accessibility fix; no visual redesign or unrelated primitive edit is
allowed.

### Prohibited paths and work

All other `src/**`, including tabs, data hooks, `PersonaPicker`, `UserChips`,
legacy constants, styles, modals, Edge Functions, and product components; all
legacy migrations `001`–`007`; `supabase/seed.sql`; Supabase configuration
outside the dedicated local test fixture; `package-lock.json`; environment
files; existing IR-001/IR-002 tests, manifests, artifacts, or workflows;
architecture and UI-design documents; remote projects; deployment/cutover
files. No Group bootstrap, membership lifecycle, Invitations, claims, Events,
Todos, finance, RLS completion, Storage, Realtime, production-data conversion,
or paid entitlement work is authorised.

## Database plan and generated types

| DBM | Filename / dependency | Forward operation | Validation and rollback | Risk / transaction |
|---|---|---|---|---|
| DBM-003 | `008_ir004_profile_auth.sql`; DBM-001/002/013 verified. | The exact nullable unique restrictive Auth FK, RLS/policy, one Auth insert trigger, and identity-only backfill defined above. | Check column/FK/unique/trigger/policy; prove duplicate link, nonexistent Auth ID, cross-account profile read, browser direct write, and Auth deletion all deny; create two Accounts and their Profiles; empty-target rollback then clean reapply. | No legacy or target history is deleted. The DDL/backfill is one transaction; empty-target down path is only before dependent data. Later populated failure uses forward correction. |
| DBM-013 | Same migration and isolated local schema only. | Generate `src/lib/database.types.ts` twice with pinned Supabase CLI `2.105.0`, `--local --schema public`; record migration filename/checksum and both output checksums. | Byte-for-byte equal output, includes `profiles.auth_user_id`; typecheck/build pass. | Generated output is never hand-edited and does not prove RLS. |

## Tests, evidence, and anti-loop contract

The implementation must add no dependency. It reuses the IR-001 local
capability and IR-002 cleanup/type provenance only where their semantics are
unchanged; it never changes their manifests. Required immutable stages under
`artifacts/ir-004/<run-id>/` are `clean-application`, `schema-validation`,
`auth-profile-constraints`, `profile-privacy`, `session-browser`,
`type-generation-pass-1`, `empty-target-rollback`, `clean-reapplication`,
`type-generation-pass-2`, `type-comparison`, `typecheck-test-build`,
`cleanup`, and `final-manifest`.

Required assertions cover: one-to-one linkage/nullability/restrict deletion;
invalid and cross-account attachment; trigger/backfill idempotence; session
actor over client input; no-session, expired-session, reload, loading, error,
sign-in success/failure, recovery/reset safe failure, sign-out success/failure;
two-account Profile separation; no persona/name/PIN authority; no legacy app
query before later contracts; generated types; empty-target rollback/reapply;
exact cleanup; and no credential/token/email/password/private endpoint in
artifacts. Browser tests use synthetic accounts and mock/local-only services;
they never contain a service-role key or contact a remote project.

`npm run test:ir002` is intentionally not an IR-004 command: its accepted
harness freezes the IR-002 migration set at `001`–`007` and its immutable
evidence semantics cannot be changed for `008`. Its later expected migration-
set refusal is neither an IR-002 defect nor an IR-004 blocker. IR-004 instead
uses its own isolated migration/evidence harness and its own manifest.

`package.json` may add exactly these aliases and no dependency: `test:ir004`
(`node tests/database/ir-004/run-auth-profile-session.mjs`),
`test:ir004:cleanup` (`node tests/database/ir-004/assert-cleanup.mjs`),
`test:ir004:browser` (`PLAYWRIGHT_BROWSERS_PATH=0 playwright test
tests/browser/ir-004/auth-profile-session.spec.ts`), `test:ir004:unit`
(`node --test tests/unit/ir-004-auth-profile-session.test.mjs`), and
`test:ir004:evidence` (`node tests/evidence/write-ir-004-evidence-manifest.mjs`).
Frozen implementation and verification commands are `npm run
test:ir004:cleanup`, `npm run test:ir004`, `npm run test:ir004:browser`, `npm
run test:ir004:unit`, `npm run test:types`, `npm run typecheck`, `npm run
build`, `npm run test:ir004:cleanup`, and `npm run test:ir004:evidence` with
the completed run ID. The harness owns its `supabase start/stop` calls only in
its dedicated local test directory. Verification reruns exactly those commands
and checks the immutable final manifest, allow-list, migration/type checksums,
and rollback proof. A directly invoked shared-tool failure blocks only when it
reproduces from this authorised clean start and prevents required evidence.

Ordinary defects within this allow-list are correctable without new
authorisation when they preserve the objective, DBM-003, no-dependency and
local-only boundaries. Architecture/design/scope changes, any new provider or
configuration, Group/Invitation/lifecycle work, RLS beyond own Profile,
legacy conversion, production/remote access, new dependency, or changed
IR-001/IR-002 evidence semantics require change control. A verifier may not
retroactively add Group bootstrap, Invitations, final RLS, a production
provider/project, or unrelated shared evidence requirements.

## Completion, gates, and commit sequence

Implementation commits should remain bounded: (1) DBM-003 and local harness;
(2) session/protected-entry UI; (3) generated types and dedicated tests;
(4) immutable evidence and completion documentation. No IR-003 work may be
combined.

IR-004 becomes **Implemented** only after all allow-listed code/schema/tests,
two type generations, immutable local evidence, rollback/reapply, cleanup,
accessibility checks for its accepted AUTH states, and a completion record
pass. It becomes **Verified** only after independent review confirms those
artifacts, two-account separation, session-derived actor, own-Profile privacy,
safe session boundaries, exact allow-list, rollback proof, secret safety, and
no later work. GATE-013 remains unsatisfied until IR-007 and IR-008 separately
produce the full W2 Auth actor, deny-by-default, service-role, and trusted
operation evidence. IR-004 verification alone does not authorise IR-003.

Stop immediately for an unexpected HEAD/dirty worktree; architecture or
Profile/Auth ownership contradiction; need for Group bootstrap, Invitation,
lifecycle, RLS completion, destructive legacy conversion, production
credential/remote project/new dependency/UI redesign/deployment/cutover; any
IR-003-or-later requirement; or modification of verified IR-001/IR-002
evidence semantics. The next packet after IR-004 verification is IR-007,
never IR-003.

## Post-acceptance implementation prompt

```text
Implement authorised IR-004 only from
docs/implementation-execution/authorisations/IR-004-authorisation.md.
Start by proving branch v2, HEAD 9898dd81a60131e7c757465b0b5e2592d8fb1aed
or its authorised descendant, clean worktree, and clean diff. Modify only the
frozen allow-list. Create only 008_ir004_profile_auth.sql for DBM-003 exactly
as specified: nullable unique restrictive profiles.auth_user_id, own-Profile
privacy, one Auth-user creation trigger and identity-only backfill. Use only
the dedicated isolated local harness; never link, inspect, access, or deploy a
remote/production Supabase project. Implement only the session-derived Auth
boundary and accepted AUTH/SHL-02/PERM-19 states. A linked account must not
render legacy tabs or Group onboarding. Do not touch legacy migrations/seed,
persona source files, product hooks/tabs, Edge Functions, IR-001/IR-002
evidence, architecture/UI-design docs, dependencies, deployment, or any
IR-003+ scope. Generate database types twice with Supabase CLI 2.105.0 and
produce the immutable IR-004 stages. Stop for any scope, architecture,
dependency, remote, or design change. Do not mark IR-004 Verified or GATE-013
satisfied.
```

## Documentation records owned by this authorisation

`packets/IR-004-auth-profile-and-session.md`, `database-migration-register.md`,
`gate-ledger.md`, `repository-change-map.md`, `implementation-traceability.md`,
`dependency-graph.md`, `execution-order.md`, `waves/W2-auth-security-and-trusted-operations.md`,
`change-control.md`, and `README.md` record this decision only.

## Implementation completion record

- Implementation run: `ir004-20260801-auth-profile-session-final`, local and
  isolated only.
- DBM-003 applied from `008_ir004_profile_auth.sql` with checksum
  `fd8775bc1a666d01424e4537ef4b5e6715dd2c171199f7d34d12fb5f9be40190`.
- DBM-013 was generated twice with Supabase CLI `2.105.0`, `--local --schema
  public`; both outputs were byte-identical with checksum
  `8cad1b46109a2ab1e13b036f0e8b24adb07c78dc52db2ca65fdfde06e8fe33b2`.
- The immutable final manifest records successful schema, constraint, privacy,
  two-account browser boundary, rollback/reapplication, type, build, and
  cleanup stages. Artifact inspection found no credentials, tokens, password,
  or service-role material.
- This is an implementation completion record only. Independent verification
  remains required; GATE-013 remains unsatisfied, W2 remains in progress, and
  IR-003, IR-007, and IR-008 remain unauthorised.

## Correction implementation record — F-IR004-VER-001

- Correction run: `ir004-20260802-stale-profile-resolution-race-final`, local
  and isolated only.
- `src/features/auth/authSession.ts` now uses a monotonic session/profile
  resolution generation. Sign-out, expiry, session replacement, user changes,
  and effect cleanup invalidate older Profile lookups before they can commit.
- Dedicated deferred-promise tests prove stale Profile results cannot restore
  signed-out or expired authority, cannot replace Account B with Account A,
  and still resolve the current session normally.
- The new immutable manifest records successful schema, privacy, browser,
  rollback/reapplication, deterministic-type, type/build, and cleanup stages.
  DBM-003 and DBM-013 checksums remain unchanged.
- This correction record does not change status: IR-004 remains Implemented —
  not Verified; independent verification remains required. GATE-013 remains
  unsatisfied, W2 remains in progress, and IR-003, IR-007, and IR-008 remain
  unauthorised.
