import { useState } from 'react'
import { CrewTab } from '../crew/CrewTab'
import { FxTab } from '../fx/FxTab'
import { ScanTab } from '../scan/ScanTab'
import { SplitTab } from '../split/SplitTab'
import { TodosTab } from '../todos/TodosTab'
import { TripTab } from '../trip/TripTab'
import type { MyGroupAccess } from './myGroupAccess'
import { useGroupRoster } from './useGroupRoster'

const TABS = [
  { id: 'trip', label: 'Trip', Component: TripTab },
  { id: 'todos', label: 'Todos', Component: TodosTab },
  { id: 'split', label: 'Split', Component: SplitTab },
  { id: 'scan', label: 'Scan', Component: ScanTab },
  { id: 'fx', label: 'FX', Component: FxTab },
  { id: 'crew', label: 'Crew', Component: CrewTab },
] as const

type TabId = (typeof TABS)[number]['id']

export function GroupWorkspace({ groups, selectedGroupId, onSelect, onRefresh, onCreateAnother, onSignOut, signOutError }: {
  groups: MyGroupAccess[]
  selectedGroupId: string
  onSelect: (groupId: string) => void
  onRefresh: () => void
  onCreateAnother: () => void
  onSignOut: () => void
  signOutError: string | null
}) {
  const selected = groups.find((group) => group.groupId === selectedGroupId)
  if (!selected) return null

  return (
    <main data-testid="group-workspace" className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 py-10">
      <p className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.22em' }}>YOUR TRIPS</p>
      <h1 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 34, fontWeight: 400, marginTop: 12 }}>{selected.tripName}</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{selected.destination} · {selected.role === 'owner' ? 'Owner' : 'Member'}</p>
      <nav aria-label="Choose a Trip" className="mt-6 flex flex-wrap gap-2">
        {groups.map((group) => <button key={group.groupId} type="button" onClick={() => onSelect(group.groupId)} aria-current={group.groupId === selected.groupId ? 'page' : undefined} className="rounded-md border px-3 py-2" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>{group.tripName}</button>)}
      </nav>
      <div className="mt-5 flex gap-4">
        <button type="button" onClick={onRefresh} style={{ color: 'var(--text-secondary)' }}>Refresh Trips</button>
        <button type="button" onClick={onCreateAnother} style={{ color: 'var(--text-secondary)' }}>Create another Trip</button>
        <button type="button" onClick={onSignOut} style={{ color: 'var(--text-secondary)' }}>Sign out</button>
      </div>
      {signOutError && <p role="alert" style={{ color: 'var(--accent)' }}>{signOutError}</p>}
      {/* Keyed by Trip so switching Trips remounts every tab with fresh state. */}
      <TripSections key={selected.groupId} trip={selected} />
    </main>
  )
}

function TripSections({ trip }: { trip: MyGroupAccess }) {
  const [tab, setTab] = useState<TabId>('trip')
  const { roster, reload } = useGroupRoster(trip.groupId)
  const current = TABS.find((entry) => entry.id === tab) ?? TABS[0]

  return (
    <>
      <div role="tablist" aria-label="Trip sections" className="mt-8 flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <button key={entry.id} type="button" role="tab" id={`trip-tab-${entry.id}`} aria-selected={entry.id === tab}
            aria-controls="trip-tab-panel" onClick={() => setTab(entry.id)} className="rounded-md border px-3 py-2"
            style={{ borderColor: entry.id === tab ? 'var(--text-primary)' : 'var(--border)', color: 'var(--text-primary)' }}>
            {entry.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="trip-tab-panel" aria-labelledby={`trip-tab-${current.id}`} className="mt-6">
        <current.Component trip={trip} roster={roster} reloadRoster={reload} />
      </div>
    </>
  )
}
