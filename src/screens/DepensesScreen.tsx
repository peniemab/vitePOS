/** Dépenses : noter une sortie d'argent (transport, unités, loyer…) et voir celles du jour. */
import { useEffect, useState, type FormEvent } from "react";
import { Badge, Button, Group, Modal, NumberInput, Paper, SegmentedControl, Select, Stack, Switch, Text, TextInput, UnstyledButton } from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconBolt,
  IconBuildingStore,
  IconBus,
  IconDots,
  IconPackage,
  IconPlus,
  IconUsers,
} from "../components/icons";
import { useReady } from "../data/session";
import { useActor } from "../data/products";
import { cancelExpense, createExpense, watchExpensesOfDay } from "../data/cashday";
import { errorMessage } from "../data/errors";
import { DayNav } from "../components/DayNav";
import { PageTitle } from "../components/ui";
import { BigMoney, MoneyLines, TillCard } from "../components/TillCard";
import { dayKey } from "../lib/cart";
import { EXPENSE_CATEGORIES, formatMoney2, type Expense, type ExpenseCategory } from "../lib/cashday";
import { CURRENCIES, CURRENCY_LIST, formatMoney, zeroMoney, type Currency } from "../lib/fx";
import { currenciesOf } from "../data/boutique";

const EXPENSE_ICONS: Record<ExpenseCategory, { icon: typeof IconBus; tone: string }> = {
  transport: { icon: IconBus, tone: "blue" },
  fournitures: { icon: IconPackage, tone: "violet" },
  loyer: { icon: IconBuildingStore, tone: "orange" },
  communication: { icon: IconBolt, tone: "green" },
  salaires: { icon: IconUsers, tone: "blue" },
  autres: { icon: IconDots, tone: "gray" },
};

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
  const fromTill = zeroMoney();
  const outside = zeroMoney();
  for (const e of active) {
    total[e.currency] += e.amount;
    (e.fromTill ? fromTill : outside)[e.currency] += e.amount;
  }
  const onlyMain = CURRENCY_LIST.every((c) => c === boutique.currency || !total[c]);
  const time = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" });

  function confirmCancel(e: Expense) {
    modals.openConfirmModal({
      title: `Annuler la dépense ${EXPENSE_CATEGORIES[e.category].toLowerCase()} de ${formatMoney(e.amount, e.currency)} ?`,
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
          <div className="screen-till">
            <TillCard
              label="Dépenses du jour"
              total={onlyMain ? <BigMoney value={total[boutique.currency]} currency={boutique.currency} /> : formatMoney2(total)}
              note={active.length ? `${active.length} dépense${active.length > 1 ? "s" : ""}` : undefined}
              figures={[
                { label: "Prises dans la caisse", value: <MoneyLines m={fromTill} main={boutique.currency} /> },
                { label: "Payées hors caisse", value: <MoneyLines m={outside} main={boutique.currency} /> },
              ]}
            />
          </div>
          <Paper p={0} px="md" style={{ overflow: "hidden" }}>
            {expenses.map((e) => {
              const { icon: Icon, tone } = EXPENSE_ICONS[e.category];
              const cancelled = e.status === "annulee";
              const canCancel = permissions.closeCash && !cancelled;
              return (
                <UnstyledButton
                  key={e.id}
                  className="list-row expense-row"
                  data-cancelled={cancelled || undefined}
                  w="100%"
                  disabled={!canCancel}
                  onClick={() => canCancel && confirmCancel(e)}
                  aria-label={canCancel ? `${EXPENSE_CATEGORIES[e.category]}, ${formatMoney(e.amount, e.currency)} : toucher pour annuler` : undefined}
                >
                  <span className={`ico ${cancelled ? "red" : tone}`}>
                    <Icon size={20} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={600}>{EXPENSE_CATEGORIES[e.category]}</Text>
                    <Text size="xs" c="dimmed">
                      {e.createdAtMs ? time.format(e.createdAtMs) : "—"}, {e.memberName.split(" ")[0]}
                      {e.fromTill ? "" : ", hors caisse"}
                    </Text>
                    {e.description && (
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {e.description}
                      </Text>
                    )}
                  </div>
                  <div className="amt">
                    <Text fw={700} className="n">
                      {formatMoney(e.amount, e.currency)}
                    </Text>
                    {cancelled && (
                      <Badge size="sm" color="red" variant="filled">
                        Annulée
                      </Badge>
                    )}
                  </div>
                </UnstyledButton>
              );
            })}
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
            description="Décochez si vous avez payé de votre poche : la caisse n'est pas touchée."
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
