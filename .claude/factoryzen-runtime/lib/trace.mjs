import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/* LA TRACE — ce que les agents ont réellement FAIT, pendant qu'ils le font.
 *
 * Le Run Ledger dit ce qui a été DÉCIDÉ : activité ouverte, livrable déclaré, gate
 * demandée. Entre deux de ses lignes, la méthode ne voyait rien — ni les outils appelés,
 * ni les fichiers touchés, ni le modèle réellement servi, ni les refus de la garde. Un run
 * se jugeait donc sur la parole de l'agent qui l'a exécuté.
 *
 * TROIS RÈGLES, et elles sont la raison d'être de ce fichier.
 *
 * 1. LA TRACE N'EST PAS UNE PREUVE. Elle n'est pas versionnée, n'entre dans aucun contrôle
 *    K et ne franchit aucune gate. Adosser un contrôle à un fichier que Git ignore ferait
 *    d'un artefact effaçable une pièce opposable — précisément ce que P4 interdit.
 *
 * 2. ELLE ÉCHOUE EN OUVRANT. La garde refuse à sûreté inverse parce qu'elle DÉCIDE ; la
 *    trace OBSERVE. Disque plein, poste non appairé, réseau absent : la session continue.
 *    Un observateur qui bloque ce qu'il observe est un défaut, pas un contrôle. C'est
 *    pourquoi chaque fonction publique d'ici est enveloppée dans un `safe`.
 *
 * 3. ELLE NE PARLE À PERSONNE D'AUTRE QUE LE LAUNCHPAD. Aucune interception réseau, aucune
 *    instrumentation de modèle : on lit ce que le harness donne déjà à ses hooks. */

export const TRACE_FILE = 'trace.ndjson';
const PENDING = '.trace-pending.json';
const CURSOR = '.trace-cursor.json';
const MAX_TRANSCRIPT = 64 * 1024 * 1024;

const runsDir = (root) => join(root, 'runs');
export const tracePath = (root) => join(runsDir(root), TRACE_FILE);

/** Tout appel public passe par ici : une trace qui lève arrêterait la session. */
function safe(fn, fallback = null) {
  try { return fn(); } catch { return fallback; }
}

const readJson = (f, fallback) => safe(() => existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : fallback, fallback);
const writeJson = (f, v) => safe(() => { mkdirSync(runsDir(join(f, '..', '..')), { recursive: true }); writeFileSync(f, JSON.stringify(v)); });

/* ── lecture de l'état de gouvernance ───────────────────────────────────
   L'activité ouverte et son acteur ne sont pas demandés à l'appelant : ils sont LUS à la
   tour. Un appelant qui les fournirait pourrait mentir, et la trace servirait alors à
   confirmer ce qu'elle est censée constater. */
function governance(root) {
  const st = readJson(join(runsDir(root), 'tower.json'), null);
  const open = st?.opened?.[st.opened.length - 1];
  return { run: st?.run || null, activity: open ? String(open.activity) : null, actor: open?.actor || null };
}

/** Le prochain numéro d'ordre — compté sur le fichier, jamais tenu en mémoire : plusieurs
 *  processus de hook s'exécutent en parallèle et aucun ne survit à l'autre. */
function nextSeq(root) {
  const f = tracePath(root);
  if (!existsSync(f)) return 1;
  const txt = safe(() => readFileSync(f, 'utf8'), '');
  let n = 0;
  for (const line of txt.split('\n')) if (line.trim()) n++;
  return n + 1;
}

/**
 * Écrit un événement. Rend l'événement écrit, ou null si rien n'a pu l'être.
 * @param {string} root racine du dépôt produit
 * @param {{type:string,name?:string,session?:string,paths?:string[],outcome?:string,ms?:number,detail?:string,payload?:object}} ev
 */
