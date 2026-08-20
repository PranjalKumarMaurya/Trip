# Shared DBM-002 timezone performance-remediation freeze

## Decision

**SHARED DBM-002 REMEDIATION DESIGN BLOCKED**

This is a supplemental design/governance review for the Lane C TOP-001 performance defect. It is not implementation authority. It changes no SQL, migration, function, generated type, test harness, remote state, deployment, or Lane D path.

The classification is **SHARED DBM-002 FORWARD EVOLUTION REQUIRED BY W3**. It is not a reopening or rewrite of accepted immutable migration `007`, and it is not IR-003-owned implementation. `007_ir002_configuration_archive_audit.sql` remains immutable. A later shared evolution would be owned by DBM-002 and would be a prerequisite consumed by IR-003.

## Existing semantic contract

The accepted IR-002 authorisation and the implemented function together make the authoritative contract **LIVE `pg_catalog.pg_timezone_names` equivalence, subject to the existing slash-qualified lexical guard**. It is not a snapshot or application-maintained catalogue. The source named by the accepted record is the PostgreSQL IANA tzdata catalogue in the selected local Supabase image, and the function reads that catalogue at validation time.

`public.is_valid_iana_timezone(text) -> boolean` therefore has these current observable semantics:

| Input | Current result |
| --- | --- |
| `NULL` | `NULL` (SQL three-valued result); the consuming configuration column is separately `NOT NULL` |
| blank/whitespace | `false` |
| canonical slash-qualified catalogue name | `true` when exactly present live |
| invalid or non-catalogue name | `false` |
| case variation | `false` unless that exact case is separately exposed by the live catalogue |
| unusual valid slash-qualified name | `true` when exactly present live |
| slash-qualified alias exposed by the live catalogue | `true`; no alias canonicalisation occurs |
| non-slash catalogue entry | `false` because the existing lexical guard requires at least one slash |

The equality is exact and case-sensitive. Regex matching only limits candidate shape; it is not the validity authority. Existing callers, including generated public DB types and `group_configurations.timezone` CHECK, are entitled to the same signature and behaviour.

## Physical-design review

The measured Option-B prototype is design evidence only: an ordinary persistent relation with 1,151 names, no difference from its then-live catalogue, and primary-key lookup measured frozen 10-worker p95 `12.095 ms`, p99 `13.405 ms`, max `13.837 ms`. It is not implementation evidence.

| Representation | Finding |
| --- | --- |
| Ordinary table with `PRIMARY KEY (name)` | The smallest performant physical representation; it supports exact-name index lookup and controlled reconciliation. It is a snapshot unless maintained. |
| Materialized representation | Rejected: it is also a snapshot, adds refresh/concurrency machinery, and has no semantic or security advantage. |
| Other PostgreSQL-native persistent/indexable representation | None provides an automatically live, indexed mirror of `pg_timezone_names`; a view remains live but retains the measured catalogue-access cost. |

If a separate authority explicitly adopts snapshot/application-reference semantics, the frozen minimum candidate is:

```text
schema:  ir002_private (not browser-usable)
relation: ir002_private.iana_timezone_reference
columns:  name text not null
key:      primary key (name) -- the only index and duplicate prevention
source:   exact distinct `pg_catalog.pg_timezone_names.name` values satisfying
          the existing slash-qualified shape rule
owner:    a dedicated no-login DBM-002 maintenance owner
RLS:      disabled; private-schema usage and table privileges are revoked from
          PUBLIC, anon, authenticated, and service_role
write:    only the dedicated protected reconciliation operation/owner
read:     only the validator owner; no direct application-role SELECT
```

No extra timestamp, source-version, or denormalised columns belong in the reference relation. Reconciliation evidence, not a mutable table metadata column, records source image/version, catalogue/reference counts, bidirectional set differences, operator, and result.

The candidate validator would preserve the public signature, stay SQL and `STABLE`, use `SECURITY DEFINER`, be owned by the dedicated no-login validator owner, have `search_path = pg_catalog, ir002_private`, and schema-qualify the reference relation. `PUBLIC`, `anon`, and `authenticated` could retain only `EXECUTE`; the relation remains hidden. This removes the need for browser roles to receive SELECT or mutation authority. It requires a new explicit Security review because the current validator is `SECURITY INVOKER` and public callable. It is not approved by this record.

