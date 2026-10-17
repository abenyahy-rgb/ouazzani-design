# Les travaux asynchrones en base, exécutés dans l'API
### ADR de départ · Départ d'architecture standard

> Décision de départ. Gardée, elle est reprise dans `C1.4-socle/decisions/adr/` et revérifiée
> sur le produit ; adaptée, réécrite sur ce qui change ; écartée, remplacée par une ADR qui dit
> pourquoi.

## ADR-08 — Les travaux en tâche de fond sont une file dans PostgreSQL, exécutée par le processus de l'API

Une table de travaux dans la base, sans courtier de messages. L'API les exécute dans son
processus ; un worker séparé, de la **même image**, n'apparaît que sur un déclencheur mesuré.
Chaque travail est idempotent, borné dans le temps, rejoué avec temporisation croissante, mis
en lettre morte après ses essais, et visible de l'exploitation. La file naît avec le premier
travail qui en a besoin, pas avant.

**Pourquoi.** Une brique d'infrastructure de moins ; la file partage les transactions et les
sauvegardes de la base ; l'exploitation lit une table.

## Alternatives rejetées

- **Un courtier de messages ou un bus d'événements** : un service de plus à exploiter, pour un
  débit que personne n'a mesuré.
- **Des fonctions serverless déclenchées** : travail borné par le délai de la fonction, file et
  planification à ajouter à côté.
- **Un worker séparé dès la v1** : un second déployable sans besoin.

## Ce que la décision exclut

L'hébergeur doit tenir une instance toujours active. Pas d'orchestration de travaux
inter-services ; pas de livraison « exactement une fois » promise par l'infrastructure : c'est
l'idempotence qui la tient.

## Classement

EXTENSION : passer à un worker séparé ou à un courtier ne change ni le domaine ni les données.

## Conditions de réexamen

Les travaux pèsent sur la latence des requêtes ou sur la mémoire ; le débit mesuré dépasse ce
que la file en base tient.
