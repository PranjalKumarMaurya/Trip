import { UserAvatar } from '../../components/ui/UserAvatar'
import { useAvatarUrl } from './avatarStorage'
import type { MyProfile } from './profileApi'

/** The person's own avatar as a 44px round button that opens Profile. */
export function ProfileButton({ profile, fallbackName, onOpen }: {
  profile: MyProfile | null
  fallbackName: string
  onOpen: () => void
}) {
  const photo = useAvatarUrl(profile?.avatarPath)
  return (
    <button type="button" className="round-btn round-btn--avatar" aria-label="Profile" onClick={onOpen}>
      <UserAvatar size={44} name={profile?.displayName || fallbackName} emoji={profile?.avatarEmoji} imageUrl={photo} />
    </button>
  )
}
