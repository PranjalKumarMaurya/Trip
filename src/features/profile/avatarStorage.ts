import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Profile photos live in the private `avatars` bucket under `<auth uid>/<uuid>.jpg`.
 * Only the person and people they share an active Trip with may read them, so
 * every photo is shown through a short-lived signed URL (cached per path).
 */
const bucket = 'avatars'
const signedForSeconds = 3600
const cache = new Map<string, { url: string; expiresAt: number }>()

export async function avatarUrl(path: string): Promise<string | null> {
  const hit = cache.get(path)
  if (hit && hit.expiresAt - Date.now() > 5 * 60_000) return hit.url
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, signedForSeconds)
  if (error || !data?.signedUrl) return null
  cache.set(path, { url: data.signedUrl, expiresAt: Date.now() + signedForSeconds * 1000 })
  return data.signedUrl
}

/** A displayable URL for a stored photo path, or null while loading / when unavailable. */
export function useAvatarUrl(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() => (path ? cache.get(path)?.url ?? null : null))
  useEffect(() => {
    if (!path) {
      setUrl(null)
      return
    }
    let active = true
    setUrl(cache.get(path)?.url ?? null)
    void avatarUrl(path).then((next) => { if (active) setUrl(next) })
    return () => { active = false }
  }, [path])
  return url
}

/** Signed URLs for several people's photos at once (e.g. a crew list), keyed by path. */
export function useAvatarUrls(paths: readonly (string | null | undefined)[]): Record<string, string> {
  const key = [...new Set(paths.filter((path): path is string => Boolean(path)))].sort().join('|')
  const [urls, setUrls] = useState<Record<string, string>>({})
  useEffect(() => {
    let active = true
    const wanted = key ? key.split('|') : []
    void Promise.all(wanted.map(async (path) => [path, await avatarUrl(path)] as const)).then((entries) => {
      if (active) setUrls(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => Boolean(entry[1]))))
    })
    return () => { active = false }
  }, [key])
  return urls
}

export class AvatarError extends Error {
  constructor(readonly code: 'unsupported_type' | 'too_large' | 'unreadable' | 'upload_failed' | 'remove_failed') {
    super(code)
  }
}

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
export const AVATAR_ACCEPT = acceptedTypes.join(',')

/**
 * Square-crop and shrink a picked photo to a small JPEG (at most 512px), so the
 * upload is tiny and the original file (and its location metadata) never leaves
 * the device.
 */
export async function prepareAvatar(file: File, size = 512): Promise<Blob> {
  if (!acceptedTypes.includes(file.type)) throw new AvatarError('unsupported_type')
  if (file.size > 15 * 1024 * 1024) throw new AvatarError('too_large')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new AvatarError('unreadable')
  }
  const side = Math.min(bitmap.width, bitmap.height)
  const target = Math.min(size, side)
  const canvas = document.createElement('canvas')
  canvas.width = target
  canvas.height = target
  const context = canvas.getContext('2d')
  if (!context) throw new AvatarError('unreadable')
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, target, target)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
  if (!blob) throw new AvatarError('unreadable')
  return blob
}

/** Upload a prepared photo into the person's own folder; returns its path. */
export async function uploadAvatar(userId: string, photo: Blob): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(bucket).upload(path, photo, { contentType: 'image/jpeg', upsert: false, cacheControl: '3600' })
  if (error) throw new AvatarError('upload_failed')
  return path
}

export async function removeAvatars(paths: readonly string[]): Promise<void> {
  if (!paths.length) return
  const { error } = await supabase.storage.from(bucket).remove([...paths])
  if (error) throw new AvatarError('remove_failed')
  for (const path of paths) cache.delete(path)
}

/** Every photo object in the person's own folder (for replacing or deleting the account). */
export async function listMyAvatars(userId: string): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(userId, { limit: 100 })
  if (error || !Array.isArray(data)) throw new AvatarError('remove_failed')
  return data.filter((entry) => entry.name && entry.id).map((entry) => `${userId}/${entry.name}`)
}
