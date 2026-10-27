// Pure Crew rules: error mapping, last-Owner pre-checks, and RPC result parsing.
// No imports with runtime effects, so node --test can load this file directly.
import type { RosterMember } from '../groups/useGroupRoster'

export type CrewErrorCode =
  | 'last_owner' | 'not_authorized' | 'invalid_target' | 'invalid_invitation'
  | 'idempotency_conflict' | 'unavailable'

export type CrewAction =
  | 'revoke' | 'promote' | 'demote' | 'step_down' | 'transfer' | 'remove'
  | 'leave' | 'archive' | 'restore'

export interface CrewErrorView {
  message: string
  /** Only transport-level failures are retried, always with the same request id. */
  retryable: boolean
}

export interface CrewViewer {
  groupMemberId: string
  role: 'owner' | 'member'
}

export type MemberActionKind = 'promote' | 'demote' | 'transfer' | 'remove'

export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired'

export interface InvitationRow {
  invitationId: string
  recipientEmail: string
  status: InvitationStatus
  expiresAt: string
  createdAt: string
}

export interface ArchivedTrip {
  groupId: string
  tripName: string
  destination: string
  startDate: string
  endDate: string
  archivedAt: string
}

const knownCodes: readonly string[] = ['last_owner', 'not_authorized', 'invalid_target',
  'invalid_invitation', 'idempotency_conflict']

/** Map a database error message (the RAISE text) to a Crew error code. */
export function crewErrorCode(message: unknown): CrewErrorCode {
  if (typeof message !== 'string') return 'unavailable'
  if (knownCodes.includes(message)) return message as CrewErrorCode
  // invalid_request means the session or arguments were missing: treat as not allowed.
  if (message === 'invalid_request') return 'not_authorized'
  return 'unavailable'
}

/** Read the code from anything thrown by crewApi (which throws `new Error(code)`). */
export function crewErrorCodeOf(error: unknown): CrewErrorCode {
  return crewErrorCode(error instanceof Error ? error.message : undefined)
}

export function crewErrorView(action: CrewAction, code: CrewErrorCode, name = 'This person'): CrewErrorView {
  switch (code) {
    case 'unavailable':
      return { message: 'We could not confirm this change. Retrying is safe: it will not be applied twice.', retryable: true }
    case 'idempotency_conflict':
      return { message: 'This request no longer matches what was sent. Close this and start again.', retryable: false }
    case 'invalid_invitation':
      return { message: 'This invitation no longer exists.', retryable: false }
    case 'invalid_target':
      if (action === 'leave') return { message: 'You are no longer an active member of this Trip.', retryable: false }
      return { message: `${name} is no longer an active member of this Trip. Nothing changed.`, retryable: false }
    case 'not_authorized':
      if (action === 'leave') return { message: 'You are no longer an active member of this Trip.', retryable: false }
      if (action === 'archive' || action === 'restore') {
        return { message: 'Only an active Owner of this Trip can do that. Nothing changed.', retryable: false }
      }
      return { message: 'Only an active Owner of this Trip can do that. Your role may have changed, so the crew list was refreshed.', retryable: false }
    case 'last_owner':
      switch (action) {
        case 'leave':
          return { message: 'You are the last Owner. Make another member an Owner, or transfer ownership, before you leave.', retryable: false }
        case 'step_down':
          return { message: 'You are the last Owner. Make another member an Owner first.', retryable: false }
        case 'demote':
          return { message: `${name} is the last Owner. Make another member an Owner first.`, retryable: false }
        case 'remove':
          return { message: `${name} is the last Owner and cannot be removed. Make another member an Owner first.`, retryable: false }
        default:
          return { message: 'This Trip must always keep an active Owner. Nothing changed.', retryable: false }
      }
  }
}

function activeMembers(roster: RosterMember[]) {
  return roster.filter((member) => member.status === 'active')
}

export function otherActiveOwners(viewer: CrewViewer, roster: RosterMember[]) {
  return activeMembers(roster).filter((member) => member.role === 'owner' && member.groupMemberId !== viewer.groupMemberId)
}

/**
 * Why the viewer cannot leave yet, or null when leaving may proceed. The server
 * re-checks; this only avoids a dead end. An unloaded roster (viewer missing)
 * never blocks, so the server stays the authority.
 */
