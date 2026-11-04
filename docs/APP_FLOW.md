# APP FLOW : les parcours de vitePOS

Adresses : site `vitepos-rdc.web.app`, app `getvitepos.web.app` (plus tard `vitepos-rdc.com` et `app.vitepos-rdc.com`).

## 1. Du site à la première vente (nouveau commerçant)

```mermaid
flowchart TD
  A[Site, Facebook, brochure ou QR code] --> B[« Créer un compte gratuit »]
  B --> C[Inscription : nom, e-mail, mot de passe ou Google]
  C --> D{A-t-il un code d'invitation ?}
  D -- Non --> E[Créer mon commerce : nom, devise des prix, taux du dollar]
  D -- Oui --> J[Rejoindre un commerce : code à 6 caractères]
  E --> F[Accueil + liste « Premiers pas » 0 sur 5]
  F --> G[1. Taux du jour] --> H[2. Ajouter 5 articles ou importer depuis Excel]
  H --> I[3. Première vente] --> K[4. Choisir l'impression] --> L[5. Inviter un vendeur]
  L --> M[Liste terminée : elle disparaît]
  J --> N[En attente : le propriétaire accepte dans Équipe] --> O[Caisse]
```

À chaque étape : lien « Besoin d'aide ? WhatsApp » vers l'équipe vitePOS.

## 2. Une vente (hors ligne possible)

```mermaid
flowchart LR
  A[Caisse] --> B[Chercher ou scanner un article]
  B --> C[Panier : quantités, remise, client]
  C --> D[Encaisser]
  D --> E[Devise : FC, $ ou €, ou mobile money]
  E --> F[Montant reçu → monnaie à rendre]
  F --> G[Valider]
  G --> H[Ticket : imprimer, partager ou nouvelle vente]
  G -. en arrière-plan .-> I[(Vente + mouvement de stock + statistiques,\nenvoyés dès que le réseau revient)]
```

## 3. La journée de caisse

1. **Matin** : ouvrir la caisse, saisir le fond de caisse (FC, $, €).
2. **Journée** : ventes, dépenses payées depuis la caisse, annulations (avec motif).
3. **Soir** (gérant ou propriétaire) : compter l'argent, l'app calcule l'attendu et l'écart, clôturer.
4. Le propriétaire voit le résultat sur l'accueil, même à distance.

## 4. Le stock

- **Réception** de marchandise → stock +, mouvement « réappro ».
- **Casse, don, correction** → stock −, avec motif.
- **Inventaire** : compter article par article, valider → écarts appliqués en une fois.
- **Alerte** quand le stock passe sous le seuil (accueil et liste du stock).

## 5. L'abonnement

```mermaid
flowchart TD
  A[Création du commerce] --> B[Essai 30 jours]
  B -->|7 jours avant la fin| C[Bandeau : « Votre essai se termine »]
  C --> D[Abonnement → « Payer via WhatsApp »]
  D --> E[Message prérempli : commerce, formule, durée, prix]
  E --> F[L'équipe répond avec le numéro mobile money]
  F --> G[Le commerçant paie]
  G --> H[L'équipe enregistre le paiement dans Administration]
  H --> I[Abonnement prolongé, visible dans l'historique]
  B -->|sans paiement| J[Grâce 7 jours] -->|sans paiement| K[Lecture seule : consulter et exporter]
  K --> D
```

## 6. L'équipe

- Le propriétaire partage le **code d'invitation** du commerce (Équipe).
- L'employé crée son compte, saisit le code → demande « en attente ».
- Le propriétaire accepte, choisit le rôle (gérant ou vendeur) et peut ajuster les droits.
- Désactiver un compte bloque l'accès tout de suite ; ses ventes restent.

## 7. Écrans et rôles

| Écran | Propriétaire | Gérant | Vendeur |
| --- | --- | --- | --- |
| Accueil, Caisse, Ventes, Clients, Articles, Dépenses, Paramètres | oui | oui | oui (sans prix d'achat ni marges) |
| Modifier le stock, Inventaire | oui | oui | si droit « stock » |
| Modifier les prix | oui | oui | si droit « prix » |
| Journée de caisse | oui | oui | si droit « caisse » ou « rapports » |
| Rapports | oui | oui | si droit « rapports » |
| Équipe, Mon abonnement | oui | non | non |
| Administration | équipe vitePOS seulement | | |

Le gérant a tous les droits par défaut ; le propriétaire peut les retirer, ou en donner à un vendeur.
