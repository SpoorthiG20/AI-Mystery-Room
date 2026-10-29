import { Router } from 'express'
import mongoose from 'mongoose'
import { rateLimit } from 'express-rate-limit'
import CaseSolution from '../models/CaseSolution.js'
import Investigation from '../models/Investigation.js'
import MysteryCase from '../models/MysteryCase.js'
import User from '../models/User.js'
import { generateSuspectReply } from '../services/ai/interrogate.js'
import { calculateScore } from '../services/scoring.js'
import {
  graphConnectionsSchema,
  graphLayoutSchema,
  playerTimelineSchema,
  theorySchema,
  verdictSchema,
} from '../validators/schemas.js'

const router = Router()
const interrogationLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Please take a short break before questioning more suspects.',
  },
})
const isId = mongoose.isValidObjectId
async function ownedInvestigation(id, userId) {
  if (!isId(id)) return null
  return Investigation.findOne({ _id: id, userId })
}
async function validTheoryReferences(investigation, theory) {
  const item = await MysteryCase.findById(investigation.caseId).select(
    'publicSuspects publicEvidence',
  )
  const suspects = new Set(item?.publicSuspects.map((entry) => entry.id) || [])
  const discovered = new Set(investigation.discoveredEvidenceIds)
  const evidence = new Set(
    (item?.publicEvidence || [])
      .map((entry) => entry.id)
      .filter((id) => discovered.has(id)),
  )
  return (
    theory.suspectIds.every((id) => suspects.has(id)) &&
    [...theory.supportingEvidenceIds, ...theory.contradictingEvidenceIds].every(
      (id) => evidence.has(id),
    )
  )
}

