# Screen contracts

Generated from `manifests/screen-manifest.json`. 462 screens across batches 1–8. This document is derived, not hand-maintained — the manifest is the authority.

IR ownership and wave assignment are derived from the Accepted implementation roadmap. Every screen has one exact IR-001 through IR-022 primary owner, a roadmap-consistent W1 through W7 wave, and related IR items only where a cross-cutting requirement genuinely applies. R-01 is closed; R-02 remains specified for implementation verification.

---

# Board 04

## SHL-01 — Authenticated shell reference

| Field | Value |
|---|---|
| Flow | Shell |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | App shell, sticky header, identity chip, participant chip rail, TabHero, CrewStatus, bottom nav |
| Loading / success / failure | n/a — reference frame |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Reference frame only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Five-tab client shell, unchanged |
| IR owner | IR-011 |
| Wave | W4 |
| Related IR items | IR-004, IR-007, IR-010, IR-021 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/SHL-01-authenticated-shell-reference.png` |
| Annotated export | `screens/mobile/annotated/SHL-01-authenticated-shell-reference-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Recreated from src/App.tsx. Chip rail becomes the Group participant rail; identity chip gains the Group switcher. No sixth tab.

## SHL-02 — Pre-authentication shell

| Field | Value |
|---|---|
| Flow | Shell |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | Pre-auth shell, header title + mono date |
| Loading / success / failure | n/a — reference frame |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Reference frame only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | New routing layer above tab state |
| IR owner | IR-004 |
| Wave | W2 |
| Related IR items | IR-011 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/SHL-02-pre-authentication-shell.png` |
| Annotated export | `screens/mobile/annotated/SHL-02-pre-authentication-shell-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Same column, palette, type and 20px gutters. No tab bar, no identity chip. Content centres on short screens, top-aligns when taller.


---

# Board 08

## AUTH-01 — Sign in

| Field | Value |
|---|---|
| Flow | A Authentication |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | Pre-auth shell, text input, password input, primary button, ghost link |
| Loading / success / failure | Server failure routes to AUTH-09 with input preserved. Offline routes to AUTH-10. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Account session |
| IR owner | IR-004 |
| Wave | W2 |
| Related IR items | IR-007 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/AUTH-01-sign-in-default.png` |
| Annotated export | `screens/mobile/annotated/AUTH-01-sign-in-default-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Email validates on blur, password on submit. Enter submits. Server-confirmed: no navigation until a session exists. Back exits the app.

## AUTH-02 — Sign up

| Field | Value |
|---|---|
| Flow | A Authentication |
| Group | — |
| State | Default, field focused |
| Viewport | 393x852 |
| Components | Pre-auth shell, text input, email input, password input + strength meter, primary button |
| Loading / success / failure | Duplicate address returns to the email field with a plain message; never states whether an account exists elsewhere. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Account creation |
| IR owner | IR-004 |
| Wave | W2 |
| Related IR items | IR-007 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/AUTH-02-sign-up-focused.png` |
| Annotated export | `screens/mobile/annotated/AUTH-02-sign-up-focused-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Three fields only. Name required because it appears next to money. Strength meter advisory, never blocking. Any pending invitation survives into AUTH-03/04.

## AUTH-03 — Email verification required

| Field | Value |
|---|---|
| Flow | A Authentication |
| Group | — |
| State | Pending, resend disabled |
| Viewport | 393x852 |
| Components | Pre-auth shell, caution block, secondary button, mono countdown |
| Loading / success / failure | Nothing arrived -> resend after countdown. Wrong address -> return to AUTH-02 with the email focused. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Email confirmation |
| IR owner | IR-004 |
| Wave | W2 |
| Related IR items | IR-007 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/AUTH-03-email-verification-required.png` |
| Annotated export | `screens/mobile/annotated/AUTH-03-email-verification-required-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Terminal until the link is opened; the app never guesses. Resend rate-limited with a visible countdown and a disabled button.

## AUTH-04 — Email verified, safe continuation

| Field | Value |
|---|---|
| Flow | A Authentication -> D Invitation |
| Group | — |
| State | Success |
| Viewport | 393x852 |
| Components | Pre-auth shell, success pill, invitation card, primary + ghost buttons |
| Loading / success / failure | If the carried invitation is stale, route to the matching invitation-outcome state rather than failing here. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Verified session + carried invitation |
| IR owner | IR-004 |
| Wave | W2 |
| Related IR items | IR-005 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/AUTH-04-email-verified-safe-continuation.png` |
| Annotated export | `screens/mobile/annotated/AUTH-04-email-verified-safe-continuation-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Verification carries the invitation forward but never accepts it. Acceptance stays on board 11, server-confirmed. With no pending invitation this becomes ONB-02.

## AUTH-05 — Forgot password

| Field | Value |
|---|---|
| Flow | A Authentication |
| Group | — |
| State | Sent |
| Viewport | 393x852 |
| Components | Pre-auth shell, email input, primary button, quiet info block |
| Loading / success / failure | Rate limiting reuses the AUTH-03 countdown treatment. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Password reset request |
| IR owner | IR-004 |
| Wave | W2 |
| Related IR items | IR-007 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/AUTH-05-forgot-password-sent.png` |
| Annotated export | `screens/mobile/annotated/AUTH-05-forgot-password-sent-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Identical response whether or not the account exists, and the copy explains why. Back returns to AUTH-01 and focuses the email field.

## AUTH-06 — Reset password

| Field | Value |
|---|---|
| Flow | A Authentication |
| Group | — |
| State | Validation error + disabled + timed |
| Viewport | 393x852 |
| Components | Pre-auth shell, password inputs, strength meter, requirement checklist, disabled primary |
| Loading / success / failure | Expired or reused link routes to AUTH-07. Server failure keeps both fields and shows a form-level error. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Password reset |
| IR owner | IR-004 |
| Wave | W2 |
| Related IR items | IR-007 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/AUTH-06-reset-password-mismatch-disabled.png` |
| Annotated export | `screens/mobile/annotated/AUTH-06-reset-password-mismatch-disabled-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Confirm field validates on blur then on every keystroke. Saving signs out other sessions and lands on AUTH-01 with a success pill.

## AUTH-07 — Invalid or expired reset link

| Field | Value |
|---|---|
| Flow | A Authentication |
| Group | — |
| State | Dead end |
| Viewport | 393x852 |
| Components | Pre-auth shell (no vignette), primary + ghost buttons, quiet info block |
| Loading / success / failure | Send a new link returns to AUTH-05 in its sent state. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Reset token validation |
| IR owner | IR-004 |
| Wave | W2 |
| Related IR items | IR-007 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/AUTH-07-invalid-or-expired-reset-link.png` |
| Annotated export | `screens/mobile/annotated/AUTH-07-invalid-or-expired-reset-link-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

One screen covers invalid, expired and already-used links: the app cannot tell them apart safely and the next step is identical. Deliberately colourless.

## AUTH-08 — Session expiry

| Field | Value |
|---|---|
| Flow | A Authentication / G Permissions |
| Group | — |
| State | Blocking dialog over the app |
| Viewport | 393x852 |
| Components | Modal overlay + 20px sheet, quiet info block, primary button |
| Loading / success / failure | Sign in again returns to the exact tab and re-opens the retained form. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Session invalidation |
| IR owner | IR-004 |
| Wave | W2 |
| Related IR items | IR-007 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/AUTH-08-session-expiry-over-app.png` |
| Annotated export | `screens/mobile/annotated/AUTH-08-session-expiry-over-app-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Only dialog in the package that cannot be dismissed: no backdrop click, no Escape. Focus trapped. Destination and in-progress form preserved and restored after sign-in.

## AUTH-09 — Authentication server error

| Field | Value |
|---|---|
| Flow | A Authentication |
| Group | — |
| State | Server error |
| Viewport | 393x852 |
| Components | Pre-auth shell, form-level error block, inputs with values retained, primary button, mono reference |
| Loading / success / failure | Retry re-submits the retained values. Repeated failure surfaces the reference for support. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Session creation failure |
| IR owner | IR-004 |
| Wave | W2 |
| Related IR items | IR-007 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/AUTH-09-authentication-server-error.png` |
| Annotated export | `screens/mobile/annotated/AUTH-09-authentication-server-error-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Typed values kept. Copy separates our fault from wrong credentials without naming which credential failed. Reference is opaque: no status codes, no provider names.

## AUTH-10 — Offline authentication

| Field | Value |
|---|---|
| Flow | A Authentication / G Permissions |
| Group | — |
| State | Offline + disabled |
| Viewport | 393x852 |
| Components | Pre-auth shell, offline pill, dimmed inert inputs, disabled primary |
| Loading / success / failure | Reconnect restores the default AUTH-01 state with input intact. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Connectivity |
| IR owner | IR-004 |
| Wave | W2 |
| Related IR items | IR-007 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/AUTH-10-offline-authentication.png` |
| Annotated export | `screens/mobile/annotated/AUTH-10-offline-authentication-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Fields stay readable but inert. The primary states what it is waiting for. Reuses the FX offline pill treatment. Re-enables on reconnect; never auto-submits.

## AUTH-11 — Returning user, restoring session

| Field | Value |
|---|---|
| Flow | A Authentication |
| Group | — |
| State | Loading |
| Viewport | 393x852 |
| Components | Real header and bottom nav, Trip loading skeleton |
| Loading / success / failure | Restore failure routes to AUTH-01; a missing Group routes to ONB-02. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Session restore |
| IR owner | IR-004 |
| Wave | W2 |
| Related IR items | IR-007 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/AUTH-11-returning-user-restoring-session.png` |
| Annotated export | `screens/mobile/annotated/AUTH-11-returning-user-restoring-session-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Shell renders immediately; only data is skeletal. Replaces the current cold start. Announced once as loading; pulse dropped under reduced motion.


---

# Board 09

## ONB-01 — Welcome

| Field | Value |
|---|---|
| Flow | B Onboarding |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | Pre-auth-style header (title falls back to Trip), list-choice rows |
| Loading / success / failure | n/a — no failure path on this screen |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | First run with no Group |
| IR owner | IR-003 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/ONB-01-welcome-two-ways-in.png` |
| Annotated export | `screens/mobile/annotated/ONB-01-welcome-two-ways-in-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

The only moment the product name appears without a trip name. Group concept taught in one sentence, no tour. 72px rows; keyboard order create then join.

## ONB-02 — No Groups yet

| Field | Value |
|---|---|
| Flow | B/C Onboarding |
| Group | — |
| State | Empty + disabled nav |
| Viewport | 393x852 |
| Components | App shell, empty state, primary + ghost buttons, inert bottom nav |
| Loading / success / failure | Reached after leaving or being removed from the last Group. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Account with zero Groups |
| IR owner | IR-003 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/ONB-02-no-groups-yet-empty.png` |
| Annotated export | `screens/mobile/annotated/ONB-02-no-groups-yet-empty-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Returning account with no Group. The five tabs stay visible at 40% and are not focusable. Same empty-state rhythm as the current Todo empty state.

## ONB-03 — Create Group

| Field | Value |
|---|---|
| Flow | B/C -> J Configuration |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | Back header, Fraunces name input, text input, two date inputs, currency segmented control, primary button |
| Loading / success / failure | Validation -> ONB-04. Server failure -> ONB-07 with values intact. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group creation + accounting currency |
| IR owner | IR-003 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/ONB-03-create-group-default.png` |
| Annotated export | `screens/mobile/annotated/ONB-03-create-group-default-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

A page, not a sheet: browser back must be able to abandon it. Name is set in Fraunces because it becomes the header title. Currency is chosen here so no expense can precede an accounting currency. Leaving with unsaved input asks first.

## ONB-04 — Invalid Group name

| Field | Value |
|---|---|
| Flow | B Onboarding |
| Group | — |
| State | Validation error x2 |
| Viewport | 393x852 |
| Components | Form-level error block, name input in error, date input in error |
| Loading / success / failure | Errors clear as the user types once a field has failed. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group name + date constraints |
| IR owner | IR-003 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/ONB-04-invalid-group-name-validation.png` |
| Annotated export | `screens/mobile/annotated/ONB-04-invalid-group-name-validation-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Submit-time validation with a form summary plus per-field messages. Focus moves to the name field. Primary stays enabled: a disabled button with no explanation is worse than a readable error.

## ONB-05 — Creating Group

| Field | Value |
|---|---|
| Flow | B Onboarding |
| Group | — |
| State | Action in progress |
| Viewport | 393x852 |
| Components | Dimmed inert form, disabled back, spinner primary, status line |
| Loading / success / failure | Failure -> ONB-07, which states explicitly that nothing was created. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Server-confirmed creation |
| IR owner | IR-003 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/ONB-05-creating-group-in-progress.png` |
| Annotated export | `screens/mobile/annotated/ONB-05-creating-group-in-progress-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Fields dim and become inert, back is disabled, the button states what is happening. Nothing about the destination appears until the Group exists. Double submission impossible. Announced as a polite status.

## ONB-06 — Group creation success

| Field | Value |
|---|---|
| Flow | B -> E Members |
| Group | — |
| State | Lifecycle-staged success — State A: Group created, Invitation not issued; State B: Group created, Invitation issued |
| Viewport | 393x852 |
| Components | State A: confirmed Group header, success pill, explicit noninteractive Invitation-not-issued area. State B: existing Group header, success pill, issued Invitation/link block with copy control, and accepted primary + ghost + secondary action region. |
| Loading / success / failure | Neither state is optimistic. State A follows only a server-confirmed TOP-001 commit; State B follows only a separately server-confirmed TOP-002 Invitation commit. Back does not return to the creation form: the Group already exists. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | State A: atomic Group bootstrap only. State B: separately issued Invitation only; the two trusted operations are not merged. |
| IR owner | Screen identity / State A: IR-003. State B Invitation issuance and issued-state transition: IR-005. |
| Wave | W3 |
| Related IR items | IR-004, IR-005, IR-007, IR-008 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/ONB-06-group-creation-success.png` |
| Annotated export | `screens/mobile/annotated/ONB-06-group-creation-success-annotated.png` |
| Status | Accepted — lifecycle staging amended by `DCC-IR003-FREEZE-001` |

### State A — Group created, Invitation not issued

**Owner and entry.** IR-003 / TOP-001 owns this W3 state. It is entered only
after TOP-001 has committed successfully and returned the server-confirmed
Group result; no optimistic result may render it.

**Visible truth.** The header uses the newly confirmed Group identity/name and
the existing success treatment confirms that the Group was created. The
Invitation area says that no Invitation has been issued yet and is
noninteractive.

**Controls and prohibitions.** There are no interactive controls in this
state. It renders no Invitation link, code, secret, verifier, recipient,
copy/share action, fabricated usable-looking placeholder, or claim that
another Member can join. It introduces no live Group shell, IR-005 action,
IR-006 action, IR-010 action, IR-011 action, or other product continuation.
Back cannot return to the creation form.

**Allowed continuation.** None is introduced by this state: it is a completed
terminal confirmation until a separately authorised IR-005/TOP-002 operation
has actually issued an Invitation.

### State B — Group created, Invitation issued

**Owner and entry.** IR-005 / TOP-002 owns this W3 state. It is entered only
when the Group already exists and TOP-002 has separately committed an
authorised Invitation. IR-003 cannot enter or render State B solely because
TOP-001 succeeded.

**Visible truth and controls.** This is the existing accepted Invitation-issued
ONB-06 behaviour: the Group header, success treatment, real Invitation/link
block, copy action (with its existing two-second confirmed/announced state),
and already accepted share action and Invitation-lifecycle handoff remain
available only here.

**Prohibitions and boundary.** State B does not transfer TOP-002 or any
Invitation verifier, secret, record, link, copy/share behaviour, or lifecycle
ownership to IR-003. It does not transfer the IR-011 live Group shell to either
state.

**Export note.** The existing clean and annotated ONB-06 PNG exports depict
State B only. They remain byte-identical under the design package's SHA-256
binary-asset policy; no export claims to depict State A.

## ONB-07 — Group creation error

| Field | Value |
|---|---|
| Flow | B Onboarding |
| Group | — |
| State | Server error |
| Viewport | 393x852 |
| Components | Form-level error block, inputs with values retained, primary button, mono reference |
| Loading / success / failure | Retry re-submits. Repeated failure surfaces the reference. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Creation failure, nothing persisted |
| IR owner | IR-003 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/ONB-07-group-creation-error.png` |
| Annotated export | `screens/mobile/annotated/ONB-07-group-creation-error-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Copy explicitly states nothing was created — a half-made Group is the fear. Retry is client-side idempotent and the form returns editable with values intact and focus on the summary.

## ONB-08 — Join using invitation

| Field | Value |
|---|---|
| Flow | C -> D Invitation |
| Group | — |
| State | Loading, not optimistic |
| Viewport | 393x852 |
| Components | Back header, mono code input, inline loading block, disabled primary, quiet info block |
| Loading / success / failure | Bad format is owned here. All other outcomes route to the invitation states on board 11. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitation lookup |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/ONB-08-join-using-invitation-validating.png` |
| Annotated export | `screens/mobile/annotated/ONB-08-join-using-invitation-validating-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Manual path for when a link will not open in-app. A pasted URL is reduced to its code. Validation is a lookup only and never accepts. Copy states that nothing happens until the user confirms.

## ONB-09 — First Group setup, participants

| Field | Value |
|---|---|
| Flow | B -> F Claiming |
| Group | — |
| State | Default + empty + unclaimed rows |
| Viewport | 393x852 |
| Components | Member row, unclaimed participant rows with dashed rings, add-name input, primary button |
| Loading / success / failure | Removing a participant with expenses is blocked and explained on board 14. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Participants distinct from accounts |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-003, IR-005, IR-008 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/ONB-09-first-group-setup-participants.png` |
| Annotated export | `screens/mobile/annotated/ONB-09-first-group-setup-participants-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

Where unclaimed participants are created, which is what makes claiming coherent: a participant is a name in the ledger, an account is a login, claiming links the two. The dashed ring is the single grammar for unclaimed across the package.

## ONB-10 — Continue into Trip

| Field | Value |
|---|---|
| Flow | B -> Trip |
| Group | — |
| State | First run, success |
| Viewport | 393x852 |
| Components | Full app shell, Group switcher caret, dashed unclaimed chips, TabHero, timezone toggle, accent prompt, five-tab nav |
| Loading / success / failure | The invite prompt is dismissible and returns via the Group switcher. |
| Validation | See interactionNotes; validation is on blur and on submit, never per keystroke. |
| Permission | Pre-authentication or first-run; no Group permissions apply yet. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Live Group in the existing shell |
| IR owner | IR-011 |
| Wave | W4 |
| Related IR items | IR-003, IR-004, IR-005, IR-007, IR-010 |
| Exceptions | E-01, E-03, E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/ONB-10-continue-into-trip-first-run.png` |
| Annotated export | `screens/mobile/annotated/ONB-10-continue-into-trip-first-run-annotated.png` |
| Status | Accepted — revised against decisions O-01 to O-06 |

The handoff. Everything is the current Trip tab. Three deltas only: a caret on the title, dashed chips for unclaimed participants, one dismissible prompt. Hero copy replaces the persona vibe line, which no longer exists.


---

# Board 10

## GRP-01 — Group switcher closed · one Group

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Read only. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-011 |
| Wave | W4 |
| Related IR items | IR-002, IR-005, IR-007, IR-010 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/GRP-01-group-switcher-closed-one-group.png` |
| Annotated export | `screens/mobile/annotated/GRP-01-group-switcher-closed-one-group-annotated.png` |
| Status | Accepted |

No caret and no menu when the account has a single Group; the header is unchanged from the current app. Tapping the title does nothing.

## GRP-02 — Group switcher open · multiple Groups

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Open / selected |
| Viewport | 393x852 |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Read only. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-011 |
| Wave | W4 |
| Related IR items | IR-002, IR-005, IR-007, IR-010 |
| Exceptions | E-03, E-04 |
| Clean export | `screens/mobile/clean/GRP-02-group-switcher-open-multiple.png` |
| Annotated export | `screens/mobile/annotated/GRP-02-group-switcher-open-multiple-annotated.png` |
| Status | Accepted |

Menu anchored under the header, capped at the column width. Backdrop tap and Escape close it; focus returns to the title. Current Group carries accent fill plus a tick; archived Groups sit in a labelled section.

## GRP-03 — Group switch loading

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Loading |
| Viewport | 393x852 |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Skeleton with reduced-motion pulse fallback (E-05). Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-011 |
| Wave | W4 |
| Related IR items | IR-002, IR-005, IR-007, IR-010 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/GRP-03-group-switch-loading.png` |
| Annotated export | `screens/mobile/annotated/GRP-03-group-switch-loading-annotated.png` |
| Status | Accepted |

Header commits to the new Group; body shows the existing Trip skeleton. All five tabs re-read against the new Group.

## GRP-04 — Group switch failure

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Server error |
| Viewport | 393x852 |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Block-level error at the top of the column, announced politely. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-011 |
| Wave | W4 |
| Related IR items | IR-002, IR-005, IR-007, IR-010 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/GRP-04-group-switch-failure.png` |
| Annotated export | `screens/mobile/annotated/GRP-04-group-switch-failure-annotated.png` |
| Status | Accepted |

Previous Group stays active and intact. Retry is idempotent; a second option offers a different Group.

## GRP-05 — Stale or inaccessible Group

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Permission denied |
| Viewport | 393x852 |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | No implementation detail, no status code. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-011 |
| Wave | W4 |
| Related IR items | IR-002, IR-005, IR-007, IR-010 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/GRP-05-stale-or-inaccessible-group.png` |
| Annotated export | `screens/mobile/annotated/GRP-05-stale-or-inaccessible-group-annotated.png` |
| Status | Accepted |

One state for removed-from-Group, unknown Group and cross-account link. Tabs dim and are inert. Always offers a Group the account can open.

## GRP-06 — Archived Group · read-only

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Read-only |
| Viewport | 393x852 |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Read-only is a Group state, not a role (O-01). Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-011 |
| Wave | W4 |
| Related IR items | IR-002, IR-005, IR-007, IR-010 |
| Exceptions | E-06 |
| Clean export | `screens/mobile/clean/GRP-06-archived-group-read-only.png` |
| Annotated export | `screens/mobile/annotated/GRP-06-archived-group-read-only-annotated.png` |
| Status | Accepted |

Write affordances demote to quaternary rather than disappear. Archived pill under the header is the single explanation. Settling up is closed; balances frozen.

## GRP-07 — Group lifecycle entry · Owner view

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Owner-only block absent for Members. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-011 |
| Exceptions | E-03 |
| Clean export | `screens/mobile/clean/GRP-07-group-lifecycle-entry-owner.png` |
| Annotated export | `screens/mobile/annotated/GRP-07-group-lifecycle-entry-owner-annotated.png` |
| Status | Accepted |

Page, not sheet — it is a destination with children. Members see the top three rows only. No permanent deletion is offered anywhere.

## GRP-08 — Leave Group confirmation

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Destructive confirmation |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | States what is lost and what survives in the ledger before the button. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-011 |
| Exceptions | E-02, E-04 |
| Clean export | `screens/mobile/clean/GRP-08-leave-group-confirmation.png` |
| Annotated export | `screens/mobile/annotated/GRP-08-leave-group-confirmation-annotated.png` |
| Status | Accepted |

Sheet over the settings page. Cancel takes initial focus; focus is trapped and restored on close. Escape and backdrop dismiss are allowed before submission only.

## GRP-09 — Leave Group in progress

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Destructive in progress |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Server-confirmed; no destination is shown yet. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-011 |
| Exceptions | E-02, E-05 |
| Clean export | `screens/mobile/clean/GRP-09-leave-group-in-progress.png` |
| Annotated export | `screens/mobile/annotated/GRP-09-leave-group-in-progress-annotated.png` |
| Status | Accepted |

Primary shows a spinner and its verb; Cancel disables; the sheet cannot be dismissed. Announced as a polite status.

## GRP-10 — Leave Group success

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Success |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Confirmed only after the server answered. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-011 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/GRP-10-leave-group-success.png` |
| Annotated export | `screens/mobile/annotated/GRP-10-leave-group-success-annotated.png` |
| Status | Accepted |

Dismiss lands on the Group switcher, or on ONB-02 if it was the last Group. The Group leaves the switcher in the same beat.

## GRP-11 — Leave Group failure

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Server error |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Membership unchanged. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/GRP-11-leave-group-failure.png` |
| Annotated export | `screens/mobile/annotated/GRP-11-leave-group-failure-annotated.png` |
| Status | Accepted |

First line states nothing changed. Retry is idempotent. Opaque reference, no status code.

## GRP-12 — Owner cannot leave while last Owner

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Blocked |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Last-Owner protection. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/GRP-12-last-owner-cannot-leave.png` |
| Annotated export | `screens/mobile/annotated/GRP-12-last-owner-cannot-leave-annotated.png` |
| Status | Accepted |

Explains by consequence and offers promotion inline. Leave stays unavailable until another Owner exists; never a dead disabled button.

## GRP-13 — Archive Group confirmation

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Confirmation |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Owner-only. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-011 |
| Exceptions | E-02 |
| Clean export | `screens/mobile/clean/GRP-13-archive-group-confirmation.png` |
| Annotated export | `screens/mobile/annotated/GRP-13-archive-group-confirmation-annotated.png` |
| Status | Accepted |

Reversible, so the primary is accent not destructive. Quotes the outstanding balance that will freeze.

## GRP-14 — Archive in progress

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | In progress |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Server-confirmed. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-011 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/GRP-14-archive-in-progress.png` |
| Annotated export | `screens/mobile/annotated/GRP-14-archive-in-progress-annotated.png` |
| Status | Accepted |

Nothing is shown as archived anywhere until the server confirms — a half-archived Group would let one member write while another cannot.

## GRP-15 — Archive success

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Success |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Balances frozen at their exact values. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-011 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/GRP-15-archive-success.png` |
| Annotated export | `screens/mobile/annotated/GRP-15-archive-success-annotated.png` |
| Status | Accepted |

Group moves into the switcher's archived section; every member sees the archived pill on their next read or realtime update.

## GRP-16 — Archive failure

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Server error |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | No partial state. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/GRP-16-archive-failure.png` |
| Annotated export | `screens/mobile/annotated/GRP-16-archive-failure-annotated.png` |
| Status | Accepted |

States the Group is still open for changes. Retry idempotent; already-archived resolves to GRP-15.

## GRP-17 — Restore archived Group

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Confirmation |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Owner-only; Members are told who can act. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-011 |
| Exceptions | E-02 |
| Clean export | `screens/mobile/clean/GRP-17-restore-archived-group.png` |
| Annotated export | `screens/mobile/annotated/GRP-17-restore-archived-group-annotated.png` |
| Status | Accepted |

Mirror of GRP-13. States the exact-value guarantee: nothing was recalculated while archived, no live FX rate has touched the frozen ledger.

## GRP-18 — Restore result · success and error

| Field | Value |
|---|---|
| Flow | C — Group creation, joining and switching / J — Group configuration |
| Group | — |
| State | Success + server error |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-03 Group switcher, Group lifecycle rows, App shell, sticky header, bottom nav, Card, list row, Modal sheet, primary/secondary/destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Nothing to validate; these are reads and confirmed mutations. |
| Permission | Failure leaves the archived state untouched. Owner-only actions are absent for Members, not disabled. Last-Owner protection blocks leaving and demotion. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Group is the trip and the tenant boundary. Every read is scoped to the active Group. No permanent deletion (O-05). |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/GRP-18-restore-result-success-and-error.png` |
| Annotated export | `screens/mobile/annotated/GRP-18-restore-result-success-and-error-annotated.png` |
| Status | Accepted |

Both outcomes share one sheet and differ only by block. Success reopens writes for every member on next read.


---

# Board 11

## INV-01 — Valid invitation · signed out

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | The only pre-auth screen permitted to name a Group, inviter or Trip dates — after successful inspection only. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-01 |
| Clean export | `screens/mobile/clean/INV-01-valid-invitation-signed-out.png` |
| Annotated export | `screens/mobile/annotated/INV-01-valid-invitation-signed-out-annotated.png` |
| Status | Accepted |

Both paths carry the invitation through authentication. Pre-auth shell is otherwise identical to sign-in.

## INV-02 — Valid invitation · signed in

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | New participants use initials on warm neutral (E-09). Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-09 |
| Clean export | `screens/mobile/clean/INV-02-valid-invitation-signed-in.png` |
| Annotated export | `screens/mobile/annotated/INV-02-valid-invitation-signed-in-annotated.png` |
| Status | Accepted |

Names the account that will join before the button. Switch signs out and returns here with the invitation intact.

## INV-03 — Invitation requires registration

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | Email and password validate on blur; the invitation is held, not spent. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/INV-03-invitation-requires-registration.png` |
| Annotated export | `screens/mobile/annotated/INV-03-invitation-requires-registration-annotated.png` |
| Status | Accepted |

Reuses the AUTH-02 sign-up form in invitation context. The token is not consumed by registration.

## INV-04 — Verification continuation

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Pending verification |
| Viewport | 393x852 |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | No lifetime promised for the verification link (O-03). Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-01 |
| Clean export | `screens/mobile/clean/INV-04-verification-continuation.png` |
| Annotated export | `screens/mobile/annotated/INV-04-verification-continuation-annotated.png` |
| Status | Accepted |

Bridges email verification and acceptance; the invitation survives the round trip through the mail client.

## INV-05 — Safe invitation inspection · loading

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Loading |
| Viewport | 393x852 |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | Every outcome below is reached from here. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/INV-05-safe-inspection-loading.png` |
| Annotated export | `screens/mobile/annotated/INV-05-safe-inspection-loading-annotated.png` |
| Status | Accepted |

Read-only lookup returning only what is safe to show. Caption states nothing has been accepted.

## INV-06 — Acceptance confirmation

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Confirmation |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | Sheet for signed-in recipients, card for signed-out. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-02 |
| Clean export | `screens/mobile/clean/INV-06-acceptance-confirmation.png` |
| Annotated export | `screens/mobile/annotated/INV-06-acceptance-confirmation-annotated.png` |
| Status | Accepted |

One deliberate confirmation between link and membership. States what the recipient gains and what the Group sees.

## INV-07 — Acceptance in progress

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | In progress |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | Atomic and single-use. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/INV-07-acceptance-in-progress.png` |
| Annotated export | `screens/mobile/annotated/INV-07-acceptance-in-progress-annotated.png` |
| Status | Accepted |

No Group content, member count or optimistic success. Cancel disables; the sheet locks.

## INV-08 — Acceptance success

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Success |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | Routes to board 13, never automatic. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/INV-08-acceptance-success.png` |
| Annotated export | `screens/mobile/annotated/INV-08-acceptance-success-annotated.png` |
| Status | Accepted |

Link is now spent. Claiming is offered as the next step but is a separate deliberate act.

## INV-09 — Invitation already used

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Consumed |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | Terminal; recovery is sign-in or a new link. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/INV-09-invitation-already-used.png` |
| Annotated export | `screens/mobile/annotated/INV-09-invitation-already-used-annotated.png` |
| Status | Accepted |

States single-use as fact, offers the likeliest cause first. No member list is revealed.

## INV-10 — Invitation expired

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Expired |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | No retry can revive an expired token. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/INV-10-invitation-expired.png` |
| Annotated export | `screens/mobile/annotated/INV-10-invitation-expired-annotated.png` |
| Status | Accepted |

7-day lifetime is confirmed (O-03) so it can be stated. Recovery routes through a person.

## INV-11 — Invitation revoked

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Revoked |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | Deliberately terminal. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/INV-11-invitation-revoked.png` |
| Annotated export | `screens/mobile/annotated/INV-11-invitation-revoked-annotated.png` |
| Status | Accepted |

Separate from expiry because recovery differs. Never says who revoked it or why.

## INV-12 — Invitation for another account

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Wrong account |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | No address disclosure to link holders. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/INV-12-invitation-for-another-account.png` |
| Annotated export | `screens/mobile/annotated/INV-12-invitation-for-another-account-annotated.png` |
| Status | Accepted |

Refused without disclosing the intended recipient. Names the current account so the user can tell what went wrong.

## INV-13 — Already a Member

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | No-op |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | Idempotent read. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/INV-13-already-a-member.png` |
| Annotated export | `screens/mobile/annotated/INV-13-already-a-member-annotated.png` |
| Status | Accepted |

Not an error and not styled as one. The invitation is explicitly left unspent for its intended recipient.

## INV-14 — Conflicting inactive relationship

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Inactive membership |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | Server-confirmed rejoin; the old participant is kept. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-02 |
| Clean export | `screens/mobile/clean/INV-14-conflicting-inactive-relationship.png` |
| Annotated export | `screens/mobile/annotated/INV-14-conflicting-inactive-relationship-annotated.png` |
| Status | Accepted |

History reattaches rather than duplicating; prevents a second participant for the same person.

