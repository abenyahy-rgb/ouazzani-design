---
name: real-corpus
description: "Constituer le CORPUS RÉEL du produit avant le socle : périmètre minimal suffisant pour parcourir le squelette de bout en bout, acquisition depuis les sources approuvées de WP-06, une ligne de provenance par enregistrement — adresse, date de lecture, citation littérale —, catégorie de vérité par champ, et couverture mesurée contre le squelette. Utiliser aux activités 27, 7 de la méthode — Corpus réel et provenance · Navigation, IA, terminologie et sémantique."
---

# real-corpus

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Constituer le CORPUS RÉEL du produit avant le socle : périmètre minimal suffisant pour parcourir le squelette de bout en bout, acquisition depuis les sources approuvées de WP-06, une ligne de provenance par enregistrement — adresse, date de lecture, citation littérale —, catégorie de vérité par champ, et couverture mesurée contre le squelette. Ne fait pas : produire un jeu de fixtures. Une fixture est un outil de test ; elle ne franchit jamais un gate et ne s'affiche jamais dans un livrable présenté au métier.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 27 | Corpus réel et provenance | `data-steward` | `Product Owner` |
| 7 | Navigation, IA, terminologie et sémantique | `product-designer et product-lead` | `Product Owner` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-40 — Corpus réel et provenance | `data/corpus/corpus-scope.md · provenance.yaml · truth-map.yaml · coverage.md · records/` | G0 |
| WP-11 — Navigation, architecture de l'information et terminologie | `design/spine/navigation.md · information-architecture.md · glossaire-utilisateur.md` | G0 |
| WP-12 — Modèle de données vivant | `data/semantics.md · status-model.md · financial-semantics.md · model.generated.md · binding.yaml · migrations.md · semantics.yaml · schema.introspected.yaml` | G0 |

Plan de contenu et critère de complétude de chacun : **`references/livrables.md`**.

## Contrat d'entrée

Si un artefact d'entrée déclaré manque, retourner `BLOCKED — input manquant`. Ne jamais inférer : produire sur un matériau deviné donne un résultat plausible et invérifiable, ce que la méthode existe pour empêcher.

**Activité 27 — arrêt dur.** Sources approuvées du domaine disponibles (WP-06) ; squelette de parcours arrêté (WP-09) — il donne le périmètre minimal que le corpus doit couvrir. L'un des deux absent produit BLOCKED.

Ces inputs se RECUEILLENT auprès d'un humain, dans la salve unique de quatre questions au maximum (EX2). Ne jamais les dériver du nom du dépôt, du contexte de la session, ni d'un fichier existant.

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
