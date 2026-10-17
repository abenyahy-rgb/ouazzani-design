# Un monolithe modulaire, un seul déployable
### ADR de départ · Départ d'architecture standard

> Décision de départ. Gardée, elle est reprise dans `C1.4-socle/decisions/adr/` et revérifiée
> sur le produit ; adaptée, réécrite sur ce qui change ; écartée, remplacée par une ADR qui dit
> pourquoi.

## ADR-01 — Le serveur est un seul déployable, découpé en modules qui possèdent chacun leurs données

Un seul service d'API, en TypeScript sur Node.js LTS, organisé en modules qui sont des
contextes bornés : chaque module possède son schéma, n'expose qu'une interface applicative, et
ses dépendances autorisées sont déclarées et vérifiées en CI, sans cycle.

**Pourquoi.** Une équipe réduite, et des agents qui construisent, livrent plus vite et plus sûr
un seul déployable : un déploiement, un journal, une transaction quand une règle traverse deux
modules. Les frontières de modules donnent la discipline des services sans leur coût
d'exploitation, et laissent extraire un module le jour où une mesure le demande.

## Alternatives rejetées

- **Microservices, un service par module** : réseau, déploiements et cohérence distribuée à
  payer dès la v1, pour une charge que personne n'a mesurée.
- **Fonctions serverless pour l'API** : elles imposent de sortir les travaux en tâche de fond
  du processus — un changement d'architecture fait pour épouser une plateforme.
- **Un monolithe sans frontières de modules** : rapide au départ, impossible à découper ensuite.

## Ce que la décision exclut

Aucun module ne se déploie ni ne passe à l'échelle seul. Aucun module ne lit les tables d'un
autre : il passe par son interface. Pas de bus d'événements entre modules.

## Classement

CORE INVARIANT : la remettre en cause redécoupe le code et les données livrés.

## Conditions de réexamen

L'équipe dépasse quelques ingénieurs et les modules se contestent ; un module a un profil de
charge mesuré que le reste ne partage pas ; une contrainte d'isolation (sécurité, réglementaire)
exige un déploiement séparé.
