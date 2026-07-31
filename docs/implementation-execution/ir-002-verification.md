# IR-002 Independent Verification Record

## Decision

- Decision: **VERIFIED**.
- Accepted by: Product owner.
- Verification anchor HEAD: `272eb7011ef5072716c6998bcfa8acb659d147f7`.
- Evidence run: `ir002-1785532761842-8ead547f-69a5-448e-a7f7-10193b8fb33f`.
- Generated-type SHA-256:
  `55552e7a17ff965c1a41168c010a009ba24964c3c50db217ad3650b2fc898c9f`.

The accepted independent verification confirmed the exact four-commit chain,
frozen allow-list compliance, DBM-001/002/013 invariants, clean application,
negative constraints, two-Group structural separation, empty-target rollback
with legacy-table preservation, clean reapplication, deterministic type
generation, immutable manifest checksums, secret safety, and exact cleanup.

The verifier passed `npm run test:ir002:cleanup`, `npm run test:ir002`,
`npm test`, `npm run test:types`, `npm run typecheck`, `npm run build`, a final
cleanup assertion, and `git diff --check`. No blocking implementation defect,
in-scope correction, change-control issue, or non-blocking observation was
recorded. Verification left the repository clean and did not access a remote
or production Supabase project.

## Closure

IR-002 and DBM-001, DBM-002, and DBM-013 are **Verified**. The IR-002
authorisation is closed; no correction packet is required. The accepted
verification contract is complete and may not be retroactively enlarged by a
new verifier criterion. Future unrelated shared-tool failures do not invalidate
this record. Only a reproducible defect directly violating an accepted IR-002
invariant may trigger correction or change control; later-packet requirements
must not be assigned retroactively to IR-002.

This record creates no implementation authority, deployment authority, or
cutover authority.
