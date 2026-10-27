# Status

Living status for the multi-user Trip app. Update it in the same commit as the work it describes.

## How we work (decided 2026-10-27)

- **Lightweight process.** Keep the accepted architecture and security model, but add no new gate, authorisation, evidence-manifest, or change-control documents. Each change ships with passing tests and a short update here.
- **One Group = one Trip.** Supabase Auth identifies the user; an active `group_members` row gives Trip access; `group_members.id` is the person's identity in every Trip record.
- **Todos are shared with the whole Trip**, not private per person.
- **Old Bali data:** a simple one-time import script at the end, not the 19-stage migration plan.
- AI tab, paid plans, Google login, and automatic invite email stay out of the first release.
- Everything under `docs/architecture`, `docs/implementation-execution`, and `docs/ui-*` is the historical design record: use it for intent and screen detail, not as process to follow.

## Works now (verified locally, 2026-10-28)

All streams are merged into `v2`. Every row below passed on the combined branch.

| Capability | Proof |
| --- | --- |
| Sign up, verify email, sign in, reset password | `npm run test:journey:verify-email` (real Mailpit round trip) |
| **Trips home** after sign-in (Ongoing/Upcoming/Past, ＋ create, avatar → Profile, paste an invite link, archived Trips); open, switch, create more Trips | `npm run test:home:live`, `npm run test:journey:live` |
| **Profile:** name, emoji or photo avatar (private `avatars` bucket), change email, change password, home currency, UPI ID, crew info (phone, emergency contact, dietary), sign out, help, privacy/terms placeholders, version, delete account (blocked while last Owner) (025, 072–073) | `npm run test:db:profile`, `npm run test:db:home`, `npm run test:home:live` |
| **Domestic / International Trips:** switch on Create Trip and in Trip settings; domestic Trips use the home currency and hide FX and Split's currency field (025, 071) | `npm run test:db:home`, `npm run test:home:live` |
| **Trip settings** (Owner; read-only details for Members): name, destination, dates, timezone, international, currencies; Trip currency locks once money is recorded; audited (070) | `npm run test:db:home`, `npm run test:home:live` |
| Invite one recipient by email, accept, join as Member; expiry, revoke, races, last-Owner, transfer, leave/remove, archive | `npm run test:ir005:candidate` (14 checks) |
| **Trip tab:** itinerary in Trip time plus your time, past/live/next, next-flight countdown, add/edit/delete, "who's on this", **Crew status strip** (Not left yet / In the air / At … / Heading home / Back home), live updates (024, 031) | `npm run test:db:events`, `npm run test:trip:db`, `npm run test:trip:live`, `npm run test:extras:live` |
| **Todos tab:** one shared list per Trip, server-stamped "done by", live (030) | `npm run test:trip:db`, `npm run test:trip:live` |
| **Split tab:** exact-decimal expenses, several payers, split equally / exact / **percent** / **shares** (server-verified), FX snapshot, balances, settle-up, settlements, creator/Owner edit and delete, **Pay via UPI** deep link with manual "Record payment" (040–042) | `npm run test:split:db`, `npm run test:split:modes:db`, `npm run test:split:live`, `npm run test:split:modes:live` |
| **Scan tab:** private `trip-documents` bucket, user-scoped `parse-document` (Claude), review draft → itinerary, signed-URL view, delete; **daily AI-read limit** 20/person and 100/Trip, tamper-proof (050, 091) | `npm run test:scan:db`, `npm run test:scan:live`, `npm run test:extras:db` (stub parser) |
| **FX tab** (international Trips): converter with live rates and offline cache | `npm run test:fx:unit`, scan-fx live test |
| **Crew tab:** roster with each member's shared details, invitations with **Share… / WhatsApp**, revoke, roles, transfer, remove, leave, archive/restore (060) | `npm run test:crew:db`, `npm run test:crew:live`, `npm run test:crew:browser`, `npm run test:extras:live` |
| **Installable app (PWA):** manifest, icons, app-shell service worker (never caches data or auth), offline notice, update prompt | `tests/browser/pwa/installable-app.spec.ts` |
| Legacy public `tickets` bucket is private; old open policies dropped (objects kept for the Bali import) (090) | `npm run test:extras:db` |
| All migrations apply as hosted `postgres` | every database suite applies them that way |

Unit tests: `npm run test:unit`. All mocked browser tests: `npm run test:browser` (live specs skip themselves). CI: `.github/workflows/ci.yml` (not yet run on GitHub).

## Not done yet

- **Nothing after migration 009 is deployed.** Deploying needs: migrations 010–091 in order, a **custom SMTP provider** (Supabase's built-in email only reaches project team members, 2/hour), Auth site and redirect URLs for the web host, the `parse-document` function with `ANTHROPIC_API_KEY` (optional `SCAN_PARSE_DAILY_LIMIT_MEMBER`/`_TRIP`), and the frontend build with `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (optional `VITE_SUPPORT_EMAIL`).
- **Bali data import** (one-time script; reads the now-private `tickets` bucket with the service role).
- Backups and error monitoring for production.
- Unverified until deploy: real Claude extraction (stub only locally), the change-email round trip, and `delete_my_account` deleting `auth.users` as hosted `postgres` (works locally).
- Smaller gaps: co-members' photo avatars are not shown in Crew/Split yet (hooks exist); one-step "transfer and leave"; invitation list shows the newest 50; archived Trips can be restored but not browsed; roster is not live; privacy/terms text is placeholder.

## Known issues

- Realtime DELETE notices are not filtered by RLS (Supabase limitation): a subscriber who knows a Trip id can learn that a row id was deleted, never its content. The app only uses them as a "reload" signal.
- `npm run test:ir003:evidence` (old IR-003 Lane C gate) fails its provenance check because migration 011 changed for hosted deployability. Retired with the gate process.
- Legacy `src/tabs`, `src/hooks`, `src/components` (except `ui/`) are unreachable reference code; do not wire them back in.

## Local development

- `npm run db:start` starts a local Supabase with every migration and writes `.env.development.local`; then `npm run dev`. Other named stacks (`TRIP_DEV_DB_PROJECT=…`) use their own `.local-stack-<name>` folder and never touch that env file. `npm run db:types` regenerates `src/lib/database.types.ts`; `npm run db:stop` stops it.
- `npm run test:ui:tour` screenshots every main screen on a disposable stack (`TRIP_TOUR_DIR` sets the folder) — use it to review UI changes.
- Tests need the `docker` and `psql` commands. In the `claude-box` distrobox, `docker` forwards to the host daemon.
- Parallel worktrees can run the same suites with `TRIP_STACK_PORT_OFFSET` and `TRIP_STACK_ID_SUFFIX`. Browser specs should use `tests/browser/support/trip-frame.ts` for sign-up, Trips home and Create Trip.
- New suites should use `tests/support/local-stack.mjs` (own `projectId` and `basePort`) and `tests/support/db-fixtures.mjs` (`createUsers`, `createTrip`, `sqlAs`); `tests/database/trip-events/verify-trip-events.mjs` is the template.

## Workstream ranges (keep for future parallel work)

| Area | Migrations | Stack base port | Preview port |
| --- | --- | --- | --- |
| Shared base | 001–029 | 58500 | 4173 |
| Trip itinerary + Todos | 030–039 | 58600 | 4181 |
| Split | 040–049 | 58700 | 4182 |
| Scan + FX | 050–059 | 58800 | 4183 |
| Crew | 060–069 | 58900 | 4184 |
| Home, profile, Trip settings | 070–089 | 58950/58970 | 4186 |
| Extras and hardening | 090–099 | 59000/59100 | 4185 |
