// Split ledger (migrations 040-041): exact sums, atomic writes, Trip isolation,
// creator/Owner edit rights, settlements, minor units, and FX snapshots.
import assert from 'node:assert/strict'
import { createLocalStack } from '../../support/local-stack.mjs'
import { createTrip, createUsers, quote, sqlAs } from '../../support/db-fixtures.mjs'

const stack = createLocalStack({ projectId: 'split-db', basePort: 58700 })
const tripA = 'c0000000-0000-4000-8000-00000000000a'
const tripB = 'c0000000-0000-4000-8000-00000000000b'
const tripYen = 'c0000000-0000-4000-8000-00000000000c'
const tripDinar = 'c0000000-0000-4000-8000-00000000000d'

const text = (value) => (value === null || value === undefined ? 'NULL' : quote(value))
const lines = (entries) => quote(JSON.stringify(entries.map(([memberId, amount]) => ({ member_id: memberId, amount }))))

function commitSql(groupId, {
  description = 'Dinner', category = 'food', amount, currency = 'INR', rate = null, source = null,
  method = 'exact', payers, shares, requestId = null,
}) {
  return `SELECT public.commit_expense(${quote(groupId)}, ${text(description)}, ${text(category)}, ${text(amount)},
    ${text(currency)}, ${text(rate)}, ${text(source)}, ${quote(method)}, ${lines(payers)}::jsonb, ${lines(shares)}::jsonb,
    ${requestId ? `${quote(requestId)}::uuid` : 'NULL'});`
}

function updateSql(expenseId, version, {
  description = 'Dinner', category = 'food', amount, currency = 'INR', rate = null, source = null,
  method = 'exact', payers, shares,
}) {
  return `SELECT public.update_expense(${quote(expenseId)}, ${version === null ? 'NULL' : version}, ${text(description)},
    ${text(category)}, ${text(amount)}, ${text(currency)}, ${text(rate)}, ${text(source)}, ${quote(method)},
    ${lines(payers)}::jsonb, ${lines(shares)}::jsonb);`
}

function settleSql(groupId, from, to, amount, { note = null, requestId = null } = {}) {
  return `SELECT public.record_settlement(${quote(groupId)}, ${quote(from)}, ${quote(to)}, ${text(amount)}, ${text(note)},
    ${requestId ? `${quote(requestId)}::uuid` : 'NULL'});`
}

const count = (table, groupId) => Number(stack.psql(`SELECT count(*) FROM public.${table} WHERE group_id = ${quote(groupId)};`))
const rows = (sql) => stack.psql(sql).split('\n').filter(Boolean).map((line) => line.split('|'))

function expectError(result, message, label) {
  assert.equal(result.ok, false, `${label}: expected failure`)
  if (message) assert.match(result.error, message, label)
}

