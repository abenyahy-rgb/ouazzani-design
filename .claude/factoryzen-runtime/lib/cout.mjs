/* LE COÛT DE LA GOUVERNANCE, MESURÉ.
 *
 * Une méthode qui ne mesure pas ce qu'elle coûte finit par coûter plus que ce qu'elle
 * protège. Le run BatiZen l'a constaté après coup : vingt jours avant la première ligne de
 * code, et une factory cent fois plus lourde que le produit — d'où sa règle, « le produit
 * tire la factory, la factory ne retarde pas le produit ». Ce module rend deux mesures
 * calculables sur n'importe quel dépôt, sans rien exécuter :
 *
 *   jours avant le premier code — de l'ouverture du run à la première ouverture de
 *     l'activité de construction (lue au registre par son nom, pas par son numéro) ;
 *   part de la gouvernance — octets des artefacts de méthode (product/, runs/) sur octets
 *     du dépôt hors outillage (dist/, .factoryzen/, .git/, node_modules/…).
 *
 * Les seuils sont des ALERTES, jamais des blocages, et PROVISOIRES : ils viennent d'un seul
 * run et se recalibrent sur les suivants (registry.governance_budget). */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { registry } from './registry.mjs';

const GOUVERNANCE = new Set(['product', 'runs']);
const OUTILLAGE = new Set(['dist', '.factoryzen', '.git', 'node_modules', '.claude', 'vendor', '.next', 'build', 'coverage']);

function octets(d) {
  let n = 0;
  if (!existsSync(d)) return 0;
  for (const e of readdirSync(d)) {
    if (e === '.git' || e === 'node_modules') continue;
    const p = join(d, e);
    let s; try { s = statSync(p); } catch { continue; }
    n += s.isDirectory() ? octets(p) : s.size;
  }
  return n;
}

const jours = (a, b) => Math.max(0, Math.round((b - a) / 86_400_000 * 10) / 10);

/**
 * Le coût de la gouvernance d'un projet. `ledger` : les événements du journal de la tour
 * ({ at, event, activity }), `maintenant` : la date de référence (par défaut : maintenant).
 */
export function coutGouvernance(root, ledger = [], maintenant = new Date()) {
  const r = registry(), b = r.governance_budget || {};
  const construction = r.activities.find(a => a.name === (b.premier_code?.activite || 'Construction et tests'));
  const dates = ledger.map(e => e.at && Date.parse(e.at)).filter(Number.isFinite);
  const debut = dates.length ? Math.min(...dates) : null;
  const code = ledger.find(e => e.event === 'ACTIVITY_OPEN' && construction && String(e.activity) === String(construction.id) && e.at);
  const premierCode = code ? Date.parse(code.at) : null;

  let gouvernance = 0, produit = 0;
  for (const e of existsSync(root) ? readdirSync(root) : []) {
    if (OUTILLAGE.has(e)) continue;
    const p = join(root, e);
    let s; try { s = statSync(p); } catch { continue; }
    const n = s.isDirectory() ? octets(p) : s.size;
    if (GOUVERNANCE.has(e)) gouvernance += n; else if (!e.startsWith('.') && !/^(README|CLAUDE|LICENSE)/i.test(e)) produit += n;
  }
  const part = gouvernance + produit ? Math.round(gouvernance / (gouvernance + produit) * 1000) / 1000 : null;

  const seuilJours = b.jours_avant_premier_code ?? null;
  const seuilPart = b.part_gouvernance_max ?? null;
  const joursAvantCode = debut == null ? null : jours(debut, premierCode ?? +maintenant);
  const alertes = [];
  if (seuilJours != null && joursAvantCode != null && joursAvantCode > seuilJours)
    alertes.push(premierCode
      ? `premier code au jour ${joursAvantCode}, au-delà du budget de ${seuilJours} jours`
      : `${joursAvantCode} jours sans code, au-delà du budget de ${seuilJours} jours`);
  if (seuilPart != null && premierCode && part != null && part > seuilPart)
    alertes.push(`la gouvernance pèse ${Math.round(part * 100)} % du dépôt, au-delà de ${Math.round(seuilPart * 100)} %`);
  return {
    debut: debut ? new Date(debut).toISOString() : null,
    premier_code: premierCode ? new Date(premierCode).toISOString() : null,
    code_commence: !!premierCode,
    jours_avant_code: joursAvantCode,
    octets_gouvernance: gouvernance, octets_produit: produit, part_gouvernance: part,
    seuils: { jours_avant_premier_code: seuilJours, part_gouvernance_max: seuilPart },
    alertes,
  };
}
