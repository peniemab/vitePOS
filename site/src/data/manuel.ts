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
    id: "compte",
    kicker: "Premiers pas",
    title: "Créer votre compte",
    lead: "Votre numéro de téléphone et un mot de passe, ou votre compte Google : c'est tout. Chaque personne qui utilise vitePOS a son propre compte, vous comme vos vendeurs.",
    steps: [
      "Sur votre téléphone, ouvrez <b>app.viteposrdc.com</b> dans le navigateur : Chrome sur Android, Safari sur iPhone.",
      "Touchez le bouton jaune <b>« Créer un compte gratuit »</b>.",
      "Tapez votre <b>Numéro de téléphone</b> (ou un e-mail), un <b>Mot de passe</b> d'au moins 6 caractères, retapez-le, puis touchez <b>« Créer mon compte »</b>.",
      "Avec Google : touchez <b>« S'inscrire avec Google »</b> et choisissez votre compte. Pas de mot de passe à retenir.",
      "L'écran <b>« Bienvenue »</b> s'ouvre : votre compte est prêt. Il reste à créer votre activité (page suivante).",
    ],
    shot: { name: "man-inscription", alt: "Écran Créer un compte", caption: "Avec Google, pas de mot de passe à retenir." },
    tip: {
      title: "Notez votre mot de passe",
      text: "Pas de code par SMS. En cas d'oubli : un lien par e-mail, ou un message WhatsApp au support pour un numéro.",
    },
    warn: {
      title: "Un compte par personne",
      text: "Ne créez pas un seul compte pour toute l'équipe : chaque vendeur crée le sien, puis rejoint votre activité avec votre code (chapitre 03).",
    },
  },
  {
    id: "demarrer",
    kicker: "Premiers pas",
    title: "Votre caisse prête en 5 minutes",
    lead: "Pas de logiciel à acheter, pas de store : vitePOS s'ouvre dans le navigateur du téléphone, puis s'installe sur l'écran d'accueil comme une vraie application.",
    steps: [
      "Sur l'écran <b>« Bienvenue »</b>, gardez <b>« Gérer mon activité »</b>. (« Rejoindre » sert à vos employés.)",
      "Tapez le <b>Nom de votre activité</b> (il sera imprimé sur vos tickets) et <b>Votre nom</b>.",
      "Choisissez la <b>Devise des prix</b> (Francs, Dollars ou Euros) et le <b>Taux du jour</b> : combien de FC pour 1 $. Des clients paient en euros ? Cochez <b>« J'accepte aussi les euros »</b>.",
      "L'essai démarre sur la formule Pro, la plus complète ; <b>« Changer »</b> pour une autre. Touchez <b>« Créer mon activité »</b> : sur l'accueil, la liste <b>« Premiers pas »</b> vous guide jusqu'à la première vente.",
      "Installez l'app : la carte <b>« Installer vitePOS »</b> de l'accueil vous guide (bouton <b>« Installer »</b> sur Android, <b>Partager → « Sur l'écran d'accueil »</b> dans Safari sur iPhone).",
    ],
    shot: { name: "man-bienvenue", alt: "Écran Bienvenue : créer son activité", caption: "Le taux se change ensuite chaque jour dans Paramètres." },
    tip: {
      title: "Internet pour commencer",
      text: "Il faut du réseau pour créer votre compte, votre activité et inviter votre équipe.",
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
      "Un employé s'en va ? Dans <b>« Membres »</b>, touchez <b>« Désactiver »</b> : il ne peut plus rien ouvrir, et ses ventes restent dans l'historique.",
    ],
    shot: { name: "man-equipe", alt: "Écran Équipe avec le code d'invitation", caption: "Le code d'invitation se copie et s'envoie par WhatsApp." },
    table: [
      ["Rôle", "Vend", "Voit les rapports", "Change les prix", "Clôture la journée", "Gère le stock"],
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
    title: "Le taux du jour, c'est vous qui le fixez",
    lead: "Vos prix restent dans votre devise. Le client paie en francs, en dollars ou en euros : vitePOS convertit au taux du jour et calcule la monnaie à rendre.",
    steps: [
      "Allez dans <b>Plus → Paramètres</b> : le <b>Taux du jour</b> est le premier bloc.",
      "Devant <b>« 1 $ = »</b>, tapez combien de francs vaut un dollar (par exemple 2 850), puis touchez <b>« Mettre à jour »</b>.",
      "Des clients paient en euros ? Faites de même devant <b>« 1 € = »</b>. Sinon, laissez la case vide : l'euro n'apparaîtra nulle part.",
      "Sous chaque taux, l'app note <b>« Mis à jour aujourd'hui à 08:15 »</b> : vous voyez d'un coup d'œil s'il date d'hier.",
      "Le nouveau taux s'affiche aussitôt sur l'accueil et à la caisse de tous vos vendeurs.",
    ],
    shot: { name: "man-parametres", alt: "Paramètres : taux du jour du dollar et de l'euro", caption: "Seul le propriétaire peut changer le taux ; les vendeurs le voient." },
    tip: { title: "Chaque matin", text: "Mettez le taux à jour avant la première vente : un taux d'hier, c'est de l'argent perdu à chaque paiement en dollars." },
  },
  {
    id: "stock",
    kicker: "Le stock",
    title: "Chaque article a sa fiche",
    lead: "Vous remplissez la fiche une fois : prix, stock, code-barres, paquets. Ensuite, vitePOS s'en sert à chaque vente.",
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
      title: "Beaucoup d'articles ?",
      text: "Ne les tapez pas un par un : importez votre liste Excel d'un coup (chapitre 06).",
    },
  },
  {
    id: "import",
    kicker: "Gagner du temps",
    title: "Importer votre liste Excel",
    lead: "Vos articles sont déjà dans un fichier Excel ? Importez-les d'un coup au lieu de les taper. Le plus simple : depuis un ordinateur, avec le même compte.",
    steps: [
      "Dans <b>Stock</b>, touchez <b>« … » → « Importer depuis Excel »</b>, puis <b>« Télécharger le modèle »</b>.",
      "Ouvrez le modèle dans Excel et remplissez une ligne par article. Seuls le <b>nom</b> et le <b>prix de vente</b> sont obligatoires ; ajoutez si vous voulez la catégorie, le prix d'achat, le stock, le seuil d'alerte et le code-barres.",
      "Dans Excel, faites <b>Fichier → Enregistrer sous</b> et choisissez le format <b>CSV</b>.",
      "Dans vitePOS, touchez <b>« Choisir un fichier CSV »</b> : l'app montre combien d'articles seront créés ou mis à jour. Vérifiez, puis touchez <b>« Importer … produits »</b>.",
    ],
    shot: { name: "man-import", alt: "Écran Importer des produits", caption: "« Essayer avec l'exemple » montre le résultat sans rien enregistrer." },
    tip: {
      title: "Pas de doublon",
      text: "Un article qui existe déjà (même code-barres, ou même nom et catégorie) est mis à jour, pas créé deux fois. Si la colonne stock est remplie, elle remplace l'ancien stock et l'écart est noté.",
    },
  },
  {
    id: "articles",
    kicker: "Le stock au quotidien",
    title: "Changer un prix, ranger, retrouver",
    lead: "Un prix qui monte, un article qu'on ne vend plus, une liste à envoyer au comptable : tout se fait depuis Stock.",
    steps: [
      "<b>Changer un prix</b> : touchez l'article, modifiez le prix de vente, puis <b>« Enregistrer »</b>. Le nouveau prix s'applique à la vente suivante, sur toutes les caisses.",
      "Les filtres du haut : <b>Alertes</b> (stock bas), <b>Péremption</b> (lots qui périment dans les 30 jours) et <b>Archivés</b>. Les pastilles de rayon trient par catégorie.",
      "Un article que vous ne vendez plus ? Ouvrez-le et touchez <b>« Archiver »</b> : il disparaît du stock et de la caisse, son historique est gardé. <b>« Restaurer »</b>, depuis le filtre Archivés, le fait revenir.",
      "Cochez <b>« Favori »</b> pour vos meilleures ventes : elles s'affichent en premier à la caisse.",
      "Pour envoyer votre liste au comptable ou la retravailler : <b>« … » → « Exporter pour Excel »</b>.",
      "Vous vendez un travail (lavage, coupe, réparation) ? Activez <b>« C'est un service »</b> : il se vend sans stock, et le client peut déposer puis revenir (menu <b>Dépôts</b>).",
    ],
    shot: { name: "man-articles", alt: "Stock avec le menu Importer et Exporter", caption: "Le menu « … » : importer ou exporter votre liste." },
    tip: {
      title: "Le bon seuil d'alerte",
      text: "Réglez « Alerte stock bas à partir de » sur ce que vous vendez en 3 ou 4 jours : vous avez le temps de racheter avant la rupture.",
    },
  },
  {
    id: "reception",
    kicker: "Arrivage",
    title: "Rentrer la marchandise en quelques secondes",
    lead: "Le fournisseur livre des cartons ? Scannez le carton : vitePOS ajoute les unités au stock.",
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
    id: "accueil",
    kicker: "En un coup d'œil",
    title: "Votre journée sur un seul écran",
    lead: "Dès que vous ouvrez l'app : combien vous avez vendu aujourd'hui, et si c'est mieux qu'hier à la même heure.",
    steps: [
      "<b>« Recette du jour »</b> : le total des ventes depuis ce matin, en grand. Un vendeur voit <b>« Vos ventes du jour »</b> : seulement les siennes.",
      "Juste dessous, la comparaison <b>« … % de plus qu'hier à la même heure »</b> : à 11 h, on compare avec hier à 11 h, pas avec toute la journée d'hier.",
      "Sous la ligne pointillée : le nombre de <b>Ventes</b>, le <b>Panier moyen</b> (ce qu'un client dépense en moyenne) et le <b>Bénéfice estimé</b>, chacun avec son écart.",
      "<b>« Quand vous vendez »</b> : une barre par heure, l'heure en cours en bleu. La phrase dessous donne l'heure où vous vendez le plus.",
      "Plus bas, <b>« À surveiller »</b> (articles à commander, lots bientôt périmés) et les <b>« Dernières ventes »</b> avec l'heure, le client et le montant.",
    ],
    shot: { name: "man-accueil", alt: "Accueil : la recette du jour", caption: "Le bouton jaune « Nouvelle vente » ouvre la caisse." },
    tip: { title: "Où mettre plus de monde ?", text: "« Quand vous vendez » montre vos heures fortes : c'est le moment d'avoir deux personnes au comptoir." },
  },
  {
    id: "vendre",
    kicker: "La vente",
    title: "Encaisser en quelques secondes",
    lead: "Toucher l'article ou le scanner, encaisser dans la devise du client, donner le ticket.",
    steps: [
      "Dans <b>Caisse</b>, touchez l'article ou scannez-le : avec la caméra (bouton à droite de la recherche) ou avec une douchette. Une pastille bleue montre combien il y en a déjà dans le panier ; un stock bas s'affiche en orange (« 4 restants »).",
      "Un article vendu aussi en paquet ? L'app demande <b>« À l'unité »</b> ou <b>« Paquet de 24 »</b>. Scanner le paquet vend directement le paquet.",
      "Un téléphone suivi par IMEI ? L'app demande <b>quel appareil</b> : scannez l'IMEI sur la boîte ou choisissez-le dans la liste. Le ticket imprimera l'IMEI et la fin de garantie.",
      "Sur téléphone, touchez <b>« Panier »</b> dans la barre du bas (sur ordinateur, il est à droite) : <b>−</b> et <b>+</b> pour les quantités, une remise en %, un client si vous voulez suivre ses achats. Puis le bouton jaune <b>« Encaisser »</b>.",
      "Choisissez <b>Espèces</b> ou <b>Mobile money</b>, puis la devise : <b>Francs</b>, <b>Dollars</b> ou <b>Euros</b>. Touchez un billet proposé ou tapez le montant reçu : l'app affiche <b>« À rendre »</b>. Touchez <b>« Valider la vente »</b>.",
    ],
    shot: { name: "man-encaisser", alt: "Encaissement de 21 100 FC avec un billet de 25 000 FC", caption: "Le client donne 25 000 FC : l'app calcule les 3 900 FC à rendre, même s'il paie en dollars." },
  },
  {
    id: "ticket",
    kicker: "Après la vente",
    title: "Le ticket, imprimé ou envoyé",
    lead: "Chaque vente a son ticket et son numéro. Le client le reçoit sur papier ou sur son téléphone.",
    steps: [
      "Après <b>« Valider la vente »</b>, le ticket s'affiche : <b>« Imprimer »</b> sur une imprimante de tickets, ou <b>« Partager (WhatsApp, SMS…) »</b>.",
      "Une erreur ? Le gérant ou le propriétaire touche <b>« Annuler la vente »</b> le jour même, avec un motif : les articles reviennent en stock.",
    ],
    shot: { name: "tel-ticket", alt: "Ticket de vente", caption: "« Nouvelle vente » ramène à la caisse." },
    warn: {
      title: "Personne ne peut effacer une vente",
      text: "Une vente annulée reste visible, marquée « annulée », avec qui l'a annulée et pourquoi. Personne ne peut faire disparaître une vente.",
    },
  },
  {
    id: "imprimer",
    kicker: "Le ticket papier",
    title: "Brancher l'imprimante et personnaliser le ticket",
    lead: "Une petite imprimante de tickets Bluetooth ou USB suffit. Votre logo, votre adresse et votre QR code s'impriment sur chaque ticket.",
    steps: [
      "Dans <b>Plus → Paramètres → Imprimante de cet appareil</b>, choisissez <b>« Imprimer les tickets avec »</b> : imprimante Bluetooth, imprimante USB (ordinateur), l'app <b>RawBT</b> sur Android ou <b>Thermer</b> sur iPhone.",
      "Allumez l'imprimante, touchez <b>« Choisir l'imprimante »</b> et sélectionnez-la. Puis <b>« Imprimer un ticket de test »</b>.",
      "Dans <b>Mon activité</b>, choisissez la <b>largeur du papier</b> (58 mm ou 80 mm) et, si vous voulez, <b>« Imprimer le ticket automatiquement après chaque vente »</b>.",
      "Dans <b>Ticket de caisse</b> : <b>« Ajouter un logo »</b>, l'adresse, le téléphone, le RCCM, l'ID NAT, le N° impôt, un <b>QR code</b> (WhatsApp, Facebook…) et le <b>message de fin</b>. L'aperçu se met à jour pendant que vous tapez.",
    ],
    shot: { name: "man-imprimante", alt: "Paramètres : ticket de caisse et imprimante", caption: "Chaque téléphone ou ordinateur choisit sa propre imprimante." },
    tip: { title: "Pas d'imprimante ?", text: "Après la vente, « Partager (WhatsApp, SMS…) » envoie le ticket sur le téléphone du client." },
  },
  {
    id: "clients",
    kicker: "Vos habitués",
    title: "Connaître vos clients fidèles",
    lead: "Vos clients réguliers, particuliers ou entreprises : notez-les une fois, vous retrouvez tout ce qu'ils ont acheté.",
    steps: [
      "Dans <b>Plus → Clients</b>, touchez <b>« Ajouter »</b> : le nom, le téléphone et des notes (habitudes, adresse de livraison…).",
      "Ou directement à la caisse : dans le panier, <b>« Ajouter un client »</b>, puis <b>« + Nouveau client »</b>.",
      "La liste montre pour chacun le total dépensé et le nombre d'achats. Cherchez par nom ou par numéro.",
      "Touchez un client : l'onglet <b>« Achats »</b> liste ses tickets, et <b>« Appeler »</b> lance l'appel.",
    ],
    shot: { name: "man-clients", alt: "Liste des clients avec le total de leurs achats", caption: "Les meilleurs clients se repèrent tout de suite." },
  },
  {
    id: "depenses",
    kicker: "Les sorties d'argent",
    title: "Noter chaque dépense",
    lead: "Le taxi-moto, les unités, le sac de sucre payé en urgence : chaque dépense notée, c'est un trou de caisse en moins le soir.",
    steps: [
      "Dans <b>Plus → Dépenses</b>, touchez <b>« Nouvelle dépense »</b>.",
      "Saisissez le <b>montant</b> et sa devise, la <b>catégorie</b> et, si vous voulez, un détail.",
      "Laissez <b>« Payée avec l'argent de la caisse »</b> coché si l'argent sort du tiroir. Décochez-le si vous avez payé de votre poche.",
      "Touchez <b>« Enregistrer »</b>.",
    ],
    shot: { name: "man-depense", alt: "Nouvelle dépense", caption: "Le ticket du haut sépare l'argent pris dans la caisse et celui payé hors caisse." },
    tip: { title: "Une erreur ?", text: "Touchez la dépense, puis « Annuler la dépense ». Elle reste visible avec l'étiquette « Annulée » et ne compte plus dans la caisse." },
  },
  {
    id: "fermer",
    kicker: "Le soir",
    title: "Clôturer la journée sans surprise",
    lead: "vitePOS sait ce qui devrait être dans le tiroir. Vous comptez, il compare : les écarts sautent aux yeux.",
    steps: [
      "Dans <b>Plus → Journée de caisse</b>, regardez <b>« = Attendu »</b> : fond de caisse + espèces encaissées − dépenses payées en caisse.",
      "Comptez l'argent du tiroir et saisissez-le sous <b>« Clôture »</b> : <b>Compté en FC</b> et <b>Compté en $</b>. Une colonne € n'apparaît que si des euros sont entrés ou sortis ce jour-là.",
      "Dès que vous tapez, l'<b>Écart</b> s'affiche : vert si la caisse est juste, orange s'il y a trop, rouge s'il manque de l'argent.",
      "Ajoutez une remarque si besoin, puis touchez <b>« Clôturer la journée »</b>.",
      "Le récapitulatif montre <b>Attendu</b>, <b>Compté</b> et <b>Écart</b>, et plus bas les ventes <b>« Par vendeur »</b>.",
    ],
    shot: { name: "man-cloture", alt: "Clôture de la journée de caisse", caption: "La clôture est faite par le gérant ou le propriétaire." },
    tip: { title: "Le mobile money à part", text: "Les paiements mobile money ne sont pas dans le tiroir : leur total s'affiche séparément pour le comparer aux SMS reçus." },
    warn: {
      title: "Il manque de l'argent ?",
      text: "Vérifiez dans l'ordre : une dépense pas notée, une vente pas encaissée, une monnaie mal rendue. Il y a trop d'argent ? Souvent une vente encaissée mais pas validée dans l'app.",
    },
  },
  {
    id: "ventes",
    kicker: "L'historique",
    title: "Retrouver une vente",
    lead: "Un client revient avec une question, un ticket perdu, un appareil en panne : toutes les ventes sont là, jour par jour.",
    steps: [
      "Dans <b>Ventes</b>, les flèches en haut changent de jour. Le ticket bleu donne le <b>chiffre d'affaires</b>, le nombre de ventes, les <b>Espèces</b> (une ligne par devise) et le <b>Mobile money</b>.",
      "Chaque ligne commence par l'<b>heure</b>, puis le client (ou « Sans client »), le vendeur et le numéro du ticket.",
      "Une vente annulée porte l'étiquette rouge <b>« Annulée »</b> et ne compte pas dans le total.",
      "Vous vendez des téléphones ? <b>« Retrouver un appareil »</b>, en haut, cherche un IMEI : la vente, le client et la fin de garantie.",
    ],
    shot: { name: "man-ventes", alt: "Ventes du jour avec le ticket bleu et la liste par heure", caption: "Touchez une vente pour revoir, réimprimer ou renvoyer son ticket." },
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
    kicker: "Vos chiffres",
    title: "Les rapports, même à distance",
    lead: "Sur votre téléphone, où que vous soyez : ce qui s'est vendu, ce que vous avez gagné, ce qui se vend le mieux.",
    steps: [
      "Dans <b>Plus → Rapports</b>, choisissez en haut <b>Jour</b>, <b>Semaine</b> ou <b>Mois</b>, puis les flèches pour reculer dans le temps.",
      "Le ticket bleu donne le <b>chiffre d'affaires</b> et sa comparaison avec la période d'avant (« 12 % de plus que la période d'avant »).",
      "Dessous : <b>Ventes</b>, <b>Panier moyen</b>, <b>Bénéfice estimé</b> (ventes moins prix d'achat) et <b>Dépenses</b>.",
      "<b>Chiffre d'affaires par jour</b> : la courbe de la semaine ou du mois. <b>Meilleurs produits</b> : les 10 qui rapportent le plus. <b>Moyens de paiement</b> : espèces, mobile money et remises.",
      "Tout en bas, <b>Ventes et dépenses, six derniers mois</b> : une barre bleue pour les ventes, une orange pour les dépenses.",
    ],
    shot: { name: "man-rapports", alt: "Rapports de la semaine : ticket bleu et courbe par jour", caption: "Rapports et prix d'achat restent invisibles pour les vendeurs." },
    tip: { title: "Un bénéfice juste", text: "Le bénéfice estimé n'est exact que si chaque article a son prix d'achat dans sa fiche. Sinon, le rapport indique sur quelle part des ventes il est calculé." },
  },
  {
    id: "abonnement",
    kicker: "Votre formule",
    title: "Payer et renouveler l'abonnement",
    lead: "L'essai est gratuit, avec toutes les fonctions. Ensuite, vous payez par mobile money, au mois ou à l'année (2 mois offerts).",
    steps: [
      "Allez dans <b>Plus → Mon abonnement</b> (propriétaire seulement) : votre formule et la date de fin de l'essai ou de l'abonnement.",
      "Sous <b>« Je paie pour »</b>, choisissez <b>1 mois</b>, <b>3 mois</b>, <b>6 mois</b> ou <b>1 an</b> : le montant s'affiche.",
      "Touchez <b>« Payer via WhatsApp »</b> : le message est déjà prêt. Nous vous répondons avec le numéro mobile money où envoyer le paiement.",
      "Envoyez-nous la <b>référence</b> reçue par SMS : l'abonnement est prolongé dès que le paiement est vérifié, et s'affiche sous <b>« Paiements reçus »</b>.",
      "Pendant l'essai, vous pouvez encore <b>changer de formule</b>, en bas de l'écran.",
    ],
    shot: { name: "man-abonnement", alt: "Écran Mon abonnement", caption: "Le bouton jaune ouvre WhatsApp avec le message prêt." },
    tip: { title: "Payez en avance", text: "Vous ne perdez aucun jour : les mois payés s'ajoutent après la date de fin." },
    warn: {
      title: "Et si je ne paie pas ?",
      text: "7 jours avant la fin, un bandeau vous prévient. Après la fin, vous gardez 7 jours pour payer. Ensuite, l'app passe en lecture seule : plus de ventes, mais toutes vos données restent consultables. Rien n'est effacé, et tout repart dès le paiement.",
    },
  },
  {
    id: "depannage",
    kicker: "Un souci ?",
    title: "Les réponses aux questions fréquentes",
    lead: "Sur chaque écran, le bouton « i » explique quoi faire. Et voici les questions qu'on nous pose le plus, avec la solution.",
    steps: [
      "<b>Je ne sais plus comment faire.</b> Touchez le <b>« i »</b> en haut de l'écran (sur ordinateur : <b>« Aide pour cet écran »</b>) : les étapes s'affichent.",
      "<b>L'imprimante n'imprime pas.</b> Vérifiez qu'elle est allumée, avec du papier, et que le Bluetooth du téléphone est activé. Puis Paramètres → <b>« Imprimer un ticket de test »</b>.",
      "<b>Le code-barres ne passe pas.</b> Essuyez l'étiquette, éclairez-la, ou tapez le code dans la recherche de la caisse.",
      "<b>J'ai oublié mon mot de passe.</b> Sur l'écran de connexion, touchez <b>« Mot de passe oublié ? »</b> : avec un e-mail, vous recevez un lien ; avec un numéro, écrivez-nous sur WhatsApp.",
      "<b>Je ne vois pas les ventes de mon vendeur.</b> Elles arrivent dès que son téléphone a du réseau. Sa pastille (ses initiales, en haut à droite) indique s'il reste des ventes à envoyer.",
      "<b>Le réseau a coupé.</b> Continuez à vendre : tout est gardé sur le téléphone et part tout seul au retour du réseau. Une vente « En attente d'envoi » est bien enregistrée : ne vous déconnectez pas avant qu'elle soit partie.",
    ],
    shot: { name: "man-aide", alt: "Aide de l'écran Caisse, ouverte avec le bouton i", caption: "La première fois sur un écran, l'aide s'ouvre toute seule." },
  },
];
