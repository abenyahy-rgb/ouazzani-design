---
name: living-data-model
description: "Tenir le modèle de données en trois couches : sémantique écrite à la main et figée en G0, modèle dérivé extrait du schéma exécuté, table de liaison qui rattache chaque entité et chaque champ à un terme du glossaire et à une catégorie de vérité. Utiliser aux activités 8, 14, 18 de la méthode — Navigation, IA, terminologie et sémantique · Solution design de la release · Contrat de slice."
---

# living-data-model

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Tenir le modèle de données en trois couches : sémantique écrite à la main et figée en G0, modèle dérivé extrait du schéma exécuté, table de liaison qui rattache chaque entité et chaque champ à un terme du glossaire et à une catégorie de vérité. Ne fait pas : rédiger un modèle de données à la main — un modèle tenu par la discipline diverge au deuxième sprint, ce qui est exactement le défaut qu'il corrige.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 8 | Navigation, IA, terminologie et sémantique | `product-designer et product-lead` | `Product Owner` |
| 14 | Solution design de la release | `principal-engineer` | `autorité Tech` |
| 18 | Contrat de slice | `product-lead · product-designer · principal-engineer` | `Product Owner et autorité Tech` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-08 — Navigation, architecture de l'information et terminologie | `C1.4-socle/navigation/navigation.md · information-architecture.md · glossaire-utilisateur.md` | G0 |
| WP-09 — Modèle de données vivant | `C1.4-socle/data/semantics.md · status-model.md · financial-semantics.md · model.generated.md · binding.yaml · migrations.md · semantics.yaml · schema.introspected.yaml` | G0 |
| WP-18 — Solution design de la release | `releases/{release-id}/architecture/solution-design.md · interface-contracts.md · migration-impact.md` | G1 |
| WP-19 — Dépendances, risques techniques et tiers | `releases/{release-id}/architecture/dependencies.md · technical-risks.md · risk-tiers.md` | G1 |
| WP-24 — Contrat de slice | `releases/{release-id}/slices/{slice-id}/slice-contract.md · design/scope.yaml · design/prototype/ · design/design-system-delta/ · spec/acceptance-criteria.md · spec/technical-spec.md` | K1 |

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
