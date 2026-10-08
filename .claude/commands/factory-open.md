---
description: "Ouvrir une activité et recevoir son fragment, sa frontière d'écriture et son critère de sortie."
argument-hint: [numéro d'activité]
allowed-tools: Bash(node:*)
---

Exécuter `node .factoryzen/bin/apf tower factory_open_activity '{"activity":"$1"}'`.

La tour est la SEULE source du fragment : ne jamais lire `core/method.yaml` pour s'en passer.
Un refus n'est pas un obstacle à contourner — c'est une gate antérieure ouverte ou un rôle qui n'est pas responsable de cette activité.

Si la réponse porte une `conduite`, elle règle toute la conversation de l'activité et prime sur le format des skills invoqués. Pour une conduite « une question à la fois » : poser UNE question par message dans cette conversation — jamais dans un sous-agent —, attendre la réponse, consigner la ligne au Journal d'interrogatoire, puis seulement poser la suivante.