## INV-15 — Malformed or invalid link

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Validation error |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | The app never confirms whether an id exists. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/INV-15-malformed-or-invalid-link.png` |
| Annotated export | `screens/mobile/annotated/INV-15-malformed-or-invalid-link-annotated.png` |
| Status | Accepted |

Names chat-app truncation as the real cause. Malformed and unknown tokens resolve to the same state.

## INV-16 — Group archived

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Blocked |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | Both facts stated so nobody asks for a second link. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/INV-16-group-archived.png` |
| Annotated export | `screens/mobile/annotated/INV-16-group-archived-annotated.png` |
| Status | Accepted |

An archived Group cannot take members, but the invitation is not consumed or invalidated by the attempt.

## INV-17 — Server error

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Server error |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | Retry is safe; acceptance is atomic. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/INV-17-invitation-server-error.png` |
| Annotated export | `screens/mobile/annotated/INV-17-invitation-server-error-annotated.png` |
| Status | Accepted |

Denies both fears in the first two lines: not half-joined, link not burned.

## INV-18 — Retry · idempotent result

| Field | Value |
|---|---|
| Flow | D — Invitation acceptance |
| Group | — |
| State | Idempotent success |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-27 invitation card, invitation outcome card, Pre-auth shell, Card, primary/secondary button, form-level error, success block |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Link shape is checked client-side only to catch truncation; every real decision is server-side. |
| Permission | The honest answer to a double tap on a bad connection. Possessing a link grants nothing. Membership exists only after server-confirmed acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Invitations are single-use, expire after 7 days (O-03) and are accepted atomically and server-side. Inspection is a read-only lookup. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-004, IR-007, IR-008 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/INV-18-retry-idempotent-result.png` |
| Annotated export | `screens/mobile/annotated/INV-18-retry-idempotent-result-annotated.png` |
| Status | Accepted |

Surfaces idempotency as reassurance. States there is exactly one membership.


---

# Board 12

## MBR-01 — Member list · Owner view

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | Owner sees management; a Member sees MBR-02. Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-03, E-04, E-09 |
| Clean export | `screens/mobile/clean/MBR-01-member-list-owner-view.png` |
| Annotated export | `screens/mobile/annotated/MBR-01-member-list-owner-view-annotated.png` |
| Status | Accepted |

Four row types share one 56px shell. Every badge is a word plus a glyph. The kebab is the only Owner-only affordance in the list.

## MBR-02 — Member list · Member view

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | No management permission |
| Viewport | 393x852 |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | This is the ordinary permission model, not a Viewer role (O-01). Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/MBR-02-member-list-member-view.png` |
| Annotated export | `screens/mobile/annotated/MBR-02-member-list-member-view-annotated.png` |
| Status | Accepted |

Management affordances are absent, not disabled. Roles stay visible so a Member knows who to ask.

## MBR-03 — Invite member

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | Default / copied |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | Token shown is opaque; format is not locked (O-03). Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/MBR-03-invite-member.png` |
| Annotated export | `screens/mobile/annotated/MBR-03-invite-member-annotated.png` |
| Status | Accepted |

Create, copy and share in one sheet. No email field — automatic delivery is deferred. Copy swaps to a confirmed state for two seconds and is announced.

## MBR-04 — Invitation management · copy, share, revoke

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | Default |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | Never says who revoked it. Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-02 |
| Clean export | `screens/mobile/clean/MBR-04-invitation-management.png` |
| Annotated export | `screens/mobile/annotated/MBR-04-invitation-management-annotated.png` |
| Status | Accepted |

Owners see how many links are live and can revoke. Revoking is server-confirmed and lands the recipient on INV-11.

## MBR-05 — Member actions

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | Default |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | Owner-only entry. Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-03 |
| Clean export | `screens/mobile/clean/MBR-05-member-actions.png` |
| Annotated export | `screens/mobile/annotated/MBR-05-member-actions-annotated.png` |
| Status | Accepted |

One sheet per person rather than inline controls on a 56px row. Shows the expense count that removal must reckon with.

## MBR-06 — Promote Member to Owner

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | Confirmation |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | Reversible by any Owner. Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-02 |
| Clean export | `screens/mobile/clean/MBR-06-promote-member-to-owner.png` |
| Annotated export | `screens/mobile/annotated/MBR-06-promote-member-to-owner-annotated.png` |
| Status | Accepted |

Confirmed because it hands over destructive power, but accent not pink. Lists what the new Owner can do rather than naming a permission set.

## MBR-07 — Transfer ownership · demote self

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | Destructive confirmation |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | Distinct from promotion, which keeps two Owners. Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-02 |
| Clean export | `screens/mobile/clean/MBR-07-transfer-ownership.png` |
| Annotated export | `screens/mobile/annotated/MBR-07-transfer-ownership-annotated.png` |
| Status | Accepted |

The only role change that removes the actor's own authority; styled destructive and states exactly who can reverse it.

## MBR-08 — Operation in progress

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | In progress |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | Server-confirmed. Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/MBR-08-operation-in-progress.png` |
| Annotated export | `screens/mobile/annotated/MBR-08-operation-in-progress-annotated.png` |
| Status | Accepted |

One in-progress pattern for every member and ownership operation. No badge changes in the list behind the sheet.

## MBR-09 — Operation success

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | Success |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | Confirmed after the server answered. Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/MBR-09-operation-success.png` |
| Annotated export | `screens/mobile/annotated/MBR-09-operation-success-annotated.png` |
| Status | Accepted |

Row badge updates as the sheet closes. Announced politely, not as an alert.

## MBR-10 — Operation failure

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | Server error |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | No half-applied role change. Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/MBR-10-operation-failure.png` |
| Annotated export | `screens/mobile/annotated/MBR-10-operation-failure-annotated.png` |
| Status | Accepted |

States the unchanged role explicitly. Retry idempotent; a change already made by another Owner resolves to MBR-09.

## MBR-11 — Remove Member confirmation

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | Destructive confirmation |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | Removal never rewrites a shared ledger. Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-02, E-04 |
| Clean export | `screens/mobile/clean/MBR-11-remove-member-confirmation.png` |
| Annotated export | `screens/mobile/annotated/MBR-11-remove-member-confirmation-annotated.png` |
| Status | Accepted |

Quotes the real ledger figures before the button. Cancel takes focus; focus is trapped and restored to the kebab on close.

## MBR-12 — Removed Member result

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | Success |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | Expenses stay attributed. Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/MBR-12-removed-member-result.png` |
| Annotated export | `screens/mobile/annotated/MBR-12-removed-member-result-annotated.png` |
| Status | Accepted |

Removal is a membership change, not a data deletion, and the copy makes the distinction. Sets up MBR-15 and INV-14.

## MBR-13 — Last-Owner protection

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | Blocked |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | Never a dead disabled button. Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/MBR-13-last-owner-protection.png` |
| Annotated export | `screens/mobile/annotated/MBR-13-last-owner-protection-annotated.png` |
| Status | Accepted |

Same protection as GRP-12, reached from the list, with the fix offered in place.

## MBR-14 — Ordinary Member permission denial

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | Permission denied |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | No implementation detail. Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/MBR-14-ordinary-member-denial.png` |
| Annotated export | `screens/mobile/annotated/MBR-14-ordinary-member-denial-annotated.png` |
| Status | Accepted |

Fallback when a Member reaches an Owner action through a stale view or deep link. Names who can act; exposes no policy name.

## MBR-15 — Inactive historical participant

| Field | Value |
|---|---|
| Flow | E — Member and Owner management |
| Group | — |
| State | Inactive participant |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 member and participant rows, invitation management row, Card, Modal sheet, participant avatar, role badge, status badge, destructive button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | No free-text input except invitation creation; nothing to validate client-side. |
| Permission | Warm neutral with dashed ring; name and initial always legible (E-09). Management is Owner-only. Members see the list without management affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | Exactly two roles — Owner and Member (O-01). Role changes, removals and invitation revocation are server-confirmed. Removal never mutates ledger history. |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-09 |
| Clean export | `screens/mobile/clean/MBR-15-inactive-historical-participant.png` |
| Annotated export | `screens/mobile/annotated/MBR-15-inactive-historical-participant-annotated.png` |
| Status | Accepted |

Participants and accounts are separate things and this is where that becomes visible. Offers a cash settlement or an invitation.


---

# Board 13

## CLM-01 — Claimable participant list

| Field | Value |
|---|---|
| Flow | F — Claim an existing participant |
| Group | — |
| State | Default / disabled primary |
| Viewport | 393x852 |
| Components | CMP-14 claim selection row, claim consequence block, Card, list row, Modal sheet, participant avatar, primary/secondary button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Selection required before the primary enables; no name matching is performed client-side. |
| Permission | Only genuinely unclaimed participants are listed. Requires Group membership. Release and reassignment are Owner-only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | One account maps to at most one participant per Group. Claiming is atomic, single-winner and never inferred from display-name equality. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-003, IR-005, IR-007, IR-008 |
| Exceptions | E-08, E-03 |
| Clean export | `screens/mobile/clean/CLM-01-claimable-participants.png` |
| Annotated export | `screens/mobile/annotated/CLM-01-claimable-participants-annotated.png` |
| Status | Accepted |

Offered after INV-08, never during it. Nothing is preselected. Continue stays disabled until a selection exists.

## CLM-02 — No claimable participants

| Field | Value |
|---|---|
| Flow | F — Claim an existing participant |
| Group | — |
| State | Empty |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 claim selection row, claim consequence block, Card, list row, Modal sheet, participant avatar, primary/secondary button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Selection required before the primary enables; no name matching is performed client-side. |
| Permission | New participants use initials on warm neutral (O-04, E-09). Requires Group membership. Release and reassignment are Owner-only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | One account maps to at most one participant per Group. Claiming is atomic, single-winner and never inferred from display-name equality. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-003, IR-005, IR-007, IR-008 |
| Exceptions | E-09 |
| Clean export | `screens/mobile/clean/CLM-02-no-claimable-participants.png` |
| Annotated export | `screens/mobile/annotated/CLM-02-no-claimable-participants-annotated.png` |
| Status | Accepted |

The common case for Groups created after accounts existed; not framed as a failure.

## CLM-03 — Participant selected · claim explanation

| Field | Value |
|---|---|
| Flow | F — Claim an existing participant |
| Group | — |
| State | Selected |
| Viewport | 393x852 |
| Components | CMP-14 claim selection row, claim consequence block, Card, list row, Modal sheet, participant avatar, primary/secondary button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Selection required before the primary enables; no name matching is performed client-side. |
| Permission | Migrated participants keep their emoji (O-04). Requires Group membership. Release and reassignment are Owner-only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | One account maps to at most one participant per Group. Claiming is atomic, single-winner and never inferred from display-name equality. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-003, IR-005, IR-007, IR-008 |
| Exceptions | E-09 |
| Clean export | `screens/mobile/clean/CLM-03-participant-selected-explanation.png` |
| Annotated export | `screens/mobile/annotated/CLM-03-participant-selected-explanation-annotated.png` |
| Status | Accepted |

The explanation is the design: what moves, what does not, and that no amount is recalculated. Real figures so the consequence is checkable.

## CLM-04 — Claim confirmation

| Field | Value |
|---|---|
| Flow | F — Claim an existing participant |
| Group | — |
| State | Confirmation · server-confirmed |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 claim selection row, claim consequence block, Card, list row, Modal sheet, participant avatar, primary/secondary button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Selection required before the primary enables; no name matching is performed client-side. |
| Permission | Server-confirmed. Requires Group membership. Release and reassignment are Owner-only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | One account maps to at most one participant per Group. Claiming is atomic, single-winner and never inferred from display-name equality. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-003, IR-005, IR-007, IR-008 |
| Exceptions | E-02, E-12 |
| Clean export | `screens/mobile/clean/CLM-04-claim-confirmation.png` |
| Annotated export | `screens/mobile/annotated/CLM-04-claim-confirmation-annotated.png` |
| Status | Accepted — revised in batch 3 under O-07 |

O-07 revision: the confirmation now states plainly that the association cannot be swapped afterwards, by anyone. No Owner undo is promised. Last gate before an association a Member cannot reverse; states who can undo it.

## CLM-05 — Claim in progress

| Field | Value |
|---|---|
| Flow | F — Claim an existing participant |
| Group | — |
| State | In progress |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 claim selection row, claim consequence block, Card, list row, Modal sheet, participant avatar, primary/secondary button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Selection required before the primary enables; no name matching is performed client-side. |
| Permission | Atomic. Requires Group membership. Release and reassignment are Owner-only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | One account maps to at most one participant per Group. Claiming is atomic, single-winner and never inferred from display-name equality. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-003, IR-005, IR-007, IR-008 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/CLM-05-claim-in-progress.png` |
| Annotated export | `screens/mobile/annotated/CLM-05-claim-in-progress-annotated.png` |
| Status | Accepted |

Nothing about the ledger moves optimistically. The sheet locks; the list behind is untouched.

## CLM-06 — Claim success

| Field | Value |
|---|---|
| Flow | F — Claim an existing participant |
| Group | — |
| State | Success |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 claim selection row, claim consequence block, Card, list row, Modal sheet, participant avatar, primary/secondary button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Selection required before the primary enables; no name matching is performed client-side. |
| Permission | The Group's view of the person is unchanged. Requires Group membership. Release and reassignment are Owner-only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | One account maps to at most one participant per Group. Claiming is atomic, single-winner and never inferred from display-name equality. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-003, IR-005, IR-007, IR-008 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/CLM-06-claim-success.png` |
| Annotated export | `screens/mobile/annotated/CLM-06-claim-success-annotated.png` |
| Status | Accepted |

Repeats the figures so they can be checked against Split immediately, and repeats the exact-value guarantee.

## CLM-07 — Participant already claimed

| Field | Value |
|---|---|
| Flow | F — Claim an existing participant |
| Group | — |
| State | Conflict |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 claim selection row, claim consequence block, Card, list row, Modal sheet, participant avatar, primary/secondary button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Selection required before the primary enables; no name matching is performed client-side. |
| Permission | Offers a different participant or a fresh start. Requires Group membership. Release and reassignment are Owner-only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | One account maps to at most one participant per Group. Claiming is atomic, single-winner and never inferred from display-name equality. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-003, IR-005, IR-007, IR-008 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/CLM-07-already-claimed.png` |
| Annotated export | `screens/mobile/annotated/CLM-07-already-claimed-annotated.png` |
| Status | Accepted |

The race condition, resolved server-side. Single-winner; the loser never sees who won.

## CLM-08 — Conflicting account

| Field | Value |
|---|---|
| Flow | F — Claim an existing participant |
| Group | — |
| State | Conflict |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 claim selection row, claim consequence block, Card, list row, Modal sheet, participant avatar, primary/secondary button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Selection required before the primary enables; no name matching is performed client-side. |
| Permission | Recovery routes to an Owner. Requires Group membership. Release and reassignment are Owner-only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | One account maps to at most one participant per Group. Claiming is atomic, single-winner and never inferred from display-name equality. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-003, IR-005, IR-007, IR-008 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/CLM-08-conflicting-account.png` |
| Annotated export | `screens/mobile/annotated/CLM-08-conflicting-account-annotated.png` |
| Status | Accepted |

One account, one participant per Group — the invariant that keeps the ledger honest.

## CLM-09 — Insufficient evidence

| Field | Value |
|---|---|
| Flow | F — Claim an existing participant |
| Group | — |
| State | Stopped safely · nothing changed |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 claim selection row, claim consequence block, Card, list row, Modal sheet, participant avatar, primary/secondary button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Selection required before the primary enables; no name matching is performed client-side. |
| Permission | Load-bearing state for this board (E-08). Requires Group membership. Release and reassignment are Owner-only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | One account maps to at most one participant per Group. Claiming is atomic, single-winner and never inferred from display-name equality. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-003, IR-005, IR-007, IR-008 |
| Exceptions | E-08, E-04, E-12 |
| Clean export | `screens/mobile/clean/CLM-09-insufficient-evidence.png` |
| Annotated export | `screens/mobile/annotated/CLM-09-insufficient-evidence-annotated.png` |
| Status | Accepted — revised in batch 3 under O-07 |

O-07 revision: no longer routes to an Owner decision. Display-name equality is never sufficient; the claim stops, nothing is linked and nothing is queued. Display-name equality is never sufficient. With no verified relationship, claiming routes to a human decision.

## CLM-10 — Permission denied

| Field | Value |
|---|---|
| Flow | F — Claim an existing participant |
| Group | — |
| State | Permission denied |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 claim selection row, claim consequence block, Card, list row, Modal sheet, participant avatar, primary/secondary button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Selection required before the primary enables; no name matching is performed client-side. |
| Permission | No disclosure. Requires Group membership. Release and reassignment are Owner-only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | One account maps to at most one participant per Group. Claiming is atomic, single-winner and never inferred from display-name equality. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-003, IR-005, IR-007, IR-008 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/CLM-10-claim-permission-denied.png` |
| Annotated export | `screens/mobile/annotated/CLM-10-claim-permission-denied-annotated.png` |
| Status | Accepted |

Claiming requires membership; refused without revealing whether the participant exists.

## CLM-11 — Review required

| Field | Value |
|---|---|
| Flow | F — Claim an existing participant |
| Group | — |
| State | Stopped safely · not optimistic |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 claim selection row, claim consequence block, Card, list row, Modal sheet, participant avatar, primary/secondary button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Selection required before the primary enables; no name matching is performed client-side. |
| Permission | Pending Owner confirmation. Requires Group membership. Release and reassignment are Owner-only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | One account maps to at most one participant per Group. Claiming is atomic, single-winner and never inferred from display-name equality. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-003, IR-005, IR-007, IR-008 |
| Exceptions | E-04, E-12 |
| Clean export | `screens/mobile/clean/CLM-11-review-required.png` |
| Annotated export | `screens/mobile/annotated/CLM-11-review-required-annotated.png` |
| Status | Accepted — revised in batch 3 under O-07 |

O-07 revision: no longer a pending Owner review. Renamed in behaviour to a safe stop that names what did not happen; recovery is an Owner adding a new participant, not a reassignment. Must not look like success — no balance is shown as moved and the user is told they are in as themselves for now.

## CLM-12 — Claim server error

| Field | Value |
|---|---|
| Flow | F — Claim an existing participant |
| Group | — |
| State | Server error |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 claim selection row, claim consequence block, Card, list row, Modal sheet, participant avatar, primary/secondary button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Selection required before the primary enables; no name matching is performed client-side. |
| Permission | A partial claim would be the worst outcome in the product. Requires Group membership. Release and reassignment are Owner-only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | One account maps to at most one participant per Group. Claiming is atomic, single-winner and never inferred from display-name equality. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-003, IR-005, IR-007, IR-008 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/CLM-12-claim-server-error.png` |
| Annotated export | `screens/mobile/annotated/CLM-12-claim-server-error-annotated.png` |
| Status | Accepted |

Both ledgers named as unchanged. Retry idempotent; a claim that actually succeeded resolves to CLM-06.

## CLM-13 — Safe recovery guidance

| Field | Value |
|---|---|
| Flow | F — Claim an existing participant |
| Group | — |
| State | Recovery guidance |
| Viewport | 393 wide, sheet at intrinsic height |
| Components | CMP-14 claim selection row, claim consequence block, Card, list row, Modal sheet, participant avatar, primary/secondary button |
| Loading / success / failure | Loading: in-button spinner or existing skeleton, reduced-motion safe. Error: block-level, plain language, opaque reference, idempotent retry. Success: confirmed only after the server answered, announced politely. |
| Validation | Selection required before the primary enables; no name matching is performed client-side. |
| Permission | Nothing is deleted while a participant is released and reassigned. Requires Group membership. Release and reassignment are Owner-only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px with a dark blurred backdrop. No layout changes between viewports. |
| Architecture reference | One account maps to at most one participant per Group. Claiming is atomic, single-winner and never inferred from display-name equality. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-003, IR-005, IR-007, IR-008 |
| Exceptions | E-12 |
| Clean export | `screens/mobile/clean/CLM-13-safe-recovery-guidance.png` |
| Annotated export | `screens/mobile/annotated/CLM-13-safe-recovery-guidance-annotated.png` |
| Status | Accepted — revised in batch 3 under O-07 |

O-07 revision: removes the promise that an Owner can release and reassign a participant. Owners are named as the people to talk to about adding the right person. Every terminal claim state can reach this. Recovery is a named person, not a support address.


---

# Board 14

## PERM-01 — Not a member of this Group

| Field | Value |
|---|---|
| Flow | Flow G — permission, access and read-only |
| Group | — |
| State | Denied · page |
| Viewport | 393x852 |
| Components | CMP-17, CMP-22, App shell, sticky header, bottom nav, card, list row, primary button, secondary button |
| Loading / success / failure | Loading is the safe-inspection skeleton (INV-05 pattern); no error variant — an unreadable context resolves to PERM-03. No success state. |
| Validation | No form. |
| Permission | Authenticated but no active membership. Group name only from safe context; no itinerary, balance, member or document data is fetched. Invitation button appears only when a valid invitation exists. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Group membership resolution; deny-by-default read |
| IR owner | IR-007 |
| Wave | W2 |
| Related IR items | IR-005, IR-011 |
| Exceptions | E-01, E-03, E-04, E-06 |
| Clean export | `screens/mobile/clean/PERM-01-not-a-member.png` |
| Annotated export | `screens/mobile/annotated/PERM-01-not-a-member-annotated.png` |
| Status | Accepted — batch 3 |

Reached from a share link the server confirmed is nameable. Tabs hidden because no Group is resolved. Back and browser Back go to the Group picker, never to the refused Group.

## PERM-02 — Removed from Group

| Field | Value |
|---|---|
| Flow | Flow G — permission, access and read-only |
| Group | — |
| State | Removed · page |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-17, CMP-22 |
| Loading / success / failure | No retry — retry cannot restore membership. Success is not applicable. |
| Validation | No form. |
| Permission | Membership was active and is now absent. Private Group data is not retained in the DOM. Historical attribution stays in the Group ledger under the old display identity. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Membership revocation; realtime membership invalidation |
| IR owner | IR-007 |
| Wave | W2 |
| Related IR items | IR-005, IR-011 |
| Exceptions | E-02, E-03, E-04 |
| Clean export | `screens/mobile/clean/PERM-02-removed-from-group.png` |
| Annotated export | `screens/mobile/annotated/PERM-02-removed-from-group-annotated.png` |
| Status | Accepted — batch 3 |

Appears on the next authorised read after removal, replacing content in the same paint. No rejoin control. Choose another trip goes to the Group picker.

## PERM-03 — Group no longer available

| Field | Value |
|---|---|
| Flow | Flow G — permission, access and read-only |
| Group | — |
| State | Denied · no-recovery · page |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-17 |
| Loading / success / failure | No Try again; the only action is Choose another trip. Offline resolves to the connection banner above this unchanged state. |
| Validation | No form. |
| Permission | Never states which condition applied and never confirms whether the Group exists. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Tenant boundary; archived, removed, stale or cross-tenant selection |
| IR owner | IR-007 |
| Wave | W2 |
| Related IR items | IR-005, IR-011 |
| Exceptions | E-03, E-04, E-06 |
| Clean export | `screens/mobile/clean/PERM-03-group-no-longer-available.png` |
| Annotated export | `screens/mobile/annotated/PERM-03-group-no-longer-available-annotated.png` |
| Status | Accepted — batch 3 |

One treatment for four backend conditions. Stale Group selection is cleared from local state so the next launch resolves cleanly.

## PERM-04 — Cross-Group resource unavailable

| Field | Value |
|---|---|
| Flow | Flow G — permission, access and read-only |
| Group | — |
| State | Unavailable · page |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-17 |
| Loading / success / failure | No retry. Loading is a short inline skeleton before the generic state. |
| Validation | No form. |
| Permission | Exposes no resource type, title, owner, audience, originating Group or existence. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Cross-Group resource resolution; audience filtering |
| IR owner | IR-007 |
| Wave | W2 |
| Related IR items | IR-005, IR-011 |
| Exceptions | E-03, E-04 |
| Clean export | `screens/mobile/clean/PERM-04-cross-group-resource-unavailable.png` |
| Annotated export | `screens/mobile/annotated/PERM-04-cross-group-resource-unavailable-annotated.png` |
| Status | Accepted — batch 3 |

One state for a stale link to an Event, Todo, expense, settlement, document or member. Back returns to the user own authorised Group.

## PERM-05 — Archived Group read-only

| Field | Value |
|---|---|
| Flow | Flow G/J — permission, access and read-only |
| Group | — |
| State | Read-only · Owner and Member |
| Viewport | 393x852 |
| Components | CMP-15, CMP-18, App shell, sticky header, bottom nav, card, list row, primary button, secondary button |
| Loading / success / failure | Restore has confirmation, in-progress, success and failure on board 10. No optimistic restore. |
| Validation | No form; mutation entry points are absent or quaternary. |
| Permission | Read-only is a Group state, not a role. Reading stays authorised; every mutation is refused server-side regardless of the UI. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Group archive lifecycle; read-only enforcement server-side |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-02, E-03, E-04, E-06 |
| Clean export | `screens/mobile/clean/PERM-05-archived-group-read-only.png` |
| Annotated export | `screens/mobile/annotated/PERM-05-archived-group-read-only-annotated.png` |
| Status | Accepted — batch 3 |

Banner under the sticky header. Owner sees Restore, which is server-confirmed with its own in-progress and result states (GRP-13 to GRP-18). Member sees the same screen without Restore.

## PERM-06 — Member viewing Group management

| Field | Value |
|---|---|
| Flow | Flow G/J — permission, access and read-only |
| Group | — |
| State | Known-denied · disabled |
| Viewport | 393x852 |
| Components | CMP-16, App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-18 |
| Loading / success / failure | No loading beyond the configuration read; no error state for a screen that performs no mutation. |
| Validation | No form is opened that cannot be submitted. |
| Permission | Every Owner-only row carries the mono OWNER ONLY marker as well as reduced contrast, so state is never colour-only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Group configuration ownership; Owner-only mutation |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-03, E-04, E-06 |
| Clean export | `screens/mobile/clean/PERM-06-member-viewing-group-management.png` |
| Annotated export | `screens/mobile/annotated/PERM-06-member-viewing-group-management-annotated.png` |
| Status | Accepted — batch 3 |

Known at render time: no chevrons, no focus rings, no editable fields. People stays tappable; Leave stays live. Back returns to Trip.

## PERM-07 — Invitation management denied

| Field | Value |
|---|---|
| Flow | Flow E/G — permission, access and read-only |
| Group | — |
| State | Denied · sheet |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-16 |
| Loading / success / failure | No retry. Owner names shown only from already-authorised membership data. |
| Validation | No form. |
| Permission | Covers create, copy, regenerate and revoke. A Member never receives an invitation secret in the payload, so no secret is masked on screen — none is sent. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Invitation creation and revocation are Owner-only |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-03, E-04 |
| Clean export | `screens/mobile/clean/PERM-07-invitation-management-denied.png` |
| Annotated export | `screens/mobile/annotated/PERM-07-invitation-management-denied-annotated.png` |
| Status | Accepted — batch 3 |

Sheet over the member list. Escape and backdrop dismiss because dismissing changes nothing; focus returns to the trigger.

## PERM-08 — Member management denied

| Field | Value |
|---|---|
| Flow | Flow E/G — permission, access and read-only |
| Group | — |
| State | Denied · sheet |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-16, CMP-22 |
| Loading / success / failure | No retry. |
| Validation | No form. |
| Permission | Owner names come from authorised membership data only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Role and membership mutation are Owner-only |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-03, E-04 |
| Clean export | `screens/mobile/clean/PERM-08-member-management-denied.png` |
| Annotated export | `screens/mobile/annotated/PERM-08-member-management-denied-annotated.png` |
| Status | Accepted — batch 3 |

One sheet for remove, promote, demote and transfer. See the people returns to the read-only member list, not to the refused action.

## PERM-09 — Last-Owner protection

| Field | Value |
|---|---|
| Flow | Flow E/G — permission, access and read-only |
| Group | — |
| State | Blocked ×4 · sheet |
| Viewport | 393x852 |
| Components | CMP-19, App shell, sticky header, bottom nav, card, list row, primary button, secondary button |
| Loading / success / failure | Server-confirmed: the block is enforced server-side and mirrored in the UI, never only in the UI. |
| Validation | No form. |
| Permission | Applies to leave, self-demotion and removal of the last Owner. Archiving is unaffected. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | A Group must retain at least one Owner |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-02, E-03, E-04 |
| Clean export | `screens/mobile/clean/PERM-09-last-owner-protection.png` |
| Annotated export | `screens/mobile/annotated/PERM-09-last-owner-protection-annotated.png` |
| Status | Accepted — batch 3 |

Lives inside the confirmation sheet for the action it blocks. Blocked primary is replaced by Choose a new Owner. Cancel keeps its position.

## PERM-10 — Event mutation denied

| Field | Value |
|---|---|
| Flow | Flow G/I — permission, access and read-only |
| Group | — |
| State | Read-only · omitted-private |
| Viewport | 393x852 |
| Components | CMP-21, App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-15 |
| Loading / success / failure | No optimistic write. Offline resolves to the connection banner above the unchanged read-only content. |
| Validation | No form. |
| Permission | Private Events outside the audience are omitted completely — no locked cards, no ghost rows — and the visible count equals the authorised count. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Event mutation authorisation; audience filtering |
| IR owner | IR-012 |
| Wave | W4 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-03, E-04 |
| Clean export | `screens/mobile/clean/PERM-10-event-mutation-denied.png` |
| Annotated export | `screens/mobile/annotated/PERM-10-event-mutation-denied-annotated.png` |
| Status | Accepted — batch 3 |

Add, edit and remove affordances are absent rather than dimmed. Rows still open read-only detail.

## PERM-11 — Todo mutation denied

| Field | Value |
|---|---|
| Flow | Flow G — permission, access and read-only |
| Group | — |
| State | Read-only · disabled |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-15 |
| Loading / success / failure | No retry, no optimistic toggle. |
| Validation | No form. |
| Permission | Content stays readable only while reading is authorised; on removal the tab resolves to PERM-02. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Todo mutation authorisation |
| IR owner | IR-012 |
| Wave | W4 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-03, E-04 |
| Clean export | `screens/mobile/clean/PERM-11-todo-mutation-denied.png` |
| Annotated export | `screens/mobile/annotated/PERM-11-todo-mutation-denied-annotated.png` |
| Status | Accepted — batch 3 |

Checkboxes render as state, take no focus and are not hit targets. Add row and Clear completed are absent.

## PERM-12 — Finance mutation denied

| Field | Value |
|---|---|
| Flow | Flow G/H — permission, access and read-only |
| Group | — |
| State | Read-only · frozen |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-15, CMP-16 |
| Loading / success / failure | No optimistic recalculation and no live-FX restatement of stored accounting values. |
| Validation | No form. |
| Permission | Stored exact values only. A refused write is never reflected in a balance, not even transiently. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Exact-value ledger; finance mutation authorisation |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-007, IR-008, IR-011 |
| Exceptions | E-03, E-04, E-06 |
| Clean export | `screens/mobile/clean/PERM-12-finance-mutation-denied.png` |
| Annotated export | `screens/mobile/annotated/PERM-12-finance-mutation-denied-annotated.png` |
| Status | Accepted — batch 3 |

Add expense and Settle up are absent; expense rows open read-only detail.

## PERM-13 — Settlement recording denied

| Field | Value |
|---|---|
| Flow | Flow G/H — permission, access and read-only |
| Group | — |
| State | Denied · server-confirmed · sheet |
| Viewport | 393x852 |
| Components | CMP-20, App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-22 |
| Loading / success / failure | No Try again — retry returns only when access does. No partial or optimistic settlement. |
| Validation | Values were valid; the refusal is authorisation, not validation. |
| Permission | Access to Group finance changed while the sheet was open. Transfer unrecorded, balances unchanged. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Settlement recording is server-confirmed |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-007, IR-008, IR-011 |
| Exceptions | E-02, E-03, E-04 |
| Clean export | `screens/mobile/clean/PERM-13-settlement-recording-denied.png` |
| Annotated export | `screens/mobile/annotated/PERM-13-settlement-recording-denied-annotated.png` |
| Status | Accepted — batch 3 |

Focus moves to the summary and is announced. Copy the details puts the transfer on the clipboard. Close returns to Split.

## PERM-14 — Private document unavailable

| Field | Value |
|---|---|
| Flow | Flow G/I — permission, access and read-only |
| Group | — |
| State | Private · unavailable |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-21 |
| Loading / success / failure | No retry for the private case; storage and parser failures are separate states (PERM-15). |
| Validation | No form. |
| Permission | No name, uploader, thumbnail, parsed content, audience or storage path, and never who kept it private. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Document audience; storage authorisation |
| IR owner | IR-009 |
| Wave | W3 |
| Related IR items | IR-007, IR-013 |
| Exceptions | E-03, E-04, E-07 |
| Clean export | `screens/mobile/clean/PERM-14-private-document-unavailable.png` |
| Annotated export | `screens/mobile/annotated/PERM-14-private-document-unavailable-annotated.png` |
| Status | Accepted — batch 3 |

A stale reference yields one neutral state; the authorised list below is complete and its count matches.

## PERM-15 — Document mutation denied

