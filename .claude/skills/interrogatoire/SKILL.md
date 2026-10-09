---
name: interrogatoire
description: "Conduire l'interrogatoire de l'intention produit UNE QUESTION À LA FOIS, jusqu'à ce que la frontière de l'arbre de décisions soit vide. Utiliser à l'activité 2 de la méthode — Thèse produit et outcomes."
---

# interrogatoire

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Conduire l'interrogatoire de l'intention produit UNE QUESTION À LA FOIS, jusqu'à ce que la frontière de l'arbre de décisions soit vide. Le primitif grilling fournit l'arbre et la frontière ; ce skill en fixe la conduite, et il prime sur son format en tours. Ne fait pas : poser plusieurs questions dans un même message, répondre à la place de l'humain, ni rédiger la thèse avant la confirmation finale.

## Conduite — Une question à la fois

Une salve de questions numérotées se répond en diagonale : l'humain répond aux plus faciles, survole les autres, et les décisions implicites survivent sous une réponse polie. Une seule question, avec sa réponse recommandée, obtient une décision ; la suivante se choisit en sachant ce qui vient d'être tranché.

**Où.** Dans la conversation principale, jamais dans un sous-agent : un sous-agent ne peut pas attendre la réponse de l'humain. Le product-lead rédige ensuite à partir du journal.

1. UNE seule question par message. Jamais de liste numérotée, jamais de « et aussi », jamais de deuxième question en post-scriptum.
2. Choisir sur la frontière la question qui peut tout arrêter, puis celle qui débloque le plus de branches. Ordre de principe : problème, cible, proposition de valeur, alternative, critère d'abandon, puis les hypothèses qui en découlent.
3. Chaque question porte, dans cet ordre : un titre court, pourquoi elle compte maintenant en une phrase, la question, la réponse recommandée et son motif.
4. Réponse fermée — deux à quatre options — : mécanisme de questions structurées du harness, une question par appel, l'option recommandée en premier. Réponse ouverte : en texte, toujours une seule question.
5. Attendre la réponse. Ne jamais enchaîner, ni supposer la réponse pour gagner un tour.
6. Après chaque réponse, une ligne d'accusé : ce qui est tranché, ou ce qui bascule en HYP-nn UNVALIDATED. La ligne entre au Journal d'interrogatoire — question, réponse retenue, qui l'a dite, issue — avant la question suivante.
7. Les FAITS se cherchent, ils ne se demandent pas : ce que le dépôt, la recherche ou un sous-agent peuvent établir n'est jamais posé à l'humain. Les DÉCISIONS sont à lui.
8. « Je ne sais pas » n'est pas un échec : proposer l'hypothèse HYP-nn, son critère de falsification et son point de test, et la faire valider par une question fermée.
9. Chaque question affiche sa place : « Question 6 · 4 branches ouvertes », pour que l'humain voie la fin.
10. Les compléments d'input sous-spécifié (EX2) suivent la même règle pendant l'activité : une à la fois, quatre au plus.
11. Frontière vide : un récapitulatif unique — décisions tranchées, hypothèses ouvertes —, puis une seule demande de confirmation. Rien n'est rédigé avant cette confirmation.
12. Reprise : relire le Journal d'interrogatoire et ne jamais reposer une question déjà tranchée.

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
| 2 | Thèse produit et outcomes | `product-lead` | `Product Owner` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-02 — Thèse produit, outcomes et hypothèses critiques | `C1.2-strategie/strategy/product-thesis.md · outcomes.md · assumptions.md` | G0 |

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
