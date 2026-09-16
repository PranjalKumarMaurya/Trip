# Repository Change Map

This register has 15 planned change-map entries. Every unqualified path below
is confirmed in the repository. A conventional target path is never treated as
existing: it is labelled **Proposed path — verify at packet start**.

| Existing path | Current purpose | Planned action | First permitted IR / Wave | Later consumers | Concurrent-edit risk and serial owner | Test coverage | Rollback concern | Status |
|---|---|---|---|---|---|---|---|---|
| `package.json`, `package-lock.json` | npm dependencies and scripts. | IR-002, IR-004, and authorised IR-007 may add only their own dedicated script aliases to `package.json`; `package-lock.json` is prohibited. | IR-001 / W1; bounded IR-002/IR-004/IR-007 exceptions | All test/evidence work | High: no packet changes dependencies or prior evidence semantics. | Dedicated local contract; existing build/type checks. | Remove/revert an unconsumed script; never hide a failing check. | Confirmed existing |
| `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json` | Vite and TypeScript build boundary. | Preserve until a reviewed tooling/routing decision requires an owned change. | IR-001 / W1 | IR-004, IR-011, IR-021 | High: IR-001 controls build/test config integration. | `npm run build`; selected-tool capability evidence. | Revert config without weakening type/build gate. | Confirmed existing |
| `src/App.tsx` | Verified IR-004 Auth entry boundary and no-workspace holding state; no Group shell/Active Group conversion. | IR-011 later owns Group shell/Active Group conversion. | IR-004 / W2; IR-011 / W4 | IR-012–015 | Critical shared foundation: IR-004 did not add Group/data behaviour; IR-011 merges Group shell first. | IR-004 AUTH/session evidence; later UI-01–03/TC-003. | Never roll back to persona/global-data fallback. | Confirmed existing |
| `src/features/auth/AuthBoundary.tsx` | Verified IR-004 session/Profile resolution and authenticated-linked no-workspace holding boundary. | Under separately authorised IR-003 only, Lane D may replace the authenticated-linked holding branch with the narrow ONB-01–05/07 bootstrap handoff plus Accepted ONB-06 State A only. `src/App.tsx` and Group/product shell remain IR-011-only; issued-Invitation ONB-06 State B remains IR-005-only. | IR-004 / W2; bounded IR-003 / W3 after Accepted `DCC-IR003-FREEZE-001`, GATE-031, and separate authorisation | IR-005, IR-011 | Single Lane D writer; integration reviews the Auth/Profile boundary. No lane may change session derivation, use a service role, or introduce Invitation/Active Group authority. | Future IR-003 browser/static onboarding plus existing IR-004 session regression evidence. | Restore the verified no-workspace boundary or use a secured forward correction; never restore persona/legacy workspace access. | Confirmed existing; IR-003 authorisation recorded; implementation not started |
| `src/lib/supabase.ts` | Sole shared browser Supabase client using Vite URL/anon-key values. | Establish reviewed client/session boundary; do not put service-role access here. | IR-004 / W2 | IR-007, IR-010–015 | Critical: IR-004 owns first edit; policy/data consumers cannot independently create clients. | TC-001, TC-013, browser-secret inspection. | Revert without reintroducing browser authority. | Confirmed existing |
| `src/hooks/useCurrentUser.ts`, `src/components/PersonaPicker.tsx`, `src/constants/users.ts` | Local selectable persona identity. | IR-004 removes all active entry references; these source-preserving compatibility files are not edited/deleted by IR-004. | IR-004 / W2 | IR-011, IR-012, IR-014 | Critical identity foundation: IR-004 serially removes authority without claiming legacy conversion. | FP-001, TC-001, IPE-AUTH-001. | Safe signed-out/session-expired state; no persona fallback. | Confirmed existing |
| `src/hooks/useEvents.ts`, `useExpenses.ts`, `useSettlements.ts`, `useTodos.ts` | Global/name-scoped queries and global Realtime channels. | Establish scoped data/subscription adapters and switch cleanup. | IR-010 / W3, then IR-011 / W4 | IR-012–014 | Critical: IR-010 owns authorization/subscription contract; IR-011 owns Active Group integration before feature conversions. | TC-015, TC-019, two-Group/stale-reconnect cases. | Unsubscribe and clear stale data; never restore global channels. | Confirmed existing |
| `src/components/ui/Modal.tsx` and other `src/components/ui/` primitives | Shared modal, controls, visual primitives, several test IDs. | Preserve locked visual contracts; make accessibility changes only through owner packet/change control. | IR-004 / W2 for Auth; IR-011 / W4 for shell integration | IR-012–015 | High: UI primitive edit needs named merge owner and R-02 evidence. | R02-02–04, UI flow evidence. | Focus/keyboard regression requires bounded revert or secured forward fix. | Confirmed existing |
| `src/styles/global.css`, `src/styles/fonts.css`, `tailwind.config.ts` | Global tokens, fonts, responsive/animation utility boundary. | Preserve accepted visual identity; only reviewed locked-design implementation changes. | IR-011 / W4 | IR-012–015, IR-021 | High: IR-011 serially owns global shell/token integration. | UI-01, R02-01/05/06/09. | Avoid broad visual rollback that removes required focus/reduced-motion behavior. | Confirmed existing |
| `src/tabs/TripTab.tsx`, `src/tabs/TodoTab.tsx`, `src/components/AddEventModal.tsx`, `EditEventModal.tsx`, `EventCard.tsx`, `CrewStatus.tsx` | Global Event/itinerary and name-keyed Todo presentation/direct writes. | Convert to Group-scoped Event/audience/Todo flows. | IR-012 / W4 | IR-016, IR-021 | Medium after IR-011 shared boundary merges. | FP-002–006/019, UI-04–08/14, IPE-EVENT/ERR/TIME. | Retain safe unavailable/read-only behaviour and no audience-as-confidentiality claim. | Confirmed existing |
| `src/tabs/ScanTab.tsx`, `supabase/functions/parse-document/index.ts` | Public ticket path and legacy privileged parse/upload/Event insertion. | Convert to validated private ingest/reconciliation flow. | IR-013 / W4 | IR-016, IR-021 | Critical server/Storage boundary; serial with IR-009 private Storage contract. | FP-007/008, UI-09, IPE-SCAN/STORAGE. | Quarantine/reconcile object and metadata; no public fallback. | Confirmed existing |
| `src/tabs/SplitTab.tsx`, `src/components/AddExpenseModal.tsx`, `EditExpenseModal.tsx`, `SettleUpModal.tsx`, `src/lib/splitting.ts` | Global, name-keyed finance and direct mutations. | Convert to exact normalized finance with trusted writes. | IR-014 / W4 | IR-016, IR-021 | Critical finance lane; no concurrent shared-shell edit before IR-011 checkpoint. | FP-009–015, UI-10–12, EQ-01/SET-01/USD-01. | Preserve immutable exact history; no float/name fallback. | Confirmed existing |
| `src/tabs/FXTab.tsx`, `src/lib/currency.ts`, `src/constants/seedData.ts`, `src/constants/eventTypes.ts`, `src/constants/tabAssets.ts` | Static FX/Bali content and fixed app constants. | Separate reference FX from ledger accounting and confine Bali content to configured Group. | IR-015 / W4 | IR-016, IR-021 | Medium: IR-015 owns configuration/FX lane; coordinate any shared copy/token impact with IR-011. | FP-016–018, UI-13, IPE-FX/TIME. | Do not recalculate/rewrite accounting history from live rates. | Confirmed existing |
| `supabase/migrations/`, `supabase/seed.sql` | Five legacy SQL migrations and legacy source seed, plus verified IR-002 migrations `006_ir002_tenant_root.sql` and `007_ir002_configuration_archive_audit.sql`. | IR-004 added `008_ir004_profile_auth.sql`; IR-007 added `009_ir007_base_rls_ownership.sql`; IR-003 Lane A added immutable candidate `010_ir003_atomic_group_bootstrap.sql`. Proposed/reserved only: `011_ir002_timezone_reference.sql` for the separately authorised shared DBM-002 evolution. Legacy files/seed remain read-only. | IR-002 / W1; IR-004 / W2; IR-007 / W2; bounded IR-003 / W3; IR-016 / W5 source transforms | All schema/migration consumers | Critical: database reviewer serialises all future schema/policy work; shared DBM-002 is a prerequisite before TOP-001 runtime. | Lane A/B candidate evidence plus accepted IR-004/IR-007 evidence; shared evidence pending. | Empty-target only; legacy source retained; populated target uses reviewed forward correction. | DBM-014 candidate: Lane A integrated, Lane B PASS, Lane C blocked; 011 Proposed/Reserved/Not authorised |
| `.env.example` | Browser-safe variable example and server-secret warning. | Inventory only; no value, secret, or deployed identifier enters documentation. | IR-001 / W1 | IR-004, IR-008, IR-013, IR-017–020 | High environment boundary: IR-001 owns inventory; each later packet consumes a named gate. | Secret-boundary review, TC-013. | Never add server secrets; invalid boundary blocks consuming packet. | Confirmed existing |

