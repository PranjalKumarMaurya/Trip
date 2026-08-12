# Design-to-Roadmap Review

## Status

- Import status: Complete
- Design-to-roadmap traceability: Complete
- UI/UX Design Package: Accepted
- UI/UX Design Lock: Complete
- Full UI/UX Design Freeze: Complete
- Application implementation: Not started
- Implementation authorised: No
- Execution packets: Not yet created or accepted
- Deployment authorised: No

## Summary

- 462 screens
- 86 components
- 13 screen families
- 22 IR items
- 7 Waves
- 462 mapped screens; 0 unmapped screens
- UI-01 through UI-14: 14 of 14 mapped to their accepted-roadmap owners
- Open accessibility verification: R-02 — Specified; implementation verification required

R-01 is closed: validation confirms every Screen ID has one valid primary `irOwner`, a roadmap-consistent `wave`, and no invented active IR/Wave identifier. Static design acceptance and lock do not authorise application implementation.

## Accepted ONB-06 lifecycle staging amendment

`DCC-IR003-FREEZE-001` is Accepted as a W3-only clarification of the existing
`ONB-06` Screen identity. It preserves the screen's primary manifest owner
(`IR-003`) and its existing related `IR-005` reference while making the
operation-owned lifecycle states explicit:

| ONB-06 state | Owning operation | Owning IR / Wave | Traceability boundary |
|---|---|---|---|
| State A — Group created, Invitation not issued | TOP-001 | IR-003 / W3 | Server-confirmed Group bootstrap only; no Invitation object, secret, link, copy/share, join claim, IR-005/IR-006/IR-010 continuation, or IR-011 shell. |
| State B — Group created, Invitation issued | TOP-002 | IR-005 / W3 | Separately committed Invitation only; retains the existing Invitation/link, copy/share, confirmation, and Invitation-lifecycle behaviour. |

No Screen or Component ID, responsive behaviour, visual tone, navigation or
tenant model, W4 ownership, or later-Wave mapping changes. The current ONB-06
PNG exports remain State B evidence; State A is accepted in the authoritative
textual and manifest state contract. This decision does not authorise IR-003
or IR-005, satisfy GATE-031, or begin W3 implementation.

## Family mapping

| Screen family | Screen count | Primary IR item(s) | Wave(s) | Related IR items | Security review | Status |
|---|---:|---|---|---|---|---|
| SHL | 2 | IR-004, IR-011 | W2, W4 | IR-007, IR-010, IR-021 | Yes | Mapped |
| AUTH | 11 | IR-004 | W2 | IR-005, IR-007 | Yes | Mapped |
| ONB | 10 | IR-003, IR-005, IR-006, IR-011 | W3, W4 | IR-004, IR-007, IR-008 | Yes | Mapped |
| GRP | 18 | IR-005, IR-011 | W3, W4 | IR-002, IR-007, IR-008, IR-010 | Yes | Mapped |
| INV | 18 | IR-005 | W3 | IR-004, IR-007, IR-008 | Yes | Mapped |
| MBR | 15 | IR-005 | W3 | IR-007, IR-008 | Yes | Mapped |
| CLM | 13 | IR-006 | W3 | IR-003, IR-005, IR-007, IR-008 | Yes | Mapped |
| PERM | 20 | IR-004–IR-007, IR-009, IR-012–IR-015 | W2–W4 | Feature-owner denial paths | Yes | Mapped |
| FIN | 47 | IR-014 | W4 | IR-008, IR-011, IR-021 | Yes | Mapped |
| DOC | 83 | IR-009, IR-012, IR-013, IR-016 | W3–W5 | IR-007, IR-008, IR-011, IR-021 | Yes | Mapped |
| CFG | 80 | IR-014–IR-016 | W4–W5 | IR-003, IR-007, IR-008, IR-011, IR-012 | Yes | Mapped |
| RT | 55 | IR-010 | W3 | IR-007, IR-011 | Yes | Mapped |
| MIG | 90 | IR-006, IR-016–IR-018, IR-021–IR-022 | W3, W5, W6 | Feature and security migration references | Yes | Mapped |

## IR coverage

