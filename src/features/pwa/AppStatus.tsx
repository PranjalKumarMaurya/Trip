import { useEffect, useState, useSyncExternalStore } from 'react'
import { dismissUpdate, isUpdateAvailable, reloadForUpdate, subscribeToUpdates } from './serviceWorker'

function useOnline() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}

/** App-wide notices above the tab bar: offline, and "new version available". */
export function AppStatus() {
  const online = useOnline()
  const update = useSyncExternalStore(subscribeToUpdates, isUpdateAvailable)
  if (online && !update) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 z-50 mx-auto flex w-full max-w-[480px] flex-col gap-2 px-4"
      style={{ bottom: 'calc(var(--tab-bar-height) + 12px + env(safe-area-inset-bottom, 0px))' }}>
      {!online && (
        <div role="status" data-testid="offline-notice" className="surface-flat pointer-events-auto px-4 py-3"
          style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.45)', borderColor: 'var(--border-strong)' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}>You’re offline</p>
          <p className="mt-0.5" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Trips, plans and balances can’t load or save until you’re back online. Nothing is lost.
          </p>
        </div>
      )}
      {update && (
        <div role="status" data-testid="update-prompt" className="surface-flat pointer-events-auto flex items-center gap-3 px-4 py-2.5"
          style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.45)', borderColor: 'rgba(255,139,77,0.45)' }}>
          <p className="min-w-0 flex-1" style={{ color: 'var(--text-primary)', fontSize: 14 }}>New version available</p>
          <button type="button" onClick={dismissUpdate} className="min-h-11 px-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Later</button>
          <button type="button" onClick={reloadForUpdate} className="min-h-11 rounded-full px-4 text-sm"
            style={{ background: 'var(--accent)', color: '#1A0A03', fontWeight: 600 }}>Reload</button>
        </div>
      )}
    </div>
  )
}
