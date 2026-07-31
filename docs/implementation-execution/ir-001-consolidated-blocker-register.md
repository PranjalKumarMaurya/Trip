# IR-001 Consolidated Blocker Register

## Scope and status

This register consolidates observable IR-001 evidence-foundation blockers for
the 2026-07-31 correction session. It is not a verification decision. IR-001
remains **In progress**; GATE-007 through GATE-010 remain unchanged; W1 exit
is not achieved; and IR-002 remains unauthorised.

| Blocker ID | Source | Description | Severity | Status | Affected files | Affected gates | Root cause | Correction boundary | Validation | Rollback | Final disposition |
|---|---|---|---|---|---|---|---|---|---|---|---|
| F-IR001-VER-001 | Independent review | Raw Playwright `error-context.md` retained a developer-specific absolute path. | High | Resolved in hosted CI | `playwright.config.ts`, `tests/browser/run-failure-injection.mjs`, browser artifact controls, workflow upload path | GATE-010 | Automatically generated raw diagnostic output was retained. | Retain only the safe summary and screenshot; exclude raw result output. | Local/hosted failure injection, manifest, checksum, path/secret scans, and downloaded-artifact review passed. | Revert the bounded browser-evidence correction. | Corrected; final independent review must reassess. |
| F-IR001-VER-002 | Independent review | Database manifest depended on one mutable most-recent result. | High | Resolved in hosted CI | database evidence wrappers, evidence contract, manifest writer, workflow | GATE-007, GATE-008, GATE-010 | Normal, controlled-failure, and recovery modes shared one mutable representation. | Retain three explicit, sequence-bound sanitised records. | Hosted run `30624184154` passed initial normal, controlled failure, recovery, manifest, exact cleanup, and safe-artifact upload. | Revert the bounded database-evidence correction. | Corrected; final independent review must reassess. |
| F-IR001-VER-003 | Final verification review | Playwright below `1.55.1` did not provide the required browser-install authenticity protection. | High | Resolved locally and in hosted browser CI | `package.json`, `package-lock.json` | GATE-007, GATE-010 | Root `@playwright/test@1.52.0` resolved vulnerable Playwright tooling. | Retain only exact `1.55.1` aligned Playwright packages. | Audit returned to 11 findings without the advisory; hosted browser installation and evidence sequence passed. | Revert the exact dependency and lockfile change. | Corrected; final independent review must reassess. |
| F-IR001-VER-004 | Stopped security-correction run and Stage-A harness review | Exact IR-001 Docker resources could remain while cleanup was asserted immediately after `supabase stop`. | High | Resolved in hosted CI | `tests/database/run-rls-probe.mjs`, cleanup support/tests, CI cleanup assertion | GATE-007, GATE-008, GATE-010 | The project-scoped stop was awaited, but the verifier checked Docker only once; observed removal took one to three seconds locally. | Exact-name bounded polling with a ten-second limit and safe category-only failure output. | Normal, controlled-failure, recovery, unit polling cases, and final hosted cleanup assertion passed. | Revert the polling helper and its callers; do not use broad Docker cleanup. | Corrected; final independent review must reassess. |
| F-IR001-VER-005 | Hosted run `30622965721` and correction validation | Hosted initial normal probe returned the safe fallback at `same-scope-account-a`, preventing the database evidence sequence. | High | Resolved in hosted CI | `tests/database/run-rls-probe.mjs`, `tests/database/rls-probe-result-contract.mjs`, unit contract test, `package.json` test list | GATE-007, GATE-008, GATE-010 | The probe inferred data from a human-oriented `psql` display stream and collapsed all parsing or client-query failures to `context-unavailable`; the redacted prior run cannot safely reconstruct a raw client stream. | Use one `COPY (...) TO STDOUT` JSON record with quiet `psql`, strict one-record parsing, and safe error categories. | Local and hosted normal → controlled-failure → recovery runs passed; hosted artifact contains exactly three sanitised results and manifest with matching checksums. | Revert `7a566338248b0df7ac42414dbc664138bee9c655`; this would restore the ambiguous result boundary. | Corrected; final independent review must reassess. |
| SEC-IR001-001 | Final independent review | An over-broad local process inspection exposed unrelated local Supabase development credential material in terminal output. | High | Closed by external owner rotation/recreation | `environment-and-secret-boundaries.md`, incident record | GATE-010 | Process diagnostics exceeded the review's safe-output boundary. | Record containment; restrict future diagnostics; do not mutate an unrelated project whose owner boundary is unproven. | Repository, artifact, history, and known temporary-path scans found no retained credential; temporary review material was removed. On 2026-07-31 the local development environment owner confirmed recreation of exact disposable alias `unrelated-local-supabase-dev-stack`, invalidating the old credential without recording a value. | Revert the diagnostic rule only with a safer reviewed replacement. | Closed for targeted IR-001 review; GATE-010 remains for independent decision. |
| F-IR001-VER-007 | Final independent review | Local browser failure driver required raw `error-context.md` even though raw diagnostics are excluded. | High | Resolved in hosted CI | browser failure driver/spec, browser safety contract, manifest validation, unit tests | GATE-007, GATE-010 | Stale version-specific assumption about Playwright raw result output. | Require only expected child exit, one privacy-checked temporary screenshot, safe summary, and exact retained allow-list. | Local 25-test suite and browser evidence passed; hosted run `30627419186` browser lane and artifact inspection passed. | Revert `b4967f7e89224111d21319fb36ca51035b98554b`. | Corrected; targeted closure review must reassess. |
| F-IR001-VER-008 | Final independent review | Retained failure screenshot contained unclassified participant names and descriptions. | High | Resolved in hosted CI | browser failure spec/driver, safety contract, manifest validation, unit tests | GATE-010 | Automatic failure screenshot captured live visible UI content. | Test-page visible-text replacement before explicit screenshot, with DOM privacy assertions and summary classification. | Local and hosted screenshot inspection confirmed only approved placeholders and useful UI context. | Revert `b4967f7e89224111d21319fb36ca51035b98554b`. | Corrected; targeted closure review must reassess. |

