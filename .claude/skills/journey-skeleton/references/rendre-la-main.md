# journey-skeleton — rendre la main

> Généré depuis `core/method.yaml`. Lu après la vérification du SKILL.md, jamais à sa place.

## Format Office

`factory_declare` écrit le livrable en PowerPoint ou Word dans `dist/livrables/` (champ `office` de la réponse). En cas d'erreur : `apf livrable <WP-nn>`. Ne jamais l'éditer à la main : il est calculé depuis le Markdown.

## Projection dans l'espace de travail

**Si SOC-01 porte `workspace_kind: launchpad`** (dépôt lancé depuis le launchpad), il n'y a rien à projeter : le workflow du dépôt dépose l'état à chaque push, `apf notion status` rend « sans objet », et la page est le commit. Sinon, dans cet ordre :

```bash
apf notion where <WP-nn>   # la destination, et surtout l'ACTION
apf notion page  <WP-nn>   # le corps : miroir complet du fichier Git, bandeau compris
#  … mettre à jour la page EXISTANTE via le connecteur …
apf notion link  <WP-nn> <url>
```

**La ligne existe déjà** : créée au bootstrap avec son gabarit et le statut « À produire ». L'action rendue est `update`. Ne jamais créer une seconde ligne — deux pages pour un livrable, ce sont deux vérités. Ne jamais rédiger le corps : il est calculé.

Le pointeur est bidirectionnel : le front-matter porte l'adresse de la page, la page porte en retour le chemin et le commit. Un livrable lisible d'un seul côté n'est relié à rien.

La liaison ne bloque aucun GATE : `apf notion status` rapporte, il ne refuse pas.
