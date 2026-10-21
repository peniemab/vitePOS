/**
 * Journée de caisse : fond de caisse du matin, résumé du jour, et clôture du soir
 * (argent compté comparé à l'argent attendu, dans chaque devise utilisée).
 */
import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { Alert, Button, Group, NumberInput, Paper, SimpleGrid, Stack, Table, Text, Textarea, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconLock } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useActor } from "../data/products";
import { watchSalesOfDay } from "../data/sales";
import { closeDay, setOpeningFloat, watchCashDay, watchExpensesOfDay, type CashDay } from "../data/cashday";
import { errorMessage } from "../data/errors";
import { DayNav } from "../components/DayNav";
import { PageTitle } from "../components/ui";
import { Stat } from "./VentesScreen";
import { dayKey } from "../lib/cart";
import { expectedCash, formatMoney2, summarizeDay, variance, type Expense, type Money2 } from "../lib/cashday";
import { CURRENCIES, formatMoney, zeroMoney, type Currency } from "../lib/fx";
import { currenciesOf } from "../data/boutique";
import type { Sale } from "../lib/sales";

const num = (v: number | string) => Number(v) || 0;

export function JourneeScreen() {
  const { boutique, permissions, subscription } = useReady();
  const actor = useActor();
  const [day, setDay] = useState(() => dayKey(Date.now()));
  const [sales, setSales] = useState<Sale[]>();
  const [expenses, setExpenses] = useState<Expense[]>();
  const [cashDay, setCashDay] = useState<CashDay | null>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    setSales(undefined);
    setExpenses(undefined);
    setCashDay(undefined);
    const onError = (e: unknown) => setError(errorMessage(e));
    const a = watchSalesOfDay(boutique.id, day, setSales, onError);
    const b = watchExpensesOfDay(boutique.id, day, setExpenses, onError);
    const c = watchCashDay(boutique.id, day, setCashDay, onError);
    return () => {
      a();
      b();
      c();
    };
  }, [boutique.id, day]);

  if (!permissions.closeCash && !permissions.viewReports) return <Navigate to="/plus" replace />;

  const loading = !sales || !expenses || cashDay === undefined;
  const summary = !loading ? summarizeDay(sales, expenses, boutique.currency) : undefined;
  const float: Money2 = cashDay?.openingFloat ?? zeroMoney();
  // Colonnes affichées : les devises de la boutique, plus l'euro s'il apparaît dans les montants du jour.
  const shown: Currency[] = currenciesOf(boutique);
  if (!shown.includes("EUR") && summary && (summary.cash.EUR || summary.tillExpenses.EUR || float.EUR)) shown.push("EUR");
  const expected = summary ? expectedCash(summary, float) : undefined;
  const closed = cashDay?.status === "closed";

  return (
    <>
      <PageTitle title="Journée de caisse" />
      <DayNav day={day} onChange={setDay} />
      {error && <Text c="red">{error}</Text>}
      {loading && !error && <div className="loading">Chargement…</div>}

      {summary && expected && (
        <Stack>
          <SimpleGrid cols={{ base: 2, sm: 4 }}>
            <Stat label="Chiffre d'affaires" value={formatMoney(summary.revenue, boutique.currency)} strong />
            <Stat label="Ventes" value={`${summary.salesCount}${summary.cancelledCount ? ` (+${summary.cancelledCount} annulées)` : ""}`} />
            <Stat label="Mobile money" value={formatMoney2(summary.mobileMoney)} />
            <Stat label="Dépenses" value={formatMoney2(summary.allExpenses)} />
          </SimpleGrid>

          <Paper p="md">
            <Title order={4} mb="xs">
              Argent dans le tiroir
            </Title>
            {/* Écran très étroit (fort zoom) : le tableau défile sur place au lieu d'élargir la page. */}
            <Table.ScrollContainer minWidth={300} type="native">
              <Table fz="sm" withRowBorders={false}>
                <Table.Thead>
                  <HeadRow shown={shown} />
                </Table.Thead>
                <Table.Tbody>
                  <Row shown={shown} label="Fond de caisse" m={float} />
                  <Row shown={shown} label="+ Espèces encaissées" m={summary.cash} />
                  <Row shown={shown} label="− Dépenses payées en caisse" m={summary.tillExpenses} />
                  <Row shown={shown} label="= Attendu" m={expected} strong />
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>

          {closed && cashDay?.closing ? (
            <ClosedRecap cashDay={cashDay} shown={shown} />
          ) : (
            <>
              <FloatForm key={`float-${day}`} shown={shown} float={float} disabled={closed || subscription.readOnly} onSave={(m) => setOpeningFloat(actor, day, m)} />
              {permissions.closeCash ? (
                <CloseForm
                  key={`close-${day}`}
                  shown={shown}
                  expected={expected}
                  onClose={(counted, notes) =>
                    closeDay(
                      actor,
                      day,
                      { counted, expected, variance: variance(counted, expected), salesCount: summary.salesCount, revenue: summary.revenue, notes },
                      float,
                    )
                  }
                />
              ) : (
                <Text c="dimmed" size="sm">
                  La clôture est faite par le gérant ou le propriétaire.
                </Text>
              )}
            </>
          )}

          {summary.bySeller.length > 1 && permissions.viewReports && (
            <Paper p="md">
              <Title order={4} mb="xs">
                Par vendeur
              </Title>
              {summary.bySeller.map((s) => (
                <Group key={s.name} justify="space-between" py={4}>
                  <Text>
                    {s.name} · {s.count} vente{s.count > 1 ? "s" : ""}
                  </Text>
                  <Text fw={600} className="n">
                    {formatMoney(s.revenue, boutique.currency)}
                  </Text>
                </Group>
              ))}
            </Paper>
          )}
        </Stack>
      )}
    </>
  );
}

