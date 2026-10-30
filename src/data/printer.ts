/**
 * Impression des tickets sur imprimante thermique. Le mode est choisi par appareil (Paramètres → Imprimante) :
 * - « bluetooth » : Bluetooth basse consommation via Web Bluetooth (Chrome sur Android, app Bluefy sur iPhone) ;
 * - « rawbt » : l'app Android RawBT imprime à notre place (toutes les imprimantes Bluetooth) ;
 * - « usb » : imprimante branchée en USB/série, via Web Serial (Chrome ou Edge sur ordinateur et tablette) ;
 * - « browser » : fenêtre d'impression du navigateur.
 */
import { escPos, type PaperWidth, type ReceiptLine } from "../lib/receipt";
import { BLE_PRINTER_SERVICES, chunks, isPrinterMode, rawbtUrl, type PrinterMode } from "../lib/printing";

const MODE_KEY = "vitepos.printer.mode";
const NAME_KEY = "vitepos.printer.name";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Stockage bloqué (navigation privée) : le choix vaut pour cette session seulement.
  }
}

export function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
}

/* ---------- Choix du mode ---------- */

/** Mode par défaut : le Bluetooth si l'appareil le permet, sinon l'USB, sinon la fenêtre d'impression. */
function defaultMode(): PrinterMode {
  if (bluetooth()) return "bluetooth";
  if (serial()) return "usb";
  return "browser";
}

export function getPrinterMode(): PrinterMode {
  const v = readStorage(MODE_KEY);
  return isPrinterMode(v) ? v : defaultMode();
}

export function setPrinterMode(mode: PrinterMode) {
  writeStorage(MODE_KEY, mode);
}

/** Nom de l'imprimante Bluetooth choisie sur cet appareil, pour l'afficher. */
export function getBluetoothPrinterName(): string | null {
  return readStorage(NAME_KEY);
}

/* ---------- Bluetooth (Web Bluetooth) ---------- */

interface CharacteristicLike {
  uuid: string;
  properties: { write: boolean; writeWithoutResponse: boolean };
  writeValueWithResponse?: (v: Uint8Array) => Promise<void>;
  writeValueWithoutResponse?: (v: Uint8Array) => Promise<void>;
  writeValue: (v: Uint8Array) => Promise<void>;
}
interface ServiceLike {
  getCharacteristics: () => Promise<CharacteristicLike[]>;
  getCharacteristic: (uuid: string) => Promise<CharacteristicLike>;
}
interface GattLike {
  connected: boolean;
  connect: () => Promise<GattLike>;
  getPrimaryService: (uuid: string) => Promise<ServiceLike>;
}
interface DeviceLike {
  id: string;
  name?: string;
  gatt?: GattLike;
}
interface BluetoothLike {
  requestDevice: (o: { acceptAllDevices: boolean; optionalServices: string[] }) => Promise<DeviceLike>;
  getDevices?: () => Promise<DeviceLike[]>;
}

function bluetooth(): BluetoothLike | undefined {
  return typeof navigator !== "undefined" ? (navigator as unknown as { bluetooth?: BluetoothLike }).bluetooth : undefined;
}

export function canUseBluetooth(): boolean {
  return !!bluetooth();
}

let btDevice: DeviceLike | null = null;
let btWrite: CharacteristicLike | null = null;

/** Trouve, parmi les services connus des imprimantes, une caractéristique où l'on peut écrire. */
async function findWritable(gatt: GattLike): Promise<CharacteristicLike> {
  for (const { service, characteristic } of BLE_PRINTER_SERVICES) {
    let s: ServiceLike;
    try {
      s = await gatt.getPrimaryService(service);
    } catch {
      continue; // Ce service n'existe pas sur cette imprimante.
    }
    if (characteristic) {
      try {
        return await s.getCharacteristic(characteristic);
      } catch {
        // On cherche plus bas une autre caractéristique du même service.
      }
    }
    const all = await s.getCharacteristics();
    const c = all.find((x) => x.properties.write || x.properties.writeWithoutResponse);
    if (c) return c;
  }
  throw new Error(
    "Cette imprimante n'accepte pas l'impression directe en Bluetooth. Sur Android, essayez le mode RawBT ; sinon, notez son modèle et contactez-nous.",
  );
}

