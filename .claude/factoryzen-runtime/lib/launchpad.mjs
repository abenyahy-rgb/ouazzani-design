import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import yaml from './yaml.mjs';
import { cursor, read, setCursor, trace } from './trace.mjs';
import { cheminDe } from './registry.mjs';

/* LE LIEN AU LAUNCHPAD — appairage du poste, puis envoi de la trace.
 *
 * L'état de référence reste TIRÉ : le launchpad recalcule tout depuis le commit, et rien
 * de ce fichier n'y participe. Ce qui est POUSSÉ ici est un FLUX — la trace — et un flux
 * ne se tire pas depuis un commit qui n'existe pas encore. Les deux ne se contredisent
 * jamais : la trace perdue, l'état gouverné est intact, parce qu'il n'en dépend pas.
 *
 * L'APPAIRAGE EST UN DEVICE FLOW, et le choix est un refus. Un secret partagé déposé dans
 * le dépôt produit aurait été plus simple et strictement pire : il se copie, il ne s'expire
 * pas, et personne ne sait quel poste l'a employé. Ici le CLI affiche un code, l'humain
 * l'approuve là où il est DÉJÀ authentifié, et le serveur scelle un jeton de poste que le
 * dépôt ne porte jamais. Aucun secret n'est saisi à la main.
 *
 * Le jeton n'ouvre QUE l'écriture de trace : il ne lit pas le miroir, n'écrit aucun
 * livrable, ne déclare rien à la tour et ne franchit aucune gate. */

const safe = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };

export const home = () => process.env.FACTORYZEN_HOME || join(homedir(), '.factoryzen');
export const credentialsFile = () => join(home(), 'credentials.json');

/* ── identité du projet, lue là où l'activité 1 l'a écrite ────────────── */

/** L'adresse du launchpad et le slug du projet, tels que SOC-01 les porte. */
export function projectRef(root = process.cwd()) {
  const f = join(root, 'product', cheminDe('SOC-01', 'project.yaml'));
  const id = safe(() => existsSync(f) ? yaml.load(readFileSync(f, 'utf8')) : null);
  const loc = id?.workspace_root_location || '';
  const m = /^(https?:\/\/[^/]+)\/projects\/([^/?#]+)/.exec(String(loc));
  if (!m) return null;
  return { launchpad: m[1], slug: m[2], kind: id?.workspace_kind || null, name: id?.name || null };
}

/* ── jetons de poste ──────────────────────────────────────────────────── */

const allCredentials = () => safe(() => existsSync(credentialsFile()) ? JSON.parse(readFileSync(credentialsFile(), 'utf8')) : {}, {}) || {};

export function credential(launchpad) {
  const c = allCredentials()[launchpad];
  if (!c?.token) return null;
  if (c.expires_at && Date.parse(c.expires_at) < Date.now()) return { ...c, expired: true };
  return c;
}

export function saveCredential(launchpad, value) {
  const all = allCredentials();
  all[launchpad] = value;
  mkdirSync(home(), { recursive: true });
  writeFileSync(credentialsFile(), JSON.stringify(all, null, 2) + '\n');
  /* Le fichier porte un jeton : il n'est lisible que par son propriétaire. Sur un système
     qui ignore les permissions POSIX, l'échec est sans conséquence et ne doit pas casser
     l'appairage — mais il n'est pas masqué non plus, il n'est simplement pas fatal. */
  safe(() => chmodSync(credentialsFile(), 0o600));
  return value;
}

export function forgetCredential(launchpad) {
  const all = allCredentials();
  if (!all[launchpad]) return false;
  delete all[launchpad];
  writeFileSync(credentialsFile(), JSON.stringify(all, null, 2) + '\n');
  return true;
}

/* ── réseau ───────────────────────────────────────────────────────────── */

async function post(url, body, token) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `${url} → ${res.status}`);
  return json;
}

/** L'adresse de la fonction d'ingestion, demandée au launchpad lui-même : la coder en dur
 *  ici ferait du plugin le dépositaire d'une adresse dont il ne répond pas. */
export async function edgeUrl(launchpad) {
  const res = await fetch(`${launchpad}/api/health`);
  if (!res.ok) throw new Error(`${launchpad}/api/health → ${res.status}`);
  const j = await res.json();
  if (!j.edge_url) throw new Error('le launchpad ne déclare pas son adresse d\'ingestion');
  return j.edge_url.replace(/\/$/, '');
}

