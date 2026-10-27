// Plain-language messages for Split RPC failures. Writes are atomic, so a
// failure always means nothing changed.
const MESSAGES: Record<string, string> = {
  split_not_a_member: 'You no longer have access to this Trip.',
  split_not_allowed: 'Only the person who added this, or a Trip Owner, can change it.',
  split_expense_not_found: 'This expense no longer exists. It may have been deleted.',
  split_settlement_not_found: 'This payment record no longer exists.',
  split_expense_stale: 'Someone else changed this expense while you were editing. Close it and open it again to see their version.',
  split_payers_total_mismatch: 'Payer amounts must add up to the total.',
  split_shares_total_mismatch: 'Shares must add up to the total.',
  split_inactive_member: 'Everyone on this must be a current member of the Trip.',
  split_equal_mismatch: 'We could not split this evenly. Try again.',
  split_amount_precision: 'One of the amounts has too many decimal places for its currency.',
  split_invalid_amount: 'Enter an amount above zero.',
  split_amount_too_small: 'That amount is too small to record in the Trip currency.',
  split_invalid_description: 'Enter a description of up to 120 characters.',
  split_invalid_currency: 'Use a valid three-letter currency code.',
  split_fx_rate_required: 'Enter an exchange rate above zero.',
  split_settlement_same_person: 'Choose two different people.',
  split_request_conflict: 'This request was already used. Close the form and try again.',
  split_duplicate_member: 'Each person can appear only once.',
}

export function splitErrorMessage(code: string | null | undefined, fallback = 'We could not save this. Nothing was changed, so you can try again.'): string {
  if (!code) return fallback
  if (MESSAGES[code]) return MESSAGES[code]
  // An unknown ISO 4217 code fails the currency foreign key.
  if (code === '23503') return 'Use a valid three-letter currency code.'
  return fallback
}
