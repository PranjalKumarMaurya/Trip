# Execution Order

IR-001, IR-002, IR-004, IR-007, and DBM-006 are Implemented and Verified; W1
is complete. IR-008 is Implemented, not Verified for the common
trusted-operation contract/register and static immutable evidence only; zero
physical operations, DBM units, or migrations are implemented and all physical
owners remain unauthorised. Under `CC-W2-GATE013-20260804`, GATE-013 is the W2
common contract/readiness gate and remains Not satisfied pending IR-008's
unchanged independent verification; physical owner-packet execution evidence
is not its input. GATE-015 remains unchanged and blocks W3 entry. W2 remains
in progress, and W3 through W7, deployment, and cutover remain unauthorised.
The accepted roadmap order remains authoritative.

## W1 — Evidence and tenant foundation

- Mandatory entry gate: GATE-002 through GATE-005: package acceptance/lock,
  explicit IR-001 authorisation, and the reviewed repository-visible
  environment-boundary inventory. A test runner, browser/RLS harness, CI,
  isolated test project, deployed-state inventory, or source snapshot is not
  required before IR-001 begins.
- Internal packet order: IR-001 establishes reproducible evidence and fixture capability before IR-002 defines executable Tenant data work. IR-022 belongs to W5; this Wave may record only its normal project evidence, not treat IR-022 as started.
- Permitted parallel work: Static traceability and environment inventory may be prepared beside IR-001. IR-002 is serial after IR-001 because its parent-path and deny-by-default transition plan must be testable.
- Mandatory serial boundary: IR-002 follows IR-001 exit. IR-001 must establish
  or record the exact W1-exit blocker for the test/database/RLS/browser/CI
  capability; this capability is not a circular prerequisite to begin IR-001.
- Schema dependencies: IR-002 verified the Group-as-Tenant, structural Profile,
  stable Participant/group_members identity, configuration, archive/audit,
  parent-derived foreign keys, and generated-type provenance foundations.
- Trusted-operation dependencies: None is implemented. IR-002 supplies the ownership and configuration invariants consumed by IR-003 and IR-008.
- Security dependencies: Two-account/two-Group fixtures, parent-derived scope, and a deny-by-default transition strategy must be defined before W2.
- UI dependencies: Accepted UI design is reference-only; W1 has no feature UI implementation.
- Migration dependencies: Legacy row inventory and source-to-target parent mapping are planning inputs only; no transform or production data action is permitted.
- Test dependencies: IR-001 must establish deterministic clocks, fixture isolation, evidence/checksum conventions, failure injection, and a reviewed tooling/CI decision or record the exact blocker.
- Mandatory exit evidence: Isolated fixture/schema capability, parent-path and two-Group test design, environment/secret boundary record, and W1 blocker register.
- Rollback checkpoint: No authoritative change may start; correct the capability or ownership-model gap before W2.
- Stop conditions: Stop for missing isolated fixture capability, ambiguous parent ownership, or a proposed permissive transition.

## W2 — Auth, security, and trusted operations

- Mandatory entry gate: W1 ownership model passes, safe environment boundary is recorded, and GATE-012 has a separate bounded authorisation.
- Internal packet order: IR-004 Auth/Profile/session contract precedes IR-007 RLS/ownership matrix; IR-007 precedes IR-008 trusted-operation boundary. No authoritative lifecycle operation starts in W2.
- Permitted parallel work: AUTH screen/fixture traceability and table-policy test-case design may be prepared beside IR-004, but no RLS authority decision precedes the session-derived actor contract and no operation contract precedes IR-007.
- Mandatory serial boundary: IR-004 → IR-007 → IR-008.
- Schema dependencies: IR-004 consumes the IR-002 Profile identity plan; IR-007 defines policy foundations for the IR-002 Tenant hierarchy and the later membership/document/finance tables.
- Trusted-operation dependencies: IR-008 freezes narrow server/trusted-operation contract and ownership boundaries only after direct table access is deny-by-default by design. It implements no physical operation, migration, function, RPC, Edge Function, browser action, or type refresh.
- Security dependencies: Session-derived identity, inactive/removed-member denial, two-Group substitution tests, service-role confinement, and a no-permissive-transition rule.
- UI dependencies: AUTH and pre-auth SHL state contracts are traceability inputs only; no locked design asset is changed.
- Migration dependencies: DBM-003 is verified for IR-004's Profile/Auth and
  own-Profile privacy contract. DBM-006 is verified only in
  `009_ir007_base_rls_ownership.sql`; it cannot add tenant-aware legacy product
  access. Its accepted evidence is final, and future-target requirements cannot
  reopen IR-007.
