import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import app from '../app.js'

let server
let baseUrl

before(async () => {
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test('health endpoint reports service and current database state', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  const result = await response.json()
  assert.equal(response.status, 200)
  assert.equal(result.status, 'ok')
  assert.ok(['connected', 'configured-not-connected', 'not-configured'].includes(result.database))
})

test('case and dashboard routes reject unauthenticated requests', async () => {
  const [cases, dashboard] = await Promise.all([fetch(`${baseUrl}/api/cases`), fetch(`${baseUrl}/api/dashboard`)] )
  assert.equal(cases.status, 401)
  assert.equal(dashboard.status, 401)
})
