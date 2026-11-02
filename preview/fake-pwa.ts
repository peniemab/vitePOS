/** L'aperçu n'installe pas de service worker (pas de cache hors ligne pendant les captures). */
export function registerSW(_options?: unknown) {
  return () => Promise.resolve();
}
