import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import yaml from './yaml.mjs';
import { registry, byId } from './registry.mjs';
import { templates, templateOf, sectionFile, instancePaths } from './templates.mjs';
import { identity } from './bootstrap.mjs';

/* CONTENUS PAR DÉFAUT — ce qu'un humain ne devrait jamais avoir à taper.
 *
 * L'activité 1 demandait quatorze sections. Dix étaient DÉJÀ SUES : calculables depuis le
 * registre, conventions standard, ou recueillies au lancement. Les faire retaper était du
 * cérémonial — cher, sans valeur, et dangereux, parce qu'un travail perçu comme inutile se
 * bâcle. C'est ainsi qu'on obtient un livrable « complet » que personne n'a lu.
 *
 * LA LIGNE QUE CE FICHIER NE FRANCHIT PAS. Une DÉCISION ne se pré-remplit pas. Qui décide
 * G0, quelle personne porte quel rôle, en équipe ou en solo : un défaut plausible y serait
 * exactement le défaut que la méthode existe pour empêcher. Ces sections reçoivent une
 * QUESTION, jamais une réponse — et tant qu'elles la portent, « complet » est refusé par le
 * contrôle de forme. Le preset fait gagner du temps de SAISIE, jamais de DÉCISION. */

const ROOT = new URL('..', import.meta.url).pathname;
/* Le catalogue est celui du noyau. La variable d'environnement n'existe que pour qu'un test
   puisse éprouver le moteur sur un catalogue réduit : le rendre injectable évite d'avoir à
   déclarer un contenu par défaut dont le produit n'a pas besoin, juste pour couvrir une
   branche de code. */
export const PRESETS_FILE = () => process.env.FACTORYZEN_PRESETS || join(ROOT, 'core/presets.yaml');
let cache = null, cacheFrom = null;
export function presets() {
  const f = PRESETS_FILE();
  if (!cache || cacheFrom !== f) { cache = yaml.load(readFileSync(f, 'utf8')); cacheFrom = f; }
  return cache;
}
export const presetOf = (id) => (presets().templates || []).find(t => t.id === id) || null;
export const MARKER = () => presets().marker || 'À DÉCIDER';

/** Une valeur est-elle une question en attente plutôt qu'une réponse ? */
export const isPending = (v) => typeof v === 'string' && v.trimStart().startsWith(MARKER());

/* ── ce qui se CALCULE ──────────────────────────────────────────────────
   Un dériveur ne demande rien et n'invente rien : il lit le registre, l'adaptateur ou le
   dépôt. S'il devait supposer quoi que ce soit, ce ne serait pas un dériveur mais un
   défaut, et il irait dans presets.yaml en clair pour pouvoir être contredit. */

const kebab = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** La clé logique d'un chemin : ses deux derniers segments non paramétrés. */
export function logicalKey(base, file) {
  const segs = ((base || '') + file).replace(/\/$/, '').split('/')
    .filter(s => s && !/^\{.*\}$/.test(s));
  const last = (segs.pop() || '').replace(/\.[a-z0-9]+$/i, '');
  const parent = segs.pop();
  return kebab([parent, last].filter(Boolean).join('-'));
}

/** Les entrées d'artefacts, calculées — le registre les déclare déjà toutes. */
function deriveArtifactEntries() {
  const r = registry();
  const out = {};
  for (const w of r.work_products) {
    const tp = templateOf(w.id);
    /* Les sections d'un livrable se RÉPARTISSENT entre ses fichiers. Les recopier toutes
       en face de chacun décrirait un plan de contenu faux — et c'est ce plan que K7
       confronte ensuite au fichier réel. */
    const parFichier = new Map();
    (w.sections || []).forEach((sec, i) => {
      const f = sectionFile(w, tp, i);
      if (!parFichier.has(f)) parFichier.set(f, []);
      parFichier.get(f).push(sec.title);
    });
    for (const f of w.files || []) {
      let key = logicalKey(w.base, f);
      if (out[key]) key = `${key}-${kebab(w.id)}`;   /* une clé logique est unique (K2) */
      out[key] = {
        path: (w.base || '') + f,
        work_product: w.id,
        produced_by: String(w.activity ?? ''),
        controlled_at: w.controlled_at || null,
        baseline: w.baseline || null,
        lifecycle: w.lifecycle || null,
        sections: parFichier.get(f) || [],
      };
    }
  }
  return { artefacts: out };
}

