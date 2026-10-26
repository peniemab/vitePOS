/**
 * Conditions d'utilisation et politique de confidentialité (français).
 * Les paragraphes acceptent du HTML simple (<b>, <a>) : textes écrits ici, jamais saisis par un visiteur.
 * Les mots entre accolades sont remplacés à l'affichage : {editor}, {rccm}, {address}, {email}, {whatsapp},
 * {site}, {app} (voir LEGAL dans content.ts).
 * À faire relire par un juriste congolais avant le lancement public.
 */

export interface LegalSection {
  title: string;
  paras: string[];
}

export interface LegalDoc {
  title: string;
  description: string;
  intro: string;
  sections: LegalSection[];
}

export const terms: LegalDoc = {
  title: "Conditions d'utilisation",
  description: "Les conditions d'utilisation de vitePOS : le service, les comptes, l'essai et les abonnements, vos données et vos obligations.",
  intro:
    "Ces conditions s'appliquent à toute personne qui crée un compte vitePOS ou utilise l'application {app}. En créant un compte, vous les acceptez.",
  sections: [
    {
      title: "1. Qui édite vitePOS",
      paras: ["vitePOS est édité par {editor}, {address}. RCCM : {rccm}. Contact : {email} · WhatsApp {whatsapp}."],
    },
    {
      title: "2. Le service",
      paras: [
        "vitePOS est une caisse et un outil de gestion pour les commerces : ventes, tickets, stock, inventaires, clients, dépenses, journée de caisse et rapports. L'application s'utilise dans un navigateur et peut s'installer sur l'écran d'accueil.",
        "Elle fonctionne aussi sans réseau : les saisies sont gardées sur l'appareil, puis envoyées en ligne au retour de la connexion. Créer un compte, rejoindre une boutique et gérer l'équipe demandent internet.",
      ],
    },
    {
      title: "3. Votre compte",
      paras: [
        "Chaque personne a son propre compte, avec son e-mail ou son compte Google. Vous gardez votre mot de passe secret et ne prêtez pas votre compte : une vente faite avec votre compte est enregistrée à votre nom.",
        "Le propriétaire d'une boutique invite ses employés avec un code, valide leur demande et choisit leur rôle. Il est responsable de l'usage que son équipe fait de vitePOS.",
      ],
    },
    {
      title: "4. Essai, formules et paiement",
      paras: [
        "Chaque nouvelle boutique bénéficie de <b>30 jours d'essai</b> avec toutes les fonctions de la formule choisie. Une version gratuite, aux possibilités limitées, peut aussi être proposée.",
        "Après l'essai, la boutique continue avec un abonnement payant (formules Boutique, Pro ou Supermarché), payé chaque mois ou chaque année. Les prix sont communiqués sur demande et confirmés avant tout paiement.",
        "Sans paiement à l'échéance, la boutique dispose de <b>7 jours de grâce</b>, puis passe en <b>lecture seule</b> : vous consultez et exportez vos données, mais vous ne pouvez plus enregistrer de ventes. Rien n'est supprimé ; tout redevient disponible dès le paiement.",
      ],
    },
    {
      title: "5. Ce que vous vous engagez à faire",
      paras: [
        "Utiliser vitePOS pour une activité légale, saisir des informations exactes (prix, taux du jour, stock) et ne pas chercher à accéder aux données d'une autre boutique ni à perturber le service.",
      ],
    },
    {
      title: "6. Impôts et facturation",
      paras: [
        "Le ticket de vitePOS est un <b>reçu de vente</b>. Ce n'est pas une facture normalisée au sens de la Direction générale des impôts (DGI) : vitePOS n'est pas un dispositif électronique fiscal certifié.",
        "Vous restez responsable de vos obligations fiscales, notamment la TVA et, si votre entreprise y est assujettie, l'émission de factures normalisées avec un dispositif agréé par la DGI.",
      ],
    },
    {
      title: "7. Vos données",
      paras: [
        "Les données saisies dans votre boutique (produits, ventes, clients, dépenses…) <b>vous appartiennent</b>. Vous pouvez les exporter (par exemple le catalogue en fichier CSV) et demander leur suppression.",
        "La façon dont nous traitons les données est décrite dans la <a href=\"/confidentialite\">politique de confidentialité</a>.",
      ],
    },
    {
      title: "8. Disponibilité",
      paras: [
        "Nous faisons de notre mieux pour que vitePOS soit disponible et sauvegardé, sans pouvoir garantir l'absence d'interruption. Les saisies faites hors ligne restent sur l'appareil tant qu'elles ne sont pas envoyées : ne vous déconnectez pas et ne supprimez pas les données du navigateur avant leur envoi.",
      ],
    },
    {
      title: "9. Responsabilité",
      paras: [
        "vitePOS calcule à partir de ce que vous saisissez. Nous ne sommes pas responsables des erreurs de saisie, d'un taux du jour mal fixé, ni des pertes liées à un appareil perdu, volé ou dont les données ont été effacées avant l'envoi. Notre responsabilité est limitée au montant payé pour les douze derniers mois d'abonnement.",
      ],
    },
    {
      title: "10. Fin de l'abonnement",
      paras: [
        "Vous pouvez arrêter à tout moment : il suffit de ne pas renouveler l'abonnement. Nous pouvons suspendre un compte qui ne respecte pas ces conditions, après vous avoir prévenu sauf urgence.",
      ],
    },
    {
      title: "11. Changements",
      paras: ["Nous pouvons modifier ces conditions. Les changements importants sont annoncés dans l'application ou par message au moins 15 jours à l'avance."],
    },
    {
      title: "12. Droit applicable",
      paras: [
        "Ces conditions sont soumises au droit de la République démocratique du Congo. En cas de désaccord, nous cherchons d'abord une solution amiable ; à défaut, les tribunaux de Kinshasa sont compétents.",
      ],
    },
  ],
};

