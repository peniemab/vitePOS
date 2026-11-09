# Textes du manuel (20 pages) : liste complète à valider

Validé le 9 novembre 2026 et appliqué au manuel en français et en anglais (24 pages). Pour chaque texte : ce qu'il y a aujourd'hui et ce que je propose. « Garder » = pas de changement.

Les **étapes** (les listes numérotées de chaque chapitre) reprennent mot pour mot les boutons de l'app : je ne les change que là où il y a un vrai problème. Elles sont donc résumées ici, pas recopiées.

Une fois validé : application en français (`site/src/data/manuel.ts`, `site/src/i18n/fr.ts`), traduction en anglais, nouveau PDF.

## Les règles suivies

- Une phrase = une information utile au client. Pas de description du dessin de l'écran (« ticket bleu zébré »).
- Pas d'argument « marche sans réseau » en accroche. L'information reste là où elle aide (que faire quand le réseau coupe).
- Pas de crédit, pas de « boutique », pas de « patron » (on vise aussi les entreprises).

---

## Couverture

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| M1 | Bandeau du haut | Le journal de votre business | Garder |
| M2 | Titre | vitePOS, mode d'emploi | Garder |
| M3 | Sous le titre | Tout ce qu'il faut pour tenir la caisse, le stock et les comptes de votre activité, du matin au soir, même quand le réseau coupe. | Tout ce qu'il faut pour tenir la caisse, le stock et les comptes de votre activité, du matin au soir. |
| M4 | Accroche p. 05 | Recevoir 3 paquets sans compter 72 bouteilles | Rentrer la marchandise en quelques secondes |
| M5 | Accroche p. 08 | Encaisser en FC, $ ou € en quelques secondes | Encaisser en FC, $ ou €, la monnaie calculée pour vous |
| M6 | Accroche p. 13 | Fermer la journée sans surprise | Garder |
| M7 | Description (Google, partages) | … suivre ses chiffres, même sans réseau. | … fermer la journée et suivre ses chiffres. |

## Dernière page

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| M8 | Titre | À vous de vendre. | Garder |
| M9 | Texte | Une question ? Montrez cette page à votre vendeur : tout y est, pas à pas. | Une question ? Écrivez-nous sur WhatsApp : on vous répond, et on peut venir chez vous. |
| M10 | Nouveau : avant d'appeler | (rien) | Pour aller plus vite, envoyez-nous le nom de votre activité, une capture d'écran et ce que vous étiez en train de faire. |

---

## Ch. 1 · Premiers pas : « Votre caisse prête en 5 minutes »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 1.1 | Chapeau | Pas de logiciel à acheter, pas de store : vitePOS s'ouvre dans le navigateur du téléphone, puis s'installe sur l'écran d'accueil comme une vraie application. | Garder |
| 1.2 | Étapes | Créer un compte, « Gérer mon activité », « Créer mon activité », installer l'app | Garder |
| 1.3 | Astuce | **Internet, seulement au début** · Il faut du réseau pour créer votre compte. Ensuite, la caisse marche même quand le réseau coupe. | **Internet pour commencer** · Il faut du réseau pour créer votre compte et inviter votre équipe. |

## Ch. 2 · Votre équipe : « Chacun son compte, chacun ses droits »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 2.1 | Chapeau | Vos vendeurs n'utilisent jamais votre compte. Chacun a le sien : vous savez qui a vendu quoi, et un vendeur ne voit ni vos prix d'achat ni vos marges. | Garder |
| 2.2 | Étapes et tableau des rôles | Code d'invitation, « Rejoindre », « Valider », rôle | Garder |
| 2.3 | Attention | **Ne prêtez pas votre compte** · Une vente faite avec votre compte est enregistrée à votre nom… | Garder |

## Ch. 3 · Francs, dollars, euros : « Le taux du jour, fixé par le patron »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 3.1 | Titre | Le taux du jour, fixé par le patron | Le taux du jour, c'est vous qui le fixez |
| 3.2 | Chapeau | Vos prix restent dans votre devise. Le client paie en francs, en dollars ou en euros : vitePOS convertit au taux du jour et calcule la monnaie à rendre. | Garder |
| 3.3 | Astuce | **Le mode sombre** · Dans Paramètres → Apparence… (rien à voir avec le taux) | **Chaque matin** · Mettez le taux à jour avant la première vente : un taux d'hier, c'est de l'argent perdu à chaque paiement en dollars. |

