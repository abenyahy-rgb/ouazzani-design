# MCR-007 — Le décideur au-dessus de la boucle : mandat, points de passage, dossier décideur

| | |
|---|---|
| **Statut** | ADOPTÉE |
| **Demandée par** | le porteur de la méthode, 17 et 18 octobre 2026 : « c'est fatigant, parce que ce n'est pas autonome […] je me retrouve à faire le boulot de l'équipe moi-même » ; « le persona utilisateur de FactoryZen, c'est un décideur comme moi » ; ajuster la méthode à la marge, sans jeter la recherche ni le design thinking |
| **Source reprise** | essai « magicien d'Oz » du 17 octobre 2026 sur TennisCoach : un mandat d'une phrase, deux sous-agents, aucune question au porteur, un dossier de douze planches et un prototype de cinq écrans en une heure environ |
| **Portée** | registre (`autopilote.mode_decideur`, règles de WP-02 et WP-16, procédure du skill `market-tests`), `lib/autopilote.mjs`, `lib/conduite.mjs`, outils de la tour (`factory_autopilot_start` : `mode` ; `factory_queue_decision` : `engageante`), Launchpad (mandat à la création), surcouche anglaise, tests |

## 1. Constat

1. **Le porteur fait le travail de l'équipe.** Le run TennisCoach a demandé 126 décisions au porteur avant G0. L'atelier et l'interrogatoire se conduisent une question à la fois. Les critiques se trient une par une à la fin de chaque étape. Chaque décision d'intention arrête le run. Les trois règles sont justes une à une ; ensemble, elles mettent l'humain **dans** la boucle, alors que MCR-002 le voulait **au-dessus**.
2. **On a confondu rendre des comptes et faire le travail.** Un membre de comité exécutif répond du mandat, du choix entre des options et de la décision d'investir. Il ne remplit pas un canevas bloc par bloc.
3. **Ce qui manquait n'était pas des questions, mais les bonnes, au bon moment.** L'essai du 17 octobre a produit un dossier jugé « très bien », que le porteur a recadré par cinq contraintes que l'équipe ignorait : son temps, les canaux qu'il refuse, son cofondateur et ses langues, la géographie, le segment qui paie. Posées au départ, elles auraient évité une recommandation inexécutable. L'autonomie, ce n'est pas zéro question : ce sont les bonnes au départ, puis aucune jusqu'au point de passage.
4. **Deux trous de méthode sont apparus en chemin.** La thèse ne choisissait pas son marché de lancement (pays, ville, segment) : elle supposait le marché du porteur. Et les tests de marché ne mettaient pas en premier le service rendu à la main par la personne qui le rendra, quand le canevas la nomme.

## 2. Décision

### 2.1 Deux conduites du run

L'autopilote se démarre dans une conduite : **atelier**, comme avant, ou **décideur**. Rien n'est retiré : l'atelier une question à la fois reste le défaut et le choix de qui veut co-construire.

### 2.2 Le mode décideur

- **Le mandat.** À la création, le porteur donne l'idée et ses contraintes : ambition et horizon ; temps, énergie, budget ; canaux exclus ou imposés ; personnes clés, leurs langues et leur capacité ; géographie et langues visées ; lignes rouges. Chaque ligne entre au Journal d'atelier de WP-01 comme une réponse du porteur, que l'équipe ne repose jamais.
- **Pas d'interrogatoire.** Les activités 1 et 2 se produisent depuis le mandat et la recherche. Le contrôle de conduite « une question à la fois » se tait, puisqu'il n'y a plus de questions.
- **Les décisions d'intention sont déléguées.** Une décision qui a des options est appliquée sur la recommandée, en DÉLÉGUÉE. Le décideur la confirme ou la change au point de passage suivant ; changée, elle rouvre l'activité, par le mécanisme de reprise existant. Restent bloquantes : ce qui engage le porteur (dépense, publication en son nom, irréversible), le corpus réel, et une décision sans option.
- **Trois points de passage.**
  - **PP1, le mandat**, à la création.
  - **PP2, options et tests**, avant le Design System (activité 8) : l'option stratégique et le marché de lancement, les budgets des tests de marché, les critiques des étapes C1.1 à C1.3.
  - **PP3, G0** : le dossier décideur, les critiques restantes, la ratification.

  Chaque point de passage est **une salve** : décisions engageantes, choix à confirmer, puis critiques, chacune avec la recommandation en premier. « Ta reco » vaut la recommandation pour toutes.
- **La mesure.** Le coût humain du run se compte : sollicitations et décisions avant G0 (P7). La cible est de trois points de passage.

### 2.3 Deux ajouts au fond de la méthode

- **WP-02, le marché de lancement.** Pays, ville et segment candidats passés aux mêmes filtres pondérés : volonté de payer et prix du substitut, taille du segment, langue et capacité des personnes clés, réglementation, coût d'acquisition, concurrence. On garde le retenu, la vague suivante, et ce qui est écarté avec son motif. La Cible nomme le segment qui paie le plus et ce qu'il paie aujourd'hui pour le substitut.
- **Activité 7, le MVP concierge.** Quand le mandat ou le canevas nomme une personne qui rend le service (coach, expert, cofondateur), le premier test envisagé est ce service rendu à la main, payé d'avance.

### 2.4 Le dossier décideur

En mode décideur, le pitch de G0 (WP-16) devient le **dossier décideur**, avec la même forme, onze planches, contrôlée par le format « pitch ». Il met la demande en premier. Il dit ce qui ne tient pas, de la bouche de l'équipe. Il montre les options écartées avec leur verdict, et chaque risque avec son test et son seuil, écrits avant.

## 3. ADR-MCR-007 — un mode, plutôt qu'une méthode allégée

**Contexte.** L'alternative était de remplacer l'atelier une question à la fois par une rédaction autonome, pour tous les runs.

**Décision.** Un mode choisi au démarrage. Il est porté par l'autopilote et lu par le contrôle de conduite. L'atelier reste le défaut.

**Motifs.**
1. **Les deux personas existent.** Le fondateur qui découvre son produit en le formulant gagne à l'atelier. Le décideur qui finance un portefeuille gagne au mandat. La méthode sert les deux, sans en trahir aucun.
2. **La rigueur reste.** Preuve étiquetée, hypothèses HYP-nn, critiques, gates humaines : rien n'est retiré. Seul le **moment** où l'humain est sollicité change.
3. **Le changement est réversible et mesuré.** Une décision déléguée tranchée autrement rouvre son activité. Le nombre de sollicitations se compte, et c'est lui qui dira si le mode tient sa promesse.

**Alternative rejetée et ce qu'elle exclut.** Supprimer l'atelier pour tous excluait le porteur qui veut co-construire, et faisait de la rédaction autonome une obligation plutôt qu'un choix. Garder l'atelier seul excluait le persona commercial de FactoryZen, le décideur.

**Coût accepté.** Une décision appliquée par défaut peut orienter une activité que le décideur fera reprendre. On paie ce coût une fois, au point de passage, au lieu de le payer à chaque question.

## 4. Compatibilité

- Un run en cours garde sa conduite : sans `mode`, l'autopilote reste en atelier.
- Les règles enrichies de WP-02 et WP-16 s'appliquent aux livrables déclarés après la mise à jour du pin. Aucun livrable n'est rouvert.

## 5. Ce que la MCR ne fait pas

- Elle ne franchit aucune gate et ne dépense rien sans décision du porteur.
- Elle ne présente jamais une hypothèse comme un fait : un bloc rédigé depuis le mandat sans réponse du porteur reste une HYP-nn UNVALIDATED.
