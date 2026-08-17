'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBoutique } from '@/lib/services'

export function CreateBoutiquePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (pin.length < 4) {
      setError('PIN d’au moins 4 chiffres')
      return
    }
    setBusy(true)
    try {
      await createBoutique({ name, ownerName, pin })
      router.replace('/accueil')
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="bl-welcome flex min-h-dvh flex-col px-margin-mobile md:px-margin-desktop py-6 max-w-md mx-auto w-full">
      <header className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-primary font-body-md text-body-md mb-6"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          Retour
        </Link>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
          Créer une boutique
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Votre espace sera enregistré sur le serveur et utilisable hors ligne.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-stack-md flex-1">
        <label className="flex flex-col gap-1">
          <span className="font-body-md text-body-md text-on-surface-variant">Nom de la boutique</span>
          <input
            className="bl-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body-md text-body-md text-on-surface-variant">Votre nom (propriétaire)</span>
          <input
            className="bl-input"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body-md text-body-md text-on-surface-variant">PIN (4+ chiffres)</span>
          <input
            className="bl-input font-label-mono tracking-widest"
            inputMode="numeric"
            type="password"
            autoComplete="new-password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            required
          />
        </label>
        {error && <p className="text-error font-body-md text-body-md">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full min-h-[56px] mt-auto bg-primary text-on-primary rounded-xl font-headline-md text-headline-md disabled:opacity-60 active:scale-95 transition-transform"
        >
          {busy ? 'Création…' : 'Créer ma boutique'}
        </button>
      </form>
    </main>
  )
}
