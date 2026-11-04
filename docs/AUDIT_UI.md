# Audit d'interface (règles Vercel « Web Interface Guidelines »)

Relecture du 4 novembre 2026, faite sur le code. Fichiers relus : `site/src/views/Home.astro`, `site/src/components/Header.astro`,
`Footer.astro`, `site/src/layouts/Base.astro`, `src/screens/AuthScreens.tsx`, `GateScreens.tsx`, `HomeScreen.tsx`,
`CaisseScreen.tsx`, `src/components/FirstSteps.tsx`, `index.html`, plus une recherche dans tout `src/`.

✅ = corrigé le 4 novembre. Priorités : **P1** = à corriger avant le 9 novembre ; **P2** = juste après ; **P3** = quand on peut.

## Site (`site/`)

| Priorité | Où | Problème | Correction |
| --- | --- | --- | --- |
| ✅ P1 | `site/src/layouts/Base.astro` | Pas d'image de partage (`og:image`). Un lien partagé sur Facebook ou WhatsApp s'affiche sans image : grave pour la campagne. | Créer une image 1200 × 630 (logo + téléphone + phrase) et ajouter `og:image`, `og:url`, `twitter:card`. |
| ✅ P1 | `site/src/views/Home.astro` | **Aucun prix sur le site.** La FAQ dit « 30 jours gratuits puis abonnement » sans montant. | Ajouter une section « Tarifs » (décision à prendre : voir plus bas). |
| ✅ P1 | `site/src/styles/global.css:147-206` | Le fond animé (halos, traits, objets qui flottent, réseau) ne s'arrête pas quand l'appareil demande moins de mouvement. | `@media (prefers-reduced-motion: reduce)` : couper les animations et ne pas dessiner le réseau. |
| ✅ P1 | `site/src/views/Home.astro:587` | Le carrousel de l'accroche tourne tout seul même avec « moins de mouvement ». | Démarrer en pause si `matchMedia("(prefers-reduced-motion: reduce)")`. Pareil pour les notifications, la bande qui défile et les points de `sync-links` (`Home.astro:410`). |
| ✅ P2 | `site/src/components/Header.astro:97` | Défilement doux codé à la main, même avec « moins de mouvement ». | Saut direct dans ce cas. |
| ✅ P2 | `site/src/layouts/Base.astro:85` | Pas de lien « Aller au contenu » pour le clavier. | Lien caché visible au focus, vers `<main id="contenu">`. |
| P2 | `site/public/` | Pas de `robots.txt` ni de `sitemap.xml` : Google indexe moins bien. | Ajouter `@astrojs/sitemap` et un `robots.txt`, après le choix du domaine. |
| P2 | `site/src/data/content.ts` | Pages Conditions et Confidentialité masquées (éditeur, RCCM, e-mail vides). | Remplir `LEGAL` : les pages se publient seules. |
| ✅ P3 | `site/src/views/Home.astro:501` | QR code avec `alt=""` alors qu'il porte une information. | `alt` : « QR code pour ouvrir vitePOS ». |
| P3 | `site/src/i18n/fr.ts` (FAQ « Comment l'installer ? ») | Adresse `getvitepos.web.app` écrite en dur dans le texte. | La tirer de `APP_HOST` pour le changement de domaine. |

| ✅ P1 | `site/src/views/Home.astro` | Aucun moyen de contacter l'équipe sur le site. | Section Contact (WhatsApp avec message prérempli, appel, démonstration) + colonne du pied de page + menu. |

Points conformes : boutons à icône avec `aria-label`, carrousel avec pause et flèches au clavier, images avec dimensions,
polices préchargées, menu téléphone fermé avec Échap, `scroll-margin-top` utilisé, `text-wrap: balance` sur les titres.

## App (`src/`, `index.html`)

| Priorité | Où | Problème | Correction |
| --- | --- | --- | --- |
| ✅ P1 | `index.html:5` | `maximum-scale=1` **empêche de zoomer**. Gênant pour les commerçants qui voient mal. | Retirer `maximum-scale=1` ; les champs font déjà 16 px (pas de zoom automatique sur iPhone). À vérifier sur iPhone. |
| P2 | `src/screens/InventaireScreen.tsx:196` | Ligne cliquable faite avec un `<div onClick>` : impossible à atteindre au clavier. | `UnstyledButton` comme les autres listes. |
| P2 | `src/screens/CaisseScreen.tsx:403, 497, 677` | `autoFocus` dans des fenêtres : sur téléphone, le clavier s'ouvre et cache la moitié de l'écran. | Garder pour l'IMEI (douchette) ; pour la quantité et la remise, seulement sur grand écran (`autoFocus={wide}`), comme à la ligne 235. |
| P3 | `src/screens/AuthScreens.tsx:131, 195, 269` | Champs e-mail sans `spellCheck={false}` : le correcteur souligne l'adresse. | Ajouter `spellCheck={false}`. |
| P3 | `src/components/FirstSteps.tsx:84` | `steps.indexOf(s)` dans la boucle. | Utiliser l'index de `map`. |

Points conformes : dates et nombres avec `Intl` (`fx.ts`, `cashday.ts`, `receipt.ts`), `tabular-nums` sur les montants,
`prefers-reduced-motion` géré (`styles.css:502`), `aria-label` sur les boutons à icône de la caisse, `autocomplete` sur
la connexion, confirmation avant d'annuler une vente, chargement avec « … », messages d'erreur qui disent quoi faire.

Règles **non appliquées volontairement** : « Title Case » des boutons (règle anglaise ; en français on garde une seule
majuscule), « état dans l'URL » pour tous les filtres (inutile pour une caisse).

## Décision prise : la section Tarifs

Choix du 4 novembre : formule Boutique en avant (recommandation ci-dessous), plus une section Contact (WhatsApp, appel, démonstration).

Recommandation : montrer **seulement la formule Boutique (10 $ / mois)** en grand avec « 30 jours gratuits », et une ligne
« Plus grand commerce ? Formule Pro à 25 $ / mois, ou contactez-nous ». La formule « Supermarché » n'apparaît pas sur le
site (règle : ne pas comparer vitePOS aux supermarchés). Autre choix possible : les trois formules en tableau.
