# Shared DBM-002 supplemental Data re-review

## Decision

**CORRECTED PHYSICAL DESIGN PASSES TECHNICAL DATA RE-REVIEW — INDEPENDENT SPECIALIST EXIT PENDING**

Date: 2026-10-01. Scope: only blocker `DBM-002-DATA-001` in the earlier [supplemental Data review](ir-003-shared-dbm-002-data-review.md), rechecked against the corrected [shared proposal](../ir-003-shared-dbm-002-change-control-proposal.md) at `c229331`. The earlier review remains historical evidence of the failed version. This record does not certify a first IANA dataset, issue shared implementation authority, or verify migration 011 or Lane C.
This implementation-session review does not claim independence from the local implementation or replace the specialist exit required by the execution package.

## Blocker disposition

The corrected relation specifies `name text COLLATE "C" NOT NULL` with `PRIMARY KEY (name)`. The validator contract compares `reference.name = candidate COLLATE "C"`. Canonical artifact sorting, duplicate identity, and each exact-name drift comparison also use the same bytewise comparator on both sides. These explicit rules remove dependence on a database default collation and preserve case-only distinctions, including `Asia/Kolkata` versus `asia/kolkata`. The proposal now requires checks of column and primary-key index collation metadata and case-only lookups in a non-`"C"` default context.

The correction changes no dataset shape, secondary index, alias policy, control-row meaning, maintenance role, or Product semantics. The earlier Data review's other PASS findings therefore remain applicable to the corrected design. `DBM-002-DATA-001` is resolved **at design level**. The migration and runtime checks remain required evidence, so this is not a claim that the database already enforces the design.

## Conditions before shared implementation can pass

1. Review the first dataset/version/digest as part of the separate shared authority. A candidate `2026e` artifact and manifest now exist under `supabase/reference-data/iana-timezone-reference/`; they contain 553 slash-qualified names (340 Zone names and 213 Link aliases). Their presence is preparation, not this design re-review's approval of every name.
2. Materialize only reviewed static names in migration 011. Verify the `"C"` column and primary-key index comparator, fixed validator comparison, and all drift set operations on an isolated database whose default comparison does not supply the invariant by accident.
3. Prove atomic block/replace/ready maintenance, checksum and control-state failure behavior, unchanged stored Group timezone values, privilege confinement, and configuration CHECK rejection.
4. Independently verify the shared implementation before amending IR-003; then rerun its timezone subset and complete fresh Lane C. The distinct and same-key latency limits remain unchanged.

## Boundary

The corrected shared proposal is Data-compatible. A separate bounded local authority now records the candidate dataset, and migration 011 has been written and applied in one isolated stack. This design re-review does not independently verify that implementation. IR-003 Lane C, deployment, and cutover remain unverified.
