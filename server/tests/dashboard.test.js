import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import getDashboard from '../services/dashboard.js'
import Investigation from '../models/Investigation.js'
import MysteryCase from '../models/MysteryCase.js'

const userId = '64b000000000000000000011'
let originals

function queryResult(result) {
  const query = {
    sort() {
      return this
    },
    limit() {
      return this
    },
    select() {
      return this
    },
    lean: async () => result,
  }
  return query
}

before(() => {
  originals = {
    cases: MysteryCase.find,
    investigations: Investigation.find,
    aggregate: Investigation.aggregate,
  }
})

after(() => {
  MysteryCase.find = originals.cases
  Investigation.find = originals.investigations
  Investigation.aggregate = originals.aggregate
})

test('dashboard statistics use only the authenticated user’s persisted investigation totals', async () => {
  const caseRecord = {
    _id: 'case-1',
    title: 'The old observatory',
    difficulty: 'medium',
    summary: 'A case summary.',
  }
  const investigation = {
    _id: 'investigation-1',
    caseId: 'case-1',
    status: 'completed',
    score: 180,
    verdict: { correct: true },
  }
  MysteryCase.find = (query) => {
    assert.deepEqual(query, { createdBy: userId, status: 'active' })
    return queryResult([caseRecord])
  }
  Investigation.find = (query) => {
    assert.deepEqual(query, { userId })
    return queryResult([investigation])
  }
  Investigation.aggregate = async ([match, group]) => {
    assert.deepEqual(match, { $match: { userId } })
    assert.ok(group.$group.averageScore)
    assert.ok(group.$group.totalPoints)
    return [
      {
        attempted: 3,
        completed: 2,
        solved: 2,
        correct: 2,
        averageScore: 147.5,
        totalPoints: 295,
      },
    ]
  }

  const result = await getDashboard(userId)
  assert.deepEqual(result.stats, {
    attempted: 3,
    completed: 2,
    solved: 2,
    correctRate: 100,
    averageScore: 148,
    totalPoints: 295,
    rank: 'Junior Detective',
    avg: 148,
  })
  assert.equal(result.cases[0].investigationId, 'investigation-1')
})

test('dashboard with no saved investigations returns real zero totals and the entry rank', async () => {
  MysteryCase.find = () => queryResult([])
  Investigation.find = () => queryResult([])
  Investigation.aggregate = async () => []
  const result = await getDashboard(userId)
  assert.deepEqual(result.stats, {
    attempted: 0,
    completed: 0,
    solved: 0,
    correctRate: 0,
    averageScore: 0,
    totalPoints: 0,
    rank: 'Trainee Detective',
    avg: 0,
  })
})
