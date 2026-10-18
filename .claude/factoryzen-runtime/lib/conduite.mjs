import { existsSync, readFileSync, statSync } from 'node:fs';
import { registry, byId } from './registry.mjs';
import { loadState } from './tower.mjs';
import { trace } from './trace.mjs';

/* CONTRÔLE DE CONDUITE — une règle d'interrogatoire qui n'est qu'une consigne se lit, puis
 * s'oublie au troisième tour, quand la conversation s'emballe. Ce module la rend opposable.
 *
 * Deux points de contrôle, parce qu'il y a deux façons de poser une question :
 *   question  avant l'appel au mécanisme de questions structurées du harness : un appel qui
 *             porte plusieurs questions est REFUSÉ, avant que l'humain ne les voie ;
 *   fin       à la fin du tour, sur le texte rendu à l'humain : plus d'une question et le
 *             tour est RENVOYÉ une fois, avec la consigne de n'en garder qu'une.
 *
 * Aucune règle ne vit ici : la conduite, ses activités et ses règles viennent du registre
 * (skill qui porte « conduite »), l'activité ouverte vient de la tour. Le compteur est le
 * seul jugement propre au module, et il est volontairement prudent : il ignore le code, les
 * citations et les verbatims, qui ne sont pas des questions posées.
 *
 * Le contrôle ÉCHOUE EN OUVRANT : transcript illisible, état absent, erreur — il laisse
 * passer. Il ne renvoie jamais deux fois de suite le même tour : un second renvoi
 * transformerait un défaut de forme en session bloquée, ce qui serait pire que le défaut. */

const MAX_TRANSCRIPT = 64 * 1024 * 1024;
const safe = (fn, f = null) => { try { return fn(); } catch { return f; } };

/** La conduite qui règle la conversation : celle des skills de l'activité ouverte à la tour. */
export function conduiteActive(root) {
  return safe(() => {
    const st = loadState(root);
    /* MCR-007 : en mode décideur, il n'y a pas d'interrogatoire — l'équipe produit depuis le
       mandat et ne questionne le décideur qu'aux points de passage, en une salve */
    if (st.autopilote?.mode === 'decideur') return null;
    const open = st.opened?.[st.opened.length - 1];
    if (!open) return null;
    const r = registry();
    const a = byId(r.activities, open.activity);
    if (!a) return null;
    /* L'interrogatoire s'achève quand l'activité a déclaré ses livrables : au-delà, la
       conversation n'est plus un interrogatoire et le contrôle se tait. */
    const depuis = Date.parse(open.at || 0) || 0;
    const declares = new Set((st.declared || []).filter(d => String(d.activity) === String(a.id) && (Date.parse(d.at || 0) || 0) >= depuis).map(d => d.work_product));
    if ((a.work_products || []).length && a.work_products.every(w => declares.has(w))) return null;
    const ids = String(a.skill || '').split(',').map(x => x.trim());
    const s = (r.skills || []).find(x => ids.includes(x.id) && x.conduite);
    return s ? { ...s.conduite, skill: s.id, activite: a.id, nom_activite: a.name } : null;
  });
}

/** Les questions qu'un texte POSE à son lecteur. Le code, les citations, les verbatims et
 *  les lignes d'exemple ne comptent pas : rapporter la question d'un tiers n'est pas en poser une. */
