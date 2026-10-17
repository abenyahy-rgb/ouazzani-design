import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import yaml from './yaml.mjs';
import { join, dirname } from 'node:path';
import { registry, cheminDe } from './registry.mjs';

/* Bootstrap idempotent (activité 1).
 * Rejoué sur une arborescence existante, il ne modifie et n'écrase AUCUN artefact.
 * Il crée les dossiers manquants et les README d'orientation. Jamais de contenu produit. */

/* L'IDENTITÉ DU PRODUIT est un input de l'activité 1, pas un argument d'opérateur.
   Un produit dont le nom ne vient pas de son activité d'ouverture n'a pas été ouvert par
   la méthode : il a été fabriqué à côté d'elle. Absent, on rend BLOCKED — comme pour
   n'importe quel input requis (P5, EX2). */
export function identity(root) {
  const f = join(root, 'product', cheminDe('SOC-01', 'project.yaml'));
  if (!existsSync(f)) return null;
  /* Un project.yaml illisible n'est pas une identité : on rend null, et c'est le contrôle de
     forme qui nomme le défaut — jamais un plantage au milieu d'un autre contrôle. */
  try { return yaml.load(readFileSync(f, 'utf8')) || null; } catch { return null; }
}

export function bootstrap(root, { dryRun = false, product = null, rootLocation = null } = {}) {
  const r = registry();
  const created = [], kept = [];
  const known = identity(root);
  const name = product || known?.name || null;
  if (!name) return { blocked: true,
    reason: r.notion_workspace.product_identity.on_absence,
    what: r.notion_workspace.product_identity.what,
    collected_by: r.notion_workspace.product_identity.collected_by,
    created: [], kept: [] };

  const dirs = new Set(['learning']);
  if (!existsSync(join(root,'runs')) && !dryRun) mkdirSync(join(root,'runs'),{recursive:true});
  /* Les chemins paramétrés — {release-id}, {slice-id}, {version} — ne se matérialisent
     PAS au bootstrap : un dossier de release se crée quand la release existe. Créer un
     squelette vide reviendrait à préempter des décisions que G0 n'a pas encore prises. */
  const templated = p => /\{[^}]+\}/.test(p);
  for (const w of r.work_products) {
    if (w.base && !templated(w.base)) dirs.add(w.base);
    for (const file of w.files || []) {
      const full = (w.base || '') + file;
      if (templated(full)) continue;
      const d = full.endsWith('/') ? full : dirname(full);
      if (d && d !== '.') dirs.add(d);
    }
  }

  dirs.add('..' ); dirs.delete('..');
  for (const d of [...dirs].sort()) {
    const abs = join(root, 'product', d);
    if (existsSync(abs)) { kept.push('product/' + d); continue; }
    created.push('product/' + d);
    if (!dryRun) mkdirSync(abs, { recursive: true });
  }

  const readme = join(root, 'product/README.md');
  if (!existsSync(readme)) {
    created.push('product/README.md');
    if (!dryRun) writeFileSync(readme,
`# Artefacts produit

Arborescence gouvernée par la méthode ${r.method.name} v${r.method.version}.

Les chemins sont déclarés dans le registre canonique de la méthode, jamais ici.
\`apf list wp\` liste les livrables, \`apf show wp <id>\` donne le plan de contenu
et le critère de complétude de chacun.

Tout artefact tracé porte un front-matter YAML — \`id\`, \`type\` et ses liens.
C'est ce qui rend un livrable lisible par un humain et vérifiable par une machine
sans dupliquer l'information dans un index parallèle.
`);
  }
  /* L'identité est écrite APRÈS l'arborescence : governance/ doit exister d'abord.
     Elle n'est jamais réécrite — un produit ne change pas de nom par un rejeu. */
  const idf = join(root, 'product', cheminDe('SOC-01', 'project.yaml'));
  if (!existsSync(idf)) {
    created.push('product/' + cheminDe('SOC-01', 'project.yaml'));
    if (!dryRun) writeFileSync(idf, yaml.dump({
      name,
      opened_at: new Date().toISOString().slice(0, 10),
      method: `${r.method.name} v${r.method.version}`,
      workspace_root_location: rootLocation || null,
      note: "Recueilli à l'activité 1 auprès d'un humain. Un rejeu ne le réécrit pas."
    }, { lineWidth: 100 }));
  } else if (rootLocation && !known?.workspace_root_location) {
    /* COMPLÉTER N'EST PAS RÉÉCRIRE. Un input requis peut arriver APRÈS le premier
       passage — c'est même le cas normal : l'activité 1 rend BLOCKED tant qu'il manque,
       l'humain le fournit, on rejoue. Sans cette branche, un champ légitimement absent
       au premier bootstrap ne pouvait plus JAMAIS être renseigné, et le bootstrap ne
       tenait pas sa propre promesse : « rejoué, il complète et n'écrase rien ».
       La protection reste entière sur ce qui est déjà écrit — un emplacement fourni ne
       se remplace pas, et le nom du produit n'est jamais touché. */
    created.push('product/' + cheminDe('SOC-01', 'project.yaml') + ' → workspace_root_location');
    if (!dryRun) writeFileSync(idf, yaml.dump({ ...known, workspace_root_location: rootLocation }, { lineWidth: 100 }));
  }
  return { created, kept, product: name, root_location: rootLocation || known?.workspace_root_location || null };
}
