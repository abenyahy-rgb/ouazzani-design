# MCR-003 — Le métier des sous-agents : contrat d'entrée par profil, rapport de retour, règles du run BatiZen 1

| | |
|---|---|
| **Statut** | ADOPTÉE — par le porteur de la méthode, le 9 octobre 2026, qui a ordonné la fusion de la PR #97 sur `main`. Écrite par un agent sur son autorisation explicite de modifier les agents du plugin ; numérotée MCR-003, MCR-002 ayant été prise entre-temps par l'autopilote de la cadence C1 (#98). |
| **Demandée par** | le porteur de la méthode, 9 octobre 2026 : « modifier les agents du plugin en s'inspirant des bonnes pratiques de BatiZen factory run 1 » |
| **Source reprise** | dépôt `abenyahy-rgb/Batizen-Factory-Run-1` (commit `a130cbf`), sous `factory/run-001/` et `factory/factory-os/` ; dépôt `abenyahy-rgb/tenniscoach` (commit `ae9fcd0`). Chaque citation est vérifiée dans son fichier — voir §5. |
| **Portée** | registre (`core/method.yaml` : `handover.agent_entry`, `handover.return_format`, règles de six rôles, `method_evolution`), générateur (`build/build-adapter.mjs`), tour (`lib/tower.mjs` : réserves routées), contrôle K6 (`lib/checks.mjs`), agents régénérés, tests ; aucune activité, aucun livrable, aucune numérotation modifiés. |

## 1. Constat

1. **Un contrat d'entrée unique, contradictoire.** `agentFile()` écrivait à tous les agents le même texte figé : « poser une seule salve de quatre questions au maximum avant toute production ». Les critics le recevaient aussi, alors que leur règle NOT_VALIDATED leur interdit d'inférer, et un sous-agent ne peut pas attendre la réponse de l'humain — c'est déjà le motif qui retire l'interrogatoire aux sous-agents (`conduitesDe`). Le générateur portait une règle, ce qu'il ne doit pas faire.
2. **Aucun format de retour.** Le bloc « Evidence et handover » disait ce qu'un handover n'est pas ; rien ne disait ce que le rapport porte. Une vérification qui n'a pas tourné n'avait pas de place, et un trou comblé en silence se lisait comme un succès.
3. **Des pratiques prouvées dans BatiZen run 1 et absentes du registre** : brief de délégation autosuffisant, plan de couverture avant revue, verdict réservé à l'humain, verdict lié à l'empreinte, absence prouvée, registre des écarts à la baseline, fixtures qui affirment leurs préconditions, run de harnais exclu et conservé, statuts de décision distincts, continuité des réserves, canari avant balayage.
4. **Le run TennisCoach a rencontré trois de ces défauts dans sa campagne SUX-03** (section Limites de la synthèse) : une apostrophe dans la pensée de l'agent faisait échouer la commande du téléphone, le clip de test datait toutes les vidéos de 13:40, et la première préparation de S05 a échoué sur un sélecteur du harnais. Aucun script de harnais n'est versionné dans le dépôt produit (recherche `git ls-files` au commit `ae9fcd0`, motifs `harn|harness|sux.*\.(mjs|js|py|sh)$` : 0 occurrence).

## 2. Décision

### 2.1 Contrat d'entrée par profil — `handover.agent_entry.<profil>`

- **producer, evidence, orchestrator** (rôles qui écrivent) : input absent → `BLOCKED — input manquant` ; input sous-spécifié → s'arrêter et le dire, ne pas choisir : BLOCKED en nommant le manque, ou hypothèses nommées `UNVALIDATED`, jamais une décision produit que l'entrée ne donne pas. Les questions, quatre au plus, sont **rendues** à l'appelant, jamais posées ; l'appelant les porte en une salve (EX2).
- **evaluator, auditor** (rôles sans écriture) : artefact absent, illisible ou d'empreinte différente → `NOT_VALIDATED` avec sa raison ; jamais BLOCKED, FAIL ni hypothèse ; aucune question posée, un critère ambigu rend `NOT_VALIDATED · AMBIGU`.
- `agentFile()` lit la clé du profil de l'agent au lieu du texte figé ; un profil sans contrat arrête la génération.

