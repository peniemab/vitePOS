export const MAIN_NAV = [
  { to: '/', label: 'Tableau', icon: 'dashboard', end: true },
  { to: '/caisse', label: 'Caisse', icon: 'point_of_sale' },
  { to: '/produits', label: 'Stock', icon: 'inventory_2' },
  { to: '/inventaire', label: 'Inventaire', icon: 'inventory' },
  { to: '/ventes', label: 'Ventes', icon: 'receipt_long' },
  { to: '/depenses', label: 'Dépenses', icon: 'payments' },
  { to: '/analytics', label: 'Analytics', icon: 'analytics' },
  { to: '/equipe', label: 'Équipe', icon: 'badge' },
  { to: '/plus', label: 'Plus', icon: 'menu' },
] as const

export const MOBILE_NAV = [
  { to: '/', label: 'Tableau', icon: 'dashboard', end: true },
  { to: '/caisse', label: 'Caisse', icon: 'point_of_sale' },
  { to: '/produits', label: 'Stock', icon: 'inventory_2' },
  { to: '/inventaire', label: 'Invent.', icon: 'inventory' },
  { to: '/plus', label: 'Plus', icon: 'menu' },
] as const
