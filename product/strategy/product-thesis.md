---
id: WP-03
name: "Thèse produit"
produced_by: "2"
controlled_at: "G0"
completion: partiel
reserves: ["§ Critère d'abandon reste BLOCKED — EX2 cas 1 : « critère d'abandon » est cité nommément parmi les trois cas qui restent bloqués quel que soit le RUN MODE. Q4 sans réponse au 2026-09-21.", "Le sponsor a énoncé une SOLUTION (un site, un dashboard, du COD, Telegram) et non un problème. Le problème côté acheteur est reconstruit en hypothèse explicite, jamais en fait.", "Toute affirmation de marché est UNVALIDATED : la recherche web est accordée aux activités 3, 4, 9 et 27, pas à l'activité 2.", "Q2 et Q3 sans réponse : converties en hypothèses nommées sous EX2 run_mode_solo."]
---

# WP-03 — Thèse produit

> **Ouazzani design — vente en ligne de raquettes de padel au Maroc**, opérée par son
> propriétaire, avec paiement à la livraison et pilotage par tableau de bord.

### Statut épistémique de ce document

Un seul fait établi : **l'intention du sponsor**. Tout le reste — le joueur, le marché, le
coût du statu quo — est reconstruit en hypothèse nommée, comme `EX2.run_mode_solo` l'autorise
en RUN MODE SOLO, et comme il l'exige : nommée, étiquetée, falsifiable, avec un point de test.
Rien ici n'est présenté comme su.

## Problème

**Ce qui a été dit, littéralement** — A. Benyahya, Product Owner, 2026-09-21 :

> « je veux monter un site de vente de raquettes de padel au maroc je suis l'owner du site et
> je veux avoir la possibilité d'une dashboard pour piloter les ventes, les commandes se gerent
> en paiement à la livraison avec reception d'information sur telegram »

**Ce que cet énoncé est, et ce qu'il n'est pas.** C'est une **solution**, décrite avec son
canal, son mode de paiement et son outillage d'exploitation. Ce n'est pas un problème : il ne
dit de qui, ni ce que cette personne fait aujourd'hui, ni ce que ça lui coûte. Le registre
demande les quatre. Je les reconstruis ci-dessous **en hypothèses**, et je ne les promeus pas.

**Le client est le sponsor lui-même** — réponse explicite à Q1. Conséquence épistémique, et
elle est lourde : il n'y a **aucune demande externe** derrière ce produit. La source
d'opportunité qualifiée « demande client réelle » à l'ouverture se révèle être une conviction
du propriétaire. C'est parfaitement recevable — la plupart des produits commencent ainsi — mais
l'étiquette change, et avec elle la charge de la preuve : rien n'a encore été validé par
quelqu'un qui paierait.

| Volet du problème | Énoncé | Étiquette | Trace |
|---|---|---|---|
| **De qui** | Un joueur de padel au Maroc qui veut acheter une raquette | `UNVALIDATED` | HYP-01 |
| **Comment on le sait** | On ne le sait pas. Le sponsor est le seul informant, et il est le vendeur, pas l'acheteur | `UNVALIDATED` | HYP-01 |
| **Ce qu'il fait aujourd'hui** | Q2 sans réponse. Candidats non départagés : grande surface de sport, vendeur Instagram/WhatsApp, achat en club, import personnel, voyage | `UNVALIDATED` | HYP-02 |
| **Ce que ça lui coûte** | Q2 sans réponse. Délai, prix, incertitude sur l'authenticité, impossibilité d'essayer — aucun chiffré | `UNVALIDATED` | HYP-03 |

**Le problème du propriétaire, lui, est énoncé et vérifiable** : il n'a aucun moyen de piloter
des ventes qui n'existent pas encore. C'est un vrai besoin, mais c'est le besoin de
l'**opérateur**, pas de l'acheteur. Un produit qui ne résout que le problème de celui qui le
construit n'a pas de marché ; il a un propriétaire satisfait.

## Cible

