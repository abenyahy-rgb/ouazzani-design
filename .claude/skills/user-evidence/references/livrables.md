# user-evidence — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-08 — Recherche et synthèse utilisateur

`research/research-plan.md · interviews/ · insights.md · personas/ · empathy-maps/ · journeys/as-is/`

Cycle de vie : vivant · contrôlé en G0 · R/A : product-designer / Product Owner

Le corpus d'observations sur l'ensemble du parcours, avant tout découpage, et sa synthèse en une passe.

- **Plan de recherche** — écrit AVANT le recrutement
- **Verbatims tracés** — échantillon et biais connus déclarés
- **Insights** — aucun sans observation source
- **PER-nn personas** — chaque trait tracé vers ≥ 2 observations
- **Empathy maps** — aucune projection non observée ; unknowns marqués
- **Journeys as-is et irritants** — chaque irritant daté, sourcé, rattaché à un persona

**Complétude.** Aucun insight sans observation source. Niveau d'evidence étiqueté sur chaque résultat. Personas challengés par critic(product).

## WP-20 — Discovery ciblée et parcours cibles

`releases/{release-id}/research/insights.md · journeys/to-be/`

Cycle de vie : figé en G1 · contrôlé en G1 · R/A : product-designer / Product Owner

Complète la recherche sur les seuls parcours de la release, puis les détaille à l'intérieur du squelette figé.

- **Insights de release** — strictement limités au périmètre ; les autres sont routés au backlog
- **JRN-nn parcours cibles** — trace vers STG et REL
- **Conformité au socle attestée** — ordre et vocabulaire inchangés
- **Besoins de modification du socle** — routés vers G0 (EX3), jamais appliqués ici

**Complétude.** Les parcours s'inscrivent dans le squelette sans en modifier l'ordre ni le vocabulaire. Aucun écart au socle non routé.

## WP-25 — Validation utilisateurs et convergence

`releases/{release-id}/research/tests/test-plan.md`

Cycle de vie : par passe · contrôlé en G1 · R/A : product-lead / Product Owner

La seule preuve qui établit un fait sur le comportement d'un utilisateur. Le livrable le plus abusable de la méthode.

- **Protocole** — écrit AVANT le recrutement, identique entre participants
- **Version testée** — figée par commit, citée
- **Participants** — recrutement, nombre, biais connus déclarés
- **Résultats bruts** — non filtrés, y compris ceux qui contredisent la thèse
- **Niveau d'evidence** — EMPIRICAL · SYNTHETIC · UNVALIDATED — étiquette obligatoire
- **Hypothèses UNVALIDATED confrontées** — chacune tranchée ou reportée avec motif
- **Corrections** — chacune traçant vers une observation

**Complétude.** Protocole antérieur au test. Version figée par commit. Résultats non filtrés. Niveau d'evidence étiqueté — une revue synthétique présentée comme empirique est un BLOCKER.

```
Protocole  écrit le 04/06, avant recrutement
Version    commit 7f2a91c, gelée
Panel      6 conducteurs de travaux, 2 gérants
            biais : tous issus du réseau du sponsor
Niveau     EMPIRICAL
HYP-03     falsifiée — 3 profils sur 10 hors cible
            décrivent l'irritant. Périmètre resserré.
```
