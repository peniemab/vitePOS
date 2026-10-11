/**
 * Imprimante thermique branchée en USB/série, via Web Serial (Chrome ou Edge sur ordinateur et tablette).
 * Ailleurs, on imprime avec la fenêtre d'impression du navigateur.
 */
import { escPos, type PaperWidth, type ReceiptLine } from "../lib/receipt";

interface SerialPortLike {
  writable: WritableStream<Uint8Array> | null;
  open: (options: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
}

interface SerialLike {
  requestPort: () => Promise<SerialPortLike>;
  getPorts: () => Promise<SerialPortLike[]>;
}

function serial(): SerialLike | undefined {
  return typeof navigator !== "undefined" ? (navigator as unknown as { serial?: SerialLike }).serial : undefined;
}

export function canUseThermalPrinter(): boolean {
  return !!serial();
}

let port: SerialPortLike | null = null;

async function openPort(forcePicker: boolean): Promise<SerialPortLike> {
  const s = serial();
  if (!s) throw new Error("Ce navigateur ne sait pas parler aux imprimantes thermiques. Utilisez Chrome ou Edge.");
  if (port && !forcePicker) return port;
  if (port) await port.close().catch(() => undefined);
  const known = forcePicker ? [] : await s.getPorts();
  const next = known[0] ?? (await s.requestPort());
  try {
    await next.open({ baudRate: 9600 });
  } catch (e) {
    // Déjà ouvert dans cette page : on le réutilise.
    if (!/already open/i.test(String((e as Error)?.message))) throw e;
  }
  port = next;
  return next;
}

/** Choisir (ou changer) l'imprimante. */
export async function pickThermalPrinter(): Promise<void> {
  await openPort(true);
}

export async function printThermal(lines: ReceiptLine[], width: PaperWidth): Promise<void> {
  const p = await openPort(false);
  if (!p.writable) throw new Error("L'imprimante ne répond pas. Débranchez-la puis rebranchez-la.");
  const writer = p.writable.getWriter();
  try {
    await writer.write(escPos(lines, width));
  } finally {
    writer.releaseLock();
  }
}
