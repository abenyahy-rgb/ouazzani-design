import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import yaml from './yaml.mjs';
import { cheminDe, dossierDe, registry, byId } from './registry.mjs';

/* LES DEUX ARTEFACTS VIVANTS.
 *
 * Un artefact « vivant » tenu par la discipline n'est pas vivant : il périme plus
 * lentement. Les deux seuls régimes qui tiennent sont la dérivation et la composition.
 *
 *   data/          la sémantique est écrite à la main et figée en G0 ; le modèle est
 *                  DÉRIVÉ du schéma exécuté ; la liaison rattache l'un à l'autre.
 *   design/current/ le prototype courant est la COMPOSITION socle ⊕ deltas de release
 *                  ⊕ deltas de sprint. Aucun écran n'y est écrit.
 *
 * FRONTIÈRE, énoncée plutôt que masquée : l'extraction du schéma exécuté et l'assemblage
 * du HTML sont propres à la pile du projet — le plugin ne peut pas les faire à sa place.
 * Ce que le plugin fait, et qui est le point dur : il impose le CONTRAT (manifeste
 * ordonné, table de liaison résolue), il le recalcule, et K4 refuse ce qui n'y entre pas.
 * Un projet qui ne fournit pas son extracteur n'obtient pas un contrôle indulgent : il
 * obtient un FAIL. */

const rd = (f) => (existsSync(f) ? yaml.load(readFileSync(f, 'utf8')) || {} : null);

/* L'activité qui produit un livrable se LIT au registre : écrite en dur, elle survivait à une
   renumérotation et signait le fichier généré d'une activité qui n'est plus la sienne. */
const activiteDe = wp => String(byId(registry().work_products, wp)?.activity ?? '');

/* La complétude d'un fichier généré est celle que la tour a enregistrée pour son livrable : un
   fichier « complet » dans un livrable déclaré « partiel » — ou jamais déclaré — contredit la
   déclaration, et la forme le refuse. */
function completionDeclaree(root, wp) {
  const st = rd(join(root, 'runs', 'tower.json'));
  const d = [...(st?.declared || [])].reverse().find(x => x.work_product === wp);
  return d ? { completion: d.completion, reserves: d.reserves || [] } : null;
}

