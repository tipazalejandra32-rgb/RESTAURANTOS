import type { AuthRole } from './users'

export type ModuleKey = 'cocina' | 'mesero' | 'caja' | 'admin'

export interface CocinaPermission {
  visible: boolean
  readOnly: boolean
  canChangeStatus: boolean
}

export interface MeseroPermission {
  visible: boolean
  readOnly: boolean
  /** Cocinero: solo lista de meseros activos */
  waitersListOnly: boolean
}

export interface CajaPermission {
  visible: boolean
  readOnly: boolean
  /** Mesero: solo totales por mesa */
  totalsOnly: boolean
}

export interface RolePermissions {
  cocina: CocinaPermission
  mesero: MeseroPermission
  caja: CajaPermission
  admin: { visible: boolean }
}

export function getRolePermissions(role: AuthRole): RolePermissions {
  switch (role) {
    case 'mesero':
      return {
        cocina: { visible: true, readOnly: true, canChangeStatus: false },
        mesero: { visible: true, readOnly: false, waitersListOnly: false },
        caja: { visible: true, readOnly: true, totalsOnly: true },
        admin: { visible: false },
      }
    case 'cocinero':
      return {
        cocina: { visible: true, readOnly: false, canChangeStatus: true },
        mesero: { visible: true, readOnly: true, waitersListOnly: true },
        caja: { visible: false, readOnly: true, totalsOnly: false },
        admin: { visible: false },
      }
    case 'cajero':
      return {
        cocina: { visible: true, readOnly: true, canChangeStatus: false },
        mesero: { visible: true, readOnly: true, waitersListOnly: false },
        caja: { visible: true, readOnly: false, totalsOnly: false },
        admin: { visible: false },
      }
    case 'administrador':
      return {
        cocina: { visible: true, readOnly: false, canChangeStatus: true },
        mesero: { visible: true, readOnly: false, waitersListOnly: false },
        caja: { visible: true, readOnly: false, totalsOnly: false },
        admin: { visible: true },
      }
    default:
      return getRolePermissions('mesero')
  }
}

export function canAccessRoute(role: AuthRole, path: string): boolean {
  const perms = getRolePermissions(role)
  if (path.startsWith('/cocina')) return perms.cocina.visible
  if (path.startsWith('/mesero')) return perms.mesero.visible
  if (path.startsWith('/caja')) return perms.caja.visible
  if (path.startsWith('/dashboard')) return true
  return true
}

export const ROLE_LABELS: Record<AuthRole, string> = {
  mesero: 'Mesero',
  cocinero: 'Cocinero',
  cajero: 'Cajero',
  administrador: 'Administrador',
}
