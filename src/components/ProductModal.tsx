/** Fiche produit (création, modification, historique) et saisie d'un mouvement de stock. */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Autocomplete,
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconArchive, IconArrowsExchange, IconArchiveOff, IconDeviceFloppy } from "@tabler/icons-react";
import { useReady } from "../data/session";
import {
  adjustStock,
  createProduct,
  setArchived,
  updateProduct,
  useActor,
  useCanSeeCosts,
  useCatalog,
  watchProductHistory,
  type StockMovement,
} from "../data/products";
import { errorMessage } from "../data/errors";
import { Money } from "./ui";
import { ScanButton } from "./BarcodeField";
import { ScanVideo } from "./ScanVideo";
import { canUseCamera, useCameraScan } from "./useCameraScan";
import { PacksEditor, type PackDraft } from "./PacksEditor";
import { CURRENCIES } from "../lib/fx";
import {
  collectCategories,
  DEFAULT_ALERT_THRESHOLD,
  DEFAULT_CATEGORY,
  findByBarcode,
  nextSku,
  normalizeSku,
  SKU_MAX,
  MOVEMENT_LABELS,
  packLabel,
  roundQuantity,
  signedDelta,
  SUGGESTED_CATEGORIES,
  UNITS,
  validateProduct,
  type ManualMovementType,
  type Product,
  type Unit,
} from "../lib/products";

/** Quantité affichée : « 12 », « 1,5 kg ». */
export function formatQty(q: number, unit: Unit): string {
  const s = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(q).replace(/[  ]/g, " ");
  return unit === "u" ? s : `${s} ${unit}`;
}

const asNumber = (v: number | string) => (typeof v === "number" ? v : Number(String(v).replace(",", ".")) || 0);

/* ---------- Fiche produit ---------- */

interface ProductModalProps {
  /** `null` : nouveau produit. */
  product: Product | null;
  opened: boolean;
  onClose: () => void;
  defaultCategory?: string;
  defaultBarcode?: string;
}

export function ProductModal({ product, opened, onClose, defaultCategory, defaultBarcode }: ProductModalProps) {
  const [tab, setTab] = useState<string | null>("fiche");
  useEffect(() => {
    if (opened) setTab("fiche");
  }, [opened, product?.id]);

  return (
    <Modal opened={opened} onClose={onClose} title={product ? product.name : "Nouveau produit"} size="lg" fullScreen={false}>
      {product ? (
        <Tabs value={tab} onChange={setTab} keepMounted={false}>
          <Tabs.List mb="md">
            <Tabs.Tab value="fiche">Fiche</Tabs.Tab>
            <Tabs.Tab value="historique">Historique</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="fiche">
            <ProductForm product={product} onDone={onClose} />
          </Tabs.Panel>
          <Tabs.Panel value="historique">
            <History product={product} />
          </Tabs.Panel>
        </Tabs>
      ) : (
        opened && <ProductForm product={null} onDone={onClose} defaultCategory={defaultCategory} defaultBarcode={defaultBarcode} />
      )}
    </Modal>
  );
}

