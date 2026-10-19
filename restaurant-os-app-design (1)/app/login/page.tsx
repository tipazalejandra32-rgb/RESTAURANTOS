'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UtensilsCrossed, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import type { AuthRole } from '@/lib/auth/users'
import { ROLE_LABELS } from '@/lib/auth/permissions'

const ROLES: AuthRole[] = ['mesero', 'cocinero', 'cajero', 'administrador']

export default function LoginPage() {
  const { user, isLoading, login } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AuthRole>('mesero')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard')
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username, password, role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading || user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-lg font-black uppercase text-muted-foreground">Cargando…</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-foreground border-4 border-foreground flex items-center justify-center mx-auto mb-6 shadow-[6px_6px_0_0_var(--muted)]">
            <UtensilsCrossed className="w-10 h-10 text-background" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">
            RestaurantOS
          </h1>
          <p className="text-muted-foreground mt-2 font-bold uppercase tracking-widest text-sm">
            Iniciar sesión
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border-4 border-foreground p-8 shadow-[8px_8px_0_0_var(--foreground)]"
        >
          <label className="block mb-4">
            <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">
              Usuario
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full px-4 py-3 border-2 border-foreground bg-background font-bold focus:outline-none focus:ring-2 focus:ring-foreground"
              placeholder="mesero1"
              autoComplete="username"
              required
            />
          </label>

          <label className="block mb-6">
            <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">
              Contraseña
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full px-4 py-3 border-2 border-foreground bg-background font-bold focus:outline-none focus:ring-2 focus:ring-foreground"
              placeholder="••••"
              autoComplete="current-password"
              required
            />
          </label>

          <fieldset className="mb-6">
            <legend className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-3">
              Rol
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-center px-3 py-3 border-2 border-foreground cursor-pointer font-bold uppercase text-xs transition-colors ${
                    role === r
                      ? 'bg-foreground text-background'
                      : 'bg-card hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="sr-only"
                  />
                  {ROLE_LABELS[r]}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              Debe coincidir con el usuario (ej: mesero1 → Mesero).
            </p>
          </fieldset>

          {error && (
            <p className="mb-4 px-3 py-2 bg-destructive/10 border-2 border-destructive text-destructive text-sm font-bold uppercase">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-foreground text-background font-black uppercase tracking-wide border-4 border-foreground flex items-center justify-center gap-2 hover:shadow-[4px_4px_0_0_var(--muted)] disabled:opacity-50 transition-all"
          >
            <LogIn className="w-5 h-5" strokeWidth={2.5} />
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6 font-bold uppercase">
          Prueba: mesero1 / cocinero1 / cajero1 / admin — contraseña 123
        </p>
      </div>
    </main>
  )
}
