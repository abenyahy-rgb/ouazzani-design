/* LA MÉTHODE DANS UNE AUTRE LANGUE. Le registre s'écrit en français et fait foi ; une langue
 * de plus est une SURCOUCHE (core/i18n/<langue>.yaml) qui ne porte que du texte, rangé sous
 * les mêmes identifiants. Elle ne change ni un id, ni une règle, ni un ordre : une entrée de
 * la surcouche dont l'id n'existe plus au registre est ignorée, et un champ qu'elle ne
 * traduit pas garde son texte français — mieux vaut une phrase en français qu'une phrase
 * fausse. Le contrôle de couverture (tests/i18n.test.mjs) dit ce qui manque. */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { registry, ROOT } from './registry.mjs';
import yaml from './yaml.mjs';

export const LANGUES = ['fr', 'en'];
export const SOURCE = 'fr';

/* Les listes du registre que la surcouche traduit, chacune rangée par id, et les champs
   texte qu'elle y porte. */
export const CHAMPS = {
  cadences: ['name', 'frequence', 'fige'],
  steps: ['name'],
  activities: ['name', 'mode', 'entry', 'task', 'verification', 'exit', 'automatique'],
  work_products: ['name', 'purpose', 'completion', 'lifecycle'],
  gates: ['name', 'authority', 'question', 'evidence_pack', 'decisions', 'refusal_routing', 'expiry'],
  agents: ['mandate', 'write_boundary', 'separation_of_duties', 'class_rationale', 'activities'],
  principles: ['name', 'rule', 'controlled_by'],
  controls: ['name', 'blocks', 'verifies', 'rationale', 'scope', 'status'],
};

/* LE RESTE DU RÉFÉRENTIEL, tel que FactoryZen le montre : échelles, exceptions, traçabilité,
   routing, adaptateur, tour de contrôle, arborescence, espace de travail, capacités externes.
   Ces parties n'ont pas de liste rangée par id commune : la surcouche y reprend la FORME du
   registre (listes alignées par id quand leurs éléments en portent, par rang sinon) et ne
   remplace que le texte des chemins nommés ici — un chemin hors de cette liste (un id, un
   chemin de fichier, une valeur que la machine lit) garde sa valeur, traduite ou non. */
export const TEXTES = {
  method: ['status'],
  skills: ['[].mandate'],
  scales: ['[].name', '[].levels[].definition', '[].levels[].consequence', '[].note'],
  exceptions: ['protocol[].step', 'protocol[].rule', 'named[].situation', 'named[].behaviour', 'named[].authority'],
  traceability: ['[].entity', '[].traces_to', '[].produced_at', '[].controlled_at'],
  routing: ['classes[].usage', 'classes[].relative_cost', 'rules[].rule', 'rules[].rationale', 'modulation[].trigger', 'modulation[].effect'],
  adapter_obligations: ['[].obligation', '[].written_at', '[].tooling'],
  adoption_gate: ['[].criterion', '[].gate'],
  control_tower: ['operations[].purpose', 'powers[]', 'limits[]', 'enforcement_model', 'logic', 'state'],
  plugin_layout: ['directories[].discovery', 'directories[].source', 'context_budget.rationale', 'context_budget.estimator'],
  notion_workspace: ['contract', 'never_blocks', 'execution', 'shape', 'navigation.principle', 'navigation.growth', 'tree[].content',
    'databases[].frozen_at', 'databases[].writes', 'connector.on_absence', 'root_location.what', 'root_location.on_absence', 'may_block_an_activity',
    'page_body.mode', 'page_body.rule', 'page_body.comments', 'execution_order.phases[].name', 'execution_order.phases[].note',
    'instantiation.rationale', 'instantiation.idempotent', 'templates.rule', 'link.shape', 'link.rationale'],
  external_capabilities: ['adopted[].role', 'adopted[].audit.writes', 'adopted[].audit.state', 'adopted[].audit.dependencies',
    'adopted[].audit.verdict', 'adopted[].method_gap', 'rejected[].reason', 'rejected[].revisit', 'harness_native[].note'],
};

