---
id: WP-06
name: "Profil de domaine et sources approuvées"
produced_by: "3"
controlled_at: "G0"
completion: partiel
reserves: ["BLOCKED sur le critère d'entrée de l'activité 3 — « accès aux sources réglementaires ou professionnelles ». La politique réseau de l'environnement bloque TOUTE lecture de page : WebFetch rend EGRESS_BLOCKED sur chaque domaine essayé, curl direct rend 000. Seule la recherche reste possible, et elle ne donne ni citation littérale ni page lue.", "AUCUNE règle métier n'est établie. Toutes sont INCONNU et routées, jamais comblées — la tour confirme le verdict : sans citation littérale, une affirmation est UNVALIDATED (factory_source_claim, 2026-09-21).", "Les sources listées sont des CANDIDATES : adresse réelle et date de repérage, mais aucune n'a été lue. Une source non lue n'est pas une source approuvée.", "Levée : autoriser les domaines dans la politique d'egress de l'environnement, ou fournir les documents dans le dépôt."]
---

# WP-06 — Profil de domaine et sources approuvées · domain-profile.md

> **Activité 3 BLOCKED sur son critère d'entrée.** Ce document dit ce qui est établi — très
> peu — et nomme le reste `INCONNU`. Il ne comble rien.

### Le blocage, et sa preuve

Le critère d'entrée de l'activité 3 exige « accès aux sources réglementaires ou
professionnelles ». Il n'est pas satisfait.

| Tentative | Résultat, 2026-09-21 |
|---|---|
| `WebFetch` sur `padelset.ma`, `wipo.int`, `jurispromaroc.com`, `cndp.ma`, `fr.wikipedia.org` | `EGRESS_BLOCKED` — « Access to <domaine> is blocked by the network egress proxy » |
| `curl` direct sur `cndp.ma`, `frmt.ma`, `cmi.co.ma`, `khidmat-almostahlik.ma`, `fr.wikipedia.org` | code HTTP `000` sur les cinq |
| `WebSearch` | **fonctionne** — rend des titres et des adresses réelles, et une synthèse rédigée par un modèle |

**Ce que la recherche ne donne pas.** Une synthèse de résultats de recherche n'est pas une
lecture de page : elle ne fournit aucune citation littérale dont un tiers puisse vérifier
qu'elle figure bien dans la source. Le registre tranche ce cas nommément — « J'ai cherché sur
Internet produit une affirmation aussi invérifiable qu'une invention, et plus dangereuse, parce
qu'elle est plus confiante ». La tour de contrôle rend le même verdict, interrogée le
2026-09-21 :

```
factory_source_claim {url, consulted_at}  sans verbatim
→ verdict: UNVALIDATED · missing: ["verbatim"]
```

**Conséquence assumée : ce livrable ne contient aucun fait de domaine.** Ni un nombre de clubs,
ni un nombre de licenciés, ni un article de loi, ni un taux de refus sectoriel. J'en ai vu
passer dans les résultats de recherche ; les rapporter ici en les habillant d'une URL que je
n'ai pas lue serait précisément la fiction confiante que la méthode existe pour empêcher.

## Profil de l'industrie

**Secteur — `FAIT` par déclaration du sponsor, non par source externe.** Vente au détail en
ligne d'équipement sportif, catégorie unique : raquettes de padel. Marché géographique : Maroc.
Modèle : boutique mono-catégorie opérée par une personne, paiement à la livraison. Source :
WP-03, verbatim daté du 2026-09-21. C'est un fait sur *l'intention*, pas sur le marché.

**Taille des acteurs, cycle économique, structure de la distribution — `INCONNU`.** Aucune
source lue. Trois questions restent entières : combien de clubs et de licenciés de padel au
Maroc, quelle saisonnalité, et qui vend déjà des raquettes — grande distribution sportive,
revendeurs sociaux, clubs, import direct. Ces trois inconnues portent HYP-01 et HYP-06, les
deux hypothèses létales que l'activité 3 devait précisément faire bouger.

**Régulateur — `INCONNU` quant à la portée exacte, partiellement identifié quant aux
institutions.** Quatre autorités sont *nommables* sans être documentées : la **CNDP** pour les
données personnelles, le **Ministère de l'Industrie et du Commerce** pour la protection du
consommateur, l'**Office des changes** et la **Douane** pour l'import, la **DGI** pour la
fiscalité. Aucune de leurs obligations n'est établie ici. Les nommer n'est pas les documenter,
et la distinction est le sujet de ce livrable.

**Langue métier — partiellement observable, non figée.** Le vocabulaire du padel est
majoritairement espagnol et anglais — *pala*, *bandeja*, *vibora*, *overgrip* — dans un marché
qui parle français, arabe et darija. **C'est un enjeu de WP-11 (glossaire utilisateur), pas un
détail de traduction** : le terme qu'un joueur marocain emploie pour chercher une raquette
décide de la navigation, de l'architecture de l'information et du référencement. Il se recueille
auprès des joueurs à l'activité 4, pas ici.

### Ce que l'activité 3 devait produire et n'a pas produit

| Attendu | État |
|---|---|
| Ordre de grandeur du marché — clubs, licenciés, renouvellement | `INCONNU` — HYP-01 reste `UNVALIDATED` |
| Recensement des acteurs servant déjà cette demande | `INCONNU` — HYP-06 reste `UNVALIDATED` |
| Taux de refus sectoriel en paiement à la livraison | `INCONNU` — HYP-05 et HYP-10 restent `UNVALIDATED`, et `a*` non calculable |
| Obligations légales du vendeur en ligne | `INCONNU` — voir `rules.md` |
| Critic métier éprouvé sur un cas vérifiable | **impossible** — voir WP-07 |

**Quatre des six hypothèses létales devaient bouger ici. Aucune n'a bougé.**

<!-- Complétude : Chaque règle cite une source datée. Les UNKNOWNs sont routés, pas comblés. -->
