# Implementation Execution Change Control

## Current baseline

- Execution package status: Accepted
- Execution package lock: Complete
- Planning freeze: Complete

## Controlled changes

Wave order, IR scope, repository change paths, database migration plan, RLS plan, trusted operations, design mapping, tests, rollback, R-02 requirements, and release gates require an explicit change record.

## Required record

- change ID and reason;
- affected Wave/IR, paths, DBM/TOP units, requirements, fixtures, and evidence;
- affected Gate IDs, security cases, tests, R-02 obligations, and rollback layers;
- architecture, design, security, migration, rollback, and release impact;
- reviewer/decision/status;
- traceability and open-item update.

## Rules

- No implementation executor may silently modify locked scope.
- Architecture-affecting changes use architecture change control.
- Design divergence uses accepted UI/UX design change control.
- Migration, RLS, trusted-operation, Storage, Realtime, and release changes require their specialist reviewers.
- A change cannot imply packet/Wave authorisation, implementation start, or W7 cutover authority.
- No locked change may be implemented before approval.

## CC-IR001-20260731 — Verification environment authority decision

- Decision authority: Product owner.
- Scope: IR-001 Evidence Foundation verification only.
- Authoritative execution environment: GitHub Actions on `ubuntu-22.04`,
  Node 22, Playwright 1.55.1, and Supabase CLI 2.105.0.
- Authoritative evidence: controlled browser failure and privacy transform,
  browser manifest, database normal/controlled-failure/recovery evidence,
  database manifest, durable exact Docker cleanup, and hosted artifacts.
- Accepted local limitations: the current local host uses Playwright's
  unsupported-host Ubuntu 20.04 fallback; controlled browser-failure staging
  screenshots are not consistently reproduced locally; exact local Docker
  resources can transiently reappear despite project-scoped stop before a
  final clean exact-resource state.
- Decision: those local limitations are non-blocking for IR-001 because the
  authoritative hosted browser and database lanes passed in run `30627419186`,
  their reviewed artifacts passed privacy/path/secret/allow-list/checksum
  checks, local unit/type/build and database assertions passed, final local
  exact-resource inspection was empty, no production or external Supabase
  resource was used, and `SEC-IR001-001` is closed.
- Boundaries: this decision establishes no general local-environment policy and
  does not authorise deployment, migration rehearsal, cutover, or IR-002.
- Rollback: revert this documentation-only decision and restore the previous
  IR-001 verification status surfaces; no implementation state is altered.

## CC-IR002-20260801 — Tenant data foundation authorisation closure

- Decision authority: Product owner.
- Scope: DBM-001, DBM-002, and DBM-013 only, as frozen in
  `authorisations/IR-002-authorisation.md`.
- Reason: resolve Profile/Auth, bootstrap membership, physical configuration,
  audit, migration-name, type-provenance, and local-evidence blockers before
  implementation begins.
- Decision: authorise the exact IR-002 allow-list and local-only execution
  boundary; no implementation is performed by this record.
- Architecture impact: none. Group remains the Trip Tenant; Auth remains
  authoritative; Participant remains `group_members.id`; no separate
  Participants table is introduced.
- Gate impact: this authorisation was exercised and independently verified.
  GATE-011 is satisfied and W1 is complete; GATE-012 and separate W2
  product-owner authorisation remain required. Deployment and cutover remain
  blocked.
- Review/rollback: corrections inside the frozen correction class are permitted
  without a new product-owner authorisation. All other changes return here or
  to architecture/design change control. Reverting this record removes only
  documentation authorisation, never schema or data.

## CC-IR004-20260801 — Auth, Profile and Session authorisation

- Decision authority: Product owner.
- Scope: only the frozen IR-004 allow-list and DBM-003 in
  `authorisations/IR-004-authorisation.md`.
- Decision: GATE-012 is satisfied by verified W1 evidence and this separate
  W2 entry decision. IR-004 may implement a local-only Auth/Profile/session
  boundary; it is not Implemented or Verified by this record.
- Architecture impact: none. Auth remains authoritative; Profile stays
  presentation-only; Group remains the Trip Tenant; `group_members.id` stays
  the stable Participant identity. The sole physical resolution is nullable
  one-to-one `profiles.auth_user_id` with restrictive deletion, trigger-owned
  Profile creation, and own-Profile privacy.
- Scope impact: no Group bootstrap/onboarding, Owner, Invitation, lifecycle,
  claim, Group-data RLS, Storage, Realtime, legacy conversion, remote/production
  Auth, provider configuration, dependency, redesign, deployment, or cutover.
- Evidence/rollback: immutable `artifacts/ir-004/**`, local empty-target
  rollback/reapply, deterministic types, and exact cleanup are required before
  implementation completion. Corrections remain bounded as specified there;
  every other change returns to change control.

## CC-IR004-20260801-implementation — Auth/Profile/session implementation record

- Scope: the accepted IR-004 allow-list only; no architecture or product scope
  change.
- Result: DBM-003, Auth/Profile privacy, the session/protected-entry boundary,
  local-only tests, deterministic generated types, rollback/reapplication, and
  immutable evidence completed in `ir004-20260801-auth-profile-session-final`.