## Open review obligations

| Item | Status | Evidence or boundary |
|---|---|---|
| Hosted CI execution | Implementation evidence passed | Run `30624184154` at `7a566338…` passed Browser evidence and Database and RLS evidence on `ubuntu-22.04`. Final independent review must repeat the governance assessment. |
| Hosted artifact inspection | Implementation evidence passed | Browser and database artifacts were downloaded, checksum/path/secret-reviewed. Database artifact contained only the three sanitised phase results and manifest. |
| Hosted Playwright compatibility | Resolved in hosted browser CI | `ubuntu-22.04` completed browser evidence with the managed Chromium installation. |
| Starting-commit reconciliation | Reconciled locally; independent review must repeat | `f31233…` is an ancestor of `20d285…`; the sole intervening commit is the IR-001 authorisation/handoff record. |
| Remaining audit disposition | External review required | Post-upgrade audit has 11 findings (1 low, 3 moderate, 7 high) and one unchanged runtime high; the Playwright advisory is absent. |

## Discovery checkpoint

- Complete implementation-boundary blocker count: **5**.
- Open implementation/hosted blockers: **none**.
- Resolved locally or in hosted CI: **F-IR001-VER-001**,
  **F-IR001-VER-002**, **F-IR001-VER-003**, **F-IR001-VER-004**, and
  **F-IR001-VER-005**.
- Non-blocking local warning: Playwright's unsupported-host notice selects its
  Ubuntu 20.04 fallback browser locally; hosted `ubuntu-22.04` evidence passed
  and the final independent review must record the distinction.
- All identified corrections remain within the authorised IR-001 evidence,
  cleanup, manifest, workflow, dependency, and documentation boundary.
