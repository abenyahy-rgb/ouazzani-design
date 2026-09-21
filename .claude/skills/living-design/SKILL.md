---
name: living-design
description: "Produire le design exécutable à tout niveau — socle, Strategic Design de release, prototype de sprint — avec son delta de Design System en extension du socle et jamais en fork, et son Design QA. Utiliser aux activités 8, 13, 15, 19 de la méthode — Socle exécutable · Exploration, direction et Strategic Design · Design QA · Design de sprint et prototype."
---

# living-design

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Produire le design exécutable à tout niveau — socle, Strategic Design de release, prototype de sprint — avec son delta de Design System en extension du socle et jamais en fork, et son Design QA. Recomposer le prototype vivant après chaque delta : socle ⊕ deltas de release ⊕ deltas de sprint, jamais une écriture directe dans l'artefact composé.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 8 | Socle exécutable | `product-designer` | `Product Owner` |
| 13 | Exploration, direction et Strategic Design | `product-designer` | `Product Owner` |
| 15 | Design QA | `critic(design)` | `Product Owner` |
| 19 | Design de sprint et prototype | `product-designer` | `Product Owner` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-13 — Socle exécutable | `design/spine/src/ · dist/index.html · spine.yaml` | G0 |
| WP-39 — Prototype vivant | `design/current/index.html · manifest.yaml · unsubordinated.md · deltas.yaml` | G0 |
| WP-21 — Strategic Design de la release | `releases/{release-id}/design/concept/ · design/src/ · design/dist/ · design-system-delta/` | G1 |
| WP-24 — Rapport de Design QA | `releases/{release-id}/design/qa/report.md` | G1 |
| WP-30 — Design de sprint et Baseline Delta Declaration | `releases/{release-id}/sprints/{sprint-id}/design/scope.yaml · flows/ · prototype/ · design-system-delta/` | K1 |

Plan de contenu et critère de complétude de chacun : **`references/livrables.md`**.

## Contrat d'entrée

Si un artefact d'entrée déclaré manque, retourner `BLOCKED — input manquant`. Ne jamais inférer : produire sur un matériau deviné donne un résultat plausible et invérifiable, ce que la méthode existe pour empêcher.

**Activité 8 — arrêt dur.** Fondations, composants, navigation, IA et sémantique disponibles. CORPUS RÉEL recevable (WP-40) : son absence produit BLOCKED, et jamais un jeu de fixtures écrit pour débloquer l'activité.

Ces inputs se RECUEILLENT auprès d'un humain, dans la salve unique de quatre questions au maximum (EX2). Ne jamais les dériver du nom du dépôt, du contexte de la session, ni d'un fichier existant.

## Vérification avant handover

Partir du squelette rendu par `apf template <WP-nn>` : il porte les sections du registre dans l'ordre, la règle et le guide de chacune, et le critère de complétude. Ne jamais renommer ni omettre un H2 — le titre est une clé.

Chaque livrable existe au chemin déclaré, porte toutes les sections de son plan de contenu et satisfait son critère de complétude. Exécuter `apf check` avant de rendre la main.

Puis projeter chaque livrable dans l'espace de travail lisible. **Si WP-01 porte `workspace_kind: launchpad`** (dépôt lancé depuis le launchpad), il n'y a rien à projeter : le workflow du dépôt dépose l'état à chaque push, `apf notion status` rend « sans objet », et la page est le commit. Sinon, dans cet ordre :

```bash
apf notion where <WP-nn>   # la destination, et surtout l'ACTION
apf notion page  <WP-nn>   # le corps : miroir complet du fichier Git, bandeau compris
#  … mettre à jour la page EXISTANTE via le connecteur …
apf notion link  <WP-nn> <url>
```

**La ligne existe déjà** : créée au bootstrap avec son gabarit et le statut « À produire ». L'action rendue est `update`. Ne jamais créer une seconde ligne — deux pages pour un livrable, ce sont deux vérités. Ne jamais rédiger le corps : il est calculé.

Le pointeur est bidirectionnel : le front-matter porte l'adresse de la page, la page porte en retour le chemin et le commit. Un livrable lisible d'un seul côté n'est relié à rien.

La liaison ne bloque aucun GATE : `apf notion status` rapporte, il ne refuse pas.

## Ne pas faire

- Écrire hors des chemins déclarés au registre : un artefact à un chemin non déclaré est invisible à la gouvernance et fait échouer K2.
- Franchir un gate ou déclarer un livrable approuvé. Ce skill prépare la décision, il ne la prend pas.
- Modifier un CORE INVARIANT du socle depuis une cadence autre que C1. Émettre un finding et router vers G0 (EX3).
