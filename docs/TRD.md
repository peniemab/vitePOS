# TRD : architecture technique de vitePOS

> Les règles de code détaillées sont dans [`CLAUDE.md`](../CLAUDE.md) ; le schéma de la base dans [BACKEND_SCHEMA.md](BACKEND_SCHEMA.md).

## 1. Vue d'ensemble

```
 Téléphone / tablette / ordinateur                       Google Cloud (projet vitepos-be79c)
 ┌──────────────────────────────────────┐               ┌──────────────────────────────────┐
 │ App vitePOS (PWA, React + Mantine)   │               │ Firebase Auth (e-mail, Google)   │
 │  ├─ service worker : app hors ligne  │  ⇄ réseau ⇄   │ Firestore (default), europe-west1│
 │  ├─ cache Firestore (IndexedDB)      │  quand il y   │  + firestore.rules (sécurité)    │
 │  └─ logique pure : src/lib (testée)  │  en a         │ Hosting : getvitepos (app)       │
 └──────────────────────────────────────┘               │           vitepos-rdc (site)     │
                                                        └──────────────────────────────────┘
```

| Couche | Choix | Pourquoi |
| --- | --- | --- |
| Interface | React 19, TypeScript strict, Mantine 9, Tabler icons, react-router | Même stack que `menuiserie-factures` ; composants accessibles prêts à l'emploi |
| Construction | Vite 8, vite-plugin-pwa | Build rapide, service worker généré |
| Données | Firestore SDK web modulaire, `persistentLocalCache` multi-onglets | Lecture et écriture sans réseau, synchronisation automatique |
| Connexion | Firebase Auth : e-mail / mot de passe et Google | Gratuit, chaque employé a son compte |
| Hébergement | Firebase Hosting (2 sites) | Même projet que la base ; HTTPS, CDN, gratuit à notre échelle |
| Site | Astro (dossier `site/`), pages statiques, sans JavaScript sauf l'accroche | Rapide sur un réseau 3G |
| Tests | Vitest sur `src/lib` | La logique d'argent et de stock est testée sans navigateur |

## 2. Règles non négociables

1. **Offline-first** : aucune action métier n'attend le réseau. Les écritures passent par `track()` (`src/data/sync.ts`) et ne sont jamais attendues dans l'interface.
2. **Pas de transactions Firestore** dans les flux courants (elles échouent hors ligne). `writeBatch` est autorisé.
3. **Stock** modifié uniquement avec `increment()` : deux caisses hors ligne s'additionnent. Chaque mouvement est écrit dans `stockMovements`.
4. **Rien n'est effacé** : ventes, mouvements et dépenses s'annulent (statut), ils ne se suppriment pas.
5. **En ligne seulement** : créer ou rejoindre un commerce, gérer l'équipe, enregistrer un paiement d'abonnement (Administration).
6. Toute nouvelle collection a sa règle dans `firestore.rules` ; sans règle, l'accès est refusé.

## 3. Sécurité

- Les règles Firestore vérifient : membre actif, rôle, droits (`viewReports`, `editPrices`, `closeCash`, `manageStock`), liste exacte des champs, types et tailles.
- Les prix d'achat sont dans une collection à part (`productCosts`), invisible pour les vendeurs.
- L'abonnement (`trialEndsAt`, `paidUntil`, `billingCycle`) ne peut être changé que par l'équipe vitePOS (`admins/{uid}`, document créé à la main dans la console).
- Commerce en lecture seule (abonnement expiré + grâce) : les règles refusent les ventes et modifications (`notBlocked`).
- Aucun secret dans le dépôt : la configuration Firebase passe par `VITE_FIREBASE_*` (`.env.local`, et secrets GitHub pour la publication automatique).

## 4. Publication

| Quoi | Commande | Qui |
| --- | --- | --- |
| Règles et index Firestore | `npx -y firebase-tools@latest deploy --only firestore` | Propriétaire du projet, **avant** de publier l'app quand les données changent |
| App | `npm run deploy` (tests + build + hosting `getvitepos`) | Propriétaire du projet |
| Site | `npm run deploy:site` | Propriétaire du projet |
| Automatique | `.github/workflows/deploy.yml` à chaque envoi sur `main` | Bloqué tant que la facturation GitHub n'est pas réglée et que les secrets ne sont pas ajoutés |

## 5. Performance et appareils visés

- Téléphone Android d'entrée de gamme (2 à 3 Go de mémoire), réseau 3G instable, écran de 360 px de large.
- Statistiques pré-calculées (`dayStats`, `monthStats`) : l'accueil ne relit pas toutes les ventes.
- Écrans lourds (Administration, Rapports, Import) chargés à la demande (`lazy`).
- Impression : navigateur (A4 / ticket), imprimantes thermiques Bluetooth ou USB (ESC/POS), ou partage du ticket en image.

## 6. Limites connues et suite

| Limite | Suite prévue |
| --- | --- |
| Paiement de l'abonnement à la main (WhatsApp puis Administration) | FlexPay via une Cloud Function (formule Blaze), qui écrit `method: "flexpay"` |
| Règles Firestore non testées dans l'émulateur (Java absent sur le poste) | Installer Java et ajouter des tests de règles avant la V2 |
| Pas d'analytics | Google Analytics pour Firebase ou Plausible / Umami (sans cookies), à décider |
| Pas de sauvegarde planifiée de Firestore | Activer une sauvegarde quotidienne (nécessite la formule Blaze) |
| Un seul magasin par commerce | Plusieurs magasins (formule Supermarché), V2 |
