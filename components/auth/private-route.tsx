'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { canAccessRoute } from '@/lib/auth/permissions'

interface PrivateRouteProps {
  children: ReactNode
  /** Si se define, solo estos roles pueden acceder */
  allowedRoles?: Array<'mesero' | 'cocinero' | 'cajero' | 'administrador'>
}

export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/dashboard')
      return
    }
    if (!canAccessRoute(user.role, pathname)) {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router, pathname, allowedRoles])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg font-black uppercase text-muted-foreground">Verificando sesión…</p>
      </div>
    )
  }

  if (!user) return null

  if (allowedRoles && !allowedRoles.includes(user.role)) return null
  if (!canAccessRoute(user.role, pathname)) return null

  return <>{children}</>
}
