# living-data-model — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-08 — Navigation, architecture de l'information et terminologie

`C1.4-socle/navigation/navigation.md · information-architecture.md · glossaire-utilisateur.md`

Cycle de vie : CORE INVARIANT · contrôlé en G0 · R/A : product-designer / Product Owner

Ce qui est cher à changer plus tard. Toute évolution après G0 rouvre le gate sur toutes les releases livrées.

- **Navigation globale** — couvrant toutes les étapes du squelette
- **Architecture de l'information**
- **TRM-nn glossaire utilisateur** — chaque terme unique, non ambigu, testé auprès d'un persona
- **Trace TRM → STG**

**Complétude.** Chaque terme testé auprès d'un persona. La navigation couvre toutes les étapes. Figé par tag Git immuable.

## WP-09 — Modèle de données vivant

`C1.4-socle/data/semantics.md · status-model.md · financial-semantics.md · model.generated.md · binding.yaml · migrations.md · semantics.yaml · schema.introspected.yaml`

Cycle de vie : vivant sous contrôle — noyau CORE INVARIANT figé en G0, couche dérivée régénérée à chaque slice · contrôlé en G0 · R/A : product-lead / Product Owner

Le modèle de données du produit en trois couches, dont une seule est écrite à la main. La sémantique — catégories de vérité, statuts, règles financières — est arrêtée au socle et figée en G0. Le modèle dérivé est extrait du schéma exécuté, jamais rédigé. La table de liaison rattache chaque entité et chaque champ à un terme du glossaire et à une catégorie de vérité : c'est elle qui rend une dérive sémantique visible à la slice où elle survient plutôt que deux releases plus tard.

- **Catégories de vérité** — définies et disjointes
- **Modèle de statuts et progression**
- **Règles financières structurantes** — revues par le critic de domaine
- **Règle de propagation** — un calcul n'améliore jamais le statut de vérité de ses entrées
- **Modèle dérivé** — entités, champs, relations extraits du schéma exécuté — régénéré, jamais rédigé à la main
- **Table de liaison** — chaque entité et chaque champ résout vers un terme du glossaire et une catégorie de vérité — un élément non résolu est une dérive sémantique
- **Classement du noyau** — chaque entité et chaque champ du noyau étiqueté CORE INVARIANT ou EXTENSION par rayon d'impact, figé en G0
- **Journal des migrations** — chaque migration rattachée à la slice et à la story qui la motive ; une migration orpheline est un changement de socle non déclaré

**Complétude.** Catégories disjointes. Règle de propagation écrite et non contournable. Revue par le critic de domaine. Modèle dérivé régénéré depuis le schéma exécuté et non édité. Zéro élément non résolu dans la table de liaison. Toute modification d'un élément CORE INVARIANT hors C1 porte une exception EX déclarée, sinon K4 bloque.

```
Catégories de vérité  (disjointes)
  CONSTATÉ   relevé sur site, daté, avec auteur
  ENGAGÉ     contractualisé, non encore constaté
  ESTIMÉ     calculé à partir d'ENGAGÉ ou d'ESTIMÉ

Propagation  ESTIMÉ + CONSTATÉ = ESTIMÉ.  Jamais CONSTATÉ.
```

## WP-18 — Solution design de la release

`releases/{release-id}/architecture/solution-design.md · interface-contracts.md · migration-impact.md`

Cycle de vie : figé en G1 · contrôlé en G1 · R/A : principal-engineer / autorité Tech

Comment les parcours de cette release se réalisent dans le socle technique. Le pendant du Strategic Design, côté ingénierie, à la même cadence.

- **Composants touchés et créés**
- **Contrats d'interface** — chacun versionné et testable
- **Flux de données** — confrontés aux catégories de vérité du socle
- **Impacts de migration et réversibilité**
- **Attestation de conformité au socle technique** — ou deltas explicitement portés en G0
- **Écarts au socle** — routés vers G0 (EX3), jamais appliqués ici

**Complétude.** S'inscrit dans le socle technique sans modifier un CORE INVARIANT. Chaque contrat d'interface est testable.

