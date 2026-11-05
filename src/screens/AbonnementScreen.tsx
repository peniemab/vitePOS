/** Mon abonnement : formule, état (essai, actif, grâce, lecture seule), prix et comment payer. */
import { useEffect, useState } from "react";
import { Badge, Button, Group, Paper, SegmentedControl, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconBrandWhatsapp, IconCheck, IconLock } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { changePlan } from "../data/boutique";
import { errorMessage } from "../data/errors";
import { notifications } from "@mantine/notifications";
import { watchPayments, type SubscriptionPayment } from "../data/admin";
import { PageTitle } from "../components/ui";
import {
  canChangePlan,
  GRACE_DAYS,
  PAY_MONTHS,
  PAYMENT_CONTACT,
  PAYMENT_METHODS,
  paymentMessage,
  formatUsd,
  PLAN_ORDER,
  PLANS,
  priceUsd,
  whatsappLink,
  type SubscriptionStatus,
} from "../lib/subscription";

export const STATE_LABELS: Record<SubscriptionStatus["state"], { label: string; color: string }> = {
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
  const [months, setMonths] = useState(1);
  const [payments, setPayments] = useState<SubscriptionPayment[] | null>(null);
  useEffect(() => watchPayments(boutique.id, setPayments, () => setPayments([])), [boutique.id]);

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
            {current.monthlyUsd == null || current.yearlyUsd == null
              ? "Prix sur devis, selon votre équipe et vos magasins."
              : `${formatUsd(current.monthlyUsd)} $ par mois, ou ${formatUsd(current.yearlyUsd)} $ par an (2 mois offerts).`}{" "}
            Après la fin, vous gardez {GRACE_DAYS} jours pour payer avant le passage en lecture seule.
          </Text>
        </Paper>

        <Paper p="md">
          <Title order={4} mb="sm">
            Payer l'abonnement
          </Title>
          <Text size="sm" fw={500} mb={4}>
            Je paie pour
          </Text>
          <SegmentedControl
            fullWidth
            mb="md"
            value={String(months)}
            onChange={(v) => setMonths(Number(v))}
            data={PAY_MONTHS.map((m) => ({ value: String(m), label: m === 12 ? "1 an" : `${m} mois` }))}
          />
          <ol className="pay-steps">
            <li>
              Écrivez-nous sur WhatsApp : le message est déjà prêt
              {priceUsd(st.plan, months) == null ? (
                " ; nous vous donnons le prix selon vos besoins"
              ) : (
                <>
                  , pour <b className="n">{formatUsd(priceUsd(st.plan, months) ?? 0)} $</b>
                  {months === 12 && " (2 mois offerts)"}
                </>
              )}
              .
            </li>
            <li>Nous vous répondons avec le numéro mobile money où envoyer le paiement.</li>
            <li>Envoyez-nous la référence reçue par SMS : votre abonnement est prolongé dès que le paiement est vérifié.</li>
          </ol>
          <Button
            component="a"
            href={whatsappLink(PAYMENT_CONTACT, paymentMessage(boutique.name, st.plan, months))}
            target="_blank"
            rel="noopener"
            className="sun-btn"
            size="md"
            fullWidth
            leftSection={<IconBrandWhatsapp size={20} />}
          >
            Payer via WhatsApp
          </Button>
          <Text size="xs" c="dimmed" mt="xs" ta="center">
            Une question ? WhatsApp au {PAYMENT_CONTACT}
          </Text>
        </Paper>

        <PaymentHistory payments={payments} />

        <Title order={4} mt="xs">
          {choose ? "Choisir une formule" : "Les formules"}
        </Title>
        {choose && (
          <Text size="sm" c="dimmed" mt={-8}>
            Pendant l'essai, vous pouvez changer de formule à tout moment.
          </Text>
        )}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {PLAN_ORDER.map((k) => {
            const p = PLANS[k];
            const isCurrent = k === st.plan;
            return (
              <Paper key={k} p="md" style={isCurrent ? { borderColor: "var(--mantine-color-sky-6)", borderWidth: 2 } : undefined}>
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
                  {p.monthlyUsd == null ? (
                    "Sur devis"
                  ) : (
                    <>
                      {formatUsd(p.monthlyUsd)} $
                      <Text span size="sm" c="dimmed" fw={400}>
                        {" "}
                        / mois
                      </Text>
                    </>
                  )}
                </Text>
                <Text size="xs" c="dimmed" mb="sm">
                  {p.yearlyUsd == null ? "Selon votre équipe et vos magasins" : `ou ${formatUsd(p.yearlyUsd)} $ par an`}
                </Text>
                <Text size="sm" fw={600}>
                  {p.phones}
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

const shortDate = (ms: number) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(ms);
const duration = (months: number) => (months === 12 ? "1 an" : `${months} mois`);

/** Paiements d'abonnement déjà reçus, les plus récents d'abord. */
export function PaymentHistory({
  payments,
}: {
  payments: SubscriptionPayment[] | null;
}) {
  if (!payments?.length) return null;
  return (
    <div>
      <Text fw={700} mb="xs">
        Paiements reçus
      </Text>
      <Paper p={0} style={{ overflow: "hidden" }}>
        {payments.map((p) => (
          <div
            key={p.id}
            className="list-row"
            style={{ paddingInline: "var(--mantine-spacing-md)" }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text fw={600}>
                {PLANS[p.plan].name}, {duration(p.months)}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {p.createdAtMs ? shortDate(p.createdAtMs) : "…"},{" "}
                {PAYMENT_METHODS[p.method]}
                {p.reference ? `, réf. ${p.reference}` : ""}
              </Text>
            </div>
            <div style={{ textAlign: "right" }}>
              <Text fw={600} className="n">
                {formatUsd(p.amountUsd)} $
              </Text>
              <Text size="xs" c="dimmed">
                jusqu'au {shortDate(p.paidUntilMs)}
              </Text>
            </div>
          </div>
        ))}
      </Paper>
    </div>
  );
}
