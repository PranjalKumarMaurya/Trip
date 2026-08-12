# Interaction and states

Consolidated interaction contracts across all eight batches. Boards 21 and 22 in the master carry the same content as review plates.

## Authentication continuation
Pre-authentication screens carry a neutral "Trip" label and no Group context until the session is safe to inspect. After sign-in the user returns to where they were, not the top of the app. Session expiry is about the person, not the Group, and is never presented as a permission denial (PERM-19, RT-50, MIG-84).

## Group switching
Six ordered steps: unsubscribe the old Group's live updates, clear the old Group's content, resolve current membership of the new Group, subscribe, fetch authorised data, render. Steps two and five are what make a mixed-Group frame impossible rather than unlikely. A switch failure leaves the previous Group selected and internally consistent — name, dates, timezone and accounting currency all still its own (GRP-03, GRP-04, CFG-72, CFG-73, RT-10, MIG-85).

## Invitation acceptance
Group invitation links expire after 7 days and are single-use. Possession grants nothing until acceptance. Tokens are opaque and are never redisplayed after issue, including when an invitation is revoked or accepted (INV-04, INV-09, RT-40, MIG-82, MIG-83).

## ONB-06 bootstrap and Invitation lifecycle staging
`DCC-IR003-FREEZE-001` accepts two lifecycle states under the one existing
`ONB-06` identity. State A, **Group created, Invitation not issued**, follows
only a committed, server-confirmed IR-003/TOP-001 result. It shows the
confirmed Group and a noninteractive not-issued Invitation area; it has no
Invitation link, code, secret, recipient, copy/share control, usable-looking
placeholder, join claim, live Group shell, or onward IR-005/IR-006/IR-010/IR-011
action.
State B, **Group created, Invitation issued**, follows only a separately
committed IR-005/TOP-002 Invitation and retains the real Invitation/link,
copy/share, confirmation, and Invitation-lifecycle behaviour. The existing
ONB-06 PNG pair depicts State B, not State A. This staging does not authorise
either operation or satisfy GATE-031.

## Ownership changes
Promotion and demotion take effect in the UI only after a confirmed membership refresh. Owner-only controls are removed rather than disabled. Last-Owner protection refreshes from confirmed membership so nobody is blocked by a rule that no longer applies (MBR-*, GRP-12, RT-37, RT-38, RT-39).

## Participant claiming
Claiming is deliberate and evidenced. There is no automatic linking, no Owner review queue, no manual reassignment and no adjudication of identity. A claim that cannot be evidenced stops safely and states that nothing changed (CLM-*, PERM-16, MIG-58 to MIG-66).

## Known permission versus stale permission
A known denial explains itself. A stale permission — discovered mid-action — corrects the specific stale item, keeps everything else the person typed or chose, and never submits against a list the server has already changed (PERM-17, PERM-18, DOC-18, CFG-62, RT-48).

## Finance server confirmation
No finance value moves before the accepted server record exists. A mutation fans out to the ledger row, Group totals, balances and suggested transfers; all of them repaint together or none do. Partially updated money is never rendered (FIN-*, RT-22 to RT-27).

## Document upload, parse, review lifecycle
Thirteen distinct states from local file selected through to reconciliation. Parsing is a tracked foreground operation with no background-continuation promise. Document access is current same-Group authorisation — there is no per-document audience — and the scan participant selection is Event presentation only (DOC-*, RT-29 to RT-34).

## Group configuration
Only a current authorised Owner may request a change. A Member reads the same values with mutation affordances absent. Every save is server-confirmed and none rewrites identity, membership, recorded instants, Original values, FX evidence or settled history. The accounting currency locks once accounting history exists (CFG-*, RT-41 to RT-47).

## Realtime updates
Four levels, lowest honest level applied: silent update, temporary contextual feedback, persistent inline notice, conflict requiring action. Group-scoped subscriptions, authorisation before render, deduplication by accepted record identity, idempotent handling of the local operation's own echo, complete dependent-state refresh, and refresh rather than guess when ordering cannot be trusted (RT-*).

## Stale forms
One conflict surface reused everywhere: Event, todo, expense, settings. Local input preserved, nothing merged, nothing overwritten, three actions — reload the current version, keep editing, cancel. Saving still uses server-confirmed stale-version protection (CMP-66, RT-13, RT-20, RT-24, RT-47, RT-48).

## Offline and reconnecting
Offline stops reads and writes; a realtime-only failure stops neither, and the two are different screens because the available actions differ. There is no offline mutation queue in the current accepted scope, so nothing promises to send later. An empty screen caused by no connection is never described as an empty Group (RT-05 to RT-09, CFG-65, CFG-66).

## Migration and recovery
Banners rather than modals. A cold start during maintenance routes to the migration state, never a generic error. No value is ever guessed. Six data-change outcomes are kept mutually exclusive. A running rollback is reported as running. Partial security activation and unproven cross-Group isolation block release (MIG-*).

## Modal, sheet and page behaviour
Sheets cap at 480px over a dark blurred backdrop and never exceed the shell. Permission pages replace content rather than overlaying it, and the tab bar is hidden when no Group resolves. Inaccessible content is cleared before any access notice is drawn — never left behind an overlay (E-10, CMP-13, CMP-21, RT-33, RT-55).

## Browser Back
Back returns to the prior authorised screen. Configuration is reached through the Group header menu, so Back from it returns to the Group screen that opened it. An unavailable Group routes to safe Group selection rather than a dead end.

## Focus entry and return
Focus enters the first editable field on open and returns to the control that launched an editor on close or cancel. Escape closes and returns focus without saving. Background realtime updates never move focus, never scroll and never reorder under a reading finger.

## Unsaved changes
The accepted confirmation-sheet geometry. Discard carries the destructive tint because it loses work; leaving does not. Where a server-owned save is unavailable — offline, maintenance, archived — typed text is preserved locally and offered back rather than silently dropped (CFG-67, MIG-06).

## Destructive confirmations
Every destructive action is confirmed with its impact enumerated, not with "are you sure?". Cancel is always the safe default and is disabled only while a server-confirmed write is in flight (E-02).

## Reduced motion
Every animated state has a specified static equivalent. See `design-system.md` and `accessibility-requirements.md`.

## Announcements
Loading, success and error states announce politely. Assertive announcements are reserved for changes that stop the person acting. Every essential outcome also exists in durable screen state, never only in a toast.
