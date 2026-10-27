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

All four feature streams are merged into `v2`. Every row below passed on the combined branch.

| Capability | Proof |
| --- | --- |
| Sign up, verify email, sign in, reset password | `npm run test:journey:verify-email` (real Mailpit round trip) |
| Create a Trip (atomic `bootstrap_group`); switch between Trips; Member sees only joined Trips | `npm run test:journey:live` |
| Invite one recipient by email, accept, join as Member; expiry, revoke, races, last-Owner, transfer, leave/remove, archive | `npm run test:ir005:candidate` (14 checks) |
| **Trip tab:** itinerary by day in Trip time plus viewer's local time, past/live/next status, next-flight countdown, add/edit/delete with stale-edit warning, display-only "who's on this" (`trip_events` 024, audience 031), live updates | `npm run test:db:events`, `npm run test:trip:db`, `TRIP_WEB_PORT=4181 npm run test:trip:live` |
| **Todos tab:** one shared list per Trip, server-stamped "done by", guarded rename, clear completed, live without stealing focus (030) | `npm run test:trip:db`, `npm run test:trip:live` |
| **Split tab:** exact-decimal expenses with several payers, equal (deterministic remainder) or exact shares, FX snapshot per expense, balances, settle-up suggestions, settlements, creator/Owner edit and delete, live updates (040–041) | `npm run test:split:db`, `TRIP_WEB_PORT=4182 npm run test:split:live`, split unit tests |
| **Scan tab:** private `trip-documents` bucket, user-scoped `parse-document` Edge Function (Claude), editable draft, confirm into itinerary, signed-URL view, uploader/Owner delete (050) | `npm run test:scan:db`, `TRIP_WEB_PORT=4183 npm run test:scan:live` (stub parser) |
| **FX tab:** two-way converter with live reference rates, cached offline fallback, Bali price guide only for Bali Trips | `npm run test:fx:unit`, scan-fx live test |
| **Crew tab:** roster, pending/past invitations with revoke, make Owner/Member, transfer ownership, remove, leave (last-Owner guarded), archive and restore (060) | `npm run test:crew:db`, `TRIP_WEB_PORT=4184 npm run test:crew:live`, `npm run test:crew:browser` |
| App frame: friendly auth, Create Trip with timezone/currency pickers, invite screens with clear actions, compact header with Trips/Account sheets and a fixed bottom tab bar | mocked browser tests (`tests/browser/ir-003/app-frame.spec.ts` etc.), `npm run test:ui:tour` screenshots |
| All migrations 001–060 apply as hosted `postgres` | every database suite applies them that way |

Unit tests: `npm run test:unit`. Mocked browser tests: `PLAYWRIGHT_BROWSERS_PATH=0 npx playwright test tests/browser/ir-003 tests/browser/ir-004 tests/browser/ir-005 tests/browser/crew tests/browser/integration/new-user-candidate.spec.ts`.

## Not done yet

- **Nothing after migration 009 is deployed.** The hosted project has 001–009 only (so the old v1 app cannot read its data any more). Deploying needs: migrations 010–060, the `parse-document` function plus its `ANTHROPIC_API_KEY` secret, Auth site/redirect URLs for the web host, and the frontend build with `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`.
- **Bali data import** (one-time script).
- Real Claude extraction has only run with the test stub (no API key locally).
- Smaller gaps: percent/weighted split modes; one-step "transfer and leave"; invitation list shows the newest 50; archived Trips can be restored but not browsed; roster is not live; no per-member rate limit on document parsing.

## Known issues

- Realtime DELETE notices are not filtered by RLS (Supabase limitation): a subscriber who knows a Trip id can learn that a row id was deleted, never its content. The app only uses them as a "reload" signal.
- Members cannot read `group_configuration_display_currencies`, so the FX tab falls back to a currency picker (one harmless 403 per visit).
- The legacy public `tickets` bucket still exists with public read; make it private (or drop it after the Bali import).
- `npm run test:ir003:evidence` (old IR-003 Lane C gate) fails its provenance check because migration 011 changed for hosted deployability. Retired with the gate process.
- `tests/browser/current-ui-boot.spec.ts` still expects the old persona picker and page title.
- Legacy `src/tabs`, `src/hooks`, `src/components` (except `ui/`) are unreachable reference code; do not wire them back in.

## Local development

- `npm run db:start` starts a local Supabase with every migration and writes `.env.development.local`; then `npm run dev`. `npm run db:types` regenerates `src/lib/database.types.ts`; `npm run db:stop` stops it.
- `npm run test:ui:tour` screenshots every main screen on a disposable stack (`TRIP_TOUR_DIR` sets the folder) — use it to review UI changes.
- Tests need the `docker` and `psql` commands. In the `claude-box` distrobox, `docker` forwards to the host daemon.
- New suites should use `tests/support/local-stack.mjs` (own `projectId` and `basePort`) and `tests/support/db-fixtures.mjs` (`createUsers`, `createTrip`, `sqlAs`); `tests/database/trip-events/verify-trip-events.mjs` is the template.

## Workstream ranges (keep for future parallel work)

| Area | Migrations | Stack base port | Preview port |
| --- | --- | --- | --- |
| Shared base | 001–029 | 58500 | 4173 |
| Trip itinerary + Todos | 030–039 | 58600 | 4181 |
| Split | 040–049 | 58700 | 4182 |
| Scan + FX | 050–059 | 58800 | 4183 |
| Crew | 060–069 | 58900 | 4184 |
