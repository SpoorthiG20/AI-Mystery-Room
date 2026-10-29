import test from 'node:test'
import assert from 'node:assert/strict'
import { createDashboardRequest } from './dashboardRequest.js'

test('Dashboard mount replays share one in-flight request and a later retry can run', async () => {
  let calls = 0
  const load = createDashboardRequest(async () => ({ calls: ++calls }))
  const [first, replay] = await Promise.all([load(), load()])
  assert.equal(first, replay)
  assert.equal(calls, 1)
  const retry = await load()
  assert.equal(retry.calls, 2)
})

test('a failed dashboard request clears so retry can succeed', async () => {
  let calls = 0
  const load = createDashboardRequest(async () => {
    calls += 1
    if (calls === 1) throw new Error('Temporary database error')
    return { cases: [], stats: { attempted: 0 } }
  })
  await assert.rejects(load(), /Temporary database error/)
  assert.deepEqual(await load(), { cases: [], stats: { attempted: 0 } })
  assert.equal(calls, 2)
})
