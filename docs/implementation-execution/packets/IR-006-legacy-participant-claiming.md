# IR-006 — Legacy Participant claiming
## 1. Status and ownership

- Status: Draft
- Wave: W3
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: No

## 2. Objective

Attach a validated account to a stable legacy Participant atomically, activate ordinary Membership where permitted, and preserve non-authorising conflict/failure outcomes.

## 3. Authoritative inputs

ADR-0004; migration plan §7; auth/groups/invitations architecture; roadmap IR-006; CLM/MIG design contracts.

The accepted documents govern; this Draft packet does not restate or amend their decisions.

## 4. Entry gate

Verified exit evidence for IR-003, IR-005, IR-008., clean repository, accepted design mapping, and no unresolved prerequisite security or architecture contradiction.

## 5. Dependencies

- Direct IR dependencies: IR-003, IR-005, IR-008.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Draft claim evidence, atomic attach, conflict/already-claimed/insufficient-evidence states, idempotent retry, audit output, and migration interaction.

## 7. Explicitly out of scope

Name, emoji, PIN, Profile, or Invitation possession as proof; Owner promotion; Owner review queue; manual contested override; actual claim implementation.

There is no Owner review queue or manual Owner adjudication path for a contested claim. A claim lacking reviewed proof remains unclaimed and is recorded for the migration exception process.

## 8. Current repository state

src/constants/users.ts, src/constants/seedData.ts, src/lib/splitting.ts, and legacy SQL use display names. No stable group_members identity or claim flow exists.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| src/constants/users.ts | Existing file — migration evidence source only | Legacy names/emoji | IR-006/IR-016 | High | No-authority evidence |
| src/lib/splitting.ts | Existing file — later finance migration input | Name-keyed finance interfaces | IR-014/IR-016 | High | Stable participant reconciliation |
| `Proposed path — verify at packet start: src/features/participants/` | Proposed path | Claim UI/data boundary | IR-006 | High | Claim contract review |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

Consumes stable Participant/member identity from IR-002/IR-005. Define uniqueness and immutable identity constraints; retain unclaimed records on failure.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

Physical TOP ownership: TOP-008 `claim_legacy_participant`. The separately
authorised implementation packet must retain actual implementation and
authorization, one authoritative all-or-nothing transaction, injected-failure
rollback, idempotency, concurrency/race evidence, audit emission, secret-safe
evidence, and operation-specific performance evidence.

Candidate claim_legacy_participant: session actor, reviewed proof, current Group relationship, single transaction, idempotency/replay/race handling, non-secret audit result, safe unchanged failure.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

No Storage work.

## 14. Realtime work

Later IR-010 must clear/re-authorize a claim-sensitive screen after membership/claim change.

## 15. Frontend implementation

Map CLM and related PERM/MIG states; no screen promises manual Owner override. Read-only/error states preserve exact safe outcome.

## 16. Design traceability

Affected Screen IDs: CLM family and IR-006-assigned MIG/ONB screens; use manifest exact IDs and accepted component variants.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

M01/M02, S06, S12; participant duplicates/adjudications require reviewed input, never silent selection.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

TC-018, S06, S12, M01, M02.

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

1. Confirm membership/lifecycle rule. 2. Define acceptable proof record. 3. Define atomic operation and concurrency tests. 4. Map safe screen outcomes. 5. Gate IR-016 only after stable-ID/audit evidence.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Draft status cannot satisfy this gate.

## 28. Open questions

OE-004: participant duplicate/adjudication evidence is not established; affected records must remain unclaimed.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This Draft packet neither marks the packet complete nor authorises implementation.
