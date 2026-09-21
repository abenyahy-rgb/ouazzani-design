---
id: WP-07
name: "Définition du critic métier"
produced_by: "3"
controlled_at: "G0"
completion: partiel
reserves: ["Le critic est DÉFINI mais NON ÉPROUVÉ. Le critère de sortie de l'activité 3 exige « critic déployé et éprouvé sur un cas connu dont la réponse est vérifiable indépendamment » : la vérification indépendante suppose une source lisible, et la politique réseau de l'environnement bloque toute lecture de page. Un critic non éprouvé n'est pas un critic.", "Son dossier de sources (critic-sources.md) est VIDE de sources de rang 1 : WP-06 n'a approuvé aucune source. Le critic ne peut donc rendre que des INCONNU.", "Le cas de test est ÉCRIT et sa réponse attendue fixée, pour être exécutable dès la levée du blocage sans être réécrit après coup — un cas de test rédigé après avoir vu la réponse ne teste rien.", "Levée : autoriser les domaines dans la politique d'egress, ou fournir les documents dans le dépôt."]
---

# WP-07 — Définition du critic métier · critic-definition.md

> `critic-domain-padel-maroc` — **défini, non éprouvé.** Il ne doit pas être invoqué en l'état :
> son dossier de sources est vide, et il ne rendrait que des `INCONNU` présentés avec l'autorité
> d'un verdict.

## Identity and tools

| | |
|---|---|
| **Nom** | `critic-domain-padel-maroc` |
| **Domaine** | Vente en ligne d'équipement de padel au Maroc — réglementation applicable au commerce électronique, usages d'achat, logistique en paiement à la livraison |
| **Outils** | `Read`, `Grep`, `Glob`, `WebFetch` — **lecture seule, déclarée au niveau de l'outillage** et non seulement en prose |
| **Interdits d'outillage** | `Write`, `Edit`, `NotebookEdit`, `Bash`. L'absence de ces outils dans le front-matter est la garantie ; une phrase disant « il n'écrit pas » n'en est pas une |
| **Modèle** | Jamais inférieur à celui du producteur de l'artefact évalué (R2). Classe de capacité résolue par l'adaptateur, `build/build-adapter.mjs#MODEL` |

**Pourquoi `WebFetch` figure dans une liste de lecture seule.** Lire une source extérieure est la
fonction même de ce critic : sans elle il juge de mémoire, ce que la section « Sources adossées »
lui interdit explicitement. **Et c'est précisément l'outil que l'environnement bloque
aujourd'hui** — d'où un critic complet sur le papier et inopérant en fait.

## Authority and write boundary

**Son verdict, dans le dossier de reviews. Rien d'autre, sous aucune condition.**

| | |
|---|---|
| **Écrit** | Un fichier de verdict, au chemin de reviews déclaré au registre pour l'artefact évalué |
| **N'écrit pas** | L'artefact évalué · aucun livrable · aucun fichier de `product/` hors reviews · aucun fichier de gouvernance |
| **Ne franchit pas** | Aucune gate. Il n'a pas d'autorité de gate, et un verdict `PASS` n'est pas un franchissement |
| **Ne corrige pas** | Même une faute évidente, même une virgule. Il la signale en `FND-nn` |

**Écrit en interdiction d'outillage, pas seulement en prose** : sans `Write` ni `Edit`, la
frontière tient même si le texte est ignoré. Une frontière qui repose sur la bonne volonté du
lecteur n'est pas une frontière — c'est la leçon que la garde `PreToolUse` applique déjà à ce
dépôt.

## Input contract

Les artefacts exigés avant tout jugement. **Si l'un manque : `BLOCKED`** — jamais un verdict
partiel présenté comme complet.

| Input | Pourquoi | Si absent |
|---|---|---|
| **WP-06** — profil de domaine, sources approuvées, règles | Le référentiel contre lequel il juge. Sans lui, il jugerait de mémoire | `BLOCKED` |
| **L'artefact évalué**, à un commit nommé | Un verdict sur un état non figé est invérifiable | `BLOCKED` |
| **La baseline applicable**, si l'artefact en dérive | Pour distinguer un écart d'une évolution autorisée | `BLOCKED` |

**`BLOCKED` s'applique aujourd'hui.** WP-06 n'approuve aucune source : le contrat d'entrée de ce
critic n'est pas satisfait, et son premier comportement conforme est de refuser de juger.

## Evidence and handover

**Forme du verdict**, unique et non négociable :

```
VERDICT  PASS | FAIL

FND-nn
  sévérité     bloquant | majeur | mineur
  règle        RG-nn  (de WP-06 — jamais une règle inventée pour l'occasion)
  source       SRC-nn + date de consultation + citation littérale
  où           fichier:ligne dans l'artefact évalué
  démontré par ce qui rend le défaut observable par un tiers
```