## Not-established target paths and serial ownership

- IR-002 authorises only `tests/database/ir-002/**`,
  `tests/unit/ir-002-tenant-foundation.test.mjs`,
  `tests/evidence/write-ir-002-evidence-manifest.mjs`, `artifacts/ir-002/**`,
  optional `.github/workflows/ir-002-evidence.yml`, and generated
  `src/lib/database.types.ts`. The workflow is local-only/non-deploy; it is
  optional, not an implicit shared-workflow change.
- DBM-013 controls generated-type provenance and refresh. The generated target
  is not hand-authored and is generated only after approved schema units.
- IR-004 authorises only `src/features/auth/authSession.ts`,
  `src/features/auth/AuthBoundary.tsx`, `src/features/auth/AuthEntry.tsx`,
  `tests/database/ir-004/**`,
  `tests/browser/ir-004/auth-profile-session.spec.ts`,
  `tests/unit/ir-004-auth-profile-session.test.mjs`,
  `tests/evidence/write-ir-004-evidence-manifest.mjs`, `artifacts/ir-004/**`,
  optional `.github/workflows/ir-004-evidence.yml`, `src/App.tsx`,
  `src/lib/supabase.ts`, `src/lib/database.types.ts`, `package.json`, and
  `008_ir004_profile_auth.sql`; the exact conditional local-stack and Modal
  paths are in its authorisation. This is not broad `src/**` authority.
