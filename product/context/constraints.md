---
id: WP-02
name: "Contexte et contraintes de l'existant"
produced_by: "1"
controlled_at: "G0"
completion: partiel
reserves: ["L'absence d'existant hors dépôt est DÉCLARÉE par le sponsor à l'activité 1, non établie par recherche (U-03).", "Révision 2 après verdict REFUSÉ de critic(engineering) : 20 findings traités. Une contre-revue n'a pas encore été rendue sur cette révision.", "U-01 à U-07 ouverts.", "Cinq énoncés restent à une seule source et sont descendus en « À confirmer » plutôt que dotés d'un second nom pour la même source."]
---

# WP-02 — Contexte et contraintes de l'existant · constraints.md

> **Révision 2.** La révision 1 a été REFUSÉE par `critic(engineering)` : six contraintes sur
> seize citaient deux fichiers issus d'un **même gabarit** — `.factoryzen/launchpad/templates/product-repo/`,
> régénéré par `kit/run.mjs` à chaque exécution du workflow — soit une source sous deux noms,
> exactement la défaillance que le critère « deux sources indépendantes » existe pour empêcher.
> Trois erreurs de fait s'y ajoutaient. Ce que le gabarit produit ne peut pas se témoigner
> lui-même : les sources B sont désormais prises dans le **code exécuté**, le **registre**, le
> **journal de run** ou une **observation datée**.

## Contraintes structurantes

Chacune est adossée à **deux sources d'auteurs et de fonctions distincts**. Une contrainte
qui n'en a qu'une est descendue en *À confirmer*, plus bas — elle n'est pas promue par un
second nom.

