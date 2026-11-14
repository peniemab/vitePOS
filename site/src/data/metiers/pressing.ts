/**
 * Manuel A5 du pressing (8 pages) : textes en français et en anglais.
 * L'app est en français : en anglais, les noms de boutons restent en français, avec leur sens entre parenthèses.
 * Captures : `node preview/capture.mjs pr-` (aperçu lancé, scène ?pressing).
 */
import type { Lang } from "../../i18n";

export interface TradePage {
  kicker: string;
  title: string;
  lead: string;
  steps: string[];
  shot: { name: string; alt: string; caption: string };
  tip?: { title: string; text: string };
}

export interface TradeGuide {
  /** Titre et description de la page web. */
  title: string;
  description: string;
  download: string;
  screenNote: string;
  pdf: string;
  /** Même PDF, 2 pages par face d'une feuille A4, pour l'impression en livret. */
  printPdf: string;
  printLabel: string;
  cover: { trade: string; title: string; lead: string; points: string[]; altBack: string; altFront: string; qrLabel: string };
  pages: TradePage[];
  faqTitle: string;
  faq: { q: string; a: string }[];
  help: { title: string; text: string; phoneLabel: string; siteLabel: string };
}

const fr: TradeGuide = {
  title: "Manuel du pressing · vitePOS",
  description: "Recevoir le linge, donner un ticket, prévenir le client sur WhatsApp et encaisser au retrait : le guide vitePOS pour les pressings, en 8 pages.",
  download: "Télécharger le manuel (PDF, A5)",
  screenNote: "8 pages A5. Pour l'imprimer : version A4 recto-verso (retourner sur le bord court), feuilles l'une dans l'autre, pliées en deux.",
  pdf: "/manuel-pressing.pdf",
  printPdf: "/manuel-pressing-a-imprimer.pdf",
  printLabel: "Version à imprimer (A4, recto-verso)",
  cover: {
    trade: "Manuel du pressing",
    title: "Le linge reçu, suivi et rendu, sans cahier",
    lead: "Chaque dépôt a son ticket numéroté, chaque client est prévenu sur WhatsApp, et l'argent de l'avance comme du reste est compté le jour où il entre.",
    points: ["Un ticket pour chaque dépôt", "Les retards en rouge", "Prévenu sur WhatsApp", "Avance ou tout au retrait"],
    altBack: "Liste des dépôts en cours",
    altFront: "Ticket de dépôt",
    qrLabel: "Commencer",
  },
  pages: [
    {
      kicker: "Avant de commencer",
      title: "Vos services et vos prix",
      lead: "Lavage, repassage, nettoyage à sec : chaque travail devient un article, avec son prix. Comme vous vendez un travail et pas un produit, il n'y a pas de stock à compter.",
      steps: [
        "Ouvrez <b>Stock</b>, puis touchez <b>« Ajouter »</b>.",
        "Donnez un nom clair : <b>Chemise lavée-repassée</b>, <b>Costume nettoyage à sec</b>, <b>Drap ou couverture</b>…",
        "Tapez le <b>Prix de vente</b>. Dans <b>Catégorie</b>, mettez <b>Services</b>.",
        "Activez <b>« C'est un service (pas de stock) »</b>, puis <b>« Enregistrer »</b>.",
        "Cochez <b>« Favori »</b> pour les services les plus demandés : ils s'affichent en premier à la caisse.",
      ],
      shot: { name: "pr-service", alt: "Fiche d'un service", caption: "« C'est un service » : il se vend sans compter de stock." },
      tip: { title: "Un prix par pièce", text: "Faites un service par type de pièce (chemise, pantalon, robe…) : le ticket détaille tout, et vos rapports montrent ce qui rapporte le plus." },
    },
    {
      kicker: "Le client arrive",
      title: "Recevoir le linge",
      lead: "Le client pose son sac sur le comptoir. On compte les pièces avec lui, et on les ajoute à la caisse comme une vente.",
      steps: [
        "Ouvrez <b>Caisse</b> et touchez chaque service autant de fois qu'il y a de pièces : 4 chemises, c'est 4 touches.",
        "Ouvrez le panier et choisissez le client dans <b>« Ajouter un client »</b> (ou créez-le avec son numéro).",
        "Vérifiez le total avec lui.",
        "Touchez <b>« Dépôt : le client revient chercher »</b>.",
      ],
      shot: { name: "pr-panier", alt: "Panier avec des services", caption: "Le bouton « Dépôt » apparaît quand le panier ne contient que des services." },
      tip: { title: "Le client paie tout de suite et repart avec ?", text: "Un repassage minute, par exemple : touchez simplement « Encaisser », comme une vente normale." },
    },
    {
      kicker: "Le dépôt",
      title: "Noter ce qu'il laisse, et le jour du retrait",
      lead: "En quelques secondes, le dépôt est enregistré : qui, quoi, pour quand, et ce qui est déjà payé.",
      steps: [
        "<b>Client</b> : son nom et son numéro servent à le prévenir sur WhatsApp.",
        "<b>Ce que le client laisse</b> : couleurs, marques, taches, boutons manquants. Ces détails évitent les disputes au retrait.",
        "<b>À retirer le</b> : touchez <b>Demain</b>, <b>Dans 3 jours</b> ou <b>Dans 1 semaine</b>, ou choisissez la date.",
        "<b>Le client paie</b> : <b>Tout payé</b>, une <b>Avance</b> (tapez le montant), ou <b>Au retrait</b>.",
        "Touchez <b>« Encaisser »</b> (ou <b>« Enregistrer le dépôt »</b> s'il paiera au retrait).",
      ],
      shot: { name: "pr-depot", alt: "Fenêtre Nouveau dépôt", caption: "Avec une avance, le reste à payer s'affiche tout de suite." },
      tip: { title: "Le ticket du client", text: "Il s'affiche tout de suite, numéroté : « Imprimer le ticket », ou « Envoyer le ticket » sur WhatsApp. Écrivez son numéro sur l'étiquette du linge." },
    },
    {
      kicker: "Au fil des jours",
      title: "Savoir où en est chaque dépôt",
      lead: "Plus besoin de feuilleter un cahier : l'écran Dépôts montre ce qui est en cours, ce qui est prêt, et qui est en retard.",
      steps: [
        "Ouvrez <b>Dépôts</b> (dans le menu <b>Plus</b> sur téléphone).",
        "<b>En cours</b> : le linge à laver. <b>Prêts</b> : ce qui attend son client. <b>Retirés</b> : ce qui est déjà rendu.",
        "Les dépôts en retard sont <b>en rouge</b>, avec la date promise.",
        "Le client passe sans son ticket ? Tapez son <b>nom</b>, son <b>téléphone</b> ou le <b>numéro</b> du ticket dans la recherche.",
      ],
      shot: { name: "pr-liste", alt: "Liste des dépôts", caption: "Le reste à payer de chaque dépôt, d'un coup d'œil." },
      tip: { title: "Chaque matin", text: "Regardez l'onglet « En cours » : vous savez ce qui doit être prêt aujourd'hui." },
    },
    {
      kicker: "C'est prêt",
      title: "Prévenir le client sur WhatsApp",
      lead: "Le travail est fini : un toucher pour le noter, un autre pour prévenir le client. Il sait combien il lui reste à payer avant de venir.",
      steps: [
        "Ouvrez le dépôt et touchez <b>« C'est prêt »</b>.",
        "Touchez <b>« Prévenir sur WhatsApp »</b> : le message est déjà écrit, avec le numéro du dépôt et le reste à payer.",
        "Envoyez-le dans WhatsApp, c'est tout.",
        "Marqué prêt par erreur ? <b>« Pas encore prêt »</b> le remet en cours.",
      ],
      shot: { name: "pr-pret", alt: "Dépôt prêt avec le bouton WhatsApp", caption: "Le message part depuis votre propre WhatsApp." },
    },
    {
      kicker: "Le client revient",
      title: "Encaisser le reste et rendre le linge",
      lead: "Le client présente son ticket. On encaisse ce qui reste, et la vente apparaît dans la journée de caisse.",
      steps: [
        "Retrouvez le dépôt dans <b>Dépôts</b> : tapez le numéro du ticket, le nom ou le téléphone du client.",
        "Touchez <b>« Retrait : encaisser »</b>.",
        "Choisissez <b>Espèces</b> ou <b>Mobile money</b>, et la devise. Touchez le billet donné : la monnaie à rendre s'affiche.",
        "Touchez <b>« Encaisser et remettre »</b>, puis rendez le linge. Tout était déjà payé ? Touchez <b>« Remis au client »</b>.",
      ],
      shot: { name: "pr-retrait", alt: "Encaissement du reste au retrait", caption: "L'avance déjà payée est déduite toute seule." },
      tip: { title: "Le soir", text: "Avances et soldes du jour sont dans « Journée de caisse » : le tiroir tombe juste." },
    },
  ],
  faqTitle: "Vos questions",
  faq: [
    {
      q: "J'ai un pressing et un magasin (savon, parfums…). Comment faire ?",
      a: "Tout va dans la même activité : vos services et vos produits, chacun dans son rayon. Si un client achète un produit et laisse du linge, encaissez d'abord le produit, puis faites le dépôt des services.",
    },
    { q: "Le client veut payer plus tard ?", a: "Au retrait, oui : choisissez « Au retrait ». Mais le linge reste chez vous jusqu'au paiement : ce n'est pas un crédit, personne ne repart sans avoir tout payé." },
    { q: "Je me suis trompé sur l'avance.", a: "Le gérant ou le propriétaire annule la vente de l'avance dans Ventes (le jour même) : l'argent sort de la caisse et le dépôt revient à « rien payé »." },
    { q: "Le client ne vient pas chercher son linge.", a: "Son dépôt passe en rouge. Ouvrez-le et renvoyez le message WhatsApp." },
    { q: "Le client n'a pas de téléphone.", a: "Le dépôt marche quand même. Notez bien son nom : vous le retrouverez par la recherche." },
  ],
  help: {
    title: "Besoin d'aide ?",
    text: "Sur chaque écran, le bouton « i » explique quoi faire. Et notre équipe répond sur WhatsApp.",
    phoneLabel: "WhatsApp",
    siteLabel: "Le manuel complet",
  },
};

