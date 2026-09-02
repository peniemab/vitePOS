'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MOBILE_NAV } from '../lib/nav'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 px-base bg-surface border-t border-outline-variant"
      aria-label="Navigation principale"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {MOBILE_NAV.map((l) => {
        const isActive =
          'end' in l && l.end
            ? pathname === l.to
            : pathname === l.to || pathname.startsWith(`${l.to}/`)
        return (
          <Link
            key={l.to}
            href={l.to}
            className={[
              'flex flex-col items-center justify-center min-w-0 flex-1 h-full transition-transform duration-100 active:scale-95',
              isActive
                ? 'bg-primary-container text-on-primary-container rounded-full mx-1 max-h-14 my-auto py-1'
                : 'text-on-surface-variant hover:bg-surface-container-low',
            ].join(' ')}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{
                fontVariationSettings: isActive
                  ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                  : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
              }}
            >
              {l.icon}
            </span>
            <span
              className={`font-label-mono text-label-mono mt-0.5 truncate max-w-full px-1 ${
                isActive ? 'font-bold' : ''
              }`}
            >
              {l.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
