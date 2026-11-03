/** Aide directe par WhatsApp, et écran vide qui guide vers le premier geste. */
import type { ReactNode } from "react";
import { Anchor, Group, Stack, Text } from "@mantine/core";
import { IconBrandWhatsapp } from "@tabler/icons-react";
import { PAYMENT_CONTACT, whatsappLink } from "../lib/subscription";

export const HELP_URL = whatsappLink(PAYMENT_CONTACT, "Bonjour, j'ai besoin d'aide avec vitePOS : ");

export function HelpLink({ label = "Besoin d'aide ? WhatsApp" }: { label?: string }) {
  return (
    <Anchor href={HELP_URL} target="_blank" rel="noopener" size="sm" fw={600} className="help-link">
      <IconBrandWhatsapp size={18} />
      {label}
    </Anchor>
  );
}

export function EmptyState({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <Stack align="center" gap="sm" p="xl" className="empty-state">
      <Text fw={700} fz="lg" ta="center">
        {title}
      </Text>
      <Text c="dimmed" ta="center" maw={420}>
        {text}
      </Text>
      {children && (
        <Group justify="center" gap="sm" mt="xs">
          {children}
        </Group>
      )}
      <HelpLink />
    </Stack>
  );
}
