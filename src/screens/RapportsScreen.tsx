/** Rapports : jour, semaine ou mois — chiffre d'affaires, panier moyen, marge, dépenses, meilleurs produits. */
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router";
import { ActionIcon, Group, Paper, SegmentedControl, Text, Title } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconPigMoney, IconReceipt2, IconShoppingBag, IconWallet } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useCatalog } from "../data/products";
import { watchSalesBetween } from "../data/sales";
import { watchExpensesBetween } from "../data/cashday";
import { errorMessage } from "../data/errors";
import { PageTitle } from "../components/ui";
import { RevenueChart } from "../components/RevenueChart";
import { MonthsChart } from "../components/MonthsChart";
import { watchMonthStats } from "../data/monthStats";
import { ratesOf } from "../data/boutique";
import { lastMonths, type MonthTotals } from "../lib/monthStats";
import { formatQty } from "../components/ProductModal";
import { Stat } from "./VentesScreen";
import { dayKey } from "../lib/cart";
import { formatDay, formatMoney2, type Expense } from "../lib/cashday";
import { formatMoney, zeroMoney } from "../lib/fx";
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
  const [months, setMonths] = useState<MonthTotals[]>();

  // Six derniers mois : six petits compteurs, indépendants de la période choisie plus bas.
  useEffect(
    () => watchMonthStats(boutique.id, lastMonths(today), setMonths, (e) => setError(errorMessage(e))),
    [boutique.id, today],
  );

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
  const expenseTotal = zeroMoney();
  for (const e of expenses ?? []) if (e.status === "validee") expenseTotal[e.currency] += e.amount;
  const delta = report && prev ? changePercent(report.revenue, prev.revenue) : undefined;
  const unitOf = new Map((products ?? []).map((p) => [p.id, p.unit]));
  const canGoNext = period.end < today;

  return (
    <>
      <PageTitle title="Rapports" />
      <Paper p="md" mb="lg">
        <Title order={4} mb="xs">
          Ventes et dépenses, six derniers mois
        </Title>
        {months ? <MonthsChart months={months} currency={boutique.currency} rates={ratesOf(boutique)} /> : <div className="loading">Chargement…</div>}
      </Paper>
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
        <Text fw={600} style={{ flex: 1, textAlign: "center" }}>
          {periodLabel(period).replace(/^./, (c) => c.toUpperCase())}
        </Text>
        <ActionIcon variant="default" size="lg" aria-label="Période suivante" disabled={!canGoNext} onClick={() => setPeriod(shiftPeriod(period, 1))}>
          <IconChevronRight size={18} />
        </ActionIcon>
      </Group>

      {error && <Text c="red">{error}</Text>}
      {!report && !error && <div className="loading">Chargement…</div>}

      {report && (
        <>
          <div className="kpis">
            <Stat
              label="Chiffre d'affaires"
              value={formatMoney(report.revenue, c)}
              strong
              icon={<IconWallet size={20} />}
              note={delta == null ? undefined : `${delta > 0 ? "+" : ""}${delta} % par rapport à la période d'avant`}
            />
            <Stat label="Ventes" value={String(report.salesCount)} icon={<IconReceipt2 size={20} />} tone="violet" />
            <Stat label="Panier moyen" value={formatMoney(report.averageBasket, c)} icon={<IconShoppingBag size={20} />} />
            <Stat label="Dépenses" value={formatMoney2(expenseTotal)} icon={<IconPigMoney size={20} />} tone="orange" />
          </div>

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
              report.topProducts.slice(0, 10).map((p, i) => (
                <div key={p.productId} className="top-row">
                  <span className="rank">{i + 1}</span>
                  <div className="name">
                    <b>{p.name}</b>
                    <div className="progress">
                      <div style={{ width: `${Math.max(6, (p.revenue / report.topProducts[0].revenue) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="n v">
                    {formatMoney(p.revenue, c)}
                    <small>{formatQty(p.quantity, unitOf.get(p.productId) ?? "u")}</small>
                  </span>
                </div>
              ))
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
