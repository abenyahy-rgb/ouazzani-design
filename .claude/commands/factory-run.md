---
description: "Autopilote de la cadence C1 : enchaîner les activités jusqu'à G0, l'humain au-dessus de la boucle."
argument-hint: [votre nom — celui qui ratifiera en G0]
allowed-tools: Bash(node:*), Agent, Task, Read, Write, Edit, Glob, Grep
---

## Démarrer

Si l'autopilote n'est pas actif : `node .factoryzen/bin/apf tower factory_autopilot_start '{"par":"$1"}'`. Sans nom, demander à l'humain le sien — une seule question —, c'est lui qui ratifiera en G0.

## La boucle — sans rendre la main

Répéter jusqu'à un arrêt : `node .factoryzen/bin/apf tower factory_next`, puis exécuter l'action rendue.

- **INTERROGER** : ouvrir l'activité si besoin, puis conduire l'interrogatoire avec l'humain dans cette conversation, une question à la fois. C'est le seul moment où il est attendu.
- **OUVRIR** : appeler l'opération rendue (`factory_open_activity`). Si la réponse porte `autopilote.delegations`, appliquer le choix consigné sans poser la question.
- **PRODUIRE** : invoquer chaque rôle avec le `model` et l'`effort` rendus — la garde refuse un autre routage. Il produit depuis le fragment et déclare chaque livrable (`factory_declare`).
- **JUGER** : invoquer le critic avec son routage, déposer son verdict TEL QUEL au chemin `depot` — il se termine par « SÉVÉRITÉS — BLOCKER: n · MAJOR: n · MINOR: n » —, puis `factory_record_verdict`. Zéro BLOCKER et zéro MAJOR : le livrable converge. 2 tours au plus : au-delà, l'arbitrage entre en file et la boucle passe à la suite.
- **REPRENDRE** : renvoyer le livrable à son producteur avec le verdict ; chaque BLOCKER et chaque MAJOR traité ou contesté par une disposition sourcée ; redéclarer.
- **REPRENDRE_DECISION** : l'humain a tranché autrement qu'un défaut délégué ; rouvrir l'activité, appliquer son choix, redéclarer, puis `factory_autopilot_resume`.
- **CORRIGER** : traiter chaque manque et chaque contrôle en échec du pack de G0 dans l'activité qui le porte.

## Les arrêts

- **STOP_DECISION** : une décision que seul l'humain peut prendre. L'exposer, une question à la fois, et attendre. La réponse : `factory_answer_decision`.
- **STOP_G0** : le pack est prêt. Présenter les décisions à trancher, puis les décisions déléguées à ratifier, par rayon d'impact. L'autopilote ne franchit JAMAIS G0 : c'est l'humain, nommément.

Une décision qui n'est que de l'information devient une HYP-nn et la boucle continue. Une décision qui revient à l'humain entre en file (`factory_queue_decision`) — bloquante si elle porte sur son intention, sur un irréversible ou sur le corpus réel ; sinon elle attend G0 sans arrêter la boucle.

Le hook Stop refuse la fin de tour tant qu'il reste une action et que le run progresse : ne pas rendre la main entre deux actions. Il la rend de lui-même à un arrêt, ou quand rien n'a bougé depuis la relance précédente.
