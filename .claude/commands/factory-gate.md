---
description: "Constater l'état d'une gate : pack de preuves, livrables manquants, contrôles en échec."
argument-hint: [G0 | G1 | G2 | K1 | G3 | G4]
allowed-tools: Bash(node:*)
---

Exécuter `node .factoryzen/bin/apf tower factory_request_gate '{"gate":"$1"}'`.

Rendre le verdict tel quel. La tour constate ; elle ne franchit pas.
Une gate humaine ne se franchit jamais depuis une session d'agent : elle exige une autorité nommée.
