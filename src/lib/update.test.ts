import { describe, expect, it } from "vitest";
import { canReloadNow } from "./update";

describe("rechargement pour une mise à jour", () => {
  it("attend la fin d'une vente en cours", () => {
    expect(canReloadNow({ path: "/caisse", dialogOpen: false, cartLines: 2 })).toBe(false);
    expect(canReloadNow({ path: "/caisse", dialogOpen: false, cartLines: 0 })).toBe(true);
  });

  it("attend qu'aucune fenêtre ne soit ouverte", () => {
    expect(canReloadNow({ path: "/stock", dialogOpen: true, cartLines: 0 })).toBe(false);
  });

  it("recharge ailleurs, même avec un panier gardé", () => {
    expect(canReloadNow({ path: "/", dialogOpen: false, cartLines: 3 })).toBe(true);
  });
});
