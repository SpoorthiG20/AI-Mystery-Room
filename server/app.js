import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import caseRoutes from './routes/cases.js'
import investigationRoutes from './routes/investigations.js'
import roomRoutes from './routes/rooms.js'
import userRoutes from './routes/users.js'
import { requireAuth } from './middleware/auth.js'

const app = express()
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '32kb' }))
app.use(cookieParser())

const apiLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false })
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many sign-in attempts. Please wait and try again.' } })
app.use('/api', apiLimit)

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'ai-mystery-room-api',
    database: mongoose.connection.readyState === 1 ? 'connected' : process.env.MONGODB_URI ? 'configured-not-connected' : 'not-configured',
  })
})

app.use('/api/auth', authLimit, authRoutes)
app.use('/api/cases', requireAuth, caseRoutes)
app.use('/api/investigations', requireAuth, investigationRoutes)
app.use('/api/rooms', requireAuth, roomRoutes)
app.use('/api/users', requireAuth, userRoutes)
app.get('/api/dashboard', requireAuth, async (request, response, next) => {
  try {
    const { default: Dashboard } = await import('./services/dashboard.js')
    return response.json({ dashboard: await Dashboard(request.user._id) })
  } catch (error) { return next(error) }
})

app.use((_request, response) => {
  response.status(404).json({ error: 'That API route was not found.' })
})

app.use((error, _request, response, _next) => {
  if (error?.code === 11000) return response.status(409).json({ error: 'That record already exists.' })
  const status = Number(error.status) >= 400 && Number(error.status) < 600 ? Number(error.status) : 500
  if (Number.isFinite(Number(error.retryAfterSeconds)) && Number(error.retryAfterSeconds) > 0) {
    response.set('Retry-After', String(Math.ceil(Number(error.retryAfterSeconds))))
  }
  if (status >= 500) {
    if (error.diagnostic) {
      console.error('[API error]', JSON.stringify({ type: error.name, code: error.code, status, diagnostic: error.diagnostic }))
    } else {
      console.error('[API error]', JSON.stringify({ type: error.name || 'Error', code: error.code, status }))
    }
  }
  const message = status >= 500
    ? (error.safeMessage || (status === 500 ? 'The server encountered an unexpected error. Please try again.' : error.message))
    : error.message
  return response.status(status).json({ error: message })
})

export default app
