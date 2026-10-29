import test from 'node:test'
import assert from 'node:assert/strict'
import {
  claimGenerationRequest,
  completedGenerationExpiry,
} from '../services/generationIdempotency.js'

function createMemoryModel() {
  const records = new Map()
  return {
    async create(value) {
      await Promise.resolve()
      const index = `${value.ownerId}:${value.key}`
      if (records.has(index))
        throw Object.assign(new Error('duplicate'), { code: 11000 })
      const request = { ...value, _id: index }
      records.set(index, request)
      return request
    },
    findOne({ ownerId, key }) {
      return { lean: async () => records.get(`${ownerId}:${key}`) || null }
    },
    async deleteOne({ ownerId, key }) {
      records.delete(`${ownerId}:${key}`)
    },
    records,
  }
}

test('concurrent duplicate generation requests acquire only one claim', async () => {
  const Model = createMemoryModel()
  const [first, second] = await Promise.all([
    claimGenerationRequest(Model, 'user-1', 'request-key-12345678'),
    claimGenerationRequest(Model, 'user-1', 'request-key-12345678'),
  ])
  assert.deepEqual([first.kind, second.kind].sort(), ['claimed', 'pending'])
  assert.equal(Model.records.size, 1)
})

test('completed requests retain their result identity for safe client retries', async () => {
  const Model = createMemoryModel()
  const first = await claimGenerationRequest(
    Model,
    'user-1',
    'request-key-12345678',
  )
  first.request.status = 'completed'
  first.request.caseId = 'case-123'
  const duplicate = await claimGenerationRequest(
    Model,
    'user-1',
    'request-key-12345678',
  )
  assert.equal(duplicate.kind, 'completed')
  assert.equal(duplicate.request.caseId, 'case-123')
})

test('completed idempotency records have a bounded retention window', () => {
  const now = new Date('2026-01-01T00:00:00.000Z')
  assert.equal(
    completedGenerationExpiry(now).getTime() - now.getTime(),
    24 * 60 * 60 * 1000,
  )
})