function ProductForm({
  product,
  onDone,
  defaultCategory,
  defaultBarcode,
}: {
  product: Product | null;
  onDone: () => void;
  defaultCategory?: string;
  defaultBarcode?: string;
}) {
  const { boutique, permissions } = useReady();
  const actor = useActor();
  const { products, costs } = useCatalog();
  const canSeeCosts = useCanSeeCosts();
  const canEdit = permissions.editPrices;
  const canStock = permissions.manageStock;

  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? defaultCategory ?? DEFAULT_CATEGORY);
  // Code article : proposé à partir de la catégorie tant qu'on ne l'a pas tapé soi-même.
  const [sku, setSku] = useState(product?.sku ?? "");
  const [skuTouched, setSkuTouched] = useState(!!product?.sku);
  const [sellPrice, setSellPrice] = useState<number | string>(product?.sellPrice ?? "");
  const initialCost = product ? costs?.get(product.id) : undefined;
  const [buyPrice, setBuyPrice] = useState<number | string>(initialCost ?? "");
  const [unit, setUnit] = useState<Unit>(product?.unit ?? "u");
  const [stock, setStock] = useState<number | string>(product?.stock ?? 0);
  const [alertThreshold, setAlertThreshold] = useState<number | string>(product?.alertThreshold ?? DEFAULT_ALERT_THRESHOLD);
  const [barcode, setBarcode] = useState(product?.barcode ?? defaultBarcode ?? "");
  const cam = useCameraScan(setBarcode);
  const [packs, setPacks] = useState<PackDraft[]>(product?.packs ?? []);
  const [favorite, setFavorite] = useState(product?.favorite ?? false);
  const [error, setError] = useState<string>();
  const [moveOpen, setMoveOpen] = useState(false);

  const categories = useMemo(
    () => [...new Set([...SUGGESTED_CATEGORIES, ...collectCategories(products ?? [])])].sort((a, b) => a.localeCompare(b, "fr")),
    [products],
  );

  const takenSkus = useMemo(() => (products ?? []).filter((p) => p.id !== product?.id).map((p) => p.sku), [products, product?.id]);
  const suggestedSku = useMemo(() => nextSku(category, takenSkus), [category, takenSkus]);
  const effectiveSku = skuTouched ? normalizeSku(sku) : suggestedSku;
  const skuTaken = effectiveSku ? (products ?? []).find((p) => p.id !== product?.id && p.sku === effectiveSku) : undefined;

  const others = useMemo(() => (products ?? []).filter((p) => p.id !== product?.id), [products, product?.id]);
  const barcodeTaken = barcode.trim() ? findByBarcode(others, barcode) : undefined;
  const packTakenBy = (code: string) => findByBarcode(others, code)?.name;

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    const checked = validateProduct({
      sku: effectiveSku,
      name,
      category,
      sellPrice: asNumber(sellPrice),
      unit,
      alertThreshold: asNumber(alertThreshold),
      barcode,
      favorite,
      packs: packs.map((k) => ({ id: k.id, name: k.name, barcode: k.barcode, units: asNumber(k.units), price: asNumber(k.price) })),
    });
    if ("error" in checked) return setError(checked.error);
    if (barcodeTaken) return setError(`Ce code-barres est déjà utilisé par « ${barcodeTaken.name} ».`);
    for (const k of checked.value.packs ?? []) {
      const owner = k.barcode && packTakenBy(k.barcode);
      if (owner) return setError(`Le code-barres de « ${k.name} » est déjà utilisé par « ${owner} ».`);
    }
    if (skuTaken) return setError(`Le code ${effectiveSku} est déjà utilisé par « ${skuTaken.name} ».`);

    const cost = buyPrice === "" ? undefined : asNumber(buyPrice);
    const newCost = canEdit && cost != null && cost !== initialCost ? cost : undefined;
    const qty = roundQuantity(asNumber(stock), checked.value.unit);
    try {
      if (product) {
        updateProduct(actor, product, checked.value, {
          buyPrice: newCost,
          stockTarget: canStock && qty !== product.stock ? qty : undefined,
        });
      } else {
        createProduct(actor, checked.value, { stock: canStock ? qty : 0, buyPrice: newCost });
      }
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function toggleArchive() {
    if (!product) return;
    if (product.archived) {
      setArchived(actor, product.id, false);
      return onDone();
    }
    modals.openConfirmModal({
      title: "Archiver ce produit ?",
      children: (
        <Text size="sm">
          Il disparaîtra du stock et de la caisse. Son historique est conservé et vous pourrez le restaurer depuis le
          filtre « Archivés ».
        </Text>
      ),
      labels: { confirm: "Archiver", cancel: "Annuler" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        setArchived(actor, product.id, true);
        onDone();
      },
    });
  }

  const readOnly = !canEdit;

  return (
    <form onSubmit={submit}>
      <Stack>
        {product?.archived && (
          <Badge color="gray" variant="light">
            Produit archivé
          </Badge>
        )}
        <SimpleGrid cols={{ base: 1, xs: 2 }}>
          <Autocomplete label="Catégorie" readOnly={readOnly} data={categories} value={category} onChange={setCategory} maxLength={60} />
          <TextInput
            label="Code article"
            description={skuTouched ? "Unique dans la boutique" : "Proposé automatiquement, modifiable"}
            required
            readOnly={readOnly}
            maxLength={SKU_MAX}
            value={skuTouched ? sku : suggestedSku}
            error={skuTaken ? `Déjà utilisé par « ${skuTaken.name} »` : undefined}
            onChange={(e) => {
              setSkuTouched(true);
              setSku(e.currentTarget.value.toUpperCase());
            }}
          />
        </SimpleGrid>
        <TextInput label="Nom" required maxLength={120} readOnly={readOnly} value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <div>
          <TextInput
            label="Code-barres"
            description="Celui d'une seule unité (la bouteille, le savon…) : scannez-le ou tapez-le. Facultatif."
            readOnly={readOnly}
            maxLength={64}
            inputMode="numeric"
            autoComplete="off"
            value={barcode}
            error={barcodeTaken ? `Déjà utilisé par « ${barcodeTaken.name} »` : undefined}
            rightSection={!readOnly && canUseCamera() ? <ScanButton scanning={cam.scanning} onClick={() => (cam.scanning ? cam.stop() : void cam.start())} /> : undefined}
            onChange={(e) => setBarcode(e.currentTarget.value)}
            // La douchette tape le code puis Entrée : on ne valide pas la fiche pour autant.
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          />
          <ScanVideo videoRef={cam.videoRef} scanning={cam.scanning} error={cam.error} />
        </div>
        <SimpleGrid cols={{ base: 1, xs: 2 }}>
          <NumberInput
            label={`Prix de vente (${CURRENCIES[boutique.currency].symbol})`}
            required
            readOnly={readOnly}
            min={0}
            thousandSeparator=" "
            decimalSeparator=","
            decimalScale={CURRENCIES[boutique.currency].decimals}
            hideControls
            inputMode="decimal"
            value={sellPrice}
            onChange={setSellPrice}
          />
          {canSeeCosts && (
            <NumberInput
              label="Prix d'achat"
              description="Visible seulement par le propriétaire et les gérants"
              readOnly={readOnly}
              min={0}
              thousandSeparator=" "
              decimalSeparator=","
              decimalScale={CURRENCIES[boutique.currency].decimals}
              hideControls
              inputMode="decimal"
              value={buyPrice}
              onChange={setBuyPrice}
            />
          )}
        </SimpleGrid>
        <div>
          <Text size="sm" fw={500} mb={4}>
            Vendu à
          </Text>
          <SegmentedControl
            fullWidth
            disabled={readOnly}
            value={unit}
            onChange={(v) => setUnit(v as Unit)}
            data={(Object.keys(UNITS) as Unit[]).map((u) => ({ value: u, label: UNITS[u] }))}
          />
        </div>
        <PacksEditor packs={packs} onChange={setPacks} unit={unit} currency={boutique.currency} readOnly={readOnly} takenBy={packTakenBy} />
        <SimpleGrid cols={{ base: 1, xs: 2 }}>
          <NumberInput
            label={product ? "Stock réel" : "Stock de départ"}
            description={
              !canStock
                ? "Seuls les gérants peuvent modifier le stock"
                : product
                  ? "Si vous le changez, l'écart est noté comme correction"
                  : undefined
            }
            readOnly={!canStock}
            decimalSeparator=","
            decimalScale={unit === "u" ? 0 : 3}
            hideControls
            inputMode="decimal"
            value={stock}
            onChange={setStock}
          />
          <NumberInput
            label="Alerte stock bas à partir de"
            readOnly={readOnly}
            min={0}
            decimalSeparator=","
            decimalScale={unit === "u" ? 0 : 3}
            hideControls
            inputMode="decimal"
            value={alertThreshold}
            onChange={setAlertThreshold}
          />
        </SimpleGrid>
        <Switch label="Favori (affiché en premier à la caisse)" disabled={readOnly} checked={favorite} onChange={(e) => setFavorite(e.currentTarget.checked)} />

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        <Group justify="space-between" mt="xs">
          <Group gap="xs">
            {product && canEdit && (
              <Button
                variant="subtle"
                color={product.archived ? undefined : "red"}
                leftSection={product.archived ? <IconArchiveOff size={18} /> : <IconArchive size={18} />}
                onClick={toggleArchive}
              >
                {product.archived ? "Restaurer" : "Archiver"}
              </Button>
            )}
            {product && canStock && !product.archived && (
              <Button variant="default" leftSection={<IconArrowsExchange size={18} />} onClick={() => setMoveOpen(true)}>
                Mouvement
              </Button>
            )}
          </Group>
          {canEdit || canStock ? (
            <Button type="submit" leftSection={<IconDeviceFloppy size={18} />}>
              Enregistrer
            </Button>
          ) : (
            <Button variant="default" onClick={onDone}>
              Fermer
            </Button>
          )}
        </Group>
      </Stack>
      {product && (
        <MovementModal
          product={product}
          opened={moveOpen}
          onClose={() => setMoveOpen(false)}
          onDone={() => {
            setMoveOpen(false);
            onDone();
          }}
        />
      )}
    </form>
  );
}