| Field | Value |
|---|---|
| Flow | Flow G/I — permission, access and read-only |
| Group | — |
| State | Denied · storage-fail · parse-fail |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-16, CMP-22 |
| Loading / success / failure | Only storage failure offers Try again. |
| Validation | Audience change validates the selection before submit; the refusal here is authorisation. |
| Permission | Permission denial is not a server error and shares neither its copy nor its recovery. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Storage authorisation versus storage and parser availability |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-007, IR-008, IR-009 |
| Exceptions | E-03, E-04 |
| Clean export | `screens/mobile/clean/PERM-15-document-mutation-denied.png` |
| Annotated export | `screens/mobile/annotated/PERM-15-document-mutation-denied-annotated.png` |
| Status | Accepted — batch 3 |

Three outcomes, three recoveries: Got it, Try again, Choose another file. Covers upload, parse, audience change, delete and reconciliation mutation.

## PERM-16 — Participant claim denied

| Field | Value |
|---|---|
| Flow | Flow F/G — permission, access and read-only |
| Group | — |
| State | Denied ×5 · sheet |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-16, CMP-22 |
| Loading / success / failure | Retry only where it could succeed; otherwise sign-in guidance or an Owner action. |
| Validation | No form. |
| Permission | Not a member, already claimed, account already linked, insufficient evidence, claiming closed. Every row confirms that nothing was linked. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Claiming is atomic, single-winner and evidence-based (O-07) |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-02, E-03, E-04, E-08 |
| Clean export | `screens/mobile/clean/PERM-16-participant-claim-denied.png` |
| Annotated export | `screens/mobile/annotated/PERM-16-participant-claim-denied-annotated.png` |
| Status | Accepted — batch 3 |

Five reasons with per-reason recovery. No Owner review queue, approval request or manual matching.

## PERM-17 — Membership changed during an open form

| Field | Value |
|---|---|
| Flow | Flow G — permission, access and read-only |
| Group | — |
| State | Stale-denied · preserved-input |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-20 |
| Loading / success / failure | Nothing was saved; no optimistic insert appears in the itinerary. |
| Validation | Client validation had passed; the refusal is authorisation, reported at submit. |
| Permission | Authorised at open, refused at save. Values stay visible and copyable; Save is disabled, not removed. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Server-confirmed mutation; stale authorisation |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-02, E-03, E-04 |
| Clean export | `screens/mobile/clean/PERM-17-membership-changed-in-form.png` |
| Annotated export | `screens/mobile/annotated/PERM-17-membership-changed-in-form-annotated.png` |
| Status | Accepted — batch 3 |

The write reaches the server and fails there. Focus moves to the summary and is announced; Close returns to an authorised destination.

## PERM-18 — Role changed during a management action

| Field | Value |
|---|---|
| Flow | Flow E/G — permission, access and read-only |
| Group | — |
| State | Stale-role · server-confirmed · sheet |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-20 |
| Loading / success / failure | No partial visual success and no rollback animation — the unchanged state is shown. |
| Validation | No form. |
| Permission | Started as Owner, refused as Member. Nobody was promoted, demoted or removed. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Role mutation is server-confirmed and atomic |
| IR owner | IR-005 |
| Wave | W3 |
| Related IR items | IR-007, IR-008 |
| Exceptions | E-02, E-03, E-04 |
| Clean export | `screens/mobile/clean/PERM-18-role-changed-mid-action.png` |
| Annotated export | `screens/mobile/annotated/PERM-18-role-changed-mid-action-annotated.png` |
| Status | Accepted — batch 3 |

Refresh the people reloads the list in the Member variant. The sheet does not return to the Owner action.

## PERM-19 — Session expired versus permission denied

| Field | Value |
|---|---|
| Flow | Flow A/G — permission, access and read-only |
| Group | — |
| State | Contract · expired and denied |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-16 |
| Loading / success / failure | Continuation is preserved across the authentication round trip. |
| Validation | No form. |
| Permission | When both are true, authentication wins, because authorisation is not knowable until someone is signed in. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Authentication versus authorisation separation |
| IR owner | IR-004 |
| Wave | W2 |
| Related IR items | IR-007 |
| Exceptions | E-01, E-04 |
| Clean export | `screens/mobile/clean/PERM-19-session-expired-versus-denied.png` |
| Annotated export | `screens/mobile/annotated/PERM-19-session-expired-versus-denied-annotated.png` |
| Status | Accepted — batch 3 |

Expiry routes to AUTH-08 with a safe continuation; denial leaves the session alone. No permission screen contains a sign-in control.

## PERM-20 — Permission state recovery matrix

| Field | Value |
|---|---|
| Flow | Flow G — permission, access and read-only |
| Group | — |
| State | Contract · eight recoveries |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, card, list row, primary button, secondary button, CMP-22 |
| Loading / success / failure | Try again appears only where retrying can change the answer. |
| Validation | No form. |
| Permission | Controlled support is reached through an Owner, not an address, because only an Owner can see the Group. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Permission pages fill the column; sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Recovery routing for every denial |
| IR owner | IR-007 |
| Wave | W2 |
| Related IR items | IR-005, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/PERM-20-recovery-matrix.png` |
| Annotated export | `screens/mobile/annotated/PERM-20-recovery-matrix-annotated.png` |
| Status | Accepted — batch 3 |

Eight recoveries mapped to the screens that offer them; four screens deliberately offer none.


---

# Board 15

## FIN-01 — Populated finance dashboard

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Populated |
| Viewport | 393x852 |
| Components | CMP-26, CMP-29, App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | Loads behind FIN-05 skeletons; a failed read shows the connection banner over an empty log, never a zero balance. |
| Validation | No form. |
| Permission | All figures are Group-scoped; nothing from another Group can appear. Read requires active membership. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Split tab read; Group-scoped finance |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-03, E-06 |
| Clean export | `screens/mobile/clean/FIN-01-populated-finance-dashboard.png` |
| Annotated export | `screens/mobile/annotated/FIN-01-populated-finance-dashboard-annotated.png` |
| Status | Accepted — batch 4 |

Hero includes settlements, GroupTotals Net excludes them — preserved from source. Tapping a card opens FIN-25; the two actions open FIN-09 and FIN-31. The frame shows the ledger at scroll top: the expense log and settlement history continue below the 852px fold, evidenced on FIN-22, FIN-30 and FIN-35.

## FIN-02 — You are owed money

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Positive balance |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-26 |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | Balances are visible to every member of the Group. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | computeBalances, positive net |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-06 |
| Clean export | `screens/mobile/clean/FIN-02-you-are-owed.png` |
| Annotated export | `screens/mobile/annotated/FIN-02-you-are-owed-annotated.png` |
| Status | Accepted — batch 4 |

Roster cells are not tappable; the hero is a summary, not navigation.

## FIN-03 — You owe money

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Negative balance |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-26 |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | Any member sees any member’s balance — finance is Group-wide. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | computeBalances, negative net |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-06 |
| Clean export | `screens/mobile/clean/FIN-03-you-owe.png` |
| Annotated export | `screens/mobile/annotated/FIN-03-you-owe-annotated.png` |
| Status | Accepted — batch 4 |

Same component from the debtor side; Settle up is the route out.

## FIN-04 — All settled

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Settled |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-26 |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | computeBalances at zero |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-06 |
| Clean export | `screens/mobile/clean/FIN-04-all-settled.png` |
| Annotated export | `screens/mobile/annotated/FIN-04-all-settled-annotated.png` |
| Status | Accepted — batch 4 |

No original-currency line at zero, per source.

## FIN-05 — Finance loading

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Loading |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-10 |
| Loading / success / failure | Reduced motion replaces the pulse with a static fill. |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Split tab initial read |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/FIN-05-finance-loading.png` |
| Annotated export | `screens/mobile/annotated/FIN-05-finance-loading-annotated.png` |
| Status | Accepted — batch 4 |

Three 78px skeletons from source. No figure appears before the ledger resolves.

## FIN-06 — Empty finance ledger

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Empty |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Group with no expenses |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-06 |
| Clean export | `screens/mobile/clean/FIN-06-empty-finance-ledger.png` |
| Annotated export | `screens/mobile/annotated/FIN-06-empty-finance-ledger-annotated.png` |
| Status | Accepted — batch 4 |

GroupTotals is absent below one expense, per source. Settle up resolves to FIN-38.

## FIN-07 — Historical inactive participant

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Inactive |
| Viewport | 393x852 |
| Components | CMP-30, App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | Inactive participants keep ledger attribution but hold no access. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Historical attribution preserved for removed participants |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-09, E-11 |
| Clean export | `screens/mobile/clean/FIN-07-historical-inactive-participant.png` |
| Annotated export | `screens/mobile/annotated/FIN-07-historical-inactive-participant-annotated.png` |
| Status | Accepted — batch 4 |

No Edit and no participant-management action on a historical row.

## FIN-08 — Unclaimed participant in finance

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Unclaimed |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-30 |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | Ledger participation implies no authority and no account access. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Participant identity separate from account identity |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-09 |
| Clean export | `screens/mobile/clean/FIN-08-unclaimed-participant-in-finance.png` |
| Annotated export | `screens/mobile/annotated/FIN-08-unclaimed-participant-in-finance-annotated.png` |
| Status | Accepted — batch 4 |

Claiming cannot be started from a finance row; it lives on board 13.

## FIN-09 — Add expense default

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | CMP-23, CMP-25, App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | n/a |
| Validation | Validation on blur and on submit, and continuously for exact totals. |
| Permission | Requires active membership; refusal is server-side. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Expense insert |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-03, E-04 |
| Clean export | `screens/mobile/clean/FIN-09-add-expense-default.png` |
| Annotated export | `screens/mobile/annotated/FIN-09-add-expense-default-annotated.png` |
| Status | Accepted — batch 4 |

Source dialog unchanged. Focus enters the heading. Escape and backdrop close only while untouched, otherwise discard confirmation runs.

## FIN-10 — Equal split

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Equal split |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-25 |
| Loading / success / failure | n/a |
| Validation | Exact-total strip live on change. |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | computeShares, equal mode |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/FIN-10-equal-split.png` |
| Annotated export | `screens/mobile/annotated/FIN-10-equal-split-annotated.png` |
| Status | Accepted — batch 4 |

Per-head figure shown in both currencies before saving.

## FIN-11 — Historical non-equal shares

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Read-only history |
| Viewport | 393x852 |
| Components | CMP-24, App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-25 |
| Loading / success / failure | n/a |
| Validation | No form — nothing is editable. |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Valid persisted non-equal history must be calculated and displayed at exact retained values and protected from silent equal-split overwrite (O-10) |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-13 |
| Clean export | `screens/mobile/clean/FIN-11-historical-non-equal-shares.png` |
| Annotated export | `screens/mobile/annotated/FIN-11-historical-non-equal-shares-annotated.png` |
| Status | Revised in batch 5 — O-09/O-10 |

Displays retained shares with no inputs, no Save and no split-mode picker. Non-equal authoring is not offered anywhere in the product.

## FIN-12 — Multiple payers

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Multi-payer |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-23, CMP-25 |
| Loading / success / failure | n/a |
| Validation | Payer total must equal the expense total within 1 IDR. |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | paid_by_splits |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-03 |
| Clean export | `screens/mobile/clean/FIN-12-multiple-payers.png` |
| Annotated export | `screens/mobile/annotated/FIN-12-multiple-payers-annotated.png` |
| Status | Accepted — batch 4 |

Empty contribution counts as zero, per source.

## FIN-13 — Multiple payers with equal final shares

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Multi-payer + equal |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-23, CMP-24, CMP-25 |
| Loading / success / failure | n/a |
| Validation | Both totals must equal the expense total before Save is enabled. |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Payer contributions and equal final shares reconcile independently; accepted fixture EQ-01 |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-13 |
| Clean export | `screens/mobile/clean/FIN-13-multiple-payers-equal-final-shares.png` |
| Annotated export | `screens/mobile/annotated/FIN-13-multiple-payers-equal-final-shares-annotated.png` |
| Status | Revised in batch 5 — O-09/O-10 |

Two independent exact-total checks. Payer contributions unequal, final shares equal; neither total derived from the other.

## FIN-14 — Matching totals

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Success |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-25 |
| Loading / success / failure | n/a |
| Validation | 1 IDR tolerance only, from source. |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Exact-value contract |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/FIN-14-matching-totals.png` |
| Annotated export | `screens/mobile/annotated/FIN-14-matching-totals-annotated.png` |
| Status | Accepted — batch 4 |

Strips update per keystroke; never merged into one verdict.

## FIN-15 — Payer contribution mismatch

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Validation |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-25 |
| Loading / success / failure | No remainder is distributed. |
| Validation | States expected, entered and the unassigned difference. |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Exact-value contract |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/FIN-15-payer-contribution-mismatch.png` |
| Annotated export | `screens/mobile/annotated/FIN-15-payer-contribution-mismatch-annotated.png` |
| Status | Accepted — batch 4 |

Save disabled with the message as its accessible description.

## FIN-16 — Historical non-equal share reconciliation

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Valid retained, malformed |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-24, CMP-25 |
| Loading / success / failure | No silent repair. |
| Validation | Not a user-created custom-share validation flow. No redistribution and no equal-split overwrite. |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Malformed retained history enters controlled reconciliation (O-10) |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-04, E-13 |
| Clean export | `screens/mobile/clean/FIN-16-historical-non-equal-share-reconciliation.png` |
| Annotated export | `screens/mobile/annotated/FIN-16-historical-non-equal-share-reconciliation-annotated.png` |
| Status | Revised in batch 5 — O-09/O-10 |

Valid retained shares reconcile and are used exactly; malformed history is held out of the settlement arithmetic and routed to review.

## FIN-17 — Missing description

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Validation |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | n/a |
| Validation | On blur and on submit. |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Expense insert validation |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/FIN-17-missing-description.png` |
| Annotated export | `screens/mobile/annotated/FIN-17-missing-description-annotated.png` |
| Status | Accepted — batch 4 |

Corrected to validate on blur as well as submit, and to connect the error to the input.

## FIN-18 — Zero or negative amount

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Validation |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | n/a |
| Validation | On blur and on submit. |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Expense insert validation |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/FIN-18-zero-or-negative-amount.png` |
| Annotated export | `screens/mobile/annotated/FIN-18-zero-or-negative-amount-annotated.png` |
| Status | Accepted — batch 4 |

Copy explains that corrections are edits, not negative expenses.

## FIN-19 — No participants selected

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Validation |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | n/a |
| Validation | On submit; Save disabled while empty. |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | split_among must be non-empty |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/FIN-19-no-participants-selected.png` |
| Annotated export | `screens/mobile/annotated/FIN-19-no-participants-selected-annotated.png` |
| Status | Accepted — batch 4 |

All/Clear makes an empty selection reachable in one tap.

## FIN-20 — Missing or invalid payer allocation

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Validation |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-23, CMP-25 |
| Loading / success / failure | n/a |
| Validation | On change and on submit. |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | paid_by_splits must be non-empty |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/FIN-20-invalid-payer-allocation.png` |
| Annotated export | `screens/mobile/annotated/FIN-20-invalid-payer-allocation-annotated.png` |
| Status | Accepted — batch 4 |

Offers the single-payer route as the way out instead of guessing a payer.

## FIN-21 — Expense saving

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Saving |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | No optimistic insert. |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Expense insert, server-confirmed |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/FIN-21-expense-saving.png` |
| Annotated export | `screens/mobile/annotated/FIN-21-expense-saving-annotated.png` |
| Status | Accepted — batch 4 |

Fields inert, backdrop and Escape suspended, no dashboard row drawn.

## FIN-22 — Expense saved

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Success |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | No duplicate row. |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Expense insert confirmed |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/FIN-22-expense-saved.png` |
| Annotated export | `screens/mobile/annotated/FIN-22-expense-saved-annotated.png` |
| Status | Accepted — batch 4 |

List re-reads from the server; the sheet closing is the feedback.

## FIN-23 — Expense server failure

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Server error |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | Retry is safe; no balance moved. |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Expense insert failure |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/FIN-23-expense-server-failure.png` |
| Annotated export | `screens/mobile/annotated/FIN-23-expense-server-failure-annotated.png` |
| Status | Accepted — batch 4 |

Values kept, ledger named as unchanged, Save live again.

## FIN-24 — Access changed while saving

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Stale permission |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-20 |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | Refused server-side; nothing saved. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Stale authorisation on write |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-02, E-04 |
| Clean export | `screens/mobile/clean/FIN-24-access-changed-while-saving.png` |
| Annotated export | `screens/mobile/annotated/FIN-24-access-changed-while-saving-annotated.png` |
| Status | Accepted — batch 4 |

Reuses PERM-17: focus to summary, values copyable, Close returns to an authorised destination.

## FIN-25 — Edit expense populated

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Populated |
| Viewport | 393x852 |
| Components | CMP-27, App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-29 |
| Loading / success / failure | n/a |
| Validation | Same exact-total rules as Add. |
| Permission | Refusal is server-side. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Expense update |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/FIN-25-edit-expense-populated.png` |
| Annotated export | `screens/mobile/annotated/FIN-25-edit-expense-populated-annotated.png` |
| Status | Accepted — batch 4 |

Recorder line is read-only; editing does not transfer authorship.

## FIN-26 — Edited expense saving

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Saving |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | No local recompute. |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Expense update, server-confirmed |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/FIN-26-edited-expense-saving.png` |
| Annotated export | `screens/mobile/annotated/FIN-26-edited-expense-saving-annotated.png` |
| Status | Accepted — batch 4 |

Same hold as FIN-21.

## FIN-27 — Edited expense saved

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Success |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-29 |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Expense update confirmed |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/FIN-27-edited-expense-saved.png` |
| Annotated export | `screens/mobile/annotated/FIN-27-edited-expense-saved-annotated.png` |
| Status | Accepted — batch 4 |

Recorded by and last edited are separate facts, both kept.

## FIN-28 — Edit conflict or stale data

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Stale data |
| Viewport | 393x852 |
| Components | CMP-33, App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | Nothing is written until the person chooses. |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Concurrent expense update |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/FIN-28-edit-conflict-stale-data.png` |
| Annotated export | `screens/mobile/annotated/FIN-28-edit-conflict-stale-data-annotated.png` |
| Status | Accepted — batch 4 |

Both versions shown; Reload theirs or Keep editing. No merge, no overwrite.

## FIN-29 — Historical accounting-rate explanation

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Explanation |
| Viewport | 393x852 |
| Components | CMP-28, App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-27 |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Recorded accounting rate per record |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/FIN-29-historical-accounting-rate.png` |
| Annotated export | `screens/mobile/annotated/FIN-29-historical-accounting-rate-annotated.png` |
| Status | Accepted — batch 4 |

Reachable from any accounting figure and from the FX tab.

## FIN-30 — Historical recorder attribution

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Attribution |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-29 |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | Attribution survives removal and claiming. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | created_by, paid_by, split_among as separate fields |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-09 |
| Clean export | `screens/mobile/clean/FIN-30-historical-recorder-attribution.png` |
| Annotated export | `screens/mobile/annotated/FIN-30-historical-recorder-attribution-annotated.png` |
| Status | Accepted — batch 4 |

Three facts, never collapsed into one owner.

## FIN-31 — Suggested transfers

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | CMP-31, App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | Any member sees the suggestions. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | settleUp() greedy minimum transfers |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-03 |
| Clean export | `screens/mobile/clean/FIN-31-suggested-transfers.png` |
| Annotated export | `screens/mobile/annotated/FIN-31-suggested-transfers-annotated.png` |
| Status | Accepted — batch 4 |

Exact output of source including its Astitva→Partha avoidance rule.

## FIN-32 — Current user can record payment

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Permitted action |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | Only the payer may record their own transfer. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Settlement insert by the debtor |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-03 |
| Clean export | `screens/mobile/clean/FIN-32-can-record-payment.png` |
| Annotated export | `screens/mobile/annotated/FIN-32-can-record-payment-annotated.png` |
| Status | Accepted — batch 4 |

Paid appears only on the current participant’s row, per source; raised to a 44px target.

## FIN-33 — Settlement confirmation

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Destructive confirmation |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-31 |
| Loading / success / failure | Server-confirmed only. |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Settlement insert, irreversible |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-02 |
| Clean export | `screens/mobile/clean/FIN-33-settlement-confirmation.png` |
| Annotated export | `screens/mobile/annotated/FIN-33-settlement-confirmation-annotated.png` |
| Status | Accepted — batch 4 |

Added ahead of an irreversible write; names both sides, both currencies, what changes and what becomes history.

## FIN-34 — Settlement recording

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Recording |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | No optimistic success. |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Settlement insert, server-confirmed |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/FIN-34-settlement-recording.png` |
| Annotated export | `screens/mobile/annotated/FIN-34-settlement-recording-annotated.png` |
| Status | Accepted — batch 4 |

Row holds, siblings inert, one submission only.

## FIN-35 — Settlement success

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Success |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-31 |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Settlement insert confirmed |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/FIN-35-settlement-success.png` |
| Annotated export | `screens/mobile/annotated/FIN-35-settlement-success-annotated.png` |
| Status | Accepted — batch 4 |

Refreshed hero, roster cell to even, new history row with recorder.

## FIN-36 — Settlement failure

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Server error |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | Transfer unrecorded, balances unchanged. |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Settlement insert failure |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/FIN-36-settlement-failure.png` |
| Annotated export | `screens/mobile/annotated/FIN-36-settlement-failure-annotated.png` |
| Status | Accepted — batch 4 |

Plain language replacing the raw error string in source; values kept for retry.

## FIN-37 — Idempotent settlement retry

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Idempotent result |
| Viewport | 393x852 |
| Components | CMP-32, App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | No duplicate settlement. |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Idempotent settlement operation |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/FIN-37-idempotent-settlement-retry.png` |
| Annotated export | `screens/mobile/annotated/FIN-37-idempotent-settlement-retry-annotated.png` |
| Status | Accepted — batch 4 |

Retry resolves to the existing record; explains why the screen appeared.

## FIN-38 — All suggested transfers completed

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | All settled |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | settleUp() empty output |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/FIN-38-all-transfers-completed.png` |
| Annotated export | `screens/mobile/annotated/FIN-38-all-transfers-completed-annotated.png` |
| Status | Accepted — batch 4 |

Source empty state verbatim, including its joke.

## FIN-39 — Inactive participant settlement history

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Inactive |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-30 |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Historical settlement attribution |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-09, E-11 |
| Clean export | `screens/mobile/clean/FIN-39-inactive-participant-settlement-history.png` |
| Annotated export | `screens/mobile/annotated/FIN-39-inactive-participant-settlement-history-annotated.png` |
| Status | Accepted — batch 4 |

History stays attributable; no new settlement is offered against an inactive relationship.

## FIN-40 — Archived Group finance

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Archived read-only |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-15 |
| Loading / success / failure | Pool labelled frozen. |
| Validation | n/a |
| Permission | Mutations refused server-side; Member sees no Restore. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Group archive read-only enforcement |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-11 |
| Clean export | `screens/mobile/clean/FIN-40-archived-group-finance.png` |
| Annotated export | `screens/mobile/annotated/FIN-40-archived-group-finance-annotated.png` |
| Status | Accepted — batch 4 |

Add, Settle up and every Edit absent; Owner Restore is the only live control.

## FIN-41 — Accounting currency indicator

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-26 |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Accounting currency is Group configuration |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-06 |
| Clean export | `screens/mobile/clean/FIN-41-accounting-currency-indicator.png` |
| Annotated export | `screens/mobile/annotated/FIN-41-accounting-currency-indicator-annotated.png` |
| Status | Accepted — batch 4 |

Answered once in the header; two-line money treatment carries the rest.

## FIN-42 — Original currency expense

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-27 |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Original values preserved with recorded rate |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/FIN-42-original-currency-expense.png` |
| Annotated export | `screens/mobile/annotated/FIN-42-original-currency-expense-annotated.png` |
| Status | Accepted — batch 4 |

Independent of the FX tab.

## FIN-43 — Live FX differs from accounting FX

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Explanation |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-28 |
| Loading / success / failure | Refreshing recalculates nothing. |
| Validation | n/a |
| Permission | n/a |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Live FX separate from accounting FX |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | — |
| Clean export | `screens/mobile/clean/FIN-43-live-fx-differs.png` |
| Annotated export | `screens/mobile/annotated/FIN-43-live-fx-differs-annotated.png` |
| Status | Accepted — batch 4 |

Three statements in the order people ask them.

## FIN-44 — Accounting value cannot be reconstructed

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Review required |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-33, CMP-27 |
| Loading / success / failure | Safe failure, not an error toast. |
| Validation | n/a |
| Permission | Reconciliation is an Owner action. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Controlled reconciliation |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/FIN-44-accounting-value-unavailable.png` |
| Annotated export | `screens/mobile/annotated/FIN-44-accounting-value-unavailable-annotated.png` |
| Status | Accepted — batch 4 |

No live-rate substitution, no rounding, no published change; the row is held out and the total stated as a floor.

## FIN-45 — Group finance context switch

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Switching |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-10 |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | New Group data appears only after its own authorised read. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Group switch clears finance context |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/FIN-45-group-finance-switch.png` |
| Annotated export | `screens/mobile/annotated/FIN-45-group-finance-switch-annotated.png` |
| Status | Accepted — batch 4 |

Three paints: clear, skeleton, new ledger. No mixed content in any frame.

## FIN-46 — Finance Group switch failure

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Switch failure |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | Target Group data never appears, not even partially. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Group switch failure |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/FIN-46-finance-switch-failure.png` |
| Annotated export | `screens/mobile/annotated/FIN-46-finance-switch-failure-annotated.png` |
| Status | Accepted — batch 4 |

Previous Group stays selected and consistent; retry restarts the whole switch.

## FIN-47 — No finance access after Group switch

| Field | Value |
|---|---|
| Flow | Flow H — finance and settlement |
| Group | — |
| State | Permission denied |
| Viewport | 393x852 |
| Components | App shell, sticky header, bottom nav, BalanceHero, GroupTotals, ExpenseCard, AddExpenseModal, SettleUpModal, primary button, secondary button, CMP-17, CMP-22 |
| Loading / success / failure | n/a |
| Validation | n/a |
| Permission | No indication of which condition refused. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Dialogs cap at 480px over a dark blurred backdrop. Amount figures never wrap at any width; descriptions ellipsize. No layout change between viewports and no new breakpoint. |
| Architecture reference | Deny-by-default read after switch |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-008, IR-011, IR-021 |
| Exceptions | E-10 |
| Clean export | `screens/mobile/clean/FIN-47-no-finance-access-after-switch.png` |
| Annotated export | `screens/mobile/annotated/FIN-47-no-finance-access-after-switch-annotated.png` |
| Status | Accepted — batch 4 |

PERM-03 reached from Split; previous balances cleared, tabs hidden.


---

# Board 16

## DOC-01 — Scan default

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Default |
| Viewport | 393x852 |
| Components | CMP-34, CMP-35, CMP-36, App shell, sticky header, bottom nav, TabHero copy pair, dashed upload target, assignment toggle, SCAN IT button, previously-scanned rows |
| Loading / success / failure | Loading is DOC-03. No error state on entry. Success is a new row after DOC-36. |
| Validation | No form fields. Type and size are validated on selection, before any upload. |
| Permission | Any active Member may upload. History shows only documents the reader is authorised to open; the count is reader-scoped. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Documents belong to one Group; supported types validated before trusted processing |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-03, E-04 |
| Clean export | `screens/mobile/clean/DOC-01-scan-default.png` |
| Annotated export | `screens/mobile/annotated/DOC-01-scan-default-annotated.png` |
| Status | Accepted — batch 5 |

Tapping the target opens the platform chooser (DOC-10). The toggle switches document audience between only-you and everyone. SCAN IT is disabled until a file exists.

## DOC-02 — Empty document history

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Empty |
| Viewport | 393x852 |
| Components | CMP-11, App shell, sticky header, bottom nav, TabHero copy pair, dashed upload target, assignment toggle, SCAN IT button, previously-scanned rows |
| Loading / success / failure | This is the empty state itself. |
| Validation | No form. |
| Permission | An unauthorised reader sees this same empty plate rather than a count of hidden documents. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | No existence disclosure through counts |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-03 |
| Clean export | `screens/mobile/clean/DOC-02-empty-document-history.png` |
| Annotated export | `screens/mobile/annotated/DOC-02-empty-document-history-annotated.png` |
| Status | Accepted — batch 5 |

Upload target remains primary. Light copy is permitted here.

## DOC-03 — Documents loading

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Loading |
| Viewport | 393x852 |
| Components | CMP-10, App shell, sticky header, bottom nav, TabHero copy pair, dashed upload target, assignment toggle, SCAN IT button, previously-scanned rows, skeleton rows |
| Loading / success / failure | Loading state. Failure resolves to the empty plate or to a connection state, never to partial metadata. |
| Validation | No form. |
| Permission | Skeletons carry no filenames, uploader initials or counts. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | No document metadata before authorization succeeds |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/DOC-03-documents-loading.png` |
| Annotated export | `screens/mobile/annotated/DOC-03-documents-loading-annotated.png` |
| Status | Accepted — batch 5 |

File selection stays usable while history loads.

## DOC-04 — Selected PDF

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | File selected |
| Viewport | 393x852 |
| Components | CMP-34, CMP-35, App shell, sticky header, bottom nav, TabHero copy pair, dashed upload target, assignment toggle, SCAN IT button, previously-scanned rows |
| Loading / success / failure | No loading. Errors are DOC-06 to DOC-09. |
| Validation | Filename, type and size shown; type validated locally. |
| Permission | Local state only — no server call, no authorization implication. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | PDF and supported image uploads accepted; validation before trusted processing |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-03, E-04 |
| Clean export | `screens/mobile/clean/DOC-04-selected-pdf.png` |
| Annotated export | `screens/mobile/annotated/DOC-04-selected-pdf-annotated.png` |
| Status | Accepted — batch 5 |

Replace and Remove sit together. SCAN IT becomes enabled. Nothing is uploaded yet.

## DOC-05 — Selected image

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | File selected · image |
| Viewport | 393x852 |
| Components | CMP-34, CMP-35, dashed upload target, SCAN IT button |
| Loading / success / failure | No loading or error variant. |
| Validation | MIME type reported by the validator, never inferred from the extension. |
| Permission | Local state only. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Supported image uploads accepted |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-03, E-07 |
| Clean export | `screens/mobile/clean/DOC-05-selected-image.png` |
| Annotated export | `screens/mobile/annotated/DOC-05-selected-image-annotated.png` |
| Status | Accepted — batch 5 |

Framed thumbnail with pixel dimensions and an IMAGE badge; one component, two content variants.

## DOC-06 — Unsupported file type

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Validation error |
| Viewport | 393x852 |
| Components | CMP-34, file row, notice, primary button |
| Loading / success / failure | Error state. Nothing uploaded, no Event. |
| Validation | Type rejected on selection. Accepted types named in the message. |
| Permission | No server involvement, so no permission dimension. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | File type validated before trusted processing |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/DOC-06-unsupported-file-type.png` |
| Annotated export | `screens/mobile/annotated/DOC-06-unsupported-file-type-annotated.png` |
| Status | Accepted — batch 5 |

Rejected locally; Scan stays disabled until a supported file replaces it.

## DOC-07 — File too large

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Validation error |
| Viewport | 393x852 |
| Components | CMP-34, file row, notice, primary button |
| Loading / success / failure | Error state. Nothing uploaded. |
| Validation | Size rejected on selection. |
| Permission | No server involvement. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | File size validated before trusted processing; ceiling is implementation configuration |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-07-file-too-large.png` |
| Annotated export | `screens/mobile/annotated/DOC-07-file-too-large-annotated.png` |
| Status | Corrected in batch 6 |

Configuration-neutral copy — no numeric ceiling is stated because none is accepted (O-11).

## DOC-08 — Damaged or unreadable local file

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Local read failure |
| Viewport | 393x852 |
| Components | CMP-34, file row, notice |
| Loading / success / failure | Error state. Nothing uploaded, no Event. |
| Validation | Bytes unreadable although the type passed. |
| Permission | No server involvement. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Validation before trusted processing |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-08-damaged-local-file.png` |
| Annotated export | `screens/mobile/annotated/DOC-08-damaged-local-file-annotated.png` |
| Status | Accepted — batch 5 |

Distinct from unsupported type: waiting can resolve a syncing cloud file, so Try again is offered first.

## DOC-09 — File removed before upload

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Selection lost |
| Viewport | 393x852 |
| Components | CMP-34, dashed upload target, notice |
| Loading / success / failure | Calm state, not an error. Nothing uploaded, nothing created. |
| Validation | No form. |
| Permission | No server involvement. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Validation before trusted processing |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-09-file-removed-before-upload.png` |
| Annotated export | `screens/mobile/annotated/DOC-09-file-removed-before-upload-annotated.png` |
| Status | Accepted — batch 5 |

Selection is cleared rather than left pointing at a dead handle; the target returns to empty.

## DOC-10 — Native chooser hand-off contract

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Contract · before, during, after ×4 |
| Viewport | 393x852 |
| Components | dashed upload target |
| Loading / success / failure | Contract plate — no loading, error or success variant of its own. |
| Validation | No form. |
| Permission | Platform permission prompts are OS-owned and not designed here. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Platform-owned file chooser is outside application scope |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-10-native-chooser-contract.png` |
| Annotated export | `screens/mobile/annotated/DOC-10-native-chooser-contract-annotated.png` |
| Status | Accepted — batch 5 |

