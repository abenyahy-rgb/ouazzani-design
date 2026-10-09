---
name: user-evidence
description: "Produire une preuve utilisateur opposable, sans dépendre d'humains à recruter : en recherche DOCUMENTAIRE par défaut — verbatims d'utilisateurs réels lus dans des sources publiques, chacun avec adresse, date de consultation et citation littérale, deux sources indépendantes par trait retenu — et sur le terrain quand des participants existent. Utiliser aux activités 4, 13, 17 de la méthode — Recherche et synthèse utilisateur · Périmètre, métriques et discovery ciblée de la release · Validation utilisateurs et convergence."
---

# user-evidence

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Produire une preuve utilisateur opposable, sans dépendre d'humains à recruter : en recherche DOCUMENTAIRE par défaut — verbatims d'utilisateurs réels lus dans des sources publiques, chacun avec adresse, date de consultation et citation littérale, deux sources indépendantes par trait retenu — et sur le terrain quand des participants existent. Protocole écrit AVANT la collecte, version figée par commit, résultats non filtrés, biais déclarés, étiquetage obligatoire du niveau. Ne fait pas : inventer une citation, un chiffre ou un trait ; présenter le documentaire comme empirique ; requalifier une revue synthétique en preuve.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 4 | Recherche et synthèse utilisateur | `product-designer` | `Product Owner` |
| 13 | Périmètre, métriques et discovery ciblée de la release | `product-lead et product-designer` | `Product Owner` |
| 17 | Validation utilisateurs et convergence | `product-lead puis product-designer · quality-engineer orchestre la campagne SUX` | `Product Owner` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-04 — Recherche et synthèse utilisateur | `C1.3-parcours/research/research-plan.md · interviews/ · insights.md · personas/ · empathy-maps/ · journeys/as-is/` | G0 |
| WP-16 — Périmètre désirable et métriques de la release | `releases/{release-id}/scope.md · exclusions.md · success-metrics.md` | G1 |
| WP-17 — Brief de conception | `releases/{release-id}/design-brief.md · research/insights.md · research/journeys/to-be/` | K1 et G1 |
| WP-22 — Validation utilisateurs et convergence | `releases/{release-id}/research/tests/test-plan.md · sux/` | G1 |

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
