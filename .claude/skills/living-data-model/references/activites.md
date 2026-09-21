# living-data-model — activités outillées

> Généré depuis `core/method.yaml`. Chargé à la demande, jamais d'office.

## Activité 7 — Navigation, IA, terminologie et sémantique

**Entrée.** Squelette arrêté ; domaine qualifié.

**Tâche.** Figer la navigation, l'architecture de l'information, le vocabulaire utilisateur, les catégories de vérité, les statuts et les règles financières.

**Vérification.** Chaque terme unique, non ambigu, testé auprès d'un persona. La navigation couvre toutes les étapes. Chaque catégorie de vérité est disjointe. Un calcul n'améliore jamais le statut de vérité de ses entrées. La table de liaison résout chaque entité et chaque champ du noyau vers un terme du glossaire.

**Sortie.** Figés par tag Git. Noyau du modèle de données classé CORE INVARIANT ou EXTENSION, élément par élément. Toute évolution ultérieure du noyau rouvre G0.

Responsible : `product-designer et product-lead` · Accountable : `Product Owner` · Cadence C1, étape C1.4

## Activité 14 — Solution design de la release

**Entrée.** Parcours cibles disponibles ; socle technique figé et accessible ; périmètre arrêté.

**Tâche.** Concevoir la réalisation technique de cette release à l'intérieur du socle : composants touchés, contrats d'interface, flux de données, impacts de migration. Qualifier faisabilité, dépendances techniques et tier de risque de chaque capacité.

**Vérification.** La solution s'inscrit dans le socle technique sans modifier un CORE INVARIANT ; tout besoin de modification est routé vers G0 (EX3), jamais appliqué. Chaque dépendance est nommée, datée, non circulaire. Chaque capacité porte un tier justifié. Chaque impact de migration est confronté au modèle de données vivant : une entité ou un champ touché qui porte l'étiquette CORE INVARIANT ouvre une EX3, il ne se modifie pas ici. Verdict critic(engineering) rendu.

**Sortie.** Solution design et carte des dépendances commités. Impacts de migration rattachés aux entités du modèle de données vivant. C'est l'entrée technique de l'activité 19 : sans elle, un backlog ne peut ni qualifier ses dépendances ni proposer ses tiers.

Responsible : `principal-engineer` · Accountable : `autorité Tech` · Cadence C2, étape C2.2

## Activité 20 — Spécification fonctionnelle et technique

**Entrée.** Prototype de sprint stabilisé.

**Tâche.** Détailler stories, règles métier, cas limites et AC ; définir architecture, données, API, migrations, sécurité, observabilité et tests.

**Vérification.** Chaque AC testable. Chaque règle cite la baseline, la décision produit ou le critic de domaine. Carte AC → Evidence complète. Tier proposé et justifié. Migrations et rollback décrits. Modèle dérivé régénéré depuis le schéma exécuté : chaque entité et chaque champ créés par ce sprint résolvent vers un terme du glossaire et une catégorie de vérité.

**Sortie.** spec/ et ADRs commités ; NEEDS CLARIFICATION résolus ou routés ; modèle de données vivant régénéré, table de liaison sans élément non résolu, chaque migration rattachée à sa story. Un champ non résolu ne passe pas K1.

Responsible : `product-lead et principal-engineer` · Accountable : `PO et autorité Tech` · Cadence C3, étape C3.2
