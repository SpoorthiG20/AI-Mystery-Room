import Investigation from '../models/Investigation.js'
import MysteryCase from '../models/MysteryCase.js'

export default async function getDashboard(userId) {
  const [cases, history, stats] = await Promise.all([
    MysteryCase.find({ createdBy: userId, status: 'active' })
      .sort({ updatedAt: -1 })
      .limit(8)
      .select('title difficulty summary updatedAt')
      .lean(),
    Investigation.find({ userId }).sort({ updatedAt: -1 }).limit(12).lean(),
    Investigation.aggregate([
      { $match: { userId } },
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
          totalPoints: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$score', 0] },
          },
        },
      },
    ]),
  ])
  const stat = stats[0] || {
    attempted: 0,
    completed: 0,
    solved: 0,
    correct: 0,
    averageScore: 0,
    totalPoints: 0,
  }
  const solved = stat.solved || 0
  const averageScore = Math.round(stat.averageScore || 0)
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
  const investigationByCase = new Map(
    history.map((entry) => [String(entry.caseId), entry]),
  )
  return {
    cases: cases.map((item) => {
      const investigation = investigationByCase.get(String(item._id))
      return {
        ...item,
        id: String(item._id),
        investigationId: investigation ? String(investigation._id) : null,
        investigationStatus: investigation?.status || null,
      }
    }),
    stats: {
      attempted: stat.attempted || 0,
      completed: stat.completed || 0,
      solved,
      correctRate: stat.completed
        ? Math.round(((stat.correct || 0) / stat.completed) * 100)
        : 0,
      averageScore,
      totalPoints: stat.totalPoints || 0,
      rank,
      avg: averageScore,
    },
    recent: history.map((entry) => ({
      id: String(entry._id),
      status: entry.status,
      score: entry.score,
      caseId: String(entry.caseId),
      updatedAt: entry.updatedAt,
    })),
  }
}
