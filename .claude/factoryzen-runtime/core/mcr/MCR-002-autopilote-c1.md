# MCR-002 — Autopilote de la cadence C1 : l'humain au-dessus de la boucle avant G0

| | |
|---|---|
| **Statut** | ADOPTÉE |
| **Demandée par** | le porteur de la méthode, 9 octobre 2026 : « je voulais que la phase avant G0 soit autonome et boucle jusqu'à ce que ce soit satisfaisant entre les agents, mais mes interventions sont à chaque étape » |
| **Portée** | registre (`autopilote`, EX1, pack de G0, règles des critics, huit opérations de tour), `lib/autopilote.mjs`, `lib/decisions.mjs`, hook Stop, commande `/factory-run`, Launchpad (file des décisions), tests ; aucun projet produit modifié |

## 1. Constat

Avant G0, l'humain intervenait à chaque étape pour trois raisons que la méthode ne distinguait pas :

1. **Continuation** — rien n'enchaînait une activité à la suivante. Le harness travaille tour par tour ; sans moteur, chaque fin d'activité attendait un « continue ».
2. **Validation** — la boucle producteur ↔ critic, et EX1 au bout de deux tours, étaient écrites au registre et exécutées par rien. Un désaccord arrêtait le run entier.
3. **Décision** — l'intention (activités 1 et 2), les points de départ (7, 10), la revue du domaine (3), chaque gel de socle, G0.

Seule la troisième revient à l'humain, et même elle peut se **grouper** : avant G0, rien n'est irréversible.

## 2. Décision

- **La tour calcule l'action suivante** (`factory_next`) depuis son état : INTERROGER, OUVRIR, PRODUIRE, JUGER, REPRENDRE, CORRIGER, ou un arrêt — STOP_DECISION, STOP_G0. Chaque rôle y vient avec son modèle et son effort (R6).
- **Le hook Stop du harness refuse la fin de tour** tant qu'il reste une action et que le run progresse. Il rend la main à un arrêt, à un interrogatoire, ou quand le journal n'a pas bougé depuis la relance précédente — une boucle à vide s'arrête, elle ne se relance pas.
- **Les agents valident entre eux.** Un livrable converge quand le verdict de son critic porte zéro BLOCKER et zéro MAJOR. La tour **lit** ce compte dans le verdict déposé (« SÉVÉRITÉS — BLOCKER: n · MAJOR: n · MINOR: n »), jamais dans le compte rendu de l'orchestrateur.
- **EX1 arrête la boucle, pas le run.** Après deux tours, le désaccord entre en file comme ARBITRAGE et l'autopilote poursuit les activités suivantes.
- **Les décisions déléguées s'appliquent par défaut et se ratifient en G0** : revue du domaine (3), départs de design system (7) et d'architecture (10), gels de socle à titre provisoire. Une décision tranchée autrement rouvre l'activité qui l'avait appliquée.
- **Trois décisions restent bloquantes**, quel que soit le mode : intention, irréversible, corpus réel.
- **G0 ne se franchit qu'avec chaque arbitrage tranché**, et son franchissement par une autorité nommée ratifie les décisions déléguées. L'autopilote ne franchit jamais un gate.
- **La file est lisible et répondable depuis le Launchpad** : une réponse est un fichier ajouté au dépôt (`runs/decisions/DEC-nn.reponse.yaml`), que la tour ingère.

## 3. ADR-MCR-002 — un hook Stop plutôt qu'un orchestrateur externe

**Contexte.** Il faut que l'enchaînement survive à la fin de tour du harness, sans geste humain.

**Décision.** Le hook Stop, piloté par l'état de la tour, et une commande `/factory-run` qui décrit la boucle.

**Motifs.**
1. **Aucune règle hors de la tour.** Le hook ne décide rien : il demande à la tour s'il reste une action et si le run progresse. La boucle est la même dans un terminal, sur le web ou dans une session distante.
2. **Le contexte reste celui de la conversation** : l'interrogatoire de l'humain (activités 1 et 2) se conduit dans la même session, sans changer d'outil.
3. **Un arrêt de sûreté mécanique** : sans progrès au journal entre deux relances, la main revient. Une relance infinie est impossible par construction, et un budget de relances la borne encore.

**Alternative rejetée et ce qu'elle exclut.** Un orchestrateur externe — workflow multi-agents ou routine planifiée qui pilote les activités. Il aurait évité de dépendre du hook, mais il excluait : une source unique de l'état (l'orchestrateur aurait tenu sa propre idée de « fini »), l'interrogatoire dans la conversation de l'humain, et la portabilité d'un plugin qui ne fait aucun appel réseau. Il reste possible par-dessus : il n'a qu'à appeler `factory_next`.

## 4. Ce que la MCR ne fait pas

- Elle ne délègue ni l'intention, ni un arbitrage de fond, ni le corpus réel.
- Elle ne franchit aucun gate et ne présente aucun verdict qu'elle n'a pas lu.
- Elle ne fixe pas la convergence au-delà de zéro BLOCKER et zéro MAJOR : la sévérité reste celle de la taxonomie des findings.
