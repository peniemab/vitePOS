/** Toutes les rubriques de l'app, pour le menu de gauche (ordinateur) et le menu « Plus » (téléphone), filtrées selon les droits du membre. */
import {
  IconCalendarCheck,
  IconCash,
  IconChartBar,
  IconClipboardCheck,
  IconCreditCard,
  IconHome,
  IconPackage,
  IconReceipt,
  IconSettings,
  IconUsers,
  IconUsersGroup,
  IconWallet,
  type Icon,
} from "@tabler/icons-react";
import { useReady } from "../data/session";
import { canManageTeam } from "../lib/roles";

export interface Section {
  to: string;
  label: string;
  icon: Icon;
  end?: boolean;
}

export interface SectionGroup {
  title: string;
  items: Section[];
}

/** Rubriques visibles pour ce membre, rangées par groupe. */
export function useSections(): SectionGroup[] {
  const { member, permissions } = useReady();
  const groups: { title: string; items: (Section & { show?: boolean })[] }[] = [
    { title: "", items: [{ to: "/", label: "Accueil", icon: IconHome, end: true }] },
    {
      title: "Vendre",
      items: [
        { to: "/caisse", label: "Caisse", icon: IconCash },
        { to: "/ventes", label: "Ventes", icon: IconReceipt },
        { to: "/clients", label: "Clients", icon: IconUsers },
      ],
    },
    {
      title: "Stock",
      items: [
        { to: "/stock", label: "Articles", icon: IconPackage },
        { to: "/inventaire", label: "Inventaire", icon: IconClipboardCheck, show: permissions.manageStock },
      ],
    },
    {
      title: "Argent",
      items: [
        { to: "/depenses", label: "Dépenses", icon: IconWallet },
        { to: "/journee", label: "Journée de caisse", icon: IconCalendarCheck, show: permissions.closeCash || permissions.viewReports },
        { to: "/rapports", label: "Rapports", icon: IconChartBar, show: permissions.viewReports },
      ],
    },
    {
      title: "Boutique",
      items: [
        { to: "/equipe", label: "Équipe", icon: IconUsersGroup, show: canManageTeam(member.role) },
        { to: "/abonnement", label: "Mon abonnement", icon: IconCreditCard, show: member.role === "proprietaire" },
        { to: "/parametres", label: "Paramètres", icon: IconSettings },
      ],
    },
  ];
  return groups
    .map((g) => ({ title: g.title, items: g.items.filter((i) => i.show !== false).map(({ show: _show, ...i }) => i) }))
    .filter((g) => g.items.length > 0);
}