- Test dependencies: IR-001 capability, Auth expiration/continuation fixtures, two-account/two-Group negative cases, replay/race cases for later operations, and audit-safe failure evidence.
- Mandatory exit evidence: verified Auth/session privacy and deny-by-default
  ownership RLS; verified common trusted-operation contract/readiness; frozen
  TOP inventory/physical-owner map; `auth.uid()`-first current
  membership/role/archive revalidation requirements; transaction, idempotency,
  concurrency, audit, secret-safety, no-generic-proxy, and no-browser-
  service-role requirements. Physical TOP implementation/execution,
  injected-failure rollback, idempotency/concurrency/audit execution, and
  operation-specific performance evidence are mandatory only at the owning
  physical packet exit.
- Rollback checkpoint: Target paths remain inaccessible until security evidence passes; no permissive fallback.
- Stop conditions: Stop for a browser service-role route, client authority, policy gap, or cross-Group success.

## W3 — Group lifecycle, storage, and realtime

- Mandatory entry gate: GATE-015 after W2 exit; its semantics are unchanged.
- Internal packet order: IR-003 bootstrap precedes IR-005 lifecycle; IR-005 precedes IR-006 claiming. IR-009 and IR-010 may run in parallel only after IR-005, IR-007, and IR-008 are satisfied.
- Permitted parallel work: Private Storage and authorised Realtime may run in parallel after lifecycle and trusted-boundary gates. Claiming remains serial after membership.
- Mandatory serial boundary: IR-003 bootstrap precedes IR-005 lifecycle; IR-005 precedes IR-006 claiming. IR-009 and IR-010 may run in parallel only after IR-005, IR-007, and IR-008 are satisfied.
- Schema dependencies: IR-003 consumes the IR-002 Tenant/configuration model; IR-005 adds Membership/Invitation/role lifecycle; IR-006 adds stable claim constraints; IR-009 consumes document metadata; IR-010 consumes current membership authorization.
- Trusted-operation dependencies: Bootstrap, invitation/lifecycle, participant claim, and any Storage/realtime authorization use the IR-008 boundary. IR-009/IR-010 must not invent a bypass.
- Security dependencies: Owner/Member-only authority, opaque invitation secrets, atomic acceptance/claim, inactive-member denial, private object substitution denial, current authorization on subscription, and no global notification centre.
- UI dependencies: ONB, GRP, INV, MBR, CLM, PERM, DOC, and RT Screen/Component contracts are locked inputs; implementation waits for the relevant packet gate.
- Migration dependencies: Participant identity and public-object source inventory feed IR-016; no source row receives authority merely from a name, emoji, PIN, or public URL.
- Test dependencies: Two accounts/two Groups; invitation expiry/revoke/replay; last-Owner; concurrent bootstrap/claim; private object substitution; Group switch/unsubscribe/reconnect/stale event fixtures.
- Mandatory exit evidence: Atomic bootstrap/lifecycle/claim evidence and private/realtime two-Group evidence; no partial authority.
- Rollback checkpoint: No partially created Group, Membership, claim, private object, or subscription authority may be exposed; retain safe state and reconcile.
- Stop conditions: Stop for ownerless/unconfigured Group, invitation replay, claim ambiguity, public object access, or stale realtime delivery.

## W4 — Product feature conversion

