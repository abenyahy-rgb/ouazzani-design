# MCR-005 — Tests de marché avant le socle, et une thèse au standard du New Business Venturing

| | |
|---|---|
| **Statut** | ADOPTÉE — numérotation 7 du registre |
| **Demandée par** | le porteur de la méthode, 12 octobre 2026 : « un G0 testé sur le marché, pertinent, qui gagne de l'argent » ; appliquer au pack G0 les principes du New Business Venturing d'INSEAD (workbook de juillet 2023) |
| **Source reprise** | INSEAD, *New Business Venturing Lab Workbook*, juillet 2023 — tests de marché, échelle de fiabilité de la preuve, cartes d'apprentissage, sept forces du modèle économique, concurrence typée, équipe et manques ; Strategyzer — D. Bland et A. Osterwalder, *Testing Business Ideas*, 2019 (Test Card, Learning Card) |
| **Portée** | registre (`core/method.yaml`), surcouche anglaise, gabarits (`core/templates.yaml`, Office), formats `apprentissages` et `economie-unitaire` (`lib/exhibits.mjs`, `render/pack-pptx.mjs`), skill `market-tests`, migration de numérotation 7, tests ; aucun projet produit modifié depuis la session |

## 1. Constat

1. Avant G0, la méthode construit le Design System, le modèle de données, le socle exécutable et l'architecture (activités 7 à 10 de la numérotation 6) sans qu'**aucune personne réelle n'ait agi ni payé**. Un socle juste pour un produit que personne n'achète est le plus cher des livrables inutiles.
2. Les hypothèses critiques de WP-02 avaient leurs cartes de test — ce que l'on croit, comment on le vérifie, quand on a tort —, mais **rien ne les exécutait avant G0** : elles restaient UNVALIDATED jusqu'au pilote, après le gel du cœur.
3. Le pack de preuves de G0 était entièrement produit et technique ; il ne portait **aucune preuve de marché**. Le pitch investisseurs (WP-16) devait raconter une traction et des apprentissages que rien en amont ne produisait.
4. Mesurée contre le workbook NBV, la thèse était **à moitié au standard** : problème, cible, recherche, canevas et cartes de test l'étaient ; le positionnement, la concurrence et l'économie unitaire ne l'étaient qu'en partie ; manquaient l'échelle de fiabilité, les modèles économiques alternatifs et leur évaluation, et la lecture de l'équipe par activité clé.

## 2. Décision

### 2.1 Tests de marché avant le socle

- **Une activité nouvelle**, dernière de C1.3, après la recherche, le squelette et le corpus, avant le Design System : **« Tests de marché et apprentissages »** (activité 7). Elle produit un **livrable nouveau**, **WP-07**, sous `C1.3-parcours/tests-marche/` : plan de tests, décisions du porteur, cartes d'apprentissage, résultats bruts, et ce que les tests changent.
- **Le test le moins cher qui tranche** — page de prix, liste d'attente, faux bouton d'achat, maquette cliquable, acompte, service à la main —, avec son critère de réussite **écrit et daté avant** le lancement.
- **L'échelle de fiabilité** (INSEAD NBV) : un propos (« j'achèterais ») < un intérêt observé sans pitcher < un acte (inscription, clic d'achat) < un paiement (acompte, précommande). Un propos ne confirme jamais une hypothèse ; une preuve SYNTHETIC n'est pas une observation.
- **Le porteur décide** chaque publication, chaque message envoyé en son nom, chaque euro dépensé, par une décision DEC-nn nommée et datée. L'agent prépare le test ; il ne le lance jamais seul.
- **Le format « apprentissages »** (porté par `learning-cards.md`) calcule, pour chaque hypothèse critique, le plus haut échelon qui l'a tranchée, et signale quand aucune n'atteint l'acte. Il refuse une carte sans critère daté, un critère écrit après le test, une observation sans preuve E-nn, un propos qui « confirme », une preuve SYNTHETIC.
- **G0.** Le pack de preuves exige les tests de marché : **au moins une hypothèse critique tranchée par un acte ou un paiement**, ou une réserve qui dit pourquoi et quand elle le sera. Une hypothèse infirmée n'est pas un échec : elle est routée vers WP-02, et la thèse est reprise **avant** que le socle ne la fige.
- **Le pitch** (WP-16) tire sa traction et ses apprentissages de WP-07 : il ne raconte que ce que les tests ont observé.

### 2.2 Une thèse au standard du New Business Venturing

- **WP-02** gagne quatre sections : la **grille concurrentielle** — directe, indirecte, future, et le statu quo, toujours présent —, avec ses dimensions, la qualité de la preuve de chaque case et là où le produit gagne ; **deux modèles économiques alternatifs**, écrits avant de retenir le principal ; l'**évaluation des sept forces** du modèle (coûts de changement, revenus récurrents, encaisser avant de dépenser, structure de coûts, d'autres font le travail, scalabilité, protection) et la **force de la proposition de valeur** ; l'**économie unitaire**.
- **Le format « economie-unitaire »** (porté par `product-thesis.md`) calcule la marge de contribution, la valeur vie client, le ratio LTV / CAC et le délai de récupération à partir de chiffres déclarés avec leur origine, signale un ratio sous 3 ou une récupération au-delà de 12 mois, et refuse un coût d'acquisition sans origine.
- **WP-01** gagne une section : **l'équipe par activité clé** — les compétences techniques, humaines et métier que chaque activité clé du canevas exige, qui les couvre, les manques, et l'expérience de création d'entreprise. Un manque se finance par la demande du pitch.

