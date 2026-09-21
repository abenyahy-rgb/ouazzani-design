# living-data-model — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-11 — Navigation, architecture de l'information et terminologie

`design/spine/navigation.md · information-architecture.md · glossaire-utilisateur.md`

Cycle de vie : CORE INVARIANT · contrôlé en G0 · R/A : product-designer / Product Owner

Ce qui est cher à changer plus tard. Toute évolution après G0 rouvre le gate sur toutes les releases livrées.

- **Navigation globale** — couvrant toutes les étapes du squelette
- **Architecture de l'information**
- **TRM-nn glossaire utilisateur** — chaque terme unique, non ambigu, testé auprès d'un persona
- **Trace TRM → STG**

**Complétude.** Chaque terme testé auprès d'un persona. La navigation couvre toutes les étapes. Figé par tag Git immuable.

## WP-12 — Modèle de données vivant

`data/semantics.md · status-model.md · financial-semantics.md · model.generated.md · binding.yaml · migrations.md · semantics.yaml · schema.introspected.yaml`

Cycle de vie : vivant sous contrôle — noyau CORE INVARIANT figé en G0, couche dérivée régénérée à chaque sprint · contrôlé en G0 · R/A : product-lead / Product Owner

Le modèle de données du produit en trois couches, dont une seule est écrite à la main. La sémantique — catégories de vérité, statuts, règles financières — est arrêtée au socle et figée en G0. Le modèle dérivé est extrait du schéma exécuté, jamais rédigé. La table de liaison rattache chaque entité et chaque champ à un terme du glossaire et à une catégorie de vérité : c'est elle qui rend une dérive sémantique visible au sprint où elle survient plutôt que deux releases plus tard.

- **Catégories de vérité** — définies et disjointes
- **Modèle de statuts et progression**
- **Règles financières structurantes** — revues par le critic de domaine
- **Règle de propagation** — un calcul n'améliore jamais le statut de vérité de ses entrées
- **Modèle dérivé** — entités, champs, relations extraits du schéma exécuté — régénéré, jamais rédigé à la main
- **Table de liaison** — chaque entité et chaque champ résout vers un terme du glossaire et une catégorie de vérité — un élément non résolu est une dérive sémantique
- **Classement du noyau** — chaque entité et chaque champ du noyau étiqueté CORE INVARIANT ou EXTENSION par rayon d'impact, figé en G0
- **Journal des migrations** — chaque migration rattachée au sprint et à la story qui la motive ; une migration orpheline est un changement de socle non déclaré

**Complétude.** Catégories disjointes. Règle de propagation écrite et non contournable. Revue par le critic de domaine. Modèle dérivé régénéré depuis le schéma exécuté et non édité. Zéro élément non résolu dans la table de liaison. Toute modification d'un élément CORE INVARIANT hors C1 porte une exception EX déclarée, sinon K4 bloque.

```
Catégories de vérité  (disjointes)
  CONSTATÉ   relevé sur site, daté, avec auteur
  ENGAGÉ     contractualisé, non encore constaté
  ESTIMÉ     calculé à partir d'ENGAGÉ ou d'ESTIMÉ

Propagation  ESTIMÉ + CONSTATÉ = ESTIMÉ.  Jamais CONSTATÉ.
```

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

## WP-31 — Spécification fonctionnelle et technique

`releases/{release-id}/sprints/{sprint-id}/spec/functional-spec.md · acceptance-criteria.md · technical-spec.md`

Cycle de vie : figée en K1 · contrôlé en K1 · R/A : product-lead et principal-engineer / PO et autorité Tech

Le contrat d'implémentation. Figé avec la Design Baseline par un contrôle automatisé, pas par un gate humain.

- **Stories détaillées, règles métier, cas limites** — chaque règle citant la baseline, la décision produit ou le critic de domaine
- **AC** — chacun testable ; un AC non testable n'est pas un AC
- **Architecture, composants, données, API, migrations**
- **Carte AC → Evidence** — complète et nominative
- **Tier de risque proposé et justifié**
- **Plan de migration et de rollback**
- **NEEDS CLARIFICATION** — résolus ou routés avec porteur et échéance

**Complétude.** Carte AC → Evidence complète (K3). Un AC matériel sans evidence planifiée est un motif de refus, jamais une réserve. Escalade humaine si le delta touche le socle ou si le tier est R2/R3.
