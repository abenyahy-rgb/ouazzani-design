/* Galerie des formats de présentation — pour VALIDER les gabarits, pas pour un client.
 *
 * Chaque format déclaré dans core/templates.yaml (bloc « exhibits ») est rendu sur son
 * exemple filé (ChantierClair), exactement comme il le serait sur un vrai projet : même
 * contrôle, même calcul, même planche. Ce que l'on valide ici est ce que le client verra.
 *
 *   node render/gabarits-pptx.mjs [--sortie fichier.pptx] */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { recompresser } from './zip-office.mjs';
import { registry, ROOT } from '../lib/registry.mjs';
import { evaluer, formatsDeclares } from '../lib/exhibits.mjs';
import { rendrePack } from './pack-pptx.mjs';


export function modeleGalerie() {
  const r = registry();
  const formats = formatsDeclares();
  const parEtape = new Map();
  for (const f of formats) {
    const w = r.work_products.find(x => x.id === f.porte.wp);
    const e = evaluer(f.exemple, { wp: f.porte.wp, file: f.porte.file });
    if (!parEtape.has(w.step)) parEtape.set(w.step, { livrables: new Map(), planches: [] });
    const et = parEtape.get(w.step);
    if (!et.livrables.has(w.id)) et.livrables.set(w.id, { id: w.id, nom: w.name, etat: 'complet', formats: [] });
    et.livrables.get(w.id).formats.push(f.nom);
    et.planches.push(e.ok
      ? { type: 'format', format: f.id, nom_format: f.nom, reference: f.reference, question: f.question, wp: w.id, etape: w.step,
          titre: e.titre, source: `Gabarit « ${f.id} » · porté par ${w.id} · ${f.porte.file} · exemple filé sur ChantierClair. Référence : ${f.reference}.`,
          donnees: e.donnees, calcul: e.calcul, constats: e.constats }
      : null);
    if (!e.ok) et.defaut = (et.defaut || []).concat({ wp: w.id, format: f.nom, defauts: e.defauts });
  }
  const nomEtape = id => (r.steps || []).find(s => s.id === id)?.name || id;
  const planches = [{ type: 'couverture', cadence: 'C1', nom: 'Gabarits de présentation' }];
  const constats = [], defauts = [];
  for (const [etape, et] of [...parEtape.entries()].sort()) {
    planches.push({ type: 'etape', etape, nom: nomEtape(etape), livrables: [...et.livrables.values()] });
    for (const p of et.planches.filter(Boolean)) { planches.push(p); constats.push(...p.constats.map(t => ({ wp: p.wp, format: p.nom_format, texte: t }))); }
    defauts.push(...(et.defaut || []));
  }
  return { produit: 'ChantierClair', nom: 'Gabarits de présentation', cadence: 'C1', planches, constats, defauts, manquants: [],
           accroche: `${formats.length} formats de référence, chacun rendu sur son exemple, avec le contrôle et le calcul qu'il subira sur un vrai projet.`,
           mention: 'Galerie de validation des gabarits',
           compte: { produits: 0, total: 0, formats: planches.filter(p => p.type === 'format').length } };
}

if (process.argv[1] && resolve(process.argv[1]).endsWith('gabarits-pptx.mjs')) {
  const a = process.argv.slice(2), i = a.indexOf('--sortie');
  const sortie = i >= 0 ? resolve(a[i + 1]) : join(ROOT, 'dist', 'Gabarits-formats.pptx');
  const pres = rendrePack(modeleGalerie());
  pres.write({ outputType: 'nodebuffer' }).then(async brut => {
    mkdirSync(dirname(sortie), { recursive: true });
    writeFileSync(sortie, await recompresser(brut));
    console.log(`${sortie} — ${pres.slides.length} planches`);
  });
}
