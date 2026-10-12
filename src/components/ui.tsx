/** Petits composants réutilisables. */
import type { ReactNode } from "react";
import { Group, Stack, Text, Title } from "@mantine/core";
import { formatMoney, type Currency } from "../lib/fx";

export function PageTitle({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <Group justify="space-between" align="flex-end" mb="lg" gap="sm">
      <Stack gap={2} style={{ minWidth: 0 }}>
        <Title order={1} fz={{ base: 28, sm: 32 }}>
          {title}
        </Title>
        {sub && (
          <Text c="dimmed" size="sm">
            {sub}
          </Text>
        )}
      </Stack>
      {right}
    </Group>
  );
}

/** Montant formaté avec sa devise, en chiffres condensés. */
export function Money({ value, currency }: { value: number; currency: Currency }) {
  return <span className="n">{formatMoney(value, currency)}</span>;
}
