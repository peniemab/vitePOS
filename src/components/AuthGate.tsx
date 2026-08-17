'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

function isOnboardingPath(pathname: string) {
  return pathname === '/' || pathname.startsWith('/onboarding')
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, boutique, user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!ready) return

    if (!boutique) {
      if (!isOnboardingPath(pathname)) router.replace('/')
      return
    }

    if (!user) {
      if (pathname !== '/login') router.replace('/login')
      return
    }

    if (isOnboardingPath(pathname) || pathname === '/login') {
      router.replace('/accueil')
    }
  }, [ready, boutique, user, pathname, router])

  if (!ready) {
    return (
      <div className="bl-welcome flex min-h-dvh items-center justify-center bg-surface text-on-surface">
        Chargement…
      </div>
    )
  }

  if (!boutique && !isOnboardingPath(pathname)) {
    return (
      <div className="bl-welcome flex min-h-dvh items-center justify-center bg-surface text-on-surface">
        Redirection…
      </div>
    )
  }

  if (boutique && !user && pathname !== '/login') {
    return (
      <div className="bl-welcome flex min-h-dvh items-center justify-center bg-surface text-on-surface">
        Redirection…
      </div>
    )
  }

  if (boutique && user && (isOnboardingPath(pathname) || pathname === '/login')) {
    return (
      <div className="bl-welcome flex min-h-dvh items-center justify-center bg-surface text-on-surface">
        Redirection…
      </div>
    )
  }

  return children
}