- Evidence: migration checksum
  `fd8775bc1a666d01424e4537ef4b5e6715dd2c171199f7d34d12fb5f9be40190`; two
  local Supabase CLI `2.105.0` type outputs byte-identical at
  `8cad1b46109a2ab1e13b036f0e8b24adb07c78dc52db2ca65fdfde06e8fe33b2`; exact
  isolated local resources were absent after cleanup.
- Gate/status impact: IR-004 is Implemented, not Verified. GATE-013 remains
  unsatisfied and W2 remains in progress. This record authorises neither
  IR-003 nor IR-007/IR-008, deployment, or cutover.

## CC-IR004-20260802-verification — Corrected Auth/Profile/session verification

- Scope: documentation-only closure of the accepted IR-004 verification; no
  architecture, product, implementation, or evidence-artifact change.
- Decision: the accepted independent verifier returned **VERIFIED** at
  correction commit `71e689932f5c40bcc0f1cc4a42b226331e8b7daa` for
  F-IR004-VER-001. The original immutable run
  `ir004-20260801-auth-profile-session-final` and corrected immutable run
  `ir004-20260802-stale-profile-resolution-race-final` remain unchanged.
- Status impact: IR-004 and DBM-003 are Verified; no IR-004 correction remains.
  The frozen GATE-013 contract is not satisfied because IR-007 and IR-008 have
  not supplied their RLS/two-Group and trusted-operation/service-role evidence.
  W2 remains in progress; IR-007 is next to authorise but is not implemented.
  IR-003, deployment, and cutover remain unauthorised.
- Verification boundary: no criterion was added retroactively. Only a future
  reproducible defect that violates the frozen IR-004 contract can reopen
  correction or change control. This record creates no IR-007 authorisation and
  no W2-completion, deployment, or cutover authority.

## CC-IR007-20260802 — Base ownership RLS authorisation

- Decision authority: Product owner.
- Scope: only DBM-006 and the exact current-schema, evidence, rollback, and
  four-lane allow-list in `authorisations/IR-007-authorisation.md`.
- Decision: reserve only `009_ir007_base_rls_ownership.sql`; authorise IR-007
  and DBM-006, with implementation not started.
- Security boundary: legacy product tables become browser fail closed; no
  tenant-aware product access, Group bootstrap/lifecycle, Invitations, Storage,
  Realtime, or trusted operation is authorised. The public `tickets` bucket
  remains an IR-009/release risk, not an IR-007 exit blocker.
- Gate/status impact: GATE-013 remains Not satisfied and W2 remains In
  progress. IR-008, IR-003, deployment, and cutover remain unauthorised.
- Review/rollback: empty-target rollback never restores a permissive policy;
  populated targets remain fail closed and use forward correction. Reverting
  this record removes documentation authority only and creates no security or
  release authority.

## CC-IR007-20260803-implementation — Base ownership RLS implementation record

- Scope: the accepted IR-007 four-lane allow-list and DBM-006 only; no
  architecture, product, dependency, application, Storage, Realtime, trusted
  operation, remote, deployment, or cutover scope changed.
- Result: `009_ir007_base_rls_ownership.sql` applied as migration `009` after
  migrations `001`–`008`, with SHA-256
  `b4be413120833b6be6aa282bd5a02d5c3dcdf9c25b50e9e0e388921516a45873`.
  The exact policy/function/grant catalogue, all 40 executable security cases,
  empty-target fail-closed rollback, clean reapplication, and exact local
  cleanup passed. The 10 future-target cases remain deferred and are excluded
  from the pass/fail result.
- Evidence: immutable local-isolated run
  `ir007-1785780852521-160759ec-cd35-4143-ad82-512d22d7094d` has a passing
  final manifest with 12 SHA-256-validated references. Its frozen 200-Group,
  20-active-member-per-Group, 200-inactive-membership, 20-archived-Group, and
  20,000-audit-row fixture passed warmed p95 timings of 1.752 ms
  (Group/configuration), 1.867 ms (roster LIMIT 100), 1.236 ms (cross-Group
  denial), 1.327 ms (Profile/active-membership), and 1.570 ms (Owner audit
  LIMIT 100). Plans had no sequential scan of `profiles` or `group_members`,
  no protected-row-proportional authorization loop, no temporary-file spill,
  and used the selective active-membership index path.
- Generated types: Supabase CLI `2.105.0` generated the local `--schema public`
  output twice; both outputs were byte-identical at SHA-256
  `2134e239b47ef04eeafcfa3165082b4b590895b6fde4a192dc2ba7201842976b` and the
  tracked output was copied verbatim from generation.
- Implementation commit chain: `092a7cd1e8a62c18cda5f674a90fe55ad45f847c`,
  `a00dd58a5fcd90081c22539b2610e114cab39ce2`,
  `9e82e2a9e4894648f7d04363fa598e3e61228aed`,
  `37ebdb677386abdf624d74dcea82e7a85cba406a`,
  `3b13033a0fa0ebfcd5400b9a337a91dc86609ae3`,
  `29784e00744d86a45c57933aee3e6dfe30868334`, and
  `55e03440bc1ed7e704748d50cf8a2f8c599697aa`.
