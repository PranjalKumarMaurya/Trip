# W2 — Auth, security, and trusted operations

## Status and authorisation

- Status: In progress; IR-004 Verified; IR-007 Verified; IR-008 Authorised,
  implementation not started
- Physical owner packets: Not authorised
- Wave complete: No

## Wave objective

Session-derived actor identity, deny-by-default policy design, secret handling, service-role confinement, and two-Group security evidence.

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

Auth/session privacy, matrix, rollback, secret, and two-Group evidence design; no incomplete authoritative atomic operation.

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
frozen authorisation. IR-008 is authorised only to freeze its common TOP and
service-role contract; its implementation is not started and no physical TOP is
implemented. GATE-013 remains Not satisfied because owner-packet trusted-
operation/service-role rollback evidence is absent. W2 remains In progress.
IR-003, Storage (IR-009), Realtime (IR-010), product conversion, deployment,
and cutover remain unauthorised.
