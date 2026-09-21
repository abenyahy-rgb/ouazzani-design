---
id: WP-02
name: "Contexte et contraintes de l'existant"
produced_by: "1"
controlled_at: "G0"
completion: partiel
reserves: ["Révision 3, RÉDUITE sous EX1 : deux refus de critic(engineering) sur le même critère interdisent une troisième soumission à l'identique. Le périmètre est réduit de 18 contraintes à 11.", "L'absence d'existant hors dépôt est DÉCLARÉE par le sponsor, non établie par recherche (U-03).", "Quatre sources B de la révision 2 citaient des fichiers que ce périmètre déclarait non lus : elles sont retirées, non recitées.", "U-01 à U-07 ouverts."]
---

# WP-02 — Contexte et contraintes de l'existant · existing-system.md

> **Greenfield produit, brownfield de gouvernance.** Aucun système applicatif à hériter ; une
> plateforme d'exécution et une méthode déjà en place, qui contraignent ce run dès sa première
> écriture — et qui écrivent elles-mêmes dans ce dépôt.
>
> **Révision 3**, réduite sous EX1. La révision 2 avait corrigé le périmètre d'inspection sans
> corriger le tableau qui s'en écartait : quatre contraintes s'adossaient à des fichiers que
> cette même page déclarait non lus. Corriger la déclaration sans corriger ce qu'elle démentait
> déplaçait le défaut au lieu de le supprimer.

## Périmètre d'inspection déclaré

Deux horloges, et les confondre était un défaut de la révision 1 : les fichiers versionnés se
lisent à un commit, les journaux de run à un horodatage.

