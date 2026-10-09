# living-data-model — activités outillées

> Généré depuis `core/method.yaml`. Chargé à la demande, jamais d'office.

## Activité 8 — Navigation, IA, terminologie et sémantique

**Entrée.** Squelette arrêté ; domaine qualifié.

**Tâche.** Figer la navigation, l'architecture de l'information, le vocabulaire utilisateur, les catégories de vérité, les statuts et les règles financières.

**Vérification.** Chaque terme unique, non ambigu, testé auprès d'un persona. La navigation couvre toutes les étapes. Chaque catégorie de vérité est disjointe. Un calcul n'améliore jamais le statut de vérité de ses entrées. La table de liaison résout chaque entité et chaque champ du noyau vers un terme du glossaire.

**Sortie.** Figés par tag Git. Noyau du modèle de données classé CORE INVARIANT ou EXTENSION, élément par élément. Toute évolution ultérieure du noyau rouvre G0.

Responsible : `product-designer et product-lead` · Accountable : `Product Owner` · Cadence C1, étape C1.4

## Activité 14 — Solution design de la release

**Entrée.** Parcours cibles disponibles ; socle technique figé et accessible ; périmètre arrêté.

**Tâche.** Concevoir la réalisation technique de cette release à l'intérieur du socle : composants touchés, contrats d'interface, flux de données, impacts de migration. Qualifier faisabilité, dépendances techniques et tier de risque de chaque capacité.

**Vérification.** La solution s'inscrit dans le socle technique sans modifier un CORE INVARIANT ; tout besoin de modification est routé vers G0 (EX3), jamais appliqué. Chaque dépendance est nommée, datée, non circulaire. Chaque capacité porte un tier justifié. Chaque impact de migration est confronté au modèle de données vivant : une entité ou un champ touché qui porte l'étiquette CORE INVARIANT ouvre une EX3, il ne se modifie pas ici. Verdict critic(engineering) rendu.

**Sortie.** Solution design et carte des dépendances commités. Impacts de migration rattachés aux entités du modèle de données vivant. C'est l'entrée technique de l'activité 17 : sans elle, un backlog ne peut ni qualifier ses dépendances ni proposer ses tiers.

Responsible : `principal-engineer` · Accountable : `autorité Tech` · Cadence C2, étape C2.2

## Activité 18 — Contrat de slice

**Entrée.** G1 franchi ; carte des slices à jour ; slice précédente acceptée — une seule slice en cours à la fois.

**Tâche.** Écrire le contrat de la slice, AVANT tout code : le résultat utilisateur en une phrase ; le périmètre et son budget ; les critères de sortie EXIT-n, chacun avec sa preuve ; les tests définis avant le code ; la Baseline Delta Declaration, les écrans et le delta de Design System ; les règles, données, API et migrations ; le tier ; les points ouverts. Le prototype vivant est recomposé avec le delta de la slice.

**Vérification.** Résultat formulé en résultat utilisateur, pas en liste de tâches. Aucune story sans AC ni sans écran ; le prototype exerce chaque story. Chaque AC testable. Chaque critère de sortie a sa preuve et sa procédure. Chaque AC matériel a son test, défini avant le code. Inventaire MUST PRESERVE produit AVANT toute modification ; aucune modification silencieuse d'un composant existant ; plancher de craft lu avant toute modification d'un écran existant. Chaque règle cite la baseline, la décision produit ou le critic de domaine. Migrations et rollback décrits, chaque migration rattachée à sa story. Modèle dérivé régénéré : chaque entité et chaque champ créés par la slice résolvent vers un terme du glossaire et une catégorie de vérité. Tier proposé et justifié. Chaque condition d'entrée ENTRY-n porte son statut — MET · PENDING · DEFERRED — et ce qui la lève ; les prérequis EXTERNES — dépôt, hôtes, stores et signature, chaîne d'outils, compte QA stable du Product Owner — sont vérifiés AVANT le GO, et chaque apprentissage « material » de la slice précédente y est reporté. Slice 0 et toute preuve technique : chaque artefact classé KEEP ou DISCARD avant d'être écrit. RÉFÉRENCÉ, PAS RECOPIÉ : le contrat cite chaque input par chemin, rang d'autorité, commit de base et empreinte, sans recopier son contenu, et tient dans 600 lignes rendues — au-delà, la slice est trop grosse ou le contrat recopie. Avant K1, au moins 20 citations, ou toutes s'il y en a moins, sont confrontées à leur source par un critic, et « n confirmées / m corrigées » est inscrit au contrat.

**Sortie.** slice-contract.md, design/ et spec/ commités ; prototype vivant recomposé socle ⊕ deltas de release ⊕ deltas de slice, manifeste daté ; NEEDS CLARIFICATION résolus ou routés ; Run Ledger ouvert. C'est ce pas qui fait que le prototype suit les slices au lieu de les précéder puis de périmer. Un champ non résolu ou un NC ouvert ne passe pas K1.

Responsible : `product-lead · product-designer · principal-engineer` · Accountable : `Product Owner et autorité Tech` · Cadence C3, étape C3.1
