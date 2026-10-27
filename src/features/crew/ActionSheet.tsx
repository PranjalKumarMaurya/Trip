import { type CSSProperties, type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { type CrewErrorCode, type CrewErrorView, crewErrorCodeOf } from './crewRules'

/** One confirmed, server-checked Crew action (MBR-06..13, GRP-08..18). */
export interface ActionSpec {
  id: string
  /** Button label when the sheet offers a choice of actions. */
  menuLabel: string
  title: string
  body: ReactNode
  confirmLabel: string
  busyLabel: string
  tone?: 'accent' | 'danger'
  /** When set, the action cannot proceed; this explains why instead of a dead button. */
  blocked?: string
  /** Performs the action with this request id and resolves to the success message. */
  run: (requestId: string) => Promise<string>
  describeError: (code: CrewErrorCode) => CrewErrorView
}

export type ActionSheetResult = 'success' | 'failed' | 'cancelled'

type Phase =
  | { kind: 'menu' }
  | { kind: 'confirm'; spec: ActionSpec }
  | { kind: 'working'; spec: ActionSpec; requestId: string }
  | { kind: 'success'; spec: ActionSpec; message: string }
  | { kind: 'error'; spec: ActionSpec; requestId: string; view: CrewErrorView }

const sheetStyle: CSSProperties = {
  margin: 'auto',
  width: 'calc(100% - 32px)',
  maxWidth: 448,
  padding: 22,
  borderRadius: 20,
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
}

export const buttonClass = 'rounded-full px-4 py-2 text-sm disabled:opacity-60'
export const quietButtonStyle: CSSProperties = { border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }
export const accentButtonStyle: CSSProperties = { background: 'var(--accent)', border: '1px solid var(--accent)', color: '#1A0A03', fontWeight: 500 }
export const dangerButtonStyle: CSSProperties = { background: 'var(--neon-pink)', border: '1px solid var(--neon-pink)', color: '#1A0A03', fontWeight: 500 }

/**
 * A modal sheet (native <dialog>: focus is trapped, Escape dismisses) that walks
 * one action through confirm -> in progress -> success | error. A request id is
 * minted when the user confirms and reused only by Retry of that same attempt.
 */
export function ActionSheet({ title, intro, actions, onClose, testId = 'crew-action-sheet' }: {
  title: string
  intro?: ReactNode
  actions: ActionSpec[]
  /** `message` is the server-confirmed success text, when the action succeeded. */
  onClose: (result: ActionSheetResult, message?: string) => void
  testId?: string
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [phase, setPhase] = useState<Phase>(() => actions.length === 1 ? { kind: 'confirm', spec: actions[0] } : { kind: 'menu' })
  const failedRef = useRef(false)
  const mountedRef = useRef(true)
  const busy = phase.kind === 'working'
  const busyRef = useRef(busy)
  busyRef.current = busy

  useEffect(() => {
    mountedRef.current = true
    const dialog = dialogRef.current
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialog && !dialog.open) dialog.showModal()
    return () => {
      mountedRef.current = false
      if (dialog?.open) dialog.close()
      if (previous?.isConnected) previous.focus()
    }
  }, [])

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
  }, [phase.kind])

  const finish = () => {
    if (busyRef.current) return
    if (phase.kind === 'success') onClose('success', phase.message)
    else onClose(failedRef.current ? 'failed' : 'cancelled')
  }

  const attempt = async (spec: ActionSpec, requestId: string) => {
    setPhase({ kind: 'working', spec, requestId })
    try {
      const message = await spec.run(requestId)
      if (mountedRef.current) setPhase({ kind: 'success', spec, message })
    } catch (error) {
      failedRef.current = true
      if (mountedRef.current) setPhase({ kind: 'error', spec, requestId, view: spec.describeError(crewErrorCodeOf(error)) })
    }
  }

  const heading = phase.kind === 'menu' ? title : phase.spec.title
  const spec = phase.kind === 'menu' ? null : phase.spec
  const confirmStyle = spec?.tone === 'danger' ? dangerButtonStyle : accentButtonStyle

  return (
    <dialog ref={dialogRef} data-testid={testId} aria-labelledby={titleId} aria-busy={busy}
      className="backdrop:bg-black/70 backdrop:backdrop-blur-sm" style={sheetStyle}
      onCancel={(event) => { event.preventDefault(); finish() }}
      onClose={() => { if (mountedRef.current && busyRef.current) dialogRef.current?.showModal() }}>
      <h2 id={titleId} className="serif-display" style={{ fontSize: 23, color: 'var(--text-primary)' }}>{heading}</h2>

      {phase.kind === 'menu' && <>
        {intro && <div className="mt-2" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{intro}</div>}
        <div className="mt-5 flex flex-col gap-2">
          {actions.map((action, index) => (
            <button key={action.id} type="button" data-autofocus={index === 0 ? '' : undefined}
              onClick={() => setPhase({ kind: 'confirm', spec: action })}
              className="rounded-md px-3 py-3 text-left" style={{ border: '1px solid var(--border)', color: action.tone === 'danger' ? 'var(--neon-pink)' : 'var(--text-primary)' }}>
              {action.menuLabel}
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={finish} className={buttonClass} style={quietButtonStyle}>Close</button>
        </div>
      </>}

      {spec && phase.kind !== 'menu' && <>
        <div className="mt-2" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          {phase.kind === 'success' ? null : spec.blocked ?? spec.body}
        </div>
        {phase.kind === 'working' && <p role="status" className="mt-4" style={{ color: 'var(--text-secondary)' }}>{spec.busyLabel}</p>}
        {phase.kind === 'success' && <p role="status" className="mt-4" style={{ color: 'var(--text-primary)' }}>{phase.message}</p>}
        {phase.kind === 'error' && <p role="alert" className="mt-4" style={{ color: 'var(--accent)' }}>{phase.view.message}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {phase.kind === 'success' ? (
            <button type="button" data-autofocus="" onClick={finish} className={buttonClass} style={accentButtonStyle}>Done</button>
          ) : spec.blocked ? (
            <button type="button" data-autofocus="" onClick={finish} className={buttonClass} style={quietButtonStyle}>Close</button>
          ) : phase.kind === 'error' ? <>
            <button type="button" data-autofocus={phase.view.retryable ? undefined : ''} onClick={finish} className={buttonClass} style={quietButtonStyle}>Close</button>
            {phase.view.retryable && <button type="button" data-autofocus="" onClick={() => void attempt(spec, phase.requestId)} className={buttonClass} style={confirmStyle}>Retry</button>}
          </> : <>
            <button type="button" data-autofocus="" disabled={busy} onClick={finish} className={buttonClass} style={quietButtonStyle}>Cancel</button>
            <button type="button" disabled={busy} onClick={() => void attempt(spec, crypto.randomUUID())} className={buttonClass} style={confirmStyle}>
              {busy ? spec.busyLabel : spec.confirmLabel}
            </button>
          </>}
        </div>
      </>}
    </dialog>
  )
}
