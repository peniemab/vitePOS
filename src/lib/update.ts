/** Mises à jour de l'app (logique pure) : quand peut-on recharger la page sans gêner le vendeur ? */

export interface UpdateContext {
  /** Adresse de l'écran affiché (« /caisse »…). */
  path: string;
  /** Une fenêtre (paiement, confirmation…) est ouverte. */
  dialogOpen: boolean;
  /** Nombre d'articles dans le panier de la caisse. */
  cartLines: number;
}

/** Pas pendant une fenêtre ouverte, ni à la caisse avec un panier en cours : on attend la fin de la vente. */
export function canReloadNow(c: UpdateContext): boolean {
  if (c.dialogOpen) return false;
  if (c.path.startsWith("/caisse") && c.cartLines > 0) return false;
  return true;
}
