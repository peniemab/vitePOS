/** Petits composants réutilisables. */
import type { ReactNode } from "react";
import { Group, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconTools } from "@tabler/icons-react";
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

/** Écran pas encore porté sur Firebase (étapes suivantes de la migration). */
export function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <PageTitle title={title} />
      <Paper p="xl" ta="center">
        <ThemeIcon size={48} radius="xl" variant="light" color="brick" mx="auto" mb="sm">
          <IconTools size={26} />
        </ThemeIcon>
        <Text fw={600}>Bientôt disponible</Text>
        <Text c="dimmed" size="sm">
          Cet écran arrive dans une prochaine étape de la migration.
        </Text>
      </Paper>
    </>
  );
}
