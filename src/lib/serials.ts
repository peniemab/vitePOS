/**
 * Numéros de série et IMEI (logique pure) : un appareil = un numéro, saisi à l'arrivage et obligatoire
 * à la vente ; la garantie court à partir du jour de la vente.
 */

export const SERIAL_MIN = 4;
export const SERIAL_MAX = 30;
export const MAX_WARRANTY_MONTHS = 60;

/** Numéro tel qu'enregistré : majuscules, lettres et chiffres seulement (sert aussi d'identifiant). */
export function normalizeSerial(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, SERIAL_MAX);
}

/** Contrôle de Luhn d'un IMEI à 15 chiffres (le dernier chiffre vérifie les 14 autres). */
export function isValidImei(serial: string): boolean {
  if (!/^\d{15}$/.test(serial)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = Number(serial[i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * Vérifie un numéro saisi. Un numéro de 15 chiffres est un IMEI : il doit passer le contrôle de Luhn
 * (une faute de frappe est alors repérée). Les autres numéros de série sont acceptés tels quels.
 */
export function checkSerial(input: string): { value: string } | { error: string } {
  const value = normalizeSerial(input);
  if (value.length < SERIAL_MIN) return { error: `« ${input.trim()} » : numéro trop court.` };
  if (/^\d{15}$/.test(value) && !isValidImei(value)) return { error: `L'IMEI ${value} n'est pas valide : vérifiez les chiffres.` };
  return { value };
}

/** Liste de numéros collée ou scannée (un par ligne, ou séparés par des virgules ou des espaces), sans doublons. */
export function parseSerialList(text: string): { values: string[]; errors: string[] } {
  const values: string[] = [];
  const errors: string[] = [];
  for (const raw of text.split(/[\s,;]+/)) {
    if (!raw.trim()) continue;
    const r = checkSerial(raw);
    if ("error" in r) errors.push(r.error);
    else if (!values.includes(r.value)) values.push(r.value);
  }
  return { values, errors };
}

/** Fin de garantie « AAAA-MM-JJ » : `months` mois après le jour de la vente (0 : pas de garantie). */
export function warrantyUntil(saleDay: string, months: number): string {
  if (!months || months <= 0) return "";
  const y = Number(saleDay.slice(0, 4));
  const m = Number(saleDay.slice(5, 7)) - 1 + months;
  const d = Number(saleDay.slice(8, 10));
  // Le 31 janvier + 1 mois devient le dernier jour de février, pas le 3 mars.
  const last = new Date(y, m + 1, 0).getDate();
  const date = new Date(y, m, Math.min(d, last));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** « 12/11/2027 » pour une date « 2027-11-12 ». */
export function formatDayShort(day: string): string {
  return day ? `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}` : "";
}
