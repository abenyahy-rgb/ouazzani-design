---
id: WP-04
name: "Outcomes"
produced_by: "2"
controlled_at: "G0"
completion: partiel
reserves: ["Cibles et échéances DÉRIVÉES du critère d'abandon du sponsor (100 raquettes acceptées à M+6 après mise en service). Une seule reste BLOCKED : le seuil de taux d'acceptation a*, dont la FORMULE est établie mais dont les termes m (marge unitaire) et c (coût d'un refus) sont inconnus — U-08, HYP-10.", "Le critère d'abandon porte sur un VOLUME et non sur une marge : il est atteignable en perdant de l'argent. Le compléter relève d'EX2 cas 1 et reste une décision du Product Owner.", "Les valeurs actuelles sont inconnues : le statu quo de l'acheteur n'est pas documenté (Q2 sans réponse). Chacune est déclarée « inconnue » et devient une mesure du plan de recherche, jamais une estimation.", "Interprétation déclarée de « mesurable aujourd'hui » : l'INSTRUMENT de mesure doit exister sans qu'on construise le produit ; la valeur, elle, peut être nulle ou inconnue. Un outcome dont l'instrument n'existerait qu'une fois le produit construit est REJETÉ.", "OUT-04 et OUT-05 sont REJETÉS avec motif, non reformulés."]
---

# WP-04 — Outcomes

> Cinq candidats. **Trois retenus, deux REJETÉS** — le registre impose le rejet, jamais la
> reformulation : un outcome non instrumentable qu'on reformule devient un outcome
> instrumentable en apparence.

### Interprétation déclarée de « mesurable aujourd'hui »

Le critère exige « mesurable aujourd'hui avec ce qui existe, sans construire le produit ». Pris
au pied de la lettre sur un produit qui n'existe pas, il rejetterait tout — et un contrôle qui
rejette tout ne contrôle rien. **Lecture retenue, et elle est opposable :** c'est
l'**instrument** qui doit exister sans le produit, pas la valeur. Un rapport de transporteur, un
entretien, une observation de terrain sont des instruments existants. Une statistique que seul
le produit produirait n'en est pas un — et c'est ce qui fait tomber OUT-04 et OUT-05.

## OUT-nn — énoncé

Un changement observable chez quelqu'un, formulé en résultat. Aucun n'est une fonctionnalité :
le tableau de bord, Telegram et le paiement à la livraison sont des moyens, et ne figurent ici
qu'en tant que sources de donnée.

| | Énoncé | Chez qui |
|---|---|---|
| **OUT-01** | Le joueur reçoit et **accepte** la raquette qu'il a commandée, au prix affiché, sans avoir avancé d'argent ni négocié | Acheteur — cible A |
| **OUT-02** | Le joueur obtient sa raquette **plus vite qu'aujourd'hui**, et sait quand il l'aura | Acheteur — cible A |
| **OUT-03** | L'opérateur **décide son réassort sur une donnée** plutôt que de mémoire, et cesse de reconstituer l'état de ses ventes | Opérateur — cible B |
| **OUT-04** | ~~Le joueur fait davantage confiance au site qu'à un vendeur sur réseau social~~ | **REJETÉ** |
| **OUT-05** | ~~Le joueur choisit mieux sa raquette grâce au conseil du site~~ | **REJETÉ** |

**OUT-04 — REJETÉ.** Motif : aucun instrument de mesure de la confiance n'existe hors du
produit. On ne peut l'approcher que par un proxy produit — taux de retour, avis déposés — donc
en le construisant. Il est rejeté, pas reformulé : le reformuler en « taux de commandes
répétées » en ferait un outcome mesurable qui ne mesurerait plus la confiance.

**OUT-05 — REJETÉ.** Motif : « mieux choisir » suppose un référentiel de bon choix qui n'existe
pas, et sa mesure supposerait d'observer l'usage de la raquette après achat. Hors d'atteinte de
tout instrument disponible. Rejeté.

## Nombre suivi

Une grandeur, une unité, une population. Sans unité ce n'est pas un nombre ; sans population
l'unité ne porte sur rien.

| | Grandeur | Unité | Population |
|---|---|---|---|
| **OUT-01** | Taux d'acceptation à la livraison | % | Commandes **présentées** à la livraison sur une période |
| **OUT-02** | Délai commande → réception, **médiane** | jours | Commandes livrées et acceptées |
| **OUT-03** | Ruptures sur référence demandée | occurrences / mois | Références au catalogue |

La médiane, et non la moyenne, pour OUT-02 : sur de petits volumes une seule livraison
pathologique déplace une moyenne et ne dit rien de ce que vit un acheteur ordinaire.

## Valeur actuelle

Mesurée, avec source et date. **Si inconnue, écrire « inconnue » et en faire la première mesure
du plan de recherche** — jamais l'estimer.

| | Valeur actuelle | Statut |
|---|---|---|
| **OUT-01** | **Inconnue.** Aucune commande n'existe. Un ordre de grandeur de marché — taux de refus usuel du paiement à la livraison au Maroc — est nécessaire pour savoir si une cible est atteignable | Première mesure du plan de recherche · à sourcer **activité 3** (WP-06) |
| **OUT-02** | **Inconnue.** Q2 est sans réponse : ce que fait l'acheteur aujourd'hui, et en combien de temps, n'est pas documenté | Première mesure du plan de recherche · **activité 4** (WP-08), par entretien |
| **OUT-03** | **Sans objet aujourd'hui** — il n'y a ni catalogue, ni stock, ni ventes. Valeur de départ conventionnelle : 0 référence, 0 rupture | Devient mesurable à la mise en service |

