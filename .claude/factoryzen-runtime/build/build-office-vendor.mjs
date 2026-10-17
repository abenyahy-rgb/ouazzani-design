/* Reconstruit vendor/office/office.mjs : pptxgenjs, docx et jszip en UN fichier ESM sans
 * dépendance, livré avec le plugin. Claude Code installe un plugin par clone, sans
 * « npm install » : une bibliothèque de rendu laissée en node_modules/ est absente chez
 * chaque projet, et ses livrables PowerPoint et Word ne s'écrivent jamais.
 *
 *   cd render && npm install && cd .. && node build/build-office-vendor.mjs && node bin/apf vendor --relock
 *
 * Les versions sont celles de render/package-lock.json ; elles sont recopiées au registre
 * (runtime_dependencies → office). */
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/registry.mjs';

const R = join(ROOT, 'render'), V = join(ROOT, 'vendor', 'office');
mkdirSync(V, { recursive: true });
execFileSync('npx', ['--yes', 'esbuild@0.28.2', join(ROOT, 'build', 'office-entry.mjs'), '--bundle', '--platform=node',
  '--format=esm', '--target=node20', '--minify', '--legal-comments=eof', `--outfile=${join(V, 'office.mjs')}`],
  { cwd: R, stdio: 'inherit' });
copyFileSync(join(R, 'node_modules/pptxgenjs/LICENSE'), join(V, 'LICENSE-pptxgenjs'));
copyFileSync(join(R, 'node_modules/docx/LICENSE'), join(V, 'LICENSE-docx'));
copyFileSync(join(R, 'node_modules/jszip/LICENSE.markdown'), join(V, 'LICENSE-jszip.md'));
console.log('vendor/office/ reconstruit — lancer « apf vendor --relock »');
