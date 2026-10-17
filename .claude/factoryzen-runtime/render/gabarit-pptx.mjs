/* Gabarit d'un livrable en PowerPoint — pour les livrables qui se présentent à une autorité.
 *
 * Une planche par section du standard, dans la charte du pack : le titre d'action à écrire
 * entre crochets, la zone de contenu, la consigne et l'exemple filé (ChantierClair) à côté,
 * la consigne répétée en notes de l'orateur. Les formats de présentation portés par le
 * livrable sont rendus sur leur exemple, exactement comme le pack les dessinera. */

import { rendrePack } from './pack-pptx.mjs';
import { recompresser } from './zip-office.mjs';

const PREFIXE = /^([A-Z]{2,4}-(?:nn(?:\.n)?|nom|name|vX\.Y))/;

/* Les mentions fixes, par langue (le modèle dit la sienne : g.lang). */
const MOTS = {
  fr: { qui: 'Qui le rédige, qui en répond', controle: 'Contrôlé en', fichiers: 'Fichiers du dépôt', complet: 'Il est complet quand',
        parFiche: t => `${t} — une planche par fiche`, produit: 'Gabarit', surtitre: 'GABARIT POWERPOINT', mention: id => `Gabarit ${id} · PowerPoint` },
  en: { qui: 'Who writes it, who answers for it', controle: 'Controlled at', fichiers: 'Repository files', complet: 'It is complete when',
        parFiche: t => `${t} — one slide per sheet`, produit: 'Template', surtitre: 'POWERPOINT TEMPLATE', mention: id => `Template ${id} · PowerPoint` },
};

export function planchesGabarit(g) {
  const L = g.libelles, T = MOTS[g.lang] || MOTS.fr;
  const planches = [{ type: 'couverture', cadence: g.etape, nom: g.nom }];
  planches.push({ type: 'gab-mode', etape: g.etape, nom_etape: g.nom_etape, objet: g.objet, libelles: L, lignes: [
    [T.qui, g.responsable],
    [T.controle, g.controle],
    [T.fichiers, g.fichiers.map(f => f.chemin).join(' · ')],
    ...(g.completude ? [[T.complet, String(g.completude).replace(/\s+/g, ' ')]] : []),
  ] });
  g.fichiers.forEach((f, k) => {
    if (g.fichiers.length > 1) planches.push({ type: 'gab-fichier', rang: k + 1, nombre: g.fichiers.length, chemin: f.chemin,
      sections: f.blocs.map(b => b.type === 'fiche' ? T.parFiche(b.titre) : b.titre) });
    const base = { etape: g.etape, chemin: f.chemin, libelles: L, redige: f.nature === 'redige' };
    if (f.nature === 'redige') planches.push({ type: 'gab-ouverture', ...base, ouverture: f.ouverture });
    for (const b of f.blocs) {
      if (b.type === 'fiche') planches.push({ ...base, ...b, type: 'gab-fiche',
        prefixe: ((PREFIXE.exec(b.titre) || [b.titre])[0]).replace(/-nn\b/, '-01') });
      else planches.push({ ...base, ...b, type: 'gab-section' });
    }
    for (const fm of g.formats.filter(x => x.file === f.file && x.planche)) planches.push(fm.planche);
    if (f.nature === 'redige') planches.push({ type: 'gab-cloture', ...base, verifier: f.ouverture.verifier, reperes: g.reperes });
  });
  return { lang: g.lang, produit: T.produit, surtitre: `${T.surtitre}  ·  ${g.etape}  ·  ${g.nom_etape}`.toUpperCase(), nom: g.nom, cadence: g.etape, planches, constats: [], defauts: [], manquants: [], libelles: L,
           accroche: g.objet, mention: T.mention(g.id), compte: { produits: 0, total: 0, formats: g.formats.length } };
}

/** Le gabarit PowerPoint en mémoire. */
export async function gabaritPptxBuffer(g) {
  const pres = rendrePack(planchesGabarit(g));
  return recompresser(await pres.write({ outputType: 'nodebuffer' }));
}
