import { supabase } from '../../lib/supabase'
import { isInvitationProof } from './invitationLink'

export type InspectionOutcome = 'continue' | 'ready' | 'verification_required' |
  'switch_account' | 'used' | 'revoked' | 'expired' | 'invalid'

export interface InvitationInspection {
  outcome: InspectionOutcome
  tripName?: string
  destination?: string
  startDate?: string
  endDate?: string
  expiresAt?: string
}

export type CreateInvitationResult =
  | { outcome: 'created'; invitationId: string; proof: string }
  | { outcome: 'already_completed'; invitationId: string }

interface RpcReply {
  data: unknown
  error: { message?: string } | null
}

interface InvitationRpcClient {
  rpc: (name: string, args: Record<string, unknown>) => Promise<RpcReply>
}

// Replace this boundary with generated RPC types when candidate migrations are integrated.
const rpcClient = supabase as unknown as InvitationRpcClient

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null
}

export async function createInvitation(groupId: string, recipientEmail: string, requestId: string): Promise<CreateInvitationResult> {
  const { data, error } = await rpcClient.rpc('create_invitation', {
    group_id: groupId,
    recipient_request: { email: recipientEmail },
    invitation_request: {},
    request_id: requestId,
  })
  if (error) {
    if (error.message === 'idempotency_conflict' || error.message === 'invitation_already_pending'
      || error.message === 'recipient_already_member') {
      throw new Error(error.message)
    }
    if (error.message === 'not_authorized' || error.message === 'invalid_request') {
      throw new Error('not_authorized')
    }
    throw new Error('creation_unavailable')
  }
  const result = object(data)
  if (!result || result.request_id !== requestId || typeof result.invitation_id !== 'string') {
    throw new Error('creation_unavailable')
  }
  if (result.outcome === 'created' && isInvitationProof(result.proof)) {
    return { outcome: 'created', invitationId: result.invitation_id, proof: result.proof }
  }
  if (result.outcome === 'already_completed' && !('proof' in result)) {
    return { outcome: 'already_completed', invitationId: result.invitation_id }
  }
  throw new Error('creation_unavailable')
}

export async function inspectInvitation(proof: string): Promise<InvitationInspection> {
  if (!isInvitationProof(proof)) return { outcome: 'invalid' }
  const { data, error } = await rpcClient.rpc('inspect_invitation', { invitation_proof: proof })
  if (error) throw new Error('inspection_unavailable')
  const result = object(data)
  if (!result) throw new Error('inspection_unavailable')
  const outcome = result?.outcome
  if (outcome !== 'continue' && outcome !== 'ready' && outcome !== 'verification_required'
    && outcome !== 'switch_account' && outcome !== 'used' && outcome !== 'revoked'
    && outcome !== 'expired' && outcome !== 'invalid') throw new Error('inspection_unavailable')
  const inspection: InvitationInspection = { outcome }
  if (outcome === 'continue' || outcome === 'ready'
    || outcome === 'verification_required' || outcome === 'switch_account') {
    if (typeof result.trip_name !== 'string' || typeof result.destination !== 'string'
      || typeof result.start_date !== 'string' || typeof result.end_date !== 'string'
      || typeof result.expires_at !== 'string') throw new Error('inspection_unavailable')
    inspection.tripName = result.trip_name
    inspection.destination = result.destination
    inspection.startDate = result.start_date
    inspection.endDate = result.end_date
    inspection.expiresAt = result.expires_at
  }
  return inspection
}

export async function acceptInvitation(proof: string, requestId: string): Promise<string> {
  if (!isInvitationProof(proof)) throw new Error('invalid_invitation')
  const { data, error } = await rpcClient.rpc('accept_invitation', {
    invitation_proof: proof,
    continuation_context: {},
    request_id: requestId,
  })
  if (error) {
    if (error.message === 'already_member') throw new Error('already_member')
    if (error.message === 'invalid_invitation' || error.message === 'not_authorized') {
      throw new Error('invalid_invitation')
    }
    throw new Error('acceptance_unavailable')
  }
  const result = object(data)
  if ((result?.outcome !== 'accepted' && result?.outcome !== 'already_completed')
    || result.request_id !== requestId || typeof result.group_id !== 'string') {
    throw new Error('acceptance_unavailable')
  }
  return result.group_id
}
