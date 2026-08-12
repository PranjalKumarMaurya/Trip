# Accessibility Verification Plan

R-02 remains **Specified; implementation verification required**. Static design
acceptance and locked exports do not prove a running build. Each group below
has a primary implementation owner; IR-021 only rolls up results and cannot
close a missing owning-packet check.

| R-02 group | Primary owner | Affected Screen / Component families | Automated evidence where possible | Manual/browser/device evidence | Wave exit and release rule |
|---|---|---|---|---|---|
| R02-01 colour contrast | IR-004, IR-011–015 | AUTH, SHL, ONB, GRP, FIN, DOC, CFG, PERM; CMP-01/02/04/07/08 | Selected contrast analyser after IR-001 capability review. | Measured values for normal, focus, error, disabled, and status states. | Applicable W2/W4 exit; unresolved applicable defect blocks W5/W7 consumption. |
| R02-02 keyboard traversal and visible focus | IR-004, IR-011–015 | AUTH, SHL, GRP, FIN, DOC, CFG; CMP-01/03/04/06/07/08 | Selected browser keyboard assertions. | Tab/shift-tab order, skip/focus visibility, icon control accessible names. | Applicable W2/W4 exit; blocks the affected flow’s acceptance. |
| R02-03 focus entry, trap, and restoration | IR-004, IR-012–015 | AUTH, DOC, FIN, CFG; CMP-06/09 | Selected browser focus assertions. | Open, cancel, confirm, validation failure, destructive dialog, and restoration record. | Applicable W4 exit; blocks modal/sheet acceptance. |
| R02-04 connected validation and errors | IR-004, IR-012–015 | AUTH, ONB, INV, FIN, DOC, CFG; CMP-07/08/09 | Field/error relationship assertions where selected. | Label, description, inline/error summary, focus-to-first-error, and server-error announcement. | Applicable W2/W4 exit; blocks form acceptance. |
| R02-05 touch-target and non-colour status | IR-011–015 | SHL, GRP, FIN, DOC, CFG, RT; CMP-01/02/03/04/05/08 | Geometry checks if the selected runner supports them. | 44x44 target measurements and status text/glyph verification at required viewport/device set. | W4 exit; blocks primary touch flow acceptance. |
| R02-06 reduced motion | IR-004, IR-010–015 | AUTH, SHL, FIN, DOC, CFG, RT, MIG; CMP-06/10/12 | Media-query assertion after browser capability selection. | `prefers-reduced-motion` check for sheets, skeletons, alerts, realtime, loading, and migration/recovery states. | Applicable W3/W4/W6 exit; unresolved issue blocks release use. |
| R02-07 loading/success/error announcements | IR-004, IR-012–015 | AUTH, ONB, FIN, DOC, CFG; CMP-09/10/11/12 | DOM role/live-region assertions where selected. | Screen-reader transcript for loading, success, generic failure, retry, and read-only state. | Applicable W2/W4 exit; blocks status-bearing flow acceptance. |
| R02-08 realtime announcements | IR-010, IR-012, IR-014 | RT, FIN, Todo/event states; CMP-12 | Selected live-region assertions. | Screen-reader check for polite updates, no focus theft, removal/archive disconnect, reconnect, and stale-event suppression. | W3/W4 exit; IR-021 rollup; release-blocking for authorized delivery. |
| R02-09 safe-area and responsive shell | IR-011–015 | SHL, FIN, DOC, CFG; CMP-03/06 | Viewport assertions after browser capability selection. | Mobile safe-area, 480px cap, sheet interior scrolling, tablet/desktop centred shell, and keyboard overlap record. | W4 exit; blocks affected mobile flow acceptance. |
| R02-10 native chooser boundaries | IR-013 | DOC scan/upload states; CMP-08/09 | Browser file-input assertions where possible. | Device/browser chooser, cancel/error return, permission denial, and no hidden file-content announcement record. | W4 exit; blocks document ingest acceptance. |

The Verified IR-001 capability includes the repository-pinned Playwright
browser harness. The browser/device matrix, assistive-technology versions, and
packet-specific automated checks remain to be selected and recorded by their
owning packets. R-02 is never marked closed by this Draft review.
