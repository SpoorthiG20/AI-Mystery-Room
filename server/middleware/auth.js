import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const authCookieName = 'mystery_session'
const secret = () => process.env.SESSION_SECRET

export function issueSession(userId) {
  if (!secret() || secret().length < 32)
    throw Object.assign(
      new Error(
        'Configure SESSION_SECRET with at least 32 random characters on the server.',
      ),
      { status: 503 },
    )
  return jwt.sign({ sub: String(userId) }, secret(), {
    expiresIn: '7d',
    issuer: 'ai-mystery-room',
  })
}

export async function requireAuth(request, response, next) {
  try {
    const token = request.cookies?.[authCookieName]
    if (!token)
      return response.status(401).json({ error: 'Please log in to continue.' })
    const claims = jwt.verify(token, secret(), { issuer: 'ai-mystery-room' })
    const user = await User.findById(claims.sub).select(
      '_id name email points achievements',
    )
    if (!user)
      return response.status(401).json({
        error: 'Your session is no longer valid. Please log in again.',
      })
    request.user = user
    return next()
  } catch {
    return response
      .status(401)
      .json({ error: 'Your session expired. Please log in again.' })
  }
}

export function setSessionCookie(response, token) {
  response.cookie(authCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}
