/**
 * Aide de l'écran ouvert : bouton « i » (barre du haut sur téléphone, menu de gauche sur ordinateur)
 * et fenêtre qui explique l'écran pas à pas. La première fois qu'une personne arrive sur un écran,
 * l'aide s'ouvre toute seule (souvenir gardé sur cet appareil ; on peut couper l'ouverture automatique).
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { useMediaQuery } from "@mantine/hooks";
import { ActionIcon, Anchor, Button, Drawer, Group, Stack, Text, ThemeIcon, Tooltip, UnstyledButton } from "@mantine/core";
import { IconBrandWhatsapp, IconCheck, IconInfo, IconLightbulb } from "./icons";
import { HELP_URL } from "./Help";
import { helpFor, parseSeen, type Help } from "../lib/help";

const SEEN_KEY = "vitepos.aide.vue";
export const HELP_AUTO_OFF_KEY = "vitepos.aide.auto-off";

export interface ScreenHelp {
  help: Help | null;
  opened: boolean;
  open: () => void;
  close: () => void;
}

/** Aide de l'écran ouvert, ouverte toute seule la première fois sur cet appareil. */
export function useScreenHelp(): ScreenHelp {
  const help = helpFor(useLocation().pathname);
  const [opened, setOpened] = useState(false);
  const key = help?.key;

  useEffect(() => {
    setOpened(false);
    if (!key) return;
    try {
      if (localStorage.getItem(HELP_AUTO_OFF_KEY) === "1") return;
      if (parseSeen(localStorage.getItem(SEEN_KEY)).includes(key)) return;
    } catch {
      // Stockage indisponible (navigation privée) : rien ne s'ouvre tout seul, pour ne pas gêner à chaque visite.
      return;
    }
    // Laisser l'écran s'afficher avant d'ouvrir l'aide ; elle n'est notée « vue » qu'une fois ouverte.
    const t = setTimeout(() => {
      try {
        const seen = parseSeen(localStorage.getItem(SEEN_KEY));
        if (!seen.includes(key)) localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, key]));
      } catch {
        return;
      }
      setOpened(true);
    }, 700);
    return () => clearTimeout(t);
  }, [key]);

  return { help, opened, open: () => setOpened(true), close: () => setOpened(false) };
}

/** Bouton rond « i » de la barre du haut (téléphone). */
export function HelpIconButton({ screen }: { screen: ScreenHelp }) {
  if (!screen.help) return null;
  return (
    <ActionIcon
      variant="white"
      radius="xl"
      size={36}
      className="help-button"
      onClick={screen.open}
      aria-label={`Aide : ${screen.help.title}`}
      title="Aide pour cet écran"
    >
      <IconInfo size={24} filled />
    </ActionIcon>
  );
}

/** Ligne « Aide pour cet écran » du menu de gauche (ordinateur), réduite à l'icône sur la caisse. */
export function HelpSideItem({ screen, mini }: { screen: ScreenHelp; mini: boolean }) {
  if (!screen.help) return null;
  const item = (
    <UnstyledButton className="side-help" onClick={screen.open} aria-label={mini ? `Aide : ${screen.help.title}` : undefined}>
      <IconInfo size={20} filled aria-hidden="true" />
      {!mini && <span>Aide pour cet écran</span>}
    </UnstyledButton>
  );
  return mini ? (
    <Tooltip label="Aide pour cet écran" position="right" withArrow>
      {item}
    </Tooltip>
  ) : (
    item
  );
}

/** Fenêtre d'aide : à quoi sert l'écran, les étapes, un conseil, et WhatsApp en cas de souci. */
export function HelpSheet({ screen }: { screen: ScreenHelp }) {
  const wide = useMediaQuery("(min-width: 62em)", true);
  const [autoOff, setAutoOff] = useState(() => {
    try {
      return localStorage.getItem(HELP_AUTO_OFF_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [justTurnedOff, setJustTurnedOff] = useState(false);
  const help = screen.help;
  if (!help) return null;

  const turnOff = () => {
    try {
      localStorage.setItem(HELP_AUTO_OFF_KEY, "1");
    } catch {
      // rien à faire : l'aide restera simplement disponible avec le bouton
    }
    setAutoOff(true);
    setJustTurnedOff(true);
  };

  return (
    <Drawer
      opened={screen.opened}
      onClose={screen.close}
      position={wide ? "right" : "bottom"}
      size={wide ? 440 : "auto"}
      radius={wide ? 0 : "lg"}
      // Sur téléphone, la fenêtre monte juste à la hauteur du texte (et défile s'il est long).
      styles={wide ? undefined : { content: { height: "auto", maxHeight: "92dvh", flex: "none" } }}
      title={
        <Group gap={10} wrap="nowrap">
          <IconInfo size={24} filled color="var(--mantine-primary-color-filled)" />
          <Text fw={700} fz="lg">
            {help.title}
          </Text>
        </Group>
      }
      classNames={{ content: "help-sheet" }}
    >
      <Stack gap="md" pb="md">
        <Text fz="md" lh={1.5}>
          {help.intro}
        </Text>
        <Stack component="ol" gap="sm" m={0} p={0} style={{ listStyle: "none" }}>
          {help.steps.map((s, i) => (
            <Group key={s} component="li" gap="sm" wrap="nowrap" align="flex-start">
              <ThemeIcon variant="light" radius="xl" size={28} fw={700} aria-hidden="true">
                {i + 1}
              </ThemeIcon>
              <Text lh={1.5} pt={2} style={{ flex: 1 }}>
                {s}
              </Text>
            </Group>
          ))}
        </Stack>
        {help.tip && (
          <Group gap="sm" wrap="nowrap" align="flex-start" className="help-tip">
            <IconLightbulb size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <Text fz="sm" lh={1.5}>
              {help.tip}
            </Text>
          </Group>
        )}
        <Group gap="sm" mt="xs">
          <Button leftSection={<IconCheck size={18} />} onClick={screen.close}>
            J'ai compris
          </Button>
          <Button
            component="a"
            href={HELP_URL}
            target="_blank"
            rel="noopener"
            variant="light"
            color="green"
            leftSection={<IconBrandWhatsapp size={18} />}
          >
            Toujours un souci ? WhatsApp
          </Button>
        </Group>
        {!autoOff && (
          <Anchor component="button" type="button" c="dimmed" fz="sm" ta="left" onClick={turnOff}>
            Ne plus ouvrir l'aide toute seule
          </Anchor>
        )}
        {justTurnedOff && (
          <Text role="status" fz="sm" c="dimmed">
            C'est noté. L'aide reste disponible avec le bouton « i » de chaque écran.
          </Text>
        )}
      </Stack>
    </Drawer>
  );
}