- Gate/status impact: DBM-006 and IR-007 are Implemented, not Verified.
  GATE-013 remains Not satisfied and W2 remains In progress pending
  independent IR-007 verification and IR-008's separate trusted-operation/
  service-role evidence. IR-008, IR-003, deployment, and cutover remain Not
  authorised.

## CC-IR007-20260804-verification — Accepted independent verification closure

- Decision: **VERIFIED**. The independent verifier accepted immutable evidence
  run `ir007-1785780852521-160759ec-cd35-4143-ad82-512d22d7094d` for
  `009_ir007_base_rls_ownership.sql` (SHA-256
  `b4be413120833b6be6aa282bd5a02d5c3dcdf9c25b50e9e0e388921516a45873`) and
  generated database types (SHA-256
  `2134e239b47ef04eeafcfa3165082b4b590895b6fde4a192dc2ba7201842976b`).
- Closure: IR-007 and DBM-006 transition from Implemented to Verified. No
  correction packet is required and no IR-007 implementation defect remains.
  The accepted verification evidence is final; later-packet requirements,
  including the 10 deferred security cases owned by their future target
  packets, cannot reopen IR-007.
- Gate/status impact: GATE-013 remains Not satisfied only because IR-008's
  trusted-operation/service-role evidence is absent under its existing frozen
  contract. W2 remains In progress. IR-008 is the next packet to authorise;
  IR-003, Storage (IR-009), Realtime (IR-010), product conversion, deployment,
  and cutover remain unauthorised.
- Boundary: this is a verification-status record, not a correction packet or a
  scope-changing change-control action. It creates no implementation, database
  execution, deployment, or cutover authority.

## CC-W2-GATE013-20260804 — Trusted-operation evidence ownership correction

- Reason: the prior GATE-013 reading demanded physical trusted-operation
  rollback evidence before W2 could exit. W2 therefore could not exit,
  GATE-015 prevented W3 entry, IR-003 could not begin, TOP-001 physical
  evidence could not exist, and GATE-013 could not be satisfied.
- Decision: prospectively redefine GATE-013 as the W2 common
  trusted-operation contract/readiness gate. It requires verified Auth/session
  and deny-by-default ownership RLS boundaries; the verified common contract;
  frozen TOP inventory and physical-owner map; `auth.uid()`-first actor
  derivation; current membership, role, and archive revalidation;
  transaction, idempotency, concurrency, audit, and secret-safety obligations;
  and the prohibitions on a generic trusted-operation proxy and browser
  service-role authority.
- Exclusion: GATE-013 does not require an implemented TOP, physical operation
  execution, injected-failure rollback execution, actual idempotency,
  concurrency, or audit execution, or operation-specific performance evidence.
  Those requirements are neither deleted nor weakened; they move with their
  physical operation to its owner packet exit.
- Physical evidence ownership: TOP-001 → IR-003; TOP-002–TOP-007 → IR-005;
  TOP-008 → IR-006; TOP-009–TOP-010 → IR-014; TOP-011 → IR-015; TOP-012 →
  IR-013, consuming IR-009 private-object evidence. Every owner packet retains
  actual implementation, authorization, authoritative transaction,
  all-or-nothing mutation, injected-failure rollback, idempotency,
  concurrency/race evidence, audit emission, secret-safe evidence, and
  operation-specific performance evidence.
- IR-008 boundary: IR-008 remains contract-only. Its accepted authorisation
  and independent-verification criteria are unchanged; this is only a
  prospective change-control supersession of the GATE-013 ownership reading.
- Gate/status impact: GATE-015 is semantically unchanged and remains the
  separate W3-entry gate after W2 exit; GATE-014 continues to apply to IR-006
  where recorded. No current status transitions: IR-008 remains Implemented,
  not Verified; GATE-013 remains Not satisfied; W2 remains In progress;
  GATE-015 remains Not satisfied; and IR-003 remains Not authorised.
- Implementation impact: documentation only. This record authorises and
  implements no IR, TOP, migration, function, generated type, test, artifact,
  deployment, or cutover.
- Rollback: revert this documentation-only correction to restore the prior
  GATE-013 ownership reading; no implementation state is altered.

## CC-IR008-20260804-verification — Accepted independent verification closure

- Decision: **VERIFIED** for evidence run
  `ir008-20260804-trusted-operation-contracts`.
- Accepted anchors: exactly 12 TOP contracts; exactly 13 adversarial
  obligations; 12 evidence stages; 11 manifest-referenced artifacts; and every
  SHA-256 validated. All required unit, contract, repository-test, type,
  typecheck, and build commands passed; secret safety passed; and no blocking
  defect or in-scope correction remains.
- Boundary: verification confirms zero physical trusted-operation
  implementations, DBM units, migrations, SQL/RPC/Edge Functions, application
  changes, generated-type changes, package/dependency changes, or migration
  `010`; no generic proxy and no browser service-role use. It verifies the
  frozen common contract only and does not absorb physical-owner evidence.
- Status/gate impact: IR-008 transitions from Implemented to Verified.
  Corrected GATE-013 is Satisfied from verified IR-004, IR-007, and IR-008
  common readiness evidence only; no physical TOP evidence is required. Every
  frozen W2 exit criterion passes, so W2 transitions from In progress to
  Complete.
