# user-evidence — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-04 — Recherche et synthèse utilisateur

`C1.3-parcours/research/research-plan.md · interviews/ · insights.md · personas/ · empathy-maps/ · journeys/as-is/`

Cycle de vie : vivant · contrôlé en G0 · R/A : product-designer / Product Owner

Le corpus d'observations sur l'ensemble du parcours, avant tout découpage, et sa synthèse en une passe.

- **Plan de recherche** — écrit AVANT le recrutement
- **Verbatims tracés** — échantillon et biais connus déclarés
- **Insights** — aucun sans observation source
- **PER-nn personas** — chaque trait tracé vers ≥ 2 observations
- **Empathy maps** — aucune projection non observée ; unknowns marqués
- **Journeys as-is et irritants** — chaque irritant daté, sourcé, rattaché à un persona

**Complétude.** Aucun insight sans observation source. Niveau d'evidence étiqueté sur chaque résultat. Personas challengés par critic(product).

## WP-15 — Périmètre désirable et métriques de la release

`releases/{release-id}/scope.md · exclusions.md · success-metrics.md`

Cycle de vie : figé en G1 · contrôlé en G1 · R/A : product-lead / Product Owner

Le plus petit périmètre qui tienne debout seul, et comment on saura qu'il a produit l'effet attendu.

- **Périmètre désirable**
- **Exclusions** — écrites aussi précisément que les inclusions
- **Étapes du squelette couvertes** — exactement celles affectées, ni plus ni moins
- **Les trois tests, démontrés**
- **Métriques de succès** — une par outcome, avec méthode de mesure et source de donnée

**Complétude.** Le périmètre couvre exactement les étapes affectées. Aucune métrique non instrumentable avec ce que la release livre.

## WP-16 — Brief de conception

`releases/{release-id}/design-brief.md · research/insights.md · research/journeys/to-be/`

Cycle de vie : vivant · contrôlé en K1 et G1 · R/A : product-lead / product-designer

Contrat d'entrée des activités de conception. Un brief n'est jamais absent : il est sous-spécifié, et un designer autonome comble alors par inférence silencieuse.

- **Sujet concret** — pas la catégorie — le vernaculaire du métier
- **Utilisateur et conditions matérielles** — écran de chantier au soleil ≠ tableau de bord de bureau
- **Job principal de l'écran ou du parcours**
- **Ce que le socle fige déjà** — NON NÉGOCIABLE — la réponse est dans le dépôt
- **Directions rejetées et pourquoi**
- **Niveau d'evidence sur ce parcours** — NON NÉGOCIABLE — EMPIRICAL, SYNTHETIC ou UNVALIDATED
- **Tier de risque de ce que l'écran manipule** — NON NÉGOCIABLE
- **Hypothèses posées faute de réponse** — étiquetées UNVALIDATED, testées à l'activité 16
- **Insights de release** — strictement limités au périmètre ; les autres sont routés au backlog
- **JRN-nn parcours cibles** — trace vers STG et REL
- **Conformité au socle attestée** — ordre et vocabulaire inchangés
- **Besoins de modification du socle** — routés vers G0 (EX3), jamais appliqués ici

**Complétude.** Les trois questions non négociables sont renseignées. Les questions manquantes ont fait l'objet d'une salve unique de quatre au maximum. Toute hypothèse posée a son point de test.

## WP-21 — Validation utilisateurs et convergence

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
