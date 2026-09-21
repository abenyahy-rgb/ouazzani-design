# real-corpus — activités outillées

> Généré depuis `core/method.yaml`. Chargé à la demande, jamais d'office.

## Activité 27 — Corpus réel et provenance

**Entrée.** Sources approuvées du domaine disponibles (WP-06) ; squelette de parcours arrêté (WP-09) — il donne le périmètre minimal que le corpus doit couvrir. L'un des deux absent produit BLOCKED.

**Tâche.** Acquérir le corpus réel minimal suffisant pour parcourir le squelette de bout en bout, depuis les seules sources approuvées. Écrire la provenance enregistrement par enregistrement et la catégorie de vérité champ par champ. Mesurer la couverture contre le squelette et NOMMER ce qui manque.

**Vérification.** Chaque enregistrement porte adresse, date de lecture et citation littérale — sans les trois il est UNVALIDATED, jamais une valeur plausible. Deux sources indépendantes sur tout fait structurant ; trois pages qui citent le même communiqué sont UNE source. Aucun enregistrement fabriqué, sous aucun prétexte de déblocage d'aval. Un champ non sourçable est rendu ABSENT et l'interface le dira, jamais rempli d'une valeur vraisemblable. La couverture est MESURÉE contre le squelette, pas appréciée. Verdict de recevabilité rendu par critic(domaine), jamais par le producteur du corpus.

**Sortie.** data/corpus/ commité, provenance complète, couverture chiffrée et écarts nommés. Aucune fixture ne subsiste sur un chemin servi à un livrable de design ou de produit.

Responsible : `data-steward` · Accountable : `Product Owner` · Cadence C1, étape C1.3

## Activité 7 — Navigation, IA, terminologie et sémantique

**Entrée.** Squelette arrêté ; domaine qualifié.

**Tâche.** Figer la navigation, l'architecture de l'information, le vocabulaire utilisateur, les catégories de vérité, les statuts et les règles financières.

**Vérification.** Chaque terme unique, non ambigu, testé auprès d'un persona. La navigation couvre toutes les étapes. Chaque catégorie de vérité est disjointe. Un calcul n'améliore jamais le statut de vérité de ses entrées. La table de liaison résout chaque entité et chaque champ du noyau vers un terme du glossaire.

**Sortie.** Figés par tag Git. Noyau du modèle de données classé CORE INVARIANT ou EXTENSION, élément par élément. Toute évolution ultérieure du noyau rouvre G0.

Responsible : `product-designer et product-lead` · Accountable : `Product Owner` · Cadence C1, étape C1.4
