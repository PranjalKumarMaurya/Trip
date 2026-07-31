# IR-001 targeted final review findings

## Decision

**Corrections required.** This targeted independent review closed
`SEC-IR001-001`, confirmed the prior hosted evidence, and found the following
three current local evidence-integrity failures. This record does not change
IR-001, gate, Wave, deployment, or IR-002 status.

## F-IR001-VER-009 — local controlled-browser failure cannot retain its required screenshot

- Severity: High
- Failed command: `npm run test:browser:failure` (exit 1).
- Observed safe result: the driver rejected the run because its exact staging
  directory contained no screenshot. The only generated raw-result filename
  was `.last-run.json`; no safe summary or retained screenshot was produced.
- Scope: `tests/browser/failure-injection.spec.ts`,
  `tests/browser/run-failure-injection.mjs`, and their safety/contract tests.
- Impact: local controlled-failure evidence is not reproducible, so the
  browser evidence and privacy contract cannot support GATE-007, GATE-010, or
  an IR-001 verification decision despite the earlier hosted success.
- Required correction: identify why the local managed-browser path does not
  create the explicit privacy-checked staging screenshot; make the exact
  staging contract deterministic without retaining raw Playwright diagnostics,
  weakening the expected child failure, or changing application source.
- Re-review boundary: rerun the clean local browser normal/failure and two
  manifests, inspect the retained screenshot and allow-list, then recheck
  hosted browser evidence if browser implementation changes.

## F-IR001-VER-010 — exact cleanup success is not durable

- Severity: High
- Failed evidence condition: after `npm run test:db` produced a valid initial
  normal result, `npm run test:db:cleanup` reported `cleanup: confirmed`; an
  immediate exact-name inspection then found the IR-001 database container,
  network, and volume still present.
- Scope: `tests/database/local-docker-cleanup.mjs`,
  `tests/database/assert-local-cleanup.mjs`, and the database runner cleanup
  lifecycle plus their tests.
- Root-cause evidence: the polling contract accepts two consecutive absent
  snapshots, but the exact resources can reappear after that observation. A
  subsequent documented project-scoped `supabase stop` followed by cleanup
  polling reached a stable empty state.
- Impact: the cleanup proof is time-of-check/time-of-use unsafe and cannot
  satisfy GATE-008 or GATE-010. The normal → failure → recovery sequence must
  not be accepted until each phase leaves no exact resource after the bounded
  cleanup window.
- Required correction: make cleanup completion and stability proof cover the
  actual stop lifecycle; reject transient absence and fail if exact resources
  remain or return. Preserve exact project scoping, no broad Docker deletion,
  and all RLS assertions.
- Re-review boundary: rerun normal, controlled failure, recovery, manifest,
  and cleanup with exact-name inspections after every phase locally and in the
  hosted database job.

## F-IR001-VER-011 — tracked historical finding retains an unsafe absolute-path class

- Severity: Medium
- Affected path: `docs/implementation-execution/ir-001-verification-findings.md`.
- Observed safe result: the repository-controlled text scan found one POSIX
  home-path class in that historical finding; the value is intentionally not
  reproduced in this record.
- Impact: retained IR-001 documentation does not meet the required
  path-safety hygiene boundary, even though the current generated browser and
  database artifact contracts reject such paths.
- Required correction: replace the historical path value with a neutral
  category or placeholder while preserving the finding's historical meaning;
  rerun the repository-controlled documentation and evidence path scan.
- Re-review boundary: scan all retained IR-001 documentation and generated
  evidence for POSIX, macOS, Windows, UNC, file URL, repository-root, and
  temporary-path classes without printing matched values.

## Confirmed non-blocking evidence

- `SEC-IR001-001` is closed through the external owner confirmation recorded
  in `a806bda1ec6741c4e10426c3ffa4e4e249aa0b52`; no credential value or URL
  was recorded.
- Hosted workflow `30627419186` at
  `b4967f7e89224111d21319fb36ca51035b98554b` remains successful. PR #1 is
  open, draft, and unmerged. Downloaded hosted artifacts had the reviewed
  browser and database file sets, matched their manifests' byte counts and
  SHA-256 values, and had no unsafe text match.
- The current audit remains 11 findings (1 low, 3 moderate, 7 high, no
  critical); this matches the documented authorised-base comparison. The
  Playwright installer advisory is absent. The remaining pre-existing audit
  findings require the documented dependency/security maintenance disposition
  before production release and do not cure the local failures above.

## Status and next boundary

IR-001 remains **In progress**. GATE-007 through GATE-010 remain unchanged;
GATE-011 remains unsatisfied; W1 exit remains blocked; IR-002 remains
unauthorised. No application feature, target schema, migration, production
RLS, Storage, Realtime, deployment, merge, production credential, or external
Supabase project was used in this review.

Prepare one consolidated bounded IR-001 correction authorisation covering only
F-IR001-VER-009, F-IR001-VER-010, and F-IR001-VER-011. Do not return to serial
one-finding correction sessions.
