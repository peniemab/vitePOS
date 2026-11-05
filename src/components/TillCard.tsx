/**
 * Ticket de caisse bleu zébré, dentelé en bas : le chiffre principal d'un écran en grand,
 * puis quelques chiffres secondaires sous la ligne pointillée.
 */
import type { ReactNode } from "react";
import { Link } from "react-router";
import { IconChevronRight } from "./icons";
import { CURRENCIES, CURRENCY_LIST, formatMoney, type Currency, type MoneyByCurrency } from "../lib/fx";

export interface TillFigure {
  label: string;
  value: ReactNode;
  /** Petite ligne sous le chiffre (écart avec hier, précision…). */
  note?: ReactNode;
  /** Note en rouge pâle (baisse) plutôt qu'en vert pâle. */
  down?: boolean;
}

export function TillCard({ label, total, note, figures, to }: { label: string; total: ReactNode; note?: ReactNode; figures?: TillFigure[]; to?: string }) {
  const body = (
    <>
      <span className="till-head">
        {label}
        {to && <IconChevronRight size={18} />}
      </span>
      <span className="till-total n">{total}</span>
      {note && <span className="till-vs">{note}</span>}
      {figures && figures.length > 0 && (
        <>
          <span className="till-cut" />
          <dl data-many={figures.length > 3 || undefined}>
            {figures.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd className="n">
                  {f.value}
                  {f.note && <em data-down={f.down || undefined}>{f.note}</em>}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </>
  );
  return to ? (
    <Link to={to} className="till">
      {body}
    </Link>
  ) : (
    <div className="till">{body}</div>
  );
}

/** Montant sans la devise, quand elle est déjà dite ailleurs. */
export function amount(n: number, currency: Currency): string {
  return formatMoney(n, currency).replace(/\s*\S+$/, "");
}

/** « 779 950 » en grand, la devise en petit à côté. */
export function BigMoney({ value, currency }: { value: number; currency: Currency }) {
  return (
    <>
      {amount(value, currency)}
      <small>{CURRENCIES[currency].symbol}</small>
    </>
  );
}

/** Argent en plusieurs devises : une devise par ligne (« 591 100 FC » puis « 38,89 $ ») ; « 0 FC » si tout est nul. */
export function MoneyLines({ m, main }: { m: MoneyByCurrency; main: Currency }) {
  const parts = CURRENCY_LIST.filter((c) => m[c]);
  if (!parts.length) return <>{formatMoney(0, main)}</>;
  return (
    <>
      {parts.map((c) => (
        <span key={c} className="money-line">
          {formatMoney(m[c], c)}
        </span>
      ))}
    </>
  );
}
