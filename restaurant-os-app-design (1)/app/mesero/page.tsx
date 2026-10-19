'use client'

import { PrivateRoute } from '@/components/auth/private-route'
import { useAuth } from '@/contexts/auth-context'
import { WaiterModule } from '@/components/modules/waiter-module'
import { ActiveWaitersList } from '@/components/modules/active-waiters-list'
import { ToastProvider } from '@/components/ui/toast-notification'

function MeseroContent() {
  const { permissions } = useAuth()
  if (!permissions?.mesero.visible) return null

  if (permissions.mesero.waitersListOnly) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 max-w-4xl mx-auto">
        <ActiveWaitersList />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <WaiterModule readOnly={permissions.mesero.readOnly} />
    </div>
  )
}

export default function MeseroPage() {
  return (
    <PrivateRoute>
      <ToastProvider>
        <MeseroContent />
      </ToastProvider>
    </PrivateRoute>
  )
}
