/**
 * Textes du site en français : accueil, manuel et brochure. Les pages ne font que les afficher.
 * `en.ts` a exactement la même forme (type `Dict`) : ajouter un texte ici oblige à l'ajouter en anglais.
 */
import type { IconName } from "../data/icons";
import { chapters as manualChapters, type Chapter } from "../data/manuel";

/** Sections de la page d'accueil, pour les liens du menu. */
export type SectionId = "features" | "devices" | "audiences" | "offline" | "pricing" | "faq" | "contact";

/** Une ligne de la BD : le problème (sans vitePOS) à gauche, la solution (avec vitePOS) à droite. */
export type ComicBubble = { who: string; text: string; side: "left" | "right"; tail?: "left" | "right" };
type ComicPanel = { art: number; caption: string; bubbles: ComicBubble[] };
export type ComicRow = { topic: string; problem: ComicPanel; solution: ComicPanel };

export const fr = {
  locale: "fr_CD",
  langName: "Français",
  switchLabel: "EN",
  switchTitle: "Read in English",
  skip: "Aller au contenu",

  header: {
    nav: [
      { id: "features", label: "Fonctions" },
      { id: "devices", label: "Appareils" },
      { id: "audiences", label: "Pour qui" },
      { id: "offline", label: "Hors ligne" },
      { id: "pricing", label: "Tarifs" },
      { id: "faq", label: "Questions" },
      { id: "contact", label: "Contact" },
    ] as { id: SectionId; label: string }[],
    manual: "Manuel",
    equipment: "Matériel",
    login: "Se connecter",
    signup: "Essayer gratuitement",
    menu: "Ouvrir le menu",
    close: "Fermer le menu",
  },

  footer: {
    tagline: "Point de vente rapide et hors ligne, conçu à Kinshasa.",
    manual: "Manuel de l'utilisateur",
    equipment: "Matériel vitePOS",
    brochure: "Brochure (PDF)",
    terms: "Conditions d'utilisation",
    privacy: "Confidentialité",
    product: "Produit",
    legal: "Informations",
    app: "Application",
    login: "Se connecter",
    signup: "Créer mon compte",
    contact: "Nous contacter",
    whatsapp: "WhatsApp",
    community: "Nous suivre",
    call: "Appeler",
    credits: "Crédits photos",
    creditsText: "Photos libres de droits de Wikimedia Commons, recadrées :",
  },

  home: {
    /** Ancres des sections (dans l'adresse : /#fonctions). */
    ids: { gallery: "apercu", features: "fonctions", devices: "appareils", audiences: "pour-qui", offline: "hors-ligne", pricing: "tarifs", faq: "questions", contact: "contact" },
    title: "vitePOS · Vendez plus vite. Perdez moins. Même sans réseau.",
    description:
      "vitePOS : la caisse sur votre téléphone. Encaissez en FC, $ ou €, le stock et le bénéfice se calculent pendant que vous vendez, même sans réseau. Gratuit pour commencer.",
    eyebrow: "Caisse · Stock · Ventes",
    h1: ["Vendez plus vite.", "Perdez moins.", "Même sans réseau."],
    lead: "Ventes, dépenses, bénéfice : tout est calculé pendant que vous vendez. Fini les comptes de tête à la fermeture.",
    ctaStart: "Commencer gratuitement",
    ctaBrochure: "Télécharger la brochure",
    ctaSee: "Voir l'app",
    ctaStartShort: "Commencer",
    brochureLink: "Brochure (PDF)",
    ticks: ["Gratuit pour commencer", "Rien à acheter", "Marche sans réseau", "FC, $ et €"],
    altHome: "Accueil de vitePOS : ventes du jour et alertes de stock",
    altCaisse: "La caisse de vitePOS avec un panier en cours",

    devicesTitle: "Une seule caisse, sur tous vos appareils",
    devicesLead: "Téléphone, tablette, ordinateur ou terminal de caisse : vitePOS fonctionne sur l'appareil que vous avez déjà. Et tout reste synchronisé : une vente faite au comptoir apparaît aussitôt sur les autres écrans.",
    /** Les appareils où l'on utilise vitePOS (cœur de la section), et la scène qui montre la synchronisation. */
    deviceCards: [
      { name: "Téléphone", systems: "Android · iPhone", text: "Pour vendre partout et suivre votre activité à distance." },
      { name: "Tablette", systems: "Android · iPad", text: "Idéale au comptoir : les articles à gauche, le panier à droite." },
      { name: "Ordinateur", systems: "Windows · Mac", text: "Pour la gestion, le stock et les rapports." },
      { name: "Terminal de caisse", systems: "Android avec Chrome", text: "Pour les caisses fixes, avec imprimante et douchette." },
    ],
    sync: {
      sale: "Vente encaissée",
      amount: "21 100 FC",
      laptopToast: "Ventes du jour · 944 450 FC",
      phoneToast: "Nouvelle vente · Grâce",
    },
    syncTitle: "Et tout reste synchronisé",
    compatTitle: "Accessoires compatibles",
    compatShop: "Voir le matériel vitePOS",
    compatHardware: ["Douchette code-barres USB ou Bluetooth", "Imprimante de tickets 58 ou 80 mm", "Caméra du téléphone pour scanner"],
    shots: {
      tabletteCaisse: { alt: "La caisse sur tablette : articles à gauche, panier à droite", title: "Caisse sur tablette", text: "Les articles à gauche, le panier à droite : idéal au comptoir." },
      ordiJournee: { alt: "La journée de caisse : argent attendu dans le tiroir en FC, $ et €", title: "Journée de caisse", text: "L'argent attendu dans le tiroir en FC, $ et €, puis la clôture." },
      telTicket: { alt: "Un ticket de vente avec la monnaie rendue", title: "Le ticket", text: "Imprimé, ou envoyé au client par WhatsApp." },
      telStock: { alt: "Le stock avec ses alertes de rupture", title: "Le stock", text: "Recherche, catégories, alertes de rupture." },
      telAccueil: { alt: "Les ventes du jour comparées à hier", title: "Votre business à distance", text: "Les ventes du jour comparées à hier, où que vous soyez." },
      ordiVentes: { alt: "Les ventes du jour, ticket par ticket", title: "Les ventes du jour", text: "Chaque ticket, qui l'a vendu et comment il a été payé." },
      ordiStock: { alt: "Le stock sur ordinateur", title: "Le stock sur ordinateur", text: "Tout le catalogue, les prix et les quantités." },
    },

    featuresTitle: "Tout votre business sur un seul écran",
    featuresLead:
      "La caisse qui encaisse en quelques secondes, en FC, $ ou €, et compte votre stock pour vous. Simple comme une calculatrice.",

    audiencesTitle: "Pour tous les secteurs d'activité",
    audiencesLead: "vitePOS grandit avec votre business.",

    hardwareTitle: "Le matériel que vous avez déjà suffit",
    hardwareLead: "Commencez avec votre téléphone, ajoutez du matériel quand votre activité grandit.",
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
      "Et si un téléphone est perdu ou cassé, tout ce qui a déjà été envoyé est sauvegardé en ligne : vous vous reconnectez sur un autre appareil et vous retrouvez tout.",
    ],
    offlineStates: ["Hors ligne · 3 ventes en attente", "Réseau revenu · envoi en cours…", "En ligne, tout est envoyé"],

    stepsTitle: "Prêt en trois étapes",
    faqTitle: "Questions fréquentes",
    finalTitle: "Votre caisse est prête en 5 minutes.",
    finalText: "Gratuit pour commencer.",
    finalCta: "Créer mon compte",

    /** Carrousel du haut de page : une diapositive par type de commerce (la première porte le titre principal). */
    slides: [
      {
        tag: "Plusieurs caisses",
        short: "Plusieurs caisses",
        line: "Plusieurs caisses en même temps, le stock se met à jour tout seul.",
        title: "",
        text: "",
        pops: ["Vente encaissée · 21 100 FC", "Payé en $, monnaie rendue · 900 FC", "Caisse 2 · 8 articles · 14 500 FC", "Stock à jour · Riz 1 kg : 38 restants"],
      },
      {
        tag: "Pharmacies et dépôts",
        short: "Pharmacies",
        line: "Alerte 30 jours avant la péremption : plus aucun produit oublié en rayon.",
        title: "Plus aucun produit périmé oublié en rayon.",
        text: "Recherche par nom ou code-barres, alerte 30 jours avant la péremption, inventaire en scannant le rayon.",
        pops: ["Alerte · 2 lots périment dans 30 jours", "Vente · Paracétamol 500 mg · 2 500 FC", "Lot reçu, périme le · 15/03/2027", "Inventaire · rayon 3 compté"],
      },
      {
        tag: "Téléphonie et accessoires",
        short: "Téléphonie",
        line: "Chaque téléphone vendu avec son IMEI et sa garantie, chaque client avec son historique.",
        title: "Des clients en confiance, qui reviennent acheter.",
        text: "Chaque téléphone vendu est enregistré avec son IMEI et sa garantie, et chaque client garde son historique d'achats. Il revient ? Vous retrouvez tout en une seconde.",
        pops: ["IMEI scanné · Galaxy A15", "Vente garantie 12 mois · 420 000 FC", "Client retrouvé · Papa Jean, 3 achats", "Ticket envoyé par WhatsApp"],
      },
      {
        tag: "Quincailleries et matériaux",
        short: "Quincailleries",
        line: "Des milliers d'articles retrouvés en un instant, vendus à la pièce ou au carton.",
        title: "Des milliers d'articles, retrouvés en un instant.",
        text: "Recherche par code article, vente à la pièce, au kilo ou au carton, plusieurs vendeurs en même temps.",
        pops: ["Trouvé · Tuyau PVC 32 mm", "Vente · 2 sacs de ciment · 40 $", "Vendu au carton · 4 boîtes de vis", "Alerte · Peinture 20 L bientôt en rupture"],
      },
      {
        tag: "Vendeurs et entrepreneurs",
        short: "Entrepreneurs",
        line: "Vos vendeurs encaissent, vous suivez chaque vente depuis votre téléphone.",
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
    whyTitle: "L'histoire de Maman Ngalula",
    /** BD « Pourquoi vitePOS » : 6 cases, bulles en texte (les dessins sont dans public/bd/). */
    comic: {
      lead: "Patronne d'une alimentation à Kinshasa, elle gérait tout dans un cahier. Son neveu lui a conseillé vitePOS : voici sa vie avant, et après.",
      columns: { before: "Sans vitePOS", after: "Avec vitePOS" },
      placeholder: "Dessin à venir",
      /** Chaque ligne : le problème à gauche, la solution à droite. `art` = numéro du dessin dans public/bd/. */
      rows: [
        {
          topic: "L'inventaire",
          problem: { art: 1, caption: "Un dimanche entier", bubbles: [{ who: "Maman Ngalula", text: "Tout le dimanche à compter… et il faut encore recommencer le rayon boissons !", side: "left" }] },
          solution: { art: 4, caption: "Fini avant l'ouverture", bubbles: [{ who: "Grâce", text: "On scanne le rayon à deux, l'app montre ce qui manque. C'est déjà fini !", side: "left" }] },
        },
        {
          topic: "Le stock",
          problem: {
            art: 2,
            caption: "Rupture et périmés",
            bubbles: [
              { who: "Une cliente", text: "Vous n'avez plus de lait Nido ?", side: "left" },
              { who: "Grâce", text: "Il est fini… Et ces boîtes-là sont périmées.", side: "right" },
            ],
          },
          solution: { art: 5, caption: "Prévenue à temps", bubbles: [{ who: "Grâce", text: "Plus que 6 boîtes de Nido, et un lot périme dans 30 jours : on commande aujourd'hui.", side: "right" }] },
        },
        {
          topic: "Le suivi",
          problem: { art: 7, caption: "Loin de son magasin", bubbles: [{ who: "Maman Ngalula", text: "Grâce, on a vendu combien aujourd'hui ? Il reste du riz ?", side: "left", tail: "right" }] },
          solution: {
            art: 6,
            caption: "Où qu'elle soit",
            bubbles: [{ who: "Maman Ngalula", text: "Ventes, bénéfice, stock… Je vois tout depuis mon téléphone. Et mes dimanches sont à moi.", side: "right", tail: "left" }],
          },
        },
      ] as ComicRow[],
      /** Le déclic, en tête de section, à côté du bouton : Patrick propose, sa tante répond. */
      spark: {
        art: 3,
        caption: "Le déclic",
        bubbles: [
          { who: "Patrick", text: "Tantine, essaie vitePOS : le stock se compte tout seul. Et c'est gratuit pour commencer.", side: "left" },
          { who: "Maman Ngalula", text: "Vraiment ? Comment ça marche ? Montre-moi ça !", side: "right" },
        ],
      } as { art: number; caption: string; bubbles: ComicBubble[] },
      /** Juste après le déclic : Grâce et sa patronne, satisfaites, quelques jours plus tard. */
      result: {
        art: 8,
        caption: "Une semaine plus tard",
        title: "Une semaine plus tard…",
        text: "Grâce et Maman Ngalula ne reviendraient pour rien au monde au cahier. Voici ce qui a changé.",
        bubbles: [
          { who: "Maman Ngalula", text: "Plus aucune rupture, et je vois tout sur mon téléphone !", side: "left" },
          { who: "Grâce", text: "Et plus de dimanches perdus à compter !", side: "right" },
        ],
      } as { art: number; caption: string; title: string; text: string; bubbles: ComicBubble[] },
      end: "Moins de temps à compter, plus de temps pour vendre.",
    },

    featuresEyebrow: "Fonctions",
    devicesEyebrow: "Appareils",
    audiencesEyebrow: "Pour qui",
    sectorsAll: "Tous les secteurs",
    galleryTitle: "Pensé pour les business de la RDC",
    galleryText: "Du petit magasin à la grande équipe, vitePOS s'adapte à la façon dont on vend ici : plusieurs devises, coupures de réseau, vente au carton ou à la pièce.",
    hardwareEyebrow: "Matériel",
    offlineEyebrow: "Hors ligne",
    stepsEyebrow: "Mise en route",
    faqEyebrow: "Questions",
    faqLead: "Vous ne trouvez pas votre réponse ? Le manuel explique chaque écran pas à pas.",
    faqManual: "Lire le manuel",

    /** Galerie : de vraies captures de l'app, une par onglet. */
    gallery: {
      eyebrow: "Aperçu",
      title: "Voyez vitePOS avant de l'essayer",
      lead: "De vrais écrans de l'application, sur téléphone, tablette et ordinateur.",
      tabs: [
        { label: "Accueil", text: "Les ventes du jour, les alertes de stock et le taux du jour dès l'ouverture.", alt: "Accueil de vitePOS sur téléphone" },
        { label: "Caisse", text: "Touchez les articles ou scannez-les, encaissez en FC, $ ou €, la monnaie est calculée.", alt: "La caisse de vitePOS sur tablette" },
        { label: "Stock", text: "Chaque vente retire l'article du stock. Les ruptures et les péremptions vous sont signalées.", alt: "La liste du stock sur ordinateur" },
        { label: "Ventes", text: "Toutes les ventes, par vendeur et par jour, avec le bénéfice de chacune.", alt: "L'historique des ventes sur ordinateur" },
        { label: "Journée", text: "La clôture de caisse : ce qui doit être dans le tiroir, en espèces et en mobile money.", alt: "Le bilan de la journée sur ordinateur" },
        { label: "Ticket", text: "Le ticket s'imprime, ou part par WhatsApp au client.", alt: "Un ticket de vente sur téléphone" },
      ],
    },

    /** Ticket de caisse personnalisé. */
    receipt: {
      eyebrow: "Nouveau",
      title: "Un ticket à votre image",
      lead: "Chaque vente donne un ticket clair, à votre nom : votre client sait ce qu'il a payé et où vous retrouver.",
      points: [
        { title: "Votre logo en haut", text: "Ajoutez-le depuis une photo : vitePOS le prépare pour l'imprimante." },
        { title: "Vos coordonnées", text: "Adresse, téléphone, RCCM, ID NAT, numéro d'impôt." },
        { title: "Votre QR code", text: "Vers votre WhatsApp, Facebook ou TikTok : le client vous retrouve." },
        { title: "Un code-barres par ticket", text: "Pour retrouver la vente en un instant." },
      ],
      printers: "Imprimantes thermiques 58 et 80 mm, en Bluetooth ou en USB.",
      alt: "Ticket vitePOS avec logo, coordonnées, code-barres et QR code",
    },

    /** Tarifs : trois formules selon le nombre de téléphones (liste dans `plans`), Pro mise en avant ; Sur mesure en dessous. */
    pricing: {
      eyebrow: "Tarifs",
      title: "Payez selon le nombre de téléphones",
      lead: "Essai gratuit : plus votre formule est grande, plus l'essai est long. Ensuite, payez par mobile money, au mois ou à l'année (2 mois offerts).",
      cta: "Commencer gratuitement",
      more: { title: "Sur mesure", text: "Plus de 10 téléphones ou plusieurs magasins : prix sur devis, 30 jours d'essai." },
      safe: "Sans paiement à la fin de l'essai, rien n'est effacé : vos ventes et votre stock restent consultables.",
    },

    /** Contact : WhatsApp d'abord, puis appel et e-mail. */
    contact: {
      eyebrow: "Contact",
      title: "Une question ? Écrivez-nous",
      lead: "Notre équipe à Kinshasa répond sur WhatsApp : questions, aide pour démarrer, démonstration dans votre magasin.",
      whatsapp: { title: "WhatsApp", text: "Le plus rapide. Écrivez-nous, même un simple « bonjour ».", cta: "Écrire sur WhatsApp", message: "Bonjour, j'ai une question sur vitePOS." },
      call: { title: "Téléphone", cta: "Appeler" },
      email: { title: "E-mail", cta: "Envoyer un e-mail" },
      demo: { title: "Démonstration chez vous", text: "On passe dans votre magasin pour tout installer et vous montrer comment vendre.", cta: "Demander une démonstration", message: "Bonjour, je voudrais une démonstration de vitePOS dans mon magasin." },
      city: "Kinshasa, République démocratique du Congo",
    },

    /** Installation : selon l'appareil du visiteur. */
    install: {
      eyebrow: "Installer",
      ask: "Demander l'installation",
      askMessage: "Bonjour, je voudrais que vous passiez installer vitePOS chez moi.",
      title: "On l'installe pour vous",
      lead: "Nos équipes peuvent passer chez vous pour tout installer et vous montrer comment vendre.",
      yours: "Votre appareil",
      open: "Ouvrir vitePOS",
      scan: "Ou scannez avec votre téléphone",
      qrAlt: "QR code pour ouvrir vitePOS",
      devices: [
        { name: "Android", where: "Chrome", steps: ["Ouvrez app.viteposrdc.com dans Chrome", "Touchez les trois points en haut, puis « Installer l'application »", "L'icône vitePOS apparaît sur l'écran d'accueil"] },
        { name: "iPhone et iPad", where: "Safari ou Chrome", steps: ["Ouvrez app.viteposrdc.com dans Safari ou Chrome", "Touchez le bouton Partager", "Choisissez « Sur l'écran d'accueil »"] },
        { name: "Ordinateur", where: "Chrome ou Edge", steps: ["Ouvrez app.viteposrdc.com", "Cliquez sur l'icône d'installation dans la barre d'adresse", "vitePOS s'ouvre dans sa propre fenêtre"] },
      ],
    },
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
      title: "Votre business dans votre poche.",
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
    { title: "Magasins de quartier", text: "Alimentation, cosmétiques, téléphonie, boulangeries. Une caisse simple sur le téléphone du patron ou du vendeur." },
    { title: "Quincailleries, grossistes et pièces de rechange", text: "Gros catalogues, recherche par code article, ventes à la pièce, au kilo, au litre ou au carton, plusieurs vendeurs." },
    { title: "Pharmacies et dépôts de boissons", text: "Recherche rapide par nom ou code-barres, vente au casier ou au carton, alertes de rupture, inventaires réguliers." },
    { title: "Magasins à plusieurs caisses", text: "Plusieurs caisses qui vendent en même temps, clôture par jour, rapports pour le gérant et le propriétaire." },
  ],

  /** Store « Matériel vitePOS » : le matériel vendu par l'équipe, prix sur demande (commande par WhatsApp). */
  equipment: {
    title: "Matériel vitePOS : imprimantes, douchettes, tiroirs-caisses",
    description: "Le matériel qui marche avec vitePOS : imprimantes de tickets, douchettes, tiroirs-caisses, tablettes et papier. Prix sur demande, commande sur WhatsApp.",
    eyebrow: "Matériel",
    h1: "Le matériel pour bien vendre",
    lead: "Tout ce qui va avec vitePOS, déjà testé par notre équipe. Écrivez-nous sur WhatsApp : on vous donne le prix et on s'organise pour vous le remettre.",
    price: "Prix sur demande",
    order: "Commander",
    orderLabel: "Commander sur WhatsApp :",
    message: "Bonjour, je voudrais commander : {item}. Quel est le prix ?",
    popular: "Le plus demandé",
    items: [
      { id: "pack", icon: "pack", name: "Pack caisse complet", text: "Tablette avec support, imprimante de tickets, douchette et tiroir-caisse. On l'installe chez vous et on vous montre comment vendre.", featured: true },
      { id: "printer58", icon: "printer", name: "Imprimante de tickets Bluetooth 58 mm", text: "Petite et sans fil : elle imprime le ticket depuis le téléphone, même sans réseau." },
      { id: "printer80", icon: "printer", name: "Imprimante de tickets 80 mm", text: "Pour le comptoir : tickets plus larges, branchée à l'ordinateur ou à la tablette." },
      { id: "scanner", icon: "barcode", name: "Douchette (lecteur de codes-barres)", text: "Bip ! le produit est dans le panier, sans rien taper. En USB ou en Bluetooth." },
      { id: "drawer", icon: "drawer", name: "Tiroir-caisse", text: "Il s'ouvre tout seul à chaque vente, branché à l'imprimante 80 mm." },
      { id: "tablet", icon: "tablet", name: "Tablette avec support", text: "Un grand écran posé sur le comptoir, prêt pour encaisser." },
      { id: "paper", icon: "paper", name: "Rouleaux de papier thermique", text: "En 58 mm et en 80 mm, à l'unité ou par carton." },
    ],
    already: { title: "Vous avez déjà du matériel ?", text: "vitePOS marche aussi avec la plupart des imprimantes de tickets USB ou Bluetooth et des douchettes. Envoyez-nous la marque sur WhatsApp, on vous dit si ça va." },
    alreadyMessage: "Bonjour, j'ai déjà du matériel. Est-ce qu'il marche avec vitePOS ? Voici la marque : ",
    ask: "Poser une question",
  },

  /** Page « Communauté » (QR code de la brochure) : WhatsApp, Instagram, Facebook. Liens dans SOCIAL (content.ts). */
  community: {
    title: "Suivez vitePOS sur Instagram et Facebook",
    description: "Soutenez vitePOS : abonnez-vous sur Instagram et Facebook et partagez vitePOS autour de vous.",
    h1: "Suivez vitePOS",
    lead: "Soutenez-nous en vous abonnant et en partageant vitePOS autour de vous. Ça nous donne la force de continuer.",
    instagram: { label: "Instagram" },
    facebook: { label: "Facebook" },
    app: "Essayer l'app gratuitement",
    qrTitle: "Suivez-nous",
    qrAlt: "QR code pour suivre vitePOS sur Instagram et Facebook",
  },

  /** Formules : mêmes prix que PLANS dans src/lib/subscription.ts (app). Pro est mise en avant. */
  plans: {
    popular: "Le plus choisi",
    per: "par mois",
    list: [
      {
        name: "Solo",
        phones: "1 téléphone",
        price: "5 $",
        yearly: "ou 50 $ par an",
        trial: "7 jours gratuits",
        note: "Vous vendez seul",
        featured: false,
        features: ["Caisse en cash ($, €, FC) et mobile money", "Stock, alertes et import Excel", "Ventes, clients et dépenses", "Clôture de la journée et rapports"],
      },
      {
        name: "Équipe",
        phones: "Jusqu'à 3 téléphones",
        price: "13,99 $",
        yearly: "ou 139,90 $ par an",
        trial: "14 jours gratuits",
        note: "Vous et vos vendeurs",
        featured: false,
        features: ["Tout de la formule Solo", "Vous et deux employés", "Chaque vente au nom du vendeur", "Droits réglés pour chaque employé"],
      },
      {
        name: "Pro",
        phones: "Jusqu'à 10 téléphones",
        price: "20,99 $",
        yearly: "ou 209,90 $ par an",
        trial: "21 jours gratuits",
        note: "Une équipe, plusieurs caisses",
        featured: true,
        features: ["Tout de la formule Équipe", "Jusqu'à 10 comptes", "Installation et formation offertes", "Aide prioritaire sur WhatsApp"],
      },
    ],
    custom: { name: "Sur mesure", phones: "Plus de 10 téléphones", price: "Sur devis" },
  },

  /** Liste courte des secteurs, pour la brochure. */
  sectors: [
    "Alimentation",
    "Cosmétiques et mode",
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
      a: "Cela dépend du nombre de téléphones : Solo 5 $ par mois (1 téléphone), Équipe 13,99 $ (jusqu'à 3), Pro 20,99 $ (jusqu'à 10), Sur mesure au-delà. L'essai est gratuit : 7, 14, 21 ou 30 jours selon la formule, avec toutes les fonctions. À l'année, 2 mois sont offerts. Paiement par mobile money. Sans paiement, vos données restent consultables et exportables : rien n'est effacé.",
    },
    {
      q: "Faut-il acheter du matériel ?",
      a: "Non. Un téléphone Android ou un iPhone suffit. Une tablette, un ordinateur, une douchette ou une imprimante de tickets peuvent s'ajouter si vous le souhaitez.",
    },
    {
      q: "Est-ce que ça marche sans internet ?",
      a: "Oui. Les ventes, le stock et les dépenses fonctionnent sans réseau. Il faut seulement internet pour créer votre compte.",
    },
    {
      q: "Comment l'installer ?",
      a: "Rien à télécharger dans un store. Ouvrez app.viteposrdc.com sur votre téléphone. Sur Android (Chrome) : touchez « Installer » dans l'app, ou le menu ⋮ puis « Installer l'application ». Sur iPhone (Safari) : touchez Partager, puis « Sur l'écran d'accueil ». vitePOS s'ouvre ensuite depuis son icône, en plein écran, même sans internet.",
    },
    {
      q: "Je peux vendre en francs, en dollars et en euros ?",
      a: "Oui. Le propriétaire fixe le taux du jour, vos prix restent dans la devise de votre choix, et le client paie en francs, en dollars, en euros ou en mobile money. La monnaie à rendre est calculée pour vous.",
    },
    {
      q: "Mes données sont-elles en sécurité ?",
      a: "Chaque business est séparé des autres et sauvegardé en ligne. Chaque employé a son propre compte et ne voit que ce que vous lui autorisez.",
    },
  ],

  legal: {
    updated: "Mise à jour le",
    missing: "à compléter",
  },

  manual: {
    title: "Le journal de votre business · Manuel vitePOS",
    description:
      "Le manuel de vitePOS, pas à pas : créer son compte, préparer le stock, vendre en FC, $ ou €, fermer la journée et suivre ses chiffres, même sans réseau.",
    masthead: "Le journal de votre business",
    edition: "Édition 2026",
    h1: ["vitePOS,", "mode d'emploi"],
    lead: "Tout ce qu'il faut pour tenir la caisse, le stock et les comptes de votre activité, du matin au soir, même quand le réseau coupe.",
    teasers: [
      [4, "Recevoir 3 paquets sans compter 72 bouteilles"],
      [7, "Encaisser en FC, $ ou € en quelques secondes"],
      [12, "Fermer la journée sans surprise"],
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

  /** Dépliant A4 plié en trois (3 volets recto, 3 volets verso). */
  trifold: {
    title: "Dépliant vitePOS",
    description: "Le dépliant de vitePOS, à imprimer sur une feuille A4 recto-verso et à plier en trois.",
    download: "Télécharger le dépliant (PDF)",
    screenNote: "Une feuille A4 recto-verso, pliée en trois. À l'impression : recto-verso, retourner sur le bord court.",
    outsideLabel: "Extérieur (couverture à droite)",
    insideLabel: "Intérieur",
    coverKicker: "La caisse de votre business",
    coverLead: "Sur le téléphone que vous avez déjà. Vous vendez, vitePOS compte.",
    flapTitle: "Fini les comptes de tête à la fermeture",
    flapEnd: "Le soir, vous savez exactement ce qui doit être dans la caisse. Même quand vous n'êtes pas là.",
    backTitle: "Commencez aujourd'hui",
    backLead: "Scannez, créez votre compte, vendez. Essai gratuit.",
    howKicker: "Comment ça marche",
    howTitle: "Une vente en 3 gestes",
    how: [
      { title: "Scannez ou touchez", text: "Scannez le code-barres avec la caméra du téléphone ou une douchette, ou touchez l'article à l'écran." },
      { title: "Encaissez", text: "En cash ($, €, FC) ou en mobile money : la monnaie à rendre s'affiche." },
      { title: "Donnez le ticket", text: "Imprimé, ou envoyé au client par WhatsApp. Le stock baisse tout seul." },
    ],
    featuresKicker: "Fonctions",
    devicesTitle: "Sur l'appareil de votre choix",
    devices: ["Téléphone", "Tablette", "Ordinateur", "Imprimante de tickets"],
    priceKicker: "Tarifs",
  },

  brochure: {
    title: "Brochure vitePOS",
    description: "La brochure de vitePOS, à imprimer ou à partager : la caisse qui vend plus vite, perd moins et marche même sans réseau.",
    download: "Télécharger la brochure (PDF)",
    screenNote: "Une feuille A5 recto-verso, à imprimer ou à envoyer par WhatsApp.",
    altHome: "Accueil de vitePOS",
    altCaisse: "La caisse de vitePOS",
    tag: "Caisse · Stock · Ventes",
    sticker: ["Essai", "gratuit"],
    lead: "La caisse de votre business, sur le téléphone que vous avez déjà. Vous vendez, vitePOS compte.",
    ctaTitle: "Essayez vitePOS gratuitement",
    ctaText: "Sans matériel à acheter · prêt en 5 minutes · même sans réseau",
    priceFrom: "Ensuite, dès",
    pricePer: "par mois",
    qrLabel: "Scannez pour commencer",
    askLabel: "Questions, démonstration",
    storyTitle: "Fini les comptes de tête à la fermeture",
    before: { label: "Avant", text: "Le soir, on recompte le cahier… et il manque toujours quelque chose.", alt: "Une marchande et sa vendeuse, perdues dans le cahier de caisse" },
    after: { label: "Avec vitePOS", text: "Chaque vente est notée, le stock se compte seul, la caisse tombe juste.", alt: "La marchande et sa vendeuse, contentes de leur journée" },
    benefitsTitle: "Ce que vitePOS fait pour vous",
    benefits: [
      { title: "Plus d'erreur de monnaie", text: "Le client paie en $, €, FC ou mobile money : la monnaie est calculée." },
      { title: "Jamais bloqué par le réseau", text: "Internet coupe ? Vous vendez quand même ; tout se met à jour au retour." },
      { title: "Jamais en rupture", text: "Alerte avant la rupture et la péremption. Vente au carton ou à la pièce." },
      { title: "Plus de vol ni d'oubli", text: "Un compte par vendeur, aucune vente effacée, prix d'achat cachés." },
      { title: "La caisse tombe juste", text: "Le soir, la clôture compare le tiroir à ce qui était attendu." },
      { title: "Votre bénéfice, partout", text: "Ventes, dépenses et marge du jour, même loin du magasin." },
    ],
    priceTitle: "Payez selon vos téléphones",
    otherPlans: "Les autres formules",
    stepsTitle: "Démarrez en 3 étapes",
    steps: ["Scannez le QR code, ou ouvrez", "Créez votre compte gratuit", "Ajoutez vos articles et vendez"],
    contactTitle: "On vient chez vous",
    contactText: "Nous passons chez vous pour tout installer et vous montrer comment vendre.",
    phoneLabel: "WhatsApp et appels",
    emailLabel: "E-mail",
    siteLabel: "Site",
  },
};

export type Dict = typeof fr;