function HeadRow({ shown }: { shown: Currency[] }) {
  return (
    <Table.Tr>
      <Table.Th />
      {shown.map((c) => (
        <Table.Th key={c} ta="right">
          {CURRENCIES[c].symbol}
        </Table.Th>
      ))}
    </Table.Tr>
  );
}

function Row({ shown, label, m, strong }: { shown: Currency[]; label: string; m: Money2; strong?: boolean }) {
  return (
    <Table.Tr fw={strong ? 700 : undefined}>
      <Table.Td>{label}</Table.Td>
      {shown.map((c) => (
        <Table.Td key={c} ta="right" className="n">
          {formatMoney(m[c] ?? 0, c)}
        </Table.Td>
      ))}
    </Table.Tr>
  );
}

/** Un champ de montant par devise affichée. */
function MoneyInputs({
  shown,
  values,
  onChange,
  disabled,
  prefix,
}: {
  shown: Currency[];
  values: Record<Currency, number | string>;
  onChange: (c: Currency, v: number | string) => void;
  disabled?: boolean;
  prefix: string;
}) {
  return (
    <Group grow align="flex-end">
      {shown.map((c) => (
        <NumberInput
          key={c}
          label={`${prefix}${CURRENCIES[c].symbol}`}
          min={0}
          thousandSeparator=" "
          decimalSeparator=","
          decimalScale={CURRENCIES[c].decimals}
          hideControls
          inputMode="decimal"
          disabled={disabled}
          value={values[c]}
          onChange={(v) => onChange(c, v)}
        />
      ))}
    </Group>
  );
}

const toMoney = (v: Record<Currency, number | string>): Money2 => ({ CDF: num(v.CDF), USD: num(v.USD), EUR: num(v.EUR) });