Enumerates all four returns: file, cancellation, permission refusal, unreadable bytes. Cancellation leaves the previous selection untouched.

## DOC-11 — Extracted Event shown to the current participant

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Private to one |
| Viewport | 393x852 |
| Components | CMP-36, CMP-41, assignment toggle, file row, participant chips |
| Loading / success / failure | No loading. Errors are DOC-17. |
| Validation | No form. |
| Permission | Only the current participant may open it. Others see no name, uploader, thumbnail or count. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Documents are private; access requires current authorization |
| IR owner | IR-012 |
| Wave | W4 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-11-extracted-event-shown-to-the-current-participant.png` |
| Annotated export | `screens/mobile/annotated/DOC-11-extracted-event-shown-to-the-current-participant-annotated.png` |
| Status | Corrected in batch 6 |

The accepted toggle, off. Audience summary states the consequence before the upload rather than after.

## DOC-12 — Extracted Event shown to everyone

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Group audience |
| Viewport | 393x852 |
| Components | CMP-41, assignment toggle, file row, participant chips |
| Loading / success / failure | No loading or error variant. |
| Validation | No form. |
| Permission | Removed members lose access without the document being edited. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Access requires current authorization; membership-derived |
| IR owner | IR-012 |
| Wave | W4 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-12-extracted-event-shown-to-everyone.png` |
| Annotated export | `screens/mobile/annotated/DOC-12-extracted-event-shown-to-everyone-annotated.png` |
| Status | Corrected in batch 6 |

Toggle on. Audience is current active membership, evaluated at open time and not frozen at upload.

## DOC-13 — Selected participant Event presentation

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Selected audience |
| Viewport | 393x852 |
| Components | CMP-41, participant chips, notice, primary button, file row |
| Loading / success / failure | No loading. Errors are DOC-17. |
| Validation | At least one participant is required. |
| Permission | Excluded participants see nothing about the document; they can still read Events in this Group. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Document audience distinct from Event presentation |
| IR owner | IR-012 |
| Wave | W4 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-04, E-09 |
| Clean export | `screens/mobile/clean/DOC-13-selected-participant-event-presentation.png` |
| Annotated export | `screens/mobile/annotated/DOC-13-selected-participant-event-presentation-annotated.png` |
| Status | Corrected in batch 6 |

Two summaries from one selection: document access, and Event presentation. The phrase private Event is never used.

## DOC-14 — Unclaimed participant Event presentation

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Unclaimed selected |
| Viewport | 393x852 |
| Components | CMP-41, participant chips, notice, primary button |
| Loading / success / failure | No loading or error variant. |
| Validation | Selection valid; grants no account authority. |
| Permission | No document access is granted to anybody by selecting an unclaimed participant. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Participant claiming; presentation is not authority |
| IR owner | IR-012 |
| Wave | W4 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-09, E-08 |
| Clean export | `screens/mobile/clean/DOC-14-unclaimed-participant-event-presentation.png` |
| Annotated export | `screens/mobile/annotated/DOC-14-unclaimed-participant-event-presentation-annotated.png` |
| Status | Corrected in batch 6 |

Warm neutral #C8B8A6, dashed ring, visible initial and name, literal UNCLAIMED word.

## DOC-15 — Inactive participant, no new presentation

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Inactive · unassignable |
| Viewport | 393x852 |
| Components | CMP-41, participant chips, notice, primary button, document list row, badge |
| Loading / success / failure | No loading. No error — the control is simply unavailable. |
| Validation | New assignment rejected for inactive participants. |
| Permission | Historical attribution preserved; no present authority follows from the name. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Inactive participants receive no current document authority |
| IR owner | IR-012 |
| Wave | W4 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-09 |
| Clean export | `screens/mobile/clean/DOC-15-inactive-participant-unavailable-for-new-event-presentation.png` |
| Annotated export | `screens/mobile/annotated/DOC-15-inactive-participant-unavailable-for-new-event-presentation-annotated.png` |
| Status | Corrected in batch 6 |

Chip present but unselectable and labelled; historical rows below stay visible and attributed.

## DOC-16 — Document access versus Event presentation

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Explanation · contract |
| Viewport | 393x852 |
| Components | CMP-41, notice |
| Loading / success / failure | Contract plate — no loading, error or success variant. |
| Validation | No form. |
| Permission | Document audience is enforced; Event read authority belongs to every active Member. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Document access is confidentiality; Event presentation is placement |
| IR owner | IR-012 |
| Wave | W4 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-16-document-access-versus-event-presentation.png` |
| Annotated export | `screens/mobile/annotated/DOC-16-document-access-versus-event-presentation-annotated.png` |
| Status | Corrected in batch 6 |

Fixes the vocabulary for the board. Product copy: the document is private to the people you selected.

## DOC-17 — Event presentation validation failure

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Validation · unknown, removed, cross-Group, empty |
| Viewport | 393x852 |
| Components | CMP-20, CMP-41, form field, notice, primary button |
| Loading / success / failure | Server-confirmed error. Nothing uploaded, no Event. |
| Validation | Empty audience is separated because it is the user’s own omission. |
| Permission | A cross-Group participant id never produces a distinguishable message or an echoed identifier. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Server-side audience validation; no cross-Group disclosure |
| IR owner | IR-012 |
| Wave | W4 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/DOC-17-event-presentation-validation-failure.png` |
| Annotated export | `screens/mobile/annotated/DOC-17-event-presentation-validation-failure-annotated.png` |
| Status | Corrected in batch 6 |

Four server rejections, one user-facing line for the first three. Empty audience gets its own instruction.

## DOC-18 — Event presentation changed mid-review

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Stale membership |
| Viewport | 393x852 |
| Components | CMP-20, CMP-41, participant chips, notice, primary button |
| Loading / success / failure | Warning state, server-informed. Nothing uploaded, nothing created. |
| Validation | Selection corrected before submission; no write is attempted against a known-stale list. |
| Permission | Reuses PERM-17 and PERM-18 patterns. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Membership resolution at write time |
| IR owner | IR-012 |
| Wave | W4 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-18-event-presentation-changed-while-review-was-open.png` |
| Annotated export | `screens/mobile/annotated/DOC-18-event-presentation-changed-while-review-was-open-annotated.png` |
| Status | Corrected in batch 6 |

Stale participant removed from the selection in place; file, remaining assignment and flow position preserved.

## DOC-19 — Uploading document

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Uploading · not optimistic |
| Viewport | 393x852 |
| Components | CMP-36, file row, progress bar, disabled button |
| Loading / success / failure | Loading state. No history row and no Event exist yet, stated explicitly. |
| Validation | No form. |
| Permission | No authorization change during upload. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Storage acceptance is the trust boundary |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/DOC-19-uploading-document.png` |
| Annotated export | `screens/mobile/annotated/DOC-19-uploading-document-annotated.png` |
| Status | Accepted — batch 5 |

Assignment and Replace disabled for the duration; Cancel stays live because abandoning is safe.

## DOC-20 — Upload completed, parsing begins

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Object accepted |
| Viewport | 393x852 |
| Components | CMP-36, CMP-37, file row, notice, spinner |
| Loading / success / failure | Storage success plus parse loading. No Event yet. |
| Validation | No form. |
| Permission | Document is private to its audience from the moment of acceptance. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Storage completion distinct from extraction completion |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/DOC-20-upload-done-parsing-begins.png` |
| Annotated export | `screens/mobile/annotated/DOC-20-upload-done-parsing-begins-annotated.png` |
| Status | Accepted — batch 5 |

The state most products collapse, split. Six-step ladder names which state this is.

## DOC-21 — Scanning / parsing

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Parsing |
| Viewport | 393x852 |
| Components | CMP-37, file row, spinner |
| Loading / success / failure | Loading state. Errors are DOC-24, DOC-25, DOC-28. |
| Validation | No form. |
| Permission | No permission dimension. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Extraction output is non-authoritative |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/DOC-21-scanning-parse-in-progress.png` |
| Annotated export | `screens/mobile/annotated/DOC-21-scanning-parse-in-progress-annotated.png` |
| Status | Accepted — batch 5 |

Accepted spinner and the accepted word Scanning…, reused unmodified; the ladder makes the single spinner honest.

## DOC-22 — Parsing taking longer than expected

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Slow parse |
| Viewport | 393x852 |
| Components | CMP-37, spinner, notice, primary button |
| Loading / success / failure | Extended loading. Stop produces a stored document with no Event. |
| Validation | No form. |
| Permission | No permission dimension. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | No accepted background-continuation contract (O-12) |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/DOC-22-parsing-slower-than-expected.png` |
| Annotated export | `screens/mobile/annotated/DOC-22-parsing-slower-than-expected-annotated.png` |
| Status | Corrected in batch 6 |

Screen must stay open; Stop is honest and lands in DOC-24’s state. Background work is not promised.

## DOC-23 — Upload failure before object acceptance

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Pre-acceptance failure |
| Viewport | 393x852 |
| Components | CMP-36, file row, notice, primary button |
| Loading / success / failure | Error state. Nothing stored, no metadata, no Event; retry cannot duplicate. |
| Validation | No form. |
| Permission | No permission dimension. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Storage acceptance is the retry boundary |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-23-upload-failed-before-acceptance.png` |
| Annotated export | `screens/mobile/annotated/DOC-23-upload-failed-before-acceptance-annotated.png` |
| Status | Accepted — batch 5 |

Local selection survives, so retry costs one tap. Retry is declared safe.

## DOC-24 — Storage accepted, parser failed

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Parse failed · object kept |
| Viewport | 393x852 |
| Components | CMP-37, CMP-42, notice, document list row, primary button |
| Loading / success / failure | Asymmetric failure. Document exists, Event does not; row carries NOT READ. |
| Validation | No form. |
| Permission | Document remains private to its audience. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Extraction output is non-authoritative; document metadata and object remain reconcilable |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/DOC-24-storage-accepted-parser-failed.png` |
| Annotated export | `screens/mobile/annotated/DOC-24-storage-accepted-parser-failed-annotated.png` |
| Status | Accepted — batch 5 |

Two real choices: retry reading, or remove the document. No partial extracted values are shown.

## DOC-25 — Parser unavailable

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Parser unavailable |
| Viewport | 393x852 |
| Components | CMP-37, notice, primary button |
| Loading / success / failure | Error state. Document saved, no Event, retry offered. |
| Validation | No form. |
| Permission | Not a permission failure, and says so. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | AI provider and model identity is not a parity requirement |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-25-parser-unavailable.png` |
| Annotated export | `screens/mobile/annotated/DOC-25-parser-unavailable-annotated.png` |
| Status | Accepted — batch 5 |

Four look-alikes ruled out on the face of the screen: offline, permission, invalid file, database.

## DOC-26 — Parse output returned

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Review · non-authoritative |
| Viewport | 393x852 |
| Components | CMP-38, CMP-39, form field, notice, primary button |
| Loading / success / failure | Parse success. No Event yet. |
| Validation | Every field editable; Event rules validated at DOC-31. |
| Permission | No permission dimension until creation. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Extracted values require validation before becoming an Event |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-26-parse-output-returned.png` |
| Annotated export | `screens/mobile/annotated/DOC-26-parse-output-returned-annotated.png` |
| Status | Accepted — batch 5 |

Arrives as a form, never a result. Primary action is Continue, not Save. Provenance shown per field.

## DOC-27 — Parse warning

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Caution ×4 |
| Viewport | 393x852 |
| Components | CMP-38, CMP-39, form field, notice |
| Loading / success / failure | Warning state, not failure. |
| Validation | Caution, not error — Continue remains enabled. |
| Permission | No permission dimension. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Extraction is non-authoritative; user review resolves uncertainty |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04, E-05 |
| Clean export | `screens/mobile/clean/DOC-27-parse-warnings.png` |
| Annotated export | `screens/mobile/annotated/DOC-27-parse-warnings-annotated.png` |
| Status | Accepted — batch 5 |

Uncertain date, missing reference, ambiguous location, timezone confirmation. Focusable summary strip walks them in order.

## DOC-28 — Parse failure

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Parse failed · no values |
| Viewport | 393x852 |
| Components | CMP-37, notice, primary button |
| Loading / success / failure | Error state. Document saved, no values, no Event. |
| Validation | No form. |
| Permission | Document remains private to its audience. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | No screen promises perfect extraction |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-28-parse-failure.png` |
| Annotated export | `screens/mobile/annotated/DOC-28-parse-failure-annotated.png` |
| Status | Accepted — batch 5 |

No half-filled review form is offered; manual Add Event is the primary path.

## DOC-29 — Extraction provider detail excluded

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Copy rule · contract |
| Viewport | 393x852 |
| Components | notice |
| Loading / success / failure | Contract plate. |
| Validation | No form. |
| Permission | No permission dimension. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | AI provider or model identity is not a parity requirement or acceptance evidence |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-29-provider-detail-excluded.png` |
| Annotated export | `screens/mobile/annotated/DOC-29-provider-detail-excluded-annotated.png` |
| Status | Accepted — batch 5 |

Fixes the product vocabulary: the reading service, and nothing more specific.

## DOC-30 — Review extracted booking

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Review · editable |
| Viewport | 393x852 |
| Components | CMP-38, CMP-40, Add Event form fields, participant chips, primary button, secondary button |
| Loading / success / failure | No loading until Create. Errors are DOC-31, DOC-32, DOC-37, DOC-38. |
| Validation | Event rules apply, not parser confidence. Type, title and start are required. |
| Permission | Creation requires current Event-write authority in this Group. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Extracted values require validation; scan-derived Event has distinct provenance |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-30-review-extracted-booking.png` |
| Annotated export | `screens/mobile/annotated/DOC-30-review-extracted-booking-annotated.png` |
| Status | Accepted — batch 5 |

The accepted Add Event form reused field for field, plus the provenance badge and Group-timezone context.

## DOC-31 — Required extracted-field validation

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Validation |
| Viewport | 393x852 |
| Components | CMP-38, form field, notice, disabled button |
| Loading / success / failure | Validation error. Document already saved; no Event. |
| Validation | Validated on the Event’s own rules. No placeholder title or inferred date is generated. |
| Permission | No permission dimension until submit. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Extracted values require validation before becoming an Event |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-31-required-field-validation.png` |
| Annotated export | `screens/mobile/annotated/DOC-31-required-field-validation-annotated.png` |
| Status | Accepted — batch 5 |

Create disabled; each missing field states its requirement; focusable summary strip reaches the first error.

## DOC-32 — Invalid end time

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Validation |
| Viewport | 393x852 |
| Components | CMP-38, form field, notice, disabled button |
| Loading / success / failure | Validation error. |
| Validation | End before start blocks Create. No silent day increment. |
| Permission | No permission dimension. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Group IANA timezone is authoritative; device timezone is not |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-32-invalid-end-time.png` |
| Annotated export | `screens/mobile/annotated/DOC-32-invalid-end-time-annotated.png` |
| Status | Accepted — batch 5 |

Names the likely overnight cause, keeps both values visible, refuses to auto-correct.

## DOC-33 — Timezone confirmation

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Confirmation |
| Viewport | 393x852 |
| Components | CMP-38, notice, primary button |
| Loading / success / failure | Confirmation state. |
| Validation | Confirmation required when the parsed timezone is uncertain. |
| Permission | No permission dimension. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Group IANA timezone from Group configuration (O-02) |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-33-timezone-confirmation.png` |
| Annotated export | `screens/mobile/annotated/DOC-33-timezone-confirmation-annotated.png` |
| Status | Accepted — batch 5 |

Document time, device timezone and the Group timezone shown together so the device’s irrelevance is visible.

## DOC-34 — Scan-derived Event preview

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Preview |
| Viewport | 393x852 |
| Components | CMP-40, Event card, badge, participant chips |
| Loading / success / failure | Preview state. |
| Validation | No form. |
| Permission | Presentation audience shown; Event read authority is Group-wide for active Members. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | A scan-derived Event has distinct provenance from a manually created Event |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-34-scan-derived-event-preview.png` |
| Annotated export | `screens/mobile/annotated/DOC-34-scan-derived-event-preview-annotated.png` |
| Status | Accepted — batch 5 |

Badge reads FROM DOCUMENT SCAN. Provenance is recorded and stays visible on the Event.

## DOC-35 — Create Event in progress

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | In progress · not optimistic |
| Viewport | 393x852 |
| Components | spinner, disabled button |
| Loading / success / failure | Loading state. Itinerary unchanged until the server confirms. |
| Validation | No form interaction while in flight. |
| Permission | Authority re-evaluated server-side at write time. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Server-confirmed Event creation |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/DOC-35-creating-event.png` |
| Annotated export | `screens/mobile/annotated/DOC-35-creating-event-annotated.png` |
| Status | Accepted — batch 5 |

Create is replaced rather than disabled, so duplicate submission is impossible by construction.

## DOC-36 — Event and document association success

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Success |
| Viewport | 393x852 |
| Components | CMP-40, CMP-42, notice, document list row, badge |
| Loading / success / failure | Success state, server-confirmed. |
| Validation | No form. |
| Permission | Audience applied as selected; no widening. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Document metadata, Storage object and Event remain reconcilable |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-36-event-document-associated.png` |
| Annotated export | `screens/mobile/annotated/DOC-36-event-document-associated-annotated.png` |
| Status | Accepted — batch 5 |

Four outcomes stated separately: document retained, Event created, provenance recorded, presentation applied.

## DOC-37 — Event creation failure after valid parse

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Server error · atomic |
| Viewport | 393x852 |
| Components | CMP-20, notice, primary button |
| Loading / success / failure | Error state. Document retained, no Event, no partial write. |
| Validation | Reviewed values retained verbatim. |
| Permission | Not a permission failure. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Atomic Event creation |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-37-event-creation-failed.png` |
| Annotated export | `screens/mobile/annotated/DOC-37-event-creation-failed-annotated.png` |
| Status | Accepted — batch 5 |

Reviewed values persist across the failure; retry is declared safe; keeping the document only is an offered outcome.

## DOC-38 — Access changed during Event creation

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Denied · server-confirmed |
| Viewport | 393x852 |
| Components | CMP-20, notice, primary button |
| Loading / success / failure | Error state. Nothing created, document unchanged. |
| Validation | Reviewed values are not offered back; there is nowhere valid to submit them. |
| Permission | Membership changed mid-action; server refused. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Authorization evaluated at write time |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/DOC-38-access-changed-during-creation.png` |
| Annotated export | `screens/mobile/annotated/DOC-38-access-changed-during-creation-annotated.png` |
| Status | Accepted — batch 5 |

Reuses CMP-20 unmodified. Retry is not offered, because retrying a denial is a second denial.

## DOC-39 — Duplicate-looking booking

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Caution · no auto-merge |
| Viewport | 393x852 |
| Components | CMP-39, notice, primary button, secondary button |
| Loading / success / failure | Warning state. |
| Validation | Caution only; no field is blocked. |
| Permission | Existing Event shown only if the reader may read it. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | No semantic duplicate detection is claimed (O-13) |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-39-duplicate-looking-booking.png` |
| Annotated export | `screens/mobile/annotated/DOC-39-duplicate-looking-booking-annotated.png` |
| Status | Corrected in batch 6 |

Three choices — create anyway, review existing, cancel. Both records shown side by side. Nothing merged or suppressed.

## DOC-40 — Populated document list

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Populated |
| Viewport | 393x852 |
| Components | CMP-42, CMP-43, App shell, sticky header, bottom nav, document list row, badge |
| Loading / success / failure | Loading is DOC-03; empty is DOC-02. |
| Validation | No form. |
| Permission | Only documents the reader may open appear; the count is reader-scoped. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Authorised list, view, download and safe removal supported |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-03, E-04 |
| Clean export | `screens/mobile/clean/DOC-40-populated-document-list.png` |
| Annotated export | `screens/mobile/annotated/DOC-40-populated-document-list-annotated.png` |
| Status | Corrected in batch 6 |

Name, type, date, audience summary, uploader attribution and Event status per 56px row.

## DOC-41 — Document details

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Details |
| Viewport | 393x852 |
| Components | CMP-41, CMP-43, file row, read rows, primary button, danger button |
| Loading / success / failure | No loading. Errors are DOC-54, DOC-55, DOC-60. |
| Validation | No form. |
| Permission | Actions shown only where the reader is authorised; Remove absent in archived Groups. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Object paths and identifiers reveal nothing |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-03, E-04 |
| Clean export | `screens/mobile/clean/DOC-41-document-details.png` |
| Annotated export | `screens/mobile/annotated/DOC-41-document-details-annotated.png` |
| Status | Corrected in batch 6 |

Four facts, three actions. No object path, bucket or identifier is shown.

## DOC-42 — Document with associated Event

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Associated |
| Viewport | 393x852 |
| Components | CMP-43, document list row, badge, Event card |
| Loading / success / failure | Success resting state. |
| Validation | No form. |
| Permission | Event shown only if the reader may read it. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Document, object and Event remain reconcilable in both directions |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-42-document-with-event.png` |
| Annotated export | `screens/mobile/annotated/DOC-42-document-with-event-annotated.png` |
| Status | Accepted — batch 5 |

Reachable from either side; the Event carries provenance, the document carries the link.

## DOC-43 — Document without Event

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | No Event |
| Viewport | 393x852 |
| Components | CMP-43, document list row, badge, notice, primary button |
| Loading / success / failure | Valid resting state, not an error. |
| Validation | No form. |
| Permission | Creation requires Event-write authority. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | A document with no Event is a valid outcome |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-43-document-without-event.png` |
| Annotated export | `screens/mobile/annotated/DOC-43-document-without-event-annotated.png` |
| Status | Accepted — batch 5 |

NO EVENT badge is gold, not red: nothing failed. Create Event from this is offered.

## DOC-44 — Parsing failed document

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Parse failed · history |
| Viewport | 393x852 |
| Components | CMP-43, document list row, badge, notice, primary button |
| Loading / success / failure | Persistent error state. |
| Validation | No form. |
| Permission | Retry requires the same authority as the original scan. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Extraction failure is persistent state, not a transient message |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-44-parsing-failed-document.png` |
| Annotated export | `screens/mobile/annotated/DOC-44-parsing-failed-document-annotated.png` |
| Status | Accepted — batch 5 |

Failure carried on the row so it survives a return visit; two recoveries stay reachable.

## DOC-45 — Historical inactive uploader

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Inactive attribution |
| Viewport | 393x852 |
| Components | CMP-42, document list row, badge, participant chips, read rows |
| Loading / success / failure | Historical state. |
| Validation | No form. |
| Permission | Inactive identity grants no present access and cannot be reassigned. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Uploader provenance derived from the authenticated actor; not client-selectable |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-09 |
| Clean export | `screens/mobile/clean/DOC-45-historical-inactive-uploader.png` |
| Annotated export | `screens/mobile/annotated/DOC-45-historical-inactive-uploader-annotated.png` |
| Status | Accepted — batch 5 |

Attribution and authority separated into different lines. Attribution is not editable by anyone.

## DOC-46 — Unclaimed historical uploader reference

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Unclaimed reference |
| Viewport | 393x852 |
| Components | CMP-42, document list row, badge, participant chips |
| Loading / success / failure | Historical state. |
| Validation | No form. |
| Permission | No account, no access until claimed. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Participant claiming carries history forward |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-09, E-08 |
| Clean export | `screens/mobile/clean/DOC-46-unclaimed-historical-reference.png` |
| Annotated export | `screens/mobile/annotated/DOC-46-unclaimed-historical-reference-annotated.png` |
| Status | Accepted — batch 5 |

Presentation is identical before and after a claim, so nothing shifts when a person arrives.

## DOC-47 — Long filename and metadata stress state

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Stress |
| Viewport | 393x852 |
| Components | CMP-42, document list row, badge, file row |
| Loading / success / failure | Layout proof, not a state. |
| Validation | No form. |
| Permission | Full name available in details and as the accessible label. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Filenames originate from other devices and airline systems |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-03, E-04 |
| Clean export | `screens/mobile/clean/DOC-47-long-filename-stress.png` |
| Annotated export | `screens/mobile/annotated/DOC-47-long-filename-stress-annotated.png` |
| Status | Accepted — batch 5 |

One line, ellipsised at the end, never wrapped. Row stays 56px; View stays reachable; audience truncates first.

## DOC-48 — Document list refresh / realtime update

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Realtime update |
| Viewport | 393x852 |
| Components | CMP-12, CMP-42, document list row, badge, connection banner |
| Loading / success / failure | Realtime success state. |
| Validation | No form. |
| Permission | Only authorised same-Group and document-audience clients receive the update. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime reads obey the same authorization as manual reads |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04, E-05 |
| Clean export | `screens/mobile/clean/DOC-48-list-realtime-update.png` |
| Annotated export | `screens/mobile/annotated/DOC-48-list-realtime-update-annotated.png` |
| Status | Corrected in batch 6 |

Banner invites rather than inserts, so the list does not reorder under a reading finger.

## DOC-49 — Document viewer loading

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Loading |
| Viewport | 393x852 |
| Components | CMP-44, viewer shell, header row, ghost button, spinner |
| Loading / success / failure | Loading state. |
| Validation | No form. |
| Permission | A denial from here renders DOC-55 with no partial page having been painted. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Access requires current authorization; no metadata before it succeeds |
| IR owner | IR-009 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/DOC-49-viewer-loading.png` |
| Annotated export | `screens/mobile/annotated/DOC-49-viewer-loading-annotated.png` |
| Status | Accepted — batch 5 |

Authorization is checked before any content is fetched; the frame stays empty on purpose.

## DOC-50 — PDF document view

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | PDF view |
| Viewport | 393x852 |
| Components | CMP-44, viewer shell, header row, ghost button |
| Loading / success / failure | Success state. |
| Validation | No form. |
| Permission | Only the document audience reaches this state. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Storage objects are private; public object URLs are not target behaviour |
| IR owner | IR-009 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-04, E-07 |
| Clean export | `screens/mobile/clean/DOC-50-pdf-document-view.png` |
| Annotated export | `screens/mobile/annotated/DOC-50-pdf-document-view-annotated.png` |
| Status | Accepted — batch 5 |

Rendered in-app from an authorised short-lived read. No address bar, no copyable link.

## DOC-51 — Image document view

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Image view |
| Viewport | 393x852 |
| Components | CMP-44, viewer shell, header row, ghost button |
| Loading / success / failure | Success state. |
| Validation | No form. |
| Permission | Only the document audience reaches this state. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Storage objects are private |
| IR owner | IR-009 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-04, E-07 |
| Clean export | `screens/mobile/clean/DOC-51-image-document-view.png` |
| Annotated export | `screens/mobile/annotated/DOC-51-image-document-view-annotated.png` |
| Status | Accepted — batch 5 |

Same shell, same header, same two actions; only the content area and zoom differ. One component for both types.

## DOC-52 — Download requested

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Preparing |
| Viewport | 393x852 |
| Components | CMP-44, file row, spinner, read rows |
| Loading / success / failure | Loading state. |
| Validation | No form. |
| Permission | Access re-checked at request time. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | No permanent or public URL; access re-checked per request |
| IR owner | IR-009 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/DOC-52-download-requested.png` |
| Annotated export | `screens/mobile/annotated/DOC-52-download-requested-annotated.png` |
| Status | Accepted — batch 5 |

A download is an authorised transfer, not a link handout. Nothing copyable appears on screen.

## DOC-53 — Download success

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Success |
| Viewport | 393x852 |
| Components | notice, document list row, badge |
| Loading / success / failure | Restrained success state. |
| Validation | No form. |
| Permission | No permission change. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Authorised download supported |
| IR owner | IR-009 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-53-download-success.png` |
| Annotated export | `screens/mobile/annotated/DOC-53-download-success-annotated.png` |
| Status | Accepted — batch 5 |

One line, then back to the list. No path echo, no share prompt.

## DOC-54 — Download failure

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Offline, missing, denied, generic |
| Viewport | 393x852 |
| Components | CMP-21, notice, read rows |
| Loading / success / failure | Error state, four variants. |
| Validation | No form. |
| Permission | Case 3 must read exactly like DOC-55 to avoid becoming a membership oracle. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Authorization change is indistinguishable from a private document |
| IR owner | IR-009 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/DOC-54-download-failure.png` |
| Annotated export | `screens/mobile/annotated/DOC-54-download-failure-annotated.png` |
| Status | Accepted — batch 5 |

Four causes, four recoveries, three distinguishable messages — the denial collapses into the generic unavailable wording.

## DOC-55 — Document unavailable

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Private |
| Viewport | 393x852 |
| Components | CMP-21, permission page, notice, read rows |
| Loading / success / failure | Denial state. |
| Validation | No form. |
| Permission | Not-found and not-allowed are indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | No document metadata is shown before authorization succeeds |
| IR owner | IR-009 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/DOC-55-document-unavailable.png` |
| Annotated export | `screens/mobile/annotated/DOC-55-document-unavailable-annotated.png` |
| Status | Corrected in batch 6 |

Reuses PERM-14 and CMP-21 verbatim. Five enumerated absences make the rule auditable.

## DOC-56 — Cross-Group object substitution denial

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Denied · non-revealing |
| Viewport | 393x852 |
| Components | CMP-21, permission page, notice |
| Loading / success / failure | Denial state. |
| Validation | No form. |
| Permission | A distinguishable response would make this an enumeration tool. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Cross-Group object IDs, metadata IDs and paths reveal nothing |
| IR owner | IR-009 |
| Wave | W3 |
| Related IR items | IR-007, IR-008, IR-013 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/DOC-56-cross-group-substitution-denied.png` |
| Annotated export | `screens/mobile/annotated/DOC-56-cross-group-substitution-denied-annotated.png` |
| Status | Accepted — batch 5 |

Byte-identical presentation to DOC-55. The requested identifier is not echoed and no Group is named.

## DOC-57 — Remove document confirmation

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Destructive confirmation |
| Viewport | 393x852 |
| Components | CMP-45, sheet, file row, read rows, danger button |
| Loading / success / failure | Confirmation state. |
| Validation | Deliberate confirmation; no removal without it. |
| Permission | Removal requires current document authority; absent in archived Groups. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Safe removal supported; Event survival is a target correction to v1 (C-14) |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-02, E-04 |
| Clean export | `screens/mobile/clean/DOC-57-remove-document-confirmation.png` |
| Annotated export | `screens/mobile/annotated/DOC-57-remove-document-confirmation-annotated.png` |
| Status | Corrected in batch 6 |

Impact enumerated: document removed, Event stays, provenance kept, access ends for everyone.

## DOC-58 — Removing document

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | In progress · not optimistic |
| Viewport | 393x852 |
| Components | spinner, read rows, disabled button |
| Loading / success / failure | Loading state. |
| Validation | No form. |
| Permission | No authorization change. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Server-confirmed removal |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/DOC-58-removing-document.png` |
| Annotated export | `screens/mobile/annotated/DOC-58-removing-document-annotated.png` |
| Status | Accepted — batch 5 |

The row is not hidden ahead of the server, because a person may act on believing a private file is gone.

## DOC-59 — Document removed

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Success |
| Viewport | 393x852 |
| Components | CMP-42, notice, document list row, badge |
| Loading / success / failure | Success state, server-confirmed. |
| Validation | No form. |
| Permission | Access ends for every reader. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Safe removal; associated Event retained |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-59-document-removed.png` |
| Annotated export | `screens/mobile/annotated/DOC-59-document-removed-annotated.png` |
| Status | Accepted — batch 5 |

Refreshed list, corrected count, and the surviving Event shown so the confirmation’s promise is closed.

## DOC-60 — Removal failure

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Server error · atomic |
| Viewport | 393x852 |
| Components | notice, read rows, document list row, badge |
| Loading / success / failure | Error state. Nothing changed. |
| Validation | No form. |
| Permission | No authorization change. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Atomic removal |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-60-removal-failure.png` |
| Annotated export | `screens/mobile/annotated/DOC-60-removal-failure-annotated.png` |
| Status | Accepted — batch 5 |

Four unchanged things stated, then the row still in place. Retry is a plain repeat, not a repair.

## DOC-61 — Removal partially completed

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Partial · detected |
| Viewport | 393x852 |
| Components | CMP-46, notice, read rows, document list row, badge |
| Loading / success / failure | Detected partial state. |
| Validation | No form. |
| Permission | Document is held and unusable until reconciled. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Partial object and database outcomes must be detected and recovered safely (C-14) |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/DOC-61-removal-partially-completed.png` |
| Annotated export | `screens/mobile/annotated/DOC-61-removal-partially-completed-annotated.png` |
| Status | Corrected in batch 6 |

Only for a detected inconsistency, never as a generic fallback. Success is not claimed.

