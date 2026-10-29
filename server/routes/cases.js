import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import mongoose from 'mongoose'
import CaseSolution from '../models/CaseSolution.js'
import GenerationRequest from '../models/GenerationRequest.js'
import MysteryCase from '../models/MysteryCase.js'
import { generateMystery } from '../services/ai/generateCase.js'
import {
  claimGenerationRequest,
  completedGenerationExpiry,
} from '../services/generationIdempotency.js'
import { editCaseSchema, generateCaseSchema } from '../validators/schemas.js'

const router = Router()
const generationLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Please wait before creating another mystery.' },
})
const isId = (value) => mongoose.isValidObjectId(value)
export const publicView = (item) => ({
  id: String(item._id),
  title: item.title,
  originalScenario: item.originalScenario,
  difficulty: item.difficulty,
  summary: item.summary,
  incidentDetails: item.incidentDetails,
  suspects: item.publicSuspects,
  evidence: item.publicEvidence,
  timeline: item.publicTimeline,
  crimeScene: item.crimeScene,
  status: item.status,
  createdAt: item.createdAt,
})

router.post('/generate', generationLimit, async (request, response, next) => {
  let savedCase
  let solutionSaved = false
  let generationRequest
  let persistenceStage = 'case record'
  try {
    const input = generateCaseSchema.safeParse(request.body)
    if (!input.success)
      return response.status(400).json({
        error:
          input.error.issues[0]?.message ||
          'Check your scenario and difficulty.',
      })
    const key = request.get('Idempotency-Key')
    if (!key || !/^[a-zA-Z0-9-]{16,100}$/.test(key)) {
      return response.status(400).json({
        error:
          'A valid request key is required to prevent duplicate mystery creation.',
      })
    }
    const claim = await claimGenerationRequest(
      GenerationRequest,
      request.user._id,
      key,
    )
    generationRequest = claim.request
    if (claim.kind === 'pending') {
      response.set('Retry-After', '2')
      return response.status(409).json({
        error:
          'This mystery request is already in progress. Retry shortly to retrieve its result.',
      })
    }
    if (claim.kind === 'completed') {
      const priorCase = await MysteryCase.findOne({
        _id: claim.request.caseId,
        createdBy: request.user._id,
      })
      if (priorCase)
        return response.status(200).json({ case: publicView(priorCase) })
      await GenerationRequest.deleteOne({ _id: claim.request._id })
      const reclaimed = await claimGenerationRequest(
        GenerationRequest,
        request.user._id,
        key,
      )
      generationRequest = reclaimed.request
      if (reclaimed.kind !== 'claimed') {
        response.set('Retry-After', '2')
        return response.status(409).json({
          error: 'This mystery request is being recovered. Retry shortly.',
        })
      }
    }

    const generated = await generateMystery(
      input.data.scenario,
      input.data.difficulty,
    )
    savedCase = await MysteryCase.create({
      title: generated.title,
      originalScenario: input.data.scenario,
      difficulty: input.data.difficulty,
      summary: generated.summary,
      incidentDetails: {
        type: generated.incidentType,
        location: generated.location,
        incidentTime: generated.incidentTime,
      },
      publicSuspects: generated.suspects,
      publicEvidence: generated.evidence,
      publicTimeline: generated.timeline,
      crimeScene: generated.crimeScene,
      createdBy: request.user._id,
    })
    persistenceStage = 'private solution record'
    await CaseSolution.create({
      caseId: savedCase._id,
      culpritId: generated.solution.culpritId,
      canonicalMotive: generated.solution.motive,
      canonicalMethod: generated.solution.method,
      canonicalTimeline: generated.solution.canonicalTimeline,
      secretFacts: generated.solution.secretFacts,
      solutionExplanation: generated.solution.explanation,
      scoringEvidenceIds: generated.solution.scoringEvidenceIds,
    })
    solutionSaved = true
    persistenceStage = 'generation request completion'
    await GenerationRequest.findByIdAndUpdate(generationRequest._id, {
      status: 'completed',
      caseId: savedCase._id,
      expiresAt: completedGenerationExpiry(),
    })
    return response.status(201).json({ case: publicView(savedCase) })
  } catch (error) {
    if (savedCase && solutionSaved)
      await CaseSolution.deleteOne({ caseId: savedCase._id }).catch(() => {})
    if (savedCase)
      await MysteryCase.findByIdAndDelete(savedCase._id).catch(() => {})
    if (generationRequest?._id)
      await GenerationRequest.deleteOne({
        _id: generationRequest._id,
        status: 'pending',
      }).catch(() => {})
    if (!error.status && !error.diagnostic) {
      error.status = 503
      error.safeMessage =
        'The mystery could not be saved to your case history. Please check the database connection and try again.'
      error.diagnostic = {
        stage: persistenceStage,
        type: error.name || 'Error',
        ...(error.code ? { code: String(error.code) } : {}),
      }
    }
    return next(error)
  }
})

router.get('/', async (request, response, next) => {
  try {
    const cases = await MysteryCase.find({ createdBy: request.user._id })
      .sort({ updatedAt: -1 })
      .limit(50)
    return response.json({
      cases: cases.map((item) => ({
        ...publicView(item),
        suspectCount: item.publicSuspects.length,
        evidenceCount: item.publicEvidence.length,
      })),
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/:caseId', async (request, response, next) => {
  try {
    if (!isId(request.params.caseId))
      return response.status(404).json({ error: 'Case not found.' })
    const item = await MysteryCase.findOne({
      _id: request.params.caseId,
      createdBy: request.user._id,
    })
    if (!item) return response.status(404).json({ error: 'Case not found.' })
    return response.json({ case: publicView(item) })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:caseId', async (request, response, next) => {
  try {
    if (!isId(request.params.caseId))
      return response.status(404).json({ error: 'Case not found.' })
    const input = editCaseSchema.safeParse(request.body)
    if (!input.success)
      return response.status(400).json({
        error:
          input.error.issues[0]?.message ||
          'Check the case details and try again.',
      })
    const item = await MysteryCase.findOneAndUpdate(
      { _id: request.params.caseId, createdBy: request.user._id },
      { $set: input.data },
      { new: true, runValidators: true },
    )
    if (!item) return response.status(404).json({ error: 'Case not found.' })
    return response.json({
      message: 'Case changes saved.',
      case: publicView(item),
    })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:caseId', async (request, response, next) => {
  try {
    if (!isId(request.params.caseId))
      return response.status(404).json({ error: 'Case not found.' })
    const item = await MysteryCase.findOneAndUpdate(
      { _id: request.params.caseId, createdBy: request.user._id },
      { status: 'archived' },
      { new: true },
    )
    if (!item) return response.status(404).json({ error: 'Case not found.' })
    return response.json({ message: 'Case archived.' })
  } catch (error) {
    return next(error)
  }
})

export default router