/** La table classe → modèle vit dans l'adaptateur : on la RÉFÉRENCE, on ne la copie pas. */
function deriveCapabilityModelMap() {
  return { capability_classes: {
    source: 'adapter',
    ref: 'build/build-adapter.mjs',
    note: "Le noyau ne nomme aucun modèle : il nomme des CLASSES de capacité, et l'adaptateur les résout. Recopier la table ici en ferait une seconde source, périmée dès la première montée de version.",
    classes: (registry().routing?.classes || []).map(c => c.id),
  } };
}

/** L'identité, recueillie au lancement auprès d'un humain, déjà écrite par le bootstrap. */
function deriveProductIdentity(project) {
  const id = identity(project) || {};
  return { name: id.name || null, opened_at: id.opened_at || null,
           method: id.method || `${registry().method.name} v${registry().method.version}` };
}

/** Sur un espace TIRÉ, il n'y a aucun identifiant de page à porter : la page EST le commit. */
function deriveWorkspaceMap(project) {
  const pull = registry().notion_workspace?.pull_projection;
  const kind = identity(project)?.workspace_kind || null;
  if (pull && kind === pull.id)
    return { map: { kind: pull.id, entries: {},
      note: `Sans objet : la projection est TIRÉE. ${pull.link_and_sync}` } };
  return { map: { entries: {}, note: "À remplir par « apf notion map » — jamais à la main : c'est ce qui rend le rejeu idempotent." } };
}

/** Ce qui a été regardé se CONSTATE. Sur un dépôt neuf, le périmètre est le dépôt, et il est vide. */
function deriveInspectionScope(project) {
  const neuf = !existsSync(join(project, 'src')) && !existsSync(join(project, 'package.json'));
  return [
    `Inspecté   ce dépôt, à son commit d'ouverture — arborescence complète.`,
    ``,
    neuf
      ? `Non inspecté   néant. Produit NEUF : il n'existe aucun système antérieur, aucun dépôt tiers et aucun document d'exploitation à lire. Le périmètre d'inspection est donc le dépôt lui-même, et il ne contient que la méthode.`
      : `Non inspecté   à compléter : ce dépôt porte déjà du code. Lister ce qui a été lu et, surtout, ce qui ne l'a pas été — un périmètre non déclaré rend les contraintes invérifiables.`,
  ].join('\n');
}

const DERIVERS = {
  'artifact-entries': deriveArtifactEntries,
  'capability-model-map': deriveCapabilityModelMap,
  'product-identity': deriveProductIdentity,
  'workspace-map': deriveWorkspaceMap,
  'inspection-scope': deriveInspectionScope,
};

/* ── ce qu'une section reçoit ───────────────────────────────────────────── */

/**
 * Le contenu proposé pour une section : un objet pour un fichier YAML, du texte pour un
 * Markdown. Rend null quand aucun preset n'est déclaré — l'absence est un silence, pas un
 * vide à combler.
 */
export function sectionPreset(project, wpId, title) {
  const p = presetOf(wpId);
  const s = (p?.sections || []).find(x => x.title === title);
  if (!s) return null;
  if (s.kind === 'derive') {
    const fn = DERIVERS[s.from];
    if (!fn) return { kind: 'derive', error: `dériveur inconnu — ${s.from}` };
    return { kind: 'derive', content: fn(project), keys: s.keys || null };
  }
  if (s.kind === 'default') return { kind: 'default', content: s.value, keys: s.keys || null };
  if (s.kind === 'decision') {
    const q = String(s.question || '').replace(/\s+/g, ' ').trim();
    return { kind: 'decision', content: `${MARKER()} — ${q}`, keys: s.keys || null, question: q };
  }
  return null;
}

