/**
 * Données d'exemple de l'aperçu : une boutique d'alimentation à Kinshasa, une semaine de ventes.
 * Tirage pseudo-aléatoire à graine fixe : les captures sont identiques d'une fois sur l'autre.
 */
import { Timestamp } from "./fake-firestore";
import { nextSku } from "../src/lib/products";

type Data = Record<string, unknown>;

/*
 * Pour des captures parlantes, l'aperçu se place un samedi en fin d'après-midi (semaine complète),
 * en mode clair. L'heure réelle n'est pas touchée en dehors de l'aperçu.
 */
if (typeof window !== "undefined" && !(globalThis as { __apercuDate?: boolean }).__apercuDate) {
  const RealDate = Date;
  const target = new RealDate(2026, 9, 17, 17, 40).getTime();
  const offset = target - RealDate.now();
  class ApercuDate extends RealDate {
    constructor(...args: ConstructorParameters<typeof Date> | []) {
      if (args.length === 0) super(RealDate.now() + offset);
      else super(...(args as ConstructorParameters<typeof Date>));
    }
    static now() {
      return RealDate.now() + offset;
    }
  }
  globalThis.Date = ApercuDate as DateConstructor;
  (globalThis as { __apercuDate?: boolean }).__apercuDate = true;
  if (!new URLSearchParams(window.location.search).has("sombre")) localStorage.setItem("mantine-color-scheme-value", "light");
  else localStorage.setItem("mantine-color-scheme-value", "dark");
}

const DAY = 86_400_000;
const B = "boutiques/b1";

