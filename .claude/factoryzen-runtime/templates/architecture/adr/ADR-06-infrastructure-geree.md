# Une infrastructure gérée derrière l'API, un conteneur par environnement
### ADR de départ · Départ d'architecture standard

> Décision de départ. Gardée, elle est reprise dans `C1.4-socle/decisions/adr/` et revérifiée
> sur le produit ; adaptée, réécrite sur ce qui change ; écartée, remplacée par une ADR qui dit
> pourquoi.

## ADR-06 — Une plateforme gérée fournit base, identité et stockage par environnement, et l'API tourne en un conteneur sur un hébergeur géré

Une plateforme gérée par environnement hébergé apporte PostgreSQL, l'identité et le stockage
privé, et une pile locale équivalente pour le développement et la CI. Elle est utilisée comme
**infrastructure, jamais comme backend** : son API de données est désactivée, les droits par
défaut révoqués, aucune fonction hébergée, aucun temps réel, aucune fonctionnalité propre à la
plateforme dans le code du domaine. L'API tourne en une image de conteneur exécutée par
empreinte, sur un hébergeur géré : instance toujours active, TLS de la plateforme, secrets par
environnement. Le choix de l'hébergeur et de la région se fait au premier provisionnement de la
QA, comme l'arrangement le plus simple qui tient les exigences connues ce jour-là.

**Pourquoi.** Une intégration, un tableau de bord et une histoire de sauvegarde au lieu de
trois, sans céder la logique ni l'autorisation. Chaque couplage reste standard — PostgreSQL,
S3, OIDC, une image de conteneur — : changer d'hébergeur ou auto-héberger ne réécrit pas le
domaine.

## Alternatives rejetées

- **Trois fournisseurs séparés** (base, identité, stockage) : défendable, plus lent à monter,
  trois jeux d'accès et trois sauvegardes.
- **Kubernetes, multi-région** : une topologie à exploiter avant d'avoir un utilisateur.
- **Une offre gratuite pour la QA** : un projet inactif peut être mis en pause, et une recette
  en pause casse l'acceptation humaine.

## Ce que la décision exclut

Mono-région et disponibilité modeste en v1. Aucun code du domaine n'importe le SDK de la
plateforme : il n'en connaît que PostgreSQL, S3 et les jetons.

## Classement

EXTENSION : tant que les couplages restent standard, remplacer la plateforme ou l'hébergeur
n'invalide rien de livré.

## Conditions de réexamen

Un déclencheur d'échelle mesuré (voir le départ, Conditions de réexamen) ; une réponse
juridique exige un hébergement dans un pays donné ; l'hébergeur ne tient plus ses exigences
(image par empreinte, instance active, région, secrets par environnement).
