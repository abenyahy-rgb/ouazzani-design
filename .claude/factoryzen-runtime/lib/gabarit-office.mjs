/* LE GABARIT EN FICHIER OFFICE — un modèle neutre, rendu en Word ou en PowerPoint.
 *
 * Le Markdown reste la source que la machine contrôle. Le lecteur, lui, ouvre Word ou
 * PowerPoint : chaque gabarit s'y livre, avec la même ouverture, les mêmes sections « clé —
 * réponse », les mêmes fiches et la même clôture que le standard de rédaction. Ce module ne
 * rend rien : il assemble le modèle que render/gabarit-docx.mjs et render/pack-pptx.mjs
 * dessinent. Un seul modèle pour les deux formats, pour qu'ils ne divergent jamais. */

import { registry, byId } from './registry.mjs';
import { templates, templateOf, redaction, sousRedaction, fichiersRedigés, estFiche, sectionFile, mentions } from './templates.mjs';
import { formatsDeclares, formatsPortesPar, evaluer } from './exhibits.mjs';
import { registreEn, gabaritsEn, roleEn } from './i18n.mjs';

/* La langue d'un gabarit Office : le français est la source, une autre langue lit les
   surcouches (lib/i18n.mjs). La forme — fichiers, sections, fiches, formats — ne change pas. */
const autreLangue = lang => !!lang && lang !== 'fr';
const registreL = lang => autreLangue(lang) ? registreEn(lang) : registry();
const gabaritsL = lang => autreLangue(lang) ? gabaritsEn(lang) : templates();

/* Les mentions fixes du modèle, par langue. */
const LIBELLES = {
  fr: { phrase: 'En une phrase.', essentiel: "L'essentiel", verifier: 'Ce qui reste à vérifier', reperes: 'Repères de méthode',
        source: (file, ref) => `Exemple filé sur ChantierClair. Données à porter dans la clé « exhibits » du front-matter de ${file}. Référence : ${ref}.` },
  en: { phrase: 'In one sentence.', essentiel: 'The essentials', verifier: 'What remains to be verified', reperes: 'Method references',
        source: (file, ref) => `Example threaded through ChantierClair. Data to carry under the "exhibits" key of the front-matter of ${file}. Reference: ${ref}.` },
};

const isDir = f => String(f).endsWith('/');
const isMd = f => /\.md$/.test(f);

/** Le format Office d'un livrable, tel que le gabarit le déclare. */
export const officeDe = id => templateOf(id)?.office || null;

/** Les réglages communs, lus dans le bloc « office » du gabarit. */
export const reglagesOffice = lang => gabaritsL(lang).office || {};

/** Le dossier des gabarits Office d'une langue : dist/gabarits/ en français, un sous-dossier
 *  par autre langue (dist/gabarits/en/). */
export const sousDossierOffice = lang => autreLangue(lang) ? `${lang}/` : '';

/** Le nom de fichier d'un gabarit Office : identifiant, nom, extension. Lisible dans un dossier.
 *  Dans une autre langue, le nom du livrable dans cette langue — même schéma. */
export function nomFichierOffice(id, lang) {
  const w = byId(registreL(lang).work_products, id);
  const propre = String(w.name).replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
  return `${w.step} - ${w.id} - ${propre}.${officeDe(id)}`;
}