/* ── modèle de données : sémantique + schéma introspecté → liaison ─────── */
export function composeModel(root) {
  const dir = join(root, 'product', dossierDe('WP-10'));
  const sem = rd(join(dir, 'semantics.yaml')) || rd(join(dir, 'semantics.md.yaml'));
  const schema = rd(join(dir, 'schema.introspected.yaml'));
  if (!sem)    return { ok: false, reason: `product/${dossierDe("WP-10")}semantics.yaml absent — la couche écrite à la main est le seul prérequis du modèle dérivé` };
  if (!schema) return { ok: false, reason: `product/${dossierDe("WP-10")}schema.introspected.yaml absent — le modèle se dérive du schéma EXÉCUTÉ ; l'extracteur est fourni par le projet, pas par le plugin` };

  const prev = rd(join(dir, 'binding.yaml')) || {};
  const prevField = new Map();
  for (const e of prev.entities || [])
    for (const [f, b] of Object.entries(e.fields || {})) prevField.set(`${e.name}.${f}`, b);
  /* La PROPRIÉTÉ d'une entité — porte-t-elle des données personnelles, et à qui sont-elles —
     se résout à la main comme un terme : conservée d'une dérivation à l'autre, ou reprise du
     schéma s'il la déclare. */
  const prevEntity = new Map((prev.entities || []).map(e => [e.name, e]));

  const entities = [], unresolved = [];
  for (const e of schema.entities || []) {
    const fields = {};
    for (const f of e.fields || []) {
      const key = `${e.name}.${f.name}`;
      const kept = prevField.get(key);
      fields[f.name] = kept || { term: null, truth: null, classification: null, appeared_in: schema.sprint || null };
      if (!fields[f.name].term || !fields[f.name].truth || !fields[f.name].classification) unresolved.push(key);
    }
    const avant = prevEntity.get(e.name) || {};
    const propriete = {};
    for (const k of ['personal_data', 'owner']) {
      const v = avant[k] ?? e[k];
      if (v !== undefined) propriete[k] = v;
    }
    entities.push({ name: e.name, ...propriete, fields });
  }

  const out = {
    generated: true,
    note: "Régénéré par « apf model ». La STRUCTURE (entités, champs) vient du schéma exécuté et est écrasée à chaque dérivation ; terme, catégorie de vérité et classement sont RÉSOLUS À LA MAIN dans ce fichier et conservés d'une dérivation à l'autre — un champ nouveau arrive non résolu et K4 le refuse jusqu'à ce qu'on le lie.",
    derived_from: schema.source || 'schema.introspected.yaml',
    derived_at: new Date().toISOString(),
    glossary: sem.glossary || [],
    truth_categories: sem.truth_categories || [],
    entities,
    migrations: schema.migrations || []
  };
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'binding.yaml'), yaml.dump(out, { lineWidth: 100, noRefs: true }));

  /* LE FICHIER GÉNÉRÉ EST UN LIVRABLE : il porte le front-matter que le registre exige de
     tout fichier de WP-10 et le H2 « Modèle dérivé » que son gabarit attend — sinon la forme
     du livrable est refusée par ce que le plugin lui-même a écrit. Les entités sont des H3 :
     un H2 par entité serait « hors plan ». */
  /* La complétude du fichier généré est celle du LIVRABLE, lue dans semantics.md : un fichier
     « complet » dans un livrable déclaré « partiel » contredirait la déclaration. */
  const semMd = join(dir, 'semantics.md');
  const semFm = existsSync(semMd) ? /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(semMd, 'utf8')) : null;
  const completion = (semFm && /^completion:\s*(\S+)/m.exec(semFm[1])?.[1]) || 'complet';
  /* Un livrable partiel porte ses réserves : le fichier généré recopie celles de semantics.md,
     sinon la forme le refuse (« partiel sans reserves »). */
  const reservesLine = semFm ? /^reserves:.*$/m.exec(semFm[1])?.[0] : null;
  const md = ['---', 'id: WP-10', `produced_by: "${activiteDe('WP-10')}"`, 'controlled_at: G0', `completion: ${completion}`,
              ...(completion === 'partiel' && reservesLine ? [reservesLine] : []), 'work_product: WP-10',
              'generated: true', `derived_from: ${out.derived_from}`, `derived_at: ${out.derived_at}`, '---', '',
              `# Modèle de données dérivé`, '', `Dérivé de \`${out.derived_from}\` le ${out.derived_at.slice(0, 10)}. **Ne pas éditer.**`, '',
              '## Modèle dérivé', '', `${entities.length} entité(s), ${entities.reduce((n, e) => n + Object.keys(e.fields).length, 0)} champ(s), ${unresolved.length} non résolu(s).`, '']
    .concat(entities.flatMap(e => [`### ${e.name}`, '', '| Champ | Terme du glossaire | Catégorie de vérité | Classement |', '|---|---|---|---|']
      .concat(Object.entries(e.fields).map(([f, b]) =>
        `| \`${f}\` | ${b.term || '**non résolu**'} | ${b.truth || '**non résolu**'} | ${b.classification || '**non classé**'} |`)).concat([''])));
  writeFileSync(join(dir, 'model.generated.md'), md.join('\n'));

  return { ok: !unresolved.length, entities: entities.length,
           fields: entities.reduce((n, e) => n + Object.keys(e.fields).length, 0),
           unresolved,
           reason: unresolved.length ? `${unresolved.length} élément(s) non résolus — un champ sans terme de glossaire est une dérive sémantique, K4 le refuse` : null };
}

