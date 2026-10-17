#!/usr/bin/env node
/* Génère dist/Gabarits.html depuis core/method.yaml ET core/templates.yaml — et
 * dist/Gabarits.en.html depuis les mêmes sources lues à travers leurs surcouches anglaises
 * (core/i18n/en.yaml, core/i18n/templates.en.yaml).
 *
 * Une PROJECTION, comme FactoryZen : jamais éditée à la main. Le registre fournit les
 * livrables, leurs sections, la règle de chaque section et le critère de complétude ;
 * le fichier de gabarits fournit le guide et l'exemple de chaque section. La page les
 * montre côte à côte, et joint le squelette exact que « apf template » rend à l'agent.
 * Elle réutilise la feuille de style de FactoryZen : une seule identité visuelle. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as resoudre } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registry, ROOT, byId } from '../lib/registry.mjs';
import { templates, renderTemplate, templateFindings, sectionFile } from '../lib/templates.mjs';
import { registreEn, gabaritsEn, roleEn, LANGUES } from '../lib/i18n.mjs';

/* ── les mentions fixes de la page, par langue ──────────────────────── */
const LIBELLES = {
  fr: {
    guide: 'Guide', exemple: 'Exemple', activite: 'Activité', controleEn: 'Contrôlé en', cycle: 'Cycle de vie',
    ra: 'Responsible / Accountable', format: 'Format', chemin: 'Chemin au registre', repartition: 'Répartition des sections',
    plan: n => `Plan de contenu — ${n} sections, chacune avec sa règle (registre), son guide et son exemple (gabarit)`,
    completude: 'Critère de complétude', squelette: id => `Squelette rendu par <code>apf template ${id}</code> — ce que l'agent remplit`,
    livrables: (n, f) => `${n} livrables · ${f}`,
    stats: ['livrables', 'sections guidées', 'formats', 'cadences', 'gates'],
    conventions: 'Conventions', communes: 'communes à tous les gabarits', forme: 'Forme opposable', frontMatter: 'Front-matter',
    requis: 'Requis', optionnel: 'Optionnel', regle: 'Règle', formats: 'Formats', nLivrables: n => `${n} livrables`,
    identifiants: 'Identifiants et échelles', cle: k => k.replace(/_/g, ' '),
    titre: 'Gabarits APF', commentaire: 'GÉNÉRÉ depuis core/method.yaml et core/templates.yaml par build/build-gabarits.mjs',
    h1: 'Gabarits des livrables',
    lede: n => `Pour chacun des ${n} livrables : ses sections telles que le registre les déclare, la règle de chacune, puis le <b>guide de rédaction</b> et l'<b>exemple rempli</b> du gabarit. L'exemple est filé de bout en bout sur un produit fictif, ChantierClair : les identifiants se répondent d'un livrable à l'autre. Cette page est <b>générée</b> depuis <code>core/method.yaml</code> et <code>core/templates.yaml</code> — un gabarit dont un titre diverge du registre fait échouer la génération.`,
    sommaire: 'Sommaire', filtrer: 'Filtrer les gabarits…',
    hint: 'Le squelette de chaque livrable est celui que rend <code>apf template &lt;WP-nn&gt;</code> ; <code>--example</code> y joint les exemples ci-contre.',
    pied: "<b>Subordination.</b> Le gabarit ne crée, ne supprime ni ne reformule une section : le titre est une clé. La suite de conformité (<code>tests/templates.test.mjs</code>) et <code>apf template check</code> refusent toute divergence avec le registre.",
    genereLe: d => `Généré le ${d}`,
  },
  en: {
    guide: 'Guide', exemple: 'Example', activite: 'Activity', controleEn: 'Controlled at', cycle: 'Lifecycle',
    ra: 'Responsible / Accountable', format: 'Format', chemin: 'Path in the registry', repartition: 'Section layout',
    plan: n => `Content outline — ${n} sections, each with its rule (registry), its guide and its example (template)`,
    completude: 'Completion criterion', squelette: id => `Skeleton rendered by <code>apf template ${id}</code>, in English — what the agent fills in`,
    livrables: (n, f) => `${n} work products · ${f}`,
    stats: ['work products', 'guided sections', 'formats', 'cadences', 'gates'],
    conventions: 'Conventions', communes: 'shared by all templates', forme: 'Enforceable form', frontMatter: 'Front-matter',
    requis: 'Required', optionnel: 'Optional', regle: 'Rule', formats: 'Formats', nLivrables: n => `${n} work products`,
    identifiants: 'Identifiers and scales',
    cle: k => ({ markdown_section: 'markdown section', fiche: 'sheet', collection: 'collection', file: 'file', on_missing: 'on missing',
      on_empty: 'on empty', on_extra: 'on extra', front_matter: 'front matter', collections_are_free: 'collections are free',
      identifiants: 'identifiers', niveau_evidence: 'evidence level', echelle_epistemique: 'epistemic scale', severite: 'severity',
      tier: 'tier', categories_du_socle: 'foundation categories', ecarts: 'gaps', classification_test: 'test classification',
      source_web: 'web source' })[k] ?? k.replace(/_/g, ' '),
    titre: 'APF templates', commentaire: 'GENERATED from core/method.yaml and core/templates.yaml (through core/i18n/en.yaml and core/i18n/templates.en.yaml) by build/build-gabarits.mjs',
    h1: 'Work product templates',
    lede: n => `For each of the ${n} work products: its sections as the registry declares them, the rule of each, then the template's <b>writing guide</b> and <b>filled-in example</b>. The example is threaded end to end through a fictional product, ChantierClair: identifiers answer one another from one work product to the next. This page is <b>generated</b> from <code>core/method.yaml</code> and <code>core/templates.yaml</code> — a template whose title diverges from the registry makes the generation fail.`,
    sommaire: 'Contents', filtrer: 'Filter the templates…',
    hint: 'The skeleton of each work product is the one <code>apf template &lt;WP-nn&gt;</code> renders; <code>--example</code> adds the examples shown here.',
    pied: '<b>Subordination.</b> A template neither creates, deletes nor rewords a section: the title is a key. The conformance suite (<code>tests/templates.test.mjs</code>) and <code>apf template check</code> refuse any divergence from the registry.',
    genereLe: d => `Generated on ${d}`,
  },
};

