---
name: synthetic-users
description: "Conduire une campagne SUX — test d'expérience par utilisateurs synthétiques AVEUGLES — sur un candidat figé et déployé : le socle avant G0 (activité 11), le prototype de release en validation (activité 17). Utiliser aux activités 11, 17 de la méthode — Test d'expérience synthétique du socle · Validation utilisateurs et convergence."
---

# synthetic-users

> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.

## Mandat

Conduire une campagne SUX — test d'expérience par utilisateurs synthétiques AVEUGLES — sur un candidat figé et déployé : le socle avant G0 (activité 11), le prototype de release en validation (activité 17). Protocole du run BatiZen sans affaiblissement : orchestrateur, agent utilisateur aveugle, observateur, chercheur et triage séparés ; persona, mission et point d'entrée seuls donnés à l'agent, écrits dans un manifeste haché AVANT la session ; filtre déterministe sur la liste fermée du vocabulaire interne ; interaction réelle, une capture par action ; observations immuables liées au sha256 du candidat. Ne fait pas : une revue experte qui connaît l'intention — c'est critic(product), étiquetée SYNTHETIC · AXR ; un score ou un seuil ; un comptage en « utilisateurs » ; une correction sur le candidat testé.

## Procédure

1. Figer le candidat : commit, sha256 du build, URL DÉPLOYÉE. Un socle encore modifié n'est pas testable : finir l'activité qui le construit.
2. Construire la liste fermée du vocabulaire interne depuis WP-08 (termes TRM-nn, écrans) et WP-05 (étapes) ; l'écrire dans pare-feu.yaml.
3. Écrire les personas — une fiche de faits de vie par PER-nn de WP-04, avec ses verbatims, rendue en prose ; contrôle de cohérence fiche ↔ prose — et les missions, avec les mots de l'utilisateur et leur arrêt naturel. Passer le filtre : aucun mot de l'interface.
4. Écrire protocole.md et plan-de-campagne.yaml AVANT toute session ; aucun score, aucun seuil ; déclarer la corrélation des sessions.
5. Pour chaque session : écrire l'entrée du manifeste — empreintes du persona et de la mission, point d'entrée, horodatage — PUIS lancer l'agent utilisateur en contexte FRAIS, qui pilote le socle avec un navigateur réel, une capture par action, pense à voix haute, et s'arrête quand il le juge ; entretien neutre à questions fixes.
6. Indexer les preuves brutes (resultats/index.yaml, sha256 par fichier) : à partir de là, elles sont immuables.
7. Observateur, une session à la fois : passe O1 à l'aveugle, figée ; puis O2. Chercheur : patterns R1 à l'aveugle — sessions qui montrent, qui contredisent, citations, fréquence en « k sur N sessions synthétiques », valeurs aberrantes gardées —, figés ; puis R2.
8. Triage (factory-lead) : chaque constat routé vers WP-05, WP-08 ou WP-10, ou classé ARRET_ATTENDU, HORS_CHAMP, SANS_SUITE. Un champ ABSENT du corpus donne un ARRÊT ATTENDU, jamais un défaut.
9. Lancer apf check : K7 rejoue SUX1 à SUX6 sur les octets ; zéro constat avant de rendre la main.
10. Une correction est une mutation séparée qui produit un NOUVEAU candidat ; la régression rejoue les MÊMES personas et missions sur lui, dans une nouvelle campagne liée au nouveau sha256.

## Activités outillées

| Activité | Nom | Responsible | Accountable |
|---|---|---|---|
| 11 | Test d'expérience synthétique du socle | `quality-engineer et factory-lead` | `product-lead` |
| 17 | Validation utilisateurs et convergence | `product-lead puis product-designer · quality-engineer orchestre la campagne SUX` | `Product Owner` |

Critères d'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.

## Livrables

| Livrable | Chemin | Contrôlé en |
|---|---|---|
| WP-13 — Campagne SUX du socle | `C1.4-socle/experience/sux/protocole.md · plan-de-campagne.yaml · pare-feu.yaml · resultats/ · annotations/ · synthese.md · patterns.yaml` | G0 |
| WP-22 — Validation utilisateurs et convergence | `releases/{release-id}/research/tests/test-plan.md · sux/` | G1 |

Plan de contenu et critère de complétude de chacun : **`references/livrables.md`**.

## Contrat d'entrée

Si un artefact d'entrée déclaré manque, retourner `BLOCKED — input manquant`. Ne jamais inférer : produire sur un matériau deviné donne un résultat plausible et invérifiable, ce que la méthode existe pour empêcher.

**Activité 11 — arrêt dur.** Socle exécutable DÉPLOYÉ et figé — commit et sha256 du build connus (WP-10) ; glossaire et navigation (WP-08) ; squelette (WP-05) ; personas PER-nn et verbatims (WP-04). Sans socle déployé : BLOCKED, jamais un test sur un fichier local.

Ces inputs se RECUEILLENT auprès d'un humain, dans la salve unique de quatre questions au maximum (EX2). Ne jamais les dériver du nom du dépôt, du contexte de la session, ni d'un fichier existant.

## Vérification avant handover

Partir du squelette rendu par `apf template <WP-nn>` : il porte les sections du registre dans l'ordre, la règle et le guide de chacune, et le critère de complétude. Ne jamais renommer ni omettre un H2 — le titre est une clé.

Chaque livrable existe au chemin déclaré, porte toutes les sections de son plan de contenu et satisfait son critère de complétude.

Exécuter `apf check` TROIS fois : sur l'arbre indexé, après le commit, puis sur main après la fusion — un contrôle ne voit que la population qu'il lit, index ou commit. Toute édition après un passage le rouvre.

Pour les contrôles écrits par le projet : un test négatif mute une COPIE de fixture déclarée, jamais l'instantané vivant ; un compte publié se recalcule depuis ses lignes ; un contrôle ne rejoue pas les autres — la CI les agrège.

**Puis rendre la main** — format Office, projection dans l'espace de travail, pointeur bidirectionnel : **`references/rendre-la-main.md`**. La projection est sans objet si SOC-01 porte `workspace_kind: launchpad` : le commit est la page.

## Ne pas faire

- Écrire hors des chemins déclarés au registre : un artefact à un chemin non déclaré est invisible à la gouvernance et fait échouer K2.
- Franchir un gate ou déclarer un livrable approuvé. Ce skill prépare la décision, il ne la prend pas.
- Modifier un CORE INVARIANT du socle depuis une cadence autre que C1. Émettre un finding et router vers G0 (EX3).
