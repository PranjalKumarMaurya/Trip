import { type CSSProperties, type InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  color?: string
}

export function NeonInput({ color = 'var(--accent)', className = '', style: externalStyle, onFocus, onBlur, ...rest }: Props) {
  const invalid = rest['aria-invalid'] === true || rest['aria-invalid'] === 'true'
  const restingBorder = invalid ? 'rgba(255,139,77,0.6)' : 'var(--border)'
  const base: CSSProperties = {
    background: 'rgba(245,241,235,0.035)',
    border: `1px solid ${restingBorder}`,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-ui)',
    outline: 'none',
    transition: 'border-color 0.2s, background-color 0.2s',
    fontSize: 14,
  }

  return (
    <input
      className={`px-3.5 py-2.5 rounded-md w-full ${className}`}
      style={{ ...base, ...externalStyle }}
      // Callers' focus/blur handlers run too; the focus border always resets on blur.
      onFocus={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = 'rgba(245,241,235,0.06)'; onFocus?.(e) }}
      onBlur={e =>  { e.currentTarget.style.borderColor = restingBorder; e.currentTarget.style.background = 'rgba(245,241,235,0.035)'; onBlur?.(e) }}
      {...rest}
    />
  )
}
