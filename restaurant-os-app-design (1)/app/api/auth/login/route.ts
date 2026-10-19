import { NextResponse } from 'next/server'
import { findAuthUser } from '@/lib/auth/users'
import { createSessionToken } from '@/lib/auth/token'
import { appendAccessLog } from '@/lib/auth/logs'
import type { AuthRole } from '@/lib/auth/users'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string
      password?: string
      role?: AuthRole
    }
    const username = body.username?.trim()
    const password = body.password
    const selectedRole = body.role

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: 'Usuario y contraseña son obligatorios' },
        { status: 400 }
      )
    }

    const account = findAuthUser(username, password)
    if (!account) {
      return NextResponse.json(
        { ok: false, error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    if (selectedRole && selectedRole !== account.role) {
      return NextResponse.json(
        { ok: false, error: 'El rol seleccionado no coincide con este usuario' },
        { status: 403 }
      )
    }

    const token = createSessionToken({
      sub: account.id,
      username: account.username,
      name: account.name,
      role: account.role,
    })

    const forwarded = request.headers.get('x-forwarded-for')
    appendAccessLog({
      username: account.username,
      name: account.name,
      role: account.role,
      at: new Date().toISOString(),
      ip: forwarded?.split(',')[0]?.trim(),
    })

    return NextResponse.json({
      ok: true,
      token,
      user: {
        id: account.id,
        username: account.username,
        name: account.name,
        role: account.role,
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
