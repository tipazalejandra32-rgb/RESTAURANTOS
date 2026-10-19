'use client'

import { useState } from 'react'
import { useRestaurantStore, formatCurrency } from '@/lib/store'
import type { MenuItem, User } from '@/lib/store'
import { UtensilsCrossed, Armchair, Users, Plus, Pencil, Trash2, X, Check, Power } from 'lucide-react'
import { useToast } from '@/components/ui/toast-notification'

type AdminTab = 'menu' | 'mesas' | 'usuarios'
type MenuCategory = 'entradas' | 'principales' | 'bebidas' | 'postres'

const categoryLabels: Record<MenuCategory, string> = {
  entradas: 'Entradas',
  principales: 'Platos Principales',
  bebidas: 'Bebidas',
  postres: 'Postres',
}

const roleLabels: Record<User['role'], string> = {
  mesero: 'Mesero',
  cocinero: 'Cocinero',
  cajero: 'Cajero',
  administrador: 'Administrador',
}

export function AdminSection() {
  const [activeTab, setActiveTab] = useState<AdminTab>('menu')
  const { showToast } = useToast()
  const menu = useRestaurantStore((state) => state.menu)
  const tables = useRestaurantStore((state) => state.tables)
  const users = useRestaurantStore((state) => state.users)
  const addMenuItem = useRestaurantStore((state) => state.addMenuItem)
  const updateMenuItem = useRestaurantStore((state) => state.updateMenuItem)
  const deleteMenuItem = useRestaurantStore((state) => state.deleteMenuItem)
  const toggleTableActive = useRestaurantStore((state) => state.toggleTableActive)
  const addUser = useRestaurantStore((state) => state.addUser)
  const updateUser = useRestaurantStore((state) => state.updateUser)
  const toggleUserActive = useRestaurantStore((state) => state.toggleUserActive)

  // Menu form state
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'entradas' as MenuCategory,
  })

  // User form state
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState({
    name: '',
    role: 'mesero' as User['role'],
  })

  // Menu handlers
  const handleOpenMenuForm = (item?: MenuItem) => {
    if (item) {
      setEditingMenuItem(item)
      setMenuForm({
        name: item.name,
        description: item.description,
        price: String(item.price),
        category: item.category,
      })
    } else {
      setEditingMenuItem(null)
      setMenuForm({
        name: '',
        description: '',
        price: '',
        category: 'entradas',
      })
    }
    setShowMenuForm(true)
  }

  const handleSaveMenuItem = async () => {
    const price = parseInt(menuForm.price)
    if (!menuForm.name || !menuForm.description || isNaN(price)) return

    try {
      if (editingMenuItem) {
        await updateMenuItem(editingMenuItem.id, {
          name: menuForm.name,
          description: menuForm.description,
          price,
          category: menuForm.category,
        })
      } else {
        await addMenuItem({
          name: menuForm.name,
          description: menuForm.description,
          price,
          category: menuForm.category,
          available: true,
        })
      }
      setShowMenuForm(false)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al guardar el plato', 'error')
    }
  }

  const handleDeleteMenuItem = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este plato?')) {
      try {
        await deleteMenuItem(id)
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Error al eliminar', 'error')
      }
    }
  }

  // User handlers
  const handleOpenUserForm = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setUserForm({
        name: user.name,
        role: user.role,
      })
    } else {
      setEditingUser(null)
      setUserForm({
        name: '',
        role: 'mesero',
      })
    }
    setShowUserForm(true)
  }

  const handleSaveUser = async () => {
    if (!userForm.name) return

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: userForm.name,
          role: userForm.role,
        })
      } else {
        await addUser({
          name: userForm.name,
          role: userForm.role,
          active: true,
        })
      }
      setShowUserForm(false)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error al guardar usuario', 'error')
    }
  }

  const tabs = [
    { key: 'menu' as const, label: 'Menú', icon: UtensilsCrossed },
    { key: 'mesas' as const, label: 'Mesas', icon: Armchair },
    { key: 'usuarios' as const, label: 'Usuarios', icon: Users },
  ]

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-card border border-border/50 shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Menu Management */}
      {activeTab === 'menu' && (
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Gestión del Menú</h2>
              <p className="text-sm text-muted-foreground">{menu.length} platos registrados</p>
            </div>
            <button
              onClick={() => handleOpenMenuForm()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Agregar Plato
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b border-border/50">
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="px-5 py-3 font-medium">Categoría</th>
                  <th className="px-5 py-3 font-medium">Descripción</th>
                  <th className="px-5 py-3 font-medium text-right">Precio</th>
                  <th className="px-5 py-3 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {menu.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-5 py-4 font-medium text-foreground">{item.name}</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded-lg bg-muted text-sm text-muted-foreground">
                        {categoryLabels[item.category]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">
                      {item.description}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-foreground">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenMenuForm(item)}
                          className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tables Management */}
      {activeTab === 'mesas' && (
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <h2 className="text-lg font-semibold text-foreground">Gestión de Mesas</h2>
            <p className="text-sm text-muted-foreground">
              {tables.filter((t) => t.active).length} mesas activas
            </p>
          </div>

          <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {tables.map((table) => (
              <div
                key={table.number}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  !table.active
                    ? 'border-dashed border-muted bg-muted/30'
                    : table.status === 'disponible'
                    ? 'border-[var(--ios-green)]/30 bg-[var(--ios-green-light)]'
                    : 'border-[var(--ios-orange)]/30 bg-[var(--ios-orange-light)]'
                }`}
              >
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{table.number}</p>
                  <p className={`text-sm mt-1 ${
                    !table.active
                      ? 'text-muted-foreground'
                      : table.status === 'disponible'
                      ? 'text-[var(--ios-green)]'
                      : 'text-[var(--ios-orange)]'
                  }`}>
                    {!table.active
                      ? 'Inactiva'
                      : table.status === 'disponible'
                      ? 'Disponible'
                      : 'Ocupada'}
                  </p>
                  <button
                    onClick={() => void toggleTableActive(table.number)}
                    className={`mt-3 w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                      table.active
                        ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                    }`}
                  >
                    {table.active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Management */}
      {activeTab === 'usuarios' && (
        <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Gestión de Usuarios</h2>
              <p className="text-sm text-muted-foreground">
                {users.filter((u) => u.active).length} usuarios activos
              </p>
            </div>
            <button
              onClick={() => handleOpenUserForm()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Crear Usuario
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b border-border/50">
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="px-5 py-3 font-medium">Rol</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {users.map((user) => (
                  <tr key={user.id} className={`hover:bg-muted/30 ${!user.active ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-4 font-medium text-foreground">{user.name}</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded-lg bg-muted text-sm text-muted-foreground">
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`flex items-center gap-2 text-sm ${
                        user.active ? 'text-[var(--ios-green)]' : 'text-muted-foreground'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          user.active ? 'bg-[var(--ios-green)]' : 'bg-muted-foreground'
                        }`} />
                        {user.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenUserForm(user)}
                          className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => void toggleUserActive(user.id)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            user.active
                              ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                              : 'bg-[var(--ios-green-light)] text-[var(--ios-green)] hover:bg-[var(--ios-green-light)]/80'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Menu Form Modal */}
      {showMenuForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMenuForm(false)}
          />
          <div className="relative w-full max-w-md bg-card rounded-3xl p-6 shadow-xl">
            <button
              onClick={() => setShowMenuForm(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            <h3 className="text-xl font-semibold text-foreground mb-6">
              {editingMenuItem ? 'Editar Plato' : 'Nuevo Plato'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nombre</label>
                <input
                  type="text"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Nombre del plato"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Categoría</label>
                <select
                  value={menuForm.category}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, category: e.target.value as MenuCategory })
                  }
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="entradas">Entradas</option>
                  <option value="principales">Platos Principales</option>
                  <option value="bebidas">Bebidas</option>
                  <option value="postres">Postres</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Descripción</label>
                <textarea
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-foreground border-0 focus:ring-2 focus:ring-primary outline-none resize-none"
                  rows={3}
                  placeholder="Descripción del plato"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Precio (COP)</label>
                <input
                  type="number"
                  value={menuForm.price}
                  onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ej: 25000"
                />
              </div>
            </div>

            <button
              onClick={() => void handleSaveMenuItem()}
              className="w-full mt-6 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Check className="w-5 h-5" />
              {editingMenuItem ? 'Guardar Cambios' : 'Crear Plato'}
            </button>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowUserForm(false)}
          />
          <div className="relative w-full max-w-md bg-card rounded-3xl p-6 shadow-xl">
            <button
              onClick={() => setShowUserForm(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>

            <h3 className="text-xl font-semibold text-foreground mb-6">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nombre Completo</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Nombre del usuario"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Rol</label>
                <select
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm({ ...userForm, role: e.target.value as User['role'] })
                  }
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="mesero">Mesero</option>
                  <option value="cocinero">Cocinero</option>
                  <option value="cajero">Cajero</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => void handleSaveUser()}
              className="w-full mt-6 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Check className="w-5 h-5" />
              {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
