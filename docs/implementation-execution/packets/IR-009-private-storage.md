# IR-009 — Private Storage
## 1. Status and ownership

- Status: Draft
- Wave: W3
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: No

## 2. Objective

Plan private Group-scoped document objects and metadata with current authorization, safe upload/removal/reconciliation, and no public path authority.

## 3. Authoritative inputs

Security model §13; migration plan M06/M17; parity contract FP-007/008; roadmap IR-009.

The accepted documents govern; this Draft packet does not restate or amend their decisions.

## 4. Entry gate

Verified exit evidence for IR-005, IR-007, IR-008., clean repository, accepted design mapping, and no unresolved prerequisite security or architecture contradiction.

## 5. Dependencies

- Direct IR dependencies: IR-005, IR-007, IR-008.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Draft bucket/path/metadata authority, upload/view/download/removal lifecycle, orphan detection, archive/inactive behavior, signed access where used, and cross-Group substitution tests.

## 7. Explicitly out of scope

Public target URLs, public bucket, path authority, separate document audience, actual bucket/policy changes, or provider-specific implementation guesses.

## 8. Current repository state

002_tickets_bucket.sql creates public tickets bucket and public-read policy. src/tabs/ScanTab.tsx calls getPublicUrl, removes object then deletes event. parse-document uploads with service role.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| supabase/migrations/002_tickets_bucket.sql | Existing legacy source — do not edit in Draft | Public bucket/policy | IR-009 | Critical | Private access test plan |
| src/tabs/ScanTab.tsx | Existing file — later replace/extend candidate | Public viewer/removal flow | IR-009/IR-013 | Critical | Lifecycle/reconciliation tests |
| `Proposed path — verify at packet start: supabase/functions/document-*` | Proposed path | Narrow document boundary | IR-009/IR-013 | Critical | Security review |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

Define document metadata parent/reference/authoritative actor requirements and storage migration ordering; no table or policy is written in Draft.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

IR-009 owns the private-object evidence consumed by IR-013's TOP-012
`ingest_and_reconcile_document`; it owns no TOP and cannot implement or verify
TOP-012. Document reconciliation consumes the IR-008 boundary; no direct
public-object assumption.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

Private bucket/path model: Group-scoped opaque object path, server-derived metadata/provenance, current member authorization for view/download, controlled removal, orphan quarantine/reconciliation, inactive/removed denial, archive handling, cross-Group substitution denial.

## 14. Realtime work

IR-010 later communicates authorised document state, never permanent URL or unvalidated object metadata.

## 15. Frontend implementation

Map private viewer, authorised download, removal confirmation, unavailable, orphan, reconciliation, upload/retry states; no address-bar public link.

## 16. Design traceability

Affected DOC and PERM Screen IDs assigned to IR-009; component references include private viewer/unavailable/reconciliation patterns.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

M06/M17: public object access is replaced through reviewed inventory/transform; no silent public-link preservation.

The migration inventory must identify legacy public URLs, replace their target access through the reviewed private-object lifecycle, and retain an auditable reconciliation or quarantine result for every source reference.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

FP-007, FP-008, TC-014, IPE-STORAGE-001, M06, M17.

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

1. Confirm member/Group policy model. 2. Define object and metadata authority. 3. Define removal/reconciliation outcomes. 4. Define substitution tests. 5. Gate IR-013 after private lifecycle evidence.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Draft status cannot satisfy this gate.

## 28. Open questions

Existing object inventory and source-to-target document correspondence are not established; affected objects require manifest/quarantine.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This Draft packet neither marks the packet complete nor authorises implementation.
