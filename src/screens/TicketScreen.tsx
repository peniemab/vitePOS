/** Ticket d'une vente : aperçu, impression (navigateur ou thermique), partage, annulation. */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { Alert, Badge, Button, Group, Modal, Paper, Stack, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCash, IconCloudCheck, IconCloudUpload, IconPrinter, IconReceiptOff, IconShare } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useActor } from "../data/products";
import { cancelSale, watchSale } from "../data/sales";
import { errorMessage } from "../data/errors";
import { getPrinterMode, printReceipt } from "../data/printer";
import { PageTitle } from "../components/ui";
import { receiptLines, receiptText, type ReceiptLine } from "../lib/receipt";
import { canCancelSale, type Sale } from "../lib/sales";
import { ticketNumber } from "../lib/cart";

export function TicketScreen() {
  const { id = "" } = useParams();
  const location = useLocation();
  const { boutique, permissions } = useReady();
  const [sale, setSale] = useState<Sale | null>();
  const [error, setError] = useState<string>();
  const [cancelOpen, setCancelOpen] = useState(false);
  const autoPrinted = useRef(false);

  useEffect(() => watchSale(boutique.id, id, setSale, (e) => setError(errorMessage(e))), [boutique.id, id]);

  const lines = sale ? receiptLines({ name: boutique.name }, sale) : [];
  const justSold = (location.state as { justSold?: boolean } | null)?.justSold === true;

  async function print() {
    if (!sale) return;
    try {
      // Imprimante thermique choisie dans Paramètres (Bluetooth, RawBT ou USB) ; sinon, fenêtre d'impression.
      if (await printReceipt(lines, boutique.paperWidthMm)) return;
    } catch (e) {
      // Choix de l'imprimante annulé : on ne dit rien. Autre souci : on l'explique, puis fenêtre d'impression.
      if (["NotFoundError", "AbortError"].includes((e as Error)?.name)) return;
      notifications.show({ color: "orange", message: `Imprimante : ${(e as Error)?.message || errorMessage(e)}`, autoClose: 8000 });
    }
    window.print();
  }

  useEffect(() => {
    // En mode partage (Thermer…), le téléphone exige un toucher : pas d'impression automatique.
    if (sale && justSold && boutique.autoPrintTicket && !autoPrinted.current && getPrinterMode() !== "share") {
      autoPrinted.current = true;
      void print();
    }
    // Impression automatique une seule fois, à l'arrivée sur le ticket juste après la vente.
  }, [sale, justSold, boutique.autoPrintTicket]);

  async function share() {
    if (!sale) return;
    const text = receiptText(lines, boutique.paperWidthMm);
    if (navigator.share) {
      try {
        await navigator.share({ title: `Ticket ${ticketNumber(sale.id)}`, text });
        return;
      } catch {
        return; // Partage annulé par l'utilisateur.
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  if (error) return <Text c="red">{error}</Text>;
  if (sale === undefined) return <div className="loading">Chargement…</div>;
  if (sale === null)
    return (
      <>
        <PageTitle title="Ticket introuvable" />
        <Button component={Link} to="/caisse">
          Retour à la caisse
        </Button>
      </>
    );

  return (
    <>
      <PageTitle
        title={`Ticket ${ticketNumber(sale.id)}`}
        right={
          sale.synced ? (
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
      {justSold && sale.status === "validee" && (
        <Alert color="teal" mb="md" title="Vente enregistrée">
          {sale.payment.method === "especes" && sale.payment.change > 0
            ? "N'oubliez pas de rendre la monnaie."
            : "Le stock a été mis à jour."}
        </Alert>
      )}
      {sale.status === "annulee" && (
        <Alert color="red" mb="md" title="Vente annulée">
          {sale.cancelledByName && `Par ${sale.cancelledByName}. `}
          {sale.cancelReason}
        </Alert>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        <Receipt lines={lines} />
        <Stack style={{ flex: "1 1 220px" }} gap="xs" className="no-print">
          <Button component={Link} to="/caisse" size="lg" leftSection={<IconCash size={20} />}>
            Nouvelle vente
          </Button>
          <Button variant="default" leftSection={<IconPrinter size={18} />} onClick={() => void print()}>
            Imprimer
          </Button>
          <Button variant="default" leftSection={<IconShare size={18} />} onClick={() => void share()}>
            Partager (WhatsApp, SMS…)
          </Button>
          {permissions.editPrices && canCancelSale(sale) && (
            <Button variant="subtle" color="red" leftSection={<IconReceiptOff size={18} />} onClick={() => setCancelOpen(true)}>
              Annuler la vente
            </Button>
          )}
        </Stack>
      </div>

      <CancelModal sale={sale} opened={cancelOpen} onClose={() => setCancelOpen(false)} />
    </>
  );
}

/** Le ticket tel qu'il sort de l'imprimante (seul élément imprimé par le navigateur). */
function Receipt({ lines }: { lines: ReceiptLine[] }) {
  return (
    <Paper className="receipt" p="md" shadow="xs">
      {lines.map((l, i) => {
        switch (l.kind) {
          case "title":
            return (
              <div key={i} className="receipt-title">
                {l.text}
              </div>
            );
          case "center":
            return (
              <div key={i} style={{ textAlign: "center" }}>
                {l.text}
              </div>
            );
          case "text":
            return <div key={i}>{l.text}</div>;
          case "pair":
            return (
              <div key={i} className="receipt-pair" style={{ fontWeight: l.strong ? 700 : undefined, fontSize: l.strong ? "1.1em" : undefined }}>
                <span>{l.left}</span>
                <span>{l.right}</span>
              </div>
            );
          case "rule":
            return <hr key={i} className="receipt-rule" />;
        }
      })}
    </Paper>
  );
}

function CancelModal({ sale, opened, onClose }: { sale: Sale; opened: boolean; onClose: () => void }) {
  const actor = useActor();
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (opened) setReason("");
  }, [opened]);

  return (
    <Modal opened={opened} onClose={onClose} title="Annuler cette vente ?">
      <Stack>
        <Text size="sm">
          Les articles seront remis en stock et la vente restera visible comme « annulée ». Cette opération ne peut pas
          être défaite.
        </Text>
        <TextInput label="Motif" required maxLength={200} autoFocus value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Garder la vente
          </Button>
          <Button
            color="red"
            disabled={!reason.trim()}
            onClick={() => {
              cancelSale(actor, sale, reason);
              onClose();
            }}
          >
            Annuler la vente
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
