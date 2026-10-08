# spine-build — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-07 — Fondations du Design System

`C1.4-socle/design-system/design-brief.md · explorations/ · surface-briefs/ · tokens.css · tokens.json · fonts/ · icons/ · components/ · component-catalog.html`

Cycle de vie : cumulatif, jamais forké · contrôlé en G0 · R/A : product-designer / Product Owner

Les éléments visuels réutilisables et leurs règles. Enrichis à chaque release ; jamais réinventés.

- **Brief de conception** — renseigné AVEC l'humain qui répond du produit AVANT la première décision visuelle — public prioritaire, barre de craft, interdits, direction épinglée ou ouverte ; son absence produit BLOCKED
- **Design system de départ et décision** — le départ servi par la tour, montré sur un vrai écran du produit ; la décision de l'humain — gardé, adapté ou écarté —, ce qui a changé s'il est adapté, qui a tranché et quand
- **Stack de conception et base de composants** — ADR arrêté AVANT la première décision visuelle : framework d'interface, base de composants accessibles retenue, moteur de styles, cible de déploiement de la preview, et l'outillage de conception assistée employé. La méthode est agnostique de stack ; elle n'est pas agnostique du COÛT d'en écrire une. Ne rien déclarer ne laisse pas le choix ouvert : cela mandate de fait le tout-à-la-main. Le tout-à-la-main a produit, sur un produit de quatorze écrans, un socle mono-fichier de 345 ko, quatorze composants réécrits depuis zéro et une chaîne de rendu propriétaire — du budget de conception dépensé en plomberie. L'ADR nomme la base retenue et surtout CE QU'ELLE DISPENSE D'ÉCRIRE ; les tokens et les composants de ce produit en sont alors un DELTA, jamais une création ex nihilo.
- **Directions concurrentes et direction retenue** — départ gardé : il est la direction retenue et l'ADR le dit. Adapté ou écarté : au moins trois directions construites, le départ compris, conservées dans explorations/ ; l'ADR nomme les écartées et ce qui les a départagées
- **Brief de surface et contrat de direction** — un brief par surface ; contrat de direction en six blocs — THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM, FINISH — écrit AVANT le code et jamais recopié dans un artefact livré au navigateur
- **Tokens** — dérivés du départ retenu — couleurs avec leur rôle, typographies et échelle, espacements, rayons, ombres, surfaces —, grilles et responsive ; exportables en CSS et JSON
- **Composants et variantes** — chacun exposant les 7 états : normal, hover, focus, erreur, vide, loading, disabled
- **Accessibilité** — contraste WCAG AA vérifié par outil, pas à l'œil
- **Catalogue navigable** — exécutable hors environnement de développement

**Complétude.** La décision sur le design system de départ — gardé, adapté ou écarté — est consignée avec qui l'a prise. Stack de conception arrêtée par ADR AVANT la première décision visuelle. Contraste AA vérifié par outil. Les 7 états couverts pour chaque composant. Catalogue ouvrable. Chaque composant écrit à la main l'est parce que la base retenue ne le couvre pas, et le dit — un composant réécrit sans motif est du budget de conception dépensé en plomberie.

## WP-08 — Navigation, architecture de l'information et terminologie

`C1.4-socle/navigation/navigation.md · information-architecture.md · glossaire-utilisateur.md`

Cycle de vie : CORE INVARIANT · contrôlé en G0 · R/A : product-designer / Product Owner

Ce qui est cher à changer plus tard. Toute évolution après G0 rouvre le gate sur toutes les releases livrées.

- **Navigation globale** — couvrant toutes les étapes du squelette
- **Architecture de l'information**
- **TRM-nn glossaire utilisateur** — chaque terme unique, non ambigu, testé auprès d'un persona
- **Trace TRM → STG**

**Complétude.** Chaque terme testé auprès d'un persona. La navigation couvre toutes les étapes. Figé par tag Git immuable.

## WP-09 — Modèle de données vivant

`C1.4-socle/data/semantics.md · status-model.md · financial-semantics.md · model.generated.md · binding.yaml · migrations.md · semantics.yaml · schema.introspected.yaml`

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

## WP-10 — Socle exécutable et prototype vivant

`C1.4-socle/prototype/spine/src/ · C1.4-socle/prototype/spine/dist/index.html · C1.4-socle/prototype/spine/spine.yaml · C1.4-socle/prototype/current/index.html · C1.4-socle/prototype/current/manifest.yaml · C1.4-socle/prototype/current/unsubordinated.md · C1.4-socle/prototype/current/deltas.yaml`

Cycle de vie : figé en G0 · contrôlé en G0 · R/A : product-designer / Product Owner

Le socle navigable en très haute fidélité structurelle — toutes les étapes existent, la navigation fonctionne, le vocabulaire est réel — ET son état courant composé : socle ⊕ deltas de release ⊕ deltas de sprint. Un socle figé en G0 et un produit au sprint 5 ne sont pas deux livrables : c'est le même artefact vu à deux dates, et les tenir séparés obligeait à maintenir deux vérités.

- **Source exécutable** — sur la STACK DE CONCEPTION déclarée en WP-12, et sur la base de composants qu'elle nomme — jamais une chaîne de rendu écrite pour ce produit seul
- **Build et URL de preview DÉPLOYÉE** — déployée, pas seulement buildable : une URL que le métier ouvre sans rien installer. Un fichier local à ouvrir depuis un dépôt n'est pas une preview, c'est une pièce jointe
- **Couverture du squelette** — chaque STG atteignable
- **Liaison au corpus réel** — le socle lit WP-06 ; le chemin de données est nommé et vérifiable. AUCUNE fixture atteignable depuis ce livrable
- **Rendu des champs ABSENTS** — un champ que le corpus ne source pas est rendu comme absent et dit pourquoi — jamais comblé par une valeur vraisemblable
- **Composition** — socle ⊕ deltas de release ⊕ deltas de sprint, appliqués dans l'ordre — aucun écran écrit directement ici
- **Manifeste de composition** — commit du socle, baseline de release, liste ordonnée des deltas de sprint appliqués, horodatage
- **Couverture du squelette** — chaque STG reste atteignable après composition — un delta qui casse une étape est un défaut de subordination
- **Écarts non subordonnés** — tout écran présent après composition qui ne trace ni vers une étape du socle ni vers un delta déclaré est listé : un design non autorisé, pas une nouveauté
- **URL de preview courante** — une seule, celle que le métier ouvre

**Complétude.** Se parcourt de bout en bout sans écran mort. S'ouvre à une URL déployée. Le contenu vient de WP-06 : zéro fixture sur le chemin de données, point ÉLIMINATOIRE. Un socle conforme sur données inventées a déjà franchi G0 une fois — il n'a rien prouvé et a coûté une cadence entière.
