# Product timezone semantic evolution decision

## Decision

**PRODUCT TIMEZONE SEMANTIC EVOLUTION APPROVED**

- Decision authority: Product owner — product scope and acceptance decisions.
- Decision timestamp: `2026-08-22T21:06:34+05:30`.
- Scope: Product semantics only for the shared IR-002 / DBM-002 timezone
  validity contract consumed by IR-003. This is a documentation-only
  supplemental decision; it creates no implementation authority.

The Product owner is the correct authority for this user-visible validity
meaning. This decision does not exercise Data design, Security, Architecture,
migration-placement, or implementation authority; those remain independently
required for any shared DBM-002 forward evolution.

## Frozen old and new product semantics

### Previous product semantics

Timezone validity changed automatically with the then-current PostgreSQL
`pg_timezone_names` catalogue: a slash-qualified candidate was valid precisely
when its exact, case-sensitive name was present in that live catalogue.

### Approved product semantics

Timezone validity is determined against a controlled application-approved IANA
timezone reference set. The set is exact and case-sensitive, and the existing
slash-qualified lexical guard remains in force. Canonical names and aliases may
be valid when they are present in the approved reference set. The public logical
contract remains `is_valid_iana_timezone(text) -> boolean`; no signature change
is approved or implied.

This decision does not silently rewrite existing stored valid timezone values.

## Product behaviour when the catalogue changes

A PostgreSQL, operating-system, or hosting-platform tzdata upgrade does not by
itself change application-valid timezone values. The application favours stable,
governed validity over automatic live-catalogue drift:

- Drift must be detected and reconciled through a later authorised maintenance
  process; known reference/catalogue drift must not be silently ignored.
- A name newly present in the underlying catalogue is not application-valid
  until governed reconciliation accepts it into the approved reference set.
- A removed or renamed name must be identified through reconciliation rather
  than silently being treated as unchanged forever.
- Availability for validation-dependent writes under known-invalid or
  unreconciled reference state follows the later Data, Security, and
  Architecture-approved integrity policy.

The handling of an already-stored value after removal or rename is a later
Data/Product migration-policy decision. It is neither decided nor silently
changed here.

## Bounded rationale and evidence

The performance evidence motivates this product-semantic evolution; it does
not approve a physical design. The current live model's frozen ten-worker
distinct-request p95 was approximately `119 ms`, above the `<= 40 ms` limit.
Removing the duplicate TOP-001 call still measured approximately `65 ms` p95
and failed. The indexed controlled-reference design measured `12.095 ms` p95
and `13.405 ms` p99 under the frozen ten-worker workload (with the earlier
single-worker p95 `6.165 ms`), materially within the frozen `<= 40 ms` p95 and
`<= 75 ms` p99 limits.

The controlled design and measurement context remain in
[`ir-003-shared-dbm-002-remediation-freeze.md`](ir-003-shared-dbm-002-remediation-freeze.md)
and `CC-IR003-20260821-performance-correction-design`; raw benchmark evidence
is not duplicated into Git by this decision.

## Explicit non-approval boundary

This Product decision does not approve a reference-relation shape or private
schema; `SECURITY DEFINER`; function ownership or grants; a maintenance or
drift-detection operation; any refresh mechanism; migration placement or
renumbering; shared implementation; a shared DBM-002 authorisation; or an
IR-003 authorisation amendment. It also does not approve Data, Security, or
Architecture inputs or any migration change.

## Status and next governance dependency

GATE-031 remains historically **Satisfied** for the original IR-003 package;
this supplemental decision does not reopen it. IR-003 remains **Authorised**,
but implementation-blocked on the supplemental shared prerequisite; it is not
globally Implemented or Verified. Lane C remains blocked, Lane D remains
isolated, and the shared remediation is not implementation-authorised.

This resolves the sole Product-semantic blocker recorded as **SHARED DBM-002
REMEDIATION DESIGN BLOCKED**. The next eligible decision is:

**READY FOR SUPPLEMENTAL SHARED DBM-002 CHANGE-CONTROL DECISION**

That later decision must select the physical design, M3/migration-placement
strategy, maintenance model, security boundary, and required independent Data,
Security, and Architecture approval inputs. It is not performed by this record.
