import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(254),
  password: z.string().min(10).max(128).regex(/[a-z]/, 'Include a lowercase letter.').regex(/[A-Z]/, 'Include an uppercase letter.').regex(/[0-9]/, 'Include a number.'),
})

export const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(128) })
export const generateCaseSchema = z.object({ scenario: z.string().trim().min(40).max(4000), difficulty: z.enum(['easy', 'medium', 'hard']) })
export const verdictSchema = z.object({
  culpritId: z.string().min(1), motive: z.string().max(1000).default(''), method: z.string().max(1000).default(''),
  supportingEvidenceIds: z.array(z.string()).max(50).default([]), explanation: z.string().max(3000).default(''),
})
export const theorySchema = z.object({
  title: z.string().trim().min(1).max(100), explanation: z.string().max(2000).default(''), suspectIds: z.array(z.string()).max(10).default([]),
  supportingEvidenceIds: z.array(z.string()).max(50).default([]), contradictingEvidenceIds: z.array(z.string()).max(50).default([]),
  missingInformation: z.string().max(1000).default(''), notes: z.string().max(2000).default(''),
})

const playerTimelineEntrySchema = z.object({
  event: z.string().trim().min(1).max(500),
  time: z.string().trim().min(1).max(100),
  evidenceIds: z.array(z.string().min(1)).max(20).default([]),
}).strict()
export const playerTimelineSchema = z.array(playerTimelineEntrySchema).max(100)

export const graphConnectionsSchema = z.array(z.object({
  fromId: z.string().min(1).max(100),
  toId: z.string().min(1).max(100),
  label: z.string().max(120).default('Possible connection'),
}).strict()).max(150)

export const graphLayoutSchema = z.array(z.object({
  nodeId: z.string().min(1).max(100),
  position: z.number().int().min(0).max(100),
}).strict()).max(150).superRefine((nodes, context) => {
  if (new Set(nodes.map((node) => node.nodeId)).size !== nodes.length) {
    context.addIssue({ code: 'custom', message: 'Board items must be unique.', path: [] })
  }
})

const suspectSchema = z.object({
  id: z.string().min(1), name: z.string().min(1).max(100), role: z.string().min(1).max(160), personality: z.string().min(1).max(500),
  motive: z.string().min(1).max(500), alibi: z.string().min(1).max(700), relationships: z.array(z.string()).max(10),
  knownInformation: z.array(z.string()).max(12),
})
const reliabilitySchema = z.object({ label: z.enum(['high', 'medium', 'low', 'unverified']), reason: z.string().min(1).max(400) })
const evidenceSchema = z.object({
  id: z.string().min(1), title: z.string().min(1).max(120), type: z.enum(['document', 'message', 'cctv', 'witness', 'forensic', 'call-log', 'photograph', 'record', 'other']),
  content: z.string().min(1).max(2000), source: z.string().min(1).max(200), timestamp: z.string().max(100), relatedSuspectIds: z.array(z.string()).max(10),
  location: z.string().max(200), reliability: reliabilitySchema, eventId: z.string().min(1),
})
const timelineSchema = z.object({ id: z.string().min(1), time: z.string().min(1).max(100), event: z.string().min(1).max(500), suspectIds: z.array(z.string()), evidenceIds: z.array(z.string()), certainty: z.enum(['confirmed', 'claim', 'uncertain']) })

export const generatedCaseSchema = z.object({
  title: z.string().min(5).max(120), summary: z.string().min(30).max(1200), incidentType: z.string().min(1).max(100), location: z.string().min(1).max(200), incidentTime: z.string().min(1).max(100),
  suspects: z.array(suspectSchema), evidence: z.array(evidenceSchema), timeline: z.array(timelineSchema),
  solution: z.object({ culpritId: z.string().min(1), motive: z.string().min(1).max(1000), method: z.string().min(1).max(1000), explanation: z.string().min(50).max(3000), canonicalTimeline: z.array(timelineSchema).min(1), secretFacts: z.array(z.string()).max(20), scoringEvidenceIds: z.array(z.string()).min(1) }),
  crimeScene: z.object({ description: z.string().min(20).max(1000), hotspots: z.array(z.object({ id: z.string(), label: z.string(), description: z.string(), evidenceId: z.string().nullable() })).max(12) }),
})