## DOC-62 — Removal denied in archived Group

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Read-only |
| Viewport | 393x852 |
| Components | CMP-15, read-only banner, document list row, badge, read rows |
| Loading / success / failure | Read-only state. |
| Validation | No form. |
| Permission | Read and download remain; all mutations unavailable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Archived Groups reject document mutations |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-62-removal-denied-archived.png` |
| Annotated export | `screens/mobile/annotated/DOC-62-removal-denied-archived-annotated.png` |
| Status | Accepted — batch 5 |

Remove is absent rather than disabled; a stale client’s request is refused server-side too.

## DOC-63 — Metadata exists, object missing

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Orphan · object missing |
| Viewport | 393x852 |
| Components | CMP-46, notice, read rows, document list row, badge |
| Loading / success / failure | Orphan state. |
| Validation | No form. |
| Permission | Held document is unavailable to its whole audience. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Document metadata and Storage object must remain reconcilable |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04, E-07 |
| Clean export | `screens/mobile/clean/DOC-63-metadata-without-object.png` |
| Annotated export | `screens/mobile/annotated/DOC-63-metadata-without-object-annotated.png` |
| Status | Accepted — batch 5 |

Row stays discoverable but unopenable and labelled. No public fallback and no broken permanent URL.

## DOC-64 — Object exists, metadata missing

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Orphan · metadata missing |
| Viewport | 393x852 |
| Components | notice, read rows |
| Loading / success / failure | Contract plate. |
| Validation | No form. |
| Permission | A stored object with no record has no authorised audience. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Storage containing an object is not authorization to display it |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-64-object-without-metadata.png` |
| Annotated export | `screens/mobile/annotated/DOC-64-object-without-metadata-annotated.png` |
| Status | Corrected in batch 6 |

An operational contract plate. No product screen lists unrecorded objects and no contents are read.

## DOC-65 — Event exists, document association missing

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Orphan · link missing |
| Viewport | 393x852 |
| Components | CMP-40, CMP-46, Event card, badge, read rows |
| Loading / success / failure | Orphan state. |
| Validation | No form. |
| Permission | Event read authority unchanged. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Preserve an independently valid Event; invent no association |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-65-event-without-document-link.png` |
| Annotated export | `screens/mobile/annotated/DOC-65-event-without-document-link-annotated.png` |
| Status | Accepted — batch 5 |

Event survives with its provenance; no plausible document is guessed by filename, date or uploader.

## DOC-66 — Document exists, associated Event missing

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Orphan · Event missing |
| Viewport | 393x852 |
| Components | CMP-43, CMP-46, document list row, badge, notice, read rows |
| Loading / success / failure | Orphan state. |
| Validation | No form until re-read. |
| Permission | Retry offered only to a reader with Event-write authority. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Review and retry where authorised; no automatic recreation |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-66-document-without-its-event.png` |
| Annotated export | `screens/mobile/annotated/DOC-66-document-without-its-event-annotated.png` |
| Status | Accepted — batch 5 |

Re-reading goes through the ordinary review form, so no Event is created without confirmation.

## DOC-67 — Reconciliation in progress

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Reconciling |
| Viewport | 393x852 |
| Components | CMP-46, spinner, read rows, disabled button |
| Loading / success / failure | Loading state. |
| Validation | No form. |
| Permission | Access does not widen even temporarily. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Controlled reconciliation; verification before change |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/DOC-67-reconciliation-in-progress.png` |
| Annotated export | `screens/mobile/annotated/DOC-67-reconciliation-in-progress-annotated.png` |
| Status | Accepted — batch 5 |

Verification only: nothing created, nothing deleted, no access widened while the check runs.

## DOC-68 — Reconciliation succeeded

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Reconciled |
| Viewport | 393x852 |
| Components | CMP-46, notice, document list row, badge, read rows |
| Loading / success / failure | Success state. |
| Validation | No form. |
| Permission | No new access granted. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Repair restores consistency, not privilege |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-68-reconciliation-succeeded.png` |
| Annotated export | `screens/mobile/annotated/DOC-68-reconciliation-succeeded-annotated.png` |
| Status | Corrected in batch 6 |

Row loses its held badge. Audience is exactly what it was before; nobody gained access as a side effect.

## DOC-69 — Reconciliation failed safely

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Reconciliation failed |
| Viewport | 393x852 |
| Components | CMP-46, notice, read rows, primary button |
| Loading / success / failure | Error state. |
| Validation | No form. |
| Permission | Remains held; only an Owner may re-check or remove. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Failure must be safe: no exposure, no fabrication |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/DOC-69-reconciliation-failed-safely.png` |
| Annotated export | `screens/mobile/annotated/DOC-69-reconciliation-failed-safely-annotated.png` |
| Status | Corrected in batch 6 |

Safety envelope stated: no public exposure, no fabricated Event, no audience drift; two next actions.

## DOC-70 — Reconciliation unavailable to ordinary Member

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Denied · plain guidance |
| Viewport | 393x852 |
| Components | CMP-16, CMP-46, document list row, badge, notice, read rows |
| Loading / success / failure | Denial state. |
| Validation | No form. |
| Permission | Member sees unavailability only; Owner surfaces carry the repair path. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Operational repair controls are not exposed to ordinary Members |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/DOC-70-reconciliation-unavailable-to-member.png` |
| Annotated export | `screens/mobile/annotated/DOC-70-reconciliation-unavailable-to-member-annotated.png` |
| Status | Accepted — batch 5 |

Plain support guidance; no repair controls, no diagnosis, no operational vocabulary.

## DOC-71 — Offline before upload

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Offline |
| Viewport | 393x852 |
| Components | CMP-12, connection banner, file row, read rows |
| Loading / success / failure | Offline state. |
| Validation | No form. |
| Permission | No permission dimension. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Local selection survives loss of connection |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-71-offline-before-upload.png` |
| Annotated export | `screens/mobile/annotated/DOC-71-offline-before-upload-annotated.png` |
| Status | Accepted — batch 5 |

Selection holds because it is local; the action waits. No hidden queue and no promised later upload.

## DOC-72 — Connection lost during upload

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Upload interrupted |
| Viewport | 393x852 |
| Components | CMP-36, notice, read rows, file row |
| Loading / success / failure | Error state. |
| Validation | No form. |
| Permission | No permission dimension. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Resumable upload is not claimed (O-14) |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-72-connection-lost-during-upload.png` |
| Annotated export | `screens/mobile/annotated/DOC-72-connection-lost-during-upload-annotated.png` |
| Status | Corrected in batch 6 |

Restart stated as restart: retry begins at 0%. Nothing was stored.

## DOC-73 — Connection lost during parsing

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Outcome unknown |
| Viewport | 393x852 |
| Components | CMP-37, notice, read rows |
| Loading / success / failure | Uncertain state, honestly labelled. |
| Validation | No form. |
| Permission | No permission dimension. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | A client disconnect is not evidence about a trusted operation |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-73-connection-lost-during-parsing.png` |
| Annotated export | `screens/mobile/annotated/DOC-73-connection-lost-during-parsing-annotated.png` |
| Status | Accepted — batch 5 |

Two states read unknown rather than being guessed; refresh is the only safe claim.

## DOC-74 — Reconnecting document list

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Reconnecting |
| Viewport | 393x852 |
| Components | CMP-12, connection banner, document list row, badge |
| Loading / success / failure | Reconnecting state. |
| Validation | No form. |
| Permission | Shows only what the reader last had access to. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Stale-but-authorised beats empty; mutations paused |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-05 |
| Clean export | `screens/mobile/clean/DOC-74-reconnecting-document-list.png` |
| Annotated export | `screens/mobile/annotated/DOC-74-reconnecting-document-list-annotated.png` |
| Status | Accepted — batch 5 |

Last authorised list dims rather than clearing; no unverified refresh, no queued writes.

## DOC-75 — Back in sync

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | In sync |
| Viewport | 393x852 |
| Components | CMP-12, connection banner, document list row, badge, read rows |
| Loading / success / failure | Success state. |
| Validation | No form. |
| Permission | Membership changes apply in both directions. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Reconnect re-evaluates authorization |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-75-back-in-sync.png` |
| Annotated export | `screens/mobile/annotated/DOC-75-back-in-sync-annotated.png` |
| Status | Accepted — batch 5 |

A full authorised re-read, not a delta replay. Lost access removes rows in the same pass.

## DOC-76 — Group switch from Scan / Documents

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Cleared, loading, rendered |
| Viewport | 393x852 |
| Components | GRP-03, skeleton rows, document list row, badge |
| Loading / success / failure | Three-step sequence. |
| Validation | No form. |
| Permission | No cross-Group content is ever simultaneously present in the client. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Group switching must clear before it loads |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04, E-05 |
| Clean export | `screens/mobile/clean/DOC-76-group-switch-sequence.png` |
| Annotated export | `screens/mobile/annotated/DOC-76-group-switch-sequence-annotated.png` |
| Status | Accepted — batch 5 |

Clear, then load, then render. No merged list and no old rows behind a spinner.

## DOC-77 — Group switch failure

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Switch failure |
| Viewport | 393x852 |
| Components | GRP-04, notice, read rows, document list row, badge |
| Loading / success / failure | Error state. |
| Validation | No form. |
| Permission | No half-switched shell; header and list always agree. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | A failed switch leaves one consistent Group selected |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-77-group-switch-failure.png` |
| Annotated export | `screens/mobile/annotated/DOC-77-group-switch-failure-annotated.png` |
| Status | Accepted — batch 5 |

Previous Group re-rendered from its own authorised read, not from what survived the attempt.

## DOC-78 — New Group has no document access

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Denied after switch |
| Viewport | 393x852 |
| Components | CMP-21, permission page, read rows |
| Loading / success / failure | Denial state. |
| Validation | No form. |
| Permission | Reuses PERM-01 presentation. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Old Group content is cleared, not covered |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/DOC-78-new-group-no-document-access.png` |
| Annotated export | `screens/mobile/annotated/DOC-78-new-group-no-document-access-annotated.png` |
| Status | Accepted — batch 5 |

Nothing is behind this state to reveal; the new Group’s document count is withheld.

## DOC-79 — Archived Group documents

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Archived read-only |
| Viewport | 393x852 |
| Components | CMP-15, CMP-18, App shell, sticky header, bottom nav, read-only banner, document list row, read rows |
| Loading / success / failure | Read-only state. |
| Validation | No form. |
| Permission | Read and download remain for the document audience. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Archived Groups reject document mutations; Owner may restore |
| IR owner | IR-013 |
| Wave | W4 |
| Related IR items | IR-008, IR-009, IR-011 |
| Exceptions | E-03, E-04 |
| Clean export | `screens/mobile/clean/DOC-79-archived-group-documents.png` |
| Annotated export | `screens/mobile/annotated/DOC-79-archived-group-documents-annotated.png` |
| Status | Accepted — batch 5 |

Upload target and SCAN IT absent rather than disabled; four mutations enumerated as unavailable; Restore is Owner-only.

## DOC-80 — Legacy public document being secured

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Migrating |
| Viewport | 393x852 |
| Components | CMP-47, notice, progress bar, document list row, badge |
| Loading / success / failure | Migration state. |
| Validation | No form. |
| Permission | Document stays readable to its audience throughout. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Public object URLs are not target behaviour (C-13) |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-009, IR-013, IR-021 |
| Exceptions | E-04 |
| Clean export | `screens/mobile/clean/DOC-80-legacy-document-being-secured.png` |
| Annotated export | `screens/mobile/annotated/DOC-80-legacy-document-being-secured-annotated.png` |
| Status | Accepted — batch 5 |

Migration communication only. The old public address is not printed, copyable or offered as a fallback.

## DOC-81 — Legacy document secured successfully

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Secured |
| Viewport | 393x852 |
| Components | CMP-47, notice, document list row, badge, read rows |
| Loading / success / failure | Success state. |
| Validation | No form. |
| Permission | No widening; attribution and provenance untouched. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Legacy documents migrate to private storage with their existing audience |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-009, IR-013, IR-021 |
| Exceptions | E-04, E-09 |
| Clean export | `screens/mobile/clean/DOC-81-legacy-document-secured.png` |
| Annotated export | `screens/mobile/annotated/DOC-81-legacy-document-secured-annotated.png` |
| Status | Accepted — batch 5 |

Audience assigned during migration is the one the document already had, not a widened default.

## DOC-82 — Legacy document requires reconciliation

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Held after migration |
| Viewport | 393x852 |
| Components | CMP-46, CMP-47, notice, read rows, document list row, badge |
| Loading / success / failure | Warning state. |
| Validation | No form. |
| Permission | Held and unopenable; other documents unaffected. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Partial migration handled per document |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-009, IR-013, IR-021 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/DOC-82-legacy-requires-reconciliation.png` |
| Annotated export | `screens/mobile/annotated/DOC-82-legacy-requires-reconciliation-annotated.png` |
| Status | Accepted — batch 5 |

The held document does not fall back to its old public address while it waits.

## DOC-83 — Migration mismatch

| Field | Value |
|---|---|
| Flow | Flow I — documents, scanning and reconciliation |
| Group | — |
| State | Migration mismatch |
| Viewport | 393x852 |
| Components | CMP-47, notice, read rows |
| Loading / success / failure | Warning state. |
| Validation | No form. |
| Permission | No exposure occurred; nothing deleted. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets and the document viewer cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | Calm operational communication without internals |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-009, IR-013, IR-021 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/DOC-83-migration-mismatch.png` |
| Annotated export | `screens/mobile/annotated/DOC-83-migration-mismatch-annotated.png` |
| Status | Accepted — batch 5 |

Two counted facts and two guarantees. No path, bucket, identifier, error code or service name.


---

# Board 17

## CFG-01 — Group management entry

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | A — configuration entry |
| State | MENU OPEN |
| Viewport | 393x852 |
| Components | CMP-48, CMP-03 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-01-group-management-entry.png` |
| Annotated export | `screens/mobile/annotated/CFG-01-group-management-entry-annotated.png` |
| Status | Accepted — batch 6 |

Configuration is reached from the Group title in the header, the same control that already switches Groups. Nothing is added to the tab bar, and nothing here is an admin console: five rows, all scoped to this one Group.

## CFG-02 — Owner configuration overview

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | A — configuration entry |
| State | OWNER, EDITABLE |
| Viewport | 393x852 |
| Components | CMP-48, CMP-49, CMP-57 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-02-owner-configuration-overview.png` |
| Annotated export | `screens/mobile/annotated/CFG-02-owner-configuration-overview-annotated.png` |
| Status | Accepted — batch 6 |

One Group owns all of it: name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and the approved display context. Six of the seven rows are editable; the accounting currency shows its lock rather than a selector that would fail.

## CFG-03 — Member read-only configuration overview

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | A — configuration entry |
| State | MEMBER, READ-ONLY |
| Viewport | 393x852 |
| Components | CMP-48, CMP-50, PERM-06 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Only an Owner can change configuration; a Member reads the same permitted values. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-03-member-read-only-configuration-overview.png` |
| Annotated export | `screens/mobile/annotated/CFG-03-member-read-only-configuration-overview-annotated.png` |
| Status | Accepted — batch 6 |

The same permitted values, with every mutation affordance absent rather than dimmed. A Member is not a Viewer — they write Events, expenses and documents all day; they just do not own the Group record.

## CFG-04 — Configuration loading

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | A — configuration entry |
| State | LOADING |
| Viewport | 393x852 |
| Components | CMP-11 |
| Loading / success / failure | Accepted skeleton or spinner; geometry held; nothing downstream updates before server confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-04-configuration-loading.png` |
| Annotated export | `screens/mobile/annotated/CFG-04-configuration-loading-annotated.png` |
| Status | Accepted — batch 6 |

The accepted skeleton, at the row geometry the settled screen uses. No value is guessed at and no partial configuration is shown, because a half-loaded Group record reads as a changed Group record.

## CFG-05 — Configuration unavailable

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | A — configuration entry |
| State | DENIED |
| Viewport | 393x852 |
| Components | CMP-13, CMP-21, PERM-13 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Only an Owner can change configuration; a Member reads the same permitted values. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-05-configuration-unavailable.png` |
| Annotated export | `screens/mobile/annotated/CFG-05-configuration-unavailable-annotated.png` |
| Status | Accepted — batch 6 |

Straight from the permission package, unchanged. One state covers not-a-member, removed, an unknown Group id and a cross-account link, and it never says which.

## CFG-06 — Archived Group configuration

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | A — configuration entry |
| State | ARCHIVED, READ-ONLY |
| Viewport | 393x852 |
| Components | CMP-15, PERM-05 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Only an Owner can change configuration; a Member reads the same permitted values. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-06-archived-group-configuration.png` |
| Annotated export | `screens/mobile/annotated/CFG-06-archived-group-configuration-annotated.png` |
| Status | Accepted — batch 6 |

Archive-aware reads are permitted, so the values stay legible. Every mutation control is absent; the one action an Owner keeps is Restore, because that is what makes the rest of them come back.

## CFG-07 — Edit Trip name

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | B — Trip name |
| State | FOCUSED |
| Viewport | 393x852 |
| Components | CMP-51, CMP-08 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-07-edit-trip-name.png` |
| Annotated export | `screens/mobile/annotated/CFG-07-edit-trip-name-annotated.png` |
| Status | Accepted — batch 6 |

One field, the current value preloaded and selected, and the keyboard’s Enter mapped to Save. The name is the user-facing Trip name and nothing else depends on it.

## CFG-08 — Trip name required

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | B — Trip name |
| State | VALIDATION ERROR |
| Viewport | 393x852 |
| Components | CMP-51, CMP-20 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | Validated on submit, per field; the error renders against its own field and valid fields stay valid. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-08-trip-name-required.png` |
| Annotated export | `screens/mobile/annotated/CFG-08-trip-name-required-annotated.png` |
| Status | Accepted — batch 6 |

Validation fires on submit, not on every keystroke, so a person clearing the field to retype is not scolded mid-thought. Save stays reachable and the error names the field.

## CFG-09 — Trip name too short

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | B — Trip name |
| State | VALIDATION ERROR |
| Viewport | 393x852 |
| Components | CMP-51, CMP-20 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | Validated on submit, per field; the error renders against its own field and valid fields stay valid. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-09-trip-name-too-short.png` |
| Annotated export | `screens/mobile/annotated/CFG-09-trip-name-too-short-annotated.png` |
| Status | Accepted — batch 6 |

A minimum exists only because a one-character trip name is unusable in the switcher and the header. The message says what to do rather than quoting a rule.

## CFG-10 — Trip name too long

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | B — Trip name |
| State | VALIDATION ERROR |
| Viewport | 393x852 |
| Components | CMP-51 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | Validated on submit, per field; the error renders against its own field and valid fields stay valid. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-10-trip-name-too-long.png` |
| Annotated export | `screens/mobile/annotated/CFG-10-trip-name-too-long-annotated.png` |
| Status | Accepted — batch 6 |

No character limit is invented. The rejection is stated without a number, and the counter is drawn here only to show what it looks like once implementation actually owns a configured limit — it is not shipped otherwise.

## CFG-11 — Trip name saving

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | B — Trip name |
| State | IN PROGRESS |
| Viewport | 393x852 |
| Components | CMP-09 |
| Loading / success / failure | Accepted skeleton or spinner; geometry held; nothing downstream updates before server confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-11-trip-name-saving.png` |
| Annotated export | `screens/mobile/annotated/CFG-11-trip-name-saving-annotated.png` |
| Status | Accepted — batch 6 |

The field locks, the buttons lock and the header behind still reads the old name. Nothing in the interface commits before the server does.

## CFG-12 — Trip name saved

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | B — Trip name |
| State | SUCCESS |
| Viewport | 393x852 |
| Components | CMP-48, CMP-10 |
| Loading / success / failure | Server-confirmed success; Group context refreshes once, after confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-12-trip-name-saved.png` |
| Annotated export | `screens/mobile/annotated/CFG-12-trip-name-saved-annotated.png` |
| Status | Accepted — batch 6 |

Confirmation first, then the evidence: the header preview carries the new name because the server confirmed it, not because the field changed. Light personality is allowed here — this is an ordinary, reversible change.

## CFG-13 — Trip name save failure

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | B — Trip name |
| State | SERVER ERROR |
| Viewport | 393x852 |
| Components | CMP-20 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-13-trip-name-save-failure.png` |
| Annotated export | `screens/mobile/annotated/CFG-13-trip-name-save-failure-annotated.png` |
| Status | Accepted — batch 6 |

The typed value survives in the field so nobody retypes it, but the effective name is unambiguously the old one. Retry is a plain repeat, not a repair.

## CFG-14 — Stale name edit

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | B — Trip name |
| State | STALE CONFIGURATION |
| Viewport | 393x852 |
| Components | CMP-61, PERM-17 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-14-stale-name-edit.png` |
| Annotated export | `screens/mobile/annotated/CFG-14-stale-name-edit-annotated.png` |
| Status | Accepted — batch 6 |

Another Owner got there first, so the write is not attempted against a version the server has already replaced. Nothing is auto-merged and nothing is silently overwritten — the person chooses.

## CFG-15 — Edit destination

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | C — destination |
| State | FOCUSED |
| Viewport | 393x852 |
| Components | CMP-51 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-15-edit-destination.png` |
| Annotated export | `screens/mobile/annotated/CFG-15-edit-destination-annotated.png` |
| Status | Accepted — batch 6 |

Destination is a configured value on the Group, typed by an Owner. It is not derived from Events, not inferred from the timezone, and it does not generate content on its own.

## CFG-16 — Destination required

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | C — destination |
| State | VALIDATION ERROR |
| Viewport | 393x852 |
| Components | CMP-51, CMP-20 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | Validated on submit, per field; the error renders against its own field and valid fields stay valid. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-16-destination-required.png` |
| Annotated export | `screens/mobile/annotated/CFG-16-destination-required-annotated.png` |
| Status | Accepted — batch 6 |

Independent field validation: an empty destination blocks the destination save and nothing else. A name edit sitting in the same review is unaffected.

## CFG-17 — Destination changed

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | C — destination |
| State | SUCCESS + IMPACT |
| Viewport | 393x852 |
| Components | CMP-55 |
| Loading / success / failure | Server-confirmed success; Group context refreshes once, after confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-17-destination-changed.png` |
| Annotated export | `screens/mobile/annotated/CFG-17-destination-changed-annotated.png` |
| Status | Accepted — batch 6 |

A destination change is small and people expect it to be small, so the screen says exactly which four things did not happen. The list exists because “changed the destination” sounds like it should move something.

## CFG-18 — New non-Bali destination

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | C — destination |
| State | NO LOCAL GUIDE |
| Viewport | 393x852 |
| Components | CMP-59 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-18-new-non-bali-destination.png` |
| Annotated export | `screens/mobile/annotated/CFG-18-new-non-bali-destination-annotated.png` |
| Status | Accepted — batch 6 |

The Bali price guide is approved Bali-only content. A different destination gets its absence stated plainly rather than a generic worldwide guide invented to fill the space.

## CFG-19 — Migrated Bali destination

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | C — destination |
| State | BALI CONTENT AVAILABLE |
| Viewport | 393x852 |
| Components | CMP-59 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-19-migrated-bali-destination.png` |
| Annotated export | `screens/mobile/annotated/CFG-19-migrated-bali-destination-annotated.png` |
| Status | Accepted — batch 6 |

The mirror of CFG-18. Bali-only content appears because the configured destination is Bali, and the notice names the condition so nobody reads it as a general feature.

## CFG-20 — Destination save failure

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | C — destination |
| State | SERVER ERROR |
| Viewport | 393x852 |
| Components | CMP-20 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-20-destination-save-failure.png` |
| Annotated export | `screens/mobile/annotated/CFG-20-destination-save-failure-annotated.png` |
| Status | Accepted — batch 6 |

Same shape as the name failure, deliberately: previous value effective, typed value retained, retry safe. Configuration failures should be boring and identical.

## CFG-21 — Edit start and end dates

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | D — trip dates |
| State | EDITING |
| Viewport | 393x852 |
| Components | CMP-52 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-21-edit-start-and-end-dates.png` |
| Annotated export | `screens/mobile/annotated/CFG-21-edit-start-and-end-dates-annotated.png` |
| Status | Accepted — batch 6 |

Two fields, one range, and the night count read back underneath so the range is verified without arithmetic. Dates are interpreted in the Group timezone, which is named on the same line.

## CFG-22 — End date before start date

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | D — trip dates |
| State | VALIDATION ERROR |
| Viewport | 393x852 |
| Components | CMP-52, CMP-20 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | Validated on submit, per field; the error renders against its own field and valid fields stay valid. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-22-end-date-before-start-date.png` |
| Annotated export | `screens/mobile/annotated/CFG-22-end-date-before-start-date-annotated.png` |
| Status | Accepted — batch 6 |

The range is validated as a range, so the error sits under the pair rather than blaming one field. Nothing is auto-corrected by swapping the dates — that would guess at intent.

## CFG-23 — Date range saved

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | D — trip dates |
| State | SUCCESS |
| Viewport | 393x852 |
| Components | CMP-48, CMP-10 |
| Loading / success / failure | Server-confirmed success; Group context refreshes once, after confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-23-date-range-saved.png` |
| Annotated export | `screens/mobile/annotated/CFG-23-date-range-saved-annotated.png` |
| Status | Accepted — batch 6 |

Server-confirmed, then the header line updates. The mono date line is the most-read string in the app, so it is never allowed to run ahead of the record.

## CFG-24 — Existing Events outside proposed range

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | D — trip dates |
| State | DELIBERATE WARNING |
| Viewport | 393x852 |
| Components | CMP-55 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-24-existing-events-outside-proposed-range.png` |
| Annotated export | `screens/mobile/annotated/CFG-24-existing-events-outside-proposed-range-annotated.png` |
| Status | Accepted — batch 6 |

A warning, not a repair. The two Events that would fall outside the new range are named, and the screen refuses to offer a tidy-up action — moving or deleting somebody else’s Event is not a side effect of editing dates.

## CFG-25 — Date change confirmation

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | D — trip dates |
| State | CONFIRMATION |
| Viewport | 393x852 |
| Components | CMP-60, CMP-14 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-25-date-change-confirmation.png` |
| Annotated export | `screens/mobile/annotated/CFG-25-date-change-confirmation-annotated.png` |
| Status | Accepted — batch 6 |

The current confirmation-sheet geometry, reused. Before and after on one plate, the affected Events counted, and the primary action is accent rather than destructive because nothing is being destroyed.

## CFG-26 — Date change failure

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | D — trip dates |
| State | SERVER ERROR |
| Viewport | 393x852 |
| Components | CMP-20 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-26-date-change-failure.png` |
| Annotated export | `screens/mobile/annotated/CFG-26-date-change-failure-annotated.png` |
| Status | Accepted — batch 6 |

The previous range stays effective and is restated, because a date range that might have half-applied is the kind of thing people re-check three times.

## CFG-27 — Concurrent date change

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | D — trip dates |
| State | STALE CONFIGURATION |
| Viewport | 393x852 |
| Components | CMP-61, PERM-17 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-27-concurrent-date-change.png` |
| Annotated export | `screens/mobile/annotated/CFG-27-concurrent-date-change-annotated.png` |
| Status | Accepted — batch 6 |

Two Owners, one Group record. The server version wins the comparison and the local edit is never merged into it — a silently blended date range would be nobody’s decision.

## CFG-28 — Timezone overview

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | E — IANA timezone |
| State | DEFAULT |
| Viewport | 393x852 |
| Components | CMP-54 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-28-timezone-overview.png` |
| Annotated export | `screens/mobile/annotated/CFG-28-timezone-overview-annotated.png` |
| Status | Accepted — batch 6 |

A readable place label above the canonical IANA identifier, in that order. The identifier is the stored value; the label is for humans. No fixed UTC offset is presented as the canonical value, because an offset is a consequence, not an identity.

## CFG-29 — Search timezone

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | E — IANA timezone |
| State | SEARCHING |
| Viewport | 393x852 |
| Components | CMP-53, CMP-08 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-29-search-timezone.png` |
| Annotated export | `screens/mobile/annotated/CFG-29-search-timezone-annotated.png` |
| Status | Accepted — batch 6 |

Search by the place people know, resolve to the identifier the system needs. Every result shows both, so choosing is never a guess about which Makassar is meant.

## CFG-30 — Timezone selected

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | E — IANA timezone |
| State | SELECTED |
| Viewport | 393x852 |
| Components | CMP-53, CMP-54 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-30-timezone-selected.png` |
| Annotated export | `screens/mobile/annotated/CFG-30-timezone-selected-annotated.png` |
| Status | Accepted — batch 6 |

Selection is not a save. The chosen identifier is echoed in the identity block above the action, so the impact screen that follows is read against a value the person has already seen.

## CFG-31 — Invalid timezone

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | E — IANA timezone |
| State | VALIDATION ERROR |
| Viewport | 393x852 |
| Components | CMP-53, CMP-20 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | Validated on submit, per field; the error renders against its own field and valid fields stay valid. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-31-invalid-timezone.png` |
| Annotated export | `screens/mobile/annotated/CFG-31-invalid-timezone-annotated.png` |
| Status | Accepted — batch 6 |

An unrecognised or retired identifier is rejected rather than coerced to something nearby. Silently resolving Asia/Bali to Asia/Makassar would put a value in the record that nobody chose.

## CFG-32 — Timezone change impact

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | E — IANA timezone |
| State | EXPLANATION |
| Viewport | 393x852 |
| Components | CMP-55 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-32-timezone-change-impact.png` |
| Annotated export | `screens/mobile/annotated/CFG-32-timezone-change-impact-annotated.png` |
| Status | Accepted — batch 6 |

The one configuration change people misread as a data migration. Instants are unchanged; their rendering is not. The screen refuses to say Events are shifted, because they are not.

## CFG-33 — Timezone confirmation

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | E — IANA timezone |
| State | CONFIRMATION |
| Viewport | 393x852 |
| Components | CMP-60, CMP-14 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-33-timezone-confirmation.png` |
| Annotated export | `screens/mobile/annotated/CFG-33-timezone-confirmation-annotated.png` |
| Status | Accepted — batch 6 |

Confirmation restates the identifier rather than the place, because the identifier is what is being written. Calm copy only — there is no joke available about time.

## CFG-34 — Timezone saving

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | E — IANA timezone |
| State | IN PROGRESS |
| Viewport | 393x852 |
| Components | CMP-09 |
| Loading / success / failure | Accepted skeleton or spinner; geometry held; nothing downstream updates before server confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-34-timezone-saving.png` |
| Annotated export | `screens/mobile/annotated/CFG-34-timezone-saving-annotated.png` |
| Status | Accepted — batch 6 |

Every time display in the app stays on the old timezone until confirmation. A screen that re-rendered instants mid-save would look like the data moved.

## CFG-35 — Timezone success

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | E — IANA timezone |
| State | SUCCESS |
| Viewport | 393x852 |
| Components | CMP-54, CMP-10 |
| Loading / success / failure | Server-confirmed success; Group context refreshes once, after confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-35-timezone-success.png` |
| Annotated export | `screens/mobile/annotated/CFG-35-timezone-success-annotated.png` |
| Status | Accepted — batch 6 |

The new identity block, then the guarantee restated once. Repetition here is deliberate: this is the change people come back to check.

## CFG-36 — Timezone failure

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | E — IANA timezone |
| State | SERVER ERROR |
| Viewport | 393x852 |
| Components | CMP-20 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-36-timezone-failure.png` |
| Annotated export | `screens/mobile/annotated/CFG-36-timezone-failure-annotated.png` |
| Status | Accepted — batch 6 |

The previous timezone remains effective and is named, so nobody is left wondering which identifier the app is rendering against.

## CFG-37 — Timezone changed while form open

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | E — IANA timezone |
| State | STALE CONFIGURATION |
| Viewport | 393x852 |
| Components | CMP-61, PERM-17 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-37-timezone-changed-while-form-open.png` |
| Annotated export | `screens/mobile/annotated/CFG-37-timezone-changed-while-form-open-annotated.png` |
| Status | Accepted — batch 6 |

The stale-configuration treatment, unchanged from the name and date cases. One pattern for every field means a person learns it once.

## CFG-38 — Accounting currency overview

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | F — accounting currency |
| State | DEFAULT |
| Viewport | 393x852 |
| Components | CMP-56 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-003, IR-008, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-38-accounting-currency-overview.png` |
| Annotated export | `screens/mobile/annotated/CFG-38-accounting-currency-overview-annotated.png` |
| Status | Accepted — batch 6 |

The ledger currency, stated as authority rather than as a preference. The FX tab’s converter selection is explicitly not this value, and the card says so where a reader would otherwise assume it.

## CFG-39 — Select accounting currency for a new Group

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | F — accounting currency |
| State | SELECTING |
| Viewport | 393x852 |
| Components | CMP-58, CMP-08 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-003, IR-008, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-39-select-accounting-currency-for-a-new-group.png` |
| Annotated export | `screens/mobile/annotated/CFG-39-select-accounting-currency-for-a-new-group-annotated.png` |
| Status | Accepted — batch 6 |

A searchable ISO 4217 list, never a free-text box. Three currencies are shown because they are the ones these Groups actually use; the list itself is the full standard.

## CFG-40 — Accounting currency, before first history

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | F — accounting currency |
| State | CONFIRMATION |
| Viewport | 393x852 |
| Components | CMP-56, CMP-14 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-003, IR-008, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-40-accounting-currency-confirmation-before-first-history.png` |
| Annotated export | `screens/mobile/annotated/CFG-40-accounting-currency-confirmation-before-first-history-annotated.png` |
| Status | Accepted — batch 6 |

