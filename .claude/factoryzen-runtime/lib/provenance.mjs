import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './registry.mjs';

/* PROVENANCE DU PLUGIN EN COURS D'EXÉCUTION.
 *
 * DÉFAUT RÉEL, relevé par une revue et constaté sur disque. Un dépôt produit épingle le
 * plugin par SOUS-MODULE, donc à un commit précis. Mais le résolveur du dépôt produit
 * accepte plusieurs emplacements et se rabat sur un dépôt frère quand le sous-module
 * n'est pas clonable — ce qui arrive, le dépôt du plugin pouvant être privé.
 *
 * Constaté : deux exemplaires du même plugin sur la même machine, à DEUX COMMITS
 * DIFFÉRENTS, et aucun contrôle ne disait lequel gouvernait réellement. La garde, la tour
 * et les huit contrôles pouvaient s'exécuter depuis un registre autre que celui que le
 * dépôt déclare gouverner, sans qu'aucun signal ne soit émis.
 *
 * Le repli n'est PAS supprimé : il existe pour survivre à un sous-module non clonable, et
 * le supprimer rendrait la gouvernance indisponible là où elle est déjà la plus fragile.
 * Il devient VISIBLE. Une ambiguïté tue quand elle est silencieuse ; déclarée, elle est
 * un état qu'on lit.
 *
 * Ce contrôle n'ouvre pas la liste des contrôles, close à huit : il alimente K6, au même
 * titre que l'intégrité du vendoring — même famille, celle du déclaré confronté au réel. */

const git = (cwd, ...args) => {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return r.status === 0 ? String(r.stdout).trim() : null;
};

/** Le chemin du sous-module déclaré dans .gitmodules qui pointe vers CE plugin, s'il existe. */
function declaredSubmodule(project, pluginName) {
  const f = join(project, '.gitmodules');
  if (!existsSync(f)) return null;
  const src = readFileSync(f, 'utf8');
  const re = /\[submodule "([^"]+)"\]([\s\S]*?)(?=\n\[submodule |\s*$)/g;
  for (let m; (m = re.exec(src));) {
    const path = (/\bpath\s*=\s*(\S+)/.exec(m[2]) || [])[1] || m[1];
    const url = (/\burl\s*=\s*(\S+)/.exec(m[2]) || [])[1] || '';
    if (new RegExp(pluginName, 'i').test(url)) return { path, url };
  }
  return null;
}

/** Confronte le plugin EXÉCUTÉ à celui que le dépôt produit épingle. */
export function provenanceFindings(project = process.env.CLAUDE_PROJECT_DIR || process.cwd()) {
  const f = [];
  if (!project || !existsSync(project)) return f;

  /* Sans dépôt produit, ou sans épinglage, il n'y a rien à confronter : c'est le cas du
     dépôt du plugin lui-même, où ROOT est le dépôt. Se taire est correct — inventer un
     défaut faute de contexte serait pire que ne rien dire. */
  const sub = declaredSubmodule(project, 'autonomous-product-factory');
  if (!sub) return f;

  const pinned = (git(project, 'ls-tree', 'HEAD', sub.path) || '').split(/\s+/)[2] || null;
  if (!pinned) {
    f.push(`provenance : ${sub.path} est déclaré au .gitmodules mais n'est pas épinglé dans l'index — le dépôt ne dit pas quelle version le gouverne`);
    return f;
  }

  const short = c => String(c).slice(0, 7);

  /* LA COPIE EMBARQUÉE est un emplacement légitime, pas un repli : le launchpad la dépose
     sous .claude/factoryzen-runtime/ pour qu'une session à un seul dépôt — où le
     sous-module privé ne se clone pas — garde la garde. Elle vit DANS le dépôt produit :
     « git rev-parse » y rendrait le commit du produit, jamais celui du plugin. Sa version
     est le fichier PIN que le provisionnement y écrit, confronté à l'épinglage. */
  const embarquee = resolve(project, '.claude', 'factoryzen-runtime');
  if (resolve(ROOT) === embarquee) {
    const pin = existsSync(join(embarquee, 'PIN')) ? readFileSync(join(embarquee, 'PIN'), 'utf8').trim() : '';
    if (!/^[0-9a-f]{40}$/.test(pin))
      f.push(`provenance : la copie embarquée ${'.claude/factoryzen-runtime'} ne déclare aucun commit (PIN « ${pin || 'absent'} ») — sa conformité à l'épinglage est invérifiable`);
    else if (pin !== pinned)
      f.push(`provenance : la copie embarquée est sur ${short(pin)}, le dépôt produit épingle ${short(pinned)} — la gouvernance tourne sur un autre registre que celui déclaré`);
    return f;
  }

  const running = git(ROOT, 'rev-parse', 'HEAD');
  if (!running) {
    f.push(`provenance : le plugin exécuté (${ROOT}) n'est pas un dépôt Git — sa version est invérifiable, donc sa conformité à l'épinglage aussi`);
    return f;
  }

  const expected = resolve(project, sub.path);

  /* DEUX DÉFAUTS DISTINCTS, et la distinction compte pour qui doit corriger.
     Le premier est une divergence de VERSION : le bon emplacement, la mauvaise version.
     Le second est une divergence d'ORIGINE : un autre exemplaire, dont la version peut
     coïncider par hasard — et une coïncidence n'est pas une garantie. */
  if (running !== pinned)
    f.push(`provenance : le plugin exécuté est sur ${short(running)}, le dépôt produit épingle ${short(pinned)} — la gouvernance tourne sur un autre registre que celui déclaré`);

  if (resolve(ROOT) !== expected)
    f.push(`provenance : le plugin exécuté est ${ROOT}, hors du sous-module épinglé ${sub.path} — repli sur un exemplaire dont rien ne garantit qu'il suive l'épinglage`);

  return f;
}
