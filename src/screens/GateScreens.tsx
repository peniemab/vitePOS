/** Écrans affichés avant l'accès à la caisse : chargement, création ou adhésion, attente de validation. */
import { useState, type FormEvent } from "react";
import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Code,
  Group,
  Loader,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconBuildingStore, IconUsersPlus, IconWifiOff } from "../components/icons";
import type { User } from "firebase/auth";
import { AuthCard } from "./AuthScreens";
import { logout } from "../data/session";
import { createBoutique, joinBoutique, leaveBoutique, type Boutique, type Member, type Profile } from "../data/boutique";
import { errorMessage } from "../data/errors";
import { useSyncState } from "../data/sync";
import { CURRENCIES, CURRENCY_LIST, type Currency } from "../lib/fx";
import { PLAN_ORDER, planPriceLabel, PLANS, type Plan } from "../lib/subscription";

export function LoadingScreen({ text = "Chargement…" }: { text?: string }) {
  return (
    <Group justify="center" py={80} c="dimmed">
      <Loader size="sm" color="brick" />
      <Text c="dimmed">{text}</Text>
    </Group>
  );
}

function LogoutLink() {
  return (
    <Group mt="lg">
      <Anchor component="button" size="sm" onClick={() => void logout()}>
        Se déconnecter
      </Anchor>
    </Group>
  );
}

function OnlineRequired() {
  const { online } = useSyncState();
  if (online) return null;
  return (
    <Alert color="brick" icon={<IconWifiOff size={18} />} mb="md">
      Vous êtes hors ligne. Cette étape a besoin d'internet.
    </Alert>
  );
}

export function ConfigMissingScreen() {
  return (
    <AuthCard title="Configuration manquante">
      <Text>
        L'application n'est pas encore reliée à Firebase. Il faut créer le fichier <Code>.env.local</Code> à partir de{" "}
        <Code>.env.example</Code> et y coller la configuration de votre projet Firebase, puis relancer{" "}
        <Code>npm run dev</Code>.
      </Text>
    </AuthCard>
  );
}

export function NoProfileScreen({ error, offline }: { error?: string; offline: boolean }) {
  return (
    <AuthCard title="Finalisation du compte">
      {error ? (
        <Text c="red">{error}</Text>
      ) : offline ? (
        <Alert color="brick">
          Votre compte n'est pas encore enregistré sur cet appareil. Connectez-vous à internet pour terminer
          l'inscription.
        </Alert>
      ) : (
        <Text>Enregistrement de votre compte…</Text>
      )}
      <LogoutLink />
    </AuthCard>
  );
}

/** Premier passage : créer sa boutique ou rejoindre celle de son patron. */
export function OnboardingScreen({ user, profile }: { user: User; profile: Profile }) {
  const [mode, setMode] = useState<"create" | "join">("create");
  return (
    <AuthCard title="Bienvenue" sub={<>Connecté avec <b>{profile.email}</b>.</>}>
      <OnlineRequired />
      <SegmentedControl
        fullWidth
        mb="md"
        value={mode}
        onChange={(v) => setMode(v as "create" | "join")}
        data={[
          { value: "create", label: "Gérer mon activité" },
          { value: "join", label: "Rejoindre" },
        ]}
      />
      {mode === "create" ? <CreateForm user={user} profile={profile} /> : <JoinForm user={user} profile={profile} />}
      <LogoutLink />
    </AuthCard>
  );
}

