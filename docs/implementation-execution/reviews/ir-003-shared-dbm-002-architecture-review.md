# IR-003 shared DBM-002 supplemental Architecture review

## Decision

**SUPPLEMENTAL ARCHITECTURE APPROVAL GRANTED**

| Field | Record |
| --- | --- |
| Reviewer role | Independent supplemental Architecture reviewer |
| Scope | Frozen shared IR-002 / DBM-002 timezone-reference proposal required by W3 / IR-003 |
| Repository baseline | `review/dbm002-supp-architecture` at `9bfd6cdfe92923b7be2f33e0a8e17f111094a295` |
| Decision boundary | Architecture acceptability for a later shared DBM-002 authorisation only |

This approval is not implementation authority.  It does not authorise migration
`011`, alter migration `007` or `010`, amend IR-003, unblock Lane C, change
generated types, modify a remote target, deploy, or push.

## Governing sources reviewed

- [Shared DBM-002 supplemental change-control proposal](../ir-003-shared-dbm-002-change-control-proposal.md) and [remediation freeze](../ir-003-shared-dbm-002-remediation-freeze.md).
- [Product timezone semantic evolution decision](../ir-003-product-timezone-semantic-evolution.md), which is the sole authority for the controlled-reference product meaning.
- [IR-002 packet](../packets/IR-002-tenant-data-foundation.md), [IR-003 packet](../packets/IR-003-atomic-group-bootstrap.md), and [IR-003 authorisation](../authorisations/IR-003-authorisation.md).
- [Database migration register](../database-migration-register.md), [change control](../change-control.md), [execution order](../execution-order.md), [dependency graph](../dependency-graph.md), [W3 plan](../waves/W3-group-lifecycle-storage-and-realtime.md), and [trusted-operation register](../trusted-operation-register.md).
- [GATE-031 decision](../gate-031-decision.md) and its original [Data](../gate-031-data-review.md), [Security](../gate-031-security-review.md), and [Architecture](../gate-031-architecture-review.md) reviews.
- Accepted target architecture, domain/data, security, and migration-plan records, and migrations `006` through `010`.

## Architecture findings