export function trace(root, ev) {
  return safe(() => {
    if (!ev?.type) return null;
    const g = governance(root);
    const rec = {
      seq: nextSeq(root),
      at: new Date().toISOString(),
      session: ev.session || null,
      type: ev.type,
      name: ev.name || null,
      run: g.run, activity: g.activity, actor: g.actor,
      paths: (ev.paths || []).filter(Boolean).slice(0, 24),
      outcome: ev.outcome || null,
      ms: Number.isFinite(ev.ms) ? Math.round(ev.ms) : null,
      detail: ev.detail ? String(ev.detail).slice(0, 600) : null,
      payload: ev.payload || null,
    };
    mkdirSync(runsDir(root), { recursive: true });
    appendFileSync(tracePath(root), JSON.stringify(rec) + '\n');
    return rec;
  });
}

/** Les événements écrits, du plus ancien au plus récent, depuis un numéro d'ordre exclu. */
export function read(root, afterSeq = 0, limit = 1000) {
  return safe(() => {
    const f = tracePath(root);
    if (!existsSync(f)) return [];
    const out = [];
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      const rec = safe(() => JSON.parse(line));
      if (rec && rec.seq > afterSeq) out.push(rec);
      if (out.length >= limit) break;
    }
    return out;
  }, []);
}

/* ── repliage des appels d'outil ────────────────────────────────────────
   Le harness rend DEUX événements par appel : avant et après. Les garder tels quels
   doublerait chaque ligne et n'apprendrait rien de plus. On retient l'instant de l'avant
   dans un fichier d'attente, et l'après émet UNE ligne qui porte la durée réelle. */
const keyOf = (p) => `${p.session_id || ''}|${p.tool_name || ''}|${safe(() => JSON.stringify(p.tool_input), '')}`.slice(0, 500);

function pendingFile(root) { return join(runsDir(root), PENDING); }

function pendingPut(root, key, at) {
  safe(() => {
    const m = readJson(pendingFile(root), {}) || {};
    m[key] = at;
    /* Un avant sans après — outil interrompu, session tuée — ne doit pas faire enfler le
       fichier indéfiniment : au-delà de 200 entrées, les plus anciennes sont oubliées. */
    const keys = Object.keys(m);
    if (keys.length > 200) for (const k of keys.sort((a, b) => m[a] - m[b]).slice(0, keys.length - 200)) delete m[k];
    mkdirSync(runsDir(root), { recursive: true });
    writeFileSync(pendingFile(root), JSON.stringify(m));
  });
}

function pendingTake(root, key) {
  return safe(() => {
    const m = readJson(pendingFile(root), {}) || {};
    const at = m[key];
    if (at === undefined) return null;
    delete m[key];
    writeFileSync(pendingFile(root), JSON.stringify(m));
    return at;
  });
}

/** Les chemins qu'un appel d'outil touche, tels que son entrée les nomme. */
function pathsOf(input) {
  if (!input || typeof input !== 'object') return [];
  const out = [];
  for (const k of ['file_path', 'notebook_path', 'path']) if (typeof input[k] === 'string') out.push(input[k]);
  if (Array.isArray(input.edits)) for (const e of input.edits) if (typeof e?.file_path === 'string') out.push(e.file_path);
  return out;
}

/** Ce qu'un appel d'outil a fait, en une ligne lisible — jamais son contenu. */
function detailOf(tool, input) {
  if (!input || typeof input !== 'object') return null;
  if (tool === 'Bash') return input.command || null;
  if (tool === 'Task') return input.subagent_type ? `${input.subagent_type} — ${input.description || ''}`.trim() : input.description || null;
  if (tool === 'Grep' || tool === 'Glob') return input.pattern || null;
  if (tool === 'WebFetch' || tool === 'WebSearch') return input.url || input.query || null;
  const p = pathsOf(input);
  return p.length ? p.join(' · ') : null;
}

/** L'issue d'un appel, telle que la réponse de l'outil la rapporte. */
function outcomeOf(resp) {
  if (resp == null) return 'ok';
  if (typeof resp === 'string') return /^\s*(error|erreur)\b/i.test(resp) ? 'erreur' : 'ok';
  if (typeof resp !== 'object') return 'ok';
  if (resp.interrupted) return 'interrompu';
  if (resp.is_error || resp.error) return 'erreur';
  return 'ok';
}

