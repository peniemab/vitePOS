/**
 * English user manual, chapter by chapter, matching `manuel.ts`. The app itself is in French: button
 * names are kept as they appear on screen (« … ») with their meaning in English in brackets.
 */
import type { Chapter } from "./manuel";

export const chapters: Chapter[] = [
  {
    id: "start",
    kicker: "Getting started",
    title: "Your till ready in 5 minutes",
    lead: "No software to buy, no app store: vitePOS opens in your phone's browser, then installs on the home screen like a real app.",
    steps: [
      "Open <b>getvitepos.web.app</b> and sign in with your e-mail or your Google account.",
      "Choose <b>« Créer ma boutique »</b> (create my shop): the shop name, the currency of your prices, the <b>daily rate</b> (how many FC for 1 $) and, if you use it, the euro rate.",
      "Tap <b>« Créer la boutique »</b>. You get a 30-day trial with every feature included.",
      "On the home screen, the <b>« Installer vitePOS »</b> card guides you: the <b>« Installer »</b> button on Android, or <b>Share → « Add to Home Screen »</b> in Safari on iPhone.",
    ],
    shot: { name: "man-installer", alt: "vitePOS home screen with the install card", caption: "The install card disappears once the app is installed." },
    tip: {
      title: "Internet only at the start",
      text: "You need a connection to create your account and your shop. After that, the till works even when the network drops.",
    },
  },
  {
    id: "team",
    kicker: "Your team",
    title: "One account each, with the right permissions",
    lead: "Your sellers never use your account. Each has their own: you know who sold what, and a seller never sees your purchase prices or your margins.",
    steps: [
      "Go to <b>Plus → Équipe</b> (team): you will find the 6-character <b>invitation code</b>.",
      "Your employee creates an account on their phone, chooses <b>« Rejoindre »</b> (join) and enters the code.",
      "The request appears under <b>« Demandes à valider »</b>: tap <b>« Valider »</b> (approve) or « Refuser » (decline).",
      "They join <b>« Membres »</b> as a seller: change their role to <b>Gérant</b> (manager) if needed.",
    ],
    shot: { name: "man-equipe", alt: "Team screen with the invitation code", caption: "The invitation code can be copied and sent by WhatsApp." },
    table: [
      ["Role", "Sells", "Sees reports", "Changes prices", "Closes the till", "Manages stock"],
      ["Owner", "Yes", "Yes", "Yes", "Yes", "Yes"],
      ["Manager", "Yes", "Yes", "Yes", "Yes", "Yes"],
      ["Seller", "Yes", "No", "No", "No", "No"],
    ],
    warn: {
      title: "Do not lend your account",
      text: "A sale made with your account is recorded under your name. For a new employee, give them the invitation code.",
    },
  },
  {
    id: "rate",
    kicker: "Francs, dollars, euros",
    title: "The daily rate, set by the owner",
    lead: "Your prices stay in your currency. The customer pays in francs, dollars or euros: vitePOS converts at the daily rate and works out the change.",
    steps: [
      "Go to <b>Plus → Paramètres</b> (settings).",
      "Enter <b>FC pour 1 $</b> (FC for 1 $) and, if needed, <b>FC pour 1 €</b> (leave it empty if you do not use the euro), then <b>« Mettre à jour »</b> (update).",
      "The new rate shows on every seller's home screen.",
    ],
    shot: { name: "man-parametres", alt: "Settings: daily dollar and euro rates", caption: "Only the owner can change the rate." },
    tip: { title: "Dark mode", text: "In Paramètres → Apparence: « Clair » (light), « Sombre » (dark) or « Automatique » (like the phone). Dark mode is easier on the eyes at night." },
  },
  {
    id: "stock",
    kicker: "Stock",
    title: "Every item has its own card",
    lead: "An item code to find your way, the manufacturer's barcode to go fast, and packs or cartons to sell wholesale. Your Excel list imports in one go: Stock → « … » → « Importer un fichier CSV ».",
    steps: [
      "In <b>Stock</b>, tap <b>« Ajouter »</b> (add). Choose the category: the <b>item code</b> is suggested for you (LAI-001, LAI-002… for milks).",
      "Scan the item's <b>barcode</b> with the camera button in the field, or type it.",
      "Enter the selling price, the purchase price, the unit (piece, kg or litre), the opening stock and the alert level.",
      "Also selling wholesale? Under <b>« Emballages »</b> (packs), tap <b>« Ajouter un paquet ou un carton »</b>: how many units it holds, its price and its own barcode.",
      "Pharmacy or groceries? Turn on <b>« Suivre les dates de péremption »</b> (track expiry dates): a date is recorded with each delivery, and the app warns you 30 days before (Home, and Stock → <b>Péremption</b>).",
      "Phones? Turn on <b>« Numéro de série / IMEI »</b> and enter the <b>warranty</b> in months: each device received is recorded by its IMEI.",
    ],
    shot: { name: "man-fiche", alt: "Coca-Cola item card with a pack of 24", caption: "The pack of 24 has its own price and barcode. Stock is still counted in bottles." },
    tip: {
      title: "All bottles share the same code",
      text: "The barcode identifies the product, not the bottle: one scan is enough to find it. The pack carries a different code.",
    },
  },
  {
    id: "delivery",
    kicker: "Deliveries",
    title: "Receive goods in three moves",
    lead: "The supplier delivers 3 packs of Coke? No need to count 72 bottles.",
    steps: [
      "In <b>Stock</b>, scan the barcode <b>of the pack</b>.",
      "The <b>Mouvement</b> window opens on <b>« Réappro »</b> (restock), counted in <b>« Paquet de 24 »</b>.",
      "Type <b>3</b>: the app shows « 3 × 24 = 72 unités » and the resulting stock. Tap <b>« Enregistrer le mouvement »</b>.",
    ],
    shot: { name: "man-reception", alt: "Restocking 3 packs of 24", caption: "Breakage, gifts and corrections are done in the same window." },
    tip: { title: "Everything is tracked", text: "Every entry and exit is recorded in the item's « Historique » (history) tab, with the person's name and the time." },
  },
  {
    id: "open",
    kicker: "In the morning",
    title: "Open the day",
    lead: "Before the first sale, record the money put in the drawer to give change: in the evening, vitePOS will know what should be there.",
    steps: [
      "Go to <b>Plus → Journée de caisse</b> (till day).",
      "Under <b>« Fond de caisse »</b> (float), enter the amounts in FC, $ and, if needed, €.",
      "Tap <b>« Enregistrer le fond de caisse »</b>.",
    ],
    shot: { name: "man-journee", alt: "Till day: money expected in the drawer", caption: "« Argent dans le tiroir » (money in the drawer) updates with every sale and expense." },
  },
  {
    id: "sell",
    kicker: "Selling",
    title: "Check out in seconds",
    lead: "Tap or scan the item, take payment in the customer's currency, hand over the receipt. Even without network.",
    steps: [
      "In <b>Caisse</b> (till), tap the item or scan it: with the camera (button to the right of the search) or a barcode scanner.",
      "An item also sold by the pack? The app asks <b>« À l'unité »</b> (single) or <b>« Paquet de 24 »</b>. Scanning the pack sells the pack straight away.",
      "Open the <b>cart</b>: adjust quantities, a % discount, a customer if you want to track their purchases. Tap <b>« Encaisser »</b> (checkout).",
      "Choose <b>Espèces</b> (cash) or <b>Mobile money</b>, then the currency: <b>Francs</b>, <b>Dollars</b> or <b>Euros</b>. Tap a suggested note or type the amount received.",
      "A phone tracked by IMEI? The app asks <b>which device</b>: scan the IMEI on the box or pick it from the list. The receipt prints the IMEI and the warranty end date.",
      "The app shows <b>« À rendre »</b> (change due). Tap <b>« Valider la vente »</b> (confirm the sale).",
    ],
    shot: { name: "man-encaisser", alt: "Checkout of 21,100 FC with a 25,000 FC note", caption: "The customer hands over 25,000 FC: 3,900 FC change." },
    figure: { value: "3,900 FC", text: "The change is worked out for you, even when the customer pays in dollars." },
  },
  {
    id: "receipt",
    kicker: "After the sale",
    title: "The receipt, printed or sent",
    lead: "Every sale has its receipt and number. The customer gets it on paper or on their phone.",
    steps: [
      "After <b>« Valider la vente »</b>, the receipt shows: <b>« Imprimer »</b> (print) on a receipt printer, or <b>« Partager (WhatsApp, SMS…) »</b> (share).",
      "The <b>« Envoyé »</b> (sent) badge means the sale reached the cloud; <b>« En attente d'envoi »</b> means it will go when the network is back.",
      "A mistake? The manager or owner taps <b>« Annuler la vente »</b> (cancel the sale) the same day, with a reason: the items go back into stock.",
    ],
    shot: { name: "tel-ticket", alt: "Sales receipt", caption: "« Nouvelle vente » (new sale) takes you back to the till." },
    warn: {
      title: "A sale is never erased",
      text: "A cancelled sale stays visible, marked « annulée », with who cancelled it and why. Nobody can make a sale disappear.",
    },
  },
  {
    id: "expenses",
    kicker: "Money going out",
    title: "Record every expense",
    lead: "The moto-taxi, phone credit, the sack of sugar bought in a hurry: every expense recorded is one less gap in the till at night.",
    steps: [
      "In <b>Plus → Dépenses</b> (expenses), tap <b>« Nouvelle dépense »</b>.",
      "Enter the <b>amount</b> and its currency, the <b>category</b> and, if you like, a detail.",
      "Keep <b>« Payée avec l'argent de la caisse »</b> (paid from the till) ticked if the money leaves the drawer. Untick it if the owner paid out of pocket.",
      "Tap <b>« Enregistrer »</b> (save).",
    ],
    shot: { name: "man-depense", alt: "New expense", caption: "An expense is corrected by cancelling it: it stays visible, crossed out." },
  },
  {
    id: "close",
    kicker: "In the evening",
    title: "Close the day with no surprises",
    lead: "vitePOS knows what should be in the drawer. You count, it compares: any gap stands out.",
    steps: [
      "In <b>Plus → Journée de caisse</b>, look at <b>« = Attendu »</b> (expected): float + cash taken − expenses paid from the till.",
      "Count the money in the drawer and enter it under <b>« Clôture »</b> (closing): <b>Compté en FC</b>, <b>en $</b>, <b>en €</b>.",
      "Add a note if needed, then tap <b>« Clôturer la journée »</b> (close the day).",
      "The summary shows <b>Attendu</b>, <b>Compté</b> and <b>Écart</b> (expected, counted, difference), and sales <b>« Par vendeur »</b> (per seller) below.",
    ],
    shot: { name: "man-cloture", alt: "Closing the till day", caption: "The day is closed by the manager or the owner." },
    tip: { title: "Mobile money apart", text: "Mobile money payments are not in the drawer: their total is shown separately, to check against the SMS received." },
  },
  {
    id: "stocktake",
    kicker: "Once a month",
    title: "Stocktaking, shelf by shelf",
    lead: "Count what is really on the shelves, see what is missing and what it costs, before correcting the stock.",
    steps: [
      "In <b>Plus → Inventaire</b> (stocktake), give it a name, choose the whole shop or one category, then <b>« Commencer »</b> (start).",
      "Scan or search each item and enter the quantity counted. Several people can count at the same time.",
      "Tap <b>« Vérifier et valider »</b>: the app shows the gaps and their value. <b>« Valider l'inventaire »</b> corrects the stock.",
    ],
    shot: { name: "man-inventaire", alt: "Stocktake screen", caption: "Sales made during the count are taken into account." },
  },
  {
    id: "follow",
    kicker: "For the owner",
    title: "Your shop, even from afar",
    lead: "On your phone, wherever you are: what sold, what is running out, what you earned.",
    steps: [
      "<b>Accueil</b> (home): today's sales compared with yesterday, items to restock, the daily rate.",
      "<b>Ventes</b> (sales): every sale of the day, with its receipt. At the bottom, <b>Retrouver un appareil</b> (find a device): type or scan an IMEI to see the sale and whether the device is still under warranty.",
      "<b>Rapports</b> (reports): at the top, <b>sales and expenses over the last six months</b>: a blue bar for sales, an orange one for expenses, month by month. Below, the detail for the day, week or month: revenue, average basket, gross margin, best sellers.",
    ],
    shot: { name: "man-rapports", alt: "Reports: sales and expenses over six months", caption: "Tap a month to see its sales and expenses." },
    figure: { value: "+1 %", text: "Every figure is compared with the previous period: you see straight away whether things are going up or down." },
  },
  {
    id: "offline",
    kicker: "No network",
    title: "Network down? Keep selling",
    lead: "Sales, stock, expenses: everything is saved on the phone, then goes online by itself when the network returns.",
    steps: [
      "Tap your <b>badge</b> (your initials, top right): <b>« En ligne, tout est envoyé »</b> (online, all sent), <b>« Hors ligne »</b> (offline) or <b>« Envoi en cours »</b> (sending) with the number of entries waiting.",
      "Two tills offline at the same time? Their sales add up without overwriting each other.",
      "You only need the network to create an account, join a shop and manage the team.",
    ],
    warn: {
      title: "Do not log out with sales waiting",
      text: "While entries have not been sent, stay logged in: the app warns you if you try to log out.",
    },
  },
];
