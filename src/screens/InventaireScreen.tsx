/**
 * Inventaire : on compte tout ou partie du stock (scan ou recherche), à plusieurs si besoin,
 * puis on valide : les écarts sont appliqués au stock et notés dans l'historique.
 */
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router";
import { Alert, Badge, Button, Chip, Group, Modal, NumberInput, Paper, Progress, ScrollArea, Stack, Table, Text, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconCheck, IconClipboardCheck } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useActor, useCatalog } from "../data/products";
import { cancelInventory, countProduct, startInventory, validateInventory, watchCountLines, watchInventories, type Inventory } from "../data/inventory";
import { errorMessage } from "../data/errors";
import { BarcodeField } from "../components/BarcodeField";
import { formatQty } from "../components/ProductModal";
import { PageTitle } from "../components/ui";
import { gapTotals, inventoryGaps, type CountLine } from "../lib/inventory";
import { formatMoney } from "../lib/fx";
import { collectCategories, findByCode, matchProduct, sortByName, type Product } from "../lib/products";

export function InventaireScreen() {
  const { boutique, permissions } = useReady();
  const [list, setList] = useState<Inventory[]>();
  const [error, setError] = useState<string>();

  useEffect(() => watchInventories(boutique.id, setList, (e) => setError(errorMessage(e))), [boutique.id]);

  if (!permissions.manageStock) return <Navigate to="/plus" replace />;

  const open = list?.find((i) => i.status === "en_cours");

  return (
    <>
      <PageTitle title="Inventaire" />
      {error && <Text c="red">{error}</Text>}
      {!list && !error && <div className="loading">Chargement…</div>}
      {list && (open ? <Counting inventory={open} /> : <History list={list} />)}
    </>
  );
}

/* ---------- Pas d'inventaire en cours : historique et démarrage ---------- */

