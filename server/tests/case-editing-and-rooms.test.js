import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import app from '../app.js'
import { authCookieName, issueSession } from '../middleware/auth.js'
import MysteryCase from '../models/MysteryCase.js'
import Room from '../models/Room.js'
import User from '../models/User.js'
import { editCaseSchema } from '../validators/schemas.js'

const userId = '64b000000000000000000001'
const guestUserId = '64b000000000000000000002'
const caseId = '64b000000000000000000003'
const caseRecord = {
  _id: caseId,
  createdBy: userId,
  title: 'The gallery mystery',
  originalScenario:
    'A sufficiently detailed story about an incident at the gallery.',
  difficulty: 'medium',
  summary: 'A case summary that remains unchanged when metadata is edited.',
  incidentDetails: { location: 'Gallery' },
  publicSuspects: [{ id: 's1' }],
  publicEvidence: [{ id: 'e1' }],
  publicTimeline: [{ id: 't1' }],
  crimeScene: { hotspots: [] },
  status: 'active',
  createdAt: new Date(),
}
let server
let baseUrl
let originals

before(async () => {
  process.env.SESSION_SECRET = 'unit-test-only-session-secret-0123456789'
  originals = {
    userFind: User.findById,
    update: MysteryCase.findOneAndUpdate,
    find: MysteryCase.findOne,
    caseFindById: MysteryCase.findById,
    roomCreate: Room.create,
    roomFindById: Room.findById,
    roomJoin: Room.findOneAndUpdate,
  }
  User.findById = (id) => ({
    select: async () => ({ _id: String(id), name: 'Detective' }),
  })
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  User.findById = originals.userFind
  MysteryCase.findOneAndUpdate = originals.update
  MysteryCase.findOne = originals.find
  MysteryCase.findById = originals.caseFindById
  Room.create = originals.roomCreate
  Room.findById = originals.roomFindById
  Room.findOneAndUpdate = originals.roomJoin
  if (server)
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
})

async function request(path, options = {}, actorId = userId) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Cookie: `${authCookieName}=${issueSession(actorId)}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
}

test('case editing validates only editable fields and rejects extra fields', () => {
  const valid = {
    title: 'Revised gallery mystery',
    originalScenario:
      'A new premise with at least forty characters for the case.',
    difficulty: 'hard',
  }
  assert.equal(editCaseSchema.safeParse(valid).success, true)
  assert.equal(
    editCaseSchema.safeParse({ ...valid, difficulty: 'expert' }).success,
    false,
  )
  assert.equal(
    editCaseSchema.safeParse({ ...valid, publicEvidence: [] }).success,
    false,
  )
  assert.equal(
    editCaseSchema.safeParse({ ...valid, originalScenario: 'too short' })
      .success,
    false,
  )
})

test('case PATCH updates the existing owner record fields only and preserves case data', async () => {
  let updateQuery
  let update
  MysteryCase.findOneAndUpdate = async (query, changes) => {
    updateQuery = query
    update = changes
    return { ...caseRecord, ...changes.$set }
  }
  const response = await request(`/api/cases/${caseId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title: 'Revised gallery mystery',
      originalScenario:
        'A revised premise with enough detail to pass the validation requirement.',
      difficulty: 'hard',
    }),
  })
  const result = await response.json()
  assert.equal(response.status, 200)
  assert.equal(result.message, 'Case changes saved.')
  assert.deepEqual(updateQuery, { _id: caseId, createdBy: userId })
  assert.deepEqual(Object.keys(update.$set).sort(), [
    'difficulty',
    'originalScenario',
    'title',
  ])
  assert.deepEqual(result.case.suspects, caseRecord.publicSuspects)
  assert.deepEqual(result.case.evidence, caseRecord.publicEvidence)
  assert.deepEqual(result.case.timeline, caseRecord.publicTimeline)
  assert.equal(result.case.summary, caseRecord.summary)
})

test('case PATCH rejects invalid data and hides cases owned by someone else', async () => {
  let calls = 0
  MysteryCase.findOneAndUpdate = async (query) => {
    calls += 1
    assert.equal(query.createdBy, userId)
    return null
  }
  const invalid = await request(`/api/cases/${caseId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title: 'x',
      originalScenario: 'short',
      difficulty: 'hard',
    }),
  })
  assert.equal(invalid.status, 400)
  assert.equal(calls, 0)
  const inaccessible = await request(`/api/cases/${caseId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title: 'Revised gallery mystery',
      originalScenario:
        'A revised premise with enough detail to pass the validation requirement.',
      difficulty: 'hard',
    }),
  })
  assert.equal(inaccessible.status, 404)
  assert.equal(calls, 1)
})

test('room creation returns a unique shareable code and joining by code adds membership', async () => {
  const created = []
  const persistedRooms = new Map()
  MysteryCase.findOne = (query) => {
    assert.deepEqual(query, {
      _id: caseId,
      createdBy: userId,
      status: 'active',
    })
    return { select: async () => ({ _id: caseId }) }
  }
  Room.create = async (room) => {
    created.push(room)
    const saved = {
      ...room,
      _id: `64b00000000000000000000${created.length}`,
      status: 'open',
    }
    persistedRooms.set(String(saved._id), saved)
    return saved
  }
  const first = await request('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ caseId }),
  })
  const firstResult = await first.json()
  const second = await request('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ caseId }),
  })
  const secondResult = await second.json()
  assert.equal(first.status, 201)
  assert.equal(second.status, 201)
  assert.match(firstResult.room.code, /^[A-F0-9]{6}$/)
  assert.notEqual(firstResult.room.code, secondResult.room.code)
  assert.deepEqual(created[0].memberUserIds, [userId])

  Room.findById = (id) => ({
    populate: async () => {
      const saved = persistedRooms.get(String(id))
      return (
        saved && {
          ...saved,
          memberUserIds: saved.memberUserIds.map((_memberId) => ({
            _id: userId,
            name: 'Detective',
          })),
        }
      )
    },
  })
  MysteryCase.findById = (id) => ({
    select: async () =>
      String(id) === caseId
        ? {
            _id: caseId,
            title: 'The gallery mystery',
            summary: caseRecord.summary,
            difficulty: 'medium',
            incidentDetails: {},
            publicSuspects: caseRecord.publicSuspects,
            publicEvidence: caseRecord.publicEvidence,
            publicTimeline: caseRecord.publicTimeline,
            crimeScene: null,
          }
        : null,
  })
  const retrieved = await request(`/api/rooms/${firstResult.room.id}`)
  const retrievedResult = await retrieved.json()
  assert.equal(retrieved.status, 200)
  assert.equal(retrievedResult.room.code, firstResult.room.code)
  assert.equal(retrievedResult.room.case.id, caseId)
  assert.equal(retrievedResult.room.members[0].name, 'Detective')

  let joinQuery
  let joinUpdate
  Room.findOneAndUpdate = async (query, update) => {
    joinQuery = query
    joinUpdate = update
    return {
      _id: '64b000000000000000000009',
      roomCode: firstResult.room.code,
      status: 'open',
    }
  }
  const joined = await request(
    '/api/rooms/join',
    {
      method: 'POST',
      body: JSON.stringify({ code: firstResult.room.code.toLowerCase() }),
    },
    guestUserId,
  )
  const joinedResult = await joined.json()
  assert.equal(joined.status, 200)
  assert.equal(joinQuery.roomCode, firstResult.room.code)
  assert.equal(joinQuery.status, 'open')
  assert.deepEqual(joinUpdate, { $addToSet: { memberUserIds: guestUserId } })
  assert.equal(joinedResult.room.code, firstResult.room.code)
})
