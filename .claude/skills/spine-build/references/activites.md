# spine-build — activités outillées

> Généré depuis `core/method.yaml`. Chargé à la demande, jamais d'office.

## Activité 6 — Fondations du Design System

**Entrée.** Squelette arrêté ; design-brief.md renseigné ; contraintes d'accessibilité, de langue et d'usage déclarées ; STACK DE CONCEPTION arrêtée par ADR — framework, base de composants, moteur de styles, cible de déploiement, outillage de conception assistée. Son absence produit BLOCKED : décider la stack après la première décision visuelle n'est plus une décision, c'est une justification.

**Tâche.** Faire CONCOURIR au moins trois directions visuelles construites, arrêter celle qui gagne avec l'humain qui répond du produit, puis en dériver tokens, couleurs, typographies, espacements, grilles, responsive, accessibilité, composants, variantes et états.

**Vérification.** Le brief de conception est renseigné AVANT la première décision visuelle, et son absence produit BLOCKED — jamais une direction devinée : c'est l'emplacement du goût et des contraintes de l'humain, et une direction décidée sans lui se fait refuser après coup, deux fois s'il le faut. Au moins TROIS directions distinctes sont CONSTRUITES — vraies pages, vrai contenu, chacune engagée à fond — et présentées à l'arbitrage : une direction unique n'est pas un choix, c'est la première idée venue. La direction retenue porte un ADR nommant les alternatives écartées et ce qui les a départagées. Contraste WCAG AA vérifié par outil. Tokens exportables en CSS et JSON. Chaque composant expose les 7 états. Catalogue exécutable. Mode de surface déclaré. Plancher de craft lu immédiatement avant toute édition d'interface, et ses bans absolus vérifiés un à un : une fondation qui les enfreint n'est pas une variante de goût.

**Sortie.** design/system/ commité ; catalogue navigable ; brief de conception et ADR de direction présents ; explorations écartées conservées, jamais supprimées — c'est la preuve qu'un choix a eu lieu.

Responsible : `product-designer` · Accountable : `Product Owner` · Cadence C1, étape C1.4

## Activité 7 — Navigation, IA, terminologie et sémantique

**Entrée.** Squelette arrêté ; domaine qualifié.

**Tâche.** Figer la navigation, l'architecture de l'information, le vocabulaire utilisateur, les catégories de vérité, les statuts et les règles financières.

**Vérification.** Chaque terme unique, non ambigu, testé auprès d'un persona. La navigation couvre toutes les étapes. Chaque catégorie de vérité est disjointe. Un calcul n'améliore jamais le statut de vérité de ses entrées. La table de liaison résout chaque entité et chaque champ du noyau vers un terme du glossaire.

**Sortie.** Figés par tag Git. Noyau du modèle de données classé CORE INVARIANT ou EXTENSION, élément par élément. Toute évolution ultérieure du noyau rouvre G0.

Responsible : `product-designer et product-lead` · Accountable : `Product Owner` · Cadence C1, étape C1.4

## Activité 8 — Socle exécutable

**Entrée.** Fondations, composants, navigation, IA et sémantique disponibles. CORPUS RÉEL recevable (WP-40) : son absence produit BLOCKED, et jamais un jeu de fixtures écrit pour débloquer l'activité.

**Tâche.** Produire le socle navigable en très haute fidélité structurelle, alimenté par le corpus réel, et le DÉPLOYER derrière une URL que le métier ouvre sans rien installer.

**Vérification.** Se parcourt de bout en bout sans écran mort. Chaque étape atteignable. Le contenu affiché vient de WP-40 : AUCUNE fixture, et le point est éliminatoire — un socle sur fixtures est une maquette, il ne prouve pas que le produit dit quelque chose de vrai. Un champ ABSENT au corpus est rendu comme absent par l'interface, jamais comblé. Le socle est déployé et l'URL répond. Plancher de craft lu avant toute édition. Vérification en passes bornées : une inspection groupée desktop et mobile, une correction en lot, une confirmation, puis arrêt — un auto-QA en boucle coûte plus qu'il ne trouve.

**Sortie.** Ouvrable hors environnement de développement, à une URL déployée, sur corpus réel.

Responsible : `product-designer` · Accountable : `Product Owner` · Cadence C1, étape C1.4
