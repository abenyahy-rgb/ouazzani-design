---
id: WP-06
name: "Profil de domaine et sources approuvées"
produced_by: "3"
controlled_at: "G0"
completion: partiel
reserves: ["BLOCKED sur le critère d'entrée de l'activité 3 — « accès aux sources réglementaires ou professionnelles ». La politique réseau de l'environnement bloque TOUTE lecture de page : WebFetch rend EGRESS_BLOCKED sur chaque domaine essayé, curl direct rend 000. Seule la recherche reste possible, et elle ne donne ni citation littérale ni page lue.", "AUCUNE règle métier n'est établie. Toutes sont INCONNU et routées, jamais comblées — la tour confirme le verdict : sans citation littérale, une affirmation est UNVALIDATED (factory_source_claim, 2026-09-21).", "Les sources listées sont des CANDIDATES : adresse réelle et date de repérage, mais aucune n'a été lue. Une source non lue n'est pas une source approuvée.", "Levée : autoriser les domaines dans la politique d'egress de l'environnement, ou fournir les documents dans le dépôt."]
---

# WP-06 — Profil de domaine et sources approuvées · sources.md

## Sources approuvées

**Aucune.** Une source approuvée est une source *lue*, datée, et citable littéralement. Aucune
n'a pu être lue le 2026-09-21.

Ce qui suit est un **registre de candidates** : adresses réelles, relevées par recherche, avec
ce que chacune devra établir. Une candidate n'est pas une source, et aucune règle ne peut s'y
adosser tant qu'elle n'a pas été lue.

| Réf. | Candidate | Autorité | Adresse | Repérée le | Doit établir | Lue ? |
|---|---|---|---|---|---|---|
| CAND-01 | Loi 31-08 — protection du consommateur, texte intégral | Réglementaire | `wipo.int/wipolex/en/legislation/details/19773` | 2026-09-21 | Obligations d'information précontractuelle, délai de rétractation en vente à distance, exceptions de l'article 38 | **non** — `EGRESS_BLOCKED` |
| CAND-02 | Portail Khidmat Al Moustahlik | Réglementaire | `khidmat-almostahlik.ma` | 2026-09-21 | Lecture officielle des droits du consommateur en vente à distance | **non** — HTTP 000 |
| CAND-03 | CNDP — lignes directrices de conformité des sites web à la loi 09-08 | Réglementaire | `cndp.ma/wp-content/uploads/2023/01/CNDP-guide-conformite-sites-web-fr.pdf` | 2026-09-21 | Déclaration préalable des traitements, mentions obligatoires, droits des personnes, sanctions | **non** — `EGRESS_BLOCKED` |
| CAND-04 | CNDP — dépliant loi 09-08 | Réglementaire | `cndp.ma/wp-content/uploads/2023/01/CNDP-depliant-fr.pdf` | 2026-09-21 | Périmètre des traitements soumis à déclaration | **non** |
| CAND-05 | Fédération Royale Marocaine de Tennis — section padel | Professionnelle | `frmt.ma` · `w2023.frmt.ma/category/padel/` | 2026-09-21 | Nombre de clubs et de licenciés, structuration de la pratique — **socle de HYP-01** | **non** — HTTP 000 |
| CAND-06 | Panorama des clubs de padel au Maroc | Professionnelle | `padelset.ma/blog/Clubs_Padel_Maroc_Evolution_Perspectives_Avenir` | 2026-09-21 | Répartition géographique et dynamique d'ouverture des clubs. **Source secondaire** : à recouper avec CAND-05, jamais seule | **non** — `EGRESS_BLOCKED` |
| CAND-07 | Centre Monétique Interbancaire — rapports d'activité e-commerce | Professionnelle | `cmi.co.ma` | 2026-09-21 | Part du paiement en ligne au Maroc, donc **par complément** le poids du paiement à la livraison | **non** — HTTP 000 |

### Ce que ce registre vaut, et ce qu'il ne vaut pas

**Il vaut** comme plan de sourçage : sept adresses réelles, chacune rattachée à ce qu'elle doit
établir et à l'hypothèse qu'elle fait bouger. Le travail de repérage est fait.

**Il ne vaut rien** comme fondement de règle. Aucune ligne de `rules.md` ne cite un `SRC-nn`,
parce qu'aucun `SRC-nn` n'existe : la numérotation `CAND` est délibérément distincte, pour
qu'aucune règle ne puisse s'y adosser par inadvertance.

### Règle d'indépendance, applicable dès la levée du blocage

Deux sources ne sont indépendantes que si la seconde ne dérive pas de la première. CAND-06 est
secondaire et reprend vraisemblablement des données fédérales : **elle ne comptera jamais comme
second témoin de CAND-05.** C'est exactement le défaut qui a valu deux refus à WP-02 ; il est
anticipé ici plutôt que constaté plus tard.

<!-- Complétude : Chaque règle cite une source datée. Les UNKNOWNs sont routés, pas comblés. -->
