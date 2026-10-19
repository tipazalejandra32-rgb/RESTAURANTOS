import { createHmac, timingSafeEqual } from 'crypto'
import type { AuthRole } from './users'

const SECRET = process.env.AUTH_SECRET || 'restaurant-os-dev-secret-change-in-production'
const TTL_MS = 12 * 60 * 60 * 1000 // 12 horas

export interface SessionPayload {
  sub: string
  username: string
  name: string
  role: AuthRole
  iat: number
  exp: number
}

function sign(data: string): string {
  return createHmac('sha256', SECRET).update(data).digest('base64url')
}

export function createSessionToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): string {
  const iat = Date.now()
  const exp = iat + TTL_MS
  const body: SessionPayload = { ...payload, iat, exp }
  const encoded = Buffer.from(JSON.stringify(body)).toString('base64url')
  const signature = sign(encoded)
  return `${encoded}.${signature}`
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encoded, signature] = parts
  const expected = sign(encoded)
  try {
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as SessionPayload
    if (!payload.sub || !payload.role || !payload.exp) return null
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}
