# solution-architecture — activités outillées

> Généré depuis `core/method.yaml`. Chargé à la demande, jamais d'office.

## Activité 9 — Socle technique et choix structurants

**Entrée.** Squelette de parcours arrêté ; sémantique des données figée ; contraintes de l'existant établies.

**Tâche.** Arrêter l'architecture cible : frontières d'intégration, modèle de persistance, topologie de déploiement, architecture de sécurité, contraintes non fonctionnelles. Trancher les décisions structurantes — build ou achat, socle technologique — et les enregistrer en ADR.

**Vérification.** Chaque décision structurante porte au moins une alternative rejetée avec son motif. Chaque élément est classé CORE INVARIANT ou EXTENSION par rayon d'impact, jamais par nature apparente. L'architecture supporte l'intégralité du squelette, y compris les étapes des releases lointaines. Verdict critic(engineering) rendu.

**Sortie.** Socle technique commité et figé par tag Git. Les CORE INVARIANT ne sont plus modifiables hors cadence C1 (K4, EX3).

Responsible : `principal-engineer` · Accountable : `autorité Tech` · Cadence C1, étape C1.4

## Activité 14 — Solution design de la release

**Entrée.** Parcours cibles disponibles ; socle technique figé et accessible ; périmètre arrêté.

**Tâche.** Concevoir la réalisation technique de cette release à l'intérieur du socle : composants touchés, contrats d'interface, flux de données, impacts de migration. Qualifier faisabilité, dépendances techniques et tier de risque de chaque capacité.

**Vérification.** La solution s'inscrit dans le socle technique sans modifier un CORE INVARIANT ; tout besoin de modification est routé vers G0 (EX3), jamais appliqué. Chaque dépendance est nommée, datée, non circulaire. Chaque capacité porte un tier justifié. Chaque impact de migration est confronté au modèle de données vivant : une entité ou un champ touché qui porte l'étiquette CORE INVARIANT ouvre une EX3, il ne se modifie pas ici. Verdict critic(engineering) rendu.

**Sortie.** Solution design et carte des dépendances commités. Impacts de migration rattachés aux entités du modèle de données vivant. C'est l'entrée technique de l'activité 19 : sans elle, un backlog ne peut ni qualifier ses dépendances ni proposer ses tiers.

Responsible : `principal-engineer` · Accountable : `autorité Tech` · Cadence C2, étape C2.2
