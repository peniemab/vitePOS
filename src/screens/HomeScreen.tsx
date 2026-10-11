/** Accueil : bonjour, taux du jour et raccourcis. Le tableau de bord des ventes arrive avec l'étape 2. */
import { Link } from "react-router";
import { Button, Group, Paper, SimpleGrid, Text } from "@mantine/core";
import { IconAlertTriangle, IconCash, IconChevronRight, IconPackage } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useCatalog } from "../data/products";
import { needsRestock } from "../lib/products";
import { PageTitle } from "../components/ui";
import { formatMoney } from "../lib/fx";
import { ROLE_LABELS } from "../lib/roles";

export function HomeScreen() {
  const { member, boutique } = useReady();
  const { products } = useCatalog();
  const alerts = products?.filter(needsRestock).length ?? 0;
  const firstName = member.name.split(" ")[0] || member.email;

  return (
    <>
      <PageTitle title={`Bonjour ${firstName}`} sub={`${boutique.name} · ${ROLE_LABELS[member.role]}`} />
      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="lg">
        <Button component={Link} to="/caisse" size="xl" leftSection={<IconCash size={24} />}>
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
      <Paper p="md">
        <Text size="sm" c="dimmed">
          Taux du jour
        </Text>
        <Text fz={28} fw={700} className="n">
          {boutique.usdRateCdf ? `1 $ = ${formatMoney(boutique.usdRateCdf, "CDF")}` : "Pas encore saisi"}
        </Text>
      </Paper>
    </>
  );
}
