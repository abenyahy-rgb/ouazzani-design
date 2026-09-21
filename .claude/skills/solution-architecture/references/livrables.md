# solution-architecture — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-14 — Architecture technique cible

`architecture/target-architecture.md · integration-boundaries.md · data-persistence.md · deployment-topology.md · security-architecture.md · non-functional.md`

Cycle de vie : CORE INVARIANT · contrôlé en G0 · R/A : principal-engineer / autorité Tech

Ce qui est cher à changer côté technique. Le pendant exact du socle de design : jusqu'ici la méthode gelait le vocabulaire en G0 et laissait la persistance se décider au premier sprint.

- **Frontières d'intégration** — ce que le produit possède, ce qu'il consomme, et le contrat entre les deux
- **Modèle de persistance** — aligné sur les catégories de vérité du socle sémantique, jamais inventé à côté
- **Topologie de déploiement**
- **Architecture de sécurité** — surfaces, authentification, autorisation, secrets — cohérente avec les tiers de risque
- **Contraintes non fonctionnelles** — chacune chiffrée : sans nombre, ce n'est pas une contrainte
- **Classement de chaque élément** — CORE INVARIANT ou EXTENSION, par rayon d'impact
- **Couverture du squelette** — l'architecture supporte toutes les étapes, y compris celles des releases lointaines

**Complétude.** Chaque élément classé. L'architecture couvre l'intégralité du squelette. Figée par tag Git : un CORE INVARIANT modifié hors C1 est bloqué par K4.

## WP-15 — Décisions structurantes et build-vs-buy

`decisions/adr/ · build-vs-buy.md`

Cycle de vie : CORE INVARIANT ou EXTENSION selon la décision · contrôlé en G0 · R/A : principal-engineer / autorité Tech

Les choix qu'on ne refait pas, et ce qu'ils excluent. Une décision d'architecture sans alternative rejetée n'est pas une décision : c'est un défaut par omission.

- **ADR-nn — la décision** — en une phrase
- **Alternatives rejetées** — au moins une, avec le motif du rejet
- **Ce que la décision exclut** — la contrepartie, explicitement
- **Build ou achat** — pour chaque capacité non différenciante
- **Reprise de la stack de conception** — La STACK DE CONCEPTION est arrêtée en WP-10, à l'ouverture de l'activité 6 : elle conditionne la première décision visuelle et ne peut pas attendre l'activité 9. Elle est REPRISE ici pour être classée CORE INVARIANT ou EXTENSION et confrontée à l'architecture cible. Une divergence entre la stack de conception et la stack de build est un finding, jamais deux vérités qu'on réconcilie au premier sprint.
- **Classement** — CORE INVARIANT si sa remise en cause invalide du livré, EXTENSION sinon
- **Conditions de réexamen** — ce qui, si observé, rouvrirait la décision

**Complétude.** Chaque ADR nomme au moins une alternative rejetée et ce que la décision exclut. Chaque décision est classée, l'ADR de stack de conception compris.

## WP-22 — Solution design de la release

`releases/{release-id}/architecture/solution-design.md · interface-contracts.md · migration-impact.md`

Cycle de vie : figé en G1 · contrôlé en G1 · R/A : principal-engineer / autorité Tech

Comment les parcours de cette release se réalisent dans le socle technique. Le pendant du Strategic Design, côté ingénierie, à la même cadence.

- **Composants touchés et créés**
- **Contrats d'interface** — chacun versionné et testable
- **Flux de données** — confrontés aux catégories de vérité du socle
- **Impacts de migration et réversibilité**
- **Attestation de conformité au socle technique** — ou deltas explicitement portés en G0
- **Écarts au socle** — routés vers G0 (EX3), jamais appliqués ici

**Complétude.** S'inscrit dans le socle technique sans modifier un CORE INVARIANT. Chaque contrat d'interface est testable.

## WP-23 — Dépendances, risques techniques et tiers

`releases/{release-id}/architecture/dependencies.md · technical-risks.md · risk-tiers.md`

Cycle de vie : vivant · contrôlé en G1 · R/A : principal-engineer / autorité Tech

L'entrée technique que l'activité 19 exigeait sans jamais l'avoir. Un backlog ne qualifie pas une dépendance ni ne propose un tier sans architecture de solution.

- **Dépendances par capacité** — technique, de donnée, d'apprentissage — chacune nommée et datée
- **Absence de cycle** — démontrée, pas affirmée
- **Risques techniques** — chacun avec sa parade ou son acceptation nommée
- **Tier de risque par capacité** — R0 à R3, justifié — commande l'evidence et les autorités en aval
- **Capacités non faisables dans cette release** — nommées et routées

**Complétude.** Aucune dépendance circulaire ni vers une release postérieure. Chaque capacité porte un tier justifié. Sans ce livrable, l'activité 19 est BLOCKED — input manquant.
