import { describe, expect, it } from "vitest";
import {
  categoryColor,
  CATEGORY_COLORS,
  collectCategories,
  initials,
  productIcon,
  findByBarcode,
  findByCode,
  findScan,
  packLabel,
  nextSku,
  normalizeSku,
  skuPrefix,
  matchProduct,
  needsRestock,
  roundQuantity,
  signedDelta,
  sortForCheckout,
  stockLevel,
  validateProduct,
  type ProductInput,
} from "./products";

const base: ProductInput = {
  sku: "RIZ-001",
  name: "Riz 1kg",
  category: "Alimentation",
  sellPrice: 700,
  unit: "u",
  alertThreshold: 5,
  barcode: "",
  favorite: false,
};

describe("mouvements", () => {
  it("donne le bon signe selon le type", () => {
    expect(signedDelta("reappro", -10, "u")).toBe(10);
    expect(signedDelta("casse", 3, "u")).toBe(-3);
    expect(signedDelta("don", -2, "u")).toBe(-2);
    expect(signedDelta("correction", -4, "u")).toBe(-4);
    expect(signedDelta("correction", 4, "u")).toBe(4);
  });

  it("arrondit les pièces à l'unité et le vrac au millième", () => {
    expect(roundQuantity(2.6, "u")).toBe(3);
    expect(roundQuantity(1.23456, "kg")).toBe(1.235);
    expect(signedDelta("reappro", 0.5, "L")).toBe(0.5);
  });
});

describe("alertes de stock", () => {
  it("distingue rupture, stock bas et normal", () => {
    expect(stockLevel({ stock: 0, alertThreshold: 5 })).toBe("empty");
    expect(stockLevel({ stock: -2, alertThreshold: 5 })).toBe("empty");
    expect(stockLevel({ stock: 5, alertThreshold: 5 })).toBe("low");
    expect(stockLevel({ stock: 6, alertThreshold: 5 })).toBe("ok");
  });

  it("ignore les produits archivés", () => {
    expect(needsRestock({ stock: 0, alertThreshold: 5, archived: true })).toBe(false);
    expect(needsRestock({ stock: 0, alertThreshold: 5, archived: false })).toBe(true);
  });
});

describe("recherche", () => {
  const p = { name: "Lait concentré", category: "Épicerie", barcode: "6001234" };

  it("ignore accents et majuscules, cherche tous les mots", () => {
    expect(matchProduct(p, "lait concentre")).toBe(true);
    expect(matchProduct(p, "EPICERIE lait")).toBe(true);
    expect(matchProduct(p, "6001")).toBe(true);
    expect(matchProduct(p, "lait sucre")).toBe(false);
    expect(matchProduct(p, "  ")).toBe(true);
  });

  it("trouve un code-barres exact, hors archives", () => {
    const list = [
      { id: "a", barcode: "123", archived: true },
      { id: "b", barcode: "123", archived: false },
    ];
    expect(findByBarcode(list, " 123 ")?.id).toBe("b");
    expect(findByBarcode(list, "12")).toBeUndefined();
  });

  it("liste les catégories actives triées", () => {
    expect(
      collectCategories([
        { category: "Boissons", archived: false },
        { category: "Alimentation", archived: false },
        { category: "Vieux", archived: true },
        { category: "Boissons", archived: false },
      ]),
    ).toEqual(["Alimentation", "Boissons"]);
  });

  it("met les favoris devant et les ruptures à la fin à la caisse", () => {
    const sorted = sortForCheckout([
      { name: "B", favorite: false, stock: 0 },
      { name: "C", favorite: false, stock: 3 },
      { name: "A", favorite: true, stock: 1 },
    ]);
    expect(sorted.map((p) => p.name)).toEqual(["A", "C", "B"]);
  });
});

describe("validation", () => {
  it("nettoie la fiche", () => {
    const r = validateProduct({ ...base, name: "  Riz  ", category: " ", barcode: " 123 " });
    expect(r).toEqual({ value: { ...base, name: "Riz", category: "Divers", barcode: "123" } });
  });

  it("exige un code article", () => {
    expect(validateProduct({ ...base, sku: "  " })).toHaveProperty("error");
  });

  it("refuse un nom vide ou un prix négatif", () => {
    expect(validateProduct({ ...base, name: " " })).toHaveProperty("error");
    expect(validateProduct({ ...base, sellPrice: -1 })).toHaveProperty("error");
    expect(validateProduct({ ...base, sellPrice: Number.NaN })).toHaveProperty("error");
  });
});

describe("codes article", () => {
  it("prend les 3 premières lettres de la catégorie", () => {
    expect(skuPrefix("Lait")).toBe("LAI");
    expect(skuPrefix("Téléphonie")).toBe("TEL");
    expect(skuPrefix("Œufs")).toBe("UFS");
    expect(skuPrefix("Gaz")).toBe("GAZ");
    expect(skuPrefix("Té")).toBe("TEX");
    expect(skuPrefix("")).toBe("ART");
  });

  it("donne le numéro suivant de la catégorie", () => {
    expect(nextSku("Lait", [])).toBe("LAI-001");
    expect(nextSku("Lait", ["LAI-001", "LAI-007", "RIZ-020", "LAIT-9"])).toBe("LAI-008");
  });

  it("nettoie un code saisi à la main", () => {
    expect(normalizeSku(" lai 002 ")).toBe("LAI-002");
    expect(normalizeSku("café#1")).toBe("CAFE1");
    expect(normalizeSku("---")).toBe("");
  });

  it("retrouve un produit par code-barres ou par code article", () => {
    const list = [
      { id: "a", sku: "LAI-001", barcode: "6001", archived: false },
      { id: "b", sku: "LAI-002", barcode: "", archived: false },
    ];
    expect(findByCode(list, "6001")?.id).toBe("a");
    expect(findByCode(list, "lai-002")?.id).toBe("b");
    expect(findByCode(list, "LAI-009")).toBeUndefined();
  });

  it("cherche aussi dans le code article", () => {
    expect(matchProduct({ sku: "LAI-002", name: "Lait Nido 900 g", category: "Lait", barcode: "" }, "lai-002")).toBe(true);
  });
});

