# IR-008 Authorisation — Trusted Operation Contracts

## Decision and required entry

- Decision: **Authorised — implementation not started**.
- Authorisation date: 2026-08-04.
- Required entry: branch `v2`, clean worktree, and verified IR-007/DBM-006 at
  `1f7b7825016b2b71cd00cb9fd9b1783da0887ff3`
  (`docs(ir-007): verify base ownership RLS`).
- Entry result: passed. IR-007 and DBM-006 are Verified; IR-008 was not
  authorised; GATE-013 was not satisfied; W2 was in progress.

This authorisation freezes common trusted-operation rules and the ownership
register only. It does not implement a physical operation, satisfy GATE-013,
authorise a physical owner packet, or authorise deployment or cutover.

## Ownership freeze

IR-008 owns no DBM unit, SQL migration, SQL function, RPC, Edge Function,
browser operation, generated database type refresh, Storage action, Realtime
action, database action, deployment action, or cutover action. No `010_*` migration is reserved. IR-008 freezes only the common trusted-operation
contract and the ownership register.

Each logical operation below has exactly one physical owner. A logical
signature is a future request contract, not a function declaration or an
implemented endpoint. It is frozen exactly here so an owner cannot broaden it
with client actor authority. No operation may accept an actor parameter.

| ID | Exact logical signature | Physical owner |
|---|---|---|
| TOP-001 | `bootstrap_group(group_request, configuration_request, request_id)` | IR-003 |
| TOP-002 | `create_invitation(group_id, recipient_request, invitation_request, request_id)` | IR-005 |
| TOP-003 | `accept_invitation(invitation_proof, continuation_context, request_id)` | IR-005 |
| TOP-004 | `change_member_role(group_id, target_membership_id, requested_role, request_id)` | IR-005 |
| TOP-005 | `transfer_ownership(group_id, successor_membership_id, prior_owner_outcome, request_id)` | IR-005 |
| TOP-006 | `deactivate_membership(group_id, target_membership_id, action, confirmation, request_id)` | IR-005 |
| TOP-007 | `set_group_archive_state(group_id, desired_archive_state, request_id)` | IR-005 |
| TOP-008 | `claim_legacy_participant(group_id, claim_proof, claim_reference, request_id)` | IR-006 |
| TOP-009 | `commit_expense(group_id, ledger_payload, request_id)` | IR-014 |
| TOP-010 | `record_settlement(group_id, settlement_payload, request_id)` | IR-014 |
| TOP-011 | `change_sensitive_configuration(group_id, configuration_change, expected_version, request_id)` | IR-015 |
| TOP-012 | `ingest_and_reconcile_document(group_id, object_reference, metadata, extraction_result, association_request, reconciliation_key, request_id)` | IR-013, consuming IR-009 |

The physical-owner mapping is also frozen as:

```text
TOP-001 bootstrap_group
Physical owner: IR-003

TOP-002 create_invitation
Physical owner: IR-005

TOP-003 accept_invitation
Physical owner: IR-005

TOP-004 change_member_role
Physical owner: IR-005

TOP-005 transfer_ownership
Physical owner: IR-005

TOP-006 deactivate_membership
Physical owner: IR-005

TOP-007 set_group_archive_state
Physical owner: IR-005

TOP-008 claim_legacy_participant
Physical owner: IR-006

TOP-009 commit_expense
Physical owner: IR-014

TOP-010 record_settlement
Physical owner: IR-014

TOP-011 change_sensitive_configuration
Physical owner: IR-015

TOP-012 ingest_and_reconcile_document
Physical owner: IR-013, consuming IR-009
```

## Actor and authority contract

Every physical owner must derive authority inside its authoritative
transaction, in this order:

```text
auth.uid()
→ profiles.auth_user_id
→ profiles.id
→ current group_members relationship
→ active status
→ required Group-scoped role
→ current Group archive state
```

Request ID is idempotency/correlation only. Group and target IDs are selectors,
not authority. Client-supplied Auth User, Profile, role, Owner, recorder, or
uploader identity is forbidden. A display name and Participant ID cannot
authenticate an actor. There is no generic `execute_operation(name, payload)`
proxy, browser service-role credential, or broad service-role database proxy.

