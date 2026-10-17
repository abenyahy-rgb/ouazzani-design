---
name: market-tests
description: "Mettre les hypothèses critiques à l'épreuve du marché réel AVANT le socle, par les tests les moins chers qui les tranchent, et consigner ce qu'ils apprennent en cartes d'apprentissage — INSEAD New Business Venturing, Lean Startup. Utiliser à l'activité 7 de la méthode — Tests de marché et apprentissages."
---

# market-tests

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Mettre les hypothèses critiques à l'épreuve du marché réel AVANT le socle, par les tests les moins chers qui les tranchent, et consigner ce qu'ils apprennent en cartes d'apprentissage — INSEAD New Business Venturing, Lean Startup. Ne fait pas : publier, écrire au nom du porteur ou dépenser sans sa décision ; présenter un propos ou une simulation comme une preuve d'achat.

## Procédure

1. Reprendre les cartes de test de WP-02 et classer les hypothèses par criticité — problème, client, solution, prix — puis par facilité à tester. Retenir les trois à cinq qui tueraient le produit si elles étaient fausses.
2. Pour chacune, choisir le test le MOINS CHER qui la tranche, et le plus haut échelon de fiabilité qu'il peut atteindre : propos < intérêt observé sans pitcher < acte (inscription, clic d'achat) < paiement (acompte, précommande). Viser l'acte au moins.
3. Écrire le critère de réussite AVANT le test — « nous avons raison si… », chiffré — et le commiter. Un critère écrit après le résultat n'est pas un critère.
4. Préparer le test : page d'atterrissage au VRAI prix avec liste d'attente ou bouton d'achat, message, ciblage, budget. Chercher les prix et offres des alternatives et les communautés où la cible se trouve, sourcés.
5. Faire décider le porteur — une décision bloquante par test : publier, à qui, avec quel budget. Rien ne part avant sa réponse ; un test non décidé reste préparé, pas mené.
6. Mener le test, collecter les résultats BRUTS sous results/ — export, réponses, paiements — et les sourcer en E-nn.
7. Écrire une carte d'apprentissage par test : nous pensions, nous avons fait, nous avons observé, à quel échelon, donc nous décidons. Une hypothèse infirmée se dit infirmée et route vers WP-02.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 7 | Tests de marché et apprentissages | `product-lead` | `Product Owner` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-07 — Tests de marché et apprentissages | `C1.3-parcours/tests-marche/test-plan.md · learning-cards.md · results/` | G0 |

Plan de contenu et critère de complétude de chacun : **`references/livrables.md`**.

## Contrat d'entrée

Si un artefact d'entrée déclaré manque, retourner `BLOCKED — input manquant`. Ne jamais inférer : produire sur un matériau deviné donne un résultat plausible et invérifiable, ce que la méthode existe pour empêcher.

**Activité 7 — arrêt dur.** Hypothèses critiques nommées et classées, chacune avec sa carte de test (WP-02) ; recherche utilisateur et personas (WP-04) ; squelette de parcours (WP-05) — il donne la promesse que les tests exposent. L'un d'eux absent produit BLOCKED.

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
