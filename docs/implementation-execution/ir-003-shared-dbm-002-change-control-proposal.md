# Shared DBM-002 supplemental change-control proposal

## Decision

**SHARED DBM-002 CHANGE CONTROL APPROVED FOR REVIEW**

This is a documentation-only technical proposal. It freezes one reviewable design for Product-approved controlled timezone-reference semantics. It does not approve Data, Security, or Architecture; authorise shared implementation; amend IR-003; unblock Lane C; alter migrations, source, generated types, tests, database, Travel, deployment, or Lane D.

Governing inputs are [the Product decision](ir-003-product-timezone-semantic-evolution.md), [the remediation freeze](ir-003-shared-dbm-002-remediation-freeze.md), the migration register, and the IR-002/IR-003 authorities cited below. Historical evidence is retained; the Product decision is not technical approval.

## Classification, ownership, and boundary

Classification: **SHARED DBM-002 FORWARD EVOLUTION REQUIRED BY W3**.

- Original owner: IR-002 / DBM-002. Migration 007 created the public validator and group_configurations.timezone CHECK.
- Consuming packet: IR-003 / DBM-014 / TOP-001. It calls the validator and inserts configuration, but owns neither validation semantics nor reference data.
- DBM-014 is limited to TOP-001, its idempotency record, the display-currency child, and its executor/grants. It cannot acquire a shared reference set or maintenance boundary.
- Migration 007 is accepted, verified historical evidence and immutable. Replacing its current live-catalogue function is a forward evolution, not an edit, rollback, or general IR-002 reopening.
- The shared validator is on TOP-001's two-call hot path and cannot meet the frozen contract; the indexed reference prototype is design evidence only.

Governing sources: database-migration-register.md; authorisations/IR-002-authorisation.md; packets/IR-003-atomic-group-bootstrap.md; authorisations/IR-003-authorisation.md; ir-003-shared-dbm-002-remediation-freeze.md; and ir-003-product-timezone-semantic-evolution.md.

## Frozen semantics

The Product decision is immutable input. Ready-state validation is against the application-approved reference set only: exact, case-sensitive equality plus the unchanged slash-qualified lexical guard. A row may be an approved canonical IANA name or approved alias. PostgreSQL, OS, or platform tzdata changes do not change the set. Stored values are not rewritten.

The public logical signature remains public.is_valid_iana_timezone(text) RETURNS boolean. NULL produces SQL NULL; blank and lexical failures produce false.

## Physical model and integrity

Exact reference relation:

    schema:    ir002_private
    relation:  ir002_private.iana_timezone_reference
    columns:   name text NOT NULL
    key:       PRIMARY KEY (name)
    check:     name ~ '^[A-Za-z][A-Za-z0-9_+\-]*(?:/[A-Za-z0-9_+\-]+)+$'
    indexes:   no index beyond the primary-key index
    RLS:       disabled; controlled reference data, not tenant rows

The primary key supplies uniqueness and the sole membership-lookup index. The CHECK makes every row obey the existing lexical rule. There are no timestamp, source, alias, or mutable provenance columns on a reference row.

One supporting private control relation is required only for the accepted integrity/maintenance contract; it is not application data or an alternative reference set:

    relation:  ir002_private.iana_timezone_reference_control
    columns:   singleton boolean PRIMARY KEY CHECK (singleton)
               dataset_version text NOT NULL CHECK (btrim(dataset_version) <> '')
               dataset_sha256 text NOT NULL CHECK (dataset_sha256 ~ '^[0-9a-f]{64}$')
               state text NOT NULL CHECK (state IN ('ready', 'blocked'))
    rows:      exactly one ready control row is required for normal validation
    indexes:   primary key only

The control relation binds deployed data to the reviewed digest and permits known integrity failures to fail closed without a full-set scan per validation. It is not a history ledger; immutable evidence retains history.

Schema and both relations are owned by ir002_timezone_maintenance_owner. The role is NOLOGIN, NOINHERIT, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, and NOBYPASSRLS. It has no memberships other than the explicit reviewed migration/deployment-operator membership necessary to SET ROLE, and owns nothing outside this boundary.

