# W2 — Auth, security, and trusted operations

## Status and authorisation

- Status: Complete; IR-004 Verified; IR-007 Verified; IR-008 Verified
  (contract validation and immutable evidence only)
- Physical owner packets: Not authorised
- Wave complete: Yes

## Wave objective

Session-derived actor identity, deny-by-default policy design, secret handling,
service-role confinement, two-Group security evidence, and the common
trusted-operation contract/readiness boundary.

## IR packets

- [IR-004 — Auth, Profile, session](../packets/IR-004-auth-profile-and-session.md)
- [IR-007 — RLS and ownership](../packets/IR-007-rls-and-ownership.md)
- [IR-008 — Trusted operations](../packets/IR-008-trusted-operations.md)

## Accepted entry conditions

W1 ownership model passes and a safe environment boundary is recorded.

## Internal execution order

IR-004 precedes IR-007; IR-007 precedes IR-008. IR-008 freezes the common
trusted-operation boundary only; no authoritative lifecycle operation begins
until its separately authorised physical owner packet implements it.

## Parallel work boundaries

Documentation and test-fixture preparation may parallelize, but Auth, RLS, and trusted-operation authority remain serial.

## Shared schema changes

IR-004 alone may implement DBM-003: Profile/Auth linkage and own-Profile privacy. DBM-006 and every Group/data policy remain IR-007 work; no later table-specific policy is implied.

## Shared frontend changes

IR-004 implements only AUTH, SHL-02, and PERM-19 through its frozen allow-list. The legacy workspace cannot render after Auth until later Group/security/application packets; legacy persona source remains source-preserving.

## Shared security changes

Supabase Auth is the authority; no persona/PIN/name is authority. Define expired/continued-session handling, active/inactive-member denial, direct substitution, service-role confinement, and no permissive activation interval.

## Shared test fixtures

Use the IR-001 capability decision for authenticated/unauthenticated accounts, expired/reset/verification/invitation continuation, two-Group negatives, and audit-safe trusted-operation failure/replay/race cases.

## Integration checkpoints

Review packet interfaces, shared repository paths, design traceability, R-02 obligations, test fixtures, and rollback assumptions before a dependent packet starts.

## Rollback checkpoint

Target paths remain inaccessible until security evidence passes; no permissive fallback.

## Required evidence and Wave exit gate

GATE-013 requires verified Auth/session and deny-by-default ownership RLS
boundaries, the verified common trusted-operation contract, frozen TOP
inventory/physical-owner map, `auth.uid()`-first current membership/role/archive
revalidation requirements, transaction/idempotency/concurrency/audit/
secret-safety obligations, and the no-generic-proxy/no-browser-service-role
prohibitions. It does not require physical TOP execution or its rollback,
idempotency, concurrency, audit, or performance evidence; each remains at the
separately authorised physical owner packet exit.

## Downstream consumers

W3 lifecycle, Storage, and Realtime packets.

## Known risks

Current code has no Auth helper, current migrations use permissive policies, and current Edge Function uses service role.

## Stop conditions

Stop for a browser service-role route, client authority, policy gap, or cross-Group success.

## Implementation-authorisation status

IR-004 is independently verified in
[`../ir-004-verification.md`](../ir-004-verification.md). IR-007 is independently
Verified in [`../ir-007-verification.md`](../ir-007-verification.md) within its
frozen authorisation. IR-008 is independently Verified in
[`../ir-008-verification.md`](../ir-008-verification.md) for its common TOP and
service-role contract evidence only; no physical TOP, DBM unit, or migration is
implemented. Corrected GATE-013 is Satisfied and every frozen W2 exit criterion
passes, so W2 is Complete. This completion implements or verifies no physical
TOP; all physical evidence remains at the separately authorised owner packet
exit.

The separate GATE-015 W3-entry review is Satisfied: W3 entry prerequisites
from W2 have passed, but this decision does not authorise a W3 packet or
physical operation. IR-003 remains unauthorised and is additionally blocked by
unsatisfied GATE-031. No validated initial Owner Auth identity, reviewed
bootstrap request/execution manifest, mandatory Group configuration evidence,
or required product/data/security/architecture approvals are recorded. Storage
(IR-009), Realtime (IR-010), product conversion, deployment, and cutover remain
unauthorised.
