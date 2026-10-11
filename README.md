# vitePOS

PWA offline-first pour boutiques de quartier (Kinshasa et au-delà) : caisse rapide, stock, inventaire, clients, journée de caisse, rôles et synchronisation entre appareils.

**Stack :** Vite + React + TypeScript + Mantine + Firebase (Auth, Firestore avec cache hors ligne, Hosting).

## Démarrer

Projet Firebase : **vitepos-be79c** (Firestore Standard en `europe-west1`, connexion e-mail/mot de passe et Google).

1. Récupérer la config de l'application Web dans `.env.local` (modèle : `.env.example`) :
   ```bash
   npx -y firebase-tools@latest apps:sdkconfig WEB --project vitepos-be79c
   ```
2. Publier les règles Firestore et la config de connexion après une modification :
   ```bash
   npx -y firebase-tools@latest deploy --only firestore,auth
   ```
3. Lancer :
   ```bash
   npm install
   npm run dev
   ```

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Tester le build (et le hors ligne) |
| `npm run test` | Tests Vitest |

## Comptes et boutiques

- Chaque employé crée **son propre compte** (e-mail ou Google).
- Le premier passage propose **Créer ma boutique** (vous en devenez le propriétaire) ou **Rejoindre** avec le code d'invitation à 6 caractères.
- Un employé qui rejoint une boutique arrive comme **vendeur en attente**. Le propriétaire le valide depuis **Plus → Équipe**, et peut le passer gérant ou le désactiver.

| Rôle | Droits |
|------|--------|
| Propriétaire | Tout, y compris l'équipe et les réglages |
| Gérant | Caisse, stock, inventaire, clôture, taux du jour |
| Vendeur | Caisse et consultation |

## Mise en ligne

Chaque push sur `main` lance les tests, le build, puis la publication sur Firebase Hosting (`.github/workflows/deploy.yml`). Secrets GitHub à créer : les six `VITE_FIREBASE_*` et `FIREBASE_SERVICE_ACCOUNT_VITEPOS`.

## Migration vers Firebase

| Étape | Contenu | Statut |
|-------|---------|--------|
| 1 | Socle : Vite + Mantine + Firebase, comptes, boutiques, équipe, règles | fait |
| 2 | Produits et stock (`increment()`, journal des mouvements), import CSV | fait |
| 3 | Caisse, paiement (FC/USD, mobile money), tickets, impression thermique | à faire |
| 4 | Ventes, clients, dépenses, journée de caisse | à faire |
| 5 | Inventaire, rapports, tableau de bord | à faire |
