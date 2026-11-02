/** Historique des ventes, jour par jour : totaux du jour et liste des tickets. */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button, Modal, Text, UnstyledButton } from "@mantine/core";
import { IconCloudUpload, IconDeviceMobileSearch } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useCatalog } from "../data/products";
import { watchSalesOfDay } from "../data/sales";
import { errorMessage } from "../data/errors";
import { DayNav } from "../components/DayNav";
import { SerialLookup } from "../components/SerialLookup";
import { BigMoney, MoneyLines, TillCard } from "../components/TillCard";
import { PageTitle } from "../components/ui";
import { dayKey, ticketNumber } from "../lib/cart";
import { summarizeDay } from "../lib/cashday";
import { CURRENCIES, formatMoney } from "../lib/fx";
import { PAYMENT_LABELS, type Sale } from "../lib/sales";

export function VentesScreen() {
  const { boutique, member, permissions } = useReady();
  const { products } = useCatalog();
  const navigate = useNavigate();
  const [day, setDay] = useState(() => dayKey(Date.now()));
  const [sales, setSales] = useState<Sale[]>();
  const [error, setError] = useState<string>();
  const [lookup, setLookup] = useState(false);

  useEffect(() => {
    setSales(undefined);
    return watchSalesOfDay(boutique.id, day, setSales, (e) => setError(errorMessage(e)));
  }, [boutique.id, day]);

  // Un vendeur sans accès aux rapports ne voit que ses propres ventes.
  const visible = permissions.viewReports ? sales : sales?.filter((s) => s.uid === member.uid);
  const summary = visible ? summarizeDay(visible, [], boutique.currency) : undefined;
  const cancelledCount = visible?.filter((s) => s.status === "annulee").length ?? 0;
  const c = boutique.currency;
  const time = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" });
  // La recherche par IMEI ne sert qu'aux boutiques qui vendent des appareils suivis.
  const tracksSerials = products?.some((p) => p.serialTracked) ?? false;

  return (
    <>
      <PageTitle
        title="Ventes"
        sub={permissions.viewReports ? undefined : "Vos ventes"}
        right={
          tracksSerials && (
            <Button variant="light" leftSection={<IconDeviceMobileSearch size={18} />} onClick={() => setLookup(true)}>
              Retrouver un appareil
            </Button>
          )
        }
      />
      <DayNav day={day} onChange={setDay} />
      {error && <Text c="red">{error}</Text>}

      {summary && (
        <div className="screen-till">
          <TillCard
            label={permissions.viewReports ? "Chiffre d'affaires" : "Vos ventes"}
            total={<BigMoney value={summary.revenue} currency={c} />}
            note={cancelledCount ? `${cancelledCount} vente${cancelledCount > 1 ? "s" : ""} annulée${cancelledCount > 1 ? "s" : ""}, non comptée${cancelledCount > 1 ? "s" : ""}` : undefined}
            figures={[
              { label: "Ventes", value: summary.salesCount },
              { label: "Espèces", value: <MoneyLines m={summary.cash} main={c} /> },
              { label: "Mobile money", value: <MoneyLines m={summary.mobileMoney} main={c} /> },
            ]}
          />
        </div>
      )}

      {!visible && !error && <div className="loading">Chargement…</div>}
      {visible && (
        <section className="panel">
          {visible.map((s) => {
            const cancelled = s.status === "annulee";
            const items = s.lines.length;
            return (
              <UnstyledButton key={s.id} className="sale-row" data-cancelled={cancelled || undefined} w="100%" onClick={() => navigate(`/ticket/${s.id}`)}>
                <span className="time n">{s.createdAtMs ? time.format(s.createdAtMs) : "—"}</span>
                <div className="who">
                  <b>
                    {s.clientName || "Sans client"}
                    {!s.synced && <IconCloudUpload size={14} color="var(--mantine-color-orange-6)" aria-label="En attente d'envoi" style={{ marginLeft: 6, verticalAlign: -2 }} />}
                  </b>
                  <small>
                    {items} article{items > 1 ? "s" : ""}, {s.memberName.split(" ")[0]}, ticket <span className="n">{ticketNumber(s.id)}</span>
                  </small>
                </div>
                <div className="amt">
                  <b className="n">{formatMoney(s.total, c)}</b>
                  {cancelled ? (
                    <Badge size="sm" color="red" variant="filled">
                      Annulée
                    </Badge>
                  ) : (
                    <small className={`pay ${s.payment.method}`}>
                      {PAYMENT_LABELS[s.payment.method]}
                      {s.payment.currency !== c ? ` en ${CURRENCIES[s.payment.currency].symbol}` : ""}
                    </small>
                  )}
                </div>
              </UnstyledButton>
            );
          })}
          {!visible.length && (
            <Text c="dimmed" ta="center" p="xl">
              Aucune vente ce jour-là.
            </Text>
          )}
        </section>
      )}

      <Modal opened={lookup} onClose={() => setLookup(false)} title="Retrouver un appareil (garantie)">
        <SerialLookup />
      </Modal>
    </>
  );
}
