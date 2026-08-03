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
