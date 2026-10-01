# Disposable new-user journey candidate

Status: isolated integration candidate, 2026-10-02. This branch combines IR-003 Lane D and isolated IR-005 work for testing only. It does not grant either packet exit, authorize migrations 022–023, or establish release readiness.

## Executed evidence

- `npm run test:ir005:candidate` applied migrations 001–023 in a fresh disposable stack and passed the two-account/two-Group lifecycle, inspection, Owner list, current-Group access, expiry, races, rollback, and cleanup checks. The candidate current-Group RPC returns only the verified caller's active, non-archived memberships and role; anon execution is denied.
- `npm run test:journey:live` launched a separate disposable Supabase API/Auth/DB stack, applied migrations 001–023, and used two independent browser contexts with real signup and RPC calls. The Owner created Goa, issued one recipient-bound link, the recipient signed up and accepted it, the recipient reached Goa as Member without Owner invitation controls, and the Owner created a second Group and switched between both Trips. The second Group remained absent from the Member's Group list. The stack was removed. The passing runs used automatic email confirmation; this does not prove the email verification round trip.
- The combined mocked browser checks cover IR-003 onboarding and IR-005 invite entry, and the unit suite passes after updating one historical static assertion to inspect the current membership read instead of the earlier `groups` existence query.

## Issue found during live execution

The first live browser run stopped in the Auth error screen after signup. `authSession.ts` filters its Profile read by `auth_user_id`, but migration 009 granted `authenticated` column SELECT only on `id` and `display_name`. The mocked Auth browser test did not exercise PostgreSQL column privileges. Integration-only migration 023 grants SELECT on `auth_user_id` under the existing own-Profile RLS policy. The disposable database now verifies an actor can filter its own Profile and cannot read another actor's Profile; the subsequent live journey passed. This grant needs IR-004/IR-007 authority and independent review before integration.

## Remaining proof

IR-003 ISO plan change control and independent exit; IR-005 entry, schema/security/design review and refreshed recipient-bound invite exports; generated types replacing temporary RPC casts; real email verification continuation; wrong-recipient, revoked, expired, removed-member and browser retry journeys against the live API; full Group access/storage/realtime work; Trip/Todo/Scan/Split/FX conversion; accessibility and release-like two-Group recovery evidence. The journey branch is not a deployment source.
