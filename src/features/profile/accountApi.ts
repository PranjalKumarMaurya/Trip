import { supabase } from '../../lib/supabase'
import { listMyAvatars, removeAvatars } from './avatarStorage'

export class AccountRequestError extends Error {
  constructor(readonly code: string) {
    super(code)
  }
}

/** Trips where the person is the last active Owner; deleting the account waits until they hand over. */
export async function loadDeletionBlockers(): Promise<{ groupId: string; tripName: string }[]> {
  const { data, error } = await supabase.rpc('get_account_deletion_blockers')
  if (error || !Array.isArray(data)) throw new AccountRequestError('blockers_unavailable')
  return data.map((row) => ({ groupId: row.group_id, tripName: row.trip_name }))
}

/**
 * Remove the person's photos through Storage (the database refuses to delete an
 * account while any remain, so no file is orphaned), then delete the account on
 * the server. Safe to retry.
 */
export async function deleteMyAccount(userId: string): Promise<void> {
  try {
    const photos = await listMyAvatars(userId)
    if (photos.length) {
      await removeAvatars(photos)
      // If the server still refuses (e.g. Owner rules changed meanwhile), the profile shows no broken photo.
      await supabase.from('profiles').update({ avatar_path: null }).eq('auth_user_id', userId)
    }
  } catch {
    throw new AccountRequestError('avatars_remaining')
  }
  const { data, error } = await supabase.rpc('delete_my_account', { p_confirmation: 'DELETE' })
  if (error) throw new AccountRequestError(error.message || 'operation_failed')
  const outcome = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>).outcome : null
  if (outcome !== 'deleted' && outcome !== 'already_deleted') throw new AccountRequestError('operation_failed')
}

export function accountErrorMessage(code: string): string {
  if (code === 'last_owner') return 'You’re the only Owner of a Trip. Make someone else an Owner, or archive the Trip, then try again.'
  if (code === 'avatars_remaining') return 'We couldn’t remove your photo. Check your connection and try again.'
  return 'We couldn’t delete your account. Check your connection and try again — nothing was deleted twice.'
}

/**
 * Change the sign-in email. Supabase emails a confirmation link to the new
 * address; the change applies once it is opened. Returns 'pending', or
 * 'changed' when the project applies email changes without confirmation.
 */
export async function changeEmail(email: string): Promise<'pending' | 'changed'> {
  const { data, error } = await supabase.auth.updateUser({ email: email.trim() }, { emailRedirectTo: window.location.origin })
  if (error) throw new AccountRequestError(error.status === 422 ? 'email_unavailable' : 'email_failed')
  return data.user?.email?.toLowerCase() === email.trim().toLowerCase() ? 'changed' : 'pending'
}

/** Check the current password by signing in with it, then set the new one. */
export async function changePassword(email: string, current: string, next: string): Promise<void> {
  const check = await supabase.auth.signInWithPassword({ email, password: current })
  if (check.error) throw new AccountRequestError(check.error.status === 400 ? 'wrong_password' : 'password_failed')
  const { error } = await supabase.auth.updateUser({ password: next })
  if (error) throw new AccountRequestError(error.code === 'same_password' ? 'same_password' : error.code === 'weak_password' ? 'weak_password' : 'password_failed')
}
