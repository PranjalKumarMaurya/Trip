# IR-001 Consolidated Blocker Sweep and Correction Record

## Boundary and outcome

- Date: 2026-07-31
- IR item: IR-001 — Evidence Foundation
- Starting correction head: `2cb2d67de70da277eefe03aa4d661faf8c18a849`
- Combined implementation: `626ae2615f5f8d17d391287968afb8a4c096bbc5`
- Hosted-execution correction: `e83554c410c934a28946be20dbd311916d92506a`
- Current decision: **Implementation evidence ready for final independent verification**

This session was a consolidated correction and hosted-evidence rehearsal. It
does not verify IR-001 or promote any gate or Wave status.

## Blocker results

| ID | Result |
|---|---|
| F-IR001-VER-001 | Browser raw diagnostic output remains temporary; the retained safe summary/screenshot set passed locally and in the hosted browser job. |
| F-IR001-VER-002 | Three phase-specific sanitised database records passed locally and in hosted CI, including recovery as the most recent phase. |
| F-IR001-VER-003 | Exact `@playwright/test@1.55.1` resolves aligned `playwright` and `playwright-core` `1.55.1`; `GHSA-7mvr-c777-76hp` is absent. |
| F-IR001-VER-004 | Exact resource polling replaced the single immediate assertion. Local normal, controlled-failure, and recovery cleanup required one to three seconds; the hosted job's final exact cleanup assertion also passed. |
| F-IR001-VER-005 | The old display-stream parser returned the safe `context-unavailable` fallback at hosted `same-scope-account-a`. Commit `7a566338248b0df7ac42414dbc664138bee9c655` uses a strict `COPY TO STDOUT` one-record JSON contract. Hosted run `30624184154` passed the complete database lane and artifact review. |

## Dependency and local evidence

- Before the exact Playwright update, audit reported 13 findings: 1 low, 3
  moderate, and 9 high; the affected Playwright advisory was present.
- After the update, audit reported 11 findings: 1 low, 3 moderate, and 7
  high. Runtime-only audit remains one pre-existing high finding. No new high
  or critical finding was introduced.
- Clean install, type-check, test type-check, two 18-test unit runs, and build
  passed. The additional tests cover CI retry-safe screenshot selection and
  exact Docker-resource cleanup polling/timeout behaviour.
- Local browser install used Chromium `140.0.7339.186` build `1193`. The
  unsupported-host Ubuntu 20.04 fallback notice remains a local limitation,
  not a hosted compatibility claim.
- Local browser normal/failure/manifest commands passed; two browser manifests
  were deterministic. Retained browser evidence contains only
  `controlled-failure.json` and `controlled-failure.png`.
- Local database normal → controlled-failure → recovery passed. The three
  sanitised records share one sequence ID; two database manifests were
  deterministic. Exact cleanup polls succeeded after every phase.
- Retained evidence path and secret scans passed; manifests' byte counts and
  SHA-256 values matched; all generated evidence remains ignored.

## Cleanup correction

The prior harness ran exact project-scoped `supabase stop`, but checked Docker
only once immediately afterward. Docker removal was observed to be eventually
consistent. The new support module accepts only exact IR-001 container,
network, and volume names; it polls for at most ten seconds and reports only
safe resource categories when cleanup times out. It never removes Docker
resources directly or uses a partial-name match. The common probe `finally`
path applies this check to normal completion, controlled failure, failed start,
and recovery; CI runs the same checker after its database job.

## Hosted rehearsal

- Temporary branch: `review/ir-001-consolidated-evidence`
- Draft PR: #1, open and unmerged, into `v2`
- First run `30618949964` at `626ae26…`: browser retry artifact assumption and
  database normal capability failed. Its results were collected before changes.
- Second run `30619260158` at `e83554c…`: Browser evidence passed on
  `ubuntu-22.04`, including install, normal boot, controlled failure, manifest,
  upload, and a downloaded artifact review. The database job failed in its
  first normal phase; its exact cleanup assertion passed.
- The browser artifact is 40,686 bytes, configured for 14-day retention, and
  expires 2026-08-14. The repository is public; the artifact was inspected by
  an authenticated repository reviewer. It contains only the safe summary,
  screenshot, and manifest.
