// "Pay via UPI" is only a deep link that opens the payer's own UPI app with
// the payee, amount and note filled in. The app never processes or holds
// money, and nothing is marked paid until someone records the payment.
import { toDecimalString } from './money.ts'

/** Same shape as the profiles.upi_id check in migration 025. */
const UPI_ID = /^[A-Za-z0-9._-]{2,64}@[A-Za-z][A-Za-z0-9]{1,63}$/u

export const isUpiId = (value: string | null | undefined): value is string => typeof value === 'string' && UPI_ID.test(value)

/** Notes are kept short; UPI apps truncate or reject long ones. */
export const UPI_NOTE_LENGTH = 40

export function upiNote(tripName: string): string {
  const note = `${tripName.trim()} settle-up`.replace(/\s+/gu, ' ').trim()
  return note.length <= UPI_NOTE_LENGTH ? note : `${note.slice(0, UPI_NOTE_LENGTH - 1).trimEnd()}…`
}

/**
 * upi://pay?pa=<UPI ID>&pn=<payee name>&am=<amount, 2 decimals>&cu=INR&tn=<note>,
 * every value URL-encoded. Amounts are INR minor units (paise).
 */
export function upiPayLink({ upiId, name, amountMinor, note }: {
  upiId: string
  name: string
  amountMinor: bigint
  note: string
}): string {
  if (!isUpiId(upiId) || amountMinor <= 0n) throw new Error('invalid_upi_payment')
  const params: [string, string][] = [
    ['pa', upiId],
    ['pn', name.trim()],
    ['am', toDecimalString(amountMinor, 2)],
    ['cu', 'INR'],
    ['tn', note],
  ]
  return `upi://pay?${params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}`
}
