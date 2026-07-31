# W1 — Evidence and tenant foundation

## Status and authorisation

- Status: Complete
- Implementation authorised: IR-001 and bounded IR-002 only
- IR-001: Implemented and Verified
- IR-002: Implemented and Verified
- W1 In progress: No
- W1 exit achieved: Yes
- Wave complete: Yes

## Wave objective

No feature UI, production data action, or deployment is permitted. IR-002 may
perform only its authorised isolated local schema/evidence work.

## IR packets

- [IR-001 — Evidence foundation](../packets/IR-001-evidence-foundation.md)
- [IR-002 — Tenant data foundation](../packets/IR-002-tenant-data-foundation.md)

## Accepted entry conditions

GATE-002 through GATE-005 are satisfied for bounded IR-001 entry: the package
is accepted and locked, IR-001 is explicitly authorised, and the
repository-visible environment-boundary inventory is complete. A selected test
runner, browser harness, RLS harness, CI platform, test project, deployed-state
inventory, or source snapshot is not required to begin IR-001.

## Internal execution order

IR-001 and IR-002 are implemented and verified. W1 is complete. IR-022
governance evidence may be maintained in parallel but does not substitute for
later packet authorisation.

## Parallel work boundaries

Only static traceability and governance recording may run beside IR-001. IR-002
is serial after IR-001 because schema and parent-path evidence must be testable.
GATE-007 through GATE-010 remain W1-exit requirements, and W2 remains blocked
until W1 exit is explicitly achieved.

## Shared schema changes

IR-002 may create only its authorised tenant, configuration, archive, audit,
and generated-type foundation in an isolated local environment. It may not
create product authority, Auth UI, RLS, Storage, Realtime, legacy transforms,
or production schema state.

## Shared frontend changes

None. The current fixed five-tab SPA, PersonaPicker, and local persona state are inspection inputs; W1 must not implement or replace them.

## Shared security changes

Define, but do not apply, parent-derived Tenant scope and a deny-by-default transition strategy. Browser-safe and server-only boundaries must be inventoried without recording values.

## Shared test fixtures

Two accounts/two Groups, deterministic clocks, isolated source/fixture data,
failure injection, database/RLS/browser capability, checksum evidence, and
CI-gate selection are IR-001 outputs required at W1 exit (GATE-007–010).

## Integration checkpoints

Review packet interfaces, shared repository paths, design traceability, R-02 obligations, test fixtures, and rollback assumptions before a dependent packet starts.

## Rollback checkpoint

No authoritative change may start; correct the capability or ownership-model gap before W2.

## Required evidence and Wave exit gate

Isolated fixture/schema capability, parent-path and two-Group test design, environment/secret boundary record, and W1 blocker register.

## Downstream consumers

W2 Auth and security packets, plus all later Tenant-scoped work.

## Known risks

Test capability and test-environment boundaries must be established before W1
exit. Deployed topology and source facts first affect W5; they do not block W1
entry.

## Stop conditions

Stop for missing isolated fixture capability, ambiguous parent ownership, or a proposed permissive transition.

## Implementation-authorisation status

IR-001 and IR-002 are implemented and verified. GATE-007 through GATE-011 are
satisfied, no W1 blocker remains, and W1 exit is achieved. GATE-012 remains
required before W2 entry; no W2 packet is authorised by this closure.

## W1 closure

W1 completed through IR-001 Implemented and Verified; GATE-007 through
GATE-010 Satisfied; IR-002 Implemented and Verified; and GATE-011 Satisfied.
Deployment and cutover remain unauthorised. The next task is preparation of a
separate bounded IR-004 Auth, Profile and Session authorisation package.
IR-003 must not begin merely because its database prerequisites now exist, and
no W2 implementation may begin without GATE-012 and separate product-owner
acceptance.

W1 contains no feature UI implementation.
