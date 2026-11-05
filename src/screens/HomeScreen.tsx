/**
 * Accueil : la recette du jour en ticket de caisse (comparée à hier à la même heure), les ventes heure par heure,
 * points à surveiller, dernières ventes, meilleurs articles, ventes des derniers jours et paiements du jour.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button, SegmentedControl, Text, TextInput } from "@mantine/core";
import { IconAlertTriangle, IconArrowsExchange, IconCalendarExclamation, IconChevronRight, IconPlus, IconSearch } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { FirstSteps } from "../components/FirstSteps";
import { useCatalog } from "../data/products";
import { watchSalesBetween } from "../data/sales";
import { useDays } from "../data/dayStats";
import { needsRestock } from "../lib/products";
import { useLots } from "../data/lots";
import { expiringLots } from "../lib/lots";
import { InstallCard } from "../components/InstallCard";
import { amount, BigMoney, TillCard } from "../components/TillCard";
import { dayKey } from "../lib/cart";
import { shiftDay } from "../lib/cashday";
import {
  beforeMinute,
  buildReport,
  changePercent,
  compactAmount,
  lastDays,
  minuteOfDay,
  paymentBreakdown,
  periodOf,
  reportFromDays,
  salesByHour,
  type HourStat,
  type Period,
} from "../lib/reports";
import { CURRENCIES, formatMoney, type Currency } from "../lib/fx";
import { PAYMENT_LABELS, type Sale } from "../lib/sales";

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
  const [sales, setSales] = useState<Sale[]>();
  const [range, setRange] = useState<Range>("7");
  const [search, setSearch] = useState("");

  // Ventes d'hier et d'aujourd'hui seulement ; le graphique lit un résumé par jour.
  useEffect(() => watchSalesBetween(boutique.id, yesterday, today, setSales, () => setSales([])), [boutique.id, yesterday, today]);

  // Un vendeur sans accès aux rapports voit seulement ses propres ventes.
  const mine = useMemo(() => (permissions.viewReports ? sales : sales?.filter((s) => s.uid === member.uid)), [sales, permissions.viewReports, member.uid]);
  const t = useMemo(() => buildReport(mine ?? [], periodOf("jour", today), c, costs), [mine, today, c, costs]);
  // Hier jusqu'à la même heure : comparer 11 h à une journée entière ne voudrait rien dire.
  const now = Date.now();
  const minute = minuteOfDay(now);
  const y = useMemo(() => buildReport(beforeMinute(mine ?? [], minute), periodOf("jour", yesterday), c, costs), [mine, minute, yesterday, c, costs]);
  const chartPeriod: Period = range === "mois" ? periodOf("mois", today) : lastDays(today, Number(range));
  const days = useDays(boutique.id, chartPeriod.start, chartPeriod.end, () => undefined);
  const chartUid = permissions.viewReports ? undefined : member.uid;
  const chart = useMemo(() => reportFromDays(days ?? [], chartPeriod, c, undefined, chartUid), [days, chartPeriod.start, chartPeriod.end, c, chartUid]); // eslint-disable-line react-hooks/exhaustive-deps
  const todaySales = useMemo(() => (mine ?? []).filter((s) => s.dayKey === today), [mine, today]);
  const slices = useMemo(() => paymentBreakdown(todaySales), [todaySales]);
  const hours = useMemo(() => salesByHour(todaySales), [todaySales]);
  const latest = useMemo(
    () => todaySales.filter((s) => s.status === "validee").sort((a, b) => b.createdAtMs - a.createdAtMs).slice(0, 4),
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
      </div>

      <InstallCard dismissible mb="md" />
      <FirstSteps />

      <div className="home-grid">
        <div>
          <TillCard
            to="/ventes"
            label={permissions.viewReports ? "Recette du jour" : "Vos ventes du jour"}
            total={loading ? "…" : <BigMoney value={t.revenue} currency={c} />}
            note={loading ? undefined : versus(t.revenue, y.revenue)}
            figures={[
              { label: "Ventes", value: loading ? "…" : t.salesCount, ...(loading ? {} : delta(t.salesCount, y.salesCount, true)) },
              { label: "Panier moyen", value: loading ? "…" : amount(t.averageBasket, c), ...(loading ? {} : delta(t.averageBasket, y.averageBasket)) },
              ...(permissions.viewReports
                ? [
                    {
                      label: "Bénéfice estimé",
                      value: loading ? "…" : t.margin != null ? amount(t.margin, c) : "—",
                      ...(loading ? {} : t.margin == null ? { note: "Prix d'achat manquants" } : y.margin != null ? delta(t.margin, y.margin) : {}),
                    },
                  ]
                : []),
            ]}
          />

          <Button component={Link} to="/caisse" size="xl" fullWidth className="sun-btn new-sale" leftSection={<IconPlus size={24} stroke={2.4} />}>
            Nouvelle vente
          </Button>

          <section className="panel">
            <div className="panel-h">
              <h3>Quand vous vendez</h3>
            </div>
            <HourBars hours={hours} nowHour={new Date(now).getHours()} currency={c} />
          </section>
        </div>

        <div>
          {(alerts > 0 || expiring.length > 0) && (
            <section className="panel">
              <div className="panel-h">
                <h3>À surveiller</h3>
              </div>
              {alerts > 0 && (
                <Link to="/stock?filtre=alertes" className="watch">
                  <span className="ico orange">
                    <IconAlertTriangle size={20} />
                  </span>
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
                <Link to="/stock?filtre=peremption" className="watch">
                  <span className="ico red">
                    <IconCalendarExclamation size={20} />
                  </span>
                  <div>
                    <b>
                      {expiring.length} lot{expiring.length > 1 ? "s" : ""} bientôt périmé{expiring.length > 1 ? "s" : ""}
                    </b>
                    <small>{expired ? `Dont ${expired} déjà périmé${expired > 1 ? "s" : ""}` : "Dans les 30 prochains jours"}</small>
                  </div>
                  <IconChevronRight size={18} />
                </Link>
              )}
            </section>
          )}

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
                    <span className="time n">{clock(s.createdAtMs)}</span>
                    <div className="who">
                      <b>{s.clientName || "Sans client"}</b>
                      <small>
                        {items} article{items > 1 ? "s" : ""}, {s.memberName.split(" ")[0]}
                      </small>
                    </div>
                    <div className="amt">
                      <b className="n">{formatMoney(s.total, s.currency)}</b>
                      <small className={`pay ${s.payment.method}`}>
                        {PAYMENT_LABELS[s.payment.method]}
                        {s.payment.currency !== s.currency ? ` en ${CURRENCIES[s.payment.currency].symbol}` : ""}
                      </small>
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
                  <span className="n v">{amount(p.revenue, c)}</span>
                </div>
              ))
            ) : (
              <Text c="dimmed" size="sm" py="md">
                {loading ? "Chargement…" : "Les articles les plus vendus du jour apparaîtront ici."}
              </Text>
            )}
          </section>
        </div>
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
    </>
  );
}

/** « Samedi 31 octobre ». */
function longDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const s = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(y, m - 1, d));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** « 17:28 ». */
function clock(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Montant court des graphiques : sans « FC » pour les francs, avec le symbole pour les autres devises. */
function shortMoney(n: number, currency: Currency): string {
  return currency === "CDF" ? compactAmount(n) : `${compactAmount(n)} ${CURRENCIES[currency].symbol}`;
}

/** « 6 % de moins qu'hier à la même heure ». */
function versus(now: number, before: number): string {
  const d = changePercent(now, before);
  if (d == null) return now ? "Pas de vente hier à cette heure-ci" : "Pas encore de vente aujourd'hui";
  if (d === 0) return "Comme hier à la même heure";
  return `${Math.abs(d)} % de ${d > 0 ? "plus" : "moins"} qu'hier à la même heure`;
}

/** Petit écart sous un chiffre du ticket : « 5 de plus », « 21 % de moins ». */
function delta(now: number, before: number, count?: boolean): { note?: string; down?: boolean } {
  const d = count ? (now || before ? now - before : undefined) : changePercent(now, before);
  if (d == null) return {};
  const unit = count ? "" : " %";
  return { note: d === 0 ? "comme hier" : `${Math.abs(d)}${unit} de ${d > 0 ? "plus" : "moins"}`, down: d < 0 };
}

/** Ventes du jour heure par heure : l'heure en cours en bleu, les heures à venir hachurées. */
function HourBars({ hours, nowHour, currency }: { hours: HourStat[]; nowHour: number; currency: Currency }) {
  const max = Math.max(1, ...hours.map((h) => h.revenue));
  const peak = hours.reduce((a, b) => (b.revenue > a.revenue ? b : a), hours[0]);
  return (
    <>
      <div className="hours" role="img" aria-label="Ventes du jour par heure">
        {hours.map((h) => (
          <div
            key={h.hour}
            className={h.hour === nowHour ? "now" : h.hour > nowHour ? "later" : undefined}
            style={h.hour > nowHour ? undefined : { height: `${Math.max(3, (h.revenue / max) * 100)}%` }}
            title={`${h.hour} h : ${h.count} vente${h.count > 1 ? "s" : ""}, ${formatMoney(h.revenue, currency)}`}
          />
        ))}
      </div>
      <div className="hours-axis" style={{ gridTemplateColumns: `repeat(${hours.length}, 1fr)` }}>
        {hours.map((h, i) => (
          <span key={h.hour}>{i % 2 === 0 ? `${h.hour}h` : ""}</span>
        ))}
      </div>
      <p className="hours-peak">
        {peak.count ? (
          <>
            Le plus de ventes vers <b>{peak.hour} h</b> : {peak.count} vente{peak.count > 1 ? "s" : ""}, {formatMoney(peak.revenue, currency).replace(/ /g, "\u00a0")}.
          </>
        ) : (
          "Les ventes du jour apparaîtront ici, heure par heure."
        )}
      </p>
    </>
  );
}

const SHORT_DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

/** Barres des ventes par jour : aujourd'hui en bleu, les autres jours en bleu clair. */
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
