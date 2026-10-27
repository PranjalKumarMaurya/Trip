/**
 * A round avatar: the person's photo, else their emoji, else the first letter of
 * their name. Decorative: the surrounding control or text names the person.
 */
export function UserAvatar({ name, emoji, imageUrl, size = 40, className = '' }: {
  name: string
  emoji?: string | null
  imageUrl?: string | null
  size?: number
  className?: string
}) {
  const initial = (Array.from(name.trim())[0] ?? '?').toUpperCase()
  return (
    <span aria-hidden="true" className={`user-avatar ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * (imageUrl || !emoji ? 0.42 : 0.55)) }}>
      {imageUrl ? <img src={imageUrl} alt="" draggable={false} /> : emoji ? <span className="user-avatar__emoji">{emoji}</span> : initial}
    </span>
  )
}
