/**
 * Aperçu de l'application pour les captures d'écran : la vraie app, branchée sur une fausse base
 * en mémoire (dossier preview/). Aucune connexion à Firebase, rien n'est envoyé sur internet.
 * Lancement : npx vite --config preview/vite.config.ts
 */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: here(".."),
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^firebase\/firestore$/, replacement: here("./fake-firestore.ts") },
      { find: /^firebase\/auth$/, replacement: here("./fake-auth.ts") },
      { find: /^firebase\/app$/, replacement: here("./fake-app.ts") },
      { find: /^virtual:pwa-register$/, replacement: here("./fake-pwa.ts") },
    ],
  },
  // De fausses clés : l'app se croit configurée, mais les modules Firebase sont remplacés ci-dessus.
  define: {
    "import.meta.env.VITE_FIREBASE_API_KEY": JSON.stringify("apercu"),
    "import.meta.env.VITE_FIREBASE_PROJECT_ID": JSON.stringify("apercu"),
    "import.meta.env.VITE_FIREBASE_APP_ID": JSON.stringify("apercu"),
  },
  server: { port: 5183, strictPort: true },
});
