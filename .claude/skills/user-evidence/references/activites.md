# user-evidence — activités outillées

> Généré depuis `core/method.yaml`. Chargé à la demande, jamais d'office.

## Activité 4 — Recherche et synthèse utilisateur

**Entrée.** Thèse approuvée (WP-02) ; profil de domaine et sources approuvées (WP-03). Mode terrain seulement : consentement des participants obtenu.

**Tâche.** Écrire le plan de recherche AVANT la collecte : questions à trancher, segments visés, sources et requêtes prévues, biais attendus. Puis collecter, sur l'ensemble du parcours et avant tout découpage, des verbatims d'utilisateurs réels dans des sources publiques — chacun avec adresse, date de consultation et citation littérale ; plusieurs plateformes, pour ne pas épouser le biais d'une seule. En dériver en une passe des insights, des proto-personas PER-nn, leurs empathy maps et leurs journeys as-is avec irritants.

**Vérification.** Chaque verbatim porte adresse, date de consultation et citation littérale ; sans les trois, il est UNVALIDATED et ne fonde rien. Chaque trait de persona trace vers ≥ 2 verbatims de sources INDÉPENDANTES — deux messages du même fil ou trois pages citant la même étude sont une source. Aucune donnée démographique, aucun chiffre, aucune citation inventés ou reformulés en citation. Échantillon et biais déclarés : qui écrit en ligne, sur quelle plateforme, ce que cela exclut. Niveau d'evidence étiqueté sur chaque résultat — DOCUMENTARY pour le documentaire, EMPIRICAL pour le terrain seul. Les questions que seule une observation tranche sont listées en HYP-nn.

**Sortie.** Corpus commité ; niveau d'evidence étiqueté sur chaque résultat ; hypothèses à tester listées, avec l'activité qui les testera.

Responsible : `product-designer` · Accountable : `Product Owner` · Cadence C1, étape C1.3

## Activité 11 — Périmètre, métriques et discovery ciblée de la release

**Entrée.** G0 franchi ; release identifiée dans l'architecture.

**Tâche.** Définir le périmètre désirable le plus petit qui tienne debout seul, ce qui en est exclu, et comment on saura que la release a produit l'effet attendu. Compléter dans le même mouvement la recherche sur les SEULS parcours couverts, puis détailler les parcours cibles à l'intérieur du squelette figé.

**Vérification.** Le brief est renseigné par une recherche, pas l'inverse. Il tenait auparavant à l'étape précédente et la discovery à la suivante : on arrêtait donc un périmètre avant d'avoir cherché ce qui devait le déterminer. Chaque parcours cible se raccroche à une étape du squelette figé — aucun parcours hors squelette.

**Sortie.** scope.md, exclusions.md, success-metrics.md, design-brief.md, research/insights.md et research/journeys/to-be/ commités.

Responsible : `product-lead et product-designer` · Accountable : `Product Owner` · Cadence C2, étape C2.1

## Activité 16 — Validation utilisateurs et convergence

**Entrée.** Prototype QA-clean ; personas PER-nn documentés (WP-04) ; participants réels seulement s'il en existe, explicitement identifiés.

**Tâche.** Écrire le protocole AVANT le test ; figer la version testée ; conduire la revue synthétique par persona et la confrontation documentaire ; traiter les résultats, corriger le prototype et stabiliser le périmètre ; donner à chaque hypothèse de comportement non tranchée sa mesure en production.

**Vérification.** Version testée figée par commit. Protocole identique entre personas simulés comme entre participants. Revue synthétique conduite par un agent qui n'a pas conçu le prototype. Résultats non filtrés, y compris ceux qui contredisent la thèse. Chaque correction trace vers un constat étiqueté — SYNTHETIC, DOCUMENTARY ou EMPIRICAL. Aucune hypothèse de comportement déclarée validée sur une revue synthétique ou documentaire : elle est tranchée par des participants réels, ou reportée avec sa mesure en production.

**Sortie.** Résultats commités avec la version testée, chacun étiqueté ; hypothèses UNVALIDATED tranchées, ou reportées avec leur mesure en production — métrique, événement, seuil, décision.

Responsible : `product-lead puis product-designer` · Accountable : `Product Owner` · Cadence C2, étape C2.3
