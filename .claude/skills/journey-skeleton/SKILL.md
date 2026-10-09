---
name: journey-skeleton
description: "Produire le squelette exhaustif et ordonné du parcours cible, nommé avec le vocabulaire de l'utilisateur, avant tout découpage. Utiliser aux activités 4, 5 de la méthode — Recherche et synthèse utilisateur · Squelette de parcours cible."
---

# journey-skeleton

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Produire le squelette exhaustif et ordonné du parcours cible, nommé avec le vocabulaire de l'utilisateur, avant tout découpage. Un squelette incomplet ne se rattrape pas : il se paie en réouvertures de G0.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 4 | Recherche et synthèse utilisateur | `product-designer` | `Product Owner` |
| 5 | Squelette de parcours cible | `product-designer` | `Product Owner` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-04 — Recherche et synthèse utilisateur | `C1.3-parcours/research/research-plan.md · interviews/ · insights.md · personas/ · empathy-maps/ · journeys/as-is/` | G0 |
| WP-05 — Squelette de parcours cible | `C1.3-parcours/spine/journey-skeleton.md · stages/` | G0 |

Plan de contenu et critère de complétude de chacun : **`references/livrables.md`**.

## Contrat d'entrée

Si un artefact d'entrée déclaré manque, retourner `BLOCKED — input manquant`. Ne jamais inférer : produire sur un matériau deviné donne un résultat plausible et invérifiable, ce que la méthode existe pour empêcher.

## Vérification avant handover

Partir du squelette rendu par `apf template <WP-nn>` : il porte les sections du registre dans l'ordre, la règle et le guide de chacune, et le critère de complétude. Ne jamais renommer ni omettre un H2 — le titre est une clé.

Chaque livrable existe au chemin déclaré, porte toutes les sections de son plan de contenu et satisfait son critère de complétude.

Exécuter `apf check` TROIS fois : sur l'arbre indexé, après le commit, puis sur main après la fusion — un contrôle ne voit que la population qu'il lit, index ou commit. Toute édition après un passage le rouvre.

Pour les contrôles écrits par le projet : un test négatif mute une COPIE de fixture déclarée, jamais l'instantané vivant ; un compte publié se recalcule depuis ses lignes ; un contrôle ne rejoue pas les autres — la CI les agrège.

**Puis rendre la main** — format Office, projection dans l'espace de travail, pointeur bidirectionnel : **`references/rendre-la-main.md`**. La projection est sans objet si SOC-01 porte `workspace_kind: launchpad` : le commit est la page.

## Ne pas faire

- Écrire hors des chemins déclarés au registre : un artefact à un chemin non déclaré est invisible à la gouvernance et fait échouer K2.
- Franchir un gate ou déclarer un livrable approuvé. Ce skill prépare la décision, il ne la prend pas.
- Modifier un CORE INVARIANT du socle depuis une cadence autre que C1. Émettre un finding et router vers G0 (EX3).
