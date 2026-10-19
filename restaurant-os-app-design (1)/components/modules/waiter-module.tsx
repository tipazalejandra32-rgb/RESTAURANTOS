'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRestaurantStore } from '@/lib/store'
import { useRestaurantHydration } from '@/hooks/use-restaurant-hydration'
import { WaiterHome } from '@/components/waiter/waiter-home'
import { WaiterMenu } from '@/components/waiter/waiter-menu'
import { WaiterSummary } from '@/components/waiter/waiter-summary'
import { WaiterConfirmation } from '@/components/waiter/waiter-confirmation'
import type { OrderItem } from '@/lib/store'

type Screen = 'home' | 'menu' | 'summary' | 'confirmation'

interface WaiterModuleProps {
  readOnly?: boolean
}

export function WaiterModule({ readOnly = false }: WaiterModuleProps) {
  const { user } = useAuth()
  const { ready, error } = useRestaurantHydration()
  const [screen, setScreen] = useState<Screen>('home')
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const currentWaiter = useRestaurantStore((state) => state.currentWaiter)
  const setCurrentWaiter = useRestaurantStore((state) => state.setCurrentWaiter)
  const displayName = user?.name || currentWaiter?.name || 'Mesero'

  useEffect(() => {
    if (user && !readOnly) {
      setCurrentWaiter({
        id: user.id,
        name: user.name,
        role: 'mesero',
        active: true,
      })
    }
  }, [user, readOnly, setCurrentWaiter])

  const handleSelectTable = (tableNumber: number) => {
    if (readOnly) return
    setSelectedTable(tableNumber)
    setOrderItems([])
    setScreen('menu')
  }

  const handleBack = () => {
    if (screen === 'menu') {
      setScreen('home')
      setSelectedTable(null)
      setOrderItems([])
    } else if (screen === 'summary') {
      setScreen('menu')
    }
  }

  if (error) {
    return (
      <p className="text-destructive font-black uppercase text-center p-8">{error}</p>
    )
  }

  if (!ready) {
    return (
      <p className="text-muted-foreground font-black uppercase text-center p-8">
        Cargando…
      </p>
    )
  }

  if (readOnly) {
    return (
      <div>
        <p className="mb-4 px-4 py-2 border-2 border-foreground bg-muted font-bold uppercase text-sm text-center">
          Vista de mesas — solo lectura
        </p>
        <WaiterHome waiterName={displayName} onSelectTable={() => {}} readOnly />
      </div>
    )
  }

  return (
    <>
      {screen === 'home' && (
        <WaiterHome waiterName={displayName} onSelectTable={handleSelectTable} />
      )}
      {screen === 'menu' && selectedTable && (
        <WaiterMenu
          tableNumber={selectedTable}
          orderItems={orderItems}
          setOrderItems={setOrderItems}
          onBack={handleBack}
          onGoToSummary={() => setScreen('summary')}
        />
      )}
      {screen === 'summary' && selectedTable && (
        <WaiterSummary
          tableNumber={selectedTable}
          orderItems={orderItems}
          setOrderItems={setOrderItems}
          onBack={handleBack}
          onOrderSent={() => setScreen('confirmation')}
        />
      )}
      {screen === 'confirmation' && selectedTable && (
        <WaiterConfirmation
          tableNumber={selectedTable}
          onFinish={() => {
            setScreen('home')
            setSelectedTable(null)
            setOrderItems([])
          }}
          onAddMore={() => {
            setOrderItems([])
            setScreen('menu')
          }}
        />
      )}
    </>
  )
}
