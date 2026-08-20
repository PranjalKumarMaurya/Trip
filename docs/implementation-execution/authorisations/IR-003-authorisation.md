# IR-003 Authorisation — Atomic Group Bootstrap

## Decision and authority

- Decision: **Authorised — implementation not started**.
- Decision timestamp: `2026-08-21T02:21:46+05:30`.
- Authorisation authority: Product owner / separate bounded IR-003
  authorisation authority.
- Starting branch and commit reviewed: `v2` at
  `1867165617500bdb6d283b34971b4a62133b4fda`.

This is the separate bounded authority required after the GATE-031 evidence
decision. It authorises physical implementation of IR-003 only, within the
frozen packet and lane allow-lists. It does not mark IR-003 Implemented or
Verified, and it does not authorise deployment, remote mutation, or cutover.

## Preconditions accepted for entry

| Prerequisite | Result |
| --- | --- |
| GATE-015 W3 entry review | Satisfied |
| GATE-031 controlled evidence decision | Satisfied — [`gate-031-decision.md`](../gate-031-decision.md) |
| GATE-031 canonical evidence SHA-256 | `b255c36c8249db35f5cf711054dfee28fca0858904a2900426e2e0951dc65e2a` |
| IR-003 pre-authorisation freeze | Complete |
| Accepted predecessor baseline | Target `001`–`009`; migration `010` absent |

The accepted controlled evidence covers the approved configuration and date
adjudication, intended Owner selection, Auth existence and confirmation,
exactly-one Profile linkage, reviewed request/execution manifest,
Product/Data/Security/Architecture approvals, target-baseline provenance, and
secret safety. Existing Auth/Profile evidence is a prerequisite only; it is
not an IR-003-created Group or Owner membership.

## Authorised implementation boundary

IR-003 may implement only DBM-014 and TOP-001 as frozen in
[`IR-003-atomic-group-bootstrap.md`](../packets/IR-003-atomic-group-bootstrap.md):

- future migration `010_ir003_atomic_group_bootstrap.sql`;
- atomic Group bootstrap, its one configuration and display-currency children;
- initial active Owner membership/Participant, bootstrap audit, and
  TOP-001-specific idempotency;
- the narrow dedicated executor, grants/revokes, failure/rollback, adversarial,
  concurrency, performance, evidence, integration/type-refresh, and
  ONB-06 State A obligations already frozen in the packet.

ONB-06 State A remains **Group created, Invitation not issued**. TOP-001 may
not create or present an Invitation capability.

The authority expressly excludes IR-005 invitation issuance/lifecycle and
TOP-002–TOP-007; IR-006 claiming; IR-009 Storage; IR-010 Realtime; IR-014
finance; IR-015 configuration lifecycle; IR-016 transforms; and every other
TOP. State B — **Group created, Invitation issued** — remains IR-005/TOP-002
after its own separate authorisation.

## Authorised lane decomposition

| Lane | Exclusive writable scope | Entry/handoff boundary |
| --- | --- | --- |
| A — Database | migration `010` only | Implements DBM-014/TOP-001 and hands migration checksum/object catalogue to the later lanes. |
| B — Adversarial DB/contract tests | proposed IR-003 cases/fixture/unit-contract paths only | Starts from the reviewable Lane A migration; covers authority, forged actor, rollback, replay/fingerprint, race, and cross-Group cases. |
| C — Evidence/performance/failure harness | proposed IR-003 harness, rollback/performance/manifest paths and `artifacts/ir-003/**` only | Starts after A/B handoffs in the isolated environment; owns stack lifecycle, reapply, cleanup, evidence, and performance probes. |
| D — Browser/UI integration | listed AuthBoundary, proposed onboarding/adapter, browser/static test paths only | Implements the anonymous-key bootstrap handoff and ONB-06 State A only; typed adapter completion consumes integration-generated types. |

No lane writes another lane's paths. A future integration owner alone merges
lane outputs and refreshes `src/lib/database.types.ts` twice after an
authorised clean schema application. A fresh independent verifier must inspect
the candidate diff and independently confirm the DBM/TOP, security,
idempotency, rollback, concurrency, performance, UI, type, cleanup, and
no-later-scope evidence before any verification decision.

## Remaining status boundary

IR-003 is **Authorised**, not Implemented and not Verified. IR-005, IR-006,
IR-009, IR-010, deployment, and cutover remain Not authorised. No current
authorisation permits a remote database mutation, bootstrap execution, or
push.

### Supplemental shared DBM-002 dependency

Lane C is blocked on the documented shared DBM-002 timezone-validator
remediation. This authorisation does **not** authorise a shared reference
relation, validator replacement, SECURITY DEFINER posture, maintenance
operation, migration reservation supersession, or any migration beyond its
frozen DBM-014 boundary. GATE-031 remains historically satisfied for the
original package, but that approval is not authority for the shared contract.
Only after the separately required Product/Data/Security/Architecture reviews
and shared DBM-002 forward-evolution authorisation may a supplemental IR-003
authorisation amendment bind this packet to the approved prerequisite and
fresh Lane B/Lane C/independent-verifier evidence. Until then IR-003 remains
Authorised but implementation-blocked; Lane D remains isolated.
