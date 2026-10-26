/**
 * Manuel de l'utilisateur, façon journal : un chapitre par moment de la journée de la boutique.
 * Les textes reprennent exactement les libellés de l'app (entre « »). Les captures viennent de
 * `node preview/capture.mjs man-` (boutique fictive, aucune vraie donnée).
 * Les étapes acceptent du HTML simple (<b>, <i>) : textes écrits ici, jamais saisis par un visiteur.
 */

export interface Shot {
  name: string;
  alt: string;
  caption: string;
}

export interface Chapter {
  id: string;
  kicker: string;
  title: string;
  lead: string;
  steps: string[];
  shot?: Shot;
  tip?: { title: string; text: string };
  warn?: { title: string; text: string };
  /** Grand chiffre mis en avant, façon une de journal. */
  figure?: { value: string; text: string };
  /** Tableau simple (première ligne = en-têtes). */
  table?: string[][];
}


export const chapters: Chapter[] = [
  {
    id: "demarrer",
    kicker: "Premiers pas",
    title: "Votre caisse prête en 5 minutes",
    lead: "Pas de logiciel à acheter, pas de store : vitePOS s'ouvre dans le navigateur du téléphone, puis s'installe sur l'écran d'accueil comme une vraie application.",
    steps: [
      "Ouvrez <b>getvitepos.web.app</b> et connectez-vous avec votre e-mail ou votre compte Google.",
      "Choisissez <b>« Créer ma boutique »</b> : le nom de la boutique, la devise de vos prix, le <b>taux du jour</b> (combien de FC pour 1 $) et, si vous l'utilisez, celui de l'euro.",
      "Touchez <b>« Créer la boutique »</b>. Vous avez 30 jours d'essai, toutes les fonctions comprises.",
      "Sur l'accueil, la carte <b>« Installer vitePOS »</b> vous guide : bouton <b>« Installer »</b> sur Android, ou <b>Partager → « Sur l'écran d'accueil »</b> dans Safari sur iPhone.",
    ],
    shot: { name: "man-installer", alt: "Accueil de vitePOS avec la carte Installer vitePOS", caption: "La carte d'installation disparaît une fois l'app installée." },
    tip: {
      title: "Internet, seulement au début",
      text: "Il faut du réseau pour créer votre compte et votre boutique. Ensuite, la caisse marche même quand le réseau coupe.",
    },
  },
  {
    id: "equipe",
    kicker: "Votre équipe",
    title: "Chacun son compte, chacun ses droits",
    lead: "Vos vendeurs n'utilisent jamais votre compte. Chacun a le sien : vous savez qui a vendu quoi, et un vendeur ne voit ni vos prix d'achat ni vos marges.",
    steps: [
      "Allez dans <b>Plus → Équipe</b> : vous y trouvez le <b>code d'invitation</b> à 6 caractères.",
      "Votre employé crée son compte sur son téléphone, choisit <b>« Rejoindre »</b> et entre ce code.",
      "Sa demande apparaît dans <b>« Demandes à valider »</b> : touchez <b>« Valider »</b> (ou « Refuser »).",
      "Il arrive dans <b>« Membres »</b> comme vendeur : changez son rôle en <b>Gérant</b> si besoin.",
    ],
    shot: { name: "man-equipe", alt: "Écran Équipe avec le code d'invitation", caption: "Le code d'invitation se copie et s'envoie par WhatsApp." },
    table: [
      ["Rôle", "Vend", "Voit les rapports", "Change les prix", "Ferme la caisse", "Gère le stock"],
      ["Propriétaire", "Oui", "Oui", "Oui", "Oui", "Oui"],
      ["Gérant", "Oui", "Oui", "Oui", "Oui", "Oui"],
      ["Vendeur", "Oui", "Non", "Non", "Non", "Non"],
    ],
    warn: {
      title: "Ne prêtez pas votre compte",
      text: "Une vente faite avec votre compte est enregistrée à votre nom. Pour un nouvel employé, donnez le code d'invitation.",
    },
  },
  {
    id: "taux",
    kicker: "Francs, dollars, euros",
    title: "Le taux du jour, fixé par le patron",
    lead: "Vos prix restent dans votre devise. Le client paie en francs, en dollars ou en euros : vitePOS convertit au taux du jour et calcule la monnaie à rendre.",
    steps: [
      "Allez dans <b>Plus → Paramètres</b>.",
      "Saisissez <b>FC pour 1 $</b> et, si besoin, <b>FC pour 1 €</b> (laissez vide si vous n'utilisez pas l'euro), puis <b>« Mettre à jour »</b>.",
      "Le nouveau taux s'affiche sur l'accueil de tous vos vendeurs.",
    ],
    shot: { name: "man-parametres", alt: "Paramètres : taux du jour du dollar et de l'euro", caption: "Seul le propriétaire peut changer le taux." },
    tip: { title: "Le mode sombre", text: "Dans Paramètres → Apparence : « Clair », « Sombre » ou « Automatique » (comme le téléphone). Le sombre repose les yeux le soir." },
  },
  {
    id: "stock",
    kicker: "Le stock",
    title: "Chaque article a sa fiche",
    lead: "Un code article pour s'y retrouver, le code-barres du fabricant pour aller vite, et les paquets ou cartons pour vendre en gros. Votre liste Excel s'importe d'un coup : Stock → « … » → « Importer un fichier CSV ».",
    steps: [
      "Dans <b>Stock</b>, touchez <b>« Ajouter »</b>. Choisissez la catégorie : le <b>code article</b> est proposé tout seul (LAI-001, LAI-002… pour les laits).",
      "Scannez le <b>code-barres</b> de l'article avec le bouton caméra du champ, ou tapez-le.",
      "Indiquez le prix de vente, le prix d'achat, l'unité (pièce, kg ou litre), le stock de départ et le seuil d'alerte.",
      "Vous vendez aussi en gros ? Sous <b>« Emballages »</b>, touchez <b>« Ajouter un paquet ou un carton »</b> : combien d'unités il contient, son prix et son propre code-barres.",
      "Pharmacie, alimentation ? Activez <b>« Suivre les dates de péremption »</b> : une date à chaque arrivage, alerte 30 jours avant.",
      "Téléphones ? Activez <b>« Numéro de série / IMEI »</b> et indiquez la garantie en mois.",
    ],
    shot: { name: "man-fiche", alt: "Fiche du Coca-Cola avec un paquet de 24", caption: "Le paquet de 24 a son prix et son code-barres. Le stock reste compté en bouteilles." },
    tip: {
      title: "Toutes les bouteilles ont le même code",
      text: "Le code-barres désigne le produit, pas la bouteille : un seul scan suffit pour le retrouver. Le paquet, lui, porte un autre code.",
    },
  },
  {
    id: "reception",
    kicker: "Arrivage",
    title: "Recevoir la marchandise en trois gestes",
    lead: "Le fournisseur livre 3 paquets de Coca ? Inutile de compter 72 bouteilles.",
    steps: [
      "Dans <b>Stock</b>, scannez le code-barres <b>du paquet</b>.",
      "La fenêtre <b>Mouvement</b> s'ouvre sur <b>« Réappro »</b>, comptée en <b>« Paquet de 24 »</b>.",
      "Tapez <b>3</b> : l'app affiche « 3 × 24 = 72 unités » et le stock d'après. Touchez <b>« Enregistrer le mouvement »</b>.",
    ],
    shot: { name: "man-reception", alt: "Réapprovisionnement de 3 paquets de 24", caption: "Casse, don ou correction se font dans la même fenêtre." },
    tip: { title: "Tout est tracé", text: "Chaque entrée et chaque sortie est notée dans l'onglet « Historique » de la fiche, avec le nom de la personne et l'heure." },
  },
  {
    id: "ouvrir",
    kicker: "Le matin",
    title: "Ouvrir la journée",
    lead: "Avant la première vente, on note l'argent mis dans le tiroir pour rendre la monnaie : le soir, vitePOS saura ce qui doit s'y trouver.",
    steps: [
      "Allez dans <b>Plus → Journée de caisse</b>.",
      "Sous <b>« Fond de caisse »</b>, saisissez les montants en FC, en $ et, si besoin, en €.",
      "Touchez <b>« Enregistrer le fond de caisse »</b>.",
    ],
    shot: { name: "man-journee", alt: "Journée de caisse : argent attendu dans le tiroir", caption: "« Argent dans le tiroir » se met à jour à chaque vente et chaque dépense." },
  },
  {
    id: "vendre",
    kicker: "La vente",
    title: "Encaisser en quelques secondes",
    lead: "Toucher l'article ou le scanner, encaisser dans la devise du client, donner le ticket. Même sans réseau.",
    steps: [
      "Dans <b>Caisse</b>, touchez l'article ou scannez-le : avec la caméra (bouton à droite de la recherche) ou avec une douchette.",
      "Un article vendu aussi en paquet ? L'app demande <b>« À l'unité »</b> ou <b>« Paquet de 24 »</b>. Scanner le paquet vend directement le paquet.",
      "Ouvrez le <b>panier</b> : ajustez les quantités, une remise en %, un client si vous voulez suivre ses achats. Touchez <b>« Encaisser »</b>.",
      "Choisissez <b>Espèces</b> ou <b>Mobile money</b>, puis la devise : <b>Francs</b>, <b>Dollars</b> ou <b>Euros</b>. Touchez un billet proposé ou tapez le montant reçu.",
      "Un téléphone suivi par IMEI ? L'app demande <b>quel appareil</b> : scannez l'IMEI sur la boîte ou choisissez-le dans la liste. Le ticket imprime l'IMEI et la date de fin de garantie.",
      "L'app affiche <b>« À rendre »</b>. Touchez <b>« Valider la vente »</b>.",
    ],
    shot: { name: "man-encaisser", alt: "Encaissement de 21 100 FC avec un billet de 25 000 FC", caption: "Le client donne 25 000 FC : 3 900 FC à rendre." },
    figure: { value: "3 900 FC", text: "La monnaie à rendre, calculée pour vous, même quand le client paie en dollars." },
  },
  {
    id: "ticket",
    kicker: "Après la vente",
    title: "Le ticket, imprimé ou envoyé",
    lead: "Chaque vente a son ticket et son numéro. Le client le reçoit sur papier ou sur son téléphone.",
    steps: [
      "Après <b>« Valider la vente »</b>, le ticket s'affiche : <b>« Imprimer »</b> sur une imprimante de tickets, ou <b>« Partager (WhatsApp, SMS…) »</b>.",
      "La pastille <b>« Envoyé »</b> indique que la vente est bien arrivée en ligne ; <b>« En attente d'envoi »</b> qu'elle partira au retour du réseau.",
      "Une erreur ? Le gérant ou le propriétaire touche <b>« Annuler la vente »</b> le jour même, avec un motif : les articles reviennent en stock.",
    ],
    shot: { name: "tel-ticket", alt: "Ticket de vente", caption: "« Nouvelle vente » ramène à la caisse." },
    warn: {
      title: "Une vente ne s'efface jamais",
      text: "Une vente annulée reste visible, marquée « annulée », avec qui l'a annulée et pourquoi. Personne ne peut faire disparaître une vente.",
    },
  },
  {
    id: "depenses",
    kicker: "Les sorties d'argent",
    title: "Noter chaque dépense",
    lead: "Le taxi-moto, les unités, le sac de sucre payé en urgence : chaque dépense notée, c'est un trou de caisse en moins le soir.",
    steps: [
      "Dans <b>Plus → Dépenses</b>, touchez <b>« Nouvelle dépense »</b>.",
      "Saisissez le <b>montant</b> et sa devise, la <b>catégorie</b> et, si vous voulez, un détail.",
      "Laissez <b>« Payée avec l'argent de la caisse »</b> coché si l'argent sort du tiroir. Décochez-le si le patron a payé de sa poche.",
      "Touchez <b>« Enregistrer »</b>.",
    ],
    shot: { name: "man-depense", alt: "Nouvelle dépense", caption: "Une dépense se corrige en l'annulant : elle reste visible, barrée." },
  },
  {
    id: "fermer",
    kicker: "Le soir",
    title: "Fermer la journée sans surprise",
    lead: "vitePOS sait ce qui devrait être dans le tiroir. Vous comptez, il compare : les écarts sautent aux yeux.",
    steps: [
      "Dans <b>Plus → Journée de caisse</b>, regardez <b>« = Attendu »</b> : fond de caisse + espèces encaissées − dépenses payées en caisse.",
      "Comptez l'argent du tiroir et saisissez-le sous <b>« Clôture »</b> : <b>Compté en FC</b>, <b>en $</b>, <b>en €</b>.",
      "Ajoutez une remarque si besoin, puis touchez <b>« Clôturer la journée »</b>.",
      "Le récapitulatif montre <b>Attendu</b>, <b>Compté</b> et <b>Écart</b>, et plus bas les ventes <b>« Par vendeur »</b>.",
    ],
    shot: { name: "man-cloture", alt: "Clôture de la journée de caisse", caption: "La clôture est faite par le gérant ou le propriétaire." },
    tip: { title: "Le mobile money à part", text: "Les paiements mobile money ne sont pas dans le tiroir : leur total s'affiche séparément pour le comparer aux SMS reçus." },
  },
  {
    id: "inventaire",
    kicker: "Une fois par mois",
    title: "L'inventaire, rayon par rayon",
    lead: "Compter ce qu'il y a vraiment en rayon, voir ce qui manque et combien ça coûte, avant de corriger le stock.",
    steps: [
      "Dans <b>Plus → Inventaire</b>, donnez un nom, choisissez tout le magasin ou une catégorie, puis <b>« Commencer »</b>.",
      "Scannez ou cherchez chaque article et saisissez la quantité comptée. Plusieurs personnes peuvent compter en même temps.",
      "Touchez <b>« Vérifier et valider »</b> : l'app montre les écarts et leur valeur. <b>« Valider l'inventaire »</b> corrige le stock.",
    ],
    shot: { name: "man-inventaire", alt: "Écran Inventaire", caption: "Les ventes faites pendant le comptage sont prises en compte." },
  },
  {
    id: "suivre",
    kicker: "Le patron",
    title: "Votre boutique, même à distance",
    lead: "Sur votre téléphone, où que vous soyez : ce qui s'est vendu, ce qui manque, ce que vous avez gagné.",
    steps: [
      "<b>Accueil</b> : les ventes du jour comparées à hier, les produits à réapprovisionner, le taux du jour.",
      "<b>Ventes</b> : chaque vente de la journée, avec son ticket. En bas, <b>Retrouver un appareil</b> : tapez ou scannez un IMEI pour voir la vente et si l'appareil est encore sous garantie.",
      "<b>Rapports</b> : en haut, <b>Ventes et dépenses, six derniers mois</b> : une barre bleue pour les ventes, une orange pour les dépenses, mois par mois. Dessous, le détail du jour, de la semaine ou du mois : chiffre d'affaires, panier moyen, marge brute, meilleurs produits.",
    ],
    shot: { name: "man-rapports", alt: "Rapports : ventes et dépenses des six derniers mois", caption: "Touchez un mois pour voir ses ventes et ses dépenses." },
    figure: { value: "+1 %", text: "Chaque chiffre est comparé à la période d'avant : vous voyez tout de suite si ça monte ou si ça baisse." },
  },
  {
    id: "hors-ligne",
    kicker: "Sans réseau",
    title: "Le réseau coupe ? Vous continuez",
    lead: "Ventes, stock, dépenses : tout s'enregistre sur le téléphone, puis part en ligne tout seul au retour du réseau.",
    steps: [
      "Touchez votre <b>pastille</b> (vos initiales, en haut à droite) : <b>« En ligne, tout est envoyé »</b>, <b>« Hors ligne »</b> ou <b>« Envoi en cours »</b> avec le nombre de saisies en attente.",
      "Deux caisses hors ligne en même temps ? Leurs ventes s'additionnent sans s'écraser.",
      "Il faut seulement du réseau pour créer un compte, rejoindre une boutique et gérer l'équipe.",
    ],
    warn: {
      title: "Ne vous déconnectez pas avec des ventes en attente",
      text: "Tant que des saisies ne sont pas envoyées, restez connecté : l'app vous prévient si vous essayez de vous déconnecter.",
    },
  },
];
