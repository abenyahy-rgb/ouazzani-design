import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import yaml from './yaml.mjs';
import { registry, cheminDe } from './registry.mjs';

/* Lecteur d'arborescence produit.
 *
 * Chaque artefact tracé porte un front-matter YAML : son identifiant, son type et
 * ses liens. C'est ce qui permet à un livrable d'être lisible par un humain ET
 * vérifiable par une machine sans dupliquer l'information dans un index parallèle —
 * un index séparé serait une seconde source de vérité. */

const FM = /^---\r?\n([\s\S]*?)\r?\n---/;

export function readFrontMatter(file) {
  const m = FM.exec(readFileSync(file, 'utf8'));
  if (!m) return null;
  try { return yaml.load(m[1]) || null; } catch { return null; }
}

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (e === 'node_modules' || e === '.git') continue;
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (e.endsWith('.md') || e.endsWith('.yaml')) acc.push(p);
  }
  return acc;
}

/** Le livrable auquel un chemin appartient, d'après le registre. null si aucun.
 *  Un chemin paramétré — {release-id} — est comparé par motif : product/releases/r1/scope.md
 *  appartient au livrable déclaré sous releases/{release-id}/scope.md. */
export function workProductOfPath(rel) {
  const p = String(rel).replace(/^product\//, '');
  for (const w of registry().work_products)
    for (const file of w.files || []) {
      const decl = (w.base || '') + file;
      if (decl === p) return w.id;
      const re = new RegExp('^' + decl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[^}]+\\\}/g, '[^/]+') + '$');
      if (re.test(p)) return w.id;
    }
  return null;
}

/** Construit le graphe du projet depuis les front-matter. null si aucun product/. */
export function loadProject(root) {
  const pdir = join(root, 'product');
  if (!existsSync(pdir)) return null;

  const entities = [];
  for (const f of walk(pdir)) {
    const fm = readFrontMatter(f);
    /* Un livrable est identifie par son WP autant que par un id d'entite. N'indexer que
       « id » rendait INVISIBLE a toute la chaine — pageBody, link, linkStatus — un
       livrable correctement produit et declare a la tour : il n'etait projetable nulle
       part, et rien ne disait pourquoi. Le contrat de front-matter est desormais declare
       au registre plutot que suppose. */
    if (fm?.id || fm?.work_product) { entities.push({ ...fm, file: relative(root, f) }); continue; }

    /* IDENTIFICATION PAR CHEMIN DÉCLARÉ. Un livrable en YAML — artifact-schema.yaml,
       project.yaml — ne PEUT PAS porter un front-matter Markdown : la clôture « --- »
       ouvrirait un second document et le fichier cesserait d'être du YAML valide
       (« expected a single document in the stream »). Exiger un front-matter rendait donc
       tout livrable YAML structurellement non projetable, SOC-01 le premier.
       Le registre déclare déjà quel chemin appartient à quel livrable : c'est une
       identification plus robuste qu'un champ recopié dans chaque fichier. */
    const wp = workProductOfPath(relative(root, f));
    if (wp) entities.push({ work_product: wp, file: relative(root, f), identified_by: 'chemin déclaré au registre' });
  }
  const of = t => entities.filter(e => e.type === t);

  const releases = of('release');
  const releaseOrder = releases.slice().sort((a, b) => (a.sequence ?? 99) - (b.sequence ?? 99)).map(r => r.id);

  /* liens typés étape → release, reconstruits depuis les fiches de release */
  const stageLinks = {};
  for (const s of of('stage')) stageLinks[s.id] = [];
  for (const r of releases)
    for (const kind of ['introduces', 'enriches', 'depends_on'])
      for (const stg of r[kind] || [])
        (stageLinks[stg] ||= []).push({ type: kind.toUpperCase().replace('_', '-'), release: r.id });

  const stories = of('story').map(s => ({
    ...s,
    acs: (s.acceptance_criteria || []).map(ac => ({ ...ac, evidence: ac.evidence || [] }))
  }));

  const runs = [];
  const rdir = join(root, 'runs');
  if (existsSync(rdir))
    for (const f of walk(rdir)) {
      const fm = readFrontMatter(f);
      if (fm?.type === 'run-ledger') runs.push(fm);
    }

  /* Deux artefacts VIVANTS sont lus tels qu'ils sont sur disque, pas déclarés par
     front-matter : leur intérêt est précisément d'être calculés ailleurs et confrontés
     ici. Un artefact vivant qui se déclarerait lui-même conforme ne prouverait rien. */
  const yamlAt = (rel) => {
    const f = join(pdir, rel);
    if (!existsSync(f)) return null;
    try { return yaml.load(readFileSync(f, 'utf8')) || null; } catch { return null; }
  };

  return { root, entities, stageLinks, releaseOrder, stories, runs,
           packs: of('evidence-pack'), spine: of('spine-element'),
           binding: yamlAt(cheminDe('WP-10', 'binding.yaml')),
           composition: yamlAt(cheminDe('WP-11', 'manifest.yaml')) };
}
