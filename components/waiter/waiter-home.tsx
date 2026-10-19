'use client'

import Link from 'next/link'
import { useRestaurantStore } from '@/lib/store'
import { Armchair, ArrowLeft, Plus } from 'lucide-react'
import { StatusChip } from '@/components/ui/status-chip'

interface WaiterHomeProps {
  waiterName: string
  onSelectTable: (tableNumber: number) => void
  readOnly?: boolean
}

export function WaiterHome({ waiterName, onSelectTable, readOnly = false }: WaiterHomeProps) {
  const tables = useRestaurantStore((state) => state.tables)
  const orders = useRestaurantStore((state) => state.orders)
  const activeTables = tables.filter((t) => t.active)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const getTableOrder = (tableNumber: number) => {
    return orders.find(
      (o) => o.tableNumber === tableNumber && o.status !== 'pagado'
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b-4 border-foreground px-4 py-4 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="w-12 h-12 border-2 border-foreground bg-card flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={2.5} />
          </Link>
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">{getGreeting()}</p>
            <h1 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight">{waiterName}</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-lg font-bold text-foreground uppercase tracking-wide mb-6">
            Seleccionar Mesa
          </h2>
          
          {/* Tables Grid - Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {activeTables.map((table) => {
              const isAvailable = table.status === 'disponible'
              const activeOrder = getTableOrder(table.number)
              
              return (
                <button
                  key={table.number}
                  type="button"
                  onClick={() => !readOnly && onSelectTable(table.number)}
                  disabled={readOnly}
                  className={`
                    relative p-6 border-4 border-foreground transition-all duration-150 min-h-[160px]
                    flex flex-col items-center justify-center gap-3
                    ${readOnly ? 'opacity-90 cursor-default' : ''}
                    ${isAvailable 
                      ? 'bg-card hover:shadow-[6px_6px_0_0_var(--foreground)] hover:-translate-x-1 hover:-translate-y-1 active:shadow-none active:translate-x-0 active:translate-y-0' 
                      : 'bg-muted hover:shadow-[6px_6px_0_0_var(--foreground)] hover:-translate-x-1 hover:-translate-y-1 active:shadow-none active:translate-x-0 active:translate-y-0'
                    }
                  `}
                >
                  <div className={`
                    w-14 h-14 border-2 border-foreground flex items-center justify-center
                    ${isAvailable ? 'bg-[var(--status-ready)]' : 'bg-[var(--status-cooking)]'}
                  `}>
                    <Armchair className={`w-7 h-7 ${isAvailable ? 'text-[var(--status-ready-fg)]' : 'text-[var(--status-cooking-fg)]'}`} strokeWidth={2} />
                  </div>
                  <span className="text-xl font-black text-foreground uppercase">
                    Mesa {table.number}
                  </span>
                  
                  {isAvailable ? (
                    <span className="text-xs font-bold text-[var(--status-ready)] uppercase tracking-wide flex items-center gap-1">
                      <Plus className="w-3 h-3" strokeWidth={3} />
                      Disponible
                    </span>
                  ) : activeOrder ? (
                    <StatusChip status={activeOrder.status} size="sm" />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Ocupada
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
