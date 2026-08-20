# Trusted Operation Register

## Frozen common contract

IR-008 owns this common contract and register only. It owns no DBM unit, SQL
migration, `010_*` migration reservation, SQL function, RPC, Edge Function,
browser operation, generated database-type work, or physical trusted
operation. The entries below are not implemented operations.

Every future owner derives authority inside its authoritative transaction:

```text
auth.uid()
→ profiles.auth_user_id
→ profiles.id
→ current group_members relationship
→ active status
→ required Group-scoped role
→ current Group archive state
```

No operation may accept an actor parameter. Request ID is only
idempotency/correlation; Group and target IDs are selectors, not authority.
Client-supplied Auth User, Profile, role, Owner, recorder, and uploader identity
are forbidden. Display name and Participant ID cannot authenticate an actor.
There is no generic `execute_operation(name, payload)` proxy, browser
service-role credential, or broad service-role database proxy.

A requested target state such as TOP-004's `requested_role` is mutation input,
not caller-role authority. No payload may smuggle actor identity under another
field name.

## TOP inventory and ownership

Logical signatures are future request contracts, not physical callable
signatures. They retain the accepted candidate's operation, input, and outcome
boundary while deliberately excluding any actor input.

| ID | Exact logical signature | Physical owner | Validation, transaction, and operation-specific concurrency boundary | Status |
|---|---|---|---|---|
| TOP-001 | `bootstrap_group(group_request, configuration_request, request_id)` | IR-003 | Authenticated verified creator; create Group, mandatory configuration, stable member/Participant identity, first active Owner, and audit in one transaction. Duplicate/retry returns one complete result; concurrency cannot create duplicate logical Groups. | Authorised — not implemented |
| TOP-002 | `create_invitation(group_id, recipient_request, invitation_request, request_id)` | IR-005 | Current active Owner in target active Group; recipient-bound expiring Invitation and audit commit atomically. Keyed administrative retry cannot create duplicate live secret/Invitation outcome. | Contract frozen; not implemented |
| TOP-003 | `accept_invitation(invitation_proof, continuation_context, request_id)` | IR-005 | Valid authenticated recipient; revalidate Group, recipient binding, expiry, revocation, and prior membership. Membership activation/reactivation and single-use consumption are one transaction; recipient mismatch/replay/race cannot mint authority. | Contract frozen; not implemented |
| TOP-004 | `change_member_role(group_id, target_membership_id, requested_role, request_id)` | IR-005 | Current Owner and active same-Group target; only Owner/Member roles. Atomic role/audit update revalidates ownership continuity; serialized changes prevent self-promotion or zero Owners. | Contract frozen; not implemented |
| TOP-005 | `transfer_ownership(group_id, successor_membership_id, prior_owner_outcome, request_id)` | IR-005 | Current Owner and active same-Group successor. One continuity-preserving transaction; concurrent transfers serialize to one valid Owner set and never leave an ownerless Group. | Contract frozen; not implemented |
| TOP-006 | `deactivate_membership(group_id, target_membership_id, action, confirmation, request_id)` | IR-005 | Current active Member may leave self; current active Owner may remove same-Group target. Both branches use one lifecycle/audit mutation; concurrent role change revalidates last-active-Owner protection. | Contract frozen; not implemented |
| TOP-007 | `set_group_archive_state(group_id, desired_archive_state, request_id)` | IR-005 | Current active Owner; restore revalidates ownership continuity. Desired-state archive/restore and audit update are atomic; concurrent Invitation/write actions settle to one lifecycle-consistent result. | Contract frozen; not implemented |
| TOP-008 | `claim_legacy_participant(group_id, claim_proof, claim_reference, request_id)` | IR-006 | Authenticated current actor with reviewed proof only; attach existing stable identity and activate ordinary Membership where permitted in one transaction. Conflict/retry/replay converge to safe result or denial; never Owner promotion. | Contract frozen; not implemented |
| TOP-009 | `commit_expense(group_id, ledger_payload, request_id)` | IR-014 | Active same-Group Member; every payer/share resolves to same-Group stable Participant. Expense, contributions, shares, FX evidence, and audit commit atomically; retry/race cannot create partial children or alter deterministic remainder. | Contract frozen; not implemented |
| TOP-010 | `record_settlement(group_id, settlement_payload, request_id)` | IR-014 | Active same-Group debtor/recording Member; payer, receiver, and recorder are same Group. Exact configured-accounting-currency settlement and audit write atomically; concurrent finance state is revalidated. | Contract frozen; not implemented |
| TOP-011 | `change_sensitive_configuration(group_id, configuration_change, expected_version, request_id)` | IR-015 | Current active Owner; accounting-history safety is revalidated. Validated configuration/audit update is atomic; stale version yields a safe conflict and cannot reinterpret history. | Contract frozen; not implemented |
| TOP-012 | `ingest_and_reconcile_document(group_id, object_reference, metadata, extraction_result, association_request, reconciliation_key, request_id)` | IR-013, consuming IR-009 private-object evidence | Active same-Group initiating Member; a continuation revalidates recorded Group/object relationship before finalization. One reconciled result or durable quarantine; parse/object/database races cannot create duplicate or orphan authority. | Contract frozen; not implemented |

## TOP-001 physical pre-authorisation freeze

This clarification preserves the logical signature and physical owner. It does
not authorise or implement TOP-001, DBM-014, a migration, an RPC, a role, or
any operation.

- The only future physical callable is
  `public.bootstrap_group(group_request jsonb, configuration_request jsonb, request_id uuid)`;
  it returns `TABLE (outcome text, group_id uuid, request_id uuid)`, has no
  defaults/overloads, and has no actor argument.
