/* Gabarits de rédaction des livrables — core/templates.yaml.
 *
 * SUBORDONNÉS au registre, jamais parallèles. Le registre (core/method.yaml) déclare pour
 * chaque livrable ses sections, la règle de chaque section et son critère de complétude.
 * Le gabarit n'en recopie rien : il ajoute, section par section, un GUIDE de rédaction,
 * un EXEMPLE rempli et le FICHIER qui porte la section. Ce module fait quatre choses :
 *
 *   1. VÉRIFIER que les gabarits ne divergent pas du registre — mêmes livrables, mêmes
 *      titres de section, même ordre, caractère pour caractère, et chaque section
 *      rattachée à un fichier que le registre déclare.
 *   2. RENDRE le squelette Markdown d'un livrable, fusion registre + gabarit.
 *   3. ÉCRIRE ce squelette aux chemins déclarés (scaffold), pour qu'un agent parte de la
 *      bonne forme plutôt que de la reconstituer.
 *   4. CONFRONTER un livrable produit à sa forme (checkArtifactForm) : c'est ce qui fait
 *      d'un gabarit un contrôle et non une consigne. La tour l'appelle à la déclaration,
 *      K7 le rejoue sur le dépôt.
 *
 * Aucune règle de méthode ne vit ici. Le YAML est lu par lib/yaml.mjs — le seul point
 * d'entrée vers le parseur vendoré (voir runtime_dependencies). */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { applies as wpApplies } from './conditions.mjs';
import { dirname, join } from 'node:path';
import yaml from './yaml.mjs';
import { registry, ROOT, byId } from './registry.mjs';
import { evaluer, exhibitFindings, formatsPortesPar } from './exhibits.mjs';
import { registreEn, gabaritsEn, roleEn } from './i18n.mjs';

let cache = null;

export function templates() {
  if (!cache) cache = yaml.load(readFileSync(join(ROOT, 'core/templates.yaml'), 'utf8'));
  return cache;
}

export const templateOf = id => byId(templates().templates || [], id) || null;

/* ── la langue d'un rendu ──────────────────────────────────────────────
   Le français est la source : registre et gabarits tels quels. Une autre langue lit leurs
   surcouches (lib/i18n.mjs) — texte seul ; la forme (sections, fichiers, fiches) reste celle
   du registre français, d'où « estFiche » lu sur le titre source. */
const autreLangue = lang => !!lang && lang !== 'fr';
const registreL = lang => autreLangue(lang) ? registreEn(lang) : registry();
const gabaritsL = lang => autreLangue(lang) ? gabaritsEn(lang) : templates();
const templateOfL = (id, lang) => byId(gabaritsL(lang).templates || [], id) || null;
const formatsL = (wpId, file, lang) => formatsPortesPar(wpId, file, lang);

/* Les mentions fixes des rendus, par langue. */
const MENTIONS = {
  fr: {
    titre: '<!-- titre : le sujet, dit comme le client le dirait — jamais un identifiant -->',
    sep: ' : ', regle: 'règle', guide: 'guide', fichier: 'fichier', completude: 'Complétude',
    collection: 'collection : un fichier par entité', machine: 'fichier machine',
    fichiers: 'Fichiers', repartition: 'Répartition', activite: 'Activité', controle: 'contrôlé en',
    specimen: 'Specimen du registre :',
    reserves: 'reserves: ["squelette écrit par apf template, sections à remplir"]',
    exhibits: (l, id) => `# exhibits: formats de présentation attendus — ${l} ; exemple : apf template ${id} --example`,
    reservesNote: '# reserves: [ … ]   obligatoire si completion = partiel',
    reperes: (w, act, fmts) => `Livrable ${w.id} — ${w.name}. Produit à l'activité ${w.activity}${act ? ` (${act.name})` : ''}, contrôlé en ${w.controlled_at}.` +
      (fmts.length ? ` Formats de présentation : ${fmts.join(', ')}.` : ''),
  },
  en: {
    titre: '<!-- title: the subject, put the way the client would put it — never an identifier -->',
    sep: ': ', regle: 'rule', guide: 'guide', fichier: 'file', completude: 'Completion',
    collection: 'collection: one file per entity', machine: 'machine file',
    fichiers: 'Files', repartition: 'Layout', activite: 'Activity', controle: 'controlled at',
    specimen: 'Registry specimen:',
    reserves: 'reserves: ["skeleton written by apf template, sections to fill in"]',
    exhibits: (l, id) => `# exhibits: expected presentation formats — ${l} ; example: apf template ${id} --example`,
    reservesNote: '# reserves: [ … ]   required if completion = partiel',
    reperes: (w, act, fmts) => `Work product ${w.id} — ${w.name}. Produced at activity ${w.activity}${act ? ` (${act.name})` : ''}, controlled at ${w.controlled_at}.` +
      (fmts.length ? ` Presentation formats: ${fmts.join(', ')}.` : ''),
  },
};
export const mentions = lang => MENTIONS[lang] || MENTIONS.fr;

const isDir = f => String(f).endsWith('/');
const isMd  = f => String(f).endsWith('.md');
const PLACEHOLDER = /^[\s…\-–—]*$/;

/* UNE QUESTION EN ATTENTE N'EST PAS UNE RÉPONSE. Les contenus par défaut (core/presets.yaml)
   remplissent ce qui est déjà su et laissent aux décisions une QUESTION marquée. Sans cette
   détection, un livrable entièrement pré-rempli passerait pour complet alors que personne
   n'aurait tranché ce que lui seul pouvait trancher — le pré-remplissage industrialiserait
   très exactement le défaut que la méthode existe pour empêcher. */
