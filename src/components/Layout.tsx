/** Menu de gauche sur ordinateur (réduit aux icônes sur la caisse) ; barre du haut et barre du bas sur téléphone. */
import { Suspense, type ReactElement } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { useMediaQuery } from "@mantine/hooks";
import {
  AppShell,
  Avatar,
  Group,
  Menu,
  Text,
  Tooltip,
  UnstyledButton,
  useComputedColorScheme,
  useMantineColorScheme,
  type MenuProps,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconCashRegister,
  IconDots,
  IconHome,
  IconLogout,
  IconMoon,
  IconPackage,
  IconSettings,
  IconReceipt,
  IconSun,
} from "@tabler/icons-react";
import { logout, useReady } from "../data/session";
import { getSyncState, useSyncState } from "../data/sync";
import { ROLE_LABELS } from "../lib/roles";
import { needsAttention } from "../lib/subscription";
import { needsRestock } from "../lib/products";
import { useCatalog } from "../data/products";
import { SubscriptionBanner } from "./SubscriptionBanner";
import { useSections } from "./sections";

/** Barre du bas (téléphone). */
export const TABS = [
  { to: "/", label: "Accueil", icon: IconHome, end: true },
  { to: "/caisse", label: "Caisse", icon: IconCashRegister },
  { to: "/stock", label: "Stock", icon: IconPackage },
  { to: "/ventes", label: "Ventes", icon: IconReceipt },
  { to: "/plus", label: "Plus", icon: IconDots },
];

/** Version courte pour la pastille de la barre du haut (téléphone). */
export function connectionShort(online: boolean, pending: number): string {
  if (!online) return "Hors ligne : ventes gardées";
  return pending > 0 ? `Envoi en cours (${pending})` : "En ligne";
}

/** Titre de la barre du haut sur téléphone : la rubrique ouverte, ou le nom de la boutique sur l'accueil. */
function usePageTitle(): string {
  const { boutique } = useReady();
  const path = useLocation().pathname;
  const groups = useSections();
  if (path === "/") return boutique.name || "vitePOS";
  if (path.startsWith("/ticket")) return "Ticket";
  if (path === "/plus") return "Plus";
  const item = groups.flatMap((g) => g.items).find((i) => i.to !== "/" && path.startsWith(i.to));
  return item?.label ?? (boutique.name || "vitePOS");
}

export function connectionLabel(online: boolean, pending: number): string {
  if (!online) return pending > 0 ? `Hors ligne · ${pending} en attente` : "Hors ligne";
  return pending > 0 ? `Envoi en cours (${pending})` : "En ligne, tout est envoyé";
}

