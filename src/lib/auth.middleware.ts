import { createMiddleware } from '@tanstack/react-start'
import {
  readSessionToken,
  verifySessionToken,
} from '@/lib/auth.session'

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const { env } = await import('cloudflare:workers')
    const sessionSecret = env.SESSION_SECRET
    if (!sessionSecret) throw new Error('未授权')

    const token = readSessionToken()
    if (!token) throw new Error('未授权')

    const valid = await verifySessionToken(sessionSecret, token)
    if (!valid) throw new Error('未授权')

    return next()
  },
)