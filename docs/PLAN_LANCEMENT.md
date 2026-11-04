# Plan de mise en œuvre jusqu'au lancement (9 novembre 2026)

Qui : **C** = Claude (code, textes, captures) ; **P** = propriétaire du projet (achats, comptes, publication).

## Mercredi 4 novembre : documents et corrections d'interface

- [x] C : PRD, TRD, APP_FLOW, DESIGN.md, schéma de la base, audit d'interface.
- [x] C : corrections P1 de l'[audit](AUDIT_UI.md) : zoom de l'app, mouvement réduit sur le site, image de partage.
- [x] P : section Tarifs décidée (formule Boutique en avant) ; C l'a ajoutée au site (FR + EN), avec une section Contact.
- [ ] P : réinstaller Node.js (disparu du poste le 4 au soir) ; C relance alors tests et builds.

## Jeudi 5 novembre : domaine et mentions légales

- [ ] P : acheter `vitepos-rdc.com`.
- [ ] P : le relier dans Firebase Hosting : `vitepos-rdc.com` → site, `app.vitepos-rdc.com` → app ; ajouter `app.vitepos-rdc.com` aux domaines autorisés de la connexion.
- [ ] C : changer `APP_URL`, `APP_HOST`, `SITE_HOST`, l'adresse dans la FAQ, le QR code de la brochure, les PDF ; ajouter sitemap et `robots.txt`.
- [ ] P : donner nom de l'éditeur, RCCM, e-mail de contact → les pages Conditions et Confidentialité se publient.

## Vendredi 6 novembre : mise en production

- [ ] P : publier les règles Firestore (`npx -y firebase-tools@latest deploy --only firestore`).
- [ ] P : créer son document `admins/<son uid>` dans la console Firebase.
- [ ] P : régler la facturation GitHub, ajouter les secrets (`FIREBASE_SERVICE_ACCOUNT_VITEPOS_BE79C` et les 6 `VITE_FIREBASE_*`).
- [ ] P : `npm run deploy` puis `npm run deploy:site`.
- [ ] C : vérifier l'app et le site en ligne (téléphone et ordinateur), sans créer de compte de test en production.

## Samedi 7 novembre : essais réels

- [ ] P : créer **son vrai commerce** (ou celui d'un premier client) et faire tout le parcours « Premiers pas » sur un Android d'entrée de gamme.
- [ ] P + C : test hors ligne (mode avion pendant une vente, puis retour du réseau) ; impression sur l'imprimante Bluetooth.
- [ ] C : vérifier le mode sombre des nouveaux écrans ; corriger ce qui bloque.
- [ ] P : enregistrer un paiement test **sur son propre commerce** dans Administration (puis remettre la bonne date si besoin).

## Dimanche 8 novembre : campagne prête

- [ ] C : textes des publications Facebook et Instagram (5 à 7 publications, FR + lingala si souhaité), légendes, image de partage.
- [ ] P : page Facebook et compte Instagram vitePOS, numéro WhatsApp Business avec message d'accueil.
- [ ] P : imprimer les brochures (A5 recto-verso) pour la tournée des commerces.
- [ ] Gel du code : plus de nouvelle fonction avant le lancement, seulement des corrections.

## Lundi 9 novembre : lancement

- [ ] Publication Facebook / Instagram, partage WhatsApp, tournée des premiers commerces avec démonstration.
- [ ] P : répondre aux messages WhatsApp ; noter les questions qui reviennent (elles iront dans la FAQ et le manuel).
- [ ] Suivi le soir : nombre d'inscrits et de commerces avec une vente (écran Administration).

## Après le lancement

| Quand | Quoi |
| --- | --- |
| Semaine du 16 nov. | Corrections P2 de l'audit ; FAQ enrichie avec les vraies questions |
| Fin novembre | Mesure (Google Analytics pour Firebase ou Plausible) ; tests des règles Firestore (installer Java) |
| Avant le 9 décembre (fin des premiers essais) | Vérifier le parcours de paiement de bout en bout ; préparer les relances WhatsApp |
| Décembre | FlexPay (formule Blaze + Cloud Function) ; sauvegarde quotidienne de la base |
| 2027 | Crédit clients, fournisseurs, plusieurs magasins (voir [CDC.md](../CDC.md) §5) |