export const privacy: LegalDoc = {
  title: "Politique de confidentialité",
  description: "Quelles données vitePOS garde, pourquoi, où elles sont hébergées, qui les voit et comment exercer vos droits.",
  intro:
    "Cette politique explique quelles données vitePOS garde, pourquoi, où elles sont hébergées et quels sont vos droits, conformément à la législation congolaise, notamment le Code du numérique (ordonnance-loi n° 23/010 du 13 mars 2023).",
  sections: [
    {
      title: "1. Qui est responsable",
      paras: [
        "Pour les comptes et les abonnements : {editor}, {address}, joignable à {email} ou par WhatsApp au {whatsapp}.",
        "Pour les données que la boutique enregistre sur ses propres clients (nom, téléphone, achats), c'est la <b>boutique</b> qui en est responsable ; vitePOS les héberge et les traite pour son compte.",
      ],
    },
    {
      title: "2. Les données que nous gardons",
      paras: [
        "<b>Votre compte</b> : nom, adresse e-mail, et la connexion Google si vous l'utilisez. Le mot de passe est géré par Firebase Authentication (Google) : nous ne le voyons jamais.",
        "<b>Votre boutique</b> : nom, devise, taux du jour, formule et dates d'abonnement, membres de l'équipe et leurs rôles.",
        "<b>Votre activité</b> : produits, prix, stock, lots et dates de péremption, numéros de série ou IMEI des appareils, ventes et tickets, dépenses, journées de caisse, inventaires, et clients (nom, téléphone, notes, achats).",
        "<b>Sur votre appareil</b> : une copie de ces données pour fonctionner sans réseau, et quelques préférences (apparence, panier en cours).",
      ],
    },
    {
      title: "3. Pourquoi",
      paras: [
        "Uniquement pour faire fonctionner le service : enregistrer les ventes et le stock, synchroniser les appareils, afficher les rapports, gérer l'équipe et l'abonnement, et vous aider quand vous nous contactez.",
      ],
    },
    {
      title: "4. Ce que nous ne faisons pas",
      paras: [
        "Pas de publicité, pas de revente ni de location de vos données, pas de pistage. Le site de présentation {site} n'utilise ni cookies ni outil de statistiques.",
      ],
    },
    {
      title: "5. Où sont les données",
      paras: [
        "vitePOS s'appuie sur <b>Google Firebase</b> : Firebase Authentication pour les comptes, Cloud Firestore pour les données (hébergées dans la région <b>europe-west1, en Belgique</b>) et Firebase Hosting pour l'application et le site. Les données circulent donc hors de la RDC, chez ce prestataire, qui s'engage contractuellement à les protéger.",
      ],
    },
    {
      title: "6. Qui les voit",
      paras: [
        "Les membres de votre boutique, selon leur rôle : par exemple, un vendeur ne voit ni les prix d'achat ni les marges. Chaque boutique est séparée des autres par des règles d'accès vérifiées par le serveur.",
        "L'équipe vitePOS n'y accède que pour l'assistance, la maintenance ou une obligation légale.",
      ],
    },
    {
      title: "7. Sécurité",
      paras: [
        "Les échanges sont chiffrés (HTTPS), chaque personne a son propre compte, et chaque accès est contrôlé par boutique et par rôle. Une vente ne peut pas être effacée, seulement annulée, et chaque mouvement de stock est tracé.",
      ],
    },
    {
      title: "8. Combien de temps",
      paras: [
        "Tant que votre compte et votre boutique existent. Après la fin d'un abonnement, les données restent consultables en lecture seule pendant 12 mois, puis sont supprimées, sauf si vous demandez leur suppression plus tôt.",
      ],
    },
    {
      title: "9. Vos droits",
      paras: [
        "Vous pouvez demander l'accès à vos données, leur correction, leur export ou leur suppression, en écrivant à {email} ou par WhatsApp au {whatsapp}. Nous répondons dans les 30 jours.",
        "Si la boutique enregistre des clients, elle doit les informer et répondre à leurs demandes ; nous l'aidons à le faire.",
      ],
    },
    {
      title: "10. Changements",
      paras: ["Nous pouvons faire évoluer cette politique. La date de mise à jour figure en haut de la page, et les changements importants sont annoncés à l'avance."],
    },
  ],
};