- `group_request` contains only `trip_name`; `configuration_request` contains
  only explicit destination, dates, IANA timezone, ISO accounting currency,
  and a non-empty ISO display-currency set containing accounting currency.
  Every value is mutation input only. Auth User/Profile/Group/Participant/
  Owner/role/actor/creator/recorder/uploader/authority fields and Invitation
  data are forbidden.
- Authority starts at `auth.uid()`, then resolves the currently verified Auth
  User and exactly one `profiles.auth_user_id` match before using the resolved
  Profile. The new Group Member/Participant and active Owner are server-made;
  they are neither input nor result authority.
- One transaction creates the Group, one configuration, its display-context
  child rows, one active Owner membership, one bootstrap audit event, and one
  IR-003-specific completed idempotency result, or commits none. It rethrows
  safe failure categories and returns no partial authority.
- Idempotency is only `(TOP-001, validated actor Profile, request UUID)` plus
  canonical normalized JSONB request fingerprint. Same key/fingerprint returns
  the persisted safe completed result; same key/different fingerprint is a
  safe conflict; a same-key race serializes on that primary key; an unknown
  client completion converges by retry. The persistence is not a generic
  TOP-002–TOP-012 facility.
- The SECURITY DEFINER owner is the dedicated
  `ir003_top001_executor NOLOGIN NOINHERIT BYPASSRLS` role, not `postgres`.
  It has only qualified TOP-001 read/insert/update privileges, a fixed
  `search_path = pg_catalog`, no table ownership/DDL/login/membership, and no
  general proxy. `PUBLIC`, `anon`, and `service_role` lose EXECUTE; only
  `authenticated` receives it. Browser service-role use remains forbidden.

The complete DBM, persistence, privilege, performance, lane, evidence, and
ONB reachability contract is frozen in
[`IR-003-atomic-group-bootstrap.md`](packets/IR-003-atomic-group-bootstrap.md).
`DCC-IR003-FREEZE-001` is Accepted: TOP-001 can reach only ONB-06 State A
(Group created, Invitation not issued) after its server-confirmed commit;
TOP-002/IR-005 alone can reach State B (Group created, Invitation issued) after
its separately committed real Invitation. TOP-002–TOP-012 ownership and
physical evidence obligations are unchanged. This design-freeze completion does
not satisfy GATE-031 or authorise any physical TOP.

## GATE-013 readiness and physical-evidence boundary

Under `CC-W2-GATE013-20260804`, GATE-013 is the W2 common
trusted-operation contract/readiness gate. It requires verified Auth/session
and deny-by-default ownership RLS boundaries; the verified common contract;
this frozen TOP inventory and physical-owner map; `auth.uid()`-first actor
derivation; current membership, role, and archive revalidation; transaction,
idempotency, concurrency, audit, secret-safety, no-generic-proxy, and
no-browser-service-role requirements.

GATE-013 does not require a TOP implementation, physical operation execution,
injected-failure rollback execution, actual idempotency/concurrency/audit
execution, or operation-specific performance evidence. Those remain mandatory
at each physical owner packet exit: TOP-001 → IR-003; TOP-002–TOP-007 →
IR-005; TOP-008 → IR-006; TOP-009–TOP-010 → IR-014; TOP-011 → IR-015; and
TOP-012 → IR-013, consuming IR-009 private-object evidence. Every owner packet
must retain actual implementation, authorization, authoritative transaction,
all-or-nothing mutation, injected-failure rollback, idempotency,
concurrency/race evidence, audit emission, secret-safe evidence, and
operation-specific performance evidence.

## Required common behaviours

Every owner packet must define and verify one authoritative transaction;
current actor, membership, role, and archive revalidation; locking or
serialization; all-or-nothing mutation; duplicate-request behaviour;
stale-role and stale-membership denial; cross-Group ID-substitution denial;
operation-specific race handling; and last-active-Owner protection where
applicable.

Idempotency is bound to operation, validated actor, relevant Group, request ID,
and an immutable normalized request fingerprint. The same key and request
returns the original safe result; the same key and changed request produces a
safe conflict; unknown completion can be retried and converges safely. Request
IDs never grant authority.

Future server-derived audit records include operation, Group, target references,
actor/system provenance, safe outcome or reason category, occurrence time, and
request/correlation ID. Browser audit writes remain denied. They exclude
passwords, tokens, service-role keys, plaintext invitation proof, document
content, public object URLs, and client-fabricated actor, recorder, or uploader
identity.

## Exceptional legacy path and status

The existing `parse-document` Edge Function is an unresolved IR-013/IR-009
boundary because it accepts client-controlled provenance, uses service-role
access, uploads to public Storage, and inserts legacy global Events. IR-008
does not modify it and does not designate it as a TOP implementation.

```text
IR-008: Verified (contract-only)
GATE-013: Satisfied
W2: Complete
GATE-015: Satisfied; W3 entry prerequisites from W2 passed
GATE-031: Satisfied (evidence gate only)
IR-003/TOP-001: Authorised — not implemented
Every other physical owner packet: Not authorised
Deployment and cutover: Not authorised
```

Accepted independent verification run
`ir008-20260804-trusted-operation-contracts` confirms exactly 12 TOP
contracts, exactly 13 adversarial obligations, 12 evidence stages, 11
manifest-referenced artifacts, and SHA-256 validation for every artifact. It
confirms zero physical TOP implementations, DBM units, migrations, SQL/RPC/Edge
Functions, application changes, generated-type changes, package/dependency
changes, or migration `010`; no generic proxy; no browser service-role use; and
secret safety. Physical TOP evidence remains exclusively at its owner packet
exit.
