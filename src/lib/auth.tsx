import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Boutique, User } from '../db/types'
import * as services from './services'
import { setStoredToken, getStoredToken } from './api'

interface AuthCtx {
  ready: boolean
  boutique: Boutique | null
  user: User | null
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const meta = useLiveQuery(() => db.meta.get('app'), [])
  const boutique = useLiveQuery(
    () => (meta?.boutiqueId ? db.boutiques.get(meta.boutiqueId) : undefined),
    [meta?.boutiqueId],
  )
  const user = useLiveQuery(
    () => (meta?.currentUserId ? db.users.get(meta.currentUserId) : undefined),
    [meta?.currentUserId],
  )
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void db.open().finally(() => setReady(true))
  }, [])

  // Restaure le JWT depuis IndexedDB si absent du localStorage
  useEffect(() => {
    if (!meta?.authToken) return
    if (!getStoredToken()) setStoredToken(meta.authToken)
  }, [meta?.authToken])

  // Migre les anciennes boutiques FCFA → CDF + taux USD
  useEffect(() => {
    if (!meta?.boutiqueId) return
    void services.ensureKinshasaDefaults(meta.boutiqueId)
  }, [meta?.boutiqueId])

  const refresh = useCallback(async () => {
    // live query handles refresh
  }, [])

  const logout = useCallback(async () => {
    await services.logoutUser()
  }, [])

  const value = useMemo(
    () => ({
      ready,
      boutique: boutique || null,
      user: user || null,
      refresh,
      logout,
    }),
    [ready, boutique, user, refresh, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth hors AuthProvider')
  return ctx
}
