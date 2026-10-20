/** Menu « Plus » : toutes les sections qui ne tiennent pas dans la barre du bas. */
import { Link } from "react-router";
import { Paper, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import {
  IconCalendarCheck,
  IconChartBar,
  IconChevronRight,
  IconCreditCard,
  IconClipboardCheck,
  IconSettings,
  IconUsers,
  IconUsersGroup,
  IconWallet,
} from "@tabler/icons-react";
import { useReady } from "../data/session";
import { PageTitle } from "../components/ui";
import { InstallCard } from "../components/InstallCard";
import { canManageTeam } from "../lib/roles";

export function PlusScreen() {
  const { member, permissions } = useReady();
  const items = [
    { to: "/journee", label: "Journée de caisse", icon: IconCalendarCheck, show: permissions.closeCash || permissions.viewReports },
    { to: "/clients", label: "Clients", icon: IconUsers, show: true },
    { to: "/depenses", label: "Dépenses", icon: IconWallet, show: true },
    { to: "/inventaire", label: "Inventaire", icon: IconClipboardCheck, show: permissions.manageStock },
    { to: "/rapports", label: "Rapports", icon: IconChartBar, show: permissions.viewReports },
    { to: "/equipe", label: "Équipe", icon: IconUsersGroup, show: canManageTeam(member.role) },
    { to: "/abonnement", label: "Mon abonnement", icon: IconCreditCard, show: member.role === "proprietaire" },
    { to: "/parametres", label: "Paramètres", icon: IconSettings, show: true },
  ].filter((i) => i.show);

  return (
    <>
      <PageTitle title="Plus" />
      <Paper p={0} style={{ overflow: "hidden" }}>
        {items.map((i) => (
          <UnstyledButton key={i.to} component={Link} to={i.to} className="list-row" px="md">
            <ThemeIcon variant="light" size="lg">
              <i.icon size={20} />
            </ThemeIcon>
            <Text style={{ flex: 1 }}>{i.label}</Text>
            <IconChevronRight size={18} opacity={0.5} />
          </UnstyledButton>
        ))}
      </Paper>
      <InstallCard mt="md" />
    </>
  );
}

