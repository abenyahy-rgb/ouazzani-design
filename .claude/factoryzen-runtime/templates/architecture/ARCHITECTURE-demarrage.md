# Départ d'architecture standard

Le point de départ de l'activité 11 — Socle technique et choix structurants. Une architecture
qui a déjà tenu un premier run réel de la Factory : une application cliente et une API,
un socle prouvé en tranche 0, livré DEV → QA, accepté par un humain en recette. Le départ en
garde la forme et les choix par défaut ; le domaine, le pays, la plateforme de publication,
les noms d'hôtes et les identifiants du produit d'origine en ont été retirés.

On ne part donc pas d'une page blanche, et on ne garde rien sans que l'autorité Tech l'ait dit :
le départ est confronté au squelette et aux contraintes du projet, puis **gardé**, **adapté**
ou **remplacé**. Chaque choix ci-dessous porte la décision, pourquoi, l'alternative écartée et
quand la rouvrir. Les ADR de départ (`adr/`) portent les mêmes décisions au format de WP-13.

## Le principe — l'architecture la plus simple qui porte le produit en sûreté

**CONSTRUIRE SIMPLE → VALIDER LE PRODUIT → PASSER À L'ÉCHELLE QUAND L'USAGE RÉEL L'EXIGE.**

- Partir de l'architecture la plus simple qui porte le produit accepté **en sûreté**.
- L'infrastructure croît sur usage **mesuré**, jamais sur une charge hypothétique.
- L'architecture applicative est séparée de l'infrastructure d'échelle : le domaine ne dépend
  jamais d'une topologie d'hébergement.
- Simple ne veut pas dire non sûr : les fondamentaux de sécurité sont gardés, la complexité
  d'infrastructure n'est pas ajoutée sans besoin.
- Une question juridique ou d'hébergement ouverte est une **décision différée avec son
  déclencheur**, jamais un bloquant de conception ni de découpage.
- Ne pas collecter de donnée dont le produit n'a pas besoin : aucun champ « qui pourrait
  servir un jour ».

### Ce qui n'est PAS en v1

Microservices · bus d'événements · Kubernetes · multi-région · haute disponibilité
prématurée · topologie cloud élaborée · platform engineering d'entreprise · event sourcing
et framework CQRS · moteur de synchronisation générique · préproduction sans preuve ·
passage à l'échelle sans besoin mesuré · WAF, SIEM, HSM ou identité d'entreprise avant
qu'une preuve les demande.

Chaque élément de cette liste entre par une ADR qui cite la mesure qui l'a rendu nécessaire.

## Frontières d'intégration

Un client, une API, une plateforme gérée. Le client parle à l'API pour tout, au fournisseur
d'identité pour la seule connexion, et au stockage de fichiers seulement par les liens
signés que l'API lui donne.

| Choix par défaut | Pourquoi | Alternative écartée | Rouvrir quand |
|---|---|---|---|
| **Le serveur fait autorité** : toute règle, tout calcul et toute autorisation vivent dans l'API ; le client affiche et saisit (ADR-02) | une règle qui vit à deux endroits finit par diverger, et une autorisation côté client n'en est pas une | la plateforme gérée en backend applicatif : client branché sur la base, autorisation en politiques de lignes, logique en fonctions hébergées | jamais pour une règle métier ; un flux de lecture publique, sans droit, peut se discuter |
| **Un seul contrat d'API**, REST décrit en OpenAPI, source de vérité ; client généré ; commandes (POST) et requêtes (GET) séparées ; clé d'idempotence sur toute commande rejouable (ADR-02) | un contrat écrit avant le code se vérifie en CI (dérive) et génère les tests d'isolation | GraphQL ou RPC maison : plus de surface à sécuriser, aucun gain mesuré pour un seul client | un second client aux besoins de lecture très différents est mesuré |
| **La plateforme gérée est de l'infrastructure, jamais un backend** : base, identité et stockage, utilisés derrière l'API ; API de données de la plateforme désactivée (ADR-06) | une intégration et un tableau de bord au lieu de trois, sans céder la logique ni l'autorisation | trois fournisseurs séparés (base, identité, stockage) — défendable, plus lent à monter | la plateforme ne tient plus une exigence mesurée, ou une contrainte d'hébergement l'exclut |
| **L'IA derrière un port unique**, seulement si le produit en a : l'IA propose, le code vérifie, l'humain décide ; le SDK du fournisseur est interdit hors de l'adaptateur (ADR-09) | changer de fournisseur ou de modèle ne touche jamais le domaine ; une sortie bornée par schéma se vérifie | SDK appelé depuis les modules métier ; plusieurs fournisseurs dès la v1 | l'évaluation d'un cas d'usage montre qu'un seul fournisseur ne le tient pas |

