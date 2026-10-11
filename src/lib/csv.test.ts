import { describe, expect, it } from "vitest";
import { CSV_TEMPLATE, exportProductsCsv, parseNumber, parseProductCsv, planImport, splitCsvLine } from "./csv";
import type { Product } from "./products";

describe("lecture CSV", () => {
  it("lit le modèle", () => {
    const { rows, errors } = parseProductCsv(CSV_TEMPLATE);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({ name: "Riz 1kg", sellPrice: 700, buyPrice: 550, stock: 40, favorite: true, unit: "u" });
    expect(rows[4]).toMatchObject({ unit: "kg", favorite: false });
  });

  it("accepte le point-virgule d'Excel en français et les en-têtes accentués", () => {
    const { rows } = parseProductCsv("﻿Désignation;Catégorie;Prix de vente;Quantité\nSavon;Hygiène;1 500,50;12\n");
    expect(rows[0]).toMatchObject({ name: "Savon", category: "Hygiène", sellPrice: 1500.5, stock: 12 });
  });

  it("respecte les guillemets", () => {
    expect(splitCsvLine('"Riz, 1kg",700,"dit ""bon"""', ",")).toEqual(["Riz, 1kg", "700", 'dit "bon"']);
  });

  it("laisse le stock vide quand la colonne est vide", () => {
    const { rows } = parseProductCsv("nom,prix\nRiz,700\n");
    expect(rows[0].stock).toBeUndefined();
    expect(rows[0].category).toBe("Divers");
  });

  it("signale les lignes invalides sans bloquer les autres", () => {
    const { rows, errors } = parseProductCsv("nom,prix\n,100\nRiz,abc\nSel,200\n");
    expect(rows.map((r) => r.name)).toEqual(["Sel"]);
    expect(errors).toHaveLength(2);
  });

  it("exige le nom et le prix", () => {
    expect(parseProductCsv("nom,stock\nRiz,3\n").errors[0]).toMatch(/obligatoires/);
  });

  it("lit les nombres écrits à la française", () => {
    expect(parseNumber("1 500")).toBe(1500);
    expect(parseNumber("1.500,25")).toBe(1500.25);
    expect(parseNumber("12,5")).toBe(12.5);
    expect(parseNumber("")).toBeUndefined();
  });
});

describe("plan d'import", () => {
  const existing = [
    { id: "p1", name: "Riz 1kg", category: "Alimentation", barcode: "", stock: 10, archived: false },
    { id: "p2", name: "Coca", category: "Boissons", barcode: "544900", stock: 4, archived: false },
    { id: "p3", name: "Savon", category: "Hygiène", barcode: "", stock: 9, archived: true },
  ];

  it("met à jour par nom ou par code-barres et calcule l'écart de stock", () => {
    const { rows } = parseProductCsv(
      "nom,categorie,prix,stock,code_barres\nriz 1KG,alimentation,750,40,\nCoca-Cola 33cl,Boissons,500,,544900\nSavon,Hygiène,300,5,\n",
    );
    const plan = planImport(rows, existing);
    expect(plan.updates).toEqual([
      expect.objectContaining({ id: "p1", stockDelta: 30 }),
      expect.objectContaining({ id: "p2", stockDelta: 0 }),
    ]);
    // Le produit archivé n'est pas repris : on en crée un nouveau.
    expect(plan.creates).toEqual([expect.objectContaining({ stock: 5 })]);
  });

  it("ignore les doublons du fichier", () => {
    const { rows } = parseProductCsv("nom,prix\nSel,100\nsel,120\n");
    expect(planImport(rows, []).creates).toHaveLength(1);
  });
});

describe("export", () => {
  it("échappe les virgules et garde les archives dehors", () => {
    const p: Product = {
      id: "a",
      name: "Riz, 1kg",
      category: "Alimentation",
      sellPrice: 700,
      unit: "u",
      stock: 3,
      alertThreshold: 5,
      barcode: "",
      favorite: true,
      archived: false,
      updatedAtMs: 0,
    };
    const csv = exportProductsCsv([p, { ...p, id: "b", archived: true }], new Map([["a", 550]]));
    expect(csv.trim().split("\n")).toEqual([
      "nom,categorie,prix_vente,prix_achat,stock,seuil,unite,code_barres,favori",
      '"Riz, 1kg",Alimentation,700,550,3,5,u,,oui',
    ]);
  });
});