const PENDING_MARK = 'À DÉCIDER';
const isPendingValue = (v) => typeof v === 'string' && v.trimStart().startsWith(PENDING_MARK);
const isUnanswered = (content) => {
  const utile = String(content).split('\n')
    .filter(l => l.trim() && !l.trim().startsWith('<!--'));
  return !utile.length || utile.every(l => l.trimStart().startsWith(PENDING_MARK));
};

/* ── standard de rédaction ─────────────────────────────────────────────── */

export const redaction = () => templates().redaction || null;
/** Un livrable est-il soumis au standard de rédaction ? Sa cadence le dit. */
export const sousRedaction = w => !!(redaction() && (redaction().portee || []).includes(w?.cadence));
const sansCommentaires = t => String(t).replace(/<!--[\s\S]*?-->/g, '').replace(/```[\s\S]*?```/g, '');
export const estFiche = title => FICHE.test(title);

/** Les codes de méthode présents dans un texte, hors commentaires et hors « Repères de méthode ». */
export function codesInterdits(texte) {
  const R = redaction(); if (!R) return [];
  let corps = sansCommentaires(String(texte).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, ''));
  const i = corps.search(new RegExp('^##\\s+' + (R.cloture?.reperes || 'Repères de méthode'), 'm'));
  if (i >= 0) corps = corps.slice(0, i);
  const trouves = [];
  for (const c of R.codes_interdits || [])
    for (const m of corps.matchAll(new RegExp(c.motif, 'g'))) trouves.push({ nom: c.nom, code: m[0] });
  return trouves;
}

const GENERES = new Set(['model.generated.md']);
/** Les fichiers Markdown d'auteur d'un livrable : ceux qui ouvrent par une réponse. */
export const fichiersRedigés = w => (w.files || []).filter(f => isMd(f) && !isDir(f) && !GENERES.has(f.split('/').pop()));

/** Le gabarit tient-il le standard ? Chaque fichier rédigé a son ouverture, chaque section sa
 *  réponse, chaque fiche son identifiant, et aucun exemple ne porte de code de méthode. */
export function redactionFindings() {
  const R = redaction(); if (!R) return [];
  const f = [], r = registry();
  for (const w of r.work_products.filter(sousRedaction)) {
    const tp = templateOf(w.id); if (!tp) continue;
    for (const file of fichiersRedigés(w)) {
      const o = tp.ouverture?.[file];
      if (!o) { f.push(`${w.id} · ${file} : ouverture absente — titre, phrase, essentiel, ce qui reste à vérifier`); continue; }
      for (const k of ['titre', 'phrase', 'verifier']) if (!String(o[k] || '').trim()) f.push(`${w.id} · ${file} : ouverture sans « ${k} »`);
      const n = (o.essentiel || []).length, [a, b] = R.ouverture?.puces || [2, 4];
      if (n < a || n > b) f.push(`${w.id} · ${file} : l'essentiel porte ${n} puce(s), ${a} à ${b} attendues`);
      for (const t of [o.titre, o.phrase, o.verifier, ...(o.essentiel || [])])
        for (const c of codesInterdits(String(t || ''))) f.push(`${w.id} · ${file} : code de méthode dans l'ouverture — ${c.code}`);
    }
    let ficheOuverte = null;
    (w.sections || []).forEach((sec, i) => {
      const g = tp.sections?.[i] || {}, file = sectionFile(w, tp, i);
      if (!file || !isMd(file) || isDir(file) || GENERES.has(String(file).split('/').pop())) return;
      if (estFiche(sec.title)) {
        ficheOuverte = file;
        if (!g.fiche || !titleMatcher(sec.title)(g.fiche)) f.push(`${w.id} · « ${sec.title} » : fiche sans identifiant d'exemple (clé « fiche »)`);
      } else if (g.champ) {
        if (ficheOuverte !== file) f.push(`${w.id} · « ${sec.title} » : champ hors d'une fiche du même fichier`);
      } else {
        ficheOuverte = null;
        if (!String(g.reponse || '').trim()) f.push(`${w.id} · « ${sec.title} » : réponse d'exemple absente — le titre porte « ${sec.title}${TIRET}<la réponse> »`);
      }
      for (const c of codesInterdits(String(g.example || ''))) f.push(`${w.id} · « ${sec.title} » : code de méthode dans l'exemple — ${c.code}`);
    });
  }
  return f;
}

/** Le fichier qui porte une section : la clé « file » du gabarit, ou l'unique fichier du livrable. */
export function sectionFile(w, tp, i) {
  const s = tp?.sections?.[i];
  if (s?.file) return s.file;
  return (w.files || []).length === 1 ? w.files[0] : null;
}

