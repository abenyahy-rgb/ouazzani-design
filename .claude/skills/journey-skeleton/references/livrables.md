# journey-skeleton — livrables

> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.

## WP-08 — Recherche et synthèse utilisateur

`research/research-plan.md · interviews/ · insights.md · personas/ · empathy-maps/ · journeys/as-is/`

Cycle de vie : vivant · contrôlé en G0 · R/A : product-designer / Product Owner

Le corpus d'observations sur l'ensemble du parcours, avant tout découpage, et sa synthèse en une passe.

- **Plan de recherche** — écrit AVANT le recrutement
- **Verbatims tracés** — échantillon et biais connus déclarés
- **Insights** — aucun sans observation source
- **PER-nn personas** — chaque trait tracé vers ≥ 2 observations
- **Empathy maps** — aucune projection non observée ; unknowns marqués
- **Journeys as-is et irritants** — chaque irritant daté, sourcé, rattaché à un persona

**Complétude.** Aucun insight sans observation source. Niveau d'evidence étiqueté sur chaque résultat. Personas challengés par critic(product).

## WP-09 — Squelette de parcours cible

`design/spine/journey-skeleton.md · stages/`

Cycle de vie : figé en G0 · contrôlé en G0 · R/A : product-designer / Product Owner

La colonne vertébrale du socle. Tout s'y accroche : les releases s'y découpent, la navigation le suit, le backlog y trace.

- **STG-nn — étapes nommées et ordonnées** — avec le vocabulaire de l'utilisateur, jamais celui du métier
- **Jalons de chaque étape**
- **Trace vers PER et OUT**
- **Étapes hors périmètre du produit** — nommées, pour prouver l'exhaustivité

**Complétude.** Exhaustif : aucune étape du parcours réel absente. Enchaînement validé par le critic de domaine. Chaque étape porte exactement un lien INTRODUCES (K1).

```
STG-04  « Je sais où en est mon chantier »
  vocabulaire testé auprès de PER-01, PER-02
  jalons  consulter · comparer au planning · signaler un écart
  trace   PER-01, PER-03 → OUT-01
  release INTRODUCES par REL-pilotage
```
