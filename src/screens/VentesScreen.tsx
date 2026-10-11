/** Historique des ventes, jour par jour : totaux du jour et liste des tickets. */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Group, Paper, SimpleGrid, Text, UnstyledButton } from "@mantine/core";
import { IconCloudUpload } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { watchSalesOfDay } from "../data/sales";
import { errorMessage } from "../data/errors";
import { DayNav } from "../components/DayNav";
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
        <SimpleGrid cols={{ base: 2, sm: 4 }} mb="md">
          <Stat label="Chiffre d'affaires" value={formatMoney(summary.revenue, c)} strong />
          <Stat label="Ventes" value={String(summary.salesCount)} />
          <Stat label="Espèces" value={formatMoney2(summary.cash)} />
          <Stat label="Mobile money" value={formatMoney2(summary.mobileMoney)} />
        </SimpleGrid>
      )}

      {!visible && !error && <div className="loading">Chargement…</div>}
      {visible && (
        <Paper p={0} style={{ overflow: "hidden" }}>
          {visible.map((s) => (
            <UnstyledButton key={s.id} className="list-row" px="md" onClick={() => navigate(`/ticket/${s.id}`)} style={{ opacity: s.status === "annulee" ? 0.55 : 1 }}>
              <div style={{ width: 52, flexShrink: 0 }}>
                <Text className="n" fw={600}>
                  {s.createdAtMs ? time.format(s.createdAtMs) : "—"}
                </Text>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6} wrap="nowrap">
                  <Text fw={600} truncate>
                    {ticketNumber(s.id)}
                  </Text>
                  {s.status === "annulee" && (
                    <Badge size="xs" color="red" variant="light">
                      Annulée
                    </Badge>
                  )}
                  {!s.synced && <IconCloudUpload size={14} color="var(--mantine-color-orange-6)" aria-label="En attente d'envoi" />}
                </Group>
                <Text size="xs" c="dimmed" truncate>
                  {s.memberName}
                  {s.clientName ? ` · ${s.clientName}` : ""} · {PAYMENT_LABELS[s.payment.method]}
                  {s.payment.method === "especes" && s.payment.currency !== c ? " $" : ""}
                </Text>
              </div>
              <Text fw={700} td={s.status === "annulee" ? "line-through" : undefined}>
                <Money value={s.total} currency={c} />
              </Text>
            </UnstyledButton>
          ))}
          {!visible.length && (
            <Text c="dimmed" ta="center" p="xl">
              Aucune vente ce jour-là.
            </Text>
          )}
        </Paper>
      )}
    </>
  );
}

export function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Paper p="sm">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={700} fz={strong ? 22 : 17} className="n" style={{ whiteSpace: "normal" }}>
        {value}
      </Text>
    </Paper>
  );
}