- Mandatory entry gate: W3 scoped foundations pass.
- Internal packet order: IR-011 Active Group/data access is serial first. IR-012 Events/Todos, IR-013 Documents, IR-014 Finance, and IR-015 FX/destination may use parallel lanes only after their stated dependencies.
- Permitted parallel work: Events/Todos, Documents, Finance, and FX/destination may proceed in parallel after IR-011; shared contracts and changed files require an explicit integration checkpoint.
- Mandatory serial boundary: IR-011 Active Group/data access is serial first. IR-012 Events/Todos, IR-013 Documents, IR-014 Finance, and IR-015 FX/destination may use parallel lanes only after their stated dependencies.
- Schema dependencies: IR-011 consumes Group/membership scope; IR-012 defines Group Events/Todos; IR-013 consumes private document metadata; IR-014 defines normalized finance; IR-015 consumes configuration/FX fields.
- Trusted-operation dependencies: Event/Todo protected writes, document reconciliation, finance settlement recording, and sensitive configuration must use their registered IR-008 boundary; no tab issues a browser-authoritative mutation.
- Security dependencies: Clear old Group state before new subscriptions/queries, deny archived or removed access, make presentation audiences non-confidential, keep documents private, preserve exact finance, and deny cross-Group substitutions.
- UI dependencies: SHL, RT, GRP, CFG, FIN, DOC, and the five current tab flows use the accepted 462-screen mapping. Shared App/data-hook/modal files require the named integration checkpoint before concurrent lanes merge.
- Migration dependencies: Current global/name-scoped Events, Todos, document URLs, finance records, static FX, and Bali configuration become IR-016 source inputs; no transform runs in W4.
- Test dependencies: Group switching, loading/error/empty/read-only/offline/reconnect/stale states, finance fixtures EQ-01/SET-01/USD-01, document reconcile/orphan, timezone/FX fallback, and applicable R-02 running-build evidence.
- Mandatory exit evidence: FP/UI/TC implementation evidence plan, fixture coverage, safe incomplete-path disablement, and no active design divergence.
- Rollback checkpoint: Feature-specific rollback must preserve Group boundaries, exact finance history, and reconciled document state.
- Stop conditions: Stop for global query, name authority, float accounting, public document route, or a design-contract contradiction.

## W5 — Migration and integrated evidence

- Mandatory entry gate: W3–W4 required records and operations complete, plus
  GATE-019 read-only deployed-state/source inventory and GATE-020 reviewed
  transform exception inventories. Those external inputs first block W5, not
  W1.
- Internal packet order: IR-016 transform and manifest design is serial after its product dependencies. IR-021 joins completed evidence lanes. IR-022 maintains gate evidence throughout and must be current before W6.
- Permitted parallel work: IR-022 governance recording can run throughout; IR-021 evidence preparation can run after its dependent packet evidence exists. No transform execution overlaps an unresolved security or parity failure.
- Mandatory serial boundary: IR-016 transform and manifest design is serial after its product dependencies. IR-021 joins completed evidence lanes. IR-022 maintains gate evidence throughout and must be current before W6.
- Schema dependencies: All reviewed W1–W4 schema units, generated types, parent mappings, archive semantics, and exact finance/document transformations are inputs; IR-016 does not create a new product rule.
- Trusted-operation dependencies: Replay/idempotency/audit evidence for bootstrap, invitation, claim, document reconciliation, finance, and configuration must be retained in IR-021’s rollup.
- Security dependencies: No manifest or reconciliation success can waive RLS/Storage/Realtime negative cases; quarantine is required for ambiguous source values.
- UI dependencies: IR-021 checks FP/UI/TC/IPE result evidence against the accepted screen/component mapping without redesigning or replacing a locked export.
- Migration dependencies: IR-016 owns transform ordering, count/checksum manifests, quarantine, rerun/idempotency, source preservation, and reconciliation; IR-022 owns the gate ledger and approval records only after its W5 entry conditions are met.
- Test dependencies: Representative fixtures, two-Group isolation, finance fixtures, document/private-object checks, real-time checks, migration reruns, rollback, and R-02 evidence rollup.
- Mandatory exit evidence: Transform, reconciliation, traceability, and quarantine evidence design; every retained item mapped or excepted.
- Rollback checkpoint: No production execution. Failed transform units quarantine and retain source evidence; no silent repair.
- Stop conditions: Stop for count/checksum mismatch, unreviewed mapping, missing evidence, or any waived security failure.

