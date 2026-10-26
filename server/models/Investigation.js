import mongoose from 'mongoose'

const theorySchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  explanation: { type: String, maxlength: 2000, default: '' },
  suspectIds: [{ type: String }],
  supportingEvidenceIds: [{ type: String }],
  contradictingEvidenceIds: [{ type: String }],
  missingInformation: { type: String, maxlength: 1000, default: '' },
  notes: { type: String, maxlength: 2000, default: '' },
}, { timestamps: true })

const investigationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'MysteryCase', required: true, index: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  discoveredEvidenceIds: [{ type: String }],
  interrogationHistory: [{ suspectId: String, question: String, answer: String, createdAt: { type: Date, default: Date.now } }],
  playerTimeline: [{ event: String, time: String, evidenceIds: [String], assumption: { type: Boolean, default: true } }],
  theories: [theorySchema],
  graphConnections: [{ fromId: String, toId: String, label: String }],
  graphLayout: [{ nodeId: String, position: { type: Number, min: 0, max: 100 } }],
  hintsUsed: { type: Number, default: 0, min: 0 },
  hintHistory: [{ text: String, usedAt: { type: Date, default: Date.now } }],
  score: { type: Number, default: 0, min: 0 },
  verdict: { type: mongoose.Schema.Types.Mixed, default: null },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
}, { timestamps: true })

investigationSchema.index({ userId: 1, caseId: 1 }, { unique: true })

export default mongoose.model('Investigation', investigationSchema)
