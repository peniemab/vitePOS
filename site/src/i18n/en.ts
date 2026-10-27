/**
 * English texts for the site, manual and brochure. Same shape as `fr.ts` (type `Dict`).
 * The app itself is in French: buttons quoted from it stay in French.
 */
import type { Dict } from "./fr";
import { chapters } from "../data/manual.en";

export const en: Dict = {
  locale: "en",
  langName: "English",
  switchLabel: "FR",
  switchTitle: "Lire en français",

  header: {
    nav: [
      { id: "features", label: "Features" },
      { id: "devices", label: "Devices" },
      { id: "audiences", label: "Who it's for" },
      { id: "offline", label: "Offline" },
      { id: "faq", label: "FAQ" },
    ],
    manual: "Manual",
    login: "Sign in",
    signup: "Try it free",
    menu: "Open menu",
    close: "Close menu",
  },

  footer: {
    tagline: "A fast point of sale that works offline, made in Kinshasa.",
    manual: "User manual",
    brochure: "Brochure (PDF)",
    terms: "Terms of use",
    privacy: "Privacy",
    product: "Product",
    legal: "Information",
    app: "App",
    login: "Log in",
    signup: "Create my shop",
    credits: "Photo credits",
    creditsText: "Free-licence photos from Wikimedia Commons, cropped:",
  },

  home: {
    ids: { features: "features", devices: "devices", audiences: "who-its-for", offline: "offline", faq: "faq" },
    title: "vitePOS · Sell faster. Lose less. Even offline.",
    description:
      "vitePOS: the till on your phone. Take payment in FC, $ or €, while stock and profit are worked out as you sell, even without network. Free to start.",
    eyebrow: "Till · Stock · Sales",
    h1: ["Sell faster.", "Lose less.", "Even offline."],
    lead: "Sales, expenses, profit: everything is worked out while you sell. No more mental arithmetic at closing time.",
    ctaStart: "Start for free",
    ctaBrochure: "Download the brochure",
    ticks: ["Free to start", "No hardware to buy", "Ready in 5 minutes"],
    altHome: "vitePOS home screen: today's sales and stock alerts",
    altCaisse: "The vitePOS till with a cart in progress",

    devicesTitle: "One till, on all your devices",
    devicesLead:
      "The real vitePOS screens. Phone, tablet, computer or POS terminal: it runs wherever there is a recent browser, and everything stays in sync.",
    shots: {
      tabletteCaisse: { alt: "The till on a tablet: items on the left, cart on the right", title: "Till on a tablet", text: "Items on the left, cart on the right: perfect at the counter." },
      ordiJournee: { alt: "The till day: money expected in the drawer in FC, $ and €", title: "Till day", text: "The money expected in the drawer in FC, $ and €, then closing." },
      telTicket: { alt: "A sales receipt with the change given", title: "The receipt", text: "Printed, or sent to the customer by WhatsApp." },
      telStock: { alt: "Stock with its out-of-stock alerts", title: "Stock", text: "Search, categories, out-of-stock alerts." },
      telAccueil: { alt: "Today's sales compared with yesterday", title: "Your shop from afar", text: "Today's sales compared with yesterday, wherever you are." },
      ordiVentes: { alt: "Today's sales, receipt by receipt", title: "Today's sales", text: "Every receipt, who sold it and how it was paid." },
      ordiStock: { alt: "Stock on a computer", title: "Stock on a computer", text: "The whole catalogue, prices and quantities." },
    },

    featuresTitle: "Run your shop like a supermarket",
    featuresLead:
      "The till that takes payment in seconds, in FC, $ or €, and counts your stock for you. Supermarket tools, as simple as a calculator.",

    audiencesTitle: "For every line of business",
    audiencesLead: "vitePOS grows with your business, in Kinshasa, Lubumbashi, Kolwezi, Matadi and across the DRC.",

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
      "And if a phone is lost or broken, everything already sent is backed up online: sign in on another device and your shop is there.",
    ],
    offlineStates: ["Offline · 3 sales waiting", "Network back · sending…", "Online, everything sent"],

    stepsTitle: "Ready in three steps",
    faqTitle: "Frequently asked questions",
    finalTitle: "Your till is ready in 5 minutes.",
    finalText: "Free to start, no credit card.",
    finalCta: "Create my shop",

    slides: [
      {
        tag: "Supermarkets and convenience stores",
        title: "",
        text: "",
        pops: ["Sale completed · 21,100 FC", "Paid in $, change given · 900 FC", "Till 2 · 8 items · 14,500 FC", "Stock updated · Rice 1 kg: 38 left"],
      },
      {
        tag: "Pharmacies and drink depots",
        title: "No more expired products forgotten on the shelf.",
        text: "Search by name or barcode, an alert 30 days before expiry, stocktaking by scanning the shelf.",
        pops: ["Alert · 2 batches expire within 30 days", "Sale · Paracetamol 500 mg · 2,500 FC", "Batch received, expires · 15/03/2027", "Stocktake · shelf 3 counted"],
      },
      {
        tag: "Phones and accessories",
        title: "Confident customers who come back to buy.",
        text: "Every phone sold is recorded with its IMEI and warranty, and every customer keeps their purchase history. They come back? You find everything in a second.",
        pops: ["IMEI scanned · Galaxy A15", "Sale with 12-month warranty · 420,000 FC", "Customer found · Papa Jean, 3 purchases", "Receipt sent by WhatsApp"],
      },
      {
        tag: "Hardware and building supplies",
        title: "Thousands of items, found in an instant.",
        text: "Search by item code, sell by the piece, by the kilo or by the carton, with several sellers at once.",
        pops: ["Found · PVC pipe 32 mm", "Sale · 2 bags of cement · $40", "Sold by the carton · 4 boxes of screws", "Alert · Paint 20 L running low"],
      },
      {
        tag: "Traders and entrepreneurs",
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
      lead: "She runs a grocery shop in Kinshasa and managed her stock and till in a notebook. Until the day…",
      chapters: { before: "Before", spark: "The spark", after: "With vitePOS" },
      placeholder: "Drawing coming soon",
      panels: [
        {
          chapter: "before",
          caption: "A Sunday of stocktaking",
          bubbles: [{ who: "Maman Ngalula", text: "A whole Sunday of counting… and we still have to redo the drinks shelf!", side: "left" }],
        },
        {
          chapter: "before",
          caption: "In the middle of the week",
          bubbles: [
            { who: "A customer", text: "No more Nido milk?", side: "left" },
            { who: "Grâce", text: "It's run out… And those tins have expired, we hadn't noticed.", side: "right" },
          ],
        },
        {
          chapter: "spark",
          caption: "One evening",
          bubbles: [{ who: "Patrick", text: "Auntie, with vitePOS stock counts itself with every sale. And the app warns you before you run out.", side: "left" }],
        },
        {
          chapter: "after",
          caption: "Stocktaking",
          bubbles: [{ who: "Grâce", text: "It used to take all Sunday. Now we scan the shelf together: done before opening!", side: "left" }],
        },
        {
          chapter: "after",
          caption: "Stock",
          bubbles: [{ who: "Grâce", text: "Alert: only 6 tins of Nido left, and a batch expires in 30 days. We'll order today.", side: "right" }],
        },
        {
          chapter: "after",
          caption: "Evening, wherever she is",
          bubbles: [{ who: "Maman Ngalula", text: "Sales, profit, best seller… I see it all from my phone. And my Sundays are mine again.", side: "right", tail: "left" }],
        },
      ] as { chapter: "before" | "spark" | "after"; caption: string; bubbles: { who: string; text: string; side: "left" | "right"; tail?: "left" | "right" }[] }[],
      end: "Less time counting, more time selling.",
    },

    featuresEyebrow: "Features",
    devicesEyebrow: "Devices",
    audiencesEyebrow: "Who it's for",
    sectorsAll: "All sectors",
    galleryTitle: "Built for businesses in the DRC",
    galleryText: "From small shops to supermarkets, vitePOS fits the way people sell here: several currencies, network cuts, selling by the carton or by the piece.",
    hardwareEyebrow: "Hardware",
    offlineEyebrow: "Offline",
    stepsEyebrow: "Getting started",
    faqEyebrow: "Questions",
    faqLead: "Can't find your answer? The manual explains every screen step by step.",
    faqManual: "Read the manual",
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
      title: "Your shop in your pocket.",
      text: "Your sellers take payment, you see every sale and every missing item live, even when you are away.",
    },
  ],

  features: [
    { icon: "bolt", title: "Fast checkout", text: "Tap or scan items, take payment in francs, dollars, euros or mobile money. The app works out the change." },
    { icon: "package", title: "Stock always right", text: "Every sale lowers the stock. You are warned before running out and every movement is tracked." },
    { icon: "receipt", title: "Receipts", text: "Print the receipt on a thermal printer or send it to the customer by WhatsApp." },
    { icon: "users", title: "Staff under control", text: "Each seller has their own account. Sellers never see your purchase prices or margins, and a sale cannot be erased." },
    { icon: "chartBar", title: "Clear reports", text: "Sales and expenses over the last six months, best sellers, margin: all from your phone." },
    { icon: "lock", title: "End of day, no surprises", text: "Closing compares the money in the drawer with what was expected, in francs and dollars. Gaps stand out." },
    { icon: "clipboardCheck", title: "Easy stocktaking", text: "Count a shelf by scanning, several people at once. The app shows what is missing and its value before correcting the stock." },
    { icon: "fileImport", title: "Import from Excel", text: "Already have a product list? Import it in one go, even with thousands of items." },
  ],

  audiences: [
    { title: "Shops", text: "Grocery, cosmetics, phones, bakeries. A simple till on the owner's or the seller's phone." },
    { title: "Hardware, wholesale and spare parts", text: "Large catalogues, search by item code, sales by the piece, kilo, litre or carton, several sellers." },
    { title: "Pharmacies and drinks depots", text: "Quick search by name or barcode, sales by the crate or carton, out-of-stock alerts, regular stocktaking." },
    { title: "Minimarkets and supermarkets", text: "Several tills selling at the same time, daily closing, reports for the manager and the owner." },
  ],

  sectors: [
    "Grocery and minimarkets",
    "Supermarkets",
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
      a: "vitePOS is free to start. When your business grows (more staff, several tills or shops), suitable plans are available: contact us.",
    },
    {
      q: "Do I need to buy hardware?",
      a: "No. An Android phone or an iPhone is enough. A tablet, a computer, a barcode scanner or a receipt printer can be added if you wish.",
    },
    {
      q: "Does it work without internet?",
      a: "Yes. Sales, stock and expenses work without network. You only need internet to create your account and your shop.",
    },
    {
      q: "How do I install it?",
      a: "Nothing to download from a store. Open getvitepos.web.app on your phone. On Android (Chrome): tap « Installer » in the app, or the ⋮ menu then “Install app”. On iPhone (Safari): tap Share, then “Add to Home Screen”. vitePOS then opens from its icon, full screen, even without internet.",
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
      a: "Each shop is kept separate from the others and backed up online. Each employee has their own account and only sees what you allow.",
    },
  ],

  legal: {
    updated: "Updated on",
    missing: "to be completed",
  },

  manual: {
    title: "Your shop's journal · vitePOS manual",
    description:
      "The vitePOS manual, step by step: create your shop, set up stock, sell in FC, $ or €, close the day and follow your figures, even offline.",
    masthead: "Your shop's journal",
    edition: "2026 edition",
    h1: ["vitePOS,", "the user guide"],
    lead: "Everything you need to run the till, the stock and the books of your shop, from morning to night, even when the network drops.",
    teasers: [
      [4, "Receive 3 packs without counting 72 bottles"],
      [6, "Take payment in FC, $ or € in seconds"],
      [9, "Close the day with no surprises"],
    ],
    download: "Download the PDF",
    altCover: "The vitePOS till",
    toc: "In this issue",
    tip: "Tip",
    warn: "Watch out",
    note: "The app is in French: button names are shown as they appear on screen « … », with their meaning in brackets.",
    backMasthead: "End of issue",
    backTitle: "Now it's your turn to sell.",
    backText: "A question? Show this page to your seller: everything is here, step by step.",
    backOpen: "Open",
    backOpenEnd: "on your phone.",
    backCta: "Open vitePOS",
    chapters,
  },

  brochure: {
    title: "vitePOS brochure",
    description: "The vitePOS brochure, to print or share: the till that sells faster, loses less and works even offline.",
    tag: "Till · Stock · Sales",
    lead: "Your shop's till, on your phone. Sales, expenses, profit: everything is worked out while you sell.",
    altHome: "vitePOS home screen",
    altCaisse: "The vitePOS till",
    ctaTitle: "Free to start",
    ctaText: "No hardware to buy · ready in 5 minutes · even offline",
    qrLabel: "Scan to open the app",
    featuresTitle: "Everything to run your business",
    sectorsTitle: "For every line of business",
    stepsTitle: "Ready in three steps",
    contactTitle: "Try vitePOS today",
    website: "Website:",
    download: "Download the brochure (PDF)",
    screenNote: "One double-sided A5 sheet, to print or send by WhatsApp.",
  },
};
