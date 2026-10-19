'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import type { AuthRole } from '@/lib/auth/users'
import { getRolePermissions, type RolePermissions } from '@/lib/auth/permissions'

const STORAGE_KEY = 'restaurant-os-session'

export interface AuthUser {
  id: string
  username: string
  name: string
  role: AuthRole
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  permissions: RolePermissions | null
  isLoading: boolean
  login: (username: string, password: string, role: AuthRole) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const persist = useCallback((t: string | null, u: AuthUser | null) => {
    if (t && u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const restoreSession = useCallback(async () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const { token: storedToken } = JSON.parse(raw) as { token: string }
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 4000)
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (res.ok && data.ok && data.user) {
        setToken(storedToken)
        setUser(data.user as AuthUser)
        persist(storedToken, data.user as AuthUser)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [persist])

  useEffect(() => {
    restoreSession().finally(() => setIsLoading(false))
  }, [restoreSession])

  const login = useCallback(
    async (username: string, password: string, role: AuthRole) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al iniciar sesión')
      }
      setToken(data.token)
      setUser(data.user)
      persist(data.token, data.user)
      router.push('/dashboard')
    },
    [persist, router]
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    persist(null, null)
    router.push('/login')
  }, [persist, router])

  const permissions = useMemo(
    () => (user ? getRolePermissions(user.role) : null),
    [user]
  )

  const value = useMemo(
    () => ({
      user,
      token,
      permissions,
      isLoading,
      login,
      logout,
    }),
    [user, token, permissions, isLoading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
