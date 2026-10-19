import { NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth/token'
import { getAccessLogs } from '@/lib/auth/logs'

export const dynamic = 'force-dynamic'

function requireAdmin(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const payload = verifySessionToken(token)
  if (!payload || payload.role !== 'administrador') return null
  return payload
}

export async function GET(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 })
  }
  return NextResponse.json({ ok: true, logs: getAccessLogs() })
}
