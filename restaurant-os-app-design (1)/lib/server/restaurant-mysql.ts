import type { RowDataPacket } from 'mysql2'
import { getPool } from '@/lib/db'
import type {
  Invoice,
  MenuItem,
  Order,
  OrderItem,
  Table,
  User,
} from '@/lib/store'

type MenuCategory = MenuItem['category']
type OrderStatus = Order['status']
type TableStatus = Table['status']

function rowToMenuItem(r: RowDataPacket): MenuItem {
  return {
    id: String(r.id),
    name: r.name,
    description: r.description,
    price: Number(r.price),
    category: r.category as MenuCategory,
    image: r.image ?? undefined,
    available: Boolean(r.available),
  }
}

function toMysqlDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

async function loadMenu(conn = getPool()): Promise<MenuItem[]> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT id, name, description, price, category, image, available
     FROM menu_items
     ORDER BY CAST(id AS UNSIGNED)`
  )
  return rows.map(rowToMenuItem)
}

async function loadTables(conn = getPool()): Promise<Table[]> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT number, status, current_order_id AS currentOrderId, active
     FROM restaurant_tables
     ORDER BY number`
  )
  return rows.map((r) => ({
    number: Number(r.number),
    status: r.status as TableStatus,
    currentOrderId: r.currentOrderId ? String(r.currentOrderId) : undefined,
    active: Boolean(r.active),
  }))
}

async function loadUsers(conn = getPool()): Promise<User[]> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT id, name, role, active FROM users ORDER BY CAST(id AS UNSIGNED)`
  )
  return rows.map((r) => ({
    id: String(r.id),
    name: r.name,
    role: r.role as User['role'],
    active: Boolean(r.active),
  }))
}

async function loadOrdersWithItems(menuById: Map<string, MenuItem>, conn = getPool()): Promise<Order[]> {
  const [orderRows] = await conn.query<RowDataPacket[]>(
    `SELECT id, table_number AS tableNumber, status, created_at AS createdAt, waiter_name AS waiterName, total
     FROM orders
     ORDER BY created_at`
  )
  const [itemRows] = await conn.query<RowDataPacket[]>(
    `SELECT order_id AS orderId, menu_item_id AS menuItemId, quantity, observations
     FROM order_items
     ORDER BY order_id, id`
  )
  const itemsByOrder = new Map<string, OrderItem[]>()
  for (const ir of itemRows) {
    const oid = String(ir.orderId)
    const mi = menuById.get(String(ir.menuItemId))
    if (!mi) continue
    const line: OrderItem = {
      menuItem: { ...mi },
      quantity: Number(ir.quantity),
      observations: ir.observations ? String(ir.observations) : undefined,
    }
    const list = itemsByOrder.get(oid) ?? []
    list.push(line)
    itemsByOrder.set(oid, list)
  }
  return orderRows.map((r) => ({
    id: String(r.id),
    tableNumber: Number(r.tableNumber),
    status: r.status as OrderStatus,
    createdAt: new Date(r.createdAt),
    waiterName: r.waiterName,
    total: Number(r.total),
    items: itemsByOrder.get(String(r.id)) ?? [],
  }))
}

async function loadInvoices(menuById: Map<string, MenuItem>, conn = getPool()): Promise<Invoice[]> {
  const [invRows] = await conn.query<RowDataPacket[]>(
    `SELECT id, order_id AS orderId, table_number AS tableNumber, subtotal, iva, total,
            created_at AS createdAt, restaurant_name AS restaurantName
     FROM invoices
     ORDER BY created_at`
  )
  if (invRows.length === 0) return []

  const [lineRows] = await conn.query<RowDataPacket[]>(
    `SELECT invoice_id AS invoiceId, menu_item_id AS menuItemId, quantity, observations
     FROM invoice_items
     ORDER BY invoice_id, id`
  )
  const linesByInv = new Map<string, OrderItem[]>()
  for (const lr of lineRows) {
    const iid = String(lr.invoiceId)
    const mi = menuById.get(String(lr.menuItemId))
    if (!mi) continue
    const line: OrderItem = {
      menuItem: { ...mi },
      quantity: Number(lr.quantity),
      observations: lr.observations ? String(lr.observations) : undefined,
    }
    const list = linesByInv.get(iid) ?? []
    list.push(line)
    linesByInv.set(iid, list)
  }
  return invRows.map((r) => ({
    id: String(r.id),
    orderId: String(r.orderId),
    tableNumber: Number(r.tableNumber),
    items: linesByInv.get(String(r.id)) ?? [],
    subtotal: Number(r.subtotal),
    iva: Number(r.iva),
    total: Number(r.total),
    createdAt: new Date(r.createdAt),
    restaurantName: r.restaurantName,
  }))
}

export async function getRestaurantState() {
  const pool = getPool()
  const menu = await loadMenu(pool)
  const menuById = new Map(menu.map((m) => [m.id, m]))
  const [tables, users, orders, invoices] = await Promise.all([
    loadTables(pool),
    loadUsers(pool),
    loadOrdersWithItems(menuById, pool),
    loadInvoices(menuById, pool),
  ])
  return { menu, tables, orders, users, invoices }
}

async function nextOrderId(conn: ReturnType<typeof getPool>): Promise<string> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(id, '-', -1) AS UNSIGNED)), 0) + 1 AS n
     FROM orders WHERE id LIKE 'order-%'`
  )
  return `order-${rows[0]?.n ?? 1}`
}

