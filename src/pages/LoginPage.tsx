import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { loginWithPin } from '../lib/services'
import { syncNow } from '../lib/sync'

const PIN_LENGTH = 4
const AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuABftDAMCKlbE4rRtX1DfQJWcbwstPeGitHUPEDArHAhRQjVjRE0-junI2L63i6ddqCr1kgLnx-tfvHk9lE7QXDWiIrZhwku1K9p-Wx_j-CUfhKZhrEDLtDGDfcvVm8Uf2C1aRBGt_QJvEuFBYNQjcB-qYrpPBCsVsj4zNG1kog7qmUOGKwD_zN6IYiIN-Czk4cdp62DLxPHL7hxeExsUeC_selnXfjMMwWKxIRxJ4RUsvTbbAKz6UT'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

export function LoginPage() {
  const { boutique } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(false)

  const submitPin = useCallback(async (value: string) => {
    setBusy(true)
    setError('')
    try {
      await loginWithPin(value)
    } catch (err) {
      setError(String((err as Error).message || err) || 'Code incorrect. Réessayez.')
      setShake(true)
      setPin('')
      window.setTimeout(() => setShake(false), 350)
    } finally {
      setBusy(false)
    }
  }, [])

  const pushDigit = useCallback(
    (digit: string) => {
      if (busy) return
      setPin((prev) => {
        if (prev.length >= PIN_LENGTH) return prev
        const next = prev + digit
        if (next.length === PIN_LENGTH) {
          window.setTimeout(() => void submitPin(next), 120)
        }
        return next
      })
      setError('')
    },
    [busy, submitPin],
  )

  const deleteDigit = useCallback(() => {
    if (busy) return
    setPin((prev) => prev.slice(0, -1))
    setError('')
  }, [busy])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') pushDigit(e.key)
      else if (e.key === 'Backspace' || e.key === 'Delete') deleteDigit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pushDigit, deleteDigit])

  return (
    <div className="bg-background text-on-background font-body-md h-screen w-full flex flex-col antialiased overflow-hidden">
      <div
        className="h-1 w-full bg-tertiary-container"
        title={navigator.onLine ? 'Système en ligne' : 'Hors ligne'}
      />

      <main className="flex-1 flex flex-col w-full max-w-lg mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center p-margin-desktop">
          <div className="mb-stack-md flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border-2 border-outline-variant bg-surface-container-highest flex items-center justify-center overflow-hidden mb-base shadow-sm">
              <img
                className="w-full h-full object-cover"
                alt=""
                src={AVATAR}
              />
            </div>
            <h1 className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
              {boutique?.name || 'vitePOS'}
            </h1>
          </div>

          <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary text-center mb-stack-md">
            Entrez votre code PIN
          </h2>

          <div
            className={`flex items-center justify-center gap-gutter my-stack-md h-8 ${shake ? 'animate-pin-shake' : ''}`}
          >
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  i < pin.length
                    ? 'bg-primary border-primary scale-110'
                    : 'border-outline-variant bg-surface-container'
                }`}
              />
            ))}
          </div>

          <p
            className={`font-label-mono text-label-mono text-error h-4 transition-opacity ${
              error ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {error || 'Code incorrect. Réessayez.'}
          </p>
        </div>

        <div className="w-full bg-surface border-t border-outline-variant shadow-[0_-4px_24px_rgba(0,0,0,0.05)] rounded-t-[24px] pb-10 pt-6 px-margin-desktop mt-auto relative z-10">
          <div className="grid grid-cols-3 gap-stack-sm md:gap-gutter max-w-sm mx-auto">
            {KEYS.map((key, idx) => {
              if (key === '') return <div key={`empty-${idx}`} />
              if (key === 'del') {
                return (
                  <button
                    key="del"
                    type="button"
                    aria-label="Supprimer"
                    disabled={busy}
                    onClick={deleteDigit}
                    className="h-[64px] rounded-lg bg-surface-container-high border-transparent text-on-surface-variant flex items-center justify-center hover:bg-surface-variant active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[28px]">backspace</span>
                  </button>
                )
              }
              return (
                <button
                  key={key}
                  type="button"
                  disabled={busy}
                  onClick={() => pushDigit(key)}
                  className="h-[64px] rounded-lg bg-surface-container-lowest border border-outline-variant font-display-price text-display-price text-on-surface flex items-center justify-center shadow-sm hover:bg-surface-container-low active:bg-surface-variant active:border-primary active:border-2 active:scale-95 transition-all"
                >
                  {key}
                </button>
              )
            })}
          </div>

          <div className="mt-stack-md flex justify-center w-full max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => void syncNow()}
              className="font-label-mono text-label-mono text-primary flex items-center gap-1 hover:underline p-2 rounded-lg hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              FORCER LA SYNCHRONISATION
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
