---
id: WP-03
name: "Thèse produit"
produced_by: "2"
controlled_at: "G0"
completion: partiel
reserves: ["BLOCKED — EX2 cas 1 : l'intention du produit est une DÉCISION que seul l'humain qui répond du produit peut prendre. Le RUN MODE SOLO ne la convertit PAS en hypothèse (method.yaml:2163-2171).", "Aucune des cinq sections de fond n'est produite : le problème, la cible, la proposition de valeur, l'alternative et le critère d'abandon attendent tous le même input absent.", "Salve d'interrogatoire du 2026-09-21 restée sans réponse — une seule salve est permise (EX2)."]
---

# WP-03 — Thèse produit

> **BLOCKED — EX2, cas 1.** Le registre décrit WP-03 comme « l'intention au niveau du produit
> entier … l'artefact le plus plausible et le moins vérifiable de la méthode ». C'est
> précisément ce qu'EX2 place hors du relâchement SOLO.

### Le blocage, en une lecture

Ce run est déclaré `RUN MODE: SOLO` (`project.yaml:21`). En SOLO, `EX2.run_mode_solo`
(`method.yaml:2163-2171`) dispose qu'un input absent **ne produit plus un arrêt dans le cas
général** : il produit une hypothèse nommée, étiquetée `UNVALIDATED`, avec son critère de
falsification — et l'activité continue.

**Trois cas restent BLOCKED, sans exception et quel que soit le mode.** Le premier est cité
mot pour mot :

> « un input qui n'est pas une information mais une **DÉCISION** que seul l'humain qui répond
> du produit peut prendre — **intention, arbitrage de périmètre, critère d'abandon** »

WP-03 *est* l'intention, et porte le critère d'abandon comme section obligatoire. Deux des
trois termes de l'exception le désignent nommément. Le mode SOLO ne s'y applique pas.

**Ce que serait la transgression.** Rien ne m'empêche techniquement d'écrire une thèse
vraisemblable : un métier du design ou de l'immobilier au Maroc, un client type, un processus
en WhatsApp et Excel, un coût hebdomadaire plausible. Elle serait cohérente, bien rédigée, et
entièrement fabriquée. Le registre nomme ce risque à propos de ce livrable précis — « le plus
plausible et le moins vérifiable ». Une thèse inventée ne se distingue pas d'une thèse vraie à
la lecture ; elle ne s'en distingue qu'à l'usage, trop tard, quand le socle est figé et que
neuf livrables en descendent.

## Problème

**BLOCKED.** Attendu : de qui · comment on le sait · ce qu'ils font aujourd'hui · ce que ça
leur coûte. Le sponsor a qualifié la source d'opportunité — *une demande client réelle* — sans
nommer ni le client, ni sa demande, ni sa date. Une demande client sans client est une
intuition qui a emprunté le vocabulaire d'un fait.

## Cible

**BLOCKED.** Attendu : une personne descriptible, pas un segment · combien · comment on
l'atteint. Dépend du Problème ; aucune inférence ne le précède.

## Proposition de valeur

**BLOCKED.** Attendu : ce qui change le lendemain · ce que la personne arrête de faire. Ne
peut s'écrire sans savoir ce qu'elle fait aujourd'hui.

## Alternative et statu quo

**BLOCKED.** Attendu : ce qui se passe si on ne fait rien · qui d'autre résout ça · pourquoi
celle-ci gagne. Une analyse concurrentielle sans domaine qualifié produirait une liste
plausible de concurrents imaginaires (U-02).

## Critère d'abandon

**BLOCKED — nommément.** Attendu : quel résultat ferait renoncer, qui le prononce, à quelle
date on regarde. `EX2.run_mode_solo` cite « critère d'abandon » dans la liste des trois cas
qui restent BLOCKED en toutes circonstances. C'est la section la plus souvent laissée vide de
cette méthode, et celle qui coûte le plus cher quand elle l'est : sans elle, un produit n'a
pas de condition de sortie, seulement une durée.

## Journal d'interrogatoire

Branches tranchées et branches basculées en `UNVALIDATED`. Le journal est ouvert ; il ne
contient à ce jour que la salve et son absence de réponse.

**Salve unique — 2026-09-21.** EX2 n'en autorise qu'une. Elle a été émise en deux temps :

*Temps 1 — qualification, répondue.*

| Question | Réponse du sponsor | Statut |
|---|---|---|
| Source d'opportunité | « Une demande client réelle » | **tranchée** — mais le client n'est pas nommé : la réponse qualifie le *type* de source, pas la source |
| Nature du produit | « Produit numérique » | **tranchée** — écarte le site vitrine et l'indécis ; oriente l'appareil méthodologique complet |

*Temps 2 — fond, sans réponse à ce jour.*

| # | Question | Ce qu'elle débloque | Traitement EX2 |
|---|---|---|---|
| Q1 | Qui a demandé, quand, dans quels mots ? | § Problème, § Cible | cas 1 — décision et information indissociables |
| Q2 | Que fait cette personne aujourd'hui, et ce que ça lui coûte ? | § Problème, § Proposition de valeur, WP-04 valeur actuelle | information : deviendrait `HYP` en SOLO **si** Q1 était répondue |
| Q3 | Combien de personnes comme elle, et comment les atteint-on ? | § Cible, découpage en releases | information : idem Q2 |
| Q4 | Qu'est-ce qui vous ferait renoncer ? | § Critère d'abandon | **cas 1 — BLOCKED absolu** |

**Branche non tranchée, et c'est délibéré.** Q2 et Q3 sont de l'information : en SOLO, leur
absence deviendrait légitimement une `HYP-nn` `UNVALIDATED`. Elles restent néanmoins non
écrites, parce qu'une hypothèse suppose un objet. Hypothéser le coût hebdomadaire d'un
processus dont on ignore la nature, pour une personne dont on ignore le métier, ne produit pas
une hypothèse falsifiable : cela produit une fiction munie d'un critère de falsification, ce
qui est pire qu'un blanc — un blanc se voit.

**Escalade, procédure des exceptions (`method.yaml:2144-2154`).**

| Étape | |
|---|---|
| DÉCLARER | consigné ici et au Run Ledger, à la déclaration de WP-03 |
| NOMMER | A. Benyahya, Product Owner — `project.yaml:91` |
| ROUTER | **N2 — Product Owner.** L'intention produit n'est pas arbitrable plus bas |
| FERMER OU REPORTER | **reporté**, en attente de Q1 et Q4. Le silence n'est jamais une résolution ; le coût est relevé dans les deux cas |

**Coût relevé.** G0 demande 18 livrables ; WP-03 en conditionne directement neuf par la chaîne
de traçabilité `OUT → HYP → PER → …`. Tant que Q1 et Q4 sont sans réponse, l'activité 2 ne
peut pas satisfaire son critère de sortie — « aucune hypothèse critique ne sort non résolue » —
et les activités 3 à 17 restent hors d'atteinte. Le run n'est pas ralenti : il est arrêté à son
premier livrable de fond.

<!-- Complétude : Aucune décision implicite ne subsiste. Chaque affirmation matérielle porte sa source et son étiquette épistémique. Le critère d'abandon est écrit. -->
