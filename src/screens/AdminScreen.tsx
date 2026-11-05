/**
 * Administration (équipe vitePOS seulement) : toutes les boutiques, l'état de leur abonnement,
 * et l'enregistrement d'un paiement reçu par mobile money, qui prolonge l'abonnement.
 */
import { useDeferredValue, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Navigate } from "react-router";
import { Badge, Button, Chip, Group, Modal, NumberInput, Paper, SegmentedControl, Select, Stack, Text, TextInput, UnstyledButton } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconSearch } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { getOwner, recordPayment, useIsAdmin, watchAllBoutiques, watchPayments, type SubscriptionPayment } from "../data/admin";
import type { Boutique } from "../data/boutique";
import { errorMessage } from "../data/errors";
import { PageTitle } from "../components/ui";
import { categoryColor, initials } from "../lib/products";
import {
  extendPaidUntil,
  PAY_MONTHS,
  PAYMENT_METHODS,
  formatUsd,
  PLAN_ORDER,
  planPriceLabel,
  PLANS,
  priceUsd,
  subscriptionStatus,
  type PaymentMethod,
  type Plan,
  type SubscriptionState,
} from "../lib/subscription";
import { PaymentHistory, STATE_LABELS, SubscriptionMessage } from "./AbonnementScreen";

const longDate = (ms: number) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(ms);
const shortDate = (ms: number) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(ms);
const duration = (months: number) => (months === 12 ? "1 an" : `${months} mois`);

type Filter = "tout" | SubscriptionState;

