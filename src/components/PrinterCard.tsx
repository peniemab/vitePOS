/**
 * Paramètres → Imprimante de cet appareil : comment imprimer les tickets (Bluetooth, RawBT, USB ou fenêtre
 * d'impression), choix de l'imprimante et ticket de test. Le réglage est propre à chaque téléphone ou ordinateur.
 */
import { useState } from "react";
import { Alert, Button, Group, Paper, Select, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBluetooth, IconPrinter } from "@tabler/icons-react";
import {
  bluetoothUnavailableMessage,
  canUseBluetooth,
  canShareImage,
  canUseUsb,
  getBluetoothPrinterName,
  getPrinterMode,
  isAndroid,
  isIOS,
  pickBluetoothPrinter,
  pickUsbPrinter,
  printReceipt,
  setPrinterMode,
} from "../data/printer";
import { errorMessage } from "../data/errors";
import type { PaperWidth, ReceiptLine } from "../lib/receipt";
import type { PrinterMode } from "../lib/printing";

const MODE_LABELS: Record<PrinterMode, string> = {
  bluetooth: "Imprimante Bluetooth",
  rawbt: "Imprimante Bluetooth avec l'app RawBT (Android)",
  usb: "Imprimante USB (ordinateur)",
  share: "Partager vers une app d'impression (Thermer sur iPhone)",
  browser: "Fenêtre d'impression du navigateur",
};

function testTicket(shopName: string): ReceiptLine[] {
  return [
    { kind: "title", text: shopName },
    { kind: "center", text: "Ticket de test" },
    { kind: "rule" },
    { kind: "pair", left: "Imprimante", right: "OK" },
    { kind: "pair", left: "Accents", right: "é è à ç €" },
    { kind: "rule" },
    { kind: "center", text: "vitePOS" },
  ];
}

export function PrinterCard({ shopName, paperWidth }: { shopName: string; paperWidth: PaperWidth }) {
  const [mode, setMode] = useState<PrinterMode>(getPrinterMode());
  const [printerName, setPrinterName] = useState(getBluetoothPrinterName());
  const [busy, setBusy] = useState(false);

  function fail(e: unknown) {
    if (["NotFoundError", "AbortError"].includes((e as Error)?.name)) return; // Choix ou partage annulé.
    notifications.show({ color: "red", title: "Imprimante", message: (e as Error)?.message || errorMessage(e), autoClose: false });
  }

  function choose(v: string | null) {
    if (!v) return;
    setMode(v as PrinterMode);
    setPrinterMode(v as PrinterMode);
  }

  async function connect() {
    setBusy(true);
    try {
      if (mode === "bluetooth") setPrinterName(await pickBluetoothPrinter());
      else await pickUsbPrinter();
      notifications.show({ color: "green", message: "Imprimante connectée" });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    try {
      if (!(await printReceipt(testTicket(shopName), paperWidth))) window.print();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  const modes: PrinterMode[] = [
    ...(isIOS() || canShareImage() ? (["share"] as const) : []),
    "bluetooth",
    ...(isAndroid() ? (["rawbt"] as const) : []),
    "usb",
    "browser",
  ];

  return (
    <Paper p="md">
      <Title order={4} mb={4}>
        Imprimante de cet appareil
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        Réglage propre à ce téléphone ou à cet ordinateur.
      </Text>
      <Stack>
        <Select label="Imprimer les tickets avec" data={modes.map((m) => ({ value: m, label: MODE_LABELS[m] }))} value={mode} onChange={choose} allowDeselect={false} />

        {mode === "bluetooth" && !canUseBluetooth() && (
          <Alert color="orange" title="Bluetooth indisponible ici">
            {bluetoothUnavailableMessage()}
          </Alert>
        )}
        {mode === "bluetooth" && canUseBluetooth() && (
          <Text size="sm">
            Allumez l'imprimante, puis touchez « Choisir l'imprimante ». Si elle n'apparaît pas dans la liste, fermez l'app du
            fabricant (elle garde l'imprimante pour elle){isAndroid() ? ", ou essayez le mode RawBT" : ""}.
            {printerName && (
              <>
                {" "}
                Imprimante choisie : <b>{printerName}</b>.
              </>
            )}
          </Text>
        )}
        {mode === "rawbt" && (
          <Text size="sm">
            Installez l'app gratuite <b>RawBT</b> depuis le Play Store, connectez-y votre imprimante une fois, puis vitePOS lui
            enverra chaque ticket.
          </Text>
        )}
        {mode === "share" && (
          <Text size="sm">
            En touchant « Imprimer », le ticket devient une image et le menu de partage s'ouvre{" "}
            : choisissez votre app d'impression (par exemple <b>Thermer</b>), qui l'imprime sur l'imprimante déjà connectée.
            Fonctionne aussi sans internet. L'impression automatique après la vente n'est pas possible dans ce mode.
          </Text>
        )}
        {mode === "share" && !canShareImage() && (
          <Alert color="orange" title="Partage indisponible ici">
            Ce navigateur ne sait pas partager une image. Sur iPhone, ouvrez vitePOS dans Safari.
          </Alert>
        )}
        {mode === "usb" && !canUseUsb() && (
          <Alert color="orange" title="USB indisponible ici">
            Les imprimantes USB fonctionnent avec Chrome ou Edge sur un ordinateur.
          </Alert>
        )}

        <Group>
          {((mode === "bluetooth" && canUseBluetooth()) || (mode === "usb" && canUseUsb())) && (
            <Button leftSection={<IconBluetooth size={18} />} variant="default" loading={busy} onClick={connect}>
              {printerName && mode === "bluetooth" ? "Changer d'imprimante" : "Choisir l'imprimante"}
            </Button>
          )}
          <Button leftSection={<IconPrinter size={18} />} loading={busy} onClick={test}>
            Imprimer un ticket de test
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
