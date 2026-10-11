/** Rôles et droits des membres d'une boutique (logique pure, partagée avec les écrans). */

export type Role = "proprietaire" | "gerant" | "vendeur";
export type MemberStatus = "pending" | "active" | "disabled";

export interface Permissions {
  viewReports: boolean;
  editPrices: boolean;
  closeCash: boolean;
  manageStock: boolean;
}

export const ROLE_LABELS: Record<Role, string> = {
  proprietaire: "Propriétaire",
  gerant: "Gérant",
  vendeur: "Vendeur",
};

export const STATUS_LABELS: Record<MemberStatus, string> = {
  pending: "En attente",
  active: "Actif",
  disabled: "Désactivé",
};

export function isRole(v: unknown): v is Role {
  return v === "proprietaire" || v === "gerant" || v === "vendeur";
}

export function isStatus(v: unknown): v is MemberStatus {
  return v === "pending" || v === "active" || v === "disabled";
}

export function defaultPermissions(role: Role): Permissions {
  const elevated = role !== "vendeur";
  return { viewReports: elevated, editPrices: elevated, closeCash: elevated, manageStock: elevated };
}

/** Droits effectifs : ceux du rôle, éventuellement ajustés par le propriétaire. */
export function resolvePermissions(role: Role, overrides?: Partial<Permissions>): Permissions {
  if (role === "proprietaire") return defaultPermissions(role);
  return { ...defaultPermissions(role), ...overrides };
}

export function canManageTeam(role: Role): boolean {
  return role === "proprietaire";
}
