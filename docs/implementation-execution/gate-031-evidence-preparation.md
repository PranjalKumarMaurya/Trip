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
| Owner Auth identity | Missing |
| Verified Owner identity | Missing |
| Exactly-one Profile linkage | Missing |
| Bootstrap request ID | Present in controlled package; pending reviewed request approval |
| Mandatory Group configuration | Pending approval |
| Product approval | Missing |
| Data approval | Missing |
| Security approval | Missing |
| Architecture approval | Missing |
| Baseline checksums, including migration-010 absence | Validated |
| Secret-safety classification | Passed |

The controlled package holds the raw request identifier, and would hold any
identity, Profile, configuration, and approval evidence. None of those values
is reproduced here. No final controlled-manifest SHA-256 exists because the
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

A protected Owner-selection intake now asks the Product Owner to select exactly
one intended Auth identity. It contains no candidate identity because none was
authorised for inspection during this pass.

### Configuration discovery

The accepted sources fix the mandatory configuration structure and validation
rules, not reviewed GATE-031 values. Legacy/current-state sources provide only
candidates. The accepted migration plan records a historical date conflict and
requires retained-source and deployed-version adjudication plus Product
approval; legacy hardcoded, README, or seed material cannot decide it.

Every mandatory configuration field remains `CANDIDATE REQUIRES PRODUCT
APPROVAL`. A protected configuration-approval intake now holds the source
disposition and requires a complete all-fields Product decision; it records no
values in Git.

### Review sequencing

Product selection and complete configuration approval are the first dependency.
After authorised read-only Auth/verification/exactly-one-Profile evidence is
attached to the protected request, Data, Security, and Architecture reviews may
run in parallel against the same frozen controlled inputs. No approval has been
issued by this preparation pass.

## Baseline and safety

The starting repository head, migrations `006` through `009`, the frozen
IR-003 contract, the accepted DCC record, and absence of migration `010` were
recorded in the controlled package. The package is user-private, outside every
Git worktree, and is not trackable by Git. Its manifest has no credential
material.

## Next activity

The Product Owner must select exactly one intended Owner identity and decide the
complete mandatory configuration in the protected intakes. Then obtain
authorised read-only identity, verification, and Profile-linkage evidence;
capture four separate gate-specific approval records; and perform a separate
GATE-031 evidence review and satisfaction decision. This record must be
superseded by a new controlled-manifest hash only after every required field is
final.