/** Le modèle d'un gabarit : ouverture, blocs (sections et fiches), clôture, par fichier. */
export function modeleGabarit(id, lang) {
  const r = registreL(lang), T = gabaritsL(lang), LB = LIBELLES[lang] || LIBELLES.fr;
  const w = byId(r.work_products, id);
  if (!w) return null;
  const source = byId(registry().work_products, id);
  const tp = byId(T.templates || [], id) || null;
  const R = T.redaction || {}, O = R.ouverture || {}, C = R.cloture || {};
  const act = byId(r.activities, w.activity);
  const standard = sousRedaction(w) && fichiersRedigés(w).length > 0;
  const redigés = new Set(standard ? fichiersRedigés(w) : []);

  const parFichier = new Map((w.files || []).map(f => [f, []]));
  (w.sections || []).forEach((s, i) => {
    const f = sectionFile(w, tp, i) || (w.files || [])[0];
    if (!parFichier.has(f)) parFichier.set(f, []);
    parFichier.get(f).push({ s, g: tp?.sections?.[i] || {}, fiche: estFiche(source.sections?.[i]?.title ?? s.title) });
  });

  const fichiers = [];
  for (const [file, secs] of parFichier) {
    const nature = isDir(file) ? 'collection' : redigés.has(file) ? 'redige' : isMd(file) ? 'texte' : 'machine';
    const o = tp?.ouverture?.[file];
    const blocs = [];
    for (let i = 0; i < secs.length; i++) {
      const { s, g, fiche } = secs[i];
      const base = { titre: s.title, regle: s.rule || '', guide: g.guide || '', exemple: g.example || '' };
      if (fiche) {
        const champs = [];
        while (i + 1 < secs.length && secs[i + 1].g?.champ) {
          const c = secs[++i];
          champs.push({ titre: c.s.title, regle: c.s.rule || '', guide: c.g.guide || '', exemple: String(c.g.example || '').replace(/\s*\n+\s*/g, ' ') });
        }
        blocs.push({ type: 'fiche', ...base, id_exemple: g.fiche || '', reponse: g.reponse || '', champs });
      } else blocs.push({ type: 'section', ...base, reponse: g.reponse || '' });
    }
    if (!blocs.length && nature !== 'redige') continue;   /* un fichier sans section n'a rien à gabariser */
    fichiers.push({
      file, chemin: (w.base || '') + file, nature, format: (file.match(/\.(\w+)$/) || [])[1] || (isDir(file) ? 'dossier' : ''),
      ouverture: nature === 'redige' ? { titre: o?.titre || '', phrase: o?.phrase || '', essentiel: o?.essentiel || [], verifier: o?.verifier || '' } : null,
      blocs,
      formats: formatsPortesPar(w.id, file, lang).map(f => f.id),
    });
  }

  /* Les formats de présentation portés par ce livrable, calculés sur leur exemple filé :
     la planche que le gabarit montre est celle que la machine produira. */
  const formats = formatsDeclares(lang).filter(f => f.porte?.wp === w.id).map(f => {
    const e = evaluer(f.exemple, { wp: w.id, file: f.porte.file });
    return { id: f.id, nom: f.nom, reference: f.reference, question: f.question, file: f.porte.file, ok: e.ok,
             planche: e.ok ? { type: 'format', format: f.id, nom_format: f.nom, reference: f.reference, question: f.question,
               wp: w.id, etape: w.step, titre: e.titre, donnees: e.donnees, calcul: e.calcul, constats: e.constats,
               source: LB.source(f.porte.file, f.reference) } : null };
  });

  return {
    lang: autreLangue(lang) ? lang : 'fr',
    id: w.id, nom: w.name, etape: w.step, nom_etape: (r.steps || []).find(s => s.id === w.step)?.name || w.step,
    office: tp?.office || null, standard, objet: w.purpose || '', completude: w.completion || '',
    responsable: roleEn(lang, w.responsible_accountable || ''), controle: roleEn(lang, String(w.controlled_at || '')),
    activite: act ? `${w.activity} — ${act.name}` : String(w.activity || ''),
    libelles: {
      phrase: O.phrase || LB.phrase, phrase_guide: O.phrase_guide || '',
      essentiel: O.essentiel || LB.essentiel, essentiel_guide: O.essentiel_guide || '',
      verifier: C.verifier || LB.verifier, verifier_guide: C.verifier_guide || '',
      reperes: C.reperes || LB.reperes, tiret: R.titre_reponse || ' — ',
      ...reglagesOffice(lang),
    },
    reperes: mentions(lang).reperes(w, act, formats.map(f => f.nom)),
    fichiers, formats,
  };
}
