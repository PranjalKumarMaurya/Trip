# Bali Bachelor App — Implementation Handoff

> **Token efficiency rule:** All existing code signatures are inlined below. Do NOT read any existing file unless explicitly told to. Implement the 4 files listed under "Build Now", then deploy.

---

## Repo layout (read-only — do not modify these)

```
bali-bachelor/
  src/
    constants/
      users.ts          ← USERS, USER_MAP, USER_NAMES, User interface
      eventTypes.ts     ← EVENT_TYPES, EVENT_TYPE_MAP, EventType interface
      seedData.ts       ← SEED_EVENTS: SeedEvent[] (10 events, all Jun 2025)
    lib/
      supabase.ts       ← export const supabase = createClient(URL, KEY)
      timezone.ts       ← toWITA, fmtIST, fmtWITA, fmtDate, getCountdown
      currency.ts       ← toIDR, formatIDR, formatIDRFull, formatINR
    hooks/
      useCurrentUser.ts ← useCurrentUser() → { user: User|null, setUser, clearUser }
    components/ui/
      NeonText.tsx      ← <NeonText color pulse?>
      NeonBorder.tsx    ← <NeonBorder color> — adds .corner-bracket .neon-card CSS classes
      VIPBadge.tsx      ← <VIPBadge color?>
      NeonBtn.tsx       ← <NeonBtn color? variant='solid'|'outline'>
      NeonInput.tsx     ← <NeonInput color? ...inputProps>
      UserChips.tsx     ← <UserChips activeUser onSelect>
      Scanlines.tsx     ← <Scanlines /> — fixed overlay
    tabs/
      TripTab.tsx       ← STUB — replace this
      ScanTab/SplitTab/FXTab/AITab.tsx ← stubs, leave alone
    styles/
      global.css        ← CSS vars, keyframes, .corner-bracket, .neon-card, .nav-tab
```

### Key exports to use (copy these — no need to read the files)

```typescript
// constants/users.ts
interface User { name: string; emoji: string; color: string; vibe: string }
const USERS: User[]          // [{name:'Partha',emoji:'🦁',color:'#FF2D78',vibe:'The Alpha'}, ...]
const USER_MAP: Record<string, User>

// constants/eventTypes.ts
interface EventType { type: string; icon: string; color: string; label: string }
const EVENT_TYPE_MAP: Record<string, EventType>
// types: flight✈️#BF5FFF  hotel🏨#FF2D78  ferry⛴️#FFD600  activity🎯#00FFD1  food🍽️#FF6B00

// constants/seedData.ts
interface SeedEvent {
  type: string; title: string; date_ist: string; end_date_ist?: string
  location: string; location_to?: string; notes?: string
  for_users: string[] | null   // null = everyone
  dep_code?: string; arr_code?: string; flight_no?: string
  airline?: string; terminal?: string; color: string
  expense?: { amount: number; currency: string; paid_by: string; split_among: string[] | null }
}
const SEED_EVENTS: SeedEvent[]  // 10 events — 3 persona flights + hotel + activities + return flight

// lib/timezone.ts
function fmtIST(d: Date): string        // "02:30 AM"
function fmtWITA(d: Date): string       // "05:00 AM"
function fmtDate(d: Date): string       // "Sat, Jun 14"
function getCountdown(d: Date): { days: number; hours: number; minutes: number; seconds: number; totalMs: number }

// lib/currency.ts
function formatIDR(n: number): string   // "Rp 18.5M" / "Rp 900k"
function formatINR(n: number): string   // "₹98,066"

// CSS classes available (global.css — use freely)
// .corner-bracket  → ::before/::after 12px corner lines in currentColor
// .neon-card       → dark bg + subtle white border + hover brighten
// .animate-flicker / .animate-float / .animate-slide-up / .animate-shake
// .font-display / .font-ui / .font-mono
// CSS vars: --neon-pink --neon-gold --neon-cyan --neon-purple --neon-orange
//           --font-display --font-ui --font-mono  --bg-card --active-color
```

---

## Environment variables

