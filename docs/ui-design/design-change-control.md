# UI/UX Design Change Control

## Locked scope

- tokens
- components
- screens
- states
- interaction contracts
- architecture mappings
- IR/Wave mappings
- accessibility requirements

## Change classifications

- editorial clarification
- implementation-only correction
- accessibility correction
- state addition
- component change
- visual change
- navigation change
- architecture-impacting change

## Required proposal fields

- change ID
- reason
- affected Screen IDs
- affected Component IDs
- affected tokens
- affected architecture requirements
- affected IR items
- affected Waves
- acceptance evidence impact
- migration impact
- security impact
- reviewer
- decision

## Approval rules

- no silent visual drift
- no implementation divergence without documentation
- no architecture-impacting design change without architecture review
- no locked-screen replacement without product-owner approval
- R-02 implementation findings may produce targeted accessibility corrections
  through this process

## Status vocabulary

- Proposed
- Under review
- Accepted
- Approved
- Rejected
- Superseded
- Implemented
- Verified

## DCC-IR003-FREEZE-001 — staged bootstrap confirmation

- **Status:** Accepted. This is an accepted design amendment only; it does not
  authorise implementation.
- **Decision authority:** Product owner.
- **Decision date:** 2026-08-12.
- **Reason:** `ONB-05` is the accepted server-confirmed Group creation
  progress state. The only accepted `ONB-06` success state states “Group
  created + invitation link issued” and includes the invite-link copy control.
  TOP-001 / IR-003 creates no Invitation; TOP-002 / IR-005 alone owns
  Invitation issuance. `ONB-09` is IR-006 and `ONB-10` is IR-011, so neither
  is an IR-003 continuation. A committed TOP-001 result therefore has no
  accepted, truthful rendered destination.
- **Classification:** State addition and constrained interaction/navigation
  clarification to a locked screen; no architecture change.
- **Affected Screen IDs:** `ONB-06` only. No Screen ID is added; `ONB-05`,
  `ONB-09`, and `ONB-10` ownership is unchanged.
- **Affected Component IDs/tokens:** No new reusable Component ID or token is
  accepted. Within ONB-06 only, the existing named Group header, success pill,
  invite-link block, and action region receive the accepted lifecycle
  distinction below.
- **Exact accepted amendment:** Preserve the existing `ONB-06` Screen identity
  and split its Success contract into two explicitly named lifecycle states
  without merging their trusted operations:
  1. **State A — Group created, Invitation not issued.** IR-003 / TOP-001 in
     W3 owns this state after TOP-001 has committed and returned a
     server-confirmed Group. The Group header uses that confirmed identity and
     the success treatment confirms Group creation. The invitation area
     explicitly states that no Invitation has been issued and is
     noninteractive. It contains no Invitation record, verifier, secret, link,
     code, recipient, copy/share control, usable-looking placeholder,
     invitation action, invitation-derived navigation, or claim that another
     Member can join. It is a non-optimistic terminal confirmation: no live
     Group shell, IR-005 action, IR-006 action, IR-010 action, IR-011 action,
     or other product continuation is introduced; back cannot return to the
     creation form.
  2. **State B — Group created, Invitation issued.** IR-005 / TOP-002 in W3
     owns the transition to this existing Invitation-issued state, and only
     after TOP-002 has separately committed an authorised Invitation. The
     existing Invitation/link block, copy action, accepted share action,
     confirmation treatment, and Invitation-lifecycle handoff remain here.
     IR-003 cannot render State B merely because Group creation succeeded.
- **Affected architecture requirements:** None. Group bootstrap remains atomic
  TOP-001; Invitation issuance remains TOP-002; client-supplied authority and
  browser service-role use remain forbidden.
- **Affected IR items/Waves:** Primary affected packets are IR-003 and IR-005;
  W3 only. IR-011 is expressly not invoked. This does not transfer any TOP,
  database, application, navigation, tenant-model, or later-Wave ownership.
- **Impact assessment:** Architecture: none. Security: none. Product feature:
  none. Navigation/tenant model: none. New Screen IDs: none. Component-system
  redesign: none. W4+ impact: none.
- **Acceptance evidence impact:** The locked ONB-06 contract, screen manifest,
  state matrix, interaction contract, and design-to-roadmap traceability are
  amended by this decision. Under the binary-asset policy, the existing clean
  and annotated ONB-06 PNGs remain byte-identical and are explicitly recorded
  as State B (Invitation issued); State A is the accepted textual/manifest
  lifecycle variant. No PNG or master asset is fabricated, regenerated, or
  claimed to depict State A.
- **Migration/security impact:** None. No migration, RPC, role, table,
  Invitation, secret, link, client privilege, or remote state is created by
  this amendment.
- **Decision:** Accepted by the product owner. `BLK-IR003-FREEZE-001` and
  `OE-006` are resolved by this accepted bounded amendment. The IR-003
  pre-authorisation design freeze is complete; the next activity is to prepare
  the controlled GATE-031 evidence package and redacted Git record. This does
  not satisfy GATE-031, authorise IR-003 or IR-005, authorise a physical TOP,
  create migration 010, start W3 implementation, or authorise deployment or
  cutover.
