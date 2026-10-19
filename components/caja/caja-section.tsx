'use client'

import { useState } from 'react'
import { useRestaurantStore, formatCurrency, formatTimeElapsed, formatTime } from '@/lib/store'
import type { Invoice } from '@/lib/store'
import { Clock, Printer, CheckCircle2, Unlock } from 'lucide-react'
import { StatusChip } from '@/components/ui/status-chip'
import { useToast } from '@/components/ui/toast-notification'

interface CajaSectionProps {
  readOnly?: boolean
}

export function CajaSection({ readOnly = false }: CajaSectionProps) {
  const tables = useRestaurantStore((state) => state.tables)
  const orders = useRestaurantStore((state) => state.orders)
  const createInvoice = useRestaurantStore((state) => state.createInvoice)
  const releaseTable = useRestaurantStore((state) => state.releaseTable)
  const [selectedTableNumber, setSelectedTableNumber] = useState<number | null>(null)
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)
  const { showToast } = useToast()

  // Get active tables with orders
  const activeTables = tables.filter((t) => t.status === 'ocupada' && t.currentOrderId)

  // Get order for selected table
  const selectedOrder = selectedTableNumber
    ? orders.find(
        (o) =>
          o.tableNumber === selectedTableNumber &&
          o.status !== 'pagado'
      )
    : null

  const handleCloseAccount = async () => {
    if (readOnly || !selectedOrder) return
    try {
      const invoice = await createInvoice(selectedOrder.id)
      if (invoice) {
        setCurrentInvoice(invoice)
        showToast('Factura generada correctamente', 'success')
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al facturar', 'error')
    }
  }

  const handleReleaseTable = async () => {
    if (readOnly || !selectedTableNumber) return
    try {
      await releaseTable(selectedTableNumber)
      setSelectedTableNumber(null)
      setCurrentInvoice(null)
      showToast('Mesa liberada', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al liberar mesa', 'error')
    }
  }

  const handlePrintInvoice = () => {
    if (!currentInvoice) return
    
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 300px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 4px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
    .header p { margin: 5px 0 0; color: #666; font-size: 12px; font-weight: 600; }
    .info { margin-bottom: 15px; font-size: 12px; font-weight: 600; }
    .info p { margin: 3px 0; }
    .items { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px 0; }
    .item { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; font-weight: 600; }
    .item-name { flex: 1; text-transform: uppercase; }
    .totals { padding-top: 10px; }
    .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .total-row.final { font-size: 16px; font-weight: 900; border-top: 4px solid #000; padding-top: 10px; margin-top: 10px; }
    .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${currentInvoice.restaurantName}</h1>
    <p>NIT: 900.123.456-7</p>
  </div>
  <div class="info">
    <p><strong>Factura:</strong> ${currentInvoice.id}</p>
    <p><strong>Fecha:</strong> ${currentInvoice.createdAt.toLocaleDateString('es-CO')}</p>
    <p><strong>Hora:</strong> ${formatTime(currentInvoice.createdAt)}</p>
    <p><strong>Mesa:</strong> ${currentInvoice.tableNumber}</p>
  </div>
  <div class="items">
    ${currentInvoice.items
      .map(
        (item) => `
      <div class="item">
        <span class="item-name">${item.quantity}x ${item.menuItem.name}</span>
        <span>${formatCurrency(item.menuItem.price * item.quantity)}</span>
      </div>
    `
      )
      .join('')}
  </div>
  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>${formatCurrency(currentInvoice.subtotal)}</span>
    </div>
    <div class="total-row">
      <span>IVA (19%)</span>
      <span>${formatCurrency(currentInvoice.iva)}</span>
    </div>
    <div class="total-row final">
      <span>TOTAL</span>
      <span>${formatCurrency(currentInvoice.total)}</span>
    </div>
  </div>
  <div class="footer">
    <p>Gracias por su visita</p>
  </div>
</body>
</html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {readOnly && (
        <p className="lg:col-span-3 px-4 py-2 border-2 border-foreground bg-muted font-bold uppercase text-sm text-center">
          Modo solo lectura
        </p>
      )}
      {/* Left Panel - Active Tables */}
      <div className="lg:col-span-1">
        <div className="bg-card border-4 border-foreground overflow-hidden">
          <div className="p-5 border-b-4 border-foreground">
            <h2 className="text-lg font-black text-foreground uppercase">Mesas Activas</h2>
            <p className="text-sm text-muted-foreground mt-1 font-bold">
              {activeTables.length} mesas con pedidos
            </p>
          </div>
          <div className="divide-y-4 divide-foreground">
            {activeTables.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-bold uppercase">
                No hay mesas activas
              </div>
            ) : (
              activeTables.map((table) => {
                const order = orders.find((o) => o.id === table.currentOrderId)
                if (!order) return null
                const isPaid = order.status === 'pagado'

                return (
                  <button
                    key={table.number}
                    onClick={() => {
                      setSelectedTableNumber(table.number)
                      setCurrentInvoice(null)
                    }}
                    className={`w-full p-4 text-left transition-colors ${
                      selectedTableNumber === table.number
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 border-2 border-foreground flex items-center justify-center ${
                          isPaid ? 'bg-[var(--status-ready)]' : 'bg-muted'
                        }`}>
                          <span className="text-xl font-black text-foreground">
                            {table.number}
                          </span>
                        </div>
                        <div>
                          <p className="font-black text-foreground uppercase">
                            Mesa {table.number}
                          </p>
                          <p className="text-sm text-muted-foreground font-bold">
                            {order.items.length} platos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-foreground">
                          {formatCurrency(order.total)}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground font-bold">
                          <Clock className="w-3 h-3" strokeWidth={2.5} />
                          {formatTimeElapsed(order.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <StatusChip status={order.status} size="sm" />
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Order Detail */}
      <div className="lg:col-span-2">
        {!selectedTableNumber ? (
          <div className="bg-card border-4 border-dashed border-foreground/30 p-12 text-center">
            <div className="w-16 h-16 border-2 border-foreground/30 bg-muted flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" strokeWidth={2} />
            </div>
            <p className="text-xl text-muted-foreground font-black uppercase">
              Selecciona una mesa
            </p>
          </div>
        ) : selectedOrder ? (
          <div className="bg-card border-4 border-foreground overflow-hidden">
            {/* Order Header */}
            <div className="p-6 border-b-4 border-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-foreground uppercase">
                    Mesa {selectedTableNumber}
                  </h2>
                  <p className="text-muted-foreground mt-1 font-bold uppercase text-sm">
                    Mesero: {selectedOrder.waiterName}
                  </p>
                </div>
                <StatusChip status={selectedOrder.status} size="lg" />
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b-2 border-foreground">
                    <th className="pb-3 font-black uppercase tracking-wide">Producto</th>
                    <th className="pb-3 font-black uppercase tracking-wide text-center">Cant.</th>
                    <th className="pb-3 font-black uppercase tracking-wide text-right">P. Unit.</th>
                    <th className="pb-3 font-black uppercase tracking-wide text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-foreground/20">
                  {selectedOrder.items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-4">
                        <p className="font-bold text-foreground uppercase">
                          {item.menuItem.name}
                        </p>
                        {item.observations && (
                          <p className="text-sm mt-1 px-2 py-1 bg-[var(--status-pending)] border-2 border-foreground inline-block font-bold text-[var(--status-pending-fg)]">
                            {item.observations}
                          </p>
                        )}
                      </td>
                      <td className="py-4 text-center text-foreground font-black text-lg">
                        {item.quantity}
                      </td>
                      <td className="py-4 text-right text-muted-foreground font-bold">
                        {formatCurrency(item.menuItem.price)}
                      </td>
                      <td className="py-4 text-right font-black text-foreground text-lg">
                        {formatCurrency(item.menuItem.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="p-6 bg-muted border-t-4 border-foreground">
              {currentInvoice ? (
                <>
                  <div className="flex justify-between text-muted-foreground mb-2 font-bold uppercase text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(currentInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground mb-4 font-bold uppercase text-sm">
                    <span>IVA (19%)</span>
                    <span>{formatCurrency(currentInvoice.iva)}</span>
                  </div>
                  <div className="flex justify-between text-3xl font-black text-foreground uppercase pt-4 border-t-4 border-foreground">
                    <span>Total</span>
                    <span>{formatCurrency(currentInvoice.total)}</span>
                  </div>
                  <div className="mt-4 p-4 bg-[var(--status-ready)] border-2 border-foreground text-center">
                    <p className="text-[var(--status-ready-fg)] font-black uppercase">
                      Factura {currentInvoice.id}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-muted-foreground mb-2 font-bold uppercase text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground mb-4 font-bold uppercase text-sm">
                    <span>IVA (19%)</span>
                    <span>{formatCurrency(Math.round(selectedOrder.total * 0.19))}</span>
                  </div>
                  <div className="flex justify-between text-3xl font-black text-foreground uppercase pt-4 border-t-4 border-foreground">
                    <span>Total</span>
                    <span>{formatCurrency(Math.round(selectedOrder.total * 1.19))}</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            {!readOnly && (
              <div className="p-6 flex gap-4 border-t-4 border-foreground">
                {!currentInvoice && selectedOrder.status !== 'pagado' && (
                  <button
                    type="button"
                    onClick={handleCloseAccount}
                    className="flex-1 py-4 bg-foreground text-background font-black text-lg uppercase tracking-wide border-4 border-foreground hover:shadow-[4px_4px_0_0_var(--muted)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                  >
                    Cerrar Cuenta
                  </button>
                )}
                {currentInvoice && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrintInvoice}
                      className="flex-1 py-4 border-4 border-foreground bg-card text-foreground font-black flex items-center justify-center gap-2 hover:bg-muted transition-colors uppercase"
                    >
                      <Printer className="w-5 h-5" strokeWidth={2.5} />
                      Imprimir
                    </button>
                    <button
                      type="button"
                      onClick={handleReleaseTable}
                      className="flex-1 py-4 border-4 border-foreground bg-[var(--status-ready)] text-[var(--status-ready-fg)] font-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity uppercase"
                    >
                      <Unlock className="w-5 h-5" strokeWidth={2.5} />
                      Liberar Mesa
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border-4 border-dashed border-foreground/30 p-12 text-center">
            <p className="text-muted-foreground font-bold uppercase">
              No hay pedido activo para esta mesa
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
