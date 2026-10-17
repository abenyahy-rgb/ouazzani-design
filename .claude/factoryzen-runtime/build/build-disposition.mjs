/* Table de migration de la disposition « par étape » (commit 0180862) : pour chaque livrable,
 * l'ancien chemin et le nouveau, calculés en confrontant le registre d'avant et celui
 * d'aujourd'hui. Exacte par construction : aucun chemin n'est deviné.
 *
 *   node build/build-disposition.mjs   → lib/disposition-par-etape.json */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from '../lib/yaml.mjs';
import { registry, ROOT } from '../lib/registry.mjs';

const avant = yaml.load(execFileSync('git', ['show', '0180862^:core/method.yaml'], { cwd: ROOT, encoding: 'utf8' }));
const apres = registry();
const paires = [];
for (const w of apres.work_products) {
  const v = (avant.work_products || []).find(x => x.id === w.id);
  if (!v) continue;
  for (const f of w.files || []) {
    const ancien = (v.base || '') + f, nouveau = (w.base || '') + f;
    if (ancien !== nouveau && !/\{/.test(ancien) && (v.files || []).includes(f)) paires.push({ livrable: w.id, ancien, nouveau });
  }
}
writeFileSync(join(ROOT, 'lib', 'disposition-par-etape.json'), JSON.stringify({
  depuis: '0180862', note: "Chemins sous product/. Un fichier se déplace seulement s'il existe à l'ancien chemin et pas au nouveau.", paires }, null, 2) + '\n');
console.log(`${paires.length} chemins`);
