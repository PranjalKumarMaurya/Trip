# IR-002 — Tenant data foundation
## 1. Status and ownership

- Status: Authorised — implementation not started
- Wave: W1
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: Yes; bounded by `authorisations/IR-002-authorisation.md`

## 2. Objective

Define executable target ownership/configuration schema work for one Group per Trip Tenant, Profiles, stable group_members Participant identity, configuration, audit paths, and parent-derived Tenant scope.

## 3. Authoritative inputs

docs/architecture/domain-and-data-model.md; docs/architecture/multi-tenant-target-architecture.md; ADR-0001, ADR-0004, ADR-0005, ADR-0006; roadmap IR-002.

The accepted documents govern; this authorised packet does not restate or amend
their decisions.

## 4. Entry gate

Verified exit evidence for IR-001; clean repository; accepted design mapping;
and the accepted physical contract in `authorisations/IR-002-authorisation.md`.

## 5. Dependencies

- Direct IR dependencies: IR-001.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

DBM-001 tenant root, DBM-002 configuration/archive/audit foundation, and
DBM-013 generated-type provenance exactly as authorised; isolated local clean
apply, constraint testing, empty-target rollback, reapplication, deterministic
local type generation, and exact cleanup.

## 7. Explicitly out of scope

Client ownership/name identity, an organisation model, a separate Trip tenant,
linked/remote/production database action, production credentials, deployment,
production migration, Bali-data migration, and cutover.

## 8. Current repository state

supabase/migrations/001_initial.sql models users, events, expenses, settlements, and exchange_rates with name/text ownership. 004_paid_by_splits.sql adds JSONB contributions; 005_todos.sql adds name-scoped Todos. src/constants/users.ts is a five-person persona catalogue, not target identity.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| supabase/migrations/001_initial.sql through 005_todos.sql | Existing files — legacy reference, not edit target in this Draft pass | Legacy schema/policy history | IR-002 | High | Reviewed migration register |
| supabase/seed.sql | Existing file — inspect only | Legacy seed source | IR-002/IR-016 | High | Source inventory |
| `supabase/migrations/006_ir002_tenant_root.sql` | Authorised future path | DBM-001 tenant root | IR-002 | High | Dedicated local schema evidence |
| `supabase/migrations/007_ir002_configuration_archive_audit.sql` | Authorised future path | DBM-002 configuration/archive/audit | IR-002 | High | Dedicated local schema evidence |
| `src/lib/database.types.ts` | Authorised generated path | DBM-013 output | IR-002 | Medium | Deterministic generation provenance |

These are authorised future paths, not assertions that the files already exist.

## 10. Database and data-model work

Implement only the exact physical names, validation functions/reference data,
constraints, audit destination, migration filenames, and generated-type path in
the authorisation. `group_members` supplies structural `role` and `status` for
bootstrap only; IR-005 retains lifecycle operations. Profiles remain structural
until DBM-003 / IR-004 adds the Auth relationship.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

No browser-authoritative operation. IR-003/IR-008 consume the schema for atomic bootstrap and trusted writes.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

No Storage change; establish Group parent identity required by later object metadata.

## 14. Realtime work

No Realtime activation; schema ownership is a prerequisite only.

## 15. Frontend implementation

No UI implementation. Existing src/App.tsx, useCurrentUser.ts, and persona constants remain untouched until their owning later packets.

## 16. Design traceability

Related Group/Onboarding/Membership design families are referenced through the accepted manifest; no visual asset changes.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

M01–M18 parent mapping foundation; no transform execution and no silent source repair.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

M01–M18, TC-002, TC-009, TC-019, ADR-0001/0004/0005/0006.

## 20. Automated tests

Use only the dedicated IR-002 evidence paths in the authorisation. The required
sequence is clean apply, constraints, two-Group structural fixture, empty-target
rollback, clean reapply, two deterministic generated-type passes, exact cleanup,
and manifest/secret-safety validation. The IR-001 synthetic controlled-failure
sequence is not required and must not be altered.

## 21. Manual verification

Inspect affected locked screen states; keyboard/focus behavior; screen-reader announcements; responsive 480px-shell behavior; offline/reconnect/stale behavior; multi-tab behavior; and two-account/two-Group isolation. Where applicable, inspect archive/removal/current-user-change states and browser/device-specific safe-area/native chooser behavior.

## 22. R-02 accessibility obligations

Applicable running-build evidence must cover contrast measurement, touch-target measurement, keyboard order, visible focus, focus trap, focus restoration, connected errors, reduced motion, screen-reader loading/success/error announcements, realtime announcements, and safe-area behavior where relevant.

**R-02 remains open until verified on the running implementation.**

## 23. Observability

Use structured, audit-safe operation results and failure classification; correlation/reference identifiers; security-event evidence; reconciliation status; and release monitoring where applicable. Exclude passwords, tokens, full Invitation secrets, service-role credentials, private document contents, and unnecessary personal data.

## 24. Rollback and recovery

Only an empty isolated target with no downstream consumer may roll back: remove
DBM-002 objects before DBM-001 objects. Preserve all legacy source objects;
after target data exists, use forward repair. Do not imply general migration
reversibility.

## 25. Implementation sequence

1. Verify the authorised clean starting state. 2. Apply DBM-001/002 locally.
3. Validate constraints and two-Group structural relationships. 4. Roll back
the empty target. 5. Reapply and generate types twice. 6. Clean up and write
the immutable manifest. 7. Submit for independent verification.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop for an architecture or locked-design contradiction, an allow-list change,
missing authorised fixture, unsafe structural result, unreviewed migration
ambiguity, external/production dependency, impossible empty-target rollback,
or a required new dependency. Apply the direct-dependency blocker rule and
correction limits in the authorisation; do not create a new verification
requirement outside change control.

## 27. Completion evidence

Before independent verification, retain separate immutable records for clean
apply, constraints, rollback, reapply, both type passes, cleanup, and final
manifest. The verifier may rerun only authorised commands and inspect only
authorised invariants. It may not add a new failure sequence, shared harness,
artifact format, environment, dependency, or product scope.

## 28. Open questions

OE-002: deployed schema, RLS, row inventory, and production environment topology are not established by repository inspection.

## 29. Packet exit gate

Dependent work may begin only after IR-002 has its required evidence,
independent reviewer decision, and explicit exit record. This authorisation
does not mark IR-002 Implemented or Verified, GATE-011 satisfied, or W1
complete.

## 30. Authorisation and anti-loop contract

The final physical schema contract, exact files, local-only boundary, correction
classes, direct-dependency blocker rule, immutable evidence stages, GATE-011
contract, and post-acceptance implementation prompt are frozen in
`authorisations/IR-002-authorisation.md`. Corrections within that allow-list
and contract are permitted; all other changes require change control.
