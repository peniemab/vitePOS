# Documents du projet vitePOS

Documents courts, écrits pour le lancement commercial du **9 novembre 2026**. Le document de référence reste
[`CDC.md`](../CDC.md) (cahier des charges vivant) : ces fichiers le résument ou le complètent, ils ne le remplacent pas.

| Document | À quoi il sert |
| --- | --- |
| [PRD.md](PRD.md) | Le produit : pour qui, quel problème, ce qui est livré le 9 novembre, comment on mesure le succès. |
| [TRD.md](TRD.md) | La technique : architecture, règles offline-first, sécurité, hébergement, limites connues. |
| [APP_FLOW.md](APP_FLOW.md) | Les parcours : du site à la première vente, la vente, la journée de caisse, l'abonnement. |
| [../DESIGN.md](../DESIGN.md) | Le design (format « DESIGN.md ») : couleurs, polices, composants, règles d'écriture. |
| [BACKEND_SCHEMA.md](BACKEND_SCHEMA.md) | La base Firestore : collections, champs, qui peut lire et écrire. |
| [PLAN_LANCEMENT.md](PLAN_LANCEMENT.md) | Ce qu'il reste à faire, jour par jour, jusqu'au 9 novembre, puis après. |
| [AUDIT_UI.md](AUDIT_UI.md) | Relecture de l'app et du site avec les règles d'interface de Vercel. |

## Vercel et les autres outils : ce qu'on garde, ce qu'on remplace

| Outil proposé | Utilisable ? | Ce qu'on fait |
| --- | --- | --- |
| **Web Interface Guidelines (Vercel)** | Oui | Ce n'est qu'une liste de règles (accessibilité, formulaires, animations…). Elle sert à relire le code, quel que soit l'hébergeur. Résultat : [AUDIT_UI.md](AUDIT_UI.md). |
| **Hébergement Vercel** | Non utile | L'app et le site restent sur **Firebase Hosting** : même projet que la base et la connexion, gratuit à notre échelle, déjà en ligne. Changer d'hébergeur 5 jours avant le lancement n'apporterait rien. |
| **v0 (maquettes Vercel)** | Remplacé | Les maquettes se font dans **Google Stitch** (déjà utilisé pour le logo) ou directement dans l'aperçu de l'app (`?vide`, `?sombre`…) avec captures. |
| **Vercel Analytics** | Remplacé | **Google Analytics pour Firebase** (gratuit, même console) ou **Plausible** / **Umami** si on veut un outil sans cookies. À décider après le lancement. |
| **awesome-design-md** | Oui | C'est un format de fichier Markdown (`DESIGN.md` à la racine) qui décrit le design pour les humains et pour les assistants IA. Aucun outil à installer. |
