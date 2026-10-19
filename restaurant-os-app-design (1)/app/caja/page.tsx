'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { PrivateRoute } from '@/components/auth/private-route'
import { useRestaurantHydration } from '@/hooks/use-restaurant-hydration'
import { ArrowLeft, Receipt, Settings, Clock } from 'lucide-react'
import { CajaSection } from '@/components/caja/caja-section'
import { CajaTotalsView } from '@/components/modules/caja-totals-view'
import { AdminSection } from '@/components/caja/admin-section'
import { PanelAdmin } from '@/components/auth/panel-admin'
import { ToastProvider } from '@/components/ui/toast-notification'

type Tab = 'caja' | 'admin' | 'auth-admin'

function CajaContent() {
  const { permissions, user } = useAuth()
  const { ready, error } = useRestaurantHydration()
  const [activeTab, setActiveTab] = useState<Tab>('caja')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!permissions?.caja.visible && !permissions?.admin.visible) return null

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-black uppercase text-destructive mb-2">Error de base de datos</p>
        <p className="text-muted-foreground max-w-md">{error}</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-black uppercase text-muted-foreground">Cargando…</p>
      </div>
    )
  }

  const showAuthAdmin = user?.role === 'administrador'
  const totalsOnly = permissions.caja.totalsOnly

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b-4 border-foreground">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="w-12 h-12 border-2 border-foreground bg-card flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
              </Link>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                {totalsOnly ? 'Totales por mesa' : 'Caja'}
              </h1>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 border-2 border-foreground bg-card">
              <Clock className="w-5 h-5" strokeWidth={2} />
              <span className="text-lg font-black tabular-nums">
                {currentTime.toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {!totalsOnly && (
            <div className="flex gap-0 mt-6 border-2 border-foreground">
              <button
                type="button"
                onClick={() => setActiveTab('caja')}
                className={`flex items-center justify-center gap-2 px-6 py-3 font-bold uppercase tracking-wide transition-colors flex-1 ${
                  activeTab === 'caja'
                    ? 'bg-foreground text-background'
                    : 'bg-card text-foreground hover:bg-muted'
                }`}
              >
                <Receipt className="w-4 h-4" strokeWidth={2.5} />
                Caja
              </button>
              {showAuthAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('auth-admin')}
                  className={`flex items-center justify-center gap-2 px-6 py-3 font-bold uppercase tracking-wide transition-colors flex-1 border-l-2 border-foreground ${
                    activeTab === 'auth-admin'
                      ? 'bg-foreground text-background'
                      : 'bg-card hover:bg-muted'
                  }`}
                >
                  <Settings className="w-4 h-4" strokeWidth={2.5} />
                  Panel Admin
                </button>
              )}
              {user?.role === 'administrador' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center justify-center gap-2 px-6 py-3 font-bold uppercase tracking-wide transition-colors flex-1 border-l-2 border-foreground ${
                    activeTab === 'admin'
                      ? 'bg-foreground text-background'
                      : 'bg-card hover:bg-muted'
                  }`}
                >
                  <Settings className="w-4 h-4" strokeWidth={2.5} />
                  Menú / Mesas
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {totalsOnly && <CajaTotalsView />}
        {!totalsOnly && activeTab === 'caja' && (
          <CajaSection readOnly={permissions.caja.readOnly} />
        )}
        {!totalsOnly && activeTab === 'admin' && <AdminSection />}
        {activeTab === 'auth-admin' && showAuthAdmin && <PanelAdmin />}
      </main>
    </div>
  )
}

export default function CajaPage() {
  return (
    <PrivateRoute>
      <ToastProvider>
        <CajaContent />
      </ToastProvider>
    </PrivateRoute>
  )
}
