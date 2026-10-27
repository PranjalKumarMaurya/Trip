import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

export type LiveStatus = 'connecting' | 'live' | 'offline'

/**
 * Refetch when any of `tables` changes for this Trip. Realtime is only a nudge:
 * payloads are never rendered, the caller re-reads through RLS. Also refetches
 * once subscribed (to cover the gap since the first load), when the page becomes
 * visible again, and every 30 s as a fallback for dropped sockets.
 */
export function useLiveRefetch(groupId: string, tables: readonly string[], refetch: () => void): LiveStatus {
  const [status, setStatus] = useState<LiveStatus>('connecting')
  const refetchRef = useRef(refetch)
  useEffect(() => { refetchRef.current = refetch }, [refetch])
  const tablesKey = tables.join(',')

  useEffect(() => {
    let active = true
    let timer: number | undefined
    const schedule = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => { if (active) refetchRef.current() }, 120)
    }
    // A unique topic per mount: supabase-js reuses channels by topic, which would
    // break StrictMode's mount/unmount/mount.
    let channel = supabase.channel(`trip-live:${groupId}:${tablesKey}:${Math.random().toString(36).slice(2)}`)
    for (const table of tablesKey.split(',')) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `group_id=eq.${groupId}` }, schedule)
    }
    channel.subscribe((state) => {
      if (!active) return
      if (state === 'SUBSCRIBED') {
        setStatus('live')
        schedule()
      } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
        setStatus('offline')
      }
    })
    const onVisible = () => { if (document.visibilityState === 'visible') schedule() }
    document.addEventListener('visibilitychange', onVisible)
    const poll = window.setInterval(onVisible, 30_000)
    return () => {
      active = false
      window.clearTimeout(timer)
      window.clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
      void supabase.removeChannel(channel)
    }
  }, [groupId, tablesKey])

  return status
}

/** Quiet indicator: nothing while first connecting, "Live" once connected, "Reconnecting…" if the link drops. */
export function LiveBadge({ status }: { status: LiveStatus }) {
  if (status === 'connecting') return null
  const live = status === 'live'
  return (
    <span role="status" aria-label={live ? 'Live updates on' : 'Live updates paused, reconnecting'} data-live-status={status}
      className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 999, background: live ? '#4ADE80' : 'var(--text-quaternary)' }} />
      {live ? 'Live' : 'Reconnecting…'}
    </span>
  )
}
