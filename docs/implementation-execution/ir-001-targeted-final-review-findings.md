# IR-001 targeted final review findings

## Decision

**Owner-directed closure accepted.** This targeted independent review closed
`SEC-IR001-001`, confirmed the prior hosted evidence, and records the product
owner's IR-001-only environment authority decision. This record does not
authorise deployment, W1 exit, or IR-002.

## F-IR001-VER-009 — local controlled-browser failure cannot retain its required screenshot

- Severity: High; accepted local-environment limitation.
- Failed command: `npm run test:browser:failure` (exit 1).
- Observed safe result: the driver rejected the run because its exact staging
  directory contained no screenshot. The only generated raw-result filename
  was `.last-run.json`; no safe summary or retained screenshot was produced.
- Scope: `tests/browser/failure-injection.spec.ts`,
  `tests/browser/run-failure-injection.mjs`, and their safety/contract tests.
- Root context: the current local Playwright environment uses the documented
  unsupported-host Ubuntu 20.04 fallback.
- Authoritative hosted result: workflow run `30627419186` passed the controlled
  failure, retained a safe summary and privacy-transformed screenshot, and
  produced the reviewed deterministic manifest.
- Disposition: accepted local-environment limitation under
  `CC-IR001-20260731`.
- Blocking: no.
- Future action: reconsider only when the supported local operating environment
  or Playwright host support changes.

## F-IR001-VER-010 — exact cleanup success is not durable

- Severity: High; accepted local-environment limitation.
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
- Authoritative hosted result: exact cleanup passed in workflow run
  `30627419186` after the normal, controlled-failure, and recovery phases.
- Local final state: no exact IR-001 container, network, or volume remained.
- Safety boundary: project-scoped stop only; no broad Docker deletion.
- Disposition: accepted local-environment limitation under
  `CC-IR001-20260731`.
- Blocking: no.
- Future action: monitor during later local database work and require
  authoritative hosted cleanup for evidence gates.

## F-IR001-VER-011 — tracked historical finding retains an unsafe absolute-path class

- Severity: Medium; resolved by documentation redaction.
- Affected path: `docs/implementation-execution/ir-001-verification-findings.md`.
- Observed safe result: the repository-controlled text scan found one POSIX
  home-path class in that historical finding; the value is intentionally not
  reproduced in this record.
- Impact: retained IR-001 documentation does not meet the required
  path-safety hygiene boundary, even though the current generated browser and
  database artifact contracts reject such paths.
- Correction: the concrete historical value was replaced with
  `<developer-home>/<repository>/...`, preserving the finding identity and
  defect classification without retaining a username, home path, or machine
  repository location.
- Disposition: resolved by documentation redaction.
- Blocking: no.

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

The owner-directed final verification record resolves the IR-001 gate and
status decisions. GATE-011 remains unsatisfied, W1 exit remains blocked, and
IR-002 remains unauthorised. No application feature, target schema, migration,
production RLS, Storage, Realtime, deployment, merge, production credential,
or external Supabase project was used in this review.