function FloatForm({ shown, float, disabled, onSave }: { shown: Currency[]; float: Money2; disabled: boolean; onSave: (m: Money2) => void }) {
  const [values, setValues] = useState<Record<Currency, number | string>>({ CDF: float.CDF || "", USD: float.USD || "", EUR: float.EUR || "" });
  const next = toMoney(values);
  const changed = shown.some((c) => next[c] !== (float[c] ?? 0));
  return (
    <Paper p="md">
      <Title order={4} mb={4}>
        Fond de caisse
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        L'argent mis dans le tiroir le matin, pour rendre la monnaie.
      </Text>
      <Stack>
        <MoneyInputs shown={shown} values={values} disabled={disabled} prefix="" onChange={(c, v) => setValues((s) => ({ ...s, [c]: v }))} />
        <Button variant="default" disabled={disabled || !changed} onClick={() => onSave(next)}>
          Enregistrer le fond de caisse
        </Button>
      </Stack>
    </Paper>
  );
}

function CloseForm({ shown, expected, onClose }: { shown: Currency[]; expected: Money2; onClose: (counted: Money2, notes: string) => void }) {
  const [values, setValues] = useState<Record<Currency, number | string>>({ CDF: "", USD: "", EUR: "" });
  const [notes, setNotes] = useState("");
  const counted = toMoney(values);
  const gap = variance(counted, expected);
  const ready = shown.some((c) => values[c] !== "");
  const short = shown.some((c) => gap[c] < 0);
  const even = shown.every((c) => gap[c] === 0);

  function confirm() {
    modals.openConfirmModal({
      title: "Clôturer la journée ?",
      children: (
        <Text size="sm">
          Les montants seront figés. Écart : <b>{formatGap(gap, shown)}</b>.
        </Text>
      ),
      labels: { confirm: "Clôturer", cancel: "Revenir" },
      onConfirm: () => onClose(counted, notes),
    });
  }

  return (
    <Paper p="md">
      <Title order={4} mb={4}>
        Clôture
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        Comptez l'argent du tiroir, puis saisissez les montants.
      </Text>
      <Stack>
        <MoneyInputs shown={shown} values={values} prefix="Compté en " onChange={(c, v) => setValues((s) => ({ ...s, [c]: v }))} />
        {ready && (
          <Alert color={even ? "teal" : short ? "red" : "orange"}>
            Écart : <b className="n">{formatGap(gap, shown)}</b>
          </Alert>
        )}
        <Textarea label="Remarque (facultatif)" maxLength={500} value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />
        <Button leftSection={<IconLock size={18} />} disabled={!ready} onClick={confirm}>
          Clôturer la journée
        </Button>
      </Stack>
    </Paper>
  );
}

function formatGap(g: Money2, shown: Currency[]): string {
  const parts = shown.filter((c) => g[c]).map((c) => (g[c] > 0 ? "+" : "") + formatMoney(g[c], c));
  if (!parts.length) return "aucun, la caisse est juste";
  return parts.join(" et ") + (shown.some((c) => g[c] < 0) ? " (manquant)" : " (surplus)");
}

function ClosedRecap({ cashDay, shown }: { cashDay: CashDay; shown: Currency[] }) {
  const c = cashDay.closing!;
  return (
    <Paper p="md">
      <Group gap="xs" mb="xs">
        <IconLock size={18} />
        <Title order={4}>Journée clôturée</Title>
      </Group>
      <Text size="sm" c="dimmed" mb="sm">
        Par {cashDay.closedByName}
        {cashDay.closedAtMs ? ` à ${new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(cashDay.closedAtMs)}` : ""}
      </Text>
      <Table.ScrollContainer minWidth={300} type="native">
        <Table fz="sm" withRowBorders={false}>
          <Table.Thead>
            <HeadRow shown={shown} />
          </Table.Thead>
          <Table.Tbody>
            <Row shown={shown} label="Attendu" m={c.expected} />
            <Row shown={shown} label="Compté" m={c.counted} />
            <Row shown={shown} label="Écart" m={c.variance} strong />
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      {c.notes && (
        <Text size="sm" mt="sm">
          {c.notes}
        </Text>
      )}
    </Paper>
  );
}
