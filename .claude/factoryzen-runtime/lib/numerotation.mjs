/* MIGRATION DE NUMÉROTATION — un projet ouvert avant une renumérotation des livrables porte
 * les anciens identifiants : son état de tour, ses front-matter, ses fichiers Office, son
 * journal. Or le même identifiant n'y désigne pas le même livrable qu'aujourd'hui : « WP-04 »
 * était un livrable retiré, c'est désormais la recherche et synthèse utilisateur. Lu sans
 * traduction, un dépôt ancien attribuerait ses déclarations au mauvais livrable.
 *
 * Les tables viennent du registre (renumbered_work_products.versions). Chacune s'applique en
 * UNE passe — l'ancien WP-01 devient SOC-01, jamais WP-01 puis SOC-01 — et les versions
 * s'enchaînent dans l'ordre : un dépôt en numérotation 1 passe par la 2, puis la 3.
 *
 * CE QUI EST RÉÉCRIT : l'état de tour, les lignes « id: » et « work_product: » des fichiers
 * de product/, les clés de la carte de l'espace de travail, et les fichiers Office aux anciens
 * noms — retirés, le provisionnement les recalcule sous le nouveau. CE QUI NE L'EST JAMAIS : le
 * journal. On y inscrit un IDS_RENUMBERED par version appliquée, avec sa table ; un événement
 * se lit à travers la table de chaque IDS_RENUMBERED qui le suit.
 *
 * LES ACTIVITÉS AUSSI. Une version peut porter, à côté de sa table de livrables, une table
 * d'activités (« activites ») : la numérotation 5 fait se suivre les activités, 0 à 23. Elle
 * réécrit tout champ « activity » de l'état de tour — nombre ou chaîne, le type est gardé —
 * et les lignes « activity: » des fichiers de product/ ; le journal se lit à travers elle.
 *
 * L'état de tour porte « numerotation » — tout run ouvert la porte dès sa naissance : rejouée,
 * la migration ne fait rien. Un état sans ce champ est en numérotation 1. */
import { appendFileSync, existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { registry, byId } from './registry.mjs';

export const EVENEMENT = 'IDS_RENUMBERED';

const versions = () => [...(registry().renumbered_work_products?.versions || [])].sort((a, b) => a.numerotation - b.numerotation);
const tableDe = map => new Map((map || []).map(x => [String(x.from), String(x.to)]));

/** La numérotation des runs ouverts par ce plugin : la dernière version du registre. */
export const NUMEROTATION = Math.max(1, ...versions().map(v => v.numerotation));

/** Un identifiant ancien traduit par une table ; inconnu de la table, inchangé. */
export const traduire = (id, t) => t.get(id) ?? id;

/** Une activité traduite, au type d'origine : 27 reste un nombre, « 27 » une chaîne. */
export const traduireActivite = (a, t) => {
  if (a == null || a === '' || !t.size) return a;
  const n = t.get(String(a));
  return n == null ? a : typeof a === 'number' ? Number(n) : n;
};

/** Les événements du journal, chacun lu à travers les tables des IDS_RENUMBERED qui le
 *  suivent, dans l'ordre. La table est celle que l'événement porte ; à défaut — la toute
 *  première migration n'écrivait que sa table — celle du registre pour sa version. */
export function traduireJournal(evenements) {
  const parVersion = new Map(versions().map(v => [v.numerotation, v]));
  const marques = evenements.flatMap((e, i) => {
    if (e.event !== EVENEMENT) return [];
    const v = parVersion.get(e.numerotation ?? 2);
    return [{ i, t: e.map ? tableDe(e.map) : tableDe(v?.map), a: tableDe(e.activites || v?.activites) }];
  });
  if (!marques.length) return evenements;
  return evenements.map((e, i) => {
    if (e.event === EVENEMENT || (!e.work_product && e.activity == null)) return e;
    const suivantes = marques.filter(m => m.i > i);
    if (!suivantes.length) return e;
    const x = { ...e };
    if (e.work_product) x.work_product = suivantes.reduce((id, m) => traduire(id, m.t), e.work_product);
    if (e.activity != null) x.activity = suivantes.reduce((a, m) => traduireActivite(a, m.a), e.activity);
    return x;
  });
}

const walk = (d, acc = []) => {
  for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) walk(p, acc); else acc.push(p); }
  return acc;
};
const echapper = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Applique une version à un projet : état de tour, fichiers du produit, fichiers Office. */
function appliquer(root, t, tower, ta = new Map()) {
  const ids = [...t.keys()].map(echapper).join('|');
  const re = v => (Array.isArray(v) ? v.map(re)
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k,
      k === 'work_product' && typeof x === 'string' ? traduire(x, t)
      : k === 'activity' && (typeof x === 'string' || typeof x === 'number') ? traduireActivite(x, ta)
      : re(x)]))
    : v);
  const suivant = re(tower);
  const activite = new RegExp(`^(\\s*(?:-\\s*)?activity\\s*:\\s*["']?)(\\d+)(["']?\\s*(?:#.*)?)$`, 'gm');

  /* Les fichiers du produit : une ligne « id: » ou « work_product: », ou une clé de carte. */
  const ligne = new RegExp(`^(\\s*(?:-\\s*)?(?:id|work_product)\\s*:\\s*["']?)(${ids})(["']?\\s*(?:#.*)?)$`, 'gm');
  const cle = new RegExp(`^(\\s*["']?)(${ids})(["']?\\s*:)`, 'gm');
  const fichiers = [];
  const prod = join(root, 'product');
  for (const f of existsSync(prod) ? walk(prod) : []) {
    if (!/\.(md|ya?ml)$/.test(f)) continue;
    const avant = readFileSync(f, 'utf8');
    let apres = ids ? avant.replace(ligne, (_, a, id, b) => a + traduire(id, t) + b) : avant;
    if (ta.size) apres = apres.replace(activite, (_, a, n, b) => a + traduireActivite(n, ta) + b);
    if (ids && /workspace-map\.ya?ml$/.test(f)) apres = apres.replace(cle, (_, a, id, b) => a + traduire(id, t) + b);
    if (apres !== avant) { writeFileSync(f, apres); fichiers.push(f.slice(root.length + 1)); }
  }

  /* Les fichiers Office aux anciens noms : le provisionnement réécrit ceux qui se présentent. */
  const office = [];
  const dl = join(root, 'dist', 'livrables');
  const nom = new RegExp(` - (${ids}) - .+\\.(pptx|docx)$`);
  for (const f of ids && existsSync(dl) ? readdirSync(dl) : []) if (nom.test(f)) { rmSync(join(dl, f)); office.push('dist/livrables/' + f); }
  return { tower: suivant, fichiers, office };
}

