# release-architecture — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-16 — Architecture et séquencement des releases

`releases/release-architecture.md · sequencing.md · dependencies.md · risk-map.md · fiches/`

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

## WP-17 — Pack de preuves G0

`gates/g0-product-architecture.md · spine-manifest.yaml`

Cycle de vie : figé · contrôlé en G0 · R/A : factory-lead / Product Owner

Assemblé, jamais pré-arbitré. Un pack incomplet n'est pas soumis, il est renvoyé.

- **Les huit éléments de la charte G0** — squelette · socle exécutable + commit · navigation, IA, glossaire · sémantique · fondations DS · architecture de releases · séquencement · verdicts
- **Résultats des contrôles K1, K2, K3**
- **Verdicts critic(product) et critic(domaine)** — consolidés par sévérité
- **Niveau d'evidence par élément** — EMPIRICAL sur le parcours le plus incertain
- **Décision, motif, autorité, date, commit**
- **Fermeture d'apprentissage** — ce qui a coûté · ce qui a surpris · ce qu'un agent aurait dû détecter

**Complétude.** Chaque élément de la charte présent (K7). Zéro BLOCKER ouvert. Socle figé par tag Git immuable.

## WP-18 — Périmètre désirable et métriques de la release

`releases/{release-id}/scope.md · exclusions.md · success-metrics.md`

Cycle de vie : figé en G1 · contrôlé en G1 · R/A : product-lead / Product Owner

Le plus petit périmètre qui tienne debout seul, et comment on saura qu'il a produit l'effet attendu.

- **Périmètre désirable**
- **Exclusions** — écrites aussi précisément que les inclusions
- **Étapes du squelette couvertes** — exactement celles affectées, ni plus ni moins
- **Les trois tests, démontrés**
- **Métriques de succès** — une par outcome, avec méthode de mesure et source de donnée

**Complétude.** Le périmètre couvre exactement les étapes affectées. Aucune métrique non instrumentable avec ce que la release livre.

## WP-19 — Brief de conception

`releases/{release-id}/design-brief.md`

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

**Complétude.** Les trois questions non négociables sont renseignées. Les questions manquantes ont fait l'objet d'une salve unique de quatre au maximum. Toute hypothèse posée a son point de test.
