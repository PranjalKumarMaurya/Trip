# IR-001 Completion Package — Implementation Evidence for Review

## Status and review boundary

- IR item: IR-001 — Evidence Foundation
- Implementation status: **Implemented and Verified**
- Implemented / Verified: **Claimed by final independent review**
- W1 exit: **Not claimed**
- IR-002 authorisation: **Not claimed**
- Package purpose: index the bounded implementation evidence for separate
  architecture, security, database, test, operations, and product review.

This package records evidence capability only. It does not self-verify IR-001,
declare a gate pass, or establish any target application feature, schema,
policy, deployment, or production authority.

## Implementation summary and commits

| Commit | Subject | Bounded outcome |
|---|---|---|
| `b31232f` | `test(ir-001): establish evidence tooling` | Exact reviewed development dependencies, Node test/type capability, status progression, and initial tooling evidence record. |
| `8e20b56` | `test(ir-001): add deterministic fixture foundation` | Fixed clock and isolated two-account/two-Group in-memory fixture contract. |
| `64ec355` | `test(ir-001): add isolated security test harness` | Database-only local Docker RLS capability canary, safe cleanup, and boundary record. |
| `1c7cdf9` | `test(ir-001): add browser evidence capability` | Local Playwright baseline-boot capability with synthetic loopback environment and external-request interception. |
| `5a55e79` | `test(ir-001): add failure injection evidence` | Controlled database cleanup failure and browser-artifact failure evidence. |
| `755257c` | `chore(ir-001): add CI evidence gates` | Non-deploy CI evidence plan and safe checksum-manifest capability. |

All implementation detail, command results, corrections, boundaries, and
rollback paths are recorded in
`docs/implementation-execution/ir-001-tooling-decision.md`.

## Dependency decision and tooling inventory

| Item | Decision / evidence | Removal or rollback |
|---|---|---|
| `@playwright/test@1.52.0` | Approved exact development dependency; metadata recorded Apache-2.0, Node `>=18`, matching Playwright dependency. Local managed browser install resolved Chromium `136.0.7103.25` build `1169`, matching headless shell, and supporting FFMPEG `1011` under ignored `node_modules`. | Remove the root devDependency, restore the prior lockfile in a bounded revert, and delete the ignored local browser directory. |
| `supabase@2.105.0` | Approved exact development dependency; metadata recorded MIT and platform-specific optional CLI binaries. It is used only through the repository-pinned CLI and exact local project identifier. | Remove the root devDependency and restore the prior lockfile in a bounded revert. |
| Unit / test type tooling | Node 22 built-in `node:test` plus `tsconfig.tests.json`; no duplicate unit-test runner was introduced. | Revert test scripts, test TypeScript configuration, fixtures, and unit tests. |
| Browser tooling | Playwright config starts only local Vite with synthetic loopback inputs and blocks non-loopback browser requests. | Revert config/tests/scripts and remove ignored artifacts. |
| Database tooling | Supabase CLI, runner-local Docker, existing `psql`, a test-only config outside the root `supabase/` workdir, and exact `ir001_probe` schema. | Stop only the exact project, verify no matching Docker resource, remove verified generated CLI state, and revert test-only files. |
| CI / evidence tooling | GitHub Actions workflow, SHA-256 manifest writer, ignored artifact directory, 14-day configured retention. | Revert workflow/script/entry; no external configuration or deployment has been changed. |

The approved dependency installation changed only `package.json` and
`package-lock.json` at that time. The original `npm audit` baseline contained
11 findings; the approved tooling installation reported 13 findings. IR-001
did not upgrade, suppress, remediate, or otherwise alter either the 11 original
findings or their remediation status. Any audit disposition remains separate
review work.

## Capability evidence index

