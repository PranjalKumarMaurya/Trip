import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Ledger } from './ledger'
import { loadLedger, SplitRequestError } from './splitApi'

export type LedgerState =
  | { status: 'loading' }
  | { status: 'ready'; ledger: Ledger }
  | { status: 'error'; code: string; ledger: Ledger | null }

const LEDGER_TABLES = ['trip_expenses', 'trip_settlements'] as const

/**
 * The Trip ledger, re-read from the server whenever anyone changes it.
 * INSERT/UPDATE events are filtered to this Trip (and RLS-checked by
 * Realtime). DELETE events cannot be filtered and carry only the primary key,
 * so any delete triggers a re-read; the re-read itself is RLS-scoped.
 */
export function useSplitLedger(groupId: string) {
  const [state, setState] = useState<LedgerState>({ status: 'loading' })
  const latest = useRef(0)
  const ledgerRef = useRef<Ledger | null>(null)

  const reload = useCallback(async () => {
    const request = ++latest.current
    try {
      const ledger = await loadLedger(groupId)
      if (request !== latest.current) return
      ledgerRef.current = ledger
      setState({ status: 'ready', ledger })
    } catch (error) {
      if (request !== latest.current) return
      setState({ status: 'error', code: error instanceof SplitRequestError ? error.code : 'request_failed', ledger: ledgerRef.current })
    }
  }, [groupId])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(() => void reload(), 150)
    }
    void reload()
    // A unique topic per mount: supabase.channel() would otherwise hand back a channel
    // that a previous (StrictMode) mount already subscribed and is still removing.
    let channel = supabase.channel(`split-ledger:${groupId}:${crypto.randomUUID()}`)
    for (const table of LEDGER_TABLES) {
      const filter = `group_id=eq.${groupId}`
      channel = channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter }, schedule)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter }, schedule)
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table }, schedule)
    }
    // Re-read once subscribed so nothing between the first read and the subscription is missed.
    channel.subscribe((status) => { if (status === 'SUBSCRIBED') schedule() })
    return () => {
      clearTimeout(timer)
      latest.current += 1
      void supabase.removeChannel(channel)
    }
  }, [groupId, reload])

  return { state, reload }
}
