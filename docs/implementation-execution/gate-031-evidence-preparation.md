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

## Baseline and safety

The starting repository head, migrations `006` through `009`, the frozen
IR-003 contract, the accepted DCC record, and absence of migration `010` were
recorded in the controlled package. The package is user-private, outside every
Git worktree, and is not trackable by Git. Its manifest has no credential
material.

## Next activity

Obtain the missing controlled identity, verification, Profile-linkage,
configuration, and four approval records. Then perform a separate GATE-031
evidence review and satisfaction decision. This record must be superseded by a
new controlled-manifest hash only after every required field is final.
