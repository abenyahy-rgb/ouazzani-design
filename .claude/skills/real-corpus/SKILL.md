---
name: real-corpus
description: "Constituer le CORPUS RÉEL du produit avant le socle : périmètre minimal suffisant pour parcourir le squelette de bout en bout, acquisition depuis les sources approuvées de WP-03, une ligne de provenance par enregistrement — adresse, date de lecture, citation littérale —, catégorie de vérité par champ, et couverture mesurée contre le squelette. Utiliser aux activités 6, 8 de la méthode — Corpus réel et provenance · Navigation, IA, terminologie et sémantique."
---

# real-corpus

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Constituer le CORPUS RÉEL du produit avant le socle : périmètre minimal suffisant pour parcourir le squelette de bout en bout, acquisition depuis les sources approuvées de WP-03, une ligne de provenance par enregistrement — adresse, date de lecture, citation littérale —, catégorie de vérité par champ, et couverture mesurée contre le squelette. Ne fait pas : produire un jeu de fixtures. Une fixture est un outil de test ; elle ne franchit jamais un gate et ne s'affiche jamais dans un livrable présenté au métier.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 6 | Corpus réel et provenance | `data-steward` | `Product Owner` |
| 8 | Navigation, IA, terminologie et sémantique | `product-designer et product-lead` | `Product Owner` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-06 — Corpus réel et provenance | `C1.3-parcours/corpus/corpus-scope.md · provenance.yaml · truth-map.yaml · coverage.md · records/` | G0 |
| WP-08 — Navigation, architecture de l'information et terminologie | `C1.4-socle/navigation/navigation.md · information-architecture.md · glossaire-utilisateur.md` | G0 |
| WP-09 — Modèle de données vivant | `C1.4-socle/data/semantics.md · status-model.md · financial-semantics.md · model.generated.md · binding.yaml · migrations.md · semantics.yaml · schema.introspected.yaml` | G0 |

Plan de contenu et critère de complétude de chacun : **`references/livrables.md`**.

## Contrat d'entrée

Si un artefact d'entrée déclaré manque, retourner `BLOCKED — input manquant`. Ne jamais inférer : produire sur un matériau deviné donne un résultat plausible et invérifiable, ce que la méthode existe pour empêcher.

**Activité 6 — arrêt dur.** Sources approuvées du domaine disponibles (WP-03) ; squelette de parcours arrêté (WP-05) — il donne le périmètre minimal que le corpus doit couvrir. L'un des deux absent produit BLOCKED.

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
