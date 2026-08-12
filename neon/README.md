# Neon (PostgreSQL cloud)

Projet détecté : **boutique** (`misty-dawn-29208844`)

## 1. Connection string dans `.env`

Dashboard Neon → Project **boutique** → **Connect** → **Pooled connection** → copier l’URI.

Dans `.env` à la racine :

```env
DATABASE_URL=postgresql://...@...-pooler.../neondb?sslmode=require
```

Ou via CLI (après `npx neonctl@latest auth`) :

```bash
npx neonctl@latest connection-string --project-id misty-dawn-29208844 --org-id org-bold-voice-56988148 --pooled
```

Collez le résultat dans `.env` comme `DATABASE_URL=...`.

## 2. Appliquer le schéma

```bash
npm run db:migrate
```

Fichier SQL : [`001_schema.sql`](./001_schema.sql) (sans dépendances Supabase).

## 3. Vérifier

```bash
npm run dev
# puis GET http://127.0.0.1:3789/api/health
# → neon: { configured: true, ok: true }
```

## Auth Neon

Tu as activé l’auth côté Neon : on pourra plus tard lier `users.auth_external_id` au compte boss. Pour l’instant le schéma + health check suffisent pour tester la puissance de Neon.
