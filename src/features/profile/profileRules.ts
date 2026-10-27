/**
 * Pure rules for the Profile form. The patterns mirror the database checks in
 * migration 025 (a unit test keeps them in sync); the server re-checks anyway.
 */

export const UPI_PATTERN = /^[A-Za-z0-9._-]{2,64}@[A-Za-z][A-Za-z0-9]{1,63}$/
export const PHONE_PATTERN = /^\+?[0-9 ()-]{6,24}$/
export const DISPLAY_NAME_MAX = 60
export const EMERGENCY_CONTACT_MAX = 200
export const DIETARY_NOTES_MAX = 300

/** Emoji people can pick as their avatar. */
export const AVATAR_EMOJI: readonly string[] = [
  '😎', '🦊', '🐼', '🐯', '🦁', '🐨', '🐸', '🐙', '🦄', '🐳', '🐧', '🦜',
  '🌴', '🏝️', '⛰️', '🏄', '✈️', '🚀', '🎒', '🍕', '🍹', '🎸', '⚽', '🌞',
]

export interface ProfileFormValues {
  displayName: string
  homeCurrency: string
  upiId: string
  phone: string
  emergencyContact: string
  dietaryNotes: string
}

export type ProfileField = keyof ProfileFormValues
export type ProfileFormErrors = Partial<Record<ProfileField, string>>

/** What the profiles row stores: trimmed text, blanks as null. */
export interface ProfileChanges {
  display_name: string
  home_currency: string | null
  upi_id: string | null
  phone: string | null
  emergency_contact: string | null
  dietary_notes: string | null
}

const blankToNull = (value: string) => {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function validateProfileForm(values: ProfileFormValues): ProfileFormErrors {
  const errors: ProfileFormErrors = {}
  const name = values.displayName.trim()
  if (!name) errors.displayName = 'Enter the name friends know you by.'
  else if (name.length > DISPLAY_NAME_MAX) errors.displayName = `Keep it to ${DISPLAY_NAME_MAX} characters.`
  if (values.homeCurrency && !/^[A-Z]{3}$/u.test(values.homeCurrency)) errors.homeCurrency = 'Choose a currency from the list.'
  const upi = values.upiId.trim()
  if (upi && !UPI_PATTERN.test(upi)) errors.upiId = 'Use a UPI ID like name@okbank.'
  const phone = values.phone.trim()
  if (phone && !PHONE_PATTERN.test(phone)) errors.phone = 'Use digits, spaces, brackets or dashes, with an optional + in front.'
  if (values.emergencyContact.trim().length > EMERGENCY_CONTACT_MAX) errors.emergencyContact = `Keep it to ${EMERGENCY_CONTACT_MAX} characters.`
  if (values.dietaryNotes.trim().length > DIETARY_NOTES_MAX) errors.dietaryNotes = `Keep it to ${DIETARY_NOTES_MAX} characters.`
  return errors
}

export function profileChanges(values: ProfileFormValues): ProfileChanges {
  return {
    display_name: values.displayName.trim(),
    home_currency: blankToNull(values.homeCurrency),
    upi_id: blankToNull(values.upiId),
    phone: blankToNull(values.phone),
    emergency_contact: blankToNull(values.emergencyContact),
    dietary_notes: blankToNull(values.dietaryNotes),
  }
}

/** New password rules, matching Supabase Auth's minimum here. */
export function newPasswordError(next: string, confirmation: string): string | null {
  if (next.length < 8) return 'Use at least 8 characters.'
  if (next !== confirmation) return 'The new passwords don’t match.'
  return null
}

export function emailError(email: string, current: string | undefined): string | null {
  const value = email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value)) return 'Enter an email address like you@example.com.'
  if (current && value.toLowerCase() === current.toLowerCase()) return 'That’s already your email address.'
  return null
}