router.post('/', async (request, response, next) => {
  try {
    const { caseId } = request.body || {}
    if (!isId(caseId))
      return response
        .status(400)
        .json({ error: 'Choose a valid case to investigate.' })
    const item = await MysteryCase.findOne({
      _id: caseId,
      createdBy: request.user._id,
      status: 'active',
    })
    if (!item) return response.status(404).json({ error: 'Case not found.' })
    let investigation = await Investigation.findOne({
      userId: request.user._id,
      caseId,
    })
    if (!investigation) {
      try {
        investigation = await Investigation.create({
          userId: request.user._id,
          caseId,
        })
      } catch (error) {
        if (error.code !== 11000) throw error
        investigation = await Investigation.findOne({
          userId: request.user._id,
          caseId,
        })
      }
    }
    if (!investigation)
      return response.status(503).json({
        error: 'Your investigation could not be opened. Please try again.',
      })
    return response.status(201).json({
      investigation: {
        id: String(investigation._id),
        caseId: String(item._id),
        status: investigation.status,
      },
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/:investigationId', async (request, response, next) => {
  try {
    const investigation = await ownedInvestigation(
      request.params.investigationId,
      request.user._id,
    )
    if (!investigation)
      return response.status(404).json({ error: 'Investigation not found.' })
    const item = await MysteryCase.findOne({
      _id: investigation.caseId,
      createdBy: request.user._id,
    })
    if (!item) return response.status(404).json({ error: 'Case not found.' })
    return response.json({
      investigation: {
        id: String(investigation._id),
        status: investigation.status,
        discoveredEvidenceIds: investigation.discoveredEvidenceIds,
        interrogationHistory: investigation.interrogationHistory,
        playerTimeline: investigation.playerTimeline,
        theories: investigation.theories,
        graphConnections: investigation.graphConnections,
        graphLayout: investigation.graphLayout,
        hintsUsed: investigation.hintsUsed,
        hintHistory: investigation.hintHistory,
        score: investigation.score,
        verdict: investigation.verdict,
        case: {
          id: String(item._id),
          title: item.title,
          difficulty: item.difficulty,
          summary: item.summary,
          incidentDetails: item.incidentDetails,
          suspects: item.publicSuspects,
          evidence: item.publicEvidence,
          timeline: item.publicTimeline,
          crimeScene: item.crimeScene,
        },
      },
    })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:investigationId', async (request, response, next) => {
  try {
    const investigation = await ownedInvestigation(
      request.params.investigationId,
      request.user._id,
    )
    if (!investigation || investigation.status !== 'active')
      return response
        .status(404)
        .json({ error: 'Active investigation not found.' })
    const body = request.body
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return response
        .status(400)
        .json({ error: 'Provide valid investigation changes.' })
    if (Object.hasOwn(body, 'playerTimeline')) {
      const parsed = playerTimelineSchema.safeParse(body.playerTimeline)
      if (!parsed.success)
        return response.status(400).json({
          error:
            parsed.error.issues[0]?.message || 'Check the timeline entries.',
        })
      const item = await MysteryCase.findById(investigation.caseId).select(
        'publicEvidence',
      )
      const validEvidence = new Set(
        item?.publicEvidence.map((entry) => entry.id) || [],
      )
      if (
        parsed.data.some((entry) =>
          entry.evidenceIds.some((id) => !validEvidence.has(id)),
        )
      )
        return response.status(400).json({
          error: 'Timeline notes must refer to evidence in this case.',
        })
      investigation.playerTimeline = parsed.data.map((entry) => ({
        ...entry,
        assumption: true,
      }))
    }
    if (Object.hasOwn(body, 'graphConnections')) {
      const parsed = graphConnectionsSchema.safeParse(body.graphConnections)
      if (!parsed.success)
        return response.status(400).json({
          error:
            parsed.error.issues[0]?.message || 'Check the board connections.',
        })
      const item = await MysteryCase.findById(investigation.caseId).select(
        'publicEvidence publicSuspects publicTimeline incidentDetails',
      )
      const validNodes = new Set([
        ...(item?.publicEvidence.map((entry) => entry.id) || []),
        ...(item?.publicEvidence.map((entry) => `location:${entry.location}`) ||
          []),
        ...(item?.publicSuspects.map((entry) => entry.id) || []),
        ...(item?.publicTimeline.map((entry) => `event:${entry.id}`) || []),
        `location:${item?.incidentDetails?.location || ''}`,
        ...(item?.publicSuspects.map((entry) => `motive:${entry.id}`) || []),
      ])
      if (
        parsed.data.some(
          (link) =>
            !validNodes.has(link.fromId) ||
            !validNodes.has(link.toId) ||
            link.fromId === link.toId,
        )
      )
        return response.status(400).json({
          error: 'Connections must link two different items in this case.',
        })
      investigation.graphConnections = parsed.data
    }
    if (Object.hasOwn(body, 'graphLayout')) {
      const parsed = graphLayoutSchema.safeParse(body.graphLayout)
      if (!parsed.success)
        return response.status(400).json({
          error:
            parsed.error.issues[0]?.message || 'The board layout is invalid.',
        })
      const item = await MysteryCase.findById(investigation.caseId).select(
        'publicEvidence publicSuspects publicTimeline incidentDetails',
      )
      const validNodes = new Set([
        ...(item?.publicEvidence.map((entry) => entry.id) || []),
        ...(item?.publicEvidence.map((entry) => `location:${entry.location}`) ||
          []),
        ...(item?.publicSuspects.map((entry) => entry.id) || []),
        ...(item?.publicTimeline.map((entry) => `event:${entry.id}`) || []),
        `location:${item?.incidentDetails?.location || ''}`,
        ...(item?.publicSuspects.map((entry) => `motive:${entry.id}`) || []),
      ])
      if (parsed.data.some((node) => !validNodes.has(node.nodeId)))
        return response.status(400).json({
          error: 'Board items must be unique case items with valid positions.',
        })
      investigation.graphLayout = parsed.data
    }
    if (
      !Object.hasOwn(body, 'playerTimeline') &&
      !Object.hasOwn(body, 'graphConnections') &&
      !Object.hasOwn(body, 'graphLayout')
    )
      return response.status(400).json({
        error: 'There are no supported investigation changes to save.',
      })
    await investigation.save()
    return response.json({ saved: true })
  } catch (error) {
    return next(error)
  }
})

router.get('/:investigationId/evidence', async (request, response, next) => {
  try {
    const investigation = await ownedInvestigation(
      request.params.investigationId,
      request.user._id,
    )
    if (!investigation)
      return response.status(404).json({ error: 'Investigation not found.' })
    const item = await MysteryCase.findById(investigation.caseId).select(
      'publicEvidence',
    )
    if (!item) return response.status(404).json({ error: 'Case not found.' })
    const evidence = item.publicEvidence.map((entry) => ({
      ...(entry.toObject?.() ?? entry),
      discovered: investigation.discoveredEvidenceIds.includes(entry.id),
    }))
    return response.json({ evidence })
  } catch (error) {
    return next(error)
  }
})

router.post(
  '/:investigationId/evidence/:evidenceId/discover',
  async (request, response, next) => {
    try {
      const investigation = await ownedInvestigation(
        request.params.investigationId,
        request.user._id,
      )
      if (!investigation || investigation.status !== 'active')
        return response
          .status(404)
          .json({ error: 'Active investigation not found.' })
      const item = await MysteryCase.findById(investigation.caseId).select(
        'publicEvidence',
      )
      if (
        !item?.publicEvidence.some(
          (entry) => entry.id === request.params.evidenceId,
        )
      )
        return response.status(404).json({ error: 'Evidence not found.' })
      const updated = await Investigation.findOneAndUpdate(
        { _id: investigation._id, userId: request.user._id, status: 'active' },
        { $addToSet: { discoveredEvidenceIds: request.params.evidenceId } },
        { new: true },
      )
      if (!updated)
        return response
          .status(404)
          .json({ error: 'Active investigation not found.' })
      return response.json({
        discoveredEvidenceIds: updated.discoveredEvidenceIds,
      })
    } catch (error) {
      return next(error)
    }
  },
)

router.post(
  '/:investigationId/interrogate',
  interrogationLimit,
  async (request, response, next) => {
    try {
      const investigation = await ownedInvestigation(
        request.params.investigationId,
        request.user._id,
      )
      if (!investigation || investigation.status !== 'active')
        return response
          .status(404)
          .json({ error: 'Active investigation not found.' })
      const question =
        typeof request.body?.question === 'string'
          ? request.body.question.trim().slice(0, 1000)
          : ''
      const suspectId =
        typeof request.body?.suspectId === 'string'
          ? request.body.suspectId
          : ''
      if (question.length < 2 || !suspectId)
        return response
          .status(400)
          .json({ error: 'Choose a suspect and enter a question.' })
      const item = await MysteryCase.findById(investigation.caseId).select(
        'publicSuspects publicEvidence',
      )
      const suspect = item?.publicSuspects.find(
        (entry) => entry.id === suspectId,
      )
      if (!suspect)
        return response.status(404).json({ error: 'Suspect not found.' })
      const discovered = item.publicEvidence.filter((entry) =>
        investigation.discoveredEvidenceIds.includes(entry.id),
      )
      const answer = await generateSuspectReply({
        suspect,
        discoveredEvidence: discovered,
        question,
      })
      investigation.interrogationHistory.push({ suspectId, question, answer })
      await investigation.save()
      return response.json({ answer })
    } catch (error) {
      return next(error)
    }
  },
)

router.post('/:investigationId/hint', async (request, response, next) => {
  try {
    const investigation = await ownedInvestigation(
      request.params.investigationId,
      request.user._id,
    )
    if (!investigation || investigation.status !== 'active')
      return response
        .status(404)
        .json({ error: 'Active investigation not found.' })
    const [item, solution] = await Promise.all([
      MysteryCase.findById(investigation.caseId).select(
        'difficulty publicEvidence',
      ),
      CaseSolution.findOne({ caseId: investigation.caseId }).select(
        'scoringEvidenceIds',
      ),
    ])
    if (!item || !solution)
      return response.status(404).json({ error: 'Case not found.' })
    const maximum = item.difficulty === 'easy' ? 2 : 3
    const nextClue = item.publicEvidence.find(
      (entry) =>
        solution.scoringEvidenceIds.includes(entry.id) &&
        !investigation.discoveredEvidenceIds.includes(entry.id),
    )
    const text = nextClue
      ? `Take another look at “${nextClue.title}”. Compare its source and timing with the nearby accounts in your case file.`
      : 'Review the evidence you have already examined and compare its timestamps with the different accounts.'
    const updated = await Investigation.findOneAndUpdate(
      {
        _id: investigation._id,
        userId: request.user._id,
        status: 'active',
        hintsUsed: { $lt: maximum },
      },
      { $inc: { hintsUsed: 1 }, $push: { hintHistory: { text } } },
      { new: true },
    )
    if (!updated)
      return response
        .status(409)
        .json({ error: 'You have used all the available hints for this case.' })
    return response.json({
      hint: text,
      hintsUsed: updated.hintsUsed,
      hintsAvailable: maximum - updated.hintsUsed,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/:investigationId/timeline', async (request, response, next) => {
  try {
    const investigation = await ownedInvestigation(
      request.params.investigationId,
      request.user._id,
    )
    if (!investigation)
      return response.status(404).json({ error: 'Investigation not found.' })
    const item = await MysteryCase.findById(investigation.caseId).select(
      'publicTimeline',
    )
    return response.json({
      timeline: item?.publicTimeline || [],
      playerTimeline: investigation.playerTimeline,
    })
  } catch (error) {
    return next(error)
  }
})

router.put('/:investigationId/timeline', async (request, response, next) => {
  try {
    const investigation = await ownedInvestigation(
      request.params.investigationId,
      request.user._id,
    )
    const entries = request.body?.playerTimeline
    if (!investigation || investigation.status !== 'active')
      return response
        .status(404)
        .json({ error: 'Active investigation not found.' })
    const parsed = playerTimelineSchema.safeParse(entries)
    if (!parsed.success)
      return response.status(400).json({
        error: parsed.error.issues[0]?.message || 'Check the timeline entries.',
      })
    const item = await MysteryCase.findById(investigation.caseId).select(
      'publicEvidence',
    )
    const validEvidence = new Set(
      item?.publicEvidence.map((entry) => entry.id) || [],
    )
    if (
      parsed.data.some((entry) =>
        entry.evidenceIds.some((id) => !validEvidence.has(id)),
      )
    )
      return response
        .status(400)
        .json({ error: 'Timeline notes must refer to evidence in this case.' })
    investigation.playerTimeline = parsed.data.map((entry) => ({
      ...entry,
      assumption: true,
    }))
    await investigation.save()
    return response.json({
      saved: true,
      playerTimeline: investigation.playerTimeline,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/:investigationId/theories', async (request, response, next) => {
  try {
    const investigation = await ownedInvestigation(
      request.params.investigationId,
      request.user._id,
    )
    if (!investigation)
      return response.status(404).json({ error: 'Investigation not found.' })
    return response.json({ theories: investigation.theories })
  } catch (error) {
    return next(error)
  }
})

router.post('/:investigationId/theories', async (request, response, next) => {
  try {
    const investigation = await ownedInvestigation(
      request.params.investigationId,
      request.user._id,
    )
    const parsed = theorySchema.safeParse(request.body)
    if (!investigation || investigation.status !== 'active')
      return response
        .status(404)
        .json({ error: 'Active investigation not found.' })
    if (!parsed.success)
      return response.status(400).json({
        error: parsed.error.issues[0]?.message || 'Check the theory details.',
      })
    if (!(await validTheoryReferences(investigation, parsed.data)))
      return response.status(400).json({
        error: 'Theory links must refer to people and evidence in this case.',
      })
    investigation.theories.push(parsed.data)
    await investigation.save()
    return response.status(201).json({ theories: investigation.theories })
  } catch (error) {
    return next(error)
  }
})

router.patch(
  '/:investigationId/theories/:theoryId',
  async (request, response, next) => {
    try {
      const investigation = await ownedInvestigation(
        request.params.investigationId,
        request.user._id,
      )
      const parsed = theorySchema.safeParse(request.body)
      if (!investigation || investigation.status !== 'active')
        return response
          .status(404)
          .json({ error: 'Active investigation not found.' })
      if (!parsed.success)
        return response.status(400).json({
          error: parsed.error.issues[0]?.message || 'Check the theory details.',
        })
      if (!(await validTheoryReferences(investigation, parsed.data)))
        return response.status(400).json({
          error: 'Theory links must refer to people and evidence in this case.',
        })
      const theory = investigation.theories.id(request.params.theoryId)
      if (!theory)
        return response.status(404).json({ error: 'Theory not found.' })
      theory.set(parsed.data)
      await investigation.save()
      return response.json({ theories: investigation.theories })
    } catch (error) {
      return next(error)
    }
  },
)

router.delete(
  '/:investigationId/theories/:theoryId',
  async (request, response, next) => {
    try {
      const investigation = await ownedInvestigation(
        request.params.investigationId,
        request.user._id,
      )
      if (!investigation || investigation.status !== 'active')
        return response
          .status(404)
          .json({ error: 'Active investigation not found.' })
      const theory = investigation.theories.id(request.params.theoryId)
      if (!theory)
        return response.status(404).json({ error: 'Theory not found.' })
      theory.deleteOne()
      await investigation.save()
      return response.json({ theories: investigation.theories })
    } catch (error) {
      return next(error)
    }
  },
)

router.post('/:investigationId/verdict', async (request, response, next) => {
  try {
    const investigation = await ownedInvestigation(
      request.params.investigationId,
      request.user._id,
    )
    if (!investigation)
      return response.status(404).json({ error: 'Investigation not found.' })
    if (investigation.status === 'completed')
      return response
        .status(409)
        .json({ error: 'A verdict has already been submitted.' })
    const input = verdictSchema.safeParse(request.body)
    if (!input.success)
      return response.status(400).json({
        error: input.error.issues[0]?.message || 'Check your accusation.',
      })
    const [item, solution] = await Promise.all([
      MysteryCase.findOne({
        _id: investigation.caseId,
        createdBy: request.user._id,
      }),
      CaseSolution.findOne({ caseId: investigation.caseId }),
    ])
    if (!item || !solution)
      return response
        .status(404)
        .json({ error: 'Case solution is unavailable.' })
    if (
      !item.publicSuspects.some(
        (suspect) => suspect.id === input.data.culpritId,
      )
    )
      return response
        .status(400)
        .json({ error: 'Choose a suspect from this case.' })
    const discovered = new Set(investigation.discoveredEvidenceIds)
    const supporting = [...new Set(input.data.supportingEvidenceIds)].filter(
      (id) => discovered.has(id),
    )
    const correct = input.data.culpritId === solution.culpritId
    const scoreResult = calculateScore({
      difficulty: item.difficulty,
      correct,
      submittedEvidenceIds: supporting,
      allowedEvidenceIds: solution.scoringEvidenceIds,
      hintsUsed: investigation.hintsUsed,
    })
    const verdict = {
      culpritId: input.data.culpritId,
      motive: input.data.motive,
      method: input.data.method,
      supportingEvidenceIds: supporting,
      explanation: input.data.explanation,
      correct,
      submittedAt: new Date(),
      scoring: scoreResult,
    }
    const saved = await Investigation.findOneAndUpdate(
      {
        _id: investigation._id,
        userId: request.user._id,
        status: 'active',
        verdict: null,
      },
      {
        $set: {
          verdict,
          score: scoreResult.score,
          status: 'completed',
          completedAt: new Date(),
        },
      },
      { new: true },
    )
    if (!saved)
      return response
        .status(409)
        .json({ error: 'A verdict has already been submitted.' })
    await User.updateOne(
      { _id: request.user._id },
      {
        $inc: { points: scoreResult.score },
        $addToSet: { achievements: 'first-verdict' },
      },
    )
    const culprit = item.publicSuspects.find(
      (suspect) => suspect.id === solution.culpritId,
    )
    return response.json({
      verdict: saved.verdict,
      solution: {
        culpritId: solution.culpritId,
        culpritName: culprit?.name,
        motive: solution.canonicalMotive,
        method: solution.canonicalMethod,
        explanation: solution.solutionExplanation,
        canonicalTimeline: solution.canonicalTimeline,
        supportingEvidenceIds: solution.scoringEvidenceIds,
      },
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/:investigationId/result', async (request, response, next) => {
  try {
    const investigation = await ownedInvestigation(
      request.params.investigationId,
      request.user._id,
    )
    if (!investigation)
      return response.status(404).json({ error: 'Investigation not found.' })
    if (investigation.status !== 'completed' || !investigation.verdict)
      return response.status(403).json({
        error: 'Submit your final accusation before viewing the solution.',
      })
    const solution = await CaseSolution.findOne({
      caseId: investigation.caseId,
    })
    const item = await MysteryCase.findById(investigation.caseId).select(
      'publicSuspects',
    )
    const culprit = item?.publicSuspects.find(
      (suspect) => suspect.id === solution?.culpritId,
    )
    return response.json({
      verdict: investigation.verdict,
      score: investigation.score,
      hintsUsed: investigation.hintsUsed,
      solution: solution
        ? {
            culpritId: solution.culpritId,
            culpritName: culprit?.name,
            motive: solution.canonicalMotive,
            method: solution.canonicalMethod,
            explanation: solution.solutionExplanation,
            canonicalTimeline: solution.canonicalTimeline,
            supportingEvidenceIds: solution.scoringEvidenceIds,
          }
        : null,
    })
  } catch (error) {
    return next(error)
  }
})

export default router
