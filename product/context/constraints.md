---
id: WP-02
name: "Contexte et contraintes de l'existant"
produced_by: "1"
controlled_at: "G0"
completion: partiel
reserves: ["Révision 3, RÉDUITE sous EX1 : deux refus de critic(engineering) sur le même critère interdisent une troisième soumission à l'identique. Le périmètre est réduit de 18 contraintes à 11, les 9 autres redescendues en « À confirmer ».", "L'absence d'existant hors dépôt est DÉCLARÉE par le sponsor, non établie par recherche (U-03).", "Quatre sources B de la révision 2 citaient des fichiers que le périmètre déclarait non lus : elles sont retirées, non recitées.", "U-01 à U-07 ouverts."]
---

# WP-02 — Contexte et contraintes de l'existant · constraints.md

> **Révision 3 — réduite sous EX1.** Deux revues de `critic(engineering)`, deux REFUSÉ, sur le
> même critère : « deux sources indépendantes ». EX1 interdit une troisième soumission à
> l'identique et ouvre trois voies — réduire le périmètre, changer d'approche, escalader.
> **Voie retenue : réduire.**
>
> Le motif du second refus mérite d'être écrit, parce qu'il éclaire le dépôt autant que le
> livrable : C-13 citait **deux plages de lignes du même fichier** en colonnes « A » et « B »,
> et C-11 citait le registre **et sa propre projection générée** — `build/build-adapter.mjs`
> écrit ce `SKILL.md` depuis `core/method.yaml`. J'avais reproduit, sous une forme plus nue, la
> faute que la révision 2 venait de corriger.
>
> **Cause structurelle, et c'est elle qui justifie la réduction.** Ce dépôt dérive presque tout
> d'une source unique : un registre, et un gabarit qu'une CI regénère. Exiger deux témoins
> indépendants pour dix-huit énoncés y force la fabrication. Onze en ont réellement deux ; les
> neuf autres descendent où elles appartiennent.

## Contraintes structurantes

Onze. Chacune adossée à **deux artefacts d'auteurs et de fonctions distincts** — code exécuté,
registre, ou journal produit par ce run. Ce qui n'en a qu'un est plus bas, et n'est pas promu.

