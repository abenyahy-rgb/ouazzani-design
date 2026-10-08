---
id: WP-05
name: "Hypothèses critiques"
produced_by: "2"
controlled_at: "G0"
completion: partiel
reserves: ["HYP-01 à HYP-08 sont toutes UNVALIDATED : aucune n'a été confrontée à un utilisateur ni à une source. C'est un état honnête à l'activité 2, pas un état satisfaisant à G0.", "Les points de test de HYP-01, HYP-02, HYP-03, HYP-04, HYP-06 et HYP-10 tombent aux activités 3 et 4, qui portent la capacité de recherche que l'activité 2 n'a pas.", "HYP-05 n'a pas de point de test satisfaisant avant la mise en service : c'est la faiblesse structurelle de ce plan d'hypothèses, et elle est déclarée plutôt que masquée.", "HYP-M1 et HYP-M2 portent sur le run et non sur le produit : hors compte critique, elles ne tracent vers aucun OUT."]
---

# WP-05 — Hypothèses critiques

> Dix hypothèses produit. **Six tuent le produit si elles sont fausses** — HYP-01, HYP-04,
> HYP-05, HYP-06, HYP-09, HYP-10. Deux hypothèses de méthode suivent, hors compte.

## HYP-nn — énoncé

Ce qui doit être vrai et qu'on ne sait pas encore. Une affirmation, pas une question.

| | Énoncé | Létale ? |
|---|---|---|
| **HYP-01** | Il existe au Maroc une population de joueurs de padel assez nombreuse et assez renouvelée pour qu'une boutique **mono-catégorie** soit viable | **oui** |
| **HYP-02** | L'achat d'une raquette y passe aujourd'hui par des canaux informels ou indirects, et cela crée une gêne réelle — pas seulement une imperfection théorique | non |
| **HYP-03** | Cette gêne coûte assez cher au joueur — délai, prix, incertitude — pour qu'il change de canal | non |
| **HYP-04** | Un canal d'acquisition atteignable et soutenable existe pour toucher ces joueurs | **oui** |
| **HYP-05** | Le taux d'acceptation à la livraison en paiement à la livraison sera assez élevé pour que la marge survive au coût des refus | **oui** |
| **HYP-06** | Aucun acteur existant ne sert déjà correctement cette demande, et aucun ne peut répliquer l'offre en quelques semaines | **oui** |
| **HYP-07** | Un opérateur unique absorbe le volume de commandes visé sans dégrader le délai | non |
| **HYP-08** | Telegram suffit comme canal d'exploitation en V1 : aucun back-office temps réel n'est requis pour traiter une commande | non |
| **HYP-09** | Une raquette de padel s'achète sans l'avoir essayée, à partir d'une fiche produit | **oui** |
| **HYP-10** | La marge unitaire couvre le coût des refus au taux d'acceptation réellement obtenu : `a_observé ≥ a* = c / (m + c)` | **oui** |

