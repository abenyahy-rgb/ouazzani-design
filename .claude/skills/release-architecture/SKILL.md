---
name: release-architecture
description: "Découper le produit en releases désirables, livrables et mesurables seules ; les ordonner ; qualifier dépendances et risques ; arrêter le périmètre et les métriques de chacune. Utiliser aux activités 10, 11 de la méthode — Découpage et séquencement des releases · Périmètre et métriques de la release."
---

# release-architecture

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Découper le produit en releases désirables, livrables et mesurables seules ; les ordonner ; qualifier dépendances et risques ; arrêter le périmètre et les métriques de chacune.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 10 | Découpage et séquencement des releases | `product-lead` | `Product Owner` |
| 11 | Périmètre et métriques de la release | `product-lead` | `Product Owner` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-16 — Architecture et séquencement des releases | `releases/release-architecture.md · sequencing.md · dependencies.md · risk-map.md · fiches/` | G0 |
| WP-17 — Pack de preuves G0 | `gates/g0-product-architecture.md · spine-manifest.yaml` | G0 |
| WP-18 — Périmètre désirable et métriques de la release | `releases/{release-id}/scope.md · exclusions.md · success-metrics.md` | G1 |
| WP-19 — Brief de conception | `releases/{release-id}/design-brief.md` | K1 et G1 |

Plan de contenu et critère de complétude de chacun : **`references/livrables.md`**.

## Contrat d'entrée

Si un artefact d'entrée déclaré manque, retourner `BLOCKED — input manquant`. Ne jamais inférer : produire sur un matériau deviné donne un résultat plausible et invérifiable, ce que la méthode existe pour empêcher.

## Vérification avant handover

Partir du squelette rendu par `apf template <WP-nn>` : il porte les sections du registre dans l'ordre, la règle et le guide de chacune, et le critère de complétude. Ne jamais renommer ni omettre un H2 — le titre est une clé.

Chaque livrable existe au chemin déclaré, porte toutes les sections de son plan de contenu et satisfait son critère de complétude. Exécuter `apf check` avant de rendre la main.

Puis projeter chaque livrable dans l'espace de travail lisible. **Si WP-01 porte `workspace_kind: launchpad`** (dépôt lancé depuis le launchpad), il n'y a rien à projeter : le workflow du dépôt dépose l'état à chaque push, `apf notion status` rend « sans objet », et la page est le commit. Sinon, dans cet ordre :

```bash
apf notion where <WP-nn>   # la destination, et surtout l'ACTION
apf notion page  <WP-nn>   # le corps : miroir complet du fichier Git, bandeau compris
#  … mettre à jour la page EXISTANTE via le connecteur …
apf notion link  <WP-nn> <url>
```

**La ligne existe déjà** : créée au bootstrap avec son gabarit et le statut « À produire ». L'action rendue est `update`. Ne jamais créer une seconde ligne — deux pages pour un livrable, ce sont deux vérités. Ne jamais rédiger le corps : il est calculé.

Le pointeur est bidirectionnel : le front-matter porte l'adresse de la page, la page porte en retour le chemin et le commit. Un livrable lisible d'un seul côté n'est relié à rien.

La liaison ne bloque aucun GATE : `apf notion status` rapporte, il ne refuse pas.

## Ne pas faire

- Écrire hors des chemins déclarés au registre : un artefact à un chemin non déclaré est invisible à la gouvernance et fait échouer K2.
- Franchir un gate ou déclarer un livrable approuvé. Ce skill prépare la décision, il ne la prend pas.
- Modifier un CORE INVARIANT du socle depuis une cadence autre que C1. Émettre un finding et router vers G0 (EX3).
