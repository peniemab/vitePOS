/**
 * « Premiers pas » d'une boutique neuve : les gestes qui transforment un essai en habitude.
 * La liste disparaît de l'accueil quand tout est fait.
 */

export interface FirstStepsInput {
  /** Le taux du dollar est saisi. */
  hasRate: boolean;
  /** Articles actifs (non archivés). */
  productCount: number;
  /** Au moins une vente enregistrée, un jour ou l'autre. */
  hasSale: boolean;
  /** Une façon d'imprimer (ou de partager) le ticket a été choisie sur cet appareil. */
  printerChosen: boolean;
  /** Comptes de la boutique, propriétaire compris. */
  memberCount: number;
}

export interface FirstStep {
  id: "taux" | "articles" | "vente" | "imprimante" | "equipe";
  label: string;
  /** Écran où faire ce geste. */
  to: string;
  done: boolean;
}

/** Nombre d'articles à saisir avant de pouvoir vraiment vendre. */
export const FIRST_PRODUCTS = 5;

export function firstSteps(i: FirstStepsInput): FirstStep[] {
  return [
    {
      id: "taux",
      label: "Saisir le taux du jour",
      to: "/parametres",
      done: i.hasRate,
    },
    {
      id: "articles",
      label:
        i.productCount > 0 && i.productCount < FIRST_PRODUCTS
          ? `Ajouter vos ${FIRST_PRODUCTS} premiers articles (${i.productCount} sur ${FIRST_PRODUCTS})`
          : `Ajouter vos ${FIRST_PRODUCTS} premiers articles`,
      to: "/stock?nouveau",
      done: i.productCount >= FIRST_PRODUCTS,
    },
    {
      id: "vente",
      label: "Faire une première vente",
      to: "/caisse",
      done: i.hasSale,
    },
    {
      id: "imprimante",
      label: "Choisir comment imprimer le ticket",
      to: "/parametres",
      done: i.printerChosen,
    },
    {
      id: "equipe",
      label: "Inviter un vendeur",
      to: "/equipe",
      done: i.memberCount > 1,
    },
  ];
}

export function doneCount(steps: FirstStep[]): number {
  return steps.filter((s) => s.done).length;
}
