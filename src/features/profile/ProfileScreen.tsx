import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import { Field } from '../../components/ui/Field'
import { IconBack, IconCamera, IconChevronRight, IconSignOut } from '../../components/ui/icons'
import { NeonBtn } from '../../components/ui/NeonBtn'
import { NeonInput } from '../../components/ui/NeonInput'
import { NeonSelect } from '../../components/ui/NeonSelect'
import { ScreenFrame } from '../../components/ui/ScreenFrame'
import { Sheet } from '../../components/ui/Sheet'
import { UserAvatar } from '../../components/ui/UserAvatar'
import { TRIP_CURRENCIES, currencyName } from '../onboarding/tripSettings'
import {
  AccountRequestError, accountErrorMessage, changeEmail, changePassword, deleteMyAccount, loadDeletionBlockers,
} from './accountApi'
import { APP_VERSION, SUPPORT_EMAIL, supportMailto } from './appInfo'
import { AVATAR_ACCEPT, AvatarError, prepareAvatar, removeAvatars, uploadAvatar, useAvatarUrl } from './avatarStorage'
import { LegalPage } from './LegalPage'
import { type MyProfile, ProfileRequestError, updateMyProfile } from './profileApi'
import {
  AVATAR_EMOJI, DIETARY_NOTES_MAX, EMERGENCY_CONTACT_MAX, type ProfileField, type ProfileFormValues, emailError,
  newPasswordError, profileChanges, validateProfileForm,
} from './profileRules'

const inputStyle = { fontSize: 16, minHeight: 44 } as const

type Page = 'main' | 'privacy' | 'terms'
type SheetKind = 'email' | 'password' | 'delete' | null

/**
 * The person's own profile: avatar, name, home currency, UPI ID and crew info,
 * sign-in details, help, legal pages, sign out and account deletion.
 */
export function ProfileScreen({ userId, email, profile, profileStatus, onProfileChanged, onReload, onBack, backLabel, onSignOut, signOutError, onAccountDeleted }: {
  userId: string
  email: string | undefined
  profile: MyProfile | null
  profileStatus: 'idle' | 'loading' | 'ready' | 'error'
  /** Apply a saved change to the shared profile state. */
  onProfileChanged: (changes: Partial<MyProfile>) => void
  onReload: () => void
  onBack: () => void
  /** Where Back goes: "Trips" or the open Trip's name. */
  backLabel: string
  onSignOut: () => void
  signOutError: string | null
  onAccountDeleted: () => void
}) {
  const [page, setPage] = useState<Page>('main')
  const [sheet, setSheet] = useState<SheetKind>(null)
  const top = <button type="button" className="text-link" onClick={onBack}><IconBack size={18} />{backLabel}</button>

  if (page !== 'main') return <LegalPage kind={page} onBack={() => setPage('main')} />

  if (!profile) {
    return (
      <ScreenFrame testId="profile-screen" title="Profile" top={top} busy={profileStatus !== 'error'}
        lede={profileStatus === 'error' ? 'We couldn’t load your profile. Check your connection and try again.' : 'Loading your profile…'}>
        {profileStatus === 'error'
          ? <NeonBtn type="button" size="lg" className="w-full" onClick={onReload}>Try again</NeonBtn>
          : <span className="spinner" aria-hidden="true" />}
      </ScreenFrame>
    )
  }

  return (
    <ScreenFrame testId="profile-screen" centered={false} eyebrow={<p className="eyebrow">Profile</p>}
      title={profile.displayName} lede={email} top={top}>
      <div className="flex flex-col gap-8">
        <AvatarEditor userId={userId} profile={profile} onChanged={onProfileChanged} />
        <DetailsForm profile={profile} onChanged={onProfileChanged} />

        <section aria-labelledby="profile-sign-in" className="flex flex-col gap-3">
          <h2 id="profile-sign-in" className="section-title">Sign-in</h2>
          <div className="surface px-4 py-3">
            <p className="field-label">Email</p>
            <p className="mt-0.5 truncate" style={{ color: 'var(--text-primary)', fontSize: 15 }} data-testid="profile-email">{email}</p>
          </div>
          <NeonBtn type="button" variant="outline" size="lg" className="w-full" onClick={() => setSheet('email')}>Change email</NeonBtn>
          <NeonBtn type="button" variant="outline" size="lg" className="w-full" onClick={() => setSheet('password')}>Change password</NeonBtn>
        </section>

        <section aria-labelledby="profile-help" className="flex flex-col gap-2">
          <h2 id="profile-help" className="section-title mb-1">Help & legal</h2>
          {SUPPORT_EMAIL && <a className="row-btn" href={supportMailto(SUPPORT_EMAIL)}>
            <span className="flex-1">Help & feedback</span><IconChevronRight size={18} />
          </a>}
          <button type="button" className="row-btn" onClick={() => setPage('privacy')}><span className="flex-1">Privacy policy</span><IconChevronRight size={18} /></button>
          <button type="button" className="row-btn" onClick={() => setPage('terms')}><span className="flex-1">Terms of use</span><IconChevronRight size={18} /></button>
        </section>

        <section aria-label="Account" className="flex flex-col gap-3">
          {signOutError && <p role="alert" className="notice notice--error">{signOutError}</p>}
          <NeonBtn type="button" variant="outline" size="lg" className="w-full" onClick={onSignOut}><IconSignOut size={18} />Sign out</NeonBtn>
          <button type="button" className="row-btn row-btn--danger justify-center" onClick={() => setSheet('delete')}>Delete account</button>
          <p className="text-center" style={{ color: 'var(--text-tertiary)', fontSize: 12 }} data-testid="app-version">Version {APP_VERSION}</p>
        </section>
      </div>

      {sheet === 'email' && <ChangeEmailSheet currentEmail={email} onClose={() => setSheet(null)} />}
      {sheet === 'password' && email && <ChangePasswordSheet email={email} onClose={() => setSheet(null)} />}
      {sheet === 'delete' && <DeleteAccountSheet userId={userId} onClose={() => setSheet(null)} onDeleted={onAccountDeleted} />}
    </ScreenFrame>
  )
}

