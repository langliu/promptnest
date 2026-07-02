import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  clearSessionCookie,
  createSessionToken,
  readSessionToken,
  setSessionCookie,
  verifySessionToken,
} from '@/lib/auth.session'

export type AuthState = {
  isAuthenticated: boolean
}

async function getEnvSecrets() {
  const { env } = await import('cloudflare:workers')
  return {
    authPassword: env.AUTH_PASSWORD,
    sessionSecret: env.SESSION_SECRET,
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export const getAuthFn = createServerFn({ method: 'GET' }).handler(async (): Promise<AuthState> => {
  const { sessionSecret } = await getEnvSecrets()
  if (!sessionSecret) return { isAuthenticated: false }

  const token = readSessionToken()
  if (!token) return { isAuthenticated: false }

  const valid = await verifySessionToken(sessionSecret, token)
  return { isAuthenticated: valid }
})

export const loginFn = createServerFn({ method: 'POST' })
  .validator(z.object({ password: z.string().min(1, '请输入授权码') }))
  .handler(async ({ data }) => {
    const { authPassword, sessionSecret } = await getEnvSecrets()

    if (!authPassword || !sessionSecret) {
      throw new Error('服务端未配置授权码，请联系管理员')
    }

    const passwordMatches = timingSafeEqual(data.password, authPassword)
    if (!passwordMatches) {
      throw new Error('授权码错误')
    }

    const token = await createSessionToken(sessionSecret)
    setSessionCookie(token)
    return { ok: true as const }
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  clearSessionCookie()
  return { ok: true as const }
})
