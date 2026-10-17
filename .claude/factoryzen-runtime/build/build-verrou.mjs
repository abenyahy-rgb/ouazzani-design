/* Augmente lib/identifiants-publies.json de ce que le registre publie — jamais ne le diminue.
 * Voir lib/verrou.mjs. */
import { writeFileSync } from 'node:fs';
import { registry } from '../lib/registry.mjs';
import { augmenter, lireVerrou, FICHIER } from '../lib/verrou.mjs';

const avant = lireVerrou();
const apres = augmenter(registry(), avant);
writeFileSync(FICHIER, JSON.stringify(apres, null, 2) + '\n');
const n = (apres.identifiants.length - avant.identifiants.length) + (apres.chemins.length - avant.chemins.length);
console.log(`lib/identifiants-publies.json — ${apres.identifiants.length} identifiants · ${apres.chemins.length} chemins${n ? ` · ${n} ajouté(s)` : ''}`);
