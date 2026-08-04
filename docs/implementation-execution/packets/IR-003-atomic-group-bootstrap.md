# IR-003 — Atomic Group bootstrap
## 1. Status and ownership

- Status: Draft
- Wave: W3
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: No

## 2. Objective

Create one configured Group with a creator stable Member/Owner and audit result atomically, including safe retry/concurrency behavior.

## 3. Authoritative inputs

docs/architecture/auth-groups-and-invitations.md §6; docs/architecture/domain-and-data-model.md; roadmap IR-003; ADR-0001/0006/0008.

The accepted documents govern; this Draft packet does not restate or amend their decisions.

## 4. Entry gate

Verified exit evidence for IR-002, IR-004, IR-007, and IR-008; the separate
GATE-015 W3-entry review, which is Satisfied; GATE-031 evidence before IR-003
authorisation; a clean repository; accepted design mapping; and no unresolved
prerequisite security or architecture contradiction. The satisfied W3-entry
review makes IR-003 eligible only for GATE-031 completion and separate
authorisation; it does not authorise or implement IR-003.

## 5. Dependencies

- Direct IR dependencies: IR-002, IR-004, IR-007, IR-008.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Draft request/validation/result contract for Group creation, mandatory configuration, first-run onboarding, Participant handling, transaction, idempotency, retry, and audit evidence.

## 7. Explicitly out of scope

Ownerless or unconfigured Group, persona-based Owner authority, partial commits, client-side authority, or actual implementation.

## 8. Current repository state

src/App.tsx renders a fixed Bali header and PersonaPicker; no Group route, Group state, membership, configuration, or transaction exists. src/hooks/useCurrentUser.ts is component-local persona state.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| src/App.tsx | Existing file — later replacement/extension candidate | Current fixed shell/persona handoff | IR-011 | High | Scoped shell tests |
| src/components/PersonaPicker.tsx | Existing file — later replacement candidate | Legacy local persona selection | IR-004/IR-011 | High | Auth/onboarding evidence |
| `Proposed path — verify at packet start: src/features/groups/` | Proposed path | Group bootstrap UI/data boundary | IR-003 | High | Design/operation review |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

Consumes Group/configuration/member schema from IR-002. Define one transaction that creates Group, configuration, creator Member/Owner, and audit record or creates none. Generated types must be refreshed only after approved migrations.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

Physical TOP ownership: TOP-001 `bootstrap_group`. The separately authorised
implementation packet must retain actual implementation and authorization, one
authoritative all-or-nothing transaction, injected-failure rollback,
idempotency, concurrency/race evidence, audit emission, secret-safe evidence,
and operation-specific performance evidence.

Candidate bootstrap_group: session actor, validated input, mandatory configuration, single transaction, idempotency key, concurrency-safe result, audit record, no browser service role.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

No Storage work.

## 14. Realtime work

No broad subscription. Later Group lifecycle/realtime work consumes committed Group identity only.

## 15. Frontend implementation

Map ONB Group-creation/onboarding states through the accepted manifest; no implementation until entry gate. Loading, validation, server failure, retry, and first Group states require server-confirmed results.

## 16. Design traceability

Affected Screen IDs are the ONB family assigned to IR-003 plus related Group shell states; use docs/ui-design/manifests/screen-manifest.json as exact mapping.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

M18 configuration mapping; legacy Bali Group must be created only by reviewed transform/rehearsal path.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

S04–S07, TC-002, TC-009, UI onboarding mapping.

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

1. Confirm W2 identity/RLS/operation gates. 2. Specify bootstrap input/result. 3. Define transaction/idempotency/audit tests. 4. Map first-run screens. 5. Permit IR-005 only after complete-or-none evidence.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Draft status cannot satisfy this gate.

## 28. Open questions

No additional ambiguity beyond OE-002; no initial Owner identity may be guessed.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This Draft packet neither marks the packet complete nor authorises implementation.