## Ch. 4 · Le stock : « Chaque article a sa fiche »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 4.1 | Chapeau | Un code article pour s'y retrouver, le code-barres du fabricant pour aller vite, et les paquets ou cartons pour vendre en gros. Votre liste Excel s'importe d'un coup : Stock → « … » → « Importer depuis Excel ». | Vous remplissez la fiche une fois : prix, stock, code-barres, paquets. Ensuite, vitePOS s'en sert à chaque vente. |
| 4.2 | Étapes | Ajouter, code-barres, prix, emballages, péremption, IMEI | Garder |
| 4.3 | Astuce | **Toutes les bouteilles ont le même code** · Le code-barres désigne le produit… | **Votre liste est déjà dans Excel ?** · Stock → « … » → « Importer depuis Excel » : tous vos articles d'un coup. |
| 4.4 | Légende | Le paquet de 24 a son prix et son code-barres. Le stock reste compté en bouteilles. | Garder |

## Ch. 5 · Arrivage : « Recevoir la marchandise en trois gestes »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 5.1 | Titre | Recevoir la marchandise en trois gestes | Rentrer la marchandise en quelques secondes |
| 5.2 | Chapeau | Le fournisseur livre 3 paquets de Coca ? Inutile de compter 72 bouteilles. | Le fournisseur livre des cartons ? Scannez le carton : vitePOS ajoute les unités au stock. |
| 5.3 | Étapes | Scanner le paquet, « Réappro », taper la quantité | Garder |
| 5.4 | Astuce | **Tout est tracé** · Chaque entrée et chaque sortie est notée dans « Historique »… | Garder |

## Ch. 6 · Le matin : « Ouvrir la journée »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 6.1 | Chapeau | Avant la première vente, on note l'argent mis dans le tiroir pour rendre la monnaie : le soir, vitePOS saura ce qui doit s'y trouver. | Garder |

