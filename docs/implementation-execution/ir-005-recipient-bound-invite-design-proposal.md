# IR-005 recipient-bound invite sheet correction

Status: Product direction confirmed by the user on 2026-10-02: require the friend's email and restrict acceptance to that verified email. The isolated screen amendment still needs design/security review and updated visual export before it is a locked screen change or IR-005 exit.

## Conflict found, 2026-10-02

Accepted ADR-0007 and `auth-groups-and-invitations.md` §§8–9 require one intended recipient, a verified email match, and single-use atomic acceptance. Accepted `MBR-03` says “No email field” and its clean export says “Anyone with the link can join as a Member.” Those statements would let possession of the link establish membership and cannot be implemented together with the accepted security rule. Automatic email delivery being deferred does not remove the need to identify the recipient when the Owner creates the link.

## Bounded screen correction

- Keep the existing `MBR-03` sheet, Screen ID, visual tokens, and manual Copy/Share action. Add one required **Friend’s email** field before **Create link**. Validate only basic format in the browser; the trusted TOP-002 operation normalizes and validates the recipient.
- After server-confirmed issuance, show the link once in the existing copy/share region. Replace “Anyone with the link can join” with: **“Only the person who verifies this email can join with this link. It works once and expires after 7 days.”** Keep “Send it however you like; automatic email delivery is not built.”
- Show the recipient address in the confirmation so the Owner can check it before copying. A lost first response leads to a safe issued-status result without redisplaying the secret; the Owner can revoke and create a new link.
- Retain the existing `INV-01` signed-out screen’s minimal inspected Trip context. The link never authenticates a recipient; after signup/login the trusted accept operation must match the current verified email.
- Change the `MBR-04` management row to show recipient, logical status, expiry, and Revoke for a valid Pending link. It never displays a plaintext link or verifier after initial issue.

## Review and evidence needed

The user approved the recipient-email product direction on 2026-10-02. The isolated `MBR-03`/`MBR-04` screen contract now records the correction and explicitly marks the old exports as stale. Design review must approve field placement and text; security must confirm inspection disclosure; database review must confirm TOP-002/003 inputs and one-time secret handling. Update the clean/annotated exports or accepted design mapping, interaction notes, and IR-005 traceability through the existing change-control path before treating this as a locked UI. Two-user browser evidence must include wrong account, verification continuation, replay, expiry, and revoked states.
