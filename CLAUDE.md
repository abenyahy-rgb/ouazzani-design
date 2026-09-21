# Ouazzani design

Ce dépôt est **gouverné par FactoryZen** — l'Autonomous Product Factory. La méthode n'est
pas documentée ici : elle est portée par le plugin, dont le registre canonique est la
seule source. Ce fichier ne dit que ce qui est propre à ce produit.

## Où est le plugin

Sous-module `.factoryzen`, **épinglé** sur le commit que le launchpad déploie. Le hook de
session `.claude/factoryzen.sh ensure` le clone ; sur Claude Code web, où un sous-module
privé ne se clone pas, il se rabat sur un dépôt frère `../Autonomous-Product-Factory`
attaché à l'environnement. Sans plugin, la garde **refuse** toute écriture : un défaut
d'installation ne devient jamais un contournement silencieux.

`apf` se lit `node .factoryzen/bin/apf`. Les commandes `/factory-*`, les rôles et les skills
sous `.claude/` sont des projections du plugin épinglé, regénérées par le workflow à chaque
push : ne pas y éditer.

## Avant toute production

Ouvrir l'activité par la tour de contrôle. Elle est la **seule** source du fragment, de
la frontière d'écriture et du critère de sortie :

```bash
node .factoryzen/bin/apf tower factory_open_activity '{"activity":"<n>","actor":"<rôle>"}'
```

Ne jamais lire `core/method.yaml` du plugin pour s'en passer : un agent reçoit son
fragment — moins de 2 % du registre — jamais le registre entier.

## Ce qui est refusé, et pourquoi

| Refus | Motif |
|---|---|
| écrire à un chemin non déclaré au registre | invisible à la gouvernance, échec de K2 |
| écrire hors de la frontière de l'activité ouverte | le livrable perdrait son Accountable (K5) |
| franchir une gate | l'autorité est humaine et nommée, jamais un agent |
| modifier un CORE INVARIANT hors cadence C1 | K4 — émettre un finding et router vers G0 (EX3) |
| deviner un input manquant | `BLOCKED — input manquant`, jamais une inférence (P5, EX2) |

Le hook `PreToolUse` applique les deux premiers **avant** l'écriture. `apf check`
exécute les huit contrôles ; un `SKIPPED` ne vaut jamais un `PASS`.

## Espace de travail lisible

Le launchpad — https://product-launchpad-lovat.vercel.app/projects/ouazzani-design — est une **projection tirée** : le workflow
`.github/workflows/launchpad.yml` lui dépose l'état de ce dépôt à chaque push sur
`main`, authentifié par le jeton OIDC de GitHub Actions. Aucun secret, rien
à relier ni à dater : la page est le commit. `workspace_kind: launchpad` dans
`product/governance/project.yaml` le déclare à la tour.

## Ce que la plateforme voit de cette session

Les hooks de `.claude/settings.json` écrivent un journal de bord dans `runs/trace.ndjson` :
outils appelés, fichiers touchés, verdicts de la garde, sous-agents, modèle réellement
servi. Il n'est **pas versionné** et n'entre dans **aucun contrôle** — la trace dit ce qui
s'est passé, le Run Ledger dit ce qui est prouvé, et confondre les deux ferait d'un fichier
effaçable une pièce opposable.

```bash
node .factoryzen/bin/apf trace tail      # ce qui vient de se passer, ici
node .factoryzen/bin/apf trace status    # ce poste est-il relié au launchpad
node .factoryzen/bin/apf connect         # l'y relier : un code, approuvé dans le launchpad
```

Sans poste appairé, la trace reste locale et tout fonctionne à l'identique : elle **échoue
en ouvrant**. Une fois le poste appairé, https://product-launchpad-lovat.vercel.app/projects/ouazzani-design/agents montre le déroulé
en direct. Le jeton du poste vit dans `~/.factoryzen/`, jamais dans ce dépôt, et n'ouvre que
l'écriture de trace.

## Identité

Recueillie au lancement, enregistrée dans `product/governance/project.yaml`. Le bootstrap
(activité 1) la conserve telle quelle et ne la réécrit pas.