/** Écarts entre gabarits et registre. Liste vide = cohérent. */
export function templateFindings() {
  const r = registry(), t = templates(), f = [];
  const list = t.templates || [];
  if (!t.front_matter?.required?.length) f.push('front_matter.required absent ou vide');
  if (!t.formats || typeof t.formats !== 'object') f.push('formats : collection absente');
  if (!t.artifact_form?.contract) f.push('artifact_form : contrat absent');

  const seen = new Set();
  for (const tp of list) {
    if (seen.has(tp.id)) f.push(`${tp.id} : gabarit déclaré deux fois`);
    seen.add(tp.id);
    const w = byId(r.work_products, tp.id);
    if (!w) { f.push(`${tp.id} : gabarit sans livrable au registre`); continue; }
    if (!tp.format || !(t.formats || {})[tp.format]) f.push(`${tp.id} : format « ${tp.format} » non déclaré dans formats`);
    if (!tp.layout) f.push(`${tp.id} : layout absent — quelle section vit dans quel fichier`);
    const want = (w.sections || []).map(s => s.title);
    const have = (tp.sections || []).map(s => s.title);
    if (want.length !== have.length)
      f.push(`${tp.id} : ${have.length} section(s) au gabarit, ${want.length} au registre`);
    want.forEach((title, i) => {
      if (have[i] !== title)
        f.push(`${tp.id} : section ${i + 1} — registre « ${title} », gabarit « ${have[i] ?? '∅'} »`);
    });
    (tp.sections || []).forEach((s, i) => {
      if (!String(s.guide || '').trim())   f.push(`${tp.id} · « ${s.title} » : guide absent`);
      if (!String(s.example || '').trim()) f.push(`${tp.id} · « ${s.title} » : exemple absent`);
      const file = sectionFile(w, tp, i);
      if (!file) f.push(`${tp.id} · « ${s.title} » : aucun fichier porteur — « file » obligatoire pour un livrable à plusieurs fichiers`);
      else if (!(w.files || []).includes(file)) f.push(`${tp.id} · « ${s.title} » : file « ${file} » n'est pas un fichier déclaré au registre`);
    });
  }
  for (const w of r.work_products)
    if (!seen.has(w.id)) f.push(`${w.id} : aucun gabarit — le livrable n'a pas de guide de rédaction`);
  for (const x of exhibitFindings()) f.push(`présentation : ${x}`);
  for (const x of redactionFindings()) f.push(`rédaction : ${x}`);
  return f;
}

const indent = (s, pad = '  ') => String(s).split('\n').map(l => pad + l).join('\n');

/* ── instances ─────────────────────────────────────────────────────────── */

/** Normalise une instance : « REL-x », « REL-x/S-01 », « v1.2.0 » ou { release, slice, version }.
 *  « sprint » est lu comme « slice » : c'est le nom que l'instance portait avant la boucle de slices. */
export function parseInstance(inst, w) {
  if (!inst) return {};
  if (typeof inst === 'object') return inst.sprint && !inst.slice ? { ...inst, slice: inst.sprint } : inst;
  const parts = String(inst).split('/').map(x => x.trim()).filter(Boolean);
  const pattern = (w?.base || '') + (w?.files || []).join(' ');
  if (/\{version\}/.test(pattern) && !/\{release-id\}/.test(pattern)) return { version: parts[0] };
  return { release: parts[0], slice: parts[1], version: parts[2] };
}

export function substitute(p, inst = {}) {
  return String(p).replace(/\{release-id\}/g, inst.release || '{release-id}')
                  .replace(/\{slice-id\}/g,   inst.slice   || '{slice-id}')
                  .replace(/\{version\}/g,    inst.version || '{version}');
}

/** Chemins du livrable, instanciés si les identifiants sont fournis. */
export function instancePaths(w, inst = {}) {
  return (w.files || []).map(fl => substitute((w.base || '') + fl, inst));
}

/* ── rendu ─────────────────────────────────────────────────────────────── */

function frontMatter(w, opts, t) {
  const M = mentions(opts.lang);
  /* Un squelette fraîchement écrit EST partiel : il le dit, avec sa réserve. Le producteur
     passe à « complet » quand il a rempli — et la tour vérifie qu'il l'a fait. */
  const completion = opts.completion || (opts.scaffold ? 'partiel' : '<complet | partiel>');
  const out = ['---', `id: ${w.id}`, `name: ${JSON.stringify(w.name)}`,
    `produced_by: ${JSON.stringify(String(w.activity))}`, `controlled_at: ${JSON.stringify(w.controlled_at)}`,
    `completion: ${completion}`];
  if (completion === 'partiel' && !opts.completion) out.push(M.reserves);
  const inst = parseInstance(opts.instance, w);
  const param = (w.files || []).some(f => /\{[^}]+\}/.test((w.base || '') + f));
  if (param || inst.release || inst.slice || inst.version)
    out.push(`instance: ${JSON.stringify([inst.release, inst.slice, inst.version].filter(Boolean).join(' / ') || '<release / slice / version>')}`);
  if (w.category === 'pre') out.push('evidence_level: <EMPIRICAL | DOCUMENTARY | SYNTHETIC | UNVALIDATED>');
  /* Les formats de présentation que ce fichier porte : leurs données avec « --example »,
     leur liste en commentaire sinon. Un squelette n'invente pas de chiffres. */
  const fmts = opts.file ? formatsL(w.id, opts.file, opts.lang) : (w.files || []).flatMap(f => formatsL(w.id, f, opts.lang));
  if (fmts.length) {
    if (opts.example && fmts.every(f => f.exemple))
      out.push(...yaml.dump({ exhibits: fmts.map(f => f.exemple) }, { lineWidth: 120, noRefs: true }).trimEnd().split('\n'));
    else out.push(M.exhibits(fmts.map(f => `${f.id} (${f.nom})`).join(' · '), w.id));
  }
  out.push(M.reservesNote, '---', '');
  return out;
}

/** Le corps d'un fichier rédigé au standard : ouverture, sections « clé — réponse », fiches en
 *  tableau, clôture. Avec « example », tout est rempli sur le produit fictif ; sans, chaque
 *  emplacement porte « … » et son guide en commentaire — un squelette n'invente rien. */
