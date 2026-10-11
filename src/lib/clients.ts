/** Clients : recherche et numéros de téléphone (logique pure). */
import { fold } from "./products";

export interface Client {
  id: string;
  name: string;
  phone: string;
  notes: string;
  purchaseCount: number;
  /** Total des achats, dans la devise des prix de la boutique. */
  totalSpent: number;
  lastPurchaseAtMs: number;
}

/**
 * Numéro congolais à la forme « 0812 345 678 ».
 * Accepte « +243 81 234 5678 », « 243812345678 » ou « 0812345678 ». Un autre numéro est rendu tel quel, nettoyé.
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  let local = "";
  if (digits.length === 12 && digits.startsWith("243")) local = "0" + digits.slice(3);
  else if (digits.length === 10 && digits.startsWith("0")) local = digits;
  else if (digits.length === 9) local = "0" + digits;
  if (!local) return raw.trim().replace(/\s+/g, " ");
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

export function matchClient(c: Pick<Client, "name" | "phone">, query: string): boolean {
  const q = fold(query);
  if (!q) return true;
  const digits = query.replace(/\D/g, "");
  if (digits.length >= 3 && c.phone.replace(/\D/g, "").includes(digits)) return true;
  return q.split(/\s+/).every((w) => fold(c.name).includes(w));
}

export function validateClient(name: string, phone: string): { name: string; phone: string } | { error: string } {
  const n = name.trim();
  if (!n) return { error: "Le nom du client est obligatoire." };
  if (n.length > 80) return { error: "Le nom est trop long (80 caractères au plus)." };
  const p = phone.trim() ? formatPhone(phone) : "";
  if (p.length > 30) return { error: "Le numéro de téléphone n'est pas valide." };
  return { name: n, phone: p };
}