/* « produced_by » d'un front-matter est un numéro d'ACTIVITÉ : la numérotation 5 ne le
   traduisait pas, et des dépôts migrés en portent un périmé. À la fin d'une migration, il est
   RÉALIGNÉ sur le registre — l'activité qui produit aujourd'hui le livrable que le fichier
   déclare. Front-matter seulement ; « gate » et toute valeur non numérique restent. */
function realignerProducteurs(root) {
  const r = registry(), out = [];
  const prod = join(root, 'product');
  for (const f of existsSync(prod) ? walk(prod) : []) {
    if (!/\.md$/.test(f)) continue;
    const avant = readFileSync(f, 'utf8');
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(avant);
    if (!fm) continue;
    const id = /^id:\s*["']?(WP-\d+|SOC-\d+)["']?\s*$/m.exec(fm[1])?.[1];
    const act = id && byId(r.work_products, id)?.activity;
    if (act == null || !/^\d+$/.test(String(act))) continue;
    const bloc = fm[1].replace(/^(produced_by:\s*["']?)(\d+)(["']?\s*)$/m, (x, a, n, b) => a + act + b);
    if (bloc === fm[1]) continue;
    writeFileSync(f, avant.replace(fm[1], bloc)); out.push(f.slice(root.length + 1));
  }
  return out;
}

/** Migre un projet jusqu'à la numérotation courante. Rend { migre, de, a, fichiers, office_retires }. */
export function migrerNumerotation(root) {
  const towerFile = join(root, 'runs', 'tower.json');
  if (!existsSync(towerFile)) return { migre: false };
  let tower;
  try { tower = JSON.parse(readFileSync(towerFile, 'utf8')); } catch { return { migre: false, erreur: 'état de tour illisible' }; }
  const de = tower.numerotation || 1;
  const a_appliquer = versions().filter(v => v.numerotation > de);
  if (!a_appliquer.length) return { migre: false };

  const fichiers = new Set(), office_retires = [];
  for (const v of a_appliquer) {
    const t = tableDe(v.map), ta = tableDe(v.activites);
    const r = appliquer(root, t, tower, ta);
    tower = { ...r.tower, numerotation: v.numerotation };
    r.fichiers.forEach(f => fichiers.add(f));
    office_retires.push(...r.office);
    appendFileSync(join(root, 'runs', 'ledger.ndjson'), JSON.stringify({
      at: new Date().toISOString(), event: EVENEMENT, numerotation: v.numerotation,
      map: [...t].map(([from, to]) => ({ from, to })),
      ...(ta.size ? { activites: [...ta].map(([from, to]) => ({ from, to })) } : {}),
    }) + '\n');
  }
  for (const f of realignerProducteurs(root)) fichiers.add(f);
  writeFileSync(towerFile, JSON.stringify(tower, null, 2) + '\n');
  return { migre: true, de, a: tower.numerotation, fichiers: [...fichiers], office_retires };
}
