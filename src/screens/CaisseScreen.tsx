/** Caisse : choisir les articles (tuiles, recherche, scan), panier, remise et encaissement. */
import { useDeferredValue, useEffect, useMemo, useState, type FormEvent } from "react";
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
  UnstyledButton,
} from "@mantine/core";
import { IconMinus, IconPlus, IconShoppingCart, IconStarFilled, IconTrash, IconUserPlus, IconX } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useActor, useCatalog } from "../data/products";
import { currenciesOf, ratesOf } from "../data/boutique";
import { createSale, useCart } from "../data/sales";
import { useClients } from "../data/clients";
import { ClientModal } from "./ClientsScreen";
import { BarcodeField } from "../components/BarcodeField";
import { formatQty } from "../components/ProductModal";
import { Money } from "../components/ui";
import { computePayment, lineKey, lineTotal, stockByProduct, suggestedBills, type PaymentMethod } from "../lib/cart";
import { convert, CURRENCIES, formatMoney, hasRate, type Currency } from "../lib/fx";
import { collectCategories, findScan, matchProduct, packLabel, sortForCheckout, stockLevel, type Pack, type Product } from "../lib/products";
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
          <Paper p="md" style={{ position: "sticky", top: 76 }}>
            <CartPanel onPay={openPayment} />
          </Paper>
        </Box>
      ) : (
        <>
          <ProductPicker />
          {/* Laisse la place à la barre du panier au-dessus de la barre d'onglets. */}
          <div style={{ height: 72 }} />
          {cart.lines.length > 0 && (
            <div className="cart-bar">
              <Button fullWidth size="lg" leftSection={<IconShoppingCart size={20} />} onClick={() => setCartOpen(true)}>
                <span style={{ flex: 1 }}>
                  Panier · {cart.totals.itemCount} article{cart.totals.itemCount > 1 ? "s" : ""}
                </span>
                <span className="n" style={{ marginLeft: 12 }}>
                  {formatMoney(cart.totals.total, boutique.currency)}
                </span>
              </Button>
            </div>
          )}
          <Drawer opened={cartOpen} onClose={() => setCartOpen(false)} position="bottom" size="85%" title="Panier">
            <CartPanel onPay={openPayment} />
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
    if (pack === undefined && p.packs.length) return setChoosing(p);
    if (pack) {
      cart.add(p, 1, pack);
      return setMessage({ text: `+ ${packLabel(pack, p.unit)} · ${p.name}`, ok: true });
    }
    if (p.unit !== "u") return setWeighing(p);
    cart.add(p);
    setMessage({ text: `+ ${p.name}`, ok: true });
  }

  function onScan(code: string) {
    const found = findScan(active, code);
    if (found) {
      // Le code dit déjà ce qui est vendu : la bouteille ou le paquet.
      pick(found.product, found.pack);
      setQ("");
    } else if (!active.some((p) => matchProduct(p, code))) {
      setMessage({ text: `Aucun produit pour « ${code} »`, ok: false });
    }
  }

  return (
    <div>
      <div className="sticky-tools">
        <BarcodeField value={q} onChange={setQ} onScan={onScan} autoFocus placeholder="Nom, code article ou scan" />
        <ScrollArea type="never" mt="xs">
          <Chip.Group value={category} onChange={(v) => setCategory(v as string)}>
            <Group gap={6} wrap="nowrap">
              <Chip value="" size="sm" variant="outline">
                Tous
              </Chip>
              {active.some((p) => p.favorite) && (
                <Chip value="*fav" size="sm" variant="outline">
                  Favoris
                </Chip>
              )}
              {categories.map((c) => (
                <Chip key={c} value={c} size="sm" variant="outline">
                  {c}
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

      <SimpleGrid cols={{ base: 2, xs: 3, lg: 4 }} spacing="xs">
        {list.slice(0, VISIBLE).map((p) => (
          <ProductTile key={p.id} product={p} currency={boutique.currency} onPick={() => pick(p)} />
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

function ProductTile({ product: p, currency, onPick }: { product: Product; currency: Currency; onPick: () => void }) {
  const level = stockLevel(p);
  return (
    <UnstyledButton className="product-tile" data-empty={level === "empty" || undefined} onClick={onPick}>
      <Group gap={4} wrap="nowrap" align="flex-start">
        {p.favorite && <IconStarFilled size={13} color="var(--mantine-color-yellow-6)" style={{ flexShrink: 0, marginTop: 3 }} />}
        <Text fw={600} size="sm" lineClamp={2} style={{ lineHeight: 1.25 }}>
          {p.name}
        </Text>
      </Group>
      {p.sku && (
        <Text size="xs" c="dimmed" mt={-4} className="n">
          {p.sku}
        </Text>
      )}
      <Group justify="space-between" align="flex-end" mt="auto" gap={4} wrap="nowrap">
        <Text fw={700} size="md">
          <Money value={p.sellPrice} currency={currency} />
          {p.unit !== "u" && (
            <Text span size="xs" c="dimmed">
              {" "}
              /{p.unit}
            </Text>
          )}
        </Text>
        {level !== "ok" && (
          <Badge size="xs" variant="light" color={level === "empty" ? "red" : "orange"}>
            {level === "empty" ? "Rupture" : formatQty(p.stock, p.unit)}
          </Badge>
        )}
      </Group>
      {p.packs.length > 0 && (
        <Text size="xs" c="dimmed" mt={-4} truncate>
          ou {packLabel(p.packs[0], p.unit).toLowerCase()}
          {p.packs.length > 1 ? "…" : ""}
        </Text>
      )}
    </UnstyledButton>
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

function CartPanel({ onPay }: { onPay: () => void }) {
  const { boutique, permissions } = useReady();
  const { products } = useCatalog();
  const cart = useCart();
  const c = boutique.currency;
  const stockOf = useMemo(() => new Map((products ?? []).map((p) => [p.id, p.stock])), [products]);
  // Bouteilles et paquets du même produit puisent dans le même stock.
  const wanted = useMemo(() => stockByProduct(cart.lines), [cart.lines]);

  if (!cart.lines.length)
    return (
      <Stack align="center" py="xl" gap="xs">
        <IconShoppingCart size={36} opacity={0.3} />
        <Text c="dimmed">Le panier est vide.</Text>
        <Text size="sm" c="dimmed">
          Touchez un article pour l'ajouter.
        </Text>
      </Stack>
    );

  return (
    <Stack gap="sm">
      <div>
        {cart.lines.map((l) => {
          const stock = stockOf.get(l.productId);
          const over = stock != null && (wanted.get(l.productId) ?? 0) > stock;
          const key = lineKey(l);
          const qtyUnit = l.packId ? "u" : l.unit;
          const step = qtyUnit === "u" ? 1 : 0.1;
          return (
            <div key={key} className="list-row" style={{ alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text fw={600} size="sm" truncate>
                  {l.name}
                </Text>
                {l.packName && (
                  <Badge size="sm" variant="light" mb={2}>
                    {packLabel({ name: l.packName, units: l.packUnits ?? 1 }, l.unit)}
                  </Badge>
                )}
                <Text size="xs" c="dimmed">
                  <Money value={l.unitPrice} currency={c} />
                  {l.packName ? ` /${l.packName.toLowerCase()}` : l.unit !== "u" ? ` /${l.unit}` : ""}
                </Text>
                {over && (
                  <Text size="xs" c="orange">
                    Plus que {formatQty(stock, l.unit)} en stock
                  </Text>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <Group gap={4} wrap="nowrap" justify="flex-end">
                  <ActionIcon
                    variant="default"
                    aria-label={l.quantity <= step ? "Retirer" : "Moins"}
                    onClick={() => cart.setQty(key, l.quantity - step)}
                  >
                    {l.quantity <= step ? <IconTrash size={16} /> : <IconMinus size={16} />}
                  </ActionIcon>
                  <Text className="n" fw={700} w={44} ta="center">
                    {formatQty(l.quantity, qtyUnit)}
                  </Text>
                  <ActionIcon variant="default" aria-label="Plus" onClick={() => cart.setQty(key, l.quantity + step)}>
                    <IconPlus size={16} />
                  </ActionIcon>
                </Group>
                <Text fw={600} size="sm" mt={4}>
                  <Money value={lineTotal(l, c)} currency={c} />
                </Text>
              </div>
            </div>
          );
        })}
      </div>

      <ClientPicker />

      {permissions.editPrices && (
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
            value={cart.discountPercent || ""}
            onChange={(v) => cart.setDiscountPercent(Number(v) || 0)}
          />
        </Group>
      )}

      <div>
        {cart.totals.discount > 0 && (
          <>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Sous-total
              </Text>
              <Money value={cart.totals.subtotal} currency={c} />
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Remise {cart.discountPercent} %
              </Text>
              <span className="n">-{formatMoney(cart.totals.discount, c)}</span>
            </Group>
          </>
        )}
        <Group justify="space-between" mt={4}>
          <Text fw={700} size="lg">
            Total
          </Text>
          <Text fw={700} fz={28} className="n">
            {formatMoney(cart.totals.total, c)}
          </Text>
        </Group>
      </div>

      <Group grow>
        <Button variant="default" onClick={cart.clear}>
          Vider
        </Button>
        <Button size="lg" onClick={onPay}>
          Encaisser
        </Button>
      </Group>
    </Stack>
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

  return (
    <Modal opened={opened} onClose={onClose} title="Encaissement" fullScreen={narrow} size="md">
      <form onSubmit={submit}>
        <Stack>
          <div style={{ textAlign: "center" }}>
            <Text size="sm" c="dimmed">
              À payer
            </Text>
            <Text fz={40} fw={700} className="n" lh={1.1}>
              {formatMoney(total, boutique.currency)}
            </Text>
            {others.length > 0 && (
              <Text size="sm" c="dimmed" className="n">
                soit {others.map((c) => formatMoney(convert(total, boutique.currency, c, rates), c)).join(" ou ")}
              </Text>
            )}
          </div>

          <SegmentedControl
            fullWidth
            value={method}
            onChange={(v) => {
              setMethod(v as PaymentMethod);
              setReceived("");
            }}
            data={[
              { value: "especes", label: "Espèces" },
              { value: "mobile_money", label: "Mobile money" },
            ]}
          />
          <SegmentedControl
            fullWidth
            value={payCurrency}
            onChange={(v) => {
              setPayCurrency(v as Currency);
              setReceived("");
            }}
            data={currencies.map((c) => ({ value: c, label: `${CURRENCIES[c].short} (${CURRENCIES[c].symbol})` }))}
          />

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
                label={`Montant reçu (${sym})`}
                size="xl"
                autoFocus
                min={0}
                thousandSeparator=" "
                decimalSeparator=","
                decimalScale={CURRENCIES[payCurrency].decimals}
                hideControls
                inputMode="decimal"
                value={received}
                onChange={setReceived}
              />
              <Group gap={6}>
                <Button size="sm" variant="light" onClick={() => setReceived(due)}>
                  Montant exact
                </Button>
                {suggestedBills(due, payCurrency)
                  .filter((b) => b !== due)
                  .map((b) => (
                    <Button key={b} size="sm" variant="default" onClick={() => setReceived(b)}>
                      {formatMoney(b, payCurrency)}
                    </Button>
                  ))}
              </Group>
              <Paper p="sm" ta="center" bg={result.ok && Number(received) > 0 ? "var(--mantine-color-teal-light)" : undefined}>
                {result.missing > 0 && Number(received) > 0 ? (
                  <Text c="red" fw={600}>
                    Il manque <span className="n">{formatMoney(result.missing, payCurrency)}</span>
                  </Text>
                ) : (
                  <>
                    <Text size="sm" c="dimmed">
                      À rendre
                    </Text>
                    <Text fz={32} fw={700} className="n" lh={1.1}>
                      {formatMoney(result.change, payCurrency)}
                    </Text>
                  </>
                )}
              </Paper>
            </>
          ) : (
            <Text ta="center" c="dimmed">
              Vérifiez la réception du paiement de <b className="n">{formatMoney(due, payCurrency)}</b> sur le téléphone
              avant de valider.
            </Text>
          )}

          <Button type="submit" size="xl" disabled={"error" in result || !result.ok || (method === "especes" && !(Number(received) > 0))}>
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
