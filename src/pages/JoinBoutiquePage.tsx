import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { joinBoutiqueRemote } from '../lib/services'

export function JoinBoutiquePage() {
  const [invite, setInvite] = useState('')
  const [joinName, setJoinName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (pin.length < 4) {
      setError('Choisissez un PIN d’au moins 4 chiffres')
      return
    }
    setBusy(true)
    try {
      await joinBoutiqueRemote({ inviteCode: invite, name: joinName, pin })
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="bl-welcome flex min-h-screen flex-col px-margin-mobile md:px-margin-desktop py-6 max-w-md mx-auto w-full">
      <header className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-primary font-body-md text-body-md mb-6"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          Retour
        </Link>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
          Rejoindre une boutique
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Saisissez le code invitation fourni par le propriétaire.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-stack-md flex-1">
        <label className="flex flex-col gap-1">
          <span className="font-body-md text-body-md text-on-surface-variant">Code invitation</span>
          <input
            className="bl-input font-label-mono text-label-mono uppercase tracking-widest"
            value={invite}
            onChange={(e) => setInvite(e.target.value.toUpperCase())}
            required
            placeholder="ABC123"
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body-md text-body-md text-on-surface-variant">Votre nom</span>
          <input
            className="bl-input"
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body-md text-body-md text-on-surface-variant">Votre PIN</span>
          <input
            className="bl-input font-label-mono text-label-mono tracking-widest"
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
          {busy ? 'Connexion…' : 'Rejoindre'}
        </button>
      </form>
    </main>
  )
}
