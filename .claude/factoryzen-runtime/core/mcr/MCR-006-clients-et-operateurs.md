# MCR-006 — Deux familles d'acteurs : les clients externes et les opérateurs internes

| | |
|---|---|
| **Statut** | ADOPTÉE — sans renumérotation |
| **Demandée par** | le porteur de la méthode, 13 octobre 2026, sur constat du run TennisCoach : les écrans du coach avaient été oubliés |
| **Portée** | registre (`core/method.yaml`), surcouche anglaise, gabarits (`core/templates.yaml`, Office), formats `bmc` et `persona` (`lib/exhibits.mjs`, `render/pack-pptx.mjs`), contrôle K1 (`lib/acteurs.mjs`, `lib/checks.mjs`), Launchpad (carte « Acteurs »), exemple padel, tests ; aucun projet produit modifié depuis la session |

## 1. Constat

1. La méthode ne connaissait qu'une famille d'acteurs. Le canevas nommait des « segments de clients », la recherche des personas, le squelette des étapes « dites avec les mots de l'utilisateur » — toujours celui qui paie ou utilise.
2. Presque tout produit a aussi des **opérateurs** : ceux qui font tourner le service au quotidien — coach, préparateur, livreur, support, administrateur, partenaire qui opère. Leurs écrans sont des écrans du produit.
3. **TennisCoach** : le canevas, les personas et le squelette décrivaient le joueur ; le coach, qui anime les séances et suit les progrès, n'avait ni persona ni parcours. Ses écrans manquaient au socle, et se découvraient en construction — après G0, quand le squelette est figé.
4. L'**exemple padel** de la méthode avait le même trou : le club et le joueur avaient leurs parcours ; personne ne voyait les clubs à relancer, ne préparait la tournée ni n'encaissait — alors que « relancer avant la rupture » est la promesse.

## 2. Décision

- **Le canevas (WP-01) déclare les opérateurs** — section « Opérateurs du service », et au front-matter, dans le format `bmc` : `operateurs` (nom, activité clé portée, ce qu'il voit et fait dans le produit). « Aucun opérateur » est une décision motivée — `sans_operateur` —, jamais un silence. Le format refuse un canevas qui ne dit ni l'un ni l'autre ; la planche montre les opérateurs sous les segments clients.
- **Les personas (WP-04) déclarent leur famille** — `famille: client` ou `operateur`, et un persona opérateur nomme l'opérateur du canevas qu'il incarne. Chaque opérateur a son persona, recherché comme un client : forums de métier, offres d'emploi, outils d'aujourd'hui.
- **Le squelette (WP-05) a un parcours par famille** — section « Parcours des opérateurs » : ce que chaque opérateur prépare, opère, suit et corrige, en étapes STG-nn de famille `operateur`. Chaque étape déclare sa famille au front-matter.
- **La navigation (WP-09)** couvre les étapes des clients ET des opérateurs, chacun dans son espace.
- **K1 — couverture du squelette — couvre les deux familles** (`lib/acteurs.mjs`) : canevas sans opérateurs déclarés, persona ou étape sans famille, opérateur sans persona, opérateur sans étape, persona ou étape d'opérateur inconnu du canevas. La couverture se resserre à mesure que le parcours avance : rien n'est exigé d'un livrable qui n'existe pas encore.
- **L'atelier** pose la question des opérateurs juste après le segment ; **critic(product)** tient un opérateur oublié pour un BLOCKER.
- **Le Launchpad** montre une carte « Acteurs » par projet : chaque famille, chaque opérateur, ses personas et ses étapes, et ce qui manque — la même lecture que K1.

## 3. ADR-MCR-006 — une famille déclarée, plutôt qu'un livrable « back-office »

**Contexte.** L'alternative était un livrable dédié — « Parcours et écrans d'administration » — produit à part, après le squelette.

**Décision.** Les opérateurs entrent dans les livrables existants, à leur place dans le parcours : déclarés à l'atelier, recherchés avec les clients, et inscrits au même squelette.

**Motifs.**
1. **Le coût de changement.** Un opérateur découvert après G0 rouvre le squelette figé ; déclaré à l'atelier, il coûte une ligne de canevas.
2. **Un seul squelette.** Les releases se découpent sur le squelette et la navigation le suit : un back-office tenu à part n'est découpé ni navigué, et c'est exactement ce qui s'oublie.
3. **Le contrôle sur les octets.** Une famille au front-matter se compte ; K1 la confronte au canevas sans index parallèle.

**Alternative rejetée et ce qu'elle exclut.** Le livrable dédié aurait été visible, mais il excluait : la question posée dès l'atelier, la recherche de l'opérateur comme personne, le découpage en releases de ses étapes, et le contrôle croisé canevas — personas — squelette.

## 4. Compatibilité

- **Avant G0** (TennisCoach) : K1 réclame les opérateurs à la prochaine opération de tour ou synchronisation par le Launchpad — canevas, puis personas et étapes. Le critic(product) les demande à sa prochaine critique. Aucun contenu n'est réécrit.
- **Après G0** : l'écart est **rapporté, non bloquant** — K1 le dit dans son détail, et la carte « Acteurs » du Launchpad le montre. Il se traite par la prochaine release ou par une réouverture de G0 décidée par le porteur, jamais en rouvrant le gel en silence.
- Pas de renumérotation : aucun identifiant ne change.

## 5. Ce que la MCR ne fait pas

- Elle n'impose pas d'opérateur : un service entièrement automatisé se déclare `sans_operateur`, avec son motif.
- Elle ne dessine aucun écran : le squelette nomme les étapes de l'opérateur ; le socle les compose.
