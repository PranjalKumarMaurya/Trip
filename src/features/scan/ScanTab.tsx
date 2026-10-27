import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NeonBtn } from '../../components/ui/NeonBtn'
import type { TripTabProps } from '../workspace/tripTab'
import { emptyDraft, type TripContext } from '../../../supabase/functions/_shared/documentDraft.ts'
import { DraftReviewForm } from './DraftReviewForm'
import {
  ScanError, type TripDocument, addDocumentEvent, deleteTripDocument, listTripDocuments, parseTripDocument,
  signedDocumentUrl, storedDraft, uploadTripDocument,
} from './documentsApi'
import {
  FILE_PROBLEM_MESSAGES, type EventDraft, type EventInput, checkSelectedFile, fileKindLabel, formatBytes, parseFailureMessage,
} from './scanRules'

const ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif'

type Phase =
  | { kind: 'idle' }
  | { kind: 'uploading' }
  | { kind: 'parsing'; document: TripDocument }
  | { kind: 'review'; document: TripDocument; draft: EventDraft; notice: string | null; canRetry: boolean }

type ListState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; documents: TripDocument[] }

const UPLOAD_MESSAGES: Record<string, string> = {
  too_large: FILE_PROBLEM_MESSAGES.too_large,
  unsupported: FILE_PROBLEM_MESSAGES.unsupported,
  upload_failed: 'The upload did not finish. Nothing was saved. Check your connection and try again.',
}

const DELETE_MESSAGES: Record<string, string> = {
  delete_denied: 'Only the person who uploaded this document or a Trip Owner can delete it.',
  delete_partial: 'The file was deleted, but its entry could not be removed. Try again.',
  delete_failed: 'The document could not be deleted. Try again.',
}

