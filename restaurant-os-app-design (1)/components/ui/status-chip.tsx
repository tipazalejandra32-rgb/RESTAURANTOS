'use client'

import type { OrderStatus } from '@/lib/store'

interface StatusChipProps {
  status: OrderStatus
  onClick?: () => void
  interactive?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<OrderStatus, { label: string; bg: string; fg: string }> = {
  pendiente: {
    label: 'PENDIENTE',
    bg: 'bg-[var(--status-pending)]',
    fg: 'text-[var(--status-pending-fg)]',
  },
  'en-cocina': {
    label: 'EN COCINA',
    bg: 'bg-[var(--status-cooking)]',
    fg: 'text-[var(--status-cooking-fg)]',
  },
  listo: {
    label: 'LISTO',
    bg: 'bg-[var(--status-ready)]',
    fg: 'text-[var(--status-ready-fg)]',
  },
  entregado: {
    label: 'ENTREGADO',
    bg: 'bg-[var(--status-delivered)]',
    fg: 'text-[var(--status-delivered-fg)]',
  },
  pagado: {
    label: 'PAGADO',
    bg: 'bg-foreground',
    fg: 'text-background',
  },
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
}

export function StatusChip({ status, onClick, interactive = false, size = 'md' }: StatusChipProps) {
  const config = statusConfig[status]
  
  const baseClasses = `
    inline-flex items-center font-bold uppercase tracking-wider border-2 border-foreground
    ${config.bg} ${config.fg} ${sizeClasses[size]}
    ${interactive ? 'cursor-pointer hover:shadow-[2px_2px_0_0_var(--foreground)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all' : ''}
  `

  if (interactive && onClick) {
    return (
      <button onClick={onClick} className={baseClasses}>
        {config.label}
      </button>
    )
  }

  return <span className={baseClasses}>{config.label}</span>
}

// Status progression helper
export function getNextStatus(current: OrderStatus): OrderStatus | null {
  const progression: Record<OrderStatus, OrderStatus | null> = {
    pendiente: 'en-cocina',
    'en-cocina': 'listo',
    listo: 'entregado',
    entregado: 'pagado',
    pagado: null,
  }
  return progression[current]
}

export function getAllStatuses(): OrderStatus[] {
  return ['pendiente', 'en-cocina', 'listo', 'entregado', 'pagado']
}
