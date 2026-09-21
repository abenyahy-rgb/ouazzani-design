---
name: living-data-model
description: "Tenir le modèle de données en trois couches : sémantique écrite à la main et figée en G0, modèle dérivé extrait du schéma exécuté, table de liaison qui rattache chaque entité et chaque champ à un terme du glossaire et à une catégorie de vérité. Utiliser aux activités 7, 14, 20 de la méthode — Navigation, IA, terminologie et sémantique · Solution design de la release · Spécification fonctionnelle et technique."
---

# living-data-model

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Tenir le modèle de données en trois couches : sémantique écrite à la main et figée en G0, modèle dérivé extrait du schéma exécuté, table de liaison qui rattache chaque entité et chaque champ à un terme du glossaire et à une catégorie de vérité. Ne fait pas : rédiger un modèle de données à la main — un modèle tenu par la discipline diverge au deuxième sprint, ce qui est exactement le défaut qu'il corrige.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 7 | Navigation, IA, terminologie et sémantique | `product-designer et product-lead` | `Product Owner` |
| 14 | Solution design de la release | `principal-engineer` | `autorité Tech` |
| 20 | Spécification fonctionnelle et technique | `product-lead et principal-engineer` | `PO et autorité Tech` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-11 — Navigation, architecture de l'information et terminologie | `design/spine/navigation.md · information-architecture.md · glossaire-utilisateur.md` | G0 |
| WP-12 — Modèle de données vivant | `data/semantics.md · status-model.md · financial-semantics.md · model.generated.md · binding.yaml · migrations.md · semantics.yaml · schema.introspected.yaml` | G0 |
| WP-22 — Solution design de la release | `releases/{release-id}/architecture/solution-design.md · interface-contracts.md · migration-impact.md` | G1 |
| WP-23 — Dépendances, risques techniques et tiers | `releases/{release-id}/architecture/dependencies.md · technical-risks.md · risk-tiers.md` | G1 |
| WP-31 — Spécification fonctionnelle et technique | `releases/{release-id}/sprints/{sprint-id}/spec/functional-spec.md · acceptance-criteria.md · technical-spec.md` | K1 |

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
