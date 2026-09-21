# domain-critic — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-06 — Profil de domaine et sources approuvées

`domain/domain-profile.md · sources.md · rules.md`

Cycle de vie : vivant · contrôlé en G0 · R/A : product-lead / Product Owner

Qualifie l'industrie avant de créer le critic qui en jugera. Sans sources datées, un critic métier cite la mémoire du modèle.

- **Profil de l'industrie**
- **Sources approuvées** — chacune datée. Une règle sans source datée est INCONNU, jamais FAIT
- **Règles métier** — chacune citant sa source et sa date de dernière évolution
- **Usages non écrits** — qui les connaît, comment on les a recueillis
- **Sanctions et autorité** — qui applique quoi en cas de violation

**Complétude.** Chaque règle cite une source datée. Les UNKNOWNs sont routés, pas comblés.

## WP-07 — Définition du critic métier

`domain/critic-definition.md · critic-sources.md`

Cycle de vie : révisable · contrôlé en G0 · R/A : factory-lead / Product Owner

Le seul livrable de la méthode qui produit un agent. Instancié depuis le gabarit, jamais embarqué par le plugin.

- **Identity and tools** — lecture seule déclarée au niveau de l'outillage, pas seulement dans le texte
- **Authority and write boundary** — son verdict, dans le dossier de reviews. Rien d'autre
- **Input contract** — BLOCKED si un input requis manque
- **Evidence and handover**
- **Separation of duties**
- **Sources adossées et échelle épistémique** — FAIT · PRATIQUE · ABSTRACTION · INFÉRENCE · INCONNU
- **Cas de test connu** — dont la réponse est vérifiable indépendamment

**Complétude.** Le critic cite des sources externes et non la mémoire du modèle. Définition revue par un humain. Éprouvé sur son cas de test.