| Review area | Result | Finding |
| --- | --- | --- |
| Ownership classification | PASS | The validator and timezone-reference semantics were created by IR-002/DBM-002 in immutable `007_ir002_configuration_archive_audit.sql`. IR-003/DBM-014/TOP-001 only consumes the validator while inserting configuration. A later DBM-002-owned migration may evolve that shared contract without editing `007` or reopening IR-002 generally. |
| Product / technical boundary | PASS | The Product decision alone selects application-approved reference-set semantics. The proposal implements that fixed meaning; its relations, roles, reconciliation, drift handling, and placement do not make PostgreSQL, OS, or platform tzdata a live Product-validity authority. |
| `ir002_private` introduction | PASS | The repository already uses a narrowly revoked private schema (`ir007_private`) for non-browser database internals. `ir002_private` confines two non-tenant control/reference relations, moves no public Group/business table, adds no tenant scope, and is not a generic infrastructure layer. Its absent public-schema exposure preserves the generated application schema boundary. |
| Shared reference subsystem | PASS | One deterministic reviewed dataset, one integrity/control row, one existing public validator, and deployment-only reconciliation are a bounded DBM-002 subsystem. There is no scheduler, browser maintenance API, reference-data service, or generalized platform. |
| Public validator compatibility | PASS | `public.is_valid_iana_timezone(text) RETURNS boolean` and the existing configuration CHECK remain logical API contracts. Replacing its internal lookup does not require application-wide API redesign; type generation may reflect implementation metadata later but not a signature change. |
| Maintenance boundary | PASS | Reviewed migration/deployment work is consistent with the repository's migration provenance and forward-repair model. The named deployment operator and no-login maintenance role make accountability identifiable, preserve governed Product changes, and permit secret-safe drift evidence without a runtime service. |
| Drift model | PASS | The proposal distinguishes the committed Product-approved reference set from the PostgreSQL/tzdata catalogue. Platform additions remain non-authoritative; removals, bidirectional drift, and corruption fail closed pending governed reconciliation. Platform state therefore cannot silently redefine application validity. |
| Trusted-operation scope | PASS | No new logical TOP is required. Reconciliation is a reviewed deployment/migration action, not a browser- or application-invokable mutation capability; it has neither a user actor contract nor a reusable runtime API. TOP-001 and the frozen TOP register remain unchanged. |
| Migration `011` after `010` | PASS | `010` is an undeployed, immutable IR-003 candidate and the target has no TOP-001 runtime use. Applying authorised `010` and then authorised `011` in one controlled no-traffic release before any validation-dependent runtime use is legitimate schema ordering. The runtime dependency is stricter: TOP-001/release waits for both migrations and independent shared verification. No unacceptable operational intermediate state is exposed under that cutover rule. |
| M1 / M3 alternatives | PASS | M1 would breach DBM-014's frozen IR-003-only ownership and mutate its checksum/evidence. M3 would renumber and supersede an otherwise immutable candidate and invalidate traceability without improving the runtime gate. M2 preserves provenance, evidence, recovery direction, and packet ownership; lower numbering is not an architectural benefit. |
| Migration reservation | PASS | The migration register explicitly reserves only `011_ir002_timezone_reference.sql` as **PROPOSED / RESERVED / NOT AUTHORISED**. Repository inspection finds no tracked migration after `010` and no competing frozen future migration ownership for `011`. |
| Evidence supersession | PASS | GATE-031, IR-003 authorisation, Lane A/B records, Lane C diagnosis, and Product decision remain historical facts. New shared provenance and verification may supersede current candidate/runtime assumptions prospectively without changing hashes or falsifying old evidence. |
| GATE-031 treatment | PASS | GATE-031 remains historically **Satisfied** for its original IR-003 evidence package. The shared prerequisite is outside that package and receives supplemental reviews and separate authority; it neither reuses nor reopens the historical gate. |
| IR-003 authorisation treatment | PASS | IR-003 remains Authorised but implementation-blocked. A post-shared-verification amendment binding the approved `011` identity, dataset provenance, Lane-B subset, full Lane-C rerun, and expanded independent verification is sufficient; it is not issued by this review. |
| W3 dependency graph | PASS | The shared remediation is a bounded prerequisite to IR-003 runtime only. It preserves `IR-003 -> IR-005 -> IR-006`, including GATE-014, and keeps IR-009/IR-010 at their frozen prerequisites. It authorises no later packet. |
| Lane D | PASS | The isolated Lane D work remains within the frozen bootstrap UI handoff. It does not own timezone-reference infrastructure and continues to submit IANA string values through the existing fields; the Product semantic change requires no Lane D redesign. |
| Generated types | PASS | The private schema must remain outside the existing `public` generated-schema source. The public validator retains its logical signature. Integration alone regenerates types after the authorised integrated schema, twice and byte-identically; no browser-facing private-object surface is introduced. |
| Performance and verifier obligations | PASS | Frozen thresholds are unchanged and prototype measurements remain design evidence only. The required verifier scope correctly covers supplemental authority, provenance/dataset/drift, private schema/roles/grants, validator/CHECK, maintenance boundary, Lane-B regression, full Lane-C evidence, and no later-IR leakage. |

## Frozen implementation and verification order

1. Supplemental Data, Security, and Architecture approvals.
2. Separate shared DBM-002 forward-evolution authorisation.
3. Shared DBM-002 implementation in authorised `011` and independent shared verification.
4. Supplemental IR-003 authorisation amendment binding the verified prerequisite.
5. Lane-B timezone/shared regression subset.
6. Full Lane-C rerun from zero.
7. Lane D integration.
8. DBM-013 generated types twice, byte-identical, after the authorised integrated schema.
9. IR-003 integration verification.
10. Fresh independent IR-003 verification.

The amendment belongs after shared implementation and independent shared
verification: shared work needs its own authority and must not rely on
IR-003's authority, while the amendment must bind a real approved migration,
dataset, and verification result rather than a proposed one.

## Status and residual boundary

- GATE-031 remains historically **Satisfied**.
- IR-003 remains **Authorised**, not globally Implemented, and not Verified.
- Lane C remains blocked; Lane D remains isolated.
- Migration `011` remains proposed/reserved only; shared remediation remains unauthorised.
- No implementation, migration/source/type change, remote mutation, deployment, push, or cross-Wave scope change is approved or performed by this review.

## Verification

The review record is limited to this file. Required repository checks, document
consistency checks, and a secret/scope scan are recorded with the review commit.

## Architecture-owned blockers

None. Later shared authority, implementation, and verification prerequisites
remain governance/execution work; they are not architecture defects in the
frozen proposal.
