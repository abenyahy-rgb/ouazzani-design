# Autonomous Product Factory

Méthode de delivery produit pilotée par agents — autonome à l'intérieur de chaque
activité, déterministe à ses frontières.

**4 cadences · 13 étapes · 27 activités · 40 livrables · 5 gates humains + 1 checkpoint
automatisé · 10 rôles · 11 skills du noyau + 2 externes livrés · 8 contrôles déterministes ·
1 tour de contrôle MCP à 10 opérations.**

> **Statut : référentiel CIBLE.** La spécification est complète. Sur les huit contrôles
> déterministes, quatre s'exécutent aujourd'hui sur le registre seul ; les quatre autres
> ont leur algorithme écrit et attendent une arborescence `product/` instanciée. Aucun
> n'est encore actif sur un projet réel. C'est le livrable unique de l'Horizon 0, et la
> liste est close : elle n'est pas extensible sans Method Change Request.

## Le principe d'architecture

```
core/method.yaml          ← LA SOURCE. Une seule.
      │
      ├─ apf show activity 20    fragment servi à un agent   1,6 % du registre
      ├─ apf template WP-24      squelette d'un livrable — sections du registre + guide et exemple
      │                          (core/templates.yaml, subordonné : un titre qui diverge est refusé)
      ├─ apf check               les huit contrôles K1 à K8
      ├─ build/                  FactoryZen navigable, référentiel exécutif
      │                          dist/Gabarits.html — les 39 gabarits lisibles, guide et exemple par section
      └─ agents/ skills/         contrats et outillage projetés
             commands/ hooks/
```

## Arborescence du plugin

Elle est **déclarée au registre** (`plugin_layout`) et vérifiée par K6 : un dossier que
le harness découvre sans que le registre le connaisse est une capacité hors gouvernance,
un dossier déclaré et absent est une promesse non tenue.

```
.claude-plugin/plugin.json   manifeste — skills, hooks, mcpServers
core/method.yaml             LA SOURCE
core/templates.yaml          gabarits de rédaction — guide et exemple par section, subordonnés au registre
lib/                         registre · contrôles · tour · garde · vendoring · artefacts vivants
                             · plan de l'espace de travail lisible
bin/apf                      CLI — la même logique que les hooks, la CI et MCP appellent
build/harness-tools.mjs      capacité de connecteur → outils réels, sans effet de bord
mcp/server.mjs               tour de contrôle, MCP stdio, ne porte aucune règle
agents/          généré      14 fichiers — 10 rôles, critic instancié 5 fois
skills/<id>/     généré      SKILL.md sous 2 000 tokens
  └ references/  généré      activités et livrables — chargés à la demande, jamais d'office
commands/        généré      /factory-status /factory-open /factory-gate …
hooks/hooks.json généré      PreToolUse → « apf guard », rien d'autre
templates/       à la main   gabarits que le PROJET instancie, jamais le plugin
vendor/          épinglé     skills externes, copies verbatim rehachées à chaque contrôle
```

Deux emplacements méritent leur justification. **`templates/domain-critic.md` n'est pas
dans `agents/`** : un critic de domaine non instancié n'a aucune source et citerait la
mémoire du modèle au lieu de règles datées. Le plugin livre le gabarit, l'activité 3
produit l'instance dans le dépôt du projet. **`skills/<id>/references/` existe** parce
qu'un `SKILL.md` est chargé dès que le skill est retenu : au-delà du plafond il facture
son détail à toute activité qui le touche. Cinq skills dépassaient les 2 000 tokens, dont
le dernier ajouté à 2 848 ; après partage, le plus lourd est à 932.

## Les quatre mécanismes d'application, disjoints

| | Ce qu'il peut | Portabilité |
|---|---|---|
| **Hook** `PreToolUse → apf guard` | **seul** à arrêter une écriture AVANT qu'elle ait lieu | Claude Code |
| **Tour de contrôle** MCP | refuser les opérations qu'elle expose, journaliser, rendre le contournement prouvable | tout harness MCP |
| **Pre-commit** | l'état du dépôt avant commit | totale |
| **CI** | l'état du dépôt — la preuve opposable | totale |

L'espace de travail lisible n'apparaît pas dans ce tableau, et c'est
délibéré : c'est une **projection**, pas un mécanisme d'application. Le noyau en
CALCULE le plan (`apf notion plan`, déterministe et hors ligne, donc vérifié par K6) ;
l'adaptateur l'EXÉCUTE, lui seul détenant l'accès. Aucun jeton et aucun appel réseau
dans le plugin ni dans la CI. Une indisponibilité de l'espace ne bloque jamais un gate :
`apf notion status` rapporte, il ne refuse pas.

L'agent n'écrit **qu'une fois**, dans Git. À chaque activité, `apf notion where <WP>`
rend la destination et surtout l'**action** : `update`, parce que la ligne a été créée au
bootstrap avec son gabarit. En créer une seconde donnerait deux pages pour un livrable,
donc deux vérités. Le corps vient de `apf notion page <WP>` — miroir complet du fichier
Git — et n'est jamais rédigé.

