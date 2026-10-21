# Instructions pour Claude Code

## Le projet
vitePOS : caisse offline-first pour boutiques de quartier (Kinshasa, FC + USD).
Plusieurs boutiques dans le même projet Firebase ; chaque employé a son propre compte Firebase.
- Spécification métier : `CDC.md` (écrite pour l'ancienne stack Dexie/Express : la logique métier reste valable, pas la technique).
- L'ancienne implémentation (Vite + Dexie + Express) est sur `main`, la tentative Next.js sur `feat/nextjs`. On s'en sert comme référence pour porter les écrans.
- Même stack et mêmes conventions que `menuiserie-factures`.

## Règles de code
- React + TypeScript strict + Vite + Mantine + Tabler icons + react-router. Firebase SDK web modulaire (Auth + Firestore avec cache persistant).
- Interface 100 % en français. Identifiants de code et champs en base en anglais.
- **Offline-first** : aucune action métier ne doit attendre le réseau. Les écritures passent par `track()` (`src/data/sync.ts`) et ne sont jamais attendues dans l'interface. Pas de transactions Firestore dans les flux courants (elles échouent hors ligne) ; `writeBatch` est autorisé. Seules la création ou l'adhésion à une boutique et la gestion de l'équipe se font en ligne.
- **Stock** : toujours modifié avec `increment()` pour que deux caisses hors ligne s'additionnent au lieu de s'écraser. Chaque mouvement est aussi enregistré dans le journal des mouvements.
- Pas de suppression physique des ventes, mouvements ou dépenses : on annule.
- Toute la logique pure (montants, devises, arrondis, totaux, rôles, codes) va dans `src/lib/`, sans React ni Firebase, couverte par des tests Vitest.
- Modèle de données : `users/{uid}`, `invitations/{code}`, `boutiques/{id}`, `boutiques/{id}/members/{uid}`, puis les collections métier sous `boutiques/{id}/…`. Toute nouvelle collection doit avoir sa règle dans `firestore.rules` (sans règle, l'accès est refusé).
- Logo : symbole dessiné dans Google Stitch (sources dans `design/logo-stitch/`). Favicon, logo et icônes PWA sont générés par `node scripts/gen-icons.mjs` : ne pas les modifier à la main.
- Pas de secrets dans le dépôt : la config Firebase passe par les variables `VITE_FIREBASE_*` dans `.env.local` (ignoré par Git), avec un `.env.example` versionné.

## Commandes
- `npm run dev` : serveur de développement
- `npm run build` : build de production (doit passer avant chaque livraison)
- `npm run test` : tests Vitest
- `npm run preview` : tester le build, y compris hors ligne
- `npx -y firebase-tools@latest deploy --only firestore` : publier les règles et index (projet `vitepos-be79c`) 
- `npm run deploy` : tests + build + publier l'app sur https://getvitepos.web.app (site `getvitepos` de `firebase.json`) (en attendant le déploiement automatique par GitHub Actions). `vitepos-be79c.web.app` et `vitepos-app.web.app` redirigent vers l'app.
- `npm run deploy:site` : build du site de présentation et publication sur https://vitepos-rdc.web.app (site `vitepos-rdc`). Son `public/sw.js` désinstalle l'ancienne app qui était servie à cette adresse : ne pas le supprimer.
- Firebase : base Firestore Standard `(default)` en `europe-west1`, connexion e-mail/mot de passe et Google (bloc `auth` de `firebase.json`). Utiliser les skills du plugin Firebase pour toute tâche Firebase.
- Domaines autorisés pour la connexion Google : `localhost`, `127.0.0.1`, `vitepos-be79c.firebaseapp.com`, `vitepos-be79c.web.app`, `getvitepos.web.app`, `getvitepos.firebaseapp.com`. Le provisionnement par `deploy --only auth` avait retiré `localhost` : vérifier la liste (Authentication → Paramètres → Domaines autorisés) après chaque `deploy --only auth`.

## Site de présentation (`site/`)
- Astro, projet séparé de l'app (son propre `package.json`) : `npm run dev --prefix site`, `npm run build --prefix site` (sortie dans `site/dist`).
- Les textes sont dans `site/src/data/content.ts`, l'adresse de l'app dans `APP_URL` du même fichier. En ligne sur https://vitepos-rdc.web.app.
- Pages statiques, pas de JavaScript envoyé au visiteur : n'ajouter un composant interactif que si c'est indispensable.
- Manuel de l'utilisateur : `site/src/pages/manuel.astro`, textes dans `site/src/data/manuel.ts`, captures `node preview/capture.mjs man-` (aperçu lancé). Après un changement, regénérer le PDF : `npm run build --prefix site`, servir `site/dist` (par ex. `python -m http.server 5199` dans ce dossier), puis Chrome sans interface `--print-to-pdf=site/public/manuel-vitepos.pdf --no-pdf-header-footer` sur `http://localhost:5199/manuel/`, et reconstruire le site.

## Avant de dire qu'une étape est terminée
1. `npm run build` et `npm run test` passent.
2. Vérifier le hors ligne avec `npm run preview` (couper le réseau dans les outils du navigateur).
3. Faire un commit clair.