export function ScanTab({ trip, roster }: TripTabProps) {
  const tripContext = useMemo<TripContext>(() => ({
    timezone: trip.timezone, startDate: trip.startDate, endDate: trip.endDate, destination: trip.destination,
  }), [trip.timezone, trip.startDate, trip.endDate, trip.destination])
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [list, setList] = useState<ListState>({ kind: 'loading' })
  const [reloadCount, setReloadCount] = useState(0)
  const reload = useCallback(() => setReloadCount((value) => value + 1), [])

  useEffect(() => {
    let active = true
    listTripDocuments(trip.groupId)
      .then((documents) => { if (active) setList({ kind: 'ready', documents }) })
      .catch(() => { if (active) setList((current) => current.kind === 'ready' ? current : { kind: 'error' }) })
    return () => { active = false }
  }, [trip.groupId, reloadCount])

  const names = useMemo(() => new Map(roster.map((member) => [member.groupMemberId, member.displayName])), [roster])
  const busy = phase.kind === 'uploading' || phase.kind === 'parsing'

  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0]
    // A cancelled chooser keeps the previous selection.
    if (!next) return
    setMessage(null)
    const problem = checkSelectedFile(next)
    setFileError(problem ? FILE_PROBLEM_MESSAGES[problem] : null)
    setFile(problem ? null : next)
    if (problem && inputRef.current) inputRef.current.value = ''
  }

  const clearFile = () => {
    setFile(null)
    setFileError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const read = async (document: TripDocument) => {
    setPhase({ kind: 'parsing', document })
    const outcome = await parseTripDocument(document.id, tripContext)
    if (outcome.ok) {
      setPhase({ kind: 'review', document, draft: outcome.draft, notice: null, canRetry: false })
    } else {
      setPhase({ kind: 'review', document, draft: emptyDraft(tripContext), notice: parseFailureMessage(outcome.code), canRetry: outcome.code === 'network' || outcome.code === 'parse_failed' || outcome.code === 'unknown' })
    }
    reload()
  }

  const uploadAndRead = async () => {
    if (!file || busy) return
    setMessage(null)
    setSaveError(null)
    setPhase({ kind: 'uploading' })
    let document: TripDocument
    try {
      document = await uploadTripDocument(trip.groupId, trip.groupMemberId, file)
    } catch (error) {
      setFileError(UPLOAD_MESSAGES[error instanceof ScanError ? error.message : ''] ?? UPLOAD_MESSAGES.upload_failed)
      setPhase({ kind: 'idle' })
      return
    }
    clearFile()
    reload()
    await read(document)
  }

  const review = (document: TripDocument) => {
    setMessage(null)
    setSaveError(null)
    const draft = storedDraft(document, tripContext)
    if (draft) setPhase({ kind: 'review', document, draft, notice: null, canRetry: true })
    else void read(document)
  }

  const addToItinerary = async (input: EventInput) => {
    if (phase.kind !== 'review') return
    setSaving(true)
    setSaveError(null)
    try {
      await addDocumentEvent(phase.document.id, input)
      setPhase({ kind: 'idle' })
      setMessage(`Added to the itinerary: ${input.title}`)
      reload()
    } catch (error) {
      setSaveError(error instanceof ScanError && error.message === 'document_unavailable'
        ? 'This document is already in the itinerary or is no longer available to you.'
        : 'We could not add this to the itinerary. Your details are still here; try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section data-testid="scan-tab" className="flex flex-col gap-6">
      <div className="surface px-4 py-5">
        <h2 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 25 }}>Scan</h2>
        <p className="mt-2" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Add a boarding pass, hotel voucher, or booking. Only members of this Trip can open it. You review the details before anything is added to the itinerary.
        </p>
        <label className="mt-5 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-7 text-center focus-within:ring-2 focus-within:ring-[#FF8B4D]"
          style={{ borderColor: 'var(--border-strong)', color: 'var(--text-secondary)', opacity: busy ? 0.5 : 1 }}>
          <span style={{ color: 'var(--text-primary)' }}>{file ? 'Choose a different file' : 'Choose a ticket or booking'}</span>
          <span className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.12em' }}>PDF · JPG · PNG · WEBP · HEIC · UP TO 10 MB</span>
          <input ref={inputRef} type="file" accept={ACCEPT} onChange={choose} disabled={busy} className="sr-only" aria-label="Ticket or booking file" />
        </label>
        {file && (
          <div data-testid="scan-selected-file" className="mt-3 flex items-center justify-between gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
            <span className="min-w-0 truncate">{file.name}</span>
            <span className="flex shrink-0 items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
              <span>{fileKindLabel(file.type)} · {formatBytes(file.size)}</span>
              <button type="button" onClick={clearFile} disabled={busy} style={{ color: 'var(--text-secondary)' }}>Remove</button>
            </span>
          </div>
        )}
        {fileError && <p role="alert" className="mt-3 text-sm" style={{ color: 'var(--accent)' }}>{fileError}</p>}
        <NeonBtn type="button" onClick={() => void uploadAndRead()} disabled={!file || busy} className="mt-4 w-full" style={{ opacity: !file || busy ? 0.5 : 1 }}>
          {phase.kind === 'uploading' ? 'Uploading…' : phase.kind === 'parsing' ? 'Reading…' : 'Upload and read'}
        </NeonBtn>
        {busy && <p role="status" className="mt-3 text-center font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.12em' }}>
          {phase.kind === 'uploading' ? 'UPLOADING PRIVATELY' : 'READING THE DOCUMENT'}
        </p>}
        {message && <p role="status" className="mt-3 text-sm" style={{ color: 'var(--accent)' }}>{message}</p>}
      </div>

      {phase.kind === 'review' && (
        <DraftReviewForm key={`${phase.document.id}-${phase.draft.startsAt ?? ''}-${phase.notice ?? ''}`} draft={phase.draft}
          fileName={phase.document.fileName} notice={phase.notice} tripTimezone={trip.timezone} saving={saving} saveError={saveError}
          onSubmit={(input) => void addToItinerary(input)} onCancel={() => setPhase({ kind: 'idle' })}
          onRetryRead={phase.canRetry ? () => void read(phase.document) : undefined} />
      )}

      <DocumentList state={list} names={names} trip={trip} disabled={busy || saving}
        onRetry={reload} onReview={review} onDeleted={(document) => {
          if (phase.kind === 'review' && phase.document.id === document.id) setPhase({ kind: 'idle' })
          setMessage(`Deleted ${document.fileName}`)
          reload()
        }} />
    </section>
  )
}

