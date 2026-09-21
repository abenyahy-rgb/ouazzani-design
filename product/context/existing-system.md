---
id: WP-02
name: "Contexte et contraintes de l'existant"
produced_by: "1"
controlled_at: "G0"
completion: partiel
reserves: ["L'absence d'existant hors dépôt est DÉCLARÉE par le sponsor à l'activité 1, non établie par recherche (U-03).", "Révision 2 après verdict REFUSÉ de critic(engineering) : 20 findings traités. Une contre-revue n'a pas encore été rendue sur cette révision.", "U-01 à U-07 ouverts.", "Cinq énoncés restent à une seule source et sont descendus en « À confirmer » plutôt que dotés d'un second nom pour la même source."]
---

# WP-02 — Contexte et contraintes de l'existant · existing-system.md

> **Greenfield produit, brownfield de gouvernance.** Aucun système applicatif à hériter ;
> en revanche une plateforme d'exécution et une méthode déjà en place, qui contraignent ce
> run dès sa première écriture.
>
> **Révision 2**, après verdict REFUSÉ de `critic(engineering)`. La révision 1 décrivait la
> garde plus large qu'elle n'est, adossait l'épinglage de `js-yaml` au mauvais fichier, et
> omettait la boucle de semis — le fait d'ingénierie le plus structurant du dépôt.

## Périmètre d'inspection déclaré

Le périmètre se lit à **deux horloges**, et les confondre était un défaut de la révision 1 :
les fichiers versionnés sont lus à un commit, les journaux de run à un horodatage.

