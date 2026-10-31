/** Accueil : ventes du jour comparées à hier, alertes de stock, taux du jour et raccourcis. */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button, Group, Paper, SimpleGrid, Text } from "@mantine/core";
import { IconAlertTriangle, IconCalendarExclamation, IconCash, IconChevronRight, IconPackage } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useCatalog } from "../data/products";
import { watchSalesBetween } from "../data/sales";
import { needsRestock } from "../lib/products";
import { useLots } from "../data/lots";
import { expiringLots } from "../lib/lots";
import { PageTitle } from "../components/ui";
import { InstallCard } from "../components/InstallCard";
import { dayKey } from "../lib/cart";
import { shiftDay } from "../lib/cashday";
import { changePercent } from "../lib/reports";
import { formatMoney } from "../lib/fx";
import { ROLE_LABELS } from "../lib/roles";
import type { Sale } from "../lib/sales";

export function HomeScreen() {
  const { member, boutique, permissions } = useReady();
  const { products } = useCatalog();
  const alerts = products?.filter(needsRestock).length ?? 0;
  const lots = useLots(boutique.id);
  const expiring = expiringLots((products ?? []).filter((p) => !p.archived), lots ?? [], dayKey(Date.now()));
  const expired = expiring.filter((l) => l.daysLeft < 0).length;
  const firstName = member.name.split(" ")[0] || member.email;
  const today = dayKey(Date.now());
  const yesterday = shiftDay(today, -1);
  const [sales, setSales] = useState<Sale[]>();

  useEffect(() => watchSalesBetween(boutique.id, yesterday, today, setSales, () => setSales([])), [boutique.id, yesterday, today]);

  // Un vendeur sans accès aux rapports voit seulement ses propres ventes.
  const mine = permissions.viewReports ? sales : sales?.filter((s) => s.uid === member.uid);
  const totalOf = (day: string) => {
    const valid = (mine ?? []).filter((s) => s.dayKey === day && s.status === "validee");
    return { revenue: valid.reduce((n, s) => n + s.total, 0), count: valid.length };
  };
  const t = totalOf(today);
  const y = totalOf(yesterday);
  const delta = changePercent(t.revenue, y.revenue);

  return (
    <>
      <PageTitle title={`Bonjour ${firstName}`} sub={`${boutique.name} · ${ROLE_LABELS[member.role]}`} />
      <InstallCard dismissible mb="md" />

      <Paper component={Link} to="/ventes" p="md" mb="md" className="hero-card" style={{ display: "block", textDecoration: "none" }}>
        <Text size="sm" className="hero-sub">
          {permissions.viewReports ? "Ventes d'aujourd'hui" : "Vos ventes d'aujourd'hui"}
        </Text>
        <Text fz={40} fw={700} className="n" lh={1.15}>
          {mine ? formatMoney(t.revenue, boutique.currency) : "…"}
        </Text>
        <Text size="sm" className="hero-sub">
          {t.count} vente{t.count > 1 ? "s" : ""}
          {delta != null && ` · ${delta > 0 ? "+" : ""}${delta} % par rapport à hier`}
          {delta == null && y.revenue === 0 && mine ? " · aucune vente hier" : ""}
        </Text>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="md">
        <Button component={Link} to="/caisse" size="xl" className="night-btn" leftSection={<IconCash size={24} />}>
          Ouvrir la caisse
        </Button>
        <Button component={Link} to="/stock" size="xl" variant="default" leftSection={<IconPackage size={24} />}>
          Voir le stock
        </Button>
      </SimpleGrid>

      {alerts > 0 && (
        <Paper component={Link} to="/stock" p="md" mb="md" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
          <Group wrap="nowrap">
            <IconAlertTriangle size={24} color="var(--mantine-color-orange-6)" />
            <div style={{ flex: 1 }}>
              <Text fw={600}>
                {alerts} produit{alerts > 1 ? "s" : ""} à réapprovisionner
              </Text>
              <Text size="sm" c="dimmed">
                En rupture ou sous le seuil d'alerte
              </Text>
            </div>
            <IconChevronRight size={18} opacity={0.5} />
          </Group>
        </Paper>
      )}

      {expiring.length > 0 && (
        <Paper component={Link} to="/stock?filtre=peremption" p="md" mb="md" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
          <Group wrap="nowrap">
            <IconCalendarExclamation size={24} color={`var(--mantine-color-${expired ? "red" : "orange"}-6)`} />
            <div style={{ flex: 1 }}>
              <Text fw={600}>
                {expiring.length} lot{expiring.length > 1 ? "s" : ""} bientôt périmé{expiring.length > 1 ? "s" : ""}
              </Text>
              <Text size="sm" c="dimmed">
                {expired ? `Dont ${expired} déjà périmé${expired > 1 ? "s" : ""} · ` : ""}dans les 30 prochains jours
              </Text>
            </div>
            <IconChevronRight size={18} opacity={0.5} />
          </Group>
        </Paper>
      )}

      <Paper p="md">
        <Text size="sm" c="dimmed">
          Taux du jour
        </Text>
        <Text fz={28} fw={700} className="n">
          {[
            boutique.usdRateCdf ? `1 $ = ${formatMoney(boutique.usdRateCdf, "CDF")}` : "",
            boutique.eurRateCdf ? `1 € = ${formatMoney(boutique.eurRateCdf, "CDF")}` : "",
          ]
            .filter(Boolean)
            .join(" · ") || "Pas encore saisi"}
        </Text>
      </Paper>
    </>
  );
}