The only moment this value is ordinarily editable, so the consequence is stated in full while the choice is still cheap. No joke, no reassurance that it can be undone later.

## CFG-41 — Accounting currency saved before history

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | F — accounting currency |
| State | SUCCESS |
| Viewport | 393x852 |
| Components | CMP-56, CMP-10 |
| Loading / success / failure | Server-confirmed success; Group context refreshes once, after confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-003, IR-008, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-41-accounting-currency-saved-before-history.png` |
| Annotated export | `screens/mobile/annotated/CFG-41-accounting-currency-saved-before-history-annotated.png` |
| Status | Accepted — batch 6 |

Confirmed by the server, then stated once. The lock is announced here rather than sprung later, so the constraint is known before the first expense arrives.

## CFG-42 — Accounting currency save failure

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | F — accounting currency |
| State | SERVER ERROR |
| Viewport | 393x852 |
| Components | CMP-20 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-003, IR-008, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-42-accounting-currency-save-failure.png` |
| Annotated export | `screens/mobile/annotated/CFG-42-accounting-currency-save-failure-annotated.png` |
| Status | Accepted — batch 6 |

The strongest “nothing happened” on the board, because a partially applied ledger currency is the one configuration failure that would be unrecoverable in product.

## CFG-43 — Accounting currency locked after history exists

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | F — accounting currency |
| State | LOCKED |
| Viewport | 393x852 |
| Components | CMP-56, CMP-57 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Only an Owner can change configuration; a Member reads the same permitted values. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-003, IR-008, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-43-accounting-currency-locked-after-history-exists.png` |
| Annotated export | `screens/mobile/annotated/CFG-43-accounting-currency-locked-after-history-exists-annotated.png` |
| Status | Accepted — batch 6 |

No dead selector, no greyed dropdown, no “contact support”. The current currency, the fact that created the lock, the reason, and nothing that looks tappable.

## CFG-44 — Attempt to change locked accounting currency

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | F — accounting currency |
| State | BLOCKED |
| Viewport | 393x852 |
| Components | CMP-57, CMP-13 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Only an Owner can change configuration; a Member reads the same permitted values. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-003, IR-008, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-44-attempt-to-change-locked-accounting-currency.png` |
| Annotated export | `screens/mobile/annotated/CFG-44-attempt-to-change-locked-accounting-currency-annotated.png` |
| Status | Accepted — batch 6 |

Reached from a stale client or an old deep link. The block is explained by consequence, and the one thing it must never offer — Convert everything — is absent rather than disabled.

## CFG-45 — Currency migration required

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | F — accounting currency |
| State | EXPLANATION |
| Viewport | 393x852 |
| Components | CMP-57 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-003, IR-008, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-45-currency-migration-required.png` |
| Annotated export | `screens/mobile/annotated/CFG-45-currency-migration-required-annotated.png` |
| Status | Accepted — batch 6 |

A contract plate, not an executable flow. It exists so the constraint is documented in the product rather than discovered by a person who assumed a dropdown was coming.

## CFG-46 — USD accounting Group

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | F — accounting currency |
| State | TWO-DECIMAL MINOR UNITS |
| Viewport | 393x852 |
| Components | CMP-56 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-003, IR-008, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-46-usd-accounting-group.png` |
| Annotated export | `screens/mobile/annotated/CFG-46-usd-accounting-group-annotated.png` |
| Status | Accepted — batch 6 |

A second Group proving the formatting rules are per-Group, not global. Two decimal places, no IDR rounding tolerance anywhere near it, and no Bali converter authority.

## CFG-47 — Zero-decimal currency Group

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | F — accounting currency |
| State | ZERO MINOR UNITS |
| Viewport | 393x852 |
| Components | CMP-56 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-003, IR-008, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-47-zero-decimal-currency-group.png` |
| Annotated export | `screens/mobile/annotated/CFG-47-zero-decimal-currency-group-annotated.png` |
| Status | Accepted — batch 6 |

IDR carries no minor unit, so none is drawn. Inventing Rp 412.08 would be a formatting bug that reads as a rounding error, and it is exactly the kind of thing a currency-agnostic component gets wrong.

## CFG-48 — Large amount and long-name stress

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | F — accounting currency |
| State | STRESS |
| Viewport | 393x852 |
| Components | CMP-56 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-014 |
| Wave | W4 |
| Related IR items | IR-003, IR-008, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-48-large-amount-and-long-currency-name-stress-state.png` |
| Annotated export | `screens/mobile/annotated/CFG-48-large-amount-and-long-currency-name-stress-state-annotated.png` |
| Status | Accepted — batch 6 |

The two things that break money layouts: an eight-figure rupiah total and a currency name longer than the row. The amount never wraps or ellipsises; the name does.

## CFG-49 — Currency display context overview

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | G — display currency context |
| State | DEFAULT |
| Viewport | 393x852 |
| Components | CMP-58 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-014 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-49-currency-display-context-overview.png` |
| Annotated export | `screens/mobile/annotated/CFG-49-currency-display-context-overview-annotated.png` |
| Status | Accepted — batch 6 |

Reference context, kept visibly subordinate to the ledger. The accounting currency appears in the list as required and cannot be removed from accounting presentation.

## CFG-50 — Add display currency

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | G — display currency context |
| State | ADDING |
| Viewport | 393x852 |
| Components | CMP-58 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-014 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-50-add-display-currency.png` |
| Annotated export | `screens/mobile/annotated/CFG-50-add-display-currency-annotated.png` |
| Status | Accepted — batch 6 |

The same ISO list as the accounting picker, doing a much smaller job. Adding USD here is a display decision and is treated as one throughout.

## CFG-51 — Remove display currency

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | G — display currency context |
| State | REMOVING |
| Viewport | 393x852 |
| Components | CMP-58 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-014 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-51-remove-display-currency.png` |
| Annotated export | `screens/mobile/annotated/CFG-51-remove-display-currency-annotated.png` |
| Status | Accepted — batch 6 |

INR can go; IDR cannot, because it is the accounting currency and removing it from required accounting presentation would leave balances rendered in something that does not own them.

## CFG-52 — Display context saved

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | G — display currency context |
| State | SUCCESS |
| Viewport | 393x852 |
| Components | CMP-10 |
| Loading / success / failure | Server-confirmed success; Group context refreshes once, after confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-014 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-52-display-context-saved.png` |
| Annotated export | `screens/mobile/annotated/CFG-52-display-context-saved-annotated.png` |
| Status | Accepted — batch 6 |

A cheerful confirmation is allowed here, because a display change is genuinely small. The line underneath keeps it honest.

## CFG-53 — Display context failure

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | G — display currency context |
| State | SERVER ERROR |
| Viewport | 393x852 |
| Components | CMP-20 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-014 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-53-display-context-failure.png` |
| Annotated export | `screens/mobile/annotated/CFG-53-display-context-failure-annotated.png` |
| Status | Accepted — batch 6 |

Even a failed display change gets the accounting guarantee restated, because the two are adjacent on screen and a reader should never have to work out which one failed.

## CFG-54 — Live FX explanation

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | G — display currency context |
| State | EXPLANATION |
| Viewport | 393x852 |
| Components | CMP-55, CMP-56 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-014 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-54-live-fx-explanation.png` |
| Annotated export | `screens/mobile/annotated/CFG-54-live-fx-explanation-annotated.png` |
| Status | Accepted — batch 6 |

The FX tab is the most likely place for someone to believe they have changed the ledger. Three sentences, and a refresh control that visibly recalculates only the reference row.

## CFG-55 — Non-Bali Group FX context

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | G — display currency context |
| State | NO BALI CONTENT |
| Viewport | 393x852 |
| Components | CMP-59 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-014 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-55-non-bali-group-fx-context.png` |
| Annotated export | `screens/mobile/annotated/CFG-55-non-bali-group-fx-context-annotated.png` |
| Status | Accepted — batch 6 |

The general converter travels; the Bali price guide does not. A USD Group gets a working reference converter across its approved display currencies and no Bali content at all.

## CFG-56 — Multiple configuration fields edited

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | H — combined configuration save |
| State | DIRTY |
| Viewport | 393x852 |
| Components | CMP-51, CMP-60 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-56-multiple-configuration-fields-edited.png` |
| Annotated export | `screens/mobile/annotated/CFG-56-multiple-configuration-fields-edited-annotated.png` |
| Status | Accepted — batch 6 |

Three fields edited, three independent validations, one save. The unsaved marker is per row so a person can see which parts of the record they are actually holding.

## CFG-57 — Review changes

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | H — combined configuration save |
| State | REVIEW |
| Viewport | 393x852 |
| Components | CMP-60 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-57-review-changes.png` |
| Annotated export | `screens/mobile/annotated/CFG-57-review-changes-annotated.png` |
| Status | Accepted — batch 6 |

Each field summarised on its own line, from and to, so the save is read as four separate decisions rather than one blob. The accounting currency is absent because it is not legally editable here — not shown as unchanged, simply not present.

## CFG-58 — Configuration saving

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | H — combined configuration save |
| State | IN PROGRESS |
| Viewport | 393x852 |
| Components | CMP-09 |
| Loading / success / failure | Accepted skeleton or spinner; geometry held; nothing downstream updates before server confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-58-configuration-saving.png` |
| Annotated export | `screens/mobile/annotated/CFG-58-configuration-saving-annotated.png` |
| Status | Accepted — batch 6 |

Nothing downstream moves during the save: not the header, not the date line, not an Event time, not a currency label. The whole point of a server-confirmed configuration write is that the app looks unchanged until it is not.

## CFG-59 — Configuration saved

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | H — combined configuration save |
| State | SUCCESS |
| Viewport | 393x852 |
| Components | CMP-48, CMP-10 |
| Loading / success / failure | Server-confirmed success; Group context refreshes once, after confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-59-configuration-saved.png` |
| Annotated export | `screens/mobile/annotated/CFG-59-configuration-saved-annotated.png` |
| Status | Accepted — batch 6 |

The Group context refreshes once, after confirmation, and everything that depends on it lands in the same frame. No staggered updates, because staggered updates look like a partial save.

## CFG-60 — Configuration validation failure

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | H — combined configuration save |
| State | VALIDATION ERROR |
| Viewport | 393x852 |
| Components | CMP-60, CMP-20 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | Validated on submit, per field; the error renders against its own field and valid fields stay valid. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-60-configuration-validation-failure.png` |
| Annotated export | `screens/mobile/annotated/CFG-60-configuration-validation-failure-annotated.png` |
| Status | Accepted — batch 6 |

Every error is mapped to its own field and the valid rows stay valid. A single summary error at the top would make a person re-check three fields to find one mistake.

## CFG-61 — Configuration server failure

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | H — combined configuration save |
| State | SERVER ERROR |
| Viewport | 393x852 |
| Components | CMP-20 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-61-configuration-server-failure.png` |
| Annotated export | `screens/mobile/annotated/CFG-61-configuration-server-failure-annotated.png` |
| Status | Accepted — batch 6 |

The previous effective configuration is intact and is restated field by field, because a multi-field save is exactly where people fear a partial write.

## CFG-62 — Configuration stale-version failure

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | H — combined configuration save |
| State | STALE CONFIGURATION |
| Viewport | 393x852 |
| Components | CMP-61 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-62-configuration-stale-version-failure.png` |
| Annotated export | `screens/mobile/annotated/CFG-62-configuration-stale-version-failure-annotated.png` |
| Status | Accepted — batch 6 |

Three explicit choices and no fourth. Auto-merging two Owners’ edits would produce a configuration neither of them approved, so the design refuses it and hands back the text instead.

## CFG-63 — Owner role lost during save

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | H — combined configuration save |
| State | ROLE CHANGED |
| Viewport | 393x852 |
| Components | CMP-13, PERM-18 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Only an Owner can change configuration; a Member reads the same permitted values. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-63-owner-role-lost-during-save.png` |
| Annotated export | `screens/mobile/annotated/CFG-63-owner-role-lost-during-save-annotated.png` |
| Status | Accepted — batch 6 |

The write is refused by the server, not hidden by the client. The person lands on the read-only authorised view with the same values they were just looking at, so nothing feels lost.

## CFG-64 — Group archived during save

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | H — combined configuration save |
| State | ARCHIVED MID-ACTION |
| Viewport | 393x852 |
| Components | CMP-15, PERM-05 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Only an Owner can change configuration; a Member reads the same permitted values. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-64-group-archived-during-save.png` |
| Annotated export | `screens/mobile/annotated/CFG-64-group-archived-during-save-annotated.png` |
| Status | Accepted — batch 6 |

Archive won the race, so the save is refused and the route changes to the archive-aware state rather than leaving an editable form floating over a read-only Group.

## CFG-65 — Offline configuration edit

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | H — combined configuration save |
| State | OFFLINE |
| Viewport | 393x852 |
| Components | CMP-16 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-65-offline-configuration-edit.png` |
| Annotated export | `screens/mobile/annotated/CFG-65-offline-configuration-edit-annotated.png` |
| Status | Accepted — batch 6 |

Typing is allowed because typing is local. Saving is not, because a server-owned write cannot be queued honestly — a pending settings change that silently loses a race is worse than a disabled button.

## CFG-66 — Reconnecting configuration form

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | H — combined configuration save |
| State | RECONNECTING |
| Viewport | 393x852 |
| Components | CMP-16 |
| Loading / success / failure | Accepted skeleton or spinner; geometry held; nothing downstream updates before server confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-66-reconnecting-configuration-form.png` |
| Annotated export | `screens/mobile/annotated/CFG-66-reconnecting-configuration-form-annotated.png` |
| Status | Accepted — batch 6 |

The form is not re-enabled on the strength of a network event alone: the current configuration version is fetched first, so a stale save is caught before it is offered.

## CFG-67 — Unsaved changes confirmation

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | H — combined configuration save |
| State | CONFIRMATION |
| Viewport | 393x852 |
| Components | CMP-14 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-67-unsaved-changes-confirmation.png` |
| Annotated export | `screens/mobile/annotated/CFG-67-unsaved-changes-confirmation-annotated.png` |
| Status | Accepted — batch 6 |

The current confirmation-sheet geometry, reused without modification. Discard is the destructive-tinted option because it is the one that loses work; leaving is not destructive and is not treated as such.

## CFG-68 — Header update after confirmed change

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | I — configuration effects |
| State | CONFIRMED EFFECT |
| Viewport | 393x852 |
| Components | CMP-48 |
| Loading / success / failure | Server-confirmed success; Group context refreshes once, after confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-68-header-update-after-confirmed-change.png` |
| Annotated export | `screens/mobile/annotated/CFG-68-header-update-after-confirmed-change-annotated.png` |
| Status | Accepted — batch 6 |

The effect screen for the two values people actually see all day. Both updated in the same frame, both after confirmation, and the itinerary below is untouched.

## CFG-69 — Timezone presentation after change

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | I — configuration effects |
| State | CONFIRMED EFFECT |
| Viewport | 393x852 |
| Components | CMP-54, CMP-55 |
| Loading / success / failure | Server-confirmed success; Group context refreshes once, after confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-69-trip-timezone-presentation-after-confirmed-change.png` |
| Annotated export | `screens/mobile/annotated/CFG-69-trip-timezone-presentation-after-confirmed-change-annotated.png` |
| Status | Accepted — batch 6 |

The same three Events, the same three instants, rendered against a different Group timezone. The abbreviation changes, the moment does not, and the plate says which is which.

## CFG-70 — Finance after display-context change

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | I — configuration effects |
| State | CONFIRMED EFFECT |
| Viewport | 393x852 |
| Components | CMP-56, CMP-58 |
| Loading / success / failure | Server-confirmed success; Group context refreshes once, after confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-70-finance-context-after-permitted-display-context-change.png` |
| Annotated export | `screens/mobile/annotated/CFG-70-finance-context-after-permitted-display-context-change-annotated.png` |
| Status | Accepted — batch 6 |

USD joins the display context and the settlement line still settles in IDR. The reference figure is visually subordinate — smaller, dimmer, prefixed with an approximation sign — so it can never be mistaken for the amount owed.

## CFG-71 — Accounting history remains unchanged

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | I — configuration effects |
| State | EVIDENCE |
| Viewport | 393x852 |
| Components | CMP-55, CMP-62 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-71-accounting-history-remains-unchanged.png` |
| Annotated export | `screens/mobile/annotated/CFG-71-accounting-history-remains-unchanged-annotated.png` |
| Status | Accepted — batch 6 |

The proof plate. Four values a configuration change could plausibly be accused of touching, shown before and after the whole batch of edits, identical in both columns.

## CFG-72 — Group switch with different configuration

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | I — configuration effects |
| State | GROUP SWITCH |
| Viewport | 393x852 |
| Components | CMP-03, CMP-11 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-72-group-switch-with-different-configuration.png` |
| Annotated export | `screens/mobile/annotated/CFG-72-group-switch-with-different-configuration-annotated.png` |
| Status | Accepted — batch 6 |

Three steps in one frame: the old configuration clears, the loading state holds the geometry, and the new name, dates, timezone and accounting currency arrive together. No frame ever shows one Group’s name above another Group’s currency.

## CFG-73 — Group switch failure

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | I — configuration effects |
| State | SERVER ERROR |
| Viewport | 393x852 |
| Components | CMP-20, GRP-04 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-73-group-switch-failure.png` |
| Annotated export | `screens/mobile/annotated/CFG-73-group-switch-failure-annotated.png` |
| Status | Accepted — batch 6 |

Reuses the Group-switch failure from board 10 rather than inventing a settings-specific one. The previous Group stays selected and internally consistent — name, dates, timezone and currency all still its own.

## CFG-74 — Configuration realtime update

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | I — configuration effects |
| State | REALTIME |
| Viewport | 393x852 |
| Components | CMP-61, CMP-12 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-015 |
| Wave | W4 |
| Related IR items | IR-003, IR-007, IR-008, IR-011, IR-012 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-74-configuration-realtime-update.png` |
| Annotated export | `screens/mobile/annotated/CFG-74-configuration-realtime-update-annotated.png` |
| Status | Accepted — batch 6 |

Restrained: a single line, no reflow, and an explicit refusal to overwrite the form underneath. The banner is an invitation, exactly like the document-list one on board 16.

## CFG-75 — Migrated Bali configuration summary

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | J — migrated Bali configuration |
| State | MIGRATED |
| Viewport | 393x852 |
| Components | CMP-62 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-003, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-75-migrated-bali-configuration-summary.png` |
| Annotated export | `screens/mobile/annotated/CFG-75-migrated-bali-configuration-summary-annotated.png` |
| Status | Accepted — batch 6 |

The seeded trip as one configuration record: approved title, Bali destination, the accepted 22–27 May 2026 range, a validated IANA timezone, IDR accounting authority and the approved INR/IDR display context.

## CFG-76 — Migrated timezone evidence

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | J — migrated Bali configuration |
| State | EVIDENCE |
| Viewport | 393x852 |
| Components | CMP-54, CMP-62 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-003, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-76-migrated-timezone-evidence.png` |
| Annotated export | `screens/mobile/annotated/CFG-76-migrated-timezone-evidence-annotated.png` |
| Status | Accepted — batch 6 |

WITA is what people read on the itinerary; Asia/Makassar is what the Group stores. The plate explains the relationship without exposing a single migration table or database field name.

## CFG-77 — Migrated currency evidence

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | J — migrated Bali configuration |
| State | EVIDENCE |
| Viewport | 393x852 |
| Components | CMP-56, CMP-62 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-003, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-77-migrated-currency-evidence.png` |
| Annotated export | `screens/mobile/annotated/CFG-77-migrated-currency-evidence-annotated.png` |
| Status | Accepted — batch 6 |

The four facts that keep the migrated ledger auditable: IDR is authority, Original INR and IDR values survive, the legacy 188.68 rate stays a historical fact, and live rates cannot touch any of it.

## CFG-78 — Configuration requires reconciliation

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | J — migrated Bali configuration |
| State | HELD FOR REVIEW |
| Viewport | 393x852 |
| Components | CMP-62, CMP-46 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-003, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-78-configuration-requires-reconciliation.png` |
| Annotated export | `screens/mobile/annotated/CFG-78-configuration-requires-reconciliation-annotated.png` |
| Status | Accepted — batch 6 |

Used when the migrated source evidence disagrees with itself. No default is silently selected and no value is guessed — the affected field is held and named, and the rest of the configuration keeps working.

## CFG-79 — Configuration reconciliation succeeded

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | J — migrated Bali configuration |
| State | RECONCILED |
| Viewport | 393x852 |
| Components | CMP-62, CMP-46 |
| Loading / success / failure | Server-confirmed success; Group context refreshes once, after confirmation. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-003, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-79-configuration-reconciliation-succeeded.png` |
| Annotated export | `screens/mobile/annotated/CFG-79-configuration-reconciliation-succeeded-annotated.png` |
| Status | Accepted — batch 6 |

Repair restores consistency, not privilege or authority. The resolved value is named, and the read line that matters is the last one: nothing else about the Group moved to get here.

## CFG-80 — Configuration reconciliation failed safely

| Field | Value |
|---|---|
| Flow | Flow M — Group configuration and accounting currency |
| Group | J — migrated Bali configuration |
| State | RECONCILIATION FAILED |
| Viewport | 393x852 |
| Components | CMP-61, CMP-46 |
| Loading / success / failure | Previous effective configuration remains intact; nothing was changed; retry is safe. |
| Validation | No form validation on this screen. |
| Permission | Owner-only mutation; Member sees the same values without affordances. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. Sheets cap at 480px over a dark blurred backdrop. No layout change between viewports and no new breakpoint. |
| Architecture reference | One Group owns name, destination, dates, canonical IANA timezone, ISO 4217 accounting currency and approved display context. Only a current authorised Owner may request a change; every change is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-003, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-06 |
| Clean export | `screens/mobile/clean/CFG-80-configuration-reconciliation-failed-safely.png` |
| Annotated export | `screens/mobile/annotated/CFG-80-configuration-reconciliation-failed-safely-annotated.png` |
| Status | Accepted — batch 6 |

Failure with the safety envelope written out, matching DOC-69. Two next actions, both controlled, and an explicit statement that no record was reinterpreted to get here.


---

# Board 20

## MIG-01 — Migration scheduled

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | A — pre-migration communication |
| State | SCHEDULED |
| Viewport | 393x852 |
| Components | CMP-73 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-018 |
| Wave | W6 |
| Related IR items | IR-016, IR-017, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-01-migration-scheduled.png` |
| Annotated export | `screens/mobile/annotated/MIG-01-migration-scheduled-annotated.png` |
| Status | Accepted — batch 8 |

Names the Group, the window and what stops working — and refuses to promise a finish time nobody supplied. The three read lines are the whole message; everything else on the trip stays where it is.

## MIG-02 — Migration begins soon

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | A — pre-migration communication |
| State | IMMINENT |
| Viewport | 393x852 |
| Components | CMP-73 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-018 |
| Wave | W6 |
| Related IR items | IR-016, IR-017, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-02-migration-begins-soon.png` |
| Annotated export | `screens/mobile/annotated/MIG-02-migration-begins-soon-annotated.png` |
| Status | Accepted — batch 8 |

A quiet persistent banner, not a modal. People are mid-trip; interrupting them with a dialog to announce future maintenance would be worse than the maintenance.

## MIG-03 — Temporary read-only notice

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | A — pre-migration communication |
| State | READ-ONLY |
| Viewport | 393x852 |
| Components | CMP-73, CMP-74, CMP-15 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-018 |
| Wave | W6 |
| Related IR items | IR-016, IR-017, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-03-temporary-read-only-notice.png` |
| Annotated export | `screens/mobile/annotated/MIG-03-temporary-read-only-notice-annotated.png` |
| Status | Accepted — batch 8 |

The itinerary, the money, the documents and the todos all stay readable; only the write affordances go. The last line exists because a read-only app is the single most common moment people assume they have been locked out.

## MIG-04 — Maintenance window active

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | A — pre-migration communication |
| State | MAINTENANCE |
| Viewport | 393x852 |
| Components | CMP-74 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-018 |
| Wave | W6 |
| Related IR items | IR-016, IR-017, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-04-maintenance-window-active.png` |
| Annotated export | `screens/mobile/annotated/MIG-04-maintenance-window-active-annotated.png` |
| Status | Accepted — batch 8 |

Mutation controls are absent, not disabled — the same rule as archived Groups and denied permissions (E-11). The tab bar stays so the app never feels broken.

## MIG-05 — User opens the app during maintenance

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | A — pre-migration communication |
| State | ROUTED |
| Viewport | 393x852 |
| Components | CMP-73, CMP-74 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-018 |
| Wave | W6 |
| Related IR items | IR-016, IR-017, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-05-user-opens-the-app-during-maintenance.png` |
| Annotated export | `screens/mobile/annotated/MIG-05-user-opens-the-app-during-maintenance-annotated.png` |
| Status | Accepted — batch 8 |

A cold start during the window lands on the migration state, never a generic server error. “Something went wrong” during planned maintenance is the worst possible first impression.

## MIG-06 — Unsaved form when maintenance begins

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | A — pre-migration communication |
| State | SAFE STOP |
| Viewport | 393x852 |
| Components | CMP-73, CMP-66 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-018 |
| Wave | W6 |
| Related IR items | IR-016, IR-017, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-06-unsaved-form-when-maintenance-begins.png` |
| Annotated export | `screens/mobile/annotated/MIG-06-unsaved-form-when-maintenance-begins-annotated.png` |
| Status | Accepted — batch 8 |

Three facts in order: it was not saved, the upgrade started, and here is your text. Offering the text back is what turns a lost draft into a two-minute inconvenience.

## MIG-07 — Migration postponed

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | A — pre-migration communication |
| State | POSTPONED |
| Viewport | 393x852 |
| Components | CMP-73 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-018 |
| Wave | W6 |
| Related IR items | IR-016, IR-017, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-07-migration-postponed.png` |
| Annotated export | `screens/mobile/annotated/MIG-07-migration-postponed-annotated.png` |
| Status | Accepted — batch 8 |

Normal access returns and, critically, the warning banner is removed. A stale maintenance notice sitting above a fully working app teaches people to ignore every banner after it.

## MIG-08 — Migration cancelled safely

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | A — pre-migration communication |
| State | SAFE STOP |
| Viewport | 393x852 |
| Components | CMP-78 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-018 |
| Wave | W6 |
| Related IR items | IR-016, IR-017, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-08-migration-cancelled-safely.png` |
| Annotated export | `screens/mobile/annotated/MIG-08-migration-cancelled-safely-annotated.png` |
| Status | Accepted — batch 8 |

States whether anything changed rather than implying it. Because nothing was committed, the sentence is unconditional — and that unconditional sentence is only allowed when the evidence supports it.

## MIG-09 — Group preparation

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | B — migration progress |
| State | IN PROGRESS |
| Viewport | 393x852 |
| Components | CMP-75, CMP-76 |
| Loading / success / failure | Status copy always accompanies long-running work; no silent spinner. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-09-group-preparation.png` |
| Annotated export | `screens/mobile/annotated/MIG-09-group-preparation-annotated.png` |
| Status | Accepted — batch 8 |

Product language for a structural change. “Preparing this Trip for accounts and Groups” is true, understandable, and free of every internal noun that would otherwise leak here.

## MIG-10 — Data validation

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | B — migration progress |
| State | IN PROGRESS |
| Viewport | 393x852 |
| Components | CMP-75 |
| Loading / success / failure | Status copy always accompanies long-running work; no silent spinner. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-10-data-validation.png` |
| Annotated export | `screens/mobile/annotated/MIG-10-data-validation-annotated.png` |
| Status | Accepted — batch 8 |

Names the three things a person recognises — itinerary, expenses, documents — and nothing about how they are being checked.

## MIG-11 — Documents being secured

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | B — migration progress |
| State | IN PROGRESS |
| Viewport | 393x852 |
| Components | CMP-75, CMP-83 |
| Loading / success / failure | Status copy always accompanies long-running work; no silent spinner. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-11-documents-being-secured.png` |
| Annotated export | `screens/mobile/annotated/MIG-11-documents-being-secured-annotated.png` |
| Status | Accepted — batch 8 |

Explains the outcome — private, authorised access — without printing the address it is replacing. The old public link is never shown, not even to say it is going away.

## MIG-12 — Finance being reconciled

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | B — migration progress |
| State | IN PROGRESS |
| Viewport | 393x852 |
| Components | CMP-75, CMP-84 |
| Loading / success / failure | Status copy always accompanies long-running work; no silent spinner. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-12-finance-being-reconciled.png` |
| Annotated export | `screens/mobile/annotated/MIG-12-finance-being-reconciled-annotated.png` |
| Status | Accepted — batch 8 |

The three finance guarantees, restated during the one operation most likely to be suspected of changing them. Live FX is named explicitly because that is the specific fear.

## MIG-13 — Participant identities being prepared

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | B — migration progress |
| State | IN PROGRESS |
| Viewport | 393x852 |
| Components | CMP-75, CMP-82 |
| Loading / success / failure | Status copy always accompanies long-running work; no silent spinner. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-13-participant-identities-being-prepared.png` |
| Annotated export | `screens/mobile/annotated/MIG-13-participant-identities-being-prepared-annotated.png` |
| Status | Accepted — batch 8 |

Historical people stay visible, and no account is inferred for any of them. Claiming is a separate, deliberate act — migration never performs it on someone’s behalf.

## MIG-14 — Security activation

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | B — migration progress |
| State | IN PROGRESS |
| Viewport | 393x852 |
| Components | CMP-75 |
| Loading / success / failure | Status copy always accompanies long-running work; no silent spinner. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-14-security-activation.png` |
| Annotated export | `screens/mobile/annotated/MIG-14-security-activation-annotated.png` |
| Status | Accepted — batch 8 |

The most sensitive step gets the plainest sentence. No policy names, no acronyms, no mention of the mechanism — just what it achieves.

## MIG-15 — Migration still running

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | B — migration progress |
| State | LONG RUNNING |
| Viewport | 393x852 |
| Components | CMP-76 |
| Loading / success / failure | Status copy always accompanies long-running work; no silent spinner. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-15-migration-still-running.png` |
| Annotated export | `screens/mobile/annotated/MIG-15-migration-still-running-annotated.png` |
| Status | Accepted — batch 8 |

A spinner with no words is an app that has hung. Every long-running frame carries the current step and a plain-language status so waiting stays informed rather than anxious.

## MIG-16 — Migration taking longer than expected

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | B — migration progress |
| State | SLOW |
| Viewport | 393x852 |
| Components | CMP-76, CMP-77 |
| Loading / success / failure | Status copy always accompanies long-running work; no silent spinner. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-16-migration-taking-longer-than-expected.png` |
| Annotated export | `screens/mobile/annotated/MIG-16-migration-taking-longer-than-expected-annotated.png` |
| Status | Accepted — batch 8 |

The two instructions that prevent damage: the Group is protected, and do not retry. A duplicate action started out of impatience is the failure mode this screen exists to prevent.

## MIG-17 — Migration completed

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | C — success |
| State | SUCCESS |
| Viewport | 393x852 |
| Components | CMP-76, CMP-81 |
| Loading / success / failure | Server-confirmed; dependent state refreshed together. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-17-migration-completed.png` |
| Annotated export | `screens/mobile/annotated/MIG-17-migration-completed-annotated.png` |
| Status | Accepted — batch 8 |

Three facts and one action. The trip is available, everything in it survived, and accounts are live — then a single Continue rather than a summary nobody asked for.

## MIG-18 — First authenticated entry after migration

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | C — success |
| State | FIRST ENTRY |
| Viewport | 393x852 |
| Components | CMP-82, ONB-10 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-18-first-authenticated-entry-after-migration.png` |
| Annotated export | `screens/mobile/annotated/MIG-18-first-authenticated-entry-after-migration-annotated.png` |
| Status | Accepted — batch 8 |

The first screen after the upgrade shows the active Group, the current membership and, where it applies, a claimable Participant. The persona picker is gone as authority and the copy does not mourn it.

## MIG-19 — No claimable Participant

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | C — success |
| State | NO CLAIM |
| Viewport | 393x852 |
| Components | CMP-82 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-19-no-claimable-participant.png` |
| Annotated export | `screens/mobile/annotated/MIG-19-no-claimable-participant-annotated.png` |
| Status | Accepted — batch 8 |

The quiet outcome. When every Participant already maps to an account there is nothing to do, and the screen says so instead of offering an empty claim flow.