export function leaveBlockReason(viewer: CrewViewer, roster: RosterMember[]): string | null {
  if (viewer.role !== 'owner') return null
  if (!activeMembers(roster).some((member) => member.groupMemberId === viewer.groupMemberId)) return null
  if (otherActiveOwners(viewer, roster).length > 0) return null
  const others = activeMembers(roster).filter((member) => member.groupMemberId !== viewer.groupMemberId)
  if (others.length === 0) {
    return 'You are the only member of this Trip, so it needs you as its Owner. Archive the Trip instead if you are done with it.'
  }
  return 'You are the only Owner. Use Manage next to a member to make them an Owner or transfer ownership, then leave.'
}

/** Step down keeps the viewer in the Trip; it is offered only while another Owner exists. */
export function canStepDown(viewer: CrewViewer, roster: RosterMember[]): boolean {
  return viewer.role === 'owner' && otherActiveOwners(viewer, roster).length > 0
}

/** Owner-only actions for another active member. Members get none (absent, not disabled). */
export function memberActionsFor(viewer: CrewViewer, target: RosterMember): MemberActionKind[] {
  if (viewer.role !== 'owner' || target.status !== 'active' || target.groupMemberId === viewer.groupMemberId) return []
  return target.role === 'member' ? ['promote', 'transfer', 'remove'] : ['demote', 'remove']
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

const invitationStatuses: readonly string[] = ['pending', 'accepted', 'revoked', 'expired']

/** Validate the list_group_invitations projection. Proofs are never part of it. */
export function parseInvitationList(data: unknown): { items: InvitationRow[]; liveCount: number } {
  const result = record(data)
  if (!result || !Array.isArray(result.items) || typeof result.live_count !== 'number') throw new Error('unavailable')
  const items = result.items.map((value) => {
    const item = record(value)
    if (!item || typeof item.invitation_id !== 'string' || typeof item.recipient_email !== 'string'
      || typeof item.status !== 'string' || !invitationStatuses.includes(item.status)
      || typeof item.expires_at !== 'string' || typeof item.created_at !== 'string') throw new Error('unavailable')
    return {
      invitationId: item.invitation_id,
      recipientEmail: item.recipient_email,
      status: item.status as InvitationStatus,
      expiresAt: item.expires_at,
      createdAt: item.created_at,
    }
  })
  return { items, liveCount: result.live_count }
}

export function splitInvitations(items: InvitationRow[]) {
  return {
    pending: items.filter((item) => item.status === 'pending'),
    past: items.filter((item) => item.status !== 'pending'),
  }
}

export function invitationStatusLabel(status: InvitationStatus): string {
  return { pending: 'Pending', accepted: 'Joined', revoked: 'Revoked', expired: 'Expired' }[status]
}

/**
 * Validate a lifecycle RPC result: it must echo our request id and report one
 * of the expected outcomes (or a completed replay of the same request).
 */
export function lifecycleOutcome<T extends string>(data: unknown, requestId: string, outcomes: readonly T[]): T | 'already_completed' {
  const result = record(data)
  const outcome = result?.outcome
  if (!result || result.request_id !== requestId || typeof outcome !== 'string') throw new Error('unavailable')
  if (outcome === 'already_completed') return outcome
  if (!(outcomes as readonly string[]).includes(outcome)) throw new Error('unavailable')
  return outcome as T
}

export function parseArchivedTrips(data: unknown): ArchivedTrip[] {
  if (!Array.isArray(data)) throw new Error('unavailable')
  return data.map((value) => {
    const row = record(value)
    if (!row || typeof row.group_id !== 'string' || typeof row.trip_name !== 'string'
      || typeof row.destination !== 'string' || typeof row.start_date !== 'string'
      || typeof row.end_date !== 'string' || typeof row.archived_at !== 'string') throw new Error('unavailable')
    return {
      groupId: row.group_id,
      tripName: row.trip_name,
      destination: row.destination,
      startDate: row.start_date,
      endDate: row.end_date,
      archivedAt: row.archived_at,
    }
  })
}

/** "8 Nov 2026" for a timestamp, in the viewer's zone unless one is given (tests pass UTC). */
export function formatDay(iso: string, timeZone?: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone }).format(date)
}

/** A calendar date such as a Trip start date ("2026-11-01"); never shifted by time zone. */
export function formatCalendarDate(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDay(`${value}T00:00:00Z`, 'UTC') : value
}

/** "8 Nov 2026, 14:30" for an expiry instant. */
export function formatInstant(iso: string, timeZone?: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone,
  }).format(date)
}
