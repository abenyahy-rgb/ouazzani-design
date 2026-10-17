/* LE TABLEAU DES BOUCLES — ce que chaque agent fait, et où en est chaque livrable.
 *
 * Un tableau tiré de l'ÉTAT, pas de la télémétrie : la tour écrit déjà runs/tower.json (les
 * boucles, les décisions) et le journal (runs/ledger.ndjson). Le tableau ne lit que cela —
 * il dit donc toujours vrai, sans appairage ni canal à entretenir. Son prix : il voit ce que
 * la session a poussé, pas la seconde en cours.
 *
 * Deux lectures, et une écriture :
 *   tableau(root)   une carte par livrable, rangée par stade de boucle, ses critiques en
 *                   puces, l'agent en cours et ce qui attend l'humain ;
 *   retention(st)   ce que le porteur garde des critiques, par critic et par sévérité — la
 *                   preuve sur laquelle se décidera le modèle de chaque critic (MCR-004) ;
 *   agentHook(…)    au lancement et au retour d'un rôle de la méthode, une ligne au journal
 *                   (AGENT_LANCÉ, AGENT_RENDU). Elle observe et ne décide rien : elle échoue en
 *                   ouvrant, comme la trace. */
import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { registry, byId } from './registry.mjs';
import { loadState } from './tower.mjs';
import { applies as wpApplies } from './conditions.mjs';
import { criticDe } from './autopilote.mjs';
import { roles } from './routage.mjs';

export const STADES = ['À_VENIR', 'EN_PRODUCTION', 'EN_CRITIQUE', 'À_TRIER', 'EN_REPRISE', 'ARBITRAGE', 'SATISFAIT'];
const SEVERITE = r => (r >= 9 ? 'BLOCKER' : r >= 6 ? 'MAJOR' : 'MINOR');
const choixDe = d => (/^retenir/i.test(String(d.choix || '')) ? 'Retenir' : d.choix ? 'Écarter' : null);
const porteurs = a => String(a.responsible).split(/ (?:et|puis) |·/).map(x => x.trim()).filter(Boolean);

