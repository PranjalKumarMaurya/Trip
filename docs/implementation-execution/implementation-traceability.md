# Implementation Traceability

## Status

- Execution traceability: Draft
- Machine-readable screen source: accepted `docs/ui-design/manifests/screen-manifest.json`
- Screen mapping: 462 of 462 accepted Screen IDs; 86 accepted Component IDs
- R-01: Closed in the accepted design package
- R-02: Specified; implementation verification required

This document summarizes ownership without replacing the accepted manifests.
Every requirement below needs implementation evidence at its named packet and
integrated evidence where named; no row is a completion claim.

| Accepted requirement set | Owning IR / Wave | Draft document(s) | Required evidence | Review result |
|---|---|---|---|---|
| IR-001–IR-022 | Exact packet and Wave mapping | Packets, execution order, dependency graph, gate ledger | Entry/exit decision, owned test/security/rollback evidence | IR-001 Implemented and Verified; IR-002 Authorised and not started; IR-003–IR-022 Draft and unauthorised |
| W1–W7 | Exact Wave mapping | Wave documents, execution order, gate ledger | Entry, serial/parallel, integration, rollback, exit evidence | W1 in progress; GATE-011 not satisfied; W2–W7 unauthorised |
| Tenant, Profile, Group Member/Participant, configuration, ownership invariants | IR-002–008 / W1–W3 | DBM/TOP/security/registers | DBM-001 structural membership, DBM-002 configuration/audit, DBM-003 Auth link, lifecycle, two-Group evidence | IR-002 physical contract authorised; implementation evidence pending |
| FP-001–FP-020 | IR-004, IR-009, IR-011–015, IR-022 / W2–W5 | Test plan, packets, IR-021 rollup | Named parity result and applicable IPE result | Complete mapping |
| UI-01–UI-14 | IR-011–015 / W4 | Accepted UI traceability, packets, R-02 plan | Running-build flow/state, visual/manual review | Complete mapping |
| TC-001–TC-019 | IR-003–011, IR-014, IR-022 / W2–W5 | Security/test plan, packets | Positive/negative conformance, two-Group/operation evidence | Complete mapping |
| IPE requirements | IR-004, IR-009, IR-012–015 / W2–W4 | Packets, test plan, IR-021 | Release-blocking targeted evidence | Complete mapping |
| M01–M18 transformations | IR-006, IR-009, IR-012–016 / W3–W5 | DBM register, IR-016, gate ledger | Source map, checksum, exception/quarantine, replay/reconciliation | Complete mapping |
| S01–S19 migration/release stages | IR-016–020 / W5–W7 | Waves, rollback plan, gate ledger | Manifest, rehearsal, recovery, cutover, monitoring evidence | Complete mapping |
| EQ-01, SET-01, USD-01 finance fixtures | IR-014 / W4 | Test plan, DBM-009, IR-016/021/017 | Exact calculation/reconciliation artifacts | Complete mapping |
| Security invariants | IR-007–010 and feature owners / W2–W7 | 144-slot security plan, TOP/DBM registers | Negative cases; SEC-B01–SEC-B07 release evidence | Complete mapping |
| R-02 groups R02-01–10 | IR-004, IR-010–015, IR-021 / W2–W5 | Accessibility plan, packets, gate ledger | Applicable automated/manual running-build evidence | Specified; not closed |
| Rollback layers 01–11 | Owning IR / W1–W7 | Rollback plan, packets, gate ledger | Trigger/authority/data guarantee/stop/forward-fix record | Complete planning mapping |
| DEF-001–DEF-012 | IR-004, IR-005, IR-012, IR-014, IR-015, IR-022 | Deferred register, IR-022, gate ledger | No out-of-scope implementation and decision record | Complete mapping |

## Screen and component family ownership

| Family | Accepted count | Primary owner(s) | Wave(s) | Component / evidence families |
|---|---:|---|---|---|
| SHL | 2 | IR-004, IR-011 | W2, W4 | Shell, navigation, Group switcher; CMP-01–03, CMP-12 |
| AUTH | 11 | IR-004 | W2 | Auth forms/feedback; CMP-01, CMP-07, CMP-09–10 |
| ONB | 10 | IR-003, IR-005, IR-006, IR-011 | W3, W4 | Bootstrap, invitation, claim, no-Group states; CMP-01, CMP-05, CMP-11 |
| GRP | 18 | IR-005, IR-011 | W3, W4 | Group/membership navigation; CMP-02–05 |
| INV | 18 | IR-005 | W3 | Invitation states and safe continuation; CMP-05, CMP-07, CMP-09 |
| MBR | 15 | IR-005 | W3 | Membership, owner, archive/restore; CMP-02, CMP-04, CMP-06 |
| CLM | 13 | IR-006 | W3 | Claim, conflict, unclaimed evidence; CMP-02, CMP-04, CMP-09 |
| PERM | 20 | IR-004–007, IR-009, IR-012–015 | W2–W4 | Permission/read-only/error states; applicable components |
| FIN | 47 | IR-014 | W4 | Finance forms, totals, settlements; CMP-04, CMP-06–09 |
| DOC | 83 | IR-009, IR-012, IR-013, IR-016 | W3–W5 | Private document/view/scan/migration states; CMP-04, CMP-06, CMP-08–10 |
| CFG | 80 | IR-014–016 | W4–W5 | Configuration, FX, destination, migration states; CMP-03, CMP-07–10 |
| MIG | 90 | IR-006, IR-016–018, IR-021–022 | W3, W5, W6 | Claim/migration/recovery/gate evidence; CMP-09–12 |
| RT | 55 | IR-010 | W3 | Reconnect, delivery, removal and status; CMP-10, CMP-12 |

## Non-primary visual ownership still requiring evidence

IR-001 establishes evidence capability; IR-002 establishes Tenant/data
foundations; IR-008 establishes trusted-operation boundaries; IR-019 is a
separately authorised cutover gate; and IR-020 owns post-release containment.
They have limited or no primary screen ownership, but each remains traceable to
packet security, test, rollback, observability, and gate evidence. The absence
of a primary visual screen never removes an implementation evidence obligation.