| IR item | Roadmap title | Wave | Design screens | Components | Acceptance evidence | Status |
|---|---|---|---:|---|---|---|
| IR-001 | Evidence foundation | W1 | 0 primary | No UI-owned component | Capability, fixture, contract, and audit-log evidence | Related governance only |
| IR-002 | Tenant data foundation | W1 | 0 primary | Tenant/shell references | Invariant and two-Group evidence | Related to Group screens |
| IR-003 | Atomic Group bootstrap | W3 | 7 | Onboarding/shared shell | Atomic retry and concurrency evidence | Mapped |
| IR-004 | Auth, Profile, session | W2 | 13 | Auth/shell sheets | Session and privacy denial evidence | Mapped |
| IR-005 | Membership, Invitation, Owner | W3 | 52 | Invitation/member sheets | Replay, race, last-Owner, archive evidence | Mapped |
| IR-006 | Legacy Participant claiming | W3 | 24 | Claim and migration sheets | Conflict, concurrency, idempotency evidence | Mapped |
| IR-007 | RLS and ownership | W2 | 5 | Permission/access sheets | Matrix, substitution, two-Group evidence | Mapped |
| IR-008 | Trusted operations | W2 | 0 primary | Cross-cutting write states | Injected failure, retry, race, audit evidence | Related security owner |
| IR-009 | Private Storage | W3 | 9 | Private viewer/document sheets | Private, denial, and orphan evidence | Mapped |
| IR-010 | Authorized realtime | W3 | 55 | CMP-63–CMP-72 | Current-authorised delivery and reconnect evidence | Mapped |
| IR-011 | Active Group/data access | W4 | 8 | Shell/Group-switcher sheets | Scoped read, write, and unavailable-state evidence | Mapped |
| IR-012 | Events, audiences, Todos | W4 | 10 | Event/audience/Todo references | Lifecycle, time, archive, realtime, cross-Group evidence | Mapped |
| IR-013 | Documents and scan | W4 | 64 | CMP-34–CMP-47 | File, parse, database, orphan, lifecycle evidence | Mapped |
| IR-014 | Finance and Settlements | W4 | 60 | CMP-23–CMP-33 | Exact fixture, reconciliation, atomic-write evidence | Mapped |
| IR-015 | FX and destination | W4 | 64 | CMP-48–CMP-62 | Live/fallback, Bali/non-Bali, time evidence | Mapped |
| IR-016 | Migration transforms/manifests | W5 | 70 | CMP-73–CMP-86 | Count, checksum, reconciliation, quarantine evidence | Mapped |
| IR-017 | Representative rehearsal/recovery | W6 | 11 | Recovery sheets | S01–S13/S18 recovery evidence | Mapped |
| IR-018 | Secured cutover preparation | W6 | 8 | Freeze/readiness sheets | Freeze, delta, rollback-plan evidence | Mapped |
| IR-019 | Separately authorized cutover | W7 | 0 primary | No authorised cutover UI | Separately authorised smoke/isolation evidence | No design primary by scope |
| IR-020 | Monitoring and containment | W7 | 0 primary | Recovery references only | Incident, reconciliation, retention evidence | No design primary by scope |
| IR-021 | Integrated parity/security evidence | W5 | 1 | CMP-86 related | Full FP/UI/TC/IPE/security evidence | Mapped |
| IR-022 | Release governance and lock evidence | W1–W7 | 1 | CMP-86 related | Gate ledger and review records | Mapped at W5 review point |

## Wave coverage

| Wave | IR items | Design evidence | Entry conditions | Exit evidence | Status |
|---|---|---|---|---|---|
| W1 | IR-001, IR-002 | Related tenant and evidence references; no primary UI state | Phase 7 Accepted; environment boundary known | Isolated fixture/schema capability | No UI primary by scope |
| W2 | IR-004, IR-007, IR-008 | 18 Auth/permission primary screens | W1 ownership model passes | Auth, matrix, rollback, secret, two-Group evidence | Mapped |
| W3 | IR-003, IR-005, IR-006, IR-009, IR-010 | 147 lifecycle, claim, document-access, realtime screens | W2 trusted boundary passes | Atomic lifecycle/claim and private/realtime evidence | Mapped |
| W4 | IR-011–IR-015 | 206 Group-product, finance, document, configuration screens | W3 scoped foundations pass | FP/UI/TC evidence | Mapped |
| W5 | IR-016, IR-021, IR-022 | 72 migration, parity, governance screens | W3–W4 records and operations complete | Transform/reconciliation/traceability evidence | Mapped |
| W6 | IR-017–IR-018 | 19 recovery and readiness screens | W5 gate ledger and execution inputs supplied | Recovery/freeze/delta evidence | Mapped |
| W7 | IR-019–IR-020 | Related release/containment references; no primary UI state | Separate authorization and all gates | Deployed reconciliation/monitoring/retention evidence | No UI primary by scope |

## Architecture review

- **Group-is-Trip:** Group-switch and lifecycle screens preserve one Group as one Trip tenant; no permanent Group deletion is designed.
- **Auth authority:** Auth screens use session authority and do not retain persona, PIN, Profile, or invitation possession as authority.
- **Invitations and Owner/Member model:** invitation, membership, and last-Owner screens map to IR-005 and retain only Owner and Member roles.
- **Participant claiming:** claiming screens map to IR-006, preserve stable identity, and stop safely rather than infer authority from a name or emoji.
- **Deny-by-default access:** permission screens retain server-confirmed denial and feature-specific primary owners with IR-007 references.
- **Finance exactness:** finance screens map to IR-014; live FX does not rewrite historical accounting values and custom unequal-split authoring is absent.
- **Private documents:** direct private-viewer/access states map to IR-009; scan/reconciliation states map to IR-013; no public URL or separate document audience is claimed.
- **Group configuration:** configuration screens use IR-015 or IR-014 for accounting currency and retain Owner-only server confirmation.
- **Realtime isolation:** the realtime family maps to IR-010; payloads are presentation only and current authorisation remains authoritative.
- **Migration and rollback:** migration communication, transforms, recovery, readiness, and governance map to IR-016–IR-018, IR-021, or IR-022 without claiming cutover authority.

## Remaining review items

- R-02 — **Specified; implementation verification required.** Measure contrast, keyboard traversal/focus restoration, reduced motion, and screen-reader announcement behaviour on a running build. This is not a static-design failure.

## Recommendation

Traceability is complete and accepted. The next authorised activity is creation, review, and lock of the W1–W7 implementation execution packets; application implementation remains blocked pending the final implementation-readiness gate.
