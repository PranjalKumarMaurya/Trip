import { cloneElement, type ReactElement, type ReactNode } from 'react'

/**
 * Visible label + one control + hint or error. The control gets `id`,
 * `aria-describedby` and `aria-invalid` so the label and messages are announced.
 */
export function Field({ id, label, hint, error, optional, className = '', children }: {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  className?: string
  children: ReactElement
}) {
  const messageId = error || hint ? `${id}-message` : undefined
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="field-label">
        {label}{optional && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}> (optional)</span>}
      </label>
      {cloneElement(children, { id, 'aria-describedby': messageId, 'aria-invalid': error ? true : undefined })}
      {error ? <p id={messageId} className="field-error">{error}</p>
        : hint ? <p id={messageId} className="field-hint">{hint}</p> : null}
    </div>
  )
}
