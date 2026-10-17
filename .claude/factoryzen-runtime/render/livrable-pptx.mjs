/* Un livrable réel en PowerPoint — dans la charte du pack et des gabarits.
 *
 * Par fichier : la planche d'ouverture (la réponse en titre d'action, l'essentiel en
 * bandeau), les formats de présentation vérifiés par le calcul, une planche par section
 * « clé — réponse », puis ce qui reste à vérifier avec les réserves déclarées. Un tableau
 * trop long se poursuit sur la planche suivante plutôt que de déborder. */

import { rendrePack, blocsSection } from './pack-pptx.mjs';
import { recompresser } from './zip-office.mjs';
import { redaction } from '../lib/templates.mjs';

const LIGNES_PAR_PLANCHE = 8;

export function planchesLivrable(m) {
  const R = redaction() || {};
  const libelles = { essentiel: R.ouverture?.essentiel, verifier: R.cloture?.verifier, reperes: R.cloture?.reperes };
  const planches = [{ type: 'couverture', cadence: m.etape, nom: m.nom }];
  for (const f of m.parts) {
    const base = { etape: m.etape, chemin: f.chemin, sujet: f.titre, completion: f.completion };
    planches.push({ ...base, type: 'liv-ouverture', titre: f.titre, phrase: f.phrase, essentiel: f.essentiel });
    planches.push(...f.formats);
    for (const sec of f.sections) {
      const blocs = blocsSection(sec.md);
      if (!blocs.length) continue;   /* réponse dans le titre : la planche d'ouverture et le document la portent */
      const table = blocs.find(b => b.type === 'table');
      const tronque = blocs.filter(b => b.type !== 'table').reduce((n, b) => n + b.texte.length, 0) > (table ? 420 : 1250);
      if (!table || table.corps.length <= LIGNES_PAR_PLANCHE) { planches.push({ ...base, type: 'liv-section', titre: sec.titre, blocs, tronque }); continue; }
      for (let k = 0; k < table.corps.length; k += LIGNES_PAR_PLANCHE) {
        const morceau = { ...table, corps: table.corps.slice(k, k + LIGNES_PAR_PLANCHE) };
        planches.push({ ...base, type: 'liv-section', titre: sec.titre, suite: k > 0, tronque: k === 0 && tronque,
          blocs: k === 0 ? blocs.map(b => b === table ? morceau : b) : [morceau] });
      }
    }
    if (f.verifier || f.reserves.length || f.reperes)
      planches.push({ ...base, type: 'liv-cloture', verifier: f.verifier, reserves: f.reserves, reperes: f.reperes });
  }
  return { produit: m.produit || 'Produit', nom: m.nom, cadence: m.etape, planches, constats: [], defauts: [], manquants: [], libelles,
           surtitre: `${(m.produit || '').toUpperCase()}  ·  ${m.etape}  ·  ${m.nom_etape}`.toUpperCase(),
           accroche: m.parts[0]?.phrase || '',
           mention: `${m.completion === 'complet' ? 'Livrable complet' : 'Livrable partiel'} · projection du dépôt`,
           compte: { produits: 0, total: 0, formats: 0 } };
}

export async function livrablePptxBuffer(m) {
  return recompresser(await rendrePack(planchesLivrable(m)).write({ outputType: 'nodebuffer' }));
}
