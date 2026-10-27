# Status

Living status for the multi-user Trip app. Update it in the same commit as the work it describes.

## How we work (decided 2026-10-27)

- **Lightweight process.** Keep the accepted architecture and security model, but add no new gate, authorisation, evidence-manifest, or change-control documents. Each change ships with passing tests and a short update here.
- **One Group = one Trip.** Supabase Auth identifies the user; an active `group_members` row gives Trip access; `group_members.id` is the person's identity in every Trip record.
- **Todos are shared with the whole Trip**, not private per person.
- **Old Bali data:** a simple one-time import script at the end, not the 19-stage migration plan.
- AI tab, paid plans, Google login, and automatic invite email stay out of the first release.
- Everything under `docs/architecture`, `docs/implementation-execution`, and `docs/ui-*` is the historical design record: use it for intent and screen detail, not as process to follow.

## Works now (verified locally, 2026-10-27)

| Capability | Proof |
| --- | --- |
| Sign up, verify email, sign in, reset password | `npm run test:journey:verify-email` (real Mailpit round trip) |
| Create a Trip (atomic `bootstrap_group`) | `npm run test:journey:live` |
| Invite one recipient by email, accept, join as Member; expiry, revoke, races, last-Owner, transfer, leave/remove, archive | `npm run test:ir005:candidate` (14 checks) |
| Switch between Trips; Member sees only joined Trips | `npm run test:journey:live` |
| Trip workspace tab bar; Crew tab with roster and Owner invite form | mocked browser tests + live journey |
| Shared Trip itinerary table `trip_events` (migration 024): Trip isolation, member-only writes, no creator impersonation, removal cuts access | `npm run test:db:events` |
| All migrations 001–024 apply as hosted `postgres` | every suite above applies them that way |

Unit tests: `npm run test:unit`. Mocked browser tests: `PLAYWRIGHT_BROWSERS_PATH=0 npx playwright test tests/browser/ir-003 tests/browser/ir-004 tests/browser/ir-005 tests/browser/integration/new-user-candidate.spec.ts`.

## Not done yet

- Trip itinerary, Todos, Split, Scan, and FX tabs are placeholders.
- Crew tab has no revoke/remove/leave/transfer/archive UI (the database functions exist).
- Nothing after migration 009 is deployed. The hosted project has 001–009 only, so the old v1 app cannot read its data any more.
- Bali data import.

## Known issues

- `npm run test:ir003:evidence` (old IR-003 Lane C gate) fails its provenance check because migration 011 changed for hosted deployability. Retired with the gate process.
- `tests/browser/current-ui-boot.spec.ts` still expects the old persona picker.
- Legacy `src/tabs`, `src/hooks`, and the public `tickets` bucket are unreachable and not secure; do not wire them back in.

## Local development

- `npm run db:start` starts a local Supabase with every migration and writes `.env.development.local`; then `npm run dev`. `npm run db:types` regenerates `src/lib/database.types.ts`; `npm run db:stop` stops it.
- Tests need the `docker` and `psql` commands. In the `claude-box` distrobox, `docker` forwards to the host daemon.
- New suites should use `tests/support/local-stack.mjs` (own `projectId` and `basePort`) and `tests/support/db-fixtures.mjs` (`createUsers`, `createTrip`, `sqlAs`); `tests/database/trip-events/verify-trip-events.mjs` is the template.

## Parallel workstreams

| Stream | Branch | Migrations | Stack base port | Preview port |
| --- | --- | --- | --- | --- |
| Trip itinerary + shared Todos | `feat/trip-todos` | 030–039 | 58600 | 4181 |
| Split: expenses, payers, shares, settlements | `feat/split` | 040–049 | 58700 | 4182 |
| Scan (private storage) + FX | `feat/scan-fx` | 050–059 | 58800 | 4183 |
| Crew management UI | `feat/crew` | 060–069 | 58900 | 4184 |