function rng(seedValue: number) {
  let a = seedValue;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const dayKeyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ts = (ms: number) => Timestamp.fromMillis(ms);

const PRODUCTS: [string, string, number, number, number, number, boolean][] = [
  // nom, catégorie, prix de vente, prix d'achat, stock, seuil, favori
  ["Riz parfumé 1 kg", "Riz", 2800, 2200, 64, 10, true],
  ["Riz 25 kg", "Riz", 62000, 54000, 12, 3, false],
  ["Huile Mama 1 L", "Huile", 6500, 5300, 38, 8, true],
  ["Huile Mama 5 L", "Huile", 30000, 25500, 4, 3, false],
  ["Sucre 1 kg", "Alimentation", 3200, 2600, 45, 10, true],
  ["Farine de maïs 1 kg", "Alimentation", 2500, 1900, 52, 10, false],
  ["Lait Nido 400 g", "Lait", 12000, 9800, 18, 5, true],
  ["Spaghetti 500 g", "Alimentation", 2000, 1500, 70, 12, false],
  ["Sardines Mbisi", "Alimentation", 2500, 1900, 3, 6, false],
  ["Tomate concentrée", "Alimentation", 1000, 700, 90, 15, false],
  ["Sel 1 kg", "Alimentation", 800, 550, 40, 8, false],
  ["Coca-Cola 33 cl", "Boissons", 1000, 750, 120, 24, true],
  ["Fanta 33 cl", "Boissons", 1000, 750, 96, 24, false],
  ["Eau 1,5 L", "Boissons", 1500, 1100, 60, 12, true],
  ["Primus 72 cl", "Boissons", 3500, 2900, 48, 12, false],
  ["Jus Maracuja 1 L", "Boissons", 4500, 3600, 0, 4, false],
  ["Savon Monganga", "Hygiène", 1500, 1100, 80, 15, true],
  ["Dentifrice Signal", "Hygiène", 3500, 2700, 22, 6, false],
  ["Papier hygiénique ×4", "Hygiène", 4000, 3100, 30, 8, false],
  ["Lotion Movit", "Hygiène", 5500, 4300, 5, 5, false],
  ["Omo 500 g", "Ménager", 3000, 2300, 35, 8, false],
  ["Allumettes ×10", "Ménager", 1000, 650, 55, 10, false],
  ["Bougies ×6", "Ménager", 2000, 1500, 26, 6, false],
  ["Crédit Vodacom 1 $", "Téléphonie", 2850, 2750, 200, 20, false],
  ["Lait Nido 900 g", "Lait", 25000, 20500, 9, 3, false],
  ["Lait Peak en poudre 400 g", "Lait", 11000, 8900, 14, 4, false],
  ["Lait concentré Gloria", "Lait", 2500, 1900, 30, 6, false],
];

const MEMBERS = [
  { uid: "proprio", name: "Mama Ngalula", email: "mama.ngalula@exemple.cd", role: "proprietaire" },
  { uid: "joel", name: "Joël Kabeya", email: "joel.kabeya@exemple.cd", role: "gerant" },
  { uid: "grace", name: "Grâce Mbuyi", email: "grace.mbuyi@exemple.cd", role: "vendeur" },
];

const CLIENTS = [
  ["Papa Tshibanda", "0812 345 678"],
  ["Maman Nsimba", "0998 112 233"],
  ["Restaurant Chez Ya Mado", "0851 220 114"],
  ["Frère Patrick", "0821 908 776"],
  ["Mme Lukusa", "0970 456 321"],
  ["Hôtel Le Fleuve", "0815 600 900"],
];

/** Taux du jour de la boutique d'exemple. */
export const RATES = { USD: 2850, EUR: 3100 };

export function seed(): [string, Data][] {
  const out: [string, Data][] = [];
  const now = Date.now();
  const today = new Date();
  const rand = rng(42);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];

  out.push(["users/proprio", { email: MEMBERS[0].email, name: MEMBERS[0].name, boutiqueId: "b1" }]);
  out.push([
    B,
    {
      name: "Alimentation Mama Ngalula",
      currency: "CDF",
      inviteCode: "K7M2QX",
      ownerUid: "proprio",
      usdRateCdf: RATES.USD,
      usdRateUpdatedAt: ts(now - 3 * 3600_000),
      eurRateCdf: RATES.EUR,
      eurRateUpdatedAt: ts(now - 3 * 3600_000),
      paperWidthMm: 58,
      autoPrintTicket: false,
      plan: "pro",
      billingCycle: "mensuel",
      trialEndsAt: ts(now - 10 * DAY),
      paidUntil: ts(now + 50 * DAY),
      createdAt: ts(now - 40 * DAY),
    },
  ]);
  for (const m of MEMBERS)
    out.push([`${B}/members/${m.uid}`, { email: m.email, name: m.name, role: m.role, status: "active", permissions: {}, createdAt: ts(now - 39 * DAY) }]);

  const skus: string[] = [];
  PRODUCTS.forEach(([name, category, sellPrice, buyPrice, stock, alertThreshold, favorite], i) => {
    const id = `p${pad(i + 1)}`;
    const sku = nextSku(category, skus);
    skus.push(sku);
    out.push([
      `${B}/products/${id}`,
      {
        sku,
        name,
        category,
        sellPrice,
        unit: "u",
        stock,
        alertThreshold,
        // Le Coca porte son vrai code EAN-13, et son paquet de 24 a le sien.
        barcode: name.startsWith("Coca") ? "5449000000996" : `61${String(100000000 + i * 7919).slice(0, 9)}`,
        packs: name.startsWith("Coca") ? [{ id: "pq24", name: "Paquet", barcode: "15449000000993", units: 24, price: 22000 }] : [],
        favorite,
        archived: false,
        updatedAt: ts(now - DAY),
      },
    ]);
    out.push([`${B}/productCosts/${id}`, { buyPrice }]);
  });

  CLIENTS.forEach(([name, phone], i) =>
    out.push([`${B}/clients/c${i + 1}`, { name, phone, notes: "", purchaseCount: 0, totalSpent: 0, lastPurchaseAt: ts(now - i * DAY) }]),
  );

  // Ventes de la semaine en cours (du lundi à aujourd'hui) et de la semaine d'avant.
  const dow = (today.getDay() + 6) % 7;
  const perDay = [22, 26, 19, 31, 28, 38, 12];
  const clientStats = new Map<string, { count: number; total: number }>();
  let n = 0;
  for (let back = dow + 7; back >= 0; back--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
    const isToday = back === 0;
    const lastHour = isToday ? Math.max(9, Math.min(19, today.getHours())) : 19;
    const count = Math.round(perDay[(date.getDay() + 6) % 7] * (isToday ? Math.min(1, (lastHour - 7) / 12) : 1) * (back > dow ? 0.9 : 1));
    for (let k = 0; k < count; k++) {
      const hour = 8 + Math.floor(rand() * (lastHour - 8));
      const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, Math.floor(rand() * 60)).getTime();
      const lineCount = 1 + Math.floor(rand() * 4);
      const chosen = new Set<number>();
      while (chosen.size < lineCount) chosen.add(rand() < 0.55 ? pick([0, 2, 4, 6, 11, 13, 16]) : Math.floor(rand() * PRODUCTS.length));
      const lines = [...chosen].map((i) => {
        const [name, , unitPrice] = PRODUCTS[i];
        const quantity = 1 + Math.floor(rand() * (unitPrice < 3000 ? 4 : 2));
        return { productId: `p${pad(i + 1)}`, name, unit: "u", unitPrice, quantity, lineTotal: unitPrice * quantity };
      });
      const total = lines.reduce((s, l) => s + l.lineTotal, 0);
      const r = rand();
      const method = r < 0.18 ? "mobile_money" : "especes";
      const payCurrency = method === "especes" && r > 0.85 ? "USD" : "CDF";
      let payment: Data;
      if (payCurrency === "USD") {
        const due = Math.round((total / RATES.USD) * 100) / 100;
        const received = Math.ceil(due / 5) * 5;
        payment = { method, currency: "USD", rates: RATES, due, received, change: Math.round((received - due) * 100) / 100 };
      } else {
        const received = method === "especes" ? Math.ceil(total / 5000) * 5000 : total;
        payment = { method, currency: "CDF", rates: null, due: total, received, change: received - total };
      }
      const client = rand() < 0.2 ? Math.floor(rand() * CLIENTS.length) : -1;
      if (client >= 0) {
        const st = clientStats.get(`c${client + 1}`) ?? { count: 0, total: 0 };
        clientStats.set(`c${client + 1}`, { count: st.count + 1, total: st.total + total });
      }
      const seller = pick([MEMBERS[0], MEMBERS[2], MEMBERS[2], MEMBERS[1]]);
      out.push([
        `${B}/sales/v${String(++n).padStart(4, "0")}${Math.floor(rand() * 1e6).toString(36)}`,
        {
          uid: seller.uid,
          memberName: seller.name,
          lines,
          subtotal: total,
          discountPercent: 0,
          discount: 0,
          total,
          currency: "CDF",
          payment,
          clientId: client >= 0 ? `c${client + 1}` : "",
          clientName: client >= 0 ? CLIENTS[client][0] : "",
          status: rand() < 0.02 ? "annulee" : "validee",
          dayKey: dayKeyOf(date),
          createdAt: ts(at),
          clientAtMs: at,
        },
      ]);
    }
  }

  // Une vente « vitrine » pour la capture du ticket : client, plusieurs articles, monnaie rendue.
  const demoAt = now - 12 * 60_000;
  const demoLines = [
    { productId: "p01", name: "Riz parfumé 1 kg", unit: "u", unitPrice: 2800, quantity: 2, lineTotal: 5600 },
    { productId: "p07", name: "Lait Nido 400 g", unit: "u", unitPrice: 12000, quantity: 1, lineTotal: 12000 },
    { productId: "p17", name: "Savon Monganga", unit: "u", unitPrice: 1500, quantity: 3, lineTotal: 4500 },
    { productId: "p12", name: "Coca-Cola 33 cl", unit: "u", unitPrice: 1000, quantity: 6, lineTotal: 6000 },
  ];
  out.push([
    `${B}/sales/demoK7Q9M4`,
    {
      uid: "grace",
      memberName: "Grâce Mbuyi",
      lines: demoLines,
      subtotal: 28100,
      discountPercent: 0,
      discount: 0,
      total: 28100,
      currency: "CDF",
      payment: { method: "especes", currency: "CDF", rates: null, due: 28100, received: 30000, change: 1900 },
      clientId: "c2",
      clientName: "Maman Nsimba",
      status: "validee",
      dayKey: dayKeyOf(today),
      createdAt: ts(demoAt),
      clientAtMs: demoAt,
    },
  ]);

  for (const [id, st] of clientStats) {
    const i = out.findIndex(([p]) => p === `${B}/clients/${id}`);
    if (i >= 0) out[i] = [out[i][0], { ...out[i][1], purchaseCount: st.count, totalSpent: st.total }];
  }

  // Dépenses et fond de caisse du jour.
  const todayKey = dayKeyOf(today);
  const exp = (id: string, amount: number, category: string, description: string, minutesAgo: number) =>
    out.push([
      `${B}/expenses/${id}`,
      { amount, currency: "CDF", category, description, fromTill: true, status: "validee", memberName: "Joël Kabeya", dayKey: todayKey, createdAt: ts(now - minutesAgo * 60_000) },
    ]);
  exp("e1", 6000, "transport", "Taxi-moto, livraison du riz", 300);
  exp("e2", 5000, "communication", "Unités Vodacom", 140);
  out.push([`${B}/cashDays/${todayKey}`, { status: "open", openingFloat: { CDF: 50000, USD: 20, EUR: 0 }, openedByName: "Mama Ngalula" }]);

  return out;
}

/** Scène demandée dans l'adresse (?panier=1) : panier déjà rempli pour la capture de la caisse. */
if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("panier")) {
  localStorage.setItem(
    "vitepos.cart.b1",
    JSON.stringify({
      lines: [
        { productId: "p01", name: "Riz parfumé 1 kg", unit: "u", unitPrice: 2800, quantity: 2 },
        { productId: "p03", name: "Huile Mama 1 L", unit: "u", unitPrice: 6500, quantity: 1 },
        { productId: "p12", name: "Coca-Cola 33 cl", unit: "u", unitPrice: 1000, quantity: 6 },
        { productId: "p17", name: "Savon Monganga", unit: "u", unitPrice: 1500, quantity: 2 },
      ],
      discountPercent: 0,
      client: null,
    }),
  );
} else if (typeof window !== "undefined") {
  localStorage.removeItem("vitepos.cart.b1");
}
