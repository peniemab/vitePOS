/** Dépenses : noter une sortie d'argent (transport, unités, loyer…) et voir celles du jour. */
import { useEffect, useState, type FormEvent } from "react";
import { Badge, Button, Group, Modal, NumberInput, Paper, SegmentedControl, Select, Stack, Switch, Text, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconPlus } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useActor } from "../data/products";
import { cancelExpense, createExpense, watchExpensesOfDay } from "../data/cashday";
import { errorMessage } from "../data/errors";
import { DayNav } from "../components/DayNav";
import { PageTitle } from "../components/ui";
import { dayKey } from "../lib/cart";
import { EXPENSE_CATEGORIES, formatMoney2, type Expense, type ExpenseCategory } from "../lib/cashday";
import { CURRENCIES, formatMoney, zeroMoney, type Currency } from "../lib/fx";
import { currenciesOf } from "../data/boutique";

export function DepensesScreen() {
  const { boutique, permissions, subscription } = useReady();
  const actor = useActor();
  const today = dayKey(Date.now());
  const [day, setDay] = useState(today);
  const [expenses, setExpenses] = useState<Expense[]>();
  const [error, setError] = useState<string>();
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setExpenses(undefined);
    return watchExpensesOfDay(boutique.id, day, setExpenses, (e) => setError(errorMessage(e)));
  }, [boutique.id, day]);

  const active = expenses?.filter((e) => e.status === "validee") ?? [];
  const total = zeroMoney();
  for (const e of active) total[e.currency] += e.amount;
  const time = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" });

  function confirmCancel(e: Expense) {
    modals.openConfirmModal({
      title: "Annuler cette dépense ?",
      children: <Text size="sm">Elle restera visible comme annulée et ne comptera plus dans la caisse.</Text>,
      labels: { confirm: "Annuler la dépense", cancel: "Garder" },
      confirmProps: { color: "red" },
      onConfirm: () => cancelExpense(actor, e),
    });
  }

  return (
    <>
      <PageTitle
        title="Dépenses"
        right={
          <Button leftSection={<IconPlus size={18} />} disabled={subscription.readOnly} onClick={() => setAdding(true)}>
            Nouvelle dépense
          </Button>
        }
      />
      <DayNav day={day} onChange={setDay} />
      {error && <Text c="red">{error}</Text>}
      {!expenses && !error && <div className="loading">Chargement…</div>}

      {expenses && (
        <>
          <Text mb="xs">
            Total du jour : <b className="n">{formatMoney2(total)}</b>
          </Text>
          <Paper p={0} style={{ overflow: "hidden" }}>
            {expenses.map((e) => (
              <div key={e.id} className="list-row" style={{ padding: "12px 16px", opacity: e.status === "annulee" ? 0.55 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={6} wrap="nowrap">
                    <Text fw={600} truncate>
                      {EXPENSE_CATEGORIES[e.category]}
                    </Text>
                    {!e.fromTill && (
                      <Badge size="xs" variant="light" color="gray">
                        Hors caisse
                      </Badge>
                    )}
                    {e.status === "annulee" && (
                      <Badge size="xs" variant="light" color="red">
                        Annulée
                      </Badge>
                    )}
                  </Group>
                  <Text size="xs" c="dimmed" truncate>
                    {e.createdAtMs ? time.format(e.createdAtMs) : "—"} · {e.memberName}
                    {e.description ? ` · ${e.description}` : ""}
                  </Text>
                </div>
                <Text fw={700} className="n" td={e.status === "annulee" ? "line-through" : undefined}>
                  {formatMoney(e.amount, e.currency)}
                </Text>
                {permissions.closeCash && e.status === "validee" && (
                  <Button size="xs" variant="subtle" color="red" onClick={() => confirmCancel(e)}>
                    Annuler
                  </Button>
                )}
              </div>
            ))}
            {!expenses.length && (
              <Text c="dimmed" ta="center" p="xl">
                Aucune dépense ce jour-là.
              </Text>
            )}
          </Paper>
        </>
      )}

      <ExpenseModal opened={adding} onClose={() => setAdding(false)} defaultCurrency={boutique.currency} currencies={currenciesOf(boutique)} onSaved={() => setDay(today)} />
    </>
  );
}

function ExpenseModal({
  opened,
  onClose,
  defaultCurrency,
  currencies,
  onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  defaultCurrency: Currency;
  currencies: Currency[];
  onSaved: () => void;
}) {
  const actor = useActor();
  const [amount, setAmount] = useState<number | string>("");
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [description, setDescription] = useState("");
  const [fromTill, setFromTill] = useState(true);

  useEffect(() => {
    if (opened) {
      setAmount("");
      setCurrency(defaultCurrency);
      setCategory(null);
      setDescription("");
      setFromTill(true);
    }
  }, [opened, defaultCurrency]);

  const n = Number(amount) || 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!(n > 0) || !category) return;
    createExpense(actor, { amount: n, currency, category, description, fromTill });
    onSaved();
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Nouvelle dépense">
      <form onSubmit={submit}>
        <Stack>
          <Group align="flex-end" wrap="nowrap">
            <NumberInput
              label="Montant"
              required
              autoFocus
              min={0}
              thousandSeparator=" "
              decimalSeparator=","
              decimalScale={CURRENCIES[currency].decimals}
              hideControls
              inputMode="decimal"
              value={amount}
              onChange={setAmount}
              style={{ flex: 1 }}
            />
            <SegmentedControl
              value={currency}
              onChange={(v) => setCurrency(v as Currency)}
              data={currencies.map((c) => ({ value: c, label: CURRENCIES[c].symbol }))}
            />
          </Group>
          <Select
            label="Catégorie"
            required
            placeholder="Choisir"
            value={category}
            onChange={(v) => setCategory(v as ExpenseCategory | null)}
            data={(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map((k) => ({ value: k, label: EXPENSE_CATEGORIES[k] }))}
          />
          <TextInput label="Détail (facultatif)" maxLength={200} value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
          <Switch
            label="Payée avec l'argent de la caisse"
            description="Décochez si le patron a payé de sa poche : la caisse n'est pas touchée."
            checked={fromTill}
            onChange={(e) => setFromTill(e.currentTarget.checked)}
          />
          <Button type="submit" disabled={!(n > 0) || !category}>
            Enregistrer
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
