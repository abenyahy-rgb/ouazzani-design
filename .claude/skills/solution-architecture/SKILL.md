---
name: solution-architecture
description: "Arrêter l'architecture cible et la réalisation technique d'une release, classer chaque élément en CORE INVARIANT ou EXTENSION par rayon d'impact, et exiger une alternative rejetée pour toute décision structurante. Utiliser aux activités 10, 15 de la méthode — Socle technique et choix structurants · Solution design de la release."
---

# solution-architecture

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Arrêter l'architecture cible et la réalisation technique d'une release, classer chaque élément en CORE INVARIANT ou EXTENSION par rayon d'impact, et exiger une alternative rejetée pour toute décision structurante. Ne fait pas : décider une architecture sans confronter le squelette entier, ni modifier un CORE INVARIANT depuis C2 ou C3.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 10 | Socle technique et choix structurants | `principal-engineer` | `autorité Tech` |
| 15 | Solution design de la release | `principal-engineer` | `autorité Tech` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-11 — Architecture technique cible | `C1.4-socle/architecture/target-architecture.md · integration-boundaries.md · data-persistence.md · deployment-topology.md · security-architecture.md · non-functional.md` | G0 |
| WP-12 — Décisions structurantes et build-vs-buy | `C1.4-socle/decisions/adr/ · build-vs-buy.md` | G0 |
| WP-19 — Solution design de la release | `releases/{release-id}/architecture/solution-design.md · interface-contracts.md · migration-impact.md` | G1 |
| WP-20 — Dépendances, risques techniques et tiers | `releases/{release-id}/architecture/dependencies.md · technical-risks.md · risk-tiers.md` | G1 |

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
