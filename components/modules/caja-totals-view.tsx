'use client'

import { useRestaurantStore, formatCurrency } from '@/lib/store'
import { Receipt } from 'lucide-react'

/** Vista solo lectura de totales por mesa (rol mesero). */
export function CajaTotalsView() {
  const tables = useRestaurantStore((s) => s.tables)
  const orders = useRestaurantStore((s) => s.orders)

  const rows = tables
    .filter((t) => t.status === 'ocupada' && t.currentOrderId)
    .map((table) => {
      const order = orders.find((o) => o.id === table.currentOrderId)
      return order ? { table: table.number, order } : null
    })
    .filter(Boolean) as { table: number; order: (typeof orders)[0] }[]

  return (
    <div className="bg-card border-4 border-foreground">
      <div className="p-5 border-b-4 border-foreground flex items-center gap-3">
        <Receipt className="w-6 h-6" strokeWidth={2.5} />
        <div>
          <h2 className="text-lg font-black uppercase">Totales por mesa</h2>
          <p className="text-sm text-muted-foreground font-bold">Solo lectura</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="p-8 text-center font-bold text-muted-foreground uppercase">
          No hay mesas con cuenta abierta
        </p>
      ) : (
        <ul className="divide-y-4 divide-foreground">
          {rows.map(({ table, order }) => (
            <li
              key={table}
              className="p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-black uppercase text-xl">Mesa {table}</p>
                <p className="text-sm text-muted-foreground font-bold">
                  {order.items.length} ítems · {order.waiterName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">{formatCurrency(order.total)}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  + IVA {formatCurrency(Math.round(order.total * 0.19))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
