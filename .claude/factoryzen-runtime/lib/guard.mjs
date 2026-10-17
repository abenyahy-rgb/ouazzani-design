import { relative, isAbsolute, sep } from 'node:path';
import { registry, byId } from './registry.mjs';
import { loadState, writeBoundary } from './tower.mjs';
import { traceGuard } from './trace.mjs';
import { depotEnAvance } from './alignement.mjs';
import { routage, roles } from './routage.mjs';


/* GARDE EN BOUCLE — le seul mécanisme capable d'arrêter une écriture AVANT qu'elle ait
 * lieu. C'est ce que ni la tour de contrôle ni la CI ne peuvent faire : la tour ne voit
 * que ce qu'on lui demande, la CI arrive après le commit.
 *
 * La garde ne porte AUCUNE règle en propre : les chemins atomiques et la frontière
 * d'écriture viennent du registre et de la tour, exactement comme pour `apf check` et
 * pour l'intégration continue. Une règle écrite ici serait une source de vérité de plus.
 *
 * Portée volontairement étroite : elle ne juge que les écritures sous product/. Le
 * plugin gouverne les artefacts de la méthode, pas le dépôt entier. Un plugin qui
 * arbitre chaque écriture du projet se fait désinstaller.
 *
 * Trois verdicts, et le choix du troisième est délibéré :
 *   deny  un chemin sous product/ qui n'est déclaré par AUCUN livrable — K2 le refuserait
 *         de toute façon, autant le refuser avant l'écriture ; ou un chemin hors de la
 *         frontière de l'activité ouverte.
 *   ask   un chemin déclaré, mais aucune activité ouverte à la tour. Refuser bloquerait
 *         un travail légitime hors run ; autoriser en silence rendrait la tour facultative.
 *         La question remonte donc à l'humain, qui est l'autorité.
 *   allow tout le reste.  */

const DECL = () => {
  const r = registry();
  const set = new Set();
  for (const w of r.work_products)
    for (const f of w.files || []) set.add('product/' + (w.base || '') + f);
  return set;
};

/* Un chemin déclaré peut être paramétré — {release-id}, {slice-id} — ou désigner un
   dossier. La comparaison se fait donc sur un motif, jamais sur une égalité de chaîne. */
const toRe = (p) => new RegExp('^' + p
  .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  .replace(/\\\{[^}]+\\\}/g, '[^/]+')
  .replace(/\/$/, '/.*') + (p.endsWith('/') ? '' : '(/.*)?$'));

export function guard({ tool, path: raw, cwd = process.cwd() }) {
  if (!raw) return { decision: 'allow', reason: 'aucun chemin dans l\'appel' };
  const rel = (isAbsolute(raw) ? relative(cwd, raw) : raw).split(sep).join('/');
  if (!rel.startsWith('product/'))
    return { decision: 'allow', reason: 'hors product/ — le plugin gouverne les artefacts de la méthode, pas le dépôt' };
  /* Un plugin plus ancien que le dépôt ne connaît pas ses chemins ni ses identifiants : il
     n'y écrit pas, et dit comment se mettre à jour. */
  const avance = depotEnAvance(cwd);
  if (avance) return { decision: 'deny', reason: avance.reason };

  const declared = [...DECL()];
  const match = declared.find(d => toRe(d).test(rel));
  if (!match)
    return { decision: 'deny',
      reason: `Chemin non déclaré au registre : ${rel}\n\n` +
        `Un artefact à un chemin non déclaré est invisible à la gouvernance et fait échouer K2. ` +
        `« apf list wp » liste les livrables et leurs chemins ; « apf show wp <id> » donne le plan de contenu de chacun. ` +
        `Si le livrable manque au registre, c'est une Method Change Request, pas une écriture.` };

  const st = loadState(cwd);
  const open = st.opened[st.opened.length - 1];
  if (!open)
    return { decision: 'ask',
      reason: `Chemin déclaré (${match}) mais aucune activité ouverte à la tour de contrôle.\n\n` +
        `Sans ouverture, l'écriture n'est pas journalisée et K8 la signalera comme hors tour. ` +
        `Ouvrir d'abord : « apf tower factory_open_activity '{"activity":"<n>"}' ». Autoriser quand même relève de l'humain.` };

  const boundary = writeBoundary(open.activity);
  if (!boundary.some(b => toRe(b).test(rel))) {
    const a = byId(registry().activities, open.activity);
    return { decision: 'deny',
      reason: `Hors frontière d'écriture de l'activité ${open.activity} — ${a?.name}.\n\n` +
        `Cette activité écrit : ${boundary.join(', ') || '(aucun chemin)'}\n` +
        `Chemin demandé : ${rel}\n\n` +
        `${match} appartient à une autre activité. Ouvrir l'activité qui en répond plutôt qu'écrire depuis celle-ci : ` +
        `un livrable produit hors de son activité perd son Accountable, et K5 existe pour que personne ne juge son propre travail.` };
  }
  return { decision: 'allow', reason: `${match} — dans la frontière de l'activité ${open.activity}` };
}