describe("emballages", () => {
  const coca = {
    id: "coca",
    sku: "BOI-001",
    barcode: "5449000000996",
    archived: false,
    packs: [{ id: "pq", name: "Paquet", barcode: "15449000000993", units: 24, price: 22000 }],
  };

  it("un scan dit si c'est la bouteille ou le paquet", () => {
    expect(findScan([coca], "5449000000996")).toEqual({ product: coca, pack: null });
    expect(findScan([coca], "15449000000993")?.pack?.units).toBe(24);
    expect(findScan([coca], "boi-001")).toEqual({ product: coca, pack: null });
    expect(findScan([{ ...coca, archived: true }], "15449000000993")).toBeUndefined();
    expect(findByBarcode([coca], "15449000000993")).toBe(coca);
  });

  it("vérifie les emballages de la fiche", () => {
    const ok = validateProduct({ ...base, barcode: "111", packs: [{ id: "", name: " Carton ", barcode: "", units: 48, price: 40000 }, { id: "a", name: "Paquet", barcode: "222", units: 24, price: 21000 }] });
    expect(ok).toHaveProperty("value");
    if ("value" in ok) {
      expect(ok.value.packs?.map((k) => k.name)).toEqual(["Paquet", "Carton"]);
      expect(ok.value.packs?.[1].id).not.toBe("");
    }
    expect(validateProduct({ ...base, packs: [{ id: "a", name: "", barcode: "", units: 24, price: 1 }] })).toHaveProperty("error");
    expect(validateProduct({ ...base, packs: [{ id: "a", name: "Paquet", barcode: "", units: 1, price: 1 }] })).toHaveProperty("error");
    expect(validateProduct({ ...base, barcode: "111", packs: [{ id: "a", name: "Paquet", barcode: "111", units: 24, price: 1 }] })).toHaveProperty("error");
  });

  it("sans emballages fournis (import CSV), la fiche ne les touche pas", () => {
    const r = validateProduct(base);
    expect("value" in r && "packs" in r.value).toBe(false);
  });

  it("nomme l'emballage", () => {
    expect(packLabel({ name: "Paquet", units: 24 }, "u")).toBe("Paquet de 24");
    expect(packLabel({ name: "Sac", units: 25 }, "kg")).toBe("Sac de 25 kg");
  });
});

describe("suivi par IMEI et péremption", () => {
  it("réserve l'IMEI aux articles vendus à la pièce, sans paquet", () => {
    expect(validateProduct({ ...base, unit: "kg", serialTracked: true })).toHaveProperty("error");
    expect(
      validateProduct({ ...base, serialTracked: true, packs: [{ id: "a", name: "Paquet", barcode: "", units: 2, price: 1 }] }),
    ).toHaveProperty("error");
    const ok = validateProduct({ ...base, serialTracked: true, warrantyMonths: 12, tracksExpiry: true });
    expect("value" in ok && ok.value).toMatchObject({ serialTracked: true, warrantyMonths: 12, tracksExpiry: true });
    expect(validateProduct({ ...base, serialTracked: true, warrantyMonths: 99 })).toHaveProperty("error");
  });
});

describe("tuiles de la caisse", () => {
  it("donne toujours la même couleur à un rayon, accents et majuscules compris", () => {
    expect(categoryColor("Épicerie")).toBe(categoryColor("epicerie "));
    expect(CATEGORY_COLORS).toContain(categoryColor("Boissons"));
    expect(categoryColor("")).not.toMatch(new RegExp(CATEGORY_COLORS.join("|")));
  });
  it("prend deux lettres du nom", () => {
    expect(initials("Huile Mama 1 L")).toBe("HM");
    expect(initials("Sucre")).toBe("SU");
    expect(initials("Élixir d'or")).toBe("ED");
    expect(initials("33 cl")).toBe("CL");
    expect(initials("")).toBe("?");
  });
});

describe("vignettes dessinées", () => {
  it("reconnaît les articles courants", () => {
    expect(productIcon("Coca-Cola 33 cl")).toBe("bottle");
    expect(productIcon("Eau 1,5 L")).toBe("droplet");
    expect(productIcon("Riz parfumé 1 kg")).toBe("grain");
    expect(productIcon("Crédit Vodacom 1 $")).toBe("phone");
    expect(productIcon("Primus 72 cl")).toBe("beer");
    expect(productIcon("Œufs x30")).toBe("egg");
  });
  it("laisse les deux lettres aux autres", () => {
    expect(productIcon("Huile Mama 1 L")).toBeNull();
    expect(productIcon("Dentifrice Signal")).toBeNull();
    expect(productIcon("Bidon", "Boissons")).toBe("bottle");
  });
});
