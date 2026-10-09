---
name: spine-build
description: "Figer navigation, IA, terminologie et sémantique, puis produire le socle navigable en très haute fidélité structurelle avec ses fondations de Design System. Utiliser aux activités 7, 8, 9 de la méthode — Fondations du Design System · Navigation, IA, terminologie et sémantique · Socle exécutable."
---

# spine-build

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Figer navigation, IA, terminologie et sémantique, puis produire le socle navigable en très haute fidélité structurelle avec ses fondations de Design System.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 7 | Fondations du Design System | `product-designer` | `Product Owner` |
| 8 | Navigation, IA, terminologie et sémantique | `product-designer et product-lead` | `Product Owner` |
| 9 | Socle exécutable | `product-designer` | `Product Owner` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-07 — Fondations du Design System | `C1.4-socle/design-system/design-brief.md · explorations/ · surface-briefs/ · tokens.css · tokens.json · fonts/ · icons/ · components/ · component-catalog.html` | G0 |
| WP-08 — Navigation, architecture de l'information et terminologie | `C1.4-socle/navigation/navigation.md · information-architecture.md · glossaire-utilisateur.md` | G0 |
| WP-09 — Modèle de données vivant | `C1.4-socle/data/semantics.md · status-model.md · financial-semantics.md · model.generated.md · binding.yaml · migrations.md · semantics.yaml · schema.introspected.yaml` | G0 |
| WP-10 — Socle exécutable et prototype vivant | `C1.4-socle/prototype/spine/src/ · C1.4-socle/prototype/spine/dist/index.html · C1.4-socle/prototype/spine/spine.yaml · C1.4-socle/prototype/current/index.html · C1.4-socle/prototype/current/manifest.yaml · C1.4-socle/prototype/current/unsubordinated.md · C1.4-socle/prototype/current/deltas.yaml` | G0 |

Plan de contenu et critère de complétude de chacun : **`references/livrables.md`**.

## Contrat d'entrée

Si un artefact d'entrée déclaré manque, retourner `BLOCKED — input manquant`. Ne jamais inférer : produire sur un matériau deviné donne un résultat plausible et invérifiable, ce que la méthode existe pour empêcher.

**Activité 7 — arrêt dur.** Squelette arrêté ; design-brief.md renseigné ; contraintes d'accessibilité, de langue et d'usage déclarées ; STACK DE CONCEPTION arrêtée par ADR — framework, base de composants, moteur de styles, cible de déploiement, outillage de conception assistée. Son absence produit BLOCKED : décider la stack après la première décision visuelle n'est plus une décision, c'est une justification.

Ces inputs se RECUEILLENT auprès d'un humain, dans la salve unique de quatre questions au maximum (EX2). Ne jamais les dériver du nom du dépôt, du contexte de la session, ni d'un fichier existant.

**Activité 9 — arrêt dur.** Fondations, composants, navigation, IA et sémantique disponibles. CORPUS RÉEL recevable (WP-06) : son absence produit BLOCKED, et jamais un jeu de fixtures écrit pour débloquer l'activité.

Ces inputs se RECUEILLENT auprès d'un humain, dans la salve unique de quatre questions au maximum (EX2). Ne jamais les dériver du nom du dépôt, du contexte de la session, ni d'un fichier existant.

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
