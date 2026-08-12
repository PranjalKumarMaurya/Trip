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
- Approved
- Rejected
- Superseded
- Implemented
- Verified

## DCC-IR003-FREEZE-001 — staged bootstrap confirmation

- **Status:** Proposed. This record is not an Accepted design decision and
  does not authorise implementation.
- **Reason:** `ONB-05` is the accepted server-confirmed Group creation
  progress state. The only accepted `ONB-06` success state states “Group
  created + invitation link issued” and includes the invite-link copy control.
  TOP-001 / IR-003 creates no Invitation; TOP-002 / IR-005 alone owns
  Invitation issuance. `ONB-09` is IR-006 and `ONB-10` is IR-011, so neither
  is an IR-003 continuation. A committed TOP-001 result therefore has no
  accepted, truthful rendered destination.
- **Classification:** State addition and constrained interaction/navigation
  clarification to a locked screen; no architecture change.
- **Affected Screen IDs:** `ONB-05`, `ONB-06` only. The proposal does not add
  a Screen ID or change `ONB-09`/`ONB-10` ownership.
- **Affected Component IDs/tokens:** No new reusable Component ID or token is
  proposed. Within ONB-06 only, the existing named Group header, success pill,
  invite-link block, and action region receive the state distinction below.
- **Exact proposed amendment:** Split the existing ONB-06 Success state into
  two states while preserving its layout and visual tone:
  1. **Group created, invitation not issued** — the deterministic destination
     after a committed TOP-001. It retains the Group header and success pill.
     The invite-link block has an explicit noninteractive not-issued state.
     It renders no Invitation record/secret/link, no copy/share control, no
     invitation action or invitation-derived navigation, and no onward
     IR-006/IR-011 product action. It is a completed terminal confirmation,
     never a loading state; back still cannot return to the creation form.
  2. **Group created, invitation issued** — the present accepted ONB-06 state.
     Its link/copy/share and next actions remain reachable only after IR-005
     TOP-002 has server-confirmed an issued Invitation.
- **Affected architecture requirements:** None. Group bootstrap remains atomic
  TOP-001; Invitation issuance remains TOP-002; client-supplied authority and
  browser service-role use remain forbidden.
- **Affected IR items/Waves:** IR-003, IR-005, and IR-011; W3/W4. This does
  not transfer any TOP, database, or application ownership.
- **Acceptance evidence impact:** A design reviewer must update the locked
  ONB-06 contract, manifest, and visual/annotation evidence only if the
  proposal is Approved. Until then all current accepted design artifacts remain
  unchanged and no linkless variant may be implemented.
- **Migration/security impact:** None. No migration, RPC, role, table,
  Invitation, secret, link, client privilege, or remote state is created by
  this proposal.
- **Reviewers:** Product owner and UI/UX design authority; architecture and
  security reviewers confirm the TOP-001/TOP-002 boundary is preserved.
- **Decision:** Pending. Approval, rejection, or a bounded replacement is
  required before IR-003 can implement a committed-success route or prepare
  its controlled GATE-031 package.
