# living-design — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-10 — Socle exécutable et prototype vivant

`C1.4-socle/prototype/spine/src/ · C1.4-socle/prototype/spine/dist/index.html · C1.4-socle/prototype/spine/spine.yaml · C1.4-socle/prototype/current/index.html · C1.4-socle/prototype/current/manifest.yaml · C1.4-socle/prototype/current/unsubordinated.md · C1.4-socle/prototype/current/deltas.yaml`

Cycle de vie : figé en G0 · contrôlé en G0 · R/A : product-designer / Product Owner

Le socle navigable en très haute fidélité structurelle — toutes les étapes existent, la navigation fonctionne, le vocabulaire est réel — ET son état courant composé : socle ⊕ deltas de release ⊕ deltas de slice. Un socle figé en G0 et un produit à la slice 5 ne sont pas deux livrables : c'est le même artefact vu à deux dates, et les tenir séparés obligeait à maintenir deux vérités.

- **Source exécutable** — sur la STACK DE CONCEPTION déclarée en WP-12, et sur la base de composants qu'elle nomme — jamais une chaîne de rendu écrite pour ce produit seul
- **Build et URL de preview DÉPLOYÉE** — déployée, pas seulement buildable : une URL que le métier ouvre sans rien installer. Un fichier local à ouvrir depuis un dépôt n'est pas une preview, c'est une pièce jointe
- **Couverture du squelette** — chaque STG atteignable
- **Liaison au corpus réel** — le socle lit WP-06 ; le chemin de données est nommé et vérifiable. AUCUNE fixture atteignable depuis ce livrable
- **Rendu des champs ABSENTS** — un champ que le corpus ne source pas est rendu comme absent et dit pourquoi — jamais comblé par une valeur vraisemblable
- **Composition** — socle ⊕ deltas de release ⊕ deltas de slice, appliqués dans l'ordre — aucun écran écrit directement ici
- **Manifeste de composition** — commit du socle, baseline de release, liste ordonnée des deltas de slice appliqués, horodatage
- **Couverture du squelette** — chaque STG reste atteignable après composition — un delta qui casse une étape est un défaut de subordination
- **Écarts non subordonnés** — tout écran présent après composition qui ne trace ni vers une étape du socle ni vers un delta déclaré est listé : un design non autorisé, pas une nouveauté
- **URL de preview courante** — une seule, celle que le métier ouvre

**Complétude.** Se parcourt de bout en bout sans écran mort. S'ouvre à une URL déployée. Le contenu vient de WP-06 : zéro fixture sur le chemin de données, point ÉLIMINATOIRE. Un socle conforme sur données inventées a déjà franchi G0 une fois — il n'a rien prouvé et a coûté une cadence entière.

## WP-18 — Strategic Design de la release

`releases/{release-id}/design/concept/ · design/src/ · design/dist/ · design-system-delta/`

Cycle de vie : figée en G1 · contrôlé en G1 · R/A : product-designer / Product Owner

Le prototype exécutable très haute fidélité couvrant de bout en bout l'expérience de la release, en remplissant le socle.

- **Alternatives explorées** — ≥ 3 matériellement distinctes avant convergence
- **Direction retenue** — comparée explicitement aux rejetées, avec motif ; ADR de direction
- **Storyboard de la release**
- **Source exécutable et build partageable** — URL de preview + commit figé
- **Delta de Design System** — chaque ajout justifié par un parcours, les 7 états couverts, intégré au système global
- **Fixtures** — réalistes, jamais de donnée inventée présentée comme réelle

**Complétude.** Couvre tous les parcours sans écran mort. N'altère ni navigation, ni IA, ni vocabulaire du socle. Aucun composant du socle modifié silencieusement.

## WP-21 — Rapport de Design QA

`releases/{release-id}/design/qa/report.md`

Cycle de vie : par passe · contrôlé en G1 · R/A : critic(design) / Product Owner

Premier handoff vers un évaluateur indépendant du producteur. Vérifie la cohérence et la subordination au socle.

- **Cohérence et conformité au Design System**
- **Responsive et états limites**
- **Accessibilité** — contrôle outillé, captures multi-device
- **Subordination au socle** — PASS ou FAIL avec preuves
- **Findings** — classés BLOCKER · MAJOR · MINOR · OBSERVATION

**Complétude.** Zéro BLOCKER ouvert. Captures multi-device produites. Contrôle accessibilité outillé, pas déclaratif.

