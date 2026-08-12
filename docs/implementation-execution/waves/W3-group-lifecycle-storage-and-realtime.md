# W3 — Group lifecycle, storage, and realtime

## Status and authorisation

- Status: GATE-015 satisfied for W3 entry; implementation remains unauthorised
- Implementation authorised: No
- Wave complete: No

## Wave objective

Atomic Group lifecycle, current membership, private document access, subscription cleanup, audit-safe outcomes, and migration identity handling.

## IR packets

- [IR-003 — Atomic Group bootstrap](../packets/IR-003-atomic-group-bootstrap.md)
- [IR-005 — Membership, Invitation and Owner](../packets/IR-005-membership-invitation-and-owner.md)
- [IR-006 — Legacy Participant claiming](../packets/IR-006-legacy-participant-claiming.md)
- [IR-009 — Private Storage](../packets/IR-009-private-storage.md)
- [IR-010 — Authorized realtime](../packets/IR-010-authorized-realtime.md)

## Accepted entry conditions

W2 trusted boundary passes.

## Internal execution order

IR-003 bootstrap precedes IR-005 lifecycle; IR-005 precedes IR-006 claiming. IR-009 and IR-010 may run in parallel only after IR-005, IR-007, and IR-008 are satisfied.

## Parallel work boundaries

Private Storage and authorised Realtime may run in parallel after lifecycle and trusted-boundary gates. Claiming remains serial after membership.

## Shared schema changes

Plan atomic Group bootstrap/configuration, Membership/Invitation/role lifecycle, stable Participant claims, document metadata, private-object model, and authorization inputs for subscriptions.

## Shared frontend changes

Trace ONB, GRP, INV, MBR, CLM, PERM, DOC, and RT states only. Existing App, PersonaPicker, direct hooks, and public scan path remain untouched until their owning packets are authorized.

## Shared security changes

Owner/Member only; opaque single-use invitation secrets; atomic acceptance/claim; no name/emoji/PIN authority; inactive/removed denial; private object substitution denial; current authorized Group subscription; no global notification centre.

## Shared test fixtures

Bootstrap retry/concurrency, invitation expiry/revocation/replay/wrong-account, last-Owner, claim conflict, two-Group object substitution, Group switch clearing/unsubscribe, reconnect, stale-event, archive, and current-user-removal cases.

## Integration checkpoints

Review packet interfaces, shared repository paths, design traceability, R-02 obligations, test fixtures, and rollback assumptions before a dependent packet starts.

## Rollback checkpoint

No partially created Group, Membership, claim, private object, or subscription authority may be exposed; retain safe state and reconcile.

## Required evidence and Wave exit gate

Atomic bootstrap/lifecycle/claim evidence and private/realtime two-Group evidence; no partial authority.

## Downstream consumers

W4 Group-scoped product packets and W5 migration.

## Known risks

Legacy persona state, public tickets bucket, public global channels, and name-based records require controlled replacement.

## Stop conditions

Stop for ownerless/unconfigured Group, invitation replay, claim ambiguity, public object access, or stale realtime delivery.

## IR-003 pre-authorisation coordination freeze

IR-003 now has a documentation-only DBM-014/TOP-001 freeze. Its absent future
migration is exactly `010_ir003_atomic_group_bootstrap.sql`; it may own only
atomic new-Group bootstrap, the minimum display-currency child set,
TOP-001-specific idempotency, and its narrowly dedicated executor/grants.
TOP-002–TOP-007 remain IR-005, including every Invitation record, secret,
link, copy/share action, and lifecycle result.

If IR-003 is later separately authorised, work divides into four non-overlap
lanes: A migration/TOP only; B database adversarial contract tests only; C
isolated failure/rollback/performance/evidence only; D authenticated onboarding
adapter/browser/static tests only. A future integration worktree alone merges
those handoffs and writes generated types after the authorised migration; a
fresh detached verifier independently accepts/rejects the candidate. Exact
paths, prerequisites, artifacts, and prohibited paths are in the IR-003
packet. No W3 packet is authorised by this coordination record.

`F-IR003-FREEZE-001` records that the accepted composite ONB-06 visual state
cannot supply IR-003's required committed-success destination: it asserts an
issued Invitation link, while IR-003 cannot issue one. `ONB-09` and `ONB-10`
are owned by IR-006 and IR-011, respectively. `BLK-IR003-FREEZE-001` / `OE-006`
therefore blocks IR-003 onboarding completion and controlled GATE-031 package
preparation pending the Proposed `DCC-IR003-FREEZE-001` staged ONB-06 decision.
No linkless replacement may be implemented before the accepted-design process
decides it; IR-005 retains every issued-Invitation link/copy/share behaviour.

## Implementation-authorisation status

The separate GATE-015 W3-entry review is **Satisfied**. Every frozen W2 exit
prerequisite has passed: IR-004, IR-007, and IR-008 are Verified; corrected
GATE-013 is Satisfied; W2 is Complete; and no unresolved W2 implementation
defect is recorded. GATE-014 remains a named IR-006 authorisation prerequisite
only and does not block this W3-entry decision.

IR-003 remains **Not authorised**. GATE-031 remains **Not satisfied**. Resolve
the bounded ONB-06 design decision before preparing its controlled GATE-031
package; then a separate IR-003 authorisation remains required. No W3 packet
or physical trusted operation is authorised, and deployment and cutover remain
unauthorised.