function CreateForm({ user, profile }: { user: User; profile: Profile }) {
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState(profile.name);
  const [currency, setCurrency] = useState<Currency>("CDF");
  // Essai sur la formule Pro par défaut : l'essai le plus long et toute l'équipe dès le départ.
  const [plan, setPlan] = useState<Plan>("pro");
  const [rate, setRate] = useState<number | string>(2850);
  const [eurRate, setEurRate] = useState<number | string>("");
  // L'euro et le choix de la formule restent repliés : la plupart des commerces n'en ont pas besoin pour démarrer.
  const [usesEuro, setUsesEuro] = useState(false);
  const [choosingPlan, setChoosingPlan] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    const usdRateCdf = Number(rate);
    if (!(usdRateCdf > 0)) return setError("Entrez le taux du dollar (combien de FC pour 1 $).");
    const eurRateCdf = usesEuro || currency === "EUR" ? Number(eurRate) || 0 : 0;
    if (currency === "EUR" && !(eurRateCdf > 0)) return setError("Entrez le taux de l'euro (combien de FC pour 1 €).");
    setBusy(true);
    try {
      // La session bascule toute seule sur la boutique dès que l'écriture est confirmée.
      await createBoutique(user, { name, ownerName, plan, currency, usdRateCdf, eurRateCdf });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Stack>
        <TextInput label="Nom de votre activité" required maxLength={80} value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <TextInput label="Votre nom" required maxLength={80} value={ownerName} onChange={(e) => setOwnerName(e.currentTarget.value)} />
        <div>
          <Text size="sm" fw={500} mb={4}>
            Devise des prix
          </Text>
          <SegmentedControl
            fullWidth
            value={currency}
            onChange={(v) => setCurrency(v as Currency)}
            data={CURRENCY_LIST.map((c) => ({ value: c, label: `${CURRENCIES[c].short} (${CURRENCIES[c].symbol})` }))}
          />
        </div>
        <NumberInput
          label="Taux du jour"
          description="Combien de FC pour 1 $ (modifiable ensuite)"
          required
          min={1}
          thousandSeparator=" "
          hideControls
          inputMode="decimal"
          value={rate}
          onChange={setRate}
        />
        {usesEuro || currency === "EUR" ? (
          <NumberInput
            label="Taux de l'euro"
            description="Combien de FC pour 1 €"
            required
            min={1}
            thousandSeparator=" "
            hideControls
            inputMode="decimal"
            value={eurRate}
            onChange={setEurRate}
          />
        ) : (
          <Checkbox label="J'accepte aussi les euros" checked={usesEuro} onChange={(e) => setUsesEuro(e.currentTarget.checked)} />
        )}
        <div>
          <Text size="sm">
            Formule <b>{PLANS[plan].name}</b> ({PLANS[plan].phones.toLowerCase()}) : gratuite pendant {PLANS[plan].trialDays} jours,
            puis {planPriceLabel(plan)}.{" "}
            {!choosingPlan && (
              <Anchor component="button" type="button" size="sm" onClick={() => setChoosingPlan(true)}>
                Changer
              </Anchor>
            )}
          </Text>
          {choosingPlan && (
            <>
              <SegmentedControl
                fullWidth
                mt="xs"
                value={plan}
                onChange={(v) => setPlan(v as Plan)}
                data={PLAN_ORDER.map((k) => ({ value: k, label: PLANS[k].name }))}
              />
              <Text size="xs" c="dimmed" mt={4}>
                {PLANS[plan].audience}. Vous pourrez encore changer pendant l'essai.
              </Text>
            </>
          )}
        </div>
        {error && <Text c="red" size="sm">{error}</Text>}
        <Button type="submit" fullWidth size="md" className="sun-btn" loading={busy} leftSection={<IconBuildingStore size={18} />}>
          Créer mon activité
        </Button>
      </Stack>
    </form>
  );
}

function JoinForm({ user, profile }: { user: User; profile: Profile }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState(profile.name);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      await joinBoutique(user, code, name);
    } catch (err) {
      setError(err instanceof Error && !("code" in err) ? err.message : errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Stack>
        <TextInput
          label="Code d'invitation"
          description="6 caractères, donnés par votre patron"
          required
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.currentTarget.value.toUpperCase())}
        />
        <TextInput label="Votre nom" required maxLength={80} value={name} onChange={(e) => setName(e.currentTarget.value)} />
        {error && <Text c="red" size="sm">{error}</Text>}
        <Button type="submit" fullWidth loading={busy} leftSection={<IconUsersPlus size={18} />}>
          Envoyer la demande
        </Button>
      </Stack>
    </form>
  );
}

function ChooseAnotherLink({ uid }: { uid: string }) {
  const [error, setError] = useState<string>();
  return (
    <>
      <Anchor component="button" size="sm" mt="md" onClick={() => leaveBoutique(uid).catch((e) => setError(errorMessage(e)))}>
        Rejoindre ou créer une autre activité
      </Anchor>
      {error && <Text c="red" size="sm">{error}</Text>}
    </>
  );
}

export function PendingScreen({ member, boutique }: { member: Member; boutique: Boutique | null }) {
  return (
    <AuthCard title="Demande envoyée">
      <Text>
        Votre demande pour rejoindre <b>{boutique?.name || "l'activité"}</b> est bien envoyée. Le propriétaire doit
        maintenant la valider depuis l'écran Équipe.
      </Text>
      <Text c="dimmed" size="sm" mt="sm">
        Cette page se mettra à jour toute seule dès que votre accès sera validé.
      </Text>
      <ChooseAnotherLink uid={member.uid} />
      <LogoutLink />
    </AuthCard>
  );
}

export function DisabledScreen({ member, boutique }: { member: Member; boutique: Boutique | null }) {
  return (
    <AuthCard title="Accès désactivé">
      <Text>
        Votre accès à <b>{boutique?.name || "l'activité"}</b> a été désactivé par le propriétaire. Contactez-le si vous
        pensez qu'il s'agit d'une erreur.
      </Text>
      <ChooseAnotherLink uid={member.uid} />
      <LogoutLink />
    </AuthCard>
  );
}
