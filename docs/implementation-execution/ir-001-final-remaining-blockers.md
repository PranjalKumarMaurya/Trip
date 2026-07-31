# IR-001 final consolidated remaining blockers

## Scope

This is a correction-status record, not an IR-001 verification decision.
IR-001 remains **In progress**; GATE-007 through GATE-010 remain unchanged;
W1 exit remains blocked; and IR-002 remains unauthorised.

## SEC-IR001-001 — local credential exposure incident

- Status: **External owner action required**.
- Source: an over-broad process inspection exposed unrelated local Supabase
  development credential material in terminal output.
- Containment: repository, retained-artifact, Git-history, and known temporary
  IR-001 path scans found no retained credential. Verified temporary review
  material was removed.
- Invalidation: cannot be claimed from the IR-001 boundary because the other
  local project's working directory and owner association are not safely
  established. Its owner must recreate or rotate its local Supabase credentials.
- Prevention: future review diagnostics are restricted to safe, exact outputs.
- Affected gates: GATE-010 until explicit owner invalidation is recorded.

## F-IR001-VER-007 — stale raw error-context dependency

- Status: **Resolved locally and in hosted CI**.
- Root cause: the failure driver required `.last-run.json` and
  `error-context.md`, although both are deliberately excluded from retained
  evidence and are not stable across supported local/hosted Playwright output.
- Correction: the child now creates one explicit temporary, privacy-checked
  screenshot before the intended assertion failure. The driver requires only
  expected child exit, one safe screenshot, a validated safe summary, exact
  retained allow-list, and raw-diagnostic removal.
- Validation: 25 unit tests, local browser normal/failure/deterministic
  manifest, and hosted browser job in run `30627419186` passed.

## F-IR001-VER-008 — unclassified participant content in retained screenshot

- Status: **Resolved locally and in hosted CI**.
- Root cause: the automatic failure screenshot captured the current UI before
  any evidence-specific privacy transformation.
- Correction: the failure test replaces all visible text nodes in the page
  context with approved `Participant A` through `Participant E` and
  `Synthetic test content` placeholders before its explicit screenshot. It
  rejects unapproved visible text before capture.
- Validation: local and hosted summaries require
  `privacyTransformApplied: true` and classification
  `synthetic-redacted-browser-evidence`; visual inspection found useful UI
  context, approved placeholders only, and no original participant labels or
  descriptions.

## Re-review boundary

After the external owner records credential invalidation for SEC-IR001-001,
conduct the targeted independent IR-001 closure review defined by the current
authorisation. It must recheck this incident, F-IR001-VER-007, F-IR001-VER-008,
final hygiene, and then make the gate decisions without reopening resolved
implementation investigations.
