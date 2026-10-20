/** Mon abonnement : formule, état (essai, actif, grâce, lecture seule), prix et comment payer. */
import { Alert, Badge, Button, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCheck, IconLock } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { changePlan } from "../data/boutique";
import { errorMessage } from "../data/errors";
import { notifications } from "@mantine/notifications";
import { PageTitle } from "../components/ui";
import { canChangePlan, GRACE_DAYS, PAYMENT_CONTACT, PLANS, type Plan, type SubscriptionStatus } from "../lib/subscription";

const STATE_LABELS: Record<SubscriptionStatus["state"], { label: string; color: string }> = {
  essai: { label: "Essai gratuit", color: "blue" },
  actif: { label: "Actif", color: "teal" },
  grace: { label: "Paiement en retard", color: "orange" },
  bloque: { label: "Lecture seule", color: "red" },
};

export function SubscriptionMessage({ st }: { st: SubscriptionStatus }) {
  const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(st.endsAtMs);
  switch (st.state) {
    case "essai":
      return (
        <>
          Essai gratuit jusqu'au <b>{date}</b> ({st.daysLeft} jour{st.daysLeft > 1 ? "s" : ""} restant{st.daysLeft > 1 ? "s" : ""}).
        </>
      );
    case "actif":
      return (
        <>
          Payé jusqu'au <b>{date}</b>.
        </>
      );
    case "grace":
      return (
        <>
          L'abonnement a pris fin le {date}. Sans paiement, l'application passera en lecture seule dans{" "}
          <b>
            {st.daysLeft} jour{st.daysLeft > 1 ? "s" : ""}
          </b>
          .
        </>
      );
    case "bloque":
      return (
        <>
          L'abonnement a pris fin le {date}. L'application est en <b>lecture seule</b> : vos données sont conservées et
          consultables, mais les ventes et les modifications sont arrêtées jusqu'au paiement.
        </>
      );
  }
}

export function AbonnementScreen() {
  const { boutique, member, subscription: st } = useReady();
  const isOwner = member.role === "proprietaire";
  const current = PLANS[st.plan];
  const choose = canChangePlan(st) && isOwner;

  return (
    <>
      <PageTitle title="Mon abonnement" />
      <Stack>
        <Paper p="md">
          <Group justify="space-between" mb="xs">
            <Title order={3}>Formule {current.name}</Title>
            <Badge color={STATE_LABELS[st.state].color} variant="light" leftSection={st.readOnly ? <IconLock size={12} /> : undefined}>
              {STATE_LABELS[st.state].label}
            </Badge>
          </Group>
          <Text mb="sm">
            <SubscriptionMessage st={st} />
          </Text>
          <Text size="sm" c="dimmed">
            {current.monthlyUsd} $ par mois{st.plan === "supermarche" ? " et par magasin" : ""}, ou {current.yearlyUsd} $ par an
            (2 mois offerts). Après la fin, vous gardez {GRACE_DAYS} jours pour payer avant le passage en lecture seule.
          </Text>
        </Paper>

        <Alert color="navy" title="Comment payer">
          {PAYMENT_CONTACT ? (
            <>
              Envoyez le paiement par mobile money puis prévenez-nous au <b>{PAYMENT_CONTACT}</b> avec le nom de votre
              boutique (« {boutique.name} »). Votre abonnement est prolongé dès réception.
            </>
          ) : (
            <>Le paiement par mobile money arrive bientôt. En attendant, contactez l'équipe vitePOS pour activer votre abonnement.</>
          )}
        </Alert>

        <Title order={4} mt="xs">
          {choose ? "Choisir une formule" : "Les formules"}
        </Title>
        {choose && (
          <Text size="sm" c="dimmed" mt={-8}>
            Pendant l'essai, vous pouvez changer de formule à tout moment.
          </Text>
        )}
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          {(Object.keys(PLANS) as Plan[]).map((k) => {
            const p = PLANS[k];
            const isCurrent = k === st.plan;
            return (
              <Paper key={k} p="md" style={isCurrent ? { borderColor: "var(--mantine-color-navy-6)", borderWidth: 2 } : undefined}>
                <Group justify="space-between" mb={4}>
                  <Text fw={700} fz="lg">
                    {p.name}
                  </Text>
                  {isCurrent && (
                    <Badge size="sm" variant="light">
                      Actuelle
                    </Badge>
                  )}
                </Group>
                <Text fz={28} fw={700} className="n" lh={1.1}>
                  {p.monthlyUsd} $
                  <Text span size="sm" c="dimmed" fw={400}>
                    {" "}
                    / mois{k === "supermarche" ? " / magasin" : ""}
                  </Text>
                </Text>
                <Text size="xs" c="dimmed" mb="sm">
                  ou {p.yearlyUsd} $ par an
                </Text>
                <Text size="sm" mb="xs">
                  {p.audience}
                </Text>
                <Stack gap={4}>
                  {p.features.map((f) => (
                    <Group key={f} gap={6} wrap="nowrap" align="flex-start">
                      <ThemeIcon size={18} radius="xl" variant="light" color="teal">
                        <IconCheck size={12} />
                      </ThemeIcon>
                      <Text size="sm">{f}</Text>
                    </Group>
                  ))}
                </Stack>
                {choose && !isCurrent && (
                  <Button
                    fullWidth
                    mt="md"
                    variant="light"
                    onClick={() =>
                      changePlan(boutique.id, k, (e) =>
                        notifications.show({ color: "red", title: "Changement refusé", message: errorMessage(e) }),
                      )
                    }
                  >
                    Passer à {p.name}
                  </Button>
                )}
              </Paper>
            );
          })}
        </SimpleGrid>
      </Stack>
    </>
  );
}