function corpsRedige(w, tp, file, secs, opts) {
  const R = gabaritsL(opts.lang).redaction, O = R.ouverture || {}, C = R.cloture || {}, M = mentions(opts.lang);
  const o = tp?.ouverture?.[file] || {}, ex = !!opts.example;
  const act = byId(registreL(opts.lang).activities, w.activity);
  const L = [];
  L.push(`# ${ex && o.titre ? o.titre : '…'}`, '');
  L.push(M.titre, '');
  L.push(`**${O.phrase}** ${ex && o.phrase ? o.phrase : '…'}`, '');
  L.push(`<!-- ${O.phrase_guide} -->`, '');
  L.push(`### ${O.essentiel}`, '', `<!-- ${O.essentiel_guide} -->`, '');
  (ex && o.essentiel?.length ? o.essentiel : ['…', '…', '…']).forEach(e => L.push(`- ${e}`));
  L.push('', '---', '');
  let i = 0;
  while (i < secs.length) {
    const { s, g, fiche } = secs[i];
    const notes = [];
    if (s.rule) notes.push(`${M.regle}${M.sep}${s.rule}`);
    if (g?.guide) notes.push(`${M.guide}${M.sep}${g.guide}`);
    if (fiche ?? estFiche(s.title)) {
      L.push(`## ${ex && g?.fiche ? `${g.fiche}${TIRET}${g.reponse || ''}` : s.title}`, '');
      if (notes.length) L.push('<!-- ' + notes.join('\n     ') + ' -->', '');
      L.push(ex && g?.example ? g.example : '…', '');
      const champs = [];
      while (i + 1 < secs.length && secs[i + 1].g?.champ) champs.push(secs[++i]);
      if (champs.length) {
        L.push('| | |', '|---|---|');
        for (const c of champs) L.push(`| **${c.s.title}** | ${ex && c.g?.example ? String(c.g.example).replace(/\n+/g, ' ') : '…'} |`);
        L.push('');
        const guides = champs.filter(c => c.g?.guide).map(c => `${c.s.title}${M.sep}${c.g.guide}`);
        if (guides.length) L.push('<!-- ' + guides.join('\n     ') + ' -->', '');
      }
    } else {
      L.push(`## ${s.title}${ex && g?.reponse ? TIRET + g.reponse : ''}`, '');
      if (notes.length) L.push('<!-- ' + notes.join('\n     ') + ' -->', '');
      L.push(ex && g?.example ? g.example : '…', '');
    }
    i++;
  }
  L.push('---', '', `## ${C.verifier}`, '', `<!-- ${C.verifier_guide} -->`, '', ex && o.verifier ? o.verifier : '…', '');
  const fmts = formatsL(w.id, file, opts.lang).map(f => f.nom);
  L.push(`## ${C.reperes}`, '', M.reperes(w, act, fmts), '');
  return L;
}

/** Les sections d'un livrable rangées par fichier porteur, avec leur gabarit — et leur nature
 *  de fiche, lue sur le titre SOURCE : une traduction ne fait pas d'une section une fiche. */
function parFichierDe(w, tp) {
  const source = byId(registry().work_products, w.id);
  const parFichier = new Map();
  (w.sections || []).forEach((s, i) => {
    const f = sectionFile(w, tp, i);
    if (!parFichier.has(f)) parFichier.set(f, []);
    parFichier.get(f).push({ s, g: tp?.sections?.[i], fiche: estFiche(source?.sections?.[i]?.title ?? s.title) });
  });
  return parFichier;
}

/** L'aperçu d'un gabarit, pour le VALIDER : chaque fichier rédigé tel qu'il s'écrira sur
 *  l'exemple filé (sans commentaires ni front-matter), et les sections machine avec leur
 *  consigne. Rend { standard, fichiers: [{ file, chemin, md }], machine: [{ file, title, guide, example }],
 *  consignes: [{ file, title, guide }] }. */
export function apercuGabarit(id, lang) {
  const w = byId(registreL(lang).work_products, id);
  if (!w) return null;
  const tp = templateOfL(id, lang);
  const parFichier = parFichierDe(w, tp);
  const standard = sousRedaction(w) && fichiersRedigés(w).length > 0;
  const fichiers = [], machine = [], consignes = [];
  for (const file of w.files || []) {
    const secs = parFichier.get(file) || [];
    if (standard && fichiersRedigés(w).includes(file)) {
      const md = corpsRedige(w, tp, file, secs, { example: true, lang }).join('\n').replace(/<!--[\s\S]*?-->\n*/g, '');
      fichiers.push({ file, chemin: (w.base || '') + file, md });
      for (const { s, g } of secs) consignes.push({ file, title: s.title, guide: g?.guide || '' });
    } else for (const { s, g } of secs) machine.push({ file, title: s.title, guide: g?.guide || '', example: g?.example || '' });
  }
  return { standard, fichiers, machine, consignes };
}