L'arborescence y suit la méthode — un dossier par cadence, une page par étape — et reste
à **17 nœuds de navigation** quel que soit le nombre de releases et de sprints : l'étape
est une constante de la méthode, la release est une variable du projet, et une variable
dans une arborescence rend un espace illisible en six mois. L'instance est donc un
groupement à l'intérieur de la page d'étape.

Aucune logique de contrôle ne vit dans un hook, un handler MCP ou un script de CI : les
quatre appellent la même commande. Une règle écrite dans l'un des quatre serait une
source de vérité de plus.

Le registre est **écrit** comme un fichier unique — une revue, une PR, une cohérence
vérifiable d'un coup d'œil. Il n'est jamais **servi** tel quel : un agent reçoit le
fragment compilé de son activité, jamais le registre ni le référentiel. Distinguer
l'unité d'écriture de l'unité de service est ce qui permet de garder un registre unique
sans en payer le coût de contexte à chaque invocation.

Tout le reste — FactoryZen, le document exécutif, les gabarits d'espace de travail — est
une **projection générée**. Un artefact maintenu à la main à côté du registre diverge en
quelques semaines : c'est la faute que le principe P4 interdit et qu'une compilation rend
structurellement impossible.

## Le launchpad — projection tirée

`launchpad/` est une application web (Next.js, Supabase, Vercel) qui remplace l'espace
Notion par une **projection tirée** : un webhook GitHub la réveille à chaque commit, elle
recalcule l'état du projet avec les règles de `lib/` — `stepProgress`, `runAll` — et
l'affiche. L'agent n'écrit qu'une fois, dans Git ; il n'y a ni page à relier ni
projection à dater. Un projet le déclare par `workspace_kind: launchpad` dans SOC-01, et
la tour n'exige plus de synchronisation avant d'ouvrir une activité. Elle crée aussi les
produits : dépôt GitHub, plugin activé, identité semée. Voir `launchpad/README.md`.

## Utilisation

```bash
npm install

node bin/apf stats                # état du registre et coût de contexte
node bin/apf check                # les huit contrôles déterministes
node bin/apf list activities      # les 24 activités
node bin/apf show activity 20     # le fragment servi à un agent
node bin/apf show gate K1         # la charte d'une frontière
node bin/apf show wp WP-26        # un livrable, son plan de contenu, son critère
```

Depuis un dépôt produit, `apf check` détecte l'arborescence `product/` et exécute
également les contrôles de portée projet.

## Les huit contrôles

| | | Portée | État |
|---|---|---|---|
| **K1** | Couverture du squelette — chaque étape porte exactement un `INTRODUCES` | projet | algorithme écrit |
| **K2** | Intégrité du registre — tout chemin cité existe, tout chemin est produit une fois | méthode | **actif** |
| **K3** | Chaîne de traçabilité — aucune entité orpheline, tout AC matériel prouvé | projet | algorithme écrit |
| **K4** | Intégrité du socle — aucun `CORE INVARIANT` modifié hors cadence C1 | projet | algorithme écrit |
| **K5** | Builder ≠ Judge — l'Accountable n'est jamais le Responsible | méthode | **actif** |
| **K6** | Restriction d'outillage — évaluateurs en lecture seule, cinq blocs présents | méthode | **actif** |
| **K7** | Complétude du pack de preuves — chaque élément de charte présent | mixte | **actif** (structure) |
| **K8** | Run Ledger — ouvert, cadence et chemin déclarés, tours comptés | projet | algorithme écrit |

Un contrôle `SKIPPED` ne vaut jamais `PASS`. Un contrôle qui passerait faute de données
serait un mensonge, et la suite de conformité le vérifie explicitement.

## Portabilité

Le noyau — registre, contrôles, contrats de rôle — ne nomme aucun modèle, aucun
fournisseur, aucun harness. Le routing s'exprime en **classes de capacité** ; la
correspondance vers des modèles réels vit dans l'adaptateur et se révise sans toucher au
référentiel.

**La correction ne dépend jamais d'une capacité de harness.** Le plancher garanti est Git
et l'intégration continue. Les hooks d'un harness sont un accélérateur : ils font passer
K6 de la détection à la prévention là où ils existent, mais ne portent aucune règle qui
n'existe pas aussi en CI. Aucune logique de contrôle ne vit dans un hook, un script de CI
ou un handler MCP — les trois appellent la même commande de la CLI.

## Feuille de route

| Horizon | Objectif | État |
|---|---|---|
| **0** | Registre, CLI, huit contrôles, un adaptateur | en cours |
| **1** | Bootstrap sur un produit réel, franchir G0, instrumenter le coût | à venir |
| **2** | Première release complète, K1 en fonctionnement, premières lignes de base | à venir |
| **3** | Seconde release, second adaptateur si la suite de conformité le justifie | à venir |

Le test décisif du premier Run n'est pas « la méthode est-elle packagée » mais :
**combien de fois un agent a-t-il été bloqué par un contrôle plutôt que par un humain ?**
Si la réponse est zéro, ce dépôt n'est qu'une distribution de documentation.
