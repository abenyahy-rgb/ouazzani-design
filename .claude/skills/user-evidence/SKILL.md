---
name: user-evidence
description: "Produire une preuve utilisateur opposable : protocole écrit AVANT le recrutement, version figée par commit, protocole identique entre participants, résultats non filtrés, biais déclarés, étiquetage obligatoire du niveau. Utiliser aux activités 4, 12, 16 de la méthode — Recherche et synthèse utilisateur · Discovery et parcours cibles · Validation utilisateurs et convergence."
---

# user-evidence

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Produire une preuve utilisateur opposable : protocole écrit AVANT le recrutement, version figée par commit, protocole identique entre participants, résultats non filtrés, biais déclarés, étiquetage obligatoire du niveau. Ne fait pas : requalifier une revue synthétique en preuve.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 4 | Recherche et synthèse utilisateur | `product-designer` | `Product Owner` |
| 12 | Discovery et parcours cibles | `product-designer` | `Product Owner` |
| 16 | Validation utilisateurs et convergence | `product-lead puis product-designer` | `Product Owner` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-08 — Recherche et synthèse utilisateur | `research/research-plan.md · interviews/ · insights.md · personas/ · empathy-maps/ · journeys/as-is/` | G0 |
| WP-20 — Discovery ciblée et parcours cibles | `releases/{release-id}/research/insights.md · journeys/to-be/` | G1 |
| WP-25 — Validation utilisateurs et convergence | `releases/{release-id}/research/tests/test-plan.md` | G1 |

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
