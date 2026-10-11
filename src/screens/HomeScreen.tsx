/** Accueil : bonjour, taux du jour et raccourcis. Le tableau de bord des ventes arrive avec l'étape 2. */
import { Link } from "react-router";
import { Button, Paper, SimpleGrid, Text } from "@mantine/core";
import { IconCash, IconPackage } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { PageTitle } from "../components/ui";
import { formatMoney } from "../lib/fx";
import { ROLE_LABELS } from "../lib/roles";

export function HomeScreen() {
  const { member, boutique } = useReady();
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
