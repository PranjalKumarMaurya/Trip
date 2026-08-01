# IR-004 Corrected Independent Verification Record

## Decision

- Decision: **VERIFIED**.
- Verification anchor and correction commit:
  `71e689932f5c40bcc0f1cc4a42b226331e8b7daa`
  (`fix(auth): prevent stale profile session restoration`).
- Corrected finding: `F-IR004-VER-001` — **corrected and independently
  verified**.
- Original immutable evidence run:
  `ir004-20260801-auth-profile-session-final`.
- Corrected immutable evidence run:
  `ir004-20260802-stale-profile-resolution-race-final`.
- DBM-003 migration SHA-256:
  `fd8775bc1a666d01424e4537ef4b5e6715dd2c171199f7d34d12fb5f9be40190`.
- Generated-type SHA-256:
  `8cad1b46109a2ab1e13b036f0e8b24adb07c78dc52db2ca65fdfde06e8fe33b2`.

The accepted independent verification confirmed the correction's monotonic
Profile-resolution generation and authenticated User ID commit check. A pending
Profile lookup cannot restore authority after sign-out or expiry, Account A
cannot replace newer Account B state, the current-session lookup succeeds, and
component cleanup invalidates pending work. The verified boundary still reaches
only `workspace-unavailable`; no legacy workspace is reachable.

The verifier completed the frozen cleanup, database, browser, unit, shared
test, type, typecheck, build, evidence-manifest, and final-cleanup sequence.
It verified immutable evidence hashes, the unchanged migration/type checksums,
secret safety, no overwritten prior evidence, exact final isolated-resource
cleanup, and a clean original worktree. No blocking defect remains.

## Closure

IR-004 and DBM-003 are **Verified**. No IR-004 correction remains. The
original and corrected evidence runs remain immutable. The frozen IR-004
verification contract is complete and may not be retroactively enlarged by a
new verifier criterion. Only a reproducible defect directly violating that
frozen contract can reopen correction or change control.

## GATE-013 evaluation

GATE-013 remains **Required before Wave exit**, not Satisfied. Its frozen
requirements are evaluated without adding a new criterion:

| Frozen requirement | Result |
|---|---|
| Auth actor/session/privacy evidence (IR-004) | Passed and independently verified. |
| Deny-by-default RLS and two-Group evidence (IR-007) | Not yet supplied; IR-007 is Draft and unimplemented. |
| Service-role boundary and trusted-operation rollback evidence (IR-008) | Not yet supplied; IR-008 remains unauthorised and unimplemented. |

W2 therefore remains **In progress**. IR-007 is the next packet to authorise,
but this record does not authorise or implement it. IR-003 remains unauthorised;
deployment and cutover remain unauthorised. W2 is not complete.
