'use client'

import { useMemo } from 'react'
import { useRestaurantStore, formatTime } from '@/lib/store'
import { Users } from 'lucide-react'

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

export function ActiveWaitersList() {
  const orders = useRestaurantStore((s) => s.orders)
  const cutoff = Date.now() - TWO_HOURS_MS

  const activeWaiters = useMemo(() => {
    const map = new Map<
      string,
      { name: string; orderCount: number; lastAt: Date }
    >()
    for (const order of orders) {
      if (order.createdAt.getTime() < cutoff) continue
      const existing = map.get(order.waiterName)
      if (existing) {
        existing.orderCount += 1
        if (order.createdAt > existing.lastAt) existing.lastAt = order.createdAt
      } else {
        map.set(order.waiterName, {
          name: order.waiterName,
          orderCount: 1,
          lastAt: order.createdAt,
        })
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => b.lastAt.getTime() - a.lastAt.getTime()
    )
  }, [orders, cutoff])

  return (
    <div className="bg-card border-4 border-foreground">
      <div className="p-5 border-b-4 border-foreground flex items-center gap-3">
        <Users className="w-6 h-6" strokeWidth={2.5} />
        <div>
          <h2 className="text-lg font-black uppercase">Meseros activos</h2>
          <p className="text-sm text-muted-foreground font-bold">
            Comandas en las últimas 2 horas
          </p>
        </div>
      </div>
      {activeWaiters.length === 0 ? (
        <p className="p-8 text-center font-bold text-muted-foreground uppercase">
          No hay meseros activos
        </p>
      ) : (
        <ul className="divide-y-4 divide-foreground">
          {activeWaiters.map((w) => (
            <li key={w.name} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-black uppercase">{w.name}</p>
                <p className="text-sm text-muted-foreground font-bold">
                  {w.orderCount} comanda{w.orderCount !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="text-sm font-black tabular-nums">
                {formatTime(w.lastAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
