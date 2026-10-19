'use client'

import { Check, Plus, Home } from 'lucide-react'

interface WaiterConfirmationProps {
  tableNumber: number
  onFinish: () => void
  onAddMore: () => void
}

export function WaiterConfirmation({ tableNumber, onFinish, onAddMore }: WaiterConfirmationProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="text-center max-w-md w-full">
        {/* Success Icon */}
        <div className="w-24 h-24 border-4 border-foreground bg-[var(--status-ready)] flex items-center justify-center mx-auto mb-8 shadow-[6px_6px_0_0_var(--foreground)]">
          <Check className="w-12 h-12 text-[var(--status-ready-fg)]" strokeWidth={3} />
        </div>

        <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">
          Pedido Enviado
        </h1>
        <p className="text-muted-foreground mt-4 font-medium">
          La comanda de la <span className="font-black">Mesa {tableNumber}</span> ha sido enviada a cocina y caja.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col gap-4">
          <button
            onClick={onAddMore}
            className="w-full bg-foreground text-background py-4 font-black text-lg uppercase tracking-wide border-4 border-foreground hover:shadow-[4px_4px_0_0_var(--muted-foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            Agregar más items
          </button>
          <button
            onClick={onFinish}
            className="w-full bg-card text-foreground py-4 font-black text-lg uppercase tracking-wide border-4 border-foreground hover:bg-muted transition-colors flex items-center justify-center gap-3"
          >
            <Home className="w-5 h-5" strokeWidth={2.5} />
            Volver al inicio
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-8 font-bold uppercase tracking-widest">
          Mesa permanece activa
        </p>
      </div>
    </div>
  )
}