| # | Contrainte | Source A | Source B |
|---|---|---|---|
| C-01 | **Sous `product/`, aucune écriture à un chemin non déclaré au registre.** Verdict `deny` avant l'écriture. | `lib/guard.mjs:27-33` construit l'ensemble depuis `work_products.base + files` ; `:51-55` rend `deny` si aucun motif ne matche | `core/method.yaml` → contrôle K2 « Intégrité du registre », détectif là où la garde est préventive |
| C-02 | **La garde ne juge QUE `product/`.** `.claude/`, `.github/`, `runs/`, `CLAUDE.md` et la racine sont écrits **sans examen** — portée assumée, non trou accidentel : « un plugin qui arbitre chaque écriture du projet se fait désinstaller » (`:14-16`). | `lib/guard.mjs:45-46` — `if (!rel.startsWith('product/')) return { decision: 'allow', … }` | `.claude/settings.json` — le hook `PreToolUse` matche `Write\|Edit\|NotebookEdit` **sans restriction de chemin** : c'est la garde qui restreint, pas le hook *(réserve : ce fichier est fusionné depuis le gabarit — artefact distinct et de fonction distincte, mais pas d'auteur indépendant)* |
| C-03 | **Plugin introuvable ⇒ refus d'écrire.** Un hook `PreToolUse` ne refuse qu'en sortant en 2 ; la garde à sûreté inverse le fait. | `.claude/factoryzen.sh` — branche `guard`, JSON `permissionDecision: "deny"` puis `exit 2` | `core/method.yaml:2924` — `defect_it_closes` consigne le défaut réel : « la garde en boucle sortait en 1 au lieu de 2 — donc n'arrêtait plus aucune écriture : elle échouait en OUVRANT » |
| C-04 | **La CI regénère `.claude/` à chaque exécution.** Le semis **supprime** `commands/`, `agents/`, `skills/`, réécrit `factoryzen.sh`, `.gitmodules`, `.mcp.json`, fusionne `settings.json`, **complète** (n'écrase pas) `.gitignore`. Toute édition locale de ces chemins est silencieusement annulée — et la garde n'y peut rien (C-02). *Commit et push sont conditionnés à un arbre sale (`launchpad.yml:41`) : en régime établi, le semis rejoué ne pousse rien.* | `launchpad/kit/run.mjs:124` (`rmSync` commands), `:131` (agents), `:136` (skills), `:145-147` (fichiers de liaison), `:154-162` (.gitignore, ajout), `:164-173` (settings.json, fusion) | `.github/workflows/launchpad.yml:37-48` — étape « Semer le gabarit », `git commit` et `git push` sous l'identité `launchpad`, habilités par `permissions: contents: write` (`:11`) |
| C-05 | **La CI est un acteur de la tour et un écrivain du Run Ledger.** Le semis n'ouvre pas que des fichiers : il **ouvre l'activité 1 au nom de `factory-lead`, déclare WP-01 `partiel` et écrit `runs/tower.json` et `runs/ledger.ndjson`**. Une seule fois — un journal existant est l'histoire du produit, jamais réécrite. | `launchpad/kit/run.mjs:72-88` — `open()` : garde `if (existsSync(towerFile)) return null`, puis `openActivity(root, {activity:"1", actor:"factory-lead"})` et `declare(… completion:"partiel" …)` | `runs/ledger.ndjson:1-2` — les deux premières lignes du journal de ce run, horodatées 15:09:20, produites par cette exécution et par aucun agent de session |
| C-06 | **La méthode est épinglée par le gitlink, pas par `.gitmodules`.** Ce dernier ne porte que `path` et `url` ; il n'épingle rien, et le semis le réécrit. | Gitlink de l'arbre : `git ls-tree HEAD .factoryzen` → `160000 commit a7b185b74f20…`, confirmé par `.git/modules/.factoryzen/HEAD` | `launchpad/kit/run.mjs:124-147` — `.claude/` et `.gitmodules` sont des projections régénérées, donc non porteuses de l'épinglage (C-04) |
| C-07 | **L'espace de travail est une projection TIRÉE.** Rien n'est poussé, rien n'est à relier ni à dater : la page EST le commit. | `.github/workflows/launchpad.yml` — OIDC (`:10`, `:28-31`), kit (`:32-36`), `snapshot` (`:50`) | `lib/notion.mjs:32-40` — `apf notion plan\|status\|map` rendent `"sans objet"`, `pull: true` |
| C-08 | **`js-yaml` 4.3.2 exacte, vendorée, épinglée par sha256, importée par un point d'entrée unique.** Le module est LIVRÉ : Claude Code installe un plugin par clone et n'exécute aucune étape d'installation. *(`package.json:19-21` ne porte qu'un `^4.3.2` de devDependency ; une redéclaration en dépendance d'exécution serait un défaut.)* | `core/method.yaml:2922-2939` — `runtime_dependencies` : `version: 4.3.2`, `entrypoint: lib/yaml.mjs`, sha256 de `LICENSE` et `js-yaml.mjs` | `lib/vendor.mjs` — `apf vendor` recalcule les empreintes ; `launchpad.yml:26` fixe `node-version: 22` |
| C-09 | **RUN MODE SOLO, un humain.** | `product/governance/project.yaml:20-31` — la déclaration consignée : `value`, `humans_available`, `declared_at`, `declared_by` | `core/method.yaml:480-490` — la règle que cette déclaration instancie : « son absence est un défaut, pas un défaut de défaut » |
| C-10 | **En SOLO, un input absent ne bloque plus dans le cas général : il devient une hypothèse nommée `UNVALIDATED`. TROIS CAS restent BLOCKED quel que soit le mode** — une DÉCISION que seul l'humain qui répond du produit peut prendre (intention, arbitrage de périmètre, critère d'abandon) ; un input dont l'absence rendrait IRRÉVERSIBLE une erreur (figé par un gate, ou CORE INVARIANT) ; et le CORPUS RÉEL. | `core/method.yaml:2163-2171` — `EX2.run_mode_solo`, avec son motif : « Une hypothèse nommée est traçable ; une délégation improvisée ne l'est pas » | `runs/ledger.ndjson` — application observée le 2026-09-21 : WP-03, WP-04 et WP-05 déclarés `partiel` avec BLOCKED motivé par les cas 1 et 2, et non convertis en hypothèses |
| C-11 | **Le store d'état du backlog est le dépôt Git, et lui seul.** | `product/governance/project.yaml:74-81` — `backlog_store`, un seul | `core/method.yaml` → WP-26, `base: releases/{release-id}/backlog/` |

**Dérivation, non contrainte à deux témoins — D-01 · Un déploiement de tier R3 est
structurellement bloqué.** G4 exige DEUX autorités *distinctes* en tier R3
(`core/method.yaml:1805`) ; `humans_available: 1` (C-09). La conjonction est mécanique, et
`project.yaml:67-70` la transcrit. Les deux « sources » résolvent au registre : c'est une
déduction, pas une observation. **Conséquence inchangée : arrêt, non dérogation.**

### À confirmer — une seule source, ou une source non vérifiée

Descendues de la révision 2, chacune avec le motif exact de sa descente. Elles restent vraies
à ma connaissance ; elles ne sont simplement pas établies au standard du critère.

