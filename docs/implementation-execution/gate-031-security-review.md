# GATE-031 — Independent Security Review

## Decision

- Reviewer role: Independent GATE-031 Security reviewer
- Review timestamp: 2026-08-20T20:30:44Z
- Scope: frozen `IR-003` / `TOP-001` / `DBM-014` pre-authorisation package and
  the controlled GATE-031 Owner-evidence package.
- Decision: **SECURITY APPROVAL GRANTED**

This is a Security-lane approval of the frozen package only. It is not a Data
or Architecture approval, a GATE-031 satisfaction decision, an IR-003
authorisation, or authority to create migration `010`, implement/call TOP-001,
mutate a database, deploy, or cut over.

## Inputs reviewed

- `docs/architecture/security-model.md` §§4–5 and 9–11
- `docs/architecture/auth-groups-and-invitations.md`
- `docs/implementation-execution/packets/IR-003-atomic-group-bootstrap.md`
- `docs/implementation-execution/trusted-operation-register.md`
- `docs/implementation-execution/database-migration-register.md` (DBM-014)
- `docs/implementation-execution/gate-ledger.md` and
  `docs/implementation-execution/gate-031-evidence-preparation.md`
- `docs/implementation-execution/ir-007-verification.md`,
  `docs/implementation-execution/ir-008-verification.md`, and the IR-007/008
  authorisation records
- `docs/implementation-execution/change-control.md`, including
  `CC-IR003-20260812-preauthorisation-freeze` and the accepted
  `DCC-IR003-FREEZE-001` status synchronisation
- controlled package `GATE-031-IR-003-CONTROLLED-20260812`, reviewed outside
  Git without rendering protected identity or configuration values.

## Security findings

### Authority and caller boundary — PASS

The frozen TOP-001 contract starts with `auth.uid()`, confirms the current
`auth.users` verified-email state, resolves exactly one
`profiles.auth_user_id` match, and then uses the resolved `profiles.id`. The
physical signature has no actor parameter and forbids actor, Owner, role,
Profile, Auth User, Group Member, and equivalent authority fields in either
request object. Group/target identifiers are not authority. The contract
forbids generic operation proxies and browser service-role use.

The caller boundary revokes EXECUTE from `PUBLIC`, `anon`, and `service_role`
and grants it only to `authenticated`. It grants neither direct protected-table
writes nor executor-role membership to that caller. Invocation remains subject
to session, verification, Profile, request-validation, and idempotency checks.

### SECURITY DEFINER confinement — PASS

The sole proposed elevated owner is `ir003_top001_executor` with `NOLOGIN`,
`NOINHERIT`, and `BYPASSRLS`. Its frozen privilege matrix has no memberships,
login, database/schema/table ownership, DDL, `CREATE`, broad grants, storage,
realtime, legacy-table, or proxy capability. The function has a fixed
`pg_catalog` search path and qualified `auth`/`public` references.

`BYPASSRLS` is narrowly justified for the one forced-RLS atomic bootstrap and
is bounded by the exact column/object grants in the frozen matrix. It does not
become general database capability: it confers no object privilege and the
executor has only the reads/inserts/updates required by TOP-001.

### RLS, transaction, and replay posture — PASS

The verified IR-007 baseline retains forced RLS and denies ordinary direct
writes. The frozen future-owner evidence contract requires unverified and
forged-actor denial, cross-Group substitution denial, inactive/non-authorised
path denial where applicable, same-key race handling, and injected-failure
rollback with no partial privileged state.

TOP-001 idempotency is bound to `TOP-001`, the server-validated Profile, and
request UUID, with a canonical validated-request fingerprint. It prevents
caller actor substitution and cross-actor replay; same-key changed payloads
return a safe conflict; a primary-key race converges to one Group/result; and
pending state cannot commit. The result is limited to outcome, Group ID, and
request ID; it discloses no Auth/Profile/member/role/audit or internal database
detail.

### Controlled Owner evidence and secret safety — PASS

The protected package records one explicitly selected intended Owner, Auth-row
existence, confirmed-email condition, exactly-one Profile linkage, and the
Product Owner-designated target provenance. Its manifest predicates pass for
all of those conditions and for Product approval. The controlled directory is
mode `0700`; every reviewed file is mode `0600`; it is outside the repository.
The selected Auth/Profile identifiers were checked as absent from Git without
rendering them. Controlled package secret-safety predicates report no retained
credential material; no password, browser elevated key, service key, or token
was rendered or added to Git.

## Status and residual boundary

This approval does not change shared status: **GATE-031 remains Not satisfied**
and **IR-003 remains Not authorised**. Data and Architecture approvals, then a
separate GATE-031 satisfaction decision, remain required. Migration `010` is
absent; TOP-001 is not implemented or callable; no remote mutation,
deployment, cutover, or push occurred in this review.

## Verification

- `git diff --check` passed for the completed review record.
- `npm run test:unit` passed: 27/27 tests.
- `node --test tests/unit/ir-008-trusted-operation-contract.test.mjs` passed:
  4/4 tests, including the actor-free frozen TOP inventory and absence of
  physical TOP/migration `010`.
- `npm run test:ir007:static` had 10/11 passing assertions. Its sole failure
  is the already-known historical changed-path allow-list: it compares all
  later IR-008/W3 paths against the IR-007 baseline. The IR-007 migration,
  forced-RLS, grant, search-path, and service-role assertions passed. This is
  not a new regression introduced by this review.
- `npm run test:types` could not run because `tsc` is not installed in this
  worktree (`command not found`); no dependency installation or package change
  was authorised for this documentation-only review.
- A focused diff secret scan found no credential, token, key, UUID, or email
  pattern in this record. `gitleaks` is not installed, so no tool-specific
  scan was available.

## Cross-Wave declaration

None. This review is W3 / GATE-031 documentation only and does not change
W2/IR-007 implementation or evidence ownership.
