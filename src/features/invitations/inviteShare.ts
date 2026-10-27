// What an Owner sends with a one-time invitation link. Pure, so it runs under `node --test`.

export interface InviteShare {
  /** The whole message, link included (WhatsApp, plain text). */
  message: string
  /** For the Web Share API: the link travels separately in `url`, so `text` leaves it out. */
  share: { title: string; text: string; url: string }
  whatsAppUrl: string
}

export function inviteShare({ tripName, url, recipient }: { tripName?: string; url: string; recipient: string }): InviteShare {
  const name = tripName?.trim()
  const trip = name ? `our Trip “${name}”` : 'our Trip'
  const terms = `it’s for ${recipient} and works once.`
  const message = `Join ${trip}: ${url} — ${terms}`
  return {
    message,
    share: { title: name ? `Join ${name}` : 'Join our Trip', text: `Join ${trip} — ${terms}`, url },
    whatsAppUrl: `https://wa.me/?text=${encodeURIComponent(message)}`,
  }
}

/** True when the browser offers a native share sheet for this data. */
export function canNativeShare(nav: Partial<Pick<Navigator, 'share' | 'canShare'>> | undefined, data: ShareData): boolean {
  if (!nav || typeof nav.share !== 'function') return false
  try {
    return typeof nav.canShare === 'function' ? nav.canShare(data) : true
  } catch {
    return false
  }
}