- Downstream boundary: GATE-015 remains Not satisfied and requires a separate
  W3-entry review; it is not satisfied by W2 completion. IR-003 is the next
  physical packet eligible for separate entry review and authorisation planning
  only, and remains Not authorised. GATE-031 remains an additional IR-003
  authorisation blocker pending validated initial Owner Auth identity, reviewed
  bootstrap request/execution manifest, mandatory Group configuration, and
  product/data/security/architecture approvals.
- Other status boundary: IR-005 and later physical owners, Storage, Realtime,
  product conversion, deployment, and cutover remain Not authorised.
- Implementation impact: documentation-only governance. No physical TOP,
  migration, function, source, database, deployment, or cutover work occurred.

## CC-IR003-20260812-preauthorisation-freeze — Atomic bootstrap design freeze

- Decision authority: documentation-only pre-authorisation freeze. This is not
  an IR-003 implementation authorisation, GATE-031 approval, or reviewer exit
  decision.
- Reason: the verified W2/GATE-015 baseline left one valid next physical
  packet, IR-003, blocked solely by GATE-031. Its physical DBM/RPC,
  display-context, idempotency, privileged-execution, performance, evidence,
  lane, integration, verification, and controlled-evidence contracts needed a
  bounded future design before controlled identity/request evidence is prepared.
- Scope: IR-003 / W3; DBM-014; TOP-001; proposed migration
  `010_ir003_atomic_group_bootstrap.sql`; future IR-003-only test/evidence and
  onboarding paths. Affected documents are the IR-003 packet, DBM/TOP
  registers, repository change map, test/evidence plan, W3 record, and this
  record. No accepted architecture or screen export is edited.
- Decision: reserve DBM-014 for one absent migration 010 only; freeze the
  minimum child display-currency set under the existing configuration authority;
  freeze the exact three-argument `bootstrap_group(jsonb, jsonb, uuid)` RPC;
  use a dedicated `NOLOGIN NOINHERIT BYPASSRLS` SECURITY DEFINER owner with
  fixed `pg_catalog` search path and authenticated-only execute; and keep
  idempotency TOP-001-specific. The future four lane write sets are disjoint,
  generated types are integration-only after the authorised schema, and a
  detached verifier is mandatory.
- Design impact: none. ONB-06 remains an accepted composite screen. Its issued
  Invitation link/copy/share behaviour stays unreachable and unimplemented
  until IR-005/TOP-002. A linkless rendered successor would require separate
  accepted-design change control; no replacement screen is created here.
- Security/migration/rollback impact: forced RLS remains the base; browser
  service-role and generic privileged proxy remain forbidden. The later owner
  must prove atomic failure rollback, idempotent retry/race convergence,
  privilege confinement, plans/performance, immutable secret-safe evidence,
  and exact cleanup. No existing migration, RLS policy, function, role,
  generated type, artifact, or remote state changes.
- Gate/status impact: IR-001, IR-002, IR-004, IR-007, and IR-008 remain
  Verified; GATE-013 remains Satisfied; W2 remains Complete; GATE-015 remains
  Satisfied for W3 entry. GATE-031 remains **Not satisfied**; IR-003 and W3
  implementation remain **Not authorised**; no physical TOP, deployment, or
  cutover is authorised.
- Controlled evidence rule: the future non-Git GATE-031 package holds real
  Owner/Auth/Profile linkage evidence, reviewed configuration/request, four
  approvals, checksums/hash, classification, and retention reference. Git can
  retain only an opaque reference, manifest hash, approval result, and
  non-sensitive status; it never receives IDs, email, credentials, tokens,
  secrets, production configuration, or plaintext controlled manifest.
- Rollback: reverting this documentation-only freeze removes no database or
  product state. Any later implementation issue remains subject to the frozen
  empty-target/forward-correction boundary and separate change control.

## CC-IR003-20260812-bootstrap-success-blocker — ONB-06 correction record

**Historical proposal/blocker record.** Its current disposition is recorded by
the status-synchronisation record below; this retained text
preserves the finding and proposal history.

- Decision authority: documentation-only correction record. It does not accept
  a design change, authorise IR-003, satisfy GATE-031, or create a physical
  operation.
- Reason: review finding `F-IR003-FREEZE-001` proved the original
  implementation-reachability clarification incomplete. The accepted ONB-06
  is a composite “Group created + invitation link issued” state, while
  Invitation issuance is TOP-002 / IR-005. IR-003 must show a committed
  Group-created result without claiming an Invitation, but no current accepted
  screen permits that rendering.
- Scope: record `BLK-IR003-FREEZE-001`, open item `OE-006`, and proposed UI/UX
  design record `DCC-IR003-FREEZE-001` only. The proposal adds a staged
  non-Invitation success state to the existing ONB-06 Screen ID if Accepted;
  it does not add a screen, change visual tone/layout beyond the necessary
  state split, or alter TOP ownership.
- Decision: Outcome B — existing accepted design does not resolve the
  post-TOP-001 success transition. The proposal remains **Proposed** under the
  locked-design process. No accepted screen contract, manifest, export,
  component catalogue, architecture decision, database contract, or
  application path is changed here.
