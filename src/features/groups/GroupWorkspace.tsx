import { InviteMember } from '../invitations/InviteMember'
import type { MyGroupAccess } from './myGroupAccess'

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
    <main data-testid="group-workspace-candidate" className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 py-10">
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
      {selected.role === 'owner' && <div className="mt-8"><InviteMember key={selected.groupId} groupId={selected.groupId} /></div>}
      <section className="surface mt-8 px-4 py-5" aria-label="Trip features">
        <h2 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 25 }}>Trip workspace</h2>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Trip, Todos, Scan, Split, and FX will open here after their Group access paths are verified.</p>
      </section>
    </main>
  )
}