function avatarErrorMessage(code: string): string {
  if (code === 'unsupported_type') return 'Choose a JPEG, PNG or WebP photo.'
  if (code === 'too_large') return 'That photo is too large. Choose one under 15 MB.'
  if (code === 'unreadable') return 'We couldn’t read that photo. Try another one.'
  return 'We couldn’t save your photo. Check your connection and try again.'
}

function AvatarEditor({ userId, profile, onChanged }: { userId: string; profile: MyProfile; onChanged: (changes: Partial<MyProfile>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const photo = useAvatarUrl(profile.avatarPath)
  const [busy, setBusy] = useState<'photo' | 'emoji' | null>(null)
  const [message, setMessage] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)

  const choosePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy('photo')
    setMessage(null)
    let uploaded: string | null = null
    try {
      uploaded = await uploadAvatar(userId, await prepareAvatar(file))
      await updateMyProfile(profile.id, { avatar_path: uploaded })
      const previous = profile.avatarPath
      onChanged({ avatarPath: uploaded })
      if (previous) await removeAvatars([previous]).catch(() => undefined)
      setMessage({ tone: 'info', text: 'Photo updated.' })
    } catch (error) {
      if (uploaded) await removeAvatars([uploaded]).catch(() => undefined)
      setMessage({ tone: 'error', text: avatarErrorMessage(error instanceof AvatarError ? error.code : 'upload_failed') })
    } finally {
      setBusy(null)
    }
  }

  const removePhoto = async () => {
    if (!profile.avatarPath) return
    setBusy('photo')
    setMessage(null)
    try {
      await updateMyProfile(profile.id, { avatar_path: null })
      const previous = profile.avatarPath
      onChanged({ avatarPath: null })
      await removeAvatars([previous]).catch(() => undefined)
      setMessage({ tone: 'info', text: 'Photo removed.' })
    } catch {
      setMessage({ tone: 'error', text: avatarErrorMessage('remove_failed') })
    } finally {
      setBusy(null)
    }
  }

  // Picking an emoji replaces the photo, so what friends see matches what you picked.
  const chooseEmoji = async (emoji: string) => {
    setBusy('emoji')
    setMessage(null)
    try {
      const previous = profile.avatarPath
      await updateMyProfile(profile.id, { avatar_emoji: emoji, avatar_path: null })
      onChanged({ avatarEmoji: emoji, avatarPath: null })
      if (previous) await removeAvatars([previous]).catch(() => undefined)
    } catch {
      setMessage({ tone: 'error', text: 'We couldn’t save that. Check your connection and try again.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <section aria-labelledby="profile-avatar" className="surface px-4 py-5" data-testid="avatar-editor">
      <h2 id="profile-avatar" className="section-title">Avatar</h2>
      <div className="mt-4 flex items-center gap-4">
        <UserAvatar size={76} name={profile.displayName} emoji={profile.avatarEmoji} imageUrl={photo} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input ref={fileRef} type="file" accept={AVATAR_ACCEPT} className="sr-only" aria-label="Profile photo file"
            tabIndex={-1} onChange={(event) => void choosePhoto(event)} />
          <NeonBtn type="button" variant="outline" size="lg" disabled={busy !== null} onClick={() => fileRef.current?.click()}>
            <IconCamera size={18} />{busy === 'photo' ? 'Saving…' : profile.avatarPath ? 'Change photo' : 'Add photo'}
          </NeonBtn>
          {profile.avatarPath && <button type="button" className="text-link self-start" disabled={busy !== null} onClick={() => void removePhoto()}>Remove photo</button>}
        </div>
      </div>
      <p className="mt-5 field-label">Or pick an emoji</p>
      <div className="emoji-grid mt-2" role="group" aria-label="Avatar emoji">
        {AVATAR_EMOJI.map((emoji) => {
          const chosen = !profile.avatarPath && profile.avatarEmoji === emoji
          return (
            <button key={emoji} type="button" className="emoji-option" aria-pressed={chosen} aria-label={`Use ${emoji} as your avatar`}
              disabled={busy !== null} onClick={() => void chooseEmoji(emoji)}>{emoji}</button>
          )
        })}
      </div>
      {message && <p role={message.tone === 'error' ? 'alert' : 'status'} className={`notice mt-4${message.tone === 'error' ? ' notice--error' : ''}`}>{message.text}</p>}
    </section>
  )
}

const formFrom = (profile: MyProfile): ProfileFormValues => ({
  displayName: profile.displayName,
  homeCurrency: profile.homeCurrency ?? '',
  upiId: profile.upiId ?? '',
  phone: profile.phone ?? '',
  emergencyContact: profile.emergencyContact ?? '',
  dietaryNotes: profile.dietaryNotes ?? '',
})

function DetailsForm({ profile, onChanged }: { profile: MyProfile; onChanged: (changes: Partial<MyProfile>) => void }) {
  const [form, setForm] = useState<ProfileFormValues>(() => formFrom(profile))
  const [attempted, setAttempted] = useState(false)
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const errors = validateProfileForm(form)
  const show = (field: ProfileField) => (attempted ? errors[field] : undefined)
  const dirty = JSON.stringify(form) !== JSON.stringify(formFrom(profile))
  const set = (field: ProfileField) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    if (state !== 'saving') setState('idle')
  }
  const currencies = profile.homeCurrency && !TRIP_CURRENCIES.includes(profile.homeCurrency)
    ? [profile.homeCurrency, ...TRIP_CURRENCIES] : TRIP_CURRENCIES

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (state === 'saving') return
    setAttempted(true)
    if (Object.keys(errors).length) return
    setState('saving')
    const changes = profileChanges(form)
    try {
      await updateMyProfile(profile.id, changes)
      onChanged({
        displayName: changes.display_name, homeCurrency: changes.home_currency, upiId: changes.upi_id, phone: changes.phone,
        emergencyContact: changes.emergency_contact, dietaryNotes: changes.dietary_notes,
      })
      setState('saved')
    } catch (error) {
      setState('failed')
      if (error instanceof ProfileRequestError && error.code === 'invalid_value') setAttempted(true)
    }
  }

  return (
    <form aria-label="Your details" noValidate onSubmit={(event) => void save(event)} className="flex flex-col gap-5" aria-busy={state === 'saving'}>
      <h2 className="section-title">Your details</h2>
      <Field id="profile-name" label="Display name" hint="How you appear to everyone in your Trips." error={show('displayName')}>
        <NeonInput value={form.displayName} onChange={set('displayName')} autoComplete="name" maxLength={80} style={inputStyle} />
      </Field>
      <Field id="profile-currency" label="Home currency" optional hint="New domestic Trips use it as their currency." error={show('homeCurrency')}>
        <NeonSelect value={form.homeCurrency} onChange={set('homeCurrency')}>
          <option value="">Not set</option>
          {currencies.map((code) => <option key={code} value={code}>{code} · {currencyName(code)}</option>)}
        </NeonSelect>
      </Field>
      <Field id="profile-upi" label="UPI ID" optional hint="Friends can pay you from Split" error={show('upiId')}>
        <NeonInput value={form.upiId} onChange={set('upiId')} placeholder="name@okbank" autoComplete="off" autoCapitalize="off" spellCheck={false} style={inputStyle} />
      </Field>

      <fieldset className="surface flex flex-col gap-4 px-4 py-4">
        <legend className="sr-only">Crew info</legend>
        <div>
          <p aria-hidden="true" style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 500 }}>Crew info</p>
          <p className="field-hint mt-0.5">Visible only to people in your Trips</p>
        </div>
        <Field id="profile-phone" label="Phone" optional error={show('phone')}>
          <NeonInput type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="e.g. +91 98765 43210" style={inputStyle} />
        </Field>
        <Field id="profile-emergency" label="Emergency contact" optional error={show('emergencyContact')}>
          <NeonInput value={form.emergencyContact} onChange={set('emergencyContact')} maxLength={EMERGENCY_CONTACT_MAX} placeholder="Name and phone number" autoComplete="off" style={inputStyle} />
        </Field>
        <Field id="profile-dietary" label="Dietary needs or allergies" optional error={show('dietaryNotes')}>
          <textarea className="field-textarea" value={form.dietaryNotes} onChange={set('dietaryNotes')} maxLength={DIETARY_NOTES_MAX} placeholder="e.g. Vegetarian, nut allergy" />
        </Field>
      </fieldset>

      {attempted && Object.keys(errors).length > 0 && <p role="alert" className="notice notice--error">Check the highlighted fields.</p>}
      {state === 'failed' && <p role="alert" className="notice notice--error">We couldn’t save your details. Check your connection and try again.</p>}
      {state === 'saved' && !dirty && <p role="status" className="notice">Saved.</p>}
      <NeonBtn type="submit" size="lg" className="w-full" disabled={state === 'saving' || (!dirty && state !== 'failed')}>
        {state === 'saving' ? 'Saving…' : 'Save details'}
      </NeonBtn>
    </form>
  )
}

