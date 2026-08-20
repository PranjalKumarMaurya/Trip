# GATE-031 — IR-003 Controlled Evidence Preparation Record

## Scope and decision boundary

- Gate: `GATE-031`
- Packet: `IR-003`
- Controlled-evidence reference: `GATE-031-IR-003-CONTROLLED-20260812`
- Controlled manifest schema: `1`
- Evidence readiness: **READY FOR SEPARATE GATE-031 REVIEW**
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
not a substitute. The original preparation pass did not access a target
environment; the later bounded evidence capture is recorded below.

## Redacted evidence status

| Required category | Status |
| --- | --- |
| Intended Owner selection | **Complete — Product Owner explicitly selected one real target account** |
| Owner Auth identity | Complete — controlled evidence only |
| Verified Owner identity | Complete — accepted confirmed-email condition passed |
| Exactly-one Profile linkage | Complete — controlled evidence only |
| Bootstrap request / execution manifest | Complete — frozen controlled request reviewed by all three independent approval lanes |
| Mandatory Group configuration | **Product-approved in controlled package** |
| Product approval | **Complete for mandatory configuration and intended Owner-selection scope only** |
| Data approval | **Granted — `gate-031-data-review.md`** |
| Security approval | **Granted — `gate-031-security-review.md`** |
| Architecture approval | **Granted — `gate-031-architecture-review.md`** |
| Baseline checksums, including migration-010 absence | Validated |
| Secret-safety classification | Passed |

The controlled package holds the raw request identifier and holds any identity,
Profile, configuration, and approval evidence. None of those values is
reproduced here. Its final pre-decision manifest uses schema `1` and has the
canonical SHA-256
`b255c36c8249db35f5cf711054dfee28fca0858904a2900426e2e0951dc65e2a`.
The hash input is UTF-8 JSON canonicalized with `jq -S --indent 2`, one
terminal LF, and `canonicalisation.finalManifestHash` omitted to avoid a
self-reference. This records complete pre-decision evidence only; it is not a
GATE-031 satisfaction decision or IR-003 authorisation.

## Final pre-decision evidence integration — 2026-08-21

| GATE-031 pre-decision requirement | Status / redacted evidence anchor |
| --- | --- |
| Validated initial Owner Auth identity | PASS — selected identity, Auth-row existence, and confirmed-email condition are complete only in the protected package. |
| Exactly-one Profile linkage | PASS — protected one-row linkage predicate is complete. |
| Reviewed bootstrap request / execution manifest | PASS — one protected request UUID and frozen request fields were reviewed by the Data, Security, and Architecture lanes. |
| Mandatory Group configuration and historical-date adjudication | PASS — Product-approved controlled configuration record; values remain outside Git. |
| Product approval | PASS — protected Product approval record. |
| Data approval | PASS — [Data review](gate-031-data-review.md). |
| Security approval | PASS — [Security review](gate-031-security-review.md). |
| Architecture approval | PASS — [Architecture review](gate-031-architecture-review.md). |
| Target baseline and checksum provenance | PASS — controlled target `001`–`009` deployment/fresh-audit record; accepted `006`–`009` and frozen-contract checksums match. Migration `010` remains absent. |
| Secret-safety classification and evidence provenance | PASS — controlled package is outside Git, directory mode `0700`, files mode `0600`, no credential material; Git record is redacted. |
| No authoritative IR-003 bootstrap state | PASS — existing Auth/Profile evidence is an input only; no IR-003 Group, configuration, membership, or Owner state exists. |

The package has no unresolved pre-decision evidence blocker and is **READY FOR
SEPARATE GATE-031 REVIEW**. GATE-031 remains **Not satisfied** and IR-003
remains **Not authorised** pending that separate decision.

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

## Owner identity evidence completion — 2026-08-21 IST

The Product Owner explicitly selected the one account created through the
authorised normal application signup as the initial Owner for the eventual
migrated Bali Group. The frozen, one-query, read-only procedure then passed its
four required checks: one selected Auth row, accepted verified-identity
condition true, one linked Profile, and exactly-one linkage true. The normal
email-confirmation state is therefore verified; a later browser callback with
an expired OTP did not change that recorded state.

The protected package alone retains the selected identifiers, rendered query,
and raw one-row result. Its redacted artifact references are
`owner-identity-provenance-20260820T202251Z.md`
(`270eb85a136975a9ca298681c93f431b29a0522149700868c6463f78a380cbb8`),
`owner-identity-rendered-query-20260820T202251Z.sql`
(`641f3a8de51ab9dafeaa77ce303a79a3011a67b8b2e6d4d13cd7b8803934d5d3`),
and `owner-identity-result-20260820T202251Z.json`
(`cdad9e6957eb858f600968bbc691082b1d6e39db5b2a965982a349918afb10ed`).
They contain no password, browser key, service/secret key, or email address.

This completes the intended-Owner selection, Auth-row existence, verified
identity, exactly-one Profile linkage, and Owner identity evidence categories
only. Data, Security, and Architecture reviews may now begin independently
against the frozen controlled package. GATE-031 remains **Not satisfied** and
IR-003 remains **Not authorised**.

## Next activity

Launch independent Data, Security, and Architecture GATE-031 reviews against
the frozen controlled package. After all three are complete, conduct a separate
GATE-031 satisfaction decision. Do not create Group, configuration, member, or
Owner data; do not apply migration `010`; and do not authorise IR-003 before
that decision.

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

## Authorised prerequisite deployment and fresh audit — 2026-08-20 UTC

The remote target had no repository migration history, so a dependency review
found that `009` also requires the legacy tables created by `001`–`005`; the
frozen valid prefix was therefore `001` through `009`, not `006` through
`009` alone. After checksum validation and a CLI dry run, the linked standard
migration mechanism applied that exact accepted prefix. No seed, migration
`010`, Auth/configuration mutation, Auth user, Profile, Group, configuration
row, TOP, deployment, or cutover was performed.

The fresh controlled audit passed the deployed 006–009 equivalent baseline:
tenant/configuration/audit foundations, nullable-unique-restrictive
`profiles.auth_user_id`, the one enabled Auth insert Profile trigger,
fail-closed RLS/FORCE RLS/policies/grants, zero Auth users, zero Profiles, and
the still-viable email-confirmation signup configuration. The redacted
protected evidence is `target-baseline-deployment-20260820.md`; Git contains
no target ref, credential, or identity value.

This is a database prerequisite result only. **GATE-031 remains Not satisfied
and IR-003 remains Not authorised.** The next controlled action is to create
exactly one legitimate intended Owner Auth account through the supported signup
path, complete email confirmation, verify automatic exactly-one Profile
linkage, and capture frozen Owner identity evidence for separate GATE-031
review.
