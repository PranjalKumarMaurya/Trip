# IR-018 — Secured cutover preparation
## 1. Status and ownership

- Status: Draft
- Wave: W6
- Primary implementation owner: Not assigned unless documented
- Review owners: architecture, security, database/migration, design, and product reviewers as applicable
- Implementation authorised: No

## 2. Objective

Plan freeze, final delta, stale-client control, secured environment validation, rollback preparation, and release blockers without authorising cutover.

## 3. Authoritative inputs

Migration plan S14/S15/S18; security model; roadmap IR-018; IR-017 rehearsal evidence; IR-022 ledger.

The accepted documents govern; this Draft packet does not restate or amend their decisions.

## 4. Entry gate

Verified exit evidence for IR-017, IR-022., clean repository, accepted design mapping, and no unresolved prerequisite security or architecture contradiction.

## 5. Dependencies

- Direct IR dependencies: IR-017, IR-022.
- Schema dependencies: target schema/data contracts approved by owning earlier packets where applicable
- Auth dependencies: session-derived actor and current membership where applicable
- Trusted-operation dependencies: IR-008 for any authoritative atomic action
- Design dependencies: accepted docs/ui-design/manifests/screen-manifest.json and relevant screen contracts
- Test/fixture dependencies: IR-001 capability and packet-specific fixture/evidence plan

## 6. In scope

Draft maintenance/freeze, writer/stale-client, secret/environment validation, final delta, rollback decision, pre-cutover evidence, and explicit blockers.

## 7. Explicitly out of scope

Actual cutover, deployment, dual authority, silent stale-client handling, or treating documentation as production authorization.

## 8. Current repository state

`vite.config.ts` defines the local dev host/port and `.env.example` exposes
browser-safe Supabase variable names with an Edge Function secret warning. The
Verified IR-001 CI evidence workflow exists, but no deployment, maintenance, or
backup configuration is present.

## 9. Target repository change map

| Path | Action | Purpose | Depends on | Risk | Verification |
|---|---|---|---|---|---|
| vite.config.ts | Existing file — inspect only | Local Vite runtime assumptions | IR-018 | Medium | Environment record |
| .env.example | Existing file — inspect only | Browser-safe variable example | IR-018 | High | Secret-boundary review |
| `Proposed path — verify at packet start: release/` | Proposed path | Future release evidence location | IR-018 | High | Release authority review |

Every proposed path is deliberately labelled **Proposed path — verify at packet start**. No proposed path is an assertion that it already exists.

## 10. Database and data-model work

No migration execution. Consume only approved migration units and final-delta plan.

## 11. RLS and authorization work

No policy is written by this Draft. The implementation plan must define same-Group success; unrelated-Group, inactive Member, removed Member, archive-state, and direct-object substitution denial; Owner/Member boundaries; service-role confinement; and frontend non-authority. Any cross-Group success or permissive fallback blocks the packet.

## 12. Trusted operations

No cutover operation exposed to browser. Any release executor requires separate authority and service-role confinement.

For every applicable operation, record caller, validated Auth actor, validated current Group relationship and role, transaction boundary, idempotency key, replay/concurrency result, failure response, audit output, service-role use, test evidence, and reconciliation/rollback path.

## 13. Storage work

Validate private-object migration readiness and recovery evidence only.

## 14. Realtime work

Plan stale subscription/client containment and authorization refresh; no activation in Draft.

## 15. Frontend implementation

Use accepted maintenance/read-only/migration communication designs; no UI implementation.

## 16. Design traceability

Affected Screen IDs: IR-018 readiness/freeze MIG states; exact mapping remains in accepted manifest.

No annotated export creates behavior beyond its accepted contract. Existing Screen IDs, Component IDs, tokens, navigation, and locked states remain stable unless their separate change-control process approves a change.

## 17. Migration and compatibility

S14/S15/S18 freeze/final-delta/recovery plan, no actual execution.

This packet permits no actual cutover: it prepares evidence and an abort/rollback decision only. IR-019 still requires separate production authorisation.

## 18. Security acceptance

Required evidence includes same-Group success; unrelated-Group denial; inactive and removed Member denial; Owner/Member boundary; direct object/ID substitution denial; replay and race handling where applicable; service-role confinement; secret handling; and audit-safe output. Failure in a required negative case blocks release consumption.

## 19. Functional acceptance

S14, S15, S18, release/security gates.

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

1. Consume rehearsal evidence. 2. Record required release inputs. 3. Define abort/rollback decision points. 4. Review stale-client/secret plan. 5. Leave IR-019 unauthorised pending separate production approval.

Each future step must name its intended outcome, systems/files touched, prerequisite, verification, and rollback point before execution begins.

## 26. Stop conditions

Stop rather than improvise for an architecture or locked-design contradiction, missing fixture, unsafe RLS result, cross-Group access, unreviewed migration ambiguity, unexpected production dependency, impossible rollback, unreviewed design change, or an R-02 defect that blocks the applicable acceptance gate.

## 27. Completion evidence

Before this packet can be Verified, retain reviewed implementation diff/test artifacts, negative security evidence, relevant fixture results, R-02 implementation evidence, rollback/recovery evidence, updated traceability, and an approved packet exit record. Draft status cannot satisfy this gate.

## 28. Open questions

Maintenance window, deployment access, writer inventory, production secret validation, and backup authority are not established.

## 29. Packet exit gate

Dependent work may begin only when this packet has its required evidence, rollback conditions, reviewer decision, and an explicit exit record. This Draft packet neither marks the packet complete nor authorises implementation.