/* ── coût et modèle : la seule source est le transcript ──────────────────
   Le modèle DÉCLARÉ d'un rôle vit au registre ; le modèle SERVI n'est connu que du
   harness, et il peut différer — repli sur surcharge, bascule en séance. Tant qu'il
   n'était consigné nulle part, R1 et R3 étaient des intentions invérifiables. */
export function transcriptUsage(file) {
  return safe(() => {
    if (!file || !existsSync(file) || statSync(file).size > MAX_TRANSCRIPT) return null;
    let model = null, input = 0, output = 0, cache = 0, turns = 0;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      const rec = safe(() => JSON.parse(line));
      const u = rec?.message?.usage;
      if (!u) continue;
      turns++;
      if (rec.message.model) model = rec.message.model;
      input += u.input_tokens || 0;
      output += u.output_tokens || 0;
      cache += (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
    }
    return turns ? { model, tokens_in: input, tokens_out: output, tokens_cache: cache, turns } : null;
  });
}

/* ── traduction des payloads de hook ─────────────────────────────────────
   La SEULE partie spécifique au harness. Elle ne décide rien : elle met en forme.
   Un événement inconnu ne lève pas — il ne produit simplement aucune ligne. */
export function fromHook(root, hookEvent, payload) {
  const p = payload || {};
  const session = p.session_id || null;
  const now = Date.now();

  switch (hookEvent) {
    case 'SessionStart':
      return trace(root, { type: 'session_start', name: p.source || 'startup', session,
                           detail: p.cwd || root });

    case 'UserPromptSubmit':
      return trace(root, { type: 'prompt', session, detail: p.prompt || null,
                           payload: { chars: (p.prompt || '').length } });

    case 'PreToolUse':
      pendingPut(root, keyOf(p), now);
      return null; /* l'avant ne produit aucune ligne : c'est l'après qui la porte */

    case 'PostToolUse': {
      const started = pendingTake(root, keyOf(p));
      return trace(root, {
        type: 'tool', name: p.tool_name || null, session,
        paths: pathsOf(p.tool_input),
        outcome: outcomeOf(p.tool_response),
        ms: started ? now - started : null,
        detail: detailOf(p.tool_name, p.tool_input),
      });
    }

    case 'SubagentStop':
      return trace(root, { type: 'subagent', session, outcome: p.stop_hook_active ? 'relance' : 'fin' });

    case 'Stop': {
      const u = transcriptUsage(p.transcript_path);
      return trace(root, { type: 'turn_end', session, name: u?.model || null,
                           detail: u ? `${u.tokens_in + u.tokens_out} tokens sur ${u.turns} tour(s)` : null,
                           payload: u || null });
    }

    default:
      return null;
  }
}

/** Le verdict de la garde, tracé par la garde elle-même : elle seule le connaît. */
export function traceGuard(root, verdict, payload) {
  return trace(root, {
    type: 'guard', name: payload?.tool_name || null, session: payload?.session_id || null,
    paths: pathsOf(payload?.tool_input), outcome: verdict?.decision || null,
    detail: (verdict?.reason || '').split('\n')[0] || null,
  });
}

/** Une opération de la tour — la couture entre la trace et le Run Ledger. */
export function traceTower(root, op, result) {
  return trace(root, {
    type: 'tower', name: op,
    outcome: result?.ok ? 'accordé' : 'refusé',
    detail: result?.ok ? null : (result?.reason || null),
  });
}

/* ── curseur d'envoi ─────────────────────────────────────────────────────
   Ce qui est parti n'est pas renvoyé. Le curseur vit à côté de la trace, non versionné
   comme elle : un curseur versionné ferait croire au dépôt qu'il sait ce que le launchpad
   a reçu, ce dont il n'a aucun moyen de répondre. */
export function cursor(root) { return readJson(join(runsDir(root), CURSOR), { seq: 0 })?.seq || 0; }
export function setCursor(root, seq) {
  safe(() => { mkdirSync(runsDir(root), { recursive: true }); writeFileSync(join(runsDir(root), CURSOR), JSON.stringify({ seq, at: new Date().toISOString() })); });
}
