# IR-005 — Membership, Invitation and Owner
## 1. Status and ownership

- Status: Draft
- Wave: W3
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: No

## 2. Objective

Implement planned active/inactive Membership, Owner/Member-only roles, single-use Invitations, atomic acceptance, lifecycle, last-Owner protection, archive/restore, and leave behavior.

## 3. Authoritative inputs

ADR-0007; auth/groups/invitations architecture; security model; roadmap IR-005;
GRP/INV/MBR/PERM design contracts; and the Accepted
`DCC-IR003-FREEZE-001` ONB-06 State B contract.

The accepted documents govern; this Draft packet does not restate or amend their decisions.

## 4. Entry gate

Verified exit evidence for IR-003, IR-004, IR-007, IR-008., clean repository, accepted design mapping, and no unresolved prerequisite security or architecture contradiction.

## 5. Dependencies

- Direct IR dependencies: IR-003, IR-004, IR-007, IR-008.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Draft lifecycle state transitions and trusted-operation contracts for invitation creation/inspection/revocation/acceptance, role change, ownership transfer, removal, leave, archive, and restore.

Invitation planning retains opaque secrets only: the recipient-facing proof is never logged or exposed after its approved lifecycle. Invitation possession alone remains insufficient for membership.

IR-005 / TOP-002 alone owns the ONB-06 State B transition: **Group created,
Invitation issued**. It may render the real Invitation/link, copy/share,
confirmation, and Invitation-lifecycle handoff only after its separately
committed authorised Invitation. State A remains IR-003 / TOP-001-only and
contains no IR-005 Invitation behaviour.

## 7. Explicitly out of scope

Automatic Participant claim, Owner invite authority, secret disclosure, extra role, optimistic acceptance, permanent deletion, or actual lifecycle implementation.

## 8. Current repository state

Verified IR-002 migrations provide the structural `groups`,
`group_configurations`, and `group_members` foundation, including structural
Owner/Member roles and active/inactive status. No Invitation or membership
lifecycle data model or physical trusted operation exists. `src/constants/users.ts`
still contains fixed legacy names; the active `src/App.tsx` path is the verified
IR-004 Auth boundary, not persona switching. Legacy SQL has no
Membership/Invitation table.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| src/constants/users.ts | Existing file — legacy identity source | Fixed personas | IR-004/IR-005/IR-006 | High | No-name-authority tests |
| src/App.tsx | Existing file — later extension candidate | Header/persona shell | IR-011 | High | Group switcher evidence |
| `Proposed path — verify at packet start: src/features/memberships/` | Proposed path | Lifecycle UI/data boundary | IR-005 | High | Design/operation review |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

Consumes Group/member/invitation schema. Define active/inactive transitions, unique/expiry/revocation constraints, last-Owner protection, audit fields, and archive/restore semantics.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

Physical TOP ownership: TOP-002–TOP-007 (`create_invitation`,
`accept_invitation`, `change_member_role`, `transfer_ownership`,
`deactivate_membership`, and `set_group_archive_state`). The separately
authorised implementation packet must retain actual implementation and
authorization, one authoritative all-or-nothing transaction, injected-failure
rollback, idempotency, concurrency/race evidence, audit emission, secret-safe
evidence, and operation-specific performance evidence for every owned TOP.

Candidates: create_invitation, inspect_invitation, revoke_invitation, accept_invitation, change_member_role, transfer_ownership, remove_member, leave_group, archive_group, restore_group. Each needs session actor, Group/role validation, atomicity, idempotency/replay/race behavior, audit output, and safe denial.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

Membership status controls later object authorization; no direct Storage policy is written here.

## 14. Realtime work

Lifecycle changes require later IR-010 authorization/reset behavior; no global lifecycle channel.

## 15. Frontend implementation

Map GRP, INV, MBR, and permission/read-only screen states. Invitation
possession never grants membership; success appears only after server
confirmation. ONB-06 State B remains unavailable until TOP-002 has committed;
this packet does not transfer IR-011 shell behaviour to either ONB-06 state.

## 16. Design traceability

Affected Screen IDs are all IR-005-assigned GRP/INV/MBR and related PERM/MIG
screens, plus the IR-005-owned lifecycle behaviour within existing ONB-06
State B; the exact primary Screen-ID list remains in the accepted manifest.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

Legacy users become candidate Participants, not Membership authority. Preserve archive/Owner decisions in reviewed source mapping.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

TC-004–TC-008, S12, Owner/Member role model, invitation replay/race evidence.

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

1. Confirm bootstrap output. 2. Define transition graph. 3. Define trusted operations and tests. 4. Map design state/error outcomes. 5. Gate IR-006/IR-009/IR-010/IR-011 after lifecycle evidence.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Draft status cannot satisfy this gate.

## 28. Open questions

No active-owner identity, recipient verification input, or production membership inventory is established in the repository.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This Draft packet neither marks the packet complete nor authorises implementation.
