/* Écrit les gabarits Office : un fichier par livrable, PowerPoint ou Word selon ce que le
 * gabarit déclare (clé « office »), dans chaque langue de la méthode — le français dans
 * dist/gabarits/, l'anglais dans dist/gabarits/en/, sous le nom anglais du livrable.
 *
 *   node render/gabarits-office.mjs [WP-nn …] [--sortie dossier] [--lang fr|en] */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { registry, ROOT } from '../lib/registry.mjs';
import { modeleGabarit, nomFichierOffice, reglagesOffice, sousDossierOffice } from '../lib/gabarit-office.mjs';
import { LANGUES } from '../lib/i18n.mjs';
import { gabaritDocxBuffer } from './gabarit-docx.mjs';
import { gabaritPptxBuffer } from './gabarit-pptx.mjs';
import { utiliserPalette } from './palette.mjs';

/** Le gabarit Office d'un livrable, en mémoire. Rend { nom, office, buffer }. */
export async function gabaritOffice(id, lang) {
  const g = modeleGabarit(id, lang);
  if (!g) throw new Error(`livrable inconnu — ${id}`);
  if (!g.office) throw new Error(`${id} : le gabarit ne déclare pas de format Office (clé « office »)`);
  /* les gabarits de la méthode portent le départ standard, jamais la palette d'un projet */
  utiliserPalette();
  const buffer = g.office === 'pptx' ? await gabaritPptxBuffer(g) : await gabaritDocxBuffer(g);
  return { nom: nomFichierOffice(id, lang), office: g.office, buffer };
}

/** Écrit les gabarits demandés (tous par défaut), dans une langue. Rend la liste des fichiers écrits. */
export async function ecrireGabaritsOffice(ids = null, sortie = null, lang) {
  const dossier = sortie || join(ROOT, reglagesOffice().sortie || 'dist/gabarits/', sousDossierOffice(lang));
  mkdirSync(dossier, { recursive: true });
  /* Tous par défaut — sauf les éléments internes du socle : ils ne se présentent à
     personne, ils n'ont donc pas de gabarit Office. */
  const liste = ids?.length ? ids : registry().work_products.filter(w => !w.interne).map(w => w.id);
  const ecrits = [];
  for (const id of liste) {
    const { nom, office, buffer } = await gabaritOffice(id, lang);
    const f = join(dossier, nom);
    writeFileSync(f, buffer);
    ecrits.push({ id, office, fichier: f, octets: buffer.length });
  }
  return ecrits;
}

if (process.argv[1] && resolve(process.argv[1]).endsWith('gabarits-office.mjs')) {
  const a = process.argv.slice(2), i = a.indexOf('--sortie'), l = a.indexOf('--lang');
  const sortie = i >= 0 ? resolve(a[i + 1]) : null;
  const langues = l >= 0 ? [a[l + 1]] : LANGUES;
  const ids = a.filter((x, k) => /^WP-\d+$/i.test(x) && a[k - 1] !== '--sortie').map(x => x.toUpperCase());
  (async () => {
    for (const lang of langues) {
      if (!LANGUES.includes(lang)) throw new Error(`langue inconnue — ${lang} (${LANGUES.join(', ')})`);
      const l = await ecrireGabaritsOffice(ids, sortie && langues.length > 1 ? join(sortie, sousDossierOffice(lang)) : sortie, lang);
      l.forEach(x => console.log(`${x.id}  ${x.office}  ${lang}  ${x.fichier}`));
    }
  })().catch(e => { console.error(e.message); process.exit(1); });
}
