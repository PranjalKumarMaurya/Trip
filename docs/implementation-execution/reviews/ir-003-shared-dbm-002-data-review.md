# IR-003 shared DBM-002 supplemental Data review

## Decision

**SUPPLEMENTAL DATA APPROVAL BLOCKED**

Reviewer role: independent supplemental Data reviewer for the frozen shared
IR-002 / DBM-002 timezone-remediation proposal required by IR-003.

This record reviews the proposal at commit
`9bfd6cdfe92923b7be2f33e0a8e17f111094a295`. It is a Data review record only.
It does not amend Product semantics, the shared proposal, migrations, SQL,
source, generated types, shared status, authorisations, or Lane D. It does not
authorise implementation, deployment, remote mutation, or push.

The proposal is blocked by one Data-owned physical-contract omission described
in [Blocker](#blocker). The other findings record what is Data-compatible once
that frozen-contract omission is resolved through change control.

## Repository preflight

- Branch: `review/dbm002-supp-data`.
- Starting HEAD: `9bfd6cdfe92923b7be2f33e0a8e17f111094a295`.
- Worktree: clean before this dedicated review record.
- `AGENTS.md`: absent at repository root.

## Governing sources inspected

- `docs/implementation-execution/ir-003-shared-dbm-002-change-control-proposal.md`
- `docs/implementation-execution/ir-003-product-timezone-semantic-evolution.md`
- `docs/implementation-execution/ir-003-shared-dbm-002-remediation-freeze.md`
- `docs/implementation-execution/database-migration-register.md`
- `docs/implementation-execution/authorisations/IR-002-authorisation.md`
- `docs/implementation-execution/authorisations/IR-003-authorisation.md`
- `docs/implementation-execution/gate-031-data-review.md`
- `docs/implementation-execution/change-control.md`
- `docs/implementation-execution/waves/W3-group-lifecycle-storage-and-realtime.md`
- `docs/implementation-execution/packets/IR-003-atomic-group-bootstrap.md`
- `supabase/migrations/007_ir002_configuration_archive_audit.sql`
- `supabase/migrations/010_ir003_atomic_group_bootstrap.sql`

## Dataset semantics — PASS

One row in `ir002_private.iana_timezone_reference` has one unambiguous Data
meaning: the exact name is in the current Product-approved application IANA
reference set. The frozen semantics require exact case-sensitive membership;
canonical names and approved aliases are rows in the same set, so aliases are
explicit rather than rewritten or inferred.

The committed text artifact/manifest model makes row production deterministic:
one UTF-8 name per line, no blanks or comments, deduplicated, bytewise ordered,
one terminal LF, and a checksum over its exact bytes. It prohibits both
migration-time `pg_catalog.pg_timezone_names` capture and runtime fetching.
Platform tzdata is comparison input for drift only, never Product authority.

This finding does not approve a first artifact: the proposal correctly leaves
the initial version, source provenance, alias list, row count, and digest for
the later shared DBM-002 authority and Data review.

## Relation and control design — FAIL

The minimal reference relation otherwise has the appropriate Data shape:
`NOT NULL`, primary-key duplicate prevention, the lexical CHECK, and no
secondary index or speculative per-row provenance/alias column. The primary
key is sufficient for the intended single-name membership index and does not
need a second lookup index. The control relation's singleton key, nonblank
version, lowercase SHA-256 shape, and `ready`/`blocked` state are likewise
minimal for the stated control purpose.

It nevertheless fails the frozen exact case-sensitive identity requirement:
the proposal specifies `name text PRIMARY KEY` and `name = candidate`, but it
does not fix a case-sensitive collation/comparison for that column, its
primary-key index, membership lookup, or drift set differences. No repository
database configuration establishes such a global default. The existing 010
candidate uses explicit `COLLATE "C"` where deterministic text ordering is
required, so that migration is not evidence that an omitted reference-column
collation is fixed elsewhere.

A default or nondeterministic case-insensitive database collation could cause
case-only names to compare equal, collapsing primary-key identity and allowing
a case-only candidate to match a different approved row. That is incompatible
with the Product decision and the proposal's own exact case-sensitive
semantics. The required reference-column/comparison contract is therefore
missing; it cannot be supplied silently by implementation.

Apart from that blocker, the proposed controlled migration transaction is the
right integrity boundary: block, replace rows from the committed artifact,
install the reviewed version/digest, mark ready, and commit together. The
post-migration checksum/control/diff verification is required before readiness
is relied upon. It prevents a partial authorised replacement from publishing
`ready`; a detected mismatch is blocked and the validator fails closed. The
later implementation must prove this transaction and integrity verification;
this review does not accept an unverified implementation.

## Provenance and reproducibility — PASS

The required chain is complete in the proposal:

```text
reviewed upstream source -> committed canonical artifact + manifest
-> exact artifact checksum -> reviewed static migration materialisation
-> private reference/control relations -> independent checksum verification
```

The manifest version, row count, upstream release/provenance, artifact digest,
and retained canonical-manifest digest identify the dataset. The migration uses
reviewed static values only. Thus the same approved Git candidate materialises
the same reference rows across environments; local catalogue, operating-system
tzdata, and network state do not generate Product-valid rows.

## Drift model — PASS

`MATCH`, `PLATFORM_ADDITIONS`, `PLATFORM_REMOVALS`,
`BIDIRECTIONAL_DRIFT`, and `REFERENCE_CORRUPTION` are mutually sufficient for
the stated reference/platform comparison after artifact/control/count/checksum
verification. A manifest/control version or digest mismatch is separately
reported and correctly handled as blocked `REFERENCE_CORRUPTION`.

Platform additions remain reconciliation information only and do not add
Product-valid values. A Product-approved alias absent from a later platform
catalogue is correctly a `PLATFORM_REMOVALS` member, not corruption or a reason
to delete the alias. Removal, rename, bidirectional drift, corruption, and
checksum mismatch block validation-dependent writes; existing values remain
stored and readable without rewrite.

## Reconciliation and data lifecycle — PASS

Dataset changes are reviewed forward migration/deployment work, not browser
mutation, a runtime refresh, a scheduler, or a historical-migration edit. The
proposal requires a new artifact/manifest, Data and Product review of names,
aliases, provenance, version, digest, and stored-value consequences, then a
new governed forward-evolution authority for later data-changing migrations.

The stated replacement transaction is atomic and uses forward repair after a
failure on a populated target. It preserves evidence for the artifact,
manifest, migration, control state, checksum, diffs, operator, target, and
time. That is adequate lifecycle and rollback discipline for the proposed
controlled data set, subject to resolving the relation-identity blocker.

## Existing configuration impact — PASS

Migration 007's `public.group_configurations.timezone` remains `NOT NULL` with
its existing CHECK, and the proposal keeps that CHECK authoritative for new
inserts and updates. The proposal does not backfill, delete, rename, or rewrite
stored timezone values.

Repository records state that Travel is at the `001`–`009` baseline and
TOP-001 has not run; the change-control record also states that IR-003
Group/configuration/member state remains absent. On that recorded current
state, no existing IR-003-created `group_configurations.timezone` value needs
value-by-value remediation preflight.

This is not a permanent deployment assumption. Before any eventual shared
remediation deployment, its required preflight/drift evidence must establish
that target fact again; if any configuration rows exist then, their values and
applicable dataset-version consequences must be reviewed before the governed
release proceeds.

## Migration 011 Data safety — FAIL

The reserved placement after immutable 010 is Data-compatible, leaves existing
configuration values untouched, and has the correct controlled transaction for
private schema/relation/control materialisation and validator replacement.
Migration 007 remains immutable and TOP-001 runtime correctly waits for both
migrations plus verification.

It cannot yet be considered Data-safe for authority because the frozen 011
physical contract does not guarantee the required case-sensitive reference-key
identity across database collations. This is a proposal defect, not permission
to create or modify `011`.

## Performance/data interaction — PASS

The reference primary key is compatible with the measured Option-B exact-name
membership lookup. A fixed case-sensitive collation on that indexed key is also
compatible with a B-tree equality lookup; this is a Data compatibility finding
only, not Lane C performance approval. Lane C remains blocked and must
independently reproduce its frozen thresholds later.

## Regression obligations — FAIL

The frozen verification scope already covers null, blank, canonical valid,
invalid, case-only variant, unusual valid name, approved aliases, duplicate
prevention, checksum/reference verification, deterministic artifact
reproduction, drift classifications, blocked/corrupt state, CHECK behavior, no
silent stored-value rewrite, and transactional reconciliation.

One bounded Data addition is required because repository evidence demonstrates
a concrete missing invariant: the future shared verification must assert the
reference column and membership/primary-key comparison use the fixed
case-sensitive comparator required by the corrected proposal, and must prove a
case-only candidate cannot match an approved differently cased row. A simple
case-only input test under an unspecified database default does not establish
that cross-environment identity invariant.

## Blocker

**DBM-002-DATA-001 — missing fixed case-sensitive reference-key collation/comparison.**

The proposal's exact physical relation is `name text PRIMARY KEY`, while its
semantic contract requires exact case-sensitive equality. The repository does
not establish a fixed database default for that text comparison, and the
proposal does not declare one for the reference key, lookup, or drift set
operations. Therefore it cannot prove exact name identity, case-only rejection,
or duplicate prevention across environments.

Resolve this only by a bounded change-control correction to the frozen shared
proposal that specifies and verifies the fixed case-sensitive comparator for
reference identity. Re-review Data after that correction. No dataset field,
extra index, new Product semantic, or implementation is proposed by this
record.

## Status discipline

- GATE-031 remains historically Satisfied for its original package.
- IR-003 remains Authorised, not globally Implemented, and not Verified.
- Lane C remains blocked; Lane D remains complete and isolated.
- Shared remediation remains not implementation-authorised.
- Migration `011_ir002_timezone_reference.sql` remains proposed/reserved only.
- No shared implementation, migration edit, remote mutation, deployment, or
  push occurred.
