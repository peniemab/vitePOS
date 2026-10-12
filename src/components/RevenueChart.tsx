/**
 * Chiffre d'affaires par jour : une colonne par jour, une seule série (pas de légende, le titre la nomme),
 * info-bulle au survol ou au toucher, et une vue tableau pour qui préfère les chiffres.
 */
import { useState } from "react";
import { Button, Table, Text } from "@mantine/core";
import { formatMoney, type Currency } from "../lib/fx";

interface Point {
  day: string;
  revenue: number;
  count: number;
}

/** Plafond « rond » pour l'axe : 1, 2 ou 5 × 10^n au-dessus du maximum. */
function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (n >= 1000) return `${(n / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k`;
  return n.toLocaleString("fr-FR");
}

const W = 640;
const H = 200;
const left = 44;
const bottom = 24;
const top = 8;

export function RevenueChart({ data, currency }: { data: Point[]; currency: Currency }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const plotW = W - left - 8;
  const plotH = H - top - bottom;
  const slot = plotW / data.length;
  const barW = Math.min(24, Math.max(2, slot - 2));
  const y = (v: number) => top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  const labelEvery = data.length > 10 ? Math.ceil(data.length / 8) : 1;
  const dayLabel = (d: string) => String(Number(d.slice(8)));
  const fmt = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  const date = (d: string) => fmt.format(new Date(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8))));
  const h = hover != null ? data[hover] : undefined;

  return (
    <div>
      {asTable ? (
        <Table fz="sm" striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Jour</Table.Th>
              <Table.Th ta="right">Ventes</Table.Th>
              <Table.Th ta="right">Chiffre d'affaires</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((d) => (
              <Table.Tr key={d.day}>
                <Table.Td>{date(d.day)}</Table.Td>
                <Table.Td ta="right">{d.count}</Table.Td>
                <Table.Td ta="right" className="n">
                  {formatMoney(d.revenue, currency)}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <div style={{ position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Chiffre d'affaires par jour" onMouseLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={left} x2={W - 8} y1={y(t)} y2={y(t)} stroke="var(--app-grid)" strokeWidth="1" />
                <text x={left - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--mantine-color-dimmed)">
                  {compact(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const cx = left + slot * i + slot / 2;
              const yy = y(d.revenue);
              const hgt = top + plotH - yy;
              const r = Math.min(4, barW / 2, hgt);
              const x0 = cx - barW / 2;
              const base = top + plotH;
              // Coins arrondis en haut seulement, base carrée sur la ligne zéro.
              const path =
                hgt > 0
                  ? `M${x0} ${base}V${yy + r}Q${x0} ${yy} ${x0 + r} ${yy}H${x0 + barW - r}Q${x0 + barW} ${yy} ${x0 + barW} ${yy + r}V${base}Z`
                  : "";
              return (
                <g key={d.day}>
                  {path && <path d={path} fill="var(--app-series-1)" opacity={hover == null || hover === i ? 1 : 0.45} />}
                  {i % labelEvery === 0 && (
                    <text x={cx} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--mantine-color-dimmed)">
                      {data.length <= 7 ? date(d.day).split(" ")[0] : dayLabel(d.day)}
                    </text>
                  )}
                  {/* Zone de survol plus large que la colonne. */}
                  <rect
                    x={left + slot * i}
                    y={top}
                    width={slot}
                    height={plotH}
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
              style={{ left: `${((left + slot * hover + slot / 2) / W) * 100}%`, top: `${(y(h.revenue) / H) * 100}%` }}
            >
              <div>{date(h.day).replace(/^./, (c) => c.toUpperCase())}</div>
              <b className="n">{formatMoney(h.revenue, currency)}</b> · {h.count} vente{h.count > 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
      <Button variant="subtle" size="xs" mt={4} onClick={() => setAsTable((v) => !v)}>
        {asTable ? "Voir le graphique" : "Voir en tableau"}
      </Button>
      {!asTable && data.every((d) => d.revenue === 0) && (
        <Text size="sm" c="dimmed">
          Aucune vente sur la période.
        </Text>
      )}
    </div>
  );
}