## W6 — Rehearsal, recovery, and cutover preparation

- Mandatory entry gate: W5 evidence and gate ledger, plus GATE-022 isolated
  representative rehearsal environment, safely handled snapshot,
  backup/recovery capability, and retention owner. Production authority is not
  an entry input.
- Internal packet order: IR-017 representative rehearsal/recovery evidence precedes IR-018 freeze, delta, and cutover preparation.
- Permitted parallel work: Monitoring-plan refinement may be prepared beside rehearsal, but no cutover preparation may overtake failed recovery evidence.
- Mandatory serial boundary: IR-017 representative rehearsal/recovery evidence precedes IR-018 freeze, delta, and cutover preparation.
- Schema dependencies: Rehearsal uses only reviewed W1–W5 schema/migration units in an isolated environment; no production schema or data action is authorized.
- Trusted-operation dependencies: Failure injection covers operation timeout/replay/partial results without bypassing the registered authorization/audit boundary.
- Security dependencies: Rehearsal must prove policy/Storage/Realtime isolation remains intact through recovery, stale client, rollback, and maintenance behavior.
- UI dependencies: Recovery, maintenance, migrated Bali Group, loading/error/read-only, and connection states are checked against locked design contracts; any divergence invokes design change control.
- Migration dependencies: IR-017 supplies repeated representative rehearsal, timing, manifest/checksum, S01–S13/S18 recovery, rollback, and quarantine evidence. IR-018 consumes that evidence for preparation only.
- Test dependencies: Failure injection, timing thresholds, recovery run repetition, two-account/two-Group smoke, R-02 implementation evidence available at that stage, and retained audit-safe artifacts.
- Mandatory exit evidence: Representative recovery and freeze/delta evidence; production remains unauthorised.
- Rollback checkpoint: Remain on secured source and choose an approved forward-fix or rollback plan; no cutover on failure.
- Stop conditions: Stop for unproven recovery, impossible rollback, unresolved release blocker, or missing final authority.

## W7 — Authorised cutover, monitoring, and containment

- Mandatory entry gate: GATE-024 separate production authorisation and
  GATE-025 production cutover inputs, plus all prior gates. Package or packet
  review never provides this authority.
- Internal packet order: IR-019 separately authorised cutover precedes IR-020 monitoring and containment.
- Permitted parallel work: No production-affecting parallelism is presumed. Monitoring preparation can exist before cutover but activation/containment decisions follow authorised release governance.
- Mandatory serial boundary: IR-019 separately authorised cutover precedes IR-020 monitoring and containment.
- Schema dependencies: IR-019 follows the separately authorized final migration/policy/Storage/Realtime plan; IR-020 observes and contains results. No new schema design is introduced in W7.
- Trusted-operation dependencies: Final smoke verifies registered operations confirm server truth, preserve idempotency/audit evidence, and never expose a browser service-role route.
- Security dependencies: Security activation is atomic; same-Group success and unrelated-Group denial, inactive/removed denial, private-object and subscription scope checks are release blockers.
- UI dependencies: Only locked design implementation is smoke-tested; no visual redesign or execution-packet approval authorizes a change.
- Migration dependencies: Final freeze, reviewed final delta, manifest/checksum reconciliation, abort/rollback trigger, and no insecure legacy re-enable are mandatory.
- Test dependencies: Two-account/two-Group release smoke, R-02 running-build acceptance evidence, migration/reconciliation checks, monitoring/containment exercises, and retained release decision record.
- Mandatory exit evidence: Deployed reconciliation, monitoring, retention, and secured legacy-containment evidence.
- Rollback checkpoint: Use the approved cutover recovery decision; never re-enable insecure legacy access merely to restore service.
- Stop conditions: Abort for any security activation failure, two-Group isolation failure, smoke-test failure, or unavailable approved recovery path.

W7 remains separately authorised; packet/package review never authorises production cutover or deployment.
