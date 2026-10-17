/* LES DEUX FAMILLES D'ACTEURS (MCR-006) — les clients externes et les opérateurs internes.
 *
 * Un produit a des clients — qui paie, qui utilise — et presque toujours des opérateurs : ceux
 * qui font tourner le service au quotidien, coach, préparateur, livreur, support,
 * administrateur. TennisCoach l'a payé : le canevas, les personas et le squelette ne parlaient
 * que du joueur, et les écrans du coach manquaient au socle.
 *
 * La couverture se lit sur trois livrables, sans index parallèle :
 *   le canevas (WP-01)   déclare les opérateurs — format « bmc », champ operateurs — ou
 *                        décide qu'il n'y en a pas (sans_operateur, motivé) ;
 *   les personas (WP-04) déclarent leur famille, et un persona opérateur nomme l'opérateur ;
 *   les étapes (WP-05)   déclarent leur famille, et une étape opérateur nomme son opérateur.
 * Rien n'est exigé d'un livrable qui n'existe pas encore : la couverture se resserre à mesure
 * que le parcours avance — canevas, puis recherche, puis squelette. */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { cheminDe } from './registry.mjs';
import { readFrontMatter } from './project.mjs';

export const FAMILLES = ['client', 'operateur'];
const meme = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

/** La couverture des deux familles. `etapes` : les entités type: stage, si le projet est déjà lu. */
export function couvertureActeurs(root, etapes = null) {
  const pdir = join(root, 'product');
  const lire = rel => { const p = join(pdir, rel); return existsSync(p) ? readFrontMatter(p) : null; };
  const canevas = lire(cheminDe('WP-01', 'business-model-canvas.md'));
  if (!canevas) return { present: false, findings: [] };

  const f = [];
  const bmc = [].concat(canevas.exhibits || []).find(x => x?.format === 'bmc') || {};
  const brut = bmc.operateurs ?? canevas.operateurs;
  const sans = bmc.sans_operateur ?? canevas.sans_operateur ?? null;
  const operateurs = [].concat(brut || []).map(o => typeof o === 'string' ? { nom: o } : { ...o }).filter(o => String(o.nom || '').trim());
  if (brut === undefined && !sans) {
    f.push("canevas : les opérateurs du service ne sont pas déclarés — operateurs (qui fait tourner le service : nom, activité, ce qu'il voit et fait) ou sans_operateur avec son motif. Un opérateur oublié, ce sont ses écrans qui manquent au socle.");
    return { present: true, declare: false, operateurs: [], sans_operateur: null, personas: [], etapes: [], findings: f };
  }

  const pd = join(pdir, cheminDe('WP-04', 'personas/'));
  const personas = existsSync(pd) ? readdirSync(pd).filter(x => x.endsWith('.md')).map(x => {
    const fm = readFrontMatter(join(pd, x)) || {};
    const p = [].concat(fm.exhibits || []).find(e => e?.format === 'persona') || {};
    return { id: p.id || fm.id || x.replace(/\.md$/, ''), famille: p.famille ?? fm.famille ?? null, operateur: p.operateur ?? fm.operateur ?? null };
  }) : [];

  let stg = etapes;
  if (!stg) {
    const sd = join(pdir, cheminDe('WP-05', 'stages/'));
    stg = existsSync(sd) ? readdirSync(sd).filter(x => x.endsWith('.md')).map(x => readFrontMatter(join(sd, x)) || {}).filter(e => e.type === 'stage') : [];
  }
  const lesEtapes = stg.map(e => ({ id: e.id, famille: e.famille ?? null, operateur: e.operateur ?? null }));

  for (const p of personas) {
    if (!FAMILLES.includes(p.famille)) f.push(`${p.id} : famille « ${p.famille ?? '∅'} » — client ou operateur`);
    else if (p.famille === 'operateur' && !operateurs.some(o => meme(o.nom, p.operateur)))
      f.push(`${p.id} : persona opérateur « ${p.operateur ?? '∅'} », absent des opérateurs du canevas`);
  }
  for (const e of lesEtapes) {
    if (!FAMILLES.includes(e.famille)) f.push(`${e.id} : famille « ${e.famille ?? '∅'} » — client ou operateur`);
    else if (e.famille === 'operateur' && !operateurs.some(o => meme(o.nom, e.operateur)))
      f.push(`${e.id} : étape d'opérateur « ${e.operateur ?? '∅'} », absent des opérateurs du canevas`);
  }
  for (const o of operateurs) {
    if (personas.length && !personas.some(p => p.famille === 'operateur' && meme(p.operateur, o.nom)))
      f.push(`opérateur « ${o.nom} » : aucun persona — la recherche ne l'a pas regardé travailler`);
    if (lesEtapes.length && !lesEtapes.some(e => e.famille === 'operateur' && meme(e.operateur, o.nom)))
      f.push(`opérateur « ${o.nom} » : aucune étape au squelette — ses écrans manqueront au socle`);
  }
  if (lesEtapes.length && !lesEtapes.some(e => e.famille === 'client') && lesEtapes.every(e => FAMILLES.includes(e.famille)))
    f.push('aucune étape client au squelette : le produit ne dit plus ce que vit son client');

  return { present: true, declare: true, operateurs: operateurs.map(o => ({ nom: o.nom, activite: o.activite || null, voit_fait: o.voit_fait || null,
      personas: personas.filter(p => p.famille === 'operateur' && meme(p.operateur, o.nom)).map(p => p.id),
      etapes: lesEtapes.filter(e => e.famille === 'operateur' && meme(e.operateur, o.nom)).map(e => e.id) })),
    sans_operateur: sans, personas, etapes: lesEtapes,
    clients: { personas: personas.filter(p => p.famille === 'client').map(p => p.id), etapes: lesEtapes.filter(e => e.famille === 'client').map(e => e.id) },
    findings: f };
}
