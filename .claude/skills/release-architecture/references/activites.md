# release-architecture — activités outillées

> Généré depuis `core/method.yaml`. Chargé à la demande, jamais d'office.

## Activité 11 — Découpage et séquencement des releases

**Entrée.** Socle exécutable disponible.

**Tâche.** Découper le produit en releases à proposition de valeur autonome, les ordonner, qualifier dépendances, risques et hypothèses.

**Vérification.** Chaque release satisfait les trois tests. Chaque étape affectée à exactement une release (K1). Aucune dépendance circulaire. Tier pressenti par release.

**Sortie.** Architecture commitée ; première release identifiée.

Responsible : `product-lead` · Accountable : `Product Owner` · Cadence C1, étape C1.5

## Activité 12 — Périmètre, métriques et discovery ciblée de la release

**Entrée.** G0 franchi ; release identifiée dans l'architecture.

**Tâche.** Définir le périmètre désirable le plus petit qui tienne debout seul, ce qui en est exclu, et comment on saura que la release a produit l'effet attendu. Compléter dans le même mouvement la recherche sur les SEULS parcours couverts, puis détailler les parcours cibles à l'intérieur du squelette figé.

**Vérification.** Le brief est renseigné par une recherche, pas l'inverse. Il tenait auparavant à l'étape précédente et la discovery à la suivante : on arrêtait donc un périmètre avant d'avoir cherché ce qui devait le déterminer. Chaque parcours cible se raccroche à une étape du squelette figé — aucun parcours hors squelette.

**Sortie.** scope.md, exclusions.md, success-metrics.md, design-brief.md, research/insights.md et research/journeys/to-be/ commités.

Responsible : `product-lead et product-designer` · Accountable : `Product Owner` · Cadence C2, étape C2.1