## Live-semantics analysis and blocker

The following mechanisms do not preserve exact live equivalence by themselves:

| Mechanism | Newly added catalogue name | Removed/renamed catalogue name | Result |
| --- | --- | --- | --- |
| Migration-time snapshot | rejected until next migration | incorrectly accepted | fails |
| Future-migration refresh | rejected until migration | incorrectly accepted until migration | fails |
| Protected refresh operation | correct only after an operator runs it | incorrectly accepted before refresh | fails as an always-live contract |
| Scheduled refresh / scheduled verifier | can be stale between runs | can incorrectly accept between runs | fails as an always-live contract |
| Automated verification plus fail-closed reconciliation | detects and blocks known drift after its check | detects and blocks known drift after its check | not exact during an undetected interval |
| Hybrid reference lookup plus catalogue fallback | can find additions through the fallback | must check every reference hit to reject removals | exact only with per-call live comparison, which defeats the passing design |

PostgreSQL/tzdata catalogue changes can occur outside a project-table trigger (for example through image/platform maintenance). There is no repository-owned event that atomically changes the reference relation at the exact instant the catalogue changes. Consequently, an indexed relation cannot both remain the sole hot-path authority and be exactly live at every call. A protected refresh, platform maintenance contract, or fail-closed deployment policy can prevent known stale data from being served, but cannot preserve the currently accepted always-live contract without a live check on the validation path.

The unresolved single blocker is therefore the absence of authority to evolve the validator from live catalogue membership to an application-maintained reference-set contract. Selecting that semantic evolution merely for speed is not permitted. No reference-data maintenance owner, refresh cadence, or failure policy is frozen as authoritative while this semantic choice remains unapproved.

## Conditional semantic-evolution and maintenance model

If Product, Data, Security, and Architecture expressly approve a change to an application-maintained exact reference set, its contract must say that the accepted set is the reconciled set recorded for the deployed PostgreSQL/tzdata baseline, rather than the live catalogue at every call. It must preserve all lexical, case, alias, null, signature, and CHECK behaviours above against that set.

Only after that decision may the following maintenance model be authorised:

1. DBM-002's dedicated maintenance operation performs a transactionally protected, bidirectional catalogue/reference comparison and replacement before the dependent application/database baseline becomes available and after every approved platform/PostgreSQL/tzdata change.
2. The database/migration owner records secret-safe controlled evidence of source image/version, counts, additions, removals, exact-set equality, operation identity, and outcome. A scheduled verifier may detect drift, but it does not replace the pre-availability reconciliation trigger.
3. Only the dedicated no-login maintenance owner may refresh. Browser callers have neither table access nor refresh authority.
4. On known drift, availability for validation-dependent writes is blocked until protected reconciliation succeeds; the validator must fail closed if its approved readiness state is unavailable. No known-stale reference data may be silently served.

This conditional model is intentionally not a claim of live equivalence. The application's availability therefore depends on successful controlled reconciliation at the named triggers.

## CHECK and direct-call compatibility

The candidate remains suitable for ordinary `CHECK` evaluation only if the reference relation and validator owner are available to every ordinary `INSERT`/`UPDATE`, the validator remains `STABLE`, and reconciliation is serialized outside write availability. Invalid values must continue to reject atomically. No constraint is weakened and no caller needs direct SELECT.

The current direct public function signature remains unchanged. A SECURITY DEFINER implementation with tightly fixed search path and a hidden private relation is the safer conditional model; the required Security review must assess ownership, function replacement, EXECUTE revokes/grants, operator resolution, search path, RLS posture, and unauthorised refresh denial.

## Migration location and IR-003 impact

