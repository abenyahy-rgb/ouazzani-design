# sprint-delivery — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-24 — Sprint goal et plan

`releases/{release-id}/sprints/{sprint-id}/candidate-scope.md · sprint-goal.md · sprint-plan.md · risks.md`

Cycle de vie : par sprint · contrôlé en G2 · R/A : product-lead puis factory-lead / Product Owner

Ce que le sprint doit produire, formulé en résultat utilisateur. L'acceptance se prononcera contre lui, pas contre la liste des stories.

- **Sprint Goal** — un résultat utilisateur, jamais une liste de tâches
- **Stories retenues** — aucune sans AC ; aucune empruntée à une autre release sans décision enregistrée
- **Séquencement et capacité confrontée au périmètre**
- **Risques et exclusions explicites**
- **Chemin EXPRESS déclaré le cas échéant** — avant démarrage — a posteriori est un écart MAJOR
- **Tier de risque pressenti**

**Complétude.** Sprint Goal formulé en résultat utilisateur. Capacité confrontée au périmètre. Run Ledger ouvert (K8).

## WP-26 — Spécification fonctionnelle et technique

`releases/{release-id}/sprints/{sprint-id}/spec/functional-spec.md · acceptance-criteria.md · technical-spec.md`

Cycle de vie : figée en K1 · contrôlé en K1 · R/A : product-lead et principal-engineer / PO et autorité Tech

Le contrat d'implémentation. Figé avec la Design Baseline par un contrôle automatisé, pas par un gate humain.

- **Stories détaillées, règles métier, cas limites** — chaque règle citant la baseline, la décision produit ou le critic de domaine
- **AC** — chacun testable ; un AC non testable n'est pas un AC
- **Architecture, composants, données, API, migrations**
- **Carte AC → Evidence** — complète et nominative
- **Tier de risque proposé et justifié**
- **Plan de migration et de rollback**
- **NEEDS CLARIFICATION** — résolus ou routés avec porteur et échéance

**Complétude.** Carte AC → Evidence complète (K3). Un AC matériel sans evidence planifiée est un motif de refus, jamais une réserve. Escalade humaine si le delta touche le socle ou si le tier est R2/R3.

## WP-27 — Journal de build et écarts de périmètre

`releases/{release-id}/sprints/{sprint-id}/status.md · scope-changes.md`

Cycle de vie : vivant · contrôlé en G3 · R/A : principal-engineer / autorité Tech

Rend visible tout écart entre ce qui était spécifié et ce qui est implémenté. L'absorption silencieuse est le défaut que ce livrable existe pour empêcher.

- **Écarts spec / implémentation** — classés : manquant · partiel · contredit · non demandé · intentionnellement superseded

**Complétude.** Tout écart classé. Aucune absorption silencieuse (EX4). Commits atomiques, tests locaux verts avant push.

## WP-28 — Stratégie, résultats et classification de tests

`releases/{release-id}/sprints/{sprint-id}/quality/test-strategy.md · releases/{release-id}/sprints/{sprint-id}/quality/test-healing-decisions.md · releases/{release-id}/sprints/{sprint-id}/acceptance/traceability-matrix.md · releases/{release-id}/sprints/{sprint-id}/acceptance/preview-report.md`

Cycle de vie : par sprint · contrôlé en G3 · R/A : quality-engineer produit · critic(quality) classe / factory-lead

Deux livrables distincts sous un même dossier : la preuve, produite par le quality-engineer, et sa classification, rendue par un critic. Les séparer est ce qui fait tenir P2.

- **Stratégie de test** — chaque AC matériel a ≥ 1 test planifié ; les AC non couverts sont nommés et justifiés
- **Résultats bruts** — tracés AC par AC — fait observable, non jugé
- **VERDICT DE CLASSIFICATION** — PASS · PRODUCT FAILURE · TEST FAILURE · CANNOT VERIFY — rendu par critic(quality), jamais par le producteur du test
- **Décisions de healing** — chacune déclarant sa cause ; un défaut produit n'est JAMAIS healed
- **Re-vérifications indépendantes** — obligatoires avant fermeture d'un healing
- **Matrice baseline — spec — code — tests — décisions** — complète, chaque écart classé
- **Parcours métier critiques exécutés sur la preview** — pas seulement en test automatisé
- **URL de preview et commit**
- **Dette et risques résiduels acceptés** — nommés, avec échéance et porteur

**Complétude.** Chaque AC matériel tracé vers une evidence exécutée. Classification rendue par critic(quality). Aucun PRODUCT FAILURE masqué. Trois healings sur le même AC = défaut produit non diagnostiqué, escalade N1.

```
AC-014.2  Un ESTIMÉ n'est jamais présenté comme CONSTATÉ
  test        e2e/verite-propagation.spec  ·  ROUGE
  producteur  quality-engineer, mode GENERATE
  classification  PRODUCT FAILURE  —  rendue par critic(quality)
              le calcul remonte CONSTATÉ depuis un ESTIMÉ
  suite       routé vers 19. Healing interdit (EX4).
```
