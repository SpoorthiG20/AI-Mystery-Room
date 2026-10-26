import test from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { issueSession } from '../middleware/auth.js'
import CaseSolution from '../models/CaseSolution.js'
import MysteryCase from '../models/MysteryCase.js'
import { publicView } from '../routes/cases.js'
import GenerationRequest from '../models/GenerationRequest.js'

test('canonical solution fields exist only on the private solution model', () => {
  assert.ok(CaseSolution.schema.path('culpritId'))
  assert.ok(CaseSolution.schema.path('canonicalTimeline'))
  assert.equal(MysteryCase.schema.path('culpritId'), undefined)
  assert.equal(MysteryCase.schema.path('solutionExplanation'), undefined)
})

test('public case projection has no canonical solution fields', () => {
  const safe = publicView({ _id: 'case-id', title: 'Test case', originalScenario: 'A story', difficulty: 'easy', summary: 'A sufficiently long case summary.', incidentDetails: {}, publicSuspects: [], publicEvidence: [], publicTimeline: [], crimeScene: {}, status: 'active', createdAt: new Date(), solution: { culpritId: 'hidden' }, culpritId: 'hidden' })
  assert.equal(Object.hasOwn(safe, 'solution'), false)
  assert.equal(Object.hasOwn(safe, 'culpritId'), false)
  assert.ok(Array.isArray(safe.evidence))
})

test('generation request model enforces user-scoped idempotency and expires old keys', () => {
  const indexes = GenerationRequest.schema.indexes()
  assert.ok(indexes.some(([keys, options]) => keys.ownerId === 1 && keys.key === 1 && options.unique))
  assert.ok(indexes.some(([keys, options]) => keys.expiresAt === 1 && options.expireAfterSeconds === 0))
})

test('session token is signed and has a bounded lifetime', () => {
  const prior = process.env.SESSION_SECRET
  process.env.SESSION_SECRET = 'unit-test-only-secret-that-is-long-enough'
  try {
    const token = issueSession('user-123')
    const payload = jwt.verify(token, process.env.SESSION_SECRET, { issuer: 'ai-mystery-room' })
    assert.equal(payload.sub, 'user-123')
    assert.ok(payload.exp - payload.iat <= 7 * 24 * 60 * 60)
  } finally { if (prior === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = prior }
})
