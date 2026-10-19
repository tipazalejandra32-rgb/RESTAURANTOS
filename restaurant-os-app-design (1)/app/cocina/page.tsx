'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PrivateRoute } from '@/components/auth/private-route'
import { useAuth } from '@/contexts/auth-context'
import { useRestaurantHydration } from '@/hooks/use-restaurant-hydration'
import { KitchenModule } from '@/components/modules/kitchen-module'
import { ToastProvider } from '@/components/ui/toast-notification'

function CocinaContent() {
  const { permissions } = useAuth()
  const { ready, error } = useRestaurantHydration()

  if (!permissions?.cocina.visible) return null

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <p className="font-black uppercase text-destructive">{error}</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-black uppercase text-muted-foreground">Cargando…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b-4 border-foreground">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-12 h-12 border-2 border-foreground bg-card flex items-center justify-center hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </Link>
          <h1 className="text-2xl font-black uppercase">Cocina</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <KitchenModule
          readOnly={permissions.cocina.readOnly}
          canChangeStatus={permissions.cocina.canChangeStatus}
        />
      </main>
    </div>
  )
}

export default function CocinaPage() {
  return (
    <PrivateRoute>
      <ToastProvider>
        <CocinaContent />
      </ToastProvider>
    </PrivateRoute>
  )
}
