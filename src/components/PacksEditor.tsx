/**
 * Emballages d'un produit (paquet, carton…) : chacun a son code-barres et son prix,
 * mais le stock reste compté à l'unité.
 */
import { useState } from "react";
import { ActionIcon, Autocomplete, Button, Group, NumberInput, Paper, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { ScanButton } from "./BarcodeField";
import { ScanVideo } from "./ScanVideo";
import { canUseCamera, useCameraScan } from "./useCameraScan";
import { Money } from "./ui";
import { CURRENCIES, type Currency } from "../lib/fx";
import { MAX_PACKS, type Unit } from "../lib/products";

export interface PackDraft {
  id: string;
  name: string;
  barcode: string;
  units: number | string;
  price: number | string;
}

const PACK_NAMES = ["Paquet", "Carton", "Pack", "Casier", "Boîte", "Sac", "Bidon", "Douzaine"];

const newId = () => Math.random().toString(36).slice(2, 10);

interface Props {
  packs: PackDraft[];
  onChange: (packs: PackDraft[]) => void;
  unit: Unit;
  currency: Currency;
  readOnly: boolean;
  /** Message si un code-barres est déjà pris par un autre produit. */
  takenBy: (barcode: string) => string | undefined;
}

export function PacksEditor({ packs, onChange, unit, currency, readOnly, takenBy }: Props) {
  const [scanIndex, setScanIndex] = useState<number | null>(null);
  const cam = useCameraScan((code) => {
    if (scanIndex != null) set(scanIndex, { barcode: code });
    setScanIndex(null);
  });
  const unitWord = unit === "u" ? "unités" : unit;
  const dec = CURRENCIES[currency].decimals;

  function set(i: number, patch: Partial<PackDraft>) {
    onChange(packs.map((k, j) => (j === i ? { ...k, ...patch } : k)));
  }

  if (readOnly && !packs.length) return null;

  return (
    <div>
      <Text size="sm" fw={500}>
        Emballages
      </Text>
      <Text size="xs" c="dimmed" mb={6}>
        Paquet, carton… avec son propre code-barres et son prix. Le stock reste compté à l'unité : vendre un paquet de 24
        retire 24 du stock.
      </Text>
      <Stack gap="xs">
        {packs.map((k, i) => {
          const units = Number(k.units) || 0;
          const price = Number(k.price) || 0;
          const taken = k.barcode.trim() ? takenBy(k.barcode.trim()) : undefined;
          return (
            <Paper key={k.id} withBorder p="sm" radius="md">
              <Stack gap="xs">
                <Group gap="xs" align="flex-end" wrap="nowrap">
                  <Autocomplete
                    label="Nom"
                    placeholder="Paquet"
                    style={{ flex: 1 }}
                    readOnly={readOnly}
                    maxLength={40}
                    data={PACK_NAMES}
                    value={k.name}
                    onChange={(v) => set(i, { name: v })}
                  />
                  {!readOnly && (
                    <ActionIcon variant="subtle" color="red" size="lg" mb={2} aria-label="Retirer l'emballage" onClick={() => onChange(packs.filter((_, j) => j !== i))}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  )}
                </Group>
                <SimpleGrid cols={2} spacing="xs">
                  <NumberInput
                    label={`Contient (${unitWord})`}
                    placeholder="24"
                    readOnly={readOnly}
                    min={0}
                    decimalSeparator=","
                    decimalScale={unit === "u" ? 0 : 3}
                    hideControls
                    inputMode="decimal"
                    value={k.units}
                    onChange={(v) => set(i, { units: v })}
                  />
                  <NumberInput
                    label={`Prix (${CURRENCIES[currency].symbol})`}
                    readOnly={readOnly}
                    min={0}
                    thousandSeparator=" "
                    decimalSeparator=","
                    decimalScale={dec}
                    hideControls
                    inputMode="decimal"
                    value={k.price}
                    onChange={(v) => set(i, { price: v })}
                  />
                </SimpleGrid>
                {units > 0 && price > 0 && (
                  <Text size="xs" c="dimmed" mt={-4}>
                    Soit <Money value={price / units} currency={currency} /> {unit === "u" ? "l'unité" : `le ${unit}`} dans ce {k.name.toLowerCase() || "paquet"}.
                  </Text>
                )}
                <div>
                  <TextInput
                    label="Code-barres de l'emballage"
                    readOnly={readOnly}
                    maxLength={64}
                    inputMode="numeric"
                    autoComplete="off"
                    value={k.barcode}
                    error={taken ? `Déjà utilisé par « ${taken} »` : undefined}
                    rightSection={
                      !readOnly && canUseCamera() ? (
                        <ScanButton
                          scanning={cam.scanning && scanIndex === i}
                          onClick={() => {
                            if (cam.scanning) {
                              cam.stop();
                              setScanIndex(null);
                            } else {
                              setScanIndex(i);
                              void cam.start();
                            }
                          }}
                        />
                      ) : undefined
                    }
                    onChange={(e) => set(i, { barcode: e.currentTarget.value })}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  />
                  {scanIndex === i && <ScanVideo videoRef={cam.videoRef} scanning={cam.scanning} error={cam.error} />}
                </div>
              </Stack>
            </Paper>
          );
        })}
        {!readOnly && packs.length < MAX_PACKS && (
          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={() => onChange([...packs, { id: newId(), name: packs.length ? "Carton" : "Paquet", barcode: "", units: "", price: "" }])}
          >
            Ajouter un paquet ou un carton
          </Button>
        )}
      </Stack>
    </div>
  );
}
