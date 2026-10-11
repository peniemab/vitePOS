/** Clients : recherche, fiche (nom, téléphone, notes) et historique des achats. */
import { useDeferredValue, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Anchor, Badge, Button, Group, Modal, Paper, Stack, Tabs, Text, TextInput, Textarea, UnstyledButton } from "@mantine/core";
import { IconPhone, IconPlus, IconSearch } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { useActor } from "../data/products";
import { createClient, updateClient, useClients } from "../data/clients";
import { watchClientSales } from "../data/sales";
import { errorMessage } from "../data/errors";
import { Money, PageTitle } from "../components/ui";
import { ticketNumber } from "../lib/cart";
import { matchClient, validateClient, type Client } from "../lib/clients";
import type { Sale } from "../lib/sales";

export function ClientsScreen() {
  const { boutique } = useReady();
  const { clients, error } = useClients();
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const list = useMemo(() => (clients ?? []).filter((c) => matchClient(c, query)), [clients, query]);
  const opened = openId ? clients?.find((c) => c.id === openId) ?? null : null;

  return (
    <>
      <PageTitle
        title="Clients"
        sub={clients ? `${clients.length} client${clients.length > 1 ? "s" : ""}` : undefined}
        right={
          <Button leftSection={<IconPlus size={18} />} onClick={() => setCreating(true)}>
            Ajouter
          </Button>
        }
      />
      <div className="sticky-tools">
        <TextInput leftSection={<IconSearch size={18} />} placeholder="Nom ou numéro" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
      </div>
      {error && <Text c="red">{error}</Text>}
      {!clients && !error && <div className="loading">Chargement…</div>}
      {clients && (
        <Paper p={0} style={{ overflow: "hidden" }}>
          {list.map((c) => (
            <UnstyledButton key={c.id} className="list-row" px="md" onClick={() => setOpenId(c.id)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text fw={600} truncate>
                  {c.name}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {c.phone || "Sans numéro"}
                </Text>
              </div>
              <div style={{ textAlign: "right" }}>
                <Text fw={600}>
                  <Money value={c.totalSpent} currency={boutique.currency} />
                </Text>
                <Text size="xs" c="dimmed">
                  {c.purchaseCount} achat{c.purchaseCount > 1 ? "s" : ""}
                </Text>
              </div>
            </UnstyledButton>
          ))}
          {!list.length && (
            <Text c="dimmed" ta="center" p="xl">
              {clients.length ? "Aucun client ne correspond." : "Aucun client pour l'instant. Ajoutez-en un ici ou à la caisse."}
            </Text>
          )}
        </Paper>
      )}

      <ClientModal client={opened} opened={!!opened} onClose={() => setOpenId(null)} />
      <ClientModal client={null} opened={creating} onClose={() => setCreating(false)} />
    </>
  );
}

/** Fiche client : création, modification et (pour un client existant) ses achats. */
export function ClientModal({
  client,
  opened,
  onClose,
  onCreated,
}: {
  client: Client | null;
  opened: boolean;
  onClose: () => void;
  onCreated?: (c: { id: string; name: string }) => void;
}) {
  return (
    <Modal opened={opened} onClose={onClose} title={client ? client.name : "Nouveau client"} size="lg">
      {opened &&
        (client ? (
          <Tabs defaultValue="fiche" keepMounted={false}>
            <Tabs.List mb="md">
              <Tabs.Tab value="fiche">Fiche</Tabs.Tab>
              <Tabs.Tab value="achats">Achats ({client.purchaseCount})</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="fiche">
              <ClientForm client={client} onDone={onClose} />
            </Tabs.Panel>
            <Tabs.Panel value="achats">
              <ClientSales client={client} />
            </Tabs.Panel>
          </Tabs>
        ) : (
          <ClientForm
            client={null}
            onDone={onClose}
            onCreated={(c) => {
              onCreated?.(c);
              onClose();
            }}
          />
        ))}
    </Modal>
  );
}

function ClientForm({ client, onDone, onCreated }: { client: Client | null; onDone: () => void; onCreated?: (c: { id: string; name: string }) => void }) {
  const actor = useActor();
  const [name, setName] = useState(client?.name ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [error, setError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const checked = validateClient(name, phone);
    if ("error" in checked) return setError(checked.error);
    const input = { ...checked, notes: notes.trim().slice(0, 500) };
    if (client) {
      updateClient(actor, client.id, input);
      onDone();
    } else {
      const id = createClient(actor, input);
      if (onCreated) onCreated({ id, name: input.name });
      else onDone();
    }
  }

  return (
    <form onSubmit={submit}>
      <Stack>
        <TextInput label="Nom" required autoFocus={!client} maxLength={80} value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <TextInput
          label="Téléphone"
          type="tel"
          inputMode="tel"
          maxLength={30}
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value)}
          rightSection={
            client?.phone ? (
              <Anchor href={`tel:${client.phone.replace(/\s/g, "")}`} aria-label="Appeler" c="dimmed">
                <IconPhone size={18} />
              </Anchor>
            ) : undefined
          }
        />
        <Textarea label="Notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />
        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}
        <Button type="submit">{client ? "Enregistrer" : "Ajouter le client"}</Button>
      </Stack>
    </form>
  );
}

function ClientSales({ client }: { client: Client }) {
  const { boutique } = useReady();
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>();
  const [error, setError] = useState<string>();
  useEffect(() => watchClientSales(boutique.id, client.id, setSales, (e) => setError(errorMessage(e))), [boutique.id, client.id]);

  if (error) return <Text c="red">{error}</Text>;
  if (!sales) return <div className="loading">Chargement…</div>;
  if (!sales.length)
    return (
      <Text c="dimmed" ta="center" py="lg">
        Aucun achat pour l'instant.
      </Text>
    );
  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });
  return (
    <div>
      {sales.map((s) => (
        <UnstyledButton key={s.id} className="list-row" onClick={() => navigate(`/ticket/${s.id}`)}>
          <div style={{ flex: 1 }}>
            <Group gap={6}>
              <Text fw={600} size="sm">
                {ticketNumber(s.id)}
              </Text>
              {s.status === "annulee" && (
                <Badge size="xs" color="red" variant="light">
                  Annulée
                </Badge>
              )}
            </Group>
            <Text size="xs" c="dimmed">
              {s.createdAtMs ? fmt.format(s.createdAtMs) : "—"} · {s.lines.length} article{s.lines.length > 1 ? "s" : ""}
            </Text>
          </div>
          <Text fw={600}>
            <Money value={s.total} currency={boutique.currency} />
          </Text>
        </UnstyledButton>
      ))}
    </div>
  );
}
