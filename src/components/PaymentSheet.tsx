/** Fenêtre d'encaissement, partagée par la caisse et les dépôts (acompte, solde au retrait). */
import { useEffect, useState, type FormEvent } from "react";
import { useMediaQuery } from "@mantine/hooks";
import { Button, Group, Modal, NumberInput, SegmentedControl, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconArrowBackUp, IconCash, IconCheck, IconDeviceMobileDollar } from "./icons";
import { useReady } from "../data/session";
import { currenciesOf, ratesOf } from "../data/boutique";
import { computePayment, suggestedBills, type PaymentInput, type PaymentMethod, type PaymentResult } from "../lib/cart";
import { convert, CURRENCIES, formatMoney, hasRate, type Currency } from "../lib/fx";

export interface PaymentSheetProps {
  opened: boolean;
  onClose: () => void;
  /** Montant à encaisser, dans la devise des prix. */
  total: number;
  initialCurrency: Currency;
  title?: string;
  submitLabel?: string;
  /** Ligne sous le montant (« Acompte du dépôt N° … »). */
  hint?: string;
  onPaid: (input: PaymentInput, result: PaymentResult) => void;
}

/** Encaissement : moyen de paiement, devise, billets reçus et monnaie à rendre. */
export function PaymentSheet({ opened, onClose, total, initialCurrency, title = "Encaissement", submitLabel = "Valider la vente", hint, onPaid }: PaymentSheetProps) {
  const { boutique } = useReady();
  const narrow = useMediaQuery("(max-width: 36em)");
  const [method, setMethod] = useState<PaymentMethod>("especes");
  const [payCurrency, setPayCurrency] = useState<Currency>(boutique.currency);
  const [received, setReceived] = useState<number | string>("");

  useEffect(() => {
    if (opened) {
      setMethod("especes");
      setPayCurrency(initialCurrency);
      setReceived("");
    }
  }, [opened, initialCurrency]);

  const rates = ratesOf(boutique);
  const currencies = currenciesOf(boutique);
  const input = { method, payCurrency, received: Number(received) || 0 };
  const result = computePayment(total, boutique.currency, rates, input);
  const others = currencies.filter((c) => c !== boutique.currency && hasRate(rates, c) && hasRate(rates, boutique.currency));

  function submit(e: FormEvent) {
    e.preventDefault();
    if ("error" in result || !result.ok || !(total > 0)) return;
    onPaid(input, result);
  }

  const due = "error" in result ? 0 : result.due;
  const sym = CURRENCIES[payCurrency].symbol;
  const given = Number(received) || 0;
  const methods: { value: PaymentMethod; label: string; icon: typeof IconCash }[] = [
    { value: "especes", label: "Espèces", icon: IconCash },
    { value: "mobile_money", label: "Mobile money", icon: IconDeviceMobileDollar },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={narrow ? undefined : title}
      withCloseButton={!narrow}
      size="md"
      classNames={narrow ? { inner: "pay-sheet-inner", content: "pay-sheet" } : undefined}
      transitionProps={narrow ? { transition: "slide-up" } : undefined}
    >
      <form onSubmit={submit}>
        <Stack gap="md">
          {narrow && <span className="grab" aria-hidden />}
          <div className="pay-due">
            <small>À payer</small>
            <b className="n">{formatMoney(total, boutique.currency)}</b>
            {others.length > 0 && (
              <em className="n">soit {others.map((c) => formatMoney(convert(total, boutique.currency, c, rates), c)).join(" ou ")} au taux du jour</em>
            )}
            {hint && <em style={{ display: "block", marginTop: 2 }}>{hint}</em>}
          </div>

          <div className="pay-methods" role="radiogroup" aria-label="Moyen de paiement">
            {methods.map((m) => (
              <UnstyledButton
                key={m.value}
                className="pay-method"
                role="radio"
                aria-checked={method === m.value}
                data-on={method === m.value || undefined}
                onClick={() => {
                  setMethod(m.value);
                  setReceived("");
                }}
              >
                <m.icon size={22} />
                {m.label}
              </UnstyledButton>
            ))}
          </div>
          {currencies.length > 1 && (
            <SegmentedControl
              fullWidth
              value={payCurrency}
              onChange={(v) => {
                setPayCurrency(v as Currency);
                setReceived("");
              }}
              data={currencies.map((c, i) => ({ value: c, label: `${i === 0 ? "Payé " : ""}en ${CURRENCIES[c].symbol}` }))}
            />
          )}

          {"error" in result ? (
            <Text c="red">{result.error}</Text>
          ) : method === "especes" ? (
            <>
              {payCurrency !== boutique.currency && (
                <Text ta="center" fw={600}>
                  Le client doit <span className="n">{formatMoney(due, payCurrency)}</span>
                </Text>
              )}
              <NumberInput
                label="Le client donne"
                size="xl"
                autoFocus={!narrow}
                min={0}
                thousandSeparator=" "
                decimalSeparator=","
                decimalScale={CURRENCIES[payCurrency].decimals}
                hideControls
                inputMode="decimal"
                rightSection={<Text c="dimmed" fw={600} pr="sm">{sym}</Text>}
                rightSectionWidth={56}
                classNames={{ input: "n recv-input" }}
                styles={{ label: { fontSize: 14, fontWeight: 700, color: "var(--mantine-color-dimmed)", marginBottom: 4 } }}
                value={received}
                onChange={setReceived}
              />
              <div className="pay-bills">
                {[...new Set([due, ...suggestedBills(due, payCurrency)])].slice(0, 4).map((b) => (
                  <UnstyledButton key={b} className="pay-bill n" data-on={given === b || undefined} onClick={() => setReceived(b)}>
                    {formatMoney(b, payCurrency).replace(/\s*\S+$/, "")}
                  </UnstyledButton>
                ))}
              </div>
              {result.missing > 0 && given > 0 ? (
                <div className="pay-change" data-missing>
                  <span>Il manque</span>
                  <b className="n">{formatMoney(result.missing, payCurrency)}</b>
                </div>
              ) : (
                <div className="pay-change">
                  <Group gap={6} wrap="nowrap">
                    <IconArrowBackUp size={18} />
                    Monnaie à rendre
                  </Group>
                  <b className="n">{formatMoney(given > 0 ? result.change : 0, payCurrency)}</b>
                </div>
              )}
            </>
          ) : (
            <Text ta="center" c="dimmed">
              Vérifiez la réception du paiement de <b className="n">{formatMoney(due, payCurrency)}</b> sur le téléphone
              avant de valider.
            </Text>
          )}

          <Button
            type="submit"
            size="xl"
            className="sun-btn pay-btn"
            leftSection={<IconCheck size={22} />}
            disabled={"error" in result || !result.ok || (method === "especes" && !(given > 0))}
          >
            {submitLabel}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
