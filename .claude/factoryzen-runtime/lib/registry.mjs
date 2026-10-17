import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import yaml from './yaml.mjs';

export const ROOT = process.env.CLAUDE_PLUGIN_ROOT
  ? process.env.CLAUDE_PLUGIN_ROOT
  : join(dirname(fileURLToPath(import.meta.url)), '..');

let cache = null;

/** Charge le registre canonique. Source unique de la méthode. */
export function registry() {
  if (!cache) cache = yaml.load(readFileSync(join(ROOT, 'core/method.yaml'), 'utf8'));
  return cache;
}

export const byId = (list, id) => list.find(x => String(x.id) === String(id));

/** Projette le fragment d'une activité — ce qu'un agent reçoit, jamais le registre entier. */
export function activityFragment(id) {
  const r = registry();
  const a = byId(r.activities, id);
  if (!a) return null;
  const wps = r.work_products.filter(w => a.work_products.includes(w.id));
  const gate = r.gates.find(g => r.cadences.find(c => c.id === a.cadence)?.gates.includes(g.id));
  return { activity: a, work_products: wps, next_boundary: gate ? { id: gate.id, question: gate.question, authority: gate.authority } : null };
}

/* QUI PORTE UNE ACTIVITÉ — et pourquoi ce n'est presque jamais UNE chaîne.
 *
 * LE DÉFAUT QUE CECI CORRIGE. La tour comparait l'acteur au champ « responsible » par
 * égalité stricte. Or neuf activités sur vingt-six déclarent une COMPOSITION : « product-lead
 * puis factory-lead », « product-designer et product-lead », « quality-engineer produit ·
 * critic(quality) classe ». Aucun acteur au monde n'était égal à ces chaînes : ces neuf
 * activités étaient INOUVRABLES, par quiconque. Le refus avait l'air d'un contrôle de
 * séparation des rôles qui fonctionne ; c'était un contrôle qui refuse tout le monde.
 *
 * CE QUE CE N'EST PAS. Un assouplissement. Un acteur hors de la composition est toujours
 * refusé, et le refus NOMME les porteurs — ce que l'ancien message ne faisait pas.
 *
 * LES CRITICS. Le registre déclare UN agent « critic(·) » pour toutes les spécialités.
 * « critic(design) », « critic(quality) » et « critic(pentest) » sont des instances du même
 * rôle, pas des rôles absents. */

const CRITIC = /^critic\(.*\)$/;
const norm = id => (CRITIC.test(id) ? 'critic(·)' : id);

/** Les rôles qui portent une activité, résolus contre les agents déclarés. */
export function responsibleRoles(responsible) {
  const text = String(responsible || '');
  if (!text.trim()) return [];
  const declared = registry().agents.map(a => a.id);

  /* On cherche les identifiants DÉCLARÉS présents dans la chaîne, plutôt que de découper
     sur des séparateurs et d'espérer. Un découpage laisserait « quality-engineer produit »
     tel quel — avec son verbe — et ne résoudrait rien. Les plus longs d'abord, sinon
     « critic(·) » masquerait « critic(quality) ». */
  const found = new Set();
  for (const id of [...declared, ...text.match(/critic\([^)]*\)/g) || []]
         .sort((a, b) => b.length - a.length))
    if (text.includes(id)) found.add(norm(id));
  return [...found];
}

/** L'acteur est-il l'un des porteurs déclarés de cette activité ? */
export function actorMayOpen(actor, responsible) {
  const roles = responsibleRoles(responsible);
  if (!roles.length) return { ok: true, roles, why: 'aucun porteur déclaré — aucune séparation à faire respecter' };
  const ok = roles.includes(norm(String(actor || '')));
  return { ok, roles, why: ok ? null : `séparation des rôles : portée par ${roles.join(' · ')}` };
}

/* OÙ VIT UN FICHIER — la question se pose au registre, jamais au code.
   Les dossiers de `product/` sont organisés par étape (C1.1-initialisation/…,
   C1.4-socle/…). Cette organisation peut changer ; ce qui ne change pas, c'est
   que le registre la déclare. Un chemin écrit en dur dans lib/ ou bin/ est une
   seconde source de vérité : elle dérive en silence le jour où le registre
   bouge, et aucun contrôle ne la rattrape. */
export function cheminDe(wpId, fichier) {
  const w = byId(registry().work_products, wpId);
  if (!w) throw new Error(`${wpId} : livrable inconnu du registre`);
  const base = w.base || '';
  const decl = (w.files || []).find(f => f === fichier || (base + f) === fichier
                                      || f.endsWith('/' + fichier));
  if (!decl) throw new Error(`${wpId} : « ${fichier} » n'est pas un fichier déclaré au registre`);
  return base + decl;
}

/** Dossier d'un livrable — le préfixe commun de ses fichiers, tel que déclaré. */
export function dossierDe(wpId) {
  const w = byId(registry().work_products, wpId);
  if (!w) throw new Error(`${wpId} : livrable inconnu du registre`);
  if (w.base) return w.base;
  const parts = (w.files || []).map(f => f.split('/').slice(0, -1).join('/'));
  if (!parts.length) return '';
  let commun = parts[0].split('/');
  for (const p of parts.slice(1)) {
    const q = p.split('/');
    let i = 0; while (i < commun.length && i < q.length && commun[i] === q[i]) i++;
    commun = commun.slice(0, i);
  }
  return commun.length ? commun.join('/') + '/' : '';
}