try {
  stack.start()
  stack.migrate()
  const user = createUsers(stack, ['owner', 'ana', 'ben', 'cara', 'stranger'])
  const a = createTrip(stack, {
    groupId: tripA, name: 'Goa', currency: 'INR',
    members: { [user.owner]: 'owner', [user.ana]: 'member', [user.ben]: 'member', [user.cara]: 'member' },
  })
  const b = createTrip(stack, { groupId: tripB, name: 'Jaipur', currency: 'INR', members: { [user.owner]: 'owner', [user.ana]: 'member' } })
  const yen = createTrip(stack, { groupId: tripYen, name: 'Tokyo', currency: 'JPY', timezone: 'Asia/Tokyo', members: { [user.owner]: 'owner', [user.ana]: 'member', [user.ben]: 'member' } })
  const dinar = createTrip(stack, { groupId: tripDinar, name: 'Kuwait', currency: 'KWD', timezone: 'Asia/Kuwait', members: { [user.owner]: 'owner', [user.ana]: 'member', [user.ben]: 'member' } })
  const m = { owner: a.memberIds[user.owner], ana: a.memberIds[user.ana], ben: a.memberIds[user.ben], cara: a.memberIds[user.cara] }
  const sortedThree = [m.owner, m.ana, m.ben].sort()

  // Equal split of 100.00 among three: one extra paisa to the lowest member id.
  const equal = sqlAs(stack, user.ana, commitSql(tripA, {
    amount: '100.00', method: 'equal', payers: [[m.ana, '100.00']],
    shares: [[sortedThree[0], '33.34'], [sortedThree[1], '33.33'], [sortedThree[2], '33.33']],
  }))
  assert.equal(equal.ok, true, equal.error)
  const dinnerId = equal.rows[0][0]
  assert.deepEqual(rows(`SELECT group_member_id, amount FROM public.trip_expense_shares WHERE expense_id = ${quote(dinnerId)} ORDER BY group_member_id;`),
    [[sortedThree[0], '33.34'], [sortedThree[1], '33.33'], [sortedThree[2], '33.33']])
  assert.deepEqual(rows(`SELECT accounting_amount, accounting_currency, fx_rate IS NULL, created_by, version FROM public.trip_expenses WHERE id = ${quote(dinnerId)};`),
    [['100.00', 'INR', 't', m.ana, '1']])

  // "Equal" must follow the documented remainder rule exactly.
  expectError(sqlAs(stack, user.ana, commitSql(tripA, {
    amount: '100.00', method: 'equal', payers: [[m.ana, '100.00']],
    shares: [[sortedThree[0], '33.33'], [sortedThree[1], '33.33'], [sortedThree[2], '33.34']],
  })), /split_equal_mismatch/u, 'equal remainder order')

  // Sums must match exactly; a failure writes nothing at all.
  const before = count('trip_expenses', tripA)
  expectError(sqlAs(stack, user.ana, commitSql(tripA, {
    amount: '100.00', payers: [[m.ana, '60.00'], [m.ben, '39.99']], shares: [[m.ana, '50.00'], [m.ben, '50.00']],
  })), /split_payers_total_mismatch/u, 'payers short by 0.01')
  expectError(sqlAs(stack, user.ana, commitSql(tripA, {
    amount: '100.00', payers: [[m.ana, '100.00']], shares: [[m.ana, '50.00'], [m.ben, '50.01']],
  })), /split_shares_total_mismatch/u, 'shares over by 0.01')
  expectError(sqlAs(stack, user.ana, commitSql(tripA, {
    amount: '100.00', payers: [[m.ana, '100.00']], shares: [[m.ana, '33.335'], [m.ben, '66.665']],
  })), /split_amount_precision/u, 'sub-paisa share')
  expectError(sqlAs(stack, user.ana, commitSql(tripA, {
    amount: '100.00', payers: [[m.ana, '50.00'], [m.ana, '50.00']], shares: [[m.ana, '100.00']],
  })), /split_duplicate_member/u, 'duplicate payer')
  expectError(sqlAs(stack, user.ana, commitSql(tripA, { amount: '100.00', payers: [], shares: [[m.ana, '100.00']] })),
    /split_lines_required/u, 'no payers')
  expectError(sqlAs(stack, user.ana, commitSql(tripA, { amount: '0', payers: [[m.ana, '0']], shares: [[m.ana, '0']] })),
    /split_invalid_amount/u, 'zero amount')
  expectError(sqlAs(stack, user.ana, commitSql(tripA, { description: '  ', amount: '10.00', payers: [[m.ana, '10.00']], shares: [[m.ana, '10.00']] })),
    /split_invalid_description/u, 'blank description')
  assert.equal(count('trip_expenses', tripA), before, 'failed commits left rows')
  assert.equal(count('trip_expense_payers', tripA), 1)

  // Multiple payers and exact shares.
  const multi = sqlAs(stack, user.ben, commitSql(tripA, {
    description: 'Villa', category: 'stay', amount: '900.00',
    payers: [[m.owner, '600.00'], [m.ben, '300.00']], shares: [[m.owner, '200.00'], [m.ana, '300.00'], [m.ben, '400.00']],
  }))
  assert.equal(multi.ok, true, multi.error)
  const villaId = multi.rows[0][0]
  assert.deepEqual(rows(`SELECT count(*), sum(amount) FROM public.trip_expense_payers WHERE expense_id = ${quote(villaId)};`), [['2', '900.00']])

  // Cross-Trip people are rejected: a member id from Trip B, and an outsider.
  expectError(sqlAs(stack, user.ana, commitSql(tripA, { amount: '10.00', payers: [[b.memberIds[user.owner], '10.00']], shares: [[m.ana, '10.00']] })),
    /split_inactive_member/u, 'Trip B payer in Trip A')
  expectError(sqlAs(stack, user.ana, commitSql(tripB, { amount: '10.00', payers: [[m.ana, '10.00']], shares: [[m.ana, '10.00']] })),
    /split_inactive_member/u, 'Trip A member in Trip B')
  // Direct child rows cannot point at another Trip's Expense or person.
  expectError(sqlAs(stack, user.owner, `INSERT INTO public.trip_expense_payers (expense_id, group_id, group_member_id, amount)
    VALUES (${quote(dinnerId)}, ${quote(tripB)}, ${quote(b.memberIds[user.owner])}, 1);`), null, 'child row with foreign group_id')
  expectError(sqlAs(stack, user.owner, `INSERT INTO public.trip_expense_shares (expense_id, group_id, group_member_id, amount)
    VALUES (${quote(dinnerId)}, ${quote(tripA)}, ${quote(b.memberIds[user.owner])}, 1);`), null, 'child row with foreign member')

  // Direct writes that unbalance an Expense fail at COMMIT, whoever writes them.
  expectError(sqlAs(stack, user.ana, `INSERT INTO public.trip_expenses (group_id, description, original_amount, original_currency,
    accounting_amount, accounting_currency, split_method, created_by)
    VALUES (${quote(tripA)}, 'Orphan', 10, 'INR', 10, 'INR', 'exact', ${quote(m.ana)});`), /split_expense_unbalanced/u, 'expense without lines')
  expectError(sqlAs(stack, user.ana, `DELETE FROM public.trip_expense_shares WHERE expense_id = ${quote(dinnerId)} AND group_member_id = ${quote(sortedThree[0])};`),
    /split_expense_unbalanced/u, 'removing one share')
  expectError(sqlAs(stack, user.ana, `UPDATE public.trip_expenses SET original_amount = 101, accounting_amount = 101 WHERE id = ${quote(dinnerId)};`),
    /split_expense_unbalanced/u, 'changing the total alone')
  // Direct rows in someone else's Expense are refused outright.
  expectError(sqlAs(stack, user.cara, `INSERT INTO public.trip_expense_shares (expense_id, group_id, group_member_id, amount)
    VALUES (${quote(dinnerId)}, ${quote(tripA)}, ${quote(m.cara)}, 0);`), /row-level security/u, 'share into foreign expense')
  // Wrong accounting currency is refused by policy even on a direct insert.
  expectError(sqlAs(stack, user.ana, `INSERT INTO public.trip_expenses (group_id, description, original_amount, original_currency,
    accounting_amount, accounting_currency, split_method, created_by)
    VALUES (${quote(tripA)}, 'USD books', 10, 'USD', 10, 'USD', 'exact', ${quote(m.ana)});`), /row-level security/u, 'foreign accounting currency')
  // Nobody can impersonate another creator.
  expectError(sqlAs(stack, user.ana, `INSERT INTO public.trip_expenses (group_id, description, original_amount, original_currency,
    accounting_amount, accounting_currency, split_method, created_by)
    VALUES (${quote(tripA)}, 'Fake', 10, 'INR', 10, 'INR', 'exact', ${quote(m.ben)});`), /row-level security/u, 'impersonated creator')
  assert.equal(count('trip_expenses', tripA), 2)

  // Reads: members see their Trip; strangers and anon see nothing.
  assert.deepEqual(sqlAs(stack, user.cara, 'SELECT description FROM public.trip_expenses ORDER BY description;').rows, [['Dinner'], ['Villa']])
  assert.deepEqual(sqlAs(stack, user.stranger, 'SELECT count(*) FROM public.trip_expenses;').rows, [['0']])
  assert.deepEqual(sqlAs(stack, user.stranger, 'SELECT count(*) FROM public.trip_expense_shares;').rows, [['0']])
  expectError(sqlAs(stack, user.stranger, `SELECT public.get_split_ledger(${quote(tripA)});`), /split_not_a_member/u, 'stranger ledger')
  expectError(sqlAs(stack, user.stranger, commitSql(tripA, { amount: '10.00', payers: [[m.ana, '10.00']], shares: [[m.ana, '10.00']] })),
    /split_not_a_member/u, 'stranger commit')
  for (const table of ['trip_expenses', 'trip_expense_payers', 'trip_expense_shares', 'trip_settlements']) {
    expectError(sqlAs(stack, null, `SELECT count(*) FROM public.${table};`), /permission denied/u, `anon reads ${table}`)
  }
  expectError(sqlAs(stack, null, `SELECT public.get_split_ledger(${quote(tripA)});`), /permission denied/u, 'anon ledger')
  expectError(sqlAs(stack, null, commitSql(tripA, { amount: '10.00', payers: [[m.ana, '10.00']], shares: [[m.ana, '10.00']] })),
    /permission denied/u, 'anon commit')

  const ledger = JSON.parse(sqlAs(stack, user.cara, `SELECT public.get_split_ledger(${quote(tripA)});`).rows[0].join('|'))
  assert.equal(ledger.accounting_currency, 'INR')
  assert.deepEqual(ledger.expenses.map((expense) => expense.description).sort(), ['Dinner', 'Villa'])
  const villa = ledger.expenses.find((expense) => expense.id === villaId)
  assert.deepEqual(villa.payers.map((payer) => payer.amount).sort(), ['300.00', '600.00'])
  assert.equal(villa.accounting_amount, '900.00')
  const ledgerB = JSON.parse(sqlAs(stack, user.owner, `SELECT public.get_split_ledger(${quote(tripB)});`).rows[0].join('|'))
  assert.deepEqual(ledgerB.expenses, [])

  // Only the creator or a Trip Owner can edit or delete.
  const villaEdit = { description: 'Villa deposit', category: 'stay', amount: '1200.00', payers: [[m.owner, '900.00'], [m.ben, '300.00']], shares: [[m.owner, '600.00'], [m.ben, '600.00']] }
  expectError(sqlAs(stack, user.ana, updateSql(villaId, 1, villaEdit)), /split_not_allowed/u, 'non-creator edit')
  expectError(sqlAs(stack, user.ana, `SELECT public.delete_expense(${quote(villaId)});`), /split_not_allowed/u, 'non-creator delete')
  expectError(sqlAs(stack, user.stranger, updateSql(villaId, 1, villaEdit)), /split_expense_not_found/u, 'stranger edit')
  assert.deepEqual(sqlAs(stack, user.ana, `UPDATE public.trip_expenses SET description = 'x' WHERE id = ${quote(villaId)} RETURNING id;`).rows, [])
  assert.deepEqual(sqlAs(stack, user.ana, `DELETE FROM public.trip_expenses WHERE id = ${quote(villaId)} RETURNING id;`).rows, [])
  const edited = sqlAs(stack, user.ben, updateSql(villaId, 1, villaEdit))
  assert.equal(edited.ok, true, edited.error)
  assert.deepEqual(edited.rows, [['2']])
  assert.deepEqual(rows(`SELECT description, accounting_amount, version FROM public.trip_expenses WHERE id = ${quote(villaId)};`), [['Villa deposit', '1200.00', '2']])
  assert.deepEqual(rows(`SELECT group_member_id, amount FROM public.trip_expense_shares WHERE expense_id = ${quote(villaId)} ORDER BY amount, group_member_id;`),
    [m.owner, m.ben].sort().map((id) => [id, '600.00']))
  expectError(sqlAs(stack, user.ben, updateSql(villaId, 1, villaEdit)), /split_expense_stale/u, 'stale version')
  expectError(sqlAs(stack, user.ben, updateSql(villaId, 2, { ...villaEdit, payers: [[m.ben, '1199.99']] })), /split_payers_total_mismatch/u, 'unbalanced edit')
  assert.deepEqual(rows(`SELECT version, accounting_amount FROM public.trip_expenses WHERE id = ${quote(villaId)};`), [['2', '1200.00']], 'failed edit changed row')
  const ownerEdit = sqlAs(stack, user.owner, updateSql(villaId, 2, { ...villaEdit, description: 'Villa' }))
  assert.equal(ownerEdit.ok, true, ownerEdit.error)
  // created_by, group_id and the accounting currency cannot be changed directly.
  expectError(sqlAs(stack, user.owner, `UPDATE public.trip_expenses SET created_by = ${quote(m.owner)} WHERE id = ${quote(villaId)};`), /permission denied/u, 'creator change')
  expectError(sqlAs(stack, user.owner, `UPDATE public.trip_expenses SET group_id = ${quote(tripB)} WHERE id = ${quote(villaId)};`), /permission denied/u, 'group move')
  expectError(sqlAs(stack, user.owner, `UPDATE public.trip_expenses SET accounting_currency = 'USD' WHERE id = ${quote(villaId)};`), /permission denied/u, 'currency change')

  // Delete by creator cascades payers and shares; Owner may delete anyone's.
  const scratch = sqlAs(stack, user.cara, commitSql(tripA, { description: 'Snacks', amount: '30.00', payers: [[m.cara, '30.00']], shares: [[m.cara, '15.00'], [m.ana, '15.00']] }))
  assert.equal(scratch.ok, true, scratch.error)
  assert.equal(sqlAs(stack, user.cara, `SELECT public.delete_expense(${quote(scratch.rows[0][0])}, 1);`).ok, true)
  assert.equal(Number(stack.psql(`SELECT count(*) FROM public.trip_expense_shares WHERE expense_id = ${quote(scratch.rows[0][0])};`)), 0)
  const scratch2 = sqlAs(stack, user.cara, commitSql(tripA, { description: 'Taxi', amount: '30.00', payers: [[m.cara, '30.00']], shares: [[m.cara, '30.00']] }))
  assert.equal(sqlAs(stack, user.owner, `SELECT public.delete_expense(${quote(scratch2.rows[0][0])});`).ok, true, 'owner delete')

  // Idempotent create: a retry with the same request id returns the same Expense.
  const requestId = 'd0000000-0000-4000-8000-000000000001'
  const first = sqlAs(stack, user.ana, commitSql(tripA, { description: 'Ferry', amount: '50.00', payers: [[m.ana, '50.00']], shares: [[m.ana, '50.00']], requestId }))
  const retry = sqlAs(stack, user.ana, commitSql(tripA, { description: 'Ferry', amount: '50.00', payers: [[m.ana, '50.00']], shares: [[m.ana, '50.00']], requestId }))
  assert.equal(first.ok && retry.ok, true)
  assert.equal(retry.rows[0][0], first.rows[0][0])
  expectError(sqlAs(stack, user.ben, commitSql(tripA, { amount: '50.00', payers: [[m.ben, '50.00']], shares: [[m.ben, '50.00']], requestId })),
    /split_request_conflict/u, 'request id reuse by another member')
  assert.equal(Number(stack.psql(`SELECT count(*) FROM public.trip_expenses WHERE description = 'Ferry';`)), 1)

  // FX snapshot: accounting = round(original x rate) in INR; captured once by the server.
  const fx = sqlAs(stack, user.ana, commitSql(tripA, {
    description: 'Museum', category: 'activity', amount: '12.34', currency: 'usd', rate: '83.123456', source: 'manual',
    method: 'equal', payers: [[m.ana, '1025.74']], shares: [[[m.ana, m.ben].sort()[0], '512.87'], [[m.ana, m.ben].sort()[1], '512.87']],
  }))
  assert.equal(fx.ok, true, fx.error)
  const museumId = fx.rows[0][0]
  const [snapshot] = rows(`SELECT original_amount, original_currency, accounting_amount, fx_rate, fx_source, fx_captured_at FROM public.trip_expenses WHERE id = ${quote(museumId)};`)
  assert.deepEqual(snapshot.slice(0, 5), ['12.34', 'USD', '1025.74', '83.123456', 'manual'])
  expectError(sqlAs(stack, user.ana, commitSql(tripA, { amount: '12.34', currency: 'USD', payers: [[m.ana, '1025.74']], shares: [[m.ana, '1025.74']] })),
    /split_fx_rate_required/u, 'foreign currency without rate')
  expectError(sqlAs(stack, user.ana, commitSql(tripA, { amount: '10.00', currency: 'INR', rate: '1', source: 'manual', payers: [[m.ana, '10.00']], shares: [[m.ana, '10.00']] })),
    /split_fx_not_applicable/u, 'rate on same currency')
  expectError(sqlAs(stack, user.ana, commitSql(tripA, { amount: '12.34', currency: 'USD', rate: '83.1', source: 'guess', payers: [[m.ana, '1025.45']], shares: [[m.ana, '1025.45']] })),
    /split_fx_source_invalid/u, 'unknown rate source')
  expectError(sqlAs(stack, user.ana, `UPDATE public.trip_expenses SET fx_captured_at = now() - interval '1 year' WHERE id = ${quote(museumId)};`),
    /permission denied/u, 'backdating capture time')
  // Editing the description keeps the snapshot verbatim; a new rate is a new snapshot.
  const museumKeep = sqlAs(stack, user.ana, updateSql(museumId, 1, {
    description: 'Museum tickets', category: 'activity', amount: '12.34', currency: 'USD', rate: '83.123456', source: 'manual',
    method: 'equal', payers: [[m.ana, '1025.74']], shares: [[[m.ana, m.ben].sort()[0], '512.87'], [[m.ana, m.ben].sort()[1], '512.87']],
  }))
  assert.equal(museumKeep.ok, true, museumKeep.error)
  assert.equal(stack.psql(`SELECT fx_captured_at FROM public.trip_expenses WHERE id = ${quote(museumId)};`), snapshot[5], 'snapshot time rewritten')
  const museumRate = sqlAs(stack, user.ana, updateSql(museumId, 2, {
    description: 'Museum tickets', category: 'activity', amount: '12.34', currency: 'USD', rate: '84', source: 'open.er-api.com',
    payers: [[m.ana, '1036.56']], shares: [[m.ana, '1036.56']],
  }))
  assert.equal(museumRate.ok, true, museumRate.error)
  assert.deepEqual(rows(`SELECT accounting_amount, fx_rate, fx_source, fx_captured_at > ${quote(snapshot[5])}::timestamptz FROM public.trip_expenses WHERE id = ${quote(museumId)};`),
    [['1036.56', '84', 'open.er-api.com', 't']])

  // Minor units: JPY has none, KWD has three.
  const y = { owner: yen.memberIds[user.owner], ana: yen.memberIds[user.ana], ben: yen.memberIds[user.ben] }
  const yenOrder = Object.values(y).sort()
  const yenEqual = sqlAs(stack, user.ana, commitSql(tripYen, {
    description: 'Ramen', amount: '1000', currency: 'JPY', method: 'equal', payers: [[y.ana, '1000']],
    shares: [[yenOrder[0], '334'], [yenOrder[1], '333'], [yenOrder[2], '333']],
  }))
  assert.equal(yenEqual.ok, true, yenEqual.error)
  expectError(sqlAs(stack, user.ana, commitSql(tripYen, { amount: '1000.5', currency: 'JPY', payers: [[y.ana, '1000.5']], shares: [[y.ana, '1000.5']] })),
    /split_amount_precision/u, 'yen decimals')
  // 10.00 USD at 151.237 JPY = 1512.37 -> 1512 yen.
  const yenFx = sqlAs(stack, user.ana, commitSql(tripYen, {
    description: 'Taxi', amount: '10.00', currency: 'USD', rate: '151.237', source: 'manual', payers: [[y.ana, '1512']], shares: [[y.ben, '1512']],
  }))
  assert.equal(yenFx.ok, true, yenFx.error)
  const k = { owner: dinar.memberIds[user.owner], ana: dinar.memberIds[user.ana], ben: dinar.memberIds[user.ben] }
  const dinarOrder = Object.values(k).sort()
  const dinarEqual = sqlAs(stack, user.ana, commitSql(tripDinar, {
    description: 'Tea', amount: '10.000', currency: 'KWD', method: 'equal', payers: [[k.ana, '10.000']],
    shares: [[dinarOrder[0], '3.334'], [dinarOrder[1], '3.333'], [dinarOrder[2], '3.333']],
  }))
  assert.equal(dinarEqual.ok, true, dinarEqual.error)
  expectError(sqlAs(stack, user.ana, commitSql(tripDinar, { amount: '1.0005', currency: 'KWD', payers: [[k.ana, '1.0005']], shares: [[k.ana, '1.0005']] })),
    /split_amount_precision/u, 'dinar fourth decimal')

  // Settlements: between two active members of the Trip, in its accounting currency.
  const paid = sqlAs(stack, user.ana, settleSql(tripA, m.ana, m.owner, '150.00', { note: 'UPI' }))
  assert.equal(paid.ok, true, paid.error)
  const settlementId = paid.rows[0][0]
  assert.deepEqual(rows(`SELECT from_member, to_member, amount, currency, note, recorded_by FROM public.trip_settlements WHERE id = ${quote(settlementId)};`),
    [[m.ana, m.owner, '150.00', 'INR', 'UPI', m.ana]])
  expectError(sqlAs(stack, user.ana, settleSql(tripA, m.ana, m.ana, '1.00')), /split_settlement_same_person/u, 'self settlement')
  expectError(sqlAs(stack, user.ana, settleSql(tripA, m.ana, m.owner, '1.001')), /split_amount_precision/u, 'settlement precision')
  expectError(sqlAs(stack, user.ana, settleSql(tripA, m.ana, m.owner, '0')), /split_invalid_amount/u, 'zero settlement')
  expectError(sqlAs(stack, user.ana, settleSql(tripA, m.ana, b.memberIds[user.owner], '1.00')), /split_inactive_member/u, 'cross-Trip settlement')
  expectError(sqlAs(stack, user.cara, settleSql(tripA, m.ana, m.ben, '1.00')), /split_not_allowed/u, 'third party records')
  expectError(sqlAs(stack, user.stranger, settleSql(tripA, m.ana, m.owner, '1.00')), /split_not_a_member/u, 'stranger records')
  expectError(sqlAs(stack, user.ana, `INSERT INTO public.trip_settlements (group_id, from_member, to_member, amount, currency, recorded_by)
    VALUES (${quote(tripA)}, ${quote(m.ben)}, ${quote(m.owner)}, 1, 'INR', ${quote(m.ana)});`), /row-level security/u, 'direct third-party insert')
  expectError(sqlAs(stack, user.ana, `INSERT INTO public.trip_settlements (group_id, from_member, to_member, amount, currency, recorded_by)
    VALUES (${quote(tripA)}, ${quote(m.ana)}, ${quote(m.owner)}, 1, 'INR', ${quote(m.owner)});`), /row-level security/u, 'impersonated recorder')
  const ownerRecords = sqlAs(stack, user.owner, settleSql(tripA, m.ben, m.cara, '5.00'))
  assert.equal(ownerRecords.ok, true, ownerRecords.error)
  const settleRequest = 'd0000000-0000-4000-8000-000000000002'
  const s1 = sqlAs(stack, user.ben, settleSql(tripA, m.ben, m.owner, '20.00', { requestId: settleRequest }))
  const s2 = sqlAs(stack, user.ben, settleSql(tripA, m.ben, m.owner, '20.00', { requestId: settleRequest }))
  assert.equal(s1.ok && s2.ok && s1.rows[0][0] === s2.rows[0][0], true, 'idempotent settlement')
  // Settlements cannot be edited; only the recorder or an Owner deletes them.
  expectError(sqlAs(stack, user.ana, `UPDATE public.trip_settlements SET amount = 1 WHERE id = ${quote(settlementId)};`), /permission denied/u, 'settlement update')
  expectError(sqlAs(stack, user.ben, `SELECT public.delete_settlement(${quote(settlementId)});`), /split_not_allowed/u, 'non-recorder delete')
  assert.equal(sqlAs(stack, user.ana, `SELECT public.delete_settlement(${quote(settlementId)});`).ok, true, 'recorder delete')
  assert.equal(sqlAs(stack, user.owner, `SELECT public.delete_settlement(${quote(s1.rows[0][0])});`).ok, true, 'owner delete settlement')
  assert.equal(count('trip_settlements', tripA), 1)

  // A removed member loses all access and can no longer be a payer or share.
  stack.psql(`UPDATE public.group_members SET status = 'inactive' WHERE id = ${quote(m.cara)};`)
  assert.deepEqual(sqlAs(stack, user.cara, 'SELECT count(*) FROM public.trip_expenses;').rows, [['0']])
  assert.deepEqual(sqlAs(stack, user.cara, 'SELECT count(*) FROM public.trip_settlements;').rows, [['0']])
  expectError(sqlAs(stack, user.cara, `SELECT public.get_split_ledger(${quote(tripA)});`), /split_not_a_member/u, 'removed member ledger')
  expectError(sqlAs(stack, user.cara, commitSql(tripA, { amount: '10.00', payers: [[m.cara, '10.00']], shares: [[m.cara, '10.00']] })),
    /split_not_a_member/u, 'removed member commit')
  expectError(sqlAs(stack, user.ana, commitSql(tripA, { amount: '10.00', payers: [[m.ana, '10.00']], shares: [[m.ana, '5.00'], [m.cara, '5.00']] })),
    /split_inactive_member/u, 'removed member as share')
  expectError(sqlAs(stack, user.ana, settleSql(tripA, m.ana, m.cara, '1.00')), /split_inactive_member/u, 'settle with removed member')
  // History with the removed member stays readable to everyone else.
  assert.deepEqual(sqlAs(stack, user.owner, `SELECT count(*) FROM public.trip_settlements WHERE to_member = ${quote(m.cara)};`).rows, [['1']])

  // Realtime publishes all four tables.
  assert.equal(stack.psql(`SELECT string_agg(tablename, ',' ORDER BY tablename) FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename LIKE 'trip_%' AND tablename <> 'trip_events';`),
  'trip_expense_payers,trip_expense_shares,trip_expenses,trip_settlements')

  stack.stop()
  console.log(JSON.stringify({ splitLedger: 'passed', exactSums: 'passed', atomicity: 'passed', isolation: 'passed', editRights: 'passed', settlements: 'passed', minorUnits: 'passed', fxSnapshot: 'passed', cleanup: 'passed' }))
} catch (error) {
  try { stack.stop() } catch { /* keep the primary failure */ }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'split-ledger-verification-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
