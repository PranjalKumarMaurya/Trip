# Environment and Secret Boundaries

This record separates repository-visible facts from external evidence. It does
not record any deployed identifier, credential, secret, document content, or
personal data.

| Boundary | Repository-visible evidence | Classification | First consuming IR / gate | External evidence still required | Rule |
|---|---|---|---|---|---|
| `VITE_SUPABASE_URL` | Named in `.env.example` and read by `src/lib/supabase.ts`. | Browser-safe reference confirmed; actual value/project not established. | Verified IR-001 inventory; IR-004 client boundary. | No repository value is required. | Browser-visible value never replaces RLS. |
| `VITE_SUPABASE_ANON_KEY` | Named in `.env.example` and read by `src/lib/supabase.ts`. | Browser-safe reference confirmed; actual value/project not established. | Verified IR-001 inventory; IR-004. | No repository value is required. | Browser-visible key is never elevated authority. |
| `SUPABASE_SERVICE_ROLE_KEY` | Read at runtime by `supabase/functions/parse-document/index.ts`; not present in `.env.example`. | Server-only reference confirmed; value/owner/rotation not established. | IR-008/IR-013; GATE-021 W6 entry and GATE-025 W7 cutover. | Secret owner, access path, rotation/revocation, and server boundary review. | Never frontend, test output, documentation, or broad proxy. |
| `ANTHROPIC_API_KEY` | Referenced at runtime by the legacy Edge Function and warned against in `.env.example`. | Server-only reference confirmed; value/provider deployment not established. | IR-013; GATE-021/025 if retained. | Provider-account ownership and server-only handling evidence. | Provider/model is not parity authority; no secret is recorded. |
| Local commands | Build/type/test/browser/database/cleanup/manifest scripts are declared in `package.json`. | Verified IR-001 capability. | IR-001; W2 packet evidence consumes its applicable parts. | None for repository capability. | Capability does not authorise a future packet's test execution. |
| Test environment | `tests/database/**` contains the isolated local Supabase CLI/Docker harness, fixtures, controlled-failure, and exact-cleanup controls; Playwright is configured locally. | Verified IR-001 capability; no remote project is established. | GATE-007–010 and W1 are complete; later packets consume the capability under their own authority. | Later packet-specific fixtures/evidence only. | No remote or production environment is implied. |
| Deployed target state | No deployment config, project ID, deployed schema/RLS, Storage, Realtime, or Auth inventory is in repository. | Not established. | IR-016; GATE-018 before W5 entry. | Timestamped/read-only deployed-state and source inventory, with provider/owner. | Do not guess or mutate source state. |
| Rehearsal environment | No rehearsal project/configuration is present. | Not established. | IR-017; GATE-021 before W6 entry. | Isolated representative environment, snapshot handling, recovery path. | No production authority. |
| Production environment / release access | No deployment or release configuration, project ID, or production access record is present. | Not established. | IR-018–020; GATE-025 before W7 cutover. | Maintenance/writer/stale-client plan, approval, access owner, backup/recovery/retention evidence. | Separate W7 authorisation is mandatory. |
| CI and evidence storage | `.github/workflows/ir-001-evidence.yml`, manifest writers, ignored generated evidence, and retained packet artifacts exist. | Verified IR-001 capability; no deployment or release CI is established. | IR-001 is complete; IR-021 consumes future packet evidence. | Later release-specific retention/access evidence. | CI capability is not deployment authority. |

Repository-visible environment inventory is complete for the Verified IR-001
capability and current W2 evidence. External deployed, rehearsal, and
production evidence remains deferred to its first consuming gate; it is not a
universal W1 blocker.

## IR-001 diagnostic safety rule — 2026-07-31

IR-001 review diagnostics must emit only exact, allow-listed identifiers and
safe categories. Do not run `ps e`, `ps auxeww`, broad process-command or
`/proc/*/environ` inspection, broad Docker inspection, complete Supabase status
output, complete environment dumps, or shell tracing with secrets. A local
credential exposure incident is recorded in
`ir-001-local-credential-exposure-incident.md`; its unrelated owner and
rotation boundary are not inferred from this repository.