## WP-25 — Contrat de slice

`releases/{release-id}/slices/{slice-id}/slice-contract.md · design/scope.yaml · design/prototype/ · design/design-system-delta/ · spec/acceptance-criteria.md · spec/technical-spec.md`

Cycle de vie : par slice · contrôlé en K1 · R/A : product-lead, product-designer, principal-engineer / Product Owner et autorité Tech

Ce que la slice doit produire, et la preuve qui dira qu'elle l'a produit — écrite AVANT le code. Une slice est verticale : données, API, écrans et tests livrés ensemble, pour un résultat qu'un utilisateur voit. Le contrat réunit ce que trois livrables de sprint séparaient — objectif, design, spécification — parce qu'on ne les lisait jamais l'un sans l'autre.

- **Résultat de la slice** — un résultat utilisateur en une phrase, démontrable en QA ; l'acceptation se prononce contre lui
- **Périmètre et budget** — stories retenues et exclusions ; ce qu'aucun critère de sortie n'exige est reporté — la slice ne grandit pas
- **Critères de sortie et preuves** — EXIT-n, chacun avec sa preuve : mode (automatique · manuel · mixte), CANAL (unitaire · intégration · émulateur · simulateur · web · appareil physique · environnement QA), procédure, réussite, échec, artefact retenu ; une preuve ne vaut que pour son canal, et une jambe non exécutée est REPORTÉE à une gate nommée, ou HORS PÉRIMÈTRE — jamais PASS
- **Tests définis avant le code** — chaque AC matériel → ≥ 1 test nommé ; changer un test, c'est amender le contrat
- **Baseline Delta Declaration** — MUST PRESERVE avant toute modification ; chaque delta justifié par une story ; écart de socle → EX3
- **Écrans et prototype** — chaque story exercée sur le prototype vivant, trois largeurs, états vides, erreur et chargement
- **Delta de Design System** — justifié story par story ; aucune modification silencieuse d'un composant existant
- **Règles, données, API, migrations** — chaque règle cite sa source ; migrations numérotées avec leur rollback
- **Tier de risque et sécurité** — le plus haut tier des stories retenues ; R2 ou R3 → escalade humaine en K1
- **Points ouverts** — NEEDS CLARIFICATION résolus ou routés — un NC ouvert ne passe pas K1 ; au plus une demande de décision au Product Owner, consolidée, avant l'acceptation
- **Amendements** — un écart découvert en construction est un amendement daté, jamais une croissance : ce qui dépasse va à une slice suivante
- **Conditions d'entrée** — ENTRY-n, chacune avec son statut MET · PENDING · DEFERRED et ce qui la lève ; inclut les prérequis EXTERNES — capacité de créer le dépôt, identifiants d'hôtes, adhésion aux stores et signature, chaîne d'outils imposée par le SDK, compte QA stable du Product Owner, dont il fixe lui-même le mot de passe hors Git et hors chat — et chaque apprentissage « material » de la slice précédente. Un prérequis externe n'est pas une décision produit, mais il se vérifie AVANT le GO
- **KEEP / DISCARD** — Slice 0 et toute preuve technique : chaque artefact classé KEEP ou DISCARD AVANT d'être écrit ; aucun import KEEP → DISCARD, vérifié par contrôle de dépendances ; le DISCARD est retiré à la clôture, migration forward-only comprise. Autre slice : « sans objet » et pourquoi

**Complétude.** Résultat formulé en résultat utilisateur. Chaque critère de sortie porte sa preuve et son canal. Chaque AC matériel a son test, défini avant le code. Baseline Delta Declaration produite avant toute modification. Chaque condition d'entrée porte son statut et ce qui la lève. Citations échantillonnées et « n confirmées / m corrigées » inscrit. Aucun NEEDS CLARIFICATION ouvert. Run Ledger ouvert (K8).

```
S-02  Un conducteur repère un écart et le signale sans appeler
  EXIT-1   l'écart apparaît en tête de liste       automatique · e2e/ecart-tri.spec
  EXIT-2   le signalement arrive au chef en < 1 min  mixte · e2e + relecture QA
  EXIT-3   aucun ESTIMÉ présenté comme CONSTATÉ   automatique · unit/propagation.test
  budget   tri secondaire, photos → S-04 ; la slice ne grandit pas
  tier     R2 → escalade K1
```