PUBLIC, anon, authenticated, and service_role receive no CREATE or USAGE on ir002_private; no direct SELECT; and no INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, or ownership on either relation. The maintenance owner alone has DDL/DML by ownership. There is no browser write path, RLS policy, or generic maintenance RPC.

## Deterministic approved dataset

The source model is **B: versioned canonical data committed and reviewed with the repository**. Before migration implementation starts, the future shared-authorisation package must contain:

    supabase/reference-data/iana-timezone-reference/<dataset-version>.txt
    supabase/reference-data/iana-timezone-reference/<dataset-version>.manifest.json

The text artifact is UTF-8, one valid name per line, bytewise sorted by PostgreSQL C-collation order, deduplicated, with no comments/blank lines and exactly one terminal LF. Its SHA-256 over exact bytes is the dataset checksum. The manifest names the exact upstream IANA tzdata release and retrieval/source provenance, repeats artifact SHA-256 and row count, and lists approved canonical-name/alias policy. Its canonical JSON SHA-256 is retained in evidence. The manifest dataset_version, not an environment image, identifies the approved set.

This proposal intentionally does not invent an initial IANA release, list, or digest before Data reviews it. Data must approve the exact first version and SHA-256 in the later shared DBM-002 authority. Once approved, this committed artifact is the immutable deployment input: the migration uses only its reviewed static values and control version/digest. It never reads pg_catalog.pg_timezone_names to populate or refresh the relation. The same Git commit therefore deploys the same product-valid set in every environment.

Migration-time local-catalogue capture is rejected: the same Git commit could produce different product data. An IANA-generated artifact is acceptable only after it becomes this reviewed committed artifact; runtime fetching/generation is rejected.

## Validator and CHECK proposal

The later authorised shared migration replaces public.is_valid_iana_timezone(candidate text) with this exact design:

- LANGUAGE plpgsql, STABLE, SECURITY DEFINER, owned by ir002_timezone_validator.
- The validator owner is NOLOGIN, NOINHERIT, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, and NOBYPASSRLS. It has no memberships or generic privileged capability, owns no schema/table, and has only USAGE on ir002_private and SELECT on the two qualified private relations.
- It has SET search_path = pg_catalog; every non-catalogue object is schema-qualified. There is no caller-controlled resolution and no validator write path.
- It returns NULL before other work for NULL. It next applies the existing regex exactly; blank, whitespace-only, non-slash, and lexical failures return false. It then requires the one ready control row and does exact name = candidate primary-key membership. No trimming, folding, canonicalisation, platform fallback, or alias rewrite is permitted.
- If control is absent/blocked, either relation unavailable, or an error prevents guarded lookup, it catches the internal failure and raises only SQLSTATE P0001 with message timezone_reference_unavailable. The signature remains boolean, but an unavailable integrity dependency fails closed rather than reclassifying names or accepting unsafe data.

group_configurations.timezone retains CHECK (public.is_valid_iana_timezone(timezone)) unchanged. No CHECK is removed, weakened, or moved client-side. In ready state invalid input fails at the database layer. A null/duplicate/lexically invalid reference row is impossible; a missing row returns false, and known checksum/state corruption causes unavailable error. The CHECK aborts the full INSERT/UPDATE atomically; it never accepts on error.

The current function is PUBLIC-executable and appears in generated public types. Compatibility requires retaining EXECUTE for PUBLIC. anon, authenticated, and service_role therefore receive effective execute only through PUBLIC, with no role-specific broadening or special service-role path. Maintenance and validator owners need no caller-facing grant. ir003_top001_executor retains the existing explicit function execute it needs; the forward migration must revoke its now-unnecessary direct SELECT on pg_catalog.pg_timezone_names. No caller gets direct relation access because it calls the validator.

## Drift classification and policy

The read-only drift check compares: the canonical committed artifact/manifest; actual private rows/control digest; and slash-qualified exact names in pg_catalog.pg_timezone_names. It first verifies constraints, one control row, control version/digest against manifest, canonical row count, and reference-set checksum. It then classifies platform difference with exact case-sensitive set difference.

