# IR-004 — Auth, Profile and Session

## Status and authority

- Status: **Verified**.
- Wave: W2; serial predecessor of IR-007 only.
- Authorisation: `../authorisations/IR-004-authorisation.md` is the sole
  executable scope, allow-list, DBM, evidence, rollback, and correction
  contract.
- Entry: GATE-012 is satisfied by the recorded W1 exit and this separate
  bounded authorisation. GATE-013 remains required before W3.

## Objective

Establish Supabase Auth as the browser's sole account/session actor, attach one
private structural Profile to one Auth User through DBM-003, and replace active
persona selection with safe Auth entry/session boundaries. This packet is not a
Group or data-access conversion.

## Accepted physical ownership

DBM-003 exclusively owns `supabase/migrations/008_ir004_profile_auth.sql`:
nullable unique `profiles.auth_user_id`, restrictive reference to `auth.users`,
own-Profile RLS select privacy, and the one idempotent Auth-user Profile
creation/backfill trigger. It does not attach old Profiles by names, PINs,
emails, personas, or IDs supplied by a browser; it creates no Group, Member,
Participant, role, Invitation, audit record, or authority. DBM-013 owns the
post-DBM-003 local generated-type refresh at `src/lib/database.types.ts`.

The browser contract is exactly the session state machine and AUTH entry named
by the authorisation. `src/App.tsx` must stop rendering the active legacy
workspace. Its valid linked outcome is the temporary non-authorizing
workspace-unavailable state, not Group onboarding. The UI scope is accepted
`SHL-02`, `AUTH-01`–`AUTH-11`, and `PERM-19`; existing tone/tokens remain
locked.

## In scope

- typed anon Supabase browser client/session handling only;
- sign-up/sign-in, verification/recovery/reset continuation, sign-out, session
  restoration/refresh/expiry, safe offline/server error and loading states;
- one-to-one Profile creation and own-Profile lookup/privacy;
- invalid/missing Profile safety, session-derived actor identity, local cache
  clearing, dedicated local-only test/evidence/rollback/type work; and
- removal of active persona authority from application entry while preserving
  legacy source records for later migration/parity owners.

## Explicit exclusions

No Auth provider configuration or provider-lifetime promise; Google/social
login, MFA, account linking, remote Auth project, deployment, or cutover; no
Group bootstrap/onboarding/selection, first Owner, Membership/Invitation or
lifecycle work, Participant claim, Events/Todos/finance conversion, final RLS,
Storage, Realtime, production data/Bali migration, commercial entitlement, UI
redesign, or IR-003 work.

## Security and compatibility contract

Supabase Auth is authoritative; Profile is presentation only; an unlinked
Profile grants no access; browser persona/name/PIN/email/Profile ID values are
not credentials or actor proof. `group_members.id` remains untouched stable
Participant identity. The restrictive Auth FK prevents silent account/profile
transfer and account lifecycle must preserve history. IR-004 establishes only
the actor and own-Profile privacy boundary. IR-007 still owns full
deny-by-default RLS, membership/role/archive and Group/data substitution
denial; IR-008 owns trusted operations; IR-003/005/006/011 own the later
bootstrap/lifecycle/claim/application outcomes.

## Completion and stop rule

The required implementation/verification commands, immutable IR-004 evidence
stages, tests, rollback proof, correction class, exact permitted paths, and
stop conditions are frozen in the authorisation. IR-004 is Implemented only
after that local-only package passes and Verified only after independent review.
No verifier may append a Group, Invitation, final RLS, remote/production, or
new-dependency requirement. Stop for any such need or an architecture/design
contradiction; return to change control rather than expanding this packet.

## Implementation handoff

`ir004-20260801-auth-profile-session-final` remains the original immutable
local-only implementation record. The separate immutable correction run,
`ir004-20260802-stale-profile-resolution-race-final`, closes
F-IR004-VER-001 with a monotonic Profile-resolution generation and deterministic
deferred-promise race tests for sign-out, expiry, session replacement, and the
normal current-session path. Both records prove DBM-003 apply, one-to-one
constraints, own-Profile privacy, two synthetic linked accounts at the
workspace-unavailable boundary, empty-target rollback and clean reapplication,
byte-identical local type generation, build/type tests, and exact isolated-
resource cleanup. The correction was independently verified at
`71e689932f5c40bcc0f1cc4a42b226331e8b7daa`; see
[`../ir-004-verification.md`](../ir-004-verification.md). Both the original and
corrected evidence records remain immutable. No IR-004 correction remains, and
no verifier may retroactively enlarge the frozen verification criteria. This
status does not authorise IR-003, IR-007, IR-008, W2 exit, deployment, or
cutover.
