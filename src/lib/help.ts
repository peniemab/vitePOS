/**
 * Aide de chaque écran de l'app (bouton « i »). Textes courts, sans jargon, repris du manuel
 * (`site/src/data/manuel.ts`) : à garder d'accord avec lui. Les libellés de l'app sont entre « ».
 */

export interface Help {
  /** Clé stable : sert à se souvenir, sur cet appareil, que la personne a déjà vu cette aide. */
  key: string;
  title: string;
  /** À quoi sert l'écran, en une phrase. */
  intro: string;
  /** Comment faire, pas à pas. */
  steps: string[];
  tip?: string;
}

const HELPS = {
  accueil: {
    title: "L'accueil",
    intro: "Votre journée d'un coup d'œil : combien vous avez vendu aujourd'hui, et si c'est mieux qu'hier à la même heure.",
    steps: [
      "« Recette du jour » : le total des ventes depuis ce matin. Un vendeur voit « Vos ventes du jour » : seulement les siennes.",
      "Dessous : le nombre de ventes, le panier moyen (ce qu'un client dépense en moyenne) et le bénéfice estimé.",
      "« Quand vous vendez » : une barre par heure, pour voir vos heures fortes.",
      "« À surveiller » : les articles à racheter et les lots bientôt périmés.",
      "Le bouton jaune « Nouvelle vente » ouvre la caisse.",
    ],
    tip: "Une activité toute neuve ? Suivez la liste « Premiers pas » : elle vous guide jusqu'à la première vente.",
  },
  caisse: {
    title: "La caisse",
    intro: "Encaisser une vente : toucher ou scanner les articles, encaisser dans la devise du client, donner le ticket.",
    steps: [
      "Touchez un article, ou scannez-le avec le bouton caméra à droite de la recherche.",
      "Article vendu aussi en paquet ? Choisissez « À l'unité » ou le paquet.",
      "Sur téléphone, touchez « Panier » en bas : − et + pour les quantités, une remise, un client. Sur ordinateur, le panier est à droite.",
      "Touchez le bouton jaune « Encaisser », choisissez Espèces ou Mobile money et la devise.",
      "Touchez un billet ou tapez le montant reçu : l'app affiche « À rendre ». Puis « Valider la vente ».",
    ],
    tip: "Le code-barres ne passe pas ? Essuyez l'étiquette, éclairez-la, ou tapez le code dans la recherche.",
  },
  ticket: {
    title: "Le ticket",
    intro: "Le ticket de la vente, avec son numéro : imprimé ou envoyé sur le téléphone du client.",
    steps: [
      "« Imprimer » : sur l'imprimante de tickets choisie dans Paramètres.",
      "« Partager (WhatsApp, SMS…) » : le client reçoit le ticket sur son téléphone.",
      "Une erreur ? Le gérant ou le propriétaire touche « Annuler la vente », avec un motif : les articles reviennent en stock.",
      "« Nouvelle vente » ramène à la caisse.",
    ],
    tip: "Une vente annulée reste visible, marquée « Annulée », avec qui l'a annulée et pourquoi. Personne ne peut effacer une vente.",
  },
  stock: {
    title: "Le stock",
    intro: "Tous vos articles, avec leur prix et ce qu'il en reste.",
    steps: [
      "« Ajouter » : un nouvel article. Scannez son code-barres, indiquez les prix, le stock de départ et le seuil d'alerte.",
      "Touchez un article pour changer son prix, rentrer un arrivage ou noter une casse.",
      "Un carton arrive ? Scannez le code-barres du carton : l'app propose « Réappro » et ajoute les unités au stock.",
      "En haut : « Alertes » (stock bas), « Péremption » et « Archivés ». Les pastilles trient par rayon.",
      "« … » : importer votre liste Excel, ou l'exporter pour le comptable.",
    ],
    tip: "Réglez l'alerte sur ce que vous vendez en 3 ou 4 jours : vous avez le temps de racheter avant la rupture.",
  },
  import: {
    title: "Importer depuis Excel",
    intro: "Créer tous vos articles d'un coup à partir d'un fichier Excel, au lieu de les taper un par un.",
    steps: [
      "Touchez « Télécharger le modèle » et ouvrez-le dans Excel.",
      "Une ligne par article. Seuls le nom et le prix de vente sont obligatoires.",
      "Dans Excel : Fichier → Enregistrer sous, format CSV.",
      "Touchez « Choisir un fichier CSV », vérifiez le nombre d'articles, puis « Importer ».",
    ],
    tip: "Un article qui existe déjà est mis à jour, pas créé deux fois. Le plus simple : le faire depuis un ordinateur.",
  },
  ventes: {
    title: "Les ventes",
    intro: "Toutes les ventes, jour par jour : pour retrouver un ticket ou répondre à un client.",
    steps: [
      "Les flèches en haut changent de jour.",
      "Le ticket bleu donne le chiffre d'affaires, les espèces par devise et le mobile money.",
      "Chaque ligne : l'heure, le client, le vendeur et le numéro du ticket. Touchez une vente pour revoir, réimprimer ou renvoyer son ticket.",
      "Une vente annulée porte l'étiquette rouge « Annulée » et ne compte pas dans le total.",
    ],
    tip: "Vous vendez des téléphones ? « Retrouver un appareil » cherche un IMEI : la vente, le client et la fin de garantie.",
  },
  plus: {
    title: "Plus",
    intro: "Toutes les rubriques qui ne tiennent pas dans la barre du bas.",
    steps: [
      "Touchez une rubrique pour l'ouvrir : Clients, Dépenses, Journée de caisse, Rapports, Équipe, Paramètres…",
      "Vous ne voyez que les rubriques permises par votre rôle.",
      "« Aide sur WhatsApp » : une question, un souci, l'équipe vitePOS vous répond.",
    ],
  },
  clients: {
    title: "Les clients",
    intro: "Vos clients réguliers : notez-les une fois, vous retrouvez tout ce qu'ils ont acheté.",
    steps: [
      "« Ajouter » : le nom, le téléphone et des notes.",
      "Ou à la caisse : dans le panier, « Ajouter un client ».",
      "La liste montre le total dépensé et le nombre d'achats. Cherchez par nom ou par numéro.",
      "Touchez un client : l'onglet « Achats » liste ses tickets, « Appeler » lance l'appel.",
    ],
  },
  depenses: {
    title: "Les dépenses",
    intro: "Noter chaque sortie d'argent : chaque dépense notée, c'est un trou de caisse en moins le soir.",
    steps: [
      "Touchez « Nouvelle dépense ».",
      "Saisissez le montant et sa devise, la catégorie et, si vous voulez, un détail.",
      "Laissez « Payée avec l'argent de la caisse » coché si l'argent sort du tiroir. Décochez si vous avez payé de votre poche.",
      "Touchez « Enregistrer ».",
    ],
    tip: "Une erreur ? Touchez la dépense, puis « Annuler la dépense ». Elle ne compte plus dans la caisse.",
  },
  journee: {
    title: "La journée de caisse",
    intro: "Le matin, l'argent mis dans le tiroir. Le soir, vous comptez et l'app compare avec ce qui devrait s'y trouver.",
    steps: [
      "Le matin, sous « Fond de caisse », saisissez l'argent du tiroir et touchez « Enregistrer le fond de caisse ».",
      "Le soir, regardez « = Attendu » : fond de caisse + espèces encaissées − dépenses payées en caisse.",
      "Comptez le tiroir et saisissez-le sous « Clôture » : l'écart s'affiche, vert si c'est juste, rouge s'il manque de l'argent.",
      "Touchez « Clôturer la journée ».",
    ],
    tip: "Il manque de l'argent ? Cherchez dans l'ordre : une dépense pas notée, une vente pas encaissée, une monnaie mal rendue.",
  },
  inventaire: {
    title: "L'inventaire",
    intro: "Compter ce qu'il y a vraiment en rayon, voir ce qui manque, puis corriger le stock.",
    steps: [
      "Donnez un nom, choisissez tout le magasin ou une catégorie, puis « Commencer ».",
      "Scannez ou cherchez chaque article et saisissez la quantité comptée. Plusieurs personnes peuvent compter en même temps.",
      "« Vérifier et valider » montre les écarts et leur valeur. « Valider l'inventaire » corrige le stock.",
    ],
    tip: "Les ventes faites pendant le comptage sont prises en compte.",
  },
  rapports: {
    title: "Les rapports",
    intro: "Ce qui s'est vendu, ce que vous avez gagné, ce qui se vend le mieux, où que vous soyez.",
    steps: [
      "En haut, choisissez Jour, Semaine ou Mois, puis les flèches pour reculer dans le temps.",
      "Le ticket bleu donne le chiffre d'affaires et la comparaison avec la période d'avant.",
      "Dessous : ventes, panier moyen, bénéfice estimé et dépenses.",
      "Plus bas : la courbe par jour, les meilleurs produits et les moyens de paiement.",
    ],
    tip: "Le bénéfice n'est juste que si chaque article a son prix d'achat dans sa fiche.",
  },
  equipe: {
    title: "L'équipe",
    intro: "Chaque employé a son propre compte : vous savez qui a vendu quoi.",
    steps: [
      "Envoyez le code d'invitation (6 caractères) à votre employé, par exemple sur WhatsApp.",
      "Il crée son compte sur son téléphone, choisit « Rejoindre » et entre ce code.",
      "Sa demande arrive dans « Demandes à valider » : touchez « Valider ».",
      "Dans « Membres », changez son rôle (Vendeur ou Gérant) ou touchez « Désactiver » s'il s'en va.",
    ],
    tip: "Ne prêtez pas votre compte : une vente faite avec votre compte est enregistrée à votre nom.",
  },
  parametres: {
    title: "Les paramètres",
    intro: "Le taux du jour, votre activité, le ticket de caisse et l'imprimante.",
    steps: [
      "Taux du jour : devant « 1 $ = », tapez combien de francs vaut un dollar, puis « Mettre à jour ».",
      "Mon activité : le nom, la largeur du papier, l'impression automatique après chaque vente.",
      "Ticket de caisse : logo, adresse, téléphone, QR code et message de fin.",
      "Imprimante de cet appareil : choisissez l'imprimante, puis « Imprimer un ticket de test ».",
    ],
    tip: "Mettez le taux à jour chaque matin, avant la première vente.",
  },
  abonnement: {
    title: "Mon abonnement",
    intro: "Votre formule, la date de fin de l'essai ou de l'abonnement, et le paiement.",
    steps: [
      "Sous « Je paie pour », choisissez 1 mois, 3 mois, 6 mois ou 1 an.",
      "Touchez « Payer via WhatsApp » : le message est prêt, nous vous répondons avec le numéro mobile money.",
      "Envoyez-nous la référence reçue par SMS : l'abonnement est prolongé dès que le paiement est vérifié.",
    ],
    tip: "Payez en avance : les mois payés s'ajoutent après la date de fin, vous ne perdez aucun jour.",
  },
  admin: {
    title: "Administration",
    intro: "Les abonnements de toutes les activités inscrites sur vitePOS (équipe vitePOS seulement).",
    steps: [
      "Cherchez une activité par son nom. La pastille de couleur montre où en est son abonnement.",
      "Touchez une activité pour voir son propriétaire et ses paiements.",
      "Pour noter un paiement : la formule, le montant reçu et la référence reçue par SMS.",
    ],
  },
} satisfies Record<string, Omit<Help, "key">>;

export type HelpKey = keyof typeof HELPS;

/** Adresse de l'écran → aide (du plus précis au plus général). */
const ROUTES: [RegExp, HelpKey][] = [
  [/^\/$/, "accueil"],
  [/^\/caisse$/, "caisse"],
  [/^\/ticket\/[^/]+$/, "ticket"],
  [/^\/stock\/import$/, "import"],
  [/^\/stock$/, "stock"],
  [/^\/ventes$/, "ventes"],
  [/^\/plus$/, "plus"],
  [/^\/clients$/, "clients"],
  [/^\/depenses$/, "depenses"],
  [/^\/journee$/, "journee"],
  [/^\/inventaire$/, "inventaire"],
  [/^\/rapports$/, "rapports"],
  [/^\/equipe$/, "equipe"],
  [/^\/parametres$/, "parametres"],
  [/^\/abonnement$/, "abonnement"],
  [/^\/admin$/, "admin"],
];

export function helpFor(pathname: string): Help | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  for (const [re, key] of ROUTES) if (re.test(path)) return { key, ...HELPS[key] };
  return null;
}

/** Clés des aides déjà vues, gardées sur cet appareil (texte JSON lu depuis le stockage). */
export function parseSeen(raw: string | null): string[] {
  try {
    const v: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
