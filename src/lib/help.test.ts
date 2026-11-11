import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { helpFor, parseSeen } from "./help";

/** Adresses des écrans de l'app connectée, lues dans App.tsx (les « :id » deviennent « x »). */
function appRoutes(): string[] {
  const src = readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf8");
  const inside = src.slice(src.indexOf("<Route element={<Layout />}>"));
  const paths = [...inside.matchAll(/<Route path="([^"*]+)"/g)].map((m) => "/" + m[1]!.replace(/:[^/]+/g, "x"));
  return ["/", ...paths];
}

describe("aide de chaque écran", () => {
  it("chaque écran de l'app a son aide", () => {
    const all = appRoutes();
    expect(all.length).toBeGreaterThan(14);
    expect(all.filter((r) => !helpFor(r))).toEqual([]);
  });

  it("choisit l'aide la plus précise", () => {
    expect(helpFor("/stock/import")?.key).toBe("import");
    expect(helpFor("/stock")?.key).toBe("stock");
    expect(helpFor("/stock/")?.key).toBe("stock");
    expect(helpFor("/ticket/abc123")?.key).toBe("ticket");
    expect(helpFor("/")?.key).toBe("accueil");
    expect(helpFor("/connexion")).toBeNull();
  });

  it("chaque aide a un titre, une phrase et des étapes", () => {
    for (const r of appRoutes()) {
      const h = helpFor(r)!;
      expect(h.title && h.intro).toBeTruthy();
      expect(h.steps.length).toBeGreaterThan(1);
    }
  });

  it("lit les aides déjà vues sans planter", () => {
    expect(parseSeen(null)).toEqual([]);
    expect(parseSeen("pas du json")).toEqual([]);
    expect(parseSeen('{"a":1}')).toEqual([]);
    expect(parseSeen('["caisse",3,"stock"]')).toEqual(["caisse", "stock"]);
  });
});
