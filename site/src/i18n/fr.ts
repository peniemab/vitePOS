/**
 * Textes du site en français : accueil, manuel et brochure. Les pages ne font que les afficher.
 * `en.ts` a exactement la même forme (type `Dict`) : ajouter un texte ici oblige à l'ajouter en anglais.
 */
import type { IconName } from "../data/icons";
import { chapters as manualChapters, type Chapter } from "../data/manuel";

/** Sections de la page d'accueil, pour les liens du menu. */
export type SectionId = "features" | "devices" | "audiences" | "offline" | "faq";

export const fr = {
  locale: "fr_CD",
  langName: "Français",
  switchLabel: "EN",
  switchTitle: "Read in English",

  header: {
    nav: [
      { id: "features", label: "Fonctions" },
      { id: "devices", label: "Appareils" },
      { id: "audiences", label: "Pour qui" },
      { id: "offline", label: "Hors ligne" },
      { id: "faq", label: "Questions" },
    ] as { id: SectionId; label: string }[],
    manual: "Manuel",
    login: "Se connecter",
    signup: "Essayer gratuitement",
    menu: "Ouvrir le menu",
    close: "Fermer le menu",
  },

  footer: {
    tagline: "Point de vente rapide et hors ligne, conçu à Kinshasa.",
    manual: "Manuel de l'utilisateur",
    brochure: "Brochure (PDF)",
    terms: "Conditions d'utilisation",
    privacy: "Confidentialité",
    product: "Produit",
    legal: "Informations",
    app: "Application",
    login: "Se connecter",
    signup: "Créer ma boutique",
    credits: "Crédits photos",
    creditsText: "Photos libres de droits de Wikimedia Commons, recadrées :",
  },

  home: {
    /** Ancres des sections (dans l'adresse : /#fonctions). */
    ids: { features: "fonctions", devices: "appareils", audiences: "pour-qui", offline: "hors-ligne", faq: "questions" },
    title: "vitePOS · Vendez plus vite. Perdez moins. Même sans réseau.",
    description:
      "vitePOS : la caisse sur votre téléphone. Encaissez en FC, $ ou €, le stock et le bénéfice se calculent pendant que vous vendez, même sans réseau. Gratuit pour commencer.",
    eyebrow: "Caisse · Stock · Ventes",
    h1: ["Vendez plus vite.", "Perdez moins.", "Même sans réseau."],
    lead: "Ventes, dépenses, bénéfice : tout est calculé pendant que vous vendez. Fini les comptes de tête à la fermeture.",
    ctaStart: "Commencer gratuitement",
    ctaBrochure: "Télécharger la brochure",
    ticks: ["Gratuit pour commencer", "Sans matériel à acheter", "Prêt en 5 minutes"],
    altHome: "Accueil de vitePOS : ventes du jour et alertes de stock",
    altCaisse: "La caisse de vitePOS avec un panier en cours",

    devicesTitle: "Une seule caisse, sur tous vos appareils",
    devicesLead:
      "Les vrais écrans de vitePOS. Téléphone, tablette, ordinateur ou terminal de caisse : il fonctionne partout où il y a un navigateur récent, et tout reste synchronisé.",
    shots: {
      tabletteCaisse: { alt: "La caisse sur tablette : articles à gauche, panier à droite", title: "Caisse sur tablette", text: "Les articles à gauche, le panier à droite : idéal au comptoir." },
      ordiJournee: { alt: "La journée de caisse : argent attendu dans le tiroir en FC, $ et €", title: "Journée de caisse", text: "L'argent attendu dans le tiroir en FC, $ et €, puis la clôture." },
      telTicket: { alt: "Un ticket de vente avec la monnaie rendue", title: "Le ticket", text: "Imprimé, ou envoyé au client par WhatsApp." },
      telStock: { alt: "Le stock avec ses alertes de rupture", title: "Le stock", text: "Recherche, catégories, alertes de rupture." },
      telAccueil: { alt: "Les ventes du jour comparées à hier", title: "Votre boutique à distance", text: "Les ventes du jour comparées à hier, où que vous soyez." },
      ordiVentes: { alt: "Les ventes du jour, ticket par ticket", title: "Les ventes du jour", text: "Chaque ticket, qui l'a vendu et comment il a été payé." },
      ordiStock: { alt: "Le stock sur ordinateur", title: "Le stock sur ordinateur", text: "Tout le catalogue, les prix et les quantités." },
    },

    featuresTitle: "Gérez votre boutique comme un supermarché",
    featuresLead:
      "La caisse qui encaisse en quelques secondes, en FC, $ ou €, et compte votre stock pour vous. Les outils d'une grande surface, simples comme une calculatrice.",

    audiencesTitle: "Pour tous les secteurs d'activité",
    audiencesLead: "vitePOS grandit avec votre commerce, à Kinshasa, Lubumbashi, Kolwezi, Matadi et partout en RDC.",

    hardwareTitle: "Le matériel que vous avez déjà suffit",
    hardwareLead: "Commencez avec votre téléphone, ajoutez du matériel quand votre commerce grandit.",
    hardware: [
      {
        title: "Appareils",
        items: ["Téléphone Android ou iPhone", "Tablette Android ou iPad", "Ordinateur Windows ou Mac", "Terminal de caisse Android avec Chrome"],
      },
      {
        title: "Tickets",
        items: [
          "Imprimante de tickets 58 ou 80 mm en USB, avec Chrome ou Edge sur ordinateur ou tablette",
          "Impression depuis la fenêtre d'impression du téléphone",
          "Ticket envoyé au client par WhatsApp ou SMS",
        ],
      },
      {
        title: "Codes-barres",
        items: [
          "Douchette USB ou Bluetooth : elle tape le code toute seule",
          "Caméra du téléphone, de la tablette ou de l'ordinateur",
          "Codes EAN, UPC, ITF-14, Code 128, QR et DataMatrix",
        ],
      },
    ],
    hardwareNote: "Pas sûr de votre matériel ? Contactez-nous avant d'acheter : nous vous dirons ce qui fonctionne.",

    offlineTitle: "Le réseau coupe ? Vous continuez à vendre.",
    offlineText: [
      "Toutes les ventes sont gardées sur l'appareil et envoyées dès que le réseau revient. Même si deux caisses vendent le même article sans internet, le stock reste juste.",
      "Et si un téléphone est perdu ou cassé, tout ce qui a déjà été envoyé est sauvegardé en ligne : vous vous reconnectez sur un autre appareil et vous retrouvez votre boutique.",
    ],
    offlineStates: ["Hors ligne · 3 ventes en attente", "Réseau revenu · envoi en cours…", "En ligne, tout est envoyé"],

    stepsTitle: "Prêt en trois étapes",
    faqTitle: "Questions fréquentes",
    finalTitle: "Votre caisse est prête en 5 minutes.",
    finalText: "Gratuit pour commencer, sans carte bancaire.",
    finalCta: "Créer ma boutique",

    /** Carrousel du haut de page : une diapositive par type de commerce (la première porte le titre principal). */
    slides: [
      {
        tag: "Supermarchés et supérettes",
        title: "",
        text: "",
        pops: ["Vente encaissée · 21 100 FC", "Payé en $, monnaie rendue · 900 FC", "Caisse 2 · 8 articles · 14 500 FC", "Stock à jour · Riz 1 kg : 38 restants"],
      },
      {
        tag: "Pharmacies et dépôts",
        title: "Plus aucun produit périmé oublié en rayon.",
        text: "Recherche par nom ou code-barres, alerte 30 jours avant la péremption, inventaire en scannant le rayon.",
        pops: ["Alerte · 2 lots périment dans 30 jours", "Vente · Paracétamol 500 mg · 2 500 FC", "Lot reçu, périme le · 15/03/2027", "Inventaire · rayon 3 compté"],
      },
      {
        tag: "Téléphonie et accessoires",
        title: "Des clients en confiance, qui reviennent acheter.",
        text: "Chaque téléphone vendu est enregistré avec son IMEI et sa garantie, et chaque client garde son historique d'achats. Il revient ? Vous retrouvez tout en une seconde.",
        pops: ["IMEI scanné · Galaxy A15", "Vente garantie 12 mois · 420 000 FC", "Client retrouvé · Papa Jean, 3 achats", "Ticket envoyé par WhatsApp"],
      },
      {
        tag: "Quincailleries et matériaux",
        title: "Des milliers d'articles, retrouvés en un instant.",
        text: "Recherche par code article, vente à la pièce, au kilo ou au carton, plusieurs vendeurs en même temps.",
        pops: ["Trouvé · Tuyau PVC 32 mm", "Vente · 2 sacs de ciment · 40 $", "Vendu au carton · 4 boîtes de vis", "Alerte · Peinture 20 L bientôt en rupture"],
      },
      {
        tag: "Commerçants et entrepreneurs",
        title: "Votre business dans la poche.",
        text: "Vos vendeurs encaissent, vous suivez chaque vente en direct depuis votre téléphone, où que vous soyez.",
        pops: ["Caisse ouverte par Grâce · 8 h 02", "Ventes du jour · 186 000 FC", "Meilleure vente · Lait Nido 400 g", "Clôture de caisse, écart · 0 FC"],
      },
    ],
    /** Ventes qui apparaissent en direct dans l'accroche, et bande de ventes qui défile sous les points forts. */
    tape: [
      "Vente · 21 100 FC · 11 articles",
      "Paiement en $ · monnaie rendue 900 FC",
      "Réception · 3 cartons de lait",
      "Alerte · Huile 1 L bientôt en rupture",
      "Clôture · caisse juste à 0 FC près",
      "Vente · 2 sacs de ciment · 40 $",
      "Hors ligne · 3 ventes envoyées au retour du réseau",
      "Inventaire · rayon boissons compté",
    ],
    carousel: { label: "Présentation de vitePOS", prev: "Diapositive précédente", next: "Diapositive suivante", pause: "Mettre en pause", play: "Relancer le défilement", goTo: "Aller à la diapositive", now: "à l'instant" },

    whyEyebrow: "Pourquoi vitePOS",
    whyTitle: "Le cahier de caisse, c'est fini.",
    whyCard: { label: "Vente encaissée", amount: "21 100 FC", sub: "Payé en FC et en $ · monnaie rendue : 900 FC" },
    whyStock: { label: "Stock à jour", sub: "Coca-Cola 33 cl · 46 restants" },

    featuresEyebrow: "Fonctions",
    devicesEyebrow: "Appareils",
    audiencesEyebrow: "Pour qui",
    sectorsAll: "Tous les secteurs",
    galleryTitle: "Pensé pour les commerces de la RDC",
    galleryText: "Du petit commerce au supermarché, vitePOS s'adapte à la façon dont on vend ici : plusieurs devises, coupures de réseau, vente au carton ou à la pièce.",
    hardwareEyebrow: "Matériel",
    offlineEyebrow: "Hors ligne",
    stepsEyebrow: "Mise en route",
    faqEyebrow: "Questions",
    faqLead: "Vous ne trouvez pas votre réponse ? Le manuel explique chaque écran pas à pas.",
    faqManual: "Lire le manuel",
  },

  strengths: [
    { title: "FC, $ et €", text: "au taux du jour, monnaie rendue juste" },
    { title: "Hors ligne", text: "vous vendez même quand le réseau coupe" },
    { title: "Plusieurs caisses", text: "vos employés vendent en même temps" },
  ],

  promises: [
    {
      title: "Fini le cahier.",
      text: "vitePOS remplace le cahier de caisse : plus rapide pour vendre, impossible à « oublier », et lisible depuis votre téléphone.",
    },
    {
      title: "Plus un seul franc perdu.",
      text: "Chaque vente est notée, le stock se compte tout seul, et le soir vous savez exactement ce qui doit être dans la caisse.",
    },
    {
      title: "Votre boutique dans votre poche.",
      text: "Vos vendeurs encaissent, vous voyez chaque vente et chaque article manquant en direct, même quand vous n'êtes pas là.",
    },
  ],

  features: [
    { icon: "bolt", title: "Caisse rapide", text: "Touchez ou scannez les articles, encaissez en francs, en dollars, en euros ou en mobile money. L'app calcule la monnaie à rendre." },
    { icon: "package", title: "Stock toujours juste", text: "Chaque vente fait baisser le stock. Vous êtes prévenu avant la rupture et chaque mouvement est tracé." },
    { icon: "receipt", title: "Tickets", text: "Imprimez le ticket sur une imprimante thermique ou envoyez-le au client par WhatsApp." },
    { icon: "users", title: "Employés sous contrôle", text: "Chaque vendeur a son compte. Les vendeurs ne voient ni vos prix d'achat ni vos marges, et une vente ne s'efface pas." },
    { icon: "chartBar", title: "Rapports clairs", text: "Ventes et dépenses des six derniers mois, meilleurs produits, marge : tout depuis votre téléphone." },
    { icon: "lock", title: "Fin de journée sans surprise", text: "La clôture compare l'argent du tiroir à ce qui était attendu, en francs et en dollars. Les écarts sautent aux yeux." },
    { icon: "clipboardCheck", title: "Inventaire facile", text: "Comptez le rayon en scannant, à plusieurs. L'app montre ce qui manque et sa valeur avant de corriger le stock." },
    { icon: "fileImport", title: "Import depuis Excel", text: "Déjà une liste de produits ? Importez-la en une fois, même avec des milliers d'articles." },
  ] as { icon: IconName; title: string; text: string }[],

  audiences: [
    { title: "Boutiques", text: "Alimentation, cosmétiques, téléphonie, boulangeries. Une caisse simple sur le téléphone du patron ou du vendeur." },
    { title: "Quincailleries, grossistes et pièces de rechange", text: "Gros catalogues, recherche par code article, ventes à la pièce, au kilo, au litre ou au carton, plusieurs vendeurs." },
    { title: "Pharmacies et dépôts de boissons", text: "Recherche rapide par nom ou code-barres, vente au casier ou au carton, alertes de rupture, inventaires réguliers." },
    { title: "Supérettes et supermarchés", text: "Plusieurs caisses qui vendent en même temps, clôture par jour, rapports pour le gérant et le propriétaire." },
  ],

  /** Liste courte des secteurs, pour la brochure. */
  sectors: [
    "Alimentation et supérettes",
    "Supermarchés",
    "Quincailleries et matériaux",
    "Pharmacies et parapharmacies",
    "Dépôts de boissons",
    "Grossistes et demi-gros",
    "Boulangeries et pâtisseries",
    "Cosmétiques",
    "Pièces de rechange auto et moto",
    "Téléphonie et accessoires",
  ],

  /** Villes citées sur le site et la brochure. */
  cities: "À Kinshasa, Lubumbashi, Kolwezi, Matadi et partout en RDC.",

  steps: [
    { title: "Créez votre compte", text: "Avec votre e-mail ou votre compte Google, depuis le navigateur de votre téléphone." },
    { title: "Ajoutez vos produits", text: "Un par un, en scannant, ou d'un coup depuis un fichier Excel." },
    { title: "Vendez", text: "Invitez vos vendeurs avec un code et suivez tout depuis votre téléphone." },
  ],

  faqs: [
    {
      q: "Combien ça coûte ?",
      a: "vitePOS est gratuit pour commencer. Quand votre commerce grandit (plus d'employés, plusieurs caisses ou magasins), des formules adaptées existent : contactez-nous.",
    },
    {
      q: "Faut-il acheter du matériel ?",
      a: "Non. Un téléphone Android ou un iPhone suffit. Une tablette, un ordinateur, une douchette ou une imprimante de tickets peuvent s'ajouter si vous le souhaitez.",
    },
    {
      q: "Est-ce que ça marche sans internet ?",
      a: "Oui. Les ventes, le stock et les dépenses fonctionnent sans réseau. Il faut seulement internet pour créer votre compte et votre boutique.",
    },
    {
      q: "Comment l'installer ?",
      a: "Rien à télécharger dans un store. Ouvrez getvitepos.web.app sur votre téléphone. Sur Android (Chrome) : touchez « Installer » dans l'app, ou le menu ⋮ puis « Installer l'application ». Sur iPhone (Safari) : touchez Partager, puis « Sur l'écran d'accueil ». vitePOS s'ouvre ensuite depuis son icône, en plein écran, même sans internet.",
    },
    {
      q: "Je peux vendre en francs, en dollars et en euros ?",
      a: "Oui. Le propriétaire fixe le taux du jour, vos prix restent dans la devise de votre choix, et le client paie en francs, en dollars, en euros ou en mobile money. La monnaie à rendre est calculée pour vous.",
    },
    {
      q: "Mes données sont-elles en sécurité ?",
      a: "Chaque boutique est séparée des autres et sauvegardée en ligne. Chaque employé a son propre compte et ne voit que ce que vous lui autorisez.",
    },
  ],

  legal: {
    updated: "Mise à jour le",
    missing: "à compléter",
  },

  manual: {
    title: "Le journal de votre boutique · Manuel vitePOS",
    description:
      "Le manuel de vitePOS, pas à pas : créer sa boutique, préparer le stock, vendre en FC, $ ou €, fermer la journée et suivre ses chiffres, même sans réseau.",
    masthead: "Le journal de votre boutique",
    edition: "Édition 2026",
    h1: ["vitePOS,", "mode d'emploi"],
    lead: "Tout ce qu'il faut pour tenir la caisse, le stock et les comptes de votre boutique, du matin au soir, même quand le réseau coupe.",
    teasers: [
      [4, "Recevoir 3 paquets sans compter 72 bouteilles"],
      [6, "Encaisser en FC, $ ou € en quelques secondes"],
      [9, "Fermer la journée sans surprise"],
    ] as [number, string][],
    download: "Télécharger le PDF",
    altCover: "La caisse de vitePOS",
    toc: "Au sommaire",
    tip: "Astuce",
    warn: "Attention",
    note: "",
    backMasthead: "Fin du numéro",
    backTitle: "À vous de vendre.",
    backText: "Une question ? Montrez cette page à votre vendeur : tout y est, pas à pas.",
    backOpen: "Ouvrez",
    backOpenEnd: "sur votre téléphone.",
    backCta: "Ouvrir vitePOS",
    chapters: manualChapters as Chapter[],
  },

  brochure: {
    title: "Brochure vitePOS",
    description: "La brochure de vitePOS, à imprimer ou à partager : la caisse qui vend plus vite, perd moins et marche même sans réseau.",
    tag: "Caisse · Stock · Ventes",
    lead: "La caisse de votre boutique, sur votre téléphone. Ventes, dépenses, bénéfice : tout est calculé pendant que vous vendez.",
    altHome: "Accueil de vitePOS",
    altCaisse: "La caisse de vitePOS",
    ctaTitle: "Gratuit pour commencer",
    ctaText: "Sans matériel à acheter · prêt en 5 minutes · même sans réseau",
    qrLabel: "Scannez pour ouvrir l'app",
    featuresTitle: "Tout pour tenir votre commerce",
    sectorsTitle: "Pour tous les secteurs d'activité",
    stepsTitle: "Prêt en trois étapes",
    contactTitle: "Essayez vitePOS dès aujourd'hui",
    website: "Site web :",
    download: "Télécharger la brochure (PDF)",
    screenNote: "Une feuille A5 recto-verso, à imprimer ou à envoyer par WhatsApp.",
  },
};

export type Dict = typeof fr;
