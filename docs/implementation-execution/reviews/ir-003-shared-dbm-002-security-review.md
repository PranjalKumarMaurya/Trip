# IR-003 shared DBM-002 supplemental Security review

## Decision

**SUPPLEMENTAL SECURITY APPROVAL GRANTED**

- Reviewer: independent supplemental Security reviewer.
- Scope: the frozen shared DBM-002 proposal only, including its proposed
  `011_ir002_timezone_reference.sql` boundary. This is not implementation
  authority, a migration approval, an IR-003 amendment, or approval to use
  TOP-001.
- Basis: the bounded design in
  `ir-003-shared-dbm-002-change-control-proposal.md` is security-acceptable
  subject to the implementation-verification obligations below. The proposal
  provides no browser, application, or `service_role` write/ownership path to
  the private reference subsystem and bounds its only elevated read path to a
  boolean validator.

## Governing sources reviewed

- `ir-003-shared-dbm-002-change-control-proposal.md` (frozen proposal),
  `ir-003-product-timezone-semantic-evolution.md`, and
  `ir-003-shared-dbm-002-remediation-freeze.md`.
- `docs/architecture/security-model.md`, especially the current-state,
  trusted-boundary, service-role, and verification requirements.
- `authorisations/IR-002-authorisation.md`,
  `authorisations/IR-003-authorisation.md`, `gate-031-security-review.md`,
  `change-control.md`, `database-migration-register.md`, and the W3 record.
- Immutable/current SQL evidence:
  `007_ir002_configuration_archive_audit.sql` and
  `010_ir003_atomic_group_bootstrap.sql`.

The Product decision selects controlled application-reference semantics. It
does not itself authorise the private relation, role, `SECURITY DEFINER`
function, maintenance process, or migration. This review assesses those
frozen proposal details only.

## Private schema and reference/control relations — PASS

`ir002_private` is bounded to the reference relation and its single control
relation, with both schema objects owned by the dedicated
`ir002_timezone_maintenance_owner`. The implementation must explicitly revoke
both `CREATE` and `USAGE` on that schema from `PUBLIC`, `anon`,
`authenticated`, and `service_role`; it must not depend on defaults. Those
roles must have no direct `SELECT`, DML, `TRUNCATE`, `REFERENCES`, or ownership
on either private relation. They do not need direct `SELECT`: the validator
encapsulates exact membership.

The validator owner may have only schema `USAGE` and `SELECT` on the two
specified private relations. That access is sufficient for the function and
does not make the schema generally usable. The maintenance owner alone may
own/maintain this private subsystem. RLS being disabled is acceptable because
access is denied by schema/table privilege and there is no client relation
path; tenant RLS would not provide useful protection for this non-tenant,
non-browser data.

The control row may contain only the stated version, SHA-256, and ready/blocked
state. Its singleton primary-key/check construction bounds it to at most one
true singleton row; the validator must treat zero rows, a blocked row, a
non-ready/inconsistent row, relation failure, and guarded lookup failure as
unavailable. No ordinary caller can set readiness or substitute version/hash.

## Validator `SECURITY DEFINER` model — PASS

The public signature remains exactly
`public.is_valid_iana_timezone(text) RETURNS boolean`. The proposed definer
function is narrowly acceptable because it performs no mutation, dynamic SQL,
caller-controlled identifier resolution, generic query/proxy operation, or
data-returning lookup. It returns only the established boolean outcomes or the
fixed unavailable error. It must preserve SQL `NULL` for a null input and the
unchanged exact, case-sensitive lexical/membership behavior when ready.

`LANGUAGE plpgsql` is justified by the required ordered checks and conversion
of guarded private-relation failures to the fixed `P0001` error. A SQL definer
function would be smaller only if it can preserve those exact fail-closed error
semantics without introducing an error leak or semantic change; it is not a
required redesign. The later implementation must retain the stated PL/pgSQL
constraints and may not add dynamic SQL.

The fixed function setting `search_path = pg_catalog` is sufficient: regex and
lexical operators, `btrim`, PL/pgSQL exception handling, and built-ins resolve
from `pg_catalog`; both private relations must be referenced as
`ir002_private.<relation>`. No attacker-writable schema is searched. The
implementation must not introduce unqualified project helpers, casts, or
relation names into this function.

The unavailable path must expose exactly SQLSTATE `P0001` and message
`timezone_reference_unavailable`, with no diagnostics containing a relation
name, digest, version, owner/role, source path, SQL fragment, or caught
exception detail.

## Roles, membership, and escalation — PASS

`ir002_timezone_validator` should own this one public function and nothing
broader. It must be `NOLOGIN`, `NOINHERIT`, `NOSUPERUSER`, `NOCREATEDB`,
`NOCREATEROLE`, `NOREPLICATION`, and `NOBYPASSRLS`; have no memberships; own no
database, schema, or relation; have no `CREATE`/generic DDL or relation-mutation
privilege; and receive only the two private `SELECT`s plus private-schema
`USAGE`. Function ownership necessarily permits the bounded lifecycle actions
on that function; it must not be expanded into schema ownership or a general
DDL role.