/* UN ÉVALUATEUR N'EXÉCUTE QUE LES CONTRÔLES. Le profil auditor reçoit Bash restreint à apf
 * dans sa liste d'outils ; la garde le restreint une seconde fois, parce qu'un motif de
 * liste d'outils que le harness ne saurait pas lire laisserait passer Bash nu.
 *
 * Portée volontairement étroite, et c'est ce qui la rend sûre : elle ne REFUSE qu'à un rôle
 * en lecture seule que la charge du hook NOMME, et ne rend JAMAIS « allow » — un accord ici
 * court-circuiterait les permissions de l'humain sur toute commande de tous les agents.
 * Charge sans nom d'agent, ou agent producteur : aucune décision, le harness suit son cours. */
const evaluatorAgents = () => {
  const r = registry();
  const ro = new Set((r.tools_profiles || []).filter(p => p.writes === false).map(p => p.id));
  return new Set((r.agents || []).filter(a => ro.has(a.tools_profile))
    .flatMap(a => a.instances ? a.instances.map(i => `critic-${i}`) : [a.id]));
};

/** Une commande qui n'est qu'un appel simple à apf — ni enchaînement, ni redirection, ni substitution. */
export const isApfCall = cmd => {
  const c = String(cmd || '').trim();
  if (!c || /[;&|`$<>\n\\]/.test(c)) return false;
  return /^["']?(?:[^\s"']*\/)?apf["']?(?:\s|$)/.test(c);
};

export function guardBash({ command, agent }) {
  const who = String(agent || '').split(':').pop();
  if (!who || !evaluatorAgents().has(who)) return null;
  if (isApfCall(command)) return null;
  return { decision: 'deny',
    reason: `${who} est un rôle en lecture seule : il n'exécute que les commandes de contrôle de la méthode (« apf check », « apf show … », « apf tower factory_check »).\n\n` +
      `Commande refusée : ${String(command || '').slice(0, 200)}\n\n` +
      `Un évaluateur qui peut lancer n'importe quelle commande peut modifier ce qu'il juge ; P2 redeviendrait une consigne.` };
}

/* LE ROUTAGE OPPOSABLE (R6). Un rôle de la méthode invoqué pendant une activité ouverte
 * tourne sur le modèle et l'effort que la tour a calculés pour ce contexte — cadence, tier,
 * réouverture, chemin EXPRESS. Sans cela, la modulation du registre restait une consigne :
 * le fichier d'agent ne porte qu'un modèle. Même portée étroite que pour Bash : la garde ne
 * REFUSE qu'un rôle de la méthode, seulement quand une activité est ouverte, et ne rend JAMAIS
 * « allow ». Le refus nomme les valeurs attendues : se corriger coûte un appel. */
export function guardAgent({ input, cwd = process.cwd() }) {
  const id = String(input?.subagent_type || '').split(':').pop();
  if (!id || !roles().includes(id)) return null;
  const st = loadState(cwd);
  if (!st.routage) return null;
  const attendu = routage(id, st.routage), fichier = routage(id, {});
  if (!attendu) return null;
  const model = input.model || fichier.modele;
  const effort = input.effort || fichier.base.effort_adaptateur;
  if (model === attendu.modele && effort === attendu.effort_adaptateur) return null;
  const c = st.routage;
  return { decision: 'deny',
    reason: `Routage (R6) : activité ${c.activite} — ${c.cadence || 'hors cadence'}, tier ${c.tier}${c.reprise ? ', réouverture' : ''}${c.express ? ', chemin EXPRESS' : ''}.\n\n` +
      `Invoquer ${id} avec model: ${attendu.modele} et effort: ${attendu.effort_adaptateur}` +
      ` — reçu model: ${model}, effort: ${effort}.\n` +
      (attendu.modulations.length ? `Modulations : ${attendu.modulations.map(m => `${m.id} ${m.effet} (${m.raison})`).join(' · ')}.\n` : '') +
      `\nUn rôle invoqué hors de son routage ferait juger une revue de tier R3 par le modèle d'une slice routinière.` };
}

/* LA RECHERCHE WEB, ACCORDÉE À UNE ACTIVITÉ (web_research.who). Un rôle de la méthode ne
 * cherche sur le web que pendant une activité qui déclare la capacité ; un évaluateur jamais —
 * il ira chercher de quoi étayer le verdict qu'il a déjà formé. Hors run, ou appel de la
 * conversation principale : aucune décision. Jamais « allow ». */
export function guardWebSearch({ agent, cwd = process.cwd() }) {
  const who = String(agent || '').split(':').pop();
  if (!who || !roles().includes(who)) return null;
  const r = registry();
  if (evaluatorAgents().has(who) || who === 'conformance-auditor')
    return { decision: 'deny', reason: `${who} évalue : il ne cherche pas sur le web. Il vérifie une citation contre sa source (WebFetch sur l'adresse citée), il ne va pas chercher de quoi étayer son verdict.` };
  const st = loadState(cwd);
  const act = st.routage?.activite ?? st.opened?.at(-1)?.activity;
  if (act == null) return null;
  const ok = (r.web_research?.who?.granted_at || []).map(String);
  if (ok.includes(String(act))) return null;
  return { decision: 'deny',
    reason: `Recherche web refusée pendant l'activité ${act} : la capacité est accordée aux activités ${ok.join(', ')} seulement.\n\n` +
      `Chercher pendant une activité de rédaction sert à justifier ce qu'on vient d'écrire. Ce qui manque devient une HYP-nn, testée là où la méthode le prévoit.` };
}

/* Traduction vers le protocole de hook du harness. C'est la SEULE partie spécifique au
   harness, et elle ne décide rien : elle met en forme un verdict déjà rendu. */
export function guardFromHookPayload(payload, cwd) {
  const p = payload || {};
  if (p.tool_name === 'Agent' || p.tool_name === 'Task' || p.tool_name === 'WebSearch') {
    const v = p.tool_name === 'WebSearch'
      ? guardWebSearch({ agent: p.agent_type ?? p.agent_name ?? p.subagent_type, cwd: p.cwd || cwd })
      : guardAgent({ input: p.tool_input, cwd: p.cwd || cwd });
    if (!v) return { verdict: { decision: 'none', reason: 'invocation hors du ressort de la garde' }, hook: {} };
    try { traceGuard(p.cwd || cwd, v, p); } catch { /* observer n'arrête jamais celui qui décide */ }
    return { verdict: v, hook: { hookSpecificOutput: { hookEventName: 'PreToolUse',
             permissionDecision: v.decision, permissionDecisionReason: v.reason } } };
  }
  if (p.tool_name === 'Bash') {
    const v = guardBash({ command: p.tool_input?.command, agent: p.agent_type ?? p.agent_name ?? p.subagent_type });
    if (!v) return { verdict: { decision: 'none', reason: 'commande hors du ressort de la garde' }, hook: {} };
    try { traceGuard(p.cwd || cwd, v, p); } catch { /* observer n'arrête jamais celui qui décide */ }
    return { verdict: v, hook: { hookSpecificOutput: { hookEventName: 'PreToolUse',
             permissionDecision: v.decision, permissionDecisionReason: v.reason } } };
  }
  const v = guard({ tool: p.tool_name, path: p.tool_input?.file_path ?? p.tool_input?.notebook_path, cwd: p.cwd || cwd });
  /* LE VERDICT EST TRACÉ ICI, ET NULLE PART AILLEURS : la garde est seule à le connaître,
     et un refus qu'on ne peut pas compter ne se corrige pas. L'écriture de la trace ne peut
     pas changer le verdict — elle vient après, et elle n'a pas le droit d'échouer bruyamment. */
  try { traceGuard(p.cwd || cwd, v, p); } catch { /* observer n'arrête jamais celui qui décide */ }
  return {
    verdict: v,
    hook: { hookSpecificOutput: { hookEventName: 'PreToolUse',
            permissionDecision: v.decision, permissionDecisionReason: v.reason } }
  };
}