### 2.2 Rapport de retour — `handover.return_format`

Livrables avec chemin et commit · vérifications exécutées avec sortie et canal · NOT RUN listés · complet ou partiel avec réserves · gaps nommés (« un gap nommé est un succès, un gap comblé en silence ne l'est pas ») · questions pour l'appelant · prochaine action. Rendu dans chaque agent sous « Format de retour ». Un rôle sans écriture reçoit en plus la note `evaluators` (son verdict est le livrable). `completion_declaration.contract` et `handover.passes` sont rendus aux rôles qui écrivent — un juge sans écriture ni `apf` recevrait une consigne qu'il ne peut pas suivre.

### 2.3 Règles de travail, par rôle

| Rôle | Règle (titre) | Source |
|---|---|---|
| factory-lead | UN BRIEF DE DÉLÉGATION SE SUFFIT À LUI-MÊME — mission, frontière, arrêts, critères numérotés, format de retour ; un critic : artefact, empreinte, critères, rien d'autre | brief pass-01 l.8 ; AXR-PROTOCOL.md §1 |
| factory-lead | UNE RÉSERVE ROUTÉE NE SE PERD PAS — rappelée à l'ouverture de l'activité destinataire, disposition obligatoire | FABLE-ADJUDICATION.yaml ref 8 ; METHODOLOGY-CORRECTION.yaml FL-01 |
| critic(·) | UN PLAN DE COUVERTURE AVANT LA REVUE — DRIVEN / NOT_REACHED / OUT_OF_SCOPE par unité ; zéro constat n'est jamais un PASS | AXR-PROTOCOL.md §2, §7 ; EVIDENCE-MODEL.yaml (AXR.cannot_prove) |
| critic(·) | CLÔTURE HUMAINE N'EST PAS PASS — « éligible » toujours avec « gate non décidée » | DC-05.1/validation-result.yaml (PO_GATE) ; invariants.yaml validation_events.gate_decision_is_a_third_object |
| critic(·) | UN VERDICT EST LIÉ À CE QU'IL A JUGÉ — commit, empreinte, version du registre ; fermeture sur la nouvelle empreinte | invariants.yaml validation_events.each_event_binds ; AXR-PROTOCOL.md §6 |
| critic(·) | UNE ABSENCE SE PROUVE — espace parcouru, motif, 0 occurrence | invariants.yaml FI-04, FI-04.6 |
| product-designer | UN REGISTRE DES ÉCARTS À LA BASELINE — cinq questions, classes fermées, PRESERVE par défaut, OPTIONAL rare, gaps nommés | brief pass-01 §C.0, §M.3, §M.4 |
| quality-engineer | UNE FIXTURE AFFIRME SES PRÉCONDITIONS | METHODOLOGY-CORRECTION.yaml « FIXTURES MUST ASSERT THEIR OWN PRECONDITIONS » ; TennisCoach SUX-03 (préparation de S05) |
| quality-engineer | UN RUN INVALIDÉ PAR LE HARNAIS SE GARDE, IL NE SE COMPTE PAS — EXCLU DE L'ANALYSE | SUX-01-EXECUTION-MANIFEST.yaml `harness_defect_run_1` |
| quality-engineer | LE HARNAIS EST VERSIONNÉ — et une entrée libre d'agent n'est jamais interprétée par le shell | TennisCoach SUX-03, Limites (apostrophe, clip 13:40) ; absence de harnais versionné (§1.4) |
| product-lead | RECOMMANDÉ, ROUVERT, DÉCIDÉ — provenance d'agent conservée ; « par délégation du porteur » reste RECOMMANDÉ jusqu'à confirmation nommée | METHODOLOGY-CORRECTION.yaml « A REOPENED QUESTION IS NOT AN ANSWERED ONE » et discovery_learnings |
| conformance-auditor | LE CANARI AVANT LE BALAYAGE — un canari qui échoue est un FAIL | aligned-design/forbidden-claims.yaml `canary.rule` |

### 2.4 La tour rappelle les réserves routées

`factory_open_activity` rend `reserves_routees` : les réserves de la dernière déclaration « partiel » de chaque livrable qui citent l'activité (« activité 11 », « activités 11 et 17 ») ou l'un de ses livrables (WP-nn), avec la consigne de disposition. La dernière déclaration fait foi (`completion_declaration.last_wins`) : une réserve levée par un « complet » ultérieur n'est plus rappelée.

### 2.5 Contrôle

K6 refuse : un profil porté par un agent sans `handover.agent_entry` ; un contrat d'entrée de rôle sans écriture qui ne dit pas NOT_VALIDATED, ou de rôle qui écrit qui ne nomme pas BLOCKED et UNVALIDATED ; un `return_format` vide ; un fichier d'agent qui ne rend pas le contrat de son profil ou le format de retour ; un évaluateur qui rend le contrat d'un producteur. Tests négatifs dans `tests/regles.test.mjs` ; chaque règle nouvelle a un test qui vérifie qu'elle est rendue dans le bon agent et absente des autres.

## 3. ADR-MCR-003 — le contrat d'entrée au registre, par profil, plutôt que par agent ou dans le générateur

**Contexte.** Trois emplacements possibles : garder le texte dans `agentFile()` en le conditionnant au profil ; un champ `entry` par agent ; une clé par profil sous `handover`.

**Décision.** Une clé par profil d'outillage, `handover.agent_entry.<profil>`, lue par le générateur.

**Motifs.**
1. **Le générateur ne porte aucune règle** (en-tête de `build-adapter.mjs`) : un texte conditionné dans le code reste une règle hors registre, invisible à K6.
2. **Le contrat suit la capacité, pas le rôle.** Ce qu'un agent peut faire d'un input manquant dépend de ce qu'il a le droit d'écrire : un rôle sans écriture ne peut que rendre NOT_VALIDATED. Le profil est déjà la clé de cette capacité (`tools_profiles.writes`) ; un champ par agent dupliquerait dix fois deux textes et laisserait diverger deux critics.
3. **Contrôlable.** K6 confronte la clé au profil (`writes`) et au fichier rendu.

**Alternative rejetée et ce qu'elle exclut.** Un champ `entry` par agent, ajouté à `AGENT_BLOCKS`, aurait permis des nuances par rôle ; il excluait l'unicité du contrat par capacité, et un critic aurait pu recevoir, par copie, le contrat d'un producteur sans que rien ne le distingue structurellement.

**Coût accepté.** `evidence` et `orchestrator` partagent le contrat du producteur (ancre YAML) ; une nuance propre à l'un d'eux exigera de rompre l'ancre.

## 4. Compatibilité

- Aucune activité, aucun livrable, aucun identifiant ne change : pas de numérotation, pas de migration. Un projet épinglé plus bas voit les nouveaux agents à sa prochaine mise à jour du pin ; aucun livrable existant n'est rouvert.
- `factory_open_activity` ajoute un champ à sa réponse (`reserves_routees`), seulement quand une réserve est routée ; aucun appelant n'est cassé.
- Surcouche anglaise : `rules`, `handover` et `method_evolution` ne sont pas des champs traduits (`lib/i18n.mjs`, `CHAMPS` et `TEXTES`) ; seul le `purpose` de `factory_open_activity`, modifié, est retraduit dans `core/i18n/en.yaml`.

## 5. Citations vérifiées

Chemins relatifs à `factory/run-001/` sauf mention `factory-os/`.

- `aligned-design/pass-01/CLAUDE-DESIGN-BRIEF.md` — l.8 « This brief is self-contained » ; §C.0 les cinq questions et « If 4 is yes: STOP » ; §C.4 « STOP and say so. Do not choose. » ; §M.3 classes fermées, « Use PRESERVE generously », « Keep OPTIONAL_DESIGN_IMPROVEMENT rare » ; §M.4 « A named gap is a successful outcome. A silently filled gap is not. »
- `aligned-design/checkpoints/DC-05.1/validation-result.yaml` — `verdict_rules.PO_GATE` : « The criterion is human-closing and is reserved to the Product Owner. The validator MUST NOT mark it PASS. »
- `aligned-design/forbidden-claims.yaml` — `canary.rule` : « A canary failure is never a warning. »
- `slice-contracts/S0/evidence/closeout-record.yaml` — `validation.hosted_ci: NOT RUN — … no hosted PASS is claimed` ; `channel` ; `next.factory_action`.
- `product-state/METHODOLOGY-CORRECTION.yaml` — « FIXTURES MUST ASSERT THEIR OWN PRECONDITIONS » ; « A REOPENED QUESTION IS NOT AN ANSWERED ONE » ; « An agent's analysis relayed by the Product Owner is still an agent's analysis » ; `lifecycle_invariant` FL-01.
- `product-state/FABLE-ADJUDICATION.yaml` — ref 8 : gap L-02 routé vers la passe 3 et absent de DC-05.3 ; « Gap hand-off continuity is exactly what the FL-01 lifecycle invariant now requires per pass ».
- `acceptance/SUX-01/run/SUX-01-EXECUTION-MANIFEST.yaml` — `harness_defect_run_1.status: EXCLUDED_FROM_ANALYSIS`, « run 1 kept as text evidence … not given to any evaluator ».
- `factory-os/invariants.yaml` — FI-04 « A claim of absence is a POSITIVE assertion and must be proved » ; FI-04.6 `preserve_requires_a_positive_baseline_proof` ; `validation_events.each_event_binds` ; `gate_decision_is_a_third_object.eligible_requires_explicit_disclaimer: true`.
- `factory-os/methodology/experience-evidence/AXR-PROTOCOL.md` — §1 contrat d'entrée ; §2 « A coverage figure is never stated without this enumeration » ; §6 « A finding closes only on evidence bound to the new sha256 » ; §7 « Completion is not a pass ».
- `factory-os/methodology/experience-evidence/EVIDENCE-MODEL.yaml` — AXR `cannot_prove` : « the ABSENCE of defects — « no finding » is never a PASS ».
- TennisCoach `product/C1.4-socle/experience/sux/resultats/SUX-03/synthese.md`, § Limites — « Une apostrophe dans sa pensée faisait échouer la commande du téléphone » ; « Le clip de test date toutes les vidéos de 13:40 » ; « La première préparation de S05 a échoué sur un sélecteur du harnais ».

**Non trouvé à la source.** La clause « une décision prise par délégation du porteur reste RECOMMANDÉ jusqu'à sa confirmation nommée » n'a pas de formulation littérale dans BatiZen : elle applique au cas de la délégation le principe « A REOPENED QUESTION IS NOT AN ANSWERED ONE » (une recommandation n'est pas une décision). Elle est donc une proposition de cette MCR, non une reprise.

## 6. Ce que la MCR ne fait pas

- Elle n'ajoute ni verdict à la taxonomie de K-contrôles ni seuil : CLÔTURE HUMAINE est un résultat de critère dans le verdict d'un critic, pas un statut de gate.
- Elle ne mécanise pas les règles de travail elles-mêmes (canari, préconditions de fixture) : elles s'appliquent aux contrôles que le projet écrit. K6 contrôle qu'elles sont déclarées et rendues, pas qu'elles sont suivies.
- Elle n'a rien adopté d'elle-même : PROPOSÉE à l'écriture, ADOPTÉE par la décision du porteur.