**OUT-01 est le nombre qui décide de l'affaire.** Le paiement à la livraison transfère le risque
au vendeur : chaque refus coûte un aller-retour de transport et immobilise l'article. En
l'absence de tout ordre de grandeur, je ne sais pas si ce modèle est viable ici — et personne
dans ce dépôt ne le sait. C'est HYP-05.

## Valeur cible et échéance

Un seuil et une date **relative à un événement** — jamais une date calendaire flottante.
L'événement de référence est la **mise en service (G4)**, fixé par le critère d'abandon du
sponsor : « si je n'ai pas vendu 100 raquettes en 6 mois j'arrête » (WP-03, 2026-09-21).

| | Cible | Échéance | Statut |
|---|---|---|---|
| **OUT-01** | **100 commandes acceptées à la livraison**, cumulées | **M+6** après mise en service | **DÉRIVÉE** du critère d'abandon. « Vendu » est lu comme livré et accepté — lecture déclarée en WP-03 |
| **OUT-01 bis** | Taux d'acceptation **≥ a\*** = c / (m + c) | mesuré en continu, lu à **M+3** et **M+6** | **FORMULE établie, seuil BLOCKED** — m et c inconnus (U-08) |
| **OUT-02** | Médiane **strictement inférieure** à celle du statu quo, mesurée à l'activité 4 | **M+6** | **DÉRIVÉE** : un produit qui n'améliore pas le délai ne change rien à ce titre. Le nombre viendra de WP-08 |
| **OUT-03** | **0 rupture** sur une référence effectivement demandée | **M+6** | **DÉRIVÉE** : à 17 ventes par mois, une rupture sur une référence demandée est une vente perdue, et chaque vente perdue compte contre les 100 |

### Le seuil d'acceptation, et pourquoi il ne peut pas encore être chiffré

Le critère d'abandon fixe un **volume**. Il ne fixe pas de **marge**. Or en paiement à la
livraison, le résultat par commande présentée s'écrit :

```
résultat = a · m  −  (1 − a) · c

   a  taux d'acceptation à la livraison
   m  marge unitaire sur une commande acceptée
   c  coût d'un refus — transport aller ET retour, immobilisation de l'article, manutention
```

Le point mort est atteint quand `a · m = (1 − a) · c`, soit :

```
a*  =  c / (m + c)
```

La lecture est directe et elle est sévère : **plus le coût d'un refus se rapproche de la marge
unitaire, plus le taux d'acceptation exigé monte.** Si un refus coûte la moitié d'une marge, il
faut 33 % d'acceptation ; s'il coûte autant qu'une marge, il en faut 50 % ; s'il coûte le
double, 67 %. Ce n'est pas une sensibilité de second ordre : c'est la variable qui décide si ce
commerce existe.

`m` et `c` sont inconnus — **U-08**, porté à WP-02. Ils ne sont pas devinables : `m` dépend du
prix d'achat des raquettes et de la politique de prix, `c` du transporteur retenu. Les deux se
lèvent à l'**activité 9** (architecture cible et choix du transporteur) et à l'**activité 3**
(ordre de grandeur sectoriel du taux de refus). **HYP-10** porte cette hypothèse.

**Conséquence de séquencement, et elle est immédiate.** `a*` doit être calculé **avant** la mise
en service, pas constaté après : c'est un seuil de viabilité, pas un indicateur de suivi. Un
produit lancé sans `a*` connu ne peut pas savoir, au sixième mois, si ses 100 raquettes
vendues l'ont été à perte.

### Ce qui reste une décision du Product Owner

Le critère d'abandon, tel qu'énoncé, est **atteignable en perdant de l'argent**. Le compléter
d'une condition de marge — par exemple « 100 raquettes acceptées **et** résultat non négatif » —
relève d'EX2 cas 1 : c'est un arbitrage de périmètre et un critère d'abandon, deux des trois
termes que le mode SOLO ne relâche pas. La ligne reste donc ouverte, et elle se voit.

## Méthode de mesure et source de donnée

L'instrument doit exister sans le produit ; la source de donnée peut, elle, naître avec lui.

| | Instrument | Source de donnée | Existe sans le produit ? |
|---|---|---|---|
| **OUT-01** | Rapport de livraison du transporteur en paiement à la livraison — instrument standard du secteur, antérieur au produit | Relevés du transporteur, recoupés par les notifications Telegram de commande | **Oui** — le rapport existe chez tout transporteur COD ; reste à identifier lequel (activité 9) |
| **OUT-02** | Pour la valeur actuelle : entretien et observation du parcours d'achat réel (activité 4). Pour la valeur après mise en service : horodatage commande Telegram → accusé de livraison | Telegram + transporteur | **Oui** pour la mesure du statu quo — c'est ce qui le sauve du rejet |
| **OUT-03** | Comparaison entre demandes reçues et disponibilité, tenue hors produit dans un tableur si nécessaire | Canal Telegram, relevé de stock | **Oui** — Telegram et un tableur existent ; le tableau de bord automatise une mesure, il ne la crée pas |

**Conséquence pour le socle.** OUT-01 et OUT-02 s'appuient sur le transporteur : le choix du
transporteur n'est donc pas une décision logistique tardive, c'est une **dépendance de mesure**.
Un transporteur qui ne restitue pas ses taux d'acceptation rendrait OUT-01 non mesurable, et
donc le produit non pilotable sur sa métrique de survie. À porter à l'activité 9 (WP-14,
architecture cible) et à l'activité 14 (WP-23, dépendances et tiers) — c'est HYP-05.

<!-- Complétude : Chaque outcome est mesurable avec ce qui existe aujourd'hui, sans construire le produit. Un outcome non instrumentable est rejeté, pas reformulé. -->