*(HYP-09 porte le compte des létales à cinq, et HYP-10 à six. Elle est listée en dernier parce qu'elle est
arrivée en dernier au raisonnement, et non parce qu'elle compte moins : une raquette est un
objet de sensation — poids, équilibre, rigidité. Si le joueur exige d'essayer, la vente en
ligne ne vend que du remplacement à l'identique, ce qui est un marché, mais un autre.)*

*(HYP-10 est née du critère d'abandon, et c'est sa réponse qui l'a rendue visible : « 100
raquettes en 6 mois » fixe un volume sans fixer de marge. HYP-05 demandait si le taux
d'acceptation serait « assez élevé » — formulation sans seuil, donc non falsifiable. HYP-10 lui
donne son seuil : `a* = c / (m + c)`. Les deux sont désormais la même question, posée une fois
qualitativement et une fois avec un nombre.)*

**HYP-M1** et **HYP-M2** — hypothèses de **méthode**, hors compte critique : le mode SOLO
permettra d'atteindre G0 sans lettre de délégation hors cadence ; la projection tirée du
launchpad suffit comme espace de travail lisible.

## Trace vers OUT

L'outcome qui tombe si l'hypothèse est fausse. **Une hypothèse sans OUT n'est pas critique.**

| | Trace | Ce qui tombe |
|---|---|---|
| HYP-01 | OUT-01, OUT-02, OUT-03 | Tout. Sans population, aucun outcome n'a de sujet |
| HYP-02 | OUT-02 | Le gain de délai n'a pas d'écart à combler |
| HYP-03 | OUT-02 | Le joueur ne change pas de canal : l'outcome existe mais personne ne le réalise |
| HYP-04 | OUT-01, OUT-02 | Aucune commande n'est passée : les deux outcomes acheteur restent à zéro |
| HYP-05 | OUT-01 | OUT-01 *est* cette hypothèse mesurée. Si elle est fausse, l'outcome est atteint côté acheteur et le produit perd de l'argent à chaque unité |
| HYP-06 | OUT-01, OUT-02 | La demande est captée ailleurs |
| HYP-07 | OUT-02 | Le délai se dégrade avec le volume — l'outcome se retourne en grandissant |
| HYP-08 | OUT-03 | L'opérateur retombe sur la reconstitution manuelle |
| HYP-09 | OUT-01 | Le joueur commande puis refuse à la livraison, faute d'avoir pu essayer. **HYP-09 est un mécanisme de HYP-05** : deux hypothèses, une même conséquence |
| HYP-10 | OUT-01 bis | Le produit vend et perd de l'argent sur chaque unité. **Le critère d'abandon ne détecte pas ce cas** : il compte des raquettes, pas des dirhams |
| HYP-M1, HYP-M2 | **aucune** | Rien. Elles portent sur le run, pas sur le produit — et ne comblent donc rien |

## Critère de falsification

Au futur observable : « si l'on observe X, c'est faux ». Avec un nombre et une population.

| | Critère |
|---|---|
| **HYP-01** | Fausse si le marché accessible, estimé à partir du nombre de clubs et de licenciés relevé auprès de la fédération et des exploitants, n'admet pas **100 raquettes vendues en 6 mois** par un entrant mono-catégorie sans notoriété — seuil repris du critère d'abandon, WP-03 |
| **HYP-02** | Fausse si, sur au moins 8 joueurs interrogés, plus de la moitié déclare acheter en magasin physique local sans gêne rapportée |
| **HYP-03** | Fausse si aucun des joueurs interrogés ne chiffre un coût — délai en jours, écart de prix, achat renoncé |
| **HYP-04** | Fausse si aucun canal identifié ne permet d'atteindre un joueur à un coût inférieur à la marge unitaire d'une raquette |
| **HYP-05** | Fausse si le taux d'acceptation à la livraison observé, chez un transporteur marocain sur une catégorie de prix comparable, est tel que le coût des refus dépasse la marge sur les commandes acceptées |
| **HYP-06** | Fausse si l'on identifie au moins un acteur proposant déjà, au Maroc, un catalogue de raquettes de padel avec prix affiché et livraison — **une seule occurrence suffit à falsifier** |
| **HYP-07** | Fausse si le temps de traitement d'une commande, mesuré sur les premières, multiplié par le volume visé, dépasse le temps que l'opérateur peut y consacrer |
| **HYP-08** | Fausse si le traitement d'une commande exige de consulter ou de modifier un état que Telegram ne porte pas — stock, historique client, avoir |
| **HYP-09** | Fausse si, sur au moins 8 joueurs interrogés, plus de la moitié déclare ne pas acheter une raquette sans l'avoir prise en main |
| **HYP-10** | Fausse si le taux d'acceptation sectoriel relevé à l'activité 3 est **inférieur à `a*`**, `a*` étant calculé avec la marge unitaire et le coût de refus établis à l'activité 9. Réfutation définitive à la mise en service, sur le taux réellement obtenu |

**Le trou de HYP-01 est comblé.** Son critère exigeait un seuil qui dépendait de Q4 ; la réponse
du sponsor le fournit — 100 raquettes en 6 mois. Le nombre vient de lui, pas de moi, ce qui est
la seule manière dont un critère de falsification acquiert un seuil légitime.

**Celui de HYP-10 ne l'est pas encore**, et pour une raison différente : `a*` est une **formule
établie** dont les deux termes — marge unitaire, coût d'un refus — sont inconnus (U-08). Ce
n'est pas un trou de décision mais un trou de mesure, et il se lève aux activités 3 et 9 sans
intervention du sponsor.

## Étiquette

`EMPIRICAL` (testé avec de vrais utilisateurs) · `SYNTHETIC` (revue persona par un agent) ·
`UNVALIDATED` (conviction). L'étiquette est obligatoire et **ne s'améliore jamais par
reformulation**.

**Les dix hypothèses produit sont `UNVALIDATED`.** Aucune n'a été confrontée à un joueur, ni à
une source datée. Aucune n'est `SYNTHETIC` : je n'ai pas fait passer de revue persona, et
l'appeler ainsi serait s'attribuer un travail non fait.

HYP-M1 et HYP-M2 : `UNVALIDATED` également.

**Ce que cette colonne dit vraiment.** Dix `UNVALIDATED` dont six létales, c'est l'état normal
d'une thèse à l'activité 2 — et un état inacceptable à G0. Entre les deux, les activités 3, 4
et 16 existent pour en faire bouger l'étiquette. Aucune ne bougera par relecture.

## Point de test et porteur

Obligatoires pour toute `UNVALIDATED`.

| | Point de test | Quand | Porteur |
|---|---|---|---|
| HYP-01 | WP-06 — profil de domaine et sources approuvées ; sources datées sur la pratique du padel au Maroc | **activité 3** | product-lead, verdict `critic(domaine)` |
| HYP-02 | WP-08 — entretiens, protocole écrit AVANT recrutement | **activité 4** | product-lead |
| HYP-03 | WP-08 — mêmes entretiens, question de coût chiffré | **activité 4** | product-lead |
| HYP-04 | WP-06 pour l'existence des canaux ; WP-08 pour l'accessibilité réelle | **activités 3 et 4** | product-lead |
| HYP-05 | WP-06 pour l'ordre de grandeur sectoriel ; **confirmation seulement à la mise en service** | **activité 3**, puis **activité 26** | product-lead, puis release-engineer |
| HYP-06 | WP-06 — recensement des acteurs, une occurrence suffit | **activité 3** | product-lead, verdict `critic(domaine)` |
| HYP-07 | WP-27 — readiness de delivery, à partir du temps de traitement observé | **activité 17** | factory-lead |
| HYP-08 | WP-22 — solution design de la release | **activité 14** | principal-engineer |
| HYP-09 | WP-08 — entretiens ; puis WP-25, validation utilisateurs | **activité 4**, confirmé **activité 16** | product-lead |
| HYP-10 | WP-06 pour le taux sectoriel ; **WP-14 et WP-23 pour la marge et le coût de refus** — le calcul de `a*` doit être posé AVANT la mise en service | **activités 3 et 9**, réfutation **activité 26** | product-lead puis principal-engineer |
| HYP-M1 | Run Ledger relu déclaration par déclaration | **G0** | factory-lead |
| HYP-M2 | Première gate atteinte | **G0** | A. Benyahya, Product Owner |

### La faiblesse de ce plan, déclarée

**HYP-05 n'a pas de point de test satisfaisant avant la mise en service.** L'activité 3 peut
établir un ordre de grandeur sectoriel du taux de refus en paiement à la livraison ; elle ne
peut pas établir le vôtre, sur votre catalogue, auprès de vos acheteurs. Or c'est l'hypothèse
dont dépend l'économie du produit, et elle est adossée à une décision déjà prise en passant.

Deux conséquences à porter plus loin, et je les nomme ici parce que c'est ici qu'elles
apparaissent : la **première release doit être dimensionnée pour tester HYP-05 à faible coût**
— petit volume, stock restreint, transporteur qui restitue ses taux — plutôt que pour
maximiser le chiffre ; et le **choix du transporteur est une dépendance de mesure**, pas une
décision logistique tardive. À reprendre aux activités 10 et 11 (architecture et périmètre de
release) et à l'activité 9 (architecture cible).

<!-- Complétude : Chaque HYP trace vers un OUT et porte un critère de falsification observable. Aucune UNVALIDATED sans point de test ni porteur. -->
