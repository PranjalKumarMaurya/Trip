import { useEffect, useState } from 'react'
import type { TripMemberProfile } from '../groups/useTripMemberProfiles'
import { sharedDetails } from './crewInfo'

/** The expanded part of a Crew row: what this member shared with the Trip. */
export function CrewInfo({ id, name, isMe, profile, loading, error }: {
  id: string
  name: string
  isMe: boolean
  profile: TripMemberProfile | undefined
  loading: boolean
  error: boolean
}) {
  const details = sharedDetails(profile)
  return (
    <div id={id} data-testid="crew-info" className="mb-2 mt-1 rounded-md border px-3 py-3 text-sm" style={{ borderColor: 'var(--border)' }}>
      {loading ? (
        <p style={{ color: 'var(--text-tertiary)' }}>Loading details…</p>
      ) : error ? (
        <p style={{ color: 'var(--text-secondary)' }}>Details could not load. Try Refresh crew.</p>
      ) : details.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>{isMe ? 'You haven’t shared any details yet.' : `${name} hasn’t shared any details yet.`}</p>
      ) : (
        <dl className="flex flex-col gap-3">
          {details.map((detail) => (
            <div key={detail.key}>
              <dt className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{detail.label}</dt>
              <dd className="mt-0.5 flex min-w-0 items-center justify-between gap-3" style={{ color: 'var(--text-primary)' }}>
                {detail.href
                  ? <a href={detail.href} className="break-words underline decoration-[color:var(--border-strong)] underline-offset-4" aria-label={`Call ${name}: ${detail.value}`}>{detail.value}</a>
                  : <span className={`min-w-0 break-words ${detail.copyable ? 'font-mono' : ''}`}>{detail.value}</span>}
                {detail.copyable && <CopyButton value={detail.value} label={`Copy ${detail.label} for ${name}`} />}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {isMe ? 'Only people in this Trip see what you share.' : 'Shared only with people in this Trip.'}
      </p>
    </div>
  )
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  useEffect(() => {
    if (state === 'idle') return
    const id = window.setTimeout(() => setState('idle'), 2500)
    return () => window.clearTimeout(id)
  }, [state])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setState('copied')
    } catch {
      setState('failed')
    }
  }
  return (
    <button type="button" onClick={() => void copy()} aria-label={label}
      className="shrink-0 rounded-full px-3 text-xs" style={{ minHeight: 32, border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}>
      <span aria-live="polite">{state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy'}</span>
    </button>
  )
}
