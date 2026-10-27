import { type CSSProperties, type ReactNode, type ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: string
  children: ReactNode
  variant?: 'solid' | 'outline' | 'ghost'
  /** `md` (default) is the original size; `lg` is a 48px primary action with centred icon + label. */
  size?: 'md' | 'lg'
}

/** A one-third-opacity border colour; hex colours keep their original `#RRGGBB55` form. */
function translucent(color: string): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}55` : `color-mix(in srgb, ${color} 34%, transparent)`
}

export function NeonBtn({
  color = 'var(--accent)',
  children,
  variant = 'solid',
  size = 'md',
  className = '',
  style: externalStyle,
  ...rest
}: Props) {
  const base: CSSProperties = (() => {
    if (variant === 'solid')   return { background: color, border: `1px solid ${color}`, color: '#1A0A03' }
    if (variant === 'outline') return { background: 'transparent', border: `1px solid ${translucent(color)}`, color }
    return { background: 'rgba(245,241,235,0.04)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
  })()
  const sizing = size === 'lg'
    ? 'inline-flex min-h-12 items-center justify-center gap-2 px-5 text-[15px]'
    : 'px-4 py-2.5 text-sm'

  return (
    <button
      className={`${sizing} font-ui transition-all duration-200 hover:brightness-110 active:scale-[0.985] rounded-full disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:active:scale-100 ${className}`}
      style={{
        fontWeight: size === 'lg' && variant === 'solid' ? 600 : 500,
        letterSpacing: 0.2,
        ...base,
        ...externalStyle,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
