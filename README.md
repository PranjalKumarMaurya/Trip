# Trip

**A group-trip app for friends: shared itinerary, expense splitting, AI ticket scanning and live crew status, in one installable web app.**

Trip started as a private app that [@vibecoderpartha](https://github.com/vibecoderpartha) built for five friends' Bali trip (v1, on `main`). **v2** (the `v2` branch) rebuilds it as a multi-user app anyone can use: real accounts, any number of Trips, invitations, and each Trip's data kept separate inside the database.

> **Status:** v2 runs end to end on a local Supabase stack, with every feature below covered by tests. It is not deployed yet. See [`docs/STATUS.md`](docs/STATUS.md) for the details.

## Features

- **Accounts and Trips:** sign up with email verification and password reset. A Trips home lists ongoing, upcoming and past Trips, and you can create or join as many as you like.
- **Invitations and roles:** invite people by link, and share it with **Share…** or WhatsApp. Owners and Members have different permissions. You can transfer ownership, leave, remove members, and archive or restore a Trip.
- **Itinerary:** events are shown in Trip time and in your own time, with a next-flight countdown. A **crew status strip** shows where everyone is: Not left yet, In the air, At …, Heading home, Back home. Updates arrive live.
- **Shared to-dos:** one list per Trip that records who ticked each item, and updates live.
- **Split:** expenses are stored as exact decimals and can have several payers. Split equally, by exact amounts, by percent or by shares; the server checks the split adds up. Includes balances, settle-up and a **Pay via UPI** link.
- **Scan:** upload a ticket or booking as a PDF or photo. Claude reads it and drafts an itinerary entry for you to review before it's saved. Files stay in private storage, and each person and each Trip has a daily AI limit.
- **FX:** a currency converter with live rates and an offline cache, shown for international Trips.
- **Installable:** works as a PWA (progressive web app, installable from the browser). The app shell works offline, and data and sign-in are never cached.

## How it's built

| Layer | Choice |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, vite-plugin-pwa |
| Backend | Supabase: Postgres, Auth, Storage, Realtime, Edge Functions (Deno) |
| AI | Anthropic Claude API, called only from the `parse-document` Edge Function |
| Tests | Node test runner, Playwright, database suites against a local Supabase |
| CI | GitHub Actions: type checks, unit tests, build, PWA check, mocked browser tests |

Design points:

- **Each Trip is a tenant.** Supabase Auth identifies the user, and membership of a Trip grants access to it. Postgres row-level security (RLS, rules inside the database that decide which rows each user can read or change) enforces this on every Trip record. Tests check the permissions for every role and try cross-Trip access.
- **Server-side trust for money and AI.** The server records who did what (for example, who ticked a to-do), rejects splits that don't add up, and enforces the AI-read limits in the database. The Claude API key never reaches the browser.
- **History lives in migrations.** The schema is built by ordered SQL migrations in `supabase/migrations`. Architecture notes and decision records (ADRs) are in [`docs/architecture`](docs/architecture).

## Run it locally

You need Node 24, Docker and `psql`.

```bash
npm install
npm run db:start     # starts a local Supabase with every migration and writes .env.development.local
npm run dev          # http://localhost:5173
npm test             # unit tests
npm run test:browser # Playwright (mocked specs)
```

`npm run db:stop` stops the local stack. Every test suite is listed in `package.json` and in `docs/STATUS.md`.

## Deploy

1. Create a Supabase project and apply `supabase/migrations` in order.
2. Set up a custom SMTP provider for auth emails, and set the Auth site and redirect URLs for your web host.
3. Deploy the `parse-document` Edge Function with the `ANTHROPIC_API_KEY` secret.
4. Build the frontend with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then host it (for example on Vercel).

## Credits

- **v1:** [@vibecoderpartha](https://github.com/vibecoderpartha) (original app, design and feature set)
- **v2:** [Pranjal Kumar Maurya](https://github.com/PranjalKumarMaurya) (multi-user rebuild)
