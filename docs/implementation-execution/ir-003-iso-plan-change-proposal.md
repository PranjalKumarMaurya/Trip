# IR-003 ISO lookup plan correction proposal

Status: Proposed, not accepted. Change ID: `CC-IR003-ISO-PLAN-20261001`. This record does not mark Lane C passed or change a release gate.

## Reason and exact evidence

The diagnostic Lane C run `ir003-lanec-2026-10-01T18-17-35-944Z-4cab3685-1a89-4297-be65-17ab749eaba0` applied migrations 010 and 011 and passed Lane B, rollback, and concurrency stages. It retained all three scale repetitions in `06-performance-and-plans.json` before failing on the unchanged plan rule:

| Run | Distinct p95 / p99 | Same-key p95 / max | ISO lookup plan |
| --- | --- | --- | --- |
| 1 | 19.152 / 28.944 ms | 18.281 / 18.281 ms | Sequential scan, 1 row, 0.022 ms |
| 2 | 16.690 / 19.022 ms | 15.567 / 15.567 ms | Sequential scan, 1 row, 0.023 ms |
| 3 | 19.254 / 25.770 ms | 16.799 / 16.799 ms | Sequential scan, 1 row, 0.015 ms |

Each ISO plan had zero temporary read/write blocks. The only violation in each repetition was `iso_validation-expected-index-missing`; the Group configuration lookup used its primary-key index. These are controlled diagnostic results, not a final passing Lane C manifest.

The accepted IR-003 packet §8 currently requires the ISO primary-key path and bans every sequential scan of `iso_4217_currency_codes`. Migration 007 inserts 178 fixed ISO codes. That rule treats PostgreSQL's cost-based choice on this small reference table as a failure even when the indexed key exists and the scan is bounded independently of Group/Member count. These measurements do not justify waiving any latency, authorization, or large-table plan requirement.

An isolated PostgreSQL probe on 2026-10-02 reapplied the actual migration 007 reference table, ran `ANALYZE`, and compared `code = 'INR'` with `code = 'INR' ORDER BY code LIMIT 1`. Both used a sequential scan on the 178-row table. Rewriting the check with ordering and a limit therefore did not provide an index-backed path. The disposable stack was removed after the probe.

## Proposed bounded decision

Permit a sequential scan **only** for the static `iso_4217_currency_codes` lookup when evidence proves all of these conditions in every Lane C run:

1. The ISO primary key exists and is valid; the lookup retains an equality predicate on `code` and returns at most one row.
2. The reference table is bounded to the reviewed ISO set, with its row count recorded; no Group-owned, Profile, Membership, audit, or idempotency relation receives this exception.
3. The observed ISO lookup plan has no temporary-file spill and its actual execution time is recorded. The full TOP-001 distinct and same-key thresholds stay exactly p95 ≤ 40 ms, p99/max ≤ 75 ms.
4. All other required index paths and all other no-sequential-scan checks remain mandatory. A future table growth or changed query shape requires a fresh review.

The plan verifier would report the actual ISO plan as `small-static-sequential-scan-accepted` with row count and timing, rather than falsely label it index-backed. It must still fail if the above conditions do not hold. This changes only the plan acceptance rule and its evidence wording; migrations 007, 010, and 011, the trusted operation, RLS, UI, and performance limits do not change.

## Impact and review

- Owning packet/Wave: IR-003 / W3; first consumer is Lane C and later GATE-016. No W4 or release authority follows from this proposal.
- Paths if accepted: IR-003 packet §8, `tests/database/ir-003/run-top-001-evidence.mjs`, change-control record, Lane C evidence/verification record. No DBM/TOP signature or fixture-scale change.
- Security/data impact: the exception is limited to a public ISO reference lookup, not a tenant-owned relation. Cross-Group and direct-write negative cases, role confinement, and all other plan checks remain unchanged.
- Rollback: restore the original verifier and packet language before relying on Lane C; no schema or data rollback is involved.
- Required decision: Product plus database/migration and security review of this exact exception. Until accepted, preserve the failing result and do not mark IR-003 verified.
