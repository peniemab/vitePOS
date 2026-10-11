/**
 * État de connexion : en ligne / hors ligne / synchronisation en attente.
 *
 * Les écritures Firestore sont appliquées tout de suite sur l'appareil ; leur promesse
 * ne se termine que lorsque le serveur les a reçues. On ne les attend donc jamais dans
 * l'interface : on les passe à `track()` qui compte celles encore en attente.
 */
import { useSyncExternalStore } from "react";

export interface SyncState {
  online: boolean;
  pending: number;
}

let state: SyncState = {
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  pending: 0,
};
const listeners = new Set<() => void>();

function set(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => set({ online: true }));
  window.addEventListener("offline", () => set({ online: false }));
}

/** Suit une écriture Firestore sans la faire attendre. Les erreurs sont transmises à `onError`. */
export function track(write: Promise<unknown>, onError?: (e: unknown) => void): void {
  set({ pending: state.pending + 1 });
  write
    .catch((e) => {
      console.error(e);
      onError?.(e);
    })
    .finally(() => set({ pending: Math.max(0, state.pending - 1) }));
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(subscribe, () => state);
}

export function getSyncState(): SyncState {
  return state;
}
