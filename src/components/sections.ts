/** Toutes les rubriques de l'app, pour le menu de gauche (ordinateur) et le menu « Plus » (téléphone), filtrées selon les droits du membre. */
import {
  IconCalendarCheck,
  IconCashRegister,
  IconChartBar,
  IconClipboardCheck,
  IconCreditCard,
  IconLayoutDashboard,
  IconPackage,
  IconReceipt,
  IconSettings,
  IconShieldCheck,
  IconUsers,
  IconUsersGroup,
  IconWallet,
  type Icon,
} from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useIsAdmin } from "../data/admin";
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
  const isAdmin = useIsAdmin();
  const groups: { title: string; items: (Section & { show?: boolean })[] }[] = [
    { title: "", items: [{ to: "/", label: "Accueil", icon: IconLayoutDashboard, end: true }] },
    {
      title: "Vendre",
      items: [
        { to: "/caisse", label: "Caisse", icon: IconCashRegister },
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
      title: "Mon activité",
      items: [
        { to: "/equipe", label: "Équipe", icon: IconUsersGroup, show: canManageTeam(member.role) },
        { to: "/abonnement", label: "Mon abonnement", icon: IconCreditCard, show: member.role === "proprietaire" },
        { to: "/parametres", label: "Paramètres", icon: IconSettings },
      ],
    },
    // Équipe vitePOS seulement.
    { title: "vitePOS", items: [{ to: "/admin", label: "Administration", icon: IconShieldCheck, show: isAdmin === true }] },
  ];
  return groups
    .map((g) => ({ title: g.title, items: g.items.filter((i) => i.show !== false).map(({ show: _show, ...i }) => i) }))
    .filter((g) => g.items.length > 0);
}
