# MCR-004 — Critics sur Opus 5.5, allégés ; le porteur tranche chaque critique

| | |
|---|---|
| **Statut** | ADOPTÉE |
| **Demandée par** | le porteur de la méthode, 10 octobre 2026 : « faire passer les agents critiques de Fable vers Opus 5.5 et les simplifier, car ils consomment beaucoup trop de contexte et de temps ; tout agent sur Fable passe à Opus 5.5. Le critique peut poser des critiques, mais c'est moi de dire si c'est pertinent et de changer ; le critique doit utiliser grill-me. » |
| **Portée** | table des modèles de l'adaptateur, R5, modulation M1, contrat du critic(·), autopilote (enregistrement des critiques, tri, STOP_TRI), commandes `/factory-run` et `/factory-tri`, Launchpad, tests |

## 1. Constat

- Les cinq critics étaient les seuls agents sur Fable (2,5 fois le prix d'Opus par jeton), en effort élevé, et les plus lourds des fichiers d'agents.
- Leur contrat exigeait l'exhaustivité : décomposer chaque critère en conjoints, une sonde par constat positif, un plan de couverture avant la revue, la preuve de chaque absence. Le résultat : des revues longues, coûteuses, et rarement lues jusqu'au bout.
- Le critic décidait de la convergence d'un livrable (zéro BLOCKER, zéro MAJOR). Le porteur n'était consulté qu'en arbitrage, après deux tours.

## 2. Décision

- **Aucun agent sur Fable.** La classe la plus haute est servie par Opus 5.5. Sans second modèle, les critics sont CORRÉLÉS (R5) et le disent dans leur fichier.
- **Critic allégé** : effort moyen, et il n'est plus relevé en C1 (M1 l'excepte). Cinq règles au lieu de douze : critiquer sans juger, sept critiques au plus classées par impact, chacune au format CRIT-n avec sa recommandation, rien que sur ce qui a été lu, et la ligne de synthèse.
- **Le porteur juge.** Chaque CRIT-n entre en file comme décision CRITIQUE (Retenir / Écarter), avec la recommandation du critic. Il les trie par grill-me — une critique par question — à la fin de chaque étape de C1 où il en reste (STOP_TRI), ou quand il le veut (`/factory-tri`, Launchpad). Seules les critiques retenues partent en reprise ; une reprise suffit, sans second tour du critic.
- La tour vérifie que la synthèse donne le compte exact des CRIT-n et que chacune porte sa sévérité et sa recommandation.

## 3. ADR-MCR-004 — l'indépendance par l'humain plutôt que par le modèle

**Décision.** Un seul modèle servi ; l'indépendance du jugement vient du porteur, qui tranche chaque critique.

**Motifs.** Le critic sur un modèle distinct protégeait d'un angle mort partagé, mais il coûtait le plus clair du budget et décidait à la place du porteur. Un tri humain d'au plus sept critiques par livrable garde la séparation qui compte — celui qui produit ne décide pas seul — pour une fraction du coût.

**Alternative rejetée et ce qu'elle exclut.** Garder les critics sur Fable en réduisant seulement leur contrat. Elle aurait gardé l'indépendance de modèle, mais elle excluait la baisse de coût la plus forte, et laissait au critic une autorité que le porteur veut garder.

**Coût accepté.** En tier R2 ou R3, un verdict de critic ne compte plus comme jugement indépendant : c'est le tri du porteur, consigné, qui en tient lieu.
