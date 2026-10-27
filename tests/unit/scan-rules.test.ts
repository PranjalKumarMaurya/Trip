import assert from 'node:assert/strict'
import test from 'node:test'

import { normaliseExtraction } from '../../supabase/functions/_shared/documentDraft.ts'
import {
  checkSelectedFile, documentPath, draftToForm, fileKindLabel, formToEventInput, formatBytes, storageFileName,
} from '../../src/features/scan/scanRules.ts'

const goa = { timezone: 'Asia/Kolkata', startDate: '2026-11-01', endDate: '2026-11-05' }

test('files are checked locally by reported type and size before upload', () => {
  assert.equal(checkSelectedFile({ name: 'pass.pdf', size: 2048, type: 'application/pdf' }), null)
  assert.equal(checkSelectedFile({ name: 'IMG_1.HEIC', size: 2048, type: 'image/heic' }), null)
  assert.equal(checkSelectedFile({ name: 'pass.pdf', size: 10 * 1024 * 1024 + 1, type: 'application/pdf' }), 'too_large')
  assert.equal(checkSelectedFile({ name: 'pass.pdf', size: 0, type: 'application/pdf' }), 'empty')
  assert.equal(checkSelectedFile({ name: 'notes.txt', size: 10, type: 'text/plain' }), 'unsupported')
  // The extension is never trusted.
  assert.equal(checkSelectedFile({ name: 'pass.pdf', size: 10, type: 'application/x-msdownload' }), 'unsupported')
  assert.equal(checkSelectedFile({ name: 'photo.heic', size: 10, type: '' }), 'unsupported')
})

test('object names are storage-safe and live under the Trip folder', () => {
  assert.equal(storageFileName('Boarding pass (DEL→GOI).PDF'), 'Boarding-pass-DEL-GOI.pdf')
  assert.equal(storageFileName('Crème brûlée voucher.jpeg'), 'Creme-brulee-voucher.jpeg')
  assert.equal(storageFileName('../../etc/passwd'), 'passwd')
  assert.equal(storageFileName('C:\\Users\\me\\ticket.pdf'), 'ticket.pdf')
  assert.equal(storageFileName('.pdf'), 'pdf')
  assert.equal(storageFileName('???'), 'document')
  assert.ok(storageFileName(`${'a'.repeat(300)}.png`).length <= 84)
  assert.equal(documentPath('g', 'o', 'a b.png'), 'g/o/a-b.png')
  assert.equal(formatBytes(512), '512 B')
  assert.equal(formatBytes(2048), '2 KB')
  assert.equal(formatBytes(3.5 * 1024 * 1024), '3.5 MB')
  assert.deepEqual(['application/pdf', 'image/jpeg', 'image/png', 'image/heif'].map(fileKindLabel), ['PDF', 'JPG', 'PNG', 'HEIC'])
})

test('a draft fills the review form in the zones printed on the ticket', () => {
  const draft = normaliseExtraction({
    event_type: 'flight', title: 'IndiGo 6E-123 · DEL → DPS', start_local: '2026-11-01T06:15', start_timezone: 'Asia/Kolkata',
    end_local: '2026-11-01T14:45', end_timezone: 'Asia/Makassar', dep_code: 'DEL', arr_code: 'DPS', flight_no: '6E-123',
  }, goa)
  const form = draftToForm(draft)
  assert.equal(form.startLocal, '2026-11-01T06:15')
  assert.equal(form.endLocal, '2026-11-01T14:45')
  assert.equal(form.endTimezone, 'Asia/Makassar')
  const { errors, input } = formToEventInput(form)
  assert.deepEqual(errors, {})
  assert.equal(input?.startsAt, '2026-11-01T00:45:00.000Z')
  assert.equal(input?.endsAt, '2026-11-01T06:45:00.000Z')
  assert.equal(input?.flightNo, '6E-123')
  assert.equal(input?.notes, null)
})

test('the review form requires a title and a valid start, and the end after it', () => {
  const blank = draftToForm(normaliseExtraction({}, goa))
  const empty = formToEventInput({ ...blank, title: '  ' })
  assert.equal(empty.input, null)
  assert.ok(empty.errors.title)
  assert.ok(empty.errors.startLocal)

  const base = { ...blank, title: 'Dinner', eventType: 'food' as const, startLocal: '2026-11-02T20:00' }
  assert.equal(formToEventInput({ ...base, startTimezone: 'Goa/Time' }).errors.startTimezone !== undefined, true)
  const backwards = formToEventInput({ ...base, endLocal: '2026-11-02T19:00', endTimezone: 'Asia/Kolkata' })
  assert.ok(backwards.errors.endLocal)
  const ok = formToEventInput({ ...base, depCode: 'xx', flightNo: '6E-1', location: ' Thalassa ' })
  assert.deepEqual(ok.errors, {})
  assert.equal(ok.input?.startsAt, '2026-11-02T14:30:00.000Z')
  assert.equal(ok.input?.location, 'Thalassa')
  // Flight-only fields are dropped for other types.
  assert.equal(ok.input?.depCode, null)
  assert.equal(ok.input?.flightNo, null)
  const badCode = formToEventInput({ ...base, eventType: 'flight', depCode: 'DELHI' })
  assert.ok(badCode.errors.depCode)
})
