/** Caisse : choisir les articles (tuiles, recherche, scan), panier, remise et encaissement. */
import { useDeferredValue, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useMediaQuery } from "@mantine/hooks";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Chip,
  Drawer,
  Group,
  Modal,
  NumberInput,
  Paper,
  ScrollArea,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconArrowRight,
  IconCash,
  IconCheck,
  IconDeviceMobileDollar,
  IconDiscount,
  IconMinus,
  IconPlus,
  IconShoppingBag,
  IconShoppingCart,
  IconStarFilled,
  IconTrash,
  IconUserPlus,
  IconX,
} from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useActor, useCatalog } from "../data/products";
import { currenciesOf, ratesOf } from "../data/boutique";
import { createSale, useCart } from "../data/sales";
import { useClients } from "../data/clients";
import { ClientModal } from "./ClientsScreen";
import { BarcodeField, ScanButton } from "../components/BarcodeField";
import { ScanVideo } from "../components/ScanVideo";
import { canUseCamera, useCameraScan } from "../components/useCameraScan";
import { findSerial, useSerialsInStock, type Serial } from "../data/serials";
import { formatDayShort, normalizeSerial } from "../lib/serials";
import { formatQty } from "../components/ProductModal";
import { Money } from "../components/ui";
import { computePayment, lineKey, lineTotal, stockByProduct, suggestedBills, type PaymentMethod } from "../lib/cart";
import { convert, CURRENCIES, formatMoney, hasRate, type Currency } from "../lib/fx";
import {
  categoryColor,
  collectCategories,
  findScan,
  initials,
  matchProduct,
  packLabel,
  sortForCheckout,
  stockLevel,
  type Pack,
  type Product,
} from "../lib/products";
import { matchClient } from "../lib/clients";

const VISIBLE = 120;

export function CaisseScreen() {
  const wide = useMediaQuery("(min-width: 62em)", true);
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const { boutique, subscription } = useReady();

  useEffect(() => {
    if (!cart.lines.length) setCartOpen(false);
  }, [cart.lines.length]);

  if (subscription.readOnly)
    return (
      <Paper p="xl" ta="center">
        <Text fw={700} fz="lg" mb={4}>
          Caisse en pause
        </Text>
        <Text c="dimmed">L'abonnement a pris fin : les ventes reprennent dès le paiement. Vos données restent consultables.</Text>
      </Paper>
    );

  const openPayment = () => {
    setCartOpen(false);
    setPayOpen(true);
  };

  return (
    <>
      {wide ? (
        <Box style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 20, alignItems: "start" }}>
          <ProductPicker />
          <Paper className="cart-panel" style={{ position: "sticky", top: 76 }}>
            <CartPanel onPay={openPayment} />
          </Paper>
        </Box>
      ) : (
        <>
          <ProductPicker />
          {/* Laisse la place à la barre du panier au-dessus de la barre d'onglets. */}
          <div style={{ height: 84 }} />
          {cart.lines.length > 0 && (
            <div className="cart-bar">
              <UnstyledButton className="open" onClick={() => setCartOpen(true)} aria-label="Voir le panier">
                <span className="bag">
                  <IconShoppingBag size={22} />
                  <em>{cart.totals.itemCount}</em>
                </span>
                <span>
                  <small>Panier</small>
                  <b className="n">{formatMoney(cart.totals.total, boutique.currency)}</b>
                </span>
              </UnstyledButton>
              <UnstyledButton className="go" onClick={openPayment}>
                Encaisser
                <IconArrowRight size={18} />
              </UnstyledButton>
            </div>
          )}
          <Drawer opened={cartOpen} onClose={() => setCartOpen(false)} position="bottom" size="85%" withCloseButton={false} padding={0}>
            <CartPanel onPay={openPayment} onClose={() => setCartOpen(false)} />
          </Drawer>
        </>
      )}
      <PaymentModal opened={payOpen} onClose={() => setPayOpen(false)} />
    </>
  );
}

/* ---------- Choix des articles ---------- */

