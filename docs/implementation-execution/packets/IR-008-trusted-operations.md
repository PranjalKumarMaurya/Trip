# IR-008 — Trusted operations

## 1. Status and ownership

- Status: **Verified** (contract validation and immutable evidence only).
- Wave: W2.
- Authorisation: [`../authorisations/IR-008-authorisation.md`](../authorisations/IR-008-authorisation.md)
  is the sole bounded IR-008 scope and contract.
- Entry: IR-007 and DBM-006 are Verified. IR-008's accepted independent
  verification satisfies corrected GATE-013; W2 is Complete.

IR-008 owns no DBM unit, migration, SQL function, RPC, Edge Function, browser
operation, generated database-type work, or physical TOP implementation. No
`010_*` migration is reserved. It freezes the common trusted-operation
contract and ownership register only.

## 2. Objective

Freeze a narrow, auditable common contract for future authoritative operations
without supplying authority, an implementation mechanism, or a service-role
bypass. Each TOP remains physically implemented and verified only by its named
future owner.

## 3. Authoritative inputs

Security model §10; ADR-0008; roadmap IR-008; accepted operation-dependent
design contracts; verified IR-007/DBM-006; and the IR-008 authorisation.

The accepted documents govern. This packet does not represent a physical-owner
implementation as complete or amend a physical owner's future schema or
delivery decision.

## 4. Frozen TOP register and logical signatures

The complete TOP inventory, exact logical signatures, and physical-owner map
are in [`../trusted-operation-register.md`](../trusted-operation-register.md).
No operation may accept an actor parameter. Each signature is a future
validated request shape rather than a physical SQL/RPC/Edge/browser signature.

```text
TOP-001 bootstrap_group — IR-003
TOP-002 create_invitation — IR-005
TOP-003 accept_invitation — IR-005
TOP-004 change_member_role — IR-005
TOP-005 transfer_ownership — IR-005
TOP-006 deactivate_membership — IR-005
TOP-007 set_group_archive_state — IR-005
TOP-008 claim_legacy_participant — IR-006
TOP-009 commit_expense — IR-014
TOP-010 record_settlement — IR-014
TOP-011 change_sensitive_configuration — IR-015
TOP-012 ingest_and_reconcile_document — IR-013, consuming IR-009 private-object evidence
```

## 5. Actor, selector, and service-role boundary

Every physical owner must derive its authority inside the authoritative
transaction:

```text
auth.uid()
→ profiles.auth_user_id
→ profiles.id
→ current group_members relationship
→ active status
→ required Group-scoped role
→ current Group archive state
```

Request ID is idempotency/correlation only. Group and target IDs select a
record; they never prove authority. Client-supplied Auth User, Profile, role,
Owner, recorder, or uploader identity is forbidden. Display name and
Participant ID cannot authenticate an actor.

No generic `execute_operation(name, payload)` proxy is permitted. A browser
never receives a service-role credential, and no broad service-role database
proxy is permitted. A future exceptional service-role continuation requires its
own owner-packet review and still derives/revalidates the actor and Group.

## 6. Future-owner transaction, idempotency, and audit contract

Each TOP owner must define and verify one authoritative transaction; current
actor/membership/role/archive revalidation; locking or serialization;
all-or-nothing mutation; duplicate request behaviour; stale-role and
stale-membership denial; cross-Group substitution denial; operation-specific
race handling; and last-active-Owner protection where applicable.

Idempotency binds the operation, validated actor, relevant Group, request ID,
and immutable normalized request fingerprint. The same key with the same
request returns the original safe result. The same key with a changed request
returns a safe conflict. Unknown completion retries converge safely. A request
ID never grants authority.

Each TOP owner must record server-derived operation, Group, target references,
actor/system provenance, safe outcome or reason category, occurrence time, and
request/correlation ID. It must not record passwords, tokens, service-role
keys, plaintext invitation proof, document content, public object URLs, or
client-fabricated actor, recorder, or uploader identity. Direct browser audit
writes remain denied.

## 7. Known unresolved privileged path

The existing `parse-document` Edge Function is the IR-013/IR-009 unresolved
boundary: client-controlled provenance, service-role access, public Storage
upload, and legacy global Event insertion. IR-008 does not modify it or treat
it as a sanctioned TOP implementation.

## 8. Evidence contract

Static-only IR-008 contract evidence verifies the exact register/owner map and
logical signatures; zero implemented physical TOPs; no `010` migration; no
generic proxy; no browser service-role use; no generated-type drift; no new
application authority; no fake performance result; and no success result for
an absent operation. It also verifies the adversarial requirements for replay,
substitution, inactive membership, archive state, stale authority, and races,
plus immutable secret-safe evidence handling. The retained artifact has every
required stage and SHA-256-validated file reference; it records future-owner
obligations rather than a database or performance execution. No Docker or
Supabase stack is required.

It is authorisation-contract evidence, not operation execution evidence. Under
the corrected GATE-013 contract, its accepted independent verification is the
common-readiness input; it remains neither physical-operation evidence nor a
physical-owner packet exit result.

## 9. Authorised paths and prohibitions

The exact documentation, static test/evidence paths, and optional immutable
`artifacts/ir-008/**` destination are enumerated in the authorisation. All
other paths are outside IR-008. In particular, `supabase/migrations/**`,
`supabase/functions/**`, `src/**`, `src/lib/database.types.ts`, package files,
Storage, Realtime, environment files, deployment, remote Supabase, and
IR-001/002/004/007 evidence semantics are prohibited.

## 10. Exit and downstream boundary

```text
IR-008: Verified (contract-only)
GATE-013: Satisfied
W2: Complete
GATE-015: Satisfied; W3 entry prerequisites from W2 passed
GATE-031: Not satisfied
IR-003 and physical owner packets: Not authorised
Physical trusted operations: none authorised
Deployment and cutover: Not authorised
```

IR-003 and every physical owner remain work requiring separate authorisation.
IR-008 implemented zero physical TOPs and cannot verify their TOPs, nor can this
contract-only result authorise a physical TOP, open W3, authorise Storage or
Realtime, deploy, or cut over. Its accepted verification is recorded in
[`../ir-008-verification.md`](../ir-008-verification.md).

## 11. Prospective change-control supersession note

`CC-W2-GATE013-20260804` prospectively corrects GATE-013 ownership: W2's gate
consumes the common contract/readiness evidence, while each physical TOP owner
retains its operation execution evidence at packet exit. This note does not
rewrite this packet's accepted authorisation or independent-verification
criteria, change IR-008's contract-only boundary, or authorise a physical
owner. The supersession note itself did not record verification; accepted
verification is recorded separately in `../ir-008-verification.md`.
