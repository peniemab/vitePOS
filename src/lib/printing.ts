/**
 * Envoi des tickets aux imprimantes thermiques : choix de l'appareil d'impression, découpage des données pour le
 * Bluetooth, adresse de l'app RawBT. Sans React ni Firebase.
 */

/**
 * Comment ce téléphone ou cet ordinateur imprime les tickets. « share » : le ticket part en image vers une app
 * d'impression (Thermer sur iPhone…).
 */
export type PrinterMode = "browser" | "bluetooth" | "rawbt" | "usb" | "share";

export const PRINTER_MODES: PrinterMode[] = ["browser", "bluetooth", "rawbt", "usb", "share"];

export function isPrinterMode(v: unknown): v is PrinterMode {
  return typeof v === "string" && (PRINTER_MODES as string[]).includes(v);
}

/**
 * Services Bluetooth (BLE) des imprimantes thermiques courantes, et la caractéristique où l'on écrit le ticket.
 * Le navigateur ne laisse lire que les services déclarés ici.
 */
export const BLE_PRINTER_SERVICES: { service: string; characteristic?: string }[] = [
  { service: "000018f0-0000-1000-8000-00805f9b34fb", characteristic: "00002af1-0000-1000-8000-00805f9b34fb" },
  { service: "e7810a71-73ae-499d-8c15-faa9aef0c3f2", characteristic: "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f" },
  { service: "49535343-fe7d-4ae5-8fa9-9fafd205e455", characteristic: "49535343-8841-43f4-a8d4-ecbe34729bb3" },
  { service: "0000ff00-0000-1000-8000-00805f9b34fb", characteristic: "0000ff02-0000-1000-8000-00805f9b34fb" },
  { service: "0000ffe0-0000-1000-8000-00805f9b34fb", characteristic: "0000ffe1-0000-1000-8000-00805f9b34fb" },
  { service: "0000ae30-0000-1000-8000-00805f9b34fb", characteristic: "0000ae01-0000-1000-8000-00805f9b34fb" },
  { service: "0000fee7-0000-1000-8000-00805f9b34fb" },
];

/** Découpe les données en paquets : le Bluetooth basse consommation n'accepte que de petits envois. */
export function chunks(bytes: Uint8Array, size: number): Uint8Array[] {
  if (size <= 0) throw new Error("Taille de paquet invalide");
  const out: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += size) out.push(bytes.subarray(i, i + size));
  return out;
}

export function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

/** Adresse qui ouvre l'app Android RawBT et lui fait imprimer ces données ESC/POS. */
export function rawbtUrl(bytes: Uint8Array): string {
  return `intent:base64,${toBase64(bytes)}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
}