export const pairStart = (edge, label) => post(`${edge}/pair/start`, { label });
export const pairPoll = (edge, device_code) => post(`${edge}/pair/poll`, { device_code });

/* ── envoi de la trace ────────────────────────────────────────────────── */

const git = (root, ...args) => safe(() => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null);

/**
 * Envoie ce qui n'est pas parti. Rend un compte rendu, ne lève jamais pour une raison de
 * réseau : un envoi impossible n'est pas une erreur de l'agent, c'est une trace en retard.
 */
export async function push(root = process.cwd(), { limit = 500 } = {}) {
  const ref = projectRef(root);
  if (!ref) return { ok: false, reason: 'ce dépôt ne déclare aucun projet de launchpad (SOC-01, workspace_root_location)' };
  const cred = credential(ref.launchpad);
  if (!cred) return { ok: false, reason: `poste non appairé sur ${ref.launchpad} — « apf connect »`, need_pairing: true };
  if (cred.expired) return { ok: false, reason: `le jeton de ce poste a expiré — « apf connect »`, need_pairing: true };

  const from = cursor(root);
  const events = read(root, from, limit);
  if (!events.length) return { ok: true, sent: 0, from };

  const sessions = [...new Set(events.map(e => e.session).filter(Boolean))];
  const body = {
    slug: ref.slug,
    repo: git(root, 'remote', 'get-url', 'origin'),
    branch: git(root, 'rev-parse', '--abbrev-ref', 'HEAD'),
    commit: git(root, 'rev-parse', 'HEAD'),
    cwd: root,
    sessions,
    events,
  };
  const r = await post(`${cred.edge}/telemetry/push`, body, cred.token);
  setCursor(root, events[events.length - 1].seq);
  return { ok: true, sent: events.length, from, to: events[events.length - 1].seq, ...r };
}

/* ── envoi opportuniste, depuis les hooks ─────────────────────────────────
   Un hook doit rendre la main tout de suite : le harness l'attend avant de poursuivre. On
   ne pousse donc JAMAIS dans le processus du hook — on détache un enfant qui s'en charge,
   et on l'étrangle pour ne pas en lancer un par appel d'outil. */
const LOCK = (root) => join(root, 'runs', '.trace-push.lock');

export function maybePush(root = process.cwd(), { everyMs = 3000, apf = null } = {}) {
  return safe(() => {
    const lock = LOCK(root);
    const last = safe(() => JSON.parse(readFileSync(lock, 'utf8')).at, 0) || 0;
    if (Date.now() - last < everyMs) return false;
    mkdirSync(dirname(lock), { recursive: true });
    writeFileSync(lock, JSON.stringify({ at: Date.now() }));
    const bin = apf || join(dirname(new URL(import.meta.url).pathname), '..', 'bin', 'apf');
    const child = spawn(process.execPath, [bin, 'trace', 'push', '--quiet'], {
      cwd: root, detached: true, stdio: 'ignore', env: { ...process.env, FACTORYZEN_PUSH_CHILD: '1' },
    });
    child.unref();
    return true;
  }, false);
}

/** Ce que le poste sait de lui-même — pour « apf trace status ». */
export function status(root = process.cwd()) {
  const ref = projectRef(root);
  const cred = ref ? credential(ref.launchpad) : null;
  const from = cursor(root);
  return {
    projet: ref ? `${ref.name || ref.slug} (${ref.slug})` : null,
    launchpad: ref?.launchpad || null,
    poste: cred ? { label: cred.label, user: cred.user, expire: cred.expires_at || null, expired: !!cred.expired } : null,
    trace: { envoyes: from, en_attente: read(root, from, 10000).length },
    note: !ref ? "Ce dépôt ne déclare aucun projet de launchpad : la trace reste locale."
        : !cred ? "Poste non appairé : la trace reste locale. « apf connect » l'appaire en une fois."
        : cred.expired ? "Jeton expiré : « apf connect » le renouvelle."
        : "Le poste est appairé ; la trace part au fil de la session.",
  };
}

/** Enregistre au journal local qu'un appairage a eu lieu — un poste nouveau est un fait. */
export const tracePairing = (root, label) => trace(root, { type: 'notice', name: 'poste appairé', detail: label });
