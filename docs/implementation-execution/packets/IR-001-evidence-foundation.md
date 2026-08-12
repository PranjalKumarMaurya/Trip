# IR-001 — Evidence foundation
## 1. Status and ownership

- Status: Implemented and Verified
- Wave: W1
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: Yes
- Started: Yes — 2026-07-31
- Implemented: Yes — 2026-07-31
- Verified: Yes — 2026-07-31
- Authorisation record: `../authorisations/IR-001-authorisation.md`

## 2. Objective

Establish reproducible local setup, isolated fixtures, contract/type checks, audit-safe evidence retention, CI capability selection, and controlled failure-injection planning before feature work.

## 3. Authoritative inputs

docs/architecture/implementation-roadmap.md §§7, 8, and 15; docs/architecture/security-model.md; docs/architecture/feature-parity-test-contract.md.

The accepted documents govern; this authorised packet does not restate or amend their decisions.

## 4. Entry gate

GATE-002–006: accepted/locked package, explicit IR-001 authorisation, clean
repository, and completed repository-visible inventory. A selected test runner,
browser/RLS harness, CI platform, isolated test project, deployed-state
inventory, or source snapshot is not required to begin this packet; IR-001
creates the capability required at GATE-007–010 before W1 exit.

## 5. Dependencies

- Direct IR dependencies: None.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Inventory existing build/tooling; select and review required test capability; define two-account/two-Group fixtures, deterministic clocks, network interception where appropriate, evidence checksums, and CI gates.

## 7. Explicitly out of scope

Feature implementation, production data, assuming a test framework, or claiming CI/database/browser capability exists.

## 8. Current repository state

The Verified IR-001 capability is present: `package.json` exposes build,
typecheck, unit, database/RLS, controlled-failure, cleanup, browser, and
evidence-manifest scripts; `playwright.config.ts`, `tests/`, and
`.github/workflows/ir-001-evidence.yml` exist. The local Supabase CLI/Docker
harness, deterministic-clock and two-account/two-Group fixtures, manifest
writers, and exact cleanup controls are established. These capabilities do not
authorise product, schema, or physical trusted-operation implementation.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| package.json | Existing file — inspect only in this Draft pass | Current scripts; future tooling decision must be reviewed | IR-001 | High | Tooling decision record and dry-run capability evidence |
| vite.config.ts, tsconfig.json | Existing file — inspect only | Current build/type boundary | IR-001 | Medium | Reproducible build/type command record |
| `Proposed path — verify at packet start: tests/` | Proposed path | Test suite location only after tooling selection | IR-001 | Medium | Selected-tool review |
| `Proposed path — verify at packet start: .github/workflows/` | Proposed path | CI gate only after CI authority exists | IR-001 | Medium | CI review record |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

No database schema change belongs to this packet. It defines the fixture and evidence capability required before later database/RLS work.

## 11. RLS and authorization work

No policy is authorised by IR-001. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

No trusted operation is implemented by this packet. It defines failure-injection and audit-evidence expectations for later operations.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

No Storage implementation. Define private-object fixture and checksum evidence conventions for IR-009/IR-013.

## 14. Realtime work

No Realtime implementation. Define subscription isolation/reconnect fixture capability for IR-010.

## 15. Frontend implementation

No feature UI. Current build shell and existing data-testid attributes are inventory inputs only.

## 16. Design traceability

No Screen or Component implementation owner. Reference accepted screen-manifest traceability; this packet establishes evidence capability for every design family.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

No migration execution. Define manifest/checksum evidence convention used by IR-016/IR-017.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

TC-001–TC-019 planning coverage; all FP/UI evidence families; two-account/two-Group fixture baseline.

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

1. Inventory current scripts/configuration. 2. Record missing test, database, browser, CI, and failure-injection capability. 3. Propose tooling only for review. 4. Define fixture/evidence naming and retention. 5. Gate IR-002 only when capability selection is approved.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Authorised status cannot satisfy this gate.

## 28. Open questions

OE-001-B/C: test, RLS/database, browser, failure-injection, and CI capability
are not established by repository inspection. They are this packet's W1-exit
deliverables (GATE-007–010), not its entry prerequisite.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This authorisation neither marks the packet complete nor authorises dependent implementation.
