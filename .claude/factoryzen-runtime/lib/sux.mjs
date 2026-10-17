/* LA CAMPAGNE SUX — test d'expérience par utilisateurs synthétiques AVEUGLES.
 *
 * Une revue par un agent qui CONNAÎT l'intention du produit est une revue experte (AXR) :
 * elle trouve des défauts de conformité, elle ne dit rien de ce qu'un nouveau venu comprend.
 * Le test aveugle (SUX) répond à l'autre question — un utilisateur naïf trouve-t-il son
 * chemin, comprend-il les mots, réussit-il ce qui engage son argent et ses droits ? — à une
 * condition : que l'agent utilisateur ne sache RIEN de ce qu'on attend de lui. Ce module rend
 * cette condition vérifiable sur les octets de la campagne, sans juger le produit :
 *
 *   SUX1  manifeste de pare-feu : une entrée par session, écrite AVANT la session, dont les
 *         empreintes sont celles des textes exacts donnés à l'agent ;
 *   SUX2  candidat : la campagne porte sur le socle figé — même commit que le socle, même
 *         sha256 que son build, point d'entrée DÉPLOYÉ — et chaque session s'ouvre sur lui ;
 *   SUX3  vocabulaire : ni persona ni mission ne contient un mot de l'interface ; la liste
 *         fermée contient au moins les termes TRM-nn de WP-09, les écrans du socle et les
 *         étapes de WP-05 ;
 *   SUX4  interaction réelle : chaque session pilote le socle, une capture par action, une
 *         fin consignée ; une session « racontée » est rejetée ; les preuves brutes sont à
 *         l'empreinte de leur index (immuables) ;
 *   SUX5  patterns : chaque pattern cite des sessions qui existent, des tours qui existent ;
 *         chaque constat trié est routé vers un livrable du socle ou classé ;
 *   SUX6  étiquetage : « N sessions synthétiques », jamais « N utilisateurs » ; corrélation
 *         des sessions déclarée ; aucun score, aucun seuil ; aucune session qui connaît
 *         l'intention — une revue experte présentée comme un test d'utilisateur est un BLOCKER.
 *
 * Le protocole est repris du run BatiZen (experience-evidence, SUX-01) sans affaiblissement :
 * orchestrateur, agent utilisateur aveugle, observateur, chercheur et triage séparés. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import yaml from './yaml.mjs';

export const SUX_SOCLE = 'C1.4-socle/experience/sux/';
export const FICHIERS = ['protocole.md', 'plan-de-campagne.yaml', 'pare-feu.yaml', 'resultats/', 'annotations/', 'synthese.md', 'patterns.yaml'];
export const ROUTES = ['WP-05', 'WP-09', 'WP-11', 'ARRET_ATTENDU', 'HORS_CHAMP', 'SANS_SUITE'];
const FINS = ['BUT_ATTEINT_SELON_L_AGENT', 'ABANDON', 'BLOQUE', 'ARRET_ATTENDU', 'LIMITE_DE_TOURS', 'LIMITE_DE_TEMPS'];

export const sha256 = b => createHash('sha256').update(b).digest('hex');
const lire = f => { try { return readFileSync(f); } catch { return null; } };
const yml = f => { const b = lire(f); if (!b) return null; try { return yaml.load(b.toString('utf8')) || {}; } catch { return { __illisible: true }; } };

/* Une comparaison de vocabulaire qui ne dépend ni de la casse ni des accents, et qui ne prend
   qu'un mot ou une locution ENTIERS : « étape » est dans « l'étape 1 », pas dans « étapes »… si,
   le pluriel est le même mot pour un lecteur — on compare donc aussi la forme sans s final. */
