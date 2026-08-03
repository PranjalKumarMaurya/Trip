export const IR007_PERFORMANCE_FIXTURE = Object.freeze({
  groups: 200,
  activeMembersPerGroup: 20,
  inactiveMemberships: 200,
  archivedGroups: 20,
  auditRows: 20000,
  actorMemberships: 1,
  actorGroup: 'Group A',
})

const ACTOR_AUTH_USER_ID = '20000000-0000-4000-8000-000000000001'
const GROUP_A_ID = '10000000-0000-4000-8000-000000000001'
const GROUP_B_ID = '10000000-0000-4000-8000-000000000002'
const ACTIVE_MEMBERSHIP_INDEXES = new Set([
  'group_members_active_profile_group_role_idx',
  'group_members_active_owner_profile_group_idx',
])

export const IR007_PERFORMANCE_PROBES = Object.freeze([
  Object.freeze({
    name: 'active-group-configuration-lookup',
    limitMilliseconds: 40,
    statement: `
      SELECT groups.id, group_configurations.group_id
      FROM public.groups
      JOIN public.group_configurations ON group_configurations.group_id = groups.id
      WHERE groups.id = '${GROUP_A_ID}'::uuid
    `,
  }),
  Object.freeze({
    name: 'same-group-roster-limit-100',
    limitMilliseconds: 40,
    statement: `SELECT * FROM public.get_group_roster('${GROUP_A_ID}'::uuid, 100)`,
  }),
  Object.freeze({
    name: 'cross-group-direct-denial-lookup',
    limitMilliseconds: 15,
    statement: `SELECT id FROM public.groups WHERE id = '${GROUP_B_ID}'::uuid`,
  }),
  Object.freeze({
    name: 'profile-active-membership-lookup',
    limitMilliseconds: 15,
    statement: `
      SELECT profiles.id, groups.id
      FROM public.profiles
      CROSS JOIN public.groups
      WHERE groups.id = '${GROUP_A_ID}'::uuid
    `,
  }),
  Object.freeze({
    name: 'owner-audit-summary-limit-100',
    limitMilliseconds: 40,
    statement: `SELECT * FROM public.get_group_audit_summary('${GROUP_A_ID}'::uuid, 100)`,
  }),
])

function assertSqlExecutor(executor, name) {
  if (typeof executor !== 'function') throw new Error(`ir007-performance-${name}-executor-required`)
}

function actorStatement(statement) {
  return `
    BEGIN;
    SET LOCAL ROLE authenticated;
    SET LOCAL request.jwt.claim.sub = '${ACTOR_AUTH_USER_ID}';
    ${statement};
    ROLLBACK;
  `
}

