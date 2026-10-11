/** Import du catalogue depuis un fichier CSV (Excel → « Enregistrer sous CSV »). */
import { useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router";
import { Alert, Anchor, Button, FileButton, Group, Paper, Stack, Table, Text, Textarea, Title } from "@mantine/core";
import { IconArrowLeft, IconCheck, IconDownload, IconFileUpload } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { importProducts, useActor, useCatalog } from "../data/products";
import { Money, PageTitle } from "../components/ui";
import { formatQty } from "../components/ProductModal";
import { downloadText } from "./StockScreen";
import { CSV_HEADER, CSV_TEMPLATE, parseProductCsv, planImport, type ParseResult } from "../lib/csv";

export function ImportScreen() {
  const { boutique, permissions } = useReady();
  const actor = useActor();
  const { products } = useCatalog();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParseResult>();
  const [done, setDone] = useState<{ created: number; updated: number }>();
  const resetRef = useRef<() => void>(null);

  const plan = useMemo(() => (parsed && products ? planImport(parsed.rows, products) : undefined), [parsed, products]);
  const stockChanges = plan
    ? plan.creates.filter((c) => c.stock !== 0).length + plan.updates.filter((u) => u.stockDelta !== 0).length
    : 0;

  if (!permissions.editPrices) return <Navigate to="/stock" replace />;

  function analyse(t: string) {
    setText(t);
    setParsed(parseProductCsv(t));
    setDone(undefined);
  }

  async function onFile(file: File | null) {
    if (!file) return;
    analyse(await file.text());
    resetRef.current?.();
  }

  function apply() {
    if (!plan) return;
    setDone(importProducts(actor, plan, permissions.manageStock));
    setParsed(undefined);
    setText("");
  }

  return (
    <>
      <Anchor component={Link} to="/stock" size="sm" c="dimmed">
        <Group gap={4}>
          <IconArrowLeft size={16} /> Stock
        </Group>
      </Anchor>
      <PageTitle title="Importer des produits" sub="Pour les gros catalogues : un fichier CSV, une ligne par produit." />

      {done && (
        <Alert color="teal" icon={<IconCheck size={18} />} mb="md" title="Import enregistré">
          {done.created} produit{done.created > 1 ? "s" : ""} créé{done.created > 1 ? "s" : ""}, {done.updated} mis à jour.
          Hors ligne, l'envoi se fera au retour du réseau.
        </Alert>
      )}

      <Stack>
        <Paper p="md">
          <Title order={4} mb={4}>
            1. Préparer le fichier
          </Title>
          <Text size="sm" c="dimmed" mb="sm">
            Colonnes reconnues : <code>{CSV_HEADER}</code>. Seuls le nom et le prix de vente sont obligatoires. Un produit
            qui existe déjà (même code-barres, ou même nom et catégorie) est mis à jour ; si la colonne stock est remplie,
            elle devient le nouveau stock et l'écart est noté dans l'historique.
          </Text>
          <Group gap="xs">
            <Button variant="default" leftSection={<IconDownload size={18} />} onClick={() => downloadText("modele-produits.csv", CSV_TEMPLATE)}>
              Télécharger le modèle
            </Button>
            <Button variant="subtle" onClick={() => analyse(CSV_TEMPLATE)}>
              Essayer avec l'exemple
            </Button>
          </Group>
        </Paper>

        <Paper p="md">
          <Title order={4} mb="sm">
            2. Choisir le fichier
          </Title>
          <FileButton resetRef={resetRef} onChange={(f) => void onFile(f)} accept=".csv,text/csv,text/plain">
            {(props) => (
              <Button {...props} leftSection={<IconFileUpload size={18} />}>
                Choisir un fichier CSV
              </Button>
            )}
          </FileButton>
          <Textarea
            mt="sm"
            label="Ou collez le contenu ici"
            placeholder={CSV_HEADER}
            minRows={4}
            maxRows={10}
            styles={{ input: { fontFamily: "monospace", fontSize: 13 } }}
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
          />
          <Button mt="xs" variant="default" disabled={!text.trim()} onClick={() => analyse(text)}>
            Analyser
          </Button>
        </Paper>

        {parsed && (
          <Paper p="md">
            <Title order={4} mb="xs">
              3. Vérifier et importer
            </Title>
            {parsed.errors.length > 0 && (
              <Alert color="orange" mb="sm" title={`${parsed.errors.length} ligne${parsed.errors.length > 1 ? "s" : ""} ignorée${parsed.errors.length > 1 ? "s" : ""}`}>
                {parsed.errors.slice(0, 6).map((e) => (
                  <div key={e}>{e}</div>
                ))}
                {parsed.errors.length > 6 && <div>…</div>}
              </Alert>
            )}
            {plan && (plan.creates.length > 0 || plan.updates.length > 0) && (
              <>
                <Text mb="sm">
                  <b>{plan.creates.length}</b> à créer · <b>{plan.updates.length}</b> à mettre à jour
                  {stockChanges > 0 && permissions.manageStock && <> · {stockChanges} changements de stock</>}
                </Text>
                {stockChanges > 0 && !permissions.manageStock && (
                  <Alert color="orange" mb="sm">
                    Vous n'avez pas le droit de modifier le stock : la colonne stock sera ignorée.
                  </Alert>
                )}
                <Table.ScrollContainer minWidth={420} mb="sm">
                  <Table striped fz="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Produit</Table.Th>
                        <Table.Th>Catégorie</Table.Th>
                        <Table.Th ta="right">Prix</Table.Th>
                        <Table.Th ta="right">Stock</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {parsed.rows.slice(0, 15).map((r, i) => (
                        <Table.Tr key={i}>
                          <Table.Td>{r.name}</Table.Td>
                          <Table.Td>{r.category}</Table.Td>
                          <Table.Td ta="right">
                            <Money value={r.sellPrice} currency={boutique.currency} />
                          </Table.Td>
                          <Table.Td ta="right" className="n">
                            {r.stock == null ? "—" : formatQty(r.stock, r.unit)}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                {parsed.rows.length > 15 && (
                  <Text size="sm" c="dimmed" mb="sm">
                    … et {parsed.rows.length - 15} autres lignes.
                  </Text>
                )}
                <Button leftSection={<IconCheck size={18} />} onClick={apply}>
                  Importer {plan.creates.length + plan.updates.length} produit{plan.creates.length + plan.updates.length > 1 ? "s" : ""}
                </Button>
              </>
            )}
          </Paper>
        )}
      </Stack>
    </>
  );
}
