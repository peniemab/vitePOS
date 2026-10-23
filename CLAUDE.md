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
- Astro, projet séparé de l'app (son propre `package.json`) : `npm run dev --prefix site`, `npm run build --prefix site` (sortie dans `site/dist`). En ligne sur https://vitepos-rdc.web.app.
- **Bilingue** : français à la racine (`/`, `/manuel`, `/brochure`), anglais sous `/en/` (`/en/`, `/en/manual`, `/en/brochure`), bouton FR / EN en haut. Les pages (`src/pages/…`) ne font qu'appeler les vues communes `src/views/Home.astro`, `Manual.astro`, `Brochure.astro` avec la langue.
- Textes : `src/i18n/fr.ts` et `src/i18n/en.ts` (même forme, type `Dict` : un texte ajouté en français doit l'être en anglais). Chapitres du manuel : `src/data/manuel.ts` (fr) et `src/data/manual.en.ts` (en ; l'app est en français, les noms de boutons restent en français avec leur sens entre parenthèses). Adresses : `src/data/content.ts` (`APP_URL`, `APP_HOST`, `SITE_HOST`).
- Pages statiques, pas de JavaScript envoyé au visiteur : n'ajouter un composant interactif que si c'est indispensable.
- Captures du manuel : `node preview/capture.mjs man-` (aperçu lancé).
- PDF (manuel 16 pages et brochure A4 recto-verso, dans chaque langue) : `npm run build --prefix site`, servir `site/dist` (par ex. `python -m http.server 5199` dans ce dossier), puis Chrome sans interface `--no-pdf-header-footer --print-to-pdf=site/public/<fichier>` sur `http://localhost:5199/<page>/` : `manuel/` → `manuel-vitepos.pdf`, `brochure/` → `brochure-vitepos.pdf`, `en/manual/` → `vitepos-manual-en.pdf`, `en/brochure/` → `vitepos-brochure-en.pdf`. Reconstruire le site ensuite.
- QR code de la brochure : il ouvre l'app (`site/public/qr-app.svg`, `npx -y qrcode@1.5.4 -t svg -d "#1a2b4c" -l "#ffffff" -q 1 -e M -o site/public/qr-app.svg "https://getvitepos.web.app"`).

## Avant de dire qu'une étape est terminée
1. `npm run build` et `npm run test` passent.
2. Vérifier le hors ligne avec `npm run preview` (couper le réseau dans les outils du navigateur).
3. Faire un commit clair.
