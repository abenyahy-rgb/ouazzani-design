# DEV → QA → PROD, construit une fois, promu par empreinte
### ADR de départ · Départ d'architecture standard

> Décision de départ. Gardée, elle est reprise dans `C1.4-socle/decisions/adr/` et revérifiée
> sur le produit ; adaptée, réécrite sur ce qui change ; écartée, remplacée par une ADR qui dit
> pourquoi.

## ADR-07 — Un commit est construit une fois, et la même image, par son empreinte, est promue de DEV à QA puis à PROD

LOCAL → DEV → QA → PROD ; PREPROD différée. DEV est la CI : chaque commit est construit une
fois, l'image est déployée sur une pile éphémère, migrations rejouées depuis zéro, et validée
par machine. QA est **un** environnement hébergé stable : la promotion y est automatique sur
portes vertes, et l'humain y accepte les tranches. PROD reçoit la même empreinte et les mêmes
migrations que la release acceptée en QA, sur **une décision humaine de mise en production**
(relecteur requis sur l'environnement). Les environnements ne diffèrent que par configuration —
non secrète, versionnée par environnement, son empreinte enregistrée — et par secrets, chacun
dans le magasin de son environnement. `GET /version` rend environnement, commit, empreinte et
version de migration ; chaque promotion laisse un enregistrement de déploiement. Le
développement se fait sur le tronc. Un client mobile se promeut par commit : ses builds QA et
PROD sortent du même commit accepté.

**Pourquoi.** Accepter en QA ce qui ira en PROD, à l'octet près. La validation automatique
n'est pas l'acceptation, et l'acceptation d'une tranche n'est pas la mise en production : ce
sont deux décisions humaines distinctes, et la seule automatisée est la promotion vers la QA.

## Alternatives rejetées

- **Une branche par environnement** : trois vérités du code, et des correctifs qui divergent.
- **Reconstruire par environnement** : ce qui part en PROD n'est plus ce qui a été accepté.
- **Un aperçu de PR pris pour la QA** : la QA est un environnement stable, promu, ouvert à
  l'humain ; aucun aperçu ne le devient.
- **Une PREPROD dès la v1** : un environnement de plus à payer et à tenir, sans preuve qu'il
  dise quelque chose que la QA ne dit pas.

## Ce que la décision exclut

Aucun job DEV ni QA ne détient d'accès à la PROD ; aucun test de QA ne vise la PROD ; aucun
environnement ne lit les données d'un autre ; données synthétiques hors PROD. Pas de mise à jour
à chaud d'un client : ce qui tourne est ce qui a été accepté.

## Classement

CORE INVARIANT : c'est la preuve que la PROD est ce qui a été accepté.

## Conditions de réexamen — PREPROD

La topologie de PROD diffère de la QA d'une façon que la QA ne reproduit pas ; une migration
sans interruption doit être répétée sur un volume réaliste ; une intégration externe exige une
certification sur un environnement de type production ; une exigence réglementaire ou de
sécurité demande une répétition identique à la production ; le risque de release monte
(trains concurrents, releases ratées, retours arrière).
