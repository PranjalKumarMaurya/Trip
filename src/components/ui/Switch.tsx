import { useId } from 'react'

/**
 * An on/off control with a visible label and optional hint. The whole row is the
 * tap target (at least 44px tall); assistive tech reads it as a switch.
 */
export function Switch({ label, hint, checked, onChange, disabled, testId }: {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  testId?: string
}) {
  const labelId = useId()
  const hintId = useId()
  return (
    <button type="button" role="switch" aria-checked={checked} aria-labelledby={labelId}
      aria-describedby={hint ? hintId : undefined} disabled={disabled} data-testid={testId}
      className="switch-row" onClick={() => onChange(!checked)}>
      <span className="min-w-0 flex-1 text-left">
        <span id={labelId} className="block" style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
        {hint && <span id={hintId} className="mt-0.5 block field-hint">{hint}</span>}
      </span>
      <span className={`switch-track${checked ? ' is-on' : ''}`} aria-hidden="true"><span className="switch-thumb" /></span>
    </button>
  )
}
