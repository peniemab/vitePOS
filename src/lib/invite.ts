/** Codes d'invitation : 6 caractères sans les signes faciles à confondre (0/O, 1/I). */

export const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const INVITE_LENGTH = 6;

export function generateInviteCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < INVITE_LENGTH; i++) code += INVITE_ALPHABET[Math.floor(random() * INVITE_ALPHABET.length)];
  return code;
}

/** Nettoie une saisie (« ab-c 12d » → « ABC12D ») ; renvoie "" si le code ne peut pas être valide. */
export function normalizeInviteCode(input: string): string {
  const code = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== INVITE_LENGTH) return "";
  return [...code].every((c) => INVITE_ALPHABET.includes(c)) ? code : "";
}
