# slice-delivery — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

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

## WP-26 — Construction et preuves

`releases/{release-id}/slices/{slice-id}/status.md · scope-changes.md · quality/test-strategy.md · quality/test-healing-decisions.md · acceptance/traceability-matrix.md · acceptance/preview-report.md`

Cycle de vie : par slice · contrôlé en G3 · R/A : principal-engineer · quality-engineer produit · critic(quality) classe / autorité Tech

Ce qui a été construit contre le contrat, et la preuve de chaque critère de sortie. Rend visible tout écart entre le contrat et le code : l'absorption silencieuse est le défaut que ce livrable existe pour empêcher. La classification d'un test rouge est rendue par critic(quality), jamais par celui qui a écrit le test ou le code.

- **Écarts contrat / implémentation** — classés : manquant · partiel · contredit · non demandé · intentionnellement superseded — chacun décidé ou routé
- **Résultats par critère de sortie** — par EXIT et par AC : test, VERT ou ROUGE, date, commit — fait observable, sans interprétation
- **VERDICT DE CLASSIFICATION** — PASS · PRODUCT FAILURE · TEST FAILURE · CANNOT VERIFY, par test rouge, rendu par critic(quality) uniquement
- **Healing et re-vérifications** — uniquement pour TEST FAILURE, chaque healing re-vérifié par une passe indépendante ; un défaut produit n'est jamais healed
- **Matrice contrat — code — tests — décisions** — une ligne par story ; chaque écart classé, rien d'absorbé
- **Parcours exécutés en QA** — joués sur le prototype vivant recomposé — une seule URL et son commit —, pas seulement en test automatisé
- **Dette et risques résiduels acceptés** — nommés, avec porteur et échéance
- **Matrice état × comportement** — un élément d'inventaire touché par la slice par ligne ; atteint · avant · Back · restauré · édité · persistant · reste inchangé · aval ; PASS ou N/A motivé — jamais vide ; jouée en QA, sur la version déployée
- **Oracles et causes racines** — chaque oracle : la question générale, les états balayés, les touches ; les touches regroupées par cause racine — corriger le mécanisme, jamais l'instance ; un oracle entre en régression permanente
- **Identité de la version** — commit, empreinte de l'artefact, version de migration, empreinte de configuration, versions épinglées ; l'artefact validé en DEV est celui promu en QA — même empreinte, vérifiée par /version ; golden path de la CI hébergée : VERT, ou NOT RUN avec sa raison — jamais PASS

**Complétude.** Chaque critère de sortie porte sa preuve retenue, avec son canal. Tout écart classé (EX4). Chaque test rouge classé par critic(quality). Aucun PRODUCT FAILURE masqué. Parcours critiques exécutés en QA sur le prototype vivant. Matrice état × comportement sans cellule vide ; oracles connus rejoués sans touche. Version en QA identique, par empreinte, à la version validée en DEV.
