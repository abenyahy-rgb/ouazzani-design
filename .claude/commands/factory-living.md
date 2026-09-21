---
description: "Régénérer les deux artefacts vivants : modèle de données dérivé et prototype composé."
allowed-tools: Bash(node:*)
---

Exécuter `node .factoryzen/bin/apf tower factory_derive_model` puis `node .factoryzen/bin/apf tower factory_compose_prototype`.

Les deux sont CALCULÉS. Ne jamais corriger un champ non résolu en éditant le fichier dérivé :
la liaison se fait dans `product/data/binding.yaml`, la composition dans les deltas déclarés.
