# MCR-001 — Test d'expérience par utilisateurs synthétiques aveugles (SUX), avant G0

| | |
|---|---|
| **Statut** | ADOPTÉE — numérotation 6 du registre |
| **Demandée par** | le porteur de la méthode, 9 octobre 2026, sur constat du run TennisCoach (pré-G0, 8/8 contrôles verts) |
| **Source reprise** | dépôt `abenyahy-rgb/Batizen-Factory-Run-1` — `factory/factory-os/methodology/experience-evidence/` (README, EVIDENCE-MODEL.yaml, AXR-PROTOCOL.md, SUX-PROTOCOL.md), `factory/factory-os/tools/validate_experience_evidence.py` (EE1–EE7), campagne exécutée `factory/run-001/acceptance/SUX-01/` et ses validateurs à tests négatifs (`acceptance/tools/validate_sux01_*.py`) |
| **Portée** | registre (`core/method.yaml`), surcouche anglaise, gabarits (`core/templates.yaml`, Office), skill `synthetic-users`, contrôle K7 (`lib/sux.mjs`), migration de numérotation 6, tests ; aucun projet produit modifié depuis la session |

## 1. Constat

1. La seule revue par persona du registre était à l'activité 16 (C2.3), **après G0**, conduite par critic(product). Ce critic CONNAÎT l'intention du produit : c'est une revue experte (AXR au sens de BatiZen), pas un test d'utilisateur naïf.
2. G0 fige en CORE INVARIANT le squelette (WP-05), la navigation et le glossaire (WP-08). Leur compréhension par un utilisateur n'était jamais éprouvée avant ce gel — l'inverse de l'ordre du coût de changement.
3. Le critère de l'activité Navigation, IA et terminologie — « chaque terme testé auprès d'un persona » — n'avait ni protocole ni livrable : il se finissait en réserve « à tester en entretien » (TennisCoach : 13 termes sur 22 non attestés).

## 2. Décision

- **Une activité nouvelle** à la fin de C1.4, après le socle exécutable et le socle technique, avant le découpage en releases et G0 : **« Test d'expérience synthétique du socle »**. Elle produit un **livrable nouveau**, la **campagne SUX du socle**, sous `C1.4-socle/experience/sux/` : protocole, plan de campagne, pare-feu, résultats bruts, annotations, synthèse, patterns et triage.
- **Le protocole SUX de BatiZen, sans affaiblissement** : orchestrateur, agent utilisateur aveugle, observateur, chercheur et triage séparés ; l'agent ne reçoit que son persona, sa mission et le point d'entrée du socle DÉPLOYÉ, écrits dans un manifeste haché AVANT la session ; filtre déterministe sur une liste fermée du vocabulaire interne (TRM-nn et écrans de WP-08, étapes de WP-05) ; personas = fiches de faits tirées des PER-nn de WP-04 et de leurs verbatims ; missions dites avec les mots de l'utilisateur, avec leur arrêt naturel ; interaction réelle avec Playwright, une capture par action — une session « racontée » est rejetée ; observations immuables liées au sha256 du socle ; correction = nouveau candidat, régression sur lui ; aucun score ni seuil tant qu'un run ne les a pas fixés sur preuve ; « N sessions synthétiques », jamais « N utilisateurs », et les sessions sur le même modèle sont déclarées corrélées.
- **Le test porte sur la STRUCTURE** : trouver son chemin, comprendre les mots, réussir les parcours d'argent et de droits (payer, changer d'avis, arrêter, faire une pause). Le contenu pédagogique est hors champ. Une session qui bute sur un champ ABSENT du corpus enregistre un ARRÊT ATTENDU, pas un défaut.
- **Étiquetage.** SYNTHETIC reste l'étiquette du registre, en deux sous-classes déclarées : **SYNTHETIC · AXR** (revue experte, connaît l'intention) et **SYNTHETIC · SUX** (test aveugle). Une revue experte présentée comme un test d'utilisateur est un **BLOCKER**. Le critère « chaque terme testé auprès d'un persona » se satisfait par la campagne SUX du socle ; les termes non compris retournent à WP-08 **avant** le gel.
- **G0.** Le pack de preuves de G0 exige la campagne SUX sur le socle : protocole antérieur, socle haché, résultats bruts, patterns, triage, constats routés vers WP-05, WP-08 et WP-10. **K7** (complétude du pack de preuves) rejoue sur les octets les contrôles SUX1–SUX6 (`lib/sux.mjs`) : manifeste de pare-feu présent et antérieur, candidat égal au commit et au build du socle, filtre de vocabulaire passé, patterns qui citent des sessions et des tours existants, aucun libellé « utilisateurs », aucune revue experte déguisée — avec tests négatifs (`tests/sux.test.mjs`).
- **Activité 16 (C2.3)** : deux preuves distinctes — **AXR** par critic(product), qui connaît l'intention, puis **SUX** aveugle sur le prototype de release figé, même protocole. La mesure en production reste la seule preuve des hypothèses de comportement.

