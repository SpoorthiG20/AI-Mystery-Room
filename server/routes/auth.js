import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { authCookieName, issueSession, requireAuth, setSessionCookie } from '../middleware/auth.js'
import { loginSchema, registerSchema } from '../validators/schemas.js'

const router = Router()
const publicUser = (user) => ({ id: String(user._id), name: user.name, email: user.email, points: user.points || 0, achievements: user.achievements || [] })

router.post('/register', async (request, response, next) => {
  try {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) return response.status(503).json({ error: 'Set SESSION_SECRET in the server environment before creating an account.' })
    const input = registerSchema.safeParse(request.body)
    if (!input.success) return response.status(400).json({ error: input.error.issues[0]?.message || 'Please check your details.' })
    const email = input.data.email.toLowerCase()
    if (await User.exists({ email })) return response.status(409).json({ error: 'An account with this email already exists.' })
    const user = await User.create({ name: input.data.name, email, passwordHash: await bcrypt.hash(input.data.password, 12) })
    setSessionCookie(response, issueSession(user._id))
    return response.status(201).json({ user: publicUser(user) })
  } catch (error) { return next(error) }
})

router.post('/login', async (request, response, next) => {
  try {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) return response.status(503).json({ error: 'Set SESSION_SECRET in the server environment before signing in.' })
    const input = loginSchema.safeParse(request.body)
    if (!input.success) return response.status(400).json({ error: 'Enter a valid email and password.' })
    const user = await User.findOne({ email: input.data.email.toLowerCase() }).select('+passwordHash')
    if (!user || !(await bcrypt.compare(input.data.password, user.passwordHash))) return response.status(401).json({ error: 'Email or password is incorrect.' })
    setSessionCookie(response, issueSession(user._id))
    return response.json({ user: publicUser(user) })
  } catch (error) { return next(error) }
})

router.post('/logout', (_request, response) => {
  response.clearCookie(authCookieName, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', path: '/' })
  return response.json({ message: 'You are logged out.' })
})

router.get('/me', requireAuth, (request, response) => response.json({ user: publicUser(request.user) }))

export default router
