/**
 * English texts for the site, manual and brochure. Same shape as `fr.ts` (type `Dict`).
 * The app itself is in French: buttons quoted from it stay in French.
 */
import type { ComicRow, Dict } from "./fr";
import { chapters } from "../data/manual.en";

export const en: Dict = {
  locale: "en",
  langName: "English",
  switchLabel: "FR",
  switchTitle: "Lire en français",
  skip: "Skip to content",

  header: {
    nav: [
      { id: "features", label: "Features" },
      { id: "devices", label: "Devices" },
      { id: "audiences", label: "Who it's for" },
      { id: "offline", label: "Offline" },
      { id: "pricing", label: "Pricing" },
      { id: "faq", label: "FAQ" },
      { id: "contact", label: "Contact" },
    ],
    manual: "Manual",
    equipment: "Equipment",
    login: "Sign in",
    signup: "Try it free",
    menu: "Open menu",
    close: "Close menu",
  },

  footer: {
    tagline: "A fast point of sale that works offline, made in Kinshasa.",
    manual: "User manual",
    equipment: "vitePOS equipment",
    brochure: "Brochure (PDF)",
    terms: "Terms of use",
    privacy: "Privacy",
    product: "Product",
    legal: "Information",
    app: "App",
    login: "Log in",
    signup: "Create my account",
    contact: "Contact us",
    whatsapp: "WhatsApp",
    community: "Follow us",
    call: "Call",
    credits: "Photo credits",
    creditsText: "Free-licence photos from Wikimedia Commons, cropped:",
  },

  home: {
    ids: { gallery: "preview", features: "features", devices: "devices", audiences: "who-its-for", offline: "offline", pricing: "pricing", faq: "faq", contact: "contact" },
    title: "vitePOS · Sell faster. Lose less. Sleep easy.",
    description:
      "vitePOS: the till on your phone. Take payment in FC, $ or €, while stock and profit are worked out as you sell. Free to start.",
    eyebrow: "Till · Stock · Sales",
    h1: ["Sell faster.", "Lose less.", "Sleep easy."],
    lead: "vitePOS records every sale on your phone. You see what you sold, what is left in stock and what should be in the till. Even when you are not at the store.",
    ctaStart: "Start for free",
    ctaBrochure: "Download the brochure",
    ctaSee: "See the app",
    video: { button: "See how it works", length: "43 s, in French", title: "vitePOS in 43 seconds", close: "Close the video" },
    ctaStartShort: "Start free",
    brochureLink: "Brochure (PDF)",
    ticks: ["Free trial", "Your phone is enough", "We set it up for you", "FC and $ at today's rate"],
    altHome: "vitePOS home screen: today's sales and stock alerts",
    altCaisse: "The vitePOS till with a cart in progress",

    devicesTitle: "One till, on all your devices",
    devicesLead: "Phone, tablet, computer or POS terminal: vitePOS runs on the device you already have. And everything stays in sync: a sale made at the counter shows up instantly on the other screens.",
    deviceCards: [
      { name: "Phone", systems: "Android · iPhone", text: "To sell anywhere and follow your business from afar." },
      { name: "Tablet", systems: "Android · iPad", text: "Perfect at the counter: items on the left, cart on the right." },
      { name: "Computer", systems: "Windows · Mac", text: "For management, stock and reports." },
      { name: "POS terminal", systems: "Android with Chrome", text: "For fixed tills, with printer and scanner." },
    ],
    sync: {
      sale: "Sale completed",
      amount: "21,100 FC",
      laptopToast: "Today's sales · 944,450 FC",
      phoneToast: "New sale · Grâce",
    },
    syncTitle: "And everything stays in sync",
    compatTitle: "Compatible accessories",
    compatShop: "See vitePOS equipment",
    compatHardware: ["USB or Bluetooth barcode scanner", "58 or 80 mm receipt printer", "Phone camera for scanning"],
    shots: {
      tabletteCaisse: { alt: "The till on a tablet: items on the left, cart on the right", title: "Till on a tablet", text: "Items on the left, cart on the right: perfect at the counter." },
      ordiJournee: { alt: "The till day: money expected in the drawer in FC, $ and €", title: "Till day", text: "The money expected in the drawer in FC, $ and €, then closing." },
      telTicket: { alt: "A sales receipt with the change given", title: "The receipt", text: "Printed, or sent to the customer by WhatsApp." },
      telStock: { alt: "Stock with its out-of-stock alerts", title: "Stock", text: "Search, categories, out-of-stock alerts." },
      telAccueil: { alt: "Today's sales compared with yesterday", title: "Your business from afar", text: "Today's sales compared with yesterday, wherever you are." },
      ordiVentes: { alt: "Today's sales, receipt by receipt", title: "Today's sales", text: "Every receipt, who sold it and how it was paid." },
      ordiStock: { alt: "Stock on a computer", title: "Stock on a computer", text: "The whole catalogue, prices and quantities." },
    },

    featuresTitle: "What vitePOS changes in your day",
    featuresLead: "Less arithmetic, fewer mistakes, fewer doubts. And more time to sell.",

    audiencesTitle: "For every line of business",
    audiencesLead: "vitePOS grows with your business.",

    hardwareTitle: "The hardware you already have is enough",
    hardwareLead: "Start with your phone, add hardware as your business grows.",
    hardware: [
      {
        title: "Devices",
        items: ["Android phone or iPhone", "Android tablet or iPad", "Windows or Mac computer", "Android POS terminal with Chrome"],
      },
      {
        title: "Receipts",
        items: [
          "58 or 80 mm USB receipt printer, with Chrome or Edge on a computer or tablet",
          "Printing from the phone's print window",
          "Receipt sent to the customer by WhatsApp or SMS",
        ],
      },
      {
        title: "Barcodes",
        items: [
          "USB or Bluetooth scanner: it types the code by itself",
          "Camera of the phone, tablet or computer",
          "EAN, UPC, ITF-14, Code 128, QR and DataMatrix codes",
        ],
      },
    ],
    hardwareNote: "Not sure about your hardware? Contact us before buying: we will tell you what works.",

    offlineTitle: "Network down? Keep selling.",
    offlineText: [
      "Every sale is kept on the device and sent as soon as the network returns. Even if two tills sell the same item without internet, the stock stays right.",
      "And if a phone is lost or broken, everything already sent is backed up online: sign in on another device and everything is there.",
    ],
    offlineStates: ["Offline · 3 sales waiting", "Network back · sending…", "Online, everything sent"],

    stepsTitle: "Ready in three steps",
    faqTitle: "Frequently asked questions",
    finalTitle: "Your till is ready in 5 minutes.",
    finalText: "Free to start.",
    finalCta: "Create my account",

    slides: [
      {
        tag: "Several tills",
        short: "Several tills",
        line: "Several tills at once, the stock updates itself.",
        title: "",
        text: "",
        pops: ["Sale completed · 21,100 FC", "Paid in $, change given · 900 FC", "Till 2 · 8 items · 14,500 FC", "Stock updated · Rice 1 kg: 38 left"],
      },
      {
        tag: "Pharmacies and drink depots",
        short: "Pharmacies",
        line: "An alert 30 days before expiry: no more products forgotten on the shelf.",
        title: "No more expired products forgotten on the shelf.",
        text: "Search by name or barcode, an alert 30 days before expiry, stocktaking by scanning the shelf.",
        pops: ["Alert · 2 batches expire within 30 days", "Sale · Paracetamol 500 mg · 2,500 FC", "Batch received, expires · 15/03/2027", "Stocktake · shelf 3 counted"],
      },
      {
        tag: "Phones and accessories",
        short: "Phones",
        line: "Every phone sold with its IMEI and warranty, every customer with their history.",
        title: "Confident customers who come back to buy.",
        text: "Every phone sold is recorded with its IMEI and warranty, and every customer keeps their purchase history. They come back? You find everything in a second.",
        pops: ["IMEI scanned · Galaxy A15", "Sale with 12-month warranty · 420,000 FC", "Customer found · Papa Jean, 3 purchases", "Receipt sent by WhatsApp"],
      },
      {
        tag: "Hardware and building supplies",
        short: "Hardware",
        line: "Thousands of items found in an instant, sold by the piece or by the carton.",
        title: "Thousands of items, found in an instant.",
        text: "Search by item code, sell by the piece, by the kilo or by the carton, with several sellers at once.",
        pops: ["Found · PVC pipe 32 mm", "Sale · 2 bags of cement · $40", "Sold by the carton · 4 boxes of screws", "Alert · Paint 20 L running low"],
      },
      {
        tag: "Traders and entrepreneurs",
        short: "Entrepreneurs",
        line: "Your sellers take payment, you follow every sale from your phone.",
        title: "Your business in your pocket.",
        text: "Your sellers take payment, you follow every sale live from your phone, wherever you are.",
        pops: ["Till opened by Grâce · 8:02", "Today's sales · 186,000 FC", "Best seller · Nido milk 400 g", "Till closed, difference · 0 FC"],
      },
    ],
    tape: [
      "Sale · 21,100 FC · 11 items",
      "Paid in $, change given · 900 FC",
      "Delivery · 3 cartons of milk",
      "Alert · Oil 1 L running low",
      "Closing · till exact to the franc",
      "Sale · 2 bags of cement · $40",
      "Offline · 3 sales sent when network returned",
      "Stocktake · drinks shelf counted",
    ],
    carousel: { label: "vitePOS overview", prev: "Previous slide", next: "Next slide", pause: "Pause", play: "Resume", goTo: "Go to slide", now: "just now" },

    whyEyebrow: "Why vitePOS",
    whyTitle: "Maman Ngalula's story",
    comic: {
      lead: "She runs a grocery store in Kinshasa and managed everything in a notebook. Her nephew suggested vitePOS: here is her life before, and after.",
      columns: { before: "Without vitePOS", after: "With vitePOS" },
      placeholder: "Drawing coming soon",
      rows: [
        {
          topic: "Stocktaking",
          problem: { art: 1, caption: "A whole Sunday", bubbles: [{ who: "Maman Ngalula", text: "A whole Sunday of counting… and we still have to redo the drinks shelf!", side: "left" }] },
          solution: { art: 4, caption: "Done before opening", bubbles: [{ who: "Grâce", text: "We scan the shelf together and the app shows what's missing. Already done!", side: "left" }] },
        },
        {
          topic: "Stock",
          problem: {
            art: 2,
            caption: "Out of stock, expired",
            bubbles: [
              { who: "A customer", text: "No more Nido milk?", side: "left" },
              { who: "Grâce", text: "It's run out… And those tins have expired.", side: "right" },
            ],
          },
          solution: { art: 5, caption: "Warned in time", bubbles: [{ who: "Grâce", text: "Only 6 tins of Nido left, and a batch expires in 30 days: we'll order today.", side: "right" }] },
        },
        {
          topic: "Keeping track",
          problem: { art: 7, caption: "Away from her business", bubbles: [{ who: "Maman Ngalula", text: "Grâce, how much did we sell today? Is there any rice left?", side: "left", tail: "right" }] },
          solution: {
            art: 6,
            caption: "Wherever she is",
            bubbles: [{ who: "Maman Ngalula", text: "Sales, profit, stock… I see it all from my phone. And my Sundays are mine again.", side: "right", tail: "left" }],
          },
        },
      ] as ComicRow[],
      spark: {
        art: 3,
        caption: "The spark",
        bubbles: [
          { who: "Patrick", text: "Auntie, try vitePOS: stock counts itself. And it's free to start.", side: "left" },
          { who: "Maman Ngalula", text: "Really? How does it work? Show me!", side: "right" },
        ],
      },
      result: {
        art: 8,
        caption: "One week later",
        title: "One week later…",
        text: "Grâce and Maman Ngalula would never go back to the notebook. Here is what changed.",
        bubbles: [
          { who: "Maman Ngalula", text: "No more running out, and I see everything on my phone!", side: "left" },
          { who: "Grâce", text: "And no more Sundays lost counting!", side: "right" },
        ],
      },
      end: "Less time counting, more time selling.",
    },

    featuresEyebrow: "Features",
    devicesEyebrow: "Devices",
    audiencesEyebrow: "Who it's for",
    sectorsAll: "All sectors",
    galleryTitle: "Built for businesses in the DRC",
    galleryText: "From a small store to a big team, vitePOS fits the way people sell here: several currencies, network cuts, selling by the carton or by the piece.",
    hardwareEyebrow: "Hardware",
    offlineEyebrow: "Offline",
    stepsEyebrow: "Getting started",
    faqEyebrow: "Questions",
    faqLead: "Can't find your answer? The manual explains every screen step by step.",
    faqManual: "Read the manual",

    gallery: {
      eyebrow: "Preview",
      title: "See vitePOS before you try it",
      lead: "Real screens from the app, on phone, tablet and computer.",
      tabs: [
        { label: "Home", text: "Today's sales, stock alerts and the day's exchange rate as soon as you open it.", alt: "vitePOS home screen on a phone" },
        { label: "Till", text: "Tap or scan items, take payment in FC, $ or €, the change is worked out.", alt: "The vitePOS till on a tablet" },
        { label: "Stock", text: "Every sale takes the item out of stock. Shortages and expiry dates are flagged.", alt: "The stock list on a computer" },
        { label: "Sales", text: "Every sale, by seller and by day, with the profit on each one.", alt: "Sales history on a computer" },
        { label: "Day", text: "Closing the till: what should be in the drawer, in cash and mobile money.", alt: "The day's summary on a computer" },
        { label: "Receipt", text: "The receipt is printed, or sent to the customer on WhatsApp.", alt: "A sales receipt on a phone" },
      ],
    },

    receipt: {
      eyebrow: "New",
      title: "A receipt that carries your brand",
      lead: "Every sale gives a clear receipt in your name: your customer knows what they paid and where to find you again.",
      points: [
        { title: "Your logo on top", text: "Add it from a photo: vitePOS prepares it for the printer." },
        { title: "Your details", text: "Address, phone, RCCM, national ID, tax number." },
        { title: "Your QR code", text: "To your WhatsApp, Facebook or TikTok: customers find you again." },
        { title: "A barcode on every receipt", text: "To find the sale in an instant." },
      ],
      printers: "58 and 80 mm thermal printers, over Bluetooth or USB.",
      alt: "vitePOS receipt with logo, details, barcode and QR code",
    },

    pricing: {
      eyebrow: "Pricing",
      title: "Pay by the number of phones",
      lead: "Our prices are right here: no quotes, no surprises. Free trial: the bigger your plan, the longer the trial. After that, pay by mobile money, monthly or yearly (2 months free).",
      cta: "Start for free",
      more: { title: "Custom", text: "More than 10 phones or several stores: priced on request, 30-day trial." },
      safe: "If you don't pay at the end of the trial, nothing is deleted: your sales and stock stay available to view.",
    },

    contact: {
      eyebrow: "Contact",
      title: "A question? Write to us",
      lead: "Our team in Kinshasa answers on WhatsApp: questions, help getting started, a demo in your business.",
      whatsapp: { title: "WhatsApp", text: "The fastest way. Write to us, even just “hello”.", cta: "Write on WhatsApp", message: "Hello, I have a question about vitePOS." },
      call: { title: "Phone", cta: "Call" },
      email: { title: "Email", cta: "Send an email" },
      demo: { title: "A demo at your place", text: "We come to your business to set everything up and show you how to sell.", cta: "Ask for a demo", message: "Hello, I would like a vitePOS demo in my business." },
      city: "Kinshasa, Democratic Republic of the Congo",
    },

    install: {
      eyebrow: "Install",
      ask: "Ask for setup",
      askMessage: "Hello, I would like you to come and set up vitePOS for me.",
      title: "We can set it up for you",
      lead: "Our team can come to you to install everything and show you how to sell.",
      yours: "Your device",
      open: "Open vitePOS",
      scan: "Or scan with your phone",
      qrAlt: "QR code to open vitePOS",
      devices: [
        { name: "Android", where: "Chrome", steps: ["Open app.viteposrdc.com in Chrome", "Tap the three dots at the top, then “Install app”", "The vitePOS icon appears on your home screen"] },
        { name: "iPhone and iPad", where: "Safari or Chrome", steps: ["Open app.viteposrdc.com in Safari or Chrome", "Tap the Share button", "Choose “Add to Home Screen”"] },
        { name: "Computer", where: "Chrome or Edge", steps: ["Open app.viteposrdc.com", "Click the install icon in the address bar", "vitePOS opens in its own window"] },
      ],
    },
  },

  strengths: [
    { title: "FC, $ and €", text: "at the daily rate, exact change" },
    { title: "Offline", text: "keep selling when the network drops" },
    { title: "Several tills", text: "your staff sell at the same time" },
  ],

  promises: [
    {
      title: "No more notebook.",
      text: "vitePOS replaces the cash book: faster to sell, impossible to “forget”, and readable from your phone.",
    },
    {
      title: "Not a franc lost.",
      text: "Every sale is recorded, stock counts itself, and in the evening you know exactly what should be in the till.",
    },
    {
      title: "Your business in your pocket.",
      text: "Your sellers take payment, you see every sale and every missing item live, even when you are away.",
    },
  ],

  features: [
    { icon: "bolt", title: "No more waiting customers", text: "Tap or scan the items. The customer pays in FC, $ or mobile money, and vitePOS works out the change." },
    { icon: "package", title: "You know what to restock", text: "Every sale takes the item out of stock. vitePOS warns you before it runs out." },
    { icon: "receipt", title: "Customers who trust you", text: "They get a clear receipt with your name, printed or sent by WhatsApp. They know what they paid, and they come back." },
    { icon: "users", title: "Trust your staff, check whenever you like", text: "Each seller has their own account. A sale cannot be erased, and sellers never see your purchase prices." },
    { icon: "chartBar", title: "You know what really pays", text: "Your best sellers, your most profitable items, your expenses: what you need to decide what to buy and at what price." },
    { icon: "lock", title: "The till adds up, or you know why", text: "In the evening, vitePOS tells you what should be in the drawer, in FC and $. If something is missing, you see it straight away." },
    { icon: "clipboardCheck", title: "Stocktaking in a morning, not a whole Sunday", text: "Scan the shelf, several people at once. vitePOS shows what is missing and what it is worth." },
    { icon: "fileImport", title: "Your products already in the till", text: "Have a list in Excel? We add it in one go, even thousands of items. If not, we do it with you." },
  ],

  audiences: [
    { title: "Neighbourhood businesses", text: "Grocery, cosmetics, phones, bakeries. A simple till on the owner's or the seller's phone." },
    { title: "Hardware, wholesale and spare parts", text: "Large catalogues, search by item code, sales by the piece, kilo, litre or carton, several sellers." },
    { title: "Pharmacies and drinks depots", text: "Quick search by name or barcode, sales by the crate or carton, out-of-stock alerts, regular stocktaking." },
    { title: "Stores with several tills", text: "Several tills selling at the same time, daily closing, reports for the manager and the owner." },
  ],

  equipment: {
    title: "vitePOS equipment: printers, scanners, cash drawers",
    description: "Equipment that works with vitePOS: receipt printers, barcode scanners, cash drawers, tablets and paper. Price on request, order on WhatsApp.",
    eyebrow: "Equipment",
    h1: "The equipment to sell with ease",
    lead: "Everything that goes with vitePOS, already tested by our team. Message us on WhatsApp: we give you the price and arrange how to get it to you.",
    price: "Price on request",
    order: "Order",
    orderLabel: "Order on WhatsApp:",
    message: "Hello, I would like to order: {item}. What is the price?",
    popular: "Most requested",
    items: [
      { id: "pack", icon: "pack", name: "Complete checkout pack", text: "Tablet with stand, receipt printer, barcode scanner and cash drawer. We set it up for you and show you how to sell.", featured: true },
      { id: "printer58", icon: "printer", name: "58 mm Bluetooth receipt printer", text: "Small and wireless: it prints the receipt from the phone, even without network." },
      { id: "printer80", icon: "printer", name: "80 mm receipt printer", text: "For the counter: wider receipts, plugged into the computer or the tablet." },
      { id: "scanner", icon: "barcode", name: "Barcode scanner", text: "Beep! The product is in the cart, no typing. USB or Bluetooth." },
      { id: "drawer", icon: "drawer", name: "Cash drawer", text: "Opens by itself at every sale, plugged into the 80 mm printer." },
      { id: "tablet", icon: "tablet", name: "Tablet with stand", text: "A big screen on the counter, ready to take payments." },
      { id: "paper", icon: "paper", name: "Thermal paper rolls", text: "58 mm and 80 mm, single rolls or by the box." },
    ],
    already: { title: "Already have equipment?", text: "vitePOS also works with most USB or Bluetooth receipt printers and barcode scanners. Send us the brand on WhatsApp and we'll tell you if it works." },
    alreadyMessage: "Hello, I already have equipment. Does it work with vitePOS? Here is the brand: ",
    ask: "Ask a question",
  },

  community: {
    title: "Follow vitePOS on Instagram and Facebook",
    description: "Support vitePOS: follow us on Instagram and Facebook and share vitePOS with people around you.",
    h1: "Follow vitePOS",
    lead: "Support us by following and sharing vitePOS with people around you. It gives us the strength to keep going.",
    instagram: { label: "Instagram" },
    facebook: { label: "Facebook" },
    app: "Try the app for free",
    qrTitle: "Follow us",
    qrAlt: "QR code to follow vitePOS on Instagram and Facebook",
  },

  plans: {
    popular: "Most popular",
    per: "per month",
    list: [
      {
        name: "Solo",
        phones: "1 phone",
        price: "$5",
        yearly: "or $50/year",
        trial: "7 days free",
        note: "You sell on your own",
        featured: false,
        features: ["Checkout in cash ($, €, FC) and mobile money", "Stock, alerts and Excel import", "Sales, customers and expenses", "Day closing and reports"],
      },
      {
        name: "Équipe (Team)",
        phones: "Up to 3 phones",
        price: "$13.99",
        yearly: "or $139.90/year",
        trial: "14 days free",
        note: "You and your sellers",
        featured: false,
        features: ["Everything in Solo", "You and two employees", "Each sale under the seller's name", "Permissions set for each employee"],
      },
      {
        name: "Pro",
        phones: "Up to 10 phones",
        price: "$20.99",
        yearly: "or $209.90/year",
        trial: "21 days free",
        note: "A team, several tills",
        featured: true,
        features: ["Everything in Équipe", "Up to 10 accounts", "Free setup and training", "Priority help on WhatsApp"],
      },
    ],
    custom: { name: "Custom", phones: "Several stores or special needs", trial: "30 days free", price: "On request" },
  },

  sectors: [
    "Grocery stores",
    "Cosmetics and fashion",
    "Hardware and building materials",
    "Pharmacies and parapharmacies",
    "Drinks depots",
    "Wholesale and semi-wholesale",
    "Bakeries and pastry shops",
    "Cosmetics",
    "Car and motorbike spare parts",
    "Phones and accessories",
  ],

  cities: "In Kinshasa, Lubumbashi, Kolwezi, Matadi and across the DRC.",

  steps: [
    { title: "Create your account", text: "With your e-mail or Google account, from your phone's browser." },
    { title: "Add your products", text: "One by one, by scanning, or all at once from an Excel file." },
    { title: "Sell", text: "Invite your sellers with a code and follow everything from your phone." },
  ],

  faqs: [
    {
      q: "How much does it cost?",
      a: "It depends on the number of phones: Solo $5 per month (1 phone), Équipe $13.99 (up to 3), Pro $20.99 (up to 10), Custom beyond that. The trial is free: 7, 14, 21 or 30 days depending on the plan, with every feature. Pay yearly and get 2 months free. Payment by mobile money. Without payment, your data stays viewable and exportable: nothing is deleted.",
    },
    {
      q: "Do I need to buy hardware?",
      a: "No. An Android phone or an iPhone is enough. A tablet, a computer, a barcode scanner or a receipt printer can be added if you wish.",
    },
    {
      q: "Does it work without internet?",
      a: "Yes. Sales, stock and expenses work without network. You only need internet to create your account.",
    },
    {
      q: "How do I install it?",
      a: "Nothing to download from a store. Open app.viteposrdc.com on your phone. On Android (Chrome): tap « Installer » in the app, or the ⋮ menu then “Install app”. On iPhone (Safari): tap Share, then “Add to Home Screen”. vitePOS then opens from its icon, full screen, even without internet.",
    },
    {
      q: "Can I sell in francs, dollars and euros?",
      a: "Yes. The owner sets the daily rate, your prices stay in the currency of your choice, and the customer pays in francs, dollars, euros or mobile money. The change is worked out for you.",
    },
    {
      q: "Is the app in English?",
      a: "The app is in French for now; this site, the manual and the brochure are available in English. The manual gives the meaning of every French button.",
    },
    {
      q: "Is my data safe?",
      a: "Each business is kept separate from the others and backed up online. Each employee has their own account and only sees what you allow.",
    },
  ],

  legal: {
    updated: "Updated on",
    missing: "to be completed",
  },

  manual: {
    title: "Your business journal · vitePOS manual",
    description:
      "The vitePOS manual, step by step: create your account, set up stock, sell in FC, $ or €, close the day and follow your figures.",
    masthead: "Your business journal",
    edition: "2026 edition",
    h1: ["vitePOS,", "the user guide"],
    lead: "Everything you need to run the till, the stock and the books of your business, from morning to night.",
    teasers: [
      [7, "Receive goods in seconds"],
      [10, "Take payment in FC, $ or €, the change worked out for you"],
      [15, "Close the day with no surprises"],
    ],
    download: "Download the PDF",
    altCover: "The vitePOS till",
    toc: "In this issue",
    tip: "Tip",
    warn: "Watch out",
    note: "The app is in French: button names are shown as they appear on screen « … », with their meaning in brackets.",
    backMasthead: "End of issue",
    backTitle: "Now it's your turn to sell.",
    backText: "A question? Message us on WhatsApp at +243 839 892 822: we reply, and we can come to you. To go faster, send your business name, a screenshot and what you were doing.",
    backOpen: "Open",
    backOpenEnd: "on your phone.",
    backCta: "Open vitePOS",
    chapters,
  },

  /** A4 trifold leaflet: same texts as the brochure, with more illustrations. */
  trifold: {
    title: "vitePOS leaflet",
    description: "The vitePOS leaflet, to print on a double-sided A4 sheet and fold in three.",
    download: "Download the leaflet (PDF)",
    screenNote: "One double-sided A4 sheet, folded in three. When printing: double-sided, flip on the short edge.",
    outsideLabel: "Outside (cover on the right)",
    insideLabel: "Inside",
    devices: ["Phone", "Tablet", "Computer", "Receipt printer"],
  },

  brochure: {
    title: "vitePOS brochure",
    description: "The vitePOS brochure, to print or share: the till for your business, on the phone you already have.",
    download: "Download the brochure (PDF)",
    printDownload: "Print version (2 pages per side, A4)",
    screenNote: "4 pages to send by WhatsApp. To print it: use the print version, at actual size, on A4, double-sided (flip on short edge), then fold the sheet in half.",
    altHome: "vitePOS home screen",
    altCaisse: "The vitePOS till",
    signature: "Your business, in plain view",
    sticker: ["Free", "trial"],
    lead: "Your business's till, on the phone you already have. You sell, vitePOS keeps count.",
    storyTitle: "No more recounting in the evening",
    before: { label: "Before", text: "In the evening, you recount the notebook, the cash and the stock. And something is always missing, without knowing where.", alt: "A store owner and her assistant, lost in the cash notebook" },
    after: { label: "With vitePOS", text: "Every sale is recorded the moment you take payment. In the evening, you know what should be in the till.", alt: "The store owner and her assistant, happy with their day" },
    howTitle: "A sale in 3 moves",
    how: [
      { title: "Tap or scan the item", text: "With the phone's camera or a barcode scanner." },
      { title: "Take payment", text: "In FC, $, € or mobile money." },
      { title: "Hand over the receipt", text: "Printed or sent by WhatsApp; stock is updated in real time." },
    ],
    benefitsTitle: "What you gain",
    benefits: [
      { title: "No more change mistakes", text: "Customers pay in FC, $ or €: vitePOS works out the change, at the daily rate you set." },
      { title: "A business people trust", text: "Every customer gets a receipt with your name, logo and contact details, printed or sent by WhatsApp." },
      { title: "You know what to restock", text: "vitePOS warns you when a product is running low, and 30 days before a batch expires." },
      { title: "Trust, and check", text: "Each seller has their own account: you know who sold what. A cancelled sale stays visible, with its reason." },
      { title: "The evening till, no maths", text: "vitePOS tells you what should be in the drawer. You count, and any gap stands out." },
      { title: "Your business, wherever you are", text: "The day's sales, expenses and profit on your phone, even far from the store." },
    ],
    priceTitle: "Pay by your phones",
    proPoints: ["A team, several tills", "Free setup and training", "Priority help on WhatsApp"],
    otherPlans: "Other plans",
    ctaTitle: "Try vitePOS for free",
    ctaText: "Your phone is enough · ready in 5 minutes · we set it up for you",
    qrLabel: "Scan to get started",
    priceLine: ["Then less than", "$1.25", "a week ($5 a month)"],
    contactTitle: "We come to you",
    contactText: "We come to you to set everything up, add your products and train your sellers.",
    phoneLabel: "WhatsApp and calls",
    emailLabel: "Email",
    siteLabel: "Website",
  },
};