/* ---------- Mouvement de stock ---------- */

const MOVE_TYPES: ManualMovementType[] = ["reappro", "casse", "don", "correction"];

export function MovementModal({
  product,
  opened,
  onClose,
  onDone,
  initialPackId = "",
}: {
  product: Product;
  opened: boolean;
  onClose: () => void;
  onDone: () => void;
  /** Emballage déjà choisi (paquet scanné à la réception). */
  initialPackId?: string;
}) {
  const actor = useActor();
  const [type, setType] = useState<ManualMovementType>("reappro");
  const [qty, setQty] = useState<number | string>("");
  const [reason, setReason] = useState("");
  // Compter en unités ("") ou en emballages (identifiant du paquet).
  const [packId, setPackId] = useState(initialPackId);

  useEffect(() => {
    if (opened) {
      setType("reappro");
      setQty("");
      setReason("");
      setPackId(initialPackId);
    }
  }, [opened, initialPackId]);

  const pack = product.packs.find((k) => k.id === packId) ?? null;
  const count = pack ? Math.trunc(asNumber(qty)) : asNumber(qty);
  const delta = signedDelta(type, pack ? count * pack.units : count, product.unit);
  const after = roundQuantity(product.stock + delta, product.unit);

  function submit(e: FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!delta) return;
    // On garde la trace de ce qui a été compté : « 5 × Paquet de 24 ».
    const what = pack ? `${Math.abs(count)} × ${packLabel(pack, product.unit)}` : "";
    adjustStock(actor, product, type, delta, [what, reason.trim()].filter(Boolean).join(" · "));
    onDone();
  }

  return (
    <Modal opened={opened} onClose={onClose} title={`Mouvement · ${product.name}`}>
      <form onSubmit={submit}>
        <Stack>
          <SegmentedControl
            fullWidth
            value={type}
            onChange={(v) => setType(v as ManualMovementType)}
            data={MOVE_TYPES.map((t) => ({ value: t, label: t === "reappro" ? "Réappro" : MOVEMENT_LABELS[t] }))}
          />
          {product.packs.length > 0 && (
            <div>
              <Text size="sm" fw={500} mb={4}>
                Compter en
              </Text>
              <SegmentedControl
                fullWidth
                value={packId}
                onChange={setPackId}
                data={[
                  { value: "", label: product.unit === "u" ? "Unités" : product.unit },
                  ...product.packs.map((k) => ({ value: k.id, label: packLabel(k, product.unit) })),
                ]}
              />
            </div>
          )}
          <NumberInput
            label={
              (pack ? `Nombre de ${pack.name.toLowerCase()}s` : "Quantité") +
              (type === "correction" ? " (négatif pour retirer)" : "")
            }
            required
            autoFocus
            allowNegative={type === "correction"}
            decimalSeparator=","
            decimalScale={product.unit === "u" || pack ? 0 : 3}
            hideControls
            inputMode="decimal"
            value={qty}
            onChange={setQty}
          />
          <TextInput label="Motif (facultatif)" maxLength={200} value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
          {pack && count !== 0 && (
            <Text size="sm">
              {Math.abs(count)} × {pack.units} = <b className="n">{formatQty(Math.abs(delta), product.unit)}</b>{" "}
              {product.unit === "u" ? "unités" : ""}
            </Text>
          )}
          <Text size="sm" c="dimmed">
            Stock : <span className="n">{formatQty(product.stock, product.unit)}</span> →{" "}
            <b className="n" style={{ color: after < 0 ? "var(--app-due)" : undefined }}>
              {formatQty(after, product.unit)}
            </b>
          </Text>
          <Button type="submit" disabled={!delta}>
            Enregistrer le mouvement
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}

