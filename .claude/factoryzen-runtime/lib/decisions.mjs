/* LA FILE DES DÉCISIONS (MCR-002).
 *
 * Avant G0, l'humain n'est plus interrompu à chaque étape : ce qui lui revient entre en file,
 * et il y répond quand il veut — par la tour, ou par le Launchpad. Cinq natures :
 *   CRITIQUE    une critique d'un critic, que le porteur retient ou écarte (MCR-004) ;
 *   DÉLÉGUÉE    appliquée par défaut (la recommandation), revisable, ratifiée en G0 ;
 *   ARBITRAGE   un désaccord producteur ↔ critic que deux tours n'ont pas résolu (EX1) ;
 *   BLOQUANTE   ce que seul l'humain peut décider — intention, irréversible, corpus réel ;
 *   GEL         un socle gelé à titre provisoire sous la délégation du run.
 * Une réponse est un FICHIER AJOUTÉ (runs/decisions/DEC-nn.reponse.yaml), jamais un état
 * réécrit à distance : le Launchpad écrit un fichier, la tour l'ingère. Fonctions sur l'état
 * de la tour ; aucune n'écrit seule le fichier d'état. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from './yaml.mjs';

export const STATUTS = ['EN_ATTENTE', 'DÉLÉGUÉE', 'TRANCHÉE', 'RATIFIÉE'];
export const DOSSIER_REPONSES = 'runs/decisions';

const cle = d => `${d.type}|${d.activite ?? ''}|${d.objet}`;

/** Ajoute une décision à la file, une fois : la même nature, la même activité et le même objet ne
 *  s'empilent pas. Rend la décision (nouvelle ou existante). */
export function ajouterDecision(st, d) {
  st.decisions ||= [];
  const deja = st.decisions.find(x => cle(x) === cle(d));
  if (deja) return deja;
  const n = st.decisions.length + 1;
  const x = { id: `DEC-${String(n).padStart(2, '0')}`, type: d.type, activite: d.activite ?? null, objet: d.objet,
    question: d.question || null, options: d.options || [], choix_applique: d.choix_applique ?? null,
    positions: d.positions || [], bloquante: !!d.bloquante, rayon: Number.isFinite(d.rayon) ? d.rayon : 5,
    ...(d.recommandation ? { recommandation: d.recommandation } : {}), ...(d.work_product ? { work_product: d.work_product } : {}),
    statut: d.statut || (d.choix_applique != null ? 'DÉLÉGUÉE' : 'EN_ATTENTE'), par: d.par || null,
    at: new Date().toISOString() };
  st.decisions.push(x);
  return x;
}

/** Ce qui doit être tranché par l'humain avant G0 : arbitrages et décisions bloquantes en attente. */
export const enAttente = st => (st.decisions || []).filter(d => d.statut === 'EN_ATTENTE');
export const bloquantes = st => enAttente(st).filter(d => d.bloquante);

/** Ce que G0 ratifie : les décisions déléguées, par rayon d'impact décroissant. */
export const aRatifier = st => (st.decisions || []).filter(d => d.statut === 'DÉLÉGUÉE')
  .sort((a, b) => b.rayon - a.rayon || a.id.localeCompare(b.id));

/** Tranche une décision. Une décision déléguée tranchée AUTREMENT que le défaut appliqué rouvre
 *  l'activité qui l'avait appliqué (st.reprises). Rend { ok, decision, reprise } ou { ok:false }. */
export function trancher(st, { id, by, choix, note }) {
  const d = (st.decisions || []).find(x => x.id === id);
  if (!d) return { ok: false, raison: `décision inconnue — ${id}` };
  if (!by) return { ok: false, raison: `${id} : une décision se tranche par une personne nommée` };
  if (choix == null || String(choix).trim() === '') return { ok: false, raison: `${id} : choix absent` };
  if (d.statut === 'TRANCHÉE' || d.statut === 'RATIFIÉE') return { ok: true, decision: d, deja: true };
  const autrement = d.choix_applique != null && String(choix).trim() !== String(d.choix_applique).trim();
  Object.assign(d, { statut: 'TRANCHÉE', choix: String(choix), tranchee_par: by, note: note || null, tranchee_le: new Date().toISOString() });
  if (autrement && d.activite != null) {
    st.reprises ||= [];
    st.reprises.push({ activite: d.activite, decision: d.id, choix: d.choix, at: d.tranchee_le });
  }
  return { ok: true, decision: d, reprise: autrement };
}

/** Les réponses déposées en fichier (par le Launchpad) et pas encore ingérées. Rend le nombre ingéré. */
export function ingererReponses(project, st) {
  const dir = join(project, DOSSIER_REPONSES);
  if (!existsSync(dir)) return 0;
  let n = 0;
  st.reponses_ingerees ||= [];
  for (const f of readdirSync(dir).filter(x => /\.reponse\.ya?ml$/.test(x)).sort()) {
    if (st.reponses_ingerees.includes(f)) continue;
    let rep = null;
    try { rep = yaml.load(readFileSync(join(dir, f), 'utf8')) || {}; } catch { continue; }
    const v = trancher(st, { id: rep.id || f.replace(/\.reponse\.ya?ml$/, ''), by: rep.par, choix: rep.choix, note: rep.note });
    if (v.ok) { st.reponses_ingerees.push(f); n++; }
  }
  return n;
}

/** Ratifie en G0 toutes les décisions déléguées, au nom de l'autorité qui franchit. */
export function ratifier(st, by) {
  const out = [];
  for (const d of st.decisions || []) if (d.statut === 'DÉLÉGUÉE') {
    Object.assign(d, { statut: 'RATIFIÉE', ratifiee_par: by, ratifiee_le: new Date().toISOString() });
    out.push(d.id);
  }
  return out;
}