**A · Fichiers du dépôt, lus au commit `4a4d1f5` (état à l'ouverture) :**
`CLAUDE.md` · `README.md` · `.gitmodules` · `.gitignore` · `.mcp.json` ·
`.claude/factoryzen.sh` · `.claude/settings.json` · `.claude/commands/factory-status.md` ·
`.github/workflows/launchpad.yml` · `product/governance/project.yaml`.
Non lus, bien que présents : les huit autres `.claude/commands/*.md`, les `.claude/agents/*`,
les `.claude/skills/*` autres que `bootstrap-product`.

**B · Journaux de run, lus à leur état du 2026-09-21 en cours de session** — postérieurs au
commit A : `runs/ledger.ndjson`, `runs/tower.json`. État à l'heure de rédaction : WP-01
`complet` sur ses trois chemins ; WP-02 `partiel` sur ses deux ; WP-03, WP-04, WP-05 `partiel`
avec BLOCKED motivé ; G0 constatée `ready:false · missing:18`.

**C · Plugin, au commit épinglé `a7b185b`.** Lus intégralement : `lib/guard.mjs`,
`build/build-adapter.mjs`, `launchpad/kit/run.mjs`, `package.json`,
`launchpad/templates/product-repo/` (inventaire). Lus **par extraits ciblés** :
`core/method.yaml` (`runtime_dependencies`, `control_tower`, `gates`, `work_products`,
`exceptions`, `categories` — jamais en entier), `core/templates.yaml`, `lib/notion.mjs`,
`lib/vendor.mjs`, `lib/registry.mjs`, `lib/tower.mjs` (`factory_clear_gate` seul), `bin/apf`.
**Non lus :** `mcp/server.mjs`, `lib/checks.mjs`, `lib/living.mjs`, `lib/provenance.mjs`,
`lib/research.mjs`, `lib/drift.mjs`, `lib/project.mjs`, `lib/trace.mjs`, `tests/`,
`launchpad/supabase/`.

**Cette liste est opposable au tableau des contraintes.** Toute contrainte dont une source
tombe dans « Non lus » est descendue en « À confirmer » — c'est ce qui a coûté quatre lignes à
la révision 2.

**D · État de branche et de projection, au 2026-09-21.** Le run travaille sur
`claude/magical-ramanujan-exqk8s`, fusionnée en fast-forward dans `main` à chaque étape ; les
deux références sont donc alignées, et `main` n'a pas d'historique propre. La projection est
active : l'exécution du workflow sur `803bf12` a conclu `success`. *(Le compte de commits n'est
pas noté : il change à chaque écriture, y compris celle-ci — un nombre qui se périme entre sa
mesure et sa lecture n'est pas une observation.)*

**NON inspecté, et hors de portée de toute contrainte énoncée ici :**

- Toute réalité « Ouazzani design » extérieure au dépôt : site, réseaux, charte de marque,
  documents commerciaux, base client, système de gestion. Rien ne m'a été présenté ; je n'ai
  pas cherché à en établir l'existence (U-03).
- Le backlog historique, les décisions antérieures, les engagements pris hors dépôt.
- Les consoles Vercel et Supabase : aucun accès. Seul le contrat visible depuis le dépôt est
  décrit.
- L'historique du plugin au-delà du clone `--depth 1` — **profondeur inconnue**.

## Architecture et dépendances existantes

**Il n'y a pas d'application.** `product/` ne porte que la gouvernance. Ce qui existe est
l'appareil d'exécution — et il a des droits d'écriture ici.

### Composants

| Composant | Rôle réel | Emplacement |
|---|---|---|
| Registre canonique | source unique de la méthode | `.factoryzen/core/method.yaml` (gitlink figé sur `a7b185b`) |
| CLI `apf` | huit contrôles, gabarits, tour, projections, vendoring | `.factoryzen/bin/apf` |
| Tour de contrôle | ouvre les activités, délivre fragment, frontière et critère de sortie ; constate les gates sans les franchir | `.claude/factoryzen.sh tower` → `.factoryzen/mcp/server.mjs` |
| Garde `PreToolUse` | **ne juge que `product/`** (`guard.mjs:45-46`) ; trois verdicts : `deny`, **`ask`** (chemin déclaré, aucune activité ouverte — l'humain tranche, `:57-63`), `allow` — dont **toute** écriture hors `product/` | `.claude/factoryzen.sh guard` → `.factoryzen/lib/guard.mjs` |
| **Semis de la CI — projections** | supprime et regénère `.claude/commands`, `agents`, `skills` ; réécrit `factoryzen.sh`, `.gitmodules`, `.mcp.json` ; fusionne `settings.json` ; **complète** `.gitignore`. Commit et push conditionnés à un arbre sale | `launchpad/kit/run.mjs:124-173` ← `launchpad.yml:37-48` |
| **Semis de la CI — épinglage** | **déplace le gitlink `.factoryzen`**, donc la version du registre qui gouverne le dépôt. Observé le 2026-09-21 : `a7b185b` → `359d6ce`. Détecté par K6, non par la garde | `launchpad/kit/run.mjs` ← `launchpad.yml:37-48` |
| **Semis de la CI — Run Ledger** | **ouvre l'activité 1 au nom de `factory-lead`, déclare WP-01 `partiel`, écrit `runs/tower.json` et `runs/ledger.ndjson`.** Une seule fois : un journal existant n'est jamais réécrit | `launchpad/kit/run.mjs:72-88` |
| Run Ledger | journal opposable — versionné, seul objet de K8 | `runs/ledger.ndjson`, `runs/tower.json` |
| Trace de session | journal de bord — non versionné (`.gitignore:10-13`), poussé au launchpad dès le poste appairé | `runs/trace.ndjson` |
| Projection launchpad | instantané déposé par la CI ; TIRÉE, jamais poussée | `.github/workflows/launchpad.yml` |

### Flux

1. Ouverture d'activité → tour → fragment + frontière d'écriture + critère de sortie.
2. Écriture **sous `product/`** → hook `PreToolUse` → garde → `deny` / `ask` / `allow`.
   Écriture **ailleurs** → `allow` sans examen.
3. Déclaration de livrable → Run Ledger.
4. Push sur `main` → workflow → jeton OIDC (`:28-31`) → kit (`:32-36`) → **semis** (`:37-48`),
   qui regénère les projections **et, à la première exécution seulement, ouvre l'activité 1 et
   écrit le Run Ledger** → instantané (`:50`) → page du launchpad.

**Conséquence d'ingénierie.** Les deux premières lignes de `runs/ledger.ndjson` n'ont été
écrites par aucun agent de session : elles sont l'œuvre de la CI. Et le périmètre d'écriture de
la CI — `.claude/`, `.gitmodules`, `.mcp.json`, `.gitignore`, `runs/` — est précisément celui
que la garde ne juge pas.

### Dépendances tierces, avec versions

| Dépendance | Version constatée | Source de la version |
|---|---|---|
| Node.js | 22 (runner CI) · v22.22.2 (session) | `launchpad.yml:26` · `node -v` |
| `js-yaml` | **4.3.2 exacte**, vendorée, épinglée par sha256, point d'entrée unique `lib/yaml.mjs` | `core/method.yaml:2922-2939` — **pas** `package.json:19-21`, qui ne porte qu'un `^4.3.2` de devDependency |
| `actions/checkout` | v4 | `launchpad.yml:23` |
| `actions/setup-node` | v4 | `launchpad.yml:24` |
| Vercel — launchpad | `product-launchpad-lovat.vercel.app` | `launchpad.yml:17` |
| Supabase — edge function | `yxtanhjegsvuybbvcfpl.supabase.co/functions/v1/launchpad` | `launchpad.yml:18` |
| Plugin FactoryZen | commit `359d6ced18844b3c75ee9699bad30ec3c4c8c27f` **depuis le 2026-09-21** — précédemment `a7b185b`, déplacé par le semis de la CI (commit `09cbb66`), non par une décision humaine | gitlink de l'arbre · écart détecté par K6 |

Aucune dépendance applicative : il n'y a pas d'application. Le produit démarre sans dette
technique et sans marge de manœuvre technique — les deux restent à établir à l'activité 9.

<!-- Complétude : Deux sources indépendantes minimum par contrainte structurante. Inventaire relu par critic(engineering). -->
