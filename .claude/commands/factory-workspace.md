---
description: "Instancier ou compléter l'espace de travail lisible, et projeter un livrable dans sa page."
argument-hint: [plan | where WP-nn | instance release REL-1 | status | link WP-nn URL]
allowed-tools: Bash(node:*), mcp__Notion__notion-fetch, mcp__Notion__notion-search, mcp__Notion__notion-create-pages, mcp__Notion__notion-update-page, mcp__Notion__notion-create-database, mcp__Notion__notion-create-view, mcp__Notion__notion-move-pages
---

## Espace de travail TIRÉ

Si `product/governance/project.yaml` porte `workspace_kind: launchpad`, cet espace est une projection TIRÉE : le workflow du dépôt dépose l'état à chaque push sur la branche par défaut. Toute opération ci-dessous rend « sans objet » avec l'adresse de la page. Ne rien instancier, ne rien relier : committer et pousser.

## Préalable — vérifié AVANT toute écriture

1. Le connecteur d'espace de travail répond. BLOCKED — input manquant. Ne jamais improviser un emplacement, ne jamais produire une arborescence partielle, ne jamais se rabattre sur un export de fichiers.
2. L'emplacement de la racine est fourni. BLOCKED — input manquant. Jamais deviné.
Une instanciation à moitié faite laisse un espace qu'un rejeu ne sait pas distinguer d'un espace complet.

## `plan` — instancier ou compléter

Exécuter `node .factoryzen/bin/apf tower factory_workspace_plan` et appliquer les phases **dans l'ordre rendu** :

1. **ligne de projet** — créée dans la base d'accueil fournie ; sans elle, BLOCKED
2. **bases** — créées dans la page de la ligne de projet, avant toute ligne
3. **lignes d'étapes** — avant les livrables, car un livrable référence son étape
4. **lignes de livrables** — seulement celles dont ni la base ni les fichiers ne sont paramétrés
5. **vues** — dernières — une vue filtre des lignes qui doivent exister

Un nœud dont la clé figure déjà dans la carte est LAISSÉ INTACT, jamais recréé. C'est ce qui rend le rejeu idempotent, comme le bootstrap Git. Après chaque création, enregistrer l'identifiant : `node .factoryzen/bin/apf notion map --set <clé> <id>`.

Le plan est CALCULÉ depuis le registre. Ne jamais le réécrire ni dessiner une page à la main : une page dessinée à la main est une projection non générée, donc une divergence en attente.

## `where WP-nn` — où va ce livrable

Exécuter `node .factoryzen/bin/apf notion where $2`. La réponse porte une **action** :

- `update` — la ligne existe depuis le bootstrap. La mettre à jour. **Ne jamais en créer une seconde** : deux pages pour un livrable, ce sont deux vérités.
- `create` — livrable par-instance ; sa ligne se crée par `node .factoryzen/bin/apf notion instance`.

Le corps de la page vient de `node .factoryzen/bin/apf notion page $2` : miroir complet du fichier Git, bandeau compris. Ne pas le rédiger.

## `instance <release|sprint|version> <id>`

Crée les lignes d'une instance qui existe désormais. Une release ne crée pas les lignes de ses sprints.

## `status` et `link`

`node .factoryzen/bin/apf notion status` · `node .factoryzen/bin/apf notion link $2 $3`.

⚠ Une indisponibilité de l'espace de travail ne bloque JAMAIS un GATE. En revanche l'activité 1 a cet espace pour sortie : sans connecteur, elle rend BLOCKED.
