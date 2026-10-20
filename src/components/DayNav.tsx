/** Choix du jour affiché : précédent, suivant, retour à aujourd'hui (jamais au-delà d'aujourd'hui). */
import { ActionIcon, Button, Group, Text } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { dayKey } from "../lib/cart";
import { formatDay, shiftDay } from "../lib/cashday";

export function DayNav({ day, onChange }: { day: string; onChange: (d: string) => void }) {
  const today = dayKey(Date.now());
  // Majuscule à la première lettre seulement : « samedi 17 octobre » et non « Samedi 17 Octobre ».
  const label = formatDay(day);
  return (
    <Group gap="xs" mb="md" wrap="nowrap">
      <ActionIcon variant="default" size="lg" aria-label="Jour précédent" onClick={() => onChange(shiftDay(day, -1))}>
        <IconChevronLeft size={18} />
      </ActionIcon>
      <Text fw={600} style={{ flex: 1, textAlign: "center" }}>
        {day === today ? `Aujourd'hui · ${label}` : label.replace(/^./, (c) => c.toUpperCase())}
      </Text>
      <ActionIcon variant="default" size="lg" aria-label="Jour suivant" disabled={day >= today} onClick={() => onChange(shiftDay(day, 1))}>
        <IconChevronRight size={18} />
      </ActionIcon>
      {day !== today && (
        <Button variant="subtle" size="xs" onClick={() => onChange(today)}>
          Aujourd'hui
        </Button>
      )}
    </Group>
  );
}
