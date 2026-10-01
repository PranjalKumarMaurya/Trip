# IR-005 Invitation implementation draft

Status: isolated implementation design, not an IR-005 exit or release authority. This branch may prepare code and tests while IR-003's independent exit and the W3 packet gate remain open. The accepted IR-005 packet and Auth/Group/Invitation architecture control any final integration.

## First user journey

1. A verified, active Owner of an active Trip Group enters one recipient email and creates a seven-day, ordinary-Member Invitation. The server derives the actor from `auth.uid()`, validates current Group membership and role, and commits the Invitation and audit together.
2. The server returns one opaque proof to the Owner. The browser builds a manual-share URL with the proof in the URL fragment so it is not sent as a request path/query or referrer. No plaintext proof is written to audit, logs, analytics, realtime, or a Group list response.
3. The recipient opens the URL. Before Authentication the app shows only a generic continuation. After signup/login and verified email, the trusted accept operation checks the proof, matching recipient, current Group state, expiry, status, and prior membership inside one transaction. It activates an ordinary Member and consumes the proof together.
4. Expired, revoked, reused, wrong-recipient, cross-Group, and conflicting-membership attempts return no authority. An inactive membership for the same Auth User can reuse its stable `group_members.id`. A legacy unclaimed Participant is never attached by the Invitation.

## Proposed persistence and secret strategy

- `public.invitations` is Group-owned and has recipient email normalized by the server, creator membership, expiration, status, proof verifier, acceptance/revocation provenance, timestamps, and no plaintext proof. Direct browser access is denied with forced RLS and no broad table policy.
- The create request has an immutable fingerprint and one `(operation, validated actor, Group, request UUID)` idempotency row. The same request returns the same safe result; a changed fingerprint conflicts. Concurrent same-key calls cannot issue two Invitations.
- Use a high-entropy server-side HMAC key in a private relation accessible only to a dedicated no-login Invitation executor. Derive an opaque proof from the validated actor, Group, and request UUID, then store only its verifier on the Invitation. This permits exact same-key retry without storing the plaintext proof. Key generation, grants, backup, rotation, and compromise consequences require specialist review before this strategy is accepted.
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

Migration `012_ir005_invitation_foundation.sql` applied after migrations 001–011 in a disposable Supabase stack. The probe checked the 32-byte private key, no browser/service-role table read privileges, a no-login dedicated executor, one pending Invitation per Group and recipient, and rejection of cross-Group request and acceptance references. It did not test callable operations or the user journey. The migration remains an isolated candidate pending the IR-005 entry gate and specialist review.
