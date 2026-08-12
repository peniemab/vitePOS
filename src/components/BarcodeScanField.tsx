import { useEffect, useRef, useState } from 'react'

type Props = {
  value: string
  onChange: (v: string) => void
  /** Appelé quand un code-barres complet est validé (Entrée / scanner) */
  onScan: (code: string) => void
  placeholder?: string
  autoFocus?: boolean
}

/**
 * Champ pensé pour :
 * - scanners USB (wedge) : frappent le code + Entrée
 * - saisie manuelle
 * - caméra si BarcodeDetector est dispo
 */
export function BarcodeScanField({
  value,
  onChange,
  onScan,
  placeholder = 'Rechercher (Nom, catégorie, barcode)...',
  autoFocus,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [camError, setCamError] = useState('')
  const [scanning, setScanning] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number>(0)

  const canCamera =
    typeof window !== 'undefined' &&
    'BarcodeDetector' in window &&
    !!navigator.mediaDevices?.getUserMedia

  useEffect(() => {
    return () => stopCamera()
  }, [])

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  async function startCamera() {
    setCamError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      setScanning(true)
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play()
        }
      })

      // @ts-expect-error BarcodeDetector is experimental
      const detector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'],
      })

      const tick = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(() => void tick())
          return
        }
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes[0]?.rawValue) {
            const code = String(codes[0].rawValue)
            onChange(code)
            onScan(code)
            stopCamera()
            inputRef.current?.focus()
            return
          }
        } catch {
          /* frame skip */
        }
        rafRef.current = requestAnimationFrame(() => void tick())
      }
      rafRef.current = requestAnimationFrame(() => void tick())
    } catch (err) {
      setCamError(String((err as Error).message || 'Caméra indisponible'))
      stopCamera()
    }
  }

  return (
    <div className="relative w-full z-10 sticky top-0 bg-background pt-2 pb-4 border-b border-outline-variant">
      <div className="flex items-center bg-surface-container-lowest border border-outline rounded-lg px-3 h-[48px] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
        <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
        <input
          ref={inputRef}
          className="flex-1 bg-transparent border-none outline-none text-body-lg font-body-lg text-on-surface placeholder:text-on-surface-variant w-full h-full p-0 focus:ring-0"
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              const code = value.trim()
              if (code) onScan(code)
            }
          }}
        />
        <button
          type="button"
          aria-label={scanning ? 'Arrêter le scan' : 'Scanner un code-barres'}
          className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors ml-2"
          onClick={() => {
            if (scanning) stopCamera()
            else if (canCamera) void startCamera()
            else inputRef.current?.focus()
          }}
        >
          <span className="material-symbols-outlined">
            {scanning ? 'close' : 'barcode_scanner'}
          </span>
        </button>
      </div>
      {scanning && (
        <video
          ref={videoRef}
          className="mt-2 w-full max-h-48 rounded-lg object-cover bg-primary"
          muted
          playsInline
        />
      )}
      {camError && (
        <p className="mt-2 font-label-mono text-label-mono text-error">{camError}</p>
      )}
    </div>
  )
}

declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => {
      detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>
    }
  }
}
