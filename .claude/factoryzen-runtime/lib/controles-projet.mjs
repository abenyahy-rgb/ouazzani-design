/* LES CONTRÔLES PROPRES AU PROJET.
 *
 * Les huit contrôles K disent si la MÉTHODE est tenue ; ils ne savent rien des règles du
 * PRODUIT — « aucun écran n'appelle le réseau », « un montant affiché remonte à ses lignes »,
 * « la parcelle d'un utilisateur n'est lisible que par lui ». Ces règles-là s'écrivent dans le
 * projet, comme des fonctions de vérification exécutables, et la méthode leur donne un cadre :
 *
 *   - un MANIFESTE déclaré, controles/controles.yaml à la racine du dépôt produit ;
 *   - chaque contrôle cite la décision ou l'invariant qui l'impose (ADR, TRM, critère) ;
 *   - chaque contrôle porte au moins un TEST NÉGATIF : une mutation appliquée à une COPIE
 *     d'une fixture déclarée, qui doit le faire échouer — et la fixture intacte doit passer.
 *     Un contrôle qu'on n'a jamais vu échouer ne prouve pas qu'il le peut ; une fixture
 *     modifiée en place est l'erreur que le run BatiZen a payée en commits de réparation.
 *
 * OÙ ILS S'EXÉCUTENT — et où jamais. Dans l'environnement du projet : « apf check » sur le
 * poste de l'agent ou en intégration continue, et la tour avant de déclarer une gate prête.
 * JAMAIS dans le Launchpad : il rejoue les contrôles de méthode sur un instantané du dépôt, et
 * y exécuter le code d'un projet ferait tourner du code tiers sur la plateforme. Le Launchpad
 * ne voit que la forme du manifeste et le dernier résultat consigné (runs/controles-projet.json). */
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, isAbsolute, normalize } from 'node:path';
import yaml from './yaml.mjs';

export const MANIFESTE = 'controles/controles.yaml';
export const RESULTATS = 'runs/controles-projet.json';
const DELAI_MS = 120_000;

const dans = (root, rel) => {
  const p = normalize(join(root, rel));
  return !isAbsolute(rel) && !rel.split(/[\\/]/).includes('..') && p.startsWith(normalize(root));
};

/** Le manifeste du projet, ou null s'il n'en déclare pas. */
export function lireManifeste(root) {
  const f = join(root, MANIFESTE);
  if (!existsSync(f)) return null;
  try { return yaml.load(readFileSync(f, 'utf8')) || {}; } catch (e) { return { __illisible: e.message }; }
}

/** La FORME du manifeste — ce que le Launchpad peut vérifier sans rien exécuter. */
export function formeControles(root) {
  const m = lireManifeste(root), f = [];
  if (!m) return { present: false, findings: [] };
  if (m.__illisible) return { present: true, findings: [`${MANIFESTE} illisible — ${m.__illisible}`] };
  const ids = new Set();
  for (const c of m.controles || []) {
    const id = c.id || '(sans id)';
    if (!/^PC-\d{2,}$/.test(String(c.id || ''))) f.push(`${id} : identifiant attendu PC-nn`);
    if (ids.has(c.id)) f.push(`${id} : identifiant en double`);
    ids.add(c.id);
    if (!c.nom) f.push(`${id} : sans nom`);
    if (!c.source) f.push(`${id} : ne cite ni la décision ni l'invariant qui l'impose — un contrôle sans source est une règle sans autorité`);
    if (!Array.isArray(c.commande) || !c.commande.length) f.push(`${id} : commande absente — une liste d'arguments, jamais une ligne de shell`);
    const neg = c.negatifs || [];
    if (!neg.length) f.push(`${id} : aucun test négatif — un contrôle qu'on n'a jamais vu échouer ne prouve pas qu'il le peut`);
    for (const [i, n] of neg.entries()) {
      if (!n.fixture || !dans(root, n.fixture)) f.push(`${id} négatif ${i + 1} : fixture absente ou hors du dépôt`);
      else if (!existsSync(join(root, n.fixture))) f.push(`${id} négatif ${i + 1} : fixture ${n.fixture} introuvable`);
      const mu = n.mutation || {};
      if (!mu.fichier || !dans(root, mu.fichier)) f.push(`${id} négatif ${i + 1} : mutation sans fichier, ou hors de la fixture`);
      if (mu.remplacer == null && mu.ajouter == null) f.push(`${id} négatif ${i + 1} : mutation vide — remplacer/par ou ajouter`);
    }
  }
  if (!(m.controles || []).length) f.push(`${MANIFESTE} : aucun contrôle déclaré`);
  return { present: true, findings: f, controles: (m.controles || []).length };
}

