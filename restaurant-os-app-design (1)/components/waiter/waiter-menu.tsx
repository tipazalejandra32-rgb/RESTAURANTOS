'use client'

import { useState } from 'react'
import { useRestaurantStore, formatCurrency } from '@/lib/store'
import type { MenuItem, OrderItem } from '@/lib/store'
import { ArrowLeft, Plus, Minus, ShoppingCart, X } from 'lucide-react'

interface WaiterMenuProps {
  tableNumber: number
  orderItems: OrderItem[]
  setOrderItems: (items: OrderItem[]) => void
  onBack: () => void
  onGoToSummary: () => void
}

type Category = 'entradas' | 'principales' | 'bebidas' | 'postres'

const categories: { key: Category; label: string }[] = [
  { key: 'entradas', label: 'Entradas' },
  { key: 'principales', label: 'Principales' },
  { key: 'bebidas', label: 'Bebidas' },
  { key: 'postres', label: 'Postres' },
]

const observationExamples = [
  'Sin cebolla',
  'Término medio',
  'Alérgico al maní',
  'Sin picante',
  'Extra salsa',
]

export function WaiterMenu({
  tableNumber,
  orderItems,
  setOrderItems,
  onBack,
  onGoToSummary,
}: WaiterMenuProps) {
  const menu = useRestaurantStore((state) => state.menu)
  const [activeCategory, setActiveCategory] = useState<Category>('entradas')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [tempQuantity, setTempQuantity] = useState(1)
  const [tempObservation, setTempObservation] = useState('')

  const filteredMenu = menu.filter(
    (item) => item.category === activeCategory && item.available
  )

  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = orderItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  )

  const handleAddItem = (item: MenuItem) => {
    setSelectedItem(item)
    setTempQuantity(1)
    setTempObservation('')
  }

  const handleConfirmAdd = () => {
    if (!selectedItem) return

    const existingIndex = orderItems.findIndex(
      (oi) =>
        oi.menuItem.id === selectedItem.id &&
        oi.observations === (tempObservation || undefined)
    )

    if (existingIndex >= 0) {
      const updated = [...orderItems]
      updated[existingIndex].quantity += tempQuantity
      setOrderItems(updated)
    } else {
      setOrderItems([
        ...orderItems,
        {
          menuItem: selectedItem,
          quantity: tempQuantity,
          observations: tempObservation || undefined,
        },
      ])
    }

    setSelectedItem(null)
    setTempQuantity(1)
    setTempObservation('')
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b-4 border-foreground">
        <div className="flex items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-12 h-12 border-2 border-foreground bg-card flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={2.5} />
            </button>
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Pedido para</p>
              <h1 className="text-2xl font-black text-foreground uppercase">Mesa {tableNumber}</h1>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-0 border-t-2 border-foreground overflow-x-auto no-scrollbar">
          {categories.map((cat, i) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`
                flex-1 min-w-[100px] px-4 py-3 text-sm font-bold uppercase tracking-wide transition-colors
                ${i > 0 ? 'border-l-2 border-foreground' : ''}
                ${activeCategory === cat.key
                  ? 'bg-foreground text-background'
                  : 'bg-card text-foreground hover:bg-muted'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* Menu Items */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMenu.map((item) => (
            <div
              key={item.id}
              className="bg-card border-4 border-foreground p-4 flex gap-4"
            >
              {/* Category Icon */}
              <div className="w-16 h-16 border-2 border-foreground bg-muted flex-shrink-0 flex items-center justify-center text-2xl">
                {item.category === 'entradas' && '🥗'}
                {item.category === 'principales' && '🍽️'}
                {item.category === 'bebidas' && '🥤'}
                {item.category === 'postres' && '🍰'}
              </div>

              <div className="flex-1 min-w-0 flex flex-col">
                <h3 className="font-bold text-foreground text-base leading-tight uppercase">
                  {item.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-1">
                  {item.description}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-black text-foreground text-lg">
                    {formatCurrency(item.price)}
                  </span>
                  <button
                    onClick={() => handleAddItem(item)}
                    className="w-10 h-10 border-2 border-foreground bg-foreground flex items-center justify-center hover:bg-foreground/80 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-background" strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t-4 border-foreground">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={onGoToSummary}
              className="w-full bg-foreground text-background py-4 font-black text-lg flex items-center justify-center gap-4 uppercase tracking-wide border-4 border-foreground hover:bg-foreground/90 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />
              <span>Ver Pedido ({totalItems})</span>
              <span className="ml-auto">{formatCurrency(totalPrice)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setSelectedItem(null)}
          />
          <div className="relative w-full max-w-md bg-card border-4 border-foreground p-6 shadow-[8px_8px_0_0_var(--foreground)]">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 w-10 h-10 border-2 border-foreground flex items-center justify-center hover:bg-muted"
            >
              <X className="w-5 h-5 text-foreground" strokeWidth={2.5} />
            </button>

            <h3 className="text-xl font-black text-foreground uppercase pr-12">
              {selectedItem.name}
            </h3>
            <p className="text-muted-foreground mt-2">{selectedItem.description}</p>
            <p className="text-2xl font-black text-foreground mt-3">
              {formatCurrency(selectedItem.price)}
            </p>

            {/* Quantity Control */}
            <div className="flex items-center justify-center gap-6 mt-8">
              <button
                onClick={() => setTempQuantity(Math.max(1, tempQuantity - 1))}
                className="w-14 h-14 border-2 border-foreground flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="w-6 h-6 text-foreground" strokeWidth={2.5} />
              </button>
              <span className="text-4xl font-black text-foreground w-16 text-center">
                {tempQuantity}
              </span>
              <button
                onClick={() => setTempQuantity(tempQuantity + 1)}
                className="w-14 h-14 border-2 border-foreground flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="w-6 h-6 text-foreground" strokeWidth={2.5} />
              </button>
            </div>

            {/* Observations */}
            <div className="mt-8">
              <label className="text-sm font-bold text-foreground uppercase tracking-wide">
                Observaciones
              </label>
              <input
                type="text"
                value={tempObservation}
                onChange={(e) => setTempObservation(e.target.value)}
                placeholder="Ej: sin cebolla, término medio..."
                className="w-full mt-2 px-4 py-3 border-2 border-foreground bg-card text-foreground placeholder:text-muted-foreground focus:ring-0 focus:outline-none"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {observationExamples.map((obs) => (
                  <button
                    key={obs}
                    onClick={() => setTempObservation(obs)}
                    className="px-3 py-1.5 border-2 border-foreground text-sm font-bold text-foreground hover:bg-muted transition-colors"
                  >
                    {obs}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirmAdd}
              className="w-full mt-8 bg-foreground text-background py-4 font-black text-lg uppercase tracking-wide border-4 border-foreground hover:bg-foreground/90 transition-colors"
            >
              Agregar {formatCurrency(selectedItem.price * tempQuantity)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