A requested target state (for example TOP-004's `requested_role`) is validated
mutation input, never a claimed actor role or an authority grant. A payload may
not carry an alternate actor, Auth User, Profile, Owner, recorder, or uploader
identity under another field name.

## Mandatory future-owner transaction contract

Every future physical-owner packet must define and verify all of the following:

- one authoritative transaction and all-or-nothing mutation;
- current actor, membership, role, and archive revalidation inside it;
- locking or serialization strategy and operation-specific race handling;
- duplicate-request behaviour and safe unknown-completion retry;
- stale-role and stale-membership denial;
- cross-Group ID-substitution denial; and
- last-active-Owner protection where applicable.

Idempotency binds operation, validated actor, relevant Group, request ID, and
an immutable normalized request fingerprint. The same key and request returns
the original safe result; the same key with a changed request returns a safe
conflict; an unknown completion may be retried and converges safely. Request
IDs never grant authority.

## Mandatory future-owner audit contract

Future operations must record server-derived operation, Group, target
references, actor/system provenance, safe outcome or reason category,
occurrence time, and request/correlation ID. Direct browser audit writes remain
denied.

Audit records and evidence must never include passwords, tokens, service-role
keys, plaintext invitation proof, document content, public object URLs, or
client-fabricated actor, recorder, or uploader identity.

## Known unresolved privileged path

`supabase/functions/parse-document/index.ts` is an existing unresolved
IR-013/IR-009 boundary: it accepts client-controlled provenance, uses
service-role access, uploads to public Storage, and inserts legacy global
Events. IR-008 must not modify it. Its presence is a reason GATE-013 remains
unsatisfied, not an IR-008 exception or a release approval.

## Authorised implementation scope

After authorisation, IR-008 may implement only:

```text
docs/implementation-execution/authorisations/IR-008-authorisation.md
docs/implementation-execution/packets/IR-008-trusted-operations.md
docs/implementation-execution/trusted-operation-register.md
docs/implementation-execution/gate-ledger.md
docs/implementation-execution/execution-order.md
docs/implementation-execution/dependency-graph.md
docs/implementation-execution/repository-change-map.md
docs/implementation-execution/implementation-traceability.md
docs/implementation-execution/waves/W2-auth-security-and-trusted-operations.md
docs/implementation-execution/README.md
tests/unit/ir-008-trusted-operation-contract.test.mjs
tests/database/ir-008/cases/operation-contract.matrix.json
tests/database/ir-008/cases/run-operation-contract-cases.mjs
tests/database/ir-008/run-trusted-operation-plan-evidence.mjs
tests/database/ir-008/assert-cleanup.mjs
tests/evidence/write-ir-008-evidence-manifest.mjs
artifacts/ir-008/**
```

The following are prohibited:

```text
supabase/migrations/**
supabase/functions/**
src/**
src/lib/database.types.ts
package.json
package-lock.json
Storage
Realtime
environment files
deployment
remote Supabase
existing IR-001/002/004/007 evidence semantics
```

## Evidence and status contract

IR-008 evidence must prove the exact TOP inventory and owner mapping; zero
physical trusted operations implemented; no migration `010`; no generic proxy;
no browser service-role use; no generated-type drift; no application authority
introduced; no fake performance result; and no successful execution claim for
an absent TOP operation. It must also prove that adversarial requirements exist
for replay, substitution, inactive membership, archive state, stale authority,
and races, while preserving immutable evidence and secret safety. The
adversarial obligations are unauthenticated and non-member access, inactive
membership, archived Groups, wrong role, actor substitution, Group and target
substitution, stale membership and role, duplicate request, same-key
changed-payload conflict, replay, operation-specific concurrency races, and
last-active-Owner protection. Evidence is static-only, write-once, and records
SHA-256 for every stage artifact; it cannot report a physical TOP as executed
or a performance result. No Docker or Supabase stack is required.

## Implementation completion record

IR-008 has implemented only the frozen contract validation and immutable
evidence record. It implemented zero physical trusted operations and owns no
DBM unit or migration. Physical TOP implementations remain with IR-003,
IR-005, IR-006, IR-013, IR-014, and IR-015; IR-003 remains unauthorised. This
record does not authorise deployment or cutover and does not alter the original
authorisation-time decision above.

```text
IR-008: Implemented, not Verified
GATE-013: Not satisfied
W2: In progress
IR-003 and physical owner packets: Not authorised
Deployment and cutover: Not authorised
```

Stop and return to change control for a need to implement a TOP, reserve a
migration, add a function/RPC/Edge Function, regenerate types, change source,
broaden a service-role path, change prior evidence semantics, contact remote
Supabase, deploy, or cut over.

## Prospective change-control supersession note

`CC-W2-GATE013-20260804` prospectively corrects only GATE-013 evidence
ownership: common contract/readiness belongs to W2 and physical TOP evidence
belongs to the separately authorised owner packet. It does not rewrite this
accepted authorisation, its authorised paths, or its independent-verification
criteria; it records no verification, physical implementation, owner-packet
authorisation, deployment, or cutover.

## Accepted verification closure

The accepted independent verification in
`../ir-008-verification.md` records **VERIFIED** for the frozen contract-only
scope. It does not revise this accepted authorisation or its paths: IR-008
still owns no physical TOP, DBM unit, migration, SQL/RPC/Edge Function,
application change, generated-type change, package/dependency change,
deployment, or cutover. Corrected GATE-013 is Satisfied and W2 is Complete;
GATE-015 remains Not satisfied pending separate W3-entry review. IR-003 and
every physical owner remain Not authorised, and IR-003 remains additionally
subject to GATE-031.
