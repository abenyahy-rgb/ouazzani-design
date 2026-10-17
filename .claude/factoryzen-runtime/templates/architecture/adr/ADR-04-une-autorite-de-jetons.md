# Une seule autorité de jetons, l'autorisation dans l'API
### ADR de départ · Départ d'architecture standard

> Décision de départ. Gardée, elle est reprise dans `C1.4-socle/decisions/adr/` et revérifiée
> sur le produit ; adaptée, réécrite sur ce qui change ; écartée, remplacée par une ADR qui dit
> pourquoi.

## ADR-04 — Un fournisseur d'identité géré émet les jetons, l'API les vérifie et autorise chaque appel

Un fournisseur d'identité géré, conforme OIDC, porte identifiants, vérification d'adresse,
réinitialisation, sessions et rotation des jetons de rafraîchissement. Il signe ses jetons par
clé **asymétrique** ; l'API les vérifie par JWKS et n'en émet aucun. Le compte du produit est
créé à la première requête vérifiée, indexé sur le **sujet** du jeton, jamais sur l'adresse
e-mail. Un garde, sur chaque point d'accès, résout compte, locataire et rôle ; les commandes
sensibles vérifient que la session vit encore. La base reste en refus par défaut, en filet.

**Pourquoi.** Aucun mot de passe géré par le produit ; une seule autorité de jetons, donc une
seule surface. Un jeton d'accès reste valide jusqu'à son expiration : sans vérification de
session, une déconnexion ne révoque rien.

## Alternatives rejetées

- **Authentification maison** : mots de passe, vérification et réinitialisation à construire et
  à sécuriser, sans valeur pour le produit.
- **Des jetons propres à l'API en plus de ceux du fournisseur** : deux autorités, deux
  révocations à tenir cohérentes.
- **L'autorisation en politiques de lignes comme contrôle principal** : la règle la plus
  sensible quitte le code qu'on teste point d'accès par point d'accès.

## Ce que la décision exclut

Pas d'identité par e-mail, pas de fusion de comptes écrite par le produit. Masquer un bouton
n'est jamais un contrôle. Une clé de signature symétrique n'est pas acceptée.

## Classement

CORE INVARIANT : tous les comptes existants sont indexés sur ce modèle.

## Conditions de réexamen

Une exigence d'identité d'entreprise (SSO, annuaire) est mesurée ; le fournisseur ne tient plus
une exigence de sécurité vérifiée.
