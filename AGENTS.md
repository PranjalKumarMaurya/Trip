# Repository reading map

Use this map to answer questions about the current app without reading the entire documentation tree. Verify the worktree and the relevant code before reporting implementation status; planning, authorisation, and verified running behaviour are different states.

## First pass

1. Run `git status --short`, `git branch --show-current`, and `git log -5 --oneline`. This directory is the main `v2` repo; other `bachelor-trip-app-*` directories may be worktrees at different commits.
2. Read `src/App.tsx`, then follow only its imports to find the reachable UI. The legacy tabs and hooks remain in `src/` but are not necessarily reachable.
3. Read `docs/implementation-execution/README.md` and `implementation-start-handoff.md` for the status summary. Check recent commits, the named packet, its authorisation/verification record, and physical files before treating a summary as current. Historical paragraphs in packet templates may describe the pre-implementation repo.
   For the current delivery sequence, read `docs/implementation-execution/first-usable-release-plan.md`.
4. State separately: designed, authorised, present in code, tested, deployed, and usable by a new user. Do not infer one from another.

## Route by question

| Question | Start here | Confirm in code |
| --- | --- | --- |
| Signup, login, recovery, Profile | `docs/implementation-execution/ir-004-verification.md`; `docs/architecture/auth-groups-and-invitations.md` §§4–5 | `src/features/auth/`, `supabase/migrations/008_ir004_profile_auth.sql` |
| Group creation | `docs/implementation-execution/packets/IR-003-atomic-group-bootstrap.md`; `docs/implementation-execution/authorisations/IR-003-authorisation.md`; recent IR-003 reviews | `supabase/migrations/010_ir003_atomic_group_bootstrap.sql`, `tests/database/ir-003/`, `src/App.tsx` |
| Invites, members, ownership | `docs/implementation-execution/packets/IR-005-membership-invitation-and-owner.md`; `docs/architecture/auth-groups-and-invitations.md` §§8–14 | Main has no integrated invitation flow. The isolated `impl/ir005-invitations` worktree holds draft migrations 012–019, `npm run test:ir005:candidate`, and its implementation draft; check that branch's status before using them. |
| Active Group and trip data | `docs/implementation-execution/packets/IR-011-active-group-and-data-access.md`; `execution-order.md` W3–W4 | `src/App.tsx`, `src/hooks/`, `src/tabs/`, later migrations |
| Release path | `docs/implementation-execution/execution-order.md` W5–W7; `gate-ledger.md` | Current tests, migrations, deployment configuration, evidence |
| Deferred features | `docs/product/deferred-scope-register.md` | Search only the named feature |

## Search efficiently

- Locate files with `rg --files src supabase docs/implementation-execution | rg 'PATTERN'`.
- Search headings and decisions first: `rg -n '^(#|##)|Decision|Status|BLOCKED|Verified' path/to/relevant.md`.
- Search code only in the owning directories: `rg -n 'rpc\(|from\(|channel\(' src/features src/hooks src/App.tsx`.
- Read bounded sections with `sed -n 'START,ENDp' file`; avoid dumping whole packets, manifests, generated types, artifacts, or all documentation into context.
- For a claimed test result, inspect `package.json`: `npm run test:unit` now discovers the unit suite, while database and browser packet tests remain separate commands. Run the relevant direct test when necessary.
- Do not print `.env*`, secrets, invitation tokens, or full evidence artifacts. Check file names and safe status only.

## Current architecture boundary

The target treats one Group as one Trip. Supabase Auth identifies the user; a current Group membership gives Group authority. Invitation acceptance is a separate server operation. Permanent friend networks across multiple Trips are deferred (`DEF-004`). The legacy name-based tabs, global hooks, and public tickets bucket must not be treated as secure multi-user implementation merely because their files exist.

Update this map when the reachable UI, packet status, or directory layout changes. Keep it short and point to authoritative files instead of copying their contents.
