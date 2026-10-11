/** Traduit les erreurs Firebase en messages simples, en français. */
export function errorMessage(e: unknown): string {
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
  switch (code) {
    case "auth/invalid-email":
      return "L'adresse e-mail n'est pas valide.";
    case "auth/missing-password":
      return "Entrez votre mot de passe.";
    case "auth/weak-password":
      return "Le mot de passe doit contenir au moins 6 caractères.";
    case "auth/email-already-in-use":
      return "Un compte existe déjà avec cette adresse e-mail. Utilisez « Se connecter ».";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou mot de passe incorrect.";
    case "auth/too-many-requests":
      return "Trop d'essais. Patientez quelques minutes puis réessayez.";
    case "auth/network-request-failed":
    case "unavailable":
      return "Pas de connexion internet. Cette opération a besoin du réseau.";
    case "auth/account-exists-with-different-credential":
      return "Un compte existe déjà avec cette adresse e-mail. Connectez-vous avec votre mot de passe.";
    case "auth/unauthorized-domain":
      return "Cette adresse du site n'est pas autorisée pour la connexion Google (réglage Firebase).";
    case "auth/operation-not-allowed":
      return "Ce mode de connexion n'est pas activé dans Firebase.";
    case "auth/user-disabled":
      return "Ce compte a été désactivé.";
    case "permission-denied":
      return "Vous n'avez pas le droit de faire cette opération.";
    default:
      return "Une erreur est survenue. Réessayez." + (code ? ` (${code})` : "");
  }
}
