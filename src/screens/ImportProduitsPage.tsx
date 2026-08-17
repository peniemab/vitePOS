import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { bulkImportProducts } from '../lib/services'
import { canEditPrices } from '../lib/roles'
import {
  CSV_TEMPLATE,
  downloadCsvTemplate,
  parseProductCsv,
  type ImportRow,
} from '../lib/csv-import'
import { formatMoney } from '../lib/utils'

const sectionClass =
  'bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md'
const btnPrimary =
  'h-12 px-4 bg-primary text-on-primary rounded-lg font-headline-md text-headline-md inline-flex items-center justify-center disabled:opacity-50'
const btnGhost =
  'h-12 px-4 rounded-lg border border-outline-variant font-label-mono text-label-mono text-primary hover:bg-surface-container-low inline-flex items-center justify-center'

export function ImportProduitsPage() {
  const { boutique, user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [paste, setPaste] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const preview = useMemo(() => rows.slice(0, 20), [rows])

  if (!boutique || !user) return null
  if (!canEditPrices(user)) {
    return (
      <div className="flex flex-col gap-stack-md w-full max-w-3xl mx-auto pb-4">
        <Link
          to="/produits"
          className="font-body-md text-body-md text-on-surface-variant inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Stock
        </Link>
        <p className="font-body-md text-body-md text-error font-semibold">
          Seul le propriétaire ou le gérant peut importer des produits.
        </p>
      </div>
    )
  }

  function applyText(text: string) {
    const parsed = parseProductCsv(text)
    setRows(parsed.rows)
    setErrors(parsed.errors)
    setResult('')
    setError('')
  }

  async function onFile(file: File) {
    const text = await file.text()
    setPaste(text.slice(0, 4000))
    applyText(text)
  }

  async function onImport() {
    if (!rows.length) {
      setError('Aucun produit à importer')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await bulkImportProducts(boutique!.id, rows, 'merge')
      setResult(
        `Import terminé : ${res.total} lignes · ${res.created} créés · ${res.updated} mis à jour`,
      )
    } catch (err) {
      setError(String((err as Error).message || err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-stack-md w-full max-w-3xl mx-auto pb-4">
      <div>
        <Link
          to="/produits"
          className="font-body-md text-body-md text-on-surface-variant inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Stock
        </Link>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mt-2">
          Import produits
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Pour les boutiques avec beaucoup d’articles : importez un fichier CSV (Excel → Enregistrer
          sous CSV).
        </p>
      </div>

      <section className={sectionClass}>
        <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">download</span>
          1. Modèle
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Colonnes : nom, categorie, prix_vente, prix_achat, stock, seuil, unite, code_barres,
          favori
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} onClick={() => downloadCsvTemplate()}>
            Télécharger le modèle CSV
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setPaste(CSV_TEMPLATE)
              applyText(CSV_TEMPLATE)
            }}
          >
            Charger l’exemple
          </button>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="font-headline-md text-headline-md text-primary flex items-center gap-2">
          <span className="material-symbols-outlined">upload_file</span>
          2. Fichier ou collage
        </h2>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onFile(f)
          }}
        />
        <button type="button" className={btnGhost} onClick={() => fileRef.current?.click()}>
          Choisir un fichier CSV
        </button>
        <label className="flex flex-col gap-1">
          <span className="font-label-mono text-label-mono text-on-surface-variant">
            Ou coller le CSV ici
          </span>
          <textarea
            rows={8}
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="nom,categorie,prix_vente,stock..."
            className="px-4 py-3 rounded-lg border border-outline-variant bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary focus:border-primary font-label-mono text-label-mono"
          />
        </label>
        <button type="button" className={btnGhost} onClick={() => applyText(paste)}>
          Analyser
        </button>
      </section>

      {(rows.length > 0 || errors.length > 0) && (
        <section className={sectionClass}>
          <h2 className="font-headline-md text-headline-md text-primary">3. Aperçu</h2>
          <p className="font-body-lg text-body-lg text-on-surface">
            <strong>{rows.length}</strong> produits prêts
            {errors.length ? ` · ${errors.length} lignes en erreur` : ''}
          </p>
          {errors.slice(0, 8).map((e) => (
            <p key={e} className="font-body-md text-body-md text-error">
              {e}
            </p>
          ))}
          <div className="flex flex-col border border-outline-variant rounded-xl overflow-hidden">
            {preview.map((r, i) => (
              <div
                key={`${r.name}-${i}`}
                className={`flex items-center justify-between gap-3 p-4 ${
                  i < preview.length - 1 ? 'border-b border-surface-variant' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="font-body-lg text-body-lg font-semibold text-on-surface truncate">
                    {r.name}
                  </p>
                  <p className="font-label-mono text-label-mono text-on-surface-variant">
                    {r.category} · stock {r.stock ?? 0}
                    {r.barcode ? ` · ${r.barcode}` : ''}
                  </p>
                </div>
                <span className="font-headline-md text-headline-md text-primary shrink-0">
                  {formatMoney(r.sellPrice, boutique.currency)}
                </span>
              </div>
            ))}
          </div>
          {rows.length > preview.length && (
            <p className="font-body-md text-body-md text-on-surface-variant">
              … et {rows.length - preview.length} autres
            </p>
          )}
          <button
            className={`${btnPrimary} w-full bg-secondary`}
            type="button"
            disabled={busy}
            onClick={() => void onImport()}
          >
            {busy ? 'Import…' : `Importer ${rows.length} produits`}
          </button>
        </section>
      )}

      {result && (
        <p className="font-body-md text-body-md text-on-tertiary-container font-semibold">
          {result}
        </p>
      )}
      {error && <p className="font-body-md text-body-md text-error font-semibold">{error}</p>}
    </div>
  )
}
