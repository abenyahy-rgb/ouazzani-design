---
name: bootstrap-product
description: "Initialiser l'arborescence, le registre canonique, les conventions d'identifiants et le Run Ledger, de façon idempotente et SANS QUESTION à l'humain : tout se calcule depuis le registre et le dépôt. Utiliser à l'activité 0 de la méthode — Socle technique automatique."
---

# bootstrap-product

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Initialiser l'arborescence, le registre canonique, les conventions d'identifiants et le Run Ledger, de façon idempotente et SANS QUESTION à l'humain : tout se calcule depuis le registre et le dépôt. Exécuté par la tour à l'ouverture, avant l'atelier produit. Ne produit jamais de contenu.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 0 | Socle technique automatique | `factory-lead` | `Product Owner` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| SOC-01 — Registre canonique et configuration projet | `C1.1-initialisation/governance/artifact-schema.yaml · project.yaml · workspace-map.yaml` | tout gate |
| SOC-02 — Contexte et contraintes de l'existant | `C1.1-initialisation/context/existing-system.md · constraints.md` | G0 |

Plan de contenu et critère de complétude de chacun : **`references/livrables.md`**.

## Contrat d'entrée

Si un artefact d'entrée déclaré manque, retourner `BLOCKED — input manquant`. Ne jamais inférer : produire sur un matériau deviné donne un résultat plausible et invérifiable, ce que la méthode existe pour empêcher.

**Activité 0 — arrêt dur.** Run autorisé ; dépôt identifié ; aucune arborescence /product non sauvegardée ; NOM DU PRODUIT recueilli auprès d'un humain ; connecteur d'espace de travail et emplacement de la racine fournis — chacun absent produit BLOCKED, jamais deviné ni dérivé du nom du dépôt.

Ces inputs se RECUEILLENT auprès d'un humain, dans la salve unique de quatre questions au maximum (EX2). Ne jamais les dériver du nom du dépôt, du contexte de la session, ni d'un fichier existant.

## Vérification avant handover

Partir du squelette rendu par `apf template <WP-nn>` : il porte les sections du registre dans l'ordre, la règle et le guide de chacune, et le critère de complétude. Ne jamais renommer ni omettre un H2 — le titre est une clé.

Chaque livrable existe au chemin déclaré, porte toutes les sections de son plan de contenu et satisfait son critère de complétude.

Exécuter `apf check` TROIS fois : sur l'arbre indexé, après le commit, puis sur main après la fusion — un contrôle ne voit que la population qu'il lit, index ou commit. Toute édition après un passage le rouvre.

Pour les contrôles écrits par le projet : un test négatif mute une COPIE de fixture déclarée, jamais l'instantané vivant ; un compte publié se recalcule depuis ses lignes ; un contrôle ne rejoue pas les autres — la CI les agrège.

**Puis rendre la main** — format Office, projection dans l'espace de travail, pointeur bidirectionnel : **`references/rendre-la-main.md`**. La projection est sans objet si SOC-01 porte `workspace_kind: launchpad` : le commit est la page.

## Ne pas faire

- Écrire hors des chemins déclarés au registre : un artefact à un chemin non déclaré est invisible à la gouvernance et fait échouer K2.
- Franchir un gate ou déclarer un livrable approuvé. Ce skill prépare la décision, il ne la prend pas.
- Modifier un CORE INVARIANT du socle depuis une cadence autre que C1. Émettre un finding et router vers G0 (EX3).
