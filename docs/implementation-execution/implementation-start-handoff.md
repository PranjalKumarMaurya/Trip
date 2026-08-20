# Implementation Start Handoff

## Current repository state

- Branch: v2
- Architecture: Accepted and Locked
- UI Baseline: Accepted and Locked
- UI/UX Design: Accepted and Locked
- Execution Package: Accepted and Locked
- Planning Freeze: Complete
- IR-001, IR-002, IR-004, and IR-007: Verified
- IR-008: Verified for common trusted-operation contract/static evidence only
- W1: Complete; GATE-011: Satisfied
- W2: Complete; GATE-012 and GATE-013: Satisfied
- GATE-015: Satisfied; W3 entry prerequisites from W2: passed
- IR-003: Authorised — implementation not started or verified; GATE-031: Satisfied
- GATE-031 decision: recorded in `gate-031-decision.md`; protected evidence,
  Product, Data, Security, and Architecture approvals passed the separate
  gate decision
- IR-003 authority: `authorisations/IR-003-authorisation.md`; only its frozen
  DBM-014/TOP-001 lanes may begin
- Other physical trusted operations: none authorised
- Deployment: Not authorised
- Production cutover: Not authorised

The remaining sections preserve the original IR-001 start handoff. They are
historical instructions, not current implementation authority.

## Historical first implementation objective

IR-001 — Evidence Foundation.

## Mandatory documents to read

- [authorisations/IR-001-authorisation.md](authorisations/IR-001-authorisation.md)
- [packets/IR-001-evidence-foundation.md](packets/IR-001-evidence-foundation.md)
- [waves/W1-evidence-and-tenant-foundation.md](waves/W1-evidence-and-tenant-foundation.md)
- [gate-ledger.md](gate-ledger.md)
- [codebase-inspection.md](codebase-inspection.md)
- [repository-change-map.md](repository-change-map.md)
- [test-and-evidence-plan.md](test-and-evidence-plan.md)
- [security-verification-plan.md](security-verification-plan.md)
- [accessibility-verification-plan.md](accessibility-verification-plan.md)
- [environment-and-secret-boundaries.md](environment-and-secret-boundaries.md)
- [rollback-and-recovery-plan.md](rollback-and-recovery-plan.md)
- [open-items.md](open-items.md)
- [change-control.md](change-control.md)

## Before changing files

Require:

- branch verification;
- commit verification;
- clean worktree;
- current build command;
- current type-check command;
- current test capability inventory;
- package-manager verification;
- no unrelated changes;
- no production environment use; and
- no secret output.

## Authorised work

IR-001 may re-validate build, lint, and type-check capability; select and
document reviewed unit, browser, isolated database/RLS, failure-injection,
fixture, evidence-output, reset/cleanup, and CI capability; establish
deterministic clocks and reproducible two-account/two-Group fixtures; validate
the test-environment boundary; keep logs and evidence secret-safe; and generate
only IR-001-owned implementation evidence. Dependency or configuration changes
are allowed only when the reviewed tooling decision requires them and the
authorisation record's path boundary is followed.

## Prohibited work

- IR-002 through IR-022 and all later-Wave work.
- Target tenant schema, Group tables, Group Member schema, Auth UI conversion,
  Group creation, Invitations, Participant claiming, product screens, finance,
  documents, migration transforms, or application-feature implementation.
- Production migrations, RLS, Storage, Realtime, trusted product mutations,
  deployment, production cutover, and W7.
- Production environment use, production secret use, production database
  mutation, or recording a secret value.

## Commit discipline

Require:

- small scoped commits;
- no mixing of feature work;
- tests and evidence with each capability;
- report before adding a new dependency;
- no push unless separately instructed; and
- provide commit hash after each accepted implementation phase.

## Evidence discipline

Require:

- commands executed;
- exit results;
- fixture identities without secrets;
- environment classification;
- generated evidence paths;
- failures encountered;
- rollback/reset proof; and
- no fabricated success.

## Stop conditions

Follow the stop conditions in
[authorisations/IR-001-authorisation.md](authorisations/IR-001-authorisation.md).

## IR-001 exit

Implementation completion does not automatically verify IR-001. A separate
IR-001 completion and verification review must assess evidence and GATE-007
through GATE-010 before IR-002 may be authorised.
