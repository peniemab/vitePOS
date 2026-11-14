/**
 * Dépôt depuis la caisse (pressing, couture, réparation…) : le client laisse ses affaires et revient.
 * On note le client, ce qu'il laisse et le jour du retrait, puis il paie tout, une avance, ou rien avant le retrait.
 */
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useMediaQuery } from "@mantine/hooks";
import { Alert, Button, Group, Modal, NumberInput, SegmentedControl, Select, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { IconCash, IconCheck, IconUserPlus } from "./icons";
import { useReady } from "../data/session";
import { useActor } from "../data/products";
import { useCart } from "../data/sales";
import { useClients } from "../data/clients";
import { createDeposit } from "../data/deposits";
import { ClientModal } from "../screens/ClientsScreen";
import { PaymentSheet } from "./PaymentSheet";
import { matchClient } from "../lib/clients";
import { dayKey, type PaymentInput, type PaymentResult } from "../lib/cart";
import { addDays, defaultDueDay, validAcompte, type DepositPayMode } from "../lib/deposits";
import { formatMoney, type Currency } from "../lib/fx";

export function DepositModal({ opened, onClose, initialCurrency }: { opened: boolean; onClose: () => void; initialCurrency: Currency }) {
  const { boutique } = useReady();
  const actor = useActor();
  const cart = useCart();
  const navigate = useNavigate();
  const narrow = useMediaQuery("(max-width: 36em)");
  const { clients } = useClients();
  const today = dayKey(Date.now());
  const [clientId, setClientId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState("");
  const [dueDay, setDueDay] = useState(defaultDueDay(today));
  const [mode, setMode] = useState<DepositPayMode>("acompte");
  const [acompte, setAcompte] = useState<number | string>("");
  const [payOpen, setPayOpen] = useState(false);
  const [error, setError] = useState("");
  // Client créé à l'instant : pas encore dans la liste, on garde son nom.
  const [justCreated, setJustCreated] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!opened) return;
    setClientId(cart.client?.id ?? null);
    setNotes("");
    setDueDay(defaultDueDay(dayKey(Date.now())));
    setMode("acompte");
    setAcompte("");
    setError("");
    setJustCreated(null);
    // Réinitialisé à chaque ouverture, avec le client déjà choisi dans le panier.
  }, [opened]);

  const c = boutique.currency;
  const total = cart.totals.total;
  const client = clients?.find((x) => x.id === clientId);
  const clientName = client?.name ?? (justCreated?.id === clientId ? justCreated.name : cart.client?.id === clientId ? cart.client.name : "");
  const amount = Number(acompte) || 0;
  const toPay = mode === "total" ? total : mode === "acompte" ? amount : 0;

  function save(payment?: { input: PaymentInput; result: PaymentResult }) {
    if (!clientId || !clientName) return;
    const id = createDeposit(actor, c, {
      cart: cart.lines,
      discountPercent: cart.discountPercent,
      client: { id: clientId, name: clientName, phone: client?.phone ?? "" },
      notes,
      dueDay,
      mode,
      acompte: mode === "acompte" ? amount : undefined,
      payment,
    });
    cart.clear();
    setPayOpen(false);
    onClose();
    navigate(`/depots/${id}`, { state: { justCreated: true } });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!clientId || !clientName) return setError("Choisissez le client : il faut son nom pour lui rendre ses affaires.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDay) || dueDay < today) return setError("Choisissez le jour du retrait (aujourd'hui ou plus tard).");
    if (mode === "acompte" && !validAcompte(amount, total))
      return setError(`L'avance doit être plus que 0 et moins que ${formatMoney(total, c)}. Sinon, choisissez « Tout payé ».`);
    setError("");
    if (toPay > 0) setPayOpen(true);
    else save();
  }

  const NEW = "*nouveau";
  const quick = [
    { label: "Demain", day: addDays(today, 1) },
    { label: "Dans 3 jours", day: addDays(today, 3) },
    { label: "Dans 1 semaine", day: addDays(today, 7) },
  ];

  return (
    <>
      <Modal opened={opened && !payOpen} onClose={onClose} title="Nouveau dépôt" size="md" fullScreen={narrow}>
        <form onSubmit={submit}>
          <Stack gap="md">
            <Text c="dimmed" fz="sm">
              Le client laisse ses affaires et revient les chercher. Total : <b className="n">{formatMoney(total, c)}</b>
            </Text>

            <div>
              <Select
                label="Client"
                size="md"
                leftSection={<IconUserPlus size={18} />}
                placeholder="Nom ou téléphone"
                searchable
                nothingFoundMessage="Aucun client"
                data={[
                  ...(clients ?? []).map((x) => ({ value: x.id, label: x.phone ? `${x.name} · ${x.phone}` : x.name })),
                  ...(justCreated && !clients?.some((x) => x.id === justCreated.id) ? [{ value: justCreated.id, label: justCreated.name }] : []),
                  { value: NEW, label: "+ Nouveau client" },
                ]}
                filter={({ options, search }) =>
                  options.filter((o) => {
                    const id = (o as { value: string }).value;
                    if (id === NEW) return true;
                    const x = clients?.find((y) => y.id === id);
                    return !x || matchClient(x, search);
                  })
                }
                value={clientId}
                onChange={(id) => {
                  if (id === NEW) return setCreating(true);
                  setClientId(id);
                }}
              />
              {client && !client.phone && (
                <Text fz="sm" c="orange" mt={4}>
                  Sans numéro, vous ne pourrez pas le prévenir sur WhatsApp. Ajoutez-le dans Clients.
                </Text>
              )}
            </div>

            <Textarea
              label="Ce que le client laisse"
              description="Couleur, marque, taches, boutons manquants… pour tout retrouver et éviter les disputes."
              placeholder="Ex. 3 chemises blanches, 1 costume noir taché au col"
              autosize
              minRows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
            />

            <div>
              <TextInput type="date" label="À retirer le" min={today} value={dueDay} onChange={(e) => setDueDay(e.currentTarget.value)} />
              <Group gap={6} mt={6}>
                {quick.map((q) => (
                  <Button key={q.label} size="compact-sm" variant={dueDay === q.day ? "light" : "subtle"} onClick={() => setDueDay(q.day)}>
                    {q.label}
                  </Button>
                ))}
              </Group>
            </div>

            <div>
              <Text fw={600} fz="sm" mb={6}>
                Le client paie
              </Text>
              <SegmentedControl
                fullWidth
                value={mode}
                onChange={(v) => setMode(v as DepositPayMode)}
                data={[
                  { value: "total", label: "Tout payé" },
                  { value: "acompte", label: "Avance" },
                  { value: "retrait", label: "Au retrait" },
                ]}
              />
            </div>
            {mode === "acompte" && (
              <NumberInput
                label="Montant de l'avance"
                size="md"
                min={0}
                thousandSeparator=" "
                decimalSeparator=","
                hideControls
                inputMode="decimal"
                classNames={{ input: "n" }}
                value={acompte}
                onChange={setAcompte}
                description={amount > 0 && amount < total ? `Reste à payer au retrait : ${formatMoney(total - amount, c)}` : undefined}
              />
            )}
            {mode === "retrait" && (
              <Text fz="sm" c="dimmed">
                Rien n'est encaissé aujourd'hui : le client paiera {formatMoney(total, c)} en reprenant ses affaires.
              </Text>
            )}

            {error && (
              <Alert color="red" p="xs">
                {error}
              </Alert>
            )}

            <Button type="submit" size="lg" className="sun-btn" leftSection={toPay > 0 ? <IconCash size={20} /> : <IconCheck size={20} />}>
              {toPay > 0 ? (
                <>
                  Encaisser <span className="n" style={{ marginLeft: 6 }}>{formatMoney(toPay, c)}</span>
                </>
              ) : (
                "Enregistrer le dépôt"
              )}
            </Button>
          </Stack>
        </form>
      </Modal>

      <PaymentSheet
        opened={payOpen}
        onClose={() => setPayOpen(false)}
        total={toPay}
        initialCurrency={initialCurrency}
        title={mode === "acompte" ? "Avance du dépôt" : "Paiement du dépôt"}
        hint={mode === "acompte" ? `Avance sur ${formatMoney(total, c)}` : undefined}
        submitLabel="Valider le dépôt"
        onPaid={(input, result) => save({ input, result })}
      />
      <ClientModal
        client={null}
        opened={creating}
        onClose={() => setCreating(false)}
        onCreated={(x) => {
          setJustCreated(x);
          setClientId(x.id);
        }}
      />
    </>
  );
}
