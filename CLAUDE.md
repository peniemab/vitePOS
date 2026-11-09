# Instructions pour Claude Code

## Le projet
vitePOS : caisse offline-first pour boutiques de quartier (Kinshasa, FC + USD).
Plusieurs boutiques dans le même projet Firebase ; chaque employé a son propre compte Firebase.
- Spécification métier : `CDC.md` (écrite pour l'ancienne stack Dexie/Express : la logique métier reste valable, pas la technique).
- Branche principale : `main` (version Firebase, depuis le 3 novembre 2026 ; `feat/firebase` y a été fusionnée). L'ancienne implémentation (Vite + Dexie + Express) est gardée dans la branche `ancienne-version-dexie`, la tentative Next.js dans `feat/nextjs`.
- Même stack et mêmes conventions que `menuiserie-factures`.

## Règles de code
- React + TypeScript strict + Vite + Mantine + react-router.
- Icônes : Google Material Symbols (arrondies), générées en SVG par `node scripts/gen-material-icons.mjs` dans `src/components/icons.tsx` (app) et `site/src/data/icons.ts` (site). Changer une icône dans ce script, jamais à la main. L'onglet actif du menu affiche la version pleine (`filled`). Bouton de connexion Google avec le vrai logo « G » en couleurs.
- Police : Google Sans (la police des apps Google), servie en local pour marcher hors ligne : `@fontsource/google-sans` dans l'app, `site/public/fonts/google-sans-*.woff2` sur le site. Firebase SDK web modulaire (Auth + Firestore avec cache persistant).
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
- `npm run deploy` : tests + build + publier l'app sur https://app.viteposrdc.com (site `getvitepos` de `firebase.json`, aussi servi à https://getvitepos.web.app, gardée sans redirection : les données hors ligne d'un navigateur sont liées à l'adresse).
- Publication automatique (`.github/workflows/deploy.yml`) : chaque envoi sur `main` teste, construit et publie l'app et le site, dès que le secret GitHub `FIREBASE_SERVICE_ACCOUNT_VITEPOS_BE79C` existe (sinon : tests et build seulement). Secrets nécessaires : ce compte de service et les 6 `VITE_FIREBASE_*`. Les règles Firestore restent à publier à la main, avant d'envoyer sur `main`. `vitepos-be79c.web.app` et `vitepos-app.web.app` redirigent vers https://app.viteposrdc.com.
- `npm run deploy:site` : build du site de présentation et publication sur https://viteposrdc.com (site `vitepos-rdc`, aussi à https://vitepos-rdc.web.app). Son `public/sw.js` désinstalle l'ancienne app qui était servie à cette adresse : ne pas le supprimer.
- Domaine : `viteposrdc.com` (name.com, DNS chez name.com) : `viteposrdc.com` → site `vitepos-rdc` (enregistrements A `199.36.158.100` et TXT `hosting-site=vitepos-rdc`), `www` redirige vers `viteposrdc.com`, `app` → site `getvitepos` (A `199.36.158.100` et TXT `hosting-site=getvitepos` sur l'hôte `app` ; pas de CNAME, name.com refuse un TXT à côté d'un CNAME). Chez name.com, la case Hôte prend `app` (ou rien pour le domaine lui-même), jamais le nom complet.
- Firebase : base Firestore Standard `(default)` en `europe-west1`, connexion e-mail/mot de passe et Google (bloc `auth` de `firebase.json`). Utiliser les skills du plugin Firebase pour toute tâche Firebase.
- Administration (`/admin`, abonnements de toutes les boutiques) : réservée aux comptes qui ont un document `admins/{uid}` (à créer à la main dans la console Firebase, jamais par l'app). Dans l'aperçu, `?admin` en fait un compte de l'équipe.
- Domaines autorisés pour la connexion Google : `localhost`, `127.0.0.1`, `vitepos-be79c.firebaseapp.com`, `vitepos-be79c.web.app`, `getvitepos.web.app`, `app.viteposrdc.com`, `viteposrdc.com` (vérifié le 6 novembre 2026). Sans le domaine de l'app dans cette liste, Google affiche « The requested action is invalid » sur `vitepos-be79c.firebaseapp.com`. Le provisionnement par `deploy --only auth` avait retiré `localhost` : vérifier la liste (Authentication → Paramètres → Domaines autorisés) après chaque `deploy --only auth`.

## Site de présentation (`site/`)
- Astro, projet séparé de l'app (son propre `package.json`) : `npm run dev --prefix site`, `npm run build --prefix site` (sortie dans `site/dist`). En ligne sur https://viteposrdc.com.
- **Bilingue** : français à la racine (`/`, `/manuel`, `/brochure`), anglais sous `/en/` (`/en/`, `/en/manual`, `/en/brochure`), bouton FR / EN en haut. Les pages (`src/pages/…`) ne font qu'appeler les vues communes `src/views/Home.astro`, `Manual.astro`, `Brochure.astro` avec la langue.
- Textes : `src/i18n/fr.ts` et `src/i18n/en.ts` (même forme, type `Dict` : un texte ajouté en français doit l'être en anglais). Chapitres du manuel : `src/data/manuel.ts` (fr) et `src/data/manual.en.ts` (en ; l'app est en français, les noms de boutons restent en français avec leur sens entre parenthèses). Adresses : `src/data/content.ts` (`APP_URL`, `APP_HOST`, `SITE_HOST`).
- Pages statiques, pas de JavaScript envoyé au visiteur : n'ajouter un composant interactif que si c'est indispensable.
- Captures du manuel : `node preview/capture.mjs man-` (aperçu lancé). Dans l'aperçu, `?deconnecte` montre l'écran de connexion, `?sombre` le mode sombre, `?nouveau-compte` un compte sans boutique (création de la boutique), `?vide` une boutique toute neuve et `?premiers-pas` la liste « Premiers pas » (cachée par défaut pour les captures).
- PDF (manuel 24 pages, brochure A5 recto-verso et dépliant A4 en trois volets, dans chaque langue) : `npm run build --prefix site`, servir `site/dist` (par ex. `python -m http.server 5199` dans ce dossier), puis Chrome sans interface `--no-pdf-header-footer --print-to-pdf=site/public/<fichier>` sur `http://localhost:5199/<page>/` : `manuel/` → `manuel-vitepos.pdf`, `brochure/` → `brochure-vitepos.pdf`, `en/manual/` → `vitepos-manual-en.pdf`, `en/brochure/` → `vitepos-brochure-en.pdf`, `depliant/` → `depliant-vitepos.pdf`, `en/leaflet/` → `vitepos-leaflet-en.pdf`. Dans le dépliant, aucune image ne doit dépasser le bas de la page : Chrome ne l'imprime pas (cadre noir). Puis `python scripts/shrink-pdf.py site/public/*.pdf` (captures réencodées en JPEG : manuel ≈ 5,5 Mo, 24 pages, à garder en multiple de 4 pour l'impression en livret ; nécessite `pip install pikepdf`). Le fond animé du site est masqué à l'impression (sinon Chrome le répète en images sur chaque page). Reconstruire le site ensuite.
- Conditions d'utilisation et politique de confidentialité : `/conditions`, `/confidentialite` (`/en/terms`, `/en/privacy`), vue `src/views/Legal.astro`, textes `src/data/legal.fr.ts` et `legal.en.ts`. Coordonnées de l'éditeur dans `LEGAL` (`content.ts`) : tant qu'un champ est vide, `LEGAL_READY` est faux : les deux pages renvoient à l'accueil et leurs liens sont masqués (elles se publient d'elles-mêmes une fois les champs remplis). L'écran d'inscription de l'app y renvoie.
- Vidéo « Voir comment ça marche » (accueil, puis réseaux) : aperçu lancé, `node preview/video.mjs` (filme l'app, scènes et textes dans ce fichier) puis `python design/video/compose.py` (nécessite `pip install pillow imageio-ffmpeg`) → `site/public/video/demo-fr.mp4` et `.jpg` (720 × 1280, site) et `design/video/out/demo-fr-1080.mp4` (réseaux). Refaire la vidéo quand l'écran de la caisse change.
- Image de partage (Facebook, WhatsApp) : `site/public/og-fr.jpg` et `og-en.jpg` (1200 × 630), faites à partir de `design/og/og-<langue>.html` avec Chrome sans interface (`--screenshot --window-size=1200,630`), puis converties en JPEG. Contact : `CONTACT` et `whatsappUrl()` dans `content.ts`.
- QR code de la brochure : il ouvre l'app (`site/public/qr-app.svg`, `npx -y qrcode@1.5.4 -t svg -d "#1a2b4c" -l "#ffffff" -q 1 -e M -o site/public/qr-app.svg "https://app.viteposrdc.com"`). Second QR code « Suivez-nous » (verso de la brochure, dos du dépliant, dernière page du manuel, composant `FollowQr.astro`) : page Communauté, `qr-communaute.svg` → `https://viteposrdc.com/communaute` et `qr-community-en.svg` → `https://viteposrdc.com/en/community` (même commande). Liens des réseaux : `SOCIAL` dans `content.ts`.

## Avant de dire qu'une étape est terminée
1. `npm run build` et `npm run test` passent.
2. Vérifier le hors ligne avec `npm run preview` (couper le réseau dans les outils du navigateur).
3. Faire un commit clair.
