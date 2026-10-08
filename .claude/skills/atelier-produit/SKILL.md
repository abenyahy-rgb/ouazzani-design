---
name: atelier-produit
description: "Conduire l'atelier produit de l'ouverture UNE QUESTION À LA FOIS : ce qu'on veut faire du produit, pour qui, quelle valeur, comment elle arrive et se paie, bloc par bloc du canevas, jusqu'à un récapitulatif confirmé. Utiliser à l'activité 1 de la méthode — Atelier produit."
---

# atelier-produit

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Conduire l'atelier produit de l'ouverture UNE QUESTION À LA FOIS : ce qu'on veut faire du produit, pour qui, quelle valeur, comment elle arrive et se paie, bloc par bloc du canevas, jusqu'à un récapitulatif confirmé. Ne fait pas : poser une question technique — stack, dépôt, conventions, arborescence se calculent —, répondre à la place de l'humain, ni rédiger le canevas avant la confirmation finale.

## Conduite — Une question à la fois

Un atelier mené en questionnaire se remplit en diagonale : le canevas ressemble à un produit sans en être un. Une seule question, avec sa réponse recommandée, obtient une décision ; la suivante se choisit en sachant ce qui vient d'être tranché.

**Où.** Dans la conversation principale, jamais dans un sous-agent : un sous-agent ne peut pas attendre la réponse de l'humain. Le product-lead rédige ensuite le canevas à partir du journal.

1. UNE seule question par message : ni liste numérotée, ni « et aussi », ni post-scriptum.
2. Le produit d'abord, la technique jamais : aucune question sur la stack, le dépôt, l'hébergement ou les conventions — cela se calcule.
3. Ordre : intention, segment, problème, proposition de valeur, puis canaux, relation, revenus, ressources, activités, partenaires, coûts, avantage, indicateurs. Sauter un bloc déjà tranché.
4. Chaque question : titre court, pourquoi elle compte maintenant, la question, la réponse recommandée et son motif.
5. Réponse fermée — deux à quatre options — : questions structurées du harness, une par appel, la recommandée en premier. Sinon en texte, une seule.
6. Attendre la réponse ; ne jamais la supposer pour gagner un tour.
7. Après chaque réponse, une ligne d'accusé — tranché, ou HYP-nn UNVALIDATED — au Journal d'atelier, avant la question suivante.
8. « Je ne sais pas » : proposer une HYP-nn et ce qui la trancherait, validée par une question fermée.
9. Afficher la place : « Question 4 · Proposition de valeur · 9 blocs restants ».
10. Canevas complet : un récapitulatif unique, puis une seule demande de confirmation. Rien n'est rédigé avant.

Format d'une question en texte :

```
Question 3 · 5 branches ouvertes
**<titre court>** — <pourquoi elle compte maintenant, en une phrase>
<la question>
➡️ Recommandé : <la réponse> — <son motif>
```

Si `grill-me` ou `grilling` est chargé pendant l'activité, garder son arbre de décisions et sa frontière, **jamais son format en tours** : cette conduite prime.

**Cette conduite est contrôlée.** Un appel au mécanisme de questions structurées qui porte plusieurs questions est refusé ; un tour dont le texte en pose plusieurs est renvoyé une fois pour n'en garder qu'une. Une phrase rhétorique terminée par « ? » compte : l'écrire en affirmation. Une question rapportée entre guillemets, en citation ou dans un bloc de code ne compte pas.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 1 | Atelier produit | `product-lead` | `Product Owner` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-01 — Canevas du produit | `C1.1-initialisation/canvas/business-model-canvas.md` | G0 |

Plan de contenu et critère de complétude de chacun : **`references/livrables.md`**.

## Contrat d'entrée

Si un artefact d'entrée déclaré manque, retourner `BLOCKED — input manquant`. Ne jamais inférer : produire sur un matériau deviné donne un résultat plausible et invérifiable, ce que la méthode existe pour empêcher.

## Vérification avant handover

Partir du squelette rendu par `apf template <WP-nn>` : il porte les sections du registre dans l'ordre, la règle et le guide de chacune, et le critère de complétude. Ne jamais renommer ni omettre un H2 — le titre est une clé.

Chaque livrable existe au chemin déclaré, porte toutes les sections de son plan de contenu et satisfait son critère de complétude. Exécuter `apf check` avant de rendre la main.

**Format Office.** `factory_declare` écrit le livrable en PowerPoint ou Word dans `dist/livrables/` (champ `office` de la réponse). En cas d'erreur : `apf livrable <WP-nn>`. Ne jamais l'éditer à la main : il est calculé depuis le Markdown.

Puis projeter chaque livrable dans l'espace de travail lisible. **Si SOC-01 porte `workspace_kind: launchpad`** (dépôt lancé depuis le launchpad), il n'y a rien à projeter : le workflow du dépôt dépose l'état à chaque push, `apf notion status` rend « sans objet », et la page est le commit. Sinon, dans cet ordre :

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