/** Le squelette Markdown d'un livrable : ce que l'agent remplit. */
export function renderTemplate(id, opts = {}) {
  const r = registreL(opts.lang), t = gabaritsL(opts.lang), M = mentions(opts.lang);
  const w = byId(r.work_products, id);
  if (!w) return null;
  const tp = templateOfL(id, opts.lang);
  const act = byId(r.activities, w.activity);
  const inst = parseInstance(opts.instance, w);
  const paths = instancePaths(w, inst);
  const isFile = !tp || tp.format === 'markdown';

  if (sousRedaction(w) && fichiersRedigés(w).length) {
    const parFichier = parFichierDe(w, tp);
    const out = [];
    if (tp && tp.format !== 'markdown') out.push(`> Format **${tp.format}** — ${(t.formats || {})[tp.format] || ''}`, '');
    for (const file of w.files || []) {
      const secs = parFichier.get(file) || [];
      const chemin = substitute((w.base || '') + file, inst);
      if (fichiersRedigés(w).includes(file)) {
        out.push(`<!-- ═══ ${chemin} ═══ -->`, ...frontMatter(w, { ...opts, instance: inst, file }, t), ...corpsRedige(w, tp, file, secs, opts), '');
      } else if (secs.length) {
        out.push(`<!-- ═══ ${chemin} — ${isDir(file) ? M.collection : M.machine} ═══ -->`, '');
        for (const { s, g } of secs) {
          out.push(`## ${s.title}`, '');
          const notes = [s.rule && `${M.regle}${M.sep}${s.rule}`, g?.guide && `${M.guide}${M.sep}${g.guide}`].filter(Boolean);
          if (notes.length) out.push('<!-- ' + notes.join('\n     ') + ' -->', '');
          out.push(opts.example && g?.example ? ['```', g.example, '```'].join('\n') : '…', '');
        }
      }
    }
    out.push(`<!-- ${M.completude}${M.sep}` + w.completion + ' -->');
    return out.join('\n') + '\n';
  }
  const out = frontMatter(w, { ...opts, instance: inst }, t);
  out.push(`# ${w.id} — ${w.name}`, '');
  out.push(`<!-- ${w.purpose} -->`, '');
  out.push(`<!-- ${M.fichiers}${M.sep}${paths.join(' · ')}`);
  if (tp?.layout) out.push(`     ${M.repartition}${M.sep}${tp.layout}`);
  out.push(`     ${M.activite} ${w.activity}${act ? ` — ${act.name}` : ''} · ${M.controle} ${roleEn(opts.lang, w.controlled_at)} · ${roleEn(opts.lang, w.responsible_accountable)} -->`, '');
  if (!isFile)
    out.push(`> Format **${tp.format}** — ${(t.formats || {})[tp.format] || ''}`, '');

  (w.sections || []).forEach((s, i) => {
    const g = tp?.sections?.[i];
    const file = sectionFile(w, tp, i);
    out.push(`## ${s.title}`, '');
    const notes = [];
    if (file && (w.files || []).length > 1) notes.push(`${M.fichier}${M.sep}${substitute((w.base || '') + file, inst)}`);
    if (s.rule)   notes.push(`${M.regle}${M.sep}${s.rule}`);
    if (g?.guide) notes.push(`${M.guide}${M.sep}${g.guide}`);
    if (notes.length) out.push('<!-- ' + notes.join('\n     ') + ' -->', '');
    if (opts.example && g?.example) out.push('```', g.example, '```', '');
    else out.push('…', '');
  });
  out.push(`<!-- ${M.completude}${M.sep}` + w.completion + ' -->');
  if (opts.example && w.specimen) out.push('', `<!-- ${M.specimen}`, indent(w.specimen), '-->');
  return out.join('\n') + '\n';
}

/* ── scaffold : écrire le squelette aux chemins déclarés ───────────────── */

/** Écrit les fichiers d'un livrable depuis son gabarit. N'écrase jamais un fichier existant. */
export function scaffoldArtifact(project, id, opts = {}) {
  const r = registry(), t = templates();
  const w = byId(r.work_products, id);
  if (!w) return { ok: false, reason: `livrable inconnu — ${id}` };
  const tp = templateOf(id);
  const inst = parseInstance(opts.instance, w);
  const paths = instancePaths(w, inst);
  if (paths.some(p => /\{[^}]+\}/.test(p)))
    return { ok: false, reason: `${id} : chemin paramétré — préciser l'instance (release, slice ou version)`, paths };

  const bySection = new Map();
  (w.sections || []).forEach((s, i) => {
    const file = sectionFile(w, tp, i);
    if (!bySection.has(file)) bySection.set(file, []);
    bySection.get(file).push({ s, g: tp?.sections?.[i] });
  });

  const written = [], kept = [];
  for (const file of w.files || []) {
    const abs = join(project, 'product', substitute((w.base || '') + file, inst));
    if (isDir(file)) {
      if (!existsSync(abs)) { mkdirSync(abs, { recursive: true }); written.push(abs); } else kept.push(abs);
      continue;
    }
    mkdirSync(dirname(abs), { recursive: true });
    if (existsSync(abs)) { kept.push(abs); continue; }
    const secs = bySection.get(file) || [];
    let body;
    if (isMd(file) && sousRedaction(w) && fichiersRedigés(w).includes(file)) {
      body = [...frontMatter(w, { ...opts, instance: inst, scaffold: true, file }, t), ...corpsRedige(w, tp, file, secs, opts)].join('\n');
    } else if (isMd(file)) {
      const lines = frontMatter(w, { ...opts, instance: inst, scaffold: true, file }, t);
      lines.push(`# ${w.id} — ${w.name}${(w.files || []).length > 1 ? ` · ${file}` : ''}`, '');
      for (const { s, g } of secs) {
        lines.push(`## ${s.title}`, '');
        const notes = [];
        if (s.rule)   notes.push(`règle : ${s.rule}`);
        if (g?.guide) notes.push(`guide : ${g.guide}`);
        if (notes.length) lines.push('<!-- ' + notes.join('\n     ') + ' -->', '');
        lines.push(opts.example && g?.example ? g.example : '…', '');
      }
      lines.push(`<!-- Complétude : ${w.completion} -->`);
      body = lines.join('\n') + '\n';
    } else if (file.endsWith('.yaml')) {
      /* UN SQUELETTE YAML PORTE SES SECTIONS, comme un squelette Markdown porte ses H2.
         Il n'en portait aucune : le fichier n'était qu'un en-tête de commentaires, et un
         livrable dont les sections vivent en YAML — SOC-01 en tête — pouvait donc être
         déclaré « complet » sur un fichier qui ne contenait rien. Sans « --example », la
         clé est rendue EN COMMENTAIRE : un squelette n'est pas un livrable, et le contrôle
         de forme doit continuer à le dire. */
      const lines = [`# ${w.id} — ${w.name} · ${file}`, `# Complétude : ${w.completion}`, ''];
      for (const { s: sec, g } of secs) {
        lines.push(`# ── ${sec.title}`);
        if (sec.rule) lines.push(`#    règle : ${sec.rule}`);
        if (g?.guide) lines.push(`#    guide : ${g.guide}`);
        if (opts.example && g?.example) lines.push(g.example, '');
        else lines.push(`#    ${(keysOfSection(w.id, sec.title)[0] || kebabKey(sec.title))}: …`, '');
      }
      body = lines.join('\n');
    } else {
      continue; /* html, css, json, sources : produits par un build, jamais par un squelette */
    }
    writeFileSync(abs, body);
    written.push(abs);
  }
  return { ok: true, written, kept };
}

