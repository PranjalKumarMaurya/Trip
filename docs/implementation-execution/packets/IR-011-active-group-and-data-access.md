# IR-011 — Active Group and data access
## 1. Status and ownership

- Status: Draft
- Wave: W4
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: No

## 2. Objective

Plan Group-scoped application shell, Active Group resolution, Group switching, scoped reads/writes, and safe unavailable/archived/no-Group behavior.

## 3. Authoritative inputs

Target architecture; parity contract; roadmap IR-011; accepted SHL/GRP/PERM design contracts.

The accepted documents govern; this Draft packet does not restate or amend their decisions.

## 4. Entry gate

Verified exit evidence for IR-003, IR-005, IR-007, IR-010., clean repository, accepted design mapping, and no unresolved prerequisite security or architecture contradiction.

## 5. Dependencies

- Direct IR dependencies: IR-003, IR-005, IR-007, IR-010.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Draft route/application-state boundary, Group switch sequence, data cache clearing, scoped hooks, loading/error/no-Group/read-only states, and anti-stale display checks.

## 7. Explicitly out of scope

Client Active Group authority, global query, stale previous-Group display, actual route/UI implementation, or Group as a friend container.

## 8. Current repository state

`src/App.tsx` renders the verified IR-004 Auth boundary and does not open the
legacy workspace for an authenticated account. Existing data hooks have no
Group argument and still query global tables. There is no router, `app/`,
`pages/`, or services directory, and no active-Group state exists.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| src/App.tsx | Existing file — likely major extension/replacement candidate | Fixed shell/tab/persona state | IR-011 | Critical | Shell/scoped-read evidence |
| src/hooks/useEvents.ts, useExpenses.ts, useSettlements.ts, useTodos.ts | Existing files — likely replace | Global/name-scoped data | IR-011 | Critical | No stale Group data tests |
| `Proposed path — verify at packet start: src/features/groups/active-group.*` | Proposed path | Active Group boundary | IR-011 | High | Architecture/design review |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

No new database unit beyond consumed Group/member model; all reads/writes must carry server-validated Group scope.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

No new operation; consumes lifecycle operation results and server confirmation.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

Private document availability must be cleared on Group switch/removal.

## 14. Realtime work

Unsubscribe/clear order from IR-010 is mandatory before a new Group becomes visible.

## 15. Frontend implementation

Map authenticated/pre-auth shell, Group switcher, no Group, unavailable resource, archive/read-only, loading/failure and five-tab navigation. Existing 480px shell/design tokens are locked and must not drift.

## 16. Design traceability

Affected Screen IDs: SHL and Group/access states primarily owned by IR-011. Use exact 462-entry manifest rather than re-keying IDs.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

M16 query/realtime replacement; no legacy global data bridge may become authority.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

FP-001–FP-004, FP-009, FP-019, UI-01–UI-03, TC-003, TC-019.

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

1. Confirm lifecycle/RLS/realtime gates. 2. Define Active Group state machine. 3. Define scoped hook contracts. 4. Map shell states. 5. Gate feature lanes only after no stale data route.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Draft status cannot satisfy this gate.

## 28. Open questions

Current routing/deployment configuration is not established beyond Vite SPA entry; exact route mechanism is a packet-start design choice.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This Draft packet neither marks the packet complete nor authorises implementation.
