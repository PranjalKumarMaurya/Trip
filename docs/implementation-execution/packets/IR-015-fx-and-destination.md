# IR-015 — FX and destination
## 1. Status and ownership

- Status: Draft
- Wave: W4
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: No

## 2. Objective

Plan Group configuration for destination/timezone/display context and reference FX while preserving accounting FX separation and Bali-only scope.

## 3. Authoritative inputs

ADR-0006; domain model; parity contract; roadmap IR-015; accepted CFG/FX design contracts.

The accepted documents govern; this Draft packet does not restate or amend their decisions.

## 4. Entry gate

Verified exit evidence for IR-003, IR-011., clean repository, accepted design mapping, and no unresolved prerequisite security or architecture contradiction.

## 5. Dependencies

- Direct IR dependencies: IR-003, IR-011.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Draft destination/IANA timezone, Group display-currency context, reference live/fallback FX, Bali/non-Bali content, accounting-currency lock, and no historical conversion.

## 7. Explicitly out of scope

Ledger authority from live FX, global travel guide, automatic content, Owner accounting-currency migration, silent historical conversion, or actual FX/config implementation.

## 8. Current repository state

`src/tabs/FXTab.tsx` and `src/lib/currency.ts` expose static conversion;
`src/lib/timezone.ts` targets IST/WITA. The verified IR-002 data foundation
includes `group_configurations`, but no Group configuration is created or read
by the application. `src/App.tsx` is the verified Auth boundary rather than a
hard-coded Bali workspace.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| src/tabs/FXTab.tsx | Existing file — later conversion candidate | Legacy converter | IR-015 | High | Live/fallback evidence |
| src/lib/currency.ts, src/lib/timezone.ts | Existing files — later separation candidates | Static rates/timezone formatting | IR-014/IR-015 | High | Accounting/reference separation tests |
| src/constants/tabAssets.ts | Existing file — legacy Bali asset input | Current content assets | IR-015 | Medium | Bali/non-Bali scope evidence |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

Consumes Group configuration schema from IR-002/IR-003. Define IANA timezone, destination, display context, accounting-currency lock and immutable history constraints; no SQL in Draft.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

Physical TOP ownership: TOP-011 `change_sensitive_configuration`. The
separately authorised implementation packet must retain actual implementation
and authorization, one authoritative all-or-nothing transaction,
injected-failure rollback, idempotency, concurrency/race evidence, audit
emission, secret-safe evidence, and operation-specific performance evidence.

Sensitive configuration changes consume IR-008 boundary where role/locking/transaction is required. No ordinary Owner accounting conversion operation.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

No Storage work.

## 14. Realtime work

Configuration changes require scoped refresh/stale-form behavior through IR-010.

## 15. Frontend implementation

Map CFG destination/timezone/currency states and FX reference/fallback/Bali-only/non-Bali states. Existing five tabs remain; no global guide or AI activation.

## 16. Design traceability

Affected Screen IDs: CFG family and IR-015 FX/MIG/RT states; UI-13 is primary. Components CMP-48–CMP-62 are indexed evidence.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

M11–M13/M18; legacy rate evidence is preserved/reconciled, unused-rate disposition is explicit, no automatic conversion.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

FP-016–FP-018, UI-13, IPE-FX-001, IPE-TIME-001, M11–M13, M18.

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

1. Confirm bootstrap configuration contract. 2. Define accounting/reference boundary. 3. Define fallback/Bali scope. 4. Map configuration UI. 5. Supply transform/evidence requirements to IR-016.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Draft status cannot satisfy this gate.

## 28. Open questions

External live-rate provider, caching/fallback source, and non-Bali content source are Not established by current repository inspection.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This Draft packet neither marks the packet complete nor authorises implementation.
