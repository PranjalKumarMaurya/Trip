import { type KeyboardEvent, useRef, useState } from 'react'
import { IconCheck, IconCrew, IconExchange, IconLayers, IconMap, IconPlus, IconReceipt, IconRefresh, IconScan, IconSignOut, IconTodos, IconUser } from '../../components/ui/icons'
import { NeonBtn } from '../../components/ui/NeonBtn'
import { Sheet } from '../../components/ui/Sheet'
import { ArchivedTrips } from '../crew/ArchivedTrips'
import { CrewTab } from '../crew/CrewTab'
import { FxTab } from '../fx/FxTab'
import { ScanTab } from '../scan/ScanTab'
import { SplitTab } from '../split/SplitTab'
import { TodosTab } from '../todos/TodosTab'
import { TripTab } from '../trip/TripTab'
import type { MyGroupAccess } from './myGroupAccess'
import { useGroupRoster } from './useGroupRoster'

const TABS = [
  { id: 'trip', label: 'Trip', Icon: IconMap, Component: TripTab },
  { id: 'todos', label: 'Todos', Icon: IconTodos, Component: TodosTab },
  { id: 'split', label: 'Split', Icon: IconReceipt, Component: SplitTab },
  { id: 'scan', label: 'Scan', Icon: IconScan, Component: ScanTab },
  { id: 'fx', label: 'FX', Icon: IconExchange, Component: FxTab },
  { id: 'crew', label: 'Crew', Icon: IconCrew, Component: CrewTab },
] as const

type TabId = (typeof TABS)[number]['id']

const roleLabel = (group: MyGroupAccess) => group.role === 'owner' ? 'Owner' : 'Member'

export function GroupWorkspace({ groups, selectedGroupId, onSelect, onRefresh, onCreateAnother, onSignOut, signOutError, accountName, accountEmail }: {
  groups: MyGroupAccess[]
  selectedGroupId: string
  onSelect: (groupId: string) => void
  /** Re-read the Trip list in the background; `preferGroupId` is selected if present. */
  onRefresh: (preferGroupId?: string) => void
  onCreateAnother: () => void
  onSignOut: () => void
  signOutError: string | null
  /** Shown in the account menu. */
  accountName?: string
  accountEmail?: string
}) {
  const [sheet, setSheet] = useState<'trips' | 'account' | null>(null)
  const selected = groups.find((group) => group.groupId === selectedGroupId)
  if (!selected) return null

  return (
    <main data-testid="group-workspace" className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <header className="app-topbar">
        <div className="min-w-0 flex-1">
          <h1 className="serif-display line-clamp-2" style={{ color: 'var(--text-primary)', fontSize: 24, lineHeight: 1.15 }}>{selected.tripName}</h1>
          <p className="mt-0.5 truncate" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{selected.destination} · {selected.role === 'owner' ? 'Owner' : 'Member'}</p>
        </div>
        <button type="button" className="topbar-btn" aria-haspopup="dialog" aria-expanded={sheet === 'trips'} onClick={() => setSheet('trips')}>
          <IconLayers size={18} />Trips
          {groups.length > 1 && <span className="topbar-btn__count" aria-hidden="true">{groups.length}</span>}
        </button>
        <button type="button" className="topbar-btn topbar-btn--icon" aria-label="Account" aria-haspopup="dialog" aria-expanded={sheet === 'account'} onClick={() => setSheet('account')}>
          <IconUser size={20} />
        </button>
      </header>
      {signOutError && <p role="alert" className="notice notice--error mx-5 mt-4">{signOutError}</p>}

      {/* Keyed by Trip so switching Trips remounts every tab with fresh state. */}
      <TripSections key={selected.groupId} trip={selected} onTripsChanged={() => onRefresh()} />

      {sheet === 'trips' && <Sheet title="Your Trips" testId="trips-sheet" onClose={() => setSheet(null)}>
        <nav aria-label="Choose a Trip">
          <ul className="flex flex-col gap-2">
            {groups.map((group) => {
              const current = group.groupId === selected.groupId
              return (
                <li key={group.groupId}>
                  <button type="button" className="list-option" aria-current={current ? 'true' : undefined} aria-label={group.tripName}
                    aria-describedby={`trip-option-${group.groupId}`} onClick={() => { setSheet(null); onSelect(group.groupId) }}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate" style={{ fontSize: 15, fontWeight: 500 }}>{group.tripName}</span>
                      <span id={`trip-option-${group.groupId}`} className="block truncate" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        {group.destination} · {roleLabel(group)}{current ? ' · Open now' : ''}
                      </span>
                    </span>
                    {current && <span style={{ color: 'var(--accent)' }}><IconCheck size={20} /></span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
        <NeonBtn type="button" variant="outline" size="lg" className="mt-4 w-full" onClick={() => { setSheet(null); onCreateAnother() }}>
          <IconPlus size={18} />Create another Trip
        </NeonBtn>
        <ArchivedTrips className="mt-6" refreshKey={groups.map((group) => `${group.groupId}:${group.role}`).join(',')}
          onRestored={(groupId) => { setSheet(null); onRefresh(groupId) }} />
      </Sheet>}

      {sheet === 'account' && <Sheet title="Account" testId="account-sheet" onClose={() => setSheet(null)}>
        {(accountName || accountEmail) && <div className="mb-5">
          {accountName && <p style={{ fontSize: 15, fontWeight: 500 }}>{accountName}</p>}
          {accountEmail && <p className="truncate" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{accountEmail}</p>}
        </div>}
        <div className="flex flex-col gap-3">
          <NeonBtn type="button" variant="ghost" size="lg" className="w-full" onClick={() => { setSheet(null); onRefresh() }}>
            <IconRefresh size={18} />Refresh Trips
          </NeonBtn>
          <NeonBtn type="button" variant="outline" size="lg" className="w-full" onClick={() => { setSheet(null); onSignOut() }}>
            <IconSignOut size={18} />Sign out
          </NeonBtn>
        </div>
      </Sheet>}
    </main>
  )
}

function TripSections({ trip, onTripsChanged }: { trip: MyGroupAccess; onTripsChanged: () => void }) {
  const [tab, setTab] = useState<TabId>('trip')
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({})
  const { roster, reload } = useGroupRoster(trip.groupId)
  const current = TABS.find((entry) => entry.id === tab) ?? TABS[0]

  const choose = (id: TabId, focus = false) => {
    setTab(id)
    if (focus) tabRefs.current[id]?.focus()
    // A new section starts at its top, like a native tab bar.
    window.scrollTo({ top: 0 })
  }

  // Arrow keys move between tabs (WAI-ARIA tabs pattern, automatic activation).
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((entry) => entry.id === tab)
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
            const active = entry.id === tab
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
