import { spawnSync } from 'node:child_process';
import { loadProject } from './project.mjs';
import { identity } from './bootstrap.mjs';
import { registry } from './registry.mjs';
import { readMap } from './notion.mjs';

/* DÉRIVE DE L'ESPACE DE TRAVAIL — ce qui a été produit dans Git et n'a pas suivi dans la
 * projection.
 *
 * LE PROBLÈME. Un livrable est produit, déclaré à la tour, puis modifié trois fois. Sa
 * page dans l'espace de travail reste au premier état, et rien ne le dit. Le comité lit
 * une version périmée en croyant lire le livrable — c'est pire qu'une page absente, qui
 * au moins ne ment pas.
 *
 * LA CONTRAINTE, ET ELLE N'EST PAS NÉGOCIABLE. La tour ne fait AUCUN appel réseau : un
 * service tiers sur le chemin critique de la gouvernance est exactement ce que le registre
 * interdit. Elle ne peut donc pas DEMANDER à Notion s'il est à jour.
 *
 * LA RÉPONSE. Ce qui a été projeté se consigne dans Git, au même titre que la carte des
 * identifiants : « sync:WP-nn » porte le commit au moment de la projection. La dérive se
 * calcule alors hors ligne, en comparant ce commit au dernier commit qui a touché le
 * fichier. Git répond, pas le tiers.
 *
 * LA PORTÉE. Une dérive peut arrêter une ACTIVITÉ — c'est une sortie d'activité qui n'est
 * pas tenue. Elle n'arrête JAMAIS une gate : le registre le déclare, et y adosser un gate
 * mettrait un tiers sur le chemin d'une décision humaine. La distinction est portée par
 * l'appelant, et un test l'exige dans les deux sens. */

const git = (cwd, ...args) => {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return r.status === 0 ? String(r.stdout).trim() : null;
};

/** Ce qui a été produit et n'a pas suivi dans l'espace de travail. Aucun appel réseau. */
export function workspaceDrift(root = process.cwd()) {
  const proj = loadProject(root);
  if (!proj) return { ok: true, drift: [], note: "aucune arborescence product/ — rien à projeter" };

  /* PROJECTION TIRÉE. Quand l'espace de travail lit Git lui-même — le launchpad — il n'y a
     ni page à relier ni projection à dater : la page EST le commit. Rendre une dérive ici
     arrêtait l'activité 1 dès le bootstrap, sur un espace qui ne pouvait pas encore porter
     de page. On rend ok et on le DIT : un contrôle qui se tait est indistinguable d'un
     contrôle qui ne marche pas. La fraîcheur s'affiche sur la plateforme, avec le commit. */
  const kind = identity(root)?.workspace_kind || null;
  const pull = registry().notion_workspace?.pull_projection;
  if (pull && kind === pull.id)
    return { ok: true, drift: [], kind, checked: 0,
             method: 'projection tirée — la plateforme lit Git à chaque commit, rien à comparer ici',
             note: pull.drift };

  const map = readMap(root);
  const byWp = new Map();
  for (const e of (proj.entities || []).filter(x => x.work_product)) {
    const cur = byWp.get(e.work_product) || { work_product: e.work_product, files: [], url: null };
    cur.files.push(e.file);
    if (e.notion && !cur.url) cur.url = e.notion;
    byWp.set(e.work_product, cur);
  }

  const drift = [];
  const ledgerExclusions = [];
  for (const wp of byWp.values()) {
    if (!wp.url) wp.url = map[`link:${wp.work_product}`] || null;

    if (!wp.url) {
      drift.push({ work_product: wp.work_product, files: wp.files, state: 'jamais projeté',
        why: "produit dans Git, aucune page dans l'espace de travail — le comité ne peut pas le lire" });
      continue;
    }

    const projected = map[`sync:${wp.work_product}`] || null;
    if (!projected) {
      drift.push({ work_product: wp.work_product, files: wp.files, state: 'projection non datée',
        why: "relié, mais rien ne dit à quel commit la page a été écrite — sa fraîcheur est invérifiable" });
      continue;
    }

    /* UN REGISTRE NE PEUT PAS ATTESTER DE SA PROPRE FRAÎCHEUR, et le mécanisme l'a
       découvert sur lui-même. « apf notion sync » écrit la date de projection dans la
       carte des identifiants — or cette carte est elle-même un FICHIER de SOC-01. Dater la
       projection de SOC-01 modifiait donc SOC-01, qui devenait périmé par l'acte même qui
       le déclarait à jour. SOC-01 ne pouvait JAMAIS être propre : boucle, pas dérive.
       La carte est le journal de synchronisation, pas le contenu que le comité lit. Elle
       est donc exclue de la comparaison — exclusion NOMMÉE et rendue dans le rapport,
       jamais silencieuse : une exception tue est indistinguable d'un contrôle qui ne
       marche pas. */
    const isLedger = f => /\/workspace-map\.ya?ml$/.test(f);
    const compared = wp.files.filter(f => !isLedger(f));
    const excluded = wp.files.filter(isLedger);
    if (excluded.length) ledgerExclusions.push(...excluded);

    for (const f of compared) {
      /* CAS QUE LA COMPARAISON DE COMMITS LAISSERAIT PASSER EN SILENCE : le fichier est
         modifié sur disque et non commité. Son dernier commit est alors ANTÉRIEUR à la
         projection, donc « à jour » — alors que ce que le producteur a sous les yeux n'est
         ni dans la page ni dans l'historique. Le nommer plutôt que le taire. */
      if (git(root, 'status', '--porcelain', '--', f)) {
        drift.push({ work_product: wp.work_product, files: [f], state: 'modifié non commité',
          why: `${f} porte des modifications non commitées — la comparaison de commits ne peut rien affirmer de sa projection` });
        break;
      }
      const last = git(root, 'log', '-1', '--format=%H', '--', f);
      if (!last) continue;
      const behind = git(root, 'rev-list', '--count', `${projected}..${last}`);
      if (behind && Number(behind) > 0) {
        drift.push({ work_product: wp.work_product, files: [f], state: 'périmée',
          projected_at: projected.slice(0, 7), current: last.slice(0, 7), behind: Number(behind),
          why: `la page a été écrite au commit ${projected.slice(0, 7)} ; ${f} a changé depuis — le comité lirait une version dépassée` });
        break;
      }
    }
  }

  return {
    ok: drift.length === 0,
    drift,
    checked: byWp.size,
    method: 'hors ligne — comparaison Git, aucun appel au service tiers',
    ...(ledgerExclusions.length ? { non_compares: {
      files: [...new Set(ledgerExclusions)],
      why: "Journal de synchronisation : « apf notion sync » y écrit la date de projection. Le comparer reviendrait à lui demander d'attester de sa propre fraîcheur — il serait périmé par l'acte même qui le met à jour." } } : {}),
    scope: "Une dérive peut arrêter une ACTIVITÉ. Elle n'arrête JAMAIS une gate : y adosser une décision humaine mettrait un tiers sur le chemin critique de la gouvernance."
  };
}
