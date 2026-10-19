import { NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth/token'
import {
  getAuthUsers,
  setAuthUsers,
  type AuthAccount,
  type AuthRole,
} from '@/lib/auth/users'

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
  const users = getAuthUsers().map(({ password: _, ...u }) => u)
  return NextResponse.json({ ok: true, users })
}

export async function POST(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 })
  }
  const body = (await request.json()) as {
    action?: 'create' | 'update' | 'delete'
    user?: Partial<AuthAccount> & { password?: string }
    id?: string
  }

  const users = [...getAuthUsers()]

  if (body.action === 'create' && body.user) {
    const { username, password, role, name } = body.user
    if (!username || !password || !role || !name) {
      return NextResponse.json({ ok: false, error: 'Datos incompletos' }, { status: 400 })
    }
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return NextResponse.json({ ok: false, error: 'Usuario ya existe' }, { status: 400 })
    }
    const newUser: AuthAccount = {
      id: `auth-${Date.now()}`,
      username,
      password,
      role: role as AuthRole,
      name,
    }
    users.push(newUser)
    setAuthUsers(users)
    const { password: _, ...safe } = newUser
    return NextResponse.json({ ok: true, user: safe })
  }

  if (body.action === 'update' && body.id && body.user) {
    const idx = users.findIndex((u) => u.id === body.id)
    if (idx < 0) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado' }, { status: 404 })
    }
    users[idx] = {
      ...users[idx],
      ...(body.user.username && { username: body.user.username }),
      ...(body.user.password && { password: body.user.password }),
      ...(body.user.role && { role: body.user.role as AuthRole }),
      ...(body.user.name && { name: body.user.name }),
    }
    setAuthUsers(users)
    const { password: _, ...safe } = users[idx]
    return NextResponse.json({ ok: true, user: safe })
  }

  if (body.action === 'delete' && body.id) {
    const filtered = users.filter((u) => u.id !== body.id)
    if (filtered.length === users.length) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado' }, { status: 404 })
    }
    setAuthUsers(filtered)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: false, error: 'Acción no válida' }, { status: 400 })
}
