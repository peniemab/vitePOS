/**
 * Accueil : chiffres du jour comparés à hier, ventes des derniers jours, paiements du jour, meilleurs articles,
 * points à surveiller et dernières ventes.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { Button, SegmentedControl, Text, TextInput } from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowsExchange,
  IconCalendarExclamation,
  IconCashRegister,
  IconChevronRight,
  IconCoins,
  IconPigMoney,
  IconReceipt,
  IconSearch,
  IconShoppingBag,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useCatalog } from "../data/products";
import { watchSalesBetween } from "../data/sales";
import { needsRestock } from "../lib/products";
import { useLots } from "../data/lots";
import { expiringLots } from "../lib/lots";
import { InstallCard } from "../components/InstallCard";
import { dayKey, ticketNumber } from "../lib/cart";
import { shiftDay } from "../lib/cashday";
import { buildReport, changePercent, compactAmount, lastDays, paymentBreakdown, periodOf, type Period } from "../lib/reports";
import { CURRENCIES, formatMoney, type Currency } from "../lib/fx";
import { PAYMENT_LABELS, timeAgo, type Sale } from "../lib/sales";

type Range = "7" | "30" | "mois";

const SLICE_COLORS: Record<string, string> = {
  "especes-CDF": "#1f9d55",
  "mobile_money-CDF": "#e8890c",
  "especes-USD": "#3987e5",
  "mobile_money-USD": "#f2b10c",
  "especes-EUR": "#9c36b5",
  "mobile_money-EUR": "#c2255c",
};

export function HomeScreen() {
  const { member, boutique, permissions } = useReady();
  const { products, costs } = useCatalog();
  const navigate = useNavigate();
  const c = boutique.currency;
  const alerts = products?.filter(needsRestock).length ?? 0;
  const lots = useLots(boutique.id);
  const today = dayKey(Date.now());
  const expiring = expiringLots((products ?? []).filter((p) => !p.archived), lots ?? [], today);
  const expired = expiring.filter((l) => l.daysLeft < 0).length;
  const firstName = member.name.split(" ")[0] || member.email;
  const yesterday = shiftDay(today, -1);
  const monthStart = `${today.slice(0, 8)}01`;
  const since = [shiftDay(today, -29), monthStart].sort()[0];
  const [sales, setSales] = useState<Sale[]>();
  const [range, setRange] = useState<Range>("7");
  const [search, setSearch] = useState("");

  useEffect(() => watchSalesBetween(boutique.id, since, today, setSales, () => setSales([])), [boutique.id, since, today]);

  // Un vendeur sans accès aux rapports voit seulement ses propres ventes.
  const mine = useMemo(() => (permissions.viewReports ? sales : sales?.filter((s) => s.uid === member.uid)), [sales, permissions.viewReports, member.uid]);
  const t = useMemo(() => buildReport(mine ?? [], periodOf("jour", today), c, costs), [mine, today, c, costs]);
  const y = useMemo(() => buildReport(mine ?? [], periodOf("jour", yesterday), c, costs), [mine, yesterday, c, costs]);
  const chartPeriod: Period = range === "mois" ? periodOf("mois", today) : lastDays(today, Number(range));
  const chart = useMemo(() => buildReport(mine ?? [], chartPeriod, c), [mine, chartPeriod.start, chartPeriod.end, c]); // eslint-disable-line react-hooks/exhaustive-deps
  const todaySales = useMemo(() => (mine ?? []).filter((s) => s.dayKey === today), [mine, today]);
  const slices = useMemo(() => paymentBreakdown(todaySales), [todaySales]);
  const latest = useMemo(
    () => todaySales.filter((s) => s.status === "validee").sort((a, b) => b.createdAtMs - a.createdAtMs).slice(0, 3),
    [todaySales],
  );
  const loading = !mine;
  const rate = boutique.usdRateCdf ? `1 $ = ${formatMoney(boutique.usdRateCdf, "CDF")}` : "";

  return (
    <>
      <div className="home-top">
        <div className="hello">
          <h1>Bonjour {firstName}</h1>
          <div className="sub">{longDay(today)}</div>
        </div>
        <form
          className="home-search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(search.trim() ? `/stock?q=${encodeURIComponent(search.trim())}` : "/stock");
          }}
        >
          <TextInput
            variant="filled"
            size="md"
            leftSection={<IconSearch size={18} />}
            placeholder="Chercher un article…"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            enterKeyHint="search"
            aria-label="Chercher un article"
          />
        </form>
        {rate && (
          <Link to="/parametres" className="rate-chip n" title="Taux du jour (modifiable dans les Paramètres)">
            <IconArrowsExchange size={18} />
            {rate}
          </Link>
        )}
        <Button component={Link} to="/caisse" size="md" className="night-btn" leftSection={<IconCashRegister size={20} />}>
          Nouvelle vente
        </Button>
      </div>

      <InstallCard dismissible mb="md" />

      <div className="kpis" data-three={!permissions.viewReports || undefined}>
        <Kpi
          hero
          to="/ventes"
          icon={<IconCoins size={20} />}
          label={permissions.viewReports ? "Ventes d'aujourd'hui" : "Vos ventes d'aujourd'hui"}
          value={loading ? "…" : formatMoney(t.revenue, c)}
          trend={percentTrend(t.revenue, y.revenue)}
        />
        <Kpi
          tone="blue"
          icon={<IconReceipt size={20} />}
          label="Nombre de ventes"
          value={loading ? "…" : String(t.salesCount)}
          trend={y.salesCount || t.salesCount ? { up: t.salesCount >= y.salesCount, text: `${t.salesCount - y.salesCount >= 0 ? "+" : ""}${t.salesCount - y.salesCount}` } : undefined}
        />
        <Kpi
          tone="violet"
          icon={<IconShoppingBag size={20} />}
          label="Panier moyen"
          value={loading ? "…" : formatMoney(t.averageBasket, c)}
          trend={percentTrend(t.averageBasket, y.averageBasket)}
        />
        {permissions.viewReports && (
          <Kpi
            tone="green"
            icon={<IconPigMoney size={20} />}
            label="Bénéfice estimé"
            value={loading ? "…" : t.margin != null ? formatMoney(t.margin, c) : "—"}
            trend={t.margin != null && y.margin != null ? percentTrend(t.margin, y.margin) : undefined}
            note={t.margin == null && !loading ? "Ajoutez les prix d'achat dans le stock" : undefined}
          />
        )}
      </div>

      <div className="home-row two">
        <section className="panel">
          <div className="panel-h">
            <h3>{range === "7" ? "Ventes de la semaine" : range === "30" ? "Ventes des 30 derniers jours" : "Ventes du mois"}</h3>
            <SegmentedControl
              size="xs"
              value={range}
              onChange={(v) => setRange(v as Range)}
              data={[
                { value: "7", label: "7 jours" },
                { value: "30", label: "30 jours" },
                { value: "mois", label: "Mois" },
              ]}
            />
          </div>
          <WeekBars days={chart.byDay} today={today} currency={c} />
        </section>
        <section className="panel">
          <div className="panel-h">
            <h3>Paiements du jour</h3>
          </div>
          {slices.length ? (
            <div className="donut-wrap">
              <Donut slices={slices.map((s) => ({ color: SLICE_COLORS[`${s.method}-${s.currency}`] ?? "#7a8599", value: s.value }))} count={t.salesCount} />
              <div className="legend">
                {slices.map((s) => (
                  <div key={`${s.method}-${s.currency}`}>
                    <i style={{ background: SLICE_COLORS[`${s.method}-${s.currency}`] ?? "#7a8599" }} />
                    {PAYMENT_LABELS[s.method]}
                    {s.method === "especes" || s.currency !== c ? ` ${CURRENCIES[s.currency].symbol}` : ""}
                    <b className="n">{shortMoney(s.amount, s.currency)}</b>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Text c="dimmed" size="sm" py="lg" ta="center">
              {loading ? "Chargement…" : "Pas encore de vente aujourd'hui."}
            </Text>
          )}
        </section>
      </div>

      <div className="home-row three">
        <section className="panel">
          <div className="panel-h">
            <h3>Meilleurs articles</h3>
            {permissions.viewReports && (
              <Link to="/rapports" className="see-all">
                Tout voir
              </Link>
            )}
          </div>
          {t.topProducts.length ? (
            t.topProducts.slice(0, 3).map((p, i) => (
              <div key={p.productId} className="top-row">
                <span className="rank">{i + 1}</span>
                <div className="name">
                  <b>{p.name}</b>
                  <div className="progress">
                    <div style={{ width: `${Math.max(6, (p.revenue / t.topProducts[0].revenue) * 100)}%` }} />
                  </div>
                </div>
                <span className="n v">{formatMoney(p.revenue, c).replace(/\s*\S+$/, "")}</span>
              </div>
            ))
          ) : (
            <Text c="dimmed" size="sm" py="md">
              {loading ? "Chargement…" : "Les articles les plus vendus du jour apparaîtront ici."}
            </Text>
          )}
        </section>

        <section className="panel">
          <div className="panel-h">
            <h3>À surveiller</h3>
          </div>
          {alerts > 0 && (
            <Link to="/stock?filtre=alertes" className="watch warn">
              <IconAlertTriangle size={22} />
              <div>
                <b>
                  {alerts} article{alerts > 1 ? "s" : ""} à commander
                </b>
                <small>Rupture ou sous le seuil</small>
              </div>
              <IconChevronRight size={18} />
            </Link>
          )}
          {expiring.length > 0 && (
            <Link to="/stock?filtre=peremption" className="watch danger">
              <IconCalendarExclamation size={22} />
              <div>
                <b>
                  {expiring.length} lot{expiring.length > 1 ? "s" : ""} bientôt périmé{expiring.length > 1 ? "s" : ""}
                </b>
                <small>{expired ? `Dont ${expired} déjà périmé${expired > 1 ? "s" : ""}` : "Dans les 30 prochains jours"}</small>
              </div>
              <IconChevronRight size={18} />
            </Link>
          )}
          {!alerts && !expiring.length && (
            <Text c="dimmed" size="sm" py="md">
              Rien à signaler : le stock est bon.
            </Text>
          )}
        </section>

        <section className="panel">
          <div className="panel-h">
            <h3>Dernières ventes</h3>
            <Link to="/ventes" className="see-all">
              Tout voir
            </Link>
          </div>
          {latest.length ? (
            latest.map((s) => {
              const items = s.lines.length;
              return (
                <Link key={s.id} to={`/ticket/${s.id}`} className="sale-row">
                  <span className="ico blue">
                    <IconReceipt size={20} />
                  </span>
                  <div className="who">
                    <b>
                      <span className="n">{ticketNumber(s.id)}</span> · {s.clientName || s.memberName}
                    </b>
                    <small>
                      {timeAgo(s.createdAtMs, Date.now())} · {items} article{items > 1 ? "s" : ""}
                    </small>
                  </div>
                  <div className="amt">
                    <b className="n">{formatMoney(s.total, s.currency)}</b>
                    <span className={`pay-tag ${s.payment.method}`}>{PAYMENT_LABELS[s.payment.method]}</span>
                  </div>
                </Link>
              );
            })
          ) : (
            <Text c="dimmed" size="sm" py="md">
              {loading ? "Chargement…" : "Les ventes du jour apparaîtront ici."}
            </Text>
          )}
        </section>
      </div>
    </>
  );
}

/** « Samedi 31 octobre ». */
function longDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const s = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(y, m - 1, d));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Montant court des graphiques : sans « FC » pour les francs, avec le symbole pour les autres devises. */
function shortMoney(n: number, currency: Currency): string {
  return currency === "CDF" ? compactAmount(n) : `${compactAmount(n)} ${CURRENCIES[currency].symbol}`;
}