function History({ list }: { list: Inventory[] }) {
  const { boutique } = useReady();
  const actor = useActor();
  const [label, setLabel] = useState(() => `Inventaire du ${new Intl.DateTimeFormat("fr-FR").format(Date.now())}`);
  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });

  return (
    <Stack>
      <Paper p="md">
        <Text mb="sm">
          Comptez les articles en rayon : tout le magasin ou seulement une catégorie. Les produits non comptés ne sont pas
          touchés.
        </Text>
        <Group align="flex-end">
          <TextInput label="Nom de l'inventaire" maxLength={80} value={label} onChange={(e) => setLabel(e.currentTarget.value)} style={{ flex: 1 }} />
          <Button leftSection={<IconClipboardCheck size={18} />} onClick={() => startInventory(actor, label)}>
            Commencer
          </Button>
        </Group>
      </Paper>
      {list.length > 0 && (
        <Paper p={0} style={{ overflow: "hidden" }}>
          {list.map((i) => (
            <div key={i.id} className="list-row" style={{ padding: "12px 16px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6}>
                  <Text fw={600} truncate>
                    {i.label || "Inventaire"}
                  </Text>
                  <Badge size="xs" variant="light" color={i.status === "validee" ? "teal" : "gray"}>
                    {i.status === "validee" ? "Validé" : "Annulé"}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  {i.createdAtMs ? fmt.format(i.createdAtMs) : "—"} · {i.validatedByName || i.createdByName}
                  {i.status === "validee" ? ` · ${i.gapsCount} écart${i.gapsCount > 1 ? "s" : ""}` : ""}
                </Text>
              </div>
              {i.status === "validee" && i.missingValue > 0 && (
                <Text size="sm" c="red" className="n">
                  −{formatMoney(i.missingValue, boutique.currency)}
                </Text>
              )}
            </div>
          ))}
        </Paper>
      )}
    </Stack>
  );
}

/* ---------- Comptage en cours ---------- */

function Counting({ inventory }: { inventory: Inventory }) {
  const { boutique } = useReady();
  const actor = useActor();
  const { products } = useCatalog();
  const [lines, setLines] = useState<Map<string, CountLine>>();
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const [category, setCategory] = useState("");
  const [show, setShow] = useState<"todo" | "done">("todo");
  const [editing, setEditing] = useState<Product | null>(null);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => watchCountLines(boutique.id, inventory.id, setLines, () => setLines(new Map())), [boutique.id, inventory.id]);

  const active = useMemo(() => (products ?? []).filter((p) => !p.archived), [products]);
  const categories = useMemo(() => collectCategories(active), [active]);
  const counted = lines?.size ?? 0;
  const list = useMemo(() => {
    let l = active.filter((p) => (show === "done" ? lines?.has(p.id) : !lines?.has(p.id)));
    if (category) l = l.filter((p) => p.category === category);
    return sortByName(l.filter((p) => matchProduct(p, query)));
  }, [active, lines, show, category, query]);

  function onScan(code: string) {
    const p = findByCode(active, code);
    if (p) {
      setEditing(p);
      setQ("");
    }
  }

  return (
    <>
      <Paper p="md" mb="md">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>{inventory.label || "Inventaire en cours"}</Text>
          <Text size="sm" c="dimmed">
            {counted} / {active.length} comptés
          </Text>
        </Group>
        <Progress value={active.length ? (counted / active.length) * 100 : 0} mb="sm" />
        <Group gap="xs">
          <Button leftSection={<IconCheck size={18} />} disabled={!counted} onClick={() => setReviewing(true)}>
            Vérifier et valider
          </Button>
          <Button
            variant="subtle"
            color="red"
            onClick={() =>
              modals.openConfirmModal({
                title: "Abandonner cet inventaire ?",
                children: <Text size="sm">Les comptages seront perdus et le stock ne changera pas.</Text>,
                labels: { confirm: "Abandonner", cancel: "Continuer à compter" },
                confirmProps: { color: "red" },
                onConfirm: () => cancelInventory(actor, inventory.id),
              })
            }
          >
            Abandonner
          </Button>
        </Group>
      </Paper>

      <div className="sticky-tools">
        <BarcodeField value={q} onChange={setQ} onScan={onScan} placeholder="Scanner ou chercher l'article compté" />
        <Group gap="xs" mt="xs" wrap="nowrap">
          <Chip.Group value={show} onChange={(v) => setShow(v as "todo" | "done")}>
            <Chip value="todo" size="sm">
              À compter
            </Chip>
            <Chip value="done" size="sm">
              Comptés ({counted})
            </Chip>
          </Chip.Group>
        </Group>
        {categories.length > 1 && (
          <ScrollArea type="never" mt="xs">
            <Chip.Group value={category} onChange={(v) => setCategory(v as string)}>
              <Group gap={6} wrap="nowrap">
                <Chip value="" size="sm" variant="outline">
                  Toutes
                </Chip>
                {categories.map((c) => (
                  <Chip key={c} value={c} size="sm" variant="outline">
                    {c}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          </ScrollArea>
        )}
      </div>

      <Paper p={0} style={{ overflow: "hidden" }}>
        {list.slice(0, 150).map((p) => {
          const line = lines?.get(p.id);
          const delta = line ? line.counted - line.theoretical : 0;
          return (
            <div key={p.id} className="list-row" style={{ padding: "10px 16px", cursor: "pointer" }} onClick={() => setEditing(p)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text fw={600} truncate>
                  {p.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {p.sku ? `${p.sku} · ` : ""}{p.category} · enregistré : {formatQty(line ? line.theoretical : p.stock, p.unit)}
                </Text>
              </div>
              {line ? (
                <div style={{ textAlign: "right" }}>
                  <Text fw={700} className="n">
                    {formatQty(line.counted, p.unit)}
                  </Text>
                  {delta !== 0 && (
                    <Text size="xs" c={delta < 0 ? "red" : "teal"} className="n">
                      {delta > 0 ? "+" : ""}
                      {formatQty(delta, p.unit)}
                    </Text>
                  )}
                </div>
              ) : (
                <Button size="xs" variant="light">
                  Compter
                </Button>
              )}
            </div>
          );
        })}
        {!list.length && (
          <Text c="dimmed" ta="center" p="xl">
            {show === "todo" ? "Tout est compté dans ce filtre." : "Aucun article compté pour l'instant."}
          </Text>
        )}
      </Paper>

      <CountModal
        product={editing}
        current={editing ? lines?.get(editing.id)?.counted : undefined}
        onClose={() => setEditing(null)}
        onSave={(n) => {
          if (editing) countProduct(actor, inventory.id, editing, n);
          setEditing(null);
        }}
      />
      {lines && (
        <ReviewModal opened={reviewing} onClose={() => setReviewing(false)} inventory={inventory} lines={[...lines.values()]} products={active} />
      )}
    </>
  );
}

function CountModal({ product, current, onClose, onSave }: { product: Product | null; current?: number; onClose: () => void; onSave: (n: number) => void }) {
  const [value, setValue] = useState<number | string>("");
  useEffect(() => setValue(current ?? ""), [product?.id, current]);
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  const ok = value !== "" && Number.isFinite(n) && n >= 0;
  return (
    <Modal opened={!!product} onClose={onClose} title={product?.name}>
      {product && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (ok) onSave(n);
          }}
        >
          <Stack>
            <Text size="sm" c="dimmed">
              Stock enregistré : {formatQty(product.stock, product.unit)}
            </Text>
            <NumberInput
              label={`Quantité comptée${product.unit === "u" ? "" : ` (${product.unit})`}`}
              autoFocus
              min={0}
              decimalSeparator=","
              decimalScale={product.unit === "u" ? 0 : 3}
              hideControls
              inputMode="decimal"
              size="lg"
              value={value}
              onChange={setValue}
            />
            <Button type="submit" disabled={!ok}>
              Enregistrer le comptage
            </Button>
          </Stack>
        </form>
      )}
    </Modal>
  );
}

function ReviewModal({
  opened,
  onClose,
  inventory,
  lines,
  products,
}: {
  opened: boolean;
  onClose: () => void;
  inventory: Inventory;
  lines: CountLine[];
  products: Product[];
}) {
  const { boutique } = useReady();
  const actor = useActor();
  const prices = useMemo(() => new Map(products.map((p) => [p.id, p.sellPrice])), [products]);
  const gaps = useMemo(() => inventoryGaps(lines, prices), [lines, prices]);
  const totals = gapTotals(gaps);
  const c = boutique.currency;

  return (
    <Modal opened={opened} onClose={onClose} title="Vérifier l'inventaire" size="lg">
      <Stack>
        <Text>
          {lines.length} article{lines.length > 1 ? "s" : ""} compté{lines.length > 1 ? "s" : ""},{" "}
          <b>
            {gaps.length} écart{gaps.length > 1 ? "s" : ""}
          </b>
          .
        </Text>
        {gaps.length > 0 ? (
          <>
            <Alert color={totals.missingValue > 0 ? "red" : "teal"}>
              Manquant : <b className="n">{formatMoney(totals.missingValue, c)}</b> · Surplus :{" "}
              <b className="n">{formatMoney(totals.surplusValue, c)}</b> (au prix de vente)
            </Alert>
            <Table.ScrollContainer minWidth={360}>
              <Table fz="sm" striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Article</Table.Th>
                    <Table.Th ta="right">Écart</Table.Th>
                    <Table.Th ta="right">Valeur</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {gaps.slice(0, 50).map((g) => (
                    <Table.Tr key={g.productId}>
                      <Table.Td>{g.name}</Table.Td>
                      <Table.Td ta="right" className="n" c={g.delta < 0 ? "red" : "teal"}>
                        {g.delta > 0 ? "+" : ""}
                        {formatQty(g.delta, g.unit)}
                      </Table.Td>
                      <Table.Td ta="right" className="n">
                        {formatMoney(g.value, c)}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            {gaps.length > 50 && (
              <Text size="sm" c="dimmed">
                … et {gaps.length - 50} autres écarts.
              </Text>
            )}
          </>
        ) : (
          <Alert color="teal">Aucun écart : le stock compté correspond au stock enregistré.</Alert>
        )}
        <Text size="sm" c="dimmed">
          En validant, le stock de chaque article devient la quantité comptée, en tenant compte des ventes faites
          depuis le comptage. L'historique garde la trace de chaque écart.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Continuer à compter
          </Button>
          <Button
            leftSection={<IconCheck size={18} />}
            onClick={() => {
              validateInventory(actor, inventory.id, gaps, totals);
              onClose();
            }}
          >
            Valider l'inventaire
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