## 3. ADR-MCR-005 — une activité avant le socle, plutôt qu'un critère de G0

**Contexte.** L'alternative était de laisser les tests de marché hors de la méthode et de n'exiger qu'un critère au pack de G0 (« au moins une hypothèse critique validée »), à charge pour le porteur de la satisfaire comme il l'entend.

**Décision.** Une activité nouvelle, **avant** le Design System, portée par le **product-lead** — responsable de la thèse dont elle tranche les hypothèses —, accountable le Product Owner.

**Motifs.**
1. **L'ordre du coût de changement.** Une hypothèse infirmée après le socle coûte le socle ; infirmée avant, elle coûte une page de prix. Un critère de G0 ne dit pas QUAND tester : il laisse construire d'abord.
2. **Une preuve, un livrable, un contrôle.** Le livrable a ses chemins au registre ; le format `apprentissages` se rejoue sur les données ; K2 et K8 le voient. Un critère sans livrable se satisfait d'une phrase.
3. **La place.** Après la recherche (les personas disent à qui parler), le squelette (il donne la promesse que les tests exposent) et le corpus (les données réelles) ; avant le Design System, qui n'a pas à exister pour une page de prix ou une maquette cliquable.
4. **WP-01 plutôt que SOC-01 pour l'équipe.** SOC-01 est calculé par la tour ; l'équipe se lit contre les activités clés du canevas, qui vivent dans WP-01.

**Alternative rejetée et ce qu'elle exclut.** Le critère seul à G0 évitait une renumérotation, mais il excluait : le test avant la dépense du socle, un livrable rejouable par la machine, l'échelle de fiabilité comme contrôle et non comme conseil, et la reprise de la thèse avant le gel du cœur.

**Coût accepté.** Les identifiants se suivent dans l'ordre du parcours : l'activité prend le numéro 7, le livrable WP-07, et les suivants glissent d'un rang. C'est la numérotation 7 du registre, appliquée par la migration existante : **seuls les identifiants** de l'état de tour, des front-matter et des noms de fichiers Office sont traduits, jamais le contenu d'un livrable ; le journal se lit à travers les tables.

## 4. Compatibilité

- Un run ouvert avant G0 voit l'exigence **à G0**, après mise à jour du pin : la migration de numérotation 7 traduit ses identifiants à sa prochaine opération de tour ou synchronisation par le Launchpad, puis `factory_request_gate G0` réclame WP-07. Aucun livrable existant n'est rouvert ni réécrit.
- Les sections nouvelles de WP-01 et WP-02 s'appliquent aux livrables déclarés après la mise à jour ; un livrable déjà complet n'est pas rétroactivement rouvert. Le critic(product) les demande à sa prochaine critique.
- Un run qui a déjà franchi G0 n'est pas rétroactivement bloqué.

## 5. Ce que la MCR ne fait pas

- Elle ne lance aucun test au nom du porteur et ne dépense rien sans sa décision.
- Elle ne fixe pas de seuil de réussite universel : chaque critère est écrit par le porteur, avant le test, pour son produit. Les repères LTV / CAC ≥ 3 et récupération ≤ 12 mois sont signalés, jamais bloquants.
- Elle ne remplace pas la recherche : un test de marché tranche une hypothèse de comportement d'achat, pas la compréhension d'un besoin.
