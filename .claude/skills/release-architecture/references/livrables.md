# release-architecture — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-14 — Architecture et séquencement des releases

`C1.5-lancement/releases/release-architecture.md · sequencing.md · dependencies.md · risk-map.md · fiches/`

Cycle de vie : vivante sous contrôle · contrôlé en G0 · R/A : product-lead / Product Owner

Le découpage en tranches à proposition de valeur autonome, et leur ordre. La décision la plus structurante du cycle.

- **REL-nom — une fiche par release** — proposition de valeur, étapes couvertes
- **Les trois tests, démontrés par release** — désirable seule · livrable seule · mesurable seule
- **Liens typés vers le squelette** — INTRODUCES exactement une fois · ENRICHES sans limite · DEPENDS-ON vers une release antérieure
- **Séquencement** — ordonné par valeur et par risque, jamais par facilité
- **Dépendances** — chacune nommée et datée, aucun cycle
- **Tier de risque pressenti par release**

**Complétude.** Chaque STG affecté à exactement une release en INTRODUCES (K1). Aucune dépendance circulaire ni vers une release postérieure.

```
REL-pilotage  Voir l'avancement sans appeler personne
  désirable seule   oui — supprime le point du matin à elle seule
  livrable seule    oui — aucune dépendance vers REL-2
  mesurable seule   oui — OUT-01
  INTRODUCES  STG-04, STG-05
  ENRICHES    —
  tier pressenti    R2  (accès aux données de chantier)
```

## WP-15 — Décision G0 et fermeture d'apprentissage

`C1.5-lancement/gates/g0-product-architecture.md · spine-manifest.yaml`

Cycle de vie : figé · contrôlé en G0 · R/A : factory-lead / Product Owner

L'assemblage est DÉRIVÉ, il ne se recopie plus. Les éléments de charte viennent des livrables qui les portent, les résultats de contrôle des contrôles eux-mêmes, les verdicts des critics, et la décision — motif, autorité, date, commit — du Run Ledger où la tour l'a inscrite au franchissement. Recopier à la main ce que la machine sait déjà produisait un document qui pouvait CONTREDIRE ses propres sources, et c'est le seul document qu'un gate lit. Reste ici ce qu'aucune machine ne sait écrire : ce que ce passage nous a appris.

- **Fermeture d'apprentissage** — ce qui a coûté · ce qui a surpris · ce qu'un agent aurait dû détecter

**Complétude.** Chaque élément de la charte présent (K7). Zéro BLOCKER ouvert. Socle figé par tag Git immuable.

## WP-16 — Périmètre désirable et métriques de la release

`releases/{release-id}/scope.md · exclusions.md · success-metrics.md`

Cycle de vie : figé en G1 · contrôlé en G1 · R/A : product-lead / Product Owner

Le plus petit périmètre qui tienne debout seul, et comment on saura qu'il a produit l'effet attendu.

- **Périmètre désirable**
- **Exclusions** — écrites aussi précisément que les inclusions
- **Étapes du squelette couvertes** — exactement celles affectées, ni plus ni moins
- **Les trois tests, démontrés**
- **Métriques de succès** — une par outcome, avec méthode de mesure et source de donnée

**Complétude.** Le périmètre couvre exactement les étapes affectées. Aucune métrique non instrumentable avec ce que la release livre.

## WP-17 — Brief de conception

`releases/{release-id}/design-brief.md · research/insights.md · research/journeys/to-be/`

Cycle de vie : vivant · contrôlé en K1 et G1 · R/A : product-lead / product-designer

Contrat d'entrée des activités de conception. Un brief n'est jamais absent : il est sous-spécifié, et un designer autonome comble alors par inférence silencieuse.

- **Sujet concret** — pas la catégorie — le vernaculaire du métier
- **Utilisateur et conditions matérielles** — écran de chantier au soleil ≠ tableau de bord de bureau
- **Job principal de l'écran ou du parcours**
- **Ce que le socle fige déjà** — NON NÉGOCIABLE — la réponse est dans le dépôt
- **Directions rejetées et pourquoi**
- **Niveau d'evidence sur ce parcours** — NON NÉGOCIABLE — EMPIRICAL, DOCUMENTARY, SYNTHETIC ou UNVALIDATED
- **Tier de risque de ce que l'écran manipule** — NON NÉGOCIABLE
- **Hypothèses posées faute de réponse** — étiquetées UNVALIDATED, testées à l'activité 17
- **Insights de release** — strictement limités au périmètre ; les autres sont routés au backlog
- **JRN-nn parcours cibles** — trace vers STG et REL
- **Conformité au socle attestée** — ordre et vocabulaire inchangés
- **Besoins de modification du socle** — routés vers G0 (EX3), jamais appliqués ici

**Complétude.** Les trois questions non négociables sont renseignées. Les questions manquantes ont fait l'objet d'une salve unique de quatre au maximum. Toute hypothèse posée a son point de test.