const plat = s => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();
export function termesPresents(texte, liste) {
  const t = ` ${plat(texte).replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
  return liste.filter(term => {
    const p = plat(term).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    if (!p) return false;
    return t.includes(` ${p} `) || t.includes(` ${p}s `) || t.includes(` ${p}x `);
  });
}

/** Le vocabulaire interne du produit, lu dans ses livrables : termes TRM-nn (WP-09), écrans
 *  du socle (spine.yaml), étapes du squelette (WP-05). */
export function vocabulaireInterne(root) {
  const p = join(root, 'product');
  const out = new Set();
  const gl = lire(join(p, 'C1.4-socle/navigation/glossaire-utilisateur.md'));
  if (gl) for (const m of gl.toString('utf8').matchAll(/^#{2,3}\s*TRM-\d+\s*[—–-]\s*[«"“]?\s*([^»"”\n]+?)\s*[»"”]?\s*$/gm)) out.add(m[1].trim());
  const spine = yml(join(p, 'C1.4-socle/prototype/spine/spine.yaml'));
  for (const s of spine?.stages || []) { if (s.screen) out.add(String(s.screen)); if (s.name) out.add(String(s.name)); }
  const dir = join(p, 'C1.3-parcours/spine/stages');
  if (existsSync(dir)) for (const f of readdirSync(dir).filter(x => x.endsWith('.md'))) {
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(lire(join(dir, f)).toString('utf8'));
    const name = fm && /^name:\s*["']?(.+?)["']?\s*$/m.exec(fm[1]);
    if (name) out.add(name[1]);
  }
  return [...out];
}

const walk = (d, acc = []) => {
  if (!existsSync(d)) return acc;
  for (const e of readdirSync(d)) { const f = join(d, e); statSync(f).isDirectory() ? walk(f, acc) : acc.push(f); }
  return acc;
};

/**
 * Contrôle une campagne SUX. `dir` : dossier de la campagne, relatif à product/. `candidat` :
 * { commit, fichier } — le commit attendu et le fichier, relatif à product/, dont le sha256
 * identifie le build testé. Rend { presente, findings: [{ id, texte }] }.
 */
export function controlerCampagne(root, dir = SUX_SOCLE, candidat = null) {
  const base = join(root, 'product', dir);
  const F = [];
  const f = (id, texte) => F.push({ id, texte: `${dir}${texte}` });
  if (!existsSync(base) || !walk(base).length) return { presente: false, findings: [] };

  for (const x of FICHIERS) if (!existsSync(join(base, x))) f('SUX1', `${x} absent — la campagne se déclare par ses sept pièces`);
  const plan = yml(join(base, 'plan-de-campagne.yaml')) || {};
  const pf = yml(join(base, 'pare-feu.yaml')) || {};
  const pats = yml(join(base, 'patterns.yaml')) || {};
  const sessions = plan.sessions || [];
  const personas = new Map((plan.personas || []).map(x => [x.id, x]));
  const missions = new Map((plan.missions || []).map(x => [x.id, x]));

  /* SUX2 — le candidat */
  const c = plan.candidat || {};
  const attendu = candidat || (() => {
    const s = yml(join(root, 'product', 'C1.4-socle/prototype/spine/spine.yaml'));
    return { commit: s?.commit ? String(s.commit) : null, fichier: 'C1.4-socle/prototype/spine/dist/index.html' };
  })();
  if (!c.commit) f('SUX2', 'plan-de-campagne.yaml : candidat.commit absent — une observation se lie au socle testé');
  else if (attendu.commit && !String(attendu.commit).startsWith(String(c.commit)) && !String(c.commit).startsWith(String(attendu.commit)))
    f('SUX2', `plan-de-campagne.yaml : candidat ${c.commit}, socle figé ${attendu.commit} — la campagne porte sur un autre candidat ; une correction produit un nouveau candidat et la régression tourne sur lui`);
  const build = attendu.fichier ? lire(join(root, 'product', attendu.fichier)) : null;
  if (!c.sha256) f('SUX2', 'plan-de-campagne.yaml : candidat.sha256 absent');
  else if (build && sha256(build) !== c.sha256) f('SUX2', `plan-de-campagne.yaml : sha256 du candidat ≠ sha256 de ${attendu.fichier} — le build testé n'est plus celui du dépôt`);
  if (!/^https?:\/\//.test(String(c.entree || ''))) f('SUX2', 'plan-de-campagne.yaml : candidat.entree n\'est pas une URL déployée — le test porte sur le socle DÉPLOYÉ, jamais sur un fichier local');

  /* SUX3 — le vocabulaire */
  const fermee = (pf.vocabulaire_ferme || []).map(String);
  const interne = vocabulaireInterne(root);
  const manquants = interne.filter(t => !fermee.some(x => plat(x) === plat(t)));
  if (!fermee.length) f('SUX3', 'pare-feu.yaml : vocabulaire_ferme vide — le filtre ne filtre rien');
  if (manquants.length) f('SUX3', `pare-feu.yaml : la liste fermée omet ${manquants.length} terme(s) interne(s) — ${manquants.slice(0, 5).join(', ')}`);
  const liste = [...new Set([...fermee, ...interne])];
  for (const p of personas.values()) { const t = termesPresents(p.prose || '', liste); if (t.length) f('SUX3', `persona ${p.id} : mot de l'interface — ${t.join(', ')}`); }
  for (const m of missions.values()) { const t = termesPresents(m.texte || '', liste); if (t.length) f('SUX3', `mission ${m.id} : mot de l'interface — ${t.join(', ')}`); }
  for (const p of personas.values()) if (!p.source || !/PER-\d+/.test(String(p.source))) f('SUX3', `persona ${p.id} : sans source PER-nn — un persona se tire de WP-04 et de ses verbatims`);

  /* SUX1 — le manifeste */
  const man = new Map((pf.manifeste || []).map(x => [x.session, x]));
  const index = yml(join(base, 'resultats/index.yaml')) || {};
  const idx = new Map((index.fichiers || []).map(x => [x.chemin, x.sha256]));
  const logs = new Map();
  for (const s of sessions) {
    const m = man.get(s.id);
    const per = personas.get(s.persona), mis = missions.get(s.mission);
    if (!per || !mis) f('SUX1', `session ${s.id} : persona ou mission inconnu du plan`);
    if (!m) { f('SUX1', `session ${s.id} : absente du manifeste de pare-feu`); continue; }
    if (per && m.persona_sha256 !== sha256(Buffer.from(String(per.prose || ''), 'utf8'))) f('SUX1', `session ${s.id} : empreinte du persona ≠ texte du plan`);
    if (mis && m.mission_sha256 !== sha256(Buffer.from(String(mis.texte || ''), 'utf8'))) f('SUX1', `session ${s.id} : empreinte de la mission ≠ texte du plan`);
    if (m.entree && c.entree && m.entree !== c.entree) f('SUX1', `session ${s.id} : point d'entrée ≠ celui du candidat`);
    if (m.connait_intention === true) f('SUX6', `session ${s.id} : BLOCKER — l'agent connaît l'intention ; c'est une revue experte (AXR), pas un test aveugle`);
    if (Object.keys(m).some(k => /contrat|chemin_attendu|findings?|criteres?/i.test(k))) f('SUX1', `session ${s.id} : le manifeste donne à l'agent une entrée interdite — ${Object.keys(m).filter(k => /contrat|chemin_attendu|findings?|criteres?/i.test(k)).join(', ')}`);

    /* SUX4 — l'interaction réelle */
    const rel = `resultats/${s.id}/session.jsonl`;
    const b = lire(join(base, rel));
    if (!b) { f('SUX4', `session ${s.id} : ${rel} absent`); continue; }
    if (idx.get(rel) && idx.get(rel) !== sha256(b)) f('SUX4', `session ${s.id} : ${rel} modifié après l'index — une observation est immuable`);
    if (!idx.has(rel)) f('SUX4', `session ${s.id} : ${rel} hors de resultats/index.yaml`);
    let lignes = [];
    try { lignes = b.toString('utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { f('SUX4', `session ${s.id} : journal illisible`); }
    const debut = lignes.find(l => l.type === 'debut'), fin = lignes.find(l => l.type === 'fin');
    const tours = lignes.filter(l => l.type === 'tour');
    logs.set(s.id, tours);
    if (!debut) f('SUX4', `session ${s.id} : aucune ligne de début`);
    else {
      if (c.commit && debut.candidat_commit && !String(debut.candidat_commit).startsWith(String(c.commit))) f('SUX2', `session ${s.id} : ouverte sur ${debut.candidat_commit}, pas sur le candidat`);
      if (m.ecrit_le && debut.le && !(String(m.ecrit_le) < String(debut.le))) f('SUX1', `session ${s.id} : manifeste écrit après le début de la session`);
    }
    if (!m.ecrit_le) f('SUX1', `session ${s.id} : manifeste non daté — impossible de prouver qu'il précède la session`);
    if (!fin || !FINS.includes(fin.categorie)) f('SUX4', `session ${s.id} : fin absente ou hors vocabulaire (${FINS.join(' · ')})`);
    if (!tours.length) f('SUX4', `session ${s.id} : aucune action — une session racontée n'est pas une preuve`);
    for (const t of tours) {
      if (!t.action) f('SUX4', `session ${s.id} tour ${t.n} : pas d'action`);
      if (!t.capture) { f('SUX4', `session ${s.id} tour ${t.n} : pas de capture — une action sans capture est racontée`); continue; }
      const cap = `resultats/${s.id}/${t.capture}`;
      const cb = lire(join(base, cap));
      if (!cb) f('SUX4', `session ${s.id} tour ${t.n} : capture ${t.capture} absente`);
      else if (idx.get(cap) && idx.get(cap) !== sha256(cb)) f('SUX4', `session ${s.id} tour ${t.n} : capture modifiée après l'index`);
    }
  }
  for (const k of man.keys()) if (!sessions.some(s => s.id === k)) f('SUX1', `manifeste : session ${k} inconnue du plan`);

  /* SUX5 — les patterns et le triage */
  const ids = new Set(sessions.map(s => s.id));
  for (const p of pats.patterns || []) {
    if (!(p.sessions || []).length) f('SUX5', `pattern ${p.id} : ne cite aucune session`);
    for (const s of p.sessions || []) if (!ids.has(s)) f('SUX5', `pattern ${p.id} : cite la session ${s}, inconnue`);
    for (const q of p.citations || []) {
      const t = logs.get(q.session);
      if (!t || !t.some(x => x.n === q.tour)) f('SUX5', `pattern ${p.id} : cite le tour ${q.tour} de ${q.session}, absent du journal`);
    }
  }
  const patIds = new Set((pats.patterns || []).map(p => p.id));
  for (const t of pats.triage || []) {
    if (!ROUTES.includes(t.route)) f('SUX5', `triage ${t.id || t.pattern} : route « ${t.route} » hors ${ROUTES.join(' · ')}`);
    if (t.pattern && !patIds.has(t.pattern)) f('SUX5', `triage ${t.id} : pattern ${t.pattern} inconnu`);
  }

  /* SUX6 — l'étiquetage */
  const textes = ['synthese.md', 'patterns.yaml', 'plan-de-campagne.yaml'].map(x => lire(join(base, x))?.toString('utf8') || '').join('\n');
  const faux = textes.match(/\b\d+\s+(?:utilisateur|user|personne|participant|testeur|joueur|client)s?\b/giu);
  if (faux) f('SUX6', `étiquetage : « ${faux[0]} » — toujours « N sessions synthétiques », jamais des personnes`);
  if (!/sessions? synth[ée]tiques?/i.test(lire(join(base, 'synthese.md'))?.toString('utf8') || '')) f('SUX6', 'synthese.md : la population n\'est pas dite « sessions synthétiques »');
  if (!/corr[ée]l[ée]/i.test(textes)) f('SUX6', 'la corrélation des sessions (même modèle, mêmes gabarits) n\'est pas déclarée');
  const seuil = JSON.stringify(plan).match(/"(score|seuil|threshold|note_globale)"\s*:\s*(?!null|"aucun"|"AUCUN"|false)/i);
  if (seuil) f('SUX6', `plan-de-campagne.yaml : ${seuil[1]} défini — aucun score ni seuil tant qu'un run ne les a pas fixés sur preuve`);
  return { presente: true, findings: F };
}

/** Le chemin d'un fichier de la campagne, relatif au projet — pour les messages. */
export const rel = (root, f) => relative(root, f);
