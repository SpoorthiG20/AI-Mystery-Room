import test from 'node:test'
import assert from 'node:assert/strict'
import { graphConnectionsSchema, graphLayoutSchema, playerTimelineSchema, validateCaseIntegrity } from '../validators/schemas.js'

function validCase(difficulty, suspectCount, evidenceCount) {
  const suspects = Array.from({ length: suspectCount }, (_, i) => ({ id: `suspect-${i}`, name: `Suspect ${i}`, role: 'Guest', personality: 'Careful observer', motive: 'A private disagreement', alibi: 'Was in the east hall', relationships: [], knownInformation: ['The gallery was busy.'] }))
  const timeline = Array.from({ length: evidenceCount }, (_, i) => ({ id: `event-${i}`, time: `${8 + i}:00 pm`, event: `A documented event number ${i} occurs.`, suspectIds: [suspects[i % suspectCount].id], evidenceIds: [`clue-${i}`], certainty: i % 2 ? 'claim' : 'confirmed' }))
  const evidence = Array.from({ length: evidenceCount }, (_, i) => ({ id: `clue-${i}`, title: `Record ${i}`, type: 'document', content: 'A fictional record with a detail to compare.', source: 'Case file', timestamp: `${8 + i}:00 pm`, relatedSuspectIds: [suspects[i % suspectCount].id], location: 'Gallery', reliability: { label: 'medium', reason: 'A record with some limits.' }, eventId: `event-${i}` }))
  return { title: 'The gallery mystery', summary: 'A sufficiently detailed case summary that gives the investigator an opening.', incidentType: 'Missing object', location: 'Gallery', incidentTime: 'Late evening', suspects, evidence, timeline, solution: { culpritId: suspects[0].id, motive: 'A longstanding rivalry', method: 'A quiet switch during the crowd', explanation: 'The timing, the access record, and a witness statement point to one consistent account of the event.', canonicalTimeline: timeline, secretFacts: [], scoringEvidenceIds: evidence.slice(0, 2).map((entry) => entry.id) }, crimeScene: { description: 'A fictional gallery prepared for a busy evening event.', hotspots: [] }, difficulty }
}

test('cases meet each difficulty minimum and exact suspect count', () => {
  for (const [difficulty, suspects, clues] of [['easy', 3, 5], ['medium', 4, 7], ['hard', 5, 9]]) {
    const result = validateCaseIntegrity(validCase(difficulty, suspects, clues), difficulty)
    assert.equal(result.suspects.length, suspects)
    assert.ok(result.evidence.length >= clues)
  }
})

test('case validation rejects duplicate IDs and references to missing people', () => {
  const duplicate = validCase('easy', 3, 5)
  duplicate.evidence[1].id = duplicate.evidence[0].id
  assert.throws(() => validateCaseIntegrity(duplicate, 'easy'), /IDs must be unique/)
  const badReference = validCase('easy', 3, 5)
  badReference.evidence[0].relatedSuspectIds = ['unknown-person']
  assert.throws(() => validateCaseIntegrity(badReference, 'easy'), /invalid suspect or event reference/)
})

test('investigation timeline and graph inputs reject malformed and duplicate entries', () => {
  assert.equal(playerTimelineSchema.safeParse([{ event: 'A note', time: '8 pm', evidenceIds: [] }]).success, true)
  assert.equal(playerTimelineSchema.safeParse([{ event: '', time: '8 pm', evidenceIds: [] }]).success, false)
  assert.equal(graphConnectionsSchema.safeParse([{ fromId: 'a', toId: 'b', label: 'Possible' }]).success, true)
  assert.equal(graphConnectionsSchema.safeParse([{ fromId: 'a', toId: 'b', extra: true }]).success, false)
  assert.equal(graphLayoutSchema.safeParse([{ nodeId: 'a', position: 0 }, { nodeId: 'a', position: 1 }]).success, false)
})
