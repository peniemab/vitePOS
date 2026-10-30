/**
 * Paramètres → Ticket de caisse : logo, coordonnées, mentions légales, QR code de la boutique et message de fin,
 * avec l'aperçu du ticket. Réservé au propriétaire ; fonctionne hors ligne.
 */
import { useMemo, useState } from "react";
import { Alert, Button, FileButton, Group, Image, Paper, SimpleGrid, Stack, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPhotoUp, IconTrash } from "@tabler/icons-react";
import { updateReceipt, type Boutique } from "../data/boutique";
import { bitmapDataUrl, logoFromFile } from "../data/bitmapCanvas";
import { errorMessage } from "../data/errors";
import { unpack } from "../lib/bitmap";
import { receiptLines, sampleSale, type ReceiptSettings } from "../lib/receipt";
import { Receipt } from "./Receipt";

function onError(e: unknown) {
  notifications.show({ color: "red", title: "Enregistrement refusé", message: errorMessage(e), autoClose: false });
}

const FIELDS: { key: Exclude<keyof ReceiptSettings, "logo">; label: string; placeholder: string; max: number }[] = [
  { key: "address", label: "Adresse", placeholder: "12, av. Kasa-Vubu, Kinshasa", max: 160 },
  { key: "phone", label: "Téléphone", placeholder: "+243 …", max: 40 },
  { key: "rccm", label: "RCCM", placeholder: "CD/KIN/RCCM/…", max: 60 },
  { key: "idNat", label: "ID NAT", placeholder: "01-…", max: 60 },
  { key: "taxId", label: "N° impôt", placeholder: "A…", max: 60 },
];

export function ReceiptCard({ boutique }: { boutique: Boutique }) {
  const [form, setForm] = useState<ReceiptSettings>(boutique.receipt);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof ReceiptSettings, v: ReceiptSettings[keyof ReceiptSettings]) => setForm((f) => ({ ...f, [k]: v }));
  const changed = JSON.stringify(form) !== JSON.stringify(boutique.receipt);

  const logoUrl = useMemo(() => (form.logo ? bitmapDataUrl(unpack(form.logo)) : ""), [form.logo]);
  const preview = useMemo(
    () => receiptLines({ ...form, name: boutique.name }, sampleSale(boutique.currency, Date.now())),
    [form, boutique.name, boutique.currency],
  );
  const badLink = !!form.link?.trim() && !/^(https?:\/\/|wa\.me\/|www\.)/i.test(form.link.trim());

  async function pickLogo(file: File | null) {
    if (!file) return;
    setBusy(true);
    try {
      set("logo", await logoFromFile(file));
    } catch (e) {
      notifications.show({ color: "red", title: "Logo", message: (e as Error)?.message || errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Paper p="md">
      <Title order={4} mb={4}>
        Ticket de caisse
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        Ce qui s'imprime en haut et en bas de chaque ticket. Tout est facultatif.
      </Text>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        <Stack style={{ flex: "1 1 280px" }}>
          <div>
            <Text size="sm" fw={500} mb={4}>
              Logo
            </Text>
            <Group>
              {logoUrl && <Image src={logoUrl} alt="Logo du ticket" w={120} fit="contain" style={{ imageRendering: "pixelated", background: "#fff" }} />}
              <FileButton onChange={pickLogo} accept="image/*">
                {(props) => (
                  <Button {...props} variant="default" leftSection={<IconPhotoUp size={18} />} loading={busy}>
                    {form.logo ? "Changer le logo" : "Ajouter un logo"}
                  </Button>
                )}
              </FileButton>
              {form.logo && (
                <Button variant="subtle" color="red" leftSection={<IconTrash size={18} />} onClick={() => set("logo", null)}>
                  Retirer
                </Button>
              )}
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              Imprimé en noir et blanc. Un logo simple, sur fond blanc, sort le mieux.
            </Text>
          </div>

          <SimpleGrid cols={{ base: 1, xs: 2 }}>
            {FIELDS.map((f) => (
              <TextInput
                key={f.key}
                label={f.label}
                placeholder={f.placeholder}
                maxLength={f.max}
                value={form[f.key] ?? ""}
                onChange={(e) => set(f.key, e.currentTarget.value)}
              />
            ))}
          </SimpleGrid>

          <TextInput
            label="Lien du QR code de la boutique"
            description="Votre WhatsApp (https://wa.me/243…), page Facebook, TikTok ou site. Laisser vide pour ne pas l'imprimer."
            placeholder="https://wa.me/243…"
            maxLength={300}
            value={form.link ?? ""}
            onChange={(e) => set("link", e.currentTarget.value)}
            error={badLink ? "Le lien doit commencer par https://" : undefined}
          />
          <TextInput
            label="Phrase sous le QR code"
            placeholder="Scannez et suivez-nous"
            maxLength={60}
            value={form.linkLabel ?? ""}
            onChange={(e) => set("linkLabel", e.currentTarget.value)}
          />
          <TextInput
            label="Message de fin"
            placeholder="Merci et à bientôt !"
            maxLength={120}
            value={form.footer ?? ""}
            onChange={(e) => set("footer", e.currentTarget.value)}
          />
          <Alert color="gray" p="xs">
            <Text size="xs">
              Le bas de chaque ticket porte aussi un petit QR code vitePOS. Les rouleaux ordinaires ne s'impriment que
              d'un côté : tout est au recto.
            </Text>
          </Alert>
          <Group>
            <Button
              disabled={!changed || badLink}
              onClick={() => {
                updateReceipt(boutique.id, form, onError);
                notifications.show({ color: "navy", message: "Enregistré" });
              }}
            >
              Enregistrer
            </Button>
            {changed && (
              <Button variant="subtle" onClick={() => setForm(boutique.receipt)}>
                Annuler les changements
              </Button>
            )}
          </Group>
        </Stack>
        <div style={{ flex: "1 1 240px", display: "flex", justifyContent: "center" }}>
          <Receipt lines={preview} width={boutique.paperWidthMm} />
        </div>
      </div>
    </Paper>
  );
}