```bash
# bali-bachelor/.env  (already in .gitignore)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

If these aren't set, the app must still render using SEED_EVENTS (no crash, no error screen).

---

## Database schema (Supabase — already migrated)

```sql
-- events table (key columns only)
id UUID PRIMARY KEY, type TEXT, title TEXT,
date_ist TIMESTAMPTZ, end_date_ist TIMESTAMPTZ,
location TEXT, location_to TEXT, notes TEXT,
for_users TEXT[],   -- NULL = visible to all 5 users
dep_code TEXT, arr_code TEXT, flight_no TEXT,
airline TEXT, terminal TEXT, color TEXT,
-- RLS: USING(true) — all authenticated users can read/write
```

---

## Build Now — 4 files in this order

### 1. `src/hooks/useEvents.ts` (CREATE)

```typescript
// What to export:
export interface DBEvent extends SeedEvent { id: string }
export function userSeesEvent(event: DBEvent, userName: string): boolean
  // → true if for_users is null/empty OR userName in for_users
export function useEvents(): { events: DBEvent[]; loading: boolean }
  // Fetches SELECT * FROM events ORDER BY date_ist ASC
  // Subscribes: supabase.channel('events').on('postgres_changes',{event:'*',schema:'public',table:'events'}, refetch)
  // Fallback: if fetch throws OR result is empty → use SEED_EVENTS with id: `seed-${i}`
  // Cleanup: unsubscribe on unmount
```

### 2. `src/components/EventCard.tsx` (CREATE)

Props: `{ event: DBEvent; status: 'past'|'live'|'next'|'upcoming'; userColor: string }`

Structure:
```
<div class="corner-bracket neon-card" style={{color: event.color, opacity: status==='past' ? 0.4 : 1}}>
  [Left: 44×44 node circle]
    - border color = event.color when live|next, rgba(255,255,255,0.1) otherwise
    - EVENT_TYPE_MAP[event.type].icon centered
    - LIVE: pulsing cyan dot top-right  |  NEXT: gold dot top-right
  [Right: card content]
    - Title + badge (VIPBadge gold "NEXT" OR VIPBadge cyan "● LIVE")
    - fmtDate(date_ist)  +  fmtIST "IST"  +  fmtWITA "WITA"  — always both timezones
    - location [→ location_to if exists]
    - Crew chips: if for_users null → all USERS emojis; else for_users.map(n => USER_MAP[n].emoji)
    - if event.expense: "{USER_MAP[paid_by].emoji} {formatIDR(amount)}" in payer's color
  [Expand on click: event.notes in font-mono text-xs text-white/50]
</div>
```

### 3. `src/components/CountdownClock.tsx` (CREATE)

Props: `{ event: DBEvent | null; userColor: string }`

States:
- `event === null` → centered card: VIPBadge + "NO FLIGHT FOUND"
- `event.type === 'flight'` but `countdown.totalMs <= 0` → "DEPARTED" card (show actual IST + WITA times)
- Otherwise → full clock (below)

Full clock layout:
```
[VIPBadge gold] "⚡ COUNTDOWN TO LIFTOFF"
[dep_code] ────────✈──────── [arr_code]   ← Black Ops One 28px, textShadow glow
[SVG 184×184]
  Background circle: cx=92 cy=92 r=80 fill=none stroke=rgba(255,255,255,0.08) strokeWidth=8
  Arc:  same cx/cy/r, stroke=userColor, strokeWidth=8, strokeLinecap="square"
        strokeDasharray="502.65"   (= 2π×80)
        strokeDashoffset= 502.65 × (1 - fraction)
        transform="rotate(-90 92 92)"
        style={{ filter: `drop-shadow(0 0 8px ${userColor})` }}
  Fraction: Math.min(1, Math.max(0, (86400000 - countdown.totalMs) / 86400000))
  Tick marks: 12 lines, angle=(i/12)*2π - π/2, x1=92+cos(a)*74, y1=92+sin(a)*74, x2/y2 at r=68
  Center text:
    "{days}d"         ← font-display 18px
    "{HH}:{MM}"       ← font-display 34px userColor textShadow
    "{SS}"            ← font-mono 20px userColor
  setInterval(1000) in useEffect — update countdown state, clear on unmount
[Two side-by-side cards]
  IST: fmtIST(date_ist)  label "IST"
  WITA: fmtWITA(date_ist)  label "WITA"