| Énoncé | Pourquoi il descend |
|---|---|
| **Aucune écriture hors de la frontière de l'activité ouverte.** | `guard.mjs:65-72` et le `write_boundary` rendu par `factory_open_activity` sont **la même fonction** `writeBoundary()` sous deux noms. Un mécanisme, pas deux témoins. |
| **Mode dégradé réel : `ask`.** Chemin déclaré, aucune activité ouverte ⇒ la question remonte à l'humain. | `guard.mjs:57-63` l'établit seul. `method.yaml:2862` (`enforcement_model`) parle de la **tour**, pas de la garde, et ne mentionne ni `ask` ni ce cas : appui thématique, pas second témoin. |
| **Un agent ne reçoit que son fragment.** | Source B invoquée : `mcp/server.mjs` et `lib/tower.mjs` — tous deux déclarés **non lus** au périmètre. Un fichier non lu ne témoigne pas. |
| **Aucune gate n'est franchie par un agent.** | Même défaut (`lib/tower.mjs` non lu), **et l'énoncé de la révision 2 était inexact** : `factory_clear_gate` n'exige `human` que si `!g.automated`, et `decision` y est optionnel. |
| **Un CORE INVARIANT ne se modifie qu'en cadence C1.** | Source B invoquée : le contrôle K4 — actuellement `SKIPPED`. Un contrôle qui ne s'exécute pas ne témoigne de rien. Le registre seul reste. |
| **`main` n'est pas le déclencheur unique** (`workflow_dispatch`, auto-redéclenchement). | Les deux sources étaient **deux plages du même fichier**. Fait exact (`launchpad.yml:5-8`, `:54-58`), témoignage unique. |
| **Aucun secret dans le dépôt.** | Source B invoquée : `launchpad/supabase/functions/launchpad/` — déclaré non lu. La vérification OIDC côté service n'est pas attestée. Le workflow dispose par ailleurs de `contents: write` (`:11`) et `actions: write` (`:12`) — capacités réelles, distinctes d'un secret configuré. |
| **La trace n'est pas une preuve.** | L'affirmation « les huit contrôles n'en lisent aucune ligne » repose sur `lib/checks.mjs`, déclaré non lu : affirmation **négative** non vérifiée. Établi en revanche : `.gitignore:10-13` liste `runs/trace.ndjson`, `.trace-pending.json`, `.trace-cursor.json`, `.trace-push.lock` ; et la trace est **poussée au launchpad dès le poste appairé** — locale par défaut, pas inconditionnellement. |
| **« Un agent reçoit moins de 2 % du registre. »** | Le chiffre n'apparaît que dans `CLAUDE.md`, fichier de gabarit, et rien ne le mesure. |
| **Disponibilité du launchpad et de la fonction edge Supabase.** | `launchpad.yml` seul ; aucun accès aux consoles. Observé toutefois : le run #3 du workflow a conclu `success` le 2026-09-21. |
| **Sous-module privé non clonable sur Claude Code web.** | Affirmé par deux fichiers du même gabarit. **Observation contraire du 2026-09-21** : `.git/modules/.factoryzen/logs/HEAD` montre un clone direct réussi depuis l'URL du `.gitmodules`. La réussite est observée ; sa cause ne l'est pas. |
| **Valeur d'un `SKIPPED`.** | Ce qu'un « vert » global signifierait n'est écrit nulle part. Établi seulement : `apf check` rend huit verdicts, et un `SKIPPED` ne vaut pas un `PASS`. |

## Unknowns

Nommés, non comblés par inférence.

| # | Unknown | Ce qu'il faudrait pour le lever | Échéance |
|---|---|---|---|
| U-01 | **Ce qu'est « Ouazzani design ».** Le sponsor a qualifié la source d'opportunité — une demande client réelle, un produit numérique — sans la nommer. Un client non nommé n'est pas un fait. | Q1 de la salve d'interrogatoire (WP-03) : qui a demandé, quand, dans quels mots | avant G0, **bloquant** |
| U-02 | **Le domaine et ses sources approuvées.** Sans domaine qualifié, le critic métier ne peut être ni instancié ni éprouvé. | Activité 3 — WP-06, WP-07 | avant G0, **bloquant** |
| U-03 | **L'existence d'un existant hors dépôt.** Déclaré greenfield par le sponsor ; non vérifié. Je ne préjuge pas de ce qu'un tel existant changerait. | Inspection déclarée d'une source nommée par le Product Owner | avant G0 |
| U-04 | **Les utilisateurs réels et l'accès à eux.** Sans accès, la preuve sera étiquetée d'un niveau inférieur, pas fabriquée. | Activité 4 — recrutement, ou déclaration d'impossibilité | avant G0 |
| U-05 | **Les sources du CORPUS RÉEL.** Troisième cas BLOCKED d'EX2 : aucune hypothèse ne remplace un fait que le produit affichera. | Activité 27, après WP-06 | avant le socle |
| U-06 | **La cible de déploiement et son tier de risque.** Détermine si D-01 mord. | Activité 9 | avant G1 |
| U-07 | **L'échéance et la contrainte de budget.** Aucune énoncée. | Product Owner, à l'activité 10 au plus tard | avant G1 |

<!-- Complétude : Deux sources indépendantes minimum par contrainte structurante. Inventaire relu par critic(engineering). -->
