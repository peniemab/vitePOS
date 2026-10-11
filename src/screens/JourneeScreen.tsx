/**
 * Journée de caisse : fond de caisse du matin, résumé du jour, et clôture du soir
 * (argent compté comparé à l'argent attendu, en FC et en $).
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
import { formatMoney } from "../lib/fx";
import type { Sale } from "../lib/sales";

const num = (v: number | string) => Number(v) || 0;

export function JourneeScreen() {
  const { boutique, permissions } = useReady();
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
  const float: Money2 = cashDay?.openingFloat ?? { CDF: 0, USD: 0 };
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
            <Table fz="sm" withRowBorders={false}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th />
                  <Table.Th ta="right">FC</Table.Th>
                  <Table.Th ta="right">$</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Row label="Fond de caisse" m={float} />
                <Row label="+ Espèces encaissées" m={summary.cash} />
                <Row label="− Dépenses payées en caisse" m={summary.tillExpenses} />
                <Row label="= Attendu" m={expected} strong />
              </Table.Tbody>
            </Table>
          </Paper>

          {closed && cashDay?.closing ? (
            <ClosedRecap cashDay={cashDay} />
          ) : (
            <>
              <FloatForm key={`float-${day}`} float={float} disabled={closed} onSave={(m) => setOpeningFloat(actor, day, m)} />
              {permissions.closeCash ? (
                <CloseForm
                  key={`close-${day}`}
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

function Row({ label, m, strong }: { label: string; m: Money2; strong?: boolean }) {
  return (
    <Table.Tr fw={strong ? 700 : undefined}>
      <Table.Td>{label}</Table.Td>
      <Table.Td ta="right" className="n">
        {formatMoney(m.CDF, "CDF")}
      </Table.Td>
      <Table.Td ta="right" className="n">
        {formatMoney(m.USD, "USD")}
      </Table.Td>
    </Table.Tr>
  );
}

function FloatForm({ float, disabled, onSave }: { float: Money2; disabled: boolean; onSave: (m: Money2) => void }) {
  const [cdf, setCdf] = useState<number | string>(float.CDF || "");
  const [usd, setUsd] = useState<number | string>(float.USD || "");
  const changed = num(cdf) !== float.CDF || num(usd) !== float.USD;
  return (
    <Paper p="md">
      <Title order={4} mb={4}>
        Fond de caisse
      </Title>
      <Text size="sm" c="dimmed" mb="sm">
        L'argent mis dans le tiroir le matin, pour rendre la monnaie.
      </Text>
      <Group align="flex-end">
        <NumberInput label="FC" min={0} thousandSeparator=" " hideControls inputMode="decimal" disabled={disabled} value={cdf} onChange={setCdf} style={{ flex: 1 }} />
        <NumberInput label="$" min={0} decimalSeparator="," decimalScale={2} hideControls inputMode="decimal" disabled={disabled} value={usd} onChange={setUsd} style={{ flex: 1 }} />
        <Button variant="default" disabled={disabled || !changed} onClick={() => onSave({ CDF: num(cdf), USD: num(usd) })}>
          Enregistrer
        </Button>
      </Group>
    </Paper>
  );
}

function CloseForm({ expected, onClose }: { expected: Money2; onClose: (counted: Money2, notes: string) => void }) {
  const [cdf, setCdf] = useState<number | string>("");
  const [usd, setUsd] = useState<number | string>("");
  const [notes, setNotes] = useState("");
  const counted = { CDF: num(cdf), USD: num(usd) };
  const gap = variance(counted, expected);
  const ready = cdf !== "" || usd !== "";

  function confirm() {
    modals.openConfirmModal({
      title: "Clôturer la journée ?",
      children: (
        <Text size="sm">
          Les montants seront figés. Écart : <b>{formatGap(gap)}</b>.
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
        <Group grow>
          <NumberInput label="Compté en FC" min={0} thousandSeparator=" " hideControls inputMode="decimal" value={cdf} onChange={setCdf} />
          <NumberInput label="Compté en $" min={0} decimalSeparator="," decimalScale={2} hideControls inputMode="decimal" value={usd} onChange={setUsd} />
        </Group>
        {ready && (
          <Alert color={gap.CDF === 0 && gap.USD === 0 ? "teal" : gap.CDF < 0 || gap.USD < 0 ? "red" : "orange"}>
            Écart : <b className="n">{formatGap(gap)}</b>
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

function formatGap(g: Money2): string {
  const one = (v: number, c: "CDF" | "USD") => (v > 0 ? "+" : "") + formatMoney(v, c);
  if (g.CDF === 0 && g.USD === 0) return "aucun, la caisse est juste";
  return [g.CDF ? one(g.CDF, "CDF") : "", g.USD ? one(g.USD, "USD") : ""].filter(Boolean).join(" et ") + (g.CDF < 0 || g.USD < 0 ? " (manquant)" : " (surplus)");
}

function ClosedRecap({ cashDay }: { cashDay: CashDay }) {
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
      <Table fz="sm" withRowBorders={false}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th ta="right">FC</Table.Th>
            <Table.Th ta="right">$</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Row label="Attendu" m={c.expected} />
          <Row label="Compté" m={c.counted} />
          <Row label="Écart" m={c.variance} strong />
        </Table.Tbody>
      </Table>
      {c.notes && (
        <Text size="sm" mt="sm">
          {c.notes}
        </Text>
      )}
    </Paper>
  );
}
