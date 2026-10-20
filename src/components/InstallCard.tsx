/** Invitation à installer vitePOS sur l'écran d'accueil, adaptée au téléphone utilisé. */
import { useState } from "react";
import { Button, CloseButton, Group, Paper, Text, ThemeIcon } from "@mantine/core";
import { IconDeviceMobileDown, IconDotsVertical, IconShare2 } from "@tabler/icons-react";
import { promptInstall, useInstallMode } from "../data/install";

const DISMISS_KEY = "vitepos.install.dismissed";

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < 7 * 24 * 3600 * 1000;
  } catch {
    return false;
  }
}

/** `dismissible` : la carte de l'accueil peut être masquée une semaine ; celle du menu « Plus » reste. */
export function InstallCard({ dismissible = false, mt, mb }: { dismissible?: boolean; mt?: string; mb?: string }) {
  const mode = useInstallMode();
  const [hidden, setHidden] = useState(() => dismissible && dismissedRecently());
  if (mode === "installed" || hidden) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Sans stockage, la carte reviendra au prochain lancement.
    }
    setHidden(true);
  }

  return (
    <Paper p="md" withBorder mt={mt} mb={mb}>
      <Group align="flex-start" wrap="nowrap" gap="sm">
        <ThemeIcon variant="light" size="lg">
          <IconDeviceMobileDown size={20} />
        </ThemeIcon>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={700}>Installer vitePOS</Text>
          <Text size="sm" c="dimmed" mb={mode === "prompt" ? "sm" : 0}>
            L'app s'ouvre alors depuis l'écran d'accueil, en plein écran, et marche sans internet.
          </Text>
          {mode === "prompt" && (
            <Button size="sm" leftSection={<IconDeviceMobileDown size={16} />} onClick={() => void promptInstall()}>
              Installer
            </Button>
          )}
          {mode === "ios" && (
            <Text size="sm" mt={6}>
              Dans Safari, touchez <IconShare2 size={15} style={{ verticalAlign: "-2px" }} /> <b>Partager</b>, puis{" "}
              <b>« Sur l'écran d'accueil »</b>.
            </Text>
          )}
          {mode === "menu" && (
            <Text size="sm" mt={6}>
              Ouvrez le menu du navigateur <IconDotsVertical size={15} style={{ verticalAlign: "-2px" }} />, puis{" "}
              <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.
            </Text>
          )}
        </div>
        {dismissible && <CloseButton aria-label="Plus tard" onClick={dismiss} />}
      </Group>
    </Paper>
  );
}
