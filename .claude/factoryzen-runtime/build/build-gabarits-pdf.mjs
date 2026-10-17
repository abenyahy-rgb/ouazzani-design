/* L'APERÇU DES GABARITS OFFICE — un PDF par gabarit, pour les CONSULTER dans un navigateur.
 *
 * Un .pptx ou un .docx ne s'ouvre pas dans une page web ; un PDF, si. La page Methodology du
 * launchpad et FactoryZen proposent donc, pour chaque livrable, l'aperçu PDF à côté du
 * fichier Office à télécharger. L'aperçu est CALCULÉ depuis le fichier Office par
 * LibreOffice, jamais tenu à la main.
 *
 * Seuls les gabarits dont le fichier Office a changé sont reconvertis : l'empreinte de chaque
 * source est gardée dans apercu/empreintes.json. Sans LibreOffice, rien n'est cassé : les
 * aperçus existants restent, et le script le dit.
 *
 * Chaque langue a son dossier : dist/gabarits/ (français), dist/gabarits/en/ (anglais), chacun
 * avec son apercu/ et ses empreintes.
 *
 *   node build/build-gabarits-pdf.mjs [--tout] */

import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const BASE = join(ROOT, 'dist', 'gabarits');
const nomApercu = f => f.replace(/\.(pptx|docx)$/, '.pdf');

const soffice = ['soffice', 'libreoffice'].find(b => spawnSync(b, ['--version'], { stdio: 'ignore' }).status === 0);
if (!soffice) { console.log('LibreOffice absent : aperçus PDF laissés en l\'état'); process.exit(0); }

/* L'empreinte porte sur le CONTENU de l'archive, sans docProps/core.xml : régénérer un
   gabarit à l'identique change ses dates, pas ce qu'il montre — et ne doit rien reconvertir. */
const { JSZip } = await import('../lib/office.mjs');
const tout = process.argv.includes('--tout');

async function apercus(SRC) {
  if (!existsSync(SRC)) return;
  const OUT = join(SRC, 'apercu');
  const EMP = join(OUT, 'empreintes.json');
  mkdirSync(OUT, { recursive: true });
  const avant = existsSync(EMP) ? JSON.parse(readFileSync(EMP, 'utf8')) : {};
  const sources = readdirSync(SRC).filter(f => /\.(pptx|docx)$/.test(f)).sort();
  async function empreinte(f) {
    const z = await JSZip.loadAsync(readFileSync(join(SRC, f)));
    const h = createHash('sha1');
    for (const n of Object.keys(z.files).filter(n => n !== 'docProps/core.xml' && !z.files[n].dir).sort())
      h.update(n).update(await z.file(n).async('nodebuffer'));
    return h.digest('hex');
  }
  const apres = {}, a_faire = [];
  for (const f of sources) {
    apres[f] = await empreinte(f);
    if (tout || avant[f] !== apres[f] || !existsSync(join(OUT, nomApercu(f)))) a_faire.push(f);
  }
  if (a_faire.length) {
    const tmp = mkdtempSync(join(tmpdir(), 'apercu-'));
    try {
      execFileSync(soffice, [`-env:UserInstallation=file://${join(tmp, 'profil')}`, '--headless', '--convert-to', 'pdf', '--outdir', join(tmp, 'pdf'),
        ...a_faire.map(f => join(SRC, f))], { stdio: 'ignore', timeout: 600000 });
      for (const f of a_faire) {
        const pdf = join(tmp, 'pdf', nomApercu(f));
        if (!existsSync(pdf)) { console.error(`aperçu non produit : ${f}`); delete apres[f]; continue; }
        renameSync(pdf, join(OUT, nomApercu(f)));
      }
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  }
  /* un aperçu sans gabarit est un reste : il part */
  for (const f of readdirSync(OUT).filter(f => f.endsWith('.pdf')))
    if (!sources.some(s => nomApercu(s) === f)) rmSync(join(OUT, f));
  writeFileSync(EMP, JSON.stringify(apres, null, 2) + '\n');
  console.log(`${a_faire.length} aperçu(s) PDF produit(s), ${sources.length - a_faire.length} inchangé(s) — ${OUT}`);
}

await apercus(BASE);
await apercus(join(BASE, 'en'));
