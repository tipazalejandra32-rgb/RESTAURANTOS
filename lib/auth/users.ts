import type { User } from '@/lib/store'

export type AuthRole = User['role']

export interface AuthAccount {
  id: string
  username: string
  password: string
  role: AuthRole
  name: string
}

/** Usuarios de login (credenciales). El rol real viene del registro, no del selector. */
export const DEFAULT_AUTH_USERS: AuthAccount[] = [
  { id: 'auth-1', username: 'mesero1', password: '123', role: 'mesero', name: 'Mesero 1' },
  { id: 'auth-2', username: 'cocinero1', password: '123', role: 'cocinero', name: 'Cocinero 1' },
  { id: 'auth-3', username: 'cajero1', password: '123', role: 'cajero', name: 'Cajero 1' },
  { id: 'auth-4', username: 'admin', password: '123', role: 'administrador', name: 'Administrador' },
]

let runtimeUsers: AuthAccount[] | null = null

export function getAuthUsers(): AuthAccount[] {
  return runtimeUsers ?? [...DEFAULT_AUTH_USERS]
}

export function setAuthUsers(users: AuthAccount[]) {
  runtimeUsers = users
}

export function findAuthUser(username: string, password: string): AuthAccount | null {
  const normalized = username.trim().toLowerCase()
  return (
    getAuthUsers().find(
      (u) => u.username.toLowerCase() === normalized && u.password === password
    ) ?? null
  )
}