export const generatedCaseJsonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' }, summary: { type: 'string' }, incidentType: { type: 'string' }, location: { type: 'string' }, incidentTime: { type: 'string' },
    suspects: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, role: { type: 'string' }, personality: { type: 'string' }, motive: { type: 'string' }, alibi: { type: 'string' }, relationships: { type: 'array', items: { type: 'string' } }, knownInformation: { type: 'array', items: { type: 'string' } } }, required: ['id','name','role','personality','motive','alibi','relationships','knownInformation'] } },
    evidence: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, type: { type: 'string', enum: ['document','message','cctv','witness','forensic','call-log','photograph','record','other'] }, content: { type: 'string' }, source: { type: 'string' }, timestamp: { type: 'string' }, relatedSuspectIds: { type: 'array', items: { type: 'string' } }, location: { type: 'string' }, reliability: { type: 'object', properties: { label: { type: 'string', enum: ['high','medium','low','unverified'] }, reason: { type: 'string' } }, required: ['label','reason'] }, eventId: { type: 'string' } }, required: ['id','title','type','content','source','timestamp','relatedSuspectIds','location','reliability','eventId'] } },
    timeline: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, time: { type: 'string' }, event: { type: 'string' }, suspectIds: { type: 'array', items: { type: 'string' } }, evidenceIds: { type: 'array', items: { type: 'string' } }, certainty: { type: 'string', enum: ['confirmed','claim','uncertain'] } }, required: ['id','time','event','suspectIds','evidenceIds','certainty'] } },
    solution: { type: 'object', properties: { culpritId: { type: 'string' }, motive: { type: 'string' }, method: { type: 'string' }, explanation: { type: 'string' }, canonicalTimeline: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, time: { type: 'string' }, event: { type: 'string' }, suspectIds: { type: 'array', items: { type: 'string' } }, evidenceIds: { type: 'array', items: { type: 'string' } }, certainty: { type: 'string', enum: ['confirmed','claim','uncertain'] } }, required: ['id','time','event','suspectIds','evidenceIds','certainty'] } }, secretFacts: { type: 'array', items: { type: 'string' } }, scoringEvidenceIds: { type: 'array', items: { type: 'string' } } }, required: ['culpritId','motive','method','explanation','canonicalTimeline','secretFacts','scoringEvidenceIds'] },
    crimeScene: { type: 'object', properties: { description: { type: 'string' }, hotspots: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, label: { type: 'string' }, description: { type: 'string' }, evidenceId: { type: ['string','null'] } }, required: ['id','label','description','evidenceId'] } } }, required: ['description','hotspots'] },
  },
  required: ['title','summary','incidentType','location','incidentTime','suspects','evidence','timeline','solution','crimeScene'],
}

export function validateCaseIntegrity(data, difficulty) {
  const parsed = generatedCaseSchema.parse(data)
  const expected = { easy: { suspects: 3, clues: 5 }, medium: { suspects: 4, clues: 7 }, hard: { suspects: 5, clues: 9 } }[difficulty]
  if (parsed.suspects.length !== expected.suspects) throw new Error(`Expected ${expected.suspects} suspects for ${difficulty}.`)
  if (parsed.evidence.length < expected.clues) throw new Error(`Expected at least ${expected.clues} evidence items for ${difficulty}.`)
  const unique = (values) => new Set(values).size === values.length
  const suspectIds = parsed.suspects.map((item) => item.id)
  const evidenceIds = parsed.evidence.map((item) => item.id)
  const eventIds = parsed.timeline.map((item) => item.id)
  const hotspotIds = parsed.crimeScene.hotspots.map((item) => item.id)
  if (!unique(suspectIds) || !unique(evidenceIds) || !unique(eventIds) || !unique(parsed.solution.canonicalTimeline.map((event) => event.id))) throw new Error('Suspect, evidence, and timeline IDs must be unique.')
  if (!unique(hotspotIds)) throw new Error('Crime scene hotspot IDs must be unique.')
  if (!suspectIds.includes(parsed.solution.culpritId)) throw new Error('The canonical culprit must be one of the generated suspects.')
  if (parsed.solution.scoringEvidenceIds.some((id) => !evidenceIds.includes(id))) throw new Error('Scoring evidence must refer to existing evidence.')
  for (const clue of parsed.evidence) {
    const event = parsed.timeline.find((item) => item.id === clue.eventId)
    if (!event || !event.evidenceIds.includes(clue.id) || clue.relatedSuspectIds.some((id) => !suspectIds.includes(id))) throw new Error('Evidence has an invalid suspect or event reference.')
  }
  for (const event of parsed.timeline) {
    if (event.suspectIds.some((id) => !suspectIds.includes(id)) || event.evidenceIds.some((id) => !evidenceIds.includes(id))) throw new Error('Timeline has an invalid suspect or evidence reference.')
  }
  for (const event of parsed.solution.canonicalTimeline) {
    if (event.suspectIds.some((id) => !suspectIds.includes(id)) || event.evidenceIds.some((id) => !evidenceIds.includes(id))) throw new Error('Canonical timeline has an invalid suspect or evidence reference.')
  }
  if (parsed.crimeScene.hotspots.some((spot) => spot.evidenceId !== null && !evidenceIds.includes(spot.evidenceId))) throw new Error('A crime scene hotspot refers to missing evidence.')
  return parsed
}