/* ── écriture ────────────────────────────────────────────────────────────
   RIEN N'EST JAMAIS ÉCRASÉ. Un preset comble ce qui manque ; il ne discute pas ce qui est
   là. Sur un fichier YAML il fusionne clé par clé, sur un Markdown il ne touche pas un
   fichier existant — la même règle que le bootstrap, et pour la même raison. */

export function applyPreset(project, wpId, { dryRun = false, instance = null } = {}) {
  const r = registry();
  const w = byId(r.work_products, wpId);
  if (!w) return { ok: false, reason: `livrable inconnu — ${wpId}` };
  const p = presetOf(wpId);
  if (!p) return { ok: false, reason: `aucun contenu par défaut déclaré pour ${wpId}`,
                   declares: (presets().templates || []).map(t => t.id) };
  const tp = templateOf(wpId);
  const paths = instancePaths(w, instance || {});
  if (paths.some(x => /\{[^}]+\}/.test(x)))
    return { ok: false, reason: `${wpId} porte un chemin paramétré : préciser l'instance` };

  const written = [], kept = [], pending = [], filled = [];
  const byFile = new Map();
  for (const [i, s] of (w.sections || []).entries()) {
    const file = tp ? (tp.sections || [])[i]?.file : (w.files || [])[0];
    if (!file) continue;
    (byFile.get(file) || byFile.set(file, []).get(file)).push(s.title);
  }

  for (const [file, titles] of byFile) {
    const rel = 'product/' + (w.base || '') + file;
    const abs = join(project, rel);

    if (file.endsWith('.yaml')) {
      const existing = existsSync(abs) ? (yaml.load(readFileSync(abs, 'utf8')) || {}) : {};
      const next = { ...existing };
      let touched = false;
      for (const title of titles) {
        const pr = sectionPreset(project, wpId, title);
        if (!pr) continue;
        const bloc = pr.kind === 'decision'
          ? Object.fromEntries((pr.keys || []).map(k => [k, pr.content]))
          : (typeof pr.content === 'string' ? yaml.load(pr.content) : pr.content);
        for (const [k, v] of Object.entries(bloc || {})) {
          /* Ce qui est déjà répondu le reste : un preset ne rediscute jamais un contenu. */
          if (k in next && next[k] !== null && next[k] !== undefined && !isPending(next[k])) continue;
          next[k] = v; touched = true;
          (pr.kind === 'decision' ? pending : filled).push(`${title} → ${k}`);
        }
      }
      if (!touched) { kept.push(rel); continue; }
      if (!dryRun) { mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, yaml.dump(next, { lineWidth: 100 })); }
      written.push(rel);
      continue;
    }

    /* Markdown : un fichier existant n'est pas retouché. */
    if (existsSync(abs)) { kept.push(rel); continue; }
    const lines = [];
    const questions = [];
    for (const title of titles) {
      const pr = sectionPreset(project, wpId, title);
      lines.push(`## ${title}`, '');
      lines.push(pr ? String(pr.content) : '…', '');
      if (pr?.kind === 'decision') { pending.push(title); questions.push(pr.question); }
      else if (pr) filled.push(title);
    }
    const fm = yaml.dump({
      id: wpId, produced_by: String(w.activity ?? ''), controlled_at: w.controlled_at || null,
      completion: 'partiel',
      reserves: questions.length ? questions : [`sections à relire : ${titles.join(' · ')}`],
      preset: 'standard',
    }, { lineWidth: 100 }).trimEnd();
    const body = ['---', fm, '---', '', `# ${wpId} — ${w.name}`, '', ...lines,
                  `<!-- Complétude : ${w.completion} -->`].join('\n') + '\n';
    if (!dryRun) { mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, body); }
    written.push(rel);
  }

  return { ok: true, work_product: wpId, written, kept, rempli: filled, a_decider: pending,
    note: pending.length
      ? `${filled.length} section(s) pré-remplie(s), ${pending.length} question(s) laissée(s) ouverte(s). Tant qu'une « ${MARKER()} » subsiste, la forme est incomplète et « complet » sera refusé : un preset fait gagner du temps de saisie, jamais du temps de décision.`
      : `${filled.length} section(s) pré-remplie(s). Aucune décision en attente.` };
}
