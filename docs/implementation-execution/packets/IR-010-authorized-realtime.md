# IR-010 — Authorized realtime
## 1. Status and ownership

- Status: Draft
- Wave: W3
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: No

## 2. Objective

Plan current-authorized, Group-scoped Realtime delivery and client subscription lifecycle without global channels or stale data leaks.

## 3. Authoritative inputs

Security model §14; roadmap IR-010; parity FP-009/015/019; realtime design contracts.

The accepted documents govern; this Draft packet does not restate or amend their decisions.

## 4. Entry gate

Verified exit evidence for IR-005, IR-007, IR-008., clean repository, accepted design mapping, and no unresolved prerequisite security or architecture contradiction.

## 5. Dependencies

- Direct IR dependencies: IR-005, IR-007, IR-008.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Draft subscription boundary, Group switch unsubscribe/clear order, reconnect, deduplication, stale events, membership/permission/archive removal, payload validation, and integration evidence.

## 7. Explicitly out of scope

Global unscoped delivery, notification centre, stale previous-Group data, payload authority, actual Realtime configuration, or implementation.

## 8. Current repository state

`useEvents`, `useExpenses`, and `useSettlements` subscribe to global table
channels; `useTodos` uses a name-filtered channel. All refetch global table
data. Verified IR-004 supplies an Auth session boundary, but no active-Group
lifecycle, Group-change reset, or authorised Realtime subscription cleanup
exists.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| src/hooks/useEvents.ts | Existing file — later replace/extend candidate | Global events query/channel | IR-010/IR-011/IR-012 | Critical | Group switch and isolation tests |
| src/hooks/useExpenses.ts, useSettlements.ts, useTodos.ts | Existing files — later replace/extend candidates | Global/name-scoped channels | IR-010/IR-011/IR-014 | Critical | Subscription lifecycle tests |
| `Proposed path — verify at packet start: src/features/realtime/` | Proposed path | Scoped subscription adapter | IR-010 | High | Integration review |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

No database schema work belongs solely here; consume policy/publication decisions only after IR-007.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

No broad trusted proxy. Current authorization is validated by data access; operation outputs are not authority.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

Document event notifications must never reveal object metadata before authorization.

## 14. Realtime work

Define Group-scoped authorized subscription, unsubscribe then clear on switch, reconnect authorization refresh, duplicate/out-of-order handling, stale form warning, current-user removal, archive, and safe unavailable state.

There is no global notification centre and no globally scoped channel. Every delivery remains Group-scoped and subject to current authorization at subscription and event-handling time.

## 15. Frontend implementation

Map RT family plus affected stale/permission/offline states. Background updates never steal focus or reorder under a reading user.

## 16. Design traceability

Affected Screen IDs: RT family and related stale/permission states assigned to IR-010; CMP-63–CMP-72 are referenced by accepted design review.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

M16 query/realtime replacement; old global channels remain legacy evidence only.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

M16, FP-009, FP-015, FP-019, TC-015, IPE realtime evidence.

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

1. Confirm RLS/membership model. 2. Define channel boundary and cleanup. 3. Specify stale/reconnect semantics. 4. Define two-Group/removal tests. 5. Gate IR-011 on safe subscription behavior.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Draft status cannot satisfy this gate.

## 28. Open questions

Current Supabase publication/configuration state is Not established by current repository inspection.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This Draft packet neither marks the packet complete nor authorises implementation.