## Modèle de persistance

| Choix par défaut | Pourquoi | Alternative écartée | Rouvrir quand |
|---|---|---|---|
| **Une base relationnelle PostgreSQL, source de vérité**, un schéma par module, accès par un rôle dédié au moindre privilège (ADR-03) | contraintes, jointures et transactions là où vivent les invariants ; standard, portable (export natif) | base documentaire ; un document JSON unique qui porte tout l'état | un volume ou un motif d'accès mesuré que la base ne tient plus |
| **Modéliser les concepts du domaine**, pas les clés d'état d'un prototype ; JSON seulement pour une charge typée et versionnée | un état de prototype recopié en base fige l'interface dans les données | reprendre la structure de données du prototype | — |
| **Pas d'event sourcing ni de CQRS** : état courant mutable, faits en ajout seul quand le domaine l'exige (droits d'insertion et de lecture seulement) (ADR-03) | l'historique utile s'obtient sans reconstruire l'état d'un journal | event sourcing dès la v1 | une exigence d'audit ou de rejeu que l'ajout seul ne tient pas |
| **Quatre flux séparés** : état et historique métier en base, audit de sécurité en table dédiée, événements produit, télémétrie hors base | une question à laquelle seuls les journaux répondent est un défaut | historique métier dans les journaux | — |
| **Isolation par locataire dans le schéma** : chaque ligne porte la clé du locataire, et les enfants la référencent par clé composite | une ligne ne peut pas pointer chez un autre locataire, même par erreur | isolation seulement dans le code applicatif | — |
| **Migrations SQL en avant uniquement**, versionnées avec le code, rejouées depuis zéro à chaque CI, compatibles avec l'image précédente (élargir → migrer → resserrer), appliquées seulement par la CI (ADR-03) | une migration appliquée ne se réécrit pas ; un environnement hébergé n'est jamais retouché à la main | migrations descendantes ; correction manuelle au tableau de bord | jamais |
| **Fichiers privés, accès signé** : stockage d'objets compatible S3, compartiments privés, clés aléatoires, liens signés de courte durée émis après autorisation, téléversement en quarantaine jusqu'à validation (ADR-05) | aucun chemin non authentifié vers un octet stocké | compartiment public ; octets en base | — |

## Topologie de déploiement

**LOCAL → DEV → QA → PROD ; PREPROD seulement sur preuve.** Construit une fois, vérifié,
la même version promue : un commit, une image d'API à empreinte immuable, promue de DEV à QA
puis à PROD. Les environnements ne diffèrent que par configuration et secrets, jamais par le
code ni par une branche. Le détail est dans `environnements.yaml`.

| Environnement | Rôle | Données | Qui décide d'y entrer |
|---|---|---|---|
| LOCAL | construire et déboguer | synthétiques, jetables | le développeur |
| DEV | la CI : chaque commit construit une fois, déployé sur une pile éphémère, validé par machine | synthétiques, recréées à chaque exécution | automatique |
| QA | l'environnement stable de validation et d'acceptation humaine | synthétiques contrôlées, comptes synthétiques nommés | automatique, sur portes DEV vertes |
| PROD | utilisateurs et données réels | réelles, ne sortent jamais de PROD | une décision humaine de mise en production |

| Choix par défaut | Pourquoi | Alternative écartée | Rouvrir quand |
|---|---|---|---|
| **Un conteneur d'API par environnement**, sur un hébergeur géré, instance toujours active, TLS de la plateforme, secrets par environnement (ADR-06) | la plus petite topologie qui porte des travaux en tâche de fond et une vérification au démarrage | Kubernetes, multi-région ; fonctions serverless pour l'API, qui imposent de sortir les travaux du processus | un déclencheur d'échelle mesuré (voir Conditions de réexamen) |
| **Trois environnements, une empreinte** : DEV = CI éphémère, QA = un environnement hébergé stable, PROD séparé (ADR-07) | accepter en QA ce qui ira en PROD, à l'octet près | une branche par environnement ; reconstruire par environnement ; un aperçu de PR pris pour la QA | une préproduction se justifie (voir ADR-07) |
| **Deux décisions humaines distinctes** : l'acceptation d'une tranche en QA, puis la mise en production ; la promotion DEV → QA est automatique | la validation automatique n'est pas l'acceptation, et l'acceptation n'est pas la mise en production | un comité de mise en production ; une promotion QA manuelle | — |
| **Traçabilité** : `GET /version` sur chaque API rend environnement, commit, empreinte et version de migration ; un enregistrement de déploiement par promotion | la PROD doit citer le même commit et la même empreinte que la QA acceptée | numéro de version déclaratif | — |
| **QA sur une offre payante**, jamais mise en pause | une recette en pause casse l'acceptation humaine | offre gratuite pour la QA | — |
| **Développement sur le tronc** : une branche principale, aucune branche d'environnement ; un correctif de release passe par le tronc | une seule vérité de code | branches dev / qa / prod | — |

**Client mobile, s'il y en a un.** Une base de code TypeScript pour iOS, Android et le web
(React Native + Expo) ; la configuration est compilée dans le binaire, donc l'artefact mobile
se promeut par **commit** : les builds QA et PROD sortent du même commit accepté. Une variante
par environnement, avec son propre identifiant : un build QA ne peut ni passer pour la
production ni la mettre à jour. Un build de production échoue si un hôte configuré n'est pas
sur la liste blanche PROD. Pas de mise à jour à chaud : ce qui tourne est ce qui a été accepté.
Le canal de validation peut différer du canal de distribution — un export web de la même
application, derrière la même API, pour itérer vite — tant que les preuves propres à la
plateforme de publication sont nommées et portées par une porte de mise en production.

## Architecture de sécurité

| Choix par défaut | Pourquoi | Alternative écartée | Rouvrir quand |
|---|---|---|---|
| **Une seule autorité de jetons** : un fournisseur d'identité géré (OIDC) émet les jetons, signés par clé asymétrique ; l'API les vérifie par JWKS et n'en émet aucun (ADR-04) | pas de mot de passe géré par le produit ; deux autorités de jetons sont deux surfaces | authentification maison ; jetons propres à l'API en plus de ceux du fournisseur | une exigence d'identité d'entreprise (SSO, annuaire) est mesurée |
| **Le compte est indexé sur le sujet du jeton**, jamais sur l'adresse e-mail ; adresse vérifiée avant toute donnée | une adresse change, se recycle et se partage | identité par e-mail | — |
| **Autorisation sur chaque appel**, dans l'API : un garde résout compte, locataire et rôle ; masquer dans l'interface n'est jamais un contrôle ; base en refus par défaut en filet | la règle la plus sensible ne se délègue ni au client ni à la base | autorisation par politiques de lignes comme contrôle principal | — |
| **Révocation côté serveur** : déconnexion et changement de mot de passe révoquent la session ; les commandes sensibles vérifient qu'elle vit encore | un jeton d'accès reste valide jusqu'à son expiration | se fier à l'expiration seule | — |
| **Secrets** dans le magasin de chaque environnement, jamais dans le dépôt ni dans le bundle client ; seules l'URL de l'API et la clé publique d'identité sont embarquées ; scan de secrets sur tout l'historique | ce qui est embarqué dans un client est public | fichiers d'environnement versionnés | — |
| **Chaîne d'approvisionnement** : fichiers de verrouillage, scan des dépendances et des conteneurs, dépendances minimales, versions épinglées sur la documentation du jour | une dépendance de trop est une surface de plus | mises à jour non revues | — |
| **Avant la première production** : revue de sécurité, test d'intrusion indépendant, exercice de restauration des sauvegardes | une première mise en production est irréversible pour les données | auto-évaluation seule | — |

**Observabilité.** Journaux JSON structurés avec identifiant de requête et identifiants
techniques, sans contenu utilisateur, sans montant, sans jeton ; rapport d'erreurs du serveur
et du client, expurgé ; journaux de la plateforme ; table d'audit de sécurité. Métriques,
traces (OpenTelemetry) et tableaux de bord d'objectifs de service s'ajoutent quand l'usage
réel les demande.

## Contraintes non fonctionnelles

Le départ ne chiffre rien à la place du produit : il nomme ce qu'il faut chiffrer et comment
le mesurer. Une contrainte sans nombre n'est pas une contrainte.

| Contrainte à chiffrer | Mesure par défaut |
|---|---|
| Temps de réponse de l'API (p95) sur les parcours principaux | test automatique contre l'image déployée en DEV |
| Temps d'affichage d'un écran clé sur le réseau et l'appareil réels de l'utilisateur | test sur appareil d'entrée de gamme, réseau bridé |
| Disponibilité de la QA et de la PROD, sur les heures qui comptent | sonde externe sur `/ready` |
| Perte de données tolérée et durée de restauration (RPO / RTO) | exercice de restauration avant la première PROD |
| Durée de conservation de chaque catégorie de donnée | politique de stockage, revue à chaque nouvelle donnée |
| Durée du chemin d'or CI (commit → QA) | durée des exécutions sur les runners hébergés |
| Accessibilité (niveau WCAG visé) et tailles d'écran supportées | outil automatique + lecteur d'écran à la main |

## Classement de chaque élément

Par rayon d'impact : CORE INVARIANT si sa remise en cause invalide du livré, EXTENSION sinon.
Le classement par défaut du départ, à confirmer sur le produit :

| Élément | Classement par défaut | Ce qu'invaliderait sa modification |
|---|---|---|
| Contrat d'API et client généré | CORE INVARIANT | chaque écran et chaque test d'isolation |
| Modèle de persistance et isolation par locataire | CORE INVARIANT | toutes les données livrées |
| Autorité de jetons et indexation du compte | CORE INVARIANT | tous les comptes existants |
| Modèle d'environnements et promotion par empreinte | CORE INVARIANT | la preuve que la PROD est ce qui a été accepté |
| Hébergeur du conteneur, plateforme gérée | EXTENSION | rien, tant que les couplages restent standard (PostgreSQL, S3, OIDC) |
| Fournisseur d'IA | EXTENSION | rien, derrière le port |
| Worker séparé, cache, outils d'observabilité | EXTENSION | rien : s'ajoutent sur déclencheur |

## Couverture du squelette

Le départ ne couvre rien par lui-même : il est confronté au squelette du projet **étape par
étape**, y compris les étapes des releases lointaines. Une étape qu'il ne porte pas — hors
ligne, temps réel, paiement, intégration d'un existant — est une adaptation, et l'adaptation
est une ADR.

## ADR — les décisions de départ

Neuf ADR, une décision par fichier, au format de WP-13. Gardée, une ADR est reprise dans
`C1.4-socle/decisions/adr/` ; adaptée, elle est réécrite sur ce qui change ; écartée, elle est
remplacée par une ADR qui dit pourquoi.

| ADR | Décision | Classement par défaut |
|---|---|---|
| ADR-01 | Un monolithe modulaire, un seul déployable | CORE INVARIANT |
| ADR-02 | Le serveur fait autorité, derrière un contrat d'API unique | CORE INVARIANT |
| ADR-03 | Une base relationnelle source de vérité, migrations en avant | CORE INVARIANT |
| ADR-04 | Une seule autorité de jetons, l'autorisation dans l'API | CORE INVARIANT |
| ADR-05 | Des fichiers privés, un accès signé | CORE INVARIANT |
| ADR-06 | Une infrastructure gérée derrière l'API, un conteneur par environnement | EXTENSION |
| ADR-07 | DEV → QA → PROD, construit une fois, promu par empreinte | CORE INVARIANT |
| ADR-08 | Les travaux asynchrones en base, exécutés dans l'API | EXTENSION |
| ADR-09 | L'IA derrière un port unique — seulement si le produit en a | EXTENSION |

## Build ou achat

Construire ce qui différencie le produit ; acheter, en service géré, tout le reste. Aucune
brique achetée n'enferme le produit : chacune a son alternative nommée.

| Capacité | Décision par défaut | Alternative si elle enferme |
|---|---|---|
| Règles, calculs et autorisation du domaine | construire | — |
| Base de données | acheter, PostgreSQL géré | tout PostgreSQL standard |
| Identité | acheter, fournisseur OIDC géré | tout fournisseur OIDC |
| Stockage de fichiers | acheter, compatible S3 | tout stockage S3 |
| Hébergement du conteneur | acheter, hébergeur géré | tout hôte qui exécute une image par empreinte |
| CI et registre d'images | acheter | — |
| Rapport d'erreurs | acheter | — |
| Modèle d'IA | acheter, un fournisseur | un autre, derrière le même port |

## Reprise de la stack de conception

La stack de conception est arrêtée en WP-08, avant la première décision visuelle. Elle est
reprise ici : le framework client du départ (React Native + Expo, TypeScript) est confronté à
celui de la conception. Une divergence entre la stack de conception et la stack de
construction est un finding, jamais deux vérités qu'on réconcilie à la première tranche.

## Conditions de réexamen

| Déclencheur mesuré | Changement |
|---|---|
| Latence ou CPU de l'API durablement au-dessus de la cible | plus d'instances (l'API est sans état) |
| Les travaux en tâche de fond pèsent sur la latence des requêtes, ou sur la mémoire | un worker séparé, de la même image |
| CPU, connexions ou taille de la base | offre supérieure, pooler de connexions, puis réplique en lecture |
| Croissance du stockage ou du trafic sortant | cycles de vie et archivage, CDN pour les documents générés |
| Débit ou coût de l'IA | traitement par lots, concurrence bornée par file, cache des lectures inchangées |
| Objectif de disponibilité ou tolérance de perte de données | restauration à un instant donné, offre supérieure, plusieurs zones |
| Une réponse juridique exige un hébergement dans un pays donné | auto-hébergement des mêmes briques standard |
| L'équipe dépasse quelques ingénieurs, les modules se contestent | propriété de module plus stricte ; extraire un module seulement sur preuve |
| La topologie de PROD diffère de la QA d'une façon que la QA ne reproduit pas | une PREPROD |

## La tranche 0 — prouver le chemin d'or

Le socle se prouve avant la première tranche produit : client → API → base, identité et
stockage, sur des écrans jetables. **Si un travail n'est requis ni pour prouver un critère
de sortie de la tranche 0, ni pour poser une fondation dont la tranche 1 a besoin, il est
différé.**

- **KEEP / DISCARD.** Chaque artefact est classé **avant** d'être écrit. Un artefact DISCARD
  n'est jamais importé par du code KEEP (vérification en CI), est absent des builds de release
  et est supprimé à la clôture de la tranche — une migration de clôture en avant, jamais une
  migration effacée.
- **KEEP par défaut** : organisation du dépôt, verrous, configuration TypeScript et lint ;
  coquille du client ; client généré ; démarrage de l'API, squelettes des premiers modules,
  `/health`, `/ready`, `/version` ; chaîne du contrat OpenAPI ; frontière avec la plateforme ;
  mécanisme de migrations ; gardes et journal expurgé ; workflows CI, scans et fonctions de
  fitness ; modèle de configuration par environnement et l'environnement QA lui-même.
- **DISCARD par défaut** : module et routes de preuve, écrans de preuve, fixtures
  d'accessibilité, scripts de démonstration, données de démonstration.

## Ce que le premier run a appris

- **Le chemin d'or CI doit avoir tourné une fois** sur les runners hébergés avant qu'une
  tranche soit dite validée en DEV : un chemin qui ne s'exécute qu'en CI cache ses défauts
  jusqu'à sa première exécution.
- **Lire les contraintes de la plateforme avant la première promotion** — TLS de la base,
  points d'API refusés — et vérifier une propriété de sécurité là où elle vit, en base, pas
  par une interface de configuration.
- **Rendre courante une clé de signature asymétrique** est une étape vérifiée du provisionnement
  de chaque environnement hébergé, jamais un défaut supposé de la plateforme.
- **Le compte d'acceptation humaine en QA ne dépend pas de comptes d'automatisation** qu'une
  promotion fait tourner : un compte stable, dont l'humain fixe le mot de passe hors du dépôt,
  des journaux et de la conversation.
- **Les prérequis de distribution** — signature, adhésion au programme d'un magasin
  d'applications, chaîne d'outils imposée par le SDK — vont dans la liste de contrôle du GO,
  pas à la découverte en QA.
- **Le périmètre d'architecture n'est pas le périmètre de publication** : un produit peut rester
  multiplateforme par architecture et sortir d'abord sur une seule plateforme ; les preuves de
  l'autre sont différées, jamais déclarées passées.
- **Le modèle de dépôt et les accès à l'hôte** se décident avant le GO, pour que la construction
  ne s'arrête pas après DEV.

## Ce que le départ ne tranche pas

Le hors-ligne (si le produit en a besoin : une file d'envoi bornée avec clé d'idempotence,
jamais un moteur de synchronisation) · le temps réel · la plateforme de première publication ·
la région d'hébergement et les obligations juridiques des données · l'usage de l'IA · les
moteurs de calcul du domaine · le modèle de rôles du produit. Chacun se tranche sur le produit,
en ADR.

## Fichiers servis

- `adr/` — les neuf ADR de départ, au format de WP-13.
- `environnements.yaml` — DEV → QA → PROD, PREPROD sur preuve : rôle, isolation, données,
  promotion, migrations.
- `fitness-functions.yaml` — les vérifications qui tiennent le départ en CI, chacune rattachée
  à son ADR.
- `ci/` — un chemin d'or CI en exemple : construit une fois, validé en DEV, promu en QA par
  empreinte, mis en production sur décision humaine.
