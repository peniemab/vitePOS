'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

function isOnboardingPath(pathname: string) {
  return pathname === '/' || pathname.startsWith('/onboarding')
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="bl-welcome flex min-h-dvh items-center justify-center bg-surface text-on-surface">
      {label}
    </div>
  )
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

  if (!ready) return <LoadingScreen label="Chargement…" />

  if (!boutique && !isOnboardingPath(pathname)) {
    return <LoadingScreen label="Redirection…" />
  }

  if (boutique && !user && pathname !== '/login') {
    return <LoadingScreen label="Redirection…" />
  }

  if (boutique && user && (isOnboardingPath(pathname) || pathname === '/login')) {
    return <LoadingScreen label="Redirection…" />
  }

  return children
}
