# living-design — activités outillées

> Généré depuis `core/method.yaml`. Chargé à la demande, jamais d'office.

## Activité 8 — Socle exécutable

**Entrée.** Fondations, composants, navigation, IA et sémantique disponibles. CORPUS RÉEL recevable (WP-40) : son absence produit BLOCKED, et jamais un jeu de fixtures écrit pour débloquer l'activité.

**Tâche.** Produire le socle navigable en très haute fidélité structurelle, alimenté par le corpus réel, et le DÉPLOYER derrière une URL que le métier ouvre sans rien installer.

**Vérification.** Se parcourt de bout en bout sans écran mort. Chaque étape atteignable. Le contenu affiché vient de WP-40 : AUCUNE fixture, et le point est éliminatoire — un socle sur fixtures est une maquette, il ne prouve pas que le produit dit quelque chose de vrai. Un champ ABSENT au corpus est rendu comme absent par l'interface, jamais comblé. Le socle est déployé et l'URL répond. Plancher de craft lu avant toute édition. Vérification en passes bornées : une inspection groupée desktop et mobile, une correction en lot, une confirmation, puis arrêt — un auto-QA en boucle coûte plus qu'il ne trouve.

**Sortie.** Ouvrable hors environnement de développement, à une URL déployée, sur corpus réel.

Responsible : `product-designer` · Accountable : `Product Owner` · Cadence C1, étape C1.4

## Activité 13 — Exploration, direction et Strategic Design

**Entrée.** Parcours cibles disponibles ; socle figé et accessible ; design-brief.md renseigné ; time-box déclarée.

**Tâche.** Produire ≥ 3 alternatives distinctes, arrêter une direction motivée, puis le prototype très haute fidélité de bout en bout avec son delta de Design System.

**Vérification.** La direction est comparée aux alternatives rejetées, sur le monde visuel et non sur des variantes de la même direction. Le mode de surface de chaque écran est déclaré, choisi d'après la surface et jamais d'après le produit. Le prototype couvre tous les parcours sans écran mort. Il n'altère ni navigation, ni IA, ni vocabulaire du socle. Chaque ajout au DS est justifié par un parcours. Plancher de craft lu avant toute édition.

**Sortie.** design/src/, dist/, design-system-delta/ commités ; ADR de direction. Prototype vivant recomposé et son manifeste daté : sans recomposition, le Strategic Design est un quatrième prototype figé de plus.

Responsible : `product-designer` · Accountable : `Product Owner` · Cadence C2, étape C2.2

## Activité 15 — Design QA

**Entrée.** Build partageable disponible ; critic(design) indépendant du producteur.

**Tâche.** Vérifier cohérence, responsive, accessibilité, états limites, conformité au Design System et subordination au socle.

**Vérification.** Captures multi-device produites, et CHAQUE capture est ouverte et confrontée à son nom avant d'être transmise : une preuve tronquée, vide ou décalée invalide la revue qui s'appuie dessus, et le juge doit la refuser plutôt que noter dessus. Contrôle accessibilité outillé. Les playbooks critique et audit sont exécutés et leurs constats reclassés dans la taxonomie unique des findings — un score heuristique n'est pas un finding, et un verdict rendu sous un skill externe n'est jamais un PASS de contrôle. Une revue de finition SUBSTITUÉE — l'évaluateur livré par le skill externe n'étant pas installé — est divulguée en une ligne au verdict, jamais tue.

**Sortie.** Rapport commité ; zéro BLOCKER ouvert.

Responsible : `critic(design)` · Accountable : `Product Owner` · Cadence C2, étape C2.2

## Activité 19 — Design de sprint et prototype

**Entrée.** Sprint autorisé ; Release Baseline accessible.

**Tâche.** Identifier écrans et parcours impactés, raffiner états et interactions, produire la tranche exécutable, créer le delta de DS nécessaire.

**Vérification.** Aucune story sans écran associé. Inventaire MUST PRESERVE produit AVANT toute modification. Le prototype exerce chaque story. Aucune modification silencieuse d'un composant existant. Plancher de craft lu avant toute modification d'un écran existant.

**Sortie.** design/ et prototype commités ; Baseline Delta Declaration produite ; prototype vivant recomposé socle ⊕ deltas de release ⊕ deltas de sprint, manifeste daté de ce sprint, zéro écart non subordonné. C'est ce pas qui fait que le prototype suit les sprints au lieu de les précéder puis de périmer.

Responsible : `product-designer` · Accountable : `Product Owner` · Cadence C3, étape C3.2