const E = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const H = a => a.join('');
const srch = x => `data-t="${E(String(x).toLowerCase())}"`;
const groupBy = (list, key) => list.reduce((m, x) => ((m[x[key]] ||= []).push(x), m), {});
const meta = (l, v, cls) => `<div class="mi"><dt>${E(l)}</dt><dd class="${cls || ''}">${E(v)}</dd></div>`;

/** La page Gabarits dans une langue : le HTML complet. */
export function pageGabarits(lang = 'fr') {
const L = LIBELLES[lang] || LIBELLES.fr;
const r = lang === 'fr' ? registry() : registreEn(lang), t = lang === 'fr' ? templates() : gabaritsEn(lang);
const templateOf = id => byId(t.templates || [], id) || null;
/* Les livrables présentés : sans les éléments internes du socle, que personne n'ouvre. */
const presentes = r.work_products.filter(w => !w.interne);
const catName = k => r.categories[k]?.name ?? k;
const stepLabel = id => { const s = r.steps.find(x => x.id === id); return s ? `${s.id} — ${s.name}` : id; };
const path = w => (w.base || '') + (w.files || []).join(' · ');

const wpHTML = w => {
  const tp = templateOf(w.id);
  const act = r.activities.find(a => String(a.id) === String(w.activity));
  const secs = (w.sections || []).map((s, i) => {
    const g = tp.sections[i];
    return `<li class="gs">
      <div class="gs-h"><b>${E(s.title)}</b><span class="tag">${E(sectionFile(w, tp, i) || '')}</span>${s.rule ? `<span class="rule">${E(s.rule)}</span>` : ''}</div>
      <div class="gs-b">
        <div><p class="sub">${L.guide}</p><p class="guide">${E(g.guide)}</p></div>
        <div><p class="sub">${L.exemple}</p><div class="spec"><pre>${E(g.example)}</pre></div></div>
      </div></li>`;
  });
  const skeleton = renderTemplate(w.id, lang === 'fr' ? {} : { lang });
  return `<article class="wp srch" id="${E(w.id)}" ${srch(w.id + ' ' + w.name + ' ' + w.purpose + ' ' + path(w) + ' ' + tp.layout)}
   style="--k:var(--c-${w.category});--kb:var(--c-${w.category}-bg)">
  <div class="wp-top"><div class="wp-id">${E(w.id)}</div>
   <div class="wp-t"><h4 class="wp-name">${E(w.name)}</h4><p class="wp-purpose">${E(w.purpose)}</p></div>
   <span class="chip">${E(catName(w.category))}</span></div>
  <dl class="wp-meta">${meta(L.activite, `${w.activity}${act ? ' · ' + act.name : ''}`)}${meta(L.controleEn, roleEn(lang, w.controlled_at))}${meta(L.cycle, w.lifecycle)}${meta(L.ra, roleEn(lang, w.responsible_accountable))}${meta(L.format, tp.format)}</dl>
  <dl class="wp-meta">${meta(L.chemin, path(w), 'path')}${meta(L.repartition, tp.layout, 'path')}</dl>
  <div class="wp-body"><div><p class="sub">${L.plan(w.sections.length)}</p>
   <ol class="outline gab">${H(secs)}</ol></div></div>
  <div class="wp-body" style="padding-top:0"><div class="done"><b>${L.completude}</b>${E(w.completion)}</div></div>
  <details class="skel"><summary>${L.squelette(E(w.id))}</summary><pre>${E(skeleton)}</pre></details>
 </article>`;
};

const wps = H(r.cadences.map(c => {
  const inCad = presentes.filter(w => w.cadence === c.id);
  const steps = groupBy(inCad, 'step');
  return `<section class="blk" id="${E(c.id)}"><div class="blk-h"><h2>${E(c.id)} — ${E(c.name)}</h2><span class="num">${L.livrables(inCad.length, E(c.frequence))}</span></div>` +
    H(Object.entries(steps).map(([s, list]) =>
      `<h3 class="grp" style="margin-top:18px;color:var(--slate)">${E(stepLabel(s))}</h3>
       <div class="grid">${H(list.map(wpHTML))}</div>`)) + '</section>';
}));

const nSections = presentes.reduce((n, w) => n + (w.sections || []).length, 0);
const formats = groupBy(t.templates, 'format');
const STATS = [presentes.length, nSections, Object.keys(formats).length, r.cadences.length, r.gates.length].map((v, i) => [v, L.stats[i]]);

const conv = `<section class="blk" id="conventions"><div class="blk-h"><h2>${L.conventions}</h2><span class="num">${L.communes}</span></div>
 <p class="blk-lede">${E(t.contract)}</p>
 <div class="grid g2">
  <article class="card" style="--k:var(--c-pre)"><p class="eyebrow">${L.forme}</p><p>${E(t.artifact_form.contract)}</p>
   <dl class="kv">${H(Object.entries(t.artifact_form).filter(([k]) => k !== 'contract').map(([k, v]) => `<dt>${E(L.cle(k))}</dt><dd>${E(v)}</dd>`))}</dl></article>
  <article class="card" style="--k:var(--c-reg)"><p class="eyebrow">${L.frontMatter}</p>
   <dl class="kv"><dt>${L.requis}</dt><dd class="mono">${E(t.front_matter.required.join(' · '))}</dd>
   <dt>${L.optionnel}</dt><dd class="mono">${E(t.front_matter.optional.join(' · '))}</dd>
   <dt>${L.regle}</dt><dd>${E(t.front_matter.rule)}</dd></dl></article>
  <article class="card" style="--k:var(--c-spec)"><p class="eyebrow">${L.formats}</p>
   <dl class="kv">${H(Object.entries(t.formats).map(([k, v]) => `<dt>${E(k)}</dt><dd>${E(v)} <span class="tag">${L.nLivrables((formats[k] || []).length)}</span></dd>`))}</dl></article>
  <article class="card" style="--k:var(--c-dec)"><p class="eyebrow">${L.identifiants}</p>
   <dl class="kv">${H(Object.entries(t.conventions).map(([k, v]) => `<dt>${E(L.cle(k))}</dt><dd class="mono" style="font-size:11.5px">${E(Array.isArray(v) ? v.join(' · ') : v)}</dd>`))}</dl></article>
 </div></section>`;

const SECTIONS = [['conventions', L.conventions, ''], ...r.cadences.map(c => [c.id, `${c.id} — ${c.name}`, String(presentes.filter(w => w.cadence === c.id).length)])];

let head = readFileSync(join(ROOT, 'build/factoryzen-head.html'), 'utf8')
  .replace('<title>FactoryZen</title>', `<title>${L.titre}</title>`)
  .replace('GÉNÉRÉ depuis core/method.yaml par build/build-factoryzen.mjs', L.commentaire);
head += `<style>
ol.outline.gab li.gs{padding-left:25px;margin-bottom:14px}
.gs-h{margin-bottom:6px}.gs-h b{display:block}.gs-h .rule{display:block}
.gs-b{display:grid;gap:10px;background:var(--sunk);border:1px solid var(--rule2);border-radius:3px;padding:10px 12px}
@media (min-width:900px){.gs-b{grid-template-columns:minmax(0,5fr) minmax(0,6fr)}}
.gs-b .sub{margin-bottom:4px}
.guide{margin:0;font-size:13px;color:var(--ink);line-height:1.5}
.gs-b .spec{margin:0}.gs-b .spec pre{margin:0;font-size:11.5px;line-height:1.5;white-space:pre-wrap}
details.skel{border-top:1px solid var(--rule2);background:var(--sunk)}
details.skel summary{cursor:pointer;padding:10px 16px;font-size:12.5px;color:var(--slate);font-family:"IBM Plex Mono",monospace}
details.skel summary code{color:var(--ink)}
details.skel pre{margin:0;padding:12px 16px 16px;font-size:11.5px;line-height:1.5;overflow-x:auto;color:var(--ink);border-top:1px solid var(--rule2);background:var(--surface)}
</style>
`;

const html = head + `<div class="shell">
<header class="mast">
  <p class="kicker">${E(r.method.name)} · v${E(r.method.version)} · core/templates.yaml</p>
  <h1>${L.h1}</h1>
  <p class="lede">${L.lede(presentes.length)}</p>
  <div class="stats">${H(STATS.map(([v, l]) => `<div class="st"><b>${E(v)}</b><span>${E(l)}</span></div>`))}</div>
</header>
<div class="cols">
  <nav class="rail" aria-label="${L.sommaire}">
    <input class="find" id="find" type="search" placeholder="${L.filtrer}" autocomplete="off">
    <ul class="railList">${H(SECTIONS.map(([id, tt, n]) => `<li><a href="#${E(id)}">${E(tt)}<i>${E(n)}</i></a></li>`))}</ul>
    <ul class="railList" style="margin-top:10px">${H(presentes.map(w => `<li><a href="#${E(w.id)}"><span class="mono" style="font-size:10.5px">${E(w.id)}</span> ${E(w.name)}</a></li>`))}</ul>
    <p class="hint">${L.hint}</p>
  </nav>
  <main>${conv}${wps}</main>
</div>
<footer>
  <p>${L.pied}</p>
  <p class="mono" style="font-size:11.5px;color:var(--mute)">${L.genereLe(new Date().toISOString().slice(0, 10))} · ${E(r.method.status)}</p>
</footer></div>
<script>
const find=document.getElementById('find');
find.addEventListener('input',()=>{
 const q=find.value.trim().toLowerCase();
 document.querySelectorAll('.srch').forEach(el=>el.classList.toggle('hidden',q.length>1&&!el.dataset.t.includes(q)));
 document.querySelectorAll('section.blk').forEach(s=>{
   const items=s.querySelectorAll('.srch');
   const vis=[...items].filter(i=>!i.classList.contains('hidden')).length;
   s.classList.toggle('hidden',q.length>1&&items.length>0&&vis===0);});
});
</script>`;
return { html, presentes, nSections };
}

/* La page Gabarits dans chaque langue : dist/Gabarits.html, dist/Gabarits.<langue>.html. */
export const fichierGabarits = lang => lang === 'fr' ? 'dist/Gabarits.html' : `dist/Gabarits.${lang}.html`;

if (process.argv[1] && resoudre(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const findings = templateFindings();
  if (findings.length) { console.error('gabarits ↔ registre :\n  ' + findings.join('\n  ')); process.exit(1); }
  mkdirSync(join(ROOT, 'dist'), { recursive: true });
  for (const lang of LANGUES) {
    const { html, presentes, nSections } = pageGabarits(lang);
    writeFileSync(join(ROOT, fichierGabarits(lang)), html);
    console.log(`${fichierGabarits(lang)} — ${(html.length / 1024).toFixed(1)} ko · ${presentes.length} livrables · ${nSections} sections guidées`);
  }
}
