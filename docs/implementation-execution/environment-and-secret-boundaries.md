# Environment and Secret Boundaries

This record separates repository-visible facts from external evidence. It does
not record any deployed identifier, credential, secret, document content, or
personal data.

| Boundary | Repository-visible evidence | Classification | First consuming IR / gate | External evidence still required | Rule |
|---|---|---|---|---|---|
| `VITE_SUPABASE_URL` | Named in `.env.example` and read by `src/lib/supabase.ts`. | Browser-safe reference confirmed; actual value/project not established. | IR-001 inventory; IR-004 client boundary; GATE-007 before W1 exit. | Isolated test-project boundary/owner, not a value in this package. | Browser-visible value never replaces RLS. |
| `VITE_SUPABASE_ANON_KEY` | Named in `.env.example` and read by `src/lib/supabase.ts`. | Browser-safe reference confirmed; actual value/project not established. | IR-001 inventory; IR-004; GATE-007. | Isolated test-project boundary/owner. | Browser-visible key is never elevated authority. |
| `SUPABASE_SERVICE_ROLE_KEY` | Read at runtime by `supabase/functions/parse-document/index.ts`; not present in `.env.example`. | Server-only reference confirmed; value/owner/rotation not established. | IR-008/IR-013; GATE-021 W6 entry and GATE-025 W7 cutover. | Secret owner, access path, rotation/revocation, and server boundary review. | Never frontend, test output, documentation, or broad proxy. |
| `ANTHROPIC_API_KEY` | Referenced at runtime by the legacy Edge Function and warned against in `.env.example`. | Server-only reference confirmed; value/provider deployment not established. | IR-013; GATE-021/025 if retained. | Provider-account ownership and server-only handling evidence. | Provider/model is not parity authority; no secret is recorded. |
| Local commands | npm/Vite/TypeScript scripts are present. | Confirmed existing. | IR-001; GATE-005 satisfied. | None for documentation inventory. | Local build fact does not prove target test/database capability. |
| Test environment | No configuration, project, or harness exists in repository. | Not established. | IR-001 creates/records capability; GATE-007 before W1 exit. | Isolated project/container, permitted credentials, reset/cleanup owner. | This is not required to begin IR-001. |
| Deployed target state | No deployment config, project ID, deployed schema/RLS, Storage, Realtime, or Auth inventory is in repository. | Not established. | IR-016; GATE-018 before W5 entry. | Timestamped/read-only deployed-state and source inventory, with provider/owner. | Do not guess or mutate source state. |
| Rehearsal environment | No rehearsal project/configuration is present. | Not established. | IR-017; GATE-021 before W6 entry. | Isolated representative environment, snapshot handling, recovery path. | No production authority. |
| Production environment / release access | No deployment/CI/release configuration is present. | Not established. | IR-018–020; GATE-025 before W7 cutover. | Maintenance/writer/stale-client plan, approval, access owner, backup/recovery/retention evidence. | Separate W7 authorisation is mandatory. |
| CI and evidence storage | No CI configuration or artifact location is present. | Not established. | IR-001; GATE-006 before W1 exit; IR-021 consumes. | Selected platform/location, retention, access, redaction owner. | A missing CI platform is not a precondition to start IR-001. |

Repository-visible environment inventory is complete for this review. External
evidence is intentionally deferred to its first consuming gate; it is not a
universal W1 blocker.

## IR-001 diagnostic safety rule — 2026-07-31

IR-001 review diagnostics must emit only exact, allow-listed identifiers and
safe categories. Do not run `ps e`, `ps auxeww`, broad process-command or
`/proc/*/environ` inspection, broad Docker inspection, complete Supabase status
output, complete environment dumps, or shell tracing with secrets. A local
credential exposure incident is recorded in
`ir-001-local-credential-exposure-incident.md`; its unrelated owner and
rotation boundary are not inferred from this repository.