**A · Fichiers du dépôt, lus au commit `4a4d1f5` (état du dépôt à l'ouverture) :**
`CLAUDE.md` · `README.md` · `.gitmodules` · `.gitignore` · `.mcp.json` ·
`.claude/factoryzen.sh` · `.claude/settings.json` · `.claude/commands/factory-status.md` ·
`.github/workflows/launchpad.yml` · `product/governance/project.yaml`.
Non lus, bien que présents : les huit autres `.claude/commands/*.md`, les `.claude/agents/*`,
les `.claude/skills/*` autres que `bootstrap-product`.

**B · Journaux de run, lus à leur état du 2026-09-21 en cours de session** — postérieurs au
commit A, donc hors de sa portée : `runs/ledger.ndjson`, `runs/tower.json`.
**État à l'heure de rédaction :** WP-01 déclaré **complet** sur ses trois chemins (15:20:22),
WP-02 déclaré **partiel** sur ses deux chemins (15:35), G0 demandée et constatée
`ready:false · missing:18`. *(La révision 1 rapportait « WP-01 partiel » — vrai à 15:09,
faux à l'écriture : un état de journal non daté se périme entre sa lecture et sa phrase.)*

**C · Plugin, au commit épinglé `a7b185b`.** Lus intégralement : `lib/guard.mjs`,
`build/build-adapter.mjs`, `launchpad/kit/run.mjs` (fonction de semis), `package.json`,
`launchpad/templates/product-repo/` (inventaire). Lus **par extraits ciblés** :
`core/method.yaml` (`runtime_dependencies`, `control_tower`, `gates`, `work_products`,
`categories` — jamais en entier, C-08), `core/templates.yaml`, `lib/notion.mjs`,
`lib/vendor.mjs`, `lib/trace.mjs`, `lib/registry.mjs`, `bin/apf`. **Non lus :**
`mcp/server.mjs`, `lib/checks.mjs`, `lib/living.mjs`, `lib/provenance.mjs`,
`lib/research.mjs`, `lib/drift.mjs`, `lib/project.mjs`, `lib/tower.mjs`, `tests/`,
`launchpad/supabase/`. *(La révision 1 déclarait `lib/*.mjs` lu : c'était faux, et
l'omission de la portée `product/` de la garde en était la preuve.)*

**D · État de branche.** Le run travaille sur `claude/magical-ramanujan-exqk8s`, deux commits
au-delà de `4a4d1f5` (`3c2f475`, `5df1b38`). Par C-13, **le launchpad n'a donc jamais projeté
ce run** : l'espace de travail lisible est muet tant que la branche n'est pas fusionnée dans
`main`.

**NON inspecté, et donc hors de portée de toute contrainte énoncée ici :**

- Toute réalité « Ouazzani design » extérieure au dépôt : site en ligne, réseaux, charte de
  marque, documents commerciaux, base client, système de gestion. Rien de tel ne m'a été
  présenté ; je n'ai pas cherché à en établir l'existence (U-03).
- Le backlog historique, les décisions antérieures, les engagements pris hors dépôt.
- La configuration côté launchpad (Vercel) et côté Supabase : aucun accès. Seul le contrat
  visible depuis le dépôt est décrit.
- L'historique du plugin au-delà du clone `--depth 1` — **profondeur inconnue**. *(La
  révision 1 avançait « 25 commits » : un nombre qu'un clone superficiel ne permet pas
  d'observer, placé dans la liste de ce qui n'a pas été regardé.)*

## Architecture et dépendances existantes

**Il n'y a pas d'application.** `product/` ne contient que la gouvernance : aucun code
produit, aucun schéma de données, aucun design. Ce qui existe est l'appareil d'exécution —
et il écrit dans ce dépôt.

### Composants

| Composant | Rôle réel | Emplacement |
|---|---|---|
| Registre canonique | source unique de la méthode — activités, livrables, gates, contrôles | `.factoryzen/core/method.yaml` (gitlink figé sur `a7b185b`) |
| CLI `apf` | huit contrôles, gabarits, tour, projections, vendoring | `.factoryzen/bin/apf` |
| Tour de contrôle | serveur MCP — ouvre les activités, délivre fragment, frontière et critère de sortie ; constate les gates sans les franchir | `.claude/factoryzen.sh tower` → `.factoryzen/mcp/server.mjs` |
| Garde `PreToolUse` | **ne juge que `product/`** ; trois verdicts : `deny` (chemin non déclaré, ou hors frontière ouverte), **`ask`** (chemin déclaré, aucune activité ouverte — l'humain tranche), `allow` (tout le reste, y compris toute écriture hors `product/`) | `.claude/factoryzen.sh guard` → `.factoryzen/lib/guard.mjs` |
| **Semis de la CI** | **supprime et regénère `.claude/commands/`, `.claude/agents/`, `.claude/skills/`, réécrit `factoryzen.sh`, `.gitmodules`, `.mcp.json`, fusionne `settings.json`, complète `.gitignore` — puis commite et pousse sur `main`** | `.factoryzen/launchpad/kit/run.mjs:124-173`, appelé par `launchpad.yml:32-48` |
| Run Ledger | journal opposable — versionné, seul objet de K8 | `runs/ledger.ndjson`, `runs/tower.json` |
| Trace de session | journal de bord — non versionné, hors des huit contrôles, **poussé au launchpad dès le poste appairé** | `runs/trace.ndjson` (ignoré par Git), `lib/trace.mjs` |
| Projection launchpad | instantané déposé par la CI ; projection TIRÉE, jamais poussée | `.github/workflows/launchpad.yml` |

### Flux

1. Ouverture d'activité → tour → fragment + frontière d'écriture + critère de sortie.
2. Écriture **sous `product/`** → hook `PreToolUse` → garde → `deny` / `ask` / `allow`.
   Écriture **ailleurs** → `allow` sans examen.
3. Déclaration de livrable → Run Ledger (`ledger.ndjson`) + `tower.json`.
4. Push sur `main` → workflow → jeton OIDC → kit → **semis** (qui peut commiter et pousser,
   puis se re-déclencher) → instantané → page du launchpad.

**Conséquence d'ingénierie, non triviale :** la CI est un écrivain sur `main` avec
`contents: write`, et son périmètre d'écriture — `.claude/`, `.gitmodules`, `.mcp.json`,
`.gitignore` — est précisément celui que la garde ne juge pas. Toute édition locale de ces
chemins est annulée sans avertissement à la prochaine exécution.

### Dépendances tierces, avec versions

| Dépendance | Version constatée | Source de la version |
|---|---|---|
| Node.js | 22 (runner CI) · v22.22.2 (session) | `launchpad.yml:24-26` · `node -v` |
| `js-yaml` | **4.3.2 exacte**, vendorée, épinglée par sha256 (`LICENSE`, `js-yaml.mjs`), point d'entrée unique `lib/yaml.mjs` | `core/method.yaml:2922-2939` (`runtime_dependencies`) — **pas** `package.json`, qui n'en déclare qu'un `^4.3.2` de devDependency |
| `actions/checkout` | v4 | `launchpad.yml:22` |
| `actions/setup-node` | v4 | `launchpad.yml:23` |
| Vercel — launchpad | `product-launchpad-lovat.vercel.app` | `launchpad.yml:17` |
| Supabase — edge function | `yxtanhjegsvuybbvcfpl.supabase.co/functions/v1/launchpad` | `launchpad.yml:18` |
| Plugin FactoryZen | v0.4.0 au commit `a7b185b74f2053672f72285c53a09003206752e2` | `.factoryzen/package.json:3` · gitlink de l'arbre |

Aucune dépendance applicative : il n'y a pas d'application. Le produit démarre sans dette
technique et sans marge de manœuvre technique — les deux restent à établir à l'activité 9.

<!-- Complétude : Deux sources indépendantes minimum par contrainte structurante. Inventaire relu par critic(engineering). -->
