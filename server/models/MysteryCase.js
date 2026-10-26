import mongoose from 'mongoose'

const mysteryCaseSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 120 },
  originalScenario: { type: String, required: true, maxlength: 4000 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  summary: { type: String, required: true },
  incidentDetails: { type: mongoose.Schema.Types.Mixed, required: true },
  publicSuspects: { type: [mongoose.Schema.Types.Mixed], required: true },
  publicEvidence: { type: [mongoose.Schema.Types.Mixed], required: true },
  publicTimeline: { type: [mongoose.Schema.Types.Mixed], required: true },
  crimeScene: { type: mongoose.Schema.Types.Mixed, default: null },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true, minimize: false })

export default mongoose.model('MysteryCase', mysteryCaseSchema)
