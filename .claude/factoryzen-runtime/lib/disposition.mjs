/* MIGRATION DE DISPOSITION — un projet ouvert avant le rangement « par étape » garde ses
 * livrables aux anciens chemins (product/strategy/…), que le registre ne déclare plus. Sans
 * migration, la mise à jour du plugin les rend invisibles : la garde refuse d'y écrire, la
 * tour ne trouve plus l'identité du produit, les contrôles les comptent absents.
 *
 * La table vient de lib/disposition-par-etape.json, calculée en confrontant le registre
 * d'avant et celui d'aujourd'hui (build/build-disposition.mjs) : aucun chemin n'est deviné.
 * Un fichier ne se déplace que s'il existe à l'ancien chemin ET pas au nouveau : rejouée, la
 * migration ne fait rien, et elle n'écrase jamais un livrable déjà rangé. */
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const TABLE = JSON.parse(readFileSync(new URL('./disposition-par-etape.json', import.meta.url), 'utf8'));

const vide = d => { try { return readdirSync(d).length === 0; } catch { return false; } };
const fichiers = (racine, d = racine, acc = []) => {
  for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) fichiers(racine, p, acc); else acc.push(p.slice(racine.length + 1)); }
  return acc;
};

/** Déplace les livrables restés aux anciens chemins. Rend { deplaces: [{ ancien, nouveau }] }. */
export function migrerDisposition(root) {
  const prod = join(root, 'product');
  const deplaces = [];
  if (!existsSync(prod)) return { deplaces };
  for (const { ancien, nouveau } of TABLE.paires) {
    const a = join(prod, ancien), n = join(prod, nouveau);
    if (!existsSync(a) || existsSync(n)) continue;
    mkdirSync(dirname(n), { recursive: true });
    renameSync(a, n);
    deplaces.push({ ancien: 'product/' + ancien, nouveau: 'product/' + nouveau });
    /* un dossier d'origine devenu vide disparaît : il n'est plus déclaré nulle part */
    for (let d = dirname(a); d.startsWith(prod) && d !== prod && vide(d); d = dirname(d)) rmdirSync(d);
  }
  /* LES CHEMINS PARAMÉTRÉS — releases/{release-id}/sprints/{sprint-id}/ devenu
     releases/{release-id}/slices/{slice-id}/. Le motif se lit sur les fichiers RÉELS : les
     paramètres capturés se reportent dans l'ordre, et un dossier emporte tout son contenu.
     Même règle que les paires : jamais d'écrasement, rejouée elle ne fait rien. */
  for (const { ancien, nouveau } of TABLE.parametres || []) {
    const dossier = ancien.endsWith('/');
    const motif = new RegExp('^' + ancien.split(/\{[^}]+\}/).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('([^/]+)') + (dossier ? '(.+)$' : '$'));
    for (const rel of fichiers(prod)) {
      const m = motif.exec(rel);
      if (!m) continue;
      const valeurs = m.slice(1, dossier ? -1 : undefined);
      let k = 0;
      const cible = nouveau.replace(/\{[^}]+\}/g, () => valeurs[k++]) + (dossier ? m[m.length - 1] : '');
      const a = join(prod, rel), n = join(prod, cible);
      if (existsSync(n)) continue;
      mkdirSync(dirname(n), { recursive: true });
      renameSync(a, n);
      deplaces.push({ ancien: 'product/' + rel, nouveau: 'product/' + cible });
      for (let d = dirname(a); d.startsWith(prod) && d !== prod && vide(d); d = dirname(d)) rmdirSync(d);
    }
  }
  /* Le journal de la tour cite les chemins déclarés : il suit le déplacement. */
  const tower = join(root, 'runs', 'tower.json');
  if (deplaces.length && existsSync(tower)) {
    try {
      let t = readFileSync(tower, 'utf8');
      for (const { ancien, nouveau } of deplaces) t = t.split(`"${ancien}"`).join(`"${nouveau}"`);
      writeFileSync(tower, t);
    } catch { /* le journal reste lisible tel quel : on ne le corrompt pas pour le mettre à jour */ }
  }
  return { deplaces };
}