function ChangeEmailSheet({ currentEmail, onClose }: { currentEmail: string | undefined; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'sending' | 'pending' | 'changed'>('idle')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const problem = emailError(email, currentEmail)
    setError(problem)
    if (problem || state === 'sending') return
    setState('sending')
    try {
      setState(await changeEmail(email))
    } catch (failure) {
      setState('idle')
      setError(failure instanceof AccountRequestError && failure.code === 'email_unavailable'
        ? 'That email address can’t be used. Try another one.'
        : 'We couldn’t start the change. Check your connection and try again.')
    }
  }

  return (
    <Sheet title="Change email" testId="change-email-sheet" onClose={onClose}>
      {state === 'pending' || state === 'changed' ? (
        <div className="flex flex-col gap-4">
          <p role="status" className="notice">{state === 'changed'
            ? `Your sign-in email is now ${email.trim()}.`
            : `We sent a confirmation link to ${email.trim()}. Your sign-in email changes only after you open it. If an email also arrives at ${currentEmail ?? 'your current address'}, confirm that one too. Until then, keep signing in with ${currentEmail ?? 'your current email'}.`}</p>
          <NeonBtn type="button" size="lg" className="w-full" onClick={onClose}>Done</NeonBtn>
        </div>
      ) : (
        <form aria-label="Change email" noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
            We’ll email a confirmation link to the new address. Nothing changes until you open it.
          </p>
          <Field id="new-email" label="New email" error={error ?? undefined}>
            <NeonInput type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(null) }}
              autoComplete="email" inputMode="email" placeholder="you@example.com" style={inputStyle} />
          </Field>
          <NeonBtn type="submit" size="lg" className="w-full" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send confirmation link'}</NeonBtn>
        </form>
      )}
    </Sheet>
  )
}

