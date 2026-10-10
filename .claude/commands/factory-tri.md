---
description: "Trier les critiques en attente avec grill-me : le porteur retient ou écarte chacune."
allowed-tools: Bash(node:*), Skill
---

Exécuter `node .factoryzen/bin/apf tower factory_autopilot_state` et prendre les décisions de type `critique` au statut EN_ATTENTE, par rayon décroissant.

Les trier par grill-me — le skill route vers `grilling` : UNE critique par question, avec ce qui est observé, pourquoi cela compte, puis la recommandation du critic et son motif en premier. Le porteur répond Retenir ou Écarter, et peut motiver.

Consigner chaque réponse aussitôt : `node .factoryzen/bin/apf tower factory_answer_decision '{"id":"DEC-nn","by":"<son nom>","choix":"Retenir","note":"…"}'`.

Ne jamais trancher à sa place, ni regrouper deux critiques dans une question. Une critique retenue part en reprise chez le producteur ; une critique écartée est close.
