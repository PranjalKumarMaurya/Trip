import { type ReactNode, useEffect, useId, useRef } from 'react'
import { IconClose } from './icons'

/**
 * Bottom sheet on a native modal <dialog>: focus is trapped, Escape and a tap on
 * the backdrop close it, and focus returns to the opener on close.
 */
export function Sheet({ title, onClose, testId, children }: {
  title: string
  onClose: () => void
  testId?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialog && !dialog.open) dialog.showModal()
    return () => {
      if (dialog?.open) dialog.close()
      if (opener?.isConnected) opener.focus()
    }
  }, [])

  return (
    <dialog ref={ref} className="sheet" aria-labelledby={titleId} data-testid={testId}
      // Nested dialogs (e.g. a confirm sheet opened from here) bubble through React; act only on our own.
      onCancel={(event) => { if (event.target !== event.currentTarget) return; event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="sheet__grabber" aria-hidden="true" />
      <div className="sheet__head">
        <h2 id={titleId} className="serif-display min-w-0 flex-1 truncate" style={{ fontSize: 22 }}>{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="topbar-btn topbar-btn--icon" style={{ border: 'none', background: 'none' }}>
          <IconClose />
        </button>
      </div>
      <div className="sheet__body">{children}</div>
    </dialog>
  )
}
