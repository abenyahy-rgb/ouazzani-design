# Ouazzani design

Produit gouverné par **FactoryZen** — [Autonomous Product Factory](https://github.com/abenyahy-rgb/Autonomous-Product-Factory) v5.0.

- Suivi : https://product-launchpad-lovat.vercel.app/projects/ouazzani-design
- Plugin : sous-module `.factoryzen`, épinglé ; projections sous `.claude/`
- Artefacts : `product/` (chemins déclarés au registre de la méthode)
- Journal de la tour : `runs/ledger.ndjson`

## Ouvrir le produit

```
/factory-open 1
```

Sur Claude Code web, attacher `abenyahy-rgb/Autonomous-Product-Factory` aux sources de
l'environnement : le sous-module privé ne s'y clone pas, le plugin est alors lu dans le
dépôt frère.

## Repères

| Commande | |
|---|---|
| `/factory-status` | où en est le run |
| `/factory-open <n>` | ouvrir une activité |
| `/factory-gate <G>` | constater une gate |
| `/factory-check` | les huit contrôles |
| `/factory-catalog` | situer un objet de la méthode |