/* ── contrôle de forme : le gabarit devient opposable ──────────────────── */

const FM = /^---\r?\n([\s\S]*?)\r?\n---/;

function readFm(text) {
  const m = FM.exec(text);
  if (!m) return { fm: null, body: text };
  try { return { fm: yaml.load(m[1]) || {}, body: text.slice(m[0].length) }; }
  catch { return { fm: null, body: text, invalid: true }; }
}

/** Une section « fiche » : son titre commence par un identifiant à motif — OUT-nn, HYP-nn,
 *  STO-nn, AC-nn.n, REL-nom, DEP-vX.Y. Elle est satisfaite par tout titre portant ce préfixe
 *  et un identifiant réel : « OUT-01 · … » satisfait « OUT-nn — énoncé ». */
const FICHE = /^([A-Z]{2,4})-(?:nn(?:\.n)?|nom|vX\.Y)\b/;
const TIRET = ' — ';
export function titleMatcher(title) {
  const m = FICHE.exec(title);
  /* La clé reste exacte ; la réponse s'accole après un tiret cadratin. « Problème — le
     marché est déjà servi » porte la section « Problème » et dit au lecteur ce qu'elle établit. */
  if (!m) return t => t === title || t.startsWith(title + TIRET);
  const re = new RegExp('^' + m[1] + '-(?!nn\\b|nn\\.n\\b|nom\\b|vX\\.Y\\b)[\\w.]+');
  return t => re.test(t);
}

/** Les sections d'un Markdown, hors blocs de code et commentaires : titres H2 et H3 avec
 *  leur contenu (jusqu'au prochain titre de niveau égal ou supérieur), et les LIBELLÉS —
 *  « **Nombre suivi** » en tête de ligne ou de cellule de table — avec ce qui les suit.
 *  Un champ de fiche vit légitimement dans une table : le registre le montre lui-même
 *  dans ses specimens. Le titre reste une clé exacte, seule sa forme varie. */
