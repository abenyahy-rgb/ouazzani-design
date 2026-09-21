# real-corpus — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-40 — Corpus réel et provenance

`data/corpus/corpus-scope.md · provenance.yaml · truth-map.yaml · coverage.md · records/`

Cycle de vie : vivant, enrichi à chaque release ; sa PROVENANCE ne se réécrit jamais · contrôlé en G0 · R/A : data-steward / Product Owner

Le contenu que le produit affiche à un utilisateur, avec de quoi le contredire. Dans un produit de données, le corpus EST le produit : un socle, un Design System et une architecture peuvent être justes tandis que le produit ne dit rien de vrai. Ce livrable existe parce que ce cas s'est produit — une cadence C1 complète, dix-sept livrables, huit revues, et un corpus de trente-deux enregistrements inventés étiquetés FIXTURE qui a franchi G0.

- **Périmètre du corpus** — le minimum qui rend le squelette parcourable de bout en bout, dérivé des STG et non d'une ambition d'exhaustivité
- **Sources retenues et écartées** — chacune tracée vers WP-06 ; une source hors sources approuvées est un écart, pas un raccourci
- **Provenance par enregistrement** — adresse, date de lecture, citation littérale. Les trois, ou l'enregistrement est UNVALIDATED
- **Catégorie de vérité par champ** — SOURCÉ · DÉRIVÉ · ABSENT. Aucune quatrième valeur, et surtout pas une valeur vraisemblable
- **Couverture mesurée contre le squelette** — chiffrée par STG, jamais appréciée en prose
- **Écarts et champs non sourçables** — nommés un à un ; un champ ABSENT est une information sur le monde, pas un trou à combler
- **Fixtures de test et leur confinement** — s'il en existe, elles vivent hors des chemins servis au produit et le disent ; une fixture atteignable depuis un livrable de design est un défaut, pas une commodité

**Complétude.** Chaque enregistrement sourcé porte ses trois champs de recevabilité. Couverture chiffrée par STG et écarts nommés. Verdict de recevabilité de critic(domaine) présent. AUCUNE fixture sur un chemin servi à un livrable de design ou de produit — ce point est éliminatoire, il ne se solde pas en dette.

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
