import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateScore } from '../services/scoring.js'

test('difficulty base scores are server calculated and unique relevant clues count once', () => {
  const result = calculateScore({ difficulty: 'easy', correct: true, submittedEvidenceIds: ['clue-a', 'clue-a', 'clue-b', 'red-herring'], allowedEvidenceIds: ['clue-a', 'clue-b'], hintsUsed: 1 })
  assert.deepEqual(result, { score: 100, base: 100, cluePoints: 10, hintPenalty: 10, relevantEvidenceIds: ['clue-a', 'clue-b'] })
})

test('incorrect accusation receives no culprit base score and scores cannot fall below zero', () => {
  const wrong = calculateScore({ difficulty: 'hard', correct: false, submittedEvidenceIds: ['key-clue'], allowedEvidenceIds: ['key-clue'], hintsUsed: 0 })
  const penalized = calculateScore({ difficulty: 'easy', correct: true, submittedEvidenceIds: [], allowedEvidenceIds: [], hintsUsed: 20 })
  assert.equal(wrong.base, 0)
  assert.equal(wrong.score, 5)
  assert.equal(penalized.score, 0)
})

test('each difficulty uses its specified correct-accusation base', () => {
  for (const [difficulty, expected] of [['easy', 100], ['medium', 150], ['hard', 200]]) {
    const result = calculateScore({ difficulty, correct: true, submittedEvidenceIds: [], allowedEvidenceIds: [], hintsUsed: 0 })
    assert.equal(result.base, expected)
    assert.equal(result.score, expected)
  }
})
