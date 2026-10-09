# slice-delivery — activités outillées

> Généré depuis `core/method.yaml`. Chargé à la demande, jamais d'office.

## Activité 18 — Contrat de slice

**Entrée.** G1 franchi ; carte des slices à jour ; slice précédente acceptée — une seule slice en cours à la fois.

**Tâche.** Écrire le contrat de la slice, AVANT tout code : le résultat utilisateur en une phrase ; le périmètre et son budget ; les critères de sortie EXIT-n, chacun avec sa preuve ; les tests définis avant le code ; la Baseline Delta Declaration, les écrans et le delta de Design System ; les règles, données, API et migrations ; le tier ; les points ouverts. Le prototype vivant est recomposé avec le delta de la slice.

**Vérification.** Résultat formulé en résultat utilisateur, pas en liste de tâches. Aucune story sans AC ni sans écran ; le prototype exerce chaque story. Chaque AC testable. Chaque critère de sortie a sa preuve et sa procédure. Chaque AC matériel a son test, défini avant le code. Inventaire MUST PRESERVE produit AVANT toute modification ; aucune modification silencieuse d'un composant existant ; plancher de craft lu avant toute modification d'un écran existant. Chaque règle cite la baseline, la décision produit ou le critic de domaine. Migrations et rollback décrits, chaque migration rattachée à sa story. Modèle dérivé régénéré : chaque entité et chaque champ créés par la slice résolvent vers un terme du glossaire et une catégorie de vérité. Tier proposé et justifié.

**Sortie.** slice-contract.md, design/ et spec/ commités ; prototype vivant recomposé socle ⊕ deltas de release ⊕ deltas de slice, manifeste daté ; NEEDS CLARIFICATION résolus ou routés ; Run Ledger ouvert. C'est ce pas qui fait que le prototype suit les slices au lieu de les précéder puis de périmer. Un champ non résolu ou un NC ouvert ne passe pas K1.

Responsible : `product-lead · product-designer · principal-engineer` · Accountable : `Product Owner et autorité Tech` · Cadence C3, étape C3.1

## Activité 21 — Construction et tests

**Entrée.** K1 franchi ; branche de travail créée ; environnement isolé ; critic(quality) disponible et indépendant.

**Tâche.** Implémenter la slice depuis le contrat figé, dans la mutation boundary déclarée ; exécuter les tests définis au contrat, produire la preuve de chaque critère de sortie, réparer les tests obsolètes en mode HEAL ; déployer en QA et jouer les parcours critiques sur le prototype vivant. Tout écart est un amendement daté : la slice ne grandit pas.

**Vérification.** Aucune modification hors mutation boundary. Commits atomiques. Tests locaux verts avant push. Tout écart classé. NEEDS CLARIFICATION marqué plutôt qu'un comportement inventé. LA CLASSIFICATION d'un test rouge est rendue par critic(quality), jamais par le producteur du test ou du code. Tout healing exige une re-vérification indépendante. Parcours critiques exécutés en QA, sur le prototype vivant recomposé, pas seulement en test automatisé.

**Sortie.** Code poussé ; status.md et scope-changes.md à jour ; preuve de chaque critère de sortie retenue ; quality/ et acceptance/ commités ; aucun PRODUCT FAILURE masqué ; URL de QA enregistrée — celle du prototype vivant, une seule.

Responsible : `principal-engineer · quality-engineer produit · critic(quality) classe` · Accountable : `autorité Tech` · Cadence C3, étape C3.2
