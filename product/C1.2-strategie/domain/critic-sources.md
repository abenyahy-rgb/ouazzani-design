---
id: WP-07
name: "Définition du critic métier"
produced_by: "3"
controlled_at: "G0"
completion: partiel
reserves: ["Le critic est DÉFINI mais NON ÉPROUVÉ. Le critère de sortie de l'activité 3 exige « critic déployé et éprouvé sur un cas connu dont la réponse est vérifiable indépendamment » : la vérification indépendante suppose une source lisible, et la politique réseau de l'environnement bloque toute lecture de page. Un critic non éprouvé n'est pas un critic.", "Son dossier de sources (critic-sources.md) est VIDE de sources de rang 1 : WP-06 n'a approuvé aucune source. Le critic ne peut donc rendre que des INCONNU.", "Le cas de test est ÉCRIT et sa réponse attendue fixée, pour être exécutable dès la levée du blocage sans être réécrit après coup — un cas de test rédigé après avoir vu la réponse ne teste rien.", "Levée : autoriser les domaines dans la politique d'egress, ou fournir les documents dans le dépôt."]
---

# WP-07 — Définition du critic métier · critic-sources.md

> **Dossier vide en rang 1.** Le critic n'a aucune source approuvée sur laquelle s'adosser.

## Sources adossées et échelle épistémique

### Rang 1 — réglementaire : source primaire, citable littéralement

**Aucune.** Un `FAIT` ne peut être posé qu'à partir d'une source de ce rang. Le dossier étant
vide, **le critic ne peut rendre aucun `FAIT`** — donc aucun `FAIL` de sévérité bloquante.

| Réf. | Attendue | Origine candidate | État |
|---|---|---|---|
| SRC-01 | Loi 31-08 — protection du consommateur, vente à distance | CAND-01 (`wipo.int`) · CAND-02 (`khidmat-almostahlik.ma`) | **non lue** — `EGRESS_BLOCKED` / HTTP 000 |
| SRC-02 | Loi 09-08 et lignes directrices CNDP | CAND-03, CAND-04 (`cndp.ma`) | **non lue** |
| SRC-03 | Régime fiscal et douanier de la vente en ligne | aucune candidate identifiée | **non identifiée** |

### Rang 2 — professionnelle : usage de filière, second témoin admissible

| Réf. | Attendue | Origine candidate | État |
|---|---|---|---|
| SRC-04 | Structuration du padel au Maroc — clubs, licenciés | CAND-05 (`frmt.ma`) | **non lue** — HTTP 000 |
| SRC-05 | Poids du paiement à la livraison dans l'e-commerce marocain | CAND-07 (`cmi.co.ma`) | **non lue** |

**CAND-06 (`padelset.ma`) est écartée du dossier en tant que témoin autonome** : source
secondaire, susceptible de dériver de la fédération. Elle pourra illustrer, jamais fonder — et
ne comptera pas comme second témoin de SRC-04.

### Rang 3 — contractuelle : ce que le produit s'impose à lui-même

**Aucune** — il n'existe ni conditions générales, ni contrat de transport, ni politique de
retour. Ce rang se remplira aux activités 9 et 14, et il est le seul des trois qui ne dépende
d'aucun accès extérieur.

### Ce que ce dossier vide implique pour tout verdict rendu d'ici là

1. **Toute affirmation du critic est `INCONNU`.** Pas `INFÉRENCE`, pas `ABSTRACTION` :
   `INCONNU`, faute de prémisses établies.
2. **Aucun `FAIL` bloquant n'est prononçable**, un finding bloquant exigeant `RG-nn` + `SRC-nn`
   + citation littérale.
3. **Le comportement conforme du critic est de refuser de juger** — `BLOCKED` au contrat
   d'entrée, WP-06 n'approuvant aucune source.

**Le risque que ce fichier existe pour écarter.** Un critic dont le dossier est vide mais dont
la définition est complète *paraît* opérationnel. Invoqué, il rendrait des verdicts formés,
argumentés et sans fondement — l'artefact le plus dangereux que cette activité puisse produire,
parce qu'il porte l'autorité d'un juge et le contenu d'une conjecture. **Il est donc déclaré
non déployé, et ce fichier est la déclaration.**

<!-- Complétude : Le critic cite des sources externes et non la mémoire du modèle. Définition revue par un humain. Éprouvé sur son cas de test. -->