function ChangePasswordSheet({ email, onClose }: { email: string; onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<{ field: 'current' | 'next' | 'form'; text: string } | null>(null)
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (state === 'saving') return
    if (!current) return setError({ field: 'current', text: 'Enter your current password.' })
    const problem = newPasswordError(next, confirmation)
    if (problem) return setError({ field: 'next', text: problem })
    setError(null)
    setState('saving')
    try {
      await changePassword(email, current, next)
      setState('done')
    } catch (failure) {
      setState('idle')
      const code = failure instanceof AccountRequestError ? failure.code : 'password_failed'
      setError(code === 'wrong_password' ? { field: 'current', text: 'That’s not your current password.' }
        : code === 'same_password' ? { field: 'next', text: 'Choose a password different from your current one.' }
          : code === 'weak_password' ? { field: 'next', text: 'Choose a stronger password.' }
            : { field: 'form', text: 'We couldn’t change your password. Check your connection and try again.' })
    }
  }

  return (
    <Sheet title="Change password" testId="change-password-sheet" onClose={onClose}>
      {state === 'done' ? (
        <div className="flex flex-col gap-4">
          <p role="status" className="notice">Password changed. Use it the next time you sign in.</p>
          <NeonBtn type="button" size="lg" className="w-full" onClick={onClose}>Done</NeonBtn>
        </div>
      ) : (
        <form aria-label="Change password" noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
          <Field id="current-password" label="Current password" error={error?.field === 'current' ? error.text : undefined}>
            <NeonInput type="password" value={current} onChange={(event) => setCurrent(event.target.value)} autoComplete="current-password" style={inputStyle} />
          </Field>
          <Field id="new-password" label="New password" hint="At least 8 characters." error={error?.field === 'next' ? error.text : undefined}>
            <NeonInput type="password" value={next} onChange={(event) => setNext(event.target.value)} autoComplete="new-password" style={inputStyle} />
          </Field>
          <Field id="confirm-new-password" label="Confirm new password">
            <NeonInput type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" style={inputStyle} />
          </Field>
          {error?.field === 'form' && <p role="alert" className="notice notice--error">{error.text}</p>}
          <NeonBtn type="submit" size="lg" className="w-full" disabled={state === 'saving'}>{state === 'saving' ? 'Checking…' : 'Change password'}</NeonBtn>
        </form>
      )}
    </Sheet>
  )
}

