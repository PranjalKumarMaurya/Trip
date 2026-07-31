# IR-001 Verification Findings — 2026-07-31

## Review boundary

- Reviewer role: independent completion and verification reviewer
- Reviewed branch: `v2`
- Reviewed implementation HEAD: `671bfcd9b4b9a76030e685df458f82fad61e530a`
- Authorised base: `20d2855091efea7e1aec9231237a7f8c3227e815`
- Review decision: **Corrections required**
- Status effect: IR-001 remains In progress; GATE-007 through GATE-010 remain
  unchanged; IR-002 remains unauthorised.

## F-IR001-VER-001 — browser evidence is not developer-path-safe

| Field | Record |
|---|---|
| Classification | Evidence-integrity defect |
| Severity | Blocking for IR-001 verification and GATE-010 |
| Owner | Bounded IR-001 correction owner |
| Affected implementation files | `playwright.config.ts`, `tests/browser/run-failure-injection.mjs`, `.github/workflows/ir-001-evidence.yml`, and any correction-owned evidence-manifest control |
| Affected generated evidence | `artifacts/ir-001/browser/test-results/failure-injection-IR-001-c-c5a36-tains-a-screenshot-artifact/error-context.md` |
| Observed condition | The retained Playwright error context included the absolute workstation path `<developer-home>/<repository>/...` in its location and test-source sections. |
| Requirement not met | The verification review requires retained evidence and manifest references to avoid absolute developer-specific paths where a repository-relative path is sufficient. |
| Security assessment | No credential, token, or server secret was observed in the inspected artifact. The defect is evidence portability and retention hygiene, not a confirmed secret exposure. |
| Required correction | Retain the required browser controlled-failure evidence in a developer-path-safe form: either sanitize/redact the generated error context before retention/upload or exclude it and retain an equivalent safe failure summary plus the required screenshot/result metadata. Limit manifest and workflow upload inputs to the reviewed safe allow-list. Do not change application behaviour. |
| Required evidence | A fresh clean-install browser normal run and controlled-failure run; inspection of every retained browser artifact; proof that no retained artifact, manifest, or hosted upload contains an absolute developer-specific path; checksum/byte-count verification; narrow secret scan; ignored-artifact confirmation; and hosted CI artifact inspection after all local checks pass. |
| Cleanup state | Browser artifacts remain ignored under `artifacts/ir-001/`; the local database harness had already completed exact cleanup with no matching container, network, or volume. No external Supabase project, deployment, production credential, remote branch, pull request, or hosted workflow was used in this review. |
| Re-review boundary | Start a separate bounded IR-001 correction from `671bfcd9b4b9a76030e685df458f82fad61e530a`, limited to safe browser-evidence retention, manifest allow-listing, and workflow upload scope. Re-run the full IR-001 completion and verification review from clean preflight; do not begin IR-002. |

## Review stop record

Per the IR-001 review stop conditions, verification did not continue to local
manifest acceptance, dependency/audit comparison, starting-commit reconciliation,
hosted CI, gate satisfaction, status promotion, or a verification commit after
this defect was established. Those items remain unverified rather than failed
by inference.

## Correction status — 2026-07-31

- F-IR001-VER-001 correction implemented, pending full re-review.
- F-IR001-VER-002 identified and corrected, pending full re-review.
- The combined correction implementation is
  `43d839b4e546188b1e60e56ff0515ff8826b6cfa`.
- No gate or status promotion occurred. IR-001 remains In progress and IR-002
  remains unauthorised.

## Consolidated correction status — 2026-07-31

- F-IR001-VER-001 passed the hosted browser artifact rehearsal after the
  retry-safe retention correction.
- F-IR001-VER-002 remains locally corrected; its hosted confirmation is
  pending resolution of F-IR001-VER-005 in the consolidated blocker register.
- No gate or status promotion occurred. IR-001 remains In progress and IR-002
  remains unauthorised.
