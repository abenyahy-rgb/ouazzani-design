import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';
import { registry, ROOT } from './registry.mjs';

/* Intégrité du vendoring.
 *
 * Un skill externe est LIVRÉ AVEC LE PLUGIN — sinon rien ne garantit qu'il soit là
 * quand l'activité 2 le réclame, et l'obligation devient décorative. Il est donc copié
 * verbatim depuis un commit épinglé.
 *
 * Le risque d'une copie est la dérive silencieuse : c'est ce qui a déjà coûté une
 * divergence dans ce dépôt. La dérive n'est pas interdite par consigne, elle est rendue
 * DÉTECTABLE : le hachage de chaque fichier est recalculé à chaque contrôle et confronté
 * au registre. Un octet modifié, un fichier ajouté, un fichier supprimé — K6 échoue.
 *
 * Le registre reste la source unique : les empreintes n'existent qu'à un seul endroit,
 * core/method.yaml. `apf vendor --relock` les recalcule après une remontée de version. */

const sha256 = f => createHash('sha256').update(readFileSync(f)).digest('hex');

export function walkFiles(dir, acc = []) {
  for (const e of readdirSync(dir).sort()) {
    const p = join(dir, e);
    statSync(p).isDirectory() ? walkFiles(p, acc) : acc.push(p);
  }
  return acc;
}

/** Empreintes réelles d'un arbre vendoré, chemins relatifs POSIX. */
export function fingerprint(root) {
  const abs = join(ROOT, root);
  if (!existsSync(abs)) return null;
  return Object.fromEntries(walkFiles(abs).map(p => [relative(abs, p).split(sep).join('/'), sha256(p)]));
}