## WP-19 — Dépendances, risques techniques et tiers

`releases/{release-id}/architecture/dependencies.md · technical-risks.md · risk-tiers.md`

Cycle de vie : vivant · contrôlé en G1 · R/A : principal-engineer / autorité Tech

L'entrée technique que l'activité 17 exigeait sans jamais l'avoir. Un backlog ne qualifie pas une dépendance ni ne propose un tier sans architecture de solution.

- **Dépendances par capacité** — technique, de donnée, d'apprentissage — chacune nommée et datée
- **Absence de cycle** — démontrée, pas affirmée
- **Risques techniques** — chacun avec sa parade ou son acceptation nommée
- **Tier de risque par capacité** — R0 à R3, justifié — commande l'evidence et les autorités en aval
- **Capacités non faisables dans cette release** — nommées et routées

**Complétude.** Aucune dépendance circulaire ni vers une release postérieure. Chaque capacité porte un tier justifié. Sans ce livrable, l'activité 17 est BLOCKED — input manquant.

## WP-24 — Contrat de slice

`releases/{release-id}/slices/{slice-id}/slice-contract.md · design/scope.yaml · design/prototype/ · design/design-system-delta/ · spec/acceptance-criteria.md · spec/technical-spec.md`

Cycle de vie : par slice · contrôlé en K1 · R/A : product-lead, product-designer, principal-engineer / Product Owner et autorité Tech

Ce que la slice doit produire, et la preuve qui dira qu'elle l'a produit — écrite AVANT le code. Une slice est verticale : données, API, écrans et tests livrés ensemble, pour un résultat qu'un utilisateur voit. Le contrat réunit ce que trois livrables de sprint séparaient — objectif, design, spécification — parce qu'on ne les lisait jamais l'un sans l'autre.

- **Résultat de la slice** — un résultat utilisateur en une phrase, démontrable en QA ; l'acceptation se prononce contre lui
- **Périmètre et budget** — stories retenues et exclusions ; ce qu'aucun critère de sortie n'exige est reporté — la slice ne grandit pas
- **Critères de sortie et preuves** — EXIT-n, chacun avec sa preuve : mode (automatique · manuel · mixte), procédure, réussite, échec, artefact retenu
- **Tests définis avant le code** — chaque AC matériel → ≥ 1 test nommé ; changer un test, c'est amender le contrat
- **Baseline Delta Declaration** — MUST PRESERVE avant toute modification ; chaque delta justifié par une story ; écart de socle → EX3
- **Écrans et prototype** — chaque story exercée sur le prototype vivant, trois largeurs, états vides, erreur et chargement
- **Delta de Design System** — justifié story par story ; aucune modification silencieuse d'un composant existant
- **Règles, données, API, migrations** — chaque règle cite sa source ; migrations numérotées avec leur rollback
- **Tier de risque et sécurité** — le plus haut tier des stories retenues ; R2 ou R3 → escalade humaine en K1
- **Points ouverts** — NEEDS CLARIFICATION résolus ou routés — un NC ouvert ne passe pas K1 ; au plus une demande de décision au Product Owner, consolidée, avant l'acceptation
- **Amendements** — un écart découvert en construction est un amendement daté, jamais une croissance : ce qui dépasse va à une slice suivante

**Complétude.** Résultat formulé en résultat utilisateur. Chaque critère de sortie porte sa preuve. Chaque AC matériel a son test, défini avant le code. Baseline Delta Declaration produite avant toute modification. Aucun NEEDS CLARIFICATION ouvert. Run Ledger ouvert (K8).

```
S-02  Un conducteur repère un écart et le signale sans appeler
  EXIT-1   l'écart apparaît en tête de liste       automatique · e2e/ecart-tri.spec
  EXIT-2   le signalement arrive au chef en < 1 min  mixte · e2e + relecture QA
  EXIT-3   aucun ESTIMÉ présenté comme CONSTATÉ   automatique · unit/propagation.test
  budget   tri secondaire, photos → S-04 ; la slice ne grandit pas
  tier     R2 → escalade K1
```