const parId = l => l.length > 0 && l.every(x => x && typeof x === 'object' && x.id != null);
const sousChemin = (c, k) => c ? `${c}.${k}` : k;

/** Le texte de « en » posé sur la forme de « fr », aux seuls chemins nommés. */
export function fusion(fr, en, chemins, c = '') {
  if (en == null) return fr;
  if (typeof fr === 'string') return chemins.has(c) && typeof en === 'string' ? en : fr;
  if (Array.isArray(fr)) {
    if (!Array.isArray(en)) return fr;
    if (fr.every(x => typeof x === 'string'))
      return chemins.has(c + '[]') && en.length === fr.length && en.every(x => typeof x === 'string') ? en : fr;
    const m = parId(fr) ? new Map(en.filter(x => x?.id != null).map(x => [String(x.id), x])) : null;
    return fr.map((x, i) => fusion(x, m ? m.get(String(x.id)) : en[i], chemins, c + '[]'));
  }
  if (fr && typeof fr === 'object') {
    if (typeof en !== 'object' || Array.isArray(en)) return fr;
    return Object.fromEntries(Object.entries(fr).map(([k, v]) => [k, fusion(v, en[k], chemins, sousChemin(c, k))]));
  }
  return fr;
}

/** Les chemins nommés que « en » ne traduit pas, sous la forme de « fr ». */
function absents(fr, en, chemins, c = '', out = [], lieu = '') {
  if (typeof fr === 'string') { if (fr.trim() && chemins.has(c) && typeof en !== 'string') out.push(lieu || c); return out; }
  if (Array.isArray(fr)) {
    if (fr.every(x => typeof x === 'string')) {
      if (fr.length && chemins.has(c + '[]') && !(Array.isArray(en) && en.length === fr.length)) out.push(lieu || c);
      return out;
    }
    const m = parId(fr) && Array.isArray(en) ? new Map(en.filter(x => x?.id != null).map(x => [String(x.id), x])) : null;
    fr.forEach((x, i) => absents(x, m ? m.get(String(x.id)) : (Array.isArray(en) ? en[i] : undefined), chemins, c + '[]', out,
      `${lieu || c}[${x?.id ?? i}]`));
    return out;
  }
  if (fr && typeof fr === 'object')
    for (const [k, v] of Object.entries(fr)) absents(v, en && typeof en === 'object' ? en[k] : undefined, chemins, sousChemin(c, k), out, sousChemin(lieu, k));
  return out;
}

/* Le point de départ d'une activité : ce que le Launchpad en montre. Les chemins et les
   rôles des fichiers ne sont pas traduits — ils sont lus par l'agent, en français. */
export const DEPART = ['nom', 'question', 'options', 'garde_fous'];

const caches = new Map();

export function surcouche(lang) {
  const f = join(ROOT, 'core', 'i18n', `${lang}.yaml`);
  return existsSync(f) ? yaml.load(readFileSync(f, 'utf8')) || {} : {};
}

const texte = v => typeof v === 'string' || (Array.isArray(v) && v.every(x => typeof x === 'string'));

/** Le registre, dans une langue. En français — ou dans une langue sans surcouche — le
 *  registre lui-même. */
