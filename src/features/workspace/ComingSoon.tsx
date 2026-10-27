export function ComingSoon({ title, testId }: { title: string; testId: string }) {
  return (
    <section data-testid={testId} className="surface px-4 py-5">
      <h2 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 25 }}>{title}</h2>
      <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>This part of the Trip is being built.</p>
    </section>
  )
}