| # | Contrainte | Source A — code exécuté ou artefact opposable | Source B — registre, journal ou observation |
|---|---|---|---|
| C-01 | **Sous `product/`, aucune écriture à un chemin non déclaré au registre.** Verdict `deny` rendu avant l'écriture ; K2 la refuserait de toute façon. | `.factoryzen/lib/guard.mjs:47-54` — `DECL()` construit l'ensemble depuis `work_products.base + files`, puis `deny` si aucun motif ne matche | `core/method.yaml` → contrôle K2, exécuté par `apf check` : « 124 chemins atomiques déclarés, chacun revendiqué une seule fois » |
| C-02 | **Sous `product/`, aucune écriture hors de la frontière de l'activité ouverte.** | `.factoryzen/lib/guard.mjs:65-72` — `writeBoundary(open.activity)`, sinon `deny` | `factory_open_activity` rend `write_boundary` — 5 chemins à l'activité 1, conformes à WP-01 (3 fichiers) + WP-02 (2 fichiers) |
| C-03 | **La garde ne juge QUE `product/`.** `.claude/`, `.github/`, `runs/`, `CLAUDE.md` et la racine sont écrits **sans examen**. Ce n'est pas un trou accidentel : c'est une portée assumée — « un plugin qui arbitre chaque écriture du projet se fait désinstaller ». | `.factoryzen/lib/guard.mjs:45-46` — `if (!rel.startsWith('product/')) return { decision: 'allow', … }` | `.claude/settings.json` — le hook `PreToolUse` matche `Write\|Edit\|NotebookEdit` sur **tout** le dépôt : c'est la garde, pas le hook, qui restreint |
| C-04 | **Mode dégradé réel : `ask`, pas `deny`.** Chemin déclaré mais aucune activité ouverte ⇒ la question remonte à l'humain. Refuser bloquerait un travail légitime hors run ; autoriser en silence rendrait la tour facultative. | `.factoryzen/lib/guard.mjs:57-63` — troisième verdict, commenté comme délibéré | `core/method.yaml:2862` — `enforcement_model` : « Elle ne prévient pas, elle rend le contournement PROUVABLE et COÛTEUX » ; K8 voit le trou après coup |
| C-05 | **Plugin introuvable ⇒ refus d'écrire.** Garde à sûreté inverse : un défaut d'installation ne devient pas un contournement silencieux. | `.claude/factoryzen.sh` — branche `guard`, JSON `permissionDecision: "deny"` puis `exit 2` (un hook `PreToolUse` ne refuse qu'en sortant en 2) | `core/method.yaml:2924` — `defect_it_closes` consigne le défaut réel : « la garde en boucle sortait en 1 au lieu de 2 — donc n'arrêtait plus aucune écriture : elle échouait en OUVRANT » |
| C-06 | **La CI est un écrivain sur `main`, et elle regénère `.claude/`.** À chaque exécution, le semis **supprime** `.claude/commands/`, `.claude/agents/`, `.claude/skills/`, réécrit `factoryzen.sh`, `.gitmodules`, `.mcp.json`, fusionne `settings.json` — puis commite et pousse. Toute édition locale de ces chemins est silencieusement annulée, et la garde n'y peut rien (C-03). | `.factoryzen/launchpad/kit/run.mjs:124-173` — `rmSync(...)` sur les trois dossiers, `put()` depuis `templates/product-repo/` | `.github/workflows/launchpad.yml:37-48` — `contents: write`, `git commit`, `git push` sous l'identité `launchpad` |
| C-07 | **La méthode est épinglée, pas suivie au fil de l'eau.** Le gitlink fige `.factoryzen` sur `a7b185b` ; `.claude/` n'en est qu'une projection. | Gitlink de l'arbre : `git ls-tree HEAD .factoryzen` → `160000 commit a7b185b74f20…` (`.gitmodules` ne porte que `path` et `url` : il n'épingle rien) | `.factoryzen/launchpad/kit/run.mjs:124-140` — les projections sont régénérées depuis le plugin, donc non éditables (C-06) |
| C-08 | **Un agent ne reçoit que son fragment, jamais le registre entier.** | `core/method.yaml:2850` — « Seule source du fragment d'activité, de la frontière d'écriture et du critère de sortie » ; `:2869` — « Unique source du fragment » | `.factoryzen/mcp/server.mjs` + `lib/tower.mjs` — `factory_open_activity` compile et rend le fragment ; aucun chemin ne rend `method.yaml` |
| C-09 | **Aucune gate n'est franchie par un agent.** L'autorité est humaine et nommée. | `core/method.yaml` → `gates[].authority`, dont `:1805` « NON DÉLÉGABLE » | `lib/tower.mjs` → `factory_clear_gate` exige `human` et `decision` ; `factory_request_gate` rend « La tour constate. Elle ne franchit pas » |
| C-10 | **Un CORE INVARIANT ne se modifie qu'en cadence C1.** Hors C1 : finding et routage vers G0 (EX3). | `core/method.yaml` → WP-11 et WP-14 `lifecycle: CORE INVARIANT` ; WP-12 noyau figé en G0 ; **WP-15 est `CORE INVARIANT ou EXTENSION selon la décision`** — classement par rayon d'impact (`:214`), pas par nature | Contrôle K4 « Intégrité du socle », exécuté par `apf check` — actuellement `SKIPPED`, faute d'instance |
| C-11 | **Un input manquant produit `BLOCKED`, jamais une inférence** (P5, EX2) ; il se recueille en une salve de quatre questions au maximum. | `core/method.yaml:2164` — EX2, traitement de l'input absent en RUN MODE SOLO déclaré | `.claude/skills/bootstrap-product/SKILL.md:31` (`## Contrat d'entrée`), `:35` (« Activité 1 — arrêt dur »), `:37` (« salve unique de quatre questions au maximum ») — trois lignes distinctes |
| C-12 | **L'espace de travail est une projection TIRÉE.** Rien n'est poussé, rien n'est à relier ni à dater : la page EST le commit. | `.github/workflows/launchpad.yml` — OIDC, kit, `snapshot` ; aucune écriture retour vers le dépôt hors semis | `.factoryzen/lib/notion.mjs:32-40` + `apf notion plan\|status\|map` → `"sans objet"`, `pull: true` |
| C-13 | **`main` est le déclencheur automatique — il n'est pas le seul.** `workflow_dispatch` en est un second, manuel ; et le job se re-déclenche lui-même après un semis, le jeton OIDC n'attestant que le commit déclencheur. | `.github/workflows/launchpad.yml:5-8` — `on: push: branches: [main]` **et** `workflow_dispatch:` | `launchpad.yml:54-58` — `gh workflow run launchpad.yml`, sous `actions: write`, conditionné à `steps.seed.outputs.pushed` |
| C-14 | **Aucun secret dans le dépôt.** La projection s'authentifie par jeton OIDC signé par GitHub. Le workflow dispose néanmoins de `contents: write` et de `${{ github.token }}` — une capacité d'écriture réelle, distincte d'un secret configuré. | `.github/workflows/launchpad.yml:9-12` (`id-token: write`), `:28-31` (échange du jeton, `::add-mask::`), `:57` (`GH_TOKEN: ${{ github.token }}`) — aucun `secrets.*` | `.factoryzen/launchpad/supabase/functions/launchpad/` — vérification du jeton côté service, indépendante du dépôt |
| C-15 | **La trace n'est pas une preuve.** Non versionnée, hors des huit contrôles ; **et poussée au launchpad dès le poste appairé** — locale par défaut, pas inconditionnellement. Le Run Ledger versionné est la seule pièce opposable. | `.gitignore` — `runs/trace.ndjson`, `runs/.trace-*` ; `.factoryzen/lib/trace.mjs` → `apf trace push`, jeton dans `~/.factoryzen/` | `apf check` — les huit contrôles n'en lisent aucune ligne ; K8 ne juge que `runs/ledger.ndjson` |
| C-16 | **Node.js 22 et `js-yaml` 4.3.2 exacte, vendorée et épinglée par sha256.** Le module est LIVRÉ, jamais espéré d'une installation : Claude Code installe un plugin par clone et n'exécute aucune étape d'installation. Un seul point d'entrée, `lib/yaml.mjs`. *(`package.json:19-21` ne déclare qu'un `^4.3.2` de devDependency : il ne dit rien de la copie vendorée, et une redéclaration en dépendance d'exécution serait un défaut.)* | `core/method.yaml:2922-2939` — `runtime_dependencies` : `version: 4.3.2`, `entrypoint: lib/yaml.mjs`, sha256 de `LICENSE` et `js-yaml.mjs` | `.factoryzen/lib/vendor.mjs` — `apf vendor` recalcule les empreintes ; `launchpad.yml:24-26` fixe `node-version: 22` |
| C-17 | **RUN MODE SOLO, un humain.** SOLO ne relâche aucun contrôle, aucune autorité de gate, aucune séparation des devoirs : il ne change que le traitement de l'input manquant. | `product/governance/project.yaml:20-31` — la déclaration consignée : `value`, `humans_available`, `declared_at`, `declared_by` | `core/method.yaml:480-490` — la règle que cette déclaration instancie : « son absence est un défaut, pas un défaut de défaut » |
| C-18 | **Le store d'état du backlog est le dépôt Git, et lui seul.** | `product/governance/project.yaml:74-81` — `backlog_store`, un seul | `core/method.yaml` → WP-26, `base: releases/{release-id}/backlog/` |

**Dérivation, non contrainte à deux témoins — D-01 · Un déploiement de tier R3 est
structurellement bloqué.** G4 exige DEUX autorités *distinctes* en tier R3
(`core/method.yaml:1805`) ; `humans_available: 1` (C-17). La conjonction est mécanique, et
`project.yaml:67-70` la transcrit. Les deux « sources » résolvent au registre : c'est une
déduction, pas une observation, et la présenter comme une contrainte à deux témoins serait
le procédé que la révision 1 s'est vu reprocher. **Conséquence inchangée : arrêt, non
dérogation.**

### À confirmer — une seule source, donc pas encore des contraintes

- **« Un agent reçoit moins de 2 % du registre. »** Le chiffre n'apparaît que dans
  `CLAUDE.md`, fichier de gabarit, et rien ne le mesure. C-08 retient l'énoncé vérifiable —
  le fragment est la seule voie — et abandonne la proportion.
- **Disponibilité du launchpad et de la fonction edge Supabase.** Connues par
  `launchpad.yml` seul ; aucun accès aux consoles Vercel ou Supabase. Une projection en
  panne n'arrêterait pas la fabrique — le dépôt reste la vérité — mais rendrait l'espace de
  travail muet.
- **Sous-module privé non clonable sur Claude Code web.** Affirmé par `CLAUDE.md` et
  `factoryzen.sh`, deux fichiers du même gabarit. **Observation contraire du
  2026-09-21 :** `.git/modules/.factoryzen/logs/HEAD` montre un clone direct **réussi**
  depuis l'URL du `.gitmodules`, sans dépôt frère. La réussite est observée ; sa cause ne
  l'est pas, et le rattachement du dépôt frère qui l'a précédée n'en est pas établi comme
  l'explication.
- **Valeur d'un `SKIPPED`.** `apf check` rend huit verdicts ; l'evidence portée au ledger
  pour WP-01 est « 7 PASS · 0 FAIL · 1 SKIPPED ». Que K4 soit `SKIPPED` faute d'instance est
  documenté par la sortie de l'outil seule ; ce qu'un « vert » global signifierait n'est
  écrit nulle part.
- **Effet réel de la portée `product/` sur la gouvernance des projections.** C-03 et C-06
  établissent que la CI réécrit `.claude/` sans garde. Qu'aucune autre écriture hors
  `product/` n'échappe à un contrôle reste à vérifier contre les huit contrôles, un par un.

## Unknowns

Nommés, non comblés par inférence. Chacun avec ce qu'il faudrait pour le lever.

| # | Unknown | Ce qu'il faudrait pour le lever | Échéance |
|---|---|---|---|
| U-01 | **Ce qu'est « Ouazzani design ».** Le nom est recueilli ; le produit, le métier, l'utilisateur et le problème ne le sont pas. Le sponsor a qualifié la source d'opportunité — une demande client réelle, un produit numérique — sans la nommer : un client non nommé n'est pas un fait. | Activité 2 — thèse produit (WP-03), auprès du Product Owner | avant G0, bloquant |
| U-02 | **Le domaine et ses sources approuvées.** Sans domaine qualifié, le critic métier ne peut être ni instancié ni éprouvé sur un cas vérifiable. | Activité 3 — WP-06, WP-07 | avant G0, bloquant |
| U-03 | **L'existence d'un existant hors dépôt.** Déclaré greenfield par le sponsor ; non vérifié. Je ne préjuge pas de ce qu'un tel existant changerait : le dire serait conclure sur une inconnue. | Inspection déclarée d'une source nommée par le Product Owner | avant G0 |
| U-04 | **Les utilisateurs réels et l'accès à eux.** WP-08 exige un protocole écrit AVANT recrutement ; sans accès, la preuve sera étiquetée d'un niveau inférieur, pas fabriquée. | Activité 4 — recrutement, ou déclaration d'impossibilité | avant G0 |
| U-05 | **Les sources du CORPUS RÉEL.** WP-40 interdit les fixtures de complaisance : adresse, date de lecture, citation littérale par enregistrement. Aucune source identifiée. | Activité 27, après WP-06 | avant le socle |
| U-06 | **La cible de déploiement et son tier de risque.** Détermine si D-01 mord ou non. | Activité 9 — architecture technique cible | avant G1 |
| U-07 | **L'échéance et la contrainte de budget.** Aucune énoncée. Elles arbitreraient le découpage en releases ; les deviner produirait un séquencement plausible et faux. | Product Owner, à l'activité 10 au plus tard | avant G1 |

<!-- Complétude : Deux sources indépendantes minimum par contrainte structurante. Inventaire relu par critic(engineering). -->
