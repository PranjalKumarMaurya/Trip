# SEC-IR001-001 — Local credential exposure incident

## Record

- Date: 2026-07-31
- Session: final consolidated security and browser-evidence correction
- Source: an over-broad local process inspection during the prior independent
  review displayed credential material in terminal output.
- Credential category: unrelated local Supabase test/development database
  credential.
- Production credential: no evidence.
- External Supabase credential: no evidence.

## Containment and leakage review

- No credential value is recorded in this incident record.
- Repository-controlled scans found no credential material in tracked IR-001
  changes, retained `artifacts/ir-001/` evidence, IR-001 documentation, or
  the reviewed Git history. Synthetic negative-test strings were classified
  separately and are not credentials.
- The downloaded GitHub Actions artifacts for run `30627419186` contain only
  the reviewed browser or database allow-lists; no credential, connection
  string, unsafe path, or raw diagnostic was found.
- Twenty known `/tmp/ir001-*` review files were scanned without printing their
  contents. One non-retained hosted-log file contained an absolute-path class
  and one non-retained status file contained a connection-string class. All
  verified IR-001 temporary files and directories were removed.
- No value entered tracked source, Git history, retained artifacts, GitHub
  Actions logs, pull-request comments, or this documentation.

## Invalidation boundary and residual risk

The credential's exact local Supabase working directory and project-owner
association cannot be safely established from the IR-001 repository boundary.
No unrelated project, container, network, or volume was stopped, inspected, or
removed. The credential must therefore be treated as compromised until the
owner of that separate local development project recreates or rotates its
local Supabase credentials outside this IR-001 session.

This is a local-only residual risk. It is not evidence of a production or
external Supabase compromise. IR-001 evidence is not permitted to claim this
incident fully resolved until that explicit owner action is recorded.

## Procedural prevention

Future IR-001 diagnostics must use exact, allow-listed outputs only. Prohibited
commands include `ps e`, `ps auxeww`, broad process-command listings, broad
`/proc/*/environ` inspection, broad Docker inspection, complete Supabase
status output, complete environment dumps, and shell tracing with secrets.
See the dated IR-001 diagnostic rule appended to
`environment-and-secret-boundaries.md`.