| Classification | Exact result | Treatment |
| --- | --- | --- |
| MATCH | Reference, manifest, and platform have the same exact set. | Record pass; state ready. |
| PLATFORM_ADDITIONS | Platform minus reference non-empty; reference minus platform empty. | Warning and reconciliation record. New names remain invalid; no blanket write block. |
| PLATFORM_REMOVALS | Reference minus platform non-empty; platform minus reference empty. | Critical reconciliation; set control blocked before further validation-dependent writes. No automatic delete, rename, or stored-value rewrite. |
| BIDIRECTIONAL_DRIFT | Both directional differences non-empty. | Critical reconciliation; set control blocked. |
| REFERENCE_CORRUPTION | Missing/invalid control, constraint/read failure, count/set-checksum failure, or rows not equal to artifact. | Set control blocked; validator raises timezone_reference_unavailable. |

A control version/digest differing from the approved manifest is **checksum mismatch**. It is reported separately but handled as REFERENCE_CORRUPTION and blocked.

An approved alias absent from a later platform catalogue is a PLATFORM_REMOVALS member, not corruption and not automatic alias deletion. It is identified and blocked pending governed reconciliation. The block concerns validator calls and validation-dependent writes, not all database writes. Existing stored values remain stored/readable. Additions do not block writes because Product has not approved their validity. Removal, bidirectional drift, corruption, or checksum mismatch cannot be silently served.

## Maintenance and reconciliation

There is no scheduler and no callable maintenance function. Reconciliation is explicit migration/deployment-controlled work.

1. Run the read-only drift check before initial shared deployment, before every release exposing timezone-dependent writes, and after declared PostgreSQL/OS/platform tzdata upgrade/replacement. Record artifact/manifest version and digests, control values, counts, directional diffs, classification, operator, target identity, and time without secrets.
2. MATCH continues. Addition records warning and may prompt a governed dataset proposal. Removal, bidirectional drift, corruption, or mismatch blocks control before validation-dependent release activity and opens reconciliation.
3. A changed product set requires a new artifact/manifest proposal. Data and Product review exact names, aliases, provenance, version, digest, and stored-value consequences. Security/Architecture re-review only if the frozen boundary/placement changes. Separate shared DBM-002 authority authorises the first migration; later data-changing migrations need their own governed forward-evolution authority.
4. The reviewed deployment operator SET ROLE ir002_timezone_maintenance_owner and executes an approved migration transaction: mark blocked; replace rows from committed artifact; install reviewed version/digest; mark ready; commit. Error rolls back all work, retaining preceding ready state or already-blocked safe state, never partial data.
5. Independently verify post-migration checksum, control row, diffs, grants/owners, validator/CHECK behavior, and no stored-value rewrite. Preserve report and migration/artifact/manifest checksums. A failed update remains blocked and uses forward repair; only empty isolated targets may use authorised rollback/reapply evidence.

The maintenance role has no LOGIN, application use, public function, or generic proxy. Only the separately approved deployment operator invokes it through a reviewed forward migration; browser, Edge Function, and service-role maintenance invocation do not exist.

## Review packages

### Data

Data approves/rejects: reference-row meaning; two-relation integrity; exact first artifact/manifest version, source, aliases, digest, and row count; atomic replacement; classifications; mismatch handling; and no stored-value rewrite. It must decide whether the initial artifact is complete and whether future removal/rename needs a separately scoped stored-data migration. That migration is outside this proposal.

### Security

Security approves/rejects: ir002_timezone_maintenance_owner; ir002_timezone_validator; their listed attributes/no memberships/no generic capability; disabled RLS plus private privileges; SECURITY DEFINER and pg_catalog search path; qualified objects; PUBLIC execute compatibility; direct-access denial; no maintenance function; SET ROLE-only maintenance; blocked-state error; and atomic CHECK enforcement. It must confirm no privileged browser service-role shortcut.

### Architecture

