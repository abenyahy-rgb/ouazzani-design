---
name: sprint-delivery
description: "Conduire un sprint de bout en bout : goal, périmètre, spécification, implémentation dans la mutation boundary, plan de tests, exécution, healing d'obsolescence et preuve E2E. Utiliser aux activités 18, 20, 21, 22 de la méthode — Sprint goal et périmètre · Spécification fonctionnelle et technique · Build · Tests et evidence."
---

# sprint-delivery

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Conduire un sprint de bout en bout : goal, périmètre, spécification, implémentation dans la mutation boundary, plan de tests, exécution, healing d'obsolescence et preuve E2E.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 18 | Sprint goal et périmètre | `product-lead puis factory-lead` | `Product Owner` |
| 20 | Spécification fonctionnelle et technique | `product-lead et principal-engineer` | `PO et autorité Tech` |
| 21 | Build | `principal-engineer` | `autorité Tech` |
| 22 | Tests et evidence | `quality-engineer produit · critic(quality) classe` | `factory-lead` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-29 — Sprint goal et plan | `releases/{release-id}/sprints/{sprint-id}/candidate-scope.md · sprint-goal.md · sprint-plan.md · risks.md` | G2 |
| WP-31 — Spécification fonctionnelle et technique | `releases/{release-id}/sprints/{sprint-id}/spec/functional-spec.md · acceptance-criteria.md · technical-spec.md` | K1 |
| WP-32 — Journal de build et écarts de périmètre | `releases/{release-id}/sprints/{sprint-id}/status.md · scope-changes.md` | G3 |
| WP-33 — Stratégie, résultats et classification de tests | `releases/{release-id}/sprints/{sprint-id}/quality/test-strategy.md · test-healing-decisions.md` | G3 |

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
