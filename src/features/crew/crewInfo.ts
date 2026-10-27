// What a member chose to share with their Trip (migration 025), as display rows.
// Pure, so it runs under `node --test`.

export interface SharedProfileFields {
  phone: string | null
  emergencyContact: string | null
  dietaryNotes: string | null
  upiId: string | null
}

export interface SharedDetail {
  key: 'phone' | 'emergency' | 'dietary' | 'upi'
  label: string
  value: string
  /** `tel:` link for phone numbers. */
  href?: string
  /** Offer a Copy button (UPI ID). */
  copyable?: boolean
}

/** A `tel:` link for a stored phone number (digits and a leading +), or null if it has too few digits. */
export function telHref(phone: string): string | null {
  const trimmed = phone.trim()
  const digits = trimmed.replace(/\D/gu, '')
  if (digits.length < 6 || digits.length > 20) return null
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`
}

/** Only the fields the member set, in a fixed order. */
export function sharedDetails(profile: SharedProfileFields | null | undefined): SharedDetail[] {
  if (!profile) return []
  const details: SharedDetail[] = []
  const phone = profile.phone?.trim()
  if (phone) {
    const href = telHref(phone)
    details.push(href ? { key: 'phone', label: 'Phone', value: phone, href } : { key: 'phone', label: 'Phone', value: phone })
  }
  const emergency = profile.emergencyContact?.trim()
  if (emergency) details.push({ key: 'emergency', label: 'Emergency contact', value: emergency })
  const dietary = profile.dietaryNotes?.trim()
  if (dietary) details.push({ key: 'dietary', label: 'Dietary needs', value: dietary })
  const upi = profile.upiId?.trim()
  if (upi) details.push({ key: 'upi', label: 'UPI ID', value: upi, copyable: true })
  return details
}
