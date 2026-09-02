'use client'

import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { SyncBadge } from './SyncBadge'
import { BottomNav } from './BottomNav'
import { DesktopNav } from './DesktopNav'
import { useAuth } from '../lib/auth'

export function AppShell({ children }: { children: ReactNode }) {
  const { boutique } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const showBack =
    pathname !== '/accueil' && pathname !== '/plus' && pathname !== '/caisse'

  return (
    <div className="bl-app min-h-screen flex bg-background text-on-background font-body-md">
      <div
        className={`fixed top-0 left-0 md:left-[72px] lg:left-[220px] right-0 h-[4px] z-[60] ${
          typeof navigator !== 'undefined' && navigator.onLine
            ? 'bg-on-tertiary-container'
            : 'bg-error'
        }`}
        title={
          typeof navigator !== 'undefined' && navigator.onLine
            ? 'Online / Synced'
            : 'Hors ligne'
        }
      />

      <DesktopNav />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen pt-14 pb-20 md:pb-4 md:pl-[72px] lg:pl-[220px]">
        <header className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-14 w-full fixed top-0 left-0 md:left-[72px] lg:left-[220px] right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-outline-variant">
          <div className="flex items-center gap-2 min-w-0">
            {showBack ? (
              <button
                type="button"
                aria-label="Retour"
                onClick={() => router.back()}
                className="flex items-center justify-center w-10 h-10 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full shrink-0"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            ) : (
              <span className="material-symbols-outlined text-primary shrink-0 md:hidden">
                storefront
              </span>
            )}
            <div className="min-w-0">
              <span className="font-headline-md text-headline-md font-bold text-primary block truncate md:hidden">
                vitePOS
              </span>
              <span className="hidden md:block font-headline-md text-headline-md font-bold text-primary truncate">
                {boutique?.name || 'vitePOS'}
              </span>
              {boutique?.name && (
                <span className="font-label-mono text-label-mono text-on-surface-variant truncate block md:hidden">
                  {boutique.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <SyncBadge />
          </div>
        </header>

        <main className="flex-1 flex flex-col px-margin-mobile md:px-margin-desktop py-stack-md gap-stack-md max-w-7xl mx-auto w-full">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
