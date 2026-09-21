---
id: WP-05
name: "Hypothèses critiques"
produced_by: "2"
controlled_at: "G0"
completion: partiel
reserves: ["BLOCKED en cascade : « une hypothèse sans OUT n'est pas critique », et WP-04 n'émet aucun OUT.", "Deux hypothèses de MÉTHODE sont consignées — HYP-M1, HYP-M2 — parce qu'elles portent sur le run lui-même et non sur le produit, et qu'elles sont falsifiables dès aujourd'hui. Elles ne tracent vers aucun OUT et ne comptent donc PAS comme hypothèses critiques au sens du registre.", "Aucune hypothèse produit n'est émise : hypothéser sur un produit inconnu produit une fiction munie d'un critère de falsification."]
---

# WP-05 — Hypothèses critiques

> **BLOCKED pour les hypothèses produit.** Deux hypothèses de méthode sont néanmoins
> consignées, hors compte.

### Pourquoi la cascade s'arrête ici

Le critère de complétude est sans ambiguïté : « chaque HYP trace vers un OUT ». WP-04 n'émet
aucun OUT ; aucune hypothèse produit ne peut donc être critique au sens du registre. Écrire
des HYP flottantes remplirait le fichier et viderait le contrôle.

**Ce que le mode SOLO aurait permis, et pourquoi il ne s'applique pas.** En SOLO, l'absence
d'une information devient une `HYP` `UNVALIDATED` — c'est le mécanisme normal, et il est bon.
Il suppose un objet : on hypothèse *sur quelque chose*. Ici l'objet manque. Une hypothèse sur
le coût hebdomadaire d'un processus dont on ignore la nature, pour une personne dont on ignore
le métier, porte tous les attributs formels d'une hypothèse — énoncé, critère, étiquette — et
aucun de ses attributs utiles. Elle passerait le contrôle. C'est le problème.

## HYP-nn — énoncé

**Aucune hypothèse produit.** Deux hypothèses de **méthode**, hors compte critique :

- **HYP-M1** — Le mode SOLO déclaré permettra de conduire le run jusqu'à G0 sans lettre de
  délégation écrite hors cadence.
- **HYP-M2** — La projection tirée du launchpad suffit comme espace de travail lisible : aucun
  besoin d'un second support pour que le Product Owner suive l'avancement.

## Trace vers OUT

**Aucune.** HYP-M1 et HYP-M2 ne tracent vers aucun OUT — elles portent sur le run, pas sur le
produit. C'est précisément pourquoi elles ne sont **pas** des hypothèses critiques et ne
comblent rien. Elles sont consignées parce qu'elles sont falsifiables dès aujourd'hui, et
qu'une hypothèse de méthode tue est celle qui se paie en fin de run.

## Critère de falsification

- **HYP-M1** — *Fausse si l'on observe, avant G0, un livrable déclaré `complet` dont un input
  de décision a été comblé par un agent plutôt que par le Product Owner.* Observable au Run
  Ledger : toute déclaration `complet` sans réserve sur un livrable dont une section relève
  d'EX2 cas 1.
- **HYP-M2** — *Fausse si l'on observe le Product Owner demander l'état du run par un canal
  autre que le launchpad plus d'une fois entre deux gates.*

## Étiquette

- **HYP-M1** — `UNVALIDATED`. Conviction de conception, non testée : ce run est le premier
  en SOLO déclaré sur ce dépôt.
- **HYP-M2** — `UNVALIDATED`. La projection a fonctionné une fois (run #3 du workflow,
  2026-09-21, conclusion `success`) ; une réussite technique n'est pas un usage.

## Point de test et porteur

Obligatoires pour toute `UNVALIDATED`.

| | Point de test | Porteur |
|---|---|---|
| HYP-M1 | G0 — revue du Run Ledger, déclaration par déclaration | factory-lead |
| HYP-M2 | Première gate atteinte — G0 | A. Benyahya, Product Owner |

**Les hypothèses produit, elles, ont leur point de test fixé par la méthode à l'activité 16
(validation utilisateurs et convergence).** Il n'y en a aucune à y porter tant que WP-03 est
BLOCKED.

<!-- Complétude : Chaque HYP trace vers un OUT et porte un critère de falsification observable. Aucune UNVALIDATED sans point de test ni porteur. -->
