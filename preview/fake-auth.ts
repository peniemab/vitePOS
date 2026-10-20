/** Imitation de « firebase/auth » pour l'aperçu : la propriétaire de la boutique d'exemple est déjà connectée. */
export type Auth = { languageCode: string };
export type User = { uid: string; email: string; displayName: string };

export const OWNER: User = { uid: "proprio", email: "mama.ngalula@exemple.cd", displayName: "Mama Ngalula" };

export function getAuth(): Auth {
  return { languageCode: "fr" };
}

export function onAuthStateChanged(_auth: Auth, cb: (u: User | null) => void) {
  setTimeout(() => cb(OWNER), 0);
  return () => undefined;
}

const unavailable = () => Promise.reject(new Error("Indisponible dans l'aperçu."));
export const signOut = () => Promise.resolve();
export const signInWithEmailAndPassword = unavailable;
export const createUserWithEmailAndPassword = unavailable;
export const sendPasswordResetEmail = unavailable;
export const signInWithPopup = unavailable;
export const signInWithRedirect = unavailable;
export class GoogleAuthProvider {
  setCustomParameters() {}
}
