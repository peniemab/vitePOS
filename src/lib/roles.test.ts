import { describe, expect, it } from "vitest";
import { canManageTeam, resolvePermissions } from "./roles";

describe("roles", () => {
  it("donne tous les droits au propriétaire, même avec des ajustements", () => {
    expect(resolvePermissions("proprietaire", { closeCash: false }).closeCash).toBe(true);
  });

  it("applique les ajustements aux autres rôles", () => {
    expect(resolvePermissions("vendeur").editPrices).toBe(false);
    expect(resolvePermissions("vendeur", { editPrices: true }).editPrices).toBe(true);
    expect(resolvePermissions("gerant", { closeCash: false }).closeCash).toBe(false);
  });

  it("réserve l'équipe au propriétaire", () => {
    expect(canManageTeam("proprietaire")).toBe(true);
    expect(canManageTeam("gerant")).toBe(false);
  });
});
