---
id: WP-02
name: "Contexte et contraintes de l'existant"
produced_by: "1"
controlled_at: "G0"
completion: partiel
reserves: ["Aucun produit « Ouazzani design » antérieur n'a été présenté à l'inspection : l'absence d'existant est DÉCLARÉE par l'humain à l'activité 1, elle n'est pas établie par recherche. Un existant hors dépôt — site en ligne, charte de marque, système tiers, dossier client — lèverait cette réserve ou la contredirait.", "Revue critic(engineering) non encore rendue."]
---

# WP-02 — Contexte et contraintes de l'existant · existing-system.md

> **Greenfield produit, brownfield de gouvernance.** Il n'y a aucun système applicatif à
> hériter. Il y a en revanche une plateforme d'exécution et une méthode déjà en place, qui
> contraignent ce run dès sa première écriture. Les ignorer parce que « c'est un greenfield »
> ferait passer pour un choix libre ce qui est déjà arrêté.

## Périmètre d'inspection déclaré

**Lu, intégralement, au commit `4a4d1f5` de `abenyahy-rgb/ouazzani-design` :**

| Objet | Ce qui en a été tiré |
|---|---|
| `CLAUDE.md` | gouvernance FactoryZen, frontière d'écriture, table des refus |
| `README.md` | repères de commandes, mode d'emploi web |
| `.gitmodules`, `.factoryzen` | sous-module épinglé sur `a7b185b` |
| `.claude/factoryzen.sh` | résolution du plugin, garde à sûreté inverse, tour, trace |
| `.claude/settings.json`, `.mcp.json` | hooks de session, serveur MCP de la tour |
| `.github/workflows/launchpad.yml` | projection tirée, OIDC, semis, instantané |
| `.gitignore` | trace non versionnée — distincte du Run Ledger |
| `product/governance/project.yaml` | identité recueillie au lancement |
| `runs/ledger.ndjson`, `runs/tower.json` | run `RUN-2026-09-21`, activité 1 ouverte, WP-01 déclaré partiel |
| `git log` (3 commits) | `0853e78` initial · `598c9a6`/`4a4d1f5` semis du launchpad |

**Lu dans le plugin, au commit épinglé `a7b185b` de `abenyahy-rgb/autonomous-product-factory` :**
`package.json` (v0.4.0), `core/method.yaml` par l'outillage — jamais en entier dans le
contexte d'un agent —, `core/templates.yaml`, `lib/*.mjs`, `build/build-adapter.mjs`,
`bin/apf` (sortie de `list`, `check`, `template`, `notion`, `tower`).

**NON inspecté, et donc hors de portée de toute contrainte énoncée ici :**

- Toute réalité « Ouazzani design » extérieure au dépôt : site en ligne, réseaux, charte
  de marque, documents commerciaux, base client, système de gestion existant. Rien de tel
  ne m'a été présenté ; je n'ai pas cherché à en établir l'existence.
- Le backlog historique, les décisions antérieures et les engagements pris hors dépôt.
- La configuration du projet côté launchpad (Vercel) et côté Supabase : je n'ai eu accès
  ni à l'un ni à l'autre. Seul le contrat visible depuis le dépôt est décrit.
- Les 25 commits d'historique du plugin au-delà du clone `--depth 1`.

## Architecture et dépendances existantes

**Il n'y a pas d'application.** `product/` ne contient que la gouvernance ; aucun code
produit, aucun schéma de données, aucun design. Ce qui existe est l'appareil d'exécution.

### Composants

| Composant | Rôle | Emplacement |
|---|---|---|
| Registre canonique | source unique de la méthode — activités, livrables, gates, contrôles | `.factoryzen/core/method.yaml` (sous-module épinglé) |
| CLI `apf` | contrôles, gabarits, tour, projections | `.factoryzen/bin/apf` |
| Tour de contrôle | serveur MCP — ouvre les activités, délivre le fragment et la frontière | `.claude/factoryzen.sh tower` → `.factoryzen/mcp/server.mjs` |
| Garde `PreToolUse` | refuse toute écriture hors chemin déclaré ou hors frontière ouverte | `.claude/factoryzen.sh guard` |
| Run Ledger | journal opposable — versionné | `runs/ledger.ndjson`, `runs/tower.json` |
| Trace de session | journal de bord — **non versionné, jamais une preuve** | `runs/trace.ndjson` (ignoré par Git) |
| Projection launchpad | instantané déposé à chaque push sur `main` | `.github/workflows/launchpad.yml` |

### Flux

1. Ouverture d'activité → tour → fragment + frontière d'écriture + critère de sortie.
2. Écriture → hook `PreToolUse` → garde → chemin déclaré au registre **et** dans la
   frontière de l'activité ouverte, sinon refus.
3. Déclaration de livrable → Run Ledger (`ledger.ndjson`) + `tower.json`.
4. Push sur `main` → workflow → jeton OIDC → kit → instantané → page du launchpad.

### Dépendances tierces, avec versions

| Dépendance | Version constatée | Où |
|---|---|---|
| Node.js | 22 (runner CI) · v22.22.2 (session) | `launchpad.yml`, `node -v` |
| `js-yaml` | ^4.3.2, **vendorisé et épinglé par empreinte** | `.factoryzen/package.json`, `.factoryzen/vendor/js-yaml/` |
| `actions/checkout` | v4 | `launchpad.yml` |
| `actions/setup-node` | v4 | `launchpad.yml` |
| Vercel — launchpad | `product-launchpad-lovat.vercel.app` | `launchpad.yml`, `project.yaml` |
| Supabase — edge function | `yxtanhjegsvuybbvcfpl.supabase.co/functions/v1/launchpad` | `launchpad.yml` |
| Plugin FactoryZen | v0.4.0 au commit `a7b185b` | `package.json`, `git ls-tree HEAD .factoryzen` |

Aucune dépendance applicative : il n'y a pas d'application. Le produit démarre sans dette
technique et sans marge de manœuvre technique — les deux sont à établir à l'activité 9.

<!-- Complétude : Deux sources indépendantes minimum par contrainte structurante. Inventaire relu par critic(engineering). -->
