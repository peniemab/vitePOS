/**
 * Dépôts (pressing, couture, réparation…) : la liste par étape (en cours, prêts, retirés),
 * puis la fiche d'un dépôt : ticket, « Prêt », prévenir sur WhatsApp, retrait avec paiement du solde.
 */
import { useDeferredValue, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Alert, Badge, Button, Group, Modal, Paper, SegmentedControl, Stack, Text, TextInput, UnstyledButton } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowBackUp, IconBrandWhatsapp, IconCash, IconCheck, IconCloudCheck, IconCloudUpload, IconPrinter, IconReceiptOff, IconSearch, IconShare } from "../components/icons";
import { useReady } from "../data/session";
import { useActor } from "../data/products";
import { cancelDeposit, markNotReady, markReady, pickUp, useDeposits, watchDeposit } from "../data/deposits";
import { errorMessage } from "../data/errors";
import { getPrinterMode, printReceipt } from "../data/printer";
import { PageTitle } from "../components/ui";
import { Receipt } from "../components/Receipt";
import { PaymentSheet } from "../components/PaymentSheet";
import { receiptText } from "../lib/receipt";
import { dayKey, ticketNumber } from "../lib/cart";
import { formatMoney } from "../lib/fx";
import { categoryColor, initials } from "../lib/products";
import { balance, depositReceiptLines, isLate, matchDeposit, readyMessage, sortDeposits, whatsappTo, type Deposit, type DepositStatus } from "../lib/deposits";

type Tab = "recu" | "pret" | "fini";

function shortDay(d: string): string {
  const [, m, dd] = d.split("-");
  return m && dd ? `${dd}/${m}` : d;
}

