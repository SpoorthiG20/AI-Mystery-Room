import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true, index: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'MysteryCase', required: true },
  hostUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  memberUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sharedProgress: { discoveredEvidenceIds: [String], theories: [mongoose.Schema.Types.Mixed] },
  teamVerdict: { type: mongoose.Schema.Types.Mixed, default: null },
  status: { type: String, enum: ['open', 'completed'], default: 'open' },
}, { timestamps: true })

export default mongoose.model('Room', roomSchema)
