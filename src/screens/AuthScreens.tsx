/** Connexion, inscription (e-mail ou Google) et mot de passe oublié. */
import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { Alert, Anchor, Box, Button, Divider, Group, Paper, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconBrandGoogle, IconWifiOff } from "@tabler/icons-react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { getFirebaseAuth } from "../data/firebase";
import { errorMessage } from "../data/errors";
import { useSyncState } from "../data/sync";

/** Site de présentation, où se trouvent les conditions d'utilisation et la politique de confidentialité. */
const SITE_URL = "https://vitepos-rdc.web.app";

export function AuthCard({ title, sub, children }: { title: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <Box mih="100vh">
      <Box className="app-header" py="sm" mb={32} ta="center">
        <Group gap={10} justify="center">
          <img src="/favicon.svg" alt="" width={34} height={34} style={{ borderRadius: 7 }} />
          <span className="brand">vitePOS</span>
        </Group>
      </Box>
      <Box px="md" pb="xl">
        <Paper maw={420} mx="auto" p="lg" shadow="xs">
          <Title order={2} mb={4}>
            {title}
          </Title>
          {sub && (
            <Text c="dimmed" size="sm" mb="md">
              {sub}
            </Text>
          )}
          {children}
        </Paper>
      </Box>
    </Box>
  );
}

function OfflineHint() {
  const { online } = useSyncState();
  if (online) return null;
  return (
    <Alert color="brick" icon={<IconWifiOff size={18} />} my="sm">
      Vous êtes hors ligne. La connexion et l'inscription ont besoin d'internet.
    </Alert>
  );
}

/**
 * Connexion avec un compte Google. Un nouveau compte suit le même parcours
 * que l'inscription par e-mail (il choisit ensuite de créer ou de rejoindre une boutique).
 */
function GoogleButton({ label }: { label: string }) {
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function go() {
    setError(undefined);
    setBusy(true);
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, provider).catch((e) => setError(errorMessage(e)));
      } else if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError(errorMessage(err));
      }
      setBusy(false);
    }
  }

  return (
    <>
      <Divider label="ou" labelPosition="center" my="md" />
      <Button variant="default" fullWidth loading={busy} leftSection={<IconBrandGoogle size={18} />} onClick={go}>
        {label}
      </Button>
      {error && (
        <Text c="red" size="sm" mt="xs">
          {error}
        </Text>
      )}
    </>
  );
}

function Links({ children }: { children: ReactNode }) {
  return (
    <Group justify="space-between" mt="lg" gap="sm">
      {children}
    </Group>
  );
}

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Se connecter">
      <OfflineHint />
      <form onSubmit={submit}>
        <Stack>
          <TextInput label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
          <PasswordInput
            label="Mot de passe"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          {error && <Text c="red" size="sm">{error}</Text>}
          <Button type="submit" fullWidth loading={busy}>
            Se connecter
          </Button>
        </Stack>
      </form>
      <GoogleButton label="Se connecter avec Google" />
      <Links>
        <Anchor component={Link} to="/mot-de-passe" size="sm">
          Mot de passe oublié ?
        </Anchor>
        <Anchor component={Link} to="/inscription" size="sm" fw={600}>
          Créer un compte
        </Anchor>
      </Links>
    </AuthCard>
  );
}

export function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (password !== confirm) return setError("Les deux mots de passe ne sont pas identiques.");
    setBusy(true);
    try {
      // La fiche agent est créée automatiquement dès que la session s'ouvre (voir session.tsx).
      await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Créer un compte"
      sub="Après l'inscription, vous pourrez créer votre boutique ou rejoindre celle de votre patron avec son code d'invitation."
    >
      <OfflineHint />
      <form onSubmit={submit}>
        <Stack>
          <TextInput label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
          <PasswordInput
            label="Mot de passe"
            description="6 caractères minimum"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <PasswordInput
            label="Confirmer le mot de passe"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.currentTarget.value)}
          />
          {error && <Text c="red" size="sm">{error}</Text>}
          <Button type="submit" fullWidth loading={busy}>
            Créer mon compte
          </Button>
        </Stack>
      </form>
      <GoogleButton label="S'inscrire avec Google" />
      <Text size="xs" c="dimmed" ta="center" mt="sm">
        En créant un compte, vous acceptez les{" "}
        <Anchor href={`${SITE_URL}/conditions`} target="_blank" size="xs">
          conditions d'utilisation
        </Anchor>{" "}
        et la{" "}
        <Anchor href={`${SITE_URL}/confidentialite`} target="_blank" size="xs">
          politique de confidentialité
        </Anchor>
        .
      </Text>
      <Links>
        <Anchor component={Link} to="/connexion" size="sm">
          J'ai déjà un compte
        </Anchor>
      </Links>
    </AuthCard>
  );
}

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    }
    setBusy(false);
  }

  return (
    <AuthCard title="Mot de passe oublié">
      <OfflineHint />
      {sent ? (
        <Alert color="navy">
          Si un compte existe pour <b>{email}</b>, un e-mail vient d'être envoyé avec un lien pour choisir un nouveau
          mot de passe. Pensez à regarder dans les courriers indésirables.
        </Alert>
      ) : (
        <form onSubmit={submit}>
          <Stack>
            <TextInput label="E-mail du compte" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
            {error && <Text c="red" size="sm">{error}</Text>}
            <Button type="submit" fullWidth loading={busy}>
              Recevoir le lien par e-mail
            </Button>
          </Stack>
        </form>
      )}
      <Links>
        <Anchor component={Link} to="/connexion" size="sm">
          Retour à la connexion
        </Anchor>
      </Links>
    </AuthCard>
  );
}
