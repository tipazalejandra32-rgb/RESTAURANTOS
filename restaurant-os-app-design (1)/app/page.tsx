'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (user) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
      <p className="text-lg font-black uppercase text-muted-foreground">Redirigiendo…</p>
      <a
        href="/login"
        className="px-6 py-3 border-4 border-foreground bg-foreground text-background font-black uppercase text-sm hover:shadow-[4px_4px_0_0_var(--muted)]"
      >
        Ir al login manualmente
      </a>
    </div>
  )
}
