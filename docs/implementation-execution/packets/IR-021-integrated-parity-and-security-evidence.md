# IR-021 — Integrated parity and security evidence
## 1. Status and ownership

- Status: Draft
- Wave: W5
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: No

## 2. Objective

Join completed feature/security work into traceable FP/UI/TC/IPE, fixture, two-Group, document, realtime, finance, migration, and R-02 evidence.

## 3. Authoritative inputs

Feature parity contract; security model; roadmap IR-021; UI traceability; accepted design acceptance/review.

The accepted documents govern; this Draft packet does not restate or amend their decisions.

## 4. Entry gate

Verified exit evidence for IR-003, IR-004, IR-005, IR-006, IR-007, IR-008, IR-009, IR-010, IR-011, IR-012, IR-013, IR-014, IR-015, IR-016., clean repository, accepted design mapping, and no unresolved prerequisite security or architecture contradiction.

## 5. Dependencies

- Direct IR dependencies: IR-003, IR-004, IR-005, IR-006, IR-007, IR-008, IR-009, IR-010, IR-011, IR-012, IR-013, IR-014, IR-015, IR-016.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Draft evidence matrix, ownership, test result formats, release-blocking failure rules, R-02 rollup, and reconciliation with IR-022 ledger.

## 7. Explicitly out of scope

UI-only proof for security, waiving failed evidence, actual test execution claims, or declaring R-02 measured before a running build.

## 8. Current repository state

Verified IR-001 provides test scripts, `tests/`, the Playwright configuration,
an isolated local database/RLS harness, CI evidence workflow, fixtures, and
manifest/checksum conventions. Verified IR-002, IR-004, and IR-007 have
generated-type and immutable packet evidence. No integrated application
parity/security rollup, W3 physical-operation evidence, or release evidence is
present.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| docs/architecture/feature-parity-test-contract.md | Existing accepted input — read only | FP/UI/TC/IPE authority | IR-021 | High | Traceability review |
| docs/ui-design/manifests/screen-manifest.json | Existing accepted input — read only | 462 screen mapping authority | IR-021 | Medium | Mapping integrity check |
| `Proposed path — verify at packet start: artifacts/evidence/` | Proposed path | Future result storage | IR-021 | High | Evidence-retention review |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

No database work; database/RLS evidence is consumed from owning packets.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

No operation implementation; verify operation evidence from IR-008 and owners.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

Verify private document object lifecycle and cross-Group denial from IR-009/IR-013.

## 14. Realtime work

Verify scoped current-authorization/reconnect/removal evidence from IR-010.

## 15. Frontend implementation

Verify implemented screen/state evidence only after owning packets are authorised and implemented; no static-design claim counts as running evidence.

## 16. Design traceability

All 462 screens retain accepted IR/Wave mapping. Use family/range summaries and manifest as machine-readable source; UI-01–UI-14 must remain 14/14.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

Consumes IR-016 manifests/reconciliation and maps failure to owner packet; no transform ownership.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

FP-001–FP-020, UI-01–UI-14, TC-001–TC-019, all IPE requirements, R-02.

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

1. Freeze accepted requirement matrix. 2. Assign owner/evidence type. 3. Define result and failure format. 4. Roll up R-02 only after running checks. 5. Block W6 on unresolved release-blocking evidence.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Draft status cannot satisfy this gate.

## 28. Open questions

OE-001: selected test/database/browser/CI capability is required before executable evidence can be produced.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This Draft packet neither marks the packet complete nor authorises implementation.
