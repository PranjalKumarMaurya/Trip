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