export function registreEn(lang) {
  const r = registry();
  if (!lang || lang === SOURCE) return r;
  if (caches.has(lang)) return caches.get(lang);
  const s = surcouche(lang);
  const out = { ...r };
  for (const [liste, champs] of Object.entries(CHAMPS)) {
    const t = new Map((s[liste] || []).map(x => [String(x.id), x]));
    out[liste] = (r[liste] || []).map(e => {
      const x = t.get(String(e.id));
      if (!x) return e;
      const y = { ...e };
      for (const c of champs) if (x[c] != null && texte(x[c]) && e[c] != null) y[c] = x[c];
      if (liste === 'work_products' && Array.isArray(e.sections) && Array.isArray(x.sections))
        y.sections = e.sections.map((sec, i) => ({ ...sec, ...pick(x.sections[i], ['title', 'rule'], sec) }));
      if (liste === 'activities' && e.point_de_depart && x.point_de_depart) {
        y.point_de_depart = { ...e.point_de_depart, ...pick(x.point_de_depart, ['nom', 'question', 'garde_fous', 'options'], e.point_de_depart) };
        if (Array.isArray(e.point_de_depart.fichiers) && Array.isArray(x.point_de_depart.fichiers))
          y.point_de_depart.fichiers = e.point_de_depart.fichiers.map((f, i) => ({ ...f, ...pick(x.point_de_depart.fichiers[i], ['role'], f) }));
      }
      if (liste === 'work_products') {
        const g = gabaritsSurcouche(lang).templates?.[e.id];
        if (e.specimen && typeof g?.specimen === 'string') y.specimen = g.specimen;
      }

      if (liste === 'activities' && e.point_de_depart && x.point_de_depart)
        y.point_de_depart = { ...e.point_de_depart, ...pick(x.point_de_depart, DEPART, e.point_de_depart) };
      return y;
    });
  }
  if (s.categories) out.categories = Object.fromEntries(Object.entries(r.categories).map(([k, v]) =>
    [k, { ...v, ...pick(s.categories[k], ['name', 'recevabilite'], v) }]));
  for (const [k, chemins] of Object.entries(TEXTES))
    if (s[k] != null && r[k] != null) out[k] = fusion(r[k], s[k], new Set(chemins));
  caches.set(lang, out);
  return out;
}

function pick(x, champs, origine) {
  if (!x) return {};
  return Object.fromEntries(champs.filter(c => x[c] != null && texte(x[c]) && origine?.[c] != null).map(c => [c, x[c]]));
}

/** Ce que la surcouche ne traduit pas du reste du référentiel : [partie, chemin]. */
export function manquesReferentiel(lang) {
  const r = registry(), s = surcouche(lang), out = [];
  for (const [k, chemins] of Object.entries(TEXTES))
    for (const c of absents(r[k], s[k], new Set(chemins))) out.push([k, c]);
  return out;
}

/** Ce que la surcouche d'une langue ne traduit pas : [liste, id, champ]. */
export function manques(lang) {
  const r = registry(), s = surcouche(lang), out = [];
  for (const [liste, champs] of Object.entries(CHAMPS)) {
    const t = new Map((s[liste] || []).map(x => [String(x.id), x]));
    for (const e of r[liste] || []) {
      if (liste === 'work_products' && e.interne) continue;
      const x = t.get(String(e.id)) || {};
      for (const c of champs) if (e[c] != null && e[c] !== '' && x[c] == null) out.push([liste, e.id, c]);
      if (liste === 'activities' && e.point_de_depart)
        for (const c of DEPART) if (e.point_de_depart[c] != null && x.point_de_depart?.[c] == null) out.push([liste, e.id, `point_de_depart.${c}`]);
      if (liste === 'work_products') (e.sections || []).forEach((sec, i) => {
        for (const c of ['title', 'rule']) if (sec[c] && !x.sections?.[i]?.[c]) out.push([liste, e.id, `sections[${i}].${c}`]);
      });
      if (liste === 'activities' && e.point_de_depart) {
        const d = e.point_de_depart, y = x.point_de_depart || {};
        for (const c of ['nom', 'question', 'garde_fous', 'options']) if (d[c] != null && y[c] == null) out.push([liste, e.id, `point_de_depart.${c}`]);
        (d.fichiers || []).forEach((f, i) => { if (f.role && !y.fichiers?.[i]?.role) out.push([liste, e.id, `point_de_depart.fichiers[${i}].role`]); });
      }
    }
  }
  for (const [k, v] of Object.entries(r.categories || {}))
    for (const c of ['name', 'recevabilite']) if (v[c] && !s.categories?.[k]?.[c]) out.push(['categories', k, c]);
  return out;
}

