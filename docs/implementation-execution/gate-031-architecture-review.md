# GATE-031 — Architecture Approval Review

| Field | Record |
| --- | --- |
| Decision | **ARCHITECTURE APPROVAL GRANTED** |
| Reviewer authority | Independent GATE-031 Architecture reviewer |
| Review timestamp | 2026-08-21 02:00:26 IST (+0530) |
| Review scope | Architecture-only review of the frozen IR-003 / DBM-014 / TOP-001 package and its W3 boundaries |
| Reviewed repository baseline | `docs/gate031-architecture-review` at `1be4c4fe8ac1c33911827d7999974d5c9364a10e` |
| Gate / packet status | GATE-031 remains **Not satisfied**; IR-003 remains **Not authorised** |

## Decision boundary

This is the independent Architecture approval required by GATE-031. It grants
no Data or Security approval, does not satisfy GATE-031, and does not
authorise IR-003, migration `010`, TOP-001, a database mutation, deployment,
or cutover. The approval assesses consistency with the accepted target
architecture and the locked W3 packet boundary; it does not reopen accepted
architecture to improve it.

## Reviewed inputs

- Accepted target architecture and logical flow authority:
  `docs/architecture/multi-tenant-target-architecture.md`,
  `docs/architecture/domain-and-data-model.md`,
  `docs/architecture/auth-groups-and-invitations.md`,
  `docs/architecture/security-model.md`, and
  `docs/architecture/v1-migration-plan.md`.
- Accepted ADRs `ADR-0001` through `ADR-0008` in
  `docs/architecture/decisions/`.
- W3 controls: `packets/IR-003-atomic-group-bootstrap.md`,
  `waves/W3-group-lifecycle-storage-and-realtime.md`,
  `execution-order.md`, `dependency-graph.md`, `gate-ledger.md`,
  `repository-change-map.md`, `database-migration-register.md`, and
  `trusted-operation-register.md`.
- Controlled-evidence and prerequisite records:
  `gate-031-evidence-preparation.md`, `implementation-start-handoff.md`, and
  `open-items.md`, including the redacted product approval, target 001–009
  baseline, and initial Owner identity evidence references.
- Accepted ONB-06 freeze and design contracts:
  `design-change-control.md` (`DCC-IR003-FREEZE-001`),
  `acceptance-record.md`, `documentation/screen-contracts.md`,
  `documentation/interaction-and-states.md`, `manifests/screen-manifest.json`,
  `manifests/state-matrix.json`, and the design validation report.
- Current physical repository state: migrations `001`–`009`, the absent
  `010_ir003_atomic_group_bootstrap.sql`, and absence of TOP-001 physical
  schema/function/role implementation.

## Architecture findings

| Review area | Result | Bounded finding |
| --- | --- | --- |
| Tenant and identity model | PASS | One Group remains one Trip and the sole Tenant. Supabase Auth remains authoritative; Profile is not authority; `group_members.id` is the stable Participant identity; no separate Participants table or commercial entitlement model is introduced. |
| IR-003 packet boundary | PASS | The freeze owns only atomic new-Group bootstrap, mandatory configuration including its minimum display-currency child set, initial active Owner/Participant, bootstrap audit, and TOP-001-specific idempotency. It excludes IR-005 Invitations/lifecycle, IR-006 claims, IR-009 Storage, IR-010 Realtime, IR-014 finance, IR-015 configuration lifecycle, IR-016 transforms, and TOP-002–TOP-012. |
| ONB-06 State A/B | PASS | State A is committed TOP-001 only: Group created, invitation not issued, inert not-issued region, no invitation content or onward action, and terminal confirmation. State B remains separately committed TOP-002/IR-005 Invitation issuance. The accepted amendment preserves screen/component identities, responsive contract, and existing State B export evidence. |
| Trusted-operation ownership | PASS | TOP-001 remains IR-003-owned. TOP-002–TOP-012 ownership remains unchanged. The proposed dedicated executor and TOP-001-only idempotency are purpose-bound and do not form a generic privileged-operation platform. |
| DBM-014 and migration architecture | PASS | DBM-014 reserves one additive future migration `010_ir003_atomic_group_bootstrap.sql`; it neither redesigns the tenant root nor alters accepted migrations `001`–`009`. It uses the established configuration root and ISO relation, and makes the display set bootstrap-only while preserving IR-015 lifecycle ownership. |
| Baseline and bootstrap prerequisites | PASS | The deployed/verified 001–009 baseline is the intended predecessor. Migration 010 remains absent. The verified initial Owner/Auth/Profile evidence is an input to TOP-001 authorisation, not a competing Group-creation path. |
| W3 sequencing and cross-Wave impact | PASS | IR-003 precedes IR-005; IR-005 precedes IR-006, whose separate GATE-014 prerequisite remains intact. IR-009 and IR-010 remain after IR-005 plus their stated trusted-boundary prerequisites. No W4+ or migration/cutover dependency is introduced by this approval. |

## Bounded rationale

The frozen physical contract implements the accepted logical Group-creation
outcome as one transaction: one Group, its mandatory configuration and display
context, one server-created active Owner membership/Participant, one bootstrap
audit record, and one TOP-001 retry result. Actor authority begins with the
validated Supabase session and resolved Profile; no caller-supplied identity,
role, Group, or invitation input becomes authority. This is consistent with
ADRs 0001, 0002, 0003, 0004, 0006, and 0008 and introduces no accepted-boundary
contradiction.

The noncommercial role model, Group-as-Tenant model, stable Participant
identity, configuration authority, invitation separation, RLS/trusted-operation
boundary, and W3 dependency graph are preserved. DBM-014's display-currency
child is subordinate to the existing `group_configurations` authority and does
not take the later IR-015 change lifecycle. Its operation-specific idempotency
and no-login executor likewise have no shared TOP scope.

## Status and non-architecture note

GATE-031 remains **Not satisfied** pending the independent Data and Security
approvals and a separate gate satisfaction decision. IR-003 remains **Not
authorised**. No physical implementation is approved by this record.

One repository-visible W3 status summary is stale: the `Implementation-
authorisation status` paragraph in
`waves/W3-group-lifecycle-storage-and-realtime.md` still says the selected
Owner, verified identity/Profile linkage, mandatory configuration, and four
approvals are absent. The later controlled-evidence record, gate ledger,
implementation handoff, and open-items record show the Product configuration,
initial Owner evidence, and Product approval complete, with only Data,
Security, and this Architecture approval pending. This is a documentation
status-synchronisation deviation, not a contradiction of the frozen
architecture or packet boundary. It is recorded here only because this review
does not own or alter the shared W3 status record.

## Evidence references

- GATE prerequisites and redacted controlled evidence:
  `gate-031-evidence-preparation.md` §§ Redacted evidence status, Owner identity
  evidence completion, and Authorised prerequisite deployment and fresh audit.
- GATE status: `gate-ledger.md` row `GATE-031`; `open-items.md` row `OE-005`.
- DBM-014: `database-migration-register.md` row `DBM-014` and
  `IR-003-atomic-group-bootstrap.md` §§3–7.
- TOP ownership: `trusted-operation-register.md` §§ TOP inventory and
  TOP-001 physical pre-authorisation freeze.
- ONB-06: `DCC-IR003-FREEZE-001`, `screen-contracts.md` ONB-06, and the
  State A/State B entries in `screen-manifest.json` and `state-matrix.json`.
- W3 order: `execution-order.md` W3, `dependency-graph.md`, and the W3 wave
  record.
