# vitePOS

PWA offline-first pour boutiques de quartier (Kinshasa et au-delà) : caisse rapide, stock, inventaire, clients, journée de caisse, rôles et sync multi-appareils.

**Stack en migration :** Vite → **Next.js (App Router)** — branche `feat/nextjs` (ticket A : squelette + thème).

## Démarrer

```bash
npm install
npm run dev
```

Cela lance :
- l’API Express locale sur `http://127.0.0.1:3789`
- Next.js sur `http://localhost:3000` (rewrites `/api` → Express en dev)

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Next + API |
| `npm run dev:web` | Next seul |
| `npm run dev:api` | API seule |
| `npm run build` | Build Next |
| `npm start` | Next production |
| `npm run start:api` | API Express seule |
| `npm run db:migrate` | Schéma Neon |

## Migration Next (tickets)

| Ticket | Contenu | Statut |
|--------|---------|--------|
| **A** | Squelette Next + thème + welcome | fait |
| **B** | Auth gate + onboarding réel | en cours |
| C | Dexie + caisse offline | à faire |
| D | API auth sur Neon (Route Handlers) | à faire |
| E | Sync multi-appareils | à faire |
| F | Reste des écrans + PWA | à faire |
| G | Cleanup Express / react-router | à faire |

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
