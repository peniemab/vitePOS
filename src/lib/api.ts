const TOKEN_KEY = 'bl_auth_token'

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function parseJson(res: Response) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return { error: text }
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (init.auth !== false) {
    const token = getStoredToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(path, { ...init, headers })
  const data = await parseJson(res)
  if (!res.ok) {
    throw new ApiError(String(data.error || `HTTP ${res.status}`), res.status)
  }
  return data as T
}

export type AuthUser = {
  id: string
  boutiqueId: string
  name: string
  role: 'proprietaire' | 'gerant' | 'vendeur'
  active: boolean
  createdAt: number
  updatedAt: number
}

export type AuthBoutique = {
  id: string
  name: string
  currency: string
  inviteCode: string
  paperWidthMm?: number
  autoPrintTicket?: boolean
  usdRateCdf?: number
  usdRateUpdatedAt?: number
  createdAt: number
  updatedAt: number
}

export type AuthResponse = {
  token: string
  user: AuthUser
  boutique: AuthBoutique
}

export async function registerBoutique(input: {
  name: string
  ownerName: string
  pin: string
  currency?: string
  usdRateCdf?: number
}) {
  return apiFetch<AuthResponse>('/api/auth/register-boutique', {
    method: 'POST',
    body: JSON.stringify(input),
    auth: false,
  })
}

export async function joinBoutique(input: {
  inviteCode: string
  name: string
  pin: string
}) {
  return apiFetch<AuthResponse>('/api/auth/join', {
    method: 'POST',
    body: JSON.stringify(input),
    auth: false,
  })
}

export async function loginRemote(input: {
  boutiqueId?: string
  inviteCode?: string
  pin: string
  userId?: string
}) {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
    auth: false,
  })
}

export async function fetchMe() {
  return apiFetch<{ user: AuthUser; boutique: AuthBoutique }>('/api/auth/me')
}

export async function checkApiHealth() {
  try {
    const res = await fetch('/api/health')
    return res.ok
  } catch {
    return false
  }
}
