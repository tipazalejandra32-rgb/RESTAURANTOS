'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { PrivateRoute } from '@/components/auth/private-route'
import { useRestaurantHydration } from '@/hooks/use-restaurant-hydration'
import { KitchenModule } from '@/components/modules/kitchen-module'
import { WaiterModule } from '@/components/modules/waiter-module'
import { ActiveWaitersList } from '@/components/modules/active-waiters-list'
import { CajaSection } from '@/components/caja/caja-section'
import { CajaTotalsView } from '@/components/modules/caja-totals-view'
import { PanelAdmin } from '@/components/auth/panel-admin'
import { ToastProvider } from '@/components/ui/toast-notification'
import { ROLE_LABELS } from '@/lib/auth/permissions'
import type { ModuleKey } from '@/lib/auth/permissions'
import {
  UtensilsCrossed,
  ChefHat,
  Calculator,
  Shield,
  LogOut,
} from 'lucide-react'

function DashboardContent() {
  const { user, permissions, logout } = useAuth()
  const { ready, error } = useRestaurantHydration()

  const tabs = useMemo(() => {
    if (!permissions) return []
    const list: { key: ModuleKey; label: string; icon: typeof UtensilsCrossed }[] = []
    if (permissions.mesero.visible) {
      list.push({
        key: 'mesero',
        label: permissions.mesero.waitersListOnly ? 'Meseros activos' : 'Mesero',
        icon: UtensilsCrossed,
      })
    }
    if (permissions.cocina.visible) {
      list.push({ key: 'cocina', label: 'Cocina', icon: ChefHat })
    }
    if (permissions.caja.visible) {
      list.push({
        key: 'caja',
        label: permissions.caja.totalsOnly ? 'Totales' : 'Caja',
        icon: Calculator,
      })
    }
    if (permissions.admin.visible) {
      list.push({ key: 'admin', label: 'Admin', icon: Shield })
    }
    return list
  }, [permissions])

  const [activeTab, setActiveTab] = useState<ModuleKey | null>(null)

  const currentTab =
    activeTab && tabs.some((t) => t.key === activeTab)
      ? activeTab
      : tabs[0]?.key ?? 'mesero'

  if (!user || !permissions) return null

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
        <p className="font-black uppercase text-muted-foreground">Cargando datos…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background border-b-4 border-foreground">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              RestaurantOS
            </h1>
            <p className="text-sm text-muted-foreground font-bold uppercase">
              {user.name} · {ROLE_LABELS[user.role]}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 border-2 border-foreground font-bold uppercase text-sm hover:bg-muted"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-0 flex border-t-2 border-foreground overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3 font-bold uppercase text-sm whitespace-nowrap border-r-2 border-foreground ${
                currentTab === key
                  ? 'bg-foreground text-background'
                  : 'bg-card hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2.5} />
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {currentTab === 'mesero' && permissions.mesero.waitersListOnly && (
          <ActiveWaitersList />
        )}
        {currentTab === 'mesero' && !permissions.mesero.waitersListOnly && (
          <WaiterModule readOnly={permissions.mesero.readOnly} />
        )}
        {currentTab === 'cocina' && (
          <KitchenModule
            readOnly={permissions.cocina.readOnly}
            canChangeStatus={permissions.cocina.canChangeStatus}
          />
        )}
        {currentTab === 'caja' && permissions.caja.totalsOnly && <CajaTotalsView />}
        {currentTab === 'caja' && !permissions.caja.totalsOnly && (
          <CajaSection readOnly={permissions.caja.readOnly} />
        )}
        {currentTab === 'admin' && permissions.admin.visible && <PanelAdmin />}
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <PrivateRoute>
      <ToastProvider>
        <DashboardContent />
      </ToastProvider>
    </PrivateRoute>
  )
}
