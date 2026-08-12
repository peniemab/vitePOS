import type { Role, User, UserPermissions } from '../db/types'

export const ROLE_LABELS: Record<Role, string> = {
  proprietaire: 'Propriétaire',
  gerant: 'Gérant',
  vendeur: 'Vendeur',
}

/** Libellés écran équipe / édition */
export const TEAM_ROLE_LABELS: Record<Role, string> = {
  proprietaire: 'Administrateur',
  gerant: 'Gérant',
  vendeur: 'Caissier',
}

export function defaultPermissions(role: Role): UserPermissions {
  const elevated = role === 'proprietaire' || role === 'gerant'
  return {
    viewReports: true,
    editPrices: elevated,
    closeCash: elevated,
    manageStock: elevated,
  }
}

export function resolvePermissions(user: Pick<User, 'role' | 'permissions'>): UserPermissions {
  return { ...defaultPermissions(user.role), ...user.permissions }
}

type RoleOrUser = Role | Pick<User, 'role' | 'permissions'>

function asUser(input: RoleOrUser): Pick<User, 'role' | 'permissions'> {
  return typeof input === 'string' ? { role: input } : input
}

export function canManageUsers(role: Role) {
  return role === 'proprietaire'
}

export function canEditPrices(input: RoleOrUser) {
  return resolvePermissions(asUser(input)).editPrices
}

export function canSeeBuyPrice(input: RoleOrUser) {
  const u = asUser(input)
  if (u.role === 'proprietaire' || u.role === 'gerant') return true
  return resolvePermissions(u).editPrices
}

export function canValidateInventory(input: RoleOrUser) {
  return resolvePermissions(asUser(input)).manageStock
}

export function canCloseCash(input: RoleOrUser) {
  return resolvePermissions(asUser(input)).closeCash
}

export function canEditStock(input: RoleOrUser) {
  return resolvePermissions(asUser(input)).manageStock
}

export function canApplyDiscount(input: RoleOrUser) {
  return resolvePermissions(asUser(input)).editPrices
}

export function canCancelSale(input: RoleOrUser) {
  const u = asUser(input)
  return u.role === 'proprietaire' || u.role === 'gerant' || resolvePermissions(u).editPrices
}

export function canViewReports(input: RoleOrUser) {
  return resolvePermissions(asUser(input)).viewReports
}

export function canDeleteBoutique(role: Role) {
  return role === 'proprietaire'
}