- IR-007 implementation and verification cover only the exact
  DBM-006/current-schema RLS paths in
  `authorisations/IR-007-authorisation.md`: one reserved migration, generated
  types, dedicated database/unit/evidence paths, dedicated package aliases,
  and listed execution records. It does not authorise a legacy product-table
  tenant conversion, Storage, Realtime, lifecycle, trusted operations, source
  code, dependency, or prior-harness change.
- IR-008 authorises only its named authorisation/packet/register/governance
  documents, dedicated static contract test/evidence paths, and optional
  `artifacts/ir-008/**`. Its retained static contract evidence is Verified;
  it reserves no `010_*` migration and must not modify
  `supabase/migrations/**`, `supabase/functions/**`, `src/**`, generated types,
  package files, Storage, Realtime, environment files, deployment, remote
  Supabase, or IR-001/002/004/007 evidence semantics. It creates no physical
  trusted operation; its register assigns every TOP to a future owner.
- IR-003 is Authorised but not globally Implemented or Verified. Lane A is
  integrated, Lane B PASS, Lane C blocked, and Lane D remains isolated.
  `DCC-IR003-FREEZE-001` is Accepted and the separately controlled GATE-031
  evidence is historically Satisfied. Its four disjoint write sets remain
  those in `packets/IR-003-atomic-group-bootstrap.md` §10: completed Lane A
  wrote only migration 010; completed Lane B wrote only its dedicated cases
  and unit contract; Lane C owns only the dedicated
  IR-003 harness/rollback/performance/manifest paths and
  `artifacts/ir-003/**`; Lane D only the listed authenticated-boundary,
  proposed onboarding/adapter, and browser/static test paths. Integration,
  not a lane, alone writes `src/lib/database.types.ts` after migration.
  Every other current source, migration, test, artifact, generated type,
  package, CI, and deployment path is forbidden. This is a future allow-list,
  not authority to create any listed path now.
- The IR-001 CI evidence workflow exists, but deployment configuration and
  release CI do not. They remain **Not established**, not missing paths to
  invent.
- Shared file conflict order is: IR-004 for client/session identity and the
  pre-Group protected entry;
  IR-010 then IR-011 for hooks and Active Group; IR-011 before any W4 shared
  shell/style/modal merge; database reviewer serially owns migration/policy
  units; IR-001 controls package/configuration changes.
