# IR-001 Final Verification Findings — 2026-07-31

## Review boundary

- Reviewer role: independent completion and verification reviewer
- Reviewed branch: `v2`
- Reviewed HEAD: `93bd966b9300f9a88567a786674a0738b0b39d4e`
- Authorised implementation base: `20d2855091efea7e1aec9231237a7f8c3227e815`
- Decision: **Corrections required**
- Status effect: IR-001 remains In progress; GATE-007 through GATE-010 remain
  unchanged; W1 exit remains unachieved; IR-002 remains unauthorised.

## F-IR001-VER-003 — vulnerable browser-install tooling undermines evidence and CI trust

| Field | Record |
|---|---|
| Classification | Dependency/security blocker |
| Severity | High; blocking for IR-001 verification, GATE-007, and GATE-010 |
| Owner | A separately authorised bounded IR-001 dependency/security correction owner, with security review |
| Affected dependency | Root development dependency `@playwright/test@1.52.0`, which resolves `playwright@1.52.0` |
| Affected commands | `npm run test:browser:install` locally and in `.github/workflows/ir-001-evidence.yml` |
| Audit comparison | Authorised base: 11 total findings (1 low, 3 moderate, 7 high); current: 13 total findings (1 low, 3 moderate, 9 high). The two introduced findings are `@playwright/test` and transitive `playwright`. Runtime findings remain one pre-existing high finding. |
| Advisory | `GHSA-7mvr-c777-76hp`: Playwright browser installation does not verify TLS certificate authenticity for affected versions below `1.55.1`. npm audit reports a non-breaking remediation to `@playwright/test@1.62.1`. |
| Security impact | This is development-only in the shipped browser bundle, but it is reachable by the reviewed local and hosted browser-install command. A network attacker could undermine the managed-browser executable used to create evidence. It therefore affects the test/CI trust boundary and cannot be accepted as a development-only evidence risk. |
| Required correction | Under a new bounded authorisation, review and approve a patched Playwright version and corresponding lockfile change, update only the approved evidence-tool dependency if accepted, then rerun the complete IR-001 verification from preflight. Do not remediate unrelated audit findings in that correction. |
| Correction prohibition in this review | This verification session did not modify dependencies, lockfiles, application code, tests, workflow logic, production resources, or hosted state. |
| Cleanup and remote state | The temporary baseline audit worktree and raw audit JSON were removed. No hosted workflow, remote review branch, pull request, deployment, merge, external Supabase connection, or production credential was used. |
| Re-review boundary | Start a separate bounded IR-001 dependency/security correction from `93bd966b9300f9a88567a786674a0738b0b39d4e`. After its clean correction commit, restart this complete IR-001 verification from mandatory preflight, including audit comparison and hosted CI artifact review. |

The local unit, browser, database, failure-injection, portability,
sequence-safety, manifest, checksum, and exact Docker-cleanup checks completed
before this blocker was established. They do not waive the vulnerable
browser-install boundary.

## Consolidated correction status — 2026-07-31

- F-IR001-VER-003 was corrected by the exact aligned Playwright `1.55.1`
  update in `626ae2615f5f8d17d391287968afb8a4c096bbc5`; the advisory is absent
  from the post-correction audit.
- The hosted browser evidence rehearsal passed at
  `e83554c410c934a28946be20dbd311916d92506a`.
- The consolidated rehearsal also identified F-IR001-VER-005: hosted database
  evidence fails before the first normal phase can be retained. No gate or
  status promotion occurred; IR-001 remains In progress and IR-002 remains
  blocked.

## Final consolidated security and browser correction — 2026-07-31

- F-IR001-VER-007 and F-IR001-VER-008 were corrected in
  `b4967f7e89224111d21319fb36ca51035b98554b` and validated locally and in
  hosted run `30627419186`.
- SEC-IR001-001 was discovered during the independent review. No credential
  entered repository-controlled evidence or GitHub, but invalidation of the
  unrelated local development credential requires its owner; see
  `ir-001-local-credential-exposure-incident.md`.
- No gate or status promotion occurred. IR-001 remains In progress and IR-002
  remains unauthorised.
