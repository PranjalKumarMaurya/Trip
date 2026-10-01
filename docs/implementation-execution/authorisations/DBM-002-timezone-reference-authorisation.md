# Shared DBM-002 timezone reference — bounded local implementation authority

Date: 2026-10-01. Status: authorised for repository and isolated local implementation/verification only. Production application, release traffic, and cutover are outside this authority.

The user explicitly approved completing the remaining Data review, authority, implementation, and fresh tests for the IR-003 timezone fix on 2026-10-01. This bounded record applies that instruction to the corrected shared DBM-002 proposal. It draws on the Product semantic decision, supplemental Security and Architecture approvals, and the corrected Data re-review. It does not claim that a proposal, local migration, or local test is a deployed result.

## Frozen input

- IANA Time Zone Database release `2026e`, from `https://data.iana.org/time-zones/releases/tzdata2026e.tar.gz`, archive SHA-256 `b26882805f26aac59d5b222978e6580484b834ccdc98be89df2f05a6dc53a652`.
- Candidate reference policy: all slash-qualified names satisfying the existing lexical guard from `Zone` declarations and `Link` targets in the nine source files named in `supabase/reference-data/iana-timezone-reference/2026e.manifest.json`. This yields 340 canonical names and 213 aliases, 553 distinct names. No operating-system, PostgreSQL-catalogue, or runtime network data supplies the set.
- Artifact: `supabase/reference-data/iana-timezone-reference/2026e.txt`, SHA-256 `bab362935dbe8fceb73682327aa5a8773917e07406d4cbd0b986808a9fff39d6`.
- Canonical JSON manifest SHA-256 (sorted keys, no spaces, UTF-8): `f705b10ddfba0652442f08e05a2d3947bd1d565ec2ce66f7706c5f6e2d25870d`.
- Local comparison of the same source policy over IANA `2026c` and `2026e` found no name-set difference. This does not establish the deployed PostgreSQL catalogue or offset-data version.

## Allowed change

Create `supabase/migrations/011_ir002_timezone_reference.sql` only for the frozen private reference and singleton control relations, narrow maintenance/validator roles and grants, deterministic static 2026e rows, replacement of `public.is_valid_iana_timezone(text)`, and removal of the now-unneeded direct TOP-001 executor catalogue grant. Add isolated verification for the exact-set checksum, collation, validator/CHECK, privileges, blocked-state, and performance behavior. Migration 007 and IR-003 migration 010 remain immutable.

## Exit evidence

Apply the complete migration chain in a disposable local Supabase/PostgreSQL environment. Verify relation and index collation, all 553 names and checksum, case-only rejection, NULL/invalid/alias behavior, hidden relation and maintenance access, authoritative configuration CHECK, blocked/missing-control failure, and no stored-timezone rewrite. Run a read-only platform drift classification against the target catalogue. Record a clean replay/rollback result and independent shared review before using the result for IR-003. Then amend IR-003's prerequisite, rerun Lane B timezone cases and fresh full Lane C, and integrate Lane D only after its frozen thresholds pass.

## Stop condition

Any reference-set mismatch, unapproved source change, cross-role direct access, unsafe validator fallback, failed CHECK, or performance failure leaves TOP-001 unavailable for release. Correct through a reviewed forward change; do not weaken the validator or its Group configuration CHECK.