| Capability | Command / method | Result / retained evidence |
|---|---|---|
| Type and build | `npm run typecheck`, `npm run test:types`, `npm run build` | Passed repeatedly after the relevant commits. |
| Deterministic unit evidence | `npm test` | Four Node tests passed: fixed clock, account/Group identity separation, expected same-Group/cross-Group/lifecycle matrix, and idempotent in-memory cleanup. |
| Two-account/two-Group fixture | `tests/fixtures/two-account-two-group.ts` | Stable synthetic IDs: Account A/Group A and Account B/Group B; no overlapping identities, personal emails, production UUIDs, tokens, or copied production values. |
| Database/RLS canary | `npm run test:db` | Local-only test schema allowed two same-scope reads and denied two cross-scope, inactive, and removed cases; latest normal result recorded `runMode: normal` and cleanup confirmed. This is not a target Group or production RLS policy. |
| Browser baseline boot | `npm run test:browser` | One Playwright Chromium test passed using local Vite, a fixed mobile viewport, synthetic loopback variables, and pre-navigation non-loopback request aborts. |
| Database failure injection | `npm run test:db:failure` | Driver passed only after its child returned expected exit `1`, recorded `controlled-failure-injected`, dropped the exact schema, and removed exact Docker resources. |
| Browser failure injection | `npm run test:browser:failure` | Driver passed only after its child returned expected exit `1` and one ignored screenshot, error context, and failed-run metadata were retained. |
| Checksum / evidence manifest | `IR001_EVIDENCE_JOB=browser|database npm run test:evidence:manifest` | Value-free manifests recorded safe metadata, artifact paths, byte counts, and SHA-256 checksums. Browser retained three generated files; database retained one allow-listed result representation. |
| CI evidence plan | `.github/workflows/ir-001-evidence.yml` | YAML parsed locally. The workflow has not run in repository-hosted CI and is not treated as CI evidence or a gate pass. |

All commands were run from the repository root unless a row explicitly names
the isolated local Supabase workdir. The tooling decision record retains the
concise command outcomes, correction/rerun results, and generated evidence
conventions. `git diff --check`, narrow changed-content secret scans, and scope
reviews passed before each scoped commit.

## Environment, isolation, reset, and secret safety

| Boundary | Evidence |
|---|---|
| Database environment | Ephemeral local Docker only, project identifier `bachelor-trip-app-ir001`, fixed local ports, no login/link/remote database/deployment command, no external Supabase project or credential. |
| Database scope | Only test-only `ir001_probe` schema/table/policy and exact local Docker resources. Root migrations, seed, functions, public schema, target tables, target RLS, Storage, Realtime, and production resources remained untouched. |
| Reset and cleanup | The harness refuses pre-existing exact resources, accepts only the documented loopback endpoint, drops only `ir001_probe`, stops only the exact project from the isolated workdir, verifies no matching containers/networks/volumes, and removes only verified generated CLI state. |
| Browser environment | Local Vite preview at `127.0.0.1:4173`, synthetic non-secret Supabase inputs, and browser routing that aborts all non-loopback traffic. No browser request can reach hosted Supabase or current external assets. |
| Secret-safe evidence | Harnesses capture raw child output and emit only allow-listed categories and values. Narrow source/generated-artifact scans found no candidate credential, token, or private-key literal. The manifest writer copies only an allow-listed safe database representation. |
| Evidence retention | Generated browser artifacts and manifests live under ignored `artifacts/ir-001/`. The local database result is session-local until copied in sanitized form. CI is configured for 14-day artifact retention, subject to external repository policy review. |

One non-interactive local command wrapper ended near its timeout while the
database harness had entered cleanup. That incomplete run was not accepted as
passing. Only the verified exact local project was stopped, verified CLI state
was removed, and the normal and injected database commands were rerun in an
interactive session to completion.

## CI and hosted-review boundary

The workflow uses separate browser and database jobs on `ubuntu-22.04`, each
with `npm ci`, read-only repository contents, no declared secrets, no deployment
step, and no hosted Supabase reference. It uploads only ignored generated
evidence after the configured tests. Its database job asserts that no exact
local project container, network, or volume remains.

