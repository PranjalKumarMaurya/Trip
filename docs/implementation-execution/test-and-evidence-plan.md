# Test and Evidence Plan

## Current tooling inventory

The Verified IR-001 capability is present in the repository. `npm run build`
runs `tsc && vite build`; `npm run typecheck`, `test`, `test:types`, and
`test:unit` provide type and Node test-runner controls. `test:db`,
`test:db:failure`, and `test:db:cleanup` use the local Supabase CLI/Docker
harness under `tests/database/`; `test:browser` and `test:browser:failure` use
the repository-pinned Playwright configuration; and `test:evidence:manifest`
writes the evidence manifest. Deterministic-clock and two-account/two-Group
fixtures, packet-specific test/evidence paths, `src/lib/database.types.ts`, and
the `.github/workflows/ir-001-evidence.yml` CI evidence workflow also exist.

This is evidence capability, not authorisation for an unimplemented packet or
a claim that a future packet's test cases have passed. The accepted static
design manifests remain evidence inputs, not a visual-test runner.

## Nine test and evidence families

| Family | Current capability | First owning IR | Required capability / evidence | Consuming gate |
|---|---|---|---|---|
| Deterministic unit/domain | Established by Verified IR-001; future domain coverage remains packet-owned. | IR-001, then IR-014/015 | Exact calculation and pure-state tests; EQ-01, SET-01, USD-01 and FX/time fixtures. | W4 exit, W5 evidence |
| Database and RLS | Established local isolated harness; IR-007 evidence is Verified. | IR-001, then IR-007 | Isolated target/database harness with two accounts, two Groups, lifecycle states, row/object substitution, and audit-safe results. | W1 exit; W2–W4 packet exits |
| Trusted-operation integration | Common contract capability is Verified; no physical TOP execution evidence exists. | IR-001, then IR-003/005/006/008/013/014/015 | Failure injection, transaction, idempotency, replay, race, audit, and reconciliation tests. | W3/W4 exits |
| Browser/application | Established by Verified IR-001; IR-004's bounded browser evidence is Verified. | IR-001, then IR-004/011–015 | Locked Screen/Component flow/state evidence, safe errors, responsive shell, routing/session, and multi-tab cases. | W4 exit; IR-021 |
| Storage and Realtime | Harness capability exists; feature-specific evidence is not established. | IR-001, then IR-009/010/013 | Private object, orphan/reconciliation, current authorization, reconnect, removal, archive, and stale-event cases. | W3/W4 exits |
| Migration and reconciliation | Not established | IR-016 | M01–M18 manifest, count/checksum, quarantine, rerun/idempotency, and source/target reconciliation evidence. | W5 exit; W6 entry |
| Visual/design review | Static accepted exports only; runner not established | IR-021 | Targeted locked visual/state comparison plus documented manual decision; no claim of pixel runner before selection. | IR-021 exit |
| Accessibility / R-02 | Browser capability is established; packet-specific measured R-02 evidence remains required. | IR-001 enables; owning component/flow IR executes; IR-021 rolls up | Automated candidates where selected plus manual browser/device/screen-reader evidence. | Owning packet exit and W5/W7 gates |
| Recovery and release | Not established | IR-017–020 | Rehearsal failure injection, rollback/forward recovery, cutover smoke, monitoring, containment, and retention evidence. | W6/W7 gates |

## IR-003 TOP-001 pre-authorisation evidence freeze

IR-003 has no executed evidence and remains unauthorised. Its later physical
TOP-001 evidence is frozen to the verified local-isolated IR-001 capability and
the IR-007 evidence discipline; this does not reserve a remote project or
authorise Docker/Supabase execution now.

- Lane B owns only the TOP-001 database/contract adversarial matrix: verified
  actor/Profile success; unauthenticated and unverified denial; forged actor
  field rejection; direct-write and cross-Group/substitution denial; atomic
  Group/configuration/display-context/Participant/Owner/audit assertions;
  changed-fingerprint conflict; replay; and same-key race assertions.
- Lane C alone owns stack lifecycle, injected failure, empty-target
  rollback/reapply, concurrency orchestration, performance, immutable
  `artifacts/ir-003/**`, exact cleanup, secret-safety scan, and a write-once
  SHA-256 final manifest. Existing IR-001/002/004/007 evidence is read-only.
- The later fixture is the existing 200-Group, 4,000-active-membership,
  200-inactive-membership, 20-archived-Group, 20,000-audit-row scale extended
  with 20,000 completed synthetic TOP-001 request records. It records one cold
  run, 10 committed warm-ups, 100 distinct calls at 10-way concurrency, and a
  10-way same-key race. The binding limits are p95 <= 40 ms and p99/max <= 75
  ms; plans must follow the packet's index/no-scan/no-spill/no-row-loop rules.
