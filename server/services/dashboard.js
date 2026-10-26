import Investigation from '../models/Investigation.js'
import MysteryCase from '../models/MysteryCase.js'

export default async function getDashboard(userId) {
  const [cases, history, stats] = await Promise.all([
    MysteryCase.find({ createdBy: userId, status: 'active' }).sort({ updatedAt: -1 }).limit(8).select('title difficulty summary updatedAt').lean(),
    Investigation.find({ userId }).sort({ updatedAt: -1 }).limit(12).lean(),
    Investigation.aggregate([{ $match: { userId } }, { $group: { _id: null, attempted: { $sum: 1 }, solved: { $sum: { $cond: [{ $eq: ['$verdict.correct', true] }, 1, 0] } }, avg: { $avg: '$score' } } }]),
  ])
  const investigationByCase = new Map(history.map((entry) => [String(entry.caseId), entry]))
  return {
    cases: cases.map((item) => {
      const investigation = investigationByCase.get(String(item._id))
      return { ...item, id: String(item._id), investigationId: investigation ? String(investigation._id) : null, investigationStatus: investigation?.status || null }
    }),
    stats: stats[0] || { attempted: 0, solved: 0, avg: 0 },
    recent: history.map((entry) => ({ id: String(entry._id), status: entry.status, score: entry.score, caseId: String(entry.caseId), updatedAt: entry.updatedAt })),
  }
}