- Security and scope impact: IR-003 continues to create no Invitation row,
  verifier, secret, link, copy/share behaviour, or Invitation-derived
  navigation. TOP-002/IR-005 and ONB-10/IR-011 ownership remain unchanged.
  `F-IR003-FREEZE-002` additionally makes the existing dedicated executor
  model auditable through an exact object-by-object privilege matrix; it does
  not alter DBM-014, the migration name, TOP-001 signature, persistence,
  performance, lanes, or GATE-031 fields.
- Gate/status impact: GATE-015 remains Satisfied. GATE-031 remains **Not
  satisfied**. IR-003, every physical TOP, deployment, and cutover remain **Not
  authorised**. `OE-006` blocks controlled GATE-031 package preparation and
  IR-003 onboarding completion until the design decision is Accepted or a
  bounded replacement is recorded.
- Rollback: this correction records no physical state. Reverting it removes
  only the documentation pointer; it cannot be used to bypass the locked
  design decision or undo a later implementation.

## Status synchronisation — DCC-IR003-FREEZE-001 acceptance

- Source decision authority: Product owner.
- Source decision: `DCC-IR003-FREEZE-001 — Accepted` on 2026-08-12. This
  record accepts no additional DCC, implementation scope, or authorisation.
- Scope: W3 only; existing `ONB-06` only; primary affected packets IR-003 and
  IR-005. State A is IR-003/TOP-001's committed, server-confirmed **Group
  created, Invitation not issued** terminal confirmation. State B is
  IR-005/TOP-002's separately committed **Group created, Invitation issued**
  state. No Screen ID, Component ID, visual-system, responsive, navigation,
  tenant-model, W4+, architecture, security, product-feature, database, or
  TOP ownership changes.
- Export decision: the existing ONB-06 clean and annotated PNGs remain
  byte-identical and are documented as State B evidence. State A is accepted
  in the screen contract and manifests; no unreviewed image asset is created
  or claimed to depict it.
- Status impact: `BLK-IR003-FREEZE-001` and `OE-006` are Resolved; the IR-003
  pre-authorisation design freeze is Complete. GATE-015 remains Satisfied.
  GATE-031 remains **Not satisfied**; IR-003 and IR-005 remain **Not
  authorised**; no physical TOP, migration 010, W3 implementation, deployment,
  or cutover is authorised.
- Next activity: prepare the controlled GATE-031 evidence package and redacted
  Git record.
- Rollback: this documentation-only accepted amendment changes no physical
  state. Any future replacement of the staged ONB-06 contract requires a new
  bounded design change decision.

## CC-IR003-20260821-authorisation — Atomic Group bootstrap implementation entry

- Decision authority: Product owner / separate bounded IR-003 authorisation
  authority.
- Decision timestamp: `2026-08-21T02:21:46+05:30`.
- Prerequisites: GATE-015 and GATE-031 are Satisfied. The GATE-031 decision is
  `gate-031-decision.md`; its controlled canonical evidence SHA-256 is
  `b255c36c8249db35f5cf711054dfee28fca0858904a2900426e2e0951dc65e2a`.
- Decision: IR-003 is **Authorised — implementation not started**. The
  authority is recorded in `authorisations/IR-003-authorisation.md` and is
  limited to its frozen DBM-014/TOP-001 scope and four non-overlapping lanes.
- Boundary: Atomic Group/configuration/display-currency/initial-Owner/audit/
  TOP-001 idempotency work and ONB-06 State A only. Invitation issuance and
  State B remain IR-005/TOP-002; IR-006, IR-009, IR-010, IR-014, IR-015,
  IR-016, TOP-002–TOP-012, deployment, and cutover remain unauthorised.
- Integration and verification: a later integration owner alone merges lane
  outputs and refreshes generated types; a fresh independent verifier must
  assess the candidate before any Verified decision.
- Status impact: IR-003 is Authorised, not Implemented, and not Verified.
  Migration `010`, TOP-001, and IR-003 Group/configuration/member state remain
  absent. No remote mutation, deployment, or push is authorised by this record.

## CC-IR003-20260821-top001-wrapper-clarification — PostgreSQL compiler boundary

- Decision authority: bounded IR-003 implementation-deviation adjudication.
- Decision: **Accepted minimal physical implementation clarification**.
- Reason: PostgreSQL 17 independently rejects a PL/pgSQL function that uses
  `request_id` for both an input parameter and a `RETURNS TABLE` output
  parameter (`parameter name "request_id" used more than once`). Changing
  either public name would violate the frozen TOP-001 RPC contract.
- Scope: only the compiler-required wrapper/helper form inside the already
  authorised migration `010_ir003_atomic_group_bootstrap.sql`. It changes no
  request field, result field, logical TOP ownership, DBM object ownership,
  data model, UI/API route, or later-packet scope.
- Public contract: the sole application-callable function remains exactly
  `public.bootstrap_group(group_request jsonb, configuration_request jsonb,
  request_id uuid) RETURNS TABLE (outcome text, group_id uuid, request_id
  uuid)`, with exactly three named arguments, no defaults, no overload, no
  actor parameter, and the same safe result. It alone is granted to
  `authenticated`; `PUBLIC`, `anon`, and `service_role` have no `EXECUTE`.