/** Confronte l'arbre sur disque aux empreintes déclarées. Rend la liste des défauts. */
export function vendorFindings() {
  const r = registry();
  const f = [];
  const declared = new Set();

  for (const s of r.external_capabilities?.sources || []) {
    const v = s.vendor;
    if (!v) { f.push(`source ${s.id} : aucune stratégie de vendoring — le plugin ne livre pas ses skills externes`); continue; }
    const actual = fingerprint(v.root);
    if (!actual) { f.push(`source ${s.id} : arbre vendoré absent — ${v.root}`); continue; }
    const expected = v.files || {};
    for (const [p, h] of Object.entries(expected)) {
      if (!(p in actual)) f.push(`vendor ${s.id} : fichier épinglé absent — ${p}`);
      else if (actual[p] !== h) f.push(`vendor ${s.id} : ${p} modifié localement — empreinte ${actual[p].slice(0, 12)} attendue ${h.slice(0, 12)}`);
    }
    for (const p of Object.keys(actual))
      if (!(p in expected)) f.push(`vendor ${s.id} : fichier non épinglé présent — ${p}`);
    declared.add(v.root);
  }

  f.push(...runtimeDepFindings());

  /* Tout skill externe doit être vendoré ET pointer dans un arbre déclaré : une
     référence sans copie livrée est exactement le défaut qu'on corrige ici. */
  for (const s of (r.skills || []).filter(x => x.origin === 'external')) {
    if (s.vendored !== true) { f.push(`skill ${s.id} : externe non vendoré — rien ne garantit sa présence à l'exécution`); continue; }
    if (!s.vendor_path) { f.push(`skill ${s.id} : vendoré sans chemin déclaré`); continue; }
    if (![...declared].some(d => s.vendor_path === d || s.vendor_path.startsWith(d + '/')))
      f.push(`skill ${s.id} : chemin hors de tout arbre vendoré déclaré — ${s.vendor_path}`);
    if (!existsSync(join(ROOT, s.vendor_path, 'SKILL.md')))
      f.push(`skill ${s.id} : SKILL.md absent sous ${s.vendor_path}`);
    if (existsSync(join(ROOT, 'skills', s.id)))
      f.push(`skill ${s.id} : présent AUSSI dans skills/ — deux copies, donc deux sources de vérité`);
  }

  /* Le manifeste du plugin doit exposer l'arbre vendoré, sinon la copie est livrée
     mais jamais découverte : le skill serait absent à l'exécution malgré le vendoring. */
  const mf = join(ROOT, '.claude-plugin/plugin.json');
  if (existsSync(mf)) {
    const m = JSON.parse(readFileSync(mf, 'utf8'));
    const paths = [m.skills].flat().filter(Boolean).map(x => String(x).replace(/^\.\//, '').replace(/\/$/, ''));
    for (const d of declared)
      if (!paths.includes(d)) f.push(`plugin.json : arbre vendoré ${d} non déclaré dans « skills » — livré mais jamais découvert`);
  } else f.push('plugin.json absent — le plugin ne déclare rien');

  return f;
}

/* INTÉGRITÉ DES DÉPENDANCES D'EXÉCUTION.
 *
 * Même raison que pour les skills, une marche plus bas : un plugin est installé par
 * CLONE. Ce que package.json déclare n'est jamais installé, donc ce qui l'importe casse.
 * Le défaut réel était silencieux et grave — la garde en boucle sortait en 1 au lieu
 * de 2, donc n'arrêtait plus rien : elle échouait en OUVRANT.
 *
 * Quatre choses sont contrôlées, et les deux dernières sont celles qui empêchent le
 * défaut de revenir : personne ne réimporte le paquet npm par son nom, et personne ne
 * le redéclare en dépendance d'exécution. */
export function runtimeDepFindings() {
  const r = registry();
  const f = [];
  const D = r.runtime_dependencies;
  if (!D) return ['registre : aucune dépendance d\'exécution déclarée — un plugin installé par clone n\'en aurait aucune de disponible'];

  const pkgFile = join(ROOT, 'package.json');
  const pkg = existsSync(pkgFile) ? JSON.parse(readFileSync(pkgFile, 'utf8')) : {};

  for (const d of D.packages || []) {
    const v = d.vendor;
    if (!v) { f.push(`dépendance ${d.id} : aucune stratégie de vendoring — absente à l'exécution`); continue; }

    const actual = fingerprint(v.root);
    if (!actual) { f.push(`dépendance ${d.id} : arbre vendoré absent — ${v.root}`); continue; }
    const expected = v.files || {};
    for (const [p, h] of Object.entries(expected)) {
      if (!(p in actual)) f.push(`dépendance ${d.id} : fichier épinglé absent — ${p}`);
      else if (actual[p] !== h) f.push(`dépendance ${d.id} : ${p} modifié localement — empreinte ${actual[p].slice(0, 12)} attendue ${h.slice(0, 12)}`);
    }
    for (const p of Object.keys(actual))
      if (!(p in expected)) f.push(`dépendance ${d.id} : fichier non épinglé présent — ${p}`);

    /* Le point d'entrée unique : sans lui, chaque appelant choisit sa propre porte et
       l'une d'elles finira par être le paquet npm absent. */
    if (!d.entrypoint) f.push(`dépendance ${d.id} : aucun point d'entrée déclaré`);
    else if (!existsSync(join(ROOT, d.entrypoint))) f.push(`dépendance ${d.id} : point d'entrée déclaré absent — ${d.entrypoint}`);
    else if (!readFileSync(join(ROOT, d.entrypoint), 'utf8').includes(v.root.split('/').pop()))
      f.push(`dépendance ${d.id} : le point d'entrée ${d.entrypoint} ne pointe pas vers l'arbre vendoré ${v.root}`);

    /* Ces deux-là ferment la porte au retour du défaut. */
    for (const dir of ['lib', 'bin', 'mcp', 'build', 'tests', 'hooks'])
      for (const file of existsSync(join(ROOT, dir)) ? walkFiles(join(ROOT, dir)) : []) {
        if (!/\.(mjs|js)$/.test(file) || file === join(ROOT, d.entrypoint)) continue;
        if (new RegExp(`from\\s+['"]${d.id}['"]|import\\(['"]${d.id}['"]\\)`).test(readFileSync(file, 'utf8')))
          f.push(`dépendance ${d.id} : ${relative(ROOT, file).split(sep).join('/')} l'importe par son nom npm — absent à l'exécution, passer par ${d.entrypoint}`);
      }
    if (pkg.dependencies?.[d.id])
      f.push(`dépendance ${d.id} : redéclarée dans package.json → dependencies — elle est vendorée, et une installation par clone ne l'installerait jamais`);
  }
  return f;
}
