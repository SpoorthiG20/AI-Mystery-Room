const pendingLifetimeMs = 15 * 60 * 1000
const completedLifetimeMs = 24 * 60 * 60 * 1000

export async function claimGenerationRequest(Model, ownerId, key, now = new Date()) {
  const createClaim = () => Model.create({
    ownerId,
    key,
    status: 'pending',
    expiresAt: new Date(now.getTime() + pendingLifetimeMs),
  })

  try {
    return { kind: 'claimed', request: await createClaim() }
  } catch (error) {
    if (error?.code !== 11000) throw error
  }

  let existing = await Model.findOne({ ownerId, key }).lean()
  if (existing?.status === 'pending' && existing.expiresAt <= now) {
    await Model.deleteOne({ _id: existing._id, status: 'pending' })
    try {
      return { kind: 'claimed', request: await createClaim() }
    } catch (error) {
      if (error?.code !== 11000) throw error
      existing = await Model.findOne({ ownerId, key }).lean()
    }
  }

  if (!existing) return { kind: 'pending', request: null }
  return { kind: existing.status === 'completed' ? 'completed' : 'pending', request: existing }
}

export function completedGenerationExpiry(now = new Date()) {
  return new Date(now.getTime() + completedLifetimeMs)
}
