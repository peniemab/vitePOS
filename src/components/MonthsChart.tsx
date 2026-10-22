/**
 * Ventes et dépenses des six derniers mois : deux barres par mois (bleu = ventes, orange = dépenses),
 * légende au-dessus, infobulle au survol ou au toucher, et une vue tableau. Montants convertis dans la
 * devise de la boutique au taux du jour.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { Button, Group, Table, Text } from "@mantine/core";
import { CURRENCIES, formatMoney, type Currency, type Rates } from "../lib/fx";
import { toMain, type MonthTotals } from "../lib/monthStats";

const top = 22;
const bottom = 26;
const left = 44;

function compact(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (a >= 1000) return `${(n / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k`;
  return n.toLocaleString("fr-FR");
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

/** Barre à haut arrondi (4 px), base droite posée sur l'axe. */
function bar(x: number, w: number, base: number, h: number) {
  if (h <= 0) return "";
  const r = Math.min(4, h, w / 2);
  return `M${x},${base} V${base - h + r} Q${x},${base - h} ${x + r},${base - h} H${x + w - r} Q${x + w},${base - h} ${x + w},${base - h + r} V${base} Z`;
}

export function MonthsChart({ months, currency, rates }: { months: MonthTotals[]; currency: Currency; rates: Rates }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [asTable]);

  const rows = months.map((m) => {
    const s = toMain(m.sales, currency, rates);
    const e = toMain(m.expenses, currency, rates);
    return { ...m, sold: s.total, spent: e.total, missing: [...new Set([...s.missing, ...e.missing])] };
  });
  const missing = [...new Set(rows.flatMap((r) => r.missing))];
  const empty = rows.every((r) => r.sold === 0 && r.spent === 0);

  const W = Math.max(260, Math.round(width) || 640);
  const H = W < 500 ? 200 : 230;
  const base = H - bottom;
  const plotH = base - top;
  const plotW = W - left - 4;
  const slot = plotW / rows.length;
  const bw = Math.min(28, (slot - 14) / 2);
  const max = niceMax(Math.max(...rows.map((r) => Math.max(r.sold, r.spent))));
  const y = (v: number) => (Math.max(0, v) / max) * plotH;
  const h = hover != null ? rows[hover] : undefined;

  return (
    <div>
      <Group gap="md" mb={6}>
        <Group gap={6}>
          <span className="legend-swatch" style={{ background: "var(--app-series-1)" }} />
          <Text size="sm" c="dimmed">
            Ventes
          </Text>
        </Group>
        <Group gap={6}>
          <span className="legend-swatch" style={{ background: "var(--app-series-2)" }} />
          <Text size="sm" c="dimmed">
            Dépenses
          </Text>
        </Group>
      </Group>

      {asTable ? (
        <Table fz="sm" striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Mois</Table.Th>
              <Table.Th ta="right">Ventes</Table.Th>
              <Table.Th ta="right">Dépenses</Table.Th>
              <Table.Th ta="right">Différence</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((r) => (
              <Table.Tr key={r.key}>
                <Table.Td>
                  {r.label} {r.key.slice(0, 4)}
                </Table.Td>
                <Table.Td ta="right" className="n">
                  {formatMoney(r.sold, currency)}
                </Table.Td>
                <Table.Td ta="right" className="n">
                  {formatMoney(r.spent, currency)}
                </Table.Td>
                <Table.Td ta="right" className="n">
                  {formatMoney(r.sold - r.spent, currency)}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <div ref={ref} style={{ position: "relative" }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            role="img"
            aria-label="Ventes et dépenses des six derniers mois"
            onMouseLeave={() => setHover(null)}
          >
            {[0, max / 2, max].map((t) => (
              <g key={t}>
                <line x1={left} x2={W - 4} y1={base - y(t)} y2={base - y(t)} stroke="var(--app-grid)" strokeWidth="1" />
                <text x={left - 6} y={base - y(t) + 4} textAnchor="end" fontSize="12" fill="var(--mantine-color-dimmed)">
                  {compact(t)}
                </text>
              </g>
            ))}
            {rows.map((r, i) => {
              const cx = left + slot * i + slot / 2;
              return (
                <g key={r.key}>
                  {hover === i && <rect x={left + slot * i + 2} y={top - 8} width={slot - 4} height={plotH + 8} rx="6" fill="var(--mantine-color-default-hover)" />}
                  {/* 2 px d'écart entre les deux barres d'un même mois. */}
                  <path d={bar(cx - bw - 1, bw, base, y(r.sold))} fill="var(--app-series-1)" />
                  <path d={bar(cx + 1, bw, base, y(r.spent))} fill="var(--app-series-2)" />
                  <text x={cx} y={H - 6} textAnchor="middle" fontSize="12" fill="var(--mantine-color-dimmed)">
                    {r.label}
                  </text>
                  {/* Zone de survol : toute la colonne du mois, pas seulement les barres. */}
                  <rect
                    x={left + slot * i}
                    y={0}
                    width={slot}
                    height={H}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onClick={() => setHover(i)}
                  />
                </g>
              );
            })}
          </svg>
          {h && hover != null && (
            <div
              className="chart-tip"
              style={{
                left: `${((left + slot * hover + slot / 2) / W) * 100}%`,
                top: `${((base - y(Math.max(h.sold, h.spent))) / H) * 100}%`,
                // Premier et dernier mois : l'infobulle s'ouvre vers l'intérieur pour ne pas sortir de l'écran.
                transform: hover === 0 ? "translate(-20%, -100%)" : hover === rows.length - 1 ? "translate(-80%, -100%)" : undefined,
              }}
            >
              <div>
                {h.label.replace(/^./, (c) => c.toUpperCase())} {h.key.slice(0, 4)}
              </div>
              <div>
                Ventes : <b className="n">{formatMoney(h.sold, currency)}</b> ({h.saleCount})
              </div>
              <div>
                Dépenses : <b className="n">{formatMoney(h.spent, currency)}</b>
              </div>
            </div>
          )}
        </div>
      )}

      <Button variant="subtle" size="xs" mt={4} onClick={() => setAsTable((v) => !v)}>
        {asTable ? "Voir le graphique" : "Voir en tableau"}
      </Button>
      {empty && (
        <Text size="sm" c="dimmed">
          Pas encore de ventes ni de dépenses comptées sur ces six mois.
        </Text>
      )}
      {missing.length > 0 && (
        <Text size="xs" c="dimmed">
          Montants en {missing.map((c) => CURRENCIES[c].symbol).join(" et ")} non comptés : le taux du jour n'est pas fixé.
        </Text>
      )}
    </div>
  );
}
