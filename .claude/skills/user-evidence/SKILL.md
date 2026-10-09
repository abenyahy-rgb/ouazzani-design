---
name: user-evidence
description: "Produire une preuve utilisateur opposable, sans dépendre d'humains à recruter : en recherche DOCUMENTAIRE par défaut — verbatims d'utilisateurs réels lus dans des sources publiques, chacun avec adresse, date de consultation et citation littérale, deux sources indépendantes par trait retenu — et sur le terrain quand des participants existent. Utiliser aux activités 4, 13, 17 de la méthode — Recherche et synthèse utilisateur · Périmètre, métriques et discovery ciblée de la release · Validation utilisateurs et convergence."
---

# user-evidence

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Produire une preuve utilisateur opposable, sans dépendre d'humains à recruter : en recherche DOCUMENTAIRE par défaut — verbatims d'utilisateurs réels lus dans des sources publiques, chacun avec adresse, date de consultation et citation littérale, deux sources indépendantes par trait retenu — et sur le terrain quand des participants existent. Protocole écrit AVANT la collecte, version figée par commit, résultats non filtrés, biais déclarés, étiquetage obligatoire du niveau. Ne fait pas : inventer une citation, un chiffre ou un trait ; présenter le documentaire comme empirique ; requalifier une revue synthétique en preuve.

## Procédure

1. Écrire et commiter le plan AVANT de chercher : les questions à trancher, les segments, les requêtes prévues par famille de sources, dans les MOTS des utilisateurs et non ceux du produit, et le biais attendu de chaque plateforme.
2. Chercher soi-même, par la recherche web de l'activité : au moins quatre familles de sources — avis d'applications et de services concurrents, forums et communautés, questions-réponses, études et rapports publics, statistiques officielles — et y inclure ceux qui ont abandonné et ceux qui n'utilisent rien. Une seule plateforme épouse son biais.
3. Consigner chaque verbatim dans interviews/S-nn.md à la lecture : adresse, date de consultation, citation LITTÉRALE, profil déclaré de l'auteur. Jamais de paraphrase entre guillemets.
4. Chercher jusqu'à SATURATION : s'arrêter quand trois sources de suite n'apportent plus de thème nouveau, et l'écrire. Un persona porté par moins d'une dizaine de verbatims est un brouillon, et il le dit.
5. Synthétiser par regroupement d'affinités : verbatims → thèmes → insights. Un insight est une TENSION dite en une phrase — ce que la personne veut, et ce qui l'en empêche —, avec ses sources et sa solidité ; un thème qu'une seule source porte est faible et le dit.
6. Construire les personas sur des VARIABLES DE COMPORTEMENT : quatre à six axes tirés des verbatims (fréquence, outil, autonomie, rapport au risque…), placer chaque auteur, retenir les groupes qui se distinguent. Deux à quatre personas, un fichier PER-nn chacun ; leurs curseurs montrent ce qui les sépare. Deux personas qui parlent de la même voix n'en font qu'un.
7. Une empathy map par persona : « Dit » en citations littérales, « Fait » rapporté par les sources, « Pense » et « Ressent » inférés et sourcés ; douleurs et gains pour finir. Un cadran que rien ne fonde reste vide.
8. Un journey as-is par persona : trois à huit étapes dites dans ses mots, l'émotion de −2 à +2 tirée des sources, le moment de vérité au point bas, et pour chaque douleur majeure une opportunité formulée en « Comment pourrions-nous… », rattachée à son HYP-nn.
9. Se relire contre les défauts du métier : stéréotype, détail inventé pour faire vrai, persona qui veut ce que le produit vend, citation reformulée, voix identique d'un persona à l'autre, courbe complétée sans source. Puis critic(product) vérifie chaque citation contre sa source.
10. Rendre le livrable en PowerPoint (« apf livrable WP-04 ») : une planche par persona, une empathy map et un journey map par persona, le titre de chaque planche disant l'insight. Une planche que la machine refuse signale une donnée manquante : la compléter par une source, jamais par une estimation.

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