function ProductPicker() {
  const { boutique } = useReady();
  const { products, error } = useCatalog();
  const cart = useCart();
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean }>();
  const [weighing, setWeighing] = useState<Product | null>(null);
  // Produit vendu aussi en paquet ou carton : on demande comment le client l'achète.
  const [choosing, setChoosing] = useState<Product | null>(null);
  // Appareil suivi par IMEI : on demande lequel est vendu.
  const [choosingSerial, setChoosingSerial] = useState<Product | null>(null);
  const serials = useSerialsInStock(boutique.id);
  const inCart = useMemo(() => new Set(cart.lines.map((l) => l.serial).filter(Boolean)), [cart.lines]);
  const wanted = useMemo(() => stockByProduct(cart.lines), [cart.lines]);

  const active = useMemo(() => (products ?? []).filter((p) => !p.archived), [products]);
  const categories = useMemo(() => collectCategories(active), [active]);
  const list = useMemo(() => {
    let l = active;
    if (category === "*fav") l = l.filter((p) => p.favorite);
    else if (category) l = l.filter((p) => p.category === category);
    return sortForCheckout(l.filter((p) => matchProduct(p, query)));
  }, [active, category, query]);

  /** `pack` : `undefined` = demander si le produit a des emballages, `null` = à l'unité. */
  function pick(p: Product, pack?: Pack | null) {
    if (p.stock <= 0) return setMessage({ text: `Rupture de stock : ${p.name}`, ok: false });
    if (p.serialTracked) return setChoosingSerial(p);
    if (pack === undefined && p.packs.length) return setChoosing(p);
    if (pack) {
      cart.add(p, 1, pack);
      return setMessage({ text: `+ ${packLabel(pack, p.unit)} · ${p.name}`, ok: true });
    }
    if (p.unit !== "u") return setWeighing(p);
    cart.add(p);
    setMessage({ text: `+ ${p.name}`, ok: true });
  }

  /** Ajoute l'appareil `serial` (IMEI) au panier. */
  function addSerial(p: Product, serial: string) {
    if (inCart.has(serial)) return setMessage({ text: `IMEI ${serial} : déjà dans le panier`, ok: false });
    cart.add(p, 1, null, serial);
    setMessage({ text: `+ ${p.name} · IMEI ${serial}`, ok: true });
  }

  function onScan(code: string) {
    const found = findScan(active, code);
    if (found) {
      // Le code dit déjà ce qui est vendu : la bouteille ou le paquet.
      pick(found.product, found.pack);
      setQ("");
      return;
    }
    // Un IMEI scanné : l'appareil en stock part directement dans le panier.
    const serial = normalizeSerial(code);
    const inStock = serials?.find((s) => s.serial === serial);
    const product = inStock && active.find((p) => p.id === inStock.productId);
    if (product) {
      addSerial(product, serial);
      setQ("");
      return;
    }
    if (serial.length >= 8 && !active.some((p) => matchProduct(p, code))) {
      // Peut-être un appareil déjà vendu : on le dit (utile pour la garantie).
      void findSerial(boutique.id, serial)
        .then((s) => {
          if (!s) return setMessage({ text: `Aucun produit pour « ${code} »`, ok: false });
          if (s.status === "vendu")
            return setMessage({
              text: `IMEI ${serial} (${s.productName}) vendu le ${formatDayShort(s.soldDay)}${s.warrantyUntil ? `, garanti jusqu'au ${formatDayShort(s.warrantyUntil)}` : ""}`,
              ok: false,
            });
          setMessage({ text: `IMEI ${serial} : sorti du stock (casse ou don)`, ok: false });
        })
        .catch(() => setMessage({ text: `Aucun produit pour « ${code} »`, ok: false }));
      return;
    }
    if (!active.some((p) => matchProduct(p, code))) setMessage({ text: `Aucun produit pour « ${code} »`, ok: false });
  }

  return (
    <div>
      <div className="sticky-tools">
        <BarcodeField value={q} onChange={setQ} onScan={onScan} autoFocus placeholder="Nom de l'article ou scannez le code-barres" />
        <ScrollArea type="never" mt="xs">
          <Chip.Group value={category} onChange={(v) => setCategory(v as string)}>
            <Group gap={6} wrap="nowrap">
              <Chip value="" size="sm" variant="outline">
                Tous
              </Chip>
              {active.some((p) => p.favorite) && (
                <Chip value="*fav" size="sm" variant="outline">
                  <Group gap={6} wrap="nowrap">
                    <IconStarFilled size={13} color="#f2b10c" />
                    Favoris
                  </Group>
                </Chip>
              )}
              {categories.map((c) => (
                <Chip key={c} value={c} size="sm" variant="outline">
                  <Group gap={6} wrap="nowrap">
                    <span className="cat-dot" style={{ background: categoryColor(c) }} />
                    {c}
                  </Group>
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </ScrollArea>
        {message && (
          <Text size="sm" mt={6} c={message.ok ? "teal" : "red"} fw={500}>
            {message.text}
          </Text>
        )}
      </div>

      {error && <Text c="red">{error}</Text>}
      {!products && !error && <div className="loading">Chargement…</div>}
      {products && !active.length && (
        <Text c="dimmed" ta="center" py="xl">
          Aucun produit. Ajoutez votre catalogue dans l'onglet Stock.
        </Text>
      )}

      <SimpleGrid cols={{ base: 2, xs: 3, lg: 4 }} spacing={{ base: 10, lg: 12 }} verticalSpacing={{ base: 14, lg: 16 }} pt={6}>
        {list.slice(0, VISIBLE).map((p) => (
          <ProductTile key={p.id} product={p} currency={boutique.currency} inCart={wanted.get(p.id) ?? 0} onPick={() => pick(p)} />
        ))}
      </SimpleGrid>
      {list.length > VISIBLE && (
        <Text size="sm" c="dimmed" ta="center" mt="sm">
          {list.length - VISIBLE} autres articles : affinez la recherche.
        </Text>
      )}
      {products && active.length > 0 && !list.length && (
        <Text c="dimmed" ta="center" py="lg">
          Aucun article ne correspond.
        </Text>
      )}

      <SerialChooser
        product={choosingSerial}
        serials={(serials ?? []).filter((s) => s.productId === choosingSerial?.id && !inCart.has(s.serial))}
        onClose={() => setChoosingSerial(null)}
        onChoose={(serial) => {
          const p = choosingSerial;
          setChoosingSerial(null);
          if (p) addSerial(p, serial);
        }}
      />
      <PackChooser
        product={choosing}
        currency={boutique.currency}
        onClose={() => setChoosing(null)}
        onChoose={(pack) => {
          const p = choosing;
          setChoosing(null);
          if (p) pick(p, pack);
        }}
      />
      <WeighModal
        product={weighing}
        onClose={() => setWeighing(null)}
        onConfirm={(qty) => {
          if (weighing) {
            cart.add(weighing, qty);
            setMessage({ text: `+ ${formatQty(qty, weighing.unit)} ${weighing.name}`, ok: true });
          }
          setWeighing(null);
        }}
      />
    </div>
  );
}

function ProductTile({ product: p, currency, inCart, onPick }: { product: Product; currency: Currency; inCart: number; onPick: () => void }) {
  const level = stockLevel(p);
  return (
    <UnstyledButton
      className="product-tile"
      style={{ "--c": categoryColor(p.category) } as CSSProperties}
      data-empty={level === "empty" || undefined}
      data-in={inCart > 0 || undefined}
      onClick={onPick}
    >
      {inCart > 0 && <span className="qty n">{formatQty(inCart, "u")}</span>}
      {p.favorite && <IconStarFilled size={15} className="star" aria-label="Favori" />}
      <span className="ph" aria-hidden>
        {initials(p.name)}
      </span>
      <span className="name">{p.name}</span>
      <span className="pr">
        <span className="price">
          <Money value={p.sellPrice} currency={currency} />
          {p.unit !== "u" && (
            <Text span size="xs" c="dimmed" fw={500}>
              {" "}
              /{p.unit}
            </Text>
          )}
        </span>
        <span className="stock" data-low={level !== "ok" || undefined}>
          {level === "empty" ? "Rupture" : level === "low" ? `${formatQty(p.stock, p.unit)} restant${p.stock > 1 ? "s" : ""}` : `${formatQty(p.stock, p.unit)} en stock`}
        </span>
      </span>
      {p.packs.length > 0 && (
        <Text size="xs" c="dimmed" mt={-4} truncate>
          ou {packLabel(p.packs[0], p.unit).toLowerCase()}
          {p.packs.length > 1 ? "…" : ""}
        </Text>
      )}
    </UnstyledButton>
  );
}

/** « Quel appareil le client achète ? » : liste des IMEI en stock, ou saisie / scan du numéro. */
function SerialChooser({
  product,
  serials,
  onClose,
  onChoose,
}: {
  product: Product | null;
  serials: Serial[];
  onClose: () => void;
  onChoose: (serial: string) => void;
}) {
  const [typed, setTyped] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    setTyped("");
    setErr("");
  }, [product?.id]);
  const scan = useCameraScan((code) => submitCode(code));

  function submitCode(code: string) {
    const s = normalizeSerial(code);
    if (serials.some((x) => x.serial === s)) return onChoose(s);
    setErr(`L'IMEI ${s || code} n'est pas en stock pour cet article.`);
  }

  return (
    <Modal opened={!!product} onClose={onClose} title={product ? `${product.name} · quel appareil ?` : ""}>
      {product && (
        <Stack gap="xs">
          <TextInput
            label="IMEI ou numéro de série"
            description="Scannez le code sur la boîte ou tapez-le, puis Entrée."
            autoFocus
            autoComplete="off"
            value={typed}
            error={err || undefined}
            onChange={(e) => {
              setTyped(e.currentTarget.value);
              setErr("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && typed.trim()) {
                e.preventDefault();
                submitCode(typed);
              }
            }}
            rightSection={canUseCamera() ? <ScanButton scanning={scan.scanning} onClick={() => (scan.scanning ? scan.stop() : void scan.start())} /> : undefined}
          />
          <ScanVideo videoRef={scan.videoRef} scanning={scan.scanning} error={scan.error} />
          <Text size="sm" c="dimmed">
            {serials.length ? "Ou choisissez dans le stock :" : "Aucun appareil en stock : ajoutez-les dans Stock, avec « Mouvement »."}
          </Text>
          <ScrollArea.Autosize mah={260}>
            <Stack gap={6}>
              {serials.map((s) => (
                <Button key={s.serial} variant="default" justify="flex-start" className="n" onClick={() => onChoose(s.serial)}>
                  {s.serial}
                </Button>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        </Stack>
      )}
    </Modal>
  );
}

/** « Le client prend une bouteille ou tout le paquet ? » */
function PackChooser({
  product,
  currency,
  onClose,
  onChoose,
}: {
  product: Product | null;
  currency: Currency;
  onClose: () => void;
  onChoose: (pack: Pack | null) => void;
}) {
  return (
    <Modal opened={!!product} onClose={onClose} title={product?.name}>
      {product && (
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            Le client achète :
          </Text>
          <Button variant="default" size="lg" justify="space-between" fullWidth onClick={() => onChoose(null)} rightSection={<Money value={product.sellPrice} currency={currency} />}>
            {product.unit === "u" ? "À l'unité" : `Au ${product.unit === "kg" ? "poids" : "volume"}`}
          </Button>
          {product.packs.map((k) => (
            <Button
              key={k.id}
              variant="default"
              size="lg"
              justify="space-between"
              fullWidth
              onClick={() => onChoose(k)}
              rightSection={<Money value={k.price} currency={currency} />}
            >
              {packLabel(k, product.unit)}
            </Button>
          ))}
        </Stack>
      )}
    </Modal>
  );
}

/** Quantité d'un article vendu au poids ou au volume. */
function WeighModal({ product, onClose, onConfirm }: { product: Product | null; onClose: () => void; onConfirm: (qty: number) => void }) {
  const { boutique } = useReady();
  const [qty, setQty] = useState<number | string>("");
  useEffect(() => setQty(""), [product?.id]);
  const n = typeof qty === "number" ? qty : Number(String(qty).replace(",", ".")) || 0;
  return (
    <Modal opened={!!product} onClose={onClose} title={product?.name}>
      {product && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (n > 0) onConfirm(n);
          }}
        >
          <Stack>
            <NumberInput
              label={`Quantité (${product.unit})`}
              autoFocus
              min={0}
              decimalSeparator=","
              decimalScale={3}
              hideControls
              inputMode="decimal"
              value={qty}
              onChange={setQty}
            />
            <Text size="sm" c="dimmed">
              Prix : <Money value={product.sellPrice * n} currency={boutique.currency} />
            </Text>
            <Button type="submit" disabled={!(n > 0)}>
              Ajouter au panier
            </Button>
          </Stack>
        </form>
      )}
    </Modal>
  );
}

