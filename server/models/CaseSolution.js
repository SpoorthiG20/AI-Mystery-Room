import mongoose from 'mongoose'

const caseSolutionSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'MysteryCase', required: true, unique: true, index: true },
  culpritId: { type: String, required: true },
  canonicalMotive: { type: String, required: true },
  canonicalMethod: { type: String, required: true },
  canonicalTimeline: { type: [mongoose.Schema.Types.Mixed], required: true },
  secretFacts: [{ type: String }],
  solutionExplanation: { type: String, required: true },
  scoringEvidenceIds: [{ type: String }],
}, { timestamps: true, minimize: false })

export default mongoose.model('CaseSolution', caseSolutionSchema)
