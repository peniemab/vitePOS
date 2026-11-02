/** Rapports : jour, semaine ou mois (choisi en haut) — chiffre d'affaires, panier moyen, bénéfice, dépenses, meilleurs produits ; six derniers mois en bas. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router";
import { ActionIcon, Group, Paper, SegmentedControl, Text, Title } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useCatalog } from "../data/products";
import { useDays } from "../data/dayStats";
import { watchExpensesBetween } from "../data/cashday";
import { errorMessage } from "../data/errors";
import { PageTitle } from "../components/ui";
import { RevenueChart } from "../components/RevenueChart";
import { MonthsChart } from "../components/MonthsChart";
import { watchMonthStats } from "../data/monthStats";
import { ratesOf } from "../data/boutique";
import { lastMonths, type MonthTotals } from "../lib/monthStats";
import { formatQty } from "../components/ProductModal";
import { amount, BigMoney, MoneyLines, TillCard } from "../components/TillCard";
import { dayKey } from "../lib/cart";
import { formatDay, type Expense } from "../lib/cashday";
import { formatMoney, zeroMoney } from "../lib/fx";
import { changePercent, reportFromDays, periodOf, shiftPeriod, type Period, type PeriodKind } from "../lib/reports";

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
  const [expenses, setExpenses] = useState<Expense[]>();
  const [error, setError] = useState<string>();
  const [months, setMonths] = useState<MonthTotals[]>();

  // Six derniers mois : six petits compteurs, indépendants de la période choisie plus bas.
  useEffect(
    () => watchMonthStats(boutique.id, lastMonths(today), setMonths, (e) => setError(errorMessage(e))),
    [boutique.id, today],
  );

  useEffect(() => {
    setExpenses(undefined);
    return watchExpensesBetween(boutique.id, period.start, period.end, setExpenses, (e) => setError(errorMessage(e)));
  }, [boutique.id, period.start, period.end]);

  // Un petit résumé par jour au lieu de toutes les ventes de la période et de celle d'avant.
  const onError = useCallback((e: unknown) => setError(errorMessage(e)), []);
  const days = useDays(boutique.id, period.start, period.end, onError);
  const prevDays = useDays(boutique.id, previous.start, previous.end, onError);
  const report = useMemo(() => (days ? reportFromDays(days, period, boutique.currency, costs) : undefined), [days, period, boutique.currency, costs]);
  const prev = useMemo(() => (prevDays ? reportFromDays(prevDays, previous, boutique.currency) : undefined), [prevDays, previous, boutique.currency]);

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
          <div className="screen-till">
            <TillCard
              label="Chiffre d'affaires"
              total={<BigMoney value={report.revenue} currency={c} />}
              note={delta == null ? undefined : delta === 0 ? "Comme la période d'avant" : `${Math.abs(delta)} % de ${delta > 0 ? "plus" : "moins"} que la période d'avant`}
              figures={[
                { label: "Ventes", value: report.salesCount },
                { label: "Panier moyen", value: amount(report.averageBasket, c) },
                ...(report.margin != null
                  ? [
                      {
                        label: "Bénéfice estimé",
                        value: amount(report.margin, c),
                        note: report.costCoverage < 0.98 ? `sur ${Math.round(report.costCoverage * 100)} % des ventes` : undefined,
                      },
                    ]
                  : []),
                { label: "Dépenses", value: <MoneyLines m={expenseTotal} main={c} /> },
              ]}
            />
            {report.margin != null && (
              <Text size="xs" c="dimmed" mt={6}>
                Bénéfice estimé : ventes moins les prix d'achat actuels
                {report.costCoverage < 0.98 ? " (des articles n'ont pas encore de prix d'achat)" : ""}.
              </Text>
            )}
          </div>

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
                    <small>
                      {formatQty(p.quantity, unitOf.get(p.productId) ?? "u")} vendu{p.quantity > 1 && (unitOf.get(p.productId) ?? "u") === "u" ? "s" : ""}
                    </small>
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

      <Paper p="md" mt="md">
        <Title order={4} mb="xs">
          Ventes et dépenses, six derniers mois
        </Title>
        {months ? <MonthsChart months={months} currency={boutique.currency} rates={ratesOf(boutique)} /> : <div className="loading">Chargement…</div>}
      </Paper>
    </>
  );
}
