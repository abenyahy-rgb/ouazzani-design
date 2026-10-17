---
description: "Exécuter les 8 contrôles déterministes et l'intégrité du vendoring."
allowed-tools: Bash(.claude/factoryzen.sh:*)
---

Exécuter `.claude/factoryzen.sh apf check`.

Un SKIPPED ne vaut pas un PASS : il attend une instance de projet. Ne jamais le présenter comme un succès.
Pour chaque FAIL, nommer le défaut et le chemin concerné avant de proposer quoi que ce soit.
