# Une base relationnelle source de vérité, des migrations en avant
### ADR de départ · Départ d'architecture standard

> Décision de départ. Gardée, elle est reprise dans `C1.4-socle/decisions/adr/` et revérifiée
> sur le produit ; adaptée, réécrite sur ce qui change ; écartée, remplacée par une ADR qui dit
> pourquoi.

## ADR-03 — Les données vivent dans PostgreSQL, un schéma par module, et le schéma n'évolue que par migrations SQL en avant appliquées par la CI

Une base PostgreSQL par environnement, source de vérité. Un schéma par module, jamais exposé
à un client ; l'API s'y connecte par un rôle dédié au moindre privilège. Chaque ligne d'un
locataire porte sa clé, et les enfants la référencent par clé composite. JSON seulement pour
une charge typée et versionnée. Les faits que le domaine veut immuables sont en ajout seul,
tenus par les droits (insertion et lecture) et par déclencheur. Les migrations sont versionnées
avec le code, en avant uniquement, rejouées depuis zéro à chaque CI, compatibles avec l'image
précédente — élargir, migrer, resserrer — et appliquées seulement par la CI.

**Pourquoi.** Contraintes, jointures et transactions sont là où vivent les invariants ;
PostgreSQL est standard et portable. Une migration rejouée depuis zéro à chaque commit prouve
que tout environnement se reconstruit ; une migration appliquée qu'on réécrit fait diverger les
environnements sans que personne ne le voie.

## Alternatives rejetées

- **Une base documentaire**, ou **un document JSON unique** qui porte tout l'état : les
  invariants quittent la base et la comparaison dans le temps devient coûteuse.
- **Event sourcing et CQRS dès la v1** : l'historique utile s'obtient par des faits en ajout
  seul, sans reconstruire l'état depuis un journal.
- **Migrations descendantes, corrections au tableau de bord** : un environnement hébergé
  retouché à la main n'est plus reproductible.

## Ce que la décision exclut

Aucune migration appliquée n'est modifiée, renommée ni supprimée : une erreur se corrige par
une nouvelle migration qui refait LOCAL → DEV → QA. Aucun changement manuel de schéma dans un
environnement hébergé. Aucune isolation par locataire laissée au seul code applicatif.

## Classement

CORE INVARIANT : toutes les données livrées reposent sur ce modèle.

## Conditions de réexamen

Un volume ou un motif d'accès mesuré que la base ne tient plus après pooler et réplique ; une
exigence d'audit ou de rejeu que l'ajout seul ne tient pas.
