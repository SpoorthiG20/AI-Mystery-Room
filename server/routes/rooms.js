import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import mongoose from 'mongoose'
import CaseSolution from '../models/CaseSolution.js'
import MysteryCase from '../models/MysteryCase.js'
import Room from '../models/Room.js'
import { calculateScore } from '../services/scoring.js'

const router = Router()
const membership = (room, userId) =>
  room.memberUserIds.some(
    (member) => String(member?._id ?? member) === String(userId),
  )
const makeCode = () => randomBytes(5).toString('hex').slice(0, 6).toUpperCase()

router.post('/', async (request, response, next) => {
  try {
    const { caseId } = request.body || {}
    if (!mongoose.isValidObjectId(caseId))
      return response.status(400).json({ error: 'Choose a valid case.' })
    const item = await MysteryCase.findOne({
      _id: caseId,
      createdBy: request.user._id,
      status: 'active',
    }).select('_id')
    if (!item) return response.status(404).json({ error: 'Case not found.' })
    let room
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        room = await Room.create({
          roomCode: makeCode(),
          caseId: item._id,
          hostUserId: request.user._id,
          memberUserIds: [request.user._id],
          sharedProgress: { discoveredEvidenceIds: [], theories: [] },
        })
        break
      } catch (error) {
        if (error.code !== 11000) throw error
      }
    }
    if (!room)
      return response
        .status(503)
        .json({ error: 'A room code could not be created. Please try again.' })
    return response.status(201).json({
      room: {
        id: String(room._id),
        code: room.roomCode,
        status: room.status,
      },
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/join', async (request, response, next) => {
  try {
    const code = String(request.body?.code || '')
      .trim()
      .toUpperCase()
    if (!/^[A-Z0-9]{6}$/.test(code))
      return response
        .status(400)
        .json({ error: 'Enter a six-character room code.' })
    const room = await Room.findOneAndUpdate(
      {
        roomCode: code,
        status: 'open',
        $expr: { $lt: [{ $size: '$memberUserIds' }, 6] },
      },
      { $addToSet: { memberUserIds: request.user._id } },
      { new: true },
    )
    if (!room)
      return response.status(404).json({ error: 'That room is unavailable.' })
    return response.json({
      room: { id: String(room._id), code: room.roomCode, status: room.status },
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/:roomId', async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.roomId))
      return response.status(404).json({ error: 'Room not found.' })
    const room = await Room.findById(request.params.roomId).populate(
      'memberUserIds',
      'name',
    )
    if (!room || !membership(room, request.user._id))
      return response.status(404).json({ error: 'Room not found.' })
    const item = await MysteryCase.findById(room.caseId).select(
      'title summary difficulty incidentDetails publicSuspects publicEvidence publicTimeline crimeScene',
    )
    if (!item) return response.status(404).json({ error: 'Case not found.' })
    let solutionView = null
    if (room.teamVerdict) {
      const solution = await CaseSolution.findOne({ caseId: room.caseId })
      const culprit = item.publicSuspects.find(
        (suspect) => suspect.id === solution?.culpritId,
      )
      if (solution)
        solutionView = {
          culpritId: solution.culpritId,
          culpritName: culprit?.name,
          motive: solution.canonicalMotive,
          method: solution.canonicalMethod,
          explanation: solution.solutionExplanation,
          supportingEvidenceIds: solution.scoringEvidenceIds,
        }
    }
    return response.json({
      room: {
        id: String(room._id),
        code: room.roomCode,
        status: room.status,
        members: room.memberUserIds,
        progress: room.sharedProgress,
        teamVerdict: room.teamVerdict,
        solution: solutionView,
        case: {
          id: String(item._id),
          title: item.title,
          summary: item.summary,
          difficulty: item.difficulty,
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

router.patch('/:roomId/progress', async (request, response, next) => {
  try {
    const room = await Room.findById(request.params.roomId)
    if (!room || !membership(room, request.user._id) || room.status !== 'open')
      return response.status(404).json({ error: 'Open room not found.' })
    const item = await MysteryCase.findById(room.caseId).select(
      'publicEvidence publicSuspects',
    )
    const validEvidence = new Set(item.publicEvidence.map((entry) => entry.id))
    const proposed = Array.isArray(request.body?.discoveredEvidenceIds)
      ? request.body.discoveredEvidenceIds.filter((id) => validEvidence.has(id))
      : []
    room.sharedProgress.discoveredEvidenceIds = [
      ...new Set([...room.sharedProgress.discoveredEvidenceIds, ...proposed]),
    ]
    if (Array.isArray(request.body?.theories)) {
      room.sharedProgress.theories = request.body.theories
        .slice(0, 40)
        .map((theory) => ({
          title: String(theory.title || '').slice(0, 100),
          explanation: String(theory.explanation || '').slice(0, 1500),
          suspectIds: Array.isArray(theory.suspectIds)
            ? theory.suspectIds
                .filter((id) =>
                  item.publicSuspects.some((suspect) => suspect.id === id),
                )
                .slice(0, 10)
            : [],
          evidenceIds: Array.isArray(theory.evidenceIds)
            ? theory.evidenceIds
                .filter((id) => validEvidence.has(id))
                .slice(0, 30)
            : [],
          updatedBy: String(request.user._id),
        }))
    }
    await room.save()
    return response.json({ progress: room.sharedProgress })
  } catch (error) {
    return next(error)
  }
})

router.post('/:roomId/verdict', async (request, response, next) => {
  try {
    const room = await Room.findById(request.params.roomId)
    if (!room || !membership(room, request.user._id))
      return response.status(404).json({ error: 'Room not found.' })
    if (room.teamVerdict)
      return response
        .status(409)
        .json({ error: 'The team has already submitted a verdict.' })
    const culpritId = String(request.body?.culpritId || '')
    const supporting = [
      ...new Set(
        Array.isArray(request.body?.supportingEvidenceIds)
          ? request.body.supportingEvidenceIds
          : [],
      ),
    ]
    const [item, solution] = await Promise.all([
      MysteryCase.findById(room.caseId),
      CaseSolution.findOne({ caseId: room.caseId }),
    ])
    if (
      !item?.publicSuspects.some((suspect) => suspect.id === culpritId) ||
      !solution
    )
      return response
        .status(400)
        .json({ error: 'Choose a suspect in this case.' })
    const validEvidence = new Set(room.sharedProgress.discoveredEvidenceIds)
    const correct = culpritId === solution.culpritId
    const scoring = calculateScore({
      difficulty: item.difficulty,
      correct,
      submittedEvidenceIds: supporting.filter((id) => validEvidence.has(id)),
      allowedEvidenceIds: solution.scoringEvidenceIds,
      hintsUsed: 0,
    })
    const teamVerdict = {
      submittedBy: request.user._id,
      culpritId,
      correct,
      score: scoring.score,
      submittedAt: new Date(),
    }
    const savedRoom = await Room.findOneAndUpdate(
      {
        _id: room._id,
        status: 'open',
        teamVerdict: null,
        memberUserIds: request.user._id,
      },
      { $set: { teamVerdict, status: 'completed' } },
      { new: true },
    )
    if (!savedRoom)
      return response
        .status(409)
        .json({ error: 'The team has already submitted a verdict.' })
    const culprit = item.publicSuspects.find(
      (suspect) => suspect.id === solution.culpritId,
    )
    return response.json({
      verdict: savedRoom.teamVerdict,
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

export default router
