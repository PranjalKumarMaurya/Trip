# First usable multi-user release plan

Status: Active working plan, 2026-10-02. This plan sequences the accepted architecture and packets; it does not replace their security or migration contracts. Check current code and the packet evidence before marking a step complete.

## Release outcome

A new person can sign up and verify an account, create one Trip Group, share a manually copied Invitation link, and have the intended friend sign up or sign in and join as a Member. Both can use Trip events, Todos, Scan documents, Split expenses/settlements, and FX in that Group. A person in two Groups can switch safely. The existing AI tab, permanent friend network, automatic invitation email, and worldwide price guides are outside this release.

The first release is complete only after a two-account/two-Group running-build journey passes, with wrong-recipient, expired/reused/revoked Invitation, removed Member, stale Group, and cross-Group denial cases. Passing compilation or a packet's static tests alone is insufficient.

## Ordered milestones

| Milestone | Deliverable | Completion evidence | Dependency |
| --- | --- | --- | --- |
| 0. Restore a trustworthy baseline | Correct current status notes and test selection; keep a concise code/packet map. | Default CI and relevant direct tests report current failures honestly; no historical static check treats later authorised files as forbidden. | Current repository |
| 1. Finish IR-003 | Corrected DBM-002 Data re-review; reviewed deterministic IANA artifact and shared authority; migration 011; independent shared verification; amended IR-003 boundary; Lane B/C rerun; Lane D onboarding integration and generated types. | Exact comparator and provenance checks, p95/p99 thresholds, atomic bootstrap/replay/rollback, browser create-Group journey, independent IR-003 exit. | Existing IR-003 Lane A/B, corrected proposal |
| 2. Join a friend, IR-005 | Owner can create/revoke a single-use, recipient-bound link; friend can inspect, authenticate, accept, and become an active ordinary Member. Lifecycle/last-Owner protections work. | Two-user invite journey; expiry, replay, race, wrong recipient, removal, role and cross-Group negative tests; no secret in logs. | Verified IR-003, IR-004/007/008 |
| 3. Secure Group workspace, IR-006/009/010/011 | Handle legacy Participant claims where needed; private document access, membership-aware Realtime, Active Group routing/switching, safe empty/archived/removed states. | No old Group data after switch/removal; object and subscription substitution denied; new account reaches Group or onboarding. | IR-005 and relevant W3 gates |
| 4. Convert the five user features, IR-012–015 | Group-scoped events/Todos, Scan, Split/settlements, configured FX and destination context. Disable an unfinished action safely until its own path passes. | Per-feature browser and database evidence, two-Group isolation, finance exactness, document privacy, accessibility checks. | IR-011 and owning storage/trusted operations |
| 5. Integrate and release, IR-016–022 | Reviewed legacy-data disposition, integrated parity/security evidence, representative recovery rehearsal, release configuration and monitoring, then separately authorised cutover. | End-to-end new-user and friend journey in a release-like environment; source/target reconciliation where applicable; rollback and release decision recorded. | W3/W4 exits and release gates |

## Immediate work queue

1. Resolve `CC-IR003-ISO-PLAN-20261001` through its required review. The shared timezone migration and IANA dataset pass repeatable local checks, and Lane C passes numeric latency limits, but its frozen ISO plan rule still fails.
2. Complete independent shared DBM-002 review, a fresh passing IR-003 Lane C manifest, generated types, and onboarding integration. Keep Lane D isolated until that boundary closes.
3. Review and extend the isolated `impl/ir005-invitations` branch: its schema and TOP-002/003 candidates pass basic local issue/accept/replay checks but have no IR-005 entry gate, race/expiry/revoke verification, or browser integration. Complete Invitation and Membership lifecycle with two-account/two-Group negative tests, then Group selection and the five scoped product features. Do not connect the legacy name-based tabs to the authenticated shell until their replacements pass.

## Current known risks

- IR-003 Lane C has three local diagnostic repetitions below its numeric limits but fails the frozen ISO lookup index-plan rule. No passing final Lane C manifest exists.
- The default `test:unit` script now discovers all unit tests, and historical static checks are scoped to their own exit state. Later packet coverage still needs review as it is implemented.
- The currently reachable authenticated UI is an unavailable screen. Legacy hooks use global/name-based data access and the old tickets bucket is public; those files are not proof of a usable multi-user workspace.
- Local build/test results do not establish deployment state. Confirm the target environment, migration application, and operational ownership before release.
