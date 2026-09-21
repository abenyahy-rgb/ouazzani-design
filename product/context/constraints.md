---
id: WP-02
name: "Contexte et contraintes de l'existant"
produced_by: "1"
controlled_at: "G0"
completion: partiel
reserves: ["Aucun produit « Ouazzani design » antérieur n'a été présenté à l'inspection : l'absence d'existant est DÉCLARÉE par l'humain à l'activité 1, elle n'est pas établie par recherche. Un existant hors dépôt — site en ligne, charte de marque, système tiers, dossier client — lèverait cette réserve ou la contredirait.", "Revue critic(engineering) non encore rendue.", "U-01 à U-06 ouverts : le produit lui-même n'est pas encore nommé au-delà de son titre."]
---

# WP-02 — Contexte et contraintes de l'existant · constraints.md

## Contraintes structurantes

Chacune est adossée à **deux sources indépendantes**. Une contrainte à une seule source
est listée plus bas comme *à confirmer*, pas ici.

| # | Contrainte | Source A | Source B |
|---|---|---|---|
| C-01 | **Aucune écriture hors des chemins déclarés au registre.** Un artefact à un chemin non déclaré est invisible à la gouvernance et fait échouer K2. | `CLAUDE.md`, table des refus | `.factoryzen/lib/guard.mjs` — refus exécuté par le hook `PreToolUse` |
| C-02 | **Aucune écriture hors de la frontière de l'activité ouverte.** Le livrable perdrait son Accountable (K5). | `factory_open_activity` rend `write_boundary` (5 chemins à l'activité 1) | `.claude/settings.json` → `factoryzen.sh guard` |
| C-03 | **Plugin introuvable ⇒ refus d'écrire, jamais autorisation par défaut.** Garde à sûreté inverse : un défaut d'installation ne devient pas un contournement silencieux. | `.claude/factoryzen.sh`, branche `guard` sortant en 2 avec `permissionDecision: deny` | `CLAUDE.md`, « Sans plugin, la garde **refuse** toute écriture » |
| C-04 | **La méthode est épinglée, pas suivie au fil de l'eau.** Le sous-module `.factoryzen` est figé sur `a7b185b` ; les commandes, rôles et skills sous `.claude/` en sont des projections régénérées, à ne jamais éditer. | `.gitmodules` + `git ls-tree HEAD .factoryzen` | `CLAUDE.md`, « projections du plugin épinglé … ne pas y éditer » |
| C-05 | **Un agent ne reçoit que son fragment** — moins de 2 % du registre —, jamais `core/method.yaml` en entier. | `CLAUDE.md`, « Ne jamais lire `core/method.yaml` … pour s'en passer » | K6 « Restriction d'outillage » — budget par SKILL.md (≈1466 tk / 2000 constaté) |
| C-06 | **Aucune gate n'est franchie par un agent.** L'autorité est humaine et nommée. | `CLAUDE.md`, table des refus | `core/method.yaml` → `gates[].authority`, « NON DÉLÉGABLE » rendu par `factory_state` |
| C-07 | **Un CORE INVARIANT ne se modifie qu'en cadence C1.** Hors C1 : émettre un finding et router vers G0 (EX3). | `CLAUDE.md`, table des refus | Registre — WP-11, WP-12 (noyau), WP-14, WP-15 marqués `CORE INVARIANT` |
| C-08 | **Un input manquant produit `BLOCKED`, jamais une inférence** (P5, EX2), et se recueille en une salve de quatre questions au maximum. | `CLAUDE.md`, table des refus | `.claude/skills/bootstrap-product/SKILL.md`, « Contrat d'entrée — arrêt dur » |
| C-09 | **L'espace de travail est une projection TIRÉE.** Le launchpad lit le dépôt à chaque push sur `main` ; rien n'est poussé, rien n'est à relier ni à dater. La page EST le commit. | `.github/workflows/launchpad.yml` (OIDC, kit, snapshot) | `apf notion plan|status|map` → `"sans objet"`, `pull: true` |
| C-10 | **La branche par défaut `main` est le déclencheur unique de la projection.** Tout travail sur une autre branche reste invisible au launchpad jusqu'à sa fusion. | `launchpad.yml` → `on.push.branches: [main]` | `apf notion plan` → « Committer et pousser sur la branche par défaut » |
| C-11 | **Aucun secret dans le dépôt.** La projection s'authentifie par jeton OIDC signé par GitHub Actions ; le jeton du poste vit dans `~/.factoryzen/` et n'ouvre que l'écriture de trace. | `launchpad.yml` — `permissions: id-token: write`, aucun `secrets.*` | `CLAUDE.md`, « Aucun secret, rien à relier ni à dater » |
| C-12 | **La trace n'est pas une preuve.** `runs/trace.ndjson` est local, non versionné, hors de tout contrôle ; le Run Ledger versionné est la seule pièce opposable. Confondre les deux ferait d'un fichier effaçable une pièce citable. | `.gitignore`, avec son motif écrit | `CLAUDE.md`, « la trace dit ce qui s'est passé, le Run Ledger dit ce qui est prouvé » |
| C-13 | **Node.js 22 et `js-yaml` vendorisé épinglé par empreinte** sont le socle d'exécution de l'outillage ; `apf vendor` vérifie l'intégrité du vendoring. | `launchpad.yml` → `node-version: 22` | `.factoryzen/package.json` + `.factoryzen/vendor/js-yaml/`, contrôlés par `apf vendor` |
| C-14 | **RUN MODE SOLO, un humain.** SOLO ne relâche aucun contrôle déterministe, aucune autorité de gate, aucune règle de séparation des devoirs : il ne change que le traitement de l'input manquant (EX2). | `product/governance/project.yaml` → `run_mode` | Déclaration humaine du 2026-09-21 (salve d'ouverture, activité 1) |
| C-15 | **Un déploiement de tier R3 est structurellement bloqué.** G4 exige DEUX autorités distinctes en R3 ; un run à un humain ne peut pas les fournir. Arrêt, non dérogation. | `project.yaml` → `gates.G4.reserve` | `factory_state` → G4 « DEUX autorités distinctes en tier R3 » |
| C-16 | **Le store d'état du backlog est le dépôt Git**, `product/releases/{release-id}/backlog/`, et lui seul. Deux stores seraient deux vérités. | `project.yaml` → `backlog_store` | Déclaration humaine du 2026-09-21 ; registre WP-26 |