export function DepotsScreen() {
  const { deposits, error } = useDeposits();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("recu");
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const today = dayKey(Date.now());

  const count = (s: DepositStatus) => (deposits ?? []).filter((d) => d.status === s).length;
  const list = useMemo(() => {
    const all = deposits ?? [];
    // Une recherche cherche partout : le client revient souvent sans savoir où en est son dépôt.
    const inTab = query.trim()
      ? all.filter((d) => matchDeposit(d, query))
      : all.filter((d) => (tab === "fini" ? d.status === "retire" || d.status === "annule" : d.status === tab));
    return sortDeposits(inTab);
  }, [deposits, tab, query]);
  const late = (deposits ?? []).filter((d) => isLate(d, today)).length;

  return (
    <>
      <PageTitle
        title="Dépôts"
        sub={deposits ? (late ? `${late} en retard` : "Les affaires que vos clients vous ont laissées") : undefined}
        right={
          <Button component={Link} to="/caisse" leftSection={<IconCash size={18} />}>
            Nouveau dépôt
          </Button>
        }
      />
      <div className="sticky-tools">
        <Stack gap="xs">
          <TextInput leftSection={<IconSearch size={18} />} placeholder="N° du ticket, nom ou téléphone" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
          {!query.trim() && (
            <SegmentedControl
              fullWidth
              value={tab}
              onChange={(v) => setTab(v as Tab)}
              data={[
                { value: "recu", label: `En cours (${count("recu")})` },
                { value: "pret", label: `Prêts (${count("pret")})` },
                { value: "fini", label: "Retirés" },
              ]}
            />
          )}
        </Stack>
      </div>
      {error && <Text c="red">{error}</Text>}
      {!deposits && !error && <div className="loading">Chargement…</div>}
      {deposits && (
        <Paper p={0} style={{ overflow: "hidden" }}>
          {list.map((d) => {
            const rest = balance(d, d.currency);
            const lateNow = isLate(d, today);
            return (
              <UnstyledButton key={d.id} className="list-row" px="md" onClick={() => navigate(`/depots/${d.id}`)}>
                <span className="thumb" style={{ "--c": categoryColor(d.clientName) } as CSSProperties} aria-hidden>
                  {initials(d.clientName)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={600} truncate>
                    {d.clientName}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    N° {ticketNumber(d.id)} · {d.lines.reduce((n, l) => n + l.quantity, 0)} article(s)
                  </Text>
                </div>
                <div style={{ textAlign: "right" }}>
                  {d.status === "recu" || d.status === "pret" ? (
                    <Text size="sm" fw={600} c={lateNow ? "red" : undefined}>
                      {lateNow ? `En retard (${shortDay(d.dueDay)})` : d.dueDay === today ? "Aujourd'hui" : `Le ${shortDay(d.dueDay)}`}
                    </Text>
                  ) : (
                    <Badge variant="light" color={d.status === "annule" ? "gray" : "teal"}>
                      {d.status === "annule" ? "Annulé" : "Retiré"}
                    </Badge>
                  )}
                  {(d.status === "recu" || d.status === "pret") && (
                    <Text size="xs" c={rest > 0 ? "orange" : "teal"} className="n">
                      {rest > 0 ? `Reste ${formatMoney(rest, d.currency)}` : "Payé"}
                    </Text>
                  )}
                </div>
              </UnstyledButton>
            );
          })}
          {!list.length && (
            <Text c="dimmed" ta="center" p="xl">
              {query.trim()
                ? "Aucun dépôt ne correspond."
                : tab === "recu"
                  ? "Aucun dépôt en cours. À la caisse, ajoutez les services puis touchez « Dépôt »."
                  : tab === "pret"
                    ? "Aucun dépôt prêt pour l'instant."
                    : "Aucun dépôt retiré pour l'instant."}
            </Text>
          )}
        </Paper>
      )}
    </>
  );
}

/* ---------- Fiche d'un dépôt ---------- */

export function DepotScreen() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { boutique, permissions, subscription } = useReady();
  const actor = useActor();
  const [dep, setDep] = useState<Deposit | null>();
  const [error, setError] = useState<string>();
  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => watchDeposit(boutique.id, id, setDep, (e) => setError(errorMessage(e))), [boutique.id, id]);

  const lines = useMemo(() => (dep ? depositReceiptLines({ ...boutique.receipt, name: boutique.name }, dep) : []), [dep, boutique.receipt, boutique.name]);
  const justCreated = (location.state as { justCreated?: boolean } | null)?.justCreated === true;

  async function print() {
    try {
      if (await printReceipt(lines, boutique.paperWidthMm)) return;
    } catch (e) {
      if (["NotFoundError", "AbortError"].includes((e as Error)?.name)) return;
      notifications.show({ color: "orange", message: `Imprimante : ${(e as Error)?.message || errorMessage(e)}`, autoClose: 8000 });
    }
    window.print();
  }

  useEffect(() => {
    // Ticket du dépôt imprimé tout de suite, comme le ticket de vente (si l'option est activée).
    if (dep && justCreated && boutique.autoPrintTicket && getPrinterMode() !== "share") void print();
    // Une seule fois, à l'arrivée juste après le dépôt.
  }, [!!dep]);

  async function share() {
    if (!dep) return;
    const text = receiptText(lines, boutique.paperWidthMm);
    if (navigator.share) {
      try {
        await navigator.share({ title: `Dépôt ${ticketNumber(dep.id)}`, text });
      } catch {
        // Partage annulé.
      }
      return;
    }
    window.open(dep.clientPhone ? whatsappTo(dep.clientPhone, text) : `https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  function handOver() {
    if (!dep) return;
    if (balance(dep, dep.currency) > 0) return setPayOpen(true);
    pickUp(actor, dep);
    notifications.show({ color: "teal", message: "Affaires remises au client." });
  }

  if (error) return <Text c="red">{error}</Text>;
  if (dep === undefined) return <div className="loading">Chargement…</div>;
  if (dep === null)
    return (
      <>
        <PageTitle title="Dépôt introuvable" />
        <Button component={Link} to="/depots">
          Retour aux dépôts
        </Button>
      </>
    );

  const rest = balance(dep, dep.currency);
  const open = dep.status === "recu" || dep.status === "pret";
  const late = isLate(dep, dayKey(Date.now()));
  const readOnly = subscription.readOnly;

  return (
    <>
      <PageTitle
        title={`Dépôt ${ticketNumber(dep.id)}`}
        sub={dep.clientName}
        right={
          dep.synced ? (
            <Badge color="teal" variant="light" leftSection={<IconCloudCheck size={14} />}>
              Envoyé
            </Badge>
          ) : (
            <Badge color="orange" variant="light" leftSection={<IconCloudUpload size={14} />}>
              En attente d'envoi
            </Badge>
          )
        }
      />
      {justCreated && open && (
        <div className="sale-ok" role="status">
          <span className="check">
            <IconCheck size={24} stroke={2.6} />
          </span>
          <div>
            <b>Dépôt enregistré</b>
            <span>Donnez le ticket au client : il le présentera au retrait.</span>
          </div>
        </div>
      )}
      {late && (
        <Alert color="red" mb="md" title="En retard">
          Le retrait était prévu le {shortDay(dep.dueDay)}.
        </Alert>
      )}
      {dep.status === "annule" && (
        <Alert color="gray" mb="md" title="Dépôt annulé">
          {dep.cancelReason}
        </Alert>
      )}
      {dep.status === "retire" && (
        <Alert color="teal" mb="md" title="Retiré">
          {dep.pickedUpByName && `Remis au client par ${dep.pickedUpByName}`}
          {dep.pickedUpAtMs ? ` le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(dep.pickedUpAtMs)}.` : "."}
        </Alert>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        <Receipt lines={lines} width={boutique.paperWidthMm} />
        <Stack style={{ flex: "1 1 240px" }} gap="xs" className="no-print">
          {open && (
            <Paper p="md" mb="xs">
              <Group justify="space-between">
                <Text c="dimmed">Étape</Text>
                <Badge size="lg" variant="light" color={dep.status === "pret" ? "teal" : "blue"}>
                  {dep.status === "pret" ? "Prêt" : "En cours"}
                </Badge>
              </Group>
              <Group justify="space-between" mt="xs">
                <Text c="dimmed">Reste à payer</Text>
                <Text fw={700} className="n" c={rest > 0 ? "orange" : "teal"}>
                  {rest > 0 ? formatMoney(rest, dep.currency) : "Tout est payé"}
                </Text>
              </Group>
            </Paper>
          )}
          {open && dep.status === "recu" && (
            <Button size="lg" leftSection={<IconCheck size={20} />} disabled={readOnly} onClick={() => markReady(actor, dep)}>
              C'est prêt
            </Button>
          )}
          {dep.status === "pret" && (
            <Button
              size="lg"
              color="green"
              leftSection={<IconBrandWhatsapp size={20} />}
              component="a"
              href={dep.clientPhone ? whatsappTo(dep.clientPhone, readyMessage(boutique.name, dep)) : undefined}
              target="_blank"
              rel="noopener"
              disabled={!dep.clientPhone}
            >
              Prévenir sur WhatsApp
            </Button>
          )}
          {dep.status === "pret" && !dep.clientPhone && (
            <Text size="sm" c="dimmed">
              Pas de numéro pour ce client : ajoutez-le dans Clients pour le prévenir.
            </Text>
          )}
          {open && (
            <Button size="lg" className="sun-btn" leftSection={<IconCash size={20} />} disabled={readOnly} onClick={handOver}>
              {rest > 0 ? (
                <>
                  Retrait : encaisser <span className="n" style={{ marginLeft: 6 }}>{formatMoney(rest, dep.currency)}</span>
                </>
              ) : (
                "Remis au client"
              )}
            </Button>
          )}
          <Button variant="default" leftSection={<IconPrinter size={18} />} onClick={() => void print()}>
            Imprimer le ticket
          </Button>
          <Button variant="default" leftSection={<IconShare size={18} />} onClick={() => void share()}>
            Envoyer le ticket (WhatsApp, SMS…)
          </Button>
          {dep.status === "pret" && (
            <Button variant="subtle" color="gray" leftSection={<IconArrowBackUp size={18} />} disabled={readOnly} onClick={() => markNotReady(actor, dep)}>
              Pas encore prêt
            </Button>
          )}
          {open && permissions.editPrices && dep.paid === 0 && (
            <Button variant="subtle" color="red" leftSection={<IconReceiptOff size={18} />} disabled={readOnly} onClick={() => setCancelOpen(true)}>
              Annuler le dépôt
            </Button>
          )}
          {open && permissions.editPrices && dep.paid > 0 && (
            <Text size="xs" c="dimmed">
              Pour annuler ce dépôt, annulez d'abord la vente de l'avance dans Ventes : l'argent sortira de la caisse.
            </Text>
          )}
          <Button variant="subtle" component={Link} to="/depots">
            Tous les dépôts
          </Button>
        </Stack>
      </div>

      <PaymentSheet
        opened={payOpen}
        onClose={() => setPayOpen(false)}
        total={rest}
        initialCurrency={boutique.currency}
        title="Retrait du dépôt"
        hint={dep.paid > 0 ? `Déjà payé : ${formatMoney(dep.paid, dep.currency)}` : undefined}
        submitLabel="Encaisser et remettre"
        onPaid={(input, result) => {
          const saleId = pickUp(actor, dep, { input, result });
          setPayOpen(false);
          navigate(`/ticket/${saleId}`, { state: { justSold: true } });
        }}
      />
      <CancelDepositModal dep={dep} opened={cancelOpen} onClose={() => setCancelOpen(false)} />
    </>
  );
}

function CancelDepositModal({ dep, opened, onClose }: { dep: Deposit; opened: boolean; onClose: () => void }) {
  const actor = useActor();
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (opened) setReason("");
  }, [opened]);
  return (
    <Modal opened={opened} onClose={onClose} title="Annuler ce dépôt ?">
      <Stack>
        <Text size="sm">Le dépôt restera visible comme « annulé ». Rien n'a été payé, la caisse ne change pas.</Text>
        <TextInput label="Motif" required maxLength={200} autoFocus value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Garder le dépôt
          </Button>
          <Button
            color="red"
            disabled={!reason.trim()}
            onClick={() => {
              cancelDeposit(actor, dep, reason);
              onClose();
            }}
          >
            Annuler le dépôt
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
