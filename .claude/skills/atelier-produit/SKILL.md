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

Chaque livrable existe au chemin déclaré, porte toutes les sections de son plan de contenu et satisfait son critère de complétude.

Exécuter `apf check` TROIS fois : sur l'arbre indexé, après le commit, puis sur main après la fusion — un contrôle ne voit que la population qu'il lit, index ou commit. Toute édition après un passage le rouvre.

Pour les contrôles écrits par le projet : un test négatif mute une COPIE de fixture déclarée, jamais l'instantané vivant ; un compte publié se recalcule depuis ses lignes ; un contrôle ne rejoue pas les autres — la CI les agrège.

**Puis rendre la main** — format Office, projection dans l'espace de travail, pointeur bidirectionnel : **`references/rendre-la-main.md`**. La projection est sans objet si SOC-01 porte `workspace_kind: launchpad` : le commit est la page.

## Ne pas faire

- Écrire hors des chemins déclarés au registre : un artefact à un chemin non déclaré est invisible à la gouvernance et fait échouer K2.
- Franchir un gate ou déclarer un livrable approuvé. Ce skill prépare la décision, il ne la prend pas.
- Modifier un CORE INVARIANT du socle depuis une cadence autre que C1. Émettre un finding et router vers G0 (EX3).
