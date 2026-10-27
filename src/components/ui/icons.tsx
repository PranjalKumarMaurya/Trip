import { type ReactNode } from 'react'

/** 24px stroke icons drawn in `currentColor`; decorative (hidden from assistive tech). */
function Icon({ size = 22, children }: { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

type IconProps = { size?: number }

export const IconMap = ({ size }: IconProps) => <Icon size={size}><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z" /><path d="M9 4v14M15 6v14" /></Icon>
export const IconTodos = ({ size }: IconProps) => <Icon size={size}><rect x="4" y="4" width="16" height="16" rx="4" /><path d="m8.5 12.2 2.4 2.4 4.6-5" /></Icon>
export const IconReceipt = ({ size }: IconProps) => <Icon size={size}><path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2v-17z" /><path d="M9 8.5h6M9 12.5h6" /></Icon>
export const IconScan = ({ size }: IconProps) => <Icon size={size}><path d="M4 8V6.5A2.5 2.5 0 0 1 6.5 4H8M16 4h1.5A2.5 2.5 0 0 1 20 6.5V8M20 16v1.5a2.5 2.5 0 0 1-2.5 2.5H16M8 20H6.5A2.5 2.5 0 0 1 4 17.5V16" /><path d="M7.5 12h9" /></Icon>
export const IconExchange = ({ size }: IconProps) => <Icon size={size}><path d="M5 8h13.5L15 4.5M19 16H5.5L9 19.5" /></Icon>
export const IconCrew = ({ size }: IconProps) => <Icon size={size}><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19.5c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6" /><path d="M15.5 5.5a3 3 0 0 1 0 5.8M17.6 14.9c1.6.6 2.6 2.1 3 4.3" /></Icon>
export const IconLayers = ({ size }: IconProps) => <Icon size={size}><path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8 12 3.5z" /><path d="m3.5 12.5 8.5 4.5 8.5-4.5" /></Icon>
export const IconUser = ({ size }: IconProps) => <Icon size={size}><circle cx="12" cy="8.5" r="3.6" /><path d="M5 20c1.2-3.6 3.8-5.4 7-5.4s5.8 1.8 7 5.4" /></Icon>
export const IconClose = ({ size }: IconProps) => <Icon size={size}><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></Icon>
export const IconCheck = ({ size }: IconProps) => <Icon size={size}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>
export const IconPlus = ({ size }: IconProps) => <Icon size={size}><path d="M12 5v14M5 12h14" /></Icon>
export const IconBack = ({ size }: IconProps) => <Icon size={size}><path d="m14.5 5.5-6.5 6.5 6.5 6.5" /></Icon>
export const IconRefresh = ({ size }: IconProps) => <Icon size={size}><path d="M19.5 11.5a7.5 7.5 0 1 1-2.2-5.3" /><path d="M19.5 4.5v4.5H15" /></Icon>
export const IconSignOut = ({ size }: IconProps) => <Icon size={size}><path d="M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14" /><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" /></Icon>
export const IconSettings = ({ size }: IconProps) => <Icon size={size}><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.4 7.4 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.4 7.4 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.6z" /></Icon>
export const IconChevronRight = ({ size }: IconProps) => <Icon size={size}><path d="m9.5 5.5 6.5 6.5-6.5 6.5" /></Icon>
export const IconCamera = ({ size }: IconProps) => <Icon size={size}><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-8z" /><circle cx="12" cy="12.5" r="3.4" /></Icon>
export const IconLink = ({ size }: IconProps) => <Icon size={size}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Icon>
