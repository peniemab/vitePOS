/**
 * Mises à jour automatiques de l'app installée (service worker de vite-plugin-pwa).
 *
 * Une nouvelle version se télécharge en arrière-plan : à l'ouverture, puis toutes les heures pour une caisse
 * qui reste ouverte toute la journée. Elle s'installe en rechargeant la page, mais jamais pendant une vente
 * (panier en cours à la caisse) ni avec une fenêtre ouverte : on réessaie alors un peu plus tard.
 * Après le rechargement, un message dit que vitePOS a été mis à jour.
 */
import { registerSW } from "virtual:pwa-register";
import { notifications } from "@mantine/notifications";
import { canReloadNow } from "../lib/update";

const UPDATED_FLAG = "vitepos.updated";
const CHECK_EVERY_MS = 60 * 60 * 1000;
const RETRY_MS = 30 * 1000;

function cartLines(): number {
  let n = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith("vitepos.cart.")) continue;
      const lines = (JSON.parse(localStorage.getItem(key) ?? "{}") as { lines?: unknown[] }).lines;
      n += Array.isArray(lines) ? lines.length : 0;
    }
  } catch {
    // Stockage indisponible : aucun panier gardé.
  }
  return n;
}

export function startUpdates(): void {
  let apply: (() => void) | undefined;
  const update = registerSW({
    immediate: true,
    onNeedRefresh() {
      apply = () => {
        const ctx = { path: window.location.pathname, dialogOpen: !!document.querySelector('[role="dialog"]'), cartLines: cartLines() };
        if (!canReloadNow(ctx)) {
          setTimeout(apply!, RETRY_MS);
          return;
        }
        try {
          localStorage.setItem(UPDATED_FLAG, "1");
        } catch {
          // Sans stockage, pas de message après le rechargement.
        }
        void update(true);
      };
      apply();
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => {
        if (navigator.onLine) registration.update().catch(() => undefined);
      }, CHECK_EVERY_MS);
    },
  });
}

/** Après une mise à jour, le dit au vendeur (une seule fois). */
export function announceUpdate(): void {
  try {
    if (!localStorage.getItem(UPDATED_FLAG)) return;
    localStorage.removeItem(UPDATED_FLAG);
  } catch {
    return;
  }
  notifications.show({ color: "sky", title: "vitePOS a été mis à jour", message: "Vous avez la dernière version de l'app.", autoClose: 6000 });
}
