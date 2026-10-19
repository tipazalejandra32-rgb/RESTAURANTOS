'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRestaurantStore, formatCurrency } from '@/lib/store'
import type { AuthRole } from '@/lib/auth/users'
import { ROLE_LABELS } from '@/lib/auth/permissions'
import { useToast } from '@/components/ui/toast-notification'
import { Shield, Users, ScrollText, Settings, Plus, Trash2, Pencil } from 'lucide-react'

type AdminPanelTab = 'usuarios' | 'logs' | 'config'

interface SafeAuthUser {
  id: string
  username: string
  name: string
  role: AuthRole
}

interface AccessLog {
  id: string
  username: string
  name: string
  role: string
  at: string
  ip?: string
}

export function PanelAdmin() {
  const { token } = useAuth()
  const menu = useRestaurantStore((s) => s.menu)
  const updateMenuItem = useRestaurantStore((s) => s.updateMenuItem)
  const { showToast } = useToast()
  const [tab, setTab] = useState<AdminPanelTab>('usuarios')
  const [authUsers, setAuthUsers] = useState<SafeAuthUser[]>([])
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'mesero' as AuthRole,
  })

  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token]
  )

  const loadUsers = useCallback(async () => {
    if (!token) return
    const res = await fetch('/api/auth/users', { headers: authHeaders() })
    const data = await res.json()
    if (data.ok) setAuthUsers(data.users)
  }, [token, authHeaders])

  const loadLogs = useCallback(async () => {
    if (!token) return
    const res = await fetch('/api/auth/logs', { headers: authHeaders() })
    const data = await res.json()
    if (data.ok) setLogs(data.logs)
  }, [token, authHeaders])

  useEffect(() => {
    if (tab === 'usuarios') loadUsers()
    if (tab === 'logs') loadLogs()
  }, [tab, loadUsers, loadLogs])

  const handleSaveUser = async () => {
    if (!token) return
    setLoading(true)
    try {
      const body = editingId
        ? {
            action: 'update' as const,
            id: editingId,
            user: {
              username: form.username,
              ...(form.password ? { password: form.password } : {}),
              name: form.name,
              role: form.role,
            },
          }
        : {
            action: 'create' as const,
            user: form,
          }
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      showToast(editingId ? 'Usuario actualizado' : 'Usuario creado', 'success')
      setEditingId(null)
      setForm({ username: '', password: '', name: '', role: 'mesero' })
      await loadUsers()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!token || !confirm('¿Eliminar este usuario de acceso?')) return
    const res = await fetch('/api/auth/users', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action: 'delete', id }),
    })
    const data = await res.json()
    if (data.ok) {
      showToast('Usuario eliminado', 'success')
      loadUsers()
    }
  }

  const handlePriceChange = async (itemId: string, price: number) => {
    try {
      await updateMenuItem(itemId, { price })
      showToast('Precio actualizado', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error', 'error')
    }
  }

  const tabs: { key: AdminPanelTab; label: string; icon: typeof Users }[] = [
    { key: 'usuarios', label: 'Usuarios', icon: Users },
    { key: 'logs', label: 'Accesos', icon: ScrollText },
    { key: 'config', label: 'Precios', icon: Settings },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 border-4 border-foreground bg-[var(--status-delivered)]/20">
        <Shield className="w-8 h-8" strokeWidth={2.5} />
        <div>
          <h2 className="text-xl font-black uppercase">Panel de administración</h2>
          <p className="text-sm text-muted-foreground font-bold">
            Usuarios de login, registros de acceso y precios
          </p>
        </div>
      </div>

      <div className="flex border-2 border-foreground">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold uppercase text-sm ${
              tab === key ? 'bg-foreground text-background' : 'bg-card hover:bg-muted'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'usuarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border-4 border-foreground p-6">
            <h3 className="font-black uppercase mb-4">
              {editingId ? 'Editar usuario' : 'Nuevo usuario'}
            </h3>
            <div className="space-y-3">
              <input
                placeholder="Usuario"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 border-2 border-foreground font-bold"
              />
              <input
                type="password"
                placeholder={editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border-2 border-foreground font-bold"
              />
              <input
                placeholder="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border-2 border-foreground font-bold"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as AuthRole })}
                className="w-full px-3 py-2 border-2 border-foreground font-bold"
              >
                {(Object.keys(ROLE_LABELS) as AuthRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSaveUser}
                disabled={loading}
                className="w-full py-3 bg-foreground text-background font-black uppercase flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {editingId ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
          <div className="bg-card border-4 border-foreground divide-y-4 divide-foreground">
            {authUsers.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-black uppercase">{u.name}</p>
                  <p className="text-sm text-muted-foreground font-bold">
                    @{u.username} · {ROLE_LABELS[u.role]}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(u.id)
                      setForm({
                        username: u.username,
                        password: '',
                        name: u.name,
                        role: u.role,
                      })
                    }}
                    className="p-2 border-2 border-foreground hover:bg-muted"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-2 border-2 border-foreground hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="bg-card border-4 border-foreground max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="p-8 text-center font-bold text-muted-foreground uppercase">
              Sin registros aún
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-4 border-b-2 border-foreground/20 flex justify-between gap-4 text-sm"
              >
                <div>
                  <span className="font-black">{log.name}</span>
                  <span className="text-muted-foreground"> (@{log.username})</span>
                  <span className="ml-2 text-xs font-bold uppercase">{log.role}</span>
                </div>
                <span className="font-mono text-muted-foreground whitespace-nowrap">
                  {new Date(log.at).toLocaleString('es-CO')}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'config' && (
        <div className="bg-card border-4 border-foreground divide-y-4 divide-foreground">
          {menu.map((item) => (
            <div key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-black uppercase">{item.name}</p>
                <p className="text-xs text-muted-foreground font-bold">{item.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue={item.price}
                  className="w-28 px-2 py-1 border-2 border-foreground font-black text-right"
                  onBlur={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (!Number.isNaN(v) && v !== item.price) handlePriceChange(item.id, v)
                  }}
                />
                <span className="text-sm font-bold text-muted-foreground">
                  {formatCurrency(item.price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