## Ch. 7 · En un coup d'œil : « L'accueil, votre ticket du jour »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 7.1 | Titre | L'accueil, votre ticket du jour | Votre journée sur un seul écran |
| 7.2 | Chapeau | En ouvrant l'app, la recette du jour s'affiche comme un ticket de caisse bleu : ce que vous avez vendu, et si c'est mieux ou moins bien qu'hier. | Dès que vous ouvrez l'app : combien vous avez vendu aujourd'hui, et si c'est mieux qu'hier à la même heure. |
| 7.3 | Astuce | **Où mettre plus de monde ?** · « Quand vous vendez » montre vos heures fortes… | Garder |
| 7.4 | Légende | Accueil : la recette du jour en ticket bleu zébré (texte de l'image) | Accueil : la recette du jour |

## Ch. 8 · La vente : « Encaisser en quelques secondes »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 8.1 | Chapeau | Toucher l'article ou le scanner, encaisser dans la devise du client, donner le ticket. Même sans réseau. | Toucher l'article ou le scanner, encaisser dans la devise du client, donner le ticket. |
| 8.2 | Étapes | Caisse, paquet, IMEI, panier, encaisser | Garder |

## Ch. 9 · Après la vente : « Le ticket, imprimé ou envoyé »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 9.1 | Étape 2 | La pastille « Envoyé » indique que la vente est bien arrivée en ligne ; « En attente d'envoi » qu'elle partira au retour du réseau. | À retirer d'ici (déplacé dans le nouveau chapitre « Un souci ? », point 17.6) |
| 9.2 | Attention | **Une vente ne s'efface jamais** · Une vente annulée reste visible… | **Personne ne peut effacer une vente** · même texte |

## Ch. 10 · Le ticket papier : « Brancher l'imprimante et personnaliser le ticket »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 10.1 | Tout le chapitre | | Garder |

## Ch. 11 · Vos habitués : « Connaître vos clients fidèles »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 11.1 | Chapeau | Le restaurant du coin, l'hôtel, la maman qui passe tous les jours : notez-les une fois, vous retrouvez tout ce qu'ils ont acheté. | Vos clients réguliers, particuliers ou entreprises : notez-les une fois, vous retrouvez tout ce qu'ils ont acheté. |
| 11.2 | Étape 2 | « Ajouter un client (fidélité, crédit) » | « Ajouter un client ». **Il faut aussi changer ce texte dans l'app** (il parle de crédit). |

## Ch. 12 · Les sorties d'argent : « Noter chaque dépense »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 12.1 | Tout le chapitre | | Garder |

## Ch. 13 · Le soir : « Fermer la journée sans surprise »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 13.1 | Chapeau, étapes, astuce mobile money | | Garder |
| 13.2 | Nouveau : Attention | (rien) | **Il manque de l'argent ?** · Vérifiez dans l'ordre : une dépense pas notée, une vente pas encaissée, une monnaie mal rendue. Il y a trop d'argent ? Souvent une vente encaissée mais pas validée dans l'app. |

## Ch. 14 · L'historique : « Retrouver une vente »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 14.1 | Légende | Un nuage orange signale une vente pas encore envoyée en ligne. | Touchez une vente pour revoir, réimprimer ou renvoyer son ticket. (Et cette phrase sort des étapes, où elle est déjà.) |

## Ch. 15 · Une fois par mois : « L'inventaire, rayon par rayon »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 15.1 | Tout le chapitre | | Garder |

## Ch. 16 · Le patron : « Les rapports, même à distance »

| N° | Élément | Aujourd'hui | Je propose |
| --- | --- | --- | --- |
| 16.1 | Petit titre | Le patron | Vos chiffres |
| 16.2 | Le reste | | Garder |

## Ch. 17 · « Le réseau coupe ? Vous continuez » devient « Un souci ? Les réponses »

Le dernier chapitre ne parle que du réseau. Je propose de le remplacer par un petit dépannage, qui garde l'essentiel sur le réseau (le manuel reste à 20 pages).

| N° | Question | Réponse |
| --- | --- | --- |
| 17.0 | Titre / chapeau | **Un souci ? Les réponses** · Les questions qu'on nous pose le plus, avec la solution. |
| 17.1 | L'imprimante n'imprime pas | Vérifiez qu'elle est allumée, avec du papier, et que le Bluetooth du téléphone est activé. Puis Paramètres → « Imprimer un ticket de test ». |
| 17.2 | Le code-barres ne passe pas | Essuyez l'étiquette, éclairez-la, ou tapez le code dans la recherche de la caisse. |
| 17.3 | J'ai oublié mon mot de passe | Sur l'écran de connexion, touchez « Mot de passe oublié ? » : vous recevez un e-mail pour en choisir un nouveau. |
| 17.4 | Je ne vois pas les ventes de mon vendeur | Ses ventes arrivent dès que son téléphone a du réseau. Sa pastille (ses initiales, en haut à droite) indique s'il reste des ventes à envoyer. |
| 17.5 | Le réseau a coupé | Continuez à vendre : tout est gardé sur le téléphone et part tout seul au retour du réseau. Deux caisses en même temps s'additionnent sans s'écraser. |
| 17.6 | Une vente est marquée « En attente d'envoi » | Elle est bien enregistrée : elle partira au retour du réseau. Ne vous déconnectez pas tant qu'il reste des ventes en attente : l'app vous prévient. |

---

## Ce que je n'ajoute pas

- **Sortir de l'argent de la caisse pour la banque** : l'app n'a pas de bouton prévu pour ça (on passe par une dépense). On ne l'écrit pas tant que la fonction n'existe pas.
- **Lexique** (fond de caisse, clôture, écart…) : pas de place dans les 20 pages. Les mots sont expliqués là où ils apparaissent.

---

## Ajouté le 9 novembre 2026 : passage à 24 pages

Validé : le manuel passe à 24 pages (multiple de 4 pour l'impression en livret). Nouveaux chapitres, textes complets dans `site/src/data/manuel.ts` et dans la maquette `docs/maquette-manuel.pdf` :

| Ch. | Nouveau chapitre | Contenu |
| --- | --- | --- |
| 01 | Créer votre compte | E-mail et mot de passe, ou Google ; astuce « Un e-mail que vous lisez » ; attention « Un compte par personne ». |
| 02 | Votre caisse prête en 5 minutes | L'ancien chapitre 1, réécrit pas à pas sur l'écran « Bienvenue » (nom, devise, taux, formule, installation). |
| 06 | Importer votre liste Excel | Modèle, format CSV, choisir le fichier, « Importer … produits » ; astuce « Pas de doublon ». |
| 07 | Changer un prix, ranger, retrouver | Changer un prix, filtres, Archiver / Restaurer, Favori, Exporter pour Excel ; astuce sur le seuil d'alerte. |
| 20 | Payer et renouveler l'abonnement | Mon abonnement, durée, « Payer via WhatsApp », référence ; « Payez en avance » ; « Et si je ne paie pas ? ». |

Ajouté aussi au chapitre Équipe : « Un employé s'en va ? Touchez « Désactiver » ».

À corriger dans l'app (textes vus en faisant les captures) : « votre patron » sur l'écran Créer un compte et sous le code d'invitation (« donnés par votre patron »), et « Ajouter un client (fidélité, crédit) » dans le panier.
