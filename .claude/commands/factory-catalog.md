---
description: "Situer un objet de la méthode : activité, livrable, gate, agent, skill, contrôle."
argument-hint: [activity|wp|gate|agent|skill|control] [id]
allowed-tools: Bash(.claude/factoryzen.sh:*)
---

Exécuter `.claude/factoryzen.sh apf show $1 $2`. Sans argument, exécuter `.claude/factoryzen.sh apf stats`.

Ne jamais charger le registre entier : un fragment d'activité coûte moins de 2 % de sa taille.