**Ce produit a deux utilisateurs, et l'un d'eux est le sponsor.** Les confondre est le défaut
le plus courant de cette classe de produit — et le plus coûteux, parce que l'utilisateur qui
sait dire ce qu'il veut est celui dont la satisfaction ne fait pas vivre le produit.

**Cible A — l'acheteur.** Une personne descriptible : joueur de padel au Maroc, pratiquant en
club, qui remplace ou achète une raquette. Ni son nombre, ni sa répartition géographique, ni
son pouvoir d'achat, ni son mode d'accès actuel ne sont établis — Q3 est sans réponse.
`UNVALIDATED`, HYP-01 et HYP-04. **C'est la cible dont dépend l'existence du produit.**

**Cible B — l'opérateur.** A. Benyahya, propriétaire et, en l'état, unique exploitant. Une
personne, connue, disponible. C'est l'utilisateur du tableau de bord et du canal Telegram. Son
existence est un `FAIT` ; sa capacité de traitement — combien de commandes par jour une seule
personne absorbe — est `UNVALIDATED`, HYP-07.

**Comment on atteint la cible A :** non établi. Aucun canal d'acquisition n'a été évoqué. Un
site sans canal d'acquisition est une vitrine dans un désert ; c'est HYP-04, et c'est un
`UNVALIDATED` qui décide du produit autant que le produit lui-même.

## Proposition de valeur

**Ce qui change le lendemain, pour l'acheteur** — `UNVALIDATED`, HYP-02/HYP-03 : il commande
une raquette identifiée, à un prix affiché, et la paie à la livraison sans avancer d'argent ni
négocier par messagerie. **Ce qu'il arrête de faire** : reconstituer une offre par Instagram,
WhatsApp ou le bouche-à-oreille de club.

**Ce qui change le lendemain, pour l'opérateur** — `FAIT` quant à l'intention : il reçoit
chaque commande sur Telegram et lit l'état de ses ventes sur un tableau de bord. **Ce qu'il
arrête de faire** : reconstituer cet état de mémoire ou dans un tableur.

**La tension centrale, et elle est structurelle.** Le paiement à la livraison déplace le risque
du client vers le vendeur : l'acheteur ne s'engage financièrement qu'au moment de recevoir, et
peut refuser. La proposition de valeur côté acheteur *repose* sur ce mécanisme — c'est
précisément ce qui lève sa méfiance — et l'économie du produit en *dépend* en sens inverse. Ce
n'est pas un détail d'implémentation mentionné en passant : c'est le choix qui décide si ce
produit gagne de l'argent. HYP-05.

## Alternative et statu quo

**Ce qui se passe si on ne fait rien.** Le sponsor ne vend pas de raquettes ; l'acheteur
continue de faire ce qu'il fait — que nous ne savons pas. Le statu quo n'est donc pas
documenté, il est supposé.

**Qui d'autre résout ça.** Non établi. Des catégories d'alternatives sont plausibles — grandes
surfaces de sport présentes au Maroc, revendeurs sur réseaux sociaux, boutiques de clubs,
marketplaces généralistes, sites étrangers livrant au Maroc. **Aucune n'est vérifiée, aucune
n'est citée, et je n'en nomme aucune.** La recherche web est accordée aux activités 3, 4, 9 et
27 ; l'activité 2 ne la porte pas, et le registre en donne le motif : chercher depuis l'activité
où l'on rédige sert à justifier ce qu'on vient d'écrire. `UNVALIDATED`, HYP-06 — point de test
à l'activité 3 (WP-06, profil de domaine et sources approuvées).

**Pourquoi celle-ci gagnerait.** Aucune raison établie. Les avantages candidats — spécialisation
sur une catégorie unique, prix affiché, paiement à la livraison, conseil d'expert — sont tous
des hypothèses, et deux d'entre elles sont imitables en une semaine par n'importe quel
concurrent existant. **C'est la faiblesse la plus sérieuse de cette thèse à ce stade**, et elle
ne se lèvera pas par la rédaction : elle se lèvera à l'activité 3, ou pas.

## Critère d'abandon

