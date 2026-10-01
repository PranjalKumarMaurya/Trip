# IR-005 Invitation implementation draft

Status: isolated implementation design, not an IR-005 exit or release authority. This branch may prepare code and tests while IR-003's independent exit and the W3 packet gate remain open. The accepted IR-005 packet and Auth/Group/Invitation architecture control any final integration.

## First user journey

1. A verified, active Owner of an active Trip Group enters one recipient email and creates a seven-day, ordinary-Member Invitation. The server derives the actor from `auth.uid()`, validates current Group membership and role, and commits the Invitation and audit together.
2. The server returns one opaque proof to the Owner. The browser builds a manual-share URL with the proof in the URL fragment so it is not sent as a request path/query or referrer. No plaintext proof is written to audit, logs, analytics, realtime, or a Group list response.
3. The recipient opens the URL. Before Authentication the app shows only a generic continuation. After signup/login and verified email, the trusted accept operation checks the proof, matching recipient, current Group state, expiry, status, and prior membership inside one transaction. It activates an ordinary Member and consumes the proof together.
4. Expired, revoked, reused, wrong-recipient, cross-Group, and conflicting-membership attempts return no authority. An inactive membership for the same Auth User can reuse its stable `group_members.id`. A legacy unclaimed Participant is never attached by the Invitation.

## Proposed persistence and secret strategy

- `public.invitations` is Group-owned and has recipient email normalized by the server, creator membership, expiration, status, proof verifier, acceptance/revocation provenance, timestamps, and no plaintext proof. Direct browser access is denied with forced RLS and no broad table policy.
- The create request has an immutable fingerprint and one `(operation, validated actor, Group, request UUID)` idempotency row. A changed fingerprint conflicts. Concurrent same-key calls cannot issue two Invitations.
- Generate 32 random bytes inside the trusted issue operation; return the opaque proof only in that successful first response and store only its verifier. A replay returns the committed Invitation status without the proof. If the first response is lost, the Owner can revoke and create a new Invitation. This follows the accepted UI rule that links are never redisplayed after issue, including through retry.
- A new Invitation for the same recipient requires the prior Pending record to be expired or revoked in the same serialized operation. No unbounded live duplicates. Administrative list views exclude proof/verifier material.

## Ordered code and evidence

1. Freeze the physical schema, HMAC/expiry policy, executor grants, role/Owner locks, audit result, and safe RPC shape through IR-005 database/security review.
2. Implement TOP-002 create and TOP-003 accept with isolated two-account/two-Group fixtures, replay/race/unknown-completion/injected-failure tests, and secret-safe evidence.
3. Implement revoke and TOP-004–007 role, transfer, deactivate/leave, archive/restore lifecycle with last-active-Owner and stale-membership tests. Make acceptance and archive/revoke races settle to one valid state.
4. Implement manual-share UI, safe URL-fragment continuation through signup/recovery, membership-aware Group routing, and accessibility states. No invitation state appears before the owning transaction commits.
5. Integrate only after the IR-003 gate and independent IR-005 verification. Run two-account/two-Group browser and database journeys before exposing the path.

## Nonnegotiable negative cases

Wrong recipient, unverified email, unauthenticated caller, ordinary Member creating a link, removed/inactive Owner, archived Group, malformed/expired/revoked/used proof, duplicate live recipient, changed-payload same key, concurrent acceptance, cross-Group target substitution, last-Owner removal, and direct table/proof-verifier access must all deny without partial membership, audit, or Invitation state.

## Local schema probe, 2026-10-02

The current migration 012 applied after migrations 001–011 in a fresh disposable Supabase stack. The probe checked no browser/service-role table read privileges and a no-login dedicated executor. The earlier schema probe also rejected duplicate Pending Invitations and cross-Group request and acceptance references. A contract review removed the HMAC key so an idempotent retry cannot redisplay the link.

Migration 013 is an isolated TOP-002 candidate. In the same disposable stack, a verified active Owner created an Invitation and received a 64-character proof on the first response. Exact replay returned `already_completed` without a proof. Changed-payload same-key, duplicate Pending recipient, ordinary Member creation, unverified Owner, archived Group, and direct browser table-read attempts were rejected; no extra Invitation, request, or audit row was left by the negative cases. Anon and service-role execute privileges on the public RPC were absent. No plaintext proof was printed in evidence. These are local candidate checks, not concurrency, injected-failure, performance, two-Group, browser, or independent specialist verification. The candidate migrations remain isolated pending the IR-005 entry gate.

Migration 014 is an isolated TOP-003 candidate. A fresh disposable database applied migrations 001–014. In local separate-transaction calls, an Owner issued a proof, a different authenticated recipient was denied, the intended verified recipient accepted and became one active ordinary Member, exact retry returned a safe completed status, and replay with a new request ID was denied. The accepted row, two active Members, two idempotency rows, and issue/accept audit rows matched. Reactivating that recipient after inactivity preserved the original `group_members.id` and restored the ordinary Member role. One probe script initially hit a temporary test-table permission error; it was corrected and rerun successfully. This is not yet race, expiry, revoke, archive, injected-failure, two-Group, browser, or specialist exit evidence.

A follow-up review found that transaction-start `now()` could treat an Invitation as unexpired after waiting for a Group lock. Migrations 013–014 now use `clock_timestamp()` after the relevant lock. In a fresh disposable stack, a transaction begun before expiry waited past the deadline; acceptance was denied, with no new Member or TOP-003 request. Migration 015 adds an isolated Owner-only revoke candidate with a keyed request and the same Group-first lock order. A non-Owner revoke, accepted-after-revoke, and wrong-Group revoke were denied. Exact revoke retry was safe. In a two-Group fixture the recipient joined only the Group named by the valid Invitation. No plaintext proof was printed. Injected-failure, performance, browser, and independent specialist exit evidence remain open.

The repeatable `npm run test:ir005:candidate` command now builds migrations 001–015 in a disposable stack, exercises two accounts/two Groups, wrong-recipient and role denials, one-time proof display, replay, expiry after transaction start, revocation, concurrent accepts, and an accept-versus-revoke race. It also temporarily denies the executor's audit insert and verifies that the failed issue leaves no Invitation, request, or audit row. Two full runs on 2026-10-02 passed, including stack cleanup. This is candidate evidence only; it does not establish the full IR-005 matrix, authenticated browser flow, or packet approval.
