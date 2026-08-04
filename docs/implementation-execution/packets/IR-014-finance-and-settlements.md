# IR-014 — Finance and Settlements
## 1. Status and ownership

- Status: Draft
- Wave: W4
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: No

## 2. Objective

Plan normalized, exact Group-wide finance: contributions, Participant shares, accounting currency, immutable FX evidence, deterministic suggestions, and atomic settlement recording.

## 3. Authoritative inputs

ADR-0005/0006; domain model; parity contract; roadmap IR-014; EQ-01, SET-01, USD-01 fixtures; accepted FIN/CFG design contracts.

The accepted documents govern; this Draft packet does not restate or amend their decisions.

## 4. Entry gate

Verified exit evidence for IR-002, IR-008, IR-011., clean repository, accepted design mapping, and no unresolved prerequisite security or architecture contradiction.

## 5. Dependencies

- Direct IR dependencies: IR-002, IR-008, IR-011.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Draft normalized ledger contracts, smallest-unit exactness, deterministic Participant order/remainder, equal authoring, historical non-equal display/reconciliation, original/accounting values, suggestions, settlement recording, inactive history, and fixtures.

## 7. Explicitly out of scope

Float/name/payment/live-rate shortcut, unequal split authoring, accounting-currency conversion by Owner, rewriting history, actual finance implementation, or payment processing.

## 8. Current repository state

src/lib/splitting.ts is name-keyed and supports custom/percent/shares values; src/lib/currency.ts has static `RATES.INR = 188.68`. AddExpenseModal writes JSONB name splits/direct insert; SettleUpModal direct inserts settlements; hooks query global tables.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| src/lib/splitting.ts | Existing file — later replace/adapter candidate | Name-keyed float-like calculations | IR-014 | Critical | Exact fixture suite |
| src/lib/currency.ts | Existing file — later split/restrict candidate | Static converter/accounting conflation | IR-014/IR-015 | Critical | FX-separation evidence |
| src/components/AddExpenseModal.tsx, EditExpenseModal.tsx, SettleUpModal.tsx | Existing files — later conversion candidates | Direct finance mutations | IR-014 | Critical | Atomic/idempotent operation tests |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

Define expenses, payer contributions, Participant shares, settlements, immutable accounting/FX evidence, indexes/constraints, audit/recorder fields, inactive historical identities, and migration ordering. Numeric representation and generated types require data-review approval.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

Physical TOP ownership: TOP-009 `commit_expense` and TOP-010
`record_settlement`. The separately authorised implementation packet must retain
actual implementation and authorization, one authoritative all-or-nothing
transaction, injected-failure rollback, idempotency, concurrency/race evidence,
audit emission, secret-safe evidence, and operation-specific performance
evidence for each owned TOP.

Candidates: commit_expense and record_settlement, with session actor, Group/role validation, exact input, transaction, idempotency key, replay/race behavior, audit output, and safe whole-unit failure.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

No Storage work.

## 14. Realtime work

Consume authorised Group-scoped finance updates; stale edit and idempotent echo must be handled without client authority.

## 15. Frontend implementation

Map FIN/CFG finance states: equal split authoring, multi-payer contribution, historical non-equal display, exact totals, original/accounting values, settlement confirmation/results, error/retry, archive/read-only.

## 16. Design traceability

Affected Screen IDs: FIN family and IR-014 CFG/PERM/RT/MIG states; UI-10–UI-12 are primary. Components CMP-23–CMP-33 are indexed evidence.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

M07–M14 maps contributions/shares/currency/rate/settlements; malformed or unsupported history is reconciled/quarantined, never silently equalized.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

FP-009–FP-015, UI-10–UI-12, TC-010, IPE-SPLIT-001, IPE-SET-001, IPE-FIN-001, EQ-01, SET-01, USD-01.

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

1. Confirm Tenant/Participant order and trusted write boundary. 2. Define exact schema/invariants. 3. Define fixture/evidence. 4. Map UI contracts. 5. Gate migration finance transform only after reconciliation rules pass.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Draft status cannot satisfy this gate.

## 28. Open questions

OE-004: legacy finance discrepancies and exact source values require reviewed manifest evidence.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This Draft packet neither marks the packet complete nor authorises implementation.
