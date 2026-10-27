import { type ReactNode, type SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode
}

/** Native select styled to match NeonInput (16px text so phones do not zoom on focus). */
export function NeonSelect({ className = '', children, ...rest }: Props) {
  return <select className={`field-select w-full ${className}`} {...rest}>{children}</select>
}
