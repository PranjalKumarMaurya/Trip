import { supabase } from '../../lib/supabase'
import {
  type ArchivedTrip, type InvitationRow, crewErrorCode, lifecycleOutcome, parseArchivedTrips, parseInvitationList,
} from './crewRules'

// Thin wrappers over the trusted lifecycle RPCs (migrations 015-021, 060).
// Every mutation takes a caller-owned request id: a fresh one per user action,
// the same one again when that action is retried. Failures throw Error(code).

function fail(message: string | undefined): never {
  throw new Error(crewErrorCode(message))
}

export async function listGroupInvitations(groupId: string): Promise<{ items: InvitationRow[]; liveCount: number }> {
  const { data, error } = await supabase.rpc('list_group_invitations', {
    group_id: groupId,
    // First page (newest 50); the generated types do not model nullable arguments.
    before_created_at: null as unknown as string,
    before_invitation_id: null as unknown as string,
  })
  if (error) fail(error.message)
  return parseInvitationList(data)
}

export async function revokeInvitation(groupId: string, invitationId: string, requestId: string) {
  const { data, error } = await supabase.rpc('revoke_invitation', {
    group_id: groupId, invitation_id: invitationId, request_id: requestId,
  })
  if (error) fail(error.message)
  return lifecycleOutcome(data, requestId, ['revoked', 'expired', 'already_terminal'] as const)
}

export async function changeMemberRole(groupId: string, targetMembershipId: string, role: 'owner' | 'member', requestId: string) {
  const { data, error } = await supabase.rpc('change_member_role', {
    group_id: groupId, target_membership_id: targetMembershipId, requested_role: role, request_id: requestId,
  })
  if (error) fail(error.message)
  return lifecycleOutcome(data, requestId, ['changed', 'unchanged'] as const)
}

/** The caller hands ownership to `successorMembershipId` and stays as a Member. */
export async function transferOwnership(groupId: string, successorMembershipId: string, requestId: string) {
  const { data, error } = await supabase.rpc('transfer_ownership', {
    group_id: groupId, successor_membership_id: successorMembershipId, prior_owner_outcome: 'member', request_id: requestId,
  })
  if (error) fail(error.message)
  return lifecycleOutcome(data, requestId, ['transferred'] as const)
}

/** `leave` targets the caller's own membership; `remove` is an Owner removing someone else. */
export async function deactivateMembership(groupId: string, targetMembershipId: string, action: 'leave' | 'remove', requestId: string) {
  const { data, error } = await supabase.rpc('deactivate_membership', {
    group_id: groupId, target_membership_id: targetMembershipId, action, confirmation: { confirmed: true }, request_id: requestId,
  })
  if (error) fail(error.message)
  return lifecycleOutcome(data, requestId, ['deactivated'] as const)
}

export async function setTripArchiveState(groupId: string, state: 'archived' | 'active', requestId: string) {
  const { data, error } = await supabase.rpc('set_group_archive_state', {
    group_id: groupId, desired_archive_state: state, request_id: requestId,
  })
  if (error) fail(error.message)
  return lifecycleOutcome(data, requestId, ['archived', 'restored', 'unchanged'] as const)
}

/** Archived Trips where the caller is still an active Owner (migration 060). */
export async function loadArchivedTrips(): Promise<ArchivedTrip[]> {
  const { data, error } = await supabase.rpc('get_my_archived_groups')
  if (error) fail(error.message)
  return parseArchivedTrips(data)
}
