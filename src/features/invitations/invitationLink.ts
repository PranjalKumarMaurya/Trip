const storageKey = 'trip:pending-invitation:v1'
const proofPattern = /^[0-9a-f]{64}$/
const maxAgeMs = 7 * 24 * 60 * 60 * 1000

export function isInvitationProof(value: unknown): value is string {
  return typeof value === 'string' && proofPattern.test(value)
}

export function invitationShareUrl(baseUrl: string, proof: string): string {
  if (!isInvitationProof(proof)) throw new Error('invalid_invitation_proof')
  const url = new URL(baseUrl)
  url.search = ''
  url.hash = `invite=${proof}`
  return url.toString()
}

export function pendingInvitationFromBrowser(
  hash: string,
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null,
  now = Date.now(),
): { proof: string | null; consumedHash: boolean } {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash
  if (fragment.startsWith('invite=')) {
    const proof = fragment.slice('invite='.length)
    if (!isInvitationProof(proof)) {
      clearPendingInvitation(storage)
      return { proof: null, consumedHash: true }
    }
    try {
      storage?.setItem(storageKey, JSON.stringify({ proof, savedAt: now }))
    } catch { /* the current tab can still use the link */ }
    return { proof, consumedHash: true }
  }

  try {
    const stored = storage?.getItem(storageKey)
    if (!stored) return { proof: null, consumedHash: false }
    const record: unknown = JSON.parse(stored)
    if (typeof record === 'object' && record !== null
      && 'proof' in record && isInvitationProof(record.proof)
      && 'savedAt' in record && typeof record.savedAt === 'number'
      && record.savedAt <= now && now - record.savedAt <= maxAgeMs) {
      return { proof: record.proof, consumedHash: false }
    }
    storage?.removeItem(storageKey)
  } catch { /* treat unavailable or corrupt storage as empty */ }
  return { proof: null, consumedHash: false }
}

export function clearPendingInvitation(storage: Pick<Storage, 'removeItem'> | null): void {
  try { storage?.removeItem(storageKey) } catch { /* already unavailable */ }
}
