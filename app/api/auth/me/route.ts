import { NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth/token'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token =
    authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
  }

  const payload = verifySessionToken(token)
  if (!payload) {
    return NextResponse.json({ ok: false, error: 'Sesión inválida o expirada' }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: payload.sub,
      username: payload.username,
      name: payload.name,
      role: payload.role,
    },
  })
}