The following cannot be proven from the local repository and remains for
separate review: hosted workflow execution, GitHub Actions access settings,
artifact access, retention enforcement, branch protection, runner availability,
and reviewer acceptance.

## GATE-007 through GATE-010 evidence position

| Gate | Evidence prepared | Status |
|---|---|---|
| GATE-007 — reviewed test/evidence/CI capability | Tooling decision, exact dependency record, Node/Playwright/Supabase capability, failure injection, retention/checksum conventions, CI workflow and removal paths. | **Satisfied** by the final independent review and hosted workflow `30627419186`. |
| GATE-008 — isolated database/RLS and browser capability | Local-only RLS canary, two synthetic scope boundaries, cleanup proof, browser baseline boot, failure drivers, artifact record. | **Satisfied** by the final independent review; hosted evidence is authoritative under `CC-IR001-20260731`. |
| GATE-009 — reproducible two-account/two-Group fixture | Fixed clock, stable synthetic fixture IDs, expectation matrix, deterministic reset/cleanup, and database canary mappings. | **Satisfied** by the final independent review. |
| GATE-010 — reviewed test environment and secret-safe access | Local Docker/browser boundary records, safe credentials category, cleanup scope, secret scans, manifest allow-list, and CI plan. | **Satisfied** by the final independent review; SEC-IR001-001 is closed and hosted retention/access were reviewed. |

## R-02 contribution and exclusions

IR-001 contributes a deterministic browser runner, fixed mobile viewport,
failure-artifact convention, and local-only network boundary that later owners
may use for accessibility evidence. It does **not** verify contrast, touch
targets, keyboard order, focus, modal behaviour, reduced motion, screen-reader
announcements, safe-area behaviour, or any flow-specific R-02 obligation.
R-02 remains open and is owned by the packets listed in the accepted
accessibility verification plan.

No product feature work occurred. In particular, IR-001 did not modify `src/`,
root Supabase configuration, migrations, seed, target Group or membership
schema, target production RLS, Auth conversion, Storage, Realtime, Active
Group state, application screens, UI design, migration transforms, deployment,
or cutover.

## Open review items and requested decision

1. Review the selected test, database, browser, failure-injection, checksum,
   and CI capability for GATE-007–010; do not infer a gate pass from this
   package.
2. Run and review the GitHub Actions workflow in the repository-hosted service;
   verify runner/Docker availability, artifact retention/access, and branch
   policy externally.
3. Review the 13-finding post-install audit report separately; IR-001 made no
   remediation decision.
4. Review the Playwright Ubuntu 20.04 fallback-browser notice for the local
   host; no compatibility claim is made for untested hosted runners.
5. Reconcile the authorisation record's legacy `Starting repository commit`
   field (`f31233b8ed24428ec4c3188da38852516ed11929`) with this session's
   mandatory preflight, which confirmed the expressly authorised starting HEAD
   `20d2855091efea7e1aec9231237a7f8c3227e815`. The field was not silently
   changed during implementation; governance review should resolve the record.

Until those reviewers decide, IR-001 remains In progress; W1 exit and IR-002
remain blocked.

## Combined evidence correction addendum — 2026-07-31

The prior completion review recorded two evidence-integrity findings. Bounded
correction commit `43d839b4e546188b1e60e56ff0515ff8826b6cfa` excludes raw
Playwright error context from retained/uploaded browser evidence and replaces
the mutable database manifest input with three explicit sanitised phase
records (initial normal, controlled failure, and recovery normal) bound to one
safe evidence sequence. The corrected manifest accepts only those allow-listed
repository-relative records and rejects incomplete, mixed, stale, unsafe, or
wrong-mode evidence.

This addendum is not a verification claim. Restart the full IR-001 completion
and verification review from mandatory preflight at the clean correction head;
do not resume the stopped review. IR-001 remains In progress, GATE-007 through
GATE-010 remain unchanged, W1 exit remains blocked, and IR-002 remains
unauthorised. See
`ir-001-correction-F-IR001-VER-001-002.md` for the correction evidence.