`ir002_timezone_maintenance_owner` is also correctly bounded as `NOLOGIN`,
`NOINHERIT`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOREPLICATION`, and
`NOBYPASSRLS`, owning only this private schema, its relations, and their
required constraints/indexes. It needs no password-bearing login. The existing
`010` migration demonstrates repository use of dedicated `NOLOGIN` function
owners, so controlled migration/deployment `SET ROLE` is compatible with the
repository model. The only permitted membership direction is a separately
reviewed controlled deployment operator being made a member of the maintenance
role for that purpose; neither private role may be a member of an executor,
migration-owner, `ir003_top001_executor`, browser, or general application
role.

Neither role may acquire `ADMIN OPTION`, `SET ROLE` reachability, schema
ownership outside this boundary, privilege-grant capability outside objects it
owns, or cross-boundary role membership. `service_role` is not a maintenance
or validator owner and cannot be granted such membership. It may execute the
public function only through compatible `PUBLIC EXECUTE`; that does not confer
private schema or relation access.

## Execute, CHECK, and TOP-001 posture — PASS

The current `007` function is public-callable and represented in public types.
Retaining `PUBLIC EXECUTE` is security-acceptable: the function has no write
capability and emits only a boolean or the fixed unavailable error. It retains
compatibility for `anon`, `authenticated`, and `service_role` through `PUBLIC`,
without adding role-specific private privileges. Narrowing this later would be
an incompatible behavior change, so is optional only if separately approved;
it is not required by this review.

`group_configurations.timezone` retains its database `CHECK`. Ordinary writes
cannot bypass it through the approved application path, and a blocked/corrupt
known reference condition causes the definer function to raise rather than
accept; the write therefore aborts atomically. Reference/control manipulation
is unavailable to callers, so the check is not a capability escalation.

TOP-001 remains a consumer. Its executor remains distinct from both private
owners and must call the public validator only. The forward migration must
revoke `ir003_top001_executor`'s now-unnecessary direct `SELECT` on
`pg_catalog.pg_timezone_names`; it must receive no private schema/relation
grant. This preserves the DBM-014/TOP-001 boundary and avoids an additional
reference-data access path.

## Drift, reconciliation, and update atomicity — PASS

The drift comparison must be a controlled read-only deployment/admin command
or internal verification SQL, not a public RPC. It may report only the
secret-safe, bounded evidence stated by the proposal and must not become a
generic catalogue-introspection proxy or perform automatic mutation from a
browser-invocable context.

Reviewed migration/deployment work under the maintenance role is the preferred
boundary: there is no browser reconciliation, public refresh function, Edge
Function/service-role shortcut, or runtime maintenance RPC. It must run a
single transaction in the frozen order: mark blocked, replace from the reviewed
committed artifact, install the reviewed version/digest, mark ready, commit.
An error rolls back to the former ready state or retains an already-blocked
safe state; it cannot commit partial rows as ready. Pre-release and
post-update evidence must prove the one control row, artifact/reference
checksum, and readiness before validation-dependent writes are exposed.

This fail-closed model is security-adequate against ordinary callers and an
interrupted controlled update. A holder of the maintenance role is the named
maintenance authority, not an ordinary caller; its use remains constrained by
the reviewed artifact, migration transaction, and post-operation evidence.

## Migration 011 and status boundary — PASS

The proposed dedicated `011_ir002_timezone_reference.sql` can create only the
private schema, two dedicated roles, two private relations, function
replacement, and narrow grants/revokes. It must not edit immutable `007`,
broaden public tables, add a general privileged runtime API, or alter the
unrelated TOP-001 function boundary. The existing `010` demonstrates that the
repository migration environment supports a dedicated no-login function owner;
that is evidence of compatibility, not current authority to implement 011.

This approval does not authorise migration 011 or its execution. IR-003
remains Authorised, not Implemented and not Verified; Lane C remains blocked;
Lane D remains isolated; and shared remediation remains unauthorised pending
Data/Architecture reviews and separate shared DBM-002 authorisation.

## Required implementation-verification obligations

The later shared implementation/independent verifier must retain evidence for:

- `PUBLIC`, `anon`, `authenticated`, and `service_role` public-validator
  behavior; no direct private schema/relation access, mutation, ownership,
  `REFERENCES`, or readiness/version/checksum manipulation for those roles.
- Validator and maintenance role attributes, ownership, memberships,
  `NOINHERIT`/no unexpected `SET ROLE`, absence of `ADMIN OPTION`, and absence
  of escalation to a migration owner or `ir003_top001_executor`.
- Validator owner limited to function ownership, private-schema `USAGE`, and
  exact private-relation `SELECT`; no reference mutation, schema ownership,
  `CREATE`, or unrelated DDL. Maintenance owner remains `NOLOGIN` and
  private-boundary-only.
- Exact definer signature/owner, `prosecdef`, `STABLE`, fixed
  `search_path=pg_catalog`, schema-qualified private references, no dynamic
  SQL, and a shadow-object attack proving no attacker-created object is used.
- Ready valid/invalid/null/lexical behavior; absent/blocked/invalid control or
  guarded relation failure produces only `P0001 timezone_reference_unavailable`;
  no internal error detail leaks.
- `group_configurations.timezone` CHECK enforcement and atomic failure in a
  blocked/corrupt known state; a caller cannot turn the reference ready or
  bypass the check.
- Drift command read-only posture, no externally callable elevated effect,
  and bounded output; unauthorised reconciliation/maintenance denial.
- Transactional update interruption/failure leaves no partial replacement
  marked ready and no arbitrary version/digest accepted; independent artifact,
  control, and relation checksum evidence before readiness returns.
- TOP-001 success through the public validator only, with no direct
  `pg_timezone_names` or private-reference grant to its executor; preserve its
  distinct-owner separation.

## Review result and scope declaration

No Security-owned blocker remains in the frozen proposal. Implementation
verification may reject a migration that does not realize every obligation
above. No implementation, migration, remote mutation, deployment, or push was
performed by this review.

Cross-Wave deviation: none. This is a W3 shared-DBM-002 review record only;
it does not change W1/W2 implementation ownership, historical GATE-031 facts,
or Lane D.