async function connectBluetooth(device: DeviceLike): Promise<void> {
  if (!device.gatt) throw new Error("Cet appareil Bluetooth n'est pas une imprimante.");
  const gatt = device.gatt.connected ? device.gatt : await device.gatt.connect();
  btWrite = await findWritable(gatt);
  btDevice = device;
  writeStorage(NAME_KEY, device.name || "Imprimante Bluetooth");
}

/** Choisir l'imprimante Bluetooth (à appeler depuis un bouton : le navigateur exige un geste de l'utilisateur). */
export async function pickBluetoothPrinter(): Promise<string> {
  const bt = bluetooth();
  if (!bt) throw new Error(bluetoothUnavailableMessage());
  const device = await bt.requestDevice({ acceptAllDevices: true, optionalServices: BLE_PRINTER_SERVICES.map((s) => s.service) });
  await connectBluetooth(device);
  return device.name || "Imprimante Bluetooth";
}

/** Retrouve l'imprimante déjà choisie (connexion perdue, ou page rechargée quand le navigateur le permet). */
async function ensureBluetooth(): Promise<CharacteristicLike> {
  if (btDevice && btWrite && btDevice.gatt?.connected) return btWrite;
  if (btDevice) {
    await connectBluetooth(btDevice);
    return btWrite!;
  }
  const known = (await bluetooth()?.getDevices?.().catch(() => [])) ?? [];
  const name = getBluetoothPrinterName();
  const again = known.find((d) => d.name === name) ?? known[0];
  if (again) {
    await connectBluetooth(again);
    return btWrite!;
  }
  // Page rechargée : le navigateur demande de choisir à nouveau l'imprimante.
  await pickBluetoothPrinter();
  return btWrite!;
}

async function printBluetooth(bytes: Uint8Array): Promise<void> {
  const c = await ensureBluetooth();
  const fast = c.properties.writeWithoutResponse && c.writeValueWithoutResponse;
  // Petits paquets, avec une courte pause : les imprimantes bon marché perdent les données envoyées trop vite.
  for (const part of chunks(bytes, fast ? 100 : 180)) {
    if (fast) {
      await c.writeValueWithoutResponse!(part);
      await new Promise((r) => setTimeout(r, 25));
    } else if (c.writeValueWithResponse) await c.writeValueWithResponse(part);
    else await c.writeValue(part);
  }
}

export function bluetoothUnavailableMessage(): string {
  if (isAndroid()) return "Ouvrez vitePOS dans Chrome pour imprimer en Bluetooth.";
  if (/iphone|ipad|ipod/i.test(navigator.userAgent))
    return "Safari ne permet pas le Bluetooth. Sur iPhone, ouvrez vitePOS dans l'app gratuite Bluefy pour imprimer en Bluetooth.";
  return "Ce navigateur ne permet pas le Bluetooth. Utilisez Chrome.";
}

/* ---------- USB / série (Web Serial) ---------- */

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

export function canUseUsb(): boolean {
  return !!serial();
}

let port: SerialPortLike | null = null;

async function openPort(forcePicker: boolean): Promise<SerialPortLike> {
  const s = serial();
  if (!s) throw new Error("Ce navigateur ne sait pas parler aux imprimantes USB. Utilisez Chrome ou Edge sur ordinateur.");
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

/** Choisir (ou changer) l'imprimante USB. */
export async function pickUsbPrinter(): Promise<void> {
  await openPort(true);
}

async function printUsb(bytes: Uint8Array): Promise<void> {
  const p = await openPort(false);
  if (!p.writable) throw new Error("L'imprimante ne répond pas. Débranchez-la puis rebranchez-la.");
  const writer = p.writable.getWriter();
  try {
    await writer.write(bytes);
  } finally {
    writer.releaseLock();
  }
}

/* ---------- Impression ---------- */

/**
 * Imprime le ticket selon le mode de cet appareil. Renvoie `false` quand il faut passer par la fenêtre
 * d'impression du navigateur (mode « browser »).
 */
export async function printReceipt(lines: ReceiptLine[], width: PaperWidth): Promise<boolean> {
  const mode = getPrinterMode();
  if (mode === "browser") return false;
  const bytes = escPos(lines, width);
  if (mode === "bluetooth") await printBluetooth(bytes);
  else if (mode === "rawbt") window.location.href = rawbtUrl(bytes);
  else await printUsb(bytes);
  return true;
}
