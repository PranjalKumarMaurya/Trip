import { IconBack } from '../../components/ui/icons'
import { ScreenFrame } from '../../components/ui/ScreenFrame'

/**
 * In-app Privacy policy and Terms. The wording below is a PLACEHOLDER for the
 * product owner to replace with reviewed text before launch.
 */
const pages = {
  privacy: {
    title: 'Privacy policy',
    sections: [
      ['What we keep', 'Your account email, the name and photo you choose, and what you add to your Trips: plans, todos, expenses, documents and crew info.'],
      ['Who sees it', 'Only people in the same Trip see what you add to it. Your phone, emergency contact and dietary notes are visible only to people in your Trips.'],
      ['Deleting your data', 'You can delete your account from Profile. Your profile and photo are removed; what you added to a Trip stays for the others and shows as a former member.'],
      ['Contact', 'Questions about your data go to the support address in Help & feedback.'],
    ],
  },
  terms: {
    title: 'Terms of use',
    sections: [
      ['Using the app', 'Trip helps friends plan a trip together. Use it for trips you are part of, and only add things you are allowed to share.'],
      ['Money', 'Split shows who owes whom. It records payments you make outside the app; it does not move money.'],
      ['Exchange rates', 'Rates are references only. Check the rate you were actually charged.'],
      ['Changes', 'We may update these terms. We will tell you in the app when we do.'],
    ],
  },
} as const

export function LegalPage({ kind, onBack }: { kind: keyof typeof pages; onBack: () => void }) {
  const page = pages[kind]
  return (
    <ScreenFrame testId={`legal-${kind}`} centered={false} eyebrow={<p className="eyebrow">Profile</p>} title={page.title}
      top={<button type="button" className="topbar-btn topbar-btn--back" onClick={onBack}><IconBack size={18} />Profile</button>}>
      <p role="note" className="notice notice--error mb-6" data-testid="legal-placeholder">
        Placeholder text — the owner will replace this page with the final {page.title.toLowerCase()} before launch.
      </p>
      <div className="flex flex-col gap-6">
        {page.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2 className="serif-display" style={{ fontSize: 20, color: 'var(--text-primary)' }}>{heading}</h2>
            <p className="mt-2" style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.55 }}>{body}</p>
          </section>
        ))}
      </div>
    </ScreenFrame>
  )
}
