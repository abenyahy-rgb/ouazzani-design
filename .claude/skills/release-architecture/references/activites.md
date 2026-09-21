# release-architecture — activités outillées

> Généré depuis `core/method.yaml`. Chargé à la demande, jamais d'office.

## Activité 10 — Découpage et séquencement des releases

**Entrée.** Socle exécutable disponible.

**Tâche.** Découper le produit en releases à proposition de valeur autonome, les ordonner, qualifier dépendances, risques et hypothèses.

**Vérification.** Chaque release satisfait les trois tests. Chaque étape affectée à exactement une release (K1). Aucune dépendance circulaire. Tier pressenti par release.

**Sortie.** Architecture commitée ; première release identifiée.

Responsible : `product-lead` · Accountable : `Product Owner` · Cadence C1, étape C1.5

## Activité 11 — Périmètre et métriques de la release

**Entrée.** G0 franchi ; release identifiée dans l'architecture.

**Tâche.** Définir le périmètre désirable le plus petit qui tienne debout seul, ce qui en est exclu, et comment on saura que la release a produit l'effet attendu.

**Vérification.** Le périmètre a été interrogé jusqu'à épuisement des décisions implicites. Le périmètre couvre exactement les étapes affectées. Chaque métrique a une méthode de mesure et une source ; aucune non instrumentable.

**Sortie.** scope.md, exclusions.md, success-metrics.md commités.

Responsible : `product-lead` · Accountable : `Product Owner` · Cadence C2, étape C2.1