/* ── prototype vivant : socle ⊕ deltas, dans l'ordre ───────────────────── */
export function composePrototype(root) {
  const pdir = join(root, 'product');
  const spine = rd(join(pdir, cheminDe('WP-11', 'spine.yaml')));
  if (!spine) return { ok: false, reason: `product/${cheminDe('WP-11', 'spine.yaml')} absent — la composition part toujours du socle` };

  const declared = rd(join(pdir, cheminDe('WP-11', 'deltas.yaml'))) || { deltas: [] };
  const deltas = (declared.deltas || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const screens = new Map();
  for (const s of spine.stages || []) screens.set(s.screen || s.id, { id: s.screen || s.id, stage: s.id, from: 'socle', delta: null });
  const unsub = [];
  for (const d of deltas)
    for (const sc of d.screens || []) {
      const known = screens.get(sc.id);
      if (!known && !sc.stage) { unsub.push(`${sc.id} (delta ${d.id})`); continue; }
      screens.set(sc.id, { id: sc.id, stage: sc.stage || known?.stage || null, from: d.id, delta: d.id });
    }

  const manifest = {
    generated: true,
    note: "Composé par « apf compose ». Aucun écran ne s'écrit ici : le socle et les deltas sont les sources, ceci est leur résultat.",
    spine_commit: spine.commit || null,
    release_baseline: declared.release_baseline || null,
    composed_at: new Date().toISOString(),
    deltas: deltas.map((d, i) => ({ id: d.id, kind: d.kind || null, order: d.order ?? i })),
    screens: [...screens.values()]
  };
  const missing = (spine.stages || []).filter(s => ![...screens.values()].some(x => x.stage === s.id)).map(s => s.id);
  const dir = join(pdir, dirname(cheminDe('WP-11', 'manifest.yaml')));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'manifest.yaml'), yaml.dump(manifest, { lineWidth: 100, noRefs: true }));
  /* Le fichier généré est un fichier de WP-11 — le prototype vivant a rejoint le socle
     exécutable, WP-39 est retiré : il porte le front-matter et le H2 que son gabarit exige, et
     la complétude que la tour a enregistrée pour WP-11 ; un écart le rend partiel quoi qu'il en
     soit. */
  const ecart = unsub.length || missing.length;
  const dec = completionDeclaree(root, 'WP-11');
  const completion = ecart ? 'partiel' : dec?.completion || 'partiel';
  const reserves = completion !== 'partiel' ? []
    : ecart ? [`${unsub.length} écart(s) non subordonné(s), ${missing.length} étape(s) inatteignable(s) — voir ci-dessous`]
    : dec?.reserves?.length ? dec.reserves : ['WP-11 non déclaré complet à la tour'];
  writeFileSync(join(dir, 'unsubordinated.md'),
    `---\nid: WP-11\nproduced_by: "${activiteDe('WP-11')}"\ncontrolled_at: G0\ncompletion: ${completion}\n` +
    (reserves.length ? `reserves: ${JSON.stringify(reserves)}\n` : '') +
    `work_product: WP-11\ngenerated: true\ncomposed_at: ${manifest.composed_at}\n---\n\n# Prototype vivant — composition\n\n## Écarts non subordonnés\n\nComposé le ${manifest.composed_at.slice(0, 10)}.\n\n` +
    (unsub.length ? unsub.map(x => `- ${x} — ne trace ni vers une étape du socle ni vers un delta déclaré`).join('\n') + '\n'
                  : 'Aucun. Chaque écran trace vers une étape du socle ou vers un delta déclaré.\n'));

  return { ok: !unsub.length && !missing.length, screens: screens.size, deltas: deltas.length,
           unsubordinated: unsub, unreachable_stages: missing,
           note: "L'assemblage du HTML reste à la charge du projet : il applique les deltas dans l'ordre que ce manifeste fixe. Le plugin garantit l'ordre, la subordination et la couverture du squelette — pas le rendu." };
}
