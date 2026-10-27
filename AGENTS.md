# Repository guide

Start with [`docs/STATUS.md`](docs/STATUS.md): how we work, what is verified, what is next, and the parallel workstream ranges. Update it in the same commit as the work it describes.

## Working rules

- Lightweight process: tests plus a short STATUS.md update. Do not create gate, authorisation, evidence-manifest, change-control, or packet documents.
- Report states separately: in code, tested locally, deployed, usable by a new user.
- `docs/architecture`, `docs/implementation-execution`, and `docs/ui-*` are the historical design record. Read only the section you need (`grep -n '^#'` first); they are large.
- Never print `.env*`, keys, or invitation proofs.

## Code map

- `src/App.tsx` → `src/features/auth/AuthBoundary.tsx` routes: auth screens, invitation entry, onboarding (`src/features/onboarding/`), then `src/features/groups/GroupWorkspace.tsx`.
- Each Trip tab lives in `src/features/<tab>/` and takes `TripTabProps` from `src/features/workspace/tripTab.ts` (selected Trip incl. `groupMemberId`, timezone, accounting currency; roster). Tabs remount on Trip switch.
- `src/tabs`, `src/hooks`, `src/components` (except `ui/`), `src/constants` are legacy v1 reference only. They use global name-based data and must not be imported.
- Database: `supabase/migrations/` applied in filename order as `postgres`. Types: `src/lib/database.types.ts` (generated; `npm run db:types`).

## Database conventions

- Every Trip row carries `group_id`; people are `group_members.id`. Deny by default: enable and force RLS, grant only what the client needs.
- Prefer RLS policies plus `SECURITY INVOKER` RPCs. If a `SECURITY DEFINER` function must be owned by a dedicated role, follow migration 013: grant the role to `postgres` and CREATE on `public` around `OWNER TO`, revoke both before `COMMIT`. Never write `TO CURRENT_USER` (crashes supautils). Reach Auth from such functions only via `trip_private.auth_uid()` / `trip_private.auth_users`.
- Membership checks in policies: `group_id IN (SELECT ir007_private.current_active_group_ids())`, Owner-only: `ir007_private.current_active_owner_group_ids()`, caller profile: `ir007_private.current_profile_id()` (migration 009).

## Tests

- `npm run test:unit`; `npm run typecheck`; `npm run build`.
- Database/live suites need `docker` and `psql`; use `tests/support/local-stack.mjs` with a unique `projectId`/`basePort`, and set `TRIP_WEB_PORT` for browser runs in parallel worktrees. `TRIP_DEBUG=1` shows full errors locally.