/* ── les gabarits dans une autre langue ──────────────────────────────────
 * Même principe pour core/templates.yaml : une surcouche core/i18n/templates.<langue>.yaml,
 * texte seul, rangée par id de livrable puis par rang de section. Elle ne crée ni ne
 * supprime une section, ne touche à aucun titre (les titres sont ceux du registre traduit),
 * ni à « file », « champ », « office », « format ». Un champ qu'elle ne traduit pas garde son
 * texte français. Les exemples des formats de présentation sont des DONNÉES : la surcouche
 * remplace l'exemple entier, et la machine le recalcule — un exemple traduit qui ne se
 * vérifie plus est refusé comme un exemple français le serait. */

/** Les chemins de texte du gabarit commun (hors livrables et formats). */
export const CHAMPS_GABARITS = ['contract', 'front_matter.rule',
  'artifact_form.contract', 'artifact_form.markdown_section', 'artifact_form.fiche', 'artifact_form.collection',
  'artifact_form.file', 'artifact_form.on_missing', 'artifact_form.on_empty', 'artifact_form.on_extra',
  'artifact_form.front_matter', 'artifact_form.collections_are_free',
  'conventions.identifiants', 'conventions.source_web',
  'formats.markdown', 'formats.yaml', 'formats.executable', 'formats.mixed',
  'redaction.contrat', 'redaction.ouverture.phrase', 'redaction.ouverture.phrase_guide', 'redaction.ouverture.essentiel',
  'redaction.ouverture.essentiel_guide', 'redaction.cloture.verifier', 'redaction.cloture.verifier_guide',
  'redaction.cloture.reperes', 'redaction.cloture.reperes_guide',
  'exhibits.contract', 'exhibits.tolerance_motif', 'exhibits.commun.titre',
  'office.contrat', 'office.sortie_livrables', 'office.consigne_visible', 'office.exemple_visible', 'office.a_supprimer'];
/** Par section d'un livrable, et par fichier rédigé, ce que la surcouche traduit. */
export const CHAMPS_SECTION = ['guide', 'example', 'reponse', 'fiche'];
export const CHAMPS_OUVERTURE = ['titre', 'phrase', 'essentiel', 'verifier'];
export const CHAMPS_FORMAT = ['nom', 'reference', 'question', 'regles', 'exemple'];

let gabaritsFr = null;
const gabaritsSource = () => gabaritsFr ||= yaml.load(readFileSync(join(ROOT, 'core', 'templates.yaml'), 'utf8'));

const surcouchesGabarits = new Map();
export function gabaritsSurcouche(lang) {
  if (!lang || lang === SOURCE) return {};
  if (!surcouchesGabarits.has(lang)) {
    const f = join(ROOT, 'core', 'i18n', `templates.${lang}.yaml`);
    surcouchesGabarits.set(lang, existsSync(f) ? yaml.load(readFileSync(f, 'utf8')) || {} : {});
  }
  return surcouchesGabarits.get(lang);
}

const cachesGabarits = new Map();
/** Les gabarits (core/templates.yaml), dans une langue. En français, le fichier lui-même. */
export function gabaritsEn(lang) {
  const t = gabaritsSource();
  if (!lang || lang === SOURCE) return t;
  if (cachesGabarits.has(lang)) return cachesGabarits.get(lang);
  const s = gabaritsSurcouche(lang);
  const out = fusion(t, s, new Set(CHAMPS_GABARITS));
  if (t.exhibits?.formats) out.exhibits = { ...out.exhibits, formats: t.exhibits.formats.map(f => {
    const x = s.exhibits?.formats?.[f.id];
    if (!x) return f;
    const y = { ...f, ...pick(x, ['nom', 'reference', 'question', 'regles'], f) };
    if (x.exemple && typeof x.exemple === 'object' && x.exemple.format === f.exemple?.format) y.exemple = x.exemple;
    return y;
  }) };
  out.templates = (t.templates || []).map(tp => {
    const x = s.templates?.[tp.id];
    if (!x) return tp;
    const y = { ...tp, ...pick(x, ['layout'], tp) };
    if (tp.ouverture && x.ouverture) y.ouverture = Object.fromEntries(Object.entries(tp.ouverture).map(([file, o]) =>
      [file, { ...o, ...pick(x.ouverture[file], CHAMPS_OUVERTURE, o) }]));
    if (Array.isArray(tp.sections) && Array.isArray(x.sections))
      y.sections = tp.sections.map((sec, i) => ({ ...sec, ...pick(x.sections[i], CHAMPS_SECTION, sec) }));
    return y;
  });
  cachesGabarits.set(lang, out);
  return out;
}

