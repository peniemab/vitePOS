/**
 * Chiffre d'affaires par jour : une courbe avec une zone colorée dessous, une seule série (pas de légende,
 * le titre la nomme), le meilleur jour étiqueté, info-bulle au survol ou au toucher, et une vue tableau.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { Button, Table, Text } from "@mantine/core";
import { formatMoney, type Currency } from "../lib/fx";
import { dayKey } from "../lib/cart";

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

const left = 44;
const bottom = 24;
const top = 8;

export function RevenueChart({ data, currency }: { data: Point[]; currency: Currency }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  // Dessiné à la largeur réelle : les textes gardent leur taille, sur téléphone comme sur ordinateur.
  // Mesure directe (sans attendre une image d'animation, qui n'arrive pas dans un onglet en arrière-plan).
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
  const W = Math.max(260, Math.round(width) || 640);
  const H = W < 500 ? 190 : 220;
  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const plotW = W - left - 8;
  const plotH = H - top - bottom;
  const slot = plotW / data.length;
  const y = (v: number) => top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  // Pas plus d'une étiquette de jour tous les 40 px, pour qu'elles ne se chevauchent pas.
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotW / 40))));
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
        <div ref={ref} style={{ position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Chiffre d'affaires par jour" onMouseLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={left} x2={W - 8} y1={y(t)} y2={y(t)} stroke="var(--app-grid)" strokeWidth="1" />
                <text x={left - 6} y={y(t) + 4} textAnchor="end" fontSize="12" fill="var(--mantine-color-dimmed)">
                  {compact(t)}
                </text>
              </g>
            ))}
            {(() => {
              const base = top + plotH;
              // Les jours à venir restent sur l'axe mais sans point : la courbe s'arrête à aujourd'hui.
              const today = dayKey(Date.now());
              const shown = Math.max(1, data.filter((d) => d.day <= today).length);
              const all = data.map((d, i) => ({ x: left + slot * i + slot / 2, y: y(d.revenue) }));
              const pts = all.slice(0, shown);
              const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join("");
              const area = `${line}L${pts[pts.length - 1].x} ${base}L${pts[0].x} ${base}Z`;
              const peak = data.slice(0, shown).reduce((best, d, i) => (d.revenue > data[best].revenue ? i : best), 0);
              const showDots = data.length <= 14;
              return (
                <>
                  <path d={area} fill="var(--app-series-1)" fillOpacity="0.12" />
                  <path d={line} fill="none" stroke="var(--app-series-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  {hover != null && hover < shown && (
                    <line x1={pts[hover].x} x2={pts[hover].x} y1={top} y2={base} stroke="var(--app-grid)" strokeWidth="1" />
                  )}
                  {pts.map((p, i) =>
                    showDots || i === hover || i === peak ? (
                      <circle
                        key={data[i].day}
                        cx={p.x}
                        cy={p.y}
                        r={i === hover ? 5.5 : 4}
                        fill="var(--app-series-1)"
                        stroke="var(--mantine-color-body)"
                        strokeWidth="2"
                      />
                    ) : null,
                  )}
                  {data[peak].revenue > 0 && hover !== peak && (
                    <text x={pts[peak].x} y={pts[peak].y - 12} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--mantine-color-text)">
                      {compact(data[peak].revenue)}
                    </text>
                  )}
                  {data.map((d, i) => (
                    <g key={d.day}>
                      {i % labelEvery === 0 && (
                        <text x={all[i].x} y={H - 6} textAnchor="middle" fontSize="12" fill="var(--mantine-color-dimmed)">
                          {data.length <= 7 ? date(d.day).split(" ")[0] : dayLabel(d.day)}
                        </text>
                      )}
                      {/* Zone de survol : toute la largeur du jour, pas seulement le point. */}
                      <rect
                        x={left + slot * i}
                        y={top}
                        width={slot}
                        height={plotH}
                        fill="transparent"
                        onMouseEnter={() => setHover(i < shown ? i : null)}
                        onClick={() => setHover(i < shown ? i : null)}
                      />
                    </g>
                  ))}
                </>
              );
            })()}
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