- No deployment, environment, declared secret, hosted Supabase project, or
  production operation appears in the workflow. Actions-action Node 20
  deprecation annotations are non-blocking platform notices; repository test
  jobs run on Node 22.

## Rollback and remaining boundary

Revert `e83554c…` and `626ae26…` to remove the correction code and restore the
prior lockfile/tooling state; this would restore a vulnerable Playwright tool
version and is not an acceptable final security state. Generated evidence can
be removed only from the verified ignored IR-001 artifact paths.

F-IR001-VER-005 was resolved without changing the six RLS allow/deny cases,
introducing external Supabase access, modifying product code, or broadening
Docker cleanup. Its strict contract rejects command-status, multiline, or
multiple-record output rather than inferring a JSON-looking display line. The
prior safe record cannot recover the raw hosted client text because retaining
that text would violate the established evidence boundary; the successful
`ubuntu-22.04` run proves the replacement contract on the hosted client path.

## Final browser-security correction — 2026-07-31

- Implementation commit: `b4967f7e89224111d21319fb36ca51035b98554b`
  (`fix(ir-001): secure browser failure evidence`).
- F-IR001-VER-007 removed the stale requirement for raw Playwright
  `.last-run.json` and `error-context.md`. The retained contract is exactly a
  safe summary, a single privacy-checked screenshot, and the evidence
  manifest; raw output is removed after extraction.
- F-IR001-VER-008 replaces page-visible text in the failure test context before
  capture. The screenshot summary records the privacy transformation and the
  `synthetic-redacted-browser-evidence` classification. No application source
  was modified.
- Local clean install, type/type-test checks, two 25-test unit runs, build,
  browser normal/failure/manifests, and one complete database non-regression
  sequence passed. Exact IR-001 Docker cleanup passed.
- Hosted run `30627419186` at `b4967f7…` passed Browser evidence and Database
  and RLS evidence. Its browser artifact contains only the redacted summary,
  redacted screenshot, and manifest; its database artifact retains the
  unchanged three phase records and manifest. Both artifacts have 14-day
  retention and matching checksums.
- SEC-IR001-001 is documented separately. It is contained within repository
  and evidence boundaries but awaits the unrelated local project's owner to
  recreate or rotate the exposed development credential; no unrelated resource
  was mutated.

## Hosted database resolution — 2026-07-31

- Implementation commit: `7a566338248b0df7ac42414dbc664138bee9c655`
  (`fix(ir-001): resolve hosted database probe`).
- Failed reference run: `30622965721` at `5f73f5c…`; its safe diagnostic named
  `same-scope-account-a`, `assertion-failed`, and `context-unavailable` while
  exact cleanup succeeded.
- Successful run: `30624184154` on the existing draft PR branch
  `review/ir-001-consolidated-evidence`; Browser evidence and Database and RLS
  evidence both passed on `ubuntu-22.04`.
- Database lane passed clean install, type checks, unit tests, build, initial
  normal, controlled failure, recovery normal, manifest, exact cleanup, and
  upload. The conditional first-normal failure step was skipped.
- Downloaded database artifact (`2,377` bytes, 14-day retention, expiry
  `2026-08-14`) contained exactly `normal-result.json`,
  `controlled-failure-result.json`, `recovery-result.json`, and the manifest.
  The three records share one sequence identity; manifest SHA-256 and byte
  counts matched. Path and secret scans found no match; the failure diagnostic
  is absent from the successful artifact.
- Downloaded browser artifact (`40,686` bytes) contained only the safe summary,
  screenshot, and manifest. Its checksums and path/secret scans passed; raw
  Playwright diagnostics were absent.
- The GitHub Actions workflow has no deployment step, hosted Supabase project,
  declared secret, or write permission. Existing third-party PR status checks
  remain outside the IR-001 workflow and were not changed by this correction.

This is implementation evidence only. IR-001 remains **In progress**;
GATE-007 through GATE-010 remain unchanged; GATE-011 remains unsatisfied; W1
exit remains blocked; IR-002 remains unauthorised; and PR #1 remains open,
draft, and unmerged.

IR-001 remains **In progress**. GATE-007 through GATE-010 remain unchanged,
GATE-011 remains unsatisfied, W1 exit remains blocked, IR-002 remains
unauthorised, and no deployment, merge, schema, production RLS, Storage, or
Realtime change occurred.