function DeleteAccountSheet({ userId, onClose, onDeleted }: { userId: string; onClose: () => void; onDeleted: () => void }) {
  const [blockers, setBlockers] = useState<{ groupId: string; tripName: string }[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [typed, setTyped] = useState('')
  const [state, setState] = useState<'idle' | 'deleting'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setLoadFailed(false)
    void loadDeletionBlockers().then((rows) => { if (active) setBlockers(rows) }, () => { if (active) setLoadFailed(true) })
    return () => { active = false }
  }, [attempt])

  const confirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (typed !== 'DELETE' || state === 'deleting') return
    setState('deleting')
    setError(null)
    try {
      await deleteMyAccount(userId)
      onDeleted()
    } catch (failure) {
      const code = failure instanceof AccountRequestError ? failure.code : 'operation_failed'
      setState('idle')
      if (code === 'last_owner') setAttempt((value) => value + 1)
      setError(accountErrorMessage(code))
    }
  }

  return (
    <Sheet title="Delete account" testId="delete-account-sheet" onClose={() => { if (state !== 'deleting') onClose() }}>
      {loadFailed ? (
        <div className="flex flex-col gap-4">
          <p role="alert" className="notice notice--error">We couldn’t check your Trips. Check your connection and try again.</p>
          <NeonBtn type="button" size="lg" className="w-full" onClick={() => setAttempt((value) => value + 1)}>Try again</NeonBtn>
        </div>
      ) : blockers === null ? (
        <p role="status" className="flex items-center gap-3 py-4" style={{ color: 'var(--text-secondary)', fontSize: 14 }}><span className="spinner" aria-hidden="true" />Checking your Trips…</p>
      ) : blockers.length > 0 ? (
        <div className="flex flex-col gap-4" data-testid="delete-account-blocked">
          <p style={{ color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.5 }}>
            You’re the only Owner of {blockers.length === 1 ? 'this Trip' : 'these Trips'}. Make someone else an Owner in the Crew tab, or archive the Trip, before you delete your account.
          </p>
          <ul className="flex flex-col gap-2" aria-label="Trips that need another Owner">
            {blockers.map((trip) => <li key={trip.groupId} className="surface px-4 py-3" style={{ fontSize: 15 }}>{trip.tripName}</li>)}
          </ul>
          <NeonBtn type="button" size="lg" className="w-full" onClick={onClose}>OK</NeonBtn>
        </div>
      ) : (
        <form aria-label="Delete account" noValidate onSubmit={(event) => void confirm(event)} className="flex flex-col gap-4">
          <p style={{ color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.5 }}>
            This permanently deletes your account, profile and photo, and you leave every Trip. Plans, expenses and payments you added stay for the others and show as “a former member”. This can’t be undone.
          </p>
          <Field id="delete-confirm" label="Type DELETE to confirm">
            <NeonInput value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} style={inputStyle} />
          </Field>
          {error && <p role="alert" className="notice notice--error">{error}</p>}
          <NeonBtn type="submit" size="lg" className="w-full" color="var(--neon-pink)" disabled={typed !== 'DELETE' || state === 'deleting'}>
            {state === 'deleting' ? 'Deleting…' : 'Delete my account'}
          </NeonBtn>
          <NeonBtn type="button" variant="ghost" size="lg" className="w-full" disabled={state === 'deleting'} onClick={onClose}>Keep my account</NeonBtn>
        </form>
      )}
    </Sheet>
  )
}
