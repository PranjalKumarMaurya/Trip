# IR-016 — Migration transforms and manifests
## 1. Status and ownership

- Status: Draft
- Wave: W5
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: No

## 2. Objective

Plan replay-safe M01–M18 transforms, reviewed manifests, counts/checksums, quarantine, reconciliation, and source-preserving migration evidence.

## 3. Authoritative inputs

docs/architecture/v1-migration-plan.md; roadmap IR-016; M01–M18 and S01–S15 references; migration design contracts.

The accepted documents govern; this Draft packet does not restate or amend their decisions.

## 4. Entry gate

Verified exit evidence for IR-003, IR-006, IR-008, IR-012, IR-013, IR-014, IR-015., clean repository, accepted design mapping, and no unresolved prerequisite security or architecture contradiction.

## 5. Dependencies

- Direct IR dependencies: IR-003, IR-006, IR-008, IR-012, IR-013, IR-014, IR-015.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Draft source inventory, transforms, exception/unknown handling, idempotency/rerun, private-object securing, Participant preservation, Group bootstrap, finance exactness, and evidence retention.

## 7. Explicitly out of scope

Production execution, invented mappings, silent repair, guessed missing values, unreviewed transformation, or destructive source retirement.

## 8. Current repository state

`supabase/migrations/001_initial.sql` through `005_todos.sql` and
`supabase/seed.sql` remain the confirmed legacy source artifacts. Verified
IR-002, IR-004, and IR-007 added only `006_ir002_tenant_root.sql`,
`007_ir002_configuration_archive_audit.sql`, `008_ir004_profile_auth.sql`, and
`009_ir007_base_rls_ownership.sql`. The repository has the Verified IR-001
fixture/harness and manifest capability, but no authorised transform runner,
production inventory, or representative snapshot.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| supabase/migrations/ | Existing directory — legacy source reference | Sequential legacy SQL | IR-016 | Critical | Reviewed source inventory |
| supabase/seed.sql | Existing file — migration source candidate | Legacy seed values | IR-016 | High | Mapping/checksum evidence |
| `Proposed path — verify at packet start: scripts/migration/` | Proposed path | Future isolated transform tooling | IR-016 | Critical | Rehearsal-only approval |
| `Proposed path — verify at packet start: artifacts/migration/` | Proposed path | Evidence manifests/checksums | IR-016 | High | Retention review |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

No migration is created in Draft. Plan schema/data/policy/storage/realtime sequencing through DBM register; transforms must be ordered, idempotent, and source-preserving.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

Migration-only privileged operations must be separately reviewed and never become browser endpoints.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

Private-object M06/M17 migration includes object/metadata correspondence, counts, checksums, quarantine, and reconciliation.

## 14. Realtime work

M16 replaces global query/subscription behavior only after scoped data path evidence.

## 15. Frontend implementation

No production feature implementation. Migration/recovery communication states are design inputs for later isolated rehearsal and release work.

## 16. Design traceability

Affected Screen IDs: IR-016 migration/recovery/document/configuration states. Exact mapping remains in accepted manifest; no new visual state is invented.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

Primary owner for M01–M18. Every retained item is mapped, explicitly excepted, quarantined, or remains unprocessed; never silently repaired.

Every transform manifest must retain source and target row counts, stable checksums, per-row disposition, exception/quarantine references, and rerun/idempotency evidence before it may feed rehearsal.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

S01–S15, M01–M18, finance fixtures, document/private-object evidence.

## 20. Automated tests

Use current test tooling only where it exists. Repository inspection found no configured test, lint, database-test, browser-test, or CI runner; any new tooling is a proposed dependency for review under IR-001. Planned coverage may include unit, integration, database/RLS, browser, concurrency, idempotency, migration, rollback, visual-regression, and accessibility automation only after the selected tooling and environment capability are approved.

## 21. Manual verification

Inspect affected locked screen states; keyboard/focus behavior; screen-reader announcements; responsive 480px-shell behavior; offline/reconnect/stale behavior; multi-tab behavior; and two-account/two-Group isolation. Where applicable, inspect archive/removal/current-user-change states and browser/device-specific safe-area/native chooser behavior.

## 22. R-02 accessibility obligations

Applicable running-build evidence must cover contrast measurement, touch-target measurement, keyboard order, visible focus, focus trap, focus restoration, connected errors, reduced motion, screen-reader loading/success/error announcements, realtime announcements, and safe-area behavior where relevant.

**R-02 remains open until verified on the running implementation.**

## 23. Observability

Use structured, audit-safe operation results and failure classification; correlation/reference identifiers; security-event evidence; reconciliation status; and release monitoring where applicable. Exclude passwords, tokens, full Invitation secrets, service-role credentials, private document contents, and unnecessary personal data.

## 24. Rollback and recovery

Define packet boundary, reversible and irreversible work, safe stop, data preservation, schema/application rollback, partial failure handling, reconciliation, and release-blocking conditions before implementation. Do not imply all migrations are reversible.

## 25. Implementation sequence

1. Establish immutable source inventory. 2. Define manifest/checksum schema. 3. Define each transform and exception path. 4. Define idempotent rehearsal behavior. 5. Gate IR-017 only after representative manifest/reconciliation design passes.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Draft status cannot satisfy this gate.

## 28. Open questions

OE-003: production source inventory, representative snapshots, and deployed data facts are Not established by repository inspection.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This Draft packet neither marks the packet complete nor authorises implementation.
