# living-design — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-13 — Socle exécutable

`design/spine/src/ · dist/index.html · spine.yaml`

Cycle de vie : figé en G0 · contrôlé en G0 · R/A : product-designer / Product Owner

Le socle navigable en très haute fidélité structurelle : toutes les étapes existent, la navigation fonctionne, le vocabulaire est réel, le détail des écrans ne l'est pas encore.

- **Source exécutable** — sur la STACK DE CONCEPTION déclarée en WP-15, et sur la base de composants qu'elle nomme — jamais une chaîne de rendu écrite pour ce produit seul
- **Build et URL de preview DÉPLOYÉE** — déployée, pas seulement buildable : une URL que le métier ouvre sans rien installer. Un fichier local à ouvrir depuis un dépôt n'est pas une preview, c'est une pièce jointe
- **Couverture du squelette** — chaque STG atteignable
- **Liaison au corpus réel** — le socle lit WP-40 ; le chemin de données est nommé et vérifiable. AUCUNE fixture atteignable depuis ce livrable
- **Rendu des champs ABSENTS** — un champ que le corpus ne source pas est rendu comme absent et dit pourquoi — jamais comblé par une valeur vraisemblable

**Complétude.** Se parcourt de bout en bout sans écran mort. S'ouvre à une URL déployée. Le contenu vient de WP-40 : zéro fixture sur le chemin de données, point ÉLIMINATOIRE. Un socle conforme sur données inventées a déjà franchi G0 une fois — il n'a rien prouvé et a coûté une cadence entière.

## WP-39 — Prototype vivant

`design/current/index.html · manifest.yaml · unsubordinated.md · deltas.yaml`

Cycle de vie : composé, régénéré à chaque sprint — jamais écrit à la main · contrôlé en G0 · R/A : product-designer / Product Owner

L'état courant du produit, en un seul endroit ouvrable. La méthode gelait trois prototypes à trois niveaux — socle en G0, Strategic Design en G1, tranche de sprint en K1 — et aucun ne représente le produit au sprint 5 de la release 2 : le socle est périmé, le Strategic Design aussi, la tranche de sprint ne couvre que les écrans impactés. Le prototype vivant est leur COMPOSITION, dans l'ordre socle puis deltas de release puis deltas de sprint. Ce n'est pas un quatrième prototype à maintenir : il est calculé, donc il ne peut pas mentir.

- **Composition** — socle ⊕ deltas de release ⊕ deltas de sprint, appliqués dans l'ordre — aucun écran écrit directement ici
- **Manifeste de composition** — commit du socle, baseline de release, liste ordonnée des deltas de sprint appliqués, horodatage
- **Couverture du squelette** — chaque STG reste atteignable après composition — un delta qui casse une étape est un défaut de subordination
- **Écarts non subordonnés** — tout écran présent après composition qui ne trace ni vers une étape du socle ni vers un delta déclaré est listé : un design non autorisé, pas une nouveauté
- **URL de preview courante** — une seule, celle que le métier ouvre

**Complétude.** Régénéré par build, jamais édité : une édition directe est détectée par recomposition et comparaison. Manifeste présent et daté du dernier sprint clos. Zéro écart non subordonné. Chaque STG atteignable.

## WP-21 — Strategic Design de la release

`releases/{release-id}/design/concept/ · design/src/ · design/dist/ · design-system-delta/`

Cycle de vie : figée en G1 · contrôlé en G1 · R/A : product-designer / Product Owner

Le prototype exécutable très haute fidélité couvrant de bout en bout l'expérience de la release, en remplissant le socle.

- **Alternatives explorées** — ≥ 3 matériellement distinctes avant convergence
- **Direction retenue** — comparée explicitement aux rejetées, avec motif ; ADR de direction
- **Storyboard de la release**
- **Source exécutable et build partageable** — URL de preview + commit figé
- **Delta de Design System** — chaque ajout justifié par un parcours, les 7 états couverts, intégré au système global
- **Fixtures** — réalistes, jamais de donnée inventée présentée comme réelle

**Complétude.** Couvre tous les parcours sans écran mort. N'altère ni navigation, ni IA, ni vocabulaire du socle. Aucun composant du socle modifié silencieusement.

## WP-24 — Rapport de Design QA

`releases/{release-id}/design/qa/report.md`

Cycle de vie : par passe · contrôlé en G1 · R/A : critic(design) / Product Owner

Premier handoff vers un évaluateur indépendant du producteur. Vérifie la cohérence et la subordination au socle.

- **Cohérence et conformité au Design System**
- **Responsive et états limites**
- **Accessibilité** — contrôle outillé, captures multi-device
- **Subordination au socle** — PASS ou FAIL avec preuves
- **Findings** — classés BLOCKER · MAJOR · MINOR · OBSERVATION

**Complétude.** Zéro BLOCKER ouvert. Captures multi-device produites. Contrôle accessibilité outillé, pas déclaratif.

## WP-30 — Design de sprint et Baseline Delta Declaration

`releases/{release-id}/sprints/{sprint-id}/design/scope.yaml · flows/ · prototype/ · design-system-delta/`

Cycle de vie : figée en K1 · contrôlé en K1 · R/A : product-designer / Product Owner

Un delta autorisé sur la Release Baseline, jamais un design autonome. La Baseline Delta Declaration est ce qui rend le delta contrôlable.

- **Périmètre design** — aucune story sans écran ni composant associé
- **Baseline Delta Declaration** — MUST PRESERVE vs deltas autorisés — produite AVANT toute modification
- **Écrans desktop, tablette, mobile**
- **Prototype exécutable** — exerçant chaque story ; aucun parcours simulé par capture statique
- **Delta de Design System** — justifié story par story ; aucune modification silencieuse d'un composant existant

**Complétude.** Inventaire MUST PRESERVE produit avant toute modification. Chaque story exerçable dans le prototype. Zéro BLOCKER de critic(design) et de conformance-auditor.

```
Baseline Delta Declaration  sprint 3
MUST PRESERVE
  navigation globale · glossaire · catégories de vérité
  composant Carte-chantier, états 1 à 7
DELTAS AUTORISÉS
  variante compacte de Carte-chantier   justifiée par STO-014
  jeton --densite-liste                 justifié par STO-016
ÉCART SOCLE   aucun.  (sinon → G0, EX3)
```
