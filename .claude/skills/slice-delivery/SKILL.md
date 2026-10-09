---
name: slice-delivery
description: "Conduire une slice verticale de bout en bout, une à la fois : contrat écrit avant le code — résultat utilisateur, budget de périmètre, critères de sortie avec leur preuve, tests définis d'avance —, implémentation dans la mutation boundary, exécution des tests, healing d'obsolescence, preuve E2E et déploiement en QA. Utiliser aux activités 18, 19 de la méthode — Contrat de slice · Construction et tests."
---

# slice-delivery

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Conduire une slice verticale de bout en bout, une à la fois : contrat écrit avant le code — résultat utilisateur, budget de périmètre, critères de sortie avec leur preuve, tests définis d'avance —, implémentation dans la mutation boundary, exécution des tests, healing d'obsolescence, preuve E2E et déploiement en QA. Ne fait pas : laisser grandir une slice — un écart est un amendement daté, ce qui dépasse va à une slice suivante.

## Procédure

1. Lire l'état : apf tower factory_state ; relire la clôture de la slice précédente et reporter chaque apprentissage « material » en condition d'entrée.
2. Écrire le contrat (WP-24) : résultat utilisateur, budget, ENTRY-n avec statut, EXIT-n avec mode ET canal, tests avant le code, KEEP / DISCARD si preuve technique, points ouverts classés, une seule demande de décision consolidée avec valeur par défaut.
3. Challenger le contrat par un critic en lecture seule, tenir les dispositions, échantillonner les citations ; puis K1.
4. GO consigné mot pour mot — factory_record_direction ; aucun code avant.
5. Construire par étapes de dépendance, test d'abord ; chaque étape revue avant fusion.
6. Golden path vert sur la CI hébergée ; DEV validé ; identité de la version enregistrée.
7. Promotion en QA par empreinte ; /version égale à DEV ; matrice état × comportement et oracles verts en QA.
8. Revues indépendantes, dispositions tenues, zéro BLOCKER de domaine PRODUIT.
9. Acceptation : script du Product Owner — parcours, canal, URL, compte, attendu ; jambes non exécutées REPORTÉES à une gate nommée ; verdict consigné mot pour mot.
10. Clôture : DISCARD retiré, état cumulatif et audit de non-perte, apprentissages « material », prochaine action.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 18 | Contrat de slice | `product-lead · product-designer · principal-engineer` | `Product Owner et autorité Tech` |
| 19 | Construction et tests | `principal-engineer · quality-engineer produit · critic(quality) classe` | `autorité Tech` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-24 — Contrat de slice | `releases/{release-id}/slices/{slice-id}/slice-contract.md · design/scope.yaml · design/prototype/ · design/design-system-delta/ · spec/acceptance-criteria.md · spec/technical-spec.md` | K1 |
| WP-25 — Construction et preuves | `releases/{release-id}/slices/{slice-id}/status.md · scope-changes.md · quality/test-strategy.md · quality/test-healing-decisions.md · acceptance/traceability-matrix.md · acceptance/preview-report.md` | G3 |

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