| Option | Status | Reason |
| --- | --- | --- |
| M1 — amend migration `010` | Rejected | DBM-014 explicitly excludes the shared DBM-002 object and maintenance boundary. |
| M2 — dedicated migration after `010` | Rejected as a prerequisite | `011` is presently unreserved, but applying it after TOP-001 cannot improve the `010` validation path that it must precede. Existing authority does not authorise it. |
| M3 — dedicated shared prerequisite before IR-003 by renumbering | Conditionally viable only after approvals | `010` is reserved for DBM-014 and `011` is otherwise free, so this requires a reviewed supersession of the reservation and a separate shared DBM-002 migration before a renumbered IR-003 migration. It cannot occur under current authority. |
| M4 — another location | Rejected | No repository-supported location preserves ownership and ordering without the same reviewed reservation supersession. |

No migration location is selected because the underlying semantic authority is missing. The proposed migration is not created; migrations `001`–`010` remain unchanged. The next number is not casually reserved by this record.

IR-003 remains **Authorised but implementation-blocked on a supplemental shared prerequisite**. Its authority is neither suspended nor replaced. A supplemental amendment is required only after the shared change-control and shared DBM-002 authorisation have passed; it must bind IR-003 to the approved shared migration provenance and require the timezone subset of Lane B, a full fresh Lane C run from the beginning, Lane D integration, and fresh independent IR-003 verification.

## GATE-031, approvals, and governance path

GATE-031 remains historically **Satisfied** for its original reviewed IR-003 package. It is not reopened or invalidated: its baseline/checksum evidence and canonical manifest hash remain historical facts. It cannot be silently reused as approval of an unreviewed shared DBM-002 contract. The correct treatment is a bounded supplemental change-control decision plus separate shared DBM-002 authorisation; no new gate identifier is invented.

| Review | Required | Reason |
| --- | --- | --- |
| Product | REQUIRED | The only viable performant path changes accepted timezone-validity semantics from live membership to an application-maintained set. |
| Data | REQUIRED | Persistent reference-data semantics, integrity, reconciliation, and drift policy are new shared data responsibilities. |
| Security | REQUIRED | The safe candidate changes the public validator from invoker to definer and adds protected maintenance authority. |
| Architecture | REQUIRED | DBM-002 forward ownership, migration reservation supersession, and IR-003 prerequisite boundary change. |

Required order, if the blocker is resolved:

1. Record a bounded supplemental change-control decision that selects the semantic contract and M3 reservation treatment.
2. Obtain the Product, Data, Security, and Architecture approvals above.
3. Issue a separate shared DBM-002 forward-evolution authorisation; it alone may authorise its migration and protected maintenance model.
4. Amend the IR-003 authorisation only to consume that approved prerequisite and its new evidence/re-run obligations.
5. Implement the shared prerequisite, independently verify its semantic, integrity, maintenance, privilege, provenance, and performance evidence.
6. Run Lane B timezone regressions, then a complete fresh Lane C from the beginning; integrate Lane D only afterwards and perform independent IR-003 verification with the added shared scope.

## Frozen post-authorisation regression and verifier obligations

Any authorised correction must test validator null, blank, canonical valid, invalid, case difference, unusual valid, and catalogue-exposed alias cases; reference exact-set equality, duplicate prevention, both drift directions, refresh/reconciliation, and fail-closed behaviour; caller EXECUTE, hidden relation read/write posture, owner/grants, definer/invoker behaviour, fixed search path, and unauthorised refresh denial; authoritative configuration CHECK and atomic invalid-timezone rejection; and IR-003 happy path, replay, changed fingerprint, cross-actor same UUID, rollback, `npm run test:ir003`, and the full Lane C run.

The fresh IR-003 verifier must additionally inspect shared DBM-002 authority, semantic compatibility, reference integrity, maintenance/drift policy, privileges, migration provenance, and performance evidence. The frozen thresholds are unchanged: distinct p95 `<= 40 ms`, p99 `<= 75 ms`; same-key race p95 `<= 40 ms`, max `<= 75 ms`. Option-B measurements remain design evidence only and cannot become a final Lane C manifest.

## Current status

- Lane C remains blocked.
- Shared DBM-002 remediation design investigation is complete but blocked on the semantic-authority decision; supplemental approvals/authority are pending.
- IR-003 is Authorised but not globally Implemented or Verified.
- Lane D remains isolated.
- Travel migration `010` remains absent remotely/unapplied.
- Shared remediation implementation is not authorised; no deploy, push, or remote mutation occurred.