export function questionsPosees(texte) {
  let t = String(texte || '');
  t = t.replace(/```[\s\S]*?```/g, ' ')          // blocs de code
       .replace(/https?:\/\/\S+/g, ' ')             // adresses : leur « ? » n'interroge personne
       .replace(/`[^`\n]*`/g, ' ')                 // code en ligne
       .replace(/^\s*>.*$/gm, ' ')                 // citations en bloc
       .replace(/«[^»]*»/g, ' ')                   // citations à la française
       .replace(/“[^”]*”/g, ' ')
       .replace(/"[^"\n]*"/g, ' ')
       .replace(/^\s*\|.*\|\s*$/gm, ' ');          // lignes de tableau : un journal, pas une question
  const phrases = t.split(/(?<=\?)|(?<=[.!])\s+|\n+/).map(x => x.replace(/[*_]/g, '').trim()).filter(Boolean);
  return phrases.filter(p => /\?\s*$/.test(p) && p.replace(/\?\s*$/, '').trim().length >= 3);
}

/** Le texte que l'assistant a rendu à l'humain pendant le dernier tour, lu dans le transcript. */
export function texteDuDernierTour(file) {
  return safe(() => {
    if (!file || !existsSync(file) || statSync(file).size > MAX_TRANSCRIPT) return null;
    const recs = readFileSync(file, 'utf8').split('\n').filter(l => l.trim()).map(l => safe(() => JSON.parse(l))).filter(Boolean);
    const morceaux = [];
    for (let i = recs.length - 1; i >= 0; i--) {
      const m = recs[i].message || {};
      const role = m.role || recs[i].type;
      const contenu = typeof m.content === 'string' ? [{ type: 'text', text: m.content }] : (m.content || []);
      if (role === 'user') {
        /* un résultat d'outil appartient encore au tour ; une instruction humaine le borne */
        if (contenu.some(c => c.type === 'text' || typeof c === 'string')) break;
        continue;
      }
      if (role === 'assistant')
        for (const c of [...contenu].reverse()) if (c.type === 'text' && c.text) morceaux.unshift(c.text);
    }
    return morceaux.join('\n\n');
  }, null);
}

const verdictTrace = (root, payload, nom, outcome, detail) =>
  safe(() => trace(root, { type: 'guard', name: nom, session: payload?.session_id || null, outcome, detail }));

/** Avant un appel au mécanisme de questions structurées. Rend { decision, reason }. */
export function controleQuestion(root, payload) {
  const c = conduiteActive(root);
  if (!c || c.id !== 'une-question-a-la-fois') return { decision: 'allow', reason: 'aucune conduite d\'interrogatoire active' };
  const n = [].concat(payload?.tool_input?.questions || []).length;
  if (n <= 1) return { decision: 'allow', reason: `une question — conduite « ${c.nom} » respectée` };
  const v = { decision: 'deny',
    reason: `Conduite « ${c.nom} » — activité ${c.activite} (${c.nom_activite}) : cet appel porte ${n} questions.\n\n` +
      `Poser UNE seule question, celle qui peut tout arrêter ou qui débloque le plus de branches, avec sa réponse recommandée en première option. ` +
      `Les autres attendent la réponse : elles en dépendent peut-être. Règle déclarée au registre, skill « ${c.skill} ».` };
  verdictTrace(root, payload, 'conduite · question structurée', 'deny', `${n} questions dans un seul appel`);
  return v;
}

/** À la fin du tour. Rend { decision: 'allow' | 'block', reason, questions }. */
export function controleFinDeTour(root, payload) {
  const c = conduiteActive(root);
  if (!c || c.id !== 'une-question-a-la-fois') return { decision: 'allow', reason: 'aucune conduite d\'interrogatoire active', questions: [] };
  const texte = payload?.last_assistant_message ?? texteDuDernierTour(payload?.transcript_path);
  if (texte == null) return { decision: 'allow', reason: 'transcript illisible — le contrôle échoue en ouvrant', questions: [] };
  const q = questionsPosees(texte);
  if (q.length <= 1) return { decision: 'allow', reason: `${q.length} question — conduite respectée`, questions: q };
  if (payload?.stop_hook_active) {
    /* déjà renvoyé une fois : on consigne et on laisse passer — jamais de boucle */
    verdictTrace(root, payload, 'conduite · fin de tour', 'ask', `${q.length} questions après renvoi — laissé passer, à revoir`);
    return { decision: 'allow', reason: `${q.length} questions malgré le renvoi — consigné, non bloqué`, questions: q };
  }
  verdictTrace(root, payload, 'conduite · fin de tour', 'deny', `${q.length} questions dans un même message`);
  return { decision: 'block', questions: q,
    reason: `Conduite « ${c.nom} » — activité ${c.activite} (${c.nom_activite}) : ce message pose ${q.length} questions :\n` +
      q.slice(0, 6).map(x => `  · ${x.slice(0, 160)}`).join('\n') + '\n\n' +
      `Réécrire le message pour n'en poser qu'UNE : la plus décisive sur la frontière, avec sa place (« Question n · k branches ouvertes »), ` +
      `pourquoi elle compte maintenant, et la réponse recommandée. Les autres attendent la réponse. ` +
      `Une phrase interrogative rhétorique compte comme une question : la reformuler en affirmation.` };
}

/* Traduction vers le protocole de hook du harness. Elle ne décide rien. */
export function conduiteFromHookPayload(kind, payload, root) {
  const p = payload || {};
  const cwd = p.cwd || root;
  if (kind === 'question') {
    const v = safe(() => controleQuestion(cwd, p), { decision: 'allow', reason: 'erreur du contrôle — échoue en ouvrant' });
    /* Autorisé : le hook se tait. Rendre « allow » court-circuiterait la permission que
       l'humain a réglée pour cet outil ; ce contrôle ne sait que refuser. */
    return { verdict: v, hook: v.decision === 'deny'
      ? { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: v.reason } } : {} };
  }
  const v = safe(() => controleFinDeTour(cwd, p), { decision: 'allow', reason: 'erreur du contrôle — échoue en ouvrant', questions: [] });
  return { verdict: v, hook: v.decision === 'block' ? { decision: 'block', reason: v.reason } : {} };
}
