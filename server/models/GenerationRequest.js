import mongoose from 'mongoose'

const generationRequestSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    key: { type: String, required: true, maxlength: 100 },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
      required: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MysteryCase',
      default: null,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
)

generationRequestSchema.index({ ownerId: 1, key: 1 }, { unique: true })
generationRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('GenerationRequest', generationRequestSchema)
