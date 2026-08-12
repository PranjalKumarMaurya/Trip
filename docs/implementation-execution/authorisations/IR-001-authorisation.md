# IR-001 Authorisation Record

## Status

- IR item: IR-001
- Title: Evidence Foundation
- Wave: W1
- IR-001 status: Implemented and Verified
- Authorisation decision: Approved
- IR-001 authorised: Yes
- IR-001 started: 2026-07-31
- IR-001 implemented: Yes
- IR-001 verified: Yes
- W1 status: Complete; GATE-011 Satisfied
- IR-002 status: Verified — separate authorisation closed
- Application implementation scope: IR-001 only (historical authorisation
  scope)
- Authorisation date: 2026-07-30
- Reviewer:
  Pranjal Kumar Maurya — product owner
- Starting repository commit:
  f31233b8ed24428ec4c3188da38852516ed11929
- Authorisation commit:
  Recorded by this commit

## 1. Authorised objective

IR-001 may establish the evidence and test foundation required by the locked
execution package. It establishes capability and retained implementation
evidence; it does not implement product behaviour or any later packet.

## 2. Authorised scope

The authorised Evidence Foundation scope is limited to:

- re-validating current build, lint, and type-check capability;
- selecting appropriate test and evidence tooling;
- adding reviewed test dependencies where required;
- unit-test capability;
- browser-test capability;
- isolated database and RLS-test capability;
- deterministic clocks and fixtures;
- two-account and two-Group fixtures;
- failure-injection support;
- evidence-output conventions;
- test cleanup and reset capability;
- safe CI evidence gates;
- test-environment boundary validation;
- secret-safe logging and evidence;
- documenting selected tooling and commands; and
- generating implementation evidence owned by IR-001.

This scope is evidence capability only. It must not be used to implement an
application feature, target authority, schema, policy, or production change.

## 3. Repository boundary

### Permitted confirmed paths

- `package.json` and `package-lock.json` only when a reviewed tooling decision
  requires an exact dependency or script change; dependency impact, security,
  licensing, removal path, and approval must be recorded before the change.
- `vite.config.ts`, `tsconfig.json`, and `tsconfig.node.json` only for reviewed
  build, type-check, or selected-tool integration.
- `.env.example` only for a value-free, browser-safe environment example or
  boundary clarification.
- `docs/implementation-execution/` for the IR-001 tooling decision, commands,
  boundary records, and retained evidence documentation.

### Permitted proposed paths

- `tests/`, `.github/workflows/`, and `artifacts/` are **Proposed path — verify
  at packet start**. They do not exist in the inspected repository.
- The exact path for new test configuration, fixtures, isolated database/RLS
  helpers, browser configuration, failure injection, and generated test output
  is not established. It may be created only after the selected tooling and
  its location have been reviewed and verified.

### Generated evidence paths

- `docs/implementation-execution/` is the confirmed documentation location for
  IR-001 decision and evidence records.
- No dedicated generated test-artifact directory is confirmed. `artifacts/`
  remains a Proposed path — verify at packet start; it is not an existing
  evidence directory or an authority to generate unreviewed artifacts.

### Read-only inputs

- `docs/architecture/README.md` and
  `docs/architecture/implementation-roadmap.md`.
- `docs/ui-baseline/acceptance-record.md`.
- `docs/ui-design/acceptance-record.md` and
  `docs/ui-design/final-design-acceptance-review.md`.
- `docs/implementation-execution/acceptance-record.md`, `lock-record.md`,
  `implementation-readiness-review.md`, `execution-package-review.md`,
  `gate-ledger.md`, `codebase-inspection.md`, `execution-order.md`,
  `dependency-graph.md`, `repository-change-map.md`,
  `test-and-evidence-plan.md`, `security-verification-plan.md`,
  `accessibility-verification-plan.md`, `environment-and-secret-boundaries.md`,
  `rollback-and-recovery-plan.md`, `open-items.md`, and `change-control.md`.
- The locked scope, dependencies, and exit gate in
  `docs/implementation-execution/packets/IR-001-evidence-foundation.md` and
  `docs/implementation-execution/waves/W1-evidence-and-tenant-foundation.md`.
  Evidence may be appended only under the existing packet evidence rules; the
  locked scope itself remains read-only.
- The accepted architecture, accepted UI baseline, and accepted UI/UX design
  packages.

### Explicitly prohibited paths and systems

- Application-feature implementation under `src/`, including `src/App.tsx`,
  `src/tabs/`, `src/components/`, `src/hooks/`, `src/lib/`, `src/constants/`,
  and `src/styles/`.
- `supabase/migrations/`, `supabase/seed.sql`, and
  `supabase/functions/parse-document/index.ts`; no migration, SQL, RLS,
  Storage, Realtime, or trusted product operation belongs to IR-001.
- Writes to `docs/architecture/`, `docs/ui-baseline/`, or `docs/ui-design/`;
  these are locked inputs.
- Any deployment, production project, production database, production Storage,
  production Realtime, production credential, production secret, or cutover
  system.

## 4. Dependency and package boundaries

- IR-001 has no direct IR dependency.
- IR-002 was outside this authorisation's scope.
- Later Waves remain unauthorised.
- Architecture and design remain locked inputs.
- No scope may move into IR-001 without change control.

## 5. Environment boundary

- Isolated/local/test environment only.
- No production mutation.
- No production service-role credential.
- No secret value in repository or logs.
- External test-environment evidence remains required before W1 exit.

## 6. Required implementation evidence

IR-001 completion must establish evidence capability, not feature behaviour.
The completion review requires:

- selected and documented test stack;
- working unit-test command;
- working browser-test command or reviewed browser capability;
- isolated database/RLS-test approach;
- deterministic fixture capability;
- reproducible two-account fixture;
- reproducible two-Group fixture;
- safe setup, reset, and cleanup;
- failure-injection approach;
- evidence-output convention;
- CI integration or reviewed CI execution plan;
- environment and secret boundary record;
- evidence that no production mutation occurred;
- evidence that no application feature implementation occurred;
- GATE-007 through GATE-010 evidence prepared; and
- no claim of W1 exit until every W1 condition passes.

## 7. R-02

R-02 remains open. IR-001 may establish accessibility automation capability,
but it does not close flow-specific running-build verification owned by later
packets.

## 8. Stop conditions

Stop and request review for:

- a required production credential;
- an architecture contradiction;
- a design contradiction;
- cross-Group access;
- insecure secret handling;
- inability to isolate test data;
- a destructive operation against non-test data;
- an unreviewed dependency with security or licensing impact;
- scope crossing into IR-002 or later work; or
- missing rollback/reset capability.

## 9. Explicit exclusions

This authorisation does not authorise:

- IR-002 through IR-022;
- target tenant schema;
- application feature implementation;
- migrations;
- production RLS;
- production Storage;
- production Realtime;
- deployment;
- cutover; or
- W2 through W7.

## 10. Start rule

IR-001 implementation may begin in a new implementation session only from the clean repository commit created by this authorisation decision. The executor must re-verify the branch, commit, clean worktree, authorised scope, and stop conditions before changing any implementation file.
