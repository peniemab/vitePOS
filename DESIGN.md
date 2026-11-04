# DESIGN.md : vitePOS

> Système de design de vitePOS (app et site), au format « DESIGN.md » : un fichier lisible par les humains et par les
> assistants IA. Les valeurs viennent du code : `src/theme.ts` et `src/styles.css` (app), `site/src/styles/global.css` (site).
> Si une valeur change dans le code, la changer ici aussi.

## 1. Thème visuel et ambiance

Une caisse **claire, rapide et rassurante** pour des commerçants de Kinshasa qui ne sont pas informaticiens.
Bleu ciel lumineux (confiance, le ciel de Kinshasa), jaune soleil pour l'action principale, rouge brique du logo pour
l'argent dû et les alertes. Surfaces blanches, grandes cibles tactiles, chiffres très lisibles. Un motif « zébré »
(vagues blanches légères) sur les bandeaux bleus rappelle le ticket de caisse et donne de la personnalité sans gêner.

Mots-clés : lisible au soleil, gros doigts, hors ligne serein, argent exact.

## 2. Couleurs

| Rôle | Nom | Valeur | Usage |
| --- | --- | --- | --- |
| Principale | Bleu ciel | `#3987e5` (teinte 6 de `sky`) | Boutons, liens, onglet actif, bandeaux |
| Principale foncée | Bleu profond | `#2c6fc6` → `#1f63b8` | Dégradés, survol |
| Action principale | Soleil | `#ffc233` (texte `#12233f`) | Un seul bouton par écran : « Encaisser », « Créer un compte gratuit », « Enregistrer le paiement » (`.sun-btn`) |
| Texte titres | Encre | `#12233f` | Titres, montants |
| Texte | Gris encre | `#2a3346` / atténué `#5b6270` | Texte courant, aides |
| Logo / dû | Brique | `#b6171e` (sombre : `#f6827a`) | Reste à payer, alertes graves, point du logo |
| Succès | Menthe | `#1fb57a` (texte `#11915e`) | « Vente enregistrée », payé, en ligne |
| Nuit | Bleu nuit | `#1a2b4c` / `#0f1c36` | Site : en-tête, pied de page, mode sombre |
| Fond | Blanc / gris doux | `#ffffff` / `#eef1f6` | Cartes blanches sur fond légèrement gris |
| Graphiques | Bleu / orange | `#2a78d6` / `#eb6834` | Ventes / dépenses (paire lisible par les daltoniens) |

Mode sombre (app) : fond `#0f141c`, cartes `#171e2a`, mêmes rôles avec des teintes plus claires.

## 3. Typographie

| Rôle | Police | Graisse | Note |
| --- | --- | --- | --- |
| Titres | Barlow Condensed | 700 | Étroite : les titres tiennent sur un téléphone de 360 px |
| Texte, boutons | Barlow | 400 / 500 / 700 | Polices servies par l'app et le site (pas de Google Fonts : marche hors ligne) |
| Montants, quantités | Barlow, `tabular-nums` | 700 | Chiffres de même largeur, colonnes alignées (classe `.n`) |

Taille minimale : 16 px dans les champs (évite le zoom automatique de l'iPhone), 14 px pour les aides.
Pas de majuscules pour les étiquettes et badges (« Annulée », pas « ANNULÉE »).

## 4. Composants

- **Boutons** : taille `md` (≥ 44 px de haut). Principal = dégradé bleu zébré ; action décisive = soleil (`.sun-btn`) ; secondaire = `light` ou `subtle`.
- **Cartes** (`Paper`) : blanches, sans bordure, ombre très légère (`--app-card-shadow`), rayon `md`.
- **Champs** : taille `md`, étiquette au-dessus, aide en dessous, erreur juste sous le champ.
- **Listes** (`.list-row`) : ligne entière cliquable, vignette d'initiales colorée à gauche, montant à droite.
- **Badges** d'état : couleur `light`, texte normal (Essai, Payée, En retard, Annulée…).
- **Écrans vides** (`EmptyState`) : un titre, une phrase, une ou deux actions. Jamais un écran blanc.
- **Aide** (`HelpLink`) : « Besoin d'aide ? WhatsApp », présent sur les écrans de démarrage.
- **Fenêtres** (`Modal`) : centrées, titre court, une seule action principale.
- **État de synchronisation** : pastille en haut (hors ligne / en attente / à jour), jamais bloquante.

## 5. Mise en page

- **Téléphone d'abord** (360 px) ; barre d'onglets en bas (Accueil, Caisse, Stock, Ventes, Plus).
- **Ordinateur et tablette** : menu à gauche groupé (Vendre, Stock, Argent, Boutique), contenu au centre.
- Espacements Mantine (`xs` 10 px → `xl` 32 px) ; marges latérales 16 px sur téléphone.
- Jamais de défilement horizontal de la page (`overflow-x: clip`) ; seules certaines bandes (catégories) défilent.

## 6. Profondeur

Très peu d'ombres : cartes à ombre fine ; seuls le bouton soleil et les notifications ont une ombre marquée.
En mode sombre, pas d'ombre : les surfaces se distinguent par leur teinte.

## 7. À faire, à éviter

| À faire | À éviter |
| --- | --- |
| Un seul bouton soleil par écran | Plusieurs actions de même poids côte à côte |
| Écrire « commerce », « article », « vente » | Jargon : « synchroniser », « SKU », « PWA », « base de données » |
| Montants avec devise : `12 500 FC`, `25 $` | Montant sans devise |
| Confirmer avant d'annuler une vente | Supprimer sans retour possible |
| Dire ce qu'il faut faire après une erreur | « Erreur inconnue » |
| Textes du site : « commerce » | « boutique » sur le site ; comparer vitePOS aux supermarchés |

## 8. Accessibilité et mouvement

- Cibles tactiles ≥ 44 × 44 px ; contraste AA minimum (texte sur bleu : blanc ; sur soleil : encre).
- Boutons à icône seule : toujours un `aria-label` en français.
- Animations : courtes, seulement en réponse à une action ; arrêtées si l'appareil demande moins de mouvement (`prefers-reduced-motion`).
- Le zoom du navigateur doit rester possible (voir [docs/AUDIT_UI.md](docs/AUDIT_UI.md)).

## 9. Ton et écriture

Phrases courtes, vouvoiement, verbes d'action sur les boutons (« Encaisser », « Ajouter un article »).
Le bouton et le message qui suit utilisent le même mot (« Enregistrer le paiement » → « Paiement enregistré »).
App en français ; site en français et en anglais.

## 10. Pour un assistant IA

« Écran mobile vitePOS : fond `#eef1f6`, cartes blanches arrondies, titres Barlow Condensed 700 `#12233f`,
bouton principal jaune `#ffc233` texte `#12233f` pleine largeur, accents bleu `#3987e5`, montants en chiffres
tabulaires avec FC ou $, textes en français simple. »
