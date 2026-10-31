/** Historique des ventes, jour par jour : totaux du jour et liste des tickets. */
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Badge, Text, UnstyledButton } from "@mantine/core";
import { IconCash, IconCloudUpload, IconDeviceMobile, IconReceipt, IconReceipt2, IconWallet } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { watchSalesOfDay } from "../data/sales";
import { errorMessage } from "../data/errors";
import { DayNav } from "../components/DayNav";
import { SerialLookup } from "../components/SerialLookup";
import { Money, PageTitle } from "../components/ui";
import { dayKey, ticketNumber } from "../lib/cart";
import { formatMoney2, summarizeDay } from "../lib/cashday";
import { formatMoney } from "../lib/fx";
import { PAYMENT_LABELS, type Sale } from "../lib/sales";

export function VentesScreen() {
  const { boutique, member, permissions } = useReady();
  const navigate = useNavigate();
  const [day, setDay] = useState(() => dayKey(Date.now()));
  const [sales, setSales] = useState<Sale[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    setSales(undefined);
    return watchSalesOfDay(boutique.id, day, setSales, (e) => setError(errorMessage(e)));
  }, [boutique.id, day]);

  // Un vendeur sans accès aux rapports ne voit que ses propres ventes.
  const visible = permissions.viewReports ? sales : sales?.filter((s) => s.uid === member.uid);
  const summary = visible ? summarizeDay(visible, [], boutique.currency) : undefined;
  const c = boutique.currency;
  const time = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" });

  return (
    <>
      <PageTitle title="Ventes" sub={permissions.viewReports ? undefined : "Vos ventes"} />
      <DayNav day={day} onChange={setDay} />
      {error && <Text c="red">{error}</Text>}

      {summary && (
        <div className="kpis">
          <Stat label="Chiffre d'affaires" value={formatMoney(summary.revenue, c)} strong icon={<IconWallet size={20} />} />
          <Stat label="Ventes" value={String(summary.salesCount)} icon={<IconReceipt2 size={20} />} tone="violet" />
          <Stat label="Espèces" value={formatMoney2(summary.cash)} icon={<IconCash size={20} />} tone="green" />
          <Stat label="Mobile money" value={formatMoney2(summary.mobileMoney)} icon={<IconDeviceMobile size={20} />} tone="orange" />
        </div>
      )}

      {!visible && !error && <div className="loading">Chargement…</div>}
      {visible && (
        <section className="panel">
          {visible.map((s) => {
            const cancelled = s.status === "annulee";
            const items = s.lines.length;
            return (
              <UnstyledButton key={s.id} className="sale-row" w="100%" onClick={() => navigate(`/ticket/${s.id}`)} style={{ opacity: cancelled ? 0.55 : 1 }}>
                <span className={`ico ${cancelled ? "red" : "blue"}`}>
                  <IconReceipt size={20} />
                </span>
                <div className="who">
                  <b>
                    <span className="n">{ticketNumber(s.id)}</span> · {s.clientName || s.memberName}
                    {cancelled && (
                      <Badge size="xs" color="red" variant="light" ml={6}>
                        Annulée
                      </Badge>
                    )}
                    {!s.synced && <IconCloudUpload size={14} color="var(--mantine-color-orange-6)" aria-label="En attente d'envoi" style={{ marginLeft: 6, verticalAlign: -2 }} />}
                  </b>
                  <small>
                    <span className="n">{s.createdAtMs ? time.format(s.createdAtMs) : "—"}</span> · {items} article{items > 1 ? "s" : ""}
                    {s.clientName ? ` · ${s.memberName}` : ""}
                  </small>
                </div>
                <div className="amt">
                  <b className="n" style={{ textDecoration: cancelled ? "line-through" : undefined }}>
                    <Money value={s.total} currency={c} />
                  </b>
                  <span className={`pay-tag ${s.payment.method}`}>
                    {PAYMENT_LABELS[s.payment.method]}
                    {s.payment.method === "especes" && s.payment.currency !== c ? " $" : ""}
                  </span>
                </div>
              </UnstyledButton>
            );
          })}
          {!visible.length && (
            <Text c="dimmed" ta="center" p="xl">
              Aucune vente ce jour-là.
            </Text>
          )}
        </section>
      )}
      <SerialLookup />
    </>
  );
}

/** Carte de chiffre, comme sur l'accueil : pastille d'icône, libellé, grand montant. */
export function Stat({
  label,
  value,
  strong,
  icon,
  tone = "blue",
  note,
}: {
  label: string;
  value: string;
  strong?: boolean;
  icon?: ReactNode;
  tone?: "blue" | "violet" | "green" | "orange" | "red";
  note?: string;
}) {
  return (
    <div className={strong ? "kpi hero" : "kpi"}>
      <div className="lbl">
        {icon && <span className={`ico ${strong ? "glass" : tone}`}>{icon}</span>}
        {label}
      </div>
      <div className="val n">{value}</div>
      {note && (
        <div className="trend">
          <span>{note}</span>
        </div>
      )}
    </div>
  );
}