- Implementation boundary: the one permitted helper,
  `public.ir003_bootstrap_group_impl(jsonb, jsonb, uuid)`, is non-application-
  callable machinery only. It receives no `EXECUTE` from `PUBLIC`, `anon`,
  `authenticated`, or `service_role`; it is not a PostgREST/browser route, a
  generic proxy, another logical TOP, or an API with its own contract. Both
  functions are owned by `ir003_top001_executor`, are `SECURITY DEFINER`, use
  fixed `search_path = pg_catalog`, and retain the existing qualified-object,
  least-privilege, `NOLOGIN NOINHERIT BYPASSRLS` confinement. The helper has
  only the authority required to perform this one approved operation and may
  be reached only through the wrapper by application callers.
- Transaction and result boundary: the wrapper adds no transaction control or
  state. The helper executes inside the caller transaction; Group,
  configuration/display rows, Member/Owner, audit, and TOP-001 idempotency
  state therefore remain one atomic outcome. Actor binding, normalized
  fingerprint, same-key serialization, replay, changed-fingerprint conflict,
  and the safe three-field result are unchanged.
- Required later proof: Lane B must adversarially prove direct helper denial
  for `anon`, `authenticated`, and `service_role`; absence of `PUBLIC`
  `EXECUTE`, helper overloads, and alternate bootstrap RPCs; wrapper-only
  success with the exact public signature/result; identical owner,
  `SECURITY DEFINER`, fixed search path, and no executor-role inheritance; and
  no helper path that bypasses actor/request validation, idempotency, or
  rollback. Independent verification must repeat those checks against the
  integrated migration.
- Status impact: GATE-031 remains Satisfied. IR-003 remains **Authorised**,
  not Implemented and not Verified. This record authorises no remote migration,
  bootstrap execution, deployment, or push.

## CC-IR003-20260821-audit-request-id-scope — TOP-001 compatibility correction

- Decision authority: bounded IR-003 compatibility/change-control decision.
- Decision: **IR-003 AUDIT REQUEST-ID CORRECTION APPROVED**.
- Finding: Lane B adversarial testing reproduced a deterministic cross-actor
  failure. Migration `007_ir002_configuration_archive_audit.sql` creates
  `public.group_audit_events.request_id` with the global unique constraint
  `group_audit_events_request_id_key`. Migration `010` correctly claims
  TOP-001 idempotency by `(operation, actor_profile_id, request_id)`, but also
  writes the caller UUID to the bootstrap audit row. A second validated actor
  using the same UUID receives a distinct valid idempotency claim and then
  fails at the inherited audit constraint.
- Ownership and original meaning: migration `007` is IR-002 / DBM-002's
  immutable audit-table baseline, while IR-007 / DBM-006 owns its later
  RLS/read boundary. The IR-002 authorisation says `request_id` is unique but
  supplies no contract making it a global operation-idempotency authority.
  The later authoritative IR-008/IR-003 contracts define request ID as
  correlation/idempotency data and assign TOP-001 replay authority exclusively
  to IR-003's `ir003_bootstrap_requests`. The original reason for a global
  uniqueness scope is not otherwise documented. It cannot override the later
  frozen cross-actor TOP-001 rule or become a hidden public replay contract.
- Accepted correction: in migration `010`, before defining TOP-001, drop
  `group_audit_events_request_id_key` and create the required non-unique
  btree `group_audit_events_request_id_idx (request_id)`. TOP-001 continues to
  store the unchanged caller `request_id` in exactly one committed
  `group_bootstrapped` audit row. Do not generate or derive a replacement audit
  UUID, and do not add an audit composite uniqueness constraint. The migration
  must retain `ir003_bootstrap_requests` with primary key
  `(operation, actor_profile_id, request_id)` as the sole TOP-001 idempotency
  authority.
- Option evaluation: A is accepted because it preserves the frozen key,
  correlation, and audit lookup while removing only the incompatible global
  replay effect. B and C are rejected because replacing the caller correlation
  value with generated/derived audit values changes the audit meaning and
  weakens direct request-to-event evidence. D is rejected because global
  request-ID idempotency changes the frozen public replay contract and
  cross-actor independence. No repository-supported alternative exists: the
  audit table has no authoritative operation or actor-Profile columns with
  which to create a correct substitute uniqueness key.
- Data, security, and architecture compatibility: **PASS**. Duplicate UUIDs
  across actors are valid correlation values; duplicate UUIDs for the same
  TOP-001 actor remain prevented by the IR-003 primary key. The non-unique
  index preserves correlation lookup. Authorization, actor binding, forced RLS,
  direct-write denial, audit actor/group foreign keys, safe replay, and
  concurrency semantics are unchanged. The correction neither alters the
  public `bootstrap_group` signature nor Owner/configuration semantics, adds a
  TOP, expands Group lifecycle, or crosses into IR-005+ work. It is compatible
  with the accepted Data, Security, and Architecture GATE-031 approvals.
- Baseline classification: **VALID FORWARD EVOLUTION IN MIGRATION 010**.
  Migration `007` remains immutable. DBM-014 may forward-alter its inherited
  constraint to satisfy the later authorised TOP-001 contract; this does not
  reopen IR-002's audit foundation or IR-007's accepted RLS baseline.