async function nextNumericId(
  conn: ReturnType<typeof getPool>,
  table: 'menu_items' | 'users'
): Promise<string> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COALESCE(MAX(CAST(id AS UNSIGNED)), 0) + 1 AS n FROM ${table} WHERE id REGEXP '^[0-9]+$'`
  )
  return String(rows[0]?.n ?? 1)
}

async function nextInvoiceId(conn: ReturnType<typeof getPool>): Promise<string> {
  const [rows] = await conn.query<RowDataPacket[]>(`SELECT id FROM invoices`)
  let max = 0
  for (const r of rows) {
    const m = /^FAC-(\d+)$/.exec(String(r.id))
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `FAC-${String(max + 1).padStart(6, '0')}`
}

async function recalcOrderTotal(orderId: string, conn: ReturnType<typeof getPool>): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT SUM(oi.quantity * m.price) AS t
     FROM order_items oi
     JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE oi.order_id = :orderId`,
    { orderId }
  )
  return Math.round(Number(rows[0]?.t ?? 0))
}

type WireOrderItem = { menuItem: MenuItem; quantity: number; observations?: string }

export type RestaurantActionResult = {
  state: Awaited<ReturnType<typeof getRestaurantState>>
  newOrderId?: string
  newInvoiceId?: string
}

export async function applyRestaurantAction(
  action: string,
  payload: unknown
): Promise<RestaurantActionResult> {
  const pool = getPool()
  const conn = await pool.getConnection()
  let newOrderId: string | undefined
  let newInvoiceId: string | undefined
  try {
    await conn.beginTransaction()

    switch (action) {
      case 'addMenuItem': {
        const p = payload as Omit<MenuItem, 'id'>
        const id = await nextNumericId(conn, 'menu_items')
        await conn.execute(
          `INSERT INTO menu_items (id, name, description, price, category, image, available)
           VALUES (:id, :name, :description, :price, :category, :image, :available)`,
          {
            id,
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category,
            image: p.image ?? null,
            available: p.available ? 1 : 0,
          }
        )
        break
      }
      case 'updateMenuItem': {
        const p = payload as { id: string; patch: Partial<MenuItem> }
        const sets: string[] = []
        const vals: Record<string, string | number | null> = { id: p.id }
        if (p.patch.name !== undefined) {
          sets.push('name = :name')
          vals.name = p.patch.name
        }
        if (p.patch.description !== undefined) {
          sets.push('description = :description')
          vals.description = p.patch.description
        }
        if (p.patch.price !== undefined) {
          sets.push('price = :price')
          vals.price = p.patch.price
        }
        if (p.patch.category !== undefined) {
          sets.push('category = :category')
          vals.category = p.patch.category
        }
        if (p.patch.image !== undefined) {
          sets.push('image = :image')
          vals.image = p.patch.image ?? null
        }
        if (p.patch.available !== undefined) {
          sets.push('available = :available')
          vals.available = p.patch.available ? 1 : 0
        }
        if (sets.length) {
          await conn.execute(`UPDATE menu_items SET ${sets.join(', ')} WHERE id = :id`, vals)
        }
        break
      }
      case 'deleteMenuItem': {
        const id = String((payload as { id: string }).id)
        await conn.execute(`DELETE FROM menu_items WHERE id = :id`, { id })
        break
      }
      case 'setTableStatus': {
        const p = payload as { tableNumber: number; status: TableStatus }
        await conn.execute(
          `UPDATE restaurant_tables SET status = :status WHERE number = :n`,
          { status: p.status, n: p.tableNumber }
        )
        break
      }
      case 'toggleTableActive': {
        const n = (payload as { tableNumber: number }).tableNumber
        await conn.execute(
          `UPDATE restaurant_tables SET active = 1 - active WHERE number = :n`,
          { n }
        )
        break
      }
      case 'createOrder': {
        const p = payload as Omit<Order, 'id' | 'createdAt'> & { items: WireOrderItem[] }
        const id = await nextOrderId(conn)
        const createdAt = new Date()
        await conn.execute(
          `INSERT INTO orders (id, table_number, status, created_at, waiter_name, total)
           VALUES (:id, :tableNumber, :status, :createdAt, :waiterName, :total)`,
          {
            id,
            tableNumber: p.tableNumber,
            status: p.status,
            createdAt: toMysqlDate(createdAt),
            waiterName: p.waiterName,
            total: p.total,
          }
        )
        for (const line of p.items) {
          await conn.execute(
            `INSERT INTO order_items (order_id, menu_item_id, quantity, observations)
             VALUES (:orderId, :menuItemId, :quantity, :observations)`,
            {
              orderId: id,
              menuItemId: line.menuItem.id,
              quantity: line.quantity,
              observations: line.observations ?? null,
            }
          )
        }
        await conn.execute(
          `UPDATE restaurant_tables SET status = 'ocupada', current_order_id = :oid WHERE number = :n`,
          { oid: id, n: p.tableNumber }
        )
        newOrderId = id
        break
      }
      case 'addItemsToOrder': {
        const p = payload as { orderId: string; items: WireOrderItem[] }
        for (const line of p.items) {
          await conn.execute(
            `INSERT INTO order_items (order_id, menu_item_id, quantity, observations)
             VALUES (:orderId, :menuItemId, :quantity, :observations)`,
            {
              orderId: p.orderId,
              menuItemId: line.menuItem.id,
              quantity: line.quantity,
              observations: line.observations ?? null,
            }
          )
        }
        const total = await recalcOrderTotal(p.orderId, conn)
        await conn.execute(
          `UPDATE orders SET total = :total, status = 'pendiente' WHERE id = :id`,
          { total, id: p.orderId }
        )
        break
      }
      case 'updateOrderStatus': {
        const p = payload as { orderId: string; status: OrderStatus }
        await conn.execute(`UPDATE orders SET status = :status WHERE id = :id`, {
          status: p.status,
          id: p.orderId,
        })
        break
      }
      case 'createInvoice': {
        const orderId = String((payload as { orderId: string }).orderId)
        const [oRows] = await conn.query<RowDataPacket[]>(
          `SELECT id, table_number AS tableNumber, total FROM orders WHERE id = :id`,
          { id: orderId }
        )
        if (!oRows.length) throw new Error('Pedido no encontrado')
        const order = oRows[0]
        const [itemRows] = await conn.query<RowDataPacket[]>(
          `SELECT menu_item_id AS menuItemId, quantity, observations FROM order_items WHERE order_id = :id`,
          { id: orderId }
        )
        const subtotal = Number(order.total)
        const iva = Math.round(subtotal * 0.19)
        const total = subtotal + iva
        const invId = await nextInvoiceId(conn)
        const createdAt = new Date()
        await conn.execute(
          `INSERT INTO invoices (id, order_id, table_number, subtotal, iva, total, created_at, restaurant_name)
           VALUES (:id, :orderId, :tableNumber, :subtotal, :iva, :total, :createdAt, :restaurantName)`,
          {
            id: invId,
            orderId,
            tableNumber: order.tableNumber,
            subtotal,
            iva,
            total,
            createdAt: toMysqlDate(createdAt),
            restaurantName: 'RestaurantOS Gourmet',
          }
        )
        for (const ir of itemRows) {
          await conn.execute(
            `INSERT INTO invoice_items (invoice_id, menu_item_id, quantity, observations)
             VALUES (:invoiceId, :menuItemId, :quantity, :observations)`,
            {
              invoiceId: invId,
              menuItemId: ir.menuItemId,
              quantity: ir.quantity,
              observations: ir.observations ?? null,
            }
          )
        }
        await conn.execute(`UPDATE orders SET status = 'pagado' WHERE id = :id`, { id: orderId })
        newInvoiceId = invId
        break
      }
      case 'addUser': {
        const p = payload as Omit<User, 'id'>
        const id = await nextNumericId(conn, 'users')
        await conn.execute(
          `INSERT INTO users (id, name, role, active) VALUES (:id, :name, :role, :active)`,
          { id, name: p.name, role: p.role, active: p.active ? 1 : 0 }
        )
        break
      }
      case 'updateUser': {
        const p = payload as { id: string; patch: Partial<User> }
        const sets: string[] = []
        const vals: Record<string, string | number> = { id: p.id }
        if (p.patch.name !== undefined) {
          sets.push('name = :name')
          vals.name = p.patch.name
        }
        if (p.patch.role !== undefined) {
          sets.push('role = :role')
          vals.role = p.patch.role
        }
        if (p.patch.active !== undefined) {
          sets.push('active = :active')
          vals.active = p.patch.active ? 1 : 0
        }
        if (sets.length) {
          await conn.execute(`UPDATE users SET ${sets.join(', ')} WHERE id = :id`, vals)
        }
        break
      }
      case 'toggleUserActive': {
        const id = String((payload as { id: string }).id)
        await conn.execute(`UPDATE users SET active = 1 - active WHERE id = :id`, { id })
        break
      }
      case 'releaseTable': {
        const tableNumber = (payload as { tableNumber: number }).tableNumber
        await conn.execute(
          `UPDATE restaurant_tables SET status = 'disponible', current_order_id = NULL WHERE number = :n`,
          { n: tableNumber }
        )
        break
      }
      default:
        throw new Error(`Acción no soportada: ${action}`)
    }

    await conn.commit()
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }

  const state = await getRestaurantState()
  return { state, newOrderId, newInvoiceId }
}
