import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { registry, byId } from './registry.mjs';
import { identity } from './bootstrap.mjs';

/* LIVRABLES CONDITIONNÉS — « sans objet » n'est pas « manquant ».
 *
 * Tout livrable du registre s'imposait à tout projet. Un produit neuf devait donc décrire
 * l'architecture d'un existant qui n'existe pas, et ce livrable restait « à produire »
 * jusqu'à ce que quelqu'un le remplisse de plausible ou apprenne à ignorer la liste. La
 * seconde issue est la pire : une liste qu'on apprend à ignorer ne protège plus de rien.
 *
 * Un livrable sans objet est CONSIGNÉ comme tel, avec le fait qui le tranche. Un silence
 * ne vaut pas une dispense : la différence entre « nous avons regardé et cela ne s'applique
 * pas » et « personne n'y a pensé » est exactement ce qu'un gate doit pouvoir lire. */

const safe = (fn, f = null) => { try { return fn(); } catch { return f; } };

/* Les traces de la MÉTHODE ne sont pas les traces d'un SYSTÈME : un dépôt qui ne contient
   que sa gouvernance est un dépôt neuf, quoi qu'il porte par ailleurs. */
/* dist/ : le plugin y écrit les livrables Office du projet (dist/livrables/) — un dépôt neuf
   qui en porte n'a pas d'existant pour autant. */
const ARTEFACTS_DE_METHODE = new Set(['product', 'runs', 'dist', '.factoryzen', '.claude', '.github', '.git', '.gitmodules', '.mcp.json', 'CLAUDE.md', 'README.md', '.gitignore', 'LICENSE']);
const MANIFESTES = ['package.json', 'pyproject.toml', 'go.mod', 'Cargo.toml', 'pom.xml', 'build.gradle', 'Gemfile', 'composer.json', 'requirements.txt'];
const DOSSIERS_DE_CODE = ['src', 'app', 'lib', 'services', 'apps', 'packages', 'backend', 'frontend'];

/** Le dépôt porte-t-il déjà un système, ou seulement sa gouvernance ? */
export function brownfield(project) {
  return safe(() => {
    for (const m of MANIFESTES) if (existsSync(join(project, m))) return { vrai: true, fait: `le dépôt porte ${m}` };
    for (const d of DOSSIERS_DE_CODE) {
      const p = join(project, d);
      if (existsSync(p) && safe(() => readdirSync(p).length, 0) > 0) return { vrai: true, fait: `le dépôt porte un dossier ${d}/ non vide` };
    }
    const racine = safe(() => readdirSync(project).filter(e => !e.startsWith('.') && !ARTEFACTS_DE_METHODE.has(e)), []);
    if (racine.length) return { vrai: true, fait: `le dépôt porte ${racine.slice(0, 3).join(', ')} hors artefacts de méthode` };
    return { vrai: false, fait: "le dépôt ne contient que les artefacts de la méthode" };
  }, { vrai: true, fait: 'dépôt illisible — on suppose un existant plutôt que de dispenser à tort' });
}

const DETECTEURS = { brownfield };

/**
 * Une condition est-elle vraie pour ce projet ? La DÉTECTION prime, et à défaut la
 * déclaration portée par SOC-01 tranche. Rien n'est supposé en silence : la réponse
 * porte toujours le fait qui la fonde.
 */
export function evaluate(project, conditionId) {
  const c = byId(registry().conditions?.list || [], conditionId);
  if (!c) return { vrai: true, fait: `condition inconnue — ${conditionId} : on n'exempte pas sur une règle qu'on ne connaît pas` };
  const declare = identity(project)?.conditions?.[conditionId];
  if (declare !== undefined && declare !== null)
    return { vrai: !!declare, fait: `déclaré dans SOC-01 : ${conditionId} = ${declare}`, declared: true };
  const d = DETECTEURS[conditionId];
  if (!d) return { vrai: true, fait: `aucun détecteur pour ${conditionId}, et rien de déclaré — on n'exempte pas par défaut` };
  return d(project);
}

/**
 * Ce livrable s'applique-t-il à ce projet ?
 * Un livrable sans condition s'applique toujours — le défaut reste la méthode entière.
 */
export function applies(project, wpId) {
  const w = byId(registry().work_products, wpId);
  if (!w) return { applies: true, reason: null };
  const cond = w.applies_when;
  if (!cond) return { applies: true, reason: null };
  const r = evaluate(project, cond.condition);
  if (r.vrai) return { applies: true, condition: cond.condition, reason: r.fait };
  return {
    applies: false, condition: cond.condition, reason: r.fait,
    note: String(cond.when_false || '').replace(/\s+/g, ' ').trim(),
    declared: !!r.declared,
  };
}

/** Les livrables sans objet pour ce projet, consignés avec le fait qui les tranche. */
export function outOfScope(project) {
  return registry().work_products
    .filter(w => w.applies_when)
    .map(w => ({ id: w.id, name: w.name, ...applies(project, w.id) }))
    .filter(x => !x.applies);
}
