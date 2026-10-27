// Split percent and shares modes (migration 042): the server recomputes every
// weighted split by the largest-remainder rule, rejects tampered rows and bad
// inputs on every write path, stores the inputs, and edits round-trip.
import assert from 'node:assert/strict'
import { createLocalStack } from '../../support/local-stack.mjs'
import { createTrip, createUsers, quote, sqlAs } from '../../support/db-fixtures.mjs'

const stack = createLocalStack({ projectId: 'split-modes-db', basePort: 58720 })
const tripA = 'c1000000-0000-4000-8000-00000000000a'
const tripYen = 'c1000000-0000-4000-8000-00000000000c'
const tripDinar = 'c1000000-0000-4000-8000-00000000000d'

const text = (value) => (value === null || value === undefined ? 'NULL' : quote(value))
// [memberId, amount] or [memberId, amount, weight]; a weight of undefined is left out of the JSON.
const lines = (entries) => quote(JSON.stringify(entries.map(([memberId, amount, weight]) =>
  (weight === undefined ? { member_id: memberId, amount } : { member_id: memberId, amount, weight }))))

function commitSql(groupId, { description = 'Dinner', amount, currency = 'INR', rate = null, source = null, method, payers, shares }) {
  return `SELECT public.commit_expense(p_group_id => ${quote(groupId)}, p_description => ${text(description)},
    p_original_amount => ${text(amount)}, p_original_currency => ${text(currency)}, p_split_method => ${quote(method)},
    p_payers => ${lines(payers)}::jsonb, p_shares => ${lines(shares)}::jsonb,
    p_fx_rate => ${text(rate)}, p_fx_source => ${text(source)});`
}

function updateSql(expenseId, version, { description = 'Dinner', amount, currency = 'INR', method, payers, shares }) {
  return `SELECT public.update_expense(p_expense_id => ${quote(expenseId)}, p_expected_version => ${version},
    p_description => ${text(description)}, p_original_amount => ${text(amount)}, p_original_currency => ${text(currency)},
    p_split_method => ${quote(method)}, p_payers => ${lines(payers)}::jsonb, p_shares => ${lines(shares)}::jsonb);`
}

const rows = (sql) => stack.psql(sql).split('\n').filter(Boolean).map((line) => line.split('|'))
const count = (table, groupId) => Number(stack.psql(`SELECT count(*) FROM public.${table} WHERE group_id = ${quote(groupId)};`))
const storedShares = (expenseId) => rows(`SELECT group_member_id, amount, coalesce(weight::text, '-') FROM public.trip_expense_shares
  WHERE expense_id = ${quote(expenseId)} ORDER BY group_member_id;`)

function expectError(result, message, label) {
  assert.equal(result.ok, false, `${label}: expected failure`)
  if (message) assert.match(result.error, message, label)
}

function accepted(result, label) {
  assert.equal(result.ok, true, `${label}: ${result.error}`)
  return result.rows[0][0]
}