- Required Lane B regression and verifier proof: (1) two distinct validated
  actors use the same UUID with distinct valid payloads and both bootstrap,
  each with one Group, one actor-scoped request record, and one audit event;
  (2) prove the two audit rows retain that same caller UUID; (3) same
  actor/same UUID/same normalized payload replays one stored result and leaves
  one audit row; (4) same actor/same UUID/changed fingerprint returns only
  `idempotency_conflict` with no additional Group or audit row; (5) concurrent
  same-actor/same-key calls converge to one Group/request/audit result; and
  (6) request-ID lookup uses the non-unique audit index without turning the
  audit table into idempotency authority. The independent verifier must repeat
  these checks against the integrated migration and confirm migrations
  `001`–`009` are byte-for-byte unchanged.
- Status impact: GATE-031 remains Satisfied. IR-003 remains **Authorised**, not
  Implemented and not Verified. This record changes no SQL, remote state,
  deployment, or push; migration `010` still contains the identified defect
  until the separately authorised implementation correction is applied.

## CC-IR003-20260821-performance-correction-design — ownership decision

- Decision: **IR-003 PERFORMANCE DESIGN BLOCKED**.
- Scope: a disposable, isolated Lane C performance-correction design review
  only. No production migration, function, role, table, test harness,
  generated type, remote target, deployment, or Lane D path changed.
- Root cause: confirmed. `public.is_valid_iana_timezone(text)` is the shared
  IR-002 / DBM-002 function defined by immutable migration `007`. It is a
  `STABLE`, `SECURITY INVOKER` SQL function with `search_path = pg_catalog`;
  it accepts a slash-qualified candidate only when it occurs exactly in
  `pg_catalog.pg_timezone_names`. TOP-001 evaluates it explicitly and the
  inherited `group_configurations.timezone` CHECK evaluates it again. A
  successful bootstrap therefore makes exactly two calls.
- Option A rejected: removing the explicit TOP-001 validation leaves one
  authoritative CHECK evaluation and no new schema, but the exact frozen
  10-worker/100-distinct fixture measured p95 `65.255 ms` (limit `40 ms`) and
  p99 `69.750 ms` (limit `75 ms`). Its direct constraint failure also becomes
  safe `operation_failed`, rather than the existing `invalid_request`
  validation category, unless further exception translation is added. It is
  neither a threshold pass nor an exact public-behaviour preservation.
- Option B rejected pending separate ownership: the only tested threshold-pass
  design is an ordinary persistent reference table populated from the current
  PostgreSQL timezone catalogue, with a primary-key lookup by exact timezone
  name. It contained 1,151 names, had no set difference from the catalogue,
  and measured p95 `12.095 ms`, p99 `13.405 ms`, max `13.837 ms` for the
  frozen 10-worker workload. It would require a new persistent shared schema
  object, executor `SELECT`, and `CREATE OR REPLACE` of the IR-002 validator.
  A migration-time snapshot is not automatically refreshed by PostgreSQL or
  OS tzdata upgrades, so it changes the validated set unless an owned refresh
  process is added. DBM-014 is expressly limited to the display child,
  TOP-001 idempotency, executor/grants, and bootstrap RPC; it also forbids any
  other project-defined dependency. This shared DBM-002 evolution and its
  maintenance ownership are not authorised by the IR-003 authority. The
  current validator is `PUBLIC`-executable (and appears in generated public
  database types), so its security-invoker replacement would also require
  browser-role `SELECT` on the reference table to preserve direct calls, or a
  global SECURITY DEFINER posture change. Neither exposure/posture decision is
  in IR-003 authority.
- Option C rejected: the native `timezone(candidate, current_timestamp)`
  prototype accepted every current catalogue name but also accepted
  lowercase `asia/kolkata`; the existing exact catalogue comparison rejects
  it. It therefore cannot preserve the frozen case-sensitive boolean contract
  without reintroducing a shared exact-name reference.
- Option D: migration `011` is **NOT AUTHORISED**. The authorisation and
  migration register reserve only `010_ir003_atomic_group_bootstrap.sql`; no
  migration-011 reservation or authority exists.
- Required future authority: a separately authorised shared DBM-002 forward
  evolution must choose the reference data, exact refresh trigger/operator,
  tzdata-upgrade reconciliation, grants/RLS exposure, rollback/forward repair,
  and physical migration location. It must then require the timezone subset of
  Lane B (canonical, unusual, invalid, null, blank, CHECK, rollback, replay,
  changed fingerprint, and cross-actor UUID) and a complete fresh Lane C rerun
  using unchanged p95 `<= 40 ms` and p99 `<= 75 ms` thresholds, followed by
  independent verification. Until then, no correction location is approved.
- Status impact: GATE-031 remains Satisfied; IR-003 remains Authorised and not
  globally Implemented or Verified; Lane C remains BLOCKED; Lane D remains
  isolated; Travel migration `010` remains unapplied. The next action is to
  obtain the missing shared-contract and maintenance authority, not to alter
  migration `010` or create migration `011`.

## CC-IR003-20260821-shared-dbm002-remediation-freeze — supplemental design review

- Decision: **SHARED DBM-002 REMEDIATION DESIGN BLOCKED**.
- Scope: documentation-only shared-validator design/governance review. It
  records no implementation authority and changes no migration, function,
  role, table, generated type, remote state, deployment, or Lane D path.