function percentTrend(now: number, before: number): { up: boolean; text: string } | undefined {
  const d = changePercent(now, before);
  return d == null ? undefined : { up: d >= 0, text: `${d > 0 ? "+" : ""}${d} %` };
}

function Kpi({
  hero,
  tone,
  icon,
  label,
  value,
  trend,
  note,
  to,
}: {
  hero?: boolean;
  tone?: "blue" | "violet" | "green";
  icon: ReactNode;
  label: string;
  value: string;
  trend?: { up: boolean; text: string };
  note?: string;
  to?: string;
}) {
  const body = (
    <>
      <div className="lbl">
        <span className={`ico ${hero ? "glass" : tone}`}>{icon}</span>
        {label}
      </div>
      <div className="val n">{value}</div>
      {trend ? (
        <div className={`trend ${trend.up ? "up" : "down"}`}>
          <b>
            {trend.up ? <IconTrendingUp size={16} /> : <IconTrendingDown size={16} />}
            {trend.text}
          </b>
          <span>par rapport à hier</span>
        </div>
      ) : (
        <div className="trend">
          <span>{note ?? "Pas de vente hier pour comparer"}</span>
        </div>
      )}
    </>
  );
  return to ? (
    <Link to={to} className={`kpi${hero ? " hero" : ""}`}>
      {body}
    </Link>
  ) : (
    <div className={`kpi${hero ? " hero" : ""}`}>{body}</div>
  );
}

