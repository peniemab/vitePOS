# Schéma de la base (Firestore)

Base Firestore Standard `(default)`, région `europe-west1`, projet `vitepos-be79c`. Pas de serveur à nous : la sécurité
est entièrement dans [`firestore.rules`](../firestore.rules), qui fait foi si ce document et les règles diffèrent.

Légende : **L** = lire, **É** = écrire. « Actif » = membre du commerce avec le statut `active`.

## Collections de premier niveau

| Chemin | Contenu | Qui lit / écrit |
| --- | --- | --- |
| `users/{uid}` | `email`, `name`, `boutiqueId` (commerce ouvert) | L/É : soi-même |
| `admins/{uid}` | Document vide : ce compte fait partie de l'équipe vitePOS | L : soi-même. É : **jamais par l'app** (console Firebase) |
| `invitations/{code}` | Code à 6 caractères → `boutiqueId`, `createdBy` | L : tout compte connecté (un code précis, pas de liste). É : à la création du commerce, jamais modifié |
| `boutiques/{id}` | Le commerce (voir ci-dessous) | L : membres, équipe vitePOS. É : propriétaire (réglages), équipe vitePOS (abonnement) |

## Le commerce : `boutiques/{id}`

| Champ | Type | Note |
| --- | --- | --- |
| `name` | texte ≤ 80 | |
| `ownerUid`, `inviteCode` | texte | Fixés à la création |
| `currency` | `CDF` \| `USD` \| `EUR` | Devise des prix |
| `usdRateCdf`, `eurRateCdf` | nombre | Taux du jour (FC pour 1 $ / 1 €), propriétaire seulement |
| `receipt` | map | Logo (image noir et blanc), adresse, téléphone, RCCM, id. nat., n° impôt, pied, lien du QR |
| `plan` | `boutique` \| `pro` \| `supermarche` | Le propriétaire peut changer seulement pendant l'essai |
| `billingCycle` | `mensuel` \| `annuel` | Équipe vitePOS |
| `trialEndsAt` | date | Création + 30 jours |
| `paidUntil` | date | Absent tant que rien n'est payé ; équipe vitePOS |
| `createdAt`, `updatedAt` | date serveur | |

## Sous-collections de `boutiques/{id}/…`

| Collection | Champs principaux | Lire | Écrire |
| --- | --- | --- | --- |
| `members/{uid}` | `name`, `email`, `role` (`proprietaire`/`gerant`/`vendeur`), `status` (`pending`/`active`/`disabled`), `permissions` | soi-même, actifs, équipe vitePOS | soi-même (demande, nom) ; propriétaire (rôle, statut, droits) |
| `products/{pid}` | `sku`, `name`, `category`, `sellPrice`, `unit`, `alertThreshold`, `barcode`, `packs`, `tracksExpiry`, `serialTracked`, `warrantyMonths`, `favorite`, `archived`, **`stock`** (via `increment()`), `lastMovementId` | actifs | droits stock / prix ; le stock bouge avec les ventes |
| `productCosts/{pid}` | `buyPrice` | droit rapports ou prix | droit prix |
| `stockMovements/{mid}` | `type` (`vente`, `annulation`, `reappro`, `casse`, `don`, `correction`, `inventaire`…), `productIds`, `deltas`, `names`, `reason`, `uid`, `refId`, `createdAt`, `clientAtMs` | actifs | actifs (selon le type) ; jamais modifié |
| `sales/{sid}` | `lines`, `subtotal`, `discountPercent`, `discount`, `total`, `currency`, `payment` (méthode, montants reçus, monnaie), `clientId`, `status` (`validee`/`annulee`), `movementId`, `dayKey` | actifs | actifs (création) ; annulation seulement (motif, auteur) |
| `clients/{cid}` | `name`, `phone`, `notes`, `purchaseCount`, `totalSpent`, `lastPurchaseAt` | actifs | actifs |
| `expenses/{eid}` | `amount`, `currency`, `category`, `description`, `fromTill`, `status`, `dayKey` | actifs | actifs ; annulation seulement |
| `lots/{lid}` | `productId`, `expiry`, `quantity` | actifs | droit stock |
| `serials/{serial}` | IMEI ou n° de série (id) : `productId`, `status` (`en_stock` → `vendu`), `saleId`, `warrantyUntil` | actifs | réception : droit stock ; vente : actifs |
| `dayStats/{jour}` | `revenue`, `count`, `discounts`, `cash`, `mobileMoney`, `products`, `members` (compteurs `increment()`) | actifs | actifs (avec chaque vente) |
| `monthStats/{mois}` | `sales`, `saleCount`, `expenses` (par devise) | actifs | actifs |
| `inventories/{iid}` + `lines/{pid}` | `label`, `status`, écarts ; par ligne `theoretical`, `counted` | actifs | droit stock |
| `cashDays/{jour}` | `status` (`open`/`closed`), `openingFloat`, `closing` (`counted`, `expected`, `variance`…) | actifs | ouverture : actifs ; clôture : droit caisse |
| `subscriptionPayments/{pid}` | `plan`, `months` (1/3/6/12), `amountUsd`, `method` (`mobile_money`/`especes`/`flexpay`), `reference`, `paidUntilBefore`, `paidUntil`, `createdBy` | propriétaire, équipe vitePOS | **équipe vitePOS seulement**, en même temps que `paidUntil` du commerce ; jamais modifié |

## Principes

- **Montants** : nombres dans la devise indiquée à côté (`currency`) ; sommes par devise dans des maps `{ CDF, USD, EUR }`.
- **Dates** : `createdAt` = heure du serveur ; `clientAtMs` = heure du téléphone (utile quand la vente a été faite hors ligne).
- **Commerce bloqué** (lecture seule) : les règles refusent ventes, mouvements et dépenses ; la lecture et l'export restent possibles.
- **Index composés** ([`firestore.indexes.json`](../firestore.indexes.json)) : mouvements d'un article par date, ventes d'un client par date.
- **Ajouter une collection** : écrire sa règle dans `firestore.rules`, publier les règles **avant** l'app, mettre à jour ce tableau.

## Plus tard (V2)

| Collection | Pour quoi |
| --- | --- |
| `boutiques/{id}/suppliers`, `purchases` | Fournisseurs et achats (formule Pro) |
| `boutiques/{id}/credits` | Crédit clients |
| `boutiques/{id}/stores` | Plusieurs magasins (formule Supermarché) |
| Cloud Function `flexpayWebhook` | Paiement automatique : écrit `subscriptionPayments` avec `method: "flexpay"` |