export function initials(name: string, email: string): string {
  const words = (name || email).split(/[\s@._-]+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function confirmLogout() {
  if (getSyncState().pending === 0) return void logout();
  modals.openConfirmModal({
    title: "Saisies pas encore envoyées",
    children: (
      <Text size="sm">
        Certaines saisies n'ont pas encore été envoyées. Restez connecté jusqu'au retour du réseau pour ne pas les
        perdre. Se déconnecter quand même ?
      </Text>
    ),
    labels: { confirm: "Se déconnecter", cancel: "Rester connecté" },
    confirmProps: { color: "red" },
    onConfirm: () => void logout(),
  });
}

export function Layout() {
  const { subscription } = useReady();
  const wide = useMediaQuery("(min-width: 62em)", true);
  const title = usePageTitle();
  const { online, pending } = useSyncState();
  // Sur la caisse, le menu se réduit aux icônes pour laisser la place aux articles et au panier.
  const mini = useLocation().pathname.startsWith("/caisse");

  return (
    <AppShell
      header={{ height: 56, collapsed: wide }}
      navbar={{ width: mini ? 76 : 244, breakpoint: "md", collapsed: { mobile: true } }}
      footer={{ height: 62, collapsed: wide }}
      padding={0}
    >
      <AppShell.Header className="app-header">
        <Group h="100%" px="sm" gap="md" wrap="nowrap">
          <Group gap={10} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
            <img src="/favicon.svg" alt="" width={32} height={32} style={{ flexShrink: 0, borderRadius: 8 }} />
            <div className="brand">{title}</div>
          </Group>
          {/* L'état de l'envoi ouvre aussi le menu du compte. */}
          <AccountMenu position="bottom-end">
            <UnstyledButton className="status-chip" aria-label={`Mon compte (${connectionLabel(online, pending)})`}>
              <span className={`dot ${!online ? "off" : pending > 0 ? "sync" : "on"}`} />
              {connectionShort(online, pending)}
            </UnstyledButton>
          </AccountMenu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="side-nav" data-mini={mini || undefined} withBorder={false}>
        <SideNav mini={mini} />
      </AppShell.Navbar>

      <AppShell.Main>
        <div className="app-main">
          {needsAttention(subscription) && <SubscriptionBanner />}
          <Suspense fallback={<div className="loading">Chargement…</div>}>
            <Outlet />
          </Suspense>
        </div>
      </AppShell.Main>

      <AppShell.Footer>
        <nav className="bottom-nav" aria-label="Sections">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end}>
              <t.icon size={22} stroke={1.8} />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </AppShell.Footer>
    </AppShell>
  );
}

/** Menu de gauche (ordinateur) : rubriques par groupe, état de l'envoi et compte en bas. */
function SideNav({ mini }: { mini: boolean }) {
  const { boutique, member } = useReady();
  const { online, pending } = useSyncState();
  const { products } = useCatalog();
  const alerts = products?.filter(needsRestock).length ?? 0;
  const groups = useSections();
  const sync = connectionLabel(online, pending);
  const dot = `dot ${!online ? "off" : pending > 0 ? "sync" : "on"}`;

  return (
    <>
      <div className="side-brand">
        <img src="/favicon.svg" alt="" width={36} height={36} />
        {!mini && (
          <div style={{ minWidth: 0 }}>
            <b>{boutique.name || "vitePOS"}</b>
            <small>{ROLE_LABELS[member.role]}</small>
          </div>
        )}
      </div>
      <nav className="side-items" aria-label="Sections">
        {groups.map((g) => (
          <div key={g.title || "accueil"}>
            {g.title && !mini && <div className="side-group">{g.title}</div>}
            {g.items.map((i) => {
              const badge = i.to === "/stock" ? alerts : 0;
              const link = (
                <NavLink to={i.to} end={i.end} className="side-item" aria-label={mini ? i.label : undefined}>
                  <i.icon size={20} stroke={1.8} aria-hidden="true" />
                  {!mini && <span>{i.label}</span>}
                  {badge > 0 && (
                    <span className="side-badge" title={`${badge} article${badge > 1 ? "s" : ""} à racheter`}>
                      {badge}
                    </span>
                  )}
                </NavLink>
              );
              return mini ? (
                <Tooltip key={i.to} label={i.label} position="right" withArrow>
                  {link}
                </Tooltip>
              ) : (
                <div key={i.to}>{link}</div>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="side-foot">
        {mini ? (
          <Tooltip label={sync} position="right" withArrow>
            <span className={dot} aria-label={sync} />
          </Tooltip>
        ) : (
          <div className="side-sync">
            <span className={dot} />
            {sync}
          </div>
        )}
        <AccountMenu position="right-end">
          <UnstyledButton className="side-me" aria-label={`Mon compte (${sync})`}>
            <AccountAvatar />
            {!mini && (
              <div style={{ minWidth: 0 }}>
                <b>{member.name || member.email}</b>
                <small>Paramètres</small>
              </div>
            )}
          </UnstyledButton>
        </AccountMenu>
      </div>
    </>
  );
}

function AccountAvatar() {
  const { member } = useReady();
  return (
    <Avatar color="brick" variant="filled" radius="xl">
      {initials(member.name, member.email)}
    </Avatar>
  );
}

/** Menu du compte : nom, rôle, état de l'envoi, mode sombre, déconnexion. */
function AccountMenu({ position, children }: { position: MenuProps["position"]; children: ReactElement }) {
  const { member } = useReady();
  const { online, pending } = useSyncState();
  return (
    <Menu position={position} withinPortal width={260}>
      <Menu.Target>{children}</Menu.Target>
      <Menu.Dropdown>
        <div style={{ padding: "8px 12px" }}>
          <Text fw={700} truncate>
            {member.name || member.email}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {member.email}
          </Text>
          <Text size="xs" c="dimmed">
            {ROLE_LABELS[member.role]}
          </Text>
        </div>
        <Menu.Label>
          <Group gap={6}>
            <span className={`dot ${!online ? "off" : pending > 0 ? "sync" : "on"}`} />
            {connectionLabel(online, pending)}
          </Group>
        </Menu.Label>
        <Menu.Divider />
        <Menu.Item component={NavLink} to="/parametres" leftSection={<IconSettings size={16} />}>
          Paramètres
        </Menu.Item>
        <DarkModeItem />
        <Menu.Item leftSection={<IconLogout size={16} />} color="red" onClick={confirmLogout}>
          Se déconnecter
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

/** Raccourci du menu du compte : passe en clair ou en sombre (le choix « Automatique » est dans les Paramètres). */
function DarkModeItem() {
  const { setColorScheme } = useMantineColorScheme();
  const dark = useComputedColorScheme("light") === "dark";
  return (
    <Menu.Item leftSection={dark ? <IconSun size={16} /> : <IconMoon size={16} />} onClick={() => setColorScheme(dark ? "light" : "dark")}>
      {dark ? "Mode clair" : "Mode sombre"}
    </Menu.Item>
  );
}
