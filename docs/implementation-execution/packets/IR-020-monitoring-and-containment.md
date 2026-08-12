# IR-020 — Monitoring and containment
## 1. Status and ownership

- Status: Draft
- Wave: W7
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: No

## 2. Objective

Plan post-release monitoring, reconciliation, security containment, incident categories, retention evidence, and secure legacy disposition.

## 3. Authoritative inputs

Migration plan S17–S19; security model; roadmap IR-020; IR-022 governance.

The accepted documents govern; this Draft packet does not restate or amend their decisions.

## 4. Entry gate

Verified exit evidence for IR-019, IR-022., clean repository, accepted design mapping, and no unresolved prerequisite security or architecture contradiction.

## 5. Dependencies

- Direct IR dependencies: IR-019, IR-022.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Draft operation/migration/reconciliation/security denial monitoring, cross-Group attempt handling, document orphan/claim/settlement/realtime incidents, containment, rollback/forward-fix decision, and sensitive-log exclusions.

## 7. Explicitly out of scope

Production monitoring implementation, re-enabling permissive legacy access, sensitive log leakage, or assuming operations tooling exists.

## 8. Current repository state

No observability stack, deployment configuration, release telemetry, incident
runbook, retention configuration, or production environment record is present
in the repository. The Verified IR-001 CI evidence workflow exists but does not
provide release monitoring or deployment authority.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| `Proposed path — verify at packet start: artifacts/operations/` | Proposed path | Future reconciliation/incident evidence | IR-020 | Critical | Operations review |
| `Proposed path — verify at packet start: release/containment-runbook.md` | Proposed path | Future containment runbook | IR-020 | Critical | Release authority |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

No schema work in Draft. Define retention/reconciliation evidence needs; do not assume database logging tables exist.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

No browser operation. Containment and recovery authorities are separate operations/release concerns.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

Monitor private-object mismatch/orphan/reconciliation without logging document contents or public paths.

## 14. Realtime work

Monitor subscription failures, stale authorization, and unexpected delivery; contain by disabling unsafe path rather than broadening access.

## 15. Frontend implementation

No UI implementation. Use locked outage/read-only/recovery communication states for later manual verification.

## 16. Design traceability

No primary visual screen by scope; recovery/monitoring design references are related evidence only.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

S17–S19 monitoring/reconciliation/containment/retention; never re-enable insecure source to restore service.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

S17–S19, release/security/data evidence.

## 20. Automated tests

Use current test tooling only where it exists. Repository inspection found no configured test, lint, database-test, browser-test, or CI runner; any new tooling is a proposed dependency for review under IR-001. Planned coverage may include unit, integration, database/RLS, browser, concurrency, idempotency, migration, rollback, visual-regression, and accessibility automation only after the selected tooling and environment capability are approved.

## 21. Manual verification

Inspect affected locked screen states; keyboard/focus behavior; screen-reader announcements; responsive 480px-shell behavior; offline/reconnect/stale behavior; multi-tab behavior; and two-account/two-Group isolation. Where applicable, inspect archive/removal/current-user-change states and browser/device-specific safe-area/native chooser behavior.

## 22. R-02 accessibility obligations

Applicable running-build evidence must cover contrast measurement, touch-target measurement, keyboard order, visible focus, focus trap, focus restoration, connected errors, reduced motion, screen-reader loading/success/error announcements, realtime announcements, and safe-area behavior where relevant.

**R-02 remains open until verified on the running implementation.**

## 23. Observability

Use structured, audit-safe operation results and failure classification; correlation/reference identifiers; security-event evidence; reconciliation status; and release monitoring where applicable. Exclude passwords, tokens, full Invitation secrets, service-role credentials, private document contents, and unnecessary personal data.

## 24. Rollback and recovery

Define packet boundary, reversible and irreversible work, safe stop, data preservation, schema/application rollback, partial failure handling, reconciliation, and release-blocking conditions before implementation. Do not imply all migrations are reversible.

## 25. Implementation sequence

1. Define monitored events and sensitive-data exclusions. 2. Define alert/containment authority. 3. Define reconciliation/retention evidence. 4. Review forward-fix/rollback decision points. 5. Preserve final disposition.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Draft status cannot satisfy this gate.

## 28. Open questions

Operations tooling, retention policy, incident owner, and production telemetry are Not established by current repository inspection.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This Draft packet neither marks the packet complete nor authorises implementation.
