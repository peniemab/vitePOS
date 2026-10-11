/**
 * Session : compte Firebase connecté → sa fiche → sa boutique et son statut de membre.
 * La session reste ouverte hors ligne (tout est gardé dans le cache de l'appareil).
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { getFirebaseAuth } from "./firebase";
import {
  createProfile,
  watchBoutique,
  watchMember,
  watchProfile,
  type Boutique,
  type Member,
  type Profile,
} from "./boutique";
import { errorMessage } from "./errors";
import { resolvePermissions, type Permissions } from "../lib/roles";

export type Session =
  | { status: "loading" }
  | { status: "signedOut" }
  /** Connecté, mais la fiche du compte n'a pas encore pu être lue ou créée. */
  | { status: "noProfile"; user: User; error?: string; offline: boolean }
  /** Le compte n'a encore ni créé ni rejoint de boutique. */
  | { status: "noBoutique"; user: User; profile: Profile }
  | { status: "pending"; user: User; profile: Profile; member: Member; boutique: Boutique | null }
  | { status: "disabled"; user: User; profile: Profile; member: Member; boutique: Boutique | null }
  | { status: "ready"; user: User; profile: Profile; member: Member; boutique: Boutique; permissions: Permissions };

export type ReadySession = Extract<Session, { status: "ready" }>;

const SessionContext = createContext<Session>({ status: "loading" });

/** `undefined` = pas encore lu ; `null` = absent. */
type Loaded<T> = T | null | undefined;

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Loaded<User>>(undefined);
  const [profile, setProfile] = useState<Loaded<Profile>>(undefined);
  const [profileError, setProfileError] = useState<string>();
  const [profileFromCache, setProfileFromCache] = useState(true);
  const [member, setMember] = useState<Loaded<Member>>(undefined);
  const [boutique, setBoutique] = useState<Loaded<Boutique>>(undefined);
  const creating = useRef(false);

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), (u) => setUser(u)), []);

  useEffect(() => {
    setProfile(undefined);
    setProfileError(undefined);
    if (!user) return;
    return watchProfile(
      user.uid,
      (p, cache) => {
        setProfile(p);
        setProfileFromCache(cache);
        // Fiche absente côté serveur : inscription toute neuve (ou interrompue) → on la crée.
        if (!p && !cache && !creating.current) {
          creating.current = true;
          createProfile(user)
            .catch((e) => setProfileError(errorMessage(e)))
            .finally(() => {
              creating.current = false;
            });
        }
      },
      (e) => setProfileError(errorMessage(e)),
    );
  }, [user]);

  const uid = user?.uid;
  const boutiqueId = profile?.boutiqueId;

  useEffect(() => {
    setMember(undefined);
    if (!uid || !boutiqueId) return;
    return watchMember(
      boutiqueId,
      uid,
      (m, cache) => {
        // Absent du cache ne veut pas dire absent : on attend la réponse du serveur.
        if (m || !cache) setMember(m);
      },
      () => setMember(null),
    );
  }, [uid, boutiqueId]);

  // On relance l'écoute quand le statut change : les règles n'ouvrent la boutique qu'aux membres.
  const memberStatus = member?.status;
  useEffect(() => {
    setBoutique(undefined);
    if (!boutiqueId || !memberStatus) return;
    return watchBoutique(
      boutiqueId,
      (b, cache) => {
        if (b || !cache) setBoutique(b);
      },
      () => setBoutique(null),
    );
  }, [boutiqueId, memberStatus]);

  let session: Session;
  if (user === undefined) session = { status: "loading" };
  else if (user === null) session = { status: "signedOut" };
  else if (!profile) {
    session =
      profile === undefined && !profileError
        ? { status: "loading" }
        : { status: "noProfile", user, error: profileError, offline: profileFromCache };
  } else if (!profile.boutiqueId || member === null) session = { status: "noBoutique", user, profile };
  else if (member === undefined) session = { status: "loading" };
  else if (member.status === "pending") session = { status: "pending", user, profile, member, boutique: boutique ?? null };
  else if (member.status === "disabled") session = { status: "disabled", user, profile, member, boutique: boutique ?? null };
  else if (boutique === undefined) session = { status: "loading" };
  else if (boutique === null) session = { status: "noBoutique", user, profile };
  else
    session = {
      status: "ready",
      user,
      profile,
      member,
      boutique,
      permissions: resolvePermissions(member.role, member.permissions),
    };

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  return useContext(SessionContext);
}

/** Session d'un membre actif (à utiliser dans les écrans de l'application). */
export function useReady(): ReadySession {
  const s = useSession();
  if (s.status !== "ready") throw new Error("Aucune session active.");
  return s;
}

export function logout(): Promise<void> {
  return signOut(getFirebaseAuth());
}