- `DCC-IR003-FREEZE-001` is Accepted and resolves the Lane D design blocker.
  Lane D remains blocked by unsatisfied GATE-031 and separate IR-003
  authorisation. When both pass, it owns only browser/static ONB-01–05/07 plus
  Accepted non-Invitation ONB-06 State A and safe-retry evidence. It must prove
  no Invitation record/link/secret/copy/share behaviour and no reachable
  issued-Invitation ONB-06 State B before IR-005. R-02 remains running-build
  work, not a static completion claim.
- The fresh detached verifier independently re-runs/inspects the authorised
  diff, checksum, object/privilege catalogue, failure/rollback, replay/race,
  performance, types, cleanup, secret safety, and ONB reachability evidence.

The complete future path ownership and artifact schema are in
`packets/IR-003-atomic-group-bootstrap.md` §§8–12. Nothing in this section
satisfies GATE-031, creates a test, or changes the status of a packet/gate.

## Verified IR-001 capability selection

IR-001 selected and verified the following capability without authorising later
packet work. Future packets must re-inspect the current implementation before
using it and follow their own allow-lists.

| Capability | Reason | First owner | Package/dependency impact | Review requirement | Rollback/removal path |
|---|---|---|---|---|---|
| Unit/integration runner | Deterministic calculation and state evidence. | IR-001 | Node test runner plus TypeScript test compilation; exact commands are in `package.json`. | Verified IR-001 capability. | Revert only an authorised capability change; retain accepted evidence history. |
| Browser harness | Locked UI, Auth, modal, responsive, and R-02 behaviour requires a running browser. | IR-001 | Pinned Playwright configuration and `test:browser` scripts. | Verified IR-001 capability; device/assistive-technology coverage remains packet-specific. | Do not retain screenshots with sensitive data. |
| Database/RLS fixture harness | Two-account/two-Group and policy evidence cannot be inferred from client unit tests. | IR-001 | Isolated local Supabase CLI/Docker harness, fixtures, controlled failure, and cleanup scripts. | Verified IR-001 capability; no remote project is implied. | Destroy only exact approved local fixtures under the established cleanup convention. |
| Failure-injection capability | Atomicity, retry, reconciliation, and recovery require controlled faults. | IR-001 | Controlled browser and database failure scripts. | Verified IR-001 capability. | Preserve only redacted, manifest-governed results. |
| Evidence storage and checksum convention | Results need stable, reviewable, secret-free retention. | IR-001 | Manifest writers, SHA-256 records, ignored generated evidence, and retained packet artifacts. | Verified IR-001 capability. | No secret value may enter the repository. |
| CI evidence gate | Later W5/W7 gates need reproducible evidence. | IR-001 | `.github/workflows/ir-001-evidence.yml` with isolated browser/database jobs. | Verified IR-001 capability; later release CI remains unauthorised. | Disable/revert only through an authorised change. |

## Requirement and fixture mapping

| Requirement set | Primary implementation evidence owner | Integrated/release evidence owner |
|---|---|---|
| FP-001–FP-020 | Roadmap owners: IR-004, IR-009, IR-011–015, IR-022 as applicable | IR-021 |
| UI-01–UI-14 | IR-011–015 according to accepted UI traceability | IR-021 |
| TC-001–TC-019 | IR-003–011 and IR-014 according to the roadmap | IR-021; IR-022 retains gate record |
| IPE-AUTH/EVENT/ERR/SCAN/STORAGE/SPLIT/SET/FX/FIN/TIME | Named feature owner in the roadmap | IR-021 |
| Two-account/two-Group fixture | IR-001 creates capability; IR-007/009/010/011 enforce it | IR-021 and W7 smoke |
| Migration fixtures M01–M18 and S01–S19 | IR-016; IR-017–020 consume named stage evidence | W5–W7 gates |
| Finance fixtures EQ-01, SET-01, USD-01 | IR-014 | IR-016, IR-021, IR-017 |
| R-02 | IR-004, IR-010–015 execute applicable checks | IR-021 rollup; W7 release check |

Every retained artifact records requirement/fixture ID, environment category,
precondition, expected and actual outcome, reviewer, consuming gate, checksum
where useful, and failure disposition. The Verified IR-001 capability does not
establish a deployed environment or remove the packet-specific evidence and
authorisation requirements for future work.
