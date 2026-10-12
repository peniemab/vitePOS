/** Rapports : jour, semaine ou mois — chiffre d'affaires, panier moyen, marge, dépenses, meilleurs produits. */
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router";
import { ActionIcon, Group, Paper, SegmentedControl, SimpleGrid, Table, Text, Title } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useCatalog } from "../data/products";
import { watchSalesBetween } from "../data/sales";
import { watchExpensesBetween } from "../data/cashday";
import { errorMessage } from "../data/errors";
import { PageTitle } from "../components/ui";
import { RevenueChart } from "../components/RevenueChart";
import { formatQty } from "../components/ProductModal";
import { Stat } from "./VentesScreen";
import { dayKey } from "../lib/cart";
import { formatDay, formatMoney2, type Expense } from "../lib/cashday";
import { formatMoney } from "../lib/fx";
import { buildReport, changePercent, periodOf, shiftPeriod, type Period, type PeriodKind } from "../lib/reports";
import type { Sale } from "../lib/sales";

function periodLabel(p: Period): string {
  if (p.kind === "jour") return formatDay(p.start);
  if (p.kind === "mois") {
    const [y, m] = p.start.split("-").map(Number);
    return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
  }
  const f = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
  const d = (s: string) => f.format(new Date(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8))));
  return `Semaine du ${d(p.start)} au ${d(p.end)}`;
}

export function RapportsScreen() {
  const { boutique, permissions } = useReady();
  const { costs, products } = useCatalog();
  const today = dayKey(Date.now());
  const [period, setPeriod] = useState<Period>(() => periodOf("semaine", today));
  const previous = useMemo(() => shiftPeriod(period, -1), [period]);
  const [sales, setSales] = useState<Sale[]>();
  const [prevSales, setPrevSales] = useState<Sale[]>();
  const [expenses, setExpenses] = useState<Expense[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    setSales(undefined);
    setPrevSales(undefined);
    setExpenses(undefined);
    const onError = (e: unknown) => setError(errorMessage(e));
    const a = watchSalesBetween(boutique.id, period.start, period.end, setSales, onError);
    const b = watchSalesBetween(boutique.id, previous.start, previous.end, setPrevSales, onError);
    const c = watchExpensesBetween(boutique.id, period.start, period.end, setExpenses, onError);
    return () => {
      a();
      b();
      c();
    };
  }, [boutique.id, period.start, period.end, previous.start, previous.end]);

  const report = useMemo(() => (sales ? buildReport(sales, period, boutique.currency, costs) : undefined), [sales, period, boutique.currency, costs]);
  const prev = useMemo(() => (prevSales ? buildReport(prevSales, previous, boutique.currency) : undefined), [prevSales, previous, boutique.currency]);

  if (!permissions.viewReports) return <Navigate to="/plus" replace />;

  const c = boutique.currency;
  const expenseTotal = { CDF: 0, USD: 0 };
  for (const e of expenses ?? []) if (e.status === "validee") expenseTotal[e.currency] += e.amount;
  const delta = report && prev ? changePercent(report.revenue, prev.revenue) : undefined;
  const unitOf = new Map((products ?? []).map((p) => [p.id, p.unit]));
  const canGoNext = period.end < today;

  return (
    <>
      <PageTitle title="Rapports" />
      <SegmentedControl
        fullWidth
        mb="sm"
        value={period.kind}
        onChange={(k) => setPeriod(periodOf(k as PeriodKind, today))}
        data={[
          { value: "jour", label: "Jour" },
          { value: "semaine", label: "Semaine" },
          { value: "mois", label: "Mois" },
        ]}
      />
      <Group gap="xs" mb="md" wrap="nowrap">
        <ActionIcon variant="default" size="lg" aria-label="Période précédente" onClick={() => setPeriod(shiftPeriod(period, -1))}>
          <IconChevronLeft size={18} />
        </ActionIcon>
        <Text fw={600} style={{ flex: 1, textAlign: "center" }} tt="capitalize">
          {periodLabel(period)}
        </Text>
        <ActionIcon variant="default" size="lg" aria-label="Période suivante" disabled={!canGoNext} onClick={() => setPeriod(shiftPeriod(period, 1))}>
          <IconChevronRight size={18} />
        </ActionIcon>
      </Group>

      {error && <Text c="red">{error}</Text>}
      {!report && !error && <div className="loading">Chargement…</div>}

      {report && (
        <>
          <SimpleGrid cols={{ base: 2, sm: 4 }} mb="md">
            <Stat
              label={delta == null ? "Chiffre d'affaires" : `Chiffre d'affaires (${delta > 0 ? "+" : ""}${delta} % vs avant)`}
              value={formatMoney(report.revenue, c)}
              strong
            />
            <Stat label="Ventes" value={String(report.salesCount)} />
            <Stat label="Panier moyen" value={formatMoney(report.averageBasket, c)} />
            <Stat label="Dépenses" value={formatMoney2(expenseTotal)} />
          </SimpleGrid>

          {report.margin != null && (
            <Paper p="md" mb="md">
              <Text size="sm" c="dimmed">
                Marge brute estimée
              </Text>
              <Text fz={26} fw={700} className="n">
                {formatMoney(report.margin, c)}
              </Text>
              <Text size="xs" c="dimmed">
                Ventes moins prix d'achat actuels
                {report.costCoverage < 0.98
                  ? `, sur ${Math.round(report.costCoverage * 100)} % des ventes (des produits n'ont pas de prix d'achat)`
                  : ""}
                .
              </Text>
            </Paper>
          )}

          {period.kind !== "jour" && (
            <Paper p="md" mb="md">
              <Title order={4} mb="xs">
                Chiffre d'affaires par jour
              </Title>
              <RevenueChart data={report.byDay} currency={c} />
            </Paper>
          )}

          <Paper p="md" mb="md">
            <Title order={4} mb="xs">
              Meilleurs produits
            </Title>
            {report.topProducts.length ? (
              <Table.ScrollContainer minWidth={320}>
                <Table fz="sm" striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Produit</Table.Th>
                      <Table.Th ta="right">Quantité</Table.Th>
                      <Table.Th ta="right">Chiffre d'affaires</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {report.topProducts.slice(0, 10).map((p) => (
                      <Table.Tr key={p.productId}>
                        <Table.Td>{p.name}</Table.Td>
                        <Table.Td ta="right" className="n">
                          {formatQty(p.quantity, unitOf.get(p.productId) ?? "u")}
                        </Table.Td>
                        <Table.Td ta="right" className="n">
                          {formatMoney(p.revenue, c)}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            ) : (
              <Text c="dimmed">Aucune vente sur la période.</Text>
            )}
          </Paper>

          <Paper p="md">
            <Title order={4} mb="xs">
              Moyens de paiement
            </Title>
            <Group justify="space-between">
              <Text>Espèces</Text>
              <Text fw={600} className="n">
                {formatMoney(report.payment.cash, c)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text>Mobile money</Text>
              <Text fw={600} className="n">
                {formatMoney(report.payment.mobileMoney, c)}
              </Text>
            </Group>
            {report.discounts > 0 && (
              <Group justify="space-between">
                <Text c="dimmed">Remises accordées</Text>
                <Text className="n" c="dimmed">
                  {formatMoney(report.discounts, c)}
                </Text>
              </Group>
            )}
          </Paper>
        </>
      )}
    </>
  );
}