**BLOCKED — EX2 cas 1.** Q4 est sans réponse au 2026-09-21. `EX2.run_mode_solo` cite « critère
d'abandon » parmi les trois cas qui restent bloqués quel que soit le RUN MODE : c'est une
décision que seul l'humain qui répond du produit peut prendre, et le mode SOLO ne la convertit
pas en hypothèse.

**Attendu, en trois éléments :** quel résultat ferait renoncer · qui le prononce · à quelle date
on regarde.

**Pourquoi cette section n'est pas une formalité.** Sans elle, ce produit n'a pas de condition
de sortie, seulement une durée — et un projet sans condition de sortie ne s'arrête pas : il
s'étiole en consommant l'attention de la seule personne qui l'opère. Le coût d'un critère
d'abandon écrit est une ligne ; le coût de son absence est un an.

**Ce que je ne ferai pas :** proposer un seuil plausible — « moins de N commandes sur M mois » —
que vous n'auriez qu'à ratifier. Un critère d'abandon suggéré par celui qui construit le produit
est un critère qu'on ne s'applique pas.

## Journal d'interrogatoire

**Salve unique — 2026-09-21.** EX2 n'en autorise qu'une ; elle s'est déroulée en trois temps.

| Temps | Question | Réponse | Statut |
|---|---|---|---|
| 1 | Source d'opportunité | « une demande client réelle » | **tranchée, puis corrigée au temps 3** : le client est le sponsor. Ce n'est pas une demande externe |
| 1 | Nature du produit | « produit numérique » | **tranchée** |
| 2 → 3 | **Q1** — qui a demandé, quand, dans quels mots | Le sponsor, propriétaire du site, 2026-09-21, verbatim au § Problème | **tranchée** |
| 2 | **Q2** — que fait cette personne aujourd'hui, ce que ça lui coûte | — | **basculée `UNVALIDATED`** → HYP-02, HYP-03 |
| 2 | **Q3** — combien, et comment on les atteint | — | **basculée `UNVALIDATED`** → HYP-01, HYP-04 |
| 2 | **Q4** — ce qui ferait renoncer | — | **BLOCKED**, EX2 cas 1 — non basculable |

### Branches tranchées, avec motif

| Branche | Tranchée | Motif |
|---|---|---|
| Produit numérique ou vitrine | **produit numérique** | Commandes, stock et pilotage : il y a un état à tenir, donc un modèle de données et des parcours — l'appareil complet de la méthode s'applique |
| Une catégorie ou un assortiment | **une catégorie — raquettes de padel** | Énoncé sans ambiguïté par le sponsor. Conséquence portée au socle : le modèle de données doit rester extensible à d'autres catégories sans rouvrir G0, sous peine de payer un CORE INVARIANT plus tard (EX3) |
| Paiement en ligne ou à la livraison | **à la livraison** | Décision du sponsor. Structurante : elle déplace le risque financier sur le vendeur (HYP-05) et rend le taux d'acceptation à la livraison une métrique de survie, pas de confort |
| Canal d'exploitation | **Telegram** | Décision du sponsor. Réduit le besoin d'un back-office temps réel en V1 — HYP-08 sur sa suffisance |
| Qui opère | **le propriétaire, seul** | Déduit de « je suis l'owner » et du RUN MODE SOLO. Plafonne le débit de commandes traitables — HYP-07 |

### Branches basculées en `UNVALIDATED`

HYP-01 à HYP-08, détaillées en WP-05 avec critère de falsification, étiquette, point de test et
porteur. Aucune n'est un ornement : quatre d'entre elles — HYP-01, HYP-04, HYP-05, HYP-06 —
tuent le produit si elles sont fausses.

### Décision implicite restante

**Une seule, et c'est Q4.** Le critère de complétude de ce livrable exige qu'aucune décision
implicite ne subsiste. Elle subsiste. Le livrable est donc `partiel`, et le restera jusqu'à
réponse — escalade **N2, Product Owner**, reportée.

<!-- Complétude : Aucune décision implicite ne subsiste. Chaque affirmation matérielle porte sa source et son étiquette épistémique. Le critère d'abandon est écrit. -->