/** Ce que la surcouche des gabarits ne traduit pas : [lieu, champ]. Les éléments internes du
 *  socle ne se présentent à personne : leurs gabarits ne sont pas exigés. */
export function manquesGabarits(lang) {
  const t = gabaritsSource(), s = gabaritsSurcouche(lang), r = registry(), out = [];
  for (const c of absents(t, s, new Set(CHAMPS_GABARITS))) out.push(['gabarits', c]);
  for (const f of t.exhibits?.formats || []) {
    const x = s.exhibits?.formats?.[f.id] || {};
    for (const c of CHAMPS_FORMAT) if (f[c] != null && x[c] == null) out.push([`format ${f.id}`, c]);
  }
  for (const tp of t.templates || []) {
    const w = r.work_products.find(x => x.id === tp.id);
    if (!w || w.interne) continue;
    const x = s.templates?.[tp.id] || {};
    if (tp.layout && !x.layout) out.push([tp.id, 'layout']);
    if (w.specimen && !x.specimen) out.push([tp.id, 'specimen']);
    for (const [file, o] of Object.entries(tp.ouverture || {}))
      for (const c of CHAMPS_OUVERTURE) if (o[c] != null && x.ouverture?.[file]?.[c] == null) out.push([tp.id, `ouverture.${file}.${c}`]);
    (tp.sections || []).forEach((sec, i) => {
      for (const c of CHAMPS_SECTION) if (sec[c] != null && String(sec[c]).trim() && x.sections?.[i]?.[c] == null) out.push([tp.id, `sections[${i}].${c}`]);
    });
  }
  return out;
}

/* ── les valeurs courtes que le registre écrit en français ───────────────
   Rôles composés (« product-lead et product-designer », « autorité Tech ») et niveaux de
   baseline : la machine ne les lit pas comme des clés dans les vues, mais ils ne sont pas
   rangés sous un id — une table de mots suffit, et elle laisse intact ce qu'elle ne connaît pas. */
const ROLES_EN = [
  [/quality-engineer produit/g, 'product quality-engineer'], [/critic\(quality\) classe/g, 'class critic(quality)'],
  [/orchestre la campagne SUX/g, 'runs the SUX campaign'], [/autorité Tech/g, 'Tech authority'],
  [/[Aa]utorité de release/g, 'release authority'], [/ et /g, ' and '], [/ puis /g, ' then '], [/ si /g, ' if '], [/ ; /g, '; '],
];
const BASELINES_EN = { 'produit': 'product', 'release': 'release', 'slice': 'slice', 'déploiement': 'deployment',
  'SOCLE — figé': 'FOUNDATION — frozen', 'RELEASE — figée': 'RELEASE — frozen',
  'SOCLE — noyau sémantique figé, couche dérivée vivante': 'FOUNDATION — frozen semantic core, living derived layer',
  /* une classe de capacité qui n'est pas un identifiant de classe, mais une règle */
  'R1 — jamais inférieure au producteur': 'R1 — never lower than the producer' };

/** Un rôle composé, dans une langue. */
export const roleEn = (lang, s) => !lang || lang === SOURCE || s == null ? s : ROLES_EN.reduce((t, [a, b]) => t.replace(a, b), String(s));
/** Une valeur courte (niveau de baseline, classe énoncée en règle), dans une langue. */
export const baselineEn = (lang, s) => !lang || lang === SOURCE || s == null ? s : (BASELINES_EN[s] ?? s);
