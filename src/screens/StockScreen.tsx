/** Stock : catalogue, recherche et scan, catégories, alertes, archives, export CSV. */
import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge, Button, Chip, Group, Menu, Paper, ScrollArea, SegmentedControl, Text, UnstyledButton } from "@mantine/core";
import { IconAlertTriangle, IconDots, IconDownload, IconPlus, IconStarFilled, IconTag, IconUpload } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { assignMissingSkus, useActor, useCatalog } from "../data/products";
import { BarcodeField } from "../components/BarcodeField";
import { formatQty, MovementModal, ProductModal } from "../components/ProductModal";
import { Money, PageTitle } from "../components/ui";
import { exportProductsCsv } from "../lib/csv";
import type { Currency } from "../lib/fx";
import { collectCategories, findScan, matchProduct, needsRestock, sortByName, stockLevel, type Product } from "../lib/products";

const PAGE_SIZE = 60;

type Filter = "all" | "alerts" | "archived";

export function downloadText(filename: string, text: string) {
  const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function StockScreen() {
  const { boutique, permissions } = useReady();
  const { products, costs, error } = useCatalog();
  const actor = useActor();
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState<string>("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState<{ barcode?: string } | null>(null);
  // Paquet ou carton scanné : on ouvre directement la réception, comptée en paquets.
  const [receiving, setReceiving] = useState<{ productId: string; packId: string } | null>(null);

  const all = products ?? [];
  const active = useMemo(() => all.filter((p) => !p.archived), [all]);
  const alerts = useMemo(() => active.filter(needsRestock).length, [active]);
  const missingSkus = useMemo(() => all.filter((p) => !p.sku).length, [all]);
  const categories = useMemo(() => collectCategories(active), [active]);

  const list = useMemo(() => {
    let l: Product[] = filter === "archived" ? all.filter((p) => p.archived) : active;
    if (filter === "alerts") l = l.filter(needsRestock);
    if (category) l = l.filter((p) => p.category === category);
    l = l.filter((p) => matchProduct(p, query));
    return filter === "alerts" ? [...l].sort((a, b) => a.stock - b.stock) : sortByName(l);
  }, [all, active, filter, category, query]);

  const opened = openId ? all.find((p) => p.id === openId) ?? null : null;
  const receivingProduct = receiving ? all.find((p) => p.id === receiving.productId) : undefined;

  function onScan(code: string) {
    const found = findScan(active, code);
    if (found?.pack && permissions.manageStock) {
      setReceiving({ productId: found.product.id, packId: found.pack.id });
      setQ("");
    } else if (found) {
      setOpenId(found.product.id);
      setQ("");
    } else if (permissions.editPrices && /^\d{6,}$/.test(code)) {
      // Code inconnu : on propose de créer le produit avec ce code.
      setCreating({ barcode: code });
      setQ("");
    }
  }

  function exportCsv() {
    downloadText(`produits-${boutique.name.replace(/\s+/g, "-")}.csv`, exportProductsCsv(active, costs));
  }

  return (
    <>
      <PageTitle
        title="Stock"
        sub={products ? `${active.length} produit${active.length > 1 ? "s" : ""}` : undefined}
        right={
          <Group gap="xs">
            {permissions.editPrices && (
              <Button leftSection={<IconPlus size={18} />} onClick={() => setCreating({})}>
                Ajouter
              </Button>
            )}
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <Button variant="default" px="sm" aria-label="Plus d'actions">
                  <IconDots size={18} />
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {permissions.editPrices && (
                  <Menu.Item component={Link} to="/stock/import" leftSection={<IconUpload size={16} />}>
                    Importer un fichier CSV
                  </Menu.Item>
                )}
                {permissions.editPrices && missingSkus > 0 && (
                  <Menu.Item leftSection={<IconTag size={16} />} onClick={() => assignMissingSkus(actor, all)}>
                    Donner un code aux {missingSkus} produit{missingSkus > 1 ? "s" : ""} sans code
                  </Menu.Item>
                )}
                <Menu.Item leftSection={<IconDownload size={16} />} onClick={exportCsv} disabled={!active.length}>
                  Exporter en CSV
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        }
      />

      <div className="sticky-tools">
        <BarcodeField value={q} onChange={(v) => { setQ(v); setVisible(PAGE_SIZE); }} onScan={onScan} />
        <Group gap="xs" mt="xs" wrap="nowrap">
          <SegmentedControl
            size="sm"
            value={filter}
            onChange={(v) => { setFilter(v as Filter); setVisible(PAGE_SIZE); }}
            data={[
              { value: "all", label: "Tous" },
              { value: "alerts", label: `Alertes${alerts ? ` (${alerts})` : ""}` },
              { value: "archived", label: "Archivés" },
            ]}
          />
        </Group>
        {categories.length > 1 && (
          <ScrollArea type="never" mt="xs">
            <Chip.Group value={category} onChange={(v) => { setCategory(v as string); setVisible(PAGE_SIZE); }}>
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

      {error && <Text c="red" mb="md">{error}</Text>}
      {!products && !error && <div className="loading">Chargement…</div>}

      {products && (
        <Paper p={0} style={{ overflow: "hidden" }}>
          {list.slice(0, visible).map((p) => (
            <ProductRow key={p.id} product={p} currency={boutique.currency} onOpen={() => setOpenId(p.id)} />
          ))}
          {!list.length && (
            <Text c="dimmed" ta="center" p="xl">
              {active.length === 0 && filter === "all"
                ? "Aucun produit pour l'instant. Ajoutez-en un ou importez votre catalogue en CSV."
                : filter === "alerts" && !query && !category
                  ? "Aucune alerte : tout est en stock."
                  : "Aucun produit ne correspond."}
            </Text>
          )}
          {list.length > visible && (
            <Group justify="center" p="sm">
              <Button variant="subtle" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
                Afficher plus ({list.length - visible} restants)
              </Button>
            </Group>
          )}
        </Paper>
      )}

      <ProductModal product={opened} opened={!!opened} onClose={() => setOpenId(null)} />
      {receivingProduct && (
        <MovementModal
          product={receivingProduct}
          opened
          initialPackId={receiving?.packId}
          onClose={() => setReceiving(null)}
          onDone={() => setReceiving(null)}
        />
      )}
      <ProductModal
        product={null}
        opened={!!creating}
        onClose={() => setCreating(null)}
        defaultCategory={category || undefined}
        defaultBarcode={creating?.barcode}
      />
    </>
  );
}

function ProductRow({ product: p, currency, onOpen }: { product: Product; currency: Currency; onOpen: () => void }) {
  const level = stockLevel(p);
  return (
    <UnstyledButton className="list-row" px="md" onClick={onOpen} style={{ opacity: p.archived ? 0.6 : 1 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Group gap={6} wrap="nowrap">
          {p.favorite && <IconStarFilled size={14} color="var(--mantine-color-yellow-6)" style={{ flexShrink: 0 }} />}
          <Text fw={600} truncate>
            {p.name}
          </Text>
        </Group>
        <Text size="xs" c="dimmed" truncate>
          {p.sku ? <b>{p.sku}</b> : null}
          {p.sku ? " · " : ""}
          {p.category}
          {p.barcode ? ` · ${p.barcode}` : ""}
        </Text>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <Text fw={600}>
          <Money value={p.sellPrice} currency={currency} />
        </Text>
        {level === "ok" ? (
          <Text size="sm" c="dimmed" className="n">
            {formatQty(p.stock, p.unit)} en stock
          </Text>
        ) : (
          <Badge
            size="sm"
            variant="light"
            color={level === "empty" ? "red" : "orange"}
            leftSection={<IconAlertTriangle size={12} />}
          >
            {level === "empty" ? "Rupture" : `${formatQty(p.stock, p.unit)} restant${p.stock > 1 ? "s" : ""}`}
          </Badge>
        )}
      </div>
    </UnstyledButton>
  );
}