- Classification: a required **shared DBM-002 forward evolution for W3**, not
  a reopening of immutable `007` and not an IR-003/DBM-014-owned change.
- Finding: the accepted/current contract is live, exact, case-sensitive
  `pg_catalog.pg_timezone_names` membership subject to the existing
  slash-qualified lexical guard. A persistent indexed reference relation is
  the only measured threshold-pass design, but every table/materialized/
  scheduled/protected-refresh variation is stale between catalogue drift and
  reconciliation. A hybrid preserves removals only by checking the live
  catalogue on each indexed hit, defeating the measured latency benefit.
- Unresolved blocker: no authority has approved an evolution from live
  catalogue semantics to an application-maintained reference set. The detailed
  physical candidate, conditional maintenance/security model, migration-option
  analysis, approval matrix, and regression/verifier obligations are frozen in
  `ir-003-shared-dbm-002-remediation-freeze.md`; that record does not select
  the conditional design as an approved implementation.
- Governance: GATE-031 remains historically Satisfied for the original
  reviewed package but may not be reused for the shared contract. Use existing
  bounded supplemental change control, Product/Data/Security/Architecture
  approvals, separate shared DBM-002 authorisation, then an IR-003
  authorisation amendment. No new gate ID, migration number, or implementation
  authority is created here.
- Status: Lane C remains blocked; IR-003 remains Authorised but not globally
  Implemented or Verified; Lane D remains isolated; Travel migration `010`
  remains unapplied; no deploy, push, or remote mutation occurred.

## CC-IR003-20260822-product-timezone-semantics — supplemental Product decision

- Decision authority: Product owner, for the user-visible timezone-validity
  contract only.
- Decision timestamp: `2026-08-22T21:06:34+05:30`.
- Decision: **PRODUCT TIMEZONE SEMANTIC EVOLUTION APPROVED**. Timezone
  validity moves from automatic live `pg_catalog.pg_timezone_names` membership
  to a controlled application-approved IANA reference set. Exact,
  case-sensitive matching, the existing slash-qualified lexical guard, aliases
  that are in the approved set, the public logical validator signature, and no
  silent stored-value rewrite are preserved.
- Drift behaviour: a PostgreSQL/OS/platform tzdata change does not itself
  change application validity. Additions require governed reconciliation before
  becoming valid; removals/renames must be identified through reconciliation.
  Known drift and validation-dependent availability are governed later by the
  required Data, Security, and Architecture integrity decision.
- Rationale/evidence: the live frozen ten-worker p95 was approximately
  `119 ms`; removing the duplicate call remained approximately `65 ms`; the
  indexed controlled-reference prototype measured `12.095 ms` p95 and
  `13.405 ms` p99 against frozen `<= 40 ms`/`<= 75 ms` limits. The performance
  evidence motivates semantics only and selects no physical implementation.
- Non-approval boundary: no relation or private-schema design, security
  posture, owner/grants, maintenance/drift implementation, migration placement
  or renumbering, shared implementation, Data/Security/Architecture approval,
  shared DBM-002 authorisation, or IR-003 amendment is approved.
- Gate/status impact: GATE-031 remains historically Satisfied for the original
  package. IR-003 remains Authorised, not globally Implemented or Verified;
  Lane C remains blocked and Lane D remains isolated. Migration `010` remains
  unapplied; no deploy, push, or remote mutation is authorised.
- Next governance dependency: the Product-semantic blocker is resolved.
  **READY FOR SUPPLEMENTAL SHARED DBM-002 CHANGE-CONTROL DECISION** to select
  physical design, M3/migration placement, maintenance/security model, and
  required independent Data, Security, and Architecture approval inputs.

## CC-IR003-20260916-shared-dbm002-proposal — supplemental change control

- Decision: **SHARED DBM-002 CHANGE CONTROL APPROVED FOR REVIEW**.
- Scope: freeze one technical proposal for Product-approved controlled
  timezone-reference semantics. It selects the private relation/control model,
  deterministic committed dataset model, protected public validator, drift and
  reconciliation boundary, and M2 placement proposal. It is documentation only
  and neither implements nor authorises the shared evolution.
- Ownership: shared DBM-002 forward evolution, consumed by IR-003; not an
  IR-003/DBM-014-owned schema change. Historical migration 007 is immutable.
  Existing 010 remains immutable at SHA-256
  5c3ca06dfe29cf5388686559d124adc4ea507e9445a52c93d79d181221f4ec4f.
- Proposed placement: reserve, but do not create or authorise,
  011_ir002_timezone_reference.sql after 010. TOP-001 remains unavailable
  until both migrations and required shared evidence are approved and verified;
  no renumbering is proposed.
- Required next decisions: independent Data, Security, and Architecture review
  records against ir-003-shared-dbm-002-change-control-proposal.md, followed
  by separate shared DBM-002 authority if all required decisions pass. GATE-031
  stays historically Satisfied. A later IR-003 amendment, Lane-B regression,
  full Lane-C rerun, integration, and fresh independent verification remain
  required.
- Status: IR-003 remains Authorised but not globally Implemented or Verified;
  Lane C remains blocked; Lane D remains isolated; shared remediation is not
  implementation-authorised. No remote mutation, deployment, or push occurred.
