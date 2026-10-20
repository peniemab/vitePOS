/**
 * Installation de l'app sur l'écran d'accueil (PWA).
 * Chrome et Edge proposent une fenêtre d'installation (`beforeinstallprompt`) qu'on garde pour la
 * déclencher au bon moment ; l'iPhone n'en a pas : il faut passer par « Partager » dans Safari.
 */
import { useSyncExternalStore } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
let installed = typeof window !== "undefined" && isStandalone();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** À appeler au démarrage : l'événement arrive très tôt, avant l'affichage des écrans. */
export function listenForInstall() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    notify();
  });
}

export type InstallMode =
  /** Déjà installée, ou ouverte depuis l'écran d'accueil. */
  | "installed"
  /** Le navigateur peut afficher sa fenêtre d'installation. */
  | "prompt"
  /** iPhone / iPad : Partager → Sur l'écran d'accueil. */
  | "ios"
  /** Autre navigateur : passer par son menu. */
  | "menu";

function currentMode(): InstallMode {
  if (installed) return "installed";
  if (deferred) return "prompt";
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "menu";
}

export function useInstallMode(): InstallMode {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    currentMode,
  );
}

/** Ouvre la fenêtre d'installation du navigateur. Renvoie vrai si l'utilisateur a accepté. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const e = deferred;
  deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  notify();
  return outcome === "accepted";
}