try {
  stack.start()
  stack.migrate()
  const user = createUsers(stack, ['owner', 'ana', 'ben', 'cara', 'stranger'])
  const a = createTrip(stack, {
    groupId: tripA, name: 'Goa', currency: 'INR',
    members: { [user.owner]: 'owner', [user.ana]: 'member', [user.ben]: 'member', [user.cara]: 'member' },
  })
  const yen = createTrip(stack, { groupId: tripYen, name: 'Tokyo', currency: 'JPY', timezone: 'Asia/Tokyo', members: { [user.owner]: 'owner', [user.ana]: 'member', [user.ben]: 'member' } })
  const dinar = createTrip(stack, { groupId: tripDinar, name: 'Kuwait', currency: 'KWD', timezone: 'Asia/Kuwait', members: { [user.owner]: 'owner', [user.ana]: 'member', [user.ben]: 'member' } })
  // p0 < p1 < p2 < p3 by group_members.id, the remainder tie-break order.
  const [p0, p1, p2, p3] = [user.owner, user.ana, user.ben, user.cara].map((id) => a.memberIds[id]).sort()

  // The split_method check now allows all four modes.
  assert.match(stack.psql(`SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'trip_expenses_split_method_check';`),
    /'equal'.*'exact'.*'percent'.*'shares'/u)

  // Percent: 900.00 at 70/20/10 is stored exactly, with the percents.
  const dinner = accepted(sqlAs(stack, user.ana, commitSql(tripA, {
    amount: '900.00', method: 'percent', payers: [[a.memberIds[user.ana], '900.00']],
    shares: [[p0, '630.00', '70'], [p1, '180.00', '20'], [p2, '90.00', '10']],
  })), 'percent 70/20/10')
  assert.deepEqual(storedShares(dinner), [[p0, '630.00', '70'], [p1, '180.00', '20'], [p2, '90.00', '10']])
  assert.deepEqual(rows(`SELECT split_method FROM public.trip_expenses WHERE id = ${quote(dinner)};`), [['percent']])

  // Percent remainders: the largest remainder wins over member id order.
  // 10.00 at 33.33/33.33/33.34 % -> 3.33, 3.33, 3.34 even though p2 has the highest id.
  const remainder = accepted(sqlAs(stack, user.ana, commitSql(tripA, {
    description: 'Chai', amount: '10.00', method: 'percent', payers: [[p0, '10.00']],
    shares: [[p0, '3.33', '33.33'], [p1, '3.33', '33.33'], [p2, '3.34', '33.34']],
  })), 'percent remainder')
  assert.deepEqual(storedShares(remainder).map((row) => row[1]), ['3.33', '3.33', '3.34'])
  // Equal remainders go to the lowest member id: 0.05 at 50/50 -> 0.03 to p0.
  accepted(sqlAs(stack, user.ana, commitSql(tripA, {
    description: 'Mint', amount: '0.05', method: 'percent', payers: [[p0, '0.05']], shares: [[p3, '0.02', '50'], [p0, '0.03', '50']],
  })), 'percent tie by member id')
  expectError(sqlAs(stack, user.ana, commitSql(tripA, {
    description: 'Mint', amount: '0.05', method: 'percent', payers: [[p0, '0.05']], shares: [[p0, '0.02', '50'], [p3, '0.03', '50']],
  })), /split_percent_mismatch/u, 'percent tie to the higher id')
  // Decimal percents and JSON numbers are accepted: 12.5 + 87.5.
  accepted(sqlAs(stack, user.ana, `SELECT public.commit_expense(${quote(tripA)}, 'Snacks', '80.00', 'INR', 'percent',
    ${lines([[p0, '80.00']])}::jsonb,
    ${quote(JSON.stringify([{ member_id: p0, amount: '10.00', weight: 12.5 }, { member_id: p1, amount: '70.00', weight: '87.50' }]))}::jsonb);`),
  'decimal percents')

  // Shares: 4500.00 at 2:1:1:1 -> 1800, 900, 900, 900 (a couple counts double).
  const villa = accepted(sqlAs(stack, user.ben, commitSql(tripA, {
    description: 'Villa', amount: '4500.00', method: 'shares', payers: [[a.memberIds[user.ben], '4500.00']],
    shares: [[p0, '1800.00', '2'], [p1, '900.00', '1'], [p2, '900.00', '1'], [p3, '900.00', '1']],
  })), 'shares 2:1:1:1')
  assert.deepEqual(storedShares(villa), [[p0, '1800.00', '2'], [p1, '900.00', '1'], [p2, '900.00', '1'], [p3, '900.00', '1']])
  // 100.00 at 1:1:1: the extra paisa to the lowest member id.
  accepted(sqlAs(stack, user.ana, commitSql(tripA, {
    description: 'Taxi', amount: '100.00', method: 'shares', payers: [[p1, '100.00']],
    shares: [[p2, '33.33', '1'], [p0, '33.34', '1'], [p1, '33.33', '1']],
  })), 'shares 1:1:1')
  // A share can round to zero: 0.01 at 1:1 -> 0.01, 0.00.
  accepted(sqlAs(stack, user.ana, commitSql(tripA, {
    description: 'Gum', amount: '0.01', method: 'shares', payers: [[p1, '0.01']], shares: [[p0, '0.01', '1'], [p1, '0.00', '1']],
  })), 'zero share')

  // Minor units: JPY has none, KWD has three.
  const y = [user.owner, user.ana, user.ben].map((id) => yen.memberIds[id]).sort()
  // 1000 at 2:1 -> 666 r2, 333 r1: the leftover yen goes to the larger remainder.
  accepted(sqlAs(stack, user.ana, commitSql(tripYen, {
    description: 'Ramen', amount: '1000', currency: 'JPY', method: 'shares', payers: [[y[0], '1000']],
    shares: [[y[2], '667', '2'], [y[0], '333', '1']],
  })), 'yen shares')
  expectError(sqlAs(stack, user.ana, commitSql(tripYen, {
    description: 'Ramen', amount: '1000', currency: 'JPY', method: 'shares', payers: [[y[0], '1000']],
    shares: [[y[2], '666', '2'], [y[0], '334', '1']],
  })), /split_shares_mismatch/u, 'yen leftover to the wrong person')
  accepted(sqlAs(stack, user.ana, commitSql(tripYen, {
    description: 'Sushi', amount: '1000', currency: 'JPY', method: 'percent', payers: [[y[0], '1000']],
    shares: [[y[0], '333', '33.33'], [y[1], '333', '33.33'], [y[2], '334', '33.34']],
  })), 'yen percent')
  const k = [user.owner, user.ana, user.ben].map((id) => dinar.memberIds[id]).sort()
  accepted(sqlAs(stack, user.ana, commitSql(tripDinar, {
    description: 'Tea', amount: '10.000', currency: 'KWD', method: 'shares', payers: [[k[0], '10.000']],
    shares: [[k[0], '3.334', '1'], [k[1], '3.333', '1'], [k[2], '3.333', '1']],
  })), 'dinar shares')
  accepted(sqlAs(stack, user.ana, commitSql(tripDinar, {
    description: 'Dates', amount: '1.000', currency: 'KWD', method: 'percent', payers: [[k[0], '1.000']],
    shares: [[k[0], '0.667', '66.67'], [k[1], '0.333', '33.33']],
  })), 'dinar percent')

  // FX: the weights apply to the converted total. 12.34 USD at 83.123456 = 1025.74 INR.
  accepted(sqlAs(stack, user.ana, commitSql(tripA, {
    description: 'Museum', amount: '12.34', currency: 'USD', rate: '83.123456', source: 'manual', method: 'shares',
    payers: [[p1, '1025.74']], shares: [[p0, '683.83', '2'], [p1, '341.91', '1']],
  })), 'shares on a converted total')

  // Tampered or invalid inputs are rejected and write nothing.
  const before = count('trip_expenses', tripA)
  const payer = [[p0, '900.00']]
  const reject = (label, error, method, shares, amount = '900.00') =>
    expectError(sqlAs(stack, user.ana, commitSql(tripA, { amount, method, payers: amount === '900.00' ? payer : [[p0, amount]], shares })), error, label)
  reject('percent amounts not following the percents', /split_percent_mismatch/u, 'percent', [[p0, '600.00', '70'], [p1, '200.00', '20'], [p2, '100.00', '10']])
  reject('percents totalling 99', /split_percent_total/u, 'percent', [[p0, '630.00', '70'], [p1, '180.00', '20'], [p2, '90.00', '9']])
  reject('percents totalling 101', /split_percent_total/u, 'percent', [[p0, '630.00', '70'], [p1, '180.00', '20'], [p2, '90.00', '11']])
  reject('zero percent', /split_invalid_percent/u, 'percent', [[p0, '900.00', '100'], [p1, '0.00', '0']])
  reject('three-decimal percent', /split_invalid_percent/u, 'percent', [[p0, '450.00', '50.005'], [p1, '450.00', '49.995']])
  reject('negative percent', /split_invalid_percent/u, 'percent', [[p0, '900.00', '110'], [p1, '0.00', '-10']])
  reject('percent over 100', /split_invalid_percent/u, 'percent', [[p0, '900.00', '150']])
  reject('percent missing', /split_invalid_percent/u, 'percent', [[p0, '450.00', '50'], [p1, '450.00']])
  reject('percent as text', /split_invalid_percent/u, 'percent', [[p0, '900.00', 'all']])
  reject('shares amounts not following the shares', /split_shares_mismatch/u, 'shares', [[p0, '450.00', '2'], [p1, '450.00', '1']])
  reject('fractional share', /split_invalid_shares/u, 'shares', [[p0, '540.00', '1.5'], [p1, '360.00', '1']])
  reject('zero shares', /split_invalid_shares/u, 'shares', [[p0, '900.00', '1'], [p1, '0.00', '0']])
  reject('too many shares', /split_invalid_shares/u, 'shares', [[p0, '900.00', '1001']])
  reject('shares missing', /split_invalid_shares/u, 'shares', [[p0, '900.00']])
  reject('weight on an exact split', /split_weight_not_applicable/u, 'exact', [[p0, '900.00', '1']])
  reject('weight on an equal split', /split_weight_not_applicable/u, 'equal', [[p0, '900.00', '100']])
  reject('unknown method', /split_invalid_method/u, 'ratio', [[p0, '900.00', '1']])
  reject('weighted shares not summing to the total', /split_shares_total_mismatch/u, 'shares', [[p0, '600.00', '2'], [p1, '299.99', '1']])
  assert.equal(count('trip_expenses', tripA), before, 'rejected commits left rows')

  // Direct writes are held to the same rule at COMMIT.
  const directSwap = sqlAs(stack, user.ana, `DELETE FROM public.trip_expense_shares WHERE expense_id = ${quote(dinner)} AND group_member_id IN (${quote(p0)}, ${quote(p1)});
    INSERT INTO public.trip_expense_shares (expense_id, group_id, group_member_id, amount, weight) VALUES
      (${quote(dinner)}, ${quote(tripA)}, ${quote(p0)}, 180.00, 70), (${quote(dinner)}, ${quote(tripA)}, ${quote(p1)}, 630.00, 20);`)
  expectError(directSwap, /split_expense_inputs_mismatch/u, 'direct share swap')
  const directWeights = sqlAs(stack, user.ana, `DELETE FROM public.trip_expense_shares WHERE expense_id = ${quote(dinner)} AND group_member_id IN (${quote(p0)}, ${quote(p1)});
    INSERT INTO public.trip_expense_shares (expense_id, group_id, group_member_id, amount, weight) VALUES
      (${quote(dinner)}, ${quote(tripA)}, ${quote(p0)}, 630.00, 80), (${quote(dinner)}, ${quote(tripA)}, ${quote(p1)}, 180.00, 10);`)
  expectError(directWeights, /split_expense_inputs_mismatch/u, 'direct weight change')
  expectError(sqlAs(stack, user.ana, `UPDATE public.trip_expenses SET split_method = 'exact' WHERE id = ${quote(dinner)};`),
    /split_expense_inputs_mismatch/u, 'percent relabelled exact keeps weights')
  expectError(sqlAs(stack, user.ana, `UPDATE public.trip_expenses SET split_method = 'equal' WHERE id = ${quote(dinner)};`),
    /split_expense_inputs_mismatch/u, 'percent relabelled equal')
  const exactDirect = accepted(sqlAs(stack, user.ana, commitSql(tripA, {
    description: 'Exact direct', amount: '10.00', method: 'exact', payers: [[p0, '10.00']], shares: [[p0, '7.00'], [p1, '3.00']],
  })), 'exact for relabelling')
  expectError(sqlAs(stack, user.ana, `UPDATE public.trip_expenses SET split_method = 'percent' WHERE id = ${quote(exactDirect)};`),
    /split_expense_inputs_mismatch/u, 'exact relabelled percent without weights')
  expectError(sqlAs(stack, user.ana, `INSERT INTO public.trip_expense_shares (expense_id, group_id, group_member_id, amount, weight)
    VALUES (${quote(dinner)}, ${quote(tripA)}, ${quote(p3)}, 0, 1);`), /split_expense_inputs_mismatch|split_expense_unbalanced/u, 'direct extra weighted share')
  assert.deepEqual(storedShares(dinner), [[p0, '630.00', '70'], [p1, '180.00', '20'], [p2, '90.00', '10']], 'direct writes changed rows')
  // A correct direct write passes the same check.
  const directRequest = quote('d1000000-0000-4000-8000-000000000001')
  const directGood = sqlAs(stack, user.ana, `INSERT INTO public.trip_expenses (group_id, description, original_amount, original_currency,
      accounting_amount, accounting_currency, split_method, created_by, request_id)
    VALUES (${quote(tripA)}, 'Direct', 100, 'INR', 100, 'INR', 'shares', ${quote(a.memberIds[user.ana])}, ${directRequest});
    INSERT INTO public.trip_expense_payers (expense_id, group_id, group_member_id, amount)
    SELECT id, group_id, ${quote(a.memberIds[user.ana])}, 100 FROM public.trip_expenses WHERE request_id = ${directRequest};
    INSERT INTO public.trip_expense_shares (expense_id, group_id, group_member_id, amount, weight)
    SELECT expense.id, expense.group_id, line.member, line.amount, line.weight FROM public.trip_expenses AS expense,
      (VALUES (${quote(p0)}::uuid, 33.34, 1), (${quote(p1)}::uuid, 33.33, 1), (${quote(p2)}::uuid, 33.33, 1)) AS line(member, amount, weight)
    WHERE expense.request_id = ${directRequest};`)
  assert.equal(directGood.ok, true, `correct direct write: ${directGood.error}`)
  assert.equal(Number(stack.psql(`SELECT count(*) FROM public.trip_expense_shares AS share JOIN public.trip_expenses AS expense
    ON expense.id = share.expense_id WHERE expense.request_id = ${directRequest};`)), 3)

  // The ledger reports the method and each person's input.
  const ledger = JSON.parse(sqlAs(stack, user.cara, `SELECT public.get_split_ledger(${quote(tripA)});`).rows[0].join('|'))
  const reported = ledger.expenses.find((expense) => expense.id === dinner)
  assert.equal(reported.split_method, 'percent')
  assert.deepEqual(reported.shares, [
    { member_id: p0, amount: '630.00', weight: '70' }, { member_id: p1, amount: '180.00', weight: '20' }, { member_id: p2, amount: '90.00', weight: '10' },
  ])
  const villaReported = ledger.expenses.find((expense) => expense.id === villa)
  assert.deepEqual(villaReported.shares.map((share) => share.weight), ['2', '1', '1', '1'])
  const exact = accepted(sqlAs(stack, user.ana, commitSql(tripA, { description: 'Exact', amount: '10.00', method: 'exact', payers: [[p0, '10.00']], shares: [[p0, '10.00']] })), 'exact still works')
  const exactLedger = JSON.parse(sqlAs(stack, user.ana, `SELECT public.get_split_ledger(${quote(tripA)});`).rows[0].join('|'))
  assert.deepEqual(exactLedger.expenses.find((expense) => expense.id === exact).shares, [{ member_id: p0, amount: '10.00', weight: null }])

  // Edits round-trip between modes; weights follow the mode.
  const plan = accepted(sqlAs(stack, user.ben, commitSql(tripA, {
    description: 'Boat', amount: '300.00', method: 'equal', payers: [[p2, '300.00']], shares: [[p0, '150.00'], [p1, '150.00']],
  })), 'equal boat')
  expectError(sqlAs(stack, user.ana, updateSql(plan, 1, {
    description: 'Boat', amount: '300.00', method: 'percent', payers: [[p2, '300.00']], shares: [[p0, '150.00', '50'], [p1, '150.00', '50']],
  })), /split_not_allowed/u, 'non-creator edit')
  assert.deepEqual(sqlAs(stack, user.ben, updateSql(plan, 1, {
    description: 'Boat', amount: '300.00', method: 'percent', payers: [[p2, '300.00']],
    shares: [[p0, '200.01', '66.67'], [p1, '99.99', '33.33']],
  })).rows, [['2']], 'equal -> percent')
  assert.deepEqual(storedShares(plan), [[p0, '200.01', '66.67'], [p1, '99.99', '33.33']])
  expectError(sqlAs(stack, user.ben, updateSql(plan, 2, {
    description: 'Boat', amount: '300.00', method: 'percent', payers: [[p2, '300.00']],
    shares: [[p0, '200.00', '66.67'], [p1, '100.00', '33.33']],
  })), /split_percent_mismatch/u, 'tampered edit')
  assert.deepEqual(sqlAs(stack, user.ben, updateSql(plan, 2, {
    description: 'Boat', amount: '301.00', method: 'shares', payers: [[p2, '301.00']],
    shares: [[p0, '150.50', '1'], [p1, '150.50', '1']],
  })).rows, [['3']], 'percent -> shares')
  assert.deepEqual(storedShares(plan), [[p0, '150.50', '1'], [p1, '150.50', '1']])
  expectError(sqlAs(stack, user.ben, updateSql(plan, 2, {
    description: 'Boat', amount: '301.00', method: 'shares', payers: [[p2, '301.00']], shares: [[p0, '150.50', '1'], [p1, '150.50', '1']],
  })), /split_expense_stale/u, 'stale edit')
  assert.deepEqual(sqlAs(stack, user.owner, updateSql(plan, 3, {
    description: 'Boat', amount: '301.00', method: 'exact', payers: [[p2, '301.00']], shares: [[p0, '1.00'], [p1, '300.00']],
  })).rows, [['4']], 'owner: shares -> exact')
  assert.deepEqual(storedShares(plan), [[p0, '1.00', '-'], [p1, '300.00', '-']])
  assert.deepEqual(rows(`SELECT split_method, version FROM public.trip_expenses WHERE id = ${quote(plan)};`), [['exact', '4']])

  // Strangers still see nothing.
  assert.deepEqual(sqlAs(stack, user.stranger, 'SELECT count(*) FROM public.trip_expense_shares;').rows, [['0']])
  expectError(sqlAs(stack, user.stranger, commitSql(tripA, { amount: '10.00', method: 'shares', payers: [[p0, '10.00']], shares: [[p0, '10.00', '1']] })),
    /split_not_a_member/u, 'stranger commit')

  stack.stop()
  console.log(JSON.stringify({ splitModes: 'passed', percent: 'passed', shares: 'passed', remainders: 'passed', minorUnits: 'passed', tampering: 'passed', directWrites: 'passed', editRoundTrip: 'passed', cleanup: 'passed' }))
} catch (error) {
  try { stack.stop() } catch { /* keep the primary failure */ }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'split-modes-verification-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
