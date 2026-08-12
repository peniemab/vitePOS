import { NavLink } from 'react-router-dom'
import { MAIN_NAV } from '../lib/nav'
import { useAuth } from '../lib/auth'

export function DesktopNav() {
  const { boutique, user, logout } = useAuth()

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-[72px] lg:w-[220px] flex-col bg-primary text-on-primary border-r border-primary-container"
      aria-label="Navigation principale"
    >
      <div className="h-14 flex items-center gap-2 px-3 lg:px-4 border-b border-white/10 shrink-0">
        <span className="material-symbols-outlined text-[22px] shrink-0">storefront</span>
        <div className="hidden lg:block min-w-0">
          <p className="font-headline-md text-[15px] leading-tight font-bold truncate">
            vitePOS
          </p>
          {boutique?.name && (
            <p className="font-label-mono text-[10px] text-on-primary-container truncate">
              {boutique.name}
            </p>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1">
        {MAIN_NAV.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={'end' in l ? l.end : false}
            title={l.label}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg min-h-11 px-3 transition-colors',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-on-primary-container hover:bg-white/10 hover:text-white',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-[22px] shrink-0"
                  style={{
                    fontVariationSettings: isActive
                      ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                      : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                  }}
                >
                  {l.icon}
                </span>
                <span
                  className={`hidden lg:block font-body-md text-body-md truncate ${
                    isActive ? 'font-semibold' : ''
                  }`}
                >
                  {l.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-white/10 shrink-0">
        {user && (
          <p className="hidden lg:block px-3 mb-2 font-label-mono text-[10px] text-on-primary-container truncate">
            {user.name}
          </p>
        )}
        <button
          type="button"
          onClick={() => void logout()}
          title="Changer d’utilisateur"
          className="w-full flex items-center gap-3 rounded-lg min-h-11 px-3 text-on-primary-container hover:bg-white/10 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
          <span className="hidden lg:block font-body-md text-body-md">Changer PIN</span>
        </button>
      </div>
    </aside>
  )
}