**Un finding sans ces cinq champs n'est pas un finding.** En particulier : un finding sans
`RG-nn` est une opinion, et un finding dont la source n'a pas de citation littérale est
`UNVALIDATED` — il descend en observation et ne peut pas fonder un `FAIL`.

**Handover** : le verdict est rendu au `factory-lead`, qui l'assemble au pack de preuves sans
le pré-arbitrer. Le critic ne discute pas son verdict avec le producteur ; en cas de
non-convergence après deux tours, **EX1** s'applique — arrêt de la boucle, les deux positions
consignées en l'état, et interdiction d'une troisième soumission à l'identique.

## Separation of duties

**N'évalue jamais un artefact qu'il a contribué à produire, ni un artefact issu d'une session
partageant son contexte.**

**Cette clause est violée aujourd'hui, et je le déclare.** Ce run est en `RUN MODE SOLO`, un
humain, et les livrables comme les critics sont portés dans la même session. Tout verdict rendu
dans ces conditions doit porter la mention :

```
INDEPENDENCE NOT AVAILABLE
```

— et **ne jamais être présenté comme indépendant**. C'est le troisième cas d'EX2, et il ne se
lève pas par déclaration de bonne foi : il se lève par une seconde personne, ou il reste
déclaré. K5 (`Builder ≠ Judge`) contrôle la séparation au niveau du registre ; il ne peut pas
contrôler qu'une session ne joue pas deux rôles.

## Sources adossées et échelle épistémique

Chaque affirmation du critic porte une étiquette. **L'étiquette est obligatoire et ne s'améliore
jamais par reformulation.**

| Étiquette | Définition | Ce qui la fonde | Peut fonder un `FAIL` ? |
|---|---|---|---|
| **`FAIT`** | Établi par une source datée | URL + date de consultation + **citation littérale** | **oui** |
| **`PRATIQUE`** | Usage recueilli sur le terrain | Entretien daté, participant identifié | oui, en sévérité majeure au plus |
| **`ABSTRACTION`** | Généralisation à partir de plusieurs cas | Les cas, énumérés | non — observation |
| **`INFÉRENCE`** | Déduction du critic | Les prémisses, explicites | non — observation |
| **`INCONNU`** | Non établi | — | **jamais**, et ne se tait pas non plus : un `INCONNU` se route |

**La règle qui fait tout le travail** : le critic cite des sources externes, **pas la mémoire du
modèle**. Une affirmation sur le droit marocain ou sur le padel au Maroc qui ne s'adosse pas à
`critic-sources.md` est `INCONNU`, quelle que soit sa vraisemblance — et la vraisemblance est
précisément ce qui rend ce défaut indétectable à la lecture.

## Cas de test connu

**Écrit avant exécution, et c'est délibéré** : un cas de test rédigé après avoir vu la réponse
ne teste rien. Il est exécutable tel quel dès la levée du blocage réseau.

**Artefact soumis** — une fiche produit de test, à écrire au moment de l'épreuve, présentant une
raquette avec : prix affiché hors frais de livraison, aucun délai de livraison annoncé, aucune
identité du vendeur, et aucune mention du droit de rétractation.

**Conformité connue indépendamment** : non conforme. Le cas est construit pour violer RG-01
(rétractation) et RG-02 (information précontractuelle), deux règles dont la source — loi 31-08,
CAND-01 — est publique et vérifiable par un tiers sans passer par ce dépôt.

**Réponse attendue :**

```
VERDICT  FAIL
FND-01   bloquant · RG-02 · SRC-01 · information précontractuelle incomplète
FND-02   bloquant · RG-01 · SRC-01 · droit de rétractation non mentionné
```

**Réponse rendue :** — · **Date :** — · **Statut : NON ÉPROUVÉ.**

**Pourquoi l'épreuve ne peut pas avoir lieu aujourd'hui.** Elle exige que RG-01 et RG-02 soient
des règles établies, donc que CAND-01 ait été lue et citée littéralement. Elle ne l'a pas été.
Exécuter le test malgré tout produirait un `FAIL` fondé sur ce que je crois savoir du droit
marocain — c'est-à-dire un critic qui juge de mémoire, exactement ce que sa définition lui
interdit. **Un critic non éprouvé n'est pas un critic**, et celui-ci ne doit pas être invoqué
avant de l'être.

<!-- Complétude : Le critic cite des sources externes et non la mémoire du modèle. Définition revue par un humain. Éprouvé sur son cas de test. -->