[Info card] airline + flight_no · terminal · notes  ← font-mono text-xs
```

### 4. `src/tabs/TripTab.tsx` (REPLACE STUB)

Props: `{ user: User }` — already passed from App.tsx

```typescript
// Logic
const { events, loading } = useEvents()
const visible = events.filter(e => userSeesEvent(e, user.name))
const now = Date.now()

// Status per event
const nextId = visible.find(e => new Date(e.date_ist).getTime() > now)?.id
function statusOf(e: DBEvent): 'past'|'live'|'next'|'upcoming' {
  const start = new Date(e.date_ist).getTime()
  const end = e.end_date_ist ? new Date(e.end_date_ist).getTime() : start
  if (end < now) return 'past'
  if (start <= now && now <= end) return 'live'
  if (e.id === nextId) return 'next'
  return 'upcoming'
}

// User's next flight for countdown
const nextFlight = visible.find(
  e => e.type === 'flight' && new Date(e.date_ist).getTime() > now
) ?? null

// showClock: boolean state, default false
```

Layout:
```
[Countdown toggle section]
  showClock=false → compact card (flight title + IST + WITA + click to expand)
  showClock=true  → <CountdownClock event={nextFlight} userColor={user.color} />
                    + small "↑ COLLAPSE" button

[VIPBadge centered gold] "WITA = IST + 2:30 HRS"

[Timeline — position:relative]
  Left border line: absolute, x=22, 2px solid rgba(255,255,255,0.06), full height
  loading=true → 3 skeleton cards (bg-white/5 animate-pulse rounded h-20)
  visible.map(e => (
    <div class="flex gap-3 px-4 py-2 animate-slide-up">
      [node 44×44 circle] ← event icon, border event.color when live|next
      <EventCard event={e} status={statusOf(e)} userColor={user.color} />
    </div>
  ))

[NeonBtn variant="outline" color="rgba(255,255,255,0.2)" class="mx-4 my-4 w-full dashed"]
  + ADD EVENT
  (no onClick — wired in SCAN tab later)
```

---

## Dashed border trick for "+ ADD EVENT"

Add to the NeonBtn or wrap it:
```tsx
style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.3)' }}
```

---

## Verify before deploying

```bash
cd bali-bachelor
npm run build   # must exit 0, zero TS errors
```

Manual checks:
- Select **Partha** → TRIP tab → 8 events visible (Suryansh BOM + Bittu BLR flights hidden)
- Select **Suryansh** → his AI-381 flight visible + all group events (Partha/Bittu solo flights hidden)
- Tap any event card → notes expand inline; tap again → collapse
- Countdown toggle button switches between compact card and full SVG clock
- With `VITE_SUPABASE_URL` unset → SEED_EVENTS render, no crash

---

## Deploy (free — zero cost)

### Supabase (backend)
1. Create project at [supabase.com](https://supabase.com) — free tier (500MB, plenty)
2. Run `bali-bachelor/supabase/migrations/001_initial.sql` in the SQL editor
3. Run `bali-bachelor/supabase/seed.sql` to populate users + events
4. Copy **Project URL** + **anon public key** from Settings → API

### Vercel (frontend)
1. Push repo to GitHub
2. Import at [vercel.com](https://vercel.com) → New Project → select repo → **Root Directory: `bali-bachelor`**
3. Add env vars: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
4. Deploy → get `*.vercel.app` URL — share with the crew

No domain purchase needed. Free hobby tier handles 5 users easily.

---

## What comes after (next prompts — do not implement now)

| # | Tab | Key work |
|---|-----|----------|
| 3 | SPLIT | `splitting.ts` lib, `useExpenses`/`useBalances`/`useSettlements` hooks, balance hero card, settle-up UI |
| 4 | SCAN | Supabase Edge Function `parse-document` (Claude API), upload UI, EventEditor modal, manual add |
| 5 | FX | IDR↔INR converter, quick-convert buttons, live rate fetch from exchangerate-api.com, price guide table |
| 6 | AI | Edge Function `ai-chat` (Claude proxy), chat bubbles UI, quick-prompt chips |

Full specs for each in `bali-bachelor-bmad.md` §4–§8 and §10.2–10.5 at the project root.