### À confirmer — une seule source, donc pas encore des contraintes

- **Disponibilité du launchpad et de la fonction edge Supabase.** Connues par
  `launchpad.yml` seul ; aucun accès aux consoles Vercel ou Supabase n'a permis de les
  vérifier de façon indépendante. Une projection en panne n'arrêterait pas la fabrique —
  le dépôt reste la vérité — mais rendrait l'espace de travail muet.
- **Environnement Claude Code web : sous-module privé non clonable.** `CLAUDE.md` et
  `factoryzen.sh` le documentent ; en session le clone a fini par réussir après
  rattachement du dépôt frère. Comportement à reconstater, pas à généraliser.

## Unknowns

Nommés, non comblés par inférence. Chacun avec ce qu'il faudrait pour le lever.

| # | Unknown | Ce qu'il faudrait pour le lever | Échéance |
|---|---|---|---|
| U-01 | **Ce qu'est « Ouazzani design ».** Le nom est recueilli ; le produit, le métier, l'utilisateur et le problème ne le sont pas. Je n'infère rien d'un nom. | Activité 2 — thèse produit (WP-03), auprès du Product Owner | avant G0, bloquant |
| U-02 | **Le domaine et ses sources approuvées.** Sans domaine qualifié, le critic métier ne peut pas être instancié ni éprouvé sur un cas vérifiable. | Activité 3 — WP-06, WP-07 | avant G0, bloquant |
| U-03 | **L'existence d'un existant hors dépôt.** Déclaré greenfield par l'humain ; non vérifié par recherche. Un site, une charte, un fichier client ou un système de gestion déjà en service changerait C-01 à C-16 en périmètre, pas en nature. | Inspection déclarée d'une source nommée par le Product Owner | avant G0 |
| U-04 | **Les utilisateurs réels et l'accès à eux.** WP-08 exige un protocole écrit AVANT recrutement ; sans accès, la preuve utilisateur sera étiquetée d'un niveau inférieur, pas fabriquée. | Activité 4 — recrutement, ou déclaration d'impossibilité | avant G0 |
| U-05 | **Les sources du CORPUS RÉEL.** WP-40 interdit les fixtures de complaisance : chaque enregistrement porte adresse, date de lecture et citation littérale. Aucune source n'est identifiée à ce jour. | Activité 27, après WP-06 | avant le socle |
| U-06 | **La cible de déploiement et son tier de risque.** Détermine si C-15 (blocage R3) mord ou non. | Activité 9 — architecture technique cible | avant G1 |
| U-07 | **L'échéance et la contrainte de budget.** Aucune n'a été énoncée. Elles arbitreraient le découpage en releases (activité 10) ; les deviner produirait un séquencement plausible et faux. | Product Owner, à l'activité 10 au plus tard | avant G1 |

<!-- Complétude : Deux sources indépendantes minimum par contrainte structurante. Inventaire relu par critic(engineering). -->
