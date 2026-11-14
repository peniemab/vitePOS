/** Paramètres : taux du jour en premier (on le change souvent), réglages de la boutique, ticket, imprimante, mon compte, apparence. */
import { useState } from "react";
import { Button, Group, NumberInput, Paper, SegmentedControl, Stack, Switch, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useReady } from "../data/session";
import { updateBoutique, updateOwnName, updateRate } from "../data/boutique";
import { errorMessage } from "../data/errors";
import { PageTitle } from "../components/ui";
import { confirmLogout } from "../components/Layout";
import { ThemeSwitch } from "../components/ThemeSwitch";
import { PrinterCard } from "../components/PrinterCard";
import { ReceiptCard } from "../components/ReceiptCard";
import { CURRENCIES, CURRENCY_LIST, type Currency } from "../lib/fx";
import { displayLogin } from "../lib/login";

function onError(e: unknown) {
  notifications.show({ color: "red", title: "Enregistrement refusé", message: errorMessage(e), autoClose: false });
}

function saved() {
  notifications.show({ color: "teal", message: "Enregistré" });
}

/** « aujourd'hui à 08:15 », « le 12 octobre ». */
function updatedOn(ms: number): string {
  const d = new Date(ms);
  if (d.toDateString() === new Date().toDateString()) return `aujourd'hui à ${new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(d)}`;
  return `le ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(d)}`;
}

export function SettingsScreen() {
  const { boutique, member } = useReady();
  const isOwner = member.role === "proprietaire";
  // Le taux du jour est fixé par le propriétaire ; les autres le voient sans pouvoir le changer.
  const canEditRate = isOwner;

  const [name, setName] = useState(member.name);
  const [usdRate, setUsdRate] = useState<number | string>(boutique.usdRateCdf || "");
  const [eurRate, setEurRate] = useState<number | string>(boutique.eurRateCdf || "");
  const [shopName, setShopName] = useState(boutique.name);

  return (
    <>
      <PageTitle title="Paramètres" />
      <Stack>
        <Paper p="md">
          <Title order={4} mb={4}>
            Taux du jour
          </Title>
          <Text size="sm" c="dimmed" mb="sm">
            {canEditRate ? "Pour convertir les prix quand un client paie dans une autre devise." : "Fixé par le propriétaire."}
          </Text>
          <Stack>
            {(
              [
                { c: "USD", label: "1 $ =", hint: undefined, value: usdRate, set: setUsdRate, current: boutique.usdRateCdf, at: boutique.usdRateUpdatedAtMs },
                { c: "EUR", label: "1 € =", hint: "Seulement si des clients paient en euros.", value: eurRate, set: setEurRate, current: boutique.eurRateCdf, at: boutique.eurRateUpdatedAtMs },
              ] as const
            ).map((r) => (
              <Group key={r.c} align="flex-end" wrap="nowrap">
                <NumberInput
                  label={r.label}
                  description={r.current && r.at ? `Mis à jour ${updatedOn(r.at)}` : r.hint}
                  min={1}
                  thousandSeparator=" "
                  hideControls
                  inputMode="decimal"
                  disabled={!canEditRate}
                  value={r.value}
                  onChange={r.set}
                  rightSection={<Text c="dimmed" fw={600} size="sm">FC</Text>}
                  rightSectionWidth={44}
                  classNames={{ input: "n" }}
                  style={{ flex: 1 }}
                />
                {canEditRate && (
                  <Button
                    disabled={!(Number(r.value) > 0) || Number(r.value) === r.current}
                    onClick={() => {
                      updateRate(boutique.id, r.c, Number(r.value), onError);
                      saved();
                    }}
                  >
                    Mettre à jour
                  </Button>
                )}
              </Group>
            ))}
          </Stack>
        </Paper>

        {isOwner && (
          <Paper p="md">
            <Title order={4} mb="sm">
              Mon activité
            </Title>
            <Stack>
              <Group align="flex-end">
                <TextInput
                  label="Nom de votre activité"
                  maxLength={80}
                  value={shopName}
                  onChange={(e) => setShopName(e.currentTarget.value)}
                  style={{ flex: 1 }}
                />
                <Button
                  disabled={!shopName.trim() || shopName === boutique.name}
                  onClick={() => {
                    updateBoutique(boutique.id, { name: shopName.trim() }, onError);
                    saved();
                  }}
                >
                  Enregistrer
                </Button>
              </Group>
              <div>
                <Text size="sm" fw={500} mb={4}>
                  Devise des prix
                </Text>
                <SegmentedControl
                  fullWidth
                  value={boutique.currency}
                  onChange={(v) => updateBoutique(boutique.id, { currency: v as Currency }, onError)}
                  data={CURRENCY_LIST.map((c) => ({ value: c, label: `${CURRENCIES[c].short} (${CURRENCIES[c].symbol})` }))}
                />
              </div>
              <div>
                <Text size="sm" fw={500} mb={4}>
                  Largeur du papier ticket
                </Text>
                <SegmentedControl
                  fullWidth
                  value={String(boutique.paperWidthMm)}
                  onChange={(v) => updateBoutique(boutique.id, { paperWidthMm: v === "80" ? 80 : 58 }, onError)}
                  data={[
                    { value: "58", label: "58 mm" },
                    { value: "80", label: "80 mm" },
                  ]}
                />
              </div>
              <Switch
                label="Imprimer le ticket automatiquement après chaque vente"
                checked={boutique.autoPrintTicket}
                onChange={(e) => updateBoutique(boutique.id, { autoPrintTicket: e.currentTarget.checked }, onError)}
              />
            </Stack>
          </Paper>
        )}

        {isOwner && <ReceiptCard boutique={boutique} />}

        <PrinterCard shop={{ ...boutique.receipt, name: boutique.name }} currency={boutique.currency} paperWidth={boutique.paperWidthMm} />

        <Paper p="md">
          <Title order={4} mb="sm">
            Mon compte
          </Title>
          <Group align="flex-end">
            <TextInput label="Mon nom" maxLength={80} value={name} onChange={(e) => setName(e.currentTarget.value)} style={{ flex: 1 }} />
            <Button
              disabled={!name.trim() || name === member.name}
              onClick={() => {
                updateOwnName(boutique.id, member.uid, name);
                saved();
              }}
            >
              Enregistrer
            </Button>
          </Group>
          <Text size="sm" c="dimmed" mt="xs">
            {displayLogin(member.email)}
          </Text>
        </Paper>

        <Paper p="md">
          <Title order={4} mb={4}>
            Apparence
          </Title>
          <Text size="sm" c="dimmed" mb="sm">
            L'app est en clair au départ. « Automatique » passe en sombre en même temps que le téléphone. Le mode sombre repose les yeux le soir et économise la batterie.
          </Text>
          <ThemeSwitch />
        </Paper>
        <Button variant="default" color="red" onClick={confirmLogout}>
          Se déconnecter
        </Button>
      </Stack>
    </>
  );
}
