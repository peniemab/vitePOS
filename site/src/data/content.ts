/** Textes du site : tout le contenu modifiable est ici, les pages ne font que l'afficher. */
import type { IconName } from "./icons";

/** Adresse de l'application : un seul endroit à changer quand le nom de domaine sera choisi. */
export const APP_URL = "https://getvitepos.web.app";
export const SIGNUP_URL = `${APP_URL}/inscription`;
export const LOGIN_URL = `${APP_URL}/connexion`;

export const strengths = [
  { title: "FC, $ et €", text: "au taux du jour, monnaie rendue juste" },
  { title: "Hors ligne", text: "vous vendez même quand le réseau coupe" },
  { title: "Plusieurs caisses", text: "vos employés vendent en même temps" },
];

/** Les trois promesses, juste sous l'accroche. */
export const promises = [
  {
    title: "Fini le cahier.",
    text: "vitePOS remplace le cahier de caisse : plus rapide pour vendre, impossible à « oublier », et lisible depuis votre téléphone.",
  },
  {
    title: "Plus un seul franc perdu.",
    text: "Chaque vente est notée, le stock se compte tout seul, et le soir vous savez exactement ce qui doit être dans la caisse.",
  },
  {
    title: "Votre boutique dans votre poche.",
    text: "Vos vendeurs encaissent, vous voyez chaque vente et chaque article manquant en direct, même quand vous n'êtes pas là.",
  },
];

export const features: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "bolt",
    title: "Caisse rapide",
    text: "Touchez ou scannez les articles, encaissez en francs, en dollars, en euros ou en mobile money. L'app calcule la monnaie à rendre.",
  },
  {
    icon: "package",
    title: "Stock toujours juste",
    text: "Chaque vente fait baisser le stock. Vous êtes prévenu avant la rupture et chaque mouvement est tracé.",
  },
  {
    icon: "receipt",
    title: "Tickets",
    text: "Imprimez le ticket sur une imprimante thermique ou envoyez-le au client par WhatsApp.",
  },
  {
    icon: "users",
    title: "Employés sous contrôle",
    text: "Chaque vendeur a son compte. Les vendeurs ne voient ni vos prix d'achat ni vos marges, et une vente ne s'efface pas.",
  },
  {
    icon: "chartBar",
    title: "Rapports clairs",
    text: "Ventes du jour, de la semaine, du mois, meilleurs produits, marge, dépenses : tout depuis votre téléphone.",
  },
  {
    icon: "lock",
    title: "Fin de journée sans surprise",
    text: "La clôture compare l'argent du tiroir à ce qui était attendu, en francs et en dollars. Les écarts sautent aux yeux.",
  },
  {
    icon: "clipboardCheck",
    title: "Inventaire facile",
    text: "Comptez le rayon en scannant, à plusieurs. L'app montre ce qui manque et sa valeur avant de corriger le stock.",
  },
  {
    icon: "fileImport",
    title: "Import depuis Excel",
    text: "Déjà une liste de produits ? Importez-la en une fois, même avec des milliers d'articles.",
  },
];

export const audiences = [
  {
    title: "Boutiques",
    text: "Alimentation, cosmétiques, téléphonie, habillement. Une caisse simple sur le téléphone du patron ou du vendeur.",
  },
  {
    title: "Quincailleries et grossistes",
    text: "Gros catalogues, ventes à la pièce, au kilo ou au litre, plusieurs vendeurs, suivi précis du stock.",
  },
  {
    title: "Pharmacies et dépôts",
    text: "Recherche rapide par nom ou code-barres, alertes de rupture, inventaires réguliers.",
  },
  {
    title: "Supérettes et supermarchés",
    text: "Plusieurs caisses qui vendent en même temps, clôture par jour, rapports pour le gérant et le propriétaire.",
  },
];

export const steps = [
  { title: "Créez votre compte", text: "Avec votre e-mail ou votre compte Google, depuis le navigateur de votre téléphone." },
  { title: "Ajoutez vos produits", text: "Un par un, en scannant, ou d'un coup depuis un fichier Excel." },
  { title: "Vendez", text: "Invitez vos vendeurs avec un code et suivez tout depuis votre téléphone." },
];

export const faqs = [
  {
    q: "Combien ça coûte ?",
    a: "vitePOS est gratuit pour commencer. Quand votre commerce grandit (plus d'employés, plusieurs caisses ou magasins), des formules adaptées existent : contactez-nous.",
  },
  {
    q: "Faut-il acheter du matériel ?",
    a: "Non. Un téléphone Android ou un iPhone suffit. Une tablette, un ordinateur, une douchette ou une imprimante de tickets peuvent s'ajouter si vous le souhaitez.",
  },
  {
    q: "Est-ce que ça marche sans internet ?",
    a: "Oui. Les ventes, le stock et les dépenses fonctionnent sans réseau. Il faut seulement internet pour créer votre compte et votre boutique.",
  },
  {
    q: "Comment l'installer ?",
    a: "Rien à télécharger dans un store. Ouvrez getvitepos.web.app sur votre téléphone. Sur Android (Chrome) : touchez « Installer » dans l'app, ou le menu ⋮ puis « Installer l'application ». Sur iPhone (Safari) : touchez Partager, puis « Sur l'écran d'accueil ». vitePOS s'ouvre ensuite depuis son icône, en plein écran, même sans internet.",
  },
  {
    q: "Je peux vendre en francs, en dollars et en euros ?",
    a: "Oui. Le propriétaire fixe le taux du jour, vos prix restent dans la devise de votre choix, et le client paie en francs, en dollars, en euros ou en mobile money. La monnaie à rendre est calculée pour vous.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Chaque boutique est séparée des autres et sauvegardée en ligne. Chaque employé a son propre compte et ne voit que ce que vous lui autorisez.",
  },
];
