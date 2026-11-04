# PRD : vitePOS, lancement du 9 novembre 2026

> Résumé produit. Le détail des fonctions, des règles métier et des décisions est dans [`CDC.md`](../CDC.md).

## 1. Le problème

À Kinshasa, la plupart des commerces de quartier (alimentation, cosmétiques, téléphonie, quincaillerie, pharmacie) tiennent
leurs ventes dans un cahier, ou pas du tout. Le propriétaire ne sait pas ce qu'il a vendu quand il n'est pas là, le stock
« disparaît », les comptes en francs et en dollars se mélangent, et internet coupe souvent.

## 2. La solution

Une caisse sur le téléphone qu'on a déjà, qui marche **sans internet**, en **francs, dollars, euros et mobile money**,
avec un compte par employé. Rien à installer depuis un store : on ouvre l'adresse et on ajoute l'icône.

## 3. Pour qui

| Persona | Ce qu'il veut | Ce qu'on lui montre en premier |
| --- | --- | --- |
| **Propriétaire** (Maman Ngalula, 45 ans, deux vendeuses) | Savoir ce qui se vend et ce qui manque, même à distance | L'accueil : ventes du jour, alertes de stock |
| **Vendeur / vendeuse** | Encaisser vite, rendre la bonne monnaie | La caisse |
| **Gérant** | Recevoir la marchandise, fermer la caisse le soir | Stock, journée de caisse |

Ils ne sont pas informaticiens : textes simples, gros boutons, aucun mot technique.

## 4. Ce qui est livré le 9 novembre (V1)

- Caisse : recherche, scan du code-barres, panier, remise, paiement multi-devises, monnaie à rendre, ticket (impression ou partage).
- Stock : articles, conditionnements, alertes, réception, casse, import et export Excel, lots et dates de péremption, numéros IMEI.
- Ventes : historique, annulation tracée (jamais effacée), clients et fidélité, dépenses.
- Journée de caisse : ouverture, fond de caisse, clôture avec écart.
- Inventaire, rapports (jour, mois), accueil avec chiffres clés.
- Équipe : invitation par code, rôles propriétaire / gérant / vendeur, droits ajustables.
- Démarrage guidé : inscription gratuite, création du commerce en un écran, liste « Premiers pas », écrans vides utiles, aide WhatsApp partout.
- Abonnement : 30 jours gratuits, puis paiement par mobile money via WhatsApp, enregistré par l'équipe vitePOS (écran Administration).
- Site de présentation bilingue, manuel (20 pages) et brochure en PDF.

**Pas dans la V1** : paiement dans l'app (FlexPay), crédit clients, fournisseurs, plusieurs magasins, application dans les stores.

## 5. Prix

| Formule | Prix | Comptes |
| --- | --- | --- |
| Boutique | 10 $ / mois ou 100 $ / an | 3 |
| Pro | 25 $ / mois ou 250 $ / an | 10 |
| Supermarché | 80 $ / mois ou 800 $ / an | illimités |

Essai : 30 jours, toutes les fonctions, sans carte. Après la fin : 7 jours de grâce, puis lecture seule (rien n'est effacé).

## 6. Comment on mesure le succès

| Indicateur | Objectif à fin novembre 2026 |
| --- | --- |
| Commerces inscrits | 50 |
| Commerces actifs (au moins une vente dans les 7 derniers jours) | 25 |
| Commerces qui terminent les « Premiers pas » | 60 % des inscrits |
| Premiers abonnements payés (fin d'essai à partir du 9 décembre) | 10 en décembre |

Ces chiffres se lisent dans l'écran Administration (état des abonnements) et dans la console Firebase.
Les objectifs sont une proposition : à valider par le propriétaire du projet.

## 7. Risques

| Risque | Parade |
| --- | --- |
| Le commerçant abandonne avant sa première vente | « Premiers pas », aide WhatsApp, démonstration en boutique |
| Perte de données hors ligne (téléphone perdu avant synchronisation) | Message clair sur l'état de synchronisation ; ventes envoyées dès que le réseau revient |
| Paiement manuel lent à traiter | Message WhatsApp prérempli ; FlexPay automatique ensuite |
| Le domaine définitif n'est pas prêt le 9 | L'adresse actuelle (getvitepos.web.app) reste valable et redirigera |
