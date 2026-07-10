import { getRequest, getRequestHeader, setResponseHeader } from '@tanstack/react-start/server'

export const SESSION_COOKIE = 'promptnest-session'
const ONE_DAY = 60 * 60 * 24
const SESSION_PAYLOAD = 'authenticated'

function shouldUseSecureCookie(): boolean {
  try {
    const request = getRequest()
    return new URL(request.url).protocol === 'https:'
  } catch {
    return false
  }
}

async function hmacSign(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const [aHash, bHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ])
  return crypto.subtle.timingSafeEqual(aHash, bHash)
}

export async function createSessionToken(secret: string): Promise<string> {
  return hmacSign(secret, SESSION_PAYLOAD)
}

export async function verifySessionToken(secret: string, token: string): Promise<boolean> {
  const expected = await createSessionToken(secret)
  return await timingSafeEqual(expected, token)
}

export function setSessionCookie(token: string) {
  const secure = shouldUseSecureCookie()
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${ONE_DAY}`,
  ]
  if (secure) parts.push('Secure')
  setResponseHeader('Set-Cookie', parts.join('; '))
}

export function clearSessionCookie() {
  const secure = shouldUseSecureCookie()
  const parts = [`${SESSION_COOKIE}=`, 'HttpOnly', 'SameSite=Lax', 'Path=/', 'Max-Age=0']
  if (secure) parts.push('Secure')
  setResponseHeader('Set-Cookie', parts.join('; '))
}

export function readSessionToken(): string | null {
  const header = getRequestHeader('cookie')
  if (!header) return null
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    if (part.slice(0, eq) === SESSION_COOKIE) return part.slice(eq + 1)
  }
  return null
}
