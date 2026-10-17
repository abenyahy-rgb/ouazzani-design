# L'IA derrière un port unique — seulement si le produit en a
### ADR de départ · Départ d'architecture standard

> Décision de départ. Gardée, elle est reprise dans `C1.4-socle/decisions/adr/` et revérifiée
> sur le produit ; adaptée, réécrite sur ce qui change ; écartée, remplacée par une ADR qui dit
> pourquoi. Un produit sans IA écarte cette ADR, et le dit.

## ADR-09 — Un modèle d'IA n'est appelé que par un adaptateur derrière un port du domaine : il propose, le code déterministe vérifie, l'humain décide

Un port par capacité (par exemple : lire un document fourni par l'utilisateur), un adaptateur,
un fournisseur. La sortie est bornée par un schéma, sans texte libre ; une sortie hors schéma
est jetée et le champ reste inconnu. Une proposition ne devient un fait que par un acte de
l'utilisateur. Le modèle ne reçoit que l'entrée à traiter et son schéma — aucune donnée de
compte ni de locataire — ; un document est une donnée, jamais une instruction. Tout le reste —
règles, calculs, autorisations, textes montrés comme des faits — est déterministe. Le SDK du
fournisseur est interdit hors de l'adaptateur, et une vérification de CI le tient.

**Pourquoi.** Changer de fournisseur ou de modèle ne touche jamais le domaine. Une sortie
bornée se vérifie par le code ; une proposition relue par l'humain ne peut pas élever seule le
statut d'une donnée.

## Alternatives rejetées

- **Le SDK appelé depuis les modules métier** : le fournisseur s'installe partout, et une
  injection dans un document atteint le domaine.
- **Plusieurs fournisseurs dès la v1** : un routage à tenir avant d'avoir une mesure.
- **L'IA qui écrit un texte présenté comme un fait** : invérifiable.

## Ce que la décision exclut

Pas d'agent à outils, pas de génération libre montrée comme un fait, pas d'entraînement sur les
données du produit ; rétention minimale, confirmée au choix du fournisseur.

## Classement

EXTENSION : derrière le port, changer de fournisseur n'invalide rien de livré.

## Conditions de réexamen

L'évaluation d'un cas d'usage, par type d'entrée et par champ, montre qu'un fournisseur ne le
tient pas ; le produit veut confier à l'IA une décision, ce qui se décide d'abord en produit.
