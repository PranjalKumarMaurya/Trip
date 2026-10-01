# Shared DBM-002 timezone reference — initial local verification

Date: 2026-10-01. Classification: isolated local implementation probe, **not independent shared exit or IR-003 Lane C evidence**. Candidate: `011_ir002_timezone_reference.sql`, SHA-256 `4eeaaae6e7495fa2d8d74772068d5e317597a3c3f3f3b31e70e35fe2ae2e0984`.

An isolated Supabase CLI 2.105.0 stack (`bachelor-trip-app-tzref-check`, port 57922) received migrations 001–011 in order, with the same platform Storage baseline used by the IR-003 harness. Migrations 007 and 010 retained their historical SHA-256 values. No Travel project or production target was changed.

The repeatable `npm run test:tzref` runner subsequently passed in three separate disposable stacks. It applied migrations 001–010, injected a failure before migration 011 commit and confirmed the private relation was absent, applied 011, checked artifact/collation/validator/role attributes and ownership/direct read and write denial/drift, and confirmed exact stack cleanup. The expanded runs also checked missing-control failure and configuration CHECK rejection. The third result reported database default `en_US.UTF-8` while the reference column and primary key remained `"C"`, `approvedMissing: 0`, `platformAdditions: 598`, and the same artifact/migration checksums above.

## Observed passes

- Migration 011 applied without SQL error after 010.
- Reference relation contained 553 rows. `COPY ... ORDER BY name COLLATE "C"` matched `2026e.txt` byte for byte; SHA-256 `bab362935dbe8fceb73682327aa5a8773917e07406d4cbd0b986808a9fff39d6`.
- `pg_attribute.attcollation` for `name` and the primary-key index `indcollation` both reported `"C"`.
- Validator results: `Asia/Kolkata` true, `asia/kolkata` false, approved alias `Asia/Calcutta` true, malformed/nonexistent name false, NULL SQL NULL.
- Function metadata reported `SECURITY DEFINER`, owner `ir002_timezone_validator`, and `search_path=pg_catalog`. Authenticated callers could execute the validator; authenticated and service-role direct private-relation reads failed.
- Transactional probes confirmed that blocked or missing control state returns only `timezone_reference_unavailable`; an invalid case-only timezone failed the existing `group_configurations` CHECK. Each probe rolled back its mutation.
- Read-only exact-name drift comparison against the local PostgreSQL catalogue found 0 approved names missing from the platform and 598 platform additions. The latter is a warning under the frozen classification; those names are not automatically approved.
- The local host reports tzdata 2026c. Applying the same extraction policy to the IANA 2026c and 2026e source archives produced identical name sets; this says nothing about offset-data equivalence.

## Still required

Review the source/dataset and migration independently, and complete the IR-003 Lane C plan decision and final verification. The renewed Lane B timezone/adversarial suite passed; three Lane C repetitions met numeric latency limits but failed the frozen ISO lookup plan check, so release use remains blocked.
