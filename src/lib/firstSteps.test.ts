import { describe, expect, it } from "vitest";
import { doneCount, firstSteps } from "./firstSteps";

const fresh = {
  hasRate: true,
  productCount: 0,
  hasSale: false,
  printerChosen: false,
  memberCount: 1,
};

describe("premiers pas", () => {
  it("part du taux déjà saisi à la création", () => {
    const steps = firstSteps(fresh);
    expect(steps.map((s) => s.id)).toEqual(["taux", "articles", "vente", "imprimante", "equipe"]);
    expect(doneCount(steps)).toBe(1);
  });

  it("montre où en sont les premiers articles", () => {
    const articles = firstSteps({ ...fresh, productCount: 3 }).find((s) => s.id === "articles")!;
    expect(articles).toMatchObject({
      done: false,
      label: "Ajouter vos 5 premiers articles (3 sur 5)",
    });
    expect(firstSteps({ ...fresh, productCount: 5 }).find((s) => s.id === "articles")!.done).toBe(true);
  });

  it("compte un vendeur invité en plus du propriétaire", () => {
    expect(firstSteps({ ...fresh, memberCount: 2 }).find((s) => s.id === "equipe")!.done).toBe(true);
  });

  it("est terminé quand tout est fait", () => {
    expect(
      doneCount(
        firstSteps({
          hasRate: true,
          productCount: 12,
          hasSale: true,
          printerChosen: true,
          memberCount: 3,
        }),
      ),
    ).toBe(5);
  });
});
