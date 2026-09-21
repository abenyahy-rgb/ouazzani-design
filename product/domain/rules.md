---
id: WP-06
name: "Profil de domaine et sources approuvées"
produced_by: "3"
controlled_at: "G0"
completion: partiel
reserves: ["BLOCKED sur le critère d'entrée de l'activité 3 — « accès aux sources réglementaires ou professionnelles ». La politique réseau de l'environnement bloque TOUTE lecture de page : WebFetch rend EGRESS_BLOCKED sur chaque domaine essayé, curl direct rend 000. Seule la recherche reste possible, et elle ne donne ni citation littérale ni page lue.", "AUCUNE règle métier n'est établie. Toutes sont INCONNU et routées, jamais comblées — la tour confirme le verdict : sans citation littérale, une affirmation est UNVALIDATED (factory_source_claim, 2026-09-21).", "Les sources listées sont des CANDIDATES : adresse réelle et date de repérage, mais aucune n'a été lue. Une source non lue n'est pas une source approuvée.", "Levée : autoriser les domaines dans la politique d'egress de l'environnement, ou fournir les documents dans le dépôt."]
---

# WP-06 — Profil de domaine et sources approuvées · rules.md

> **Aucune règle établie.** Une règle sans source datée est `INCONNU`, jamais `FAIT`. Les
> `INCONNU` ci-dessous sont **routés** — chacun vers sa candidate et son échéance — et non
> comblés.

## Règles métier

| Réf. | Question de règle | État | Candidate | Ce que son absence met en risque | Route |
|---|---|---|---|---|---|
| RG-01 | Délai et modalités du droit de rétractation en vente à distance | `INCONNU` | CAND-01, CAND-02 | Un parcours de retour non conforme, découvert après la mise en service. **Touche le socle** : la rétractation est une étape du parcours (WP-09), pas une page de conditions | Lever avant **activité 5** (squelette de parcours) |
| RG-02 | Information précontractuelle obligatoire — identité du vendeur, prix tout compris, délai de livraison | `INCONNU` | CAND-01 | Fiche produit et tunnel de commande non conformes. **Touche la navigation et l'IA** (WP-11), figées en G0 | Lever avant **activité 7** |
| RG-03 | Déclaration préalable des traitements de données personnelles à la CNDP | `INCONNU` | CAND-03, CAND-04 | Sanction administrative, et **modèle de données non conforme** — WP-12 est un CORE INVARIANT figé en G0 : une erreur ici se paie par une réouverture de G0 (EX3) | Lever avant **activité 7** — priorité la plus haute |
| RG-04 | Mentions obligatoires et recueil du consentement sur le site | `INCONNU` | CAND-03 | Non-conformité visible, corrigeable tardivement | Lever avant **activité 8** |
| RG-05 | Obligations fiscales et de facturation de la vente en ligne — TVA, facture, registre de commerce | `INCONNU` | aucune candidate identifiée | Sous-estimation de la marge unitaire `m`, donc **`a*` faux** : le seuil de viabilité serait calculé sur une marge surévaluée | Lever avant **activité 9** — bloque U-08 |
| RG-06 | Régime d'importation des raquettes — droits de douane, TVA à l'import, Office des changes | `INCONNU` | aucune candidate identifiée | Même effet que RG-05 sur `m` | Lever avant **activité 9** |
| RG-07 | Obligations du vendeur en paiement à la livraison — moment du transfert de propriété, sort d'un colis refusé | `INCONNU` | aucune candidate identifiée | **Porte HYP-05 et HYP-10** : le coût `c` d'un refus dépend de qui supporte le retour | Lever avant **activité 9** — bloque U-08 |

**Sept questions, zéro règle.** Trois d'entre elles — RG-03, RG-05, RG-07 — bloquent des
décisions figées en G0 ou le calcul de `a*`. Ce ne sont pas des points de conformité à traiter
en fin de parcours : ce sont des entrées du socle.

## Usages non écrits

Pratiques que personne ne documente mais que tout le monde applique. **Aucune recueillie.**

Le registre exige, pour chacune, *qui la connaît* et *comment on l'a recueillie — entretien
daté*. Je n'ai interrogé personne : la recherche utilisateur est l'activité 4, et sa capacité
d'entretien n'est pas celle de l'activité 3.

Trois zones où des usages non écrits existent vraisemblablement et décideront du produit :

- **La négociation par messagerie.** Si l'achat d'équipement sportif au Maroc passe usuellement
  par un échange WhatsApp ou Instagram avant paiement, un tunnel de commande sans canal de
  conversation sera perçu comme froid — ou comme suspect. Porte HYP-02 et HYP-09.
- **La pratique du refus à la livraison.** Un acheteur qui commande sans intention ferme, ou qui
  commande plusieurs tailles pour choisir devant le livreur, est un usage, pas une fraude. Il
  détermine `c` et donc `a*`. Porte HYP-05.
- **Le rôle du club et du coach.** Si la recommandation de raquette passe par le coach, le canal
  d'acquisition n'est pas publicitaire mais prescripteur. Porte HYP-04, hypothèse létale.

**Ces trois lignes sont des `INFÉRENCE`s, pas des `PRATIQUE`s**, au sens de l'échelle
épistémique de WP-07 : elles sont écrites ici pour orienter le protocole d'entretien de
l'activité 4, et **elles ne doivent pas y être posées comme des faits au participant** — ce
serait fabriquer la réponse qu'on cherche.

## Sanctions et autorité

Qui applique quoi en cas de violation. **Autorités nommées, sanctions `INCONNU`.**

| Domaine | Autorité nommée | Sanction | État |
|---|---|---|---|
| Données personnelles | **CNDP** — Commission nationale de contrôle de la protection des données à caractère personnel | Administrative, possiblement pénale | `INCONNU` — aucun barème lu. Des montants circulent dans les résultats de recherche ; je n'en reprends aucun, faute d'avoir lu la source |
| Protection du consommateur | **Ministère de l'Industrie et du Commerce**, et associations de consommateurs agréées | `INCONNU` | `INCONNU` |
| Fiscalité, facturation | **DGI** | `INCONNU` | `INCONNU` |
| Import | **Administration des Douanes**, **Office des changes** | `INCONNU` | `INCONNU` |
| Confiance | **L'acheteur.** Sans autorité, sans procédure, et sans recours | Abandon du panier, refus à la livraison, bouche-à-oreille négatif | La seule « sanction » dont le mécanisme est compris — et la seule qui s'applique dès la première commande |

**Le nom d'une autorité n'est pas une règle.** Ces quatre institutions sont identifiables sans
source ; ce qu'elles exigent ne l'est pas. La ligne « Confiance » est la seule du tableau qui
n'attend pas de source — et c'est la seule qui mordra au premier jour.

<!-- Complétude : Chaque règle cite une source datée. Les UNKNOWNs sont routés, pas comblés. -->
