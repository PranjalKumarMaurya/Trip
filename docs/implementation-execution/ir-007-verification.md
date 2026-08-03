# IR-007 Independent Verification Record

## Decision

- Decision: **VERIFIED**.
- Evidence run: `ir007-1785780852521-160759ec-cd35-4143-ad82-512d22d7094d`.
- Migration: `supabase/migrations/009_ir007_base_rls_ownership.sql`.
- Migration SHA-256:
  `b4be413120833b6be6aa282bd5a02d5c3dcdf9c25b50e9e0e388921516a45873`.
- Generated database types SHA-256:
  `2134e239b47ef04eeafcfa3165082b4b590895b6fde4a192dc2ba7201842976b`.

The accepted independent verification confirmed that DBM-006 matches its
authorised contract; all three private RLS helpers are safe and least-
privileged; both public projections match their approved signatures and
disclosure limits; and exactly four authorised browser policies exist. All 12
scoped tables have forced RLS, all 14 legacy permissive policies are absent,
and legacy product tables fail closed. Storage and Realtime remain untouched.

The verifier passed 40 executable security cases and 52 assertions. The 10
future-target security cases remain deferred and owned by their future target
packets. Empty-target rollback and clean reapplication passed; generated types
are deterministic; every retained manifest checksum validated; secret safety
and exact cleanup passed; and all performance limits passed. No blocking,
correction, change-control, or non-blocking finding remains.

## Closure

IR-007 and DBM-006 are **Verified**. No correction packet is required and no
IR-007 implementation defect remains. The accepted verification evidence is
final. IR-007 must not be reopened by later-packet requirements; only a
reproducible defect directly violating its frozen contract may trigger
correction or change control.

This verification does not absorb the 10 deferred future-target security cases
or create criteria beyond the frozen IR-007 contract. Those cases remain owned
by their future target packets.

## GATE-013 evaluation

GATE-013 remains **Not satisfied** under its existing frozen contract:

| Frozen requirement | Result |
|---|---|
| Auth actor/session/privacy evidence (IR-004) | Passed and independently verified. |
| Deny-by-default RLS and two-Group evidence (IR-007) | Passed and independently verified. |
| Service-role boundary and trusted-operation rollback evidence (IR-008) | Absent; IR-008 remains unauthorised. |

W2 remains **In progress**. IR-008 is the exact next packet to authorise.
IR-003 remains unauthorised; Storage remains IR-009; and Realtime, product
conversion, deployment, and cutover remain unauthorised.

This record creates no implementation, database-execution, deployment, or
cutover authority.
