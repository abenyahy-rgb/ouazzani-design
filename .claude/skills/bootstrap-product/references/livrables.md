# bootstrap-product — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-01 — Registre canonique et configuration projet

`governance/artifact-schema.yaml · project.yaml · workspace-map.yaml`

Cycle de vie : vivant · contrôlé en tout gate · R/A : factory-lead / Product Owner

Déclare tous les chemins d'artefacts du projet et la configuration qui spécialise la méthode générique. Rien n'existe hors de ce fichier.

- **Entrées d'artefacts** — clé logique · chemin · catégorie · activité productrice · gate · niveau de baseline · cumulatif ou figé · structure
- **Mapping d'arborescence** — si le dépôt a déjà une convention, elle prévaut et se déclare ici
- **Mapping d'identifiants** — si une nomenclature existe, la méthode impose la chaîne, pas le vocabulaire
- **Autorités de gate** — qui décide G0 à G4, et qui ne peut pas déléguer
- **Store d'état du backlog** — un seul, déclaré ici
- **Correspondance classe de capacité → modèle** — vit dans l'adaptateur, référencée ici
- **Identité du produit** — nom, date d'ouverture, emplacement de la racine de l'espace de travail. C'est l'activité 1 qui la RECUEILLE auprès d'un humain, jamais un opérateur qui la tape en ligne de commande : un produit dont le nom vient d'ailleurs que de son activité d'ouverture n'a pas été ouvert par la méthode.
- **Carte de l'espace de travail** — identifiants des pages d'étape, des pages de gate et des bases — c'est ce qui rend la synchronisation idempotente et le pointeur bidirectionnel résoluble
- **Rôles de la méthode vers personnes** — les rôles du registre sont génériques ; sans association à des personnes nommées, les colonnes Responsible et Accountable sont du texte mort
- **RUN MODE — équipe ou solo** — Déclaré à l'ouverture, une valeur parmi ÉQUIPE et SOLO, avec le nombre d'humains réellement disponibles. ÉQUIPE est le mode par défaut et la méthode telle qu'écrite. SOLO ne relâche AUCUN contrôle déterministe, aucune autorité de gate et aucune règle de séparation des devoirs : il change uniquement le traitement de l'input manquant, selon EX2. Il se déclare, il ne s'improvise pas : une méthode conçue pour des parties prenantes nommées, exécutée par une seule personne, produit des lettres de délégation qui contournent la méthode par en dessous — ce qui est arrivé, et ce qu'un mode déclaré rend inutile.

**Complétude.** Tout chemin cité par une activité existe au registre, et tout chemin du registre est produit par exactement une activité (K2). Le RUN MODE est déclaré : son absence est un défaut, pas un défaut de défaut.

```
release-scope:
  path: releases/{release-id}/scope.md
  category: décision
  produced_by: 10
  controlled_at: G1
  baseline: release
  lifecycle: figé
  sections: [perimetre, exclusions, etapes-couvertes, trois-tests]
```

## WP-02 — Contexte et contraintes de l'existant

`context/existing-system.md · constraints.md`

Cycle de vie : vivant · contrôlé en G0 · R/A : principal-engineer / factory-lead

Établit ce que le projet hérite et ne peut pas ignorer. Facultatif en greenfield.

- **Périmètre d'inspection déclaré** — ce qui a été regardé, et ce qui ne l'a pas été
- **Architecture et dépendances existantes**
- **Contraintes structurantes** — chacune adossée à deux sources indépendantes
- **Unknowns** — nommés, jamais comblés par inférence

**Complétude.** Deux sources indépendantes minimum par contrainte structurante. Inventaire relu par critic(engineering).