const en: TradeGuide = {
  title: "Dry-cleaning manual · vitePOS",
  description: "Take in clothes, give a ticket, notify the customer on WhatsApp and collect the balance at pickup: the vitePOS guide for dry cleaners, in 8 pages.",
  download: "Download the manual (PDF, A5)",
  screenNote: "8 A5 pages. To print: A4 double-sided version (flip on the short edge), sheets nested, folded in half.",
  pdf: "/vitepos-dry-cleaning-manual-en.pdf",
  printPdf: "/vitepos-dry-cleaning-manual-en-print.pdf",
  printLabel: "Print version (A4, double-sided)",
  cover: {
    trade: "Dry-cleaning manual",
    title: "Every drop-off tracked, no notebook",
    lead: "Every drop-off has its numbered ticket, every customer is notified on WhatsApp, and both the advance and the balance are counted on the day the money comes in.",
    points: ["A ticket per drop-off", "Late items in red", "Notified on WhatsApp", "Advance or pay later"],
    altBack: "List of current drop-offs",
    altFront: "Drop-off ticket",
    qrLabel: "Get started",
  },
  pages: [
    {
      kicker: "Before you start",
      title: "Your services and prices",
      lead: "Washing, ironing, dry cleaning: each job becomes an item with its price. Since you sell work and not goods, there is no stock to count.",
      steps: [
        "Open <b>Stock</b>, then tap <b>« Ajouter »</b> (add).",
        "Give it a clear name: <b>Shirt washed and ironed</b>, <b>Suit dry cleaning</b>, <b>Sheet or blanket</b>…",
        "Type the <b>Prix de vente</b> (selling price). Under <b>Catégorie</b> (category), put <b>Services</b>.",
        "Turn on <b>« C'est un service (pas de stock) »</b> (it's a service, no stock), then <b>« Enregistrer »</b> (save).",
        "Tick <b>« Favori »</b> (favourite) for the most requested services: they show first at the till.",
      ],
      shot: { name: "pr-service", alt: "A service item", caption: "« C'est un service »: it sells without counting stock." },
      tip: { title: "One price per piece", text: "Make one service per type of piece (shirt, trousers, dress…): the ticket lists everything, and your reports show what earns the most." },
    },
    {
      kicker: "The customer arrives",
      title: "Taking in the clothes",
      lead: "The customer puts the bag on the counter. Count the pieces together and add them to the till like a sale.",
      steps: [
        "Open <b>Caisse</b> (till) and tap each service once per piece: 4 shirts means 4 taps.",
        "Open the cart and pick the customer under <b>« Ajouter un client »</b> (add a customer), or create them with their number.",
        "Check the total with them.",
        "Tap <b>« Dépôt : le client revient chercher »</b> (drop-off: the customer comes back).",
      ],
      shot: { name: "pr-panier", alt: "Cart with services", caption: "The « Dépôt » button appears when the cart holds only services." },
      tip: { title: "The customer pays and leaves with it?", text: "A quick ironing, for example: just tap « Encaisser » (collect payment), like a normal sale." },
    },
    {
      kicker: "The drop-off",
      title: "Note what they leave, and the pickup day",
      lead: "In a few seconds the drop-off is recorded: who, what, for when, and what is already paid.",
      steps: [
        "<b>Client</b> (customer): their name and number are used to notify them on WhatsApp.",
        "<b>Ce que le client laisse</b> (what the customer leaves): colours, brands, stains, missing buttons. These details prevent disputes at pickup.",
        "<b>À retirer le</b> (pickup on): tap <b>Demain</b> (tomorrow), <b>Dans 3 jours</b> (in 3 days) or <b>Dans 1 semaine</b> (in 1 week), or pick the date.",
        "<b>Le client paie</b> (the customer pays): <b>Tout payé</b> (all paid), an <b>Avance</b> (advance: type the amount), or <b>Au retrait</b> (at pickup).",
        "Tap <b>« Encaisser »</b> (collect), or <b>« Enregistrer le dépôt »</b> (save the drop-off) if they will pay at pickup.",
      ],
      shot: { name: "pr-depot", alt: "New drop-off window", caption: "With an advance, the balance shows right away." },
      tip: { title: "The customer's ticket", text: "It shows right away, numbered: « Imprimer le ticket » (print) or « Envoyer le ticket » (send) on WhatsApp. Write its number on the clothes tag." },
    },
    {
      kicker: "Day by day",
      title: "Know where every drop-off stands",
      lead: "No more flipping through a notebook: the Dépôts screen shows what is in progress, what is ready, and who is late.",
      steps: [
        "Open <b>Dépôts</b> (drop-offs), in the <b>Plus</b> (more) menu on a phone.",
        "<b>En cours</b> (in progress): clothes to clean. <b>Prêts</b> (ready): waiting for the customer. <b>Retirés</b> (picked up): already returned.",
        "Late drop-offs are <b>in red</b>, with the promised date.",
        "Customer without their ticket? Type their <b>name</b>, <b>phone</b> or the ticket <b>number</b> in the search.",
      ],
      shot: { name: "pr-liste", alt: "List of drop-offs", caption: "The balance of each drop-off, at a glance." },
      tip: { title: "Every morning", text: "Check the « En cours » tab: you know what must be ready today." },
    },
    {
      kicker: "It's ready",
      title: "Notify the customer on WhatsApp",
      lead: "The job is done: one tap to record it, another to notify the customer. They know the balance before they come.",
      steps: [
        "Open the drop-off and tap <b>« C'est prêt »</b> (it's ready).",
        "Tap <b>« Prévenir sur WhatsApp »</b> (notify on WhatsApp): the message is already written, with the drop-off number and the balance.",
        "Send it in WhatsApp, that's all.",
        "Marked ready by mistake? <b>« Pas encore prêt »</b> (not ready yet) puts it back in progress.",
      ],
      shot: { name: "pr-pret", alt: "Ready drop-off with the WhatsApp button", caption: "The message goes from your own WhatsApp." },
    },
    {
      kicker: "The customer comes back",
      title: "Collect the balance and return the clothes",
      lead: "The customer shows their ticket. Collect what is left, and the sale appears in the day's cash.",
      steps: [
        "Find the drop-off in <b>Dépôts</b>: type the ticket number, the customer's name or phone.",
        "Tap <b>« Retrait : encaisser »</b> (pickup: collect).",
        "Choose <b>Espèces</b> (cash) or <b>Mobile money</b>, and the currency. Tap the note given: the change shows.",
        "Tap <b>« Encaisser et remettre »</b> (collect and hand over), then return the clothes. Already fully paid? Tap <b>« Remis au client »</b> (handed over).",
      ],
      shot: { name: "pr-retrait", alt: "Collecting the balance at pickup", caption: "The advance already paid is deducted automatically." },
      tip: { title: "In the evening", text: "The day's advances and balances are in « Journée de caisse » (cash day): the drawer adds up." },
    },
  ],
  faqTitle: "Your questions",
  faq: [
    {
      q: "I run a dry cleaner and a shop (soap, perfume…). How does it work?",
      a: "Everything goes in the same business, each in its own category. A customer buys a product and leaves clothes? Collect the product first, then make the drop-off.",
    },
    { q: "The customer wants to pay later?", a: "At pickup, yes: choose « Au retrait » (at pickup). But the clothes stay with you until payment: this is not credit, nobody leaves without paying in full." },
    { q: "I made a mistake on the advance.", a: "The manager or owner cancels the advance sale in Ventes (sales), on the same day: the money leaves the till and the drop-off goes back to « nothing paid »." },
    { q: "The customer doesn't come for their clothes.", a: "Their drop-off turns red. Open it and send the WhatsApp message again." },
    { q: "The customer has no phone.", a: "The drop-off still works: find it later by name." },
  ],
  help: {
    title: "Need help?",
    text: "On every screen, the « i » button explains what to do. And our team answers on WhatsApp.",
    phoneLabel: "WhatsApp",
    siteLabel: "The full manual",
  },
};

export const PRESSING: Record<Lang, TradeGuide> = { fr, en };