function DocumentList({ state, names, trip, disabled, onRetry, onReview, onDeleted }: {
  state: ListState
  names: Map<string, string>
  trip: TripTabProps['trip']
  disabled: boolean
  onRetry: () => void
  onReview: (document: TripDocument) => void
  onDeleted: (document: TripDocument) => void
}) {
  const dateFormat = useMemo(() => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: trip.timezone }), [trip.timezone])
  return (
    <section aria-labelledby="scan-documents-heading" className="surface px-4 py-5">
      <h2 id="scan-documents-heading" className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 22 }}>Trip documents</h2>
      {state.kind === 'loading' && <p role="status" className="mt-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading documents…</p>}
      {state.kind === 'error' && (
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <p role="alert" style={{ color: 'var(--text-secondary)' }}>We could not load this Trip’s documents.</p>
          <button type="button" onClick={onRetry} style={{ color: 'var(--accent)' }}>Retry</button>
        </div>
      )}
      {state.kind === 'ready' && state.documents.length === 0 && (
        <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>No documents yet. Tickets and vouchers you add appear here for the whole Trip.</p>
      )}
      {state.kind === 'ready' && state.documents.length > 0 && (
        <ul aria-label="Trip documents" className="mt-3 flex flex-col gap-2">
          {state.documents.map((document) => (
            <DocumentRow key={document.id} document={document} disabled={disabled}
              uploader={names.get(document.uploadedBy) ?? 'Former member'} date={dateFormat.format(new Date(document.createdAt))}
              canDelete={document.uploadedBy === trip.groupMemberId || trip.role === 'owner'}
              onReview={() => onReview(document)} onDeleted={() => onDeleted(document)} />
          ))}
        </ul>
      )}
    </section>
  )
}

function DocumentRow({ document, uploader, date, canDelete, disabled, onReview, onDeleted }: {
  document: TripDocument
  uploader: string
  date: string
  canDelete: boolean
  disabled: boolean
  onReview: () => void
  onDeleted: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [working, setWorking] = useState<'view' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)

  const view = async () => {
    setError(null)
    setFallbackUrl(null)
    // Open the tab inside the click so pop-up blockers allow it, then point it at the short-lived link.
    const opened = window.open('', '_blank')
    if (opened) opened.opener = null
    setWorking('view')
    try {
      const url = await signedDocumentUrl(document.storagePath)
      if (opened) opened.location.href = url
      else setFallbackUrl(url)
    } catch {
      opened?.close()
      setError('This document could not be opened. It may have been removed.')
    } finally {
      setWorking(null)
    }
  }

  const remove = async () => {
    setWorking('delete')
    setError(null)
    try {
      await deleteTripDocument(document)
      onDeleted()
    } catch (failure) {
      setError(DELETE_MESSAGES[failure instanceof ScanError ? failure.message : ''] ?? DELETE_MESSAGES.delete_failed)
      setConfirming(false)
    } finally {
      setWorking(null)
    }
  }

  const status = document.eventId
    ? `In itinerary${document.eventTitle ? `: ${document.eventTitle}` : ''}`
    : document.parseStatus === 'parsed' ? 'Ready to review' : document.parseStatus === 'failed' ? 'Needs details' : 'Not reviewed'

  return (
    <li data-testid="scan-document" className="rounded-md border px-3 py-3" style={{ borderColor: 'var(--border)' }}>
      <p className="truncate" style={{ color: 'var(--text-primary)' }} title={document.fileName}>{document.fileName}</p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>{fileKindLabel(document.mimeType)} · {formatBytes(document.sizeBytes)} · {uploader} · {date}</p>
      <p className="mt-1 text-xs" style={{ color: document.eventId ? 'var(--accent)' : 'var(--text-secondary)' }}>{status}</p>
      {confirming ? (
        <div role="group" aria-label={`Delete ${document.fileName}?`} className="mt-3 flex flex-col gap-2 text-sm">
          <p style={{ color: 'var(--text-secondary)' }}>Delete this document for everyone in the Trip? Itinerary entries made from it stay.</p>
          <div className="flex gap-4">
            <button type="button" onClick={() => void remove()} disabled={working !== null} style={{ color: 'var(--accent)' }}>{working === 'delete' ? 'Deleting…' : 'Delete document'}</button>
            <button type="button" onClick={() => setConfirming(false)} disabled={working !== null} style={{ color: 'var(--text-secondary)' }}>Keep</button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <button type="button" onClick={() => void view()} disabled={working !== null} aria-label={`View ${document.fileName}`} style={{ color: 'var(--accent)' }}>{working === 'view' ? 'Opening…' : 'View'}</button>
          {!document.eventId && <button type="button" onClick={onReview} disabled={disabled} aria-label={`Review ${document.fileName}`} style={{ color: 'var(--text-primary)' }}>Review</button>}
          {canDelete && <button type="button" onClick={() => setConfirming(true)} disabled={disabled} aria-label={`Delete ${document.fileName}`} style={{ color: 'var(--text-secondary)' }}>Delete</button>}
        </div>
      )}
      {fallbackUrl && <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm" style={{ color: 'var(--accent)' }}>Open {document.fileName} (link expires in a minute)</a>}
      {error && <p role="alert" className="mt-2 text-sm" style={{ color: 'var(--accent)' }}>{error}</p>}
    </li>
  )
}