export function sectionsOf(md) {
  const clean = md.replace(/```[\s\S]*?```/g, m => m.replace(/^#/gm, ' ')).replace(/<!--[\s\S]*?-->/g, '');
  const out = []; const open = [];
  const LABEL = /^\|?\s*\*\*(.+?)\*\*\s*(?:\||:)?\s*(.*?)\s*\|?\s*$/;
  for (const line of clean.split('\n')) {
    const h = /^(#{2,3}) (.+?)\s*$/.exec(line);
    if (h) {
      const level = h[1].length;
      while (open.length && open[open.length - 1].level >= level) open.pop();
      const sec = { title: h[2], level, content: '', kind: 'heading' };
      out.push(sec); open.push(sec);
      continue;
    }
    if (/^#\s/.test(line)) { open.length = 0; continue; }
    for (const o of open) o.content += line + '\n';
    const l = LABEL.exec(line);
    if (l && l[1].trim()) out.push({ title: l[1].trim(), level: 4, content: l[2] || '', kind: 'label' });
  }
  return out;
}

/**
 * Confronte un livrable produit à sa forme. Rend { ok, findings, observations, files }.
 * ok = aucun finding. « complet » exige ok ; « partiel » consigne les findings sans refuser.
 */
/* Les clés YAML d'une section sont déclarées avec son contenu par défaut. La lecture est
   PARESSEUSE et tolérante : sans core/presets.yaml, le contrôle retombe simplement sur son
   comportement d'avant — un gabarit absent n'invente pas d'exigence. */
let presetIndex = null;
function keysOfSection(wpId, title) {
  if (presetIndex === null) {
    presetIndex = new Map();
    try {
      const doc = yaml.load(readFileSync(join(ROOT, 'core/presets.yaml'), 'utf8'));
      for (const t of doc.templates || [])
        for (const s of t.sections || [])
          if (s.keys?.length) presetIndex.set(`${t.id}\u0000${s.title}`, s.keys);
    } catch { /* sans presets.yaml, aucune clé n'est exigée */ }
  }
  return presetIndex.get(`${wpId}\u0000${title}`) || [];
}

export function checkArtifactForm(project, id, opts = {}) {
  const r = registry(), t = templates();
  const w = byId(r.work_products, id);
  if (!w) return { ok: false, findings: [`livrable inconnu — ${id}`], observations: [], files: [] };

  /* UN LIVRABLE SANS OBJET EST CONFORME PAR CONSTRUCTION — tant que rien n'a été produit.
     Exiger les fichiers d'un livrable qui ne s'applique pas produirait un écart permanent
     que personne ne peut lever, et un écart qu'on ne peut pas lever, on apprend à ne plus
     le lire.
     MAIS LA DISPENSE S'ARRÊTE À LA PREMIÈRE LIGNE ÉCRITE. Produire un livrable hors portée,
     c'est affirmer qu'il s'applique ; la condition dispense de le PRODUIRE, jamais de le
     produire BIEN. Sans cette réserve, un fichier déposé sous un livrable conditionné
     échapperait à tout contrôle — une porte de sortie, pas une condition. */
  const portee = wpApplies(project, id);
  if (!portee.applies) {
    const instHP = parseInstance(opts.instance, w);
    const rien = instancePaths(w, instHP).every(x => !existsSync(join(project, 'product', x)));
    if (rien)
      return { ok: true, findings: [], observations: [], files: [], sans_objet: true,
               condition: portee.condition, fait: portee.reason, note: portee.note };
  }
  const tp = templateOf(id);
  const inst = parseInstance(opts.instance, w);
  const findings = [], observations = [], files = [];
  const paths = instancePaths(w, inst);
  const unresolved = paths.filter(p => /\{[^}]+\}/.test(p));
  if (unresolved.length)
    return { ok: false, findings: [`${id} : chemin paramétré non résolu — déclarer l'instance (release, slice ou version) : ${unresolved.join(' · ')}`],
             observations, files: [] };

  const bySection = new Map();
  (w.sections || []).forEach((s, i) => {
    const file = sectionFile(w, tp, i);
    if (!bySection.has(file)) bySection.set(file, []);
    bySection.get(file).push(s.title);
  });

  for (const file of w.files || []) {
    const rel = 'product/' + substitute((w.base || '') + file, inst);
    const abs = join(project, rel);
    const wanted = bySection.get(file) || [];
    files.push(rel);
    if (isDir(file)) {
      if (!existsSync(abs)) { findings.push(`${rel} : collection absente${wanted.length ? ` — porte « ${wanted.join(' », « ')} »` : ''}`); continue; }
      const n = readdirSync(abs).filter(x => !x.startsWith('.')).length;
      if (!n && wanted.length) findings.push(`${rel} : collection vide — « ${wanted.join(' », « ')} » sans aucune entrée`);
      continue;
    }
    if (!existsSync(abs)) { findings.push(`${rel} : fichier absent${wanted.length ? ` — porte « ${wanted.join(' », « ')} »` : ''}`); continue; }
    if (statSync(abs).isDirectory()) { findings.push(`${rel} : un dossier, pas un fichier`); continue; }
    const text = readFileSync(abs, 'utf8');
    if (file.endsWith('.yaml')) {
      /* UN YAML NE SE CONTENTE PLUS DE PARSER. Jusqu'ici un livrable dont les sections
         vivent dans des fichiers YAML — SOC-01 en tête — ne voyait vérifier QUE la syntaxe :
         un fichier vide et bien formé passait « complet ». Le titre d'une section est une
         clé lisible par machine, en Markdown comme en YAML ; le gabarit nomme la clé, et
         son absence est un écart au même titre qu'un H2 manquant. */
      let doc = null;
      try { doc = yaml.load(text); } catch (e) { findings.push(`${rel} : YAML invalide — ${String(e.message).split('\n')[0]}`); continue; }
      const idx = new Map((w.sections || []).map((sec, i) => [sec.title, i]));
      for (const title of wanted) {
        const keys = keysOfSection(id, title);
        if (!keys.length) continue;   /* aucune clé déclarée : rien à exiger, on se tait */
        const absentes = keys.filter(k => !doc || doc[k] === undefined || doc[k] === null || doc[k] === '');
        if (absentes.length === keys.length) { findings.push(`${rel} : section absente — « ${title} » (clé ${keys.join(' · ')})`); continue; }
        if (absentes.length) findings.push(`${rel} : section « ${title} » incomplète — clé absente : ${absentes.join(' · ')}`);
        if (keys.some(k => isPendingValue(doc?.[k])))
          findings.push(`${rel} : section en attente de décision — « ${title} » porte encore « ${PENDING_MARK} »`);
      }
      void idx;
      continue;
    }
    if (!isMd(file)) continue; /* html, css, json, sources : l'existence suffit ici ; K4 et le build jugent le contenu */

    const { fm, invalid } = readFm(text);
    if (invalid) findings.push(`${rel} : front-matter YAML invalide`);
    else if (!fm) findings.push(`${rel} : front-matter absent — requis : ${t.front_matter.required.join(', ')}`);
    else {
      for (const k of t.front_matter.required) if (fm[k] === undefined || fm[k] === null || fm[k] === '') findings.push(`${rel} : front-matter sans « ${k} »`);
      if (fm.id !== undefined && String(fm.id) !== w.id) findings.push(`${rel} : front-matter id « ${fm.id} », attendu ${w.id}`);
      if (opts.completion && fm.completion !== undefined && fm.completion !== opts.completion)
        findings.push(`${rel} : front-matter completion « ${fm.completion} », déclaré « ${opts.completion} » — le fichier et la déclaration doivent dire la même chose`);
      if (fm.completion === 'partiel' && !([].concat(fm.reserves || []).filter(Boolean).length))
        findings.push(`${rel} : partiel sans « reserves » dans le front-matter`);
    }
    /* LE FORMAT DE PRÉSENTATION EST UNE FORME COMME UNE AUTRE. Un livrable déclaré complet
       porte les données de chacun de ses formats ; les données portées sont vérifiées — un
       chiffre annoncé que le calcul dément est un défaut au même titre qu'un H2 manquant. */
    if (fm && !invalid) {
      const portes = [].concat(fm.exhibits || []);
      const complet = (opts.completion || fm.completion) === 'complet';
      for (const need of formatsPortesPar(w.id, file)) {
        if (portes.some(e => e?.format === need.id)) continue;
        const msg = `${rel} : format « ${need.nom} » sans données — clé « exhibits » du front-matter`;
        if (complet && need.exige_a === 'complet') findings.push(msg); else observations.push(msg + ' (consigné : livrable partiel)');
      }
      for (const e of portes) {
        const ev = evaluer(e, { wp: w.id, file });
        for (const x of ev.defauts) findings.push(`${rel} : format « ${ev.nom || e?.format} » — ${x}`);
      }
    }
    const secs = sectionsOf(text);
    for (const title of wanted) {
      const match = titleMatcher(title);
      const hits = secs.filter(s => match(s.title));
      if (!hits.length) { findings.push(`${rel} : section absente — « ${title} »`); continue; }
      if (hits.length > 1 && !FICHE.test(title) && hits.every(h => h.kind === 'heading'))
        observations.push(`${rel} : section « ${title} » présente ${hits.length} fois`);
      if (hits.every(h => PLACEHOLDER.test(h.content))) findings.push(`${rel} : section vide — « ${title} »`);
      else if (hits.every(h => isUnanswered(h.content)))
        findings.push(`${rel} : section en attente de décision — « ${title} » porte encore « ${PENDING_MARK} »`);
    }
    /* LE STANDARD DE RÉDACTION EST UNE FORME, CONTRÔLÉE COMME LES SECTIONS. Un livrable de
       la portée ouvre par sa réponse et son essentiel, dit ce qui reste à vérifier quand il
       est partiel, et garde ses identifiants de méthode pour la fin. Un fichier généré par
       l'outillage (front-matter « generated ») n'est pas un texte d'auteur : il en est dispensé. */
    const R = redaction();
    const standard = new Set();
    if (R && sousRedaction(w) && !(fm && fm.generated) && fichiersRedigés(w).includes(file)) {
      const O = R.ouverture || {}, C = R.cloture || {};
      [O.essentiel, C.verifier, C.reperes, ...(R.annexes_admises || [])].filter(Boolean).forEach(x => standard.add(x));
      const propre = sansCommentaires(text);
      const phrase = new RegExp('\\*\\*' + O.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\*\\*[ \\t]*(.*)').exec(propre);
      if (!phrase) findings.push(`${rel} : ouverture absente — « **${O.phrase}** » suivi de la réponse du livrable`);
      else if (PLACEHOLDER.test(phrase[1]) || isUnanswered(phrase[1])) findings.push(`${rel} : ouverture vide — « ${O.phrase} »`);
      const ess = secs.find(x => x.kind === 'heading' && x.title === O.essentiel);
      const puces = ess ? ess.content.split('\n').filter(l => /^\s*[-*]\s+/.test(l) && !PLACEHOLDER.test(l.replace(/^\s*[-*]\s+/, ''))).length : 0;
      if (!ess) findings.push(`${rel} : ouverture absente — « ${O.essentiel} »`);
      else if (!puces) findings.push(`${rel} : ouverture vide — « ${O.essentiel} » sans puce`);
      else if (O.puces && (puces < O.puces[0] || puces > O.puces[1]))
        observations.push(`${rel} : « ${O.essentiel} » porte ${puces} puce(s), ${O.puces[0]} à ${O.puces[1]} attendues`);
      if (fm?.completion === 'partiel') {
        const v = secs.find(x => x.kind === 'heading' && x.title === C.verifier);
        if (!v || PLACEHOLDER.test(v.content)) findings.push(`${rel} : livrable partiel sans « ${C.verifier} » — le lecteur doit savoir ce qui n'est pas établi`);
      }
      const codes = codesInterdits(text);
      if (codes.length) findings.push(`${rel} : ${codes.length} code(s) de méthode dans le corps — ${[...new Set(codes.map(c => c.code))].slice(0, 4).join(', ')} ; leur place est en « ${C.reperes} »`);
    }
    const matchers = (w.sections || []).map(s => titleMatcher(s.title));
    for (const s of secs.filter(x => x.level === 2))
      if (!standard.has(s.title) && !matchers.some(m => m(s.title))) observations.push(`${rel} : H2 hors plan — « ${s.title} » (OBSERVATION, enrichir le plan est une MCR)`);
  }
  return { ok: findings.length === 0, findings, observations, files };
}

/** Faute de clé déclarée, une clé lisible dérivée du titre — indicative, en commentaire. */
const kebabKey = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

/** Vue courte pour « apf template list ». */
export function templateIndex() {
  const r = registry();
  return r.work_products.map(w => {
    const tp = templateOf(w.id);
    return { id: w.id, name: w.name, format: tp?.format || '—', sections: (w.sections || []).length,
             guided: (tp?.sections || []).filter(s => s.guide && s.example).length, controlled_at: w.controlled_at };
  });
}
