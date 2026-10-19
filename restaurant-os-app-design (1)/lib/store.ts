// RestaurantOS - Global State Management (Zustand + MySQL vía API)
import { create } from 'zustand'

// Types
export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: 'entradas' | 'principales' | 'bebidas' | 'postres'
  image?: string
  available: boolean
}

export interface OrderItem {
  menuItem: MenuItem
  quantity: number
  observations?: string
}

export interface Order {
  id: string
  tableNumber: number
  items: OrderItem[]
  status: 'pendiente' | 'en-cocina' | 'listo' | 'entregado' | 'pagado'
  createdAt: Date
  waiterName: string
  total: number
}

export type OrderStatus = Order['status']

export interface Table {
  number: number
  status: 'disponible' | 'ocupada'
  currentOrderId?: string
  active: boolean
}

export interface User {
  id: string
  name: string
  role: 'mesero' | 'cocinero' | 'cajero' | 'administrador'
  active: boolean
}

export interface Invoice {
  id: string
  orderId: string
  tableNumber: number
  items: OrderItem[]
  subtotal: number
  iva: number
  total: number
  createdAt: Date
  restaurantName: string
}

export type WireRestaurantState = {
  menu: MenuItem[]
  tables: Table[]
  orders: Array<Omit<Order, 'createdAt'> & { createdAt: string }>
  users: User[]
  invoices: Array<Omit<Invoice, 'createdAt'> & { createdAt: string }>
}

function pickDefaultWaiter(users: User[]): User | null {
  return users.find((u) => u.role === 'mesero' && u.active) ?? users[0] ?? null
}

async function postSync(
  action: string,
  payload?: unknown
): Promise<{ newOrderId?: string; newInvoiceId?: string }> {
  const res = await fetch('/api/restaurant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  })
  const data = (await res.json()) as {
    ok?: boolean
    error?: string
    state?: WireRestaurantState
    newOrderId?: string
    newInvoiceId?: string
  }
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || res.statusText)
  }
  if (!data.state) {
    throw new Error('Respuesta inválida del servidor')
  }
  useRestaurantStore.getState().mergeServerState(data.state)
  return { newOrderId: data.newOrderId, newInvoiceId: data.newInvoiceId }
}

interface RestaurantStore {
  menu: MenuItem[]
  tables: Table[]
  orders: Order[]
  users: User[]
  invoices: Invoice[]
  currentWaiter: User | null
  hasHydrated: boolean

  mergeServerState: (wire: WireRestaurantState) => void
  fetchAndHydrate: () => Promise<void>

  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>
  updateMenuItem: (id: string, item: Partial<MenuItem>) => Promise<void>
  deleteMenuItem: (id: string) => Promise<void>

  setTableStatus: (tableNumber: number, status: 'disponible' | 'ocupada') => Promise<void>
  toggleTableActive: (tableNumber: number) => Promise<void>

  createOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<string>
  addItemsToOrder: (orderId: string, items: OrderItem[]) => Promise<void>
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>
  getOrderById: (orderId: string) => Order | undefined
  getOrderByTable: (tableNumber: number) => Order | undefined
  getActiveOrdersByTable: (tableNumber: number) => Order[]

  createInvoice: (orderId: string) => Promise<Invoice | undefined>

  setCurrentWaiter: (user: User) => void
  addUser: (user: Omit<User, 'id'>) => Promise<void>
  updateUser: (id: string, user: Partial<User>) => Promise<void>
  toggleUserActive: (id: string) => Promise<void>

  releaseTable: (tableNumber: number) => Promise<void>
}

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
  menu: [],
  tables: [],
  orders: [],
  users: [],
  invoices: [],
  currentWaiter: null,
  hasHydrated: false,

  mergeServerState: (wire) => {
    const prevWaiter = get().currentWaiter
    set({
      menu: wire.menu,
      tables: wire.tables,
      users: wire.users,
      orders: wire.orders.map((o) => ({ ...o, createdAt: new Date(o.createdAt) })),
      invoices: wire.invoices.map((i) => ({ ...i, createdAt: new Date(i.createdAt) })),
      currentWaiter: prevWaiter ?? pickDefaultWaiter(wire.users),
      hasHydrated: true,
    })
  },

  fetchAndHydrate: async () => {
    const res = await fetch('/api/restaurant')
    const data = await res.json()
    if (!res.ok) {
      throw new Error((data as { error?: string }).error || res.statusText)
    }
    get().mergeServerState(data as WireRestaurantState)
  },

  addMenuItem: async (item) => {
    await postSync('addMenuItem', item)
  },

  updateMenuItem: async (id, item) => {
    await postSync('updateMenuItem', { id, patch: item })
  },

  deleteMenuItem: async (id) => {
    await postSync('deleteMenuItem', { id })
  },

  setTableStatus: async (tableNumber, status) => {
    await postSync('setTableStatus', { tableNumber, status })
  },

  toggleTableActive: async (tableNumber) => {
    await postSync('toggleTableActive', { tableNumber })
  },

  createOrder: async (order) => {
    const { newOrderId } = await postSync('createOrder', {
      tableNumber: order.tableNumber,
      items: order.items,
      status: order.status,
      waiterName: order.waiterName,
      total: order.total,
    })
    if (!newOrderId) throw new Error('No se pudo crear el pedido')
    return newOrderId
  },

  addItemsToOrder: async (orderId, items) => {
    await postSync('addItemsToOrder', { orderId, items })
  },

  updateOrderStatus: async (orderId, status) => {
    await postSync('updateOrderStatus', { orderId, status })
  },

  getOrderById: (orderId) => get().orders.find((o) => o.id === orderId),

  getOrderByTable: (tableNumber) => {
    const table = get().tables.find((t) => t.number === tableNumber)
    if (!table?.currentOrderId) return undefined
    return get().orders.find((o) => o.id === table.currentOrderId)
  },

  getActiveOrdersByTable: (tableNumber) =>
    get().orders.filter((o) => o.tableNumber === tableNumber && o.status !== 'pagado'),

  createInvoice: async (orderId) => {
    const { newInvoiceId } = await postSync('createInvoice', { orderId })
    if (newInvoiceId) return get().invoices.find((i) => i.id === newInvoiceId)
    return undefined
  },

  setCurrentWaiter: (user) => set({ currentWaiter: user }),

  addUser: async (user) => {
    await postSync('addUser', user)
  },

  updateUser: async (id, user) => {
    await postSync('updateUser', { id, patch: user })
  },

  toggleUserActive: async (id) => {
    await postSync('toggleUserActive', { id })
  },

  releaseTable: async (tableNumber) => {
    await postSync('releaseTable', { tableNumber })
  },
}))

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatTimeElapsed = (date: Date): string => {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}min`
}

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