const SHORT_DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

/** Barres des ventes par jour : aujourd'hui en bleu nuit, les autres jours en bleu clair. */
function WeekBars({ days, today, currency }: { days: { day: string; revenue: number }[]; today: string; currency: Currency }) {
  const max = Math.max(1, ...days.map((d) => d.revenue));
  const few = days.length <= 7;
  return (
    <div className="bars" data-many={!few || undefined} role="img" aria-label="Ventes par jour">
      {days.map((d, i) => {
        const [y, m, dd] = d.day.split("-").map(Number);
        const isToday = d.day === today;
        const label = few ? (isToday ? "Aujourd'hui" : SHORT_DAYS[new Date(y, m - 1, dd).getDay()]) : i % 5 === 0 || isToday ? String(dd) : "";
        return (
          <div key={d.day} className={`bar${isToday ? " today" : ""}`} title={`${d.day} : ${formatMoney(d.revenue, currency)}`}>
            {few && <b className="n">{d.revenue ? shortMoney(d.revenue, currency) : ""}</b>}
            <div style={{ height: Math.max(4, Math.round((d.revenue / max) * 120)) }} />
            <small>{label}</small>
          </div>
        );
      })}
    </div>
  );
}

function Donut({ slices, count }: { slices: { color: string; value: number }[]; count: number }) {
  const total = slices.reduce((n, s) => n + s.value, 0) || 1;
  let offset = 25;
  return (
    <svg width="140" height="140" viewBox="0 0 42 42" aria-hidden>
      <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--app-soft)" strokeWidth="6" />
      {slices.map((s, i) => {
        const pct = (s.value / total) * 100;
        const el = <circle key={i} cx="21" cy="21" r="15.9" fill="none" stroke={s.color} strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset} />;
        offset -= pct;
        return el;
      })}
      <text x="21" y="21" textAnchor="middle" fontFamily="Barlow Condensed" fontWeight="700" fontSize="8" fill="currentColor">
        {count}
      </text>
      <text x="21" y="27" textAnchor="middle" fontFamily="Barlow" fontSize="3.4" fill="var(--mantine-color-dimmed)">
        vente{count > 1 ? "s" : ""}
      </text>
    </svg>
  );
}
