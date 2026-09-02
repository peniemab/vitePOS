'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

/** Placeholder ticket B — tableau de bord complet au ticket C. */
export default function AccueilPlaceholderPage() {
  const router = useRouter()
  const { boutique, user, logout } = useAuth()

  async function onLogout() {
    await logout()
    router.replace('/login')
  }

  return (
    <main className="bl-welcome flex min-h-dvh flex-col px-margin-mobile md:px-margin-desktop py-8 max-w-md mx-auto w-full">
      <div className="bg-primary-container text-on-primary-container p-3 rounded-xl w-fit mb-6">
        <span className="material-symbols-outlined text-3xl">check_circle</span>
      </div>
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
        Bienvenue{user?.name ? `, ${user.name}` : ''}
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant mt-2">
        Boutique <strong className="text-on-surface">{boutique?.name}</strong> prête.
        La caisse et le reste de l’app arrivent au ticket C.
      </p>

      <dl className="mt-8 grid gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4 font-body-md text-body-md">
        <div className="flex justify-between gap-4">
          <dt className="text-on-surface-variant">Rôle</dt>
          <dd className="font-semibold text-on-surface capitalize">{user?.role}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-on-surface-variant">Code invitation</dt>
          <dd className="font-label-mono tracking-widest text-on-surface">
            {boutique?.inviteCode}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => void onLogout()}
        className="mt-auto w-full min-h-[56px] border-2 border-outline-variant text-primary rounded-xl font-body-lg text-body-lg font-semibold hover:bg-surface-variant active:scale-95 transition-transform"
      >
        Se déconnecter (PIN)
      </button>
    </main>
  )
}
