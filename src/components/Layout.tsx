/** Barre du haut (onglets sur ordinateur), barre du bas sur téléphone, zone principale. */
import { Suspense } from "react";
import { NavLink, Outlet } from "react-router";
import { useMediaQuery } from "@mantine/hooks";
import { AppShell, Avatar, Group, Menu, Text, UnstyledButton } from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconCash,
  IconDots,
  IconHome,
  IconLogout,
  IconPackage,
  IconReceipt,
} from "@tabler/icons-react";
import { logout, useReady } from "../data/session";
import { getSyncState, useSyncState } from "../data/sync";
import { ROLE_LABELS } from "../lib/roles";
import { needsAttention } from "../lib/subscription";
import { SubscriptionBanner } from "./SubscriptionBanner";

export const TABS = [
  { to: "/", label: "Accueil", icon: IconHome, end: true },
  { to: "/caisse", label: "Caisse", icon: IconCash },
  { to: "/stock", label: "Stock", icon: IconPackage },
  { to: "/ventes", label: "Ventes", icon: IconReceipt },
  { to: "/plus", label: "Plus", icon: IconDots },
];

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
  const { boutique, member, subscription } = useReady();
  const wide = useMediaQuery("(min-width: 62em)", true);
  const { online, pending } = useSyncState();

  return (
    <AppShell header={{ height: 56 }} footer={{ height: 62, collapsed: wide }} padding={0}>
      <AppShell.Header className="app-header">
        <Group h="100%" px={{ base: "sm", sm: "lg" }} gap="md" wrap="nowrap" maw={1180} mx="auto">
          <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
            <img src="/favicon.svg" alt="" width={30} height={30} style={{ flexShrink: 0, borderRadius: 6 }} />
            <div className="brand">{boutique.name || "vitePOS"}</div>
          </Group>
          <Group gap={2} visibleFrom="md" wrap="nowrap" style={{ flex: 1, overflowX: "auto" }}>
            {TABS.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className="top-tab">
                <t.icon size={18} stroke={1.8} aria-hidden="true" />
                {t.label}
              </NavLink>
            ))}
          </Group>
          <Group gap="sm" wrap="nowrap" ml="auto">
            <Menu position="bottom-end" withinPortal width={260}>
              <Menu.Target>
                <UnstyledButton aria-label={`Mon compte (${connectionLabel(online, pending)})`} style={{ lineHeight: 0 }}>
                  <Avatar color="brick" variant="filled" radius="xl">
                    {initials(member.name, member.email)}
                  </Avatar>
                </UnstyledButton>
              </Menu.Target>
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
                <Menu.Item leftSection={<IconLogout size={16} />} color="red" onClick={confirmLogout}>
                  Se déconnecter
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 16px 40px" }}>
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
