/** Paramètres : mon nom, taux du jour (gérant et propriétaire), réglages de la boutique (propriétaire). */
import { useState } from "react";
import { Button, Group, NumberInput, Paper, SegmentedControl, Stack, Switch, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useReady } from "../data/session";
import { updateBoutique, updateOwnName, updateUsdRate } from "../data/boutique";
import { errorMessage } from "../data/errors";
import { PageTitle } from "../components/ui";
import { confirmLogout } from "../components/Layout";
import type { Currency } from "../lib/fx";

function onError(e: unknown) {
  notifications.show({ color: "red", title: "Enregistrement refusé", message: errorMessage(e), autoClose: false });
}

function saved() {
  notifications.show({ color: "navy", message: "Enregistré" });
}

export function SettingsScreen() {
  const { boutique, member } = useReady();
  const isOwner = member.role === "proprietaire";
  const canEditRate = member.role !== "vendeur";

  const [name, setName] = useState(member.name);
  const [rate, setRate] = useState<number | string>(boutique.usdRateCdf || "");
  const [shopName, setShopName] = useState(boutique.name);

  return (
    <>
      <PageTitle title="Paramètres" />
      <Stack>
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
            {member.email}
          </Text>
        </Paper>

        <Paper p="md">
          <Title order={4} mb="sm">
            Taux du jour
          </Title>
          <Group align="flex-end">
            <NumberInput
              label="FC pour 1 $"
              min={1}
              thousandSeparator=" "
              hideControls
              inputMode="decimal"
              disabled={!canEditRate}
              value={rate}
              onChange={setRate}
              style={{ flex: 1 }}
            />
            {canEditRate && (
              <Button
                disabled={!(Number(rate) > 0) || Number(rate) === boutique.usdRateCdf}
                onClick={() => {
                  updateUsdRate(boutique.id, Number(rate), onError);
                  saved();
                }}
              >
                Mettre à jour
              </Button>
            )}
          </Group>
        </Paper>

        {isOwner && (
          <Paper p="md">
            <Title order={4} mb="sm">
              Boutique
            </Title>
            <Stack>
              <Group align="flex-end">
                <TextInput
                  label="Nom de la boutique"
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
                  data={[
                    { value: "CDF", label: "Franc congolais (FC)" },
                    { value: "USD", label: "Dollar ($)" },
                  ]}
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

        <Button variant="default" color="red" onClick={confirmLogout}>
          Se déconnecter
        </Button>
      </Stack>
    </>
  );
}