/* ---------- Panier ---------- */

function CartPanel({ onPay, onClose }: { onPay: () => void; onClose?: () => void }) {
  const { boutique, permissions } = useReady();
  const { products } = useCatalog();
  const cart = useCart();
  const c = boutique.currency;
  const [discountOpen, setDiscountOpen] = useState(false);
  const stockOf = useMemo(() => new Map((products ?? []).map((p) => [p.id, p.stock])), [products]);
  // Bouteilles et paquets du même produit puisent dans le même stock.
  const wanted = useMemo(() => stockByProduct(cart.lines), [cart.lines]);
  const rates = ratesOf(boutique);
  const others = currenciesOf(boutique).filter((x) => x !== c && hasRate(rates, x) && hasRate(rates, c));
  const count = cart.totals.itemCount;
  const showDiscount = permissions.editPrices && (discountOpen || cart.discountPercent > 0);

  return (
    <div>
      <div className="cart-head">
        <h3>Vente en cours</h3>
        {count > 0 && (
          <span className="cart-count">
            {count} article{count > 1 ? "s" : ""}
          </span>
        )}
        <Group gap={4} ml="auto" wrap="nowrap">
          {cart.lines.length > 0 && (
            <Button variant="subtle" color="gray" size="compact-sm" leftSection={<IconTrash size={15} />} onClick={cart.clear}>
              Vider
            </Button>
          )}
          {onClose && (
            <ActionIcon variant="subtle" color="gray" aria-label="Fermer" onClick={onClose}>
              <IconX size={18} />
            </ActionIcon>
          )}
        </Group>
      </div>

      {!cart.lines.length ? (
        <Stack align="center" py="xl" gap="xs">
          <IconShoppingCart size={36} opacity={0.3} />
          <Text c="dimmed">Le panier est vide.</Text>
          <Text size="sm" c="dimmed">
            Touchez un article pour l'ajouter.
          </Text>
        </Stack>
      ) : (
        <>
          <Box px={16} pb={6}>
            <ClientPicker />
          </Box>
          <div className="cart-lines">
            {cart.lines.map((l) => {
              const stock = stockOf.get(l.productId);
              const over = stock != null && (wanted.get(l.productId) ?? 0) > stock;
              const key = lineKey(l);
              const qtyUnit = l.packId ? "u" : l.unit;
              const step = qtyUnit === "u" ? 1 : 0.1;
              return (
                <div key={key} className="cart-line">
                  <div style={{ minWidth: 0 }}>
                    <Text fw={600} size="sm" truncate>
                      {l.name}
                    </Text>
                    {l.packName && (
                      <Badge size="sm" variant="light" mb={2}>
                        {packLabel({ name: l.packName, units: l.packUnits ?? 1 }, l.unit)}
                      </Badge>
                    )}
                    {l.serial && (
                      <Text size="xs" className="n">
                        IMEI {l.serial}
                      </Text>
                    )}
                  </div>
                  <span className="tot n">{formatMoney(lineTotal(l, c), c)}</span>
                  <div style={{ minWidth: 0 }}>
                    <Text size="xs" c="dimmed">
                      <Money value={l.unitPrice} currency={c} />
                      {l.packName ? ` le ${l.packName.toLowerCase()}` : l.unit !== "u" ? ` le ${l.unit}` : " l'unité"}
                    </Text>
                    {over && (
                      <Text size="xs" c="orange">
                        Plus que {formatQty(stock, l.unit)} en stock
                      </Text>
                    )}
                  </div>
                  {l.serial ? (
                    // Un appareil (IMEI) se vend à l'unité : on le retire seulement.
                    <ActionIcon variant="subtle" color="gray" aria-label="Retirer" onClick={() => cart.setQty(key, 0)} style={{ justifySelf: "end" }}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  ) : (
                    <span className="stepper">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="lg"
                        aria-label={l.quantity <= step ? "Retirer" : "Moins"}
                        onClick={() => cart.setQty(key, l.quantity - step)}
                      >
                        {l.quantity <= step ? <IconTrash size={16} /> : <IconMinus size={16} />}
                      </ActionIcon>
                      <b className="n">{formatQty(l.quantity, qtyUnit)}</b>
                      <ActionIcon variant="subtle" color="gray" size="lg" aria-label="Plus" onClick={() => cart.setQty(key, l.quantity + step)}>
                        <IconPlus size={16} />
                      </ActionIcon>
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="cart-foot">
            {(cart.totals.discount > 0 || permissions.editPrices) && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Sous-total
                </Text>
                <Text fw={700} className="n">
                  {formatMoney(cart.totals.subtotal, c)}
                </Text>
              </Group>
            )}
            {permissions.editPrices && !showDiscount && (
              <UnstyledButton onClick={() => setDiscountOpen(true)} c="var(--app-sky)" fw={600} fz="sm">
                <Group gap={6}>
                  <IconDiscount size={17} />
                  Ajouter une remise
                </Group>
              </UnstyledButton>
            )}
            {showDiscount && (
              <Group justify="space-between">
                <Text size="sm">Remise</Text>
                <NumberInput
                  size="sm"
                  w={110}
                  min={0}
                  max={100}
                  suffix=" %"
                  hideControls
                  inputMode="decimal"
                  autoFocus={!cart.discountPercent}
                  value={cart.discountPercent || ""}
                  onChange={(v) => cart.setDiscountPercent(Number(v) || 0)}
                />
              </Group>
            )}
            {cart.totals.discount > 0 && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Remise {cart.discountPercent} %
                </Text>
                <span className="n">-{formatMoney(cart.totals.discount, c)}</span>
              </Group>
            )}
            <Group justify="space-between" align="flex-end" className="cart-total" wrap="nowrap">
              <div>
                <Text size="sm" fw={600} c="dimmed">
                  Total à payer
                </Text>
                {others.length > 0 && (
                  <Text size="sm" c="dimmed" className="n">
                    ≈ {others.map((x) => formatMoney(convert(cart.totals.total, c, x, rates), x)).join(" · ")}
                  </Text>
                )}
              </div>
              <b className="n">{formatMoney(cart.totals.total, c)}</b>
            </Group>
            <Button size="lg" className="night-btn pay-btn" leftSection={<IconCash size={22} />} onClick={onPay}>
              Encaisser
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Encaissement ---------- */

function PaymentModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const { boutique } = useReady();
  const actor = useActor();
  const cart = useCart();
  const navigate = useNavigate();
  const narrow = useMediaQuery("(max-width: 36em)");
  const [method, setMethod] = useState<PaymentMethod>("especes");
  const [payCurrency, setPayCurrency] = useState<Currency>(boutique.currency);
  const [received, setReceived] = useState<number | string>("");

  useEffect(() => {
    if (opened) {
      setMethod("especes");
      setPayCurrency(boutique.currency);
      setReceived("");
    }
  }, [opened, boutique.currency]);

  const total = cart.totals.total;
  const rates = ratesOf(boutique);
  const currencies = currenciesOf(boutique);
  const input = { method, payCurrency, received: Number(received) || 0 };
  const result = computePayment(total, boutique.currency, rates, input);
  const others = currencies.filter((c) => c !== boutique.currency && hasRate(rates, c) && hasRate(rates, boutique.currency));

  function submit(e: FormEvent) {
    e.preventDefault();
    if ("error" in result || !result.ok || !cart.lines.length) return;
    const id = createSale(actor, boutique.currency, cart.lines, cart.discountPercent, input, result, cart.client ?? undefined);
    cart.clear();
    onClose();
    navigate(`/ticket/${id}`, { state: { justSold: true } });
  }

  const due = "error" in result ? 0 : result.due;
  const sym = CURRENCIES[payCurrency].symbol;
  const given = Number(received) || 0;
  const methods: { value: PaymentMethod; label: string; icon: typeof IconCash }[] = [
    { value: "especes", label: "Espèces", icon: IconCash },
    { value: "mobile_money", label: "Mobile money", icon: IconDeviceMobileDollar },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Encaissement"
      size="md"
      classNames={narrow ? { inner: "pay-sheet-inner", content: "pay-sheet" } : undefined}
      transitionProps={narrow ? { transition: "slide-up" } : undefined}
    >
      <form onSubmit={submit}>
        <Stack gap="md">
          <div className="pay-due">
            <small>À payer</small>
            <b className="n">{formatMoney(total, boutique.currency)}</b>
            {others.length > 0 && (
              <em className="n">soit {others.map((c) => formatMoney(convert(total, boutique.currency, c, rates), c)).join(" ou ")} au taux du jour</em>
            )}
          </div>

          <div className="pay-methods" role="radiogroup" aria-label="Moyen de paiement">
            {methods.map((m) => (
              <UnstyledButton
                key={m.value}
                className="pay-method"
                role="radio"
                aria-checked={method === m.value}
                data-on={method === m.value || undefined}
                onClick={() => {
                  setMethod(m.value);
                  setReceived("");
                }}
              >
                <m.icon size={22} />
                {m.label}
              </UnstyledButton>
            ))}
          </div>
          {currencies.length > 1 && (
            <SegmentedControl
              fullWidth
              value={payCurrency}
              onChange={(v) => {
                setPayCurrency(v as Currency);
                setReceived("");
              }}
              data={currencies.map((c, i) => ({ value: c, label: `${i === 0 ? "Payé " : ""}en ${CURRENCIES[c].short}` }))}
            />
          )}

          {"error" in result ? (
            <Text c="red">{result.error}</Text>
          ) : method === "especes" ? (
            <>
              {payCurrency !== boutique.currency && (
                <Text ta="center" fw={600}>
                  Le client doit <span className="n">{formatMoney(due, payCurrency)}</span>
                </Text>
              )}
              <NumberInput
                label="Le client donne"
                size="xl"
                autoFocus={!narrow}
                min={0}
                thousandSeparator=" "
                decimalSeparator=","
                decimalScale={CURRENCIES[payCurrency].decimals}
                hideControls
                inputMode="decimal"
                rightSection={<Text c="dimmed" fw={600} pr="sm">{sym}</Text>}
                rightSectionWidth={56}
                classNames={{ input: "n" }}
                styles={{ label: { fontSize: 14, fontWeight: 700, color: "var(--mantine-color-dimmed)", marginBottom: 4 } }}
                value={received}
                onChange={setReceived}
              />
              <div className="pay-bills">
                <UnstyledButton className="pay-bill" data-on={given === due || undefined} onClick={() => setReceived(due)}>
                  Exact
                </UnstyledButton>
                {suggestedBills(due, payCurrency)
                  .filter((b) => b !== due)
                  .map((b) => (
                    <UnstyledButton key={b} className="pay-bill n" data-on={given === b || undefined} onClick={() => setReceived(b)}>
                      {formatMoney(b, payCurrency)}
                    </UnstyledButton>
                  ))}
              </div>
              {result.missing > 0 && given > 0 ? (
                <div className="pay-change" data-missing>
                  <span>Il manque</span>
                  <b className="n">{formatMoney(result.missing, payCurrency)}</b>
                </div>
              ) : (
                <div className="pay-change">
                  <Group gap={6} wrap="nowrap">
                    <IconArrowBackUp size={18} />
                    Monnaie à rendre
                  </Group>
                  <b className="n">{formatMoney(given > 0 ? result.change : 0, payCurrency)}</b>
                </div>
              )}
            </>
          ) : (
            <Text ta="center" c="dimmed">
              Vérifiez la réception du paiement de <b className="n">{formatMoney(due, payCurrency)}</b> sur le téléphone
              avant de valider.
            </Text>
          )}

          <Button
            type="submit"
            size="xl"
            className="night-btn pay-btn"
            leftSection={<IconCheck size={22} />}
            disabled={"error" in result || !result.ok || (method === "especes" && !(given > 0))}
          >
            Valider la vente
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}

/* ---------- Client de la vente (facultatif) ---------- */

function ClientPicker() {
  const cart = useCart();
  const { clients } = useClients();
  const [creating, setCreating] = useState(false);

  if (cart.client)
    return (
      <Group justify="space-between" wrap="nowrap">
        <Text size="sm" truncate>
          Client : <b>{cart.client.name}</b>
        </Text>
        <ActionIcon variant="subtle" color="gray" aria-label="Retirer le client" onClick={() => cart.setClient(null)}>
          <IconX size={16} />
        </ActionIcon>
      </Group>
    );

  return (
    <Group gap="xs" wrap="nowrap" align="flex-end">
      <Select
        size="sm"
        placeholder="Client (facultatif)"
        searchable
        clearable
        nothingFoundMessage="Aucun client"
        style={{ flex: 1 }}
        data={(clients ?? []).map((c) => ({ value: c.id, label: c.phone ? `${c.name} · ${c.phone}` : c.name }))}
        filter={({ options, search }) =>
          options.filter((o) => {
            const c = clients?.find((x) => x.id === (o as { value: string }).value);
            return !!c && matchClient(c, search);
          })
        }
        value={null}
        onChange={(id) => {
          const c = clients?.find((x) => x.id === id);
          if (c) cart.setClient({ id: c.id, name: c.name });
        }}
      />
      <ActionIcon variant="default" size="lg" aria-label="Nouveau client" onClick={() => setCreating(true)}>
        <IconUserPlus size={18} />
      </ActionIcon>
      <ClientModal client={null} opened={creating} onClose={() => setCreating(false)} onCreated={(c) => cart.setClient(c)} />
    </Group>
  );
}
