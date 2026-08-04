# IR-013 — Documents and scan
## 1. Status and ownership

- Status: Draft
- Wave: W4
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: No

## 2. Objective

Plan validated private document ingest, non-authoritative extraction/review, Event association, provenance, removal/reconciliation, and safe orphan outcomes.

## 3. Authoritative inputs

Security model; parity contract; migration M06/M17; roadmap IR-013; accepted DOC design contracts.

The accepted documents govern; this Draft packet does not restate or amend their decisions.

## 4. Entry gate

Verified exit evidence for IR-008, IR-009, IR-011., clean repository, accepted design mapping, and no unresolved prerequisite security or architecture contradiction.

## 5. Dependencies

- Direct IR dependencies: IR-008, IR-009, IR-011.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Draft file validation, parser boundary, extraction review, Event creation, server-derived uploader provenance, viewer/download, document/Event separation, reconciliation/quarantine, and migration evidence.

## 7. Explicitly out of scope

Provider-output authority, public URL, client-selected uploader authority, separate persisted document audience, document removal deleting Event, or actual parser implementation.

## 8. Current repository state

src/tabs/ScanTab.tsx sends uploaded_by and for_users; calls parse-document; uses public URL; removes object then deletes Event. supabase/functions/parse-document/index.ts uses service role, calls Anthropic, and inserts parsed Event data.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| src/tabs/ScanTab.tsx | Existing file — likely major replacement candidate | Upload/scan/public URL/delete flow | IR-013 | Critical | File/reconciliation tests |
| supabase/functions/parse-document/index.ts | Existing file — likely replace/restrict candidate | Privileged parser/upload/insert | IR-013 | Critical | Provenance/partial-failure tests |
| supabase/migrations/002_tickets_bucket.sql | Existing legacy source — reference only | Public storage | IR-009/IR-013 | Critical | Private migration evidence |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

Define document metadata, parse/review state, Event association, server-derived provenance, reconciliation/orphan status, audit/result fields, and migration ordering. No actual schema/policy change.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

Physical TOP ownership: TOP-012 `ingest_and_reconcile_document`, consuming
IR-009 private-object evidence. The separately authorised implementation packet
must retain actual implementation and authorization, one authoritative
all-or-nothing transaction, injected-failure rollback, idempotency,
concurrency/race evidence, audit emission, secret-safe evidence, and
operation-specific performance evidence.

Candidates: validated document intake/review commit and document reconciliation. Session actor and current Group/member relationship are authoritative; extraction output is review input only.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

Consumes IR-009 private object lifecycle. Define accepted/stored/parsing/parsed/reviewed/Event-created/reconciled/removal outcomes and controlled orphan handling.

## 14. Realtime work

Use authorised status updates only; no payload reveals private object metadata before data authorization.

## 15. Frontend implementation

Map all DOC upload/parsing/review/private-viewer/removal/reconciliation states, native chooser boundary, offline/retry, server failure, permission denial, long content, reduced motion, and safe confirmations.

## 16. Design traceability

Affected Screen IDs: DOC family primarily IR-013 plus IR-009/IR-016 related IDs; UI-09 is primary. Components CMP-34–CMP-47 are indexed evidence.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

M06/M17 public document/object replacement; manifest/checksum/reconciliation required, no provider parity or silent repair.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

FP-007, FP-008, UI-09, IPE-SCAN-001, IPE-STORAGE-001, M06, M17.

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

1. Confirm private Storage/trusted boundary/Active Group gates. 2. Define lifecycle truth table. 3. Specify provenance/review/reconciliation. 4. Map UI states. 5. Supply migration evidence to IR-016/IR-021.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Draft status cannot satisfy this gate.

## 28. Open questions

Parser provider configuration, file limits, and source-object inventory are Not established by current repository inspection.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This Draft packet neither marks the packet complete nor authorises implementation.