## 3. ADR-MCR-001 — nouvelle activité plutôt qu'extension du socle exécutable

**Contexte.** L'alternative était d'étendre l'activité « Socle exécutable » (product-designer) d'un critère de sortie SUX.

**Décision.** Une activité nouvelle, portée par le **quality-engineer** (orchestrateur : il produit la preuve sans la juger), le triage rendu par **factory-lead**, l'acceptation par le **product-lead**.

**Motifs.**
1. **Builder ≠ Judge (K5).** Le product-designer construit le socle ; s'il orchestre le test qui le juge, il choisit les personas, la mission et le moment — la séparation que le protocole exige entre celui qui produit l'artefact et celui qui l'éprouve disparaît.
2. **Un candidat figé.** Le SUX porte sur un socle haché et déployé. Dans l'activité qui le construit, le socle bouge encore : la campagne testerait une cible mouvante, et une correction se ferait sur l'artefact sous test — ce que le cycle de défaut interdit.
3. **Une preuve, un livrable, un contrôle.** Le livrable a ses chemins déclarés au registre ; K2 (intégrité) et K8 (déclarations) le voient, K7 le rejoue. Noyé dans WP-10, il serait une section parmi dix et non une preuve exigible à G0.
4. **La place.** À la fin de C1.4 — le dernier socle (navigation, données, socle exécutable, socle technique) est en place — et AVANT le découpage en releases (C1.5) : un constat qui renvoie à WP-05 change le squelette dont le découpage dépend.

**Alternative rejetée et ce qu'elle exclut.** L'extension de l'activité « Socle exécutable » aurait évité une renumérotation, mais elle excluait : l'indépendance de l'orchestrateur (K5), un candidat figé distinct de l'artefact en construction, un livrable exigible à G0 et contrôlable par K7, et une régression explicite sur un nouveau candidat.

**Coût accepté.** Les identifiants se suivent dans l'ordre du parcours : l'activité prend le numéro 11, le livrable WP-13, et les suivants glissent d'un rang. C'est la numérotation 6 du registre, appliquée par la migration existante : **seuls les identifiants** de l'état de tour, des front-matter et des noms de fichiers Office sont traduits, jamais le contenu d'un livrable ; le journal se lit à travers la table.

## 4. Compatibilité

- Un run ouvert avant G0 (TennisCoach) voit l'exigence **à G0**, après mise à jour du pin : `factory_request_gate G0` réclame le nouveau livrable (contrôlé en G0) et K7 rejoue la campagne. Aucun livrable existant n'est rouvert ni réécrit dans son contenu.
- Un run qui a déjà franchi G0 (RealMadridPlayers) n'est pas rétroactivement bloqué : l'exigence s'applique au franchissement, pas après. Sa prochaine release rencontre la campagne SUX de l'activité 16.
- Le run se met à jour sans geste humain : à sa prochaine opération de tour, ou à sa prochaine synchronisation par le Launchpad, la migration de numérotation 6 traduit ses identifiants (état de tour, front-matter, noms des fichiers Office) et réaligne `produced_by` sur le registre. Vérifié sur une copie de TennisCoach : migration 5 → 6, puis `factory_request_gate G0` ne réclame que WP-13, aucun contrôle en échec, aucun contenu réécrit.
- **Pin à déployer : commit `a754bd1` de `main`** (version 0.5.0 ; voir CHANGELOG).

## 5. Ce que la MCR ne fait pas

- Elle ne fixe aucun seuil : les métriques sont rapportées, jamais notées.
- Elle ne remplace pas la recherche réelle : SUX n'établit aucun fait sur une personne ; seule la mesure en production (ou un test EMPIRICAL) tranche une hypothèse de comportement.
- Elle ne canonise aucun mécanisme : Playwright est le mécanisme candidat, pas une règle.
