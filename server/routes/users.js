import { Router } from 'express'
import Investigation from '../models/Investigation.js'
import MysteryCase from '../models/MysteryCase.js'

const router = Router()

router.get('/me', (request, response) =>
  response.json({
    user: {
      id: String(request.user._id),
      name: request.user.name,
      email: request.user.email,
      points: request.user.points,
      achievements: request.user.achievements,
    },
  }),
)

router.get('/me/history', async (request, response, next) => {
  try {
    const investigations = await Investigation.find({
      userId: request.user._id,
    })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean()
    const caseIds = investigations.map((entry) => entry.caseId)
    const cases = await MysteryCase.find({
      _id: { $in: caseIds },
      createdBy: request.user._id,
    })
      .select('title difficulty summary updatedAt')
      .lean()
    const byId = new Map(cases.map((item) => [String(item._id), item]))
    return response.json({
      history: investigations.map((entry) => ({
        id: String(entry._id),
        status: entry.status,
        score: entry.score,
        startedAt: entry.startedAt,
        completedAt: entry.completedAt,
        case: byId.get(String(entry.caseId)),
      })),
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/me/stats', async (request, response, next) => {
  try {
    const [counts, pointAgg] = await Promise.all([
      Investigation.aggregate([
        { $match: { userId: request.user._id } },
        {
          $group: {
            _id: null,
            attempted: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            solved: {
              $sum: { $cond: [{ $eq: ['$verdict.correct', true] }, 1, 0] },
            },
            correct: {
              $sum: { $cond: [{ $eq: ['$verdict.correct', true] }, 1, 0] },
            },
            averageScore: {
              $avg: {
                $cond: [{ $eq: ['$status', 'completed'] }, '$score', null],
              },
            },
          },
        },
      ]),
      Investigation.aggregate([
        { $match: { userId: request.user._id, status: 'completed' } },
        { $group: { _id: null, totalPoints: { $sum: '$score' } } },
      ]),
    ])
    const stat = counts[0] || {
      attempted: 0,
      completed: 0,
      solved: 0,
      correct: 0,
      averageScore: 0,
    }
    const solved = stat.solved || 0
    const rank =
      solved >= 20
        ? 'Master Detective'
        : solved >= 10
          ? 'Senior Investigator'
          : solved >= 5
            ? 'Investigator'
            : solved >= 2
              ? 'Junior Detective'
              : 'Trainee Detective'
    return response.json({
      stats: {
        attempted: stat.attempted || 0,
        completed: stat.completed || 0,
        solved,
        correctRate: stat.completed
          ? Math.round((stat.correct / stat.completed) * 100)
          : 0,
        averageScore: Math.round(stat.averageScore || 0),
        totalPoints: pointAgg[0]?.totalPoints || 0,
        rank,
      },
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/me/achievements', async (request, response, next) => {
  try {
    const completed = await Investigation.countDocuments({
      userId: request.user._id,
      status: 'completed',
    })
    const correct = await Investigation.countDocuments({
      userId: request.user._id,
      'verdict.correct': true,
    })
    const achievements = []
    if (completed >= 1)
      achievements.push({
        id: 'first-verdict',
        name: 'First Verdict',
        description: 'Submit your first final accusation.',
      })
    if (correct >= 3)
      achievements.push({
        id: 'sharp-eye',
        name: 'A Sharp Eye',
        description: 'Solve three cases.',
      })
    if (completed >= 5)
      achievements.push({
        id: 'seasoned',
        name: 'Seasoned Investigator',
        description: 'Complete five investigations.',
      })
    return response.json({ achievements })
  } catch (error) {
    return next(error)
  }
})

router.get('/dashboard', async (request, response, next) => {
  try {
    const [cases, history, stats] = await Promise.all([
      MysteryCase.find({ createdBy: request.user._id, status: 'active' })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title difficulty summary updatedAt')
        .lean(),
      Investigation.find({ userId: request.user._id })
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      Investigation.aggregate([
        { $match: { userId: request.user._id } },
        {
          $group: {
            _id: null,
            attempted: { $sum: 1 },
            solved: {
              $sum: { $cond: [{ $eq: ['$verdict.correct', true] }, 1, 0] },
            },
            avg: {
              $avg: {
                $cond: [{ $eq: ['$status', 'completed'] }, '$score', null],
              },
            },
          },
        },
      ]),
    ])
    const investigationByCase = new Map(
      history.map((entry) => [String(entry.caseId), entry]),
    )
    return response.json({
      dashboard: {
        cases: cases.map((item) => ({
          ...item,
          id: String(item._id),
          investigationId: investigationByCase.get(String(item._id))?._id
            ? String(investigationByCase.get(String(item._id))._id)
            : null,
          investigationStatus:
            investigationByCase.get(String(item._id))?.status || null,
        })),
        stats: stats[0] || { attempted: 0, solved: 0, avg: 0 },
      },
    })
  } catch (error) {
    return next(error)
  }
})

export default router
