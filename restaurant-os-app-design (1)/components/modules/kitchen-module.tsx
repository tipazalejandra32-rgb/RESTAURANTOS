'use client'

import { useState, useEffect } from 'react'
import { useRestaurantStore, formatCurrency, formatTimeElapsed, formatTime } from '@/lib/store'
import type { Order, OrderStatus } from '@/lib/store'
import { Clock, Printer, Bell } from 'lucide-react'
import { StatusChip, getNextStatus, getAllStatuses } from '@/components/ui/status-chip'
import { useToast } from '@/components/ui/toast-notification'

interface KitchenModuleProps {
  readOnly?: boolean
  canChangeStatus?: boolean
}

export function KitchenModule({
  readOnly = false,
  canChangeStatus = true,
}: KitchenModuleProps) {
  const orders = useRestaurantStore((state) => state.orders)
  const updateOrderStatus = useRestaurantStore((state) => state.updateOrderStatus)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const [lastOrderCount, setLastOrderCount] = useState(0)
  const [statusModal, setStatusModal] = useState<{
    orderId: string
    currentStatus: OrderStatus
  } | null>(null)
  const { showToast } = useToast()

  const interactive = !readOnly && canChangeStatus

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const kitchenOrders = orders.filter(
    (order) => order.status !== 'entregado' && order.status !== 'pagado'
  )

  useEffect(() => {
    const newCount = kitchenOrders.filter((o) => o.status === 'pendiente').length
    if (newCount > lastOrderCount && lastOrderCount > 0) {
      setNewOrderAlert(true)
      setTimeout(() => setNewOrderAlert(false), 3000)
    }
    setLastOrderCount(newCount)
  }, [kitchenOrders, lastOrderCount])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!interactive) return
    try {
      await updateOrderStatus(orderId, newStatus)
      setStatusModal(null)
      showToast(`Estado actualizado a ${newStatus.toUpperCase()}`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al actualizar', 'error')
    }
  }

  const handleQuickAdvance = async (order: Order) => {
    if (!interactive) return
    const nextStatus = getNextStatus(order.status)
    if (nextStatus && nextStatus !== 'pagado') {
      try {
        await updateOrderStatus(order.id, nextStatus)
        showToast(`Estado actualizado a ${nextStatus.toUpperCase()}`, 'success')
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Error al actualizar', 'error')
      }
    }
  }

  const handlePrint = (order: Order) => {
    const printContent = `
      ================================
             COMANDA DE COCINA
      ================================
      Mesa: ${order.tableNumber}
      Hora: ${formatTime(order.createdAt)}
      Mesero: ${order.waiterName}
      --------------------------------
      ${order.items
        .map(
          (item) =>
            `${item.quantity}x ${item.menuItem.name}${
              item.observations ? `\n   -> ${item.observations}` : ''
            }`
        )
        .join('\n')}
      --------------------------------
      Total: ${formatCurrency(order.total)}
      ================================
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(
        `<pre style="font-family: monospace; font-size: 14px;">${printContent}</pre>`
      )
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div>
      {readOnly && (
        <p className="mb-4 px-4 py-2 border-2 border-foreground bg-muted font-bold uppercase text-sm text-center">
          Modo solo lectura
        </p>
      )}
      {newOrderAlert && interactive && (
        <div className="fixed top-4 right-4 z-50 bg-foreground text-background px-6 py-4 border-4 border-foreground shadow-[4px_4px_0_0_var(--muted)] flex items-center gap-3">
          <Bell className="w-6 h-6" strokeWidth={2.5} />
          <span className="font-black uppercase tracking-wide">Nueva comanda</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 px-4 py-2 mb-4 border-2 border-foreground bg-card w-fit ml-auto">
        <Clock className="w-5 h-5" strokeWidth={2} />
        <span className="text-xl font-black tabular-nums">
          {currentTime.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      </div>

      {kitchenOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center border-4 border-dashed border-foreground/30 bg-muted">
          <Clock className="w-12 h-12 text-muted-foreground mb-4" strokeWidth={2} />
          <p className="text-xl text-muted-foreground font-black uppercase">
            No hay comandas pendientes
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kitchenOrders
            .sort((a, b) => {
              const priority: Record<OrderStatus, number> = {
                pendiente: 0,
                'en-cocina': 1,
                listo: 2,
                entregado: 3,
                pagado: 4,
              }
              if (priority[a.status] !== priority[b.status]) {
                return priority[a.status] - priority[b.status]
              }
              return a.createdAt.getTime() - b.createdAt.getTime()
            })
            .map((order) => (
              <div
                key={order.id}
                className={`bg-card border-4 border-foreground overflow-hidden ${
                  order.status === 'pendiente'
                    ? 'shadow-[8px_8px_0_0_var(--status-pending)]'
                    : ''
                }`}
              >
                <div className="p-5 border-b-4 border-foreground">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-4xl font-black uppercase">
                        Mesa {order.tableNumber}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1 font-bold uppercase">
                        {order.waiterName}
                      </p>
                    </div>
                    <StatusChip
                      status={order.status}
                      interactive={interactive}
                      onClick={
                        interactive
                          ? () =>
                              setStatusModal({
                                orderId: order.id,
                                currentStatus: order.status,
                              })
                          : undefined
                      }
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <span className="font-bold text-muted-foreground uppercase">
                      {formatTime(order.createdAt)}
                    </span>
                    <span className="font-black text-[var(--status-cooking)] px-2 py-1 bg-[var(--status-cooking)]/10 border-2 border-[var(--status-cooking)]">
                      {formatTimeElapsed(order.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <ul className="space-y-4">
                    {order.items.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-10 h-10 border-2 border-foreground bg-muted flex items-center justify-center text-lg font-black flex-shrink-0">
                          {item.quantity}
                        </span>
                        <div className="flex-1">
                          <p className="font-bold uppercase">{item.menuItem.name}</p>
                          {item.observations && (
                            <p className="text-sm mt-1 px-2 py-1 bg-[var(--status-pending)] border-2 border-foreground inline-block font-bold">
                              {item.observations}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-5 pt-0 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handlePrint(order)}
                    disabled={readOnly}
                    className="flex-1 py-3 border-2 border-foreground bg-card font-bold flex items-center justify-center gap-2 hover:bg-muted uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Printer className="w-4 h-4" strokeWidth={2.5} />
                    Imprimir
                  </button>
                  {interactive && order.status !== 'listo' && (
                    <button
                      type="button"
                      onClick={() => handleQuickAdvance(order)}
                      className={`flex-1 py-3 border-2 border-foreground font-bold uppercase text-sm ${
                        order.status === 'pendiente'
                          ? 'bg-[var(--status-cooking)] text-[var(--status-cooking-fg)]'
                          : 'bg-[var(--status-ready)] text-[var(--status-ready-fg)]'
                      }`}
                    >
                      {order.status === 'pendiente' ? 'Iniciar' : 'Listo'}
                    </button>
                  )}
                  {order.status === 'listo' && (
                    <span className="flex-1 py-3 bg-[var(--status-ready)]/20 text-[var(--status-ready)] font-bold text-center border-2 border-[var(--status-ready)] uppercase text-sm">
                      Para servir
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {statusModal && interactive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setStatusModal(null)}
          />
          <div className="relative w-full max-w-sm bg-card border-4 border-foreground p-6 shadow-[8px_8px_0_0_var(--foreground)]">
            <h3 className="text-xl font-black uppercase mb-6">Cambiar Estado</h3>
            <div className="flex flex-col gap-3">
              {getAllStatuses()
                .filter((s) => s !== 'pagado')
                .map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(statusModal.orderId, status)}
                    className="w-full py-3 border-2 border-foreground font-bold uppercase text-sm"
                  >
                    <StatusChip status={status} size="lg" />
                  </button>
                ))}
            </div>
            <button
              type="button"
              onClick={() => setStatusModal(null)}
              className="w-full mt-6 py-3 border-2 border-foreground bg-muted font-bold uppercase text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
