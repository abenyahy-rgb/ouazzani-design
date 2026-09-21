# sprint-delivery — activités outillées

> Généré depuis `core/method.yaml`. Chargé à la demande, jamais d'office.

## Activité 18 — Sprint goal et périmètre

**Entrée.** G1 franchi ; backlog à jour ; retours du sprint précédent traités.

**Tâche.** Sélectionner les stories candidates, définir objectif, séquencement, risques et critères de succès.

**Vérification.** Capacité confrontée au périmètre. Aucune story sans AC. Sprint Goal formulé en résultat utilisateur, pas en liste de tâches.

**Sortie.** sprint-goal.md, sprint-plan.md, risks.md commités ; Run Ledger ouvert.

Responsible : `product-lead puis factory-lead` · Accountable : `Product Owner` · Cadence C3, étape C3.1

## Activité 20 — Spécification fonctionnelle et technique

**Entrée.** Prototype de sprint stabilisé.

**Tâche.** Détailler stories, règles métier, cas limites et AC ; définir architecture, données, API, migrations, sécurité, observabilité et tests.

**Vérification.** Chaque AC testable. Chaque règle cite la baseline, la décision produit ou le critic de domaine. Carte AC → Evidence complète. Tier proposé et justifié. Migrations et rollback décrits. Modèle dérivé régénéré depuis le schéma exécuté : chaque entité et chaque champ créés par ce sprint résolvent vers un terme du glossaire et une catégorie de vérité.

**Sortie.** spec/ et ADRs commités ; NEEDS CLARIFICATION résolus ou routés ; modèle de données vivant régénéré, table de liaison sans élément non résolu, chaque migration rattachée à sa story. Un champ non résolu ne passe pas K1.

Responsible : `product-lead et principal-engineer` · Accountable : `PO et autorité Tech` · Cadence C3, étape C3.2

## Activité 21 — Build

**Entrée.** K1 franchi ; branche de travail créée ; environnement isolé.

**Tâche.** Implémenter les stories depuis le contrat figé, dans la mutation boundary déclarée, et documenter tout écart.

**Vérification.** Aucune modification hors mutation boundary. Commits atomiques. Tests locaux verts avant push. Tout écart classé. NEEDS CLARIFICATION marqué plutôt qu'un comportement inventé.

**Sortie.** Code poussé ; status.md et scope-changes.md à jour.

Responsible : `principal-engineer` · Accountable : `autorité Tech` · Cadence C3, étape C3.3

## Activité 22 — Tests et evidence

**Entrée.** Contrat approuvé ; AC disponibles ; build déployable ; critic(quality) disponible et indépendant.

**Tâche.** Modes PLAN et GENERATE : dériver et exécuter les tests, produire les résultats bruts tracés AC par AC. Mode HEAL : réparer les tests obsolètes.

**Vérification.** Chaque AC matériel a ≥ 1 test planifié. LA CLASSIFICATION est rendue par critic(quality), jamais par le producteur du test. Tout healing exige une re-vérification indépendante.

**Sortie.** quality/ commité ; aucun PRODUCT FAILURE masqué.

Responsible : `quality-engineer produit · critic(quality) classe` · Accountable : `factory-lead` · Cadence C3, étape C3.3
