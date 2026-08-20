# Execution Package Governance

## Roles

| Role | Responsibility |
|---|---|
| Product owner | Pranjal Kumar Maurya — product owner; approves product scope and required acceptance decisions |
| Architecture authority | Governs accepted architecture and architecture-impacting amendments |
| Implementation executor | Performs only explicitly authorised packet work |
| Reviewer | Reviews packet evidence and scope compliance |
| Security reviewer | Reviews RLS, trusted operations, Storage, Realtime, secrets, and negative evidence |
| Database/migration reviewer | Reviews schema/data/policy order, transform, rollback, and reconciliation evidence |
| Design reviewer | Applies locked UI/UX change control and validates design traceability |
| Release authority | Reviews readiness and release gates |
| Cutover authority | Provides the separate W7 production authorisation required before cutover |

## Status vocabulary

Draft; Under review; Accepted; Locked; Authorised; In progress; Blocked; Implemented; Verified; Rejected; Rolled back; Superseded.

## Meaning

| Term | Meaning |
|---|---|
| Accepted | A reviewed decision or packet has approval for its documented content. |
| Locked | The accepted scope is stable and changes require change control. |
| Authorised | A named actor may begin the specifically bounded next action. |
| Started | Authorised execution has actually begun and is recorded. |
| Implemented | The approved change exists in the repository/environment. |
| Verified | Required functional, security, rollback, and accessibility evidence passes. |
| Released | Separately authorised deployed/cutover outcome is recorded. |

## Approval requirements

Implementation packet changes require product/reviewer approval; design divergence requires the accepted UI/UX change-control process; architecture-impacting changes require architecture review; database migration, RLS, trusted-operation, Storage-policy, and Realtime changes require database/migration and security review. Wave entry and exit require their documented evidence and reviewers. W7 cutover requires separate cutover authority; no prior acceptance implies it.

## Current execution-package decision

- Execution package acceptance: Complete
- Execution package lock: Complete
- Planning freeze: Complete
- IR-001, IR-002, IR-004, and IR-007: Verified.
- IR-008: Verified for common trusted-operation contract/static evidence only;
  no physical owner packet is authorised.
- GATE-011, GATE-012, GATE-013, and GATE-015: Satisfied; W1 and W2: Complete.
- W3 entry prerequisites from W2: passed. W3 implementation: Not authorised.
- GATE-031: Not satisfied; IR-003 and all physical owner packets: Not
  authorised.
- Product Owner has authorised the bounded W3 remote Supabase access required
  for target-baseline verification. Read-only verification is authorised now;
  any Auth/Profile/database mutation remains separately contingent on its
  applicable prerequisite and gate. The mandatory W3 gate order remains in
  force. This authority neither satisfies GATE-031 nor authorises IR-003,
  migration `010`, or `TOP-001`.
- Deployment and production cutover: Not authorised.
- Packet scope cannot expand silently; use change control.
- W7 separate production authorisation: Mandatory

Package acceptance and lock establish trusted planning authority. They do not
authorise unbounded implementation work, a physical trusted operation,
deployment, or cutover. W7 still requires separate production authorisation.

## Current-state documentation synchronisation

After every packet implementation, independent verification, gate decision,
Wave transition, or other authoritative status change, perform a current-state
documentation synchronisation before beginning the next execution unit. Check
at least the execution README/current-next-activity, gate ledger, execution
order, dependency graph, implementation traceability, relevant DBM/TOP
register, owning packet, owning Wave, and active authorisation/status surface.

These mutable current-status surfaces must be kept distinct from
immutable/historical decision and evidence records. The synchronisation updates
only the former; it does not rewrite the status, scope, evidence, or decision
that was accurate at a recorded historical point. This maintenance step is not
an authorisation requirement or an additional execution gate.