/* ---------- Historique ---------- */

function History({ product }: { product: Product }) {
  const { boutique } = useReady();
  const [movements, setMovements] = useState<StockMovement[]>();
  const [error, setError] = useState<string>();

  useEffect(
    () => watchProductHistory(boutique.id, product.id, setMovements, (e) => setError(errorMessage(e))),
    [boutique.id, product.id],
  );

  if (error) return <Text c="red">{error}</Text>;
  if (!movements) return <div className="loading">Chargement…</div>;
  if (!movements.length)
    return (
      <Text c="dimmed" ta="center" py="lg">
        Aucun mouvement pour ce produit.
      </Text>
    );

  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });
  return (
    <Stack gap={0}>
      {movements.map((m) => {
        const delta = m.deltas[product.id] ?? 0;
        return (
          <div key={m.id} className="list-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text fw={600} size="sm">
                {MOVEMENT_LABELS[m.type]}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {m.createdAtMs ? fmt.format(m.createdAtMs) : "En attente d'envoi"} · {m.memberName}
                {m.reason ? ` · ${m.reason}` : ""}
              </Text>
            </div>
            <Text fw={700} className="n" c={delta < 0 ? "red" : "teal"}>
              {delta > 0 ? "+" : ""}
              {formatQty(delta, product.unit)}
            </Text>
          </div>
        );
      })}
      <Text size="xs" c="dimmed" mt="sm">
        Prix de vente actuel : <Money value={product.sellPrice} currency={boutique.currency} />
      </Text>
    </Stack>
  );
}
