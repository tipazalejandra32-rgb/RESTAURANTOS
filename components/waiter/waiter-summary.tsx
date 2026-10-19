'use client'

import { useRestaurantStore, formatCurrency } from '@/lib/store'
import type { OrderItem } from '@/lib/store'
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast-notification'

interface WaiterSummaryProps {
  tableNumber: number
  orderItems: OrderItem[]
  setOrderItems: (items: OrderItem[]) => void
  onBack: () => void
  onOrderSent: () => void
}

export function WaiterSummary({
  tableNumber,
  orderItems,
  setOrderItems,
  onBack,
  onOrderSent,
}: WaiterSummaryProps) {
  const createOrder = useRestaurantStore((state) => state.createOrder)
  const addItemsToOrder = useRestaurantStore((state) => state.addItemsToOrder)
  const getOrderByTable = useRestaurantStore((state) => state.getOrderByTable)
  const currentWaiter = useRestaurantStore((state) => state.currentWaiter)
  const { showToast } = useToast()

  const existingOrder = getOrderByTable(tableNumber)

  const totalPrice = orderItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  )

  const handleQuantityChange = (index: number, delta: number) => {
    const updated = [...orderItems]
    updated[index].quantity = Math.max(1, updated[index].quantity + delta)
    setOrderItems(updated)
  }

  const handleRemoveItem = (index: number) => {
    const updated = orderItems.filter((_, i) => i !== index)
    setOrderItems(updated)
  }

  const handleSendOrder = async () => {
    if (orderItems.length === 0) return

    try {
      if (existingOrder) {
        await addItemsToOrder(existingOrder.id, orderItems)
        showToast('Items agregados al pedido existente', 'success')
      } else {
        await createOrder({
          tableNumber,
          items: orderItems,
          status: 'pendiente',
          waiterName: currentWaiter?.name || 'Mesero',
          total: totalPrice,
        })
        showToast('Pedido enviado a cocina', 'success')
      }
      onOrderSent()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al enviar pedido', 'error')
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b-4 border-foreground px-4 py-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-12 h-12 border-2 border-foreground bg-card flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={2.5} />
          </button>
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Resumen del pedido</p>
            <h1 className="text-2xl font-black text-foreground uppercase">Mesa {tableNumber}</h1>
          </div>
          {existingOrder && (
            <div className="ml-auto px-3 py-1 bg-[var(--status-pending)] border-2 border-foreground">
              <span className="text-xs font-bold text-[var(--status-pending-fg)] uppercase">
                Pedido activo
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Order Items */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {orderItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center border-4 border-dashed border-foreground/30 bg-muted">
              <p className="text-muted-foreground font-bold uppercase">No hay items en el pedido</p>
              <button
                onClick={onBack}
                className="mt-4 text-foreground font-black uppercase underline underline-offset-4 hover:no-underline"
              >
                Agregar items
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orderItems.map((item, index) => (
                <div
                  key={`${item.menuItem.id}-${index}`}
                  className="bg-card border-4 border-foreground p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-foreground uppercase">
                        {item.menuItem.name}
                      </h3>
                      {item.observations && (
                        <p className="text-sm mt-2 px-2 py-1 bg-[var(--status-pending)] border-2 border-foreground inline-block font-bold text-[var(--status-pending-fg)]">
                          {item.observations}
                        </p>
                      )}
                      <p className="text-muted-foreground text-sm mt-2 font-medium">
                        {formatCurrency(item.menuItem.price)} c/u
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="w-10 h-10 border-2 border-destructive bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-foreground/20">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleQuantityChange(index, -1)}
                        className="w-10 h-10 border-2 border-foreground flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                      </button>
                      <span className="text-2xl font-black text-foreground w-10 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(index, 1)}
                        className="w-10 h-10 border-2 border-foreground flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                      </button>
                    </div>
                    <span className="font-black text-foreground text-xl">
                      {formatCurrency(item.menuItem.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Total & Send Button */}
      {orderItems.length > 0 && (
        <div className="sticky bottom-0 p-4 md:p-8 bg-background border-t-4 border-foreground">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground font-bold uppercase tracking-wide">Total estimado</span>
              <span className="text-3xl font-black text-foreground">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <button
              onClick={handleSendOrder}
              className="w-full bg-[var(--status-ready)] text-[var(--status-ready-fg)] py-4 font-black text-lg uppercase tracking-wide border-4 border-foreground hover:shadow-[4px_4px_0_0_var(--foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              {existingOrder ? 'Agregar al Pedido' : 'Enviar Pedido'}
            </button>
            <p className="text-xs text-center text-muted-foreground mt-3 font-bold uppercase tracking-wide">
              Se enviará a cocina y caja simultáneamente
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
