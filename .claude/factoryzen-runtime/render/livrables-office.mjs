/* Écrit les livrables réels d'un projet en fichiers Office — PowerPoint ou Word selon le
 * gabarit — dans dist/livrables/. Appelé à chaque déclaration par la tour, ou à la main :
 *
 *   apf livrable [WP-nn …]        depuis la racine du projet ; sans argument, tous les produits */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { paletteDuProjet, utiliserPalette, empreintePalette } from './palette.mjs';
import { modeleLivrable, livrablesProduits, dossierLivrablesOffice } from '../lib/livrable-office.mjs';
import { livrablePptxBuffer } from './livrable-pptx.mjs';
import { livrableDocxBuffer } from './livrable-docx.mjs';

/** Le fichier Office d'un livrable produit. Rend { id, office, fichier, octets } ou { id, absent }. */
export async function ecrireLivrableOffice(projet, id) {
  const m = modeleLivrable(projet, id);
  if (!m) return { id, absent: true, raison: 'aucun fichier produit' };
  if (!m.office) return { id, absent: true, raison: 'le gabarit ne déclare pas de format Office' };
  /* le livrable porte le design system du PROJET — ses rôles de C1.4, le départ à défaut */
  utiliserPalette(paletteDuProjet(projet));
  const buffer = m.office === 'pptx' ? await livrablePptxBuffer(m) : await livrableDocxBuffer(m);
  const dossier = dossierLivrablesOffice(projet);
  mkdirSync(dossier, { recursive: true });
  const fichier = join(dossier, m.fichier_office);
  writeFileSync(fichier, buffer);
  return { id, office: m.office, fichier, octets: buffer.length, completion: m.completion,
           refuses: m.parts.flatMap(p => p.formats_refuses) };
}

export async function ecrireLivrablesOffice(projet, ids = null) {
  const liste = ids?.length ? ids : livrablesProduits(projet);
  const out = [];
  for (const id of liste) {
    try { out.push(await ecrireLivrableOffice(projet, id)); }
    catch (e) { out.push({ id, erreur: e.message }); }
  }
  return out;
}

/* L'EMPREINTE DE LA PALETTE, à côté des fichiers. Un fichier Office existant n'était jamais
   réécrit : un projet qui change son design system en C1.4 — ou un départ standard qui
   change — gardait ses livrables à l'ancienne palette. L'empreinte dit avec quelle palette
   ils ont été écrits ; si elle a changé, ils sont tous réécrits, sinon seuls les manquants. */
const EMPREINTE = '.palette';

/** Aligne les fichiers Office d'un projet sur son design system. Rend { ecrits, empreinte, realignes }. */
export async function alignerLivrablesOffice(projet) {
  const dossier = dossierLivrablesOffice(projet);
  const empreinte = empreintePalette(paletteDuProjet(projet));
  const f = join(dossier, EMPREINTE);
  const avant = existsSync(f) ? readFileSync(f, 'utf8').trim() : null;
  const realignes = avant !== empreinte;
  const ids = livrablesProduits(projet).filter(id => {
    const m = modeleLivrable(projet, id);
    return m?.office && (realignes || !existsSync(join(dossier, m.fichier_office)));
  });
  /* une liste vide veut dire « rien à écrire » — pas « tout », comme pour ecrireLivrablesOffice */
  const ecrits = ids.length ? (await ecrireLivrablesOffice(projet, ids)).filter(r => r.fichier) : [];
  if (realignes && livrablesProduits(projet).length) { mkdirSync(dossier, { recursive: true }); writeFileSync(f, empreinte + '\n'); }
  return { ecrits, empreinte, realignes };
}
