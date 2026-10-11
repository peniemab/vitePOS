/** Équipe (propriétaire) : code d'invitation, demandes à valider, rôles et désactivation. */
import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { ActionIcon, Badge, Button, CopyButton, Group, Paper, Select, Stack, Text, Title, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useReady } from "../data/session";
import { updateMember, watchMembers, type Member } from "../data/boutique";
import { errorMessage } from "../data/errors";
import { useSyncState } from "../data/sync";
import { PageTitle } from "../components/ui";
import { canManageTeam, ROLE_LABELS, STATUS_LABELS, type Role } from "../lib/roles";

function save(p: Promise<void>) {
  p.catch((e) => notifications.show({ color: "red", title: "Modification refusée", message: errorMessage(e) }));
}

export function TeamScreen() {
  const { boutique, member: me } = useReady();
  const { online } = useSyncState();
  const [members, setMembers] = useState<Member[]>();
  const [error, setError] = useState<string>();

  useEffect(() => watchMembers(boutique.id, setMembers, (e) => setError(errorMessage(e))), [boutique.id]);

  if (!canManageTeam(me.role)) return <Navigate to="/plus" replace />;

  const pending = members?.filter((m) => m.status === "pending") ?? [];
  const others = members?.filter((m) => m.status !== "pending") ?? [];

  return (
    <>
      <PageTitle title="Équipe" sub="Chaque employé se connecte avec son propre compte." />

      <Paper p="md" mb="lg">
        <Text size="sm" c="dimmed">
          Code d'invitation à donner à vos employés
        </Text>
        <Group gap="xs">
          <span className="invite-code">{boutique.inviteCode}</span>
          <CopyButton value={boutique.inviteCode}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? "Copié" : "Copier"}>
                <ActionIcon variant="subtle" onClick={copy} aria-label="Copier le code">
                  {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </Group>
        <Text size="sm" c="dimmed">
          Ils créent un compte, choisissent « Rejoindre » et entrent ce code. Vous validez ensuite leur demande ici.
        </Text>
      </Paper>

      {!online && (
        <Text c="dimmed" size="sm" mb="md">
          Hors ligne : les modifications de l'équipe seront envoyées au retour du réseau.
        </Text>
      )}
      {error && <Text c="red" mb="md">{error}</Text>}
      {!members && !error && <div className="loading">Chargement…</div>}

      {pending.length > 0 && (
        <>
          <Title order={3} mb="xs">
            Demandes à valider
          </Title>
          <Stack mb="lg" gap="xs">
            {pending.map((m) => (
              <Paper key={m.uid} p="md">
                <Group justify="space-between" wrap="wrap">
                  <MemberLabel member={m} />
                  <Group gap="xs">
                    <Button size="sm" onClick={() => save(updateMember(boutique.id, m.uid, { status: "active" }))}>
                      Valider
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => save(updateMember(boutique.id, m.uid, { status: "disabled" }))}
                    >
                      Refuser
                    </Button>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        </>
      )}

      {others.length > 0 && (
        <>
          <Title order={3} mb="xs">
            Membres
          </Title>
          <Paper p={0} style={{ overflow: "hidden" }}>
            {others.map((m) => (
              <div key={m.uid} className="list-row" style={{ padding: "12px 16px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <MemberLabel member={m} />
                </div>
                {m.uid === me.uid ? (
                  <Badge variant="light">{ROLE_LABELS[m.role]}</Badge>
                ) : (
                  <Group gap="xs">
                    <Select
                      size="sm"
                      w={130}
                      aria-label="Rôle"
                      value={m.role}
                      data={(["gerant", "vendeur"] as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                      onChange={(v) => v && save(updateMember(boutique.id, m.uid, { role: v as Role }))}
                    />
                    <Button
                      size="sm"
                      variant={m.status === "active" ? "default" : "light"}
                      color={m.status === "active" ? "red" : undefined}
                      onClick={() =>
                        save(updateMember(boutique.id, m.uid, { status: m.status === "active" ? "disabled" : "active" }))
                      }
                    >
                      {m.status === "active" ? "Désactiver" : "Réactiver"}
                    </Button>
                  </Group>
                )}
              </div>
            ))}
          </Paper>
        </>
      )}
    </>
  );
}

function MemberLabel({ member }: { member: Member }) {
  return (
    <div style={{ minWidth: 0 }}>
      <Group gap={6}>
        <Text fw={600} truncate>
          {member.name || member.email}
        </Text>
        {member.status !== "active" && (
          <Badge size="xs" color={member.status === "pending" ? "orange" : "gray"} variant="light">
            {STATUS_LABELS[member.status]}
          </Badge>
        )}
      </Group>
      <Text size="xs" c="dimmed" truncate>
        {member.email}
      </Text>
    </div>
  );
}
