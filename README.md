# vitePOS

PWA offline-first pour boutiques de quartier (Kinshasa et au-delà) : caisse rapide, stock, inventaire, clients, journée de caisse, rôles et sync multi-appareils.

## Démarrer

```bash
npm install
npm run dev
```

Cela lance :
- le serveur de sync local sur `http://127.0.0.1:3789`
- l’app Vite (proxy `/api` → sync)

Ouvre l’URL Vite, crée une boutique, puis installe la PWA depuis le navigateur.

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | App + sync |
| `npm run dev:web` | Front seul |
| `npm run dev:api` | API seule |
| `npm run build` | Build production |
| `npm run preview` | Prévisualiser le build |
| `npm run db:migrate` | Appliquer le schéma Neon |

## Gros catalogues

- **Import CSV** : Stock → Import CSV
- **Export CSV** depuis Stock
- **Caisse** : catégories, favoris, scan code-barres
- Recherche fluide même avec beaucoup de produits

Les données vivent dans IndexedDB (Dexie). Les ventes, stocks et inventaires fonctionnent sans réseau. Au retour du réseau, synchronisez via le badge sync ou Paramètres.

## Rôles

- **Propriétaire** : tout
- **Gérant** : caisse, stock, inventaire, clôture
- **Vendeur** : caisse + consultation