Architecture approves/rejects: DBM-002 shared ownership; IR-003 consumer-only boundary; private schema/control addition; repository deterministic dataset boundary; migration/deployment maintenance; public validator compatibility; M2 placement; and W3 ordering. It must confirm no logical TOP, no IR-005/006/009/010 leakage, and no general IR-002 reopening.

Each reviewer writes a dedicated record and does not edit this proposal.

## Migration placement and evidence

The proposal selects **M2**: reserve, but do not authorise or create, supabase/migrations/011_ir002_timezone_reference.sql after immutable 010.

| Option | Result | Reason |
| --- | --- | --- |
| M1: absorb into 010 | Rejected | 010 is existing IR-003/DBM-014 candidate, checksum 5c3ca06dfe29cf5388686559d124adc4ea507e9445a52c93d79d181221f4ec4f, and excludes shared data/maintenance. |
| M2: dedicated 011 after 010 | Proposed | Preserves 001-010 immutability and DBM-002 ownership without renumbering. TOP-001 runtime/release waits for both migrations and shared verification. |
| M3: renumber 010 | Rejected | Runtime ordering can require both migrations without rewriting the candidate; renumbering needlessly supersedes its checksum and Lane A/B evidence. |
| M4: other | Rejected | No repository-supported alternative improves ownership, immutability, or runtime gating. |

The register reservation is **PROPOSED / RESERVED / NOT AUTHORISED**. It permits no SQL, remote application, or deployment. Travel's recorded baseline is 001-009 and TOP-001 has not run; a controlled no-traffic release can apply 010 then authorised 011, but neither migration number grants runtime use between steps.

GATE-031 remains historically **Satisfied** for its original package. It is not reopened or reused as shared approval; no new gate is created.

Retained evidence: GATE-031 package/hash; IR-003 authorisation; 010 checksum; Lane A implementation; Lane B PASS; Lane C diagnosis/design; Product decision. Evidence to supplement after implementation: 010's old live-catalogue assumptions; Lane-B timezone subset; whole Lane-C run/manifest; generated types after integrated schema; and expanded independent IR-003 verification. No historical hash changes.

After shared authority and independent shared verification, an IR-003 authorisation amendment must bind DBM-014 to 011 identity/checksum and artifact provenance; identify superseded candidate assumptions; require Lane-B timezone/shared regression and fresh full Lane C; and extend detached verifier scope. This proposal issues no amendment.

## Post-approval execution and verification

    Data + Security + Architecture supplemental approvals (parallel)
    -> separate shared DBM-002 authorisation
    -> shared DBM-002 implementation (011) and independent shared verification
    -> IR-003 authorisation amendment
    -> Lane-B timezone/shared regression subset
    -> full Lane-C rerun from zero
    -> Lane D integration
    -> DBM-013 generated types twice, byte-identical
    -> IR-003 integration verification
    -> fresh independent IR-003 verification

Implementation does not parallelise across authority boundaries. The three reviews may run in parallel. Independent shared verification precedes IR-003 amendment/dependent test work; Lane C precedes Lane D integration; generated types follow authorised integrated schema. No other W3 packet starts from this work.

The performance contract is unchanged:

    Distinct: p95 <= 40 ms; p99 <= 75 ms
    Same-key: p95 <= 40 ms; max <= 75 ms

Option-B p95 12.095 ms / p99 13.405 ms remains design evidence only. Full Lane C must independently reproduce the frozen contract.

Expanded independent-verifier scope: supplemental authority; migration provenance; dataset provenance/version/checksums; Product compatibility; artifact/reference/platform classifications; reconciliation/rollback; validator inputs/errors; relation/control integrity; owner/grants/definer/search path; direct-access denial; CHECK behavior; maintenance authority; Lane-B regression; full Lane-C evidence; and no later-IR leakage.

## Status

- GATE-031 is historically Satisfied.
- IR-003 is Authorised, not globally Implemented, and not Verified.
- Lane C remains blocked pending separately authorised shared remediation.
- Lane D remains complete and isolated.
- Shared remediation is not implementation-authorised.
- Travel was not read or mutated; no deployment or push occurred.

**PARALLEL D/S/A SUPPLEMENTAL REVIEWS READY**