/** Le journal de la tour, ligne à ligne ; une ligne illisible est sautée, jamais bloquante. */
export function lireJournal(root) {
  const f = join(root, 'runs', 'ledger.ndjson');
  if (!existsSync(f)) return [];
  const out = [];
  for (const l of readFileSync(f, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    try { out.push(JSON.parse(l)); } catch { /* ligne tronquée */ }
  }
  return out;
}

const derniereDecl = (st, wp) => [...(st.declared || [])].reverse().find(d => d.work_product === wp);

/* Le stade d'un livrable — la même lecture que la boucle de l'autopilote (prochaineAction),
   rendue pour l'œil au lieu de l'action. */
function stadeDe(st, a, w) {
  const ouverte = (st.opened || []).some(o => String(o.activity) === String(a.id));
  const decl = derniereDecl(st, w);
  if (decl?.completion !== 'complet') return { stade: ouverte ? 'EN_PRODUCTION' : 'À_VENIR', critiques: [] };
  const critic = criticDe(w);
  if (!critic) return { stade: 'SATISFAIT', critiques: [] };
  const b = st.boucles?.[w];
  if (!b?.tours?.length) return { stade: 'EN_CRITIQUE', critiques: [] };
  const dernier = b.tours.at(-1);
  const decs = (st.decisions || []).filter(d => (dernier.critiques || []).includes(d.id));
  const critiques = decs.map(d => ({ id: d.id, titre: String(d.objet).replace(/^.*?—\s*/, ''), severite: SEVERITE(d.rayon),
    statut: d.statut === 'EN_ATTENTE' ? 'À_TRIER' : choixDe(d), recommandation: String(d.recommandation || '').split(/\s+—\s+/)[0] || null,
    note: d.note || null, depot: d.positions?.[0] || null }));
  if (b.statut === 'CONVERGÉ') return { stade: 'SATISFAIT', critiques };
  if (b.statut === 'ARBITRAGE') return { stade: 'ARBITRAGE', critiques };
  if (!Array.isArray(dernier.critiques)) return { stade: 'EN_CRITIQUE', critiques, note: `tour ${dernier.n} d'avant MCR-004 : à recritiquer` };
  if (decs.some(d => d.statut === 'EN_ATTENTE')) return { stade: 'À_TRIER', critiques };
  const retenues = decs.filter(d => choixDe(d) === 'Retenir');
  if (!retenues.length) return { stade: 'SATISFAIT', critiques };
  const trie = Math.max(...decs.map(d => Date.parse(d.tranchee_le || d.at || 0)));
  return { stade: Date.parse(decl.at || 0) > trie ? 'SATISFAIT' : 'EN_REPRISE', critiques };
}

/* Les agents, lus au journal : un lancement sans retour ni acte de tour postérieur du même
   rôle est « en cours ». Un retour peut manquer (agent en arrière-plan) : l'acte suivant du
   rôle — un verdict déposé, un livrable déclaré — en tient lieu. */
function agentsDuJournal(journal) {
  const lances = [];
  journal.forEach((e, i) => {
    if (e.event !== 'AGENT_LANCÉ') return;
    const suite = journal.slice(i + 1);
    const retour = suite.find(x => x.event === 'AGENT_RENDU' && x.role === e.role);
    const acte = suite.find(x => (x.event === 'VERDICT_RECORDED' && (x.critic === e.role || x.par === e.role))
      || (x.event === 'AGENT_LANCÉ' && x.role === e.role) || (x.event === 'WP_DECLARED' && e.work_product && x.work_product === e.work_product));
    const fin = retour || acte || null;
    lances.push({ role: e.role, work_product: e.work_product || null, activite: e.activite ?? null, model: e.model || null,
      effort: e.effort || null, depuis: e.at, rendu: fin ? (fin.at || null) : null,
      ms: retour?.ms ?? (fin ? Date.parse(fin.at) - Date.parse(e.at) : null) });
  });
  return { en_cours: lances.filter(x => !x.rendu), recents: lances.slice(-12).reverse() };
}

/** Le tableau d'un projet. Lecture seule. Rend null sans état de tour. */
export function tableau(root) {
  if (!existsSync(join(root, 'runs', 'tower.json'))) return null;
  const r = registry(), st = loadState(root), journal = lireJournal(root);
  const portee = st.autopilote?.portee || 'C1';
  const cartes = [];
  for (const a of r.activities.filter(x => x.cadence === portee)) {
    for (const w of (a.work_products || []).filter(x => wpApplies(root, x).applies)) {
      const s = stadeDe(st, a, w), b = st.boucles?.[w];
      const blocage = (st.decisions || []).some(d => d.statut === 'EN_ATTENTE' && d.bloquante && String(d.activite) === String(a.id));
      cartes.push({ work_product: w, nom: byId(r.work_products, w)?.name || w, etape: a.step, activite: a.id,
        producteur: porteurs(a)[0] || null, critic: criticDe(w), stade: s.stade, tours: b?.tours?.length || 0,
        critiques: s.critiques, note: s.note || null,
        attend_humain: s.stade === 'À_TRIER' || s.stade === 'ARBITRAGE' || blocage,
        depuis: derniereDecl(st, w)?.at || null });
    }
  }
  const att = (st.decisions || []).filter(d => d.statut === 'EN_ATTENTE');
  return {
    portee, stades: STADES, cartes,
    agents: agentsDuJournal(journal),
    attente: { critiques: att.filter(d => d.type === 'critique').length, arbitrages: att.filter(d => d.type === 'arbitrage').length,
      bloquantes: att.filter(d => d.bloquante).length, a_ratifier: (st.decisions || []).filter(d => d.statut === 'DÉLÉGUÉE').length },
    journal: journal.slice(-15).reverse().map(e => ({ at: e.at, event: e.event, work_product: e.work_product || null,
      role: e.role || e.critic || e.actor || null, activite: e.activity ?? e.activite ?? null })),
  };
}

/** Ce que le porteur garde des critiques — par critic, par sévérité, et son accord avec la
 *  recommandation du critic. Lecture seule de l'état. */
export function retention(st) {
  const crits = (st.decisions || []).filter(d => d.type === 'critique');
  const vide = () => ({ proposees: 0, retenues: 0, ecartees: 0, a_trier: 0, accord: 0, tranchees: 0 });
  const par = {};
  for (const d of crits) {
    const critic = String(d.par || '?'), sev = SEVERITE(d.rayon);
    par[critic] ||= { total: vide(), BLOCKER: vide(), MAJOR: vide(), MINOR: vide() };
    for (const k of ['total', sev]) {
      const c = par[critic][k];
      c.proposees++;
      const ch = choixDe(d);
      if (d.statut === 'EN_ATTENTE' || !ch) { c.a_trier++; continue; }
      c.tranchees++;
      ch === 'Retenir' ? c.retenues++ : c.ecartees++;
      if (String(d.recommandation || '').startsWith(ch === 'Retenir' ? 'Retenir' : 'Écarter')) c.accord++;
    }
  }
  const taux = (n, d) => (d ? Math.round((100 * n) / d) : null);
  const lignes = Object.entries(par).map(([critic, x]) => ({ critic,
    proposees: x.total.proposees, tranchees: x.total.tranchees, a_trier: x.total.a_trier,
    retention: taux(x.total.retenues, x.total.tranchees), accord: taux(x.total.accord, x.total.tranchees),
    par_severite: Object.fromEntries(['BLOCKER', 'MAJOR', 'MINOR'].map(s => [s, { proposees: x[s].proposees,
      retention: taux(x[s].retenues, x[s].tranchees), ecartees: x[s].ecartees }])) }))
    .sort((a, b) => b.proposees - a.proposees);
  const bl = crits.filter(d => SEVERITE(d.rayon) === 'BLOCKER' && choixDe(d));
  return { critiques: crits.length, tranchees: crits.filter(d => choixDe(d)).length, lignes,
    blockers_ecartes: taux(bl.filter(d => choixDe(d) === 'Écarter').length, bl.length) };
}

/* ── l'écriture : lancement et retour d'un rôle de la méthode ───────────── */

const ROLE = s => String(s || '').split(':').pop();
const WP = s => (/\b((?:WP|SOC)-\d{2})\b/.exec(String(s || '')) || [])[1] || null;
const ARRIERE_PLAN = /background|async|launched|en arri[eè]re-plan/i;

/** Appelé par le hook de trace. Rend la ligne écrite, ou null. N'échoue jamais. */
export function agentHook(root, event, payload) {
  try {
    if (!existsSync(join(root, 'runs', 'tower.json'))) return null;
    const p = payload || {}, connus = new Set(roles());
    let ligne = null;
    if ((event === 'PreToolUse' || event === 'PostToolUse') && /^(Agent|Task)$/.test(p.tool_name || '')) {
      const i = p.tool_input || {}, role = ROLE(i.subagent_type);
      if (!connus.has(role) && !/^critic-domain-/.test(role)) return null;
      if (event === 'PreToolUse') {
        const st = loadState(root), o = st.opened?.at(-1);
        ligne = { event: 'AGENT_LANCÉ', role, work_product: WP(i.description) || WP(i.prompt), activite: o?.activity ?? null,
          model: i.model || null, effort: i.effort || null };
      } else {
        const rep = typeof p.tool_response === 'string' ? p.tool_response : JSON.stringify(p.tool_response || '');
        if (ARRIERE_PLAN.test(rep.slice(0, 400))) return null;
        ligne = { event: 'AGENT_RENDU', role };
      }
    } else if (event === 'SubagentStop') {
      const role = ROLE(p.agent_type || p.subagent_type);
      if (!connus.has(role) && !/^critic-domain-/.test(role)) return null;
      ligne = { event: 'AGENT_RENDU', role };
    }
    if (!ligne) return null;
    mkdirSync(join(root, 'runs'), { recursive: true });
    const e = { at: new Date().toISOString(), ...ligne };
    appendFileSync(join(root, 'runs', 'ledger.ndjson'), JSON.stringify(e) + '\n');
    return e;
  } catch { return null; }
}
