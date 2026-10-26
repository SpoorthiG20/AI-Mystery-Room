import mongoose from 'mongoose'

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.warn('MONGODB_URI is not set. API is running without a database connection.')
    return false
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  console.log('Connected to MongoDB.')
  return true
}
