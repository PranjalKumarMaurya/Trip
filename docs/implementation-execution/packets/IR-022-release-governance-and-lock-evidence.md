# IR-022 — Release governance and lock evidence
## 1. Status and ownership

- Status: Draft
- Wave: W5
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: No

## 2. Objective

Maintain gate ledger, decision records, packet/Wave approvals, scope controls, DEF review, readiness review, and separate W7 authorization evidence.

## 3. Authoritative inputs

Architecture README; deferred-scope register; roadmap IR-022; UI design change control; all packet evidence.

The accepted documents govern; this Draft packet does not restate or amend their decisions.

## 4. Entry gate

Verified exit evidence for IR-001 through IR-016 gate inputs., clean repository, accepted design mapping, and no unresolved prerequisite security or architecture contradiction.

## 5. Dependencies

- Direct IR dependencies: IR-001, IR-002, IR-003, IR-004, IR-005, IR-006, IR-007, IR-008, IR-009, IR-010, IR-011, IR-012, IR-013, IR-014, IR-015, IR-016.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Draft governance ledger structure, evidence ownership, decision/change records, Wave/packet status rules, final readiness review, design/architecture amendment boundaries, and separate W7 authorization.

## 7. Explicitly out of scope

Claiming a gate passed without evidence, scope drift, accepting/locking this Draft package, authorising implementation, or delaying a required decision.

## 8. Current repository state

Accepted architecture, UI baseline, UI design, and implementation-execution
package records exist under `docs/`. The execution ledger, packet set, Wave
records, verification records, and current status surfaces exist. No release
runbook, deployment record, deployment authority, or cutover record exists.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| docs/implementation-execution/ | New Draft package | Execution governance/evidence plan | IR-022 | Medium | Package review |
| docs/ui-design/design-change-control.md | Existing accepted input — read only | Locked design change process | IR-022 | Medium | Cross-control review |
| docs/product/deferred-scope-register.md | Existing accepted input — read only | DEF-001–DEF-012 authority | IR-022 | Medium | Scope audit |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

No database work.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

No trusted operation implementation; register evidence ownership for operation approvals.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

No Storage work; retain release evidence about private Storage gates.

## 14. Realtime work

No Realtime implementation; retain current-authorization gate evidence.

## 15. Frontend implementation

No UI implementation; require design divergence process before implementation changes a locked contract.

## 16. Design traceability

All accepted Screen/Component IDs and tokens remain locked. This packet references, never alters, design change control.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

Maintain approvals, exception records, manifests, retention, and final lock evidence across M01–M18/S01–S19.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

DEF-001–DEF-012, all Wave gates, FP-020 dormant-AI exclusion evidence.

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

1. Create/update gate ledger. 2. Record packet/Wave entry/exit evidence. 3. Review deferred scope. 4. Conduct readiness review. 5. Require separate W7 authority.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Draft status cannot satisfy this gate.

## 28. Open questions

No package acceptance/lock or implementation authorization is created by this Draft pass.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This Draft packet neither marks the packet complete nor authorises implementation.