## MIG-20 — Claimable Participant available

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | C — success |
| State | CLAIM AVAILABLE |
| Viewport | 393x852 |
| Components | CMP-82, CLM-01 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-20-claimable-participant-available.png` |
| Annotated export | `screens/mobile/annotated/MIG-20-claimable-participant-available-annotated.png` |
| Status | Accepted — batch 8 |

A link to the existing claim flow, never an automatic link. Migration hands over to a deliberate, evidenced act rather than deciding who somebody is.

## MIG-21 — Historical data preserved summary

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | C — success |
| State | EVIDENCE |
| Viewport | 393x852 |
| Components | CMP-81 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-21-historical-data-preserved-summary.png` |
| Annotated export | `screens/mobile/annotated/MIG-21-historical-data-preserved-summary-annotated.png` |
| Status | Accepted — batch 8 |

Counted, not claimed. Every line is a number the reviewer can check, and the footnote refuses to assert perfection that no evidence supports.

## MIG-22 — Security activation completed

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | C — success |
| State | SECURED |
| Viewport | 393x852 |
| Components | CMP-76 |
| Loading / success / failure | Server-confirmed; dependent state refreshed together. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-22-security-activation-completed.png` |
| Annotated export | `screens/mobile/annotated/MIG-22-security-activation-completed-annotated.png` |
| Status | Accepted — batch 8 |

One product sentence for the whole security model. No acronym, no policy name, no mechanism — the promise stated in the terms a person can hold you to.

## MIG-23 — Migration success with non-blocking warnings

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | C — success |
| State | SUCCESS + WARNING |
| Viewport | 393x852 |
| Components | CMP-77 |
| Loading / success / failure | Server-confirmed; dependent state refreshed together. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-23-migration-success-with-non-blocking-warnings.png` |
| Annotated export | `screens/mobile/annotated/MIG-23-migration-success-with-non-blocking-warnings-annotated.png` |
| Status | Accepted — batch 8 |

Success and a warning are allowed to coexist. The Group is usable, one document needs attention, and the warning carries a destination rather than a vague caution.

## MIG-24 — Migration stopped before activation

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | D — failure and safe stop |
| State | SAFE STOP |
| Viewport | 393x852 |
| Components | CMP-78 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-24-migration-stopped-before-activation.png` |
| Annotated export | `screens/mobile/annotated/MIG-24-migration-stopped-before-activation-annotated.png` |
| Status | Accepted — batch 8 |

The upgrade stopped before anything was switched over, so the previous app remains the authority. No half-migrated surface is exposed, and retry is a controlled operation rather than a button.

## MIG-25 — Validation failed safely

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | D — failure and safe stop |
| State | SAFE STOP |
| Viewport | 393x852 |
| Components | CMP-78 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-25-validation-failed-safely.png` |
| Annotated export | `screens/mobile/annotated/MIG-25-validation-failed-safely-annotated.png` |
| Status | Accepted — batch 8 |

The check found something it could not resolve and refused to invent an answer. That refusal is the feature, and the screen says it in the first line.

## MIG-26 — Finance mismatch

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | D — failure and safe stop |
| State | SAFE STOP |
| Viewport | 393x852 |
| Components | CMP-84, CMP-78 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-26-finance-mismatch.png` |
| Annotated export | `screens/mobile/annotated/MIG-26-finance-mismatch-annotated.png` |
| Status | Accepted — batch 8 |

Balances are never quietly repaired. The mismatch is named, the originals are untouched, and activation waits for a person — because a silently corrected balance is an argument waiting to happen.

## MIG-27 — Document mismatch

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | D — failure and safe stop |
| State | SAFE STOP |
| Viewport | 393x852 |
| Components | CMP-83, CMP-78 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-27-document-mismatch.png` |
| Annotated export | `screens/mobile/annotated/MIG-27-document-mismatch-annotated.png` |
| Status | Accepted — batch 8 |

The affected documents are held and the rest of the Group is unaffected. The critical read line is the first: no public fallback was exposed to get around the problem.

## MIG-28 — Participant identity conflict

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | D — failure and safe stop |
| State | SAFE STOP |
| Viewport | 393x852 |
| Components | CMP-82, CMP-78 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-28-participant-identity-conflict.png` |
| Annotated export | `screens/mobile/annotated/MIG-28-participant-identity-conflict-annotated.png` |
| Status | Accepted — batch 8 |

Two candidates for one Participant, so nothing is linked. The historical Participant survives untouched and recovery is controlled — consistent with O-07, which removed the Owner review queue.

## MIG-29 — Security activation failed

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | D — failure and safe stop |
| State | RELEASE BLOCKED |
| Viewport | 393x852 |
| Components | CMP-78, CMP-86 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-29-security-activation-failed.png` |
| Annotated export | `screens/mobile/annotated/MIG-29-security-activation-failed-annotated.png` |
| Status | Accepted — batch 8 |

The hardest stop on the board. Partial security is not releasable, so the release is blocked and ordinary users see maintenance rather than an exposed Group.

## MIG-30 — Cross-Group isolation failure

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | D — failure and safe stop |
| State | RELEASE BLOCKED |
| Viewport | 393x852 |
| Components | CMP-86 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-30-cross-group-isolation-failure.png` |
| Annotated export | `screens/mobile/annotated/MIG-30-cross-group-isolation-failure-annotated.png` |
| Status | Accepted — batch 8 |

A contract plate, not a screen anyone reaches. If isolation between Groups cannot be proven, release stops — and no ordinary user is ever shown a detail belonging to another Group, including the fact that one exists.

## MIG-31 — Migration failure with rollback available

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | D — failure and safe stop |
| State | ROLLBACK AVAILABLE |
| Viewport | 393x852 |
| Components | CMP-79 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-31-migration-failure-with-rollback-available.png` |
| Annotated export | `screens/mobile/annotated/MIG-31-migration-failure-with-rollback-available-annotated.png` |
| Status | Accepted — batch 8 |

Failure with a route out. The status is reported honestly as in-progress recovery rather than closed, because a rollback that is running is not a rollback that is done.

## MIG-32 — Migration failure without immediate retry

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | D — failure and safe stop |
| State | NO RETRY |
| Viewport | 393x852 |
| Components | CMP-78 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-32-migration-failure-without-immediate-retry.png` |
| Annotated export | `screens/mobile/annotated/MIG-32-migration-failure-without-immediate-retry-annotated.png` |
| Status | Accepted — batch 8 |

A Retry button that cannot work is worse than no button. This state offers waiting and controlled support, which are the two things that are actually available.

## MIG-33 — Migration status unavailable

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | D — failure and safe stop |
| State | UNKNOWN |
| Viewport | 393x852 |
| Components | CMP-76, CMP-70 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-006, IR-007, IR-009, IR-014, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-33-migration-status-unavailable.png` |
| Annotated export | `screens/mobile/annotated/MIG-33-migration-status-unavailable-annotated.png` |
| Status | Accepted — batch 8 |

Not knowing is different from failing, and conflating them causes people to act on a failure that has not happened. This screen says exactly what it does not know.

## MIG-34 — Rollback beginning

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | E — rollback and recovery |
| State | ROLLBACK STARTED |
| Viewport | 393x852 |
| Components | CMP-79 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-017 |
| Wave | W6 |
| Related IR items | IR-016, IR-018, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-34-rollback-beginning.png` |
| Annotated export | `screens/mobile/annotated/MIG-34-rollback-beginning-annotated.png` |
| Status | Accepted — batch 8 |

Access stays restricted while the rollback runs and the operation is explicitly not closed. Declaring success at the start of a recovery is how half-restored states get released.

## MIG-35 — Rollback in progress

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | E — rollback and recovery |
| State | ROLLBACK RUNNING |
| Viewport | 393x852 |
| Components | CMP-79 |
| Loading / success / failure | Status copy always accompanies long-running work; no silent spinner. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-017 |
| Wave | W6 |
| Related IR items | IR-016, IR-018, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-35-rollback-in-progress.png` |
| Annotated export | `screens/mobile/annotated/MIG-35-rollback-in-progress-annotated.png` |
| Status | Accepted — batch 8 |

Each reversed area is named as it completes, so a long recovery reads as progress rather than a hang.

## MIG-36 — Rollback completed

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | E — rollback and recovery |
| State | ROLLED BACK |
| Viewport | 393x852 |
| Components | CMP-79 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-017 |
| Wave | W6 |
| Related IR items | IR-016, IR-018, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-36-rollback-completed.png` |
| Annotated export | `screens/mobile/annotated/MIG-36-rollback-completed-annotated.png` |
| Status | Accepted — batch 8 |

The required sentence, and only the claim the evidence supports. It says the previous data is in place — not that nothing changed — because a rollback did change things on the way there and back.

## MIG-37 — Rollback completed with review required

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | E — rollback and recovery |
| State | ROLLED BACK + REVIEW |
| Viewport | 393x852 |
| Components | CMP-79, CMP-77 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-017 |
| Wave | W6 |
| Related IR items | IR-016, IR-018, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-37-rollback-completed-with-review-required.png` |
| Annotated export | `screens/mobile/annotated/MIG-37-rollback-completed-with-review-required-annotated.png` |
| Status | Accepted — batch 8 |

The rollback worked and one area still needs a person. Both facts get equal weight, because burying the review under the success is how it stops happening.

## MIG-38 — Rollback failed safely

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | E — rollback and recovery |
| State | RELEASE BLOCKED |
| Viewport | 393x852 |
| Components | CMP-78, CMP-86 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-017 |
| Wave | W6 |
| Related IR items | IR-016, IR-018, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-38-rollback-failed-safely.png` |
| Annotated export | `screens/mobile/annotated/MIG-38-rollback-failed-safely-annotated.png` |
| Status | Accepted — batch 8 |

The worst case, stated plainly. Release stays blocked, no partial state is exposed, and the screen does not offer an action that cannot help.

## MIG-39 — Recovery in progress

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | E — rollback and recovery |
| State | RECOVERING |
| Viewport | 393x852 |
| Components | CMP-80 |
| Loading / success / failure | Status copy always accompanies long-running work; no silent spinner. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-017 |
| Wave | W6 |
| Related IR items | IR-016, IR-018, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-39-recovery-in-progress.png` |
| Annotated export | `screens/mobile/annotated/MIG-39-recovery-in-progress-annotated.png` |
| Status | Accepted — batch 8 |

A verification-first phase with an explicit no-side-effects promise, matching the document reconciliation contract on board 16. Nothing is created, deleted or widened while the check runs.

## MIG-40 — Recovery completed

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | E — rollback and recovery |
| State | RECOVERED |
| Viewport | 393x852 |
| Components | CMP-80 |
| Loading / success / failure | Server-confirmed; dependent state refreshed together. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-017 |
| Wave | W6 |
| Related IR items | IR-016, IR-018, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-40-recovery-completed.png` |
| Annotated export | `screens/mobile/annotated/MIG-40-recovery-completed-annotated.png` |
| Status | Accepted — batch 8 |

Consistency restored, privilege unchanged. The last read line is the auditable one: a recovery that quietly widened access would be a regression dressed as a fix.

## MIG-41 — Recovery failed safely

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | E — rollback and recovery |
| State | RECOVERY FAILED |
| Viewport | 393x852 |
| Components | CMP-80, CMP-78 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-017 |
| Wave | W6 |
| Related IR items | IR-016, IR-018, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-41-recovery-failed-safely.png` |
| Annotated export | `screens/mobile/annotated/MIG-41-recovery-failed-safely-annotated.png` |
| Status | Accepted — batch 8 |

Failure with a stated safety envelope and exactly two next actions, matching DOC-69 and CFG-80. “Failed safely” only means something if the screen says what safely means.

## MIG-42 — Group remains temporarily read-only

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | E — rollback and recovery |
| State | READ-ONLY |
| Viewport | 393x852 |
| Components | CMP-74, CMP-15 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-017 |
| Wave | W6 |
| Related IR items | IR-016, IR-018, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-42-group-remains-temporarily-read-only.png` |
| Annotated export | `screens/mobile/annotated/MIG-42-group-remains-temporarily-read-only-annotated.png` |
| Status | Accepted — batch 8 |

A holding state that is honest about being temporary without promising when it ends. Reading works, writing does not, and nobody is locked out of their own history.

## MIG-43 — Group restored to normal access

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | E — rollback and recovery |
| State | RESTORED |
| Viewport | 393x852 |
| Components | CMP-80 |
| Loading / success / failure | Server-confirmed; dependent state refreshed together. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-017 |
| Wave | W6 |
| Related IR items | IR-016, IR-018, IR-021, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-43-group-restored-to-normal-access.png` |
| Annotated export | `screens/mobile/annotated/MIG-43-group-restored-to-normal-access-annotated.png` |
| Status | Accepted — batch 8 |

Everything returns at once rather than trickling back, and the exact-value guarantee is restated because this is the moment people go and check their balance.

## MIG-44 — Bali Group created

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | F — migrated Bali Group |
| State | MIGRATED |
| Viewport | 393x852 |
| Components | CMP-81 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-002, IR-004, IR-006, IR-009, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-44-bali-group-created.png` |
| Annotated export | `screens/mobile/annotated/MIG-44-bali-group-created-annotated.png` |
| Status | Accepted — batch 8 |

The seeded trip becomes exactly one Group. There is no separate Trip record beside it, because a Group is the Trip workspace and the tenant boundary — a distinction the legacy captures blurred.

## MIG-45 — Owner account linked through validated Auth identity

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | F — migrated Bali Group |
| State | MIGRATED |
| Viewport | 393x852 |
| Components | CMP-82 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-002, IR-004, IR-006, IR-009, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-45-owner-account-linked-through-validated-auth-identity.png` |
| Annotated export | `screens/mobile/annotated/MIG-45-owner-account-linked-through-validated-auth-identity-annotated.png` |
| Status | Accepted — batch 8 |

Ownership comes from a validated authenticated identity, shown as an email and a role. No internal identifier appears — not shortened, not truncated, not at all.

## MIG-46 — Existing Participants preserved

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | F — migrated Bali Group |
| State | MIGRATED |
| Viewport | 393x852 |
| Components | CMP-82 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-002, IR-004, IR-006, IR-009, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-46-existing-participants-preserved.png` |
| Annotated export | `screens/mobile/annotated/MIG-46-existing-participants-preserved-annotated.png` |
| Status | Accepted — batch 8 |

All five keep their display identity and their emoji; claimed and unclaimed are shown as states, not privileges. The footnote closes the legacy assumption directly.

## MIG-47 — Legacy persona selection removed as authority

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | F — migrated Bali Group |
| State | MIGRATED |
| Viewport | 393x852 |
| Components | CMP-82 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-002, IR-004, IR-006, IR-009, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-47-legacy-persona-selection-removed-as-authority.png` |
| Annotated export | `screens/mobile/annotated/MIG-47-legacy-persona-selection-removed-as-authority-annotated.png` |
| Status | Accepted — batch 8 |

Explains the change in the language of the product rather than the language of the fix: you sign in as yourself, and picking a face from a list no longer decides who you are.

## MIG-48 — Unclaimed Participants remain non-authoritative

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | F — migrated Bali Group |
| State | MIGRATED |
| Viewport | 393x852 |
| Components | CMP-82 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-002, IR-004, IR-006, IR-009, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-48-unclaimed-participants-remain-non-authoritative.png` |
| Annotated export | `screens/mobile/annotated/MIG-48-unclaimed-participants-remain-non-authoritative-annotated.png` |
| Status | Accepted — batch 8 |

The E-09 treatment carried into migration: warm neutral, dashed ring, the word UNCLAIMED on the row. Presentation and history, never authority.

## MIG-49 — Claim flow available after migration

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | F — migrated Bali Group |
| State | CLAIM ENTRY |
| Viewport | 393x852 |
| Components | CMP-82, CLM-01 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-002, IR-004, IR-006, IR-009, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-49-claim-flow-available-after-migration.png` |
| Annotated export | `screens/mobile/annotated/MIG-49-claim-flow-available-after-migration-annotated.png` |
| Status | Accepted — batch 8 |

Links into the existing claim flow from board 13 rather than duplicating it. Migration creates the opportunity; the claim flow owns the evidence and the outcome.

## MIG-50 — Events and presentation preserved

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | F — migrated Bali Group |
| State | MIGRATED |
| Viewport | 393x852 |
| Components | CMP-81 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-002, IR-004, IR-006, IR-009, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-50-events-and-presentation-preserved.png` |
| Annotated export | `screens/mobile/annotated/MIG-50-events-and-presentation-preserved-annotated.png` |
| Status | Accepted — batch 8 |

Events and their presentation relationships survive intact. The footnote is the one that matters: presentation is placement, and it never became document access or a private Event.

## MIG-51 — Finance exact-value evidence

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | F — migrated Bali Group |
| State | EVIDENCE |
| Viewport | 393x852 |
| Components | CMP-84 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-002, IR-004, IR-006, IR-009, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-51-finance-exact-value-evidence.png` |
| Annotated export | `screens/mobile/annotated/MIG-51-finance-exact-value-evidence-annotated.png` |
| Status | Accepted — batch 8 |

The four finance facts a reviewer will test, on one plate: IDR is authority, Originals survive, the legacy 188.68 rate is historical provenance, and no live rate was substituted anywhere.

## MIG-52 — Documents moved to private Group access

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | F — migrated Bali Group |
| State | MIGRATED |
| Viewport | 393x852 |
| Components | CMP-83 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-002, IR-004, IR-006, IR-009, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-52-documents-moved-to-private-group-access.png` |
| Annotated export | `screens/mobile/annotated/MIG-52-documents-moved-to-private-group-access-annotated.png` |
| Status | Accepted — batch 8 |

Counted and stated. Nine documents moved, and access is described by who can open them rather than by the mechanism that enforces it.

## MIG-53 — Legacy public link no longer works

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | F — migrated Bali Group |
| State | MIGRATED |
| Viewport | 393x852 |
| Components | CMP-83 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-002, IR-004, IR-006, IR-009, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-53-legacy-public-link-no-longer-works.png` |
| Annotated export | `screens/mobile/annotated/MIG-53-legacy-public-link-no-longer-works-annotated.png` |
| Status | Accepted — batch 8 |

States the outcome without reproducing the address, quoting it, or hinting at its shape. Printing the old link to announce its death would be the leak the migration exists to close.

## MIG-54 — Todos preserved

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | F — migrated Bali Group |
| State | MIGRATED |
| Viewport | 393x852 |
| Components | CMP-81 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-002, IR-004, IR-006, IR-009, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-54-todos-preserved.png` |
| Annotated export | `screens/mobile/annotated/MIG-54-todos-preserved-annotated.png` |
| Status | Accepted — batch 8 |

The smallest surface, treated with the same discipline: counted, attributed, and unchanged.

## MIG-55 — FX reference context preserved

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | F — migrated Bali Group |
| State | MIGRATED |
| Viewport | 393x852 |
| Components | CMP-84, CFG-54 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-002, IR-004, IR-006, IR-009, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-55-fx-reference-context-preserved.png` |
| Annotated export | `screens/mobile/annotated/MIG-55-fx-reference-context-preserved-annotated.png` |
| Status | Accepted — batch 8 |

The converter survives as reference and nothing more. The boundary is restated at the moment a reader is most likely to assume the migration promoted it.

## MIG-56 — Bali-only guide remains scoped to Bali

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | F — migrated Bali Group |
| State | MIGRATED |
| Viewport | 393x852 |
| Components | CMP-59 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-002, IR-004, IR-006, IR-009, IR-012, IR-014, IR-015 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-56-bali-only-guide-remains-scoped-to-bali.png` |
| Annotated export | `screens/mobile/annotated/MIG-56-bali-only-guide-remains-scoped-to-bali-annotated.png` |
| Status | Accepted — batch 8 |

Approved Bali content stays attached to the Bali destination and does not become a general feature by accident of migration.

## MIG-57 — Migration evidence summary

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | F — migrated Bali Group |
| State | REVIEW PLATE |
| Viewport | 393x852 |
| Components | CMP-81, CMP-86 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-021 |
| Wave | W5 |
| Related IR items | IR-016, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-57-migration-evidence-summary.png` |
| Annotated export | `screens/mobile/annotated/MIG-57-migration-evidence-summary-annotated.png` |
| Status | Accepted — batch 8 |

The review plate: each visible piece of evidence beside the requirement it satisfies. It is a reviewer’s checklist rendered as a screen, and it makes no claim the counted evidence does not support.

## MIG-58 — Claim available

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | G — participant claim recovery |
| State | CLAIM AVAILABLE |
| Viewport | 393x852 |
| Components | CMP-82, CLM-01 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-016 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-58-claim-available.png` |
| Annotated export | `screens/mobile/annotated/MIG-58-claim-available-annotated.png` |
| Status | Accepted — batch 8 |

One claimable Participant, named, with the consequence stated before the action: the history comes with the claim. Nothing is pre-selected.

## MIG-59 — Claim not required

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | G — participant claim recovery |
| State | NO CLAIM NEEDED |
| Viewport | 393x852 |
| Components | CMP-82 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-016 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-59-claim-not-required.png` |
| Annotated export | `screens/mobile/annotated/MIG-59-claim-not-required-annotated.png` |
| Status | Accepted — batch 8 |

Your account already maps to a Participant, so there is nothing to claim and the screen says it in one line rather than presenting an empty list.

## MIG-60 — Claim already completed

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | G — participant claim recovery |
| State | ALREADY CLAIMED |
| Viewport | 393x852 |
| Components | CMP-82, CLM-08 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-016 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-60-claim-already-completed.png` |
| Annotated export | `screens/mobile/annotated/MIG-60-claim-already-completed-annotated.png` |
| Status | Accepted — batch 8 |

A second attempt on the same Participant is a no-op with a clear explanation, not an error. Idempotent outcomes should read as calm, not as failure.

## MIG-61 — Claim conflict

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | G — participant claim recovery |
| State | BLOCKED |
| Viewport | 393x852 |
| Components | PERM-16, CLM-09 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-016 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-61-claim-conflict.png` |
| Annotated export | `screens/mobile/annotated/MIG-61-claim-conflict-annotated.png` |
| Status | Accepted — batch 8 |

Another account already holds it, so the claim stops. Consistent with O-07 there is no Owner review queue and no manual reassignment — the design will not adjudicate identity.

## MIG-62 — Insufficient evidence

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | G — participant claim recovery |
| State | BLOCKED |
| Viewport | 393x852 |
| Components | PERM-16, CLM-11 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-016 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-62-insufficient-evidence.png` |
| Annotated export | `screens/mobile/annotated/MIG-62-insufficient-evidence-annotated.png` |
| Status | Accepted — batch 8 |

A claim that cannot be evidenced stops safely and states that nothing changed. No review queue exists to escalate into, and inventing one here would contradict a closed decision.

## MIG-63 — Claim recovery guidance

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | G — participant claim recovery |
| State | GUIDANCE |
| Viewport | 393x852 |
| Components | CMP-82 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-016 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-63-claim-recovery-guidance.png` |
| Annotated export | `screens/mobile/annotated/MIG-63-claim-recovery-guidance-annotated.png` |
| Status | Accepted — batch 8 |

Three concrete routes rather than an apology. Each one is something the person can actually do, and none of them is a queue that does not exist.

## MIG-64 — Account switch required

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | G — participant claim recovery |
| State | WRONG ACCOUNT |
| Viewport | 393x852 |
| Components | CLM-12, AUTH-01 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-016 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-64-account-switch-required.png` |
| Annotated export | `screens/mobile/annotated/MIG-64-account-switch-required-annotated.png` |
| Status | Accepted — batch 8 |

The claim belongs to a different account. The screen says so without naming the other account, because confirming which address holds it would be a disclosure.

## MIG-65 — Claim retry after safe transient failure

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | G — participant claim recovery |
| State | SAFE RETRY |
| Viewport | 393x852 |
| Components | CMP-20, CLM-13 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-016 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-65-claim-retry-after-safe-transient-failure.png` |
| Annotated export | `screens/mobile/annotated/MIG-65-claim-retry-after-safe-transient-failure-annotated.png` |
| Status | Accepted — batch 8 |

The one claim failure where retry genuinely can succeed, so it is the only one that offers it. Nothing was linked, so repeating is safe rather than risky.

## MIG-66 — Claim unavailable after Group removal

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | G — participant claim recovery |
| State | NOT A MEMBER |
| Viewport | 393x852 |
| Components | CMP-13, PERM-13 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-006 |
| Wave | W3 |
| Related IR items | IR-016 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-66-claim-unavailable-after-group-removal.png` |
| Annotated export | `screens/mobile/annotated/MIG-66-claim-unavailable-after-group-removal-annotated.png` |
| Status | Accepted — batch 8 |

Claiming requires current membership. Removed from the Group means the claim surface is gone too, and the message never reveals whether the Participant exists.

## MIG-67 — Accounting-currency migration required

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | H — accounting-currency migration |
| State | EXPLANATION |
| Viewport | 393x852 |
| Components | CMP-57, CFG-45 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-014, IR-021 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-67-accounting-currency-migration-required.png` |
| Annotated export | `screens/mobile/annotated/MIG-67-accounting-currency-migration-required-annotated.png` |
| Status | Accepted — batch 8 |

Explanation only. O-17 resolved this: a reviewed accounting-currency migration is not an ordinary Owner action and there is no executable workflow here — so the screen carries no action that pretends otherwise.

## MIG-68 — Accounting migration under review

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | H — accounting-currency migration |
| State | UNDER REVIEW |
| Viewport | 393x852 |
| Components | CMP-76, CMP-57 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-014, IR-021 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-68-accounting-migration-under-review.png` |
| Annotated export | `screens/mobile/annotated/MIG-68-accounting-migration-under-review-annotated.png` |
| Status | Accepted — batch 8 |

Read-only status communication. The ledger is untouched while a reviewed procedure is considered, and the Group keeps working normally in every other respect.

## MIG-69 — Accounting migration read-only window

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | H — accounting-currency migration |
| State | FINANCE READ-ONLY |
| Viewport | 393x852 |
| Components | CMP-74 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-014, IR-021 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-69-accounting-migration-read-only-window.png` |
| Annotated export | `screens/mobile/annotated/MIG-69-accounting-migration-read-only-window-annotated.png` |
| Status | Accepted — batch 8 |

Only the money surface pauses. Events, todos and documents keep working, because a currency procedure should not stop somebody adding a ferry time.

## MIG-70 — Accounting migration completed

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | H — accounting-currency migration |
| State | COMPLETED |
| Viewport | 393x852 |
| Components | CMP-84 |
| Loading / success / failure | Server-confirmed; dependent state refreshed together. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-014, IR-021 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-70-accounting-migration-completed.png` |
| Annotated export | `screens/mobile/annotated/MIG-70-accounting-migration-completed-annotated.png` |
| Status | Accepted — batch 8 |

Shown only after a verified procedure, and even then the Originals and the FX evidence are restated as unchanged. The new currency is authority going forward, not retroactively.

## MIG-71 — Accounting migration failed safely

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | H — accounting-currency migration |
| State | SAFE STOP |
| Viewport | 393x852 |
| Components | CMP-78, CMP-84 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-014, IR-021 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-71-accounting-migration-failed-safely.png` |
| Annotated export | `screens/mobile/annotated/MIG-71-accounting-migration-failed-safely-annotated.png` |
| Status | Accepted — batch 8 |

The ledger is exactly where it was. This is the failure people fear most, so the screen answers the fear before anything else.

## MIG-72 — No silent historical conversion

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | H — accounting-currency migration |
| State | CONTRACT |
| Viewport | 393x852 |
| Components | CMP-84 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-014, IR-021 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-72-no-silent-historical-conversion.png` |
| Annotated export | `screens/mobile/annotated/MIG-72-no-silent-historical-conversion-annotated.png` |
| Status | Accepted — batch 8 |

The four-line guarantee this whole area exists to protect, on one plate a reviewer can point at.

## MIG-73 — Legacy document securing in progress

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | I — document recovery |
| State | IN PROGRESS |
| Viewport | 393x852 |
| Components | CMP-83 |
| Loading / success / failure | Status copy always accompanies long-running work; no silent spinner. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-009, IR-013, IR-021 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-73-legacy-document-securing-in-progress.png` |
| Annotated export | `screens/mobile/annotated/MIG-73-legacy-document-securing-in-progress-annotated.png` |
| Status | Accepted — batch 8 |

Counted progress with the destination stated. The address being replaced is never printed, at any stage.

## MIG-74 — Document object and metadata reconciled

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | I — document recovery |
| State | RECONCILED |
| Viewport | 393x852 |
| Components | CMP-83, CMP-46 |
| Loading / success / failure | Server-confirmed; dependent state refreshed together. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-009, IR-013, IR-021 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-74-document-object-and-metadata-reconciled.png` |
| Annotated export | `screens/mobile/annotated/MIG-74-document-object-and-metadata-reconciled-annotated.png` |
| Status | Accepted — batch 8 |

Record and file matched, access unchanged. The repair restores consistency and grants nothing — the same rule as DOC-68.

## MIG-75 — Metadata exists, object missing

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | I — document recovery |
| State | ORPHAN |
| Viewport | 393x852 |
| Components | CMP-46 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-009, IR-013, IR-021 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-75-metadata-exists-object-missing.png` |
| Annotated export | `screens/mobile/annotated/MIG-75-metadata-exists-object-missing-annotated.png` |
| Status | Accepted — batch 8 |

The row stays visible so the inconsistency is discoverable, and it is unopenable. The fourth line is the point: a missing private file never degrades into a public or legacy address.

## MIG-76 — Object exists, metadata missing

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | I — document recovery |
| State | OPERATIONAL |
| Viewport | 393x852 |
| Components | — |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-009, IR-013, IR-021 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-76-object-exists-metadata-missing.png` |
| Annotated export | `screens/mobile/annotated/MIG-76-object-exists-metadata-missing-annotated.png` |
| Status | Accepted — batch 8 |

The inverse orphan, answered with a contract rather than a screen. A file with no record has no authorised Group relationship, so there is nobody it may be shown to — and no “recover unlinked files” screen exists.

## MIG-77 — Event association repaired

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | I — document recovery |
| State | REPAIRED |
| Viewport | 393x852 |
| Components | CMP-46, DOC-65 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-009, IR-013, IR-021 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-77-event-association-repaired.png` |
| Annotated export | `screens/mobile/annotated/MIG-77-event-association-repaired-annotated.png` |
| Status | Accepted — batch 8 |

The link is restored from evidence, never guessed from a filename or a date. A fabricated association on an Event people are travelling on would be worse than an absent one.

## MIG-78 — Document remains under review

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | I — document recovery |
| State | HELD |
| Viewport | 393x852 |
| Components | CMP-77, CMP-46 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-009, IR-013, IR-021 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-78-document-remains-under-review.png` |
| Annotated export | `screens/mobile/annotated/MIG-78-document-remains-under-review-annotated.png` |
| Status | Accepted — batch 8 |

Held and named rather than quietly hidden. The rest of the Group is unaffected, which is what keeps a single held file from reading as a broken trip.

## MIG-79 — Document recovery failed safely

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | I — document recovery |
| State | FAILED SAFELY |
| Viewport | 393x852 |
| Components | CMP-78 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-009, IR-013, IR-021 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-79-document-recovery-failed-safely.png` |
| Annotated export | `screens/mobile/annotated/MIG-79-document-recovery-failed-safely-annotated.png` |
| Status | Accepted — batch 8 |

Failure with the same safety envelope used on DOC-69 and MIG-41: no exposure, no fabrication, no access drift, and two controlled next actions.

## MIG-80 — Returning user enters migrated Group

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | J — returning user and session |
| State | RETURNING |
| Viewport | 393x852 |
| Components | CMP-81 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-004, IR-005, IR-006, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-80-returning-user-enters-migrated-group.png` |
| Annotated export | `screens/mobile/annotated/MIG-80-returning-user-enters-migrated-group-annotated.png` |
| Status | Accepted — batch 8 |

The upgrade is mentioned once and then gets out of the way. The trip looks like the trip, which is the strongest possible evidence that nothing was lost.

## MIG-81 — User no longer belongs to migrated Group

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | J — returning user and session |
| State | NOT A MEMBER |
| Viewport | 393x852 |
| Components | CMP-13, PERM-13 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-004, IR-005, IR-006, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-81-user-no-longer-belongs-to-migrated-group.png` |
| Annotated export | `screens/mobile/annotated/MIG-81-user-no-longer-belongs-to-migrated-group-annotated.png` |
| Status | Accepted — batch 8 |

Migration does not grant membership to anyone who did not have it. The generic unavailable treatment is used so the response is identical to every other not-a-member case.

## MIG-82 — Invitation pending after migration

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | J — returning user and session |
| State | PENDING |
| Viewport | 393x852 |
| Components | CMP-64, INV-04 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-004, IR-005, IR-006, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-82-invitation-pending-after-migration.png` |
| Annotated export | `screens/mobile/annotated/MIG-82-invitation-pending-after-migration-annotated.png` |
| Status | Accepted — batch 8 |

A pending invitation survives the upgrade as a pending invitation. Possession of the link still grants nothing until it is accepted.

## MIG-83 — Invitation expired during maintenance

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | J — returning user and session |
| State | EXPIRED |
| Viewport | 393x852 |
| Components | CMP-20, INV-16 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-004, IR-005, IR-006, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-83-invitation-expired-during-maintenance.png` |
| Annotated export | `screens/mobile/annotated/MIG-83-invitation-expired-during-maintenance-annotated.png` |
| Status | Accepted — batch 8 |

