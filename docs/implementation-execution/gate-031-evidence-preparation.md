# GATE-031 — IR-003 Controlled Evidence Preparation Record

## Scope and decision boundary

- Gate: `GATE-031`
- Packet: `IR-003`
- Controlled-evidence reference: `GATE-031-IR-003-CONTROLLED-20260812`
- Controlled manifest schema: `1`
- Evidence readiness: **INCOMPLETE — GATE-031 REMAINS BLOCKED**
- Gate status: **Not satisfied**
- IR-003 status: **Not authorised**

This redacted record describes a controlled non-Git package only. It is not a
gate satisfaction decision, an IR-003 authorisation, or authority for
`TOP-001`, migration `010`, a database mutation, remote Supabase access,
deployment, or cutover.

## Identity scope resolution

The required identity is the separately product/security-selected initial Owner
for the eventual migrated Bali Group under migration S04/S05. A local,
staging, rehearsal, persona, display-name, fixture, or historical identity is
not a substitute. No target environment was accessed during this preparation.

## Redacted evidence status

| Required category | Status |
| --- | --- |
| Intended Owner selection | **INCOMPLETE — OWNER IDENTITY SOURCE REQUIRED** |
| Owner Auth identity | Missing |
| Verified Owner identity | Missing |
| Exactly-one Profile linkage | Missing |
| Bootstrap request ID | Present in controlled package; pending reviewed request approval |
| Mandatory Group configuration | **Product-approved in controlled package** |
| Product approval | **Complete for mandatory configuration only; intended Owner-selection scope remains incomplete** |
| Data approval | Missing |
| Security approval | Missing |
| Architecture approval | Missing |
| Baseline checksums, including migration-010 absence | Validated |
| Secret-safety classification | Passed |

The controlled package holds the raw request identifier and holds any identity,
Profile, configuration, and approval evidence. None of those values is
reproduced here. No final controlled-manifest SHA-256 exists because the
package is incomplete.

## Evidence-completion pass — 2026-08-12

### Approval authority resolution

GATE-031 requires four distinct, gate-specific approvals. The Product owner
may issue the Product approval; the Database/migration reviewer, Security
reviewer, and Architecture authority respectively own the Data, Security, and
Architecture approvals. Governance does not permit this implementation executor
to issue any of them.

Accepted architecture, migration, data-model, and security documents remain
required review inputs, but none is a GATE-031-specific approval record. Each
approval therefore requires a new bounded review record referencing the exact
controlled request, selected Owner evidence, and complete configuration after
they are available. Governance defines reviewer and implementation-executor
roles separately, but does not state an additional named independence rule for
these pre-authorisation approvals; the record must identify its authorised
reviewer and decision.

### Read-only local discovery

No repository-authorised local Supabase environment was available for this
checkout. The repository has no local project configuration, and the observed
host Docker stack is not linked to this checkout; it was not queried. No remote
Supabase service was accessed. Consequently no Auth, verification, or Profile
linkage evidence was added.

A protected Owner-selection intake asks the Product Owner to select exactly one
intended Auth identity. It contains no legitimate candidate identity because
none was authorised for inspection during this pass; its redacted decision
status is **OWNER IDENTITY SOURCE REQUIRED**. No identity has been selected,
inferred, or fabricated.

### Configuration discovery

The accepted sources fix the mandatory configuration structure and validation
rules, not reviewed GATE-031 values. Legacy/current-state sources provide only
candidates. The accepted migration plan records a historical date conflict and
requires retained-source and deployed-version adjudication plus Product
approval; legacy hardcoded, README, or seed material cannot decide it.

The Product Owner has completed a bounded approval of every mandatory
configuration field and explicitly adjudicated the historical date conflict.
The protected intake retains the values, source dispositions, per-field
adjudications, timestamp, and scope. Git records no value from that decision.
The approval is limited to mandatory configuration; it does not select an
Owner or issue Data, Security, or Architecture approval.

### Review sequencing

Mandatory configuration is now Product-approved, but no legitimate initial
Owner candidate source exists. After one intended Owner is selected and
authorised read-only Auth-row, verification, and exactly-one-Profile-linkage
evidence is attached to the protected request, Data, Security, and Architecture
reviews may run in parallel against the same frozen controlled inputs. Their
approvals remain missing.

## Baseline and safety

The starting repository head, migrations `006` through `009`, the frozen
IR-003 contract, the accepted DCC record, and absence of migration `010` were
recorded in the controlled package. The package is user-private, outside every
Git worktree, and is not trackable by Git. Its manifest has no credential
material.

## Next activity

Obtain a legitimate initial-Owner identity source. The Product Owner must then
select exactly one intended Owner and record the corresponding bounded Product
approval. Obtain authorised read-only Auth-row, verification, and
exactly-one-Profile-linkage evidence; capture the remaining Data, Security, and
Architecture approvals; and perform a separate GATE-031 evidence review and
satisfaction decision. This record must be superseded by a new controlled-
manifest hash only after every required field is final.

## Remote baseline verification authority and access result — 2026-08-20

The Product Owner has explicitly authorised the remote Supabase access necessary
for W3. Read-only target-baseline verification is authorised. Any necessary W3
Auth/Profile/database mutation may be considered only after its individual
prerequisites pass; the accepted W3 gate order remains mandatory. This authority
does not satisfy GATE-031, authorise IR-003, or authorise migration `010` or
`TOP-001`.

The first bounded remote verification attempt did not positively identify the
intended Trip target. The existing authenticated CLI session has no linked
project for this repository and its accessible-project inventory did not identify
the Trip target. The only repository-hosted Supabase hostname is legacy public
asset storage and is not valid target-identification evidence. No alternative
project was selected, queried, or modified.

The redacted controlled record
`trip-controlled-evidence/gate-031/remote-baseline-verification-20260820.md`
records the method, local baseline checksums, and access-blocked result outside
Git. It contains no credentials or project identifiers. Remote schema, Auth
configuration, and Auth-user-count verification remain pending the exact target
project reference and access/linkage evidence. GATE-031 remains **Not
satisfied** and IR-003 remains **Not authorised**.

## Target-linked baseline reattempt — 2026-08-20 UTC

The Product Owner-designated Travel target was subsequently positively
identified and linked in the authenticated CLI session. The exact reference is
retained only in the new controlled record
`remote-baseline-verification-20260821.md`; Git deliberately records no
project identifier or credential.

The reattempt completed read-only linkage, migration-history, generated-schema,
PostgREST object-presence, Auth-settings, and zero-user checks. The target is
reachable, has an enabled email-signup/confirmation path, and has zero Auth
users. However, it has no remotely applied migrations and the required
`public` baseline objects are absent. Equivalents of migrations 006–009,
including `public.profiles`, its Auth FK/uniqueness constraint, the creation
function/trigger path, and Profile RLS/grants therefore fail the audit.

This advances the result from target-access blocked to **TARGET SCHEMA BASELINE
INCOMPLETE**. It neither satisfies GATE-031 nor authorises IR-003, Owner
creation, migration 010, TOP-001, deployment, or a repair. The smallest next
step is separately authorised application of existing migrations 006–009 to
the exact controlled target, followed by a fresh read-only audit.
