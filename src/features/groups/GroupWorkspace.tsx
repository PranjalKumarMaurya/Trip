import { type KeyboardEvent, useRef, useState } from 'react'
import { IconBack, IconCrew, IconExchange, IconMap, IconReceipt, IconScan, IconSettings, IconTodos } from '../../components/ui/icons'
import { CrewTab } from '../crew/CrewTab'
import { FxTab } from '../fx/FxTab'
import type { MyProfile } from '../profile/profileApi'
import { ProfileButton } from '../profile/ProfileButton'
import { ScanTab } from '../scan/ScanTab'
import { TripSettingsSheet } from '../settings/TripSettingsSheet'
import { SplitTab } from '../split/SplitTab'
import { TodosTab } from '../todos/TodosTab'
import { TripTab } from '../trip/TripTab'
import type { MyGroupAccess } from './myGroupAccess'
import { useGroupRoster } from './useGroupRoster'

const ALL_TABS = [
  { id: 'trip', label: 'Trip', Icon: IconMap, Component: TripTab },
  { id: 'todos', label: 'Todos', Icon: IconTodos, Component: TodosTab },
  { id: 'split', label: 'Split', Icon: IconReceipt, Component: SplitTab },
  { id: 'scan', label: 'Scan', Icon: IconScan, Component: ScanTab },
  { id: 'fx', label: 'FX', Icon: IconExchange, Component: FxTab },
  { id: 'crew', label: 'Crew', Icon: IconCrew, Component: CrewTab },
] as const

type TabId = (typeof ALL_TABS)[number]['id']

/** Domestic Trips have no currency features, so no FX tab. */
const tabsFor = (trip: MyGroupAccess) => ALL_TABS.filter((entry) => entry.id !== 'fx' || trip.isInternational)

/**
 * One Trip: a header with the way back to the Trips home, Trip settings and the
 * person's avatar, the selected tab, and the bottom tab bar.
 */
export function GroupWorkspace({ trip, onBack, onRefresh, onOpenProfile, profile, accountName }: {
  trip: MyGroupAccess
  /** Back to the Trips home. */
  onBack: () => void
  /** Re-read the Trip list in the background (role, settings, membership, archive state). */
  onRefresh: () => void
  onOpenProfile: () => void
  profile: MyProfile | null
  /** Used for the avatar initial until the profile has loaded. */
  accountName: string
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const owner = trip.role === 'owner'

  return (
    <main data-testid="group-workspace" className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <header className="app-topbar app-topbar--stacked">
        <div className="flex items-center gap-2">
          <button type="button" className="topbar-btn topbar-btn--back" onClick={onBack}>
            <IconBack size={18} />Trips
          </button>
          <span className="flex-1" />
          <button type="button" className="round-btn" aria-label={owner ? 'Trip settings' : 'Trip details'} aria-haspopup="dialog"
            aria-expanded={settingsOpen} onClick={() => setSettingsOpen(true)}>
            <IconSettings size={20} />
          </button>
          <ProfileButton profile={profile} fallbackName={accountName} onOpen={onOpenProfile} />
        </div>
        <div className="min-w-0">
          <h1 className="serif-display line-clamp-2" style={{ color: 'var(--text-primary)', fontSize: 26, lineHeight: 1.15 }}>{trip.tripName}</h1>
          <p className="mt-0.5 truncate" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{trip.destination} · {owner ? 'Owner' : 'Member'}</p>
        </div>
      </header>

      {/* Keyed by Trip so opening another Trip remounts every tab with fresh state. */}
      <TripSections key={trip.groupId} trip={trip} onTripsChanged={onRefresh} />

      {settingsOpen && <TripSettingsSheet trip={trip} onClose={() => setSettingsOpen(false)} onSaved={onRefresh} />}
    </main>
  )
}

function TripSections({ trip, onTripsChanged }: { trip: MyGroupAccess; onTripsChanged: () => void }) {
  const [tab, setTab] = useState<TabId>('trip')
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({})
  const { roster, reload } = useGroupRoster(trip.groupId)
  const TABS = tabsFor(trip)
  // A tab that disappears (e.g. FX after a Trip becomes domestic) falls back to the first.
  const current = TABS.find((entry) => entry.id === tab) ?? TABS[0]

  const choose = (id: TabId, focus = false) => {
    setTab(id)
    if (focus) tabRefs.current[id]?.focus()
    // A new section starts at its top, like a native tab bar.
    window.scrollTo({ top: 0 })
  }

  // Arrow keys move between tabs (WAI-ARIA tabs pattern, automatic activation).
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((entry) => entry.id === current.id)
    const next = event.key === 'ArrowRight' ? (index + 1) % TABS.length
      : event.key === 'ArrowLeft' ? (index - 1 + TABS.length) % TABS.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : -1
    if (next < 0) return
    event.preventDefault()
    choose(TABS[next].id, true)
  }

  return (
    <>
      <div role="tabpanel" id="trip-tab-panel" aria-labelledby={`trip-tab-${current.id}`} className="app-content flex-1">
        <current.Component trip={trip} roster={roster} reloadRoster={reload} onTripsChanged={onTripsChanged} />
      </div>
      <div className="tab-bar">
        <div role="tablist" aria-label="Trip sections" className="tab-bar__inner" onKeyDown={onKeyDown}>
          {TABS.map((entry) => {
            const active = entry.id === current.id
            return (
              <button key={entry.id} ref={(node) => { tabRefs.current[entry.id] = node }} type="button" role="tab"
                id={`trip-tab-${entry.id}`} aria-selected={active} aria-controls="trip-tab-panel" tabIndex={active ? 0 : -1}
                onClick={() => choose(entry.id)} className={`nav-tab${active ? ' active' : ''}`}>
                <entry.Icon />
                <span>{entry.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
