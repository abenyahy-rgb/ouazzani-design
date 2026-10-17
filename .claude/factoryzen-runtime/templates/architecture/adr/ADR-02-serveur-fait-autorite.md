# Le serveur fait autorité, derrière un contrat d'API unique
### ADR de départ · Départ d'architecture standard

> Décision de départ. Gardée, elle est reprise dans `C1.4-socle/decisions/adr/` et revérifiée
> sur le produit ; adaptée, réécrite sur ce qui change ; écartée, remplacée par une ADR qui dit
> pourquoi.

## ADR-02 — Toute règle, tout calcul et toute autorisation vivent dans l'API, que le client atteint par un seul contrat OpenAPI

Le client affiche et saisit ; l'API décide. Le contrat REST est écrit en OpenAPI, il est la
source de vérité : types du serveur et client générés, dérive vérifiée en CI. Commandes (POST)
et requêtes (GET) sont séparées dans chaque module ; toute commande qu'un client peut rejouer
porte une clé d'idempotence, et un rejeu rend le résultat déjà enregistré.

**Pourquoi.** Une règle écrite à deux endroits finit par diverger, et une autorisation côté
client n'en est pas une. Un contrat écrit avant le code se vérifie, génère le client et génère
les tests d'isolation de chaque point d'accès.

## Alternatives rejetées

- **La plateforme gérée en backend applicatif** — client branché directement sur la base,
  autorisation en politiques de lignes, logique dans des fonctions hébergées : l'autorisation
  et les règles quittent le code qu'on teste et qu'on relit.
- **GraphQL ou RPC maison** : plus de surface à sécuriser et à tester, aucun gain mesuré pour un
  client unique.
- **Calculs dupliqués sur le client** pour l'affichage hors ligne : deux résultats possibles pour
  le même chiffre.

## Ce que la décision exclut

Le client ne lit aucune table et n'appelle aucune fonction de la plateforme pour une donnée du
produit. Aucun chiffre montré à l'utilisateur n'est calculé sur le client. Aucun point d'accès
hors du contrat.

## Classement

CORE INVARIANT : chaque écran et chaque test d'isolation dépendent du contrat.

## Conditions de réexamen

Un second client aux besoins de lecture très différents est mesuré ; un flux de lecture
publique, sans droit, justifie un accès direct en lecture seule.