function explainStatement(statement, { actor = true } = {}) {
  const explain = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${statement}`
  return actor ? actorStatement(explain) : explain
}

function parsePlan(value) {
  if (typeof value !== 'string') throw new Error('ir007-performance-plan-output-invalid')
  const first = value.indexOf('[')
  const last = value.lastIndexOf(']')
  if (first < 0 || last <= first) throw new Error('ir007-performance-plan-json-missing')
  let parsed
  try {
    parsed = JSON.parse(value.slice(first, last + 1))
  } catch {
    throw new Error('ir007-performance-plan-json-invalid')
  }
  if (!Array.isArray(parsed) || parsed.length !== 1 || !parsed[0]?.Plan) {
    throw new Error('ir007-performance-plan-shape-invalid')
  }
  return parsed
}

function planNodes(plan) {
  const nodes = []
  const visit = (value) => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (typeof value['Node Type'] === 'string') nodes.push(value)
    Object.values(value).forEach(visit)
  }
  visit(plan)
  return nodes
}

function numeric(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function assertPlanSafety(plan, { requireMembershipIndex = false } = {}) {
  const nodes = planNodes(plan)
  for (const node of nodes) {
    const relation = String(node['Relation Name'] ?? '').toLowerCase()
    if (node['Node Type'] === 'Seq Scan' && ['profiles', 'group_members'].includes(relation)) {
      throw new Error(`ir007-performance-sequential-scan-${relation}`)
    }
    if (numeric(node['Temp Read Blocks']) > 0 || numeric(node['Temp Written Blocks']) > 0) {
      throw new Error('ir007-performance-temporary-file-spill')
    }
    if (typeof node['Subplan Name'] === 'string' && numeric(node['Actual Loops']) > 1) {
      throw new Error('ir007-performance-protected-row-proportional-authorization-loop')
    }
  }

  if (requireMembershipIndex) {
    const usesSelectiveMembershipIndex = nodes.some((node) => {
      const index = String(node['Index Name'] ?? '')
      return ACTIVE_MEMBERSHIP_INDEXES.has(index)
    })
    if (!usesSelectiveMembershipIndex) throw new Error('ir007-performance-selective-membership-index-missing')
  }
}

function executionMilliseconds(plan) {
  const value = plan[0]?.['Execution Time']
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error('ir007-performance-execution-time-missing')
  }
  return value
}

function p95(warmedMilliseconds) {
  if (!Array.isArray(warmedMilliseconds) || warmedMilliseconds.length !== 5) {
    throw new Error('ir007-performance-warmed-sample-count-invalid')
  }
  const sorted = warmedMilliseconds.slice().sort((left, right) => left - right)
  return sorted[Math.ceil(sorted.length * 0.95) - 1]
}

function fixtureSql() {
  return `
    TRUNCATE TABLE
      public.group_audit_events,
      public.group_configurations,
      public.group_members,
      public.profiles,
      public.groups;

    DELETE FROM auth.users
    WHERE id = '${ACTOR_AUTH_USER_ID}'::uuid;

    INSERT INTO auth.users (
      id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '${ACTOR_AUTH_USER_ID}'::uuid,
      'authenticated', 'authenticated', 'ir007-performance-actor@example.test',
      'fixture-only', now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Performance Actor"}'::jsonb,
      now(), now()
    );

    INSERT INTO public.groups (id, archived_at)
    SELECT
      ('10000000-0000-4000-8000-' || lpad(group_number::text, 12, '0'))::uuid,
      CASE WHEN group_number > 180 THEN now() ELSE NULL END
    FROM generate_series(1, 200) AS group_number;

    INSERT INTO public.group_configurations (
      group_id, trip_name, destination, start_date, end_date, timezone, accounting_currency
    )
    SELECT
      ('10000000-0000-4000-8000-' || lpad(group_number::text, 12, '0'))::uuid,
      'Performance Group ' || group_number,
      'Fixture Destination',
      DATE '2030-01-01', DATE '2030-01-02', 'Asia/Kolkata', 'IDR'
    FROM generate_series(1, 200) AS group_number;

    INSERT INTO public.profiles (id, display_name)
    SELECT
      ('30000000-0000-4000-8000-' || lpad(profile_number::text, 12, '0'))::uuid,
      'Performance Member ' || profile_number
    FROM generate_series(2, 4000) AS profile_number;

    INSERT INTO public.group_members (id, group_id, profile_id, role, status)
    SELECT
      ('40000000-0000-4000-8000-' || lpad(((group_number - 1) * 20 + member_number)::text, 12, '0'))::uuid,
      ('10000000-0000-4000-8000-' || lpad(group_number::text, 12, '0'))::uuid,
      CASE
        WHEN group_number = 1 AND member_number = 1 THEN (
          SELECT id FROM public.profiles WHERE auth_user_id = '${ACTOR_AUTH_USER_ID}'::uuid
        )
        ELSE ('30000000-0000-4000-8000-' || lpad(((group_number - 1) * 20 + member_number)::text, 12, '0'))::uuid
      END,
      CASE WHEN member_number = 1 THEN 'owner' ELSE 'member' END,
      'active'
    FROM generate_series(1, 200) AS group_number
    CROSS JOIN generate_series(1, 20) AS member_number;

    INSERT INTO public.profiles (id, display_name)
    SELECT
      ('50000000-0000-4000-8000-' || lpad(profile_number::text, 12, '0'))::uuid,
      'Inactive Performance Member ' || profile_number
    FROM generate_series(1, 200) AS profile_number;

    INSERT INTO public.group_members (id, group_id, profile_id, role, status)
    SELECT
      ('60000000-0000-4000-8000-' || lpad(group_number::text, 12, '0'))::uuid,
      ('10000000-0000-4000-8000-' || lpad(group_number::text, 12, '0'))::uuid,
      ('50000000-0000-4000-8000-' || lpad(group_number::text, 12, '0'))::uuid,
      'member', 'inactive'
    FROM generate_series(1, 200) AS group_number;

    INSERT INTO public.group_audit_events (
      id, group_id, actor_group_member_id, event_type, request_id, details, occurred_at
    )
    SELECT
      ('70000000-0000-4000-8000-' || lpad(audit_number::text, 12, '0'))::uuid,
      ('10000000-0000-4000-8000-' || lpad(((audit_number - 1) / 100 + 1)::text, 12, '0'))::uuid,
      ('40000000-0000-4000-8000-' || lpad((((audit_number - 1) / 100) * 20 + 1)::text, 12, '0'))::uuid,
      'group_bootstrapped',
      ('80000000-0000-4000-8000-' || lpad(audit_number::text, 12, '0'))::uuid,
      '{}'::jsonb,
      TIMESTAMPTZ '2030-01-01 00:00:00+00' + (audit_number * INTERVAL '1 second')
    FROM generate_series(1, 20000) AS audit_number;

    ANALYZE public.groups;
    ANALYZE public.group_configurations;
    ANALYZE public.profiles;
    ANALYZE public.group_members;
    ANALYZE public.group_audit_events;
  `
}

function assertFixture(executeSql) {
  const expected = ['200', '4000', '200', '20', '20000', '1'].join('|')
  const actual = executeSql(`
    SELECT
      (SELECT count(*) FROM public.groups)::text,
      (SELECT count(*) FROM public.group_members WHERE status = 'active')::text,
      (SELECT count(*) FROM public.group_members WHERE status = 'inactive')::text,
      (SELECT count(*) FROM public.groups WHERE archived_at IS NOT NULL)::text,
      (SELECT count(*) FROM public.group_audit_events)::text,
      (SELECT count(*)
        FROM public.group_members
        JOIN public.profiles ON public.profiles.id = public.group_members.profile_id
        WHERE public.profiles.auth_user_id = '${ACTOR_AUTH_USER_ID}'::uuid
          AND public.group_members.status = 'active')::text
  `).replaceAll('\n', '|')
  if (actual !== expected) throw new Error('ir007-performance-fixture-counts-invalid')
}

function authorizationIndexStatement() {
  return `
    SELECT group_members.group_id
    FROM public.group_members
    JOIN public.profiles ON public.profiles.id = public.group_members.profile_id
    JOIN public.groups ON public.groups.id = public.group_members.group_id
    WHERE public.profiles.auth_user_id = '${ACTOR_AUTH_USER_ID}'::uuid
      AND public.group_members.status = 'active'
      AND public.groups.archived_at IS NULL
  `
}

export function runIr007PerformanceProbes({ executeSql, explainSql }) {
  assertSqlExecutor(executeSql, 'sql')
  assertSqlExecutor(explainSql, 'explain')

  executeSql(fixtureSql())
  assertFixture(executeSql)

  const authorizationIndexPlan = parsePlan(explainSql(explainStatement(authorizationIndexStatement(), { actor: false })))
  assertPlanSafety(authorizationIndexPlan, { requireMembershipIndex: true })

  const probes = IR007_PERFORMANCE_PROBES.map((probe) => {
    const coldPlan = parsePlan(explainSql(explainStatement(probe.statement)))
    assertPlanSafety(coldPlan)
    const warmedPlans = Array.from({ length: 5 }, () => {
      const plan = parsePlan(explainSql(explainStatement(probe.statement)))
      assertPlanSafety(plan)
      return plan
    })
    const warmedMilliseconds = warmedPlans.map(executionMilliseconds)
    const observedP95 = p95(warmedMilliseconds)
    if (observedP95 > probe.limitMilliseconds) {
      throw new Error(`ir007-performance-p95-limit-exceeded-${probe.name}`)
    }
    return Object.freeze({
      name: probe.name,
      limitMilliseconds: probe.limitMilliseconds,
      coldMilliseconds: executionMilliseconds(coldPlan),
      warmedMilliseconds,
      p95Milliseconds: observedP95,
      explain: Object.freeze({ cold: coldPlan, warmed: warmedPlans }),
    })
  })

  return Object.freeze({
    fixture: IR007_PERFORMANCE_FIXTURE,
    authorizationIndexPlan,
    probes,
  })
}