export function AdminScreen() {
  const isAdmin = useIsAdmin();
  const [boutiques, setBoutiques] = useState<Boutique[] | null>(null);
  const [error, setError] = useState<string>();
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const [filter, setFilter] = useState<Filter>("tout");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    return watchAllBoutiques(setBoutiques, (e) => setError(errorMessage(e)));
  }, [isAdmin]);

  const rows = useMemo(() => (boutiques ?? []).map((b) => ({ b, st: subscriptionStatus(b) })), [boutiques]);
  const count = (s: SubscriptionState) => rows.filter((r) => r.st.state === s).length;
  const needle = query.trim().toLowerCase();
  // « En retard » regroupe la grâce et la lecture seule.
  const inFilter = (s: SubscriptionState) => filter === "tout" || s === filter || (filter === "grace" && s === "bloque");
  const list = rows.filter((r) => inFilter(r.st.state) && (!needle || r.b.name.toLowerCase().includes(needle)));
  const opened = rows.find((r) => r.b.id === openId)?.b ?? null;

  // Le lien n'est montré qu'à l'équipe ; une adresse tapée à la main revient à l'accueil.
  if (isAdmin === undefined) return <div className="loading">Chargement…</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <>
      <PageTitle title="Administration" sub={boutiques ? `${boutiques.length} activité${boutiques.length > 1 ? "s" : ""}` : undefined} />
      <div className="sticky-tools">
        <Stack gap="xs">
          <TextInput leftSection={<IconSearch size={18} />} placeholder="Nom de l'activité" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
          <Chip.Group value={filter} onChange={(v) => setFilter(v as Filter)}>
            <Group gap={6}>
              {(
                [
                  ["tout", `Toutes (${rows.length})`],
                  ["essai", `Essai (${count("essai")})`],
                  ["actif", `Payées (${count("actif")})`],
                  ["grace", `En retard (${count("grace") + count("bloque")})`],
                ] as [Filter, string][]
              ).map(([v, label]) => (
                <Chip key={v} value={v} size="sm">
                  {label}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </Stack>
      </div>
      {error && <Text c="red">{error}</Text>}
      {!boutiques && !error && <div className="loading">Chargement…</div>}
      {boutiques && (
        <Paper p={0} style={{ overflow: "hidden" }}>
          {list.map(({ b, st }) => (
            <UnstyledButton key={b.id} className="list-row" px="md" onClick={() => setOpenId(b.id)}>
              <span className="thumb" style={{ "--c": categoryColor(b.name) } as CSSProperties} aria-hidden>
                {initials(b.name)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text fw={600} truncate>
                  {b.name}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  Formule {PLANS[b.plan].name}, créée le {b.createdAtMs ? shortDate(b.createdAtMs) : "?"}
                </Text>
              </div>
              <div style={{ textAlign: "right" }}>
                <Badge color={STATE_LABELS[st.state].color} variant="light">
                  {STATE_LABELS[st.state].label}
                </Badge>
                <Text size="xs" c="dimmed" mt={4}>
                  {st.state === "bloque" ? `depuis le ${shortDate(st.endsAtMs)}` : `jusqu'au ${shortDate(st.endsAtMs)}`}
                </Text>
              </div>
            </UnstyledButton>
          ))}
          {!list.length && (
            <Text c="dimmed" ta="center" p="xl">
              Aucune activité ne correspond.
            </Text>
          )}
        </Paper>
      )}

      <Modal opened={!!opened} onClose={() => setOpenId(null)} title={opened?.name} size="lg">
        {opened && <PaymentForm boutique={opened} onDone={() => setOpenId(null)} />}
      </Modal>
    </>
  );
}

/** Fiche d'une boutique : propriétaire, état, paiements passés, et nouveau paiement. */
function PaymentForm({ boutique, onDone }: { boutique: Boutique; onDone: () => void }) {
  const { user } = useReady();
  const st = subscriptionStatus(boutique);
  const [owner, setOwner] = useState<{ name: string; email: string } | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[] | null>(null);
  const [plan, setPlan] = useState<Plan>(boutique.plan);
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState<number | string>(priceUsd(boutique.plan, 1) ?? "");
  const [method, setMethod] = useState<PaymentMethod>("mobile_money");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOwner(boutique).then(setOwner, () => setOwner({ name: "", email: "" }));
    return watchPayments(boutique.id, setPayments, () => setPayments([]));
  }, [boutique]);

  const newEnd = extendPaidUntil(boutique, months);
  const amountUsd = typeof amount === "number" ? amount : Number(amount) || 0;
  const expected = priceUsd(plan, months);

  function choose(nextPlan: Plan, nextMonths: number) {
    setPlan(nextPlan);
    setMonths(nextMonths);
    setAmount(priceUsd(nextPlan, nextMonths) ?? "");
  }

  async function save() {
    setSaving(true);
    try {
      await recordPayment(boutique, { plan, months, amountUsd, method, reference, paidUntilMs: newEnd }, user.uid);
      notifications.show({
        color: "teal",
        title: "Paiement enregistré",
        message: `${boutique.name} : payé jusqu'au ${longDate(newEnd)}.`,
      });
      onDone();
    } catch (e) {
      notifications.show({
        color: "red",
        title: "Paiement non enregistré",
        message: errorMessage(e),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack>
      <div>
        <Text size="sm" c="dimmed">
          Propriétaire
        </Text>
        <Text fw={600}>{owner ? owner.name || "Nom inconnu" : "…"}</Text>
        {owner?.email && <Text size="sm">{owner.email}</Text>}
      </div>
      <Paper p="sm" bg="var(--mantine-color-default-hover)">
        <Group gap="xs" mb={4}>
          <Text fw={600}>Formule {PLANS[boutique.plan].name}</Text>
          <Badge color={STATE_LABELS[st.state].color} variant="light">
            {STATE_LABELS[st.state].label}
          </Badge>
        </Group>
        <Text size="sm">
          <SubscriptionMessage st={st} />
        </Text>
      </Paper>

      <Text fw={700} mt="xs">
        Enregistrer un paiement reçu
      </Text>
      <Select
        label="Formule"
        data={PLAN_ORDER.map((k) => ({
          value: k,
          label: `${PLANS[k].name} (${planPriceLabel(k)})`,
        }))}
        value={plan}
        allowDeselect={false}
        onChange={(v) => v && choose(v as Plan, months)}
      />
      <div>
        <Text size="sm" fw={500} mb={4}>
          Durée payée
        </Text>
        <SegmentedControl
          fullWidth
          value={String(months)}
          onChange={(v) => choose(plan, Number(v))}
          data={PAY_MONTHS.map((m) => ({
            value: String(m),
            label: duration(m),
          }))}
        />
      </div>
      <NumberInput
        label="Montant reçu"
        description={
          expected == null
            ? "Formule sur devis : saisir le montant convenu."
            : amountUsd === expected
              ? `Prix normal pour ${duration(months)}.`
              : `Prix normal : ${formatUsd(expected)} $.`
        }
        rightSection={<Text size="sm">$</Text>}
        min={0}
        decimalScale={2}
        value={amount}
        onChange={setAmount}
      />
      <SegmentedControl
        value={method}
        onChange={(v) => setMethod(v as PaymentMethod)}
        data={(["mobile_money", "especes"] as PaymentMethod[]).map((m) => ({
          value: m,
          label: PAYMENT_METHODS[m],
        }))}
      />
      <TextInput
        label="Référence de la transaction"
        description="Le code reçu par SMS, pour retrouver le paiement."
        maxLength={80}
        value={reference}
        onChange={(e) => setReference(e.currentTarget.value)}
      />
      <Text>
        Nouvelle fin d'abonnement : <b>{longDate(newEnd)}</b>
      </Text>
      <Button className="sun-btn" size="md" loading={saving} disabled={amountUsd <= 0} onClick={save}>
        Enregistrer le paiement
      </Button>

      <PaymentHistory payments={payments} />
    </Stack>
  );
}
