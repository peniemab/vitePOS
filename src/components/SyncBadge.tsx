import { useEffect, useState } from 'react'
import { getSyncState, subscribeSync, syncNow, type SyncState } from '../lib/sync'

const ICONS: Record<SyncState, string> = {
  online: 'cloud_done',
  offline: 'cloud_off',
  syncing: 'sync',
  conflict: 'sync_problem',
}

const LABELS: Record<SyncState, string> = {
  online: 'Synchronisé',
  offline: 'Hors ligne',
  syncing: 'Synchronisation…',
  conflict: 'Conflit sync',
}

export function SyncBadge() {
  const [state, setState] = useState<SyncState>(getSyncState())

  useEffect(() => {
    return subscribeSync(setState)
  }, [])

  return (
    <button
      type="button"
      className="material-symbols-outlined text-on-surface-variant hover:bg-surface-variant rounded-full p-2 cursor-pointer transition-colors"
      onClick={() => void syncNow()}
      title={LABELS[state]}
      aria-label={LABELS[state]}
      style={{
        fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        animation: state === 'syncing' ? 'spin 1s linear infinite' : undefined,
      }}
    >
      {ICONS[state]}
    </button>
  )
}
