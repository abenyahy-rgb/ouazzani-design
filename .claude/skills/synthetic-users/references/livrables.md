# synthetic-users — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-13 — Campagne SUX du socle

`C1.4-socle/experience/sux/protocole.md · plan-de-campagne.yaml · pare-feu.yaml · resultats/ · annotations/ · synthese.md · patterns.yaml`

Cycle de vie : Figée par candidat : une campagne est liée au sha256 du socle qu'elle a testé ; un socle corrigé appelle une régression, jamais la réécriture d'une observation. · contrôlé en G0 · R/A : quality-engineer / product-lead

Éprouver la STRUCTURE du socle — chemin, mots, parcours d'argent et de droits — auprès d'utilisateurs synthétiques AVEUGLES, avant que G0 ne la fige en CORE INVARIANT. La seule preuve, avant le gel, que le squelette, la navigation et le glossaire se comprennent sans connaître l'intention.

- **Protocole** — écrit AVANT les sessions ; version du protocole, rôles séparés — orchestrateur, agent utilisateur aveugle, observateur, chercheur, triage — et ce que chacun reçoit et ne reçoit jamais
- **Candidat testé** — commit du socle, sha256 du build, URL DÉPLOYÉE ; chaque session s'ouvre et se ferme sur lui
- **Personas et missions** — fiches de faits de vie tirées des PER-nn et de leurs verbatims, rendues en prose, contrôle de cohérence ; missions dites avec les mots de l'utilisateur, avec leur arrêt naturel ; aucun mot de l'interface
- **Pare-feu** — liste fermée du vocabulaire interne (TRM-nn, écrans, étapes) et manifeste haché des entrées exactes de chaque session, écrit avant elle
- **Résultats bruts** — une capture par action, journal de chaque session, fin consignée ; index des empreintes — immuables ; une session racontée est rejetée
- **Patterns et triage** — chaque pattern cite les sessions qui le montrent et celles qui le contredisent ; chaque constat trié est routé vers WP-05, WP-08, WP-10, ou classé ARRÊT ATTENDU, HORS CHAMP, SANS SUITE
- **Limites** — « N sessions synthétiques », jamais « N utilisateurs » ; sessions corrélées (même modèle, mêmes gabarits) ; aucun score ni seuil ; n'établit aucun fait sur une personne réelle

**Complétude.** Les sept pièces présentes ; K7 rejoue SUX1–SUX6 sans constat : manifeste antérieur et haché, candidat égal au socle figé, filtre de vocabulaire passé, interaction réelle, patterns cités, étiquetage synthétique. Chaque constat routé vers WP-05, WP-08 ou WP-10 est traité, ou porté en réserve datée, avant G0.

## WP-22 — Validation utilisateurs et convergence

`releases/{release-id}/research/tests/test-plan.md · sux/`

Cycle de vie : par passe · contrôlé en G1 · R/A : product-lead / Product Owner

La preuve la plus forte disponible sur le comportement des utilisateurs, étiquetée pour ce qu'elle est. Sans participants : revue synthétique par persona, confrontation documentaire, et mesure en production pour ce que seule l'observation tranche. Le livrable le plus abusable de la méthode.

- **Protocole** — écrit AVANT le test, identique entre personas simulés comme entre participants
- **Version testée** — figée par commit, citée
- **Participants** — personas PER-nn de la revue experte, étiquetés SYNTHETIC · AXR, et l'agent qui les incarne ; sessions de la campagne SUX, étiquetées SYNTHETIC · SUX, comptées en « sessions synthétiques » ; participants réels s'il en existe — recrutement, nombre, biais
- **Résultats bruts** — non filtrés, y compris ceux qui contredisent la thèse
- **Niveau d'evidence** — EMPIRICAL · DOCUMENTARY · SYNTHETIC · AXR · SYNTHETIC · SUX · UNVALIDATED — étiquette obligatoire
- **Hypothèses UNVALIDATED confrontées** — chacune tranchée par des participants réels, ou reportée avec sa mesure en production — métrique, événement, seuil, décision
- **Corrections** — chacune traçant vers un constat étiqueté — SYNTHETIC · AXR, SYNTHETIC · SUX, DOCUMENTARY ou EMPIRICAL
- **Revue experte (AXR)** — critic(product), qui connaît l'intention et n'a pas conçu le prototype : plan de couverture écrit avant, résultat par unité, constats observés et reproduits — jamais présentée comme un test d'utilisateur
- **Campagne SUX** — utilisateurs synthétiques aveugles sur le prototype de release figé, même protocole qu'avant G0 : pare-feu, manifeste haché, résultats bruts, patterns, triage ; la campagne vit sous sux/

**Complétude.** Protocole antérieur au test. Version figée par commit. Résultats non filtrés. Revue experte AXR et campagne SUX séparées, chacune étiquetée ; K7 rejoue la campagne SUX sans constat. Niveau d'evidence étiqueté — une revue synthétique ou documentaire présentée comme empirique est un BLOCKER, une revue experte présentée comme un test d'utilisateur aussi. Chaque hypothèse de comportement non tranchée par des participants réels porte sa mesure en production.

```
Protocole  écrit le 04/06, avant le test — 3 tâches
Version    commit 7f2a91c, gelée
Panel      PER-01 et PER-03 simulés · SYNTHETIC
            incarnés par critic(product), qui n'a pas
            conçu le prototype
Niveau     SYNTHETIC · DOCUMENTARY
HYP-02     fragilisée — PER-01 bute sur « ESTIMÉ » ;
            S-07 le confirme. Libellé corrigé (C-2).
HYP-04     reportée — mesure en production : relevés
            par chef et par jour, seuil 0,8 à 4 semaines,
            sous le seuil → relevé hebdomadaire.
```
