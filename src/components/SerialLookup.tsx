/** Retrouver un appareil par son IMEI : quand un client revient, on voit la vente et la fin de garantie. */
import { useState } from "react";
import { Link } from "react-router";
import { Badge, Button, Group, Paper, Text, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { findSerial, type Serial } from "../data/serials";
import { ScanButton } from "./BarcodeField";
import { ScanVideo } from "./ScanVideo";
import { canUseCamera, useCameraScan } from "./useCameraScan";
import { dayKey } from "../lib/cart";
import { formatDayShort, normalizeSerial } from "../lib/serials";

const STATUS = { en_stock: "En stock", vendu: "Vendu", retire: "Sorti du stock" } as const;

export function SerialLookup() {
  const { boutique } = useReady();
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<Serial | null | undefined>();
  const [error, setError] = useState("");
  const scan = useCameraScan((code) => {
    setTyped(code);
    void search(code);
  });

  async function search(code: string) {
    const s = normalizeSerial(code);
    setError("");
    setResult(undefined);
    if (s.length < 4) return;
    try {
      setResult(await findSerial(boutique.id, s));
    } catch {
      setError("Recherche impossible hors ligne pour un appareil ancien. Réessayez avec du réseau.");
    }
  }

  const today = dayKey(Date.now());
  const covered = result?.warrantyUntil ? result.warrantyUntil >= today : false;

  return (
    <Paper p="md" mt="lg">
      <Text fw={700} mb={4}>
        Retrouver un appareil (garantie)
      </Text>
      <Group align="flex-end" gap="xs" wrap="nowrap">
        <TextInput
          style={{ flex: 1 }}
          placeholder="IMEI ou numéro de série"
          autoComplete="off"
          value={typed}
          onChange={(e) => setTyped(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void search(typed);
            }
          }}
          rightSection={canUseCamera() ? <ScanButton scanning={scan.scanning} onClick={() => (scan.scanning ? scan.stop() : void scan.start())} /> : undefined}
        />
        <Button leftSection={<IconSearch size={16} />} onClick={() => void search(typed)}>
          Chercher
        </Button>
      </Group>
      <ScanVideo videoRef={scan.videoRef} scanning={scan.scanning} error={scan.error} />
      {error && (
        <Text size="sm" c="red" mt="xs">
          {error}
        </Text>
      )}
      {result === null && (
        <Text size="sm" c="dimmed" mt="xs">
          Aucun appareil avec ce numéro dans la boutique.
        </Text>
      )}
      {result && (
        <div style={{ marginTop: 10 }}>
          <Group gap="xs">
            <Text fw={600}>{result.productName}</Text>
            <Badge variant="light" color={result.status === "vendu" ? "blue" : result.status === "en_stock" ? "teal" : "gray"}>
              {STATUS[result.status]}
            </Badge>
          </Group>
          <Text size="sm" className="n">
            {result.serial}
          </Text>
          {result.status === "vendu" && (
            <>
              <Text size="sm">
                Vendu le {formatDayShort(result.soldDay)}
                {result.warrantyUntil ? ` · garantie jusqu'au ${formatDayShort(result.warrantyUntil)}` : " · sans garantie"}
              </Text>
              {result.warrantyUntil && (
                <Badge mt={4} variant="light" color={covered ? "teal" : "red"}>
                  {covered ? "Encore sous garantie" : "Garantie terminée"}
                </Badge>
              )}
              <div>
                <Button component={Link} to={`/ticket/${result.saleId}`} variant="subtle" size="xs" mt={4} px={0}>
                  Voir le ticket
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Paper>
  );
}