function lancer(root, commande, cible) {
  const [cmd, ...args] = commande.map(String);
  const r = spawnSync(cmd, args, { cwd: root, timeout: DELAI_MS, encoding: 'utf8',
    env: { ...process.env, CONTROLE_CIBLE: cible, PROJECT_ROOT: root } });
  return { code: r.status, sortie: `${r.stdout || ''}${r.stderr || ''}`.trim().slice(-2000), erreur: r.error?.message };
}

function muter(copie, mu) {
  const f = join(copie, mu.fichier);
  const avant = existsSync(f) ? readFileSync(f, 'utf8') : '';
  let apres = avant;
  if (mu.remplacer != null) apres = avant.split(String(mu.remplacer)).join(String(mu.par ?? ''));
  if (mu.ajouter != null) apres = avant + String(mu.ajouter);
  if (apres === avant) return false;
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, apres);
  return true;
}

/**
 * EXÉCUTE les contrôles du projet : chacun sur le dépôt (doit passer), puis chacun de ses
 * tests négatifs sur une copie de sa fixture — intacte (doit passer), mutée (doit échouer).
 * Consigne le résultat dans runs/controles-projet.json. Rend { present, controles: [...],
 * findings: [...] } — un finding par écart.
 */
export function executerControles(root, { consigner = true } = {}) {
  const forme = formeControles(root);
  if (!forme.present) return { present: false, controles: [], findings: [] };
  const findings = [...forme.findings], resultats = [];
  for (const c of lireManifeste(root).controles || []) {
    if (!Array.isArray(c.commande) || !c.commande.length) continue;
    const r = { id: c.id, nom: c.nom, source: c.source, depot: null, negatifs: [] };
    const d = lancer(root, c.commande, root);
    r.depot = d.code === 0 ? 'PASS' : 'FAIL';
    if (d.code !== 0) findings.push(`${c.id} — ${c.nom} : ÉCHEC sur le dépôt${d.erreur ? ` (${d.erreur})` : ''}\n${d.sortie}`);
    for (const [i, n] of (c.negatifs || []).entries()) {
      if (!n.fixture || !dans(root, n.fixture) || !existsSync(join(root, n.fixture))) continue;
      const tmp = mkdtempSync(join(tmpdir(), `controle-${c.id}-`));
      try {
        const copie = join(tmp, 'fixture');
        cpSync(join(root, n.fixture), copie, { recursive: true });
        const intacte = lancer(root, c.commande, copie);
        const mutee = muter(copie, n.mutation || {});
        const apres = mutee ? lancer(root, c.commande, copie) : null;
        const ok = intacte.code === 0 && mutee && apres.code !== 0;
        r.negatifs.push({ n: i + 1, intacte: intacte.code === 0 ? 'PASS' : 'FAIL', mutee: !mutee ? 'MUTATION SANS EFFET' : apres.code !== 0 ? 'FAIL attendu' : 'PASS — le contrôle n\'a rien vu', ok });
        if (intacte.code !== 0) findings.push(`${c.id} négatif ${i + 1} : la fixture INTACTE échoue — le contrôle est mal calibré\n${intacte.sortie}`);
        else if (!mutee) findings.push(`${c.id} négatif ${i + 1} : la mutation ne change pas ${n.mutation?.fichier} — le test ne teste rien`);
        else if (apres.code === 0) findings.push(`${c.id} négatif ${i + 1} : la mutation n'est pas détectée — le contrôle ne peut pas échouer sur ce défaut`);
      } finally { rmSync(tmp, { recursive: true, force: true }); }
    }
    resultats.push(r);
  }
  const out = { present: true, at: new Date().toISOString(), controles: resultats, findings };
  if (consigner && existsSync(join(root, 'runs'))) writeFileSync(join(root, RESULTATS), JSON.stringify(out, null, 2) + '\n');
  return out;
}

/** Le dernier résultat consigné — ce que le Launchpad affiche, sans rien exécuter. */
export function dernierResultat(root) {
  const f = join(root, RESULTATS);
  if (!existsSync(f)) return null;
  try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; }
}