Expiry is honoured even when maintenance caused the delay, because a link that outlives its window is a link with no window. A new invitation is one tap for an Owner.

## MIG-84 — Session expired during migration

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | J — returning user and session |
| State | SESSION EXPIRED |
| Viewport | 393x852 |
| Components | AUTH-11, PERM-19 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-004, IR-005, IR-006, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-84-session-expired-during-migration.png` |
| Annotated export | `screens/mobile/annotated/MIG-84-session-expired-during-migration-annotated.png` |
| Status | Accepted — batch 8 |

A session expiry is about the person, not the Group, and the two are never conflated. Signing in again returns to the same place rather than the top of the app.

## MIG-85 — Multiple Groups after migration

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | J — returning user and session |
| State | MULTIPLE GROUPS |
| Viewport | 393x852 |
| Components | CMP-03, GRP-02 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-004, IR-005, IR-006, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-85-multiple-groups-after-migration.png` |
| Annotated export | `screens/mobile/annotated/MIG-85-multiple-groups-after-migration-annotated.png` |
| Status | Accepted — batch 8 |

Two Groups, fully isolated. Switching follows the same six-step sequence as RT-10, so no frame ever mixes one Group’s content with another’s configuration.

## MIG-86 — Migrated Group archived

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | J — returning user and session |
| State | ARCHIVED |
| Viewport | 393x852 |
| Components | CMP-15, GRP-13 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-004, IR-005, IR-006, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-86-migrated-group-archived.png` |
| Annotated export | `screens/mobile/annotated/MIG-86-migrated-group-archived-annotated.png` |
| Status | Accepted — batch 8 |

A migrated Group archives exactly like any other. Nothing about having been migrated changes the lifecycle, and the read-only banner is the accepted one.

## MIG-87 — Migrated Group restored

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | J — returning user and session |
| State | RESTORED |
| Viewport | 393x852 |
| Components | CMP-15, GRP-17 |
| Loading / success / failure | Server-confirmed; dependent state refreshed together. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-004, IR-005, IR-006, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-87-migrated-group-restored.png` |
| Annotated export | `screens/mobile/annotated/MIG-87-migrated-group-restored-annotated.png` |
| Status | Accepted — batch 8 |

Restore returns every action at once and recalculates nothing. The exact-value guarantee matters more here than anywhere, because this Group carries migrated finance.

## MIG-88 — Migration recovery decision matrix

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | K — final recovery matrix |
| State | MATRIX |
| Viewport | 393x852 |
| Components | CMP-86 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-017 |
| Wave | W6 |
| Related IR items | IR-018, IR-020, IR-022 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-88-migration-recovery-decision-matrix.png` |
| Annotated export | `screens/mobile/annotated/MIG-88-migration-recovery-decision-matrix-annotated.png` |
| Status | Accepted — batch 8 |

Every migration state mapped to the one action available from it. The value is in what is missing: several states offer no retry at all, and the matrix says so rather than leaving a hopeful button.

## MIG-89 — Data-change truth table

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | K — final recovery matrix |
| State | TRUTH TABLE |
| Viewport | 393x852 |
| Components | CMP-85 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-016 |
| Wave | W5 |
| Related IR items | IR-017, IR-021 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-89-data-change-truth-table.png` |
| Annotated export | `screens/mobile/annotated/MIG-89-data-change-truth-table-annotated.png` |
| Status | Accepted — batch 8 |

Six outcomes that must never be blurred into “done”. Each badge is a distinct claim about what happened to the data, and the design refuses to use a stronger one than the evidence supports.

## MIG-90 — User-facing language versus internal evidence

| Field | Value |
|---|---|
| Flow | Flow P — migration, recovery and implementation-readiness |
| Group | K — final recovery matrix |
| State | CONTRACT |
| Viewport | 393x852 |
| Components | CMP-86 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Migration communication is calm, Group-scoped, free of internal identifiers, explicit about whether data changed, and never guesses a value. Partial security activation and unproven cross-Group isolation block release. |
| IR owner | IR-022 |
| Wave | W5 |
| Related IR items | IR-016, IR-017, IR-018 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/MIG-90-user-facing-language-versus-internal-evidence.png` |
| Annotated export | `screens/mobile/annotated/MIG-90-user-facing-language-versus-internal-evidence-annotated.png` |
| Status | Accepted — batch 8 |

The board’s closing rule, drawn as two columns. Product copy stays in product language; the identifiers a reviewer needs live in the manifests and the traceability document, never on a screen.


---

# Board 18

## RT-01 — Connected state

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | A — connection lifecycle |
| State | HEALTHY, SILENT |
| Viewport | 393x852 |
| Components | CMP-63 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-01-connected-state.png` |
| Annotated export | `screens/mobile/annotated/RT-01-connected-state-annotated.png` |
| Status | Accepted — batch 7 |

Health is the absence of chrome. No permanent badge, no green dot, no "live" label — a connected app looks exactly like the accepted app, because a status indicator that is almost always green teaches people to ignore it.

## RT-02 — Connection interrupted

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | A — connection lifecycle |
| State | INTERRUPTED |
| Viewport | 393x852 |
| Components | CMP-63 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-02-connection-interrupted.png` |
| Annotated export | `screens/mobile/annotated/RT-02-connection-interrupted-annotated.png` |
| Status | Accepted — batch 7 |

One quiet pill under the sticky header, at the point where a person would otherwise wonder whether the list is current. It states the condition and what is on screen, and it does not block anything readable.

## RT-03 — Reconnecting

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | A — connection lifecycle |
| State | RECONNECTING |
| Viewport | 393x852 |
| Components | CMP-63 |
| Loading / success / failure | Status copy always accompanies long-running work; no silent spinner. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-03-reconnecting.png` |
| Annotated export | `screens/mobile/annotated/RT-03-reconnecting-annotated.png` |
| Status | Accepted — batch 7 |

The only motion is a slow pulse on a 6px dot. The reduced-motion branch is drawn beside it, because "reconnecting" is exactly the state a vestibular-sensitive person will be staring at.

## RT-04 — Reconnected

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | A — connection lifecycle |
| State | TRANSIENT SUCCESS |
| Viewport | 393x852 |
| Components | CMP-64 |
| Loading / success / failure | Server-confirmed; dependent state refreshed together. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-04-reconnected.png` |
| Annotated export | `screens/mobile/annotated/RT-04-reconnected-annotated.png` |
| Status | Accepted — batch 7 |

Level 2. The toast says the two things that matter — the connection is back and the data was refreshed — then it leaves. Nothing persistent is added, because a permanent "you are online" badge is noise.

## RT-05 — Offline with cached content

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | A — connection lifecycle |
| State | OFFLINE, CACHED |
| Viewport | 393x852 |
| Components | CMP-63, CMP-16 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-05-offline-with-cached-content.png` |
| Annotated export | `screens/mobile/annotated/RT-05-offline-with-cached-content-annotated.png` |
| Status | Accepted — batch 7 |

Everything already loaded stays readable and every mutation affordance goes. There is no offline queue in the current accepted scope, so the design refuses to promise that anything typed now will be sent later.

## RT-06 — Offline with no cached content

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | A — connection lifecycle |
| State | OFFLINE, NO CACHE |
| Viewport | 393x852 |
| Components | CMP-16 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-06-offline-with-no-cached-content.png` |
| Annotated export | `screens/mobile/annotated/RT-06-offline-with-no-cached-content-annotated.png` |
| Status | Accepted — batch 7 |

The critical distinction on this board: an empty screen because there is no connection is not an empty Group. The copy never says "no events yet", because that sentence would be false and alarming.

## RT-07 — Reconnect failed

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | A — connection lifecycle |
| State | RECONNECT FAILED |
| Viewport | 393x852 |
| Components | CMP-63, CMP-20 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-07-reconnect-failed.png` |
| Annotated export | `screens/mobile/annotated/RT-07-reconnect-failed-annotated.png` |
| Status | Accepted — batch 7 |

A failed reconnect is a network fact, not an access decision. Nobody is signed out and nothing suggests permission was withdrawn — the content that was already safe to read stays on screen behind the notice.

## RT-08 — Session valid, realtime unavailable

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | A — connection lifecycle |
| State | DEGRADED |
| Viewport | 393x852 |
| Components | CMP-63 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-08-session-valid-realtime-unavailable.png` |
| Annotated export | `screens/mobile/annotated/RT-08-session-valid-realtime-unavailable-annotated.png` |
| Status | Accepted — batch 7 |

Live updates are a convenience layer; reads and server-confirmed writes are the product. This state separates the two so a person keeps working instead of assuming the app is broken.

## RT-09 — Realtime restored after prolonged interruption

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | A — connection lifecycle |
| State | REFRESHING |
| Viewport | 393x852 |
| Components | CMP-63, CMP-70 |
| Loading / success / failure | Status copy always accompanies long-running work; no silent spinner. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-09-realtime-restored-after-prolonged-interruption.png` |
| Annotated export | `screens/mobile/annotated/RT-09-realtime-restored-after-prolonged-interruption-annotated.png` |
| Status | Accepted — batch 7 |

After a long gap the stream cannot be trusted to have carried everything, so the design re-fetches authorised data first and only then says the screen is current. Order matters more than speed here.

## RT-10 — Group switch during reconnect

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | A — connection lifecycle |
| State | SWITCH SEQUENCE |
| Viewport | 393x852 |
| Components | CMP-63, CMP-11 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-10-group-switch-during-reconnect.png` |
| Annotated export | `screens/mobile/annotated/RT-10-group-switch-during-reconnect-annotated.png` |
| Status | Accepted — batch 7 |

Six ordered steps, drawn as a contract. The unsubscribe and the clear both happen before anything from the new Group is requested, which is what makes a mixed-Group frame impossible rather than unlikely.

## RT-11 — New Event received

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | B — Event realtime |
| State | INLINE UPDATE |
| Viewport | 393x852 |
| Components | CMP-65, CMP-68 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-11-new-event-received.png` |
| Annotated export | `screens/mobile/annotated/RT-11-new-event-received-annotated.png` |
| Status | Accepted — batch 7 |

Level 3: the itinerary materially changed, so the notice persists until it is looked at. Presentation filtering is applied before the row and before the count, so an Event not presented to this Participant leaves no trace at all.

## RT-12 — Event updated by another Member

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | B — Event realtime |
| State | SILENT UPDATE + ATTRIBUTION |
| Viewport | 393x852 |
| Components | CMP-68 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-12-event-updated-by-another-member.png` |
| Annotated export | `screens/mobile/annotated/RT-12-event-updated-by-another-member-annotated.png` |
| Status | Accepted — batch 7 |

Level 1 plus a whisper. The card updates in place at the same scroll offset, and the only addition is one attribution line that explains why the time on screen just changed.

## RT-13 — Event changed while edit form is open

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | B — Event realtime |
| State | CONFLICT |
| Viewport | 393x852 |
| Components | CMP-66 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No auto-merge. Local input preserved; saving still uses server-confirmed stale-version protection. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-13-event-changed-while-edit-form-is-open.png` |
| Annotated export | `screens/mobile/annotated/RT-13-event-changed-while-edit-form-is-open-annotated.png` |
| Status | Accepted — batch 7 |

Level 4. The local edits stay exactly where they are, the remote version is offered rather than applied, and there is no merge. Saving still goes through the server-confirmed stale-version check even if the person chooses to keep editing.

## RT-14 — Event removed while visible

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | B — Event realtime |
| State | REMOVED |
| Viewport | 393x852 |
| Components | CMP-64 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-14-event-removed-while-visible.png` |
| Annotated export | `screens/mobile/annotated/RT-14-event-removed-while-visible-annotated.png` |
| Status | Accepted — batch 7 |

The card goes only after the removal is confirmed by an authorised read, not on the strength of the message alone. A row that vanishes and comes back is worse than a row that leaves half a second late.

## RT-15 — Event removed while edit form is open

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | B — Event realtime |
| State | RESOURCE GONE |
| Viewport | 393x852 |
| Components | CMP-66, CMP-20 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-15-event-removed-while-edit-form-is-open.png` |
| Annotated export | `screens/mobile/annotated/RT-15-event-removed-while-edit-form-is-open-annotated.png` |
| Status | Accepted — batch 7 |

The save is stopped before it is attempted, because writing to a record that no longer exists produces the worst error message in the product. Typed notes are offered back so the work is not lost with the record.

## RT-16 — Event presentation changed

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | B — Event realtime |
| State | PRESENTATION CHANGE |
| Viewport | 393x852 |
| Components | CMP-65 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-16-event-presentation-changed.png` |
| Annotated export | `screens/mobile/annotated/RT-16-event-presentation-changed-annotated.png` |
| Status | Accepted — batch 7 |

An Event can enter or leave this Participant’s itinerary presentation. The copy describes the effect on this person only and never enumerates who else the Event is presented to.

## RT-17 — Todo added by another Member

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | C — Todo realtime |
| State | SILENT UPDATE |
| Viewport | 393x852 |
| Components | CMP-68 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-17-todo-added-by-another-member.png` |
| Annotated export | `screens/mobile/annotated/RT-17-todo-added-by-another-member-annotated.png` |
| Status | Accepted — batch 7 |

The new row appears at the end of the pending list and the caret stays exactly where it was. Focus theft in a shared todo list is the fastest way to make two people type over each other.

## RT-18 — Todo completed by another Member

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | C — Todo realtime |
| State | SILENT UPDATE |
| Viewport | 393x852 |
| Components | CMP-68 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-18-todo-completed-by-another-member.png` |
| Annotated export | `screens/mobile/annotated/RT-18-todo-completed-by-another-member-annotated.png` |
| Status | Accepted — batch 7 |

The row moves to completed in place with a brief attribution, because "who ticked this" is genuinely useful in a group list and costs one line.

## RT-19 — Todo removed while visible

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | C — Todo realtime |
| State | REMOVED |
| Viewport | 393x852 |
| Components | CMP-64 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-19-todo-removed-while-visible.png` |
| Annotated export | `screens/mobile/annotated/RT-19-todo-removed-while-visible-annotated.png` |
| Status | Accepted — batch 7 |

The row leaves cleanly and the list closes the gap. No empty shell, no strikethrough ghost, no "this item was deleted" placeholder sitting in a list people scan quickly.

## RT-20 — Todo changed while current user is editing its text

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | C — Todo realtime |
| State | CONFLICT |
| Viewport | 393x852 |
| Components | CMP-66 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No auto-merge. Local input preserved; saving still uses server-confirmed stale-version protection. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-20-todo-changed-while-current-user-is-editing-its-text.png` |
| Annotated export | `screens/mobile/annotated/RT-20-todo-changed-while-current-user-is-editing-its-text-annotated.png` |
| Status | Accepted — batch 7 |

Even for a todo, an overwrite is an overwrite. The same conflict treatment as an Event or a settings form, at a smaller scale, so the pattern is learned once.

## RT-21 — Clear-completed performed by another Member

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | C — Todo realtime |
| State | BULK UPDATE |
| Viewport | 393x852 |
| Components | CMP-64 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-21-clear-completed-performed-by-another-member.png` |
| Annotated export | `screens/mobile/annotated/RT-21-clear-completed-performed-by-another-member-annotated.png` |
| Status | Accepted — batch 7 |

A bulk change to the completed section must not shift the pending list under a reading finger, so the completed block collapses in place and the pending block keeps its offset.

## RT-22 — Expense added

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | D — finance realtime |
| State | LEDGER UPDATE |
| Viewport | 393x852 |
| Components | CMP-64, CMP-68 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-22-expense-added.png` |
| Annotated export | `screens/mobile/annotated/RT-22-expense-added-annotated.png` |
| Status | Accepted — batch 7 |

The ledger row, the Group total and every balance move in the same frame, and only once the accepted server record exists. A total that updates a beat after its expense reads as an arithmetic bug.

## RT-23 — Expense updated

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | D — finance realtime |
| State | ATOMIC REFRESH |
| Viewport | 393x852 |
| Components | CMP-68 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-23-expense-updated.png` |
| Annotated export | `screens/mobile/annotated/RT-23-expense-updated-annotated.png` |
| Status | Accepted — batch 7 |

Every dependent value is recomputed and painted together. Partially updated finance is the one class of realtime bug people notice instantly and never trust again.

## RT-24 — Expense changed while edit form is open

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | D — finance realtime |
| State | CONFLICT |
| Viewport | 393x852 |
| Components | CMP-66 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No auto-merge. Local input preserved; saving still uses server-confirmed stale-version protection. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-24-expense-changed-while-edit-form-is-open.png` |
| Annotated export | `screens/mobile/annotated/RT-24-expense-changed-while-edit-form-is-open-annotated.png` |
| Status | Accepted — batch 7 |

Reuses the finance stale-data treatment from board 15 rather than inventing a realtime-specific one. Money forms never auto-merge, at any scale.

## RT-25 — Settlement recorded

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | D — finance realtime |
| State | SETTLEMENT UPDATE |
| Viewport | 393x852 |
| Components | CMP-64 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-25-settlement-recorded.png` |
| Annotated export | `screens/mobile/annotated/RT-25-settlement-recorded-annotated.png` |
| Status | Accepted — batch 7 |

Four surfaces move together: suggested transfers, the balance hero, settlement history and the affected totals. One history entry, never two.

## RT-26 — Idempotent settlement realtime echo

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | D — finance realtime |
| State | DEDUPLICATED |
| Viewport | 393x852 |
| Components | CMP-64 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-26-idempotent-settlement-realtime-echo.png` |
| Annotated export | `screens/mobile/annotated/RT-26-idempotent-settlement-realtime-echo-annotated.png` |
| Status | Accepted — batch 7 |

The person who recorded the settlement also receives the realtime event describing it. Both refer to one accepted record, so the design shows one success and one history row — the echo is absorbed, not rendered.

## RT-27 — Finance update received during offline recovery

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | D — finance realtime |
| State | ATOMIC RECOVERY |
| Viewport | 393x852 |
| Components | CMP-70 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-27-finance-update-received-during-offline-recovery.png` |
| Annotated export | `screens/mobile/annotated/RT-27-finance-update-received-during-offline-recovery-annotated.png` |
| Status | Accepted — batch 7 |

While recovering, the whole finance context is re-read and swapped in one step. Cached balances beside fresh expense rows would produce a total nobody can reconcile.

## RT-28 — Historical inactive participant update

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | D — finance realtime |
| State | HISTORICAL |
| Viewport | 393x852 |
| Components | CMP-68 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-28-historical-inactive-participant-update.png` |
| Annotated export | `screens/mobile/annotated/RT-28-historical-inactive-participant-update-annotated.png` |
| Status | Accepted — batch 7 |

A realtime change touching a record attributed to someone who has left keeps that attribution intact. Presence in history is not presence in the Group, and the update does not quietly restore authority.

## RT-29 — New Group document received

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | E — document realtime |
| State | AUTHORISED UPDATE |
| Viewport | 393x852 |
| Components | CMP-65 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-29-new-group-document-received.png` |
| Annotated export | `screens/mobile/annotated/RT-29-new-group-document-received-annotated.png` |
| Status | Accepted — batch 7 |

The row appears only after current same-Group authorisation is confirmed for this reader. There is no per-document audience to describe, so the notice describes the document and its uploader and stops there.

## RT-30 — Document parsing status updated

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | E — document realtime |
| State | FIVE DISTINCT |
| Viewport | 393x852 |
| Components | CMP-65, CMP-37 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-30-document-parsing-status-updated.png` |
| Annotated export | `screens/mobile/annotated/RT-30-document-parsing-status-updated-annotated.png` |
| Status | Accepted — batch 7 |

Five states kept distinct in the live update exactly as they are in the document flow, because "processing" collapsing into one spinner is what made the single-user build unexplainable.

## RT-31 — Scan-derived Event created by another Member

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | E — document realtime |
| State | PRESENTATION UPDATE |
| Viewport | 393x852 |
| Components | CMP-65 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-31-scan-derived-event-created-by-another-member.png` |
| Annotated export | `screens/mobile/annotated/RT-31-scan-derived-event-created-by-another-member-annotated.png` |
| Status | Accepted — batch 7 |

The Event enters this person’s itinerary only if the accepted presentation rules put it there. The notice names the Event and the person, never the presentation list.

## RT-32 — Document removed while list is open

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | E — document realtime |
| State | REMOVED |
| Viewport | 393x852 |
| Components | CMP-64 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-32-document-removed-while-list-is-open.png` |
| Annotated export | `screens/mobile/annotated/RT-32-document-removed-while-list-is-open-annotated.png` |
| Status | Accepted — batch 7 |

The row goes after confirmation and the Event it produced stays, which is the separation E-15 approved. A person watching the list sees exactly the outcome the removal confirmation promised.

## RT-33 — Document viewer authorization changed

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | E — document realtime |
| State | ACCESS REVOKED |
| Viewport | 393x852 |
| Components | CMP-21, PERM-14 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-33-document-viewer-authorization-changed.png` |
| Annotated export | `screens/mobile/annotated/RT-33-document-viewer-authorization-changed-annotated.png` |
| Status | Accepted — batch 7 |

Content is torn down before the message is drawn. An unavailable-document notice floating over a still-rendered page would be a leak with a lock icon on it.

## RT-34 — Document reconciliation status changed

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | E — document realtime |
| State | RECONCILIATION |
| Viewport | 393x852 |
| Components | CMP-65, CMP-46 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-34-document-reconciliation-status-changed.png` |
| Annotated export | `screens/mobile/annotated/RT-34-document-reconciliation-status-changed-annotated.png` |
| Status | Accepted — batch 7 |

The held badge clears on the authorised row and nothing internal surfaces — no path, no bucket, no object identifier, no job name.

## RT-35 — Member joined

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | F — membership and ownership |
| State | MEMBERSHIP UPDATE |
| Viewport | 393x852 |
| Components | CMP-64, CMP-02 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-35-member-joined.png` |
| Annotated export | `screens/mobile/annotated/RT-35-member-joined-annotated.png` |
| Status | Accepted — batch 7 |

Four surfaces update from one event: the member list, the participant rail, the pending invitation row and the Group count. One message covers all four.

## RT-36 — Member removed

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | F — membership and ownership |
| State | MEMBERSHIP REMOVED |
| Viewport | 393x852 |
| Components | CMP-13, PERM-13 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-36-member-removed.png` |
| Annotated export | `screens/mobile/annotated/RT-36-member-removed-annotated.png` |
| Status | Accepted — batch 7 |

Two very different outcomes on one plate. Someone else leaving is a list update with history preserved; the current user being removed is a teardown — clear, unsubscribe, route — in that order.

## RT-37 — Role changed from Member to Owner

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | F — membership and ownership |
| State | ROLE CHANGED |
| Viewport | 393x852 |
| Components | CMP-02, PERM-18 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-37-role-changed-from-member-to-owner.png` |
| Annotated export | `screens/mobile/annotated/RT-37-role-changed-from-member-to-owner-annotated.png` |
| Status | Accepted — batch 7 |

New controls appear only after the membership refresh confirms the new role. Rendering Owner actions from a realtime message alone would put buttons on screen that the server will refuse.

## RT-38 — Role changed from Owner to Member

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | F — membership and ownership |
| State | ROLE CHANGED |
| Viewport | 393x852 |
| Components | CMP-02, PERM-18 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-38-role-changed-from-owner-to-member.png` |
| Annotated export | `screens/mobile/annotated/RT-38-role-changed-from-owner-to-member-annotated.png` |
| Status | Accepted — batch 7 |

Owner-only controls are removed rather than disabled, matching E-11. A dead privileged button is both a usability failure and a hint about what exists.

## RT-39 — Last-Owner operation changes availability

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | F — membership and ownership |
| State | PROTECTION REFRESH |
| Viewport | 393x852 |
| Components | CMP-13, GRP-12 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-39-last-owner-operation-changes-availability.png` |
| Annotated export | `screens/mobile/annotated/RT-39-last-owner-operation-changes-availability-annotated.png` |
| Status | Accepted — batch 7 |

Promotions and demotions change who is allowed to leave. The protections refresh from confirmed membership so a person is never blocked by a rule that no longer applies, or allowed past one that now does.

## RT-40 — Pending invitation revoked or accepted

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | F — membership and ownership |
| State | INVITATION UPDATE |
| Viewport | 393x852 |
| Components | CMP-64, INV-09 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-40-pending-invitation-revoked-or-accepted.png` |
| Annotated export | `screens/mobile/annotated/RT-40-pending-invitation-revoked-or-accepted-annotated.png` |
| Status | Accepted — batch 7 |

The row updates and the token never returns to the screen. A revoked or accepted invitation is a status change, not an occasion to re-display a secret.

## RT-41 — Trip name changed

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | G — configuration realtime |
| State | CONFIG UPDATE |
| Viewport | 393x852 |
| Components | CMP-48, CFG-68 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-41-trip-name-changed.png` |
| Annotated export | `screens/mobile/annotated/RT-41-trip-name-changed-annotated.png` |
| Status | Accepted — batch 7 |

The header changes after the Group record is re-read, not when the message arrives. The header is the most-trusted string in the app and it never runs ahead of a confirmed read.

## RT-42 — Dates changed

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | G — configuration realtime |
| State | CONFIG UPDATE |
| Viewport | 393x852 |
| Components | CMP-48, CFG-23 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-42-dates-changed.png` |
| Annotated export | `screens/mobile/annotated/RT-42-dates-changed-annotated.png` |
| Status | Accepted — batch 7 |

The mono date line updates and nothing else does. Events outside the new range stay exactly where they were recorded, as CFG-24 promised.

## RT-43 — Timezone changed

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | G — configuration realtime |
| State | CONFIG UPDATE |
| Viewport | 393x852 |
| Components | CMP-54, CFG-69 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-43-timezone-changed.png` |
| Annotated export | `screens/mobile/annotated/RT-43-timezone-changed-annotated.png` |
| Status | Accepted — batch 7 |

Every displayed local time re-renders in one pass so the itinerary is never half in one zone and half in another. The instants themselves are untouched, and the copy says so.

## RT-44 — Display-currency context changed

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | G — configuration realtime |
| State | CONFIG UPDATE |
| Viewport | 393x852 |
| Components | CMP-58, CFG-70 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-44-display-currency-context-changed.png` |
| Annotated export | `screens/mobile/annotated/RT-44-display-currency-context-changed-annotated.png` |
| Status | Accepted — batch 7 |

A reference row appears or disappears and no ledger figure moves. The plate restates the boundary because this is the update most likely to be misread as a money change.

## RT-45 — Group archived

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | G — configuration realtime |
| State | ARCHIVED |
| Viewport | 393x852 |
| Components | CMP-15, PERM-05 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Mutation affordances absent rather than disabled. Not-found and not-allowed stay indistinguishable. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-45-group-archived.png` |
| Annotated export | `screens/mobile/annotated/RT-45-group-archived-annotated.png` |
| Status | Accepted — batch 7 |

Archive takes effect immediately in presentation: mutation affordances are removed the moment the change is confirmed, so nobody starts an action the server is already refusing.

## RT-46 — Group restored

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | G — configuration realtime |
| State | RESTORED |
| Viewport | 393x852 |
| Components | CMP-15, GRP-17 |
| Loading / success / failure | Server-confirmed; dependent state refreshed together. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-46-group-restored.png` |
| Annotated export | `screens/mobile/annotated/RT-46-group-restored-annotated.png` |
| Status | Accepted — batch 7 |

Controls come back only after the authorised Group state is re-read. Restoring from a message alone would show write buttons against a Group that has not finished coming back.

## RT-47 — Configuration changed while settings form is open

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | G — configuration realtime |
| State | STALE CONFIGURATION |
| Viewport | 393x852 |
| Components | CMP-61, CFG-74 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No auto-merge. Local input preserved; saving still uses server-confirmed stale-version protection. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-47-configuration-changed-while-settings-form-is-open.png` |
| Annotated export | `screens/mobile/annotated/RT-47-configuration-changed-while-settings-form-is-open-annotated.png` |
| Status | Accepted — batch 7 |

The same stale-configuration notice as board 17, delivered by the realtime channel instead of a failed save. Local text is never silently replaced.

## RT-48 — Current form changed remotely

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | H — global conflict and update states |
| State | CONFLICT |
| Viewport | 393x852 |
| Components | CMP-66 |
| Loading / success / failure | States what is authoritative, whether anything partial is exposed, and whether retry exists. |
| Validation | No auto-merge. Local input preserved; saving still uses server-confirmed stale-version protection. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-48-current-form-changed-remotely.png` |
| Annotated export | `screens/mobile/annotated/RT-48-current-form-changed-remotely-annotated.png` |
| Status | Accepted — batch 7 |

The one conflict surface every form reuses — Event, todo, expense, settings. Same words, same three actions, same refusal to merge, so the pattern costs a person one lesson.

## RT-49 — Current resource no longer exists

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | H — global conflict and update states |
| State | GONE |
| Viewport | 393x852 |
| Components | CMP-21 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-49-current-resource-no-longer-exists.png` |
| Annotated export | `screens/mobile/annotated/RT-49-current-resource-no-longer-exists-annotated.png` |
| Status | Accepted — batch 7 |

One generic treatment for removed, reconciled away, or never-authorised. Not-found and not-allowed stay indistinguishable, exactly as they are everywhere else in the package.

## RT-50 — Current permission changed

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | H — global conflict and update states |
| State | FOUR |
| Viewport | 393x852 |
| Components | CMP-13, PERM-19 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-50-current-permission-changed.png` |
| Annotated export | `screens/mobile/annotated/RT-50-current-permission-changed-annotated.png` |
| Status | Accepted — batch 7 |

Four causes that feel identical to a user and must not be: a role change keeps you in the Group, a removal does not, an archive is temporary, and an expired session is about you rather than the Group.

## RT-51 — Several updates arrive together

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | H — global conflict and update states |
| State | GROUPED |
| Viewport | 393x852 |
| Components | CMP-69 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-51-several-updates-arrive-together.png` |
| Annotated export | `screens/mobile/annotated/RT-51-several-updates-arrive-together-annotated.png` |
| Status | Accepted — batch 7 |

One expense mutation fans out into a ledger row, a total, three balances and a suggested transfer. That is one change to a person, so it gets one message and one summary line.

## RT-52 — Duplicate realtime event

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | H — global conflict and update states |
| State | DEDUPLICATED |
| Viewport | 393x852 |
| Components | — |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-52-duplicate-realtime-event.png` |
| Annotated export | `screens/mobile/annotated/RT-52-duplicate-realtime-event-annotated.png` |
| Status | Accepted — batch 7 |

The same accepted record can arrive twice through retry or reconnection. Presentation is idempotent by record identity, so the second delivery changes nothing on screen at all.

## RT-53 — Out-of-order realtime events

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | H — global conflict and update states |
| State | ORDERING |
| Viewport | 393x852 |
| Components | CMP-70 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-53-out-of-order-realtime-events.png` |
| Annotated export | `screens/mobile/annotated/RT-53-out-of-order-realtime-events-annotated.png` |
| Status | Accepted — batch 7 |

A late-arriving older revision is never painted over a newer accepted state. Where ordering cannot be established, the design stops guessing and re-reads authorised data.

## RT-54 — Realtime payload cannot be reconciled

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | H — global conflict and update states |
| State | OUT OF SYNC |
| Viewport | 393x852 |
| Components | CMP-70 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-54-realtime-payload-cannot-be-reconciled.png` |
| Annotated export | `screens/mobile/annotated/RT-54-realtime-payload-cannot-be-reconciled-annotated.png` |
| Status | Accepted — batch 7 |

When an update cannot be matched to anything on screen, the honest answer is that the screen may be stale — followed by a real refresh. No codes, no payloads, no channel names.

## RT-55 — Current screen is no longer authorised

| Field | Value |
|---|---|
| Flow | Flow N — realtime, notifications and connection states |
| Group | H — global conflict and update states |
| State | CLEARED THEN ROUTED |
| Viewport | 393x852 |
| Components | CMP-13, PERM-13 |
| Loading / success / failure | Static state. |
| Validation | No form validation on this screen. |
| Permission | Group-scoped and authorised; nothing renders before the current reader is authorised. |
| Responsive | 480px capped column; centred on tablet 768 and desktop 1440 with the base background around it. No layout change between viewports and no new breakpoint. |
| Architecture reference | Realtime is presentation only. Updates are Group-scoped and authorised; nothing renders from a payload alone, and no control, row, count or value is granted by a realtime message. Backend authorization remains authoritative. |
| IR owner | IR-010 |
| Wave | W3 |
| Related IR items | IR-007, IR-011 |
| Exceptions | E-04, E-05, E-06 |
| Clean export | `screens/mobile/clean/RT-55-current-screen-is-no-longer-authorised.png` |
| Annotated export | `screens/mobile/annotated/RT-55-current-screen-is-no-longer-authorised-annotated.png` |
| Status | Accepted — batch 7 |

Clear first, route second, message third. The sequence is the contract: no inaccessible content ever sits behind a dialog waiting to be screenshotted.
