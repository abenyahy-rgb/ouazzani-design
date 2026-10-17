import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import yaml from './yaml.mjs';
import { registry, byId, cheminDe } from './registry.mjs';
import { loadProject, readFrontMatter } from './project.mjs';
import { identity } from './bootstrap.mjs';
import { traduireJournal } from './numerotation.mjs';

/* ESPACE DE TRAVAIL LISIBLE — plan et liens.
 *
 * Partage des rôles, et il est délibéré :
 *   le NOYAU calcule le PLAN — déterministe, hors ligne, rejouable, donc vérifiable ;
 *   l'ADAPTATEUR l'exécute — lui seul détient l'accès au connecteur.
 * Aucun jeton et aucun appel réseau ici : un plugin qui embarquerait un secret et
 * appellerait un service tiers depuis l'intégration continue mettrait ce service sur le
 * chemin critique de la gouvernance.
 *
 * L'espace de travail est une PROJECTION. Il ne bloque jamais un gate : « apf notion
 * status » rapporte, il ne refuse pas. Les huit contrôles restent sur Git. */

const templated = p => /\{[^}]+\}/.test(p || '');

/* PROJECTION TIRÉE. Quand SOC-01 déclare « workspace_kind: launchpad », l'espace de travail
   LIT Git lui-même à chaque push : il n'y a ni plan à exécuter, ni page à relier, ni
   projection à dater. Toute opération de projection poussée rend alors « sans objet » —
   avec l'adresse de la page, et en le disant : une commande qui se tait est
   indistinguable d'une commande qui ne marche pas. */
export function workspaceKind(root = process.cwd()) {
  return identity(root)?.workspace_kind || null;
}

export function pullProjection(root = process.cwd(), op = 'projection') {
  const pull = registry().notion_workspace?.pull_projection;
  const kind = workspaceKind(root);
  if (!pull || kind !== pull.id) return null;
  const id = identity(root);
  return { ok: true, kind, pull: true, op,
           url: id?.workspace_root_location || null,
           note: `sans objet : l'espace de travail est ${pull.id} — projection TIRÉE. ${pull.contract}`,
           what_to_do: "Rien. Committer et pousser sur la branche par défaut : le workflow du dépôt dépose l'état, la page est le commit." };
}

/* Un livrable est par-instance si son BASE **ou l'un de ses fichiers** est paramétré :
   WP-25 vit sous gates/ — base fixe — mais s'appelle g1-{release-id}.md. Ne regarder
   que la base l'aurait instancié au bootstrap avec un chemin non résolu. Même règle que
   lib/bootstrap.mjs, qui teste le chemin complet. */
const perInstance = w => templated(w.base) || (w.files || []).some(templated);

/** Plan complet de l'espace, calculé depuis le registre. Aucun effet de bord.
 *
 * Le nom du produit se LIT dans l'identité recueillie à l'activité 1. Le passer en
 * argument reviendrait à laisser un opérateur nommer un produit depuis une ligne de
 * commande, hors de toute activité — donc hors de toute gouvernance. */
export function workspacePlan(root = process.cwd()) {
  const r = registry();
  const id = identity(root);
  const product = id?.name;
  if (!product) return { blocked: true,
    reason: r.notion_workspace.product_identity.on_absence,
    collected_by: r.notion_workspace.product_identity.collected_by };
  return build(product);
}

function build(product) {
  const r = registry();
  const N = r.notion_workspace;

  /* LA RACINE EST UNE LIGNE, PAS UNE PAGE. Un produit gouverné qui n'apparaît pas là
     où l'organisation regarde ses projets est gouverné à côté d'elle. La méthode écrit
     deux propriétés et pas une de plus — titre et statut : toute autre colonne de la
     base d'accueil appartient à l'organisation. */
  const projectRow = {
    op: 'project_row', key: 'root', parent: null,
    database: 'base de projets fournie à l\'activité 1',
    title: product,
    properties: { titre: product, statut: N.project_row?.status_mapping?.[0]?.value || null },
    writes_only: ['titre', 'statut'],
    note: N.project_row?.rationale
  };

  const databases = N.databases.map(d => ({
    op: 'database', key: `db:${d.id}`, parent: 'root', id: d.id, role: d.role, writes: d.writes,
    properties: d.properties || null, views: d.views || null,
    status_values: d.status_values || null,
    frozen_at: d.frozen_at || null,
    note: d.role === 'natif' ? "Écrit ici, figé dans Git au gate." : "Projeté depuis Git. Lecture seule."
  }));

  /* LES ÉTAPES SONT DES LIGNES. En pages elles ne portaient rien ; en lignes elles
     portent un statut, se filtrent et se groupent. C'est ce qui rend l'avancement
     visible sans ouvrir treize pages. */
  const stepRows = r.steps.map((st, i) => {
    const wps = r.work_products.filter(w => w.step === st.id);
    const cad = byId(r.cadences, st.cadence);
    return {
      op: 'row', database: 'etapes', key: `step:${st.id}`,
      properties: {
        identifiant: st.id, libelle: st.name, cadence: st.cadence, ordre: i + 1,
        activites: [...new Set(r.activities.filter(a => a.step === st.id).map(a => a.id))].join(' · '),
        /* Une etape C3 sort par K1 ET G3. Emettre « K1 · G3 » dans une
           selection simple faisait refuser l'ecriture par le connecteur : c'est une
           liste, et le registre la declare desormais comme telle. */
        gate_de_sortie: [...(cad?.gates || [])],
        statut: (N.databases.find(d => d.id === 'etapes')?.status_values || [])[0] || 'Non commencée',
        avancement: `0 / ${wps.length} livrable(s)`
      },
      deliverables: wps.map(w => w.id),
      per_instance: wps.filter(perInstance).length
    };
  });

  /* Un chemin paramétré ne se matérialise pas à vide : des lignes fantômes
     préempteraient des décisions que G0 n'a pas prises. Même règle qu'au bootstrap Git. */
  const rows = r.work_products.filter(w => !perInstance(w)).map(w => ({
    op: 'row', database: 'livrables', key: w.id,
    properties: {
      identifiant: w.id, nom: w.name, cadence: w.cadence, etape: w.step, activite: String(w.activity),
      categorie: r.categories[w.category].name, controle_en: w.controlled_at,
      cycle_de_vie: w.lifecycle, responsible_accountable: w.responsible_accountable,
      statut: (N.databases.find(d => d.id === 'livrables')?.status_values || [])[0] || 'À produire',
      critere_de_completude: w.completion,
      chemin_git: `product/${(w.base || '')}${(w.files || [])[0] || ''}`,
      commit: ''
    },
    relations: { etape: `step:${w.step}` },
    template: pageTemplate(w)
  }));

  /* LES VUES SONT LE SEUL CHEMIN D'ACCÈS. Sans arborescence, on ne descend plus des
     dossiers : on filtre. Une base déclarée sans vue serait une base qu'on ne parcourt
     pas. */
  const views = databases.flatMap(d => (d.views || []).map(v => ({
    op: 'view', key: `view:${d.id}:${v}`, database: d.id, name: v, parent: `db:${d.id}`
  })));

  const deferred = r.work_products.filter(perInstance).map(w => {
    const full = (w.base || '') + (w.files || []).join(' ');
    return { id: w.id, base: w.base, files: w.files,
             created_when: /slice-id/.test(full) ? 'la slice existe'
               : /release-id/.test(full) ? 'la release existe' : 'la version existe' };
  });

  /* PHASES. L'ordre est déclaré au registre et calculé ici : un enfant créé avant son
     parent est un plan qui ne se rejoue pas. */
  const byPhase = { 1: [projectRow], 2: databases, 3: stepRows, 4: rows, 5: views };
  const phases = (N.execution_order?.phases || []).map(ph => ({
    id: ph.id, name: ph.name, note: ph.note || null,
    operations: (byPhase[ph.id] || []).map(o => ({
      op: o.op, key: o.key,
      /* La ligne de projet n'a pas de parent DANS le plan : sa base d'accueil préexiste
         et est fournie à l'exécution. Lui en inventer un ferait échouer l'ordre de
         création sur un parent que le plan ne crée jamais. */
      parent_key: o.op === 'project_row' ? null : (o.parent || (o.database ? `db:${o.database}` : null)),
      title: o.title || o.name || o.properties?.identifiant || o.id || o.key,
      remember: `carte : ${o.key} → identifiant rendu par le connecteur`
    }))
  }));

  const nodes = [projectRow, ...stepRows];

  return {
    generated_from: 'core/method.yaml',
    contract: N.contract, shape: N.shape, never_blocks: N.never_blocks,
    may_block_an_activity: N.may_block_an_activity,
    execution: N.execution, connector: N.connector, root_location: N.root_location,
    project_row: N.project_row,
    page_body: N.page_body, idempotence: N.execution_order?.rule,
    navigation: N.navigation,
    phases, nodes, databases, step_rows: stepRows, rows, views, deferred,
    summary: {
      /* Zéro par construction : tout est ligne ou vue. Le nombre qui ne bouge jamais
         n'est plus un nombre de pages, c'est un nombre de BASES. */
      noeuds_navigation: 0,
      bases: databases.length,
      lignes_etapes: stepRows.length,
      lignes_instanciees: rows.length,
      lignes_differees: deferred.length,
      vues: views.length
    }
  };
}

/** Forme du plan, indépendante de tout produit — ce que K6 vérifie. */
export function planShape() { return build('{produit}'); }

/** Le gabarit d'une page de livrable EST son plan de contenu au registre. */
export function pageTemplate(w) {
  return {
    title: `${w.id} · ${w.name}`,
    header: { categorie: registry().categories[w.category].name, controle_en: w.controlled_at,
              cycle_de_vie: w.lifecycle, responsible_accountable: w.responsible_accountable,
              completude: w.completion },
    sections: (w.sections || []).map(s => ({ heading: s.title, caption: s.rule || null })),
    example: w.specimen || null
  };
}

/* ── pointeur bidirectionnel ─────────────────────────────────────────────── */

const FM = /^---\r?\n([\s\S]*?)\r?\n---/;

/** Enregistre l'adresse de la page dans le front-matter du livrable. */
export function link(root, { work_product, url }) {
  const w = byId(registry().work_products, work_product);
  if (!w) return { ok: false, reason: `livrable inconnu — ${work_product}` };
  if (!/^https?:\/\//.test(url || '')) return { ok: false, reason: `adresse invalide — ${url}` };
  const proj = loadProject(root);
  const e = (proj?.entities || []).find(x => x.work_product === work_product);
  if (!e) return { ok: false, reason: `${work_product} n'existe pas encore sur disque — produire avant de relier` };

  const file = join(root, e.file);
  const src = readFileSync(file, 'utf8');
  const m = FM.exec(src);

  /* UN LIVRABLE EN YAML NE PEUT PAS PORTER LE POINTEUR DANS SON FRONT-MATTER : la clôture
     « --- » ouvrirait un second document et le fichier cesserait d'être du YAML valide.
     Le pointeur a donc son autre domicile déclaré — la carte des identifiants de SOC-01 —
     plutôt qu'un refus ou un fichier corrompu. La promesse bidirectionnelle tient : la
     page porte le chemin Git, la carte porte l'adresse de la page. */
  if (!m) {
    if (!/\.(md|markdown)$/i.test(e.file))
      return { ...writeMap(root, `link:${work_product}`, url), work_product, file: e.file, url,
               recorded_in: 'product/' + cheminDe('SOC-01', 'workspace-map.yaml'),
               why: "Fichier non Markdown : le pointeur ne peut pas vivre dans un front-matter sans casser le format. Il vit dans la carte des identifiants.",
               reciprocal: `La page doit porter en retour le chemin « ${e.file} » et le commit : un livrable lisible d'un seul côté n'est relié à rien.` };
    return { ok: false, reason: `${e.file} n'a pas de front-matter — un livrable Markdown doit en porter un (registre → notion_workspace.front_matter)` };
  }

  const fm = yaml.load(m[1]) || {};
  fm.notion = url;
  writeFileSync(file, src.replace(FM, '---\n' + yaml.dump(fm, { lineWidth: 120 }).trimEnd() + '\n---'));
  return { ok: true, work_product, file: e.file, url,
           reciprocal: `La page doit porter en retour le chemin « ${e.file} » et le commit : un livrable lisible d'un seul côté n'est relié à rien.` };
}

/* DATER LA PROJECTION, SANS QUOI SA FRAÎCHEUR EST INVÉRIFIABLE. Relier dit qu'une page
   existe ; rien ne disait à QUEL état du dépôt elle avait été écrite. Le livrable pouvait
   ensuite changer trois fois sans que rien ne le signale — le comité lisait une version
   dépassée en croyant lire le livrable.
   Le commit projeté est HEAD au moment de la projection, jamais une horodate : une date
   ne se compare à rien, un commit se compare à l'historique du fichier. La dérive se
   calcule alors HORS LIGNE — la tour ne demande rien au tiers. */
export function sync(root, { work_product }) {
  const w = byId(registry().work_products, work_product);
  if (!w) return { ok: false, reason: `livrable inconnu — ${work_product}` };
  const proj = loadProject(root);
  const e = (proj?.entities || []).find(x => x.work_product === work_product);
  if (!e) return { ok: false, reason: `${work_product} n'existe pas encore sur disque — produire avant de projeter` };

  const map = readMap(root);
  const url = e.notion || map[`link:${work_product}`] || null;
  if (!url) return { ok: false, reason: `${work_product} n'est relié à aucune page — « apf notion link » d'abord`,
                     why: "Dater une projection qui n'existe pas donnerait une fraîcheur à une page absente." };

  const head = gitAt(root, 'rev-parse', 'HEAD');
  if (!head) return { ok: false, reason: "aucun historique Git — la fraîcheur d'une projection n'est vérifiable que contre un historique" };

  return { ...writeMap(root, `sync:${work_product}`, head), work_product, url,
           projected_at: head.slice(0, 7),
           recorded_in: 'product/' + cheminDe('SOC-01', 'workspace-map.yaml'),
           why: "Ce commit est le point de comparaison de « apf notion drift ». Sans lui, la page est reliée mais sa fraîcheur est invérifiable.",
           caveat: "À déclarer APRÈS avoir écrit la page, et depuis un arbre propre : dater une projection avant de l'écrire la déclare fraîche à tort." };
}

const gitAt = (cwd, ...args) => {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return r.status === 0 ? String(r.stdout).trim() : null;
};

/* LE CORPS DE LA LIGNE DE PROJET — où se lit l'avancement réel.
 *
 * LE PROBLÈME. Le statut de la ligne ne bouge qu'aux gates : trois valeurs pour vingt-six
 * activités. Entre le bootstrap et G0, la ligne reste INERTE pendant les cinq étapes de la
 * cadence 1. Qui lit la base de projets de l'organisation voit « en préparation » et ne
 * sait pas si rien n'a commencé ou si tout est presque fini.
 *
 * OÙ, ET POURQUOI PAS AILLEURS. Dans le CORPS de la page, jamais dans une propriété. La
 * méthode n'écrit que DEUX colonnes d'une base qu'elle ne possède pas — titre et statut ;
 * en ajouter une troisième ferait d'elle une seconde autorité sur un schéma qui n'est pas
 * le sien. Le corps de la page, lui, est celui de la page : la méthode y pose déjà ses
 * bases. On donne donc la lisibilité demandée sans toucher à ce qui appartient à
 * l'organisation.
 *
 * CALCULÉ, JAMAIS SAISI. La source est le journal de la tour, comme l'avancement des
 * étapes. Un corps rédigé à la main serait un tableau de suivi, pas un état. */
export function projectRowBody(root = process.cwd()) {
  const r = registry();
  const id = identity(root);
  if (!id?.name) return { ok: false, reason: r.notion_workspace.product_identity.on_absence };

  const steps = stepProgress(root);
  const ledger = join(root, 'runs', 'ledger.ndjson');
  const cleared = new Set();
  let last = null;
  if (existsSync(ledger))
    for (const line of readFileSync(ledger, 'utf8').split('\n').filter(Boolean)) {
      let e; try { e = JSON.parse(line); } catch { continue; }
      if (e.event === 'GATE_CLEARED' && e.gate) cleared.add(e.gate);
      if (e.event === 'ACTIVITY_OPEN') last = e;
    }

  const values = (r.notion_workspace.databases.find(d => d.id === 'etapes')?.status_values) || [];
  const [NEUF, , FINI] = values;

  /* L'ÉTAPE COURANTE EST LA DERNIÈRE OUVERTE, pas la première inachevée. Déduire l'étape
     d'un compte de livrables donnerait une réponse là où le journal en porte une vraie —
     et une réponse déduite se met à mentir dès qu'une étape est reprise. */
  const current = last?.step || null;
  const head = gitAt(root, 'rev-parse', 'HEAD');

  const rows = steps.map(s => {
    const mark = s.properties.statut === FINI ? '✓' : s.properties.statut === NEUF ? '·' : '→';
    const here = s.step === current ? ' **← ici**' : '';
    /* « 0 / 0 livrable(s) » est vrai et illisible : une étape dont TOUS les livrables sont
       par-instance n'a rien à produire tant que sa release ou sa slice n'existe pas. Le
       dire ainsi, plutôt que laisser un zéro sur zéro que le lecteur prendra pour un
       retard. */
    const avancement = /^0 \/ 0 /.test(s.properties.avancement) && s.deferred
      ? `${s.deferred} livrable(s) différé(s) — leur instance n'existe pas encore`
      : s.properties.avancement;
    return `| ${mark} | \`${s.step}\` | ${s.properties.statut} | ${avancement}${here} |`;
  });

  const gatesOuvertes = r.gates.filter(g => !cleared.has(g.id));

  /* LES RÉSERVES REMONTENT JUSQU'ICI. Une réserve visible seulement dans le fichier du
     livrable est une réserve que le comité ne lit jamais — et c'est précisément quand une
     étape a l'air finie qu'il faut voir ce qui ne l'est pas. */
  const held = steps.flatMap(s => Object.entries(s.reserves || {})
    .map(([wp, rs]) => `| \`${wp}\` | ${s.step} | ${rs.join(' · ') || '—'} |`));

  const body = [
    '> [!INFO]',
    "> Bloc **GÉNÉRÉ** depuis le journal de la tour de contrôle. Rafraîchi à la fermeture de chaque activité et à chaque gate franchie. Toute édition sera écrasée.",
    '',
    `**Étape courante :** ${current ? '`' + current + '`' : '— aucune activité ouverte'}`,
    `**Gates franchies :** ${cleared.size ? [...cleared].join(' · ') : 'aucune'}`,
    `**Gates ouvertes :** ${gatesOuvertes.map(g => g.id).join(' · ') || 'aucune'}`,
    head ? `**Projeté au commit :** \`${head.slice(0, 7)}\`` : '**Projeté au commit :** — hors historique Git',
    '',
    '| | étape | statut | avancement |',
    '|---|---|---|---|',
    ...rows,
    ...(held.length ? ['', '**Réserves ouvertes** — ce qui est déposé et non achevé :', '',
                       '| livrable | étape | ce qui manque |', '|---|---|---|', ...held] : [])
  ].join('\n');

  return {
    ok: true,
    page: 'root',
    product: id.name,
    current_step: current,
    gates_cleared: [...cleared],
    reserves: Object.fromEntries(steps.flatMap(s => Object.entries(s.reserves || {}))),
    body,
    writes_properties: [],
    why_not_properties: r.notion_workspace.project_row.body.where,
    accountable: r.notion_workspace.project_row.body.accountable
  };
}

/** Rapport de liaison. RAPPORTE, ne refuse pas — l'espace de travail ne bloque rien. */
/* AVANCEMENT DES ÉTAPES, CALCULÉ DEPUIS LE JOURNAL.
 *
 * Le registre déclare depuis toujours que le statut d'une étape est « piloté par les
 * événements de la tour — WP_DECLARED, GATE_CLEARED. Une étape est terminée quand tous ses
 * livrables le sont, jamais parce qu'on l'a cochée ». Rien ne le CALCULAIT : le plan posait
 * « 0 / n » et « Non commencée » au bootstrap, et ces valeurs ne bougeaient plus jamais.
 * Deux livrables produits, déclarés et projetés laissaient leur étape à « 0 / 2 ».
 *
 * Un statut déclaratif est un tableau de suivi, pas un état — c'est ce que le registre
 * reproche à une case cochée à la main, et c'est ce que la projection faisait.
 *
 * La source est le JOURNAL, pas le disque : un fichier présent sans passage par la tour est
 * précisément ce que K8 signale. Compter des fichiers rendrait l'avancement complaisant. */
export function stepProgress(root = process.cwd()) {
  const r = registry();
  const ledger = join(root, 'runs', 'ledger.ndjson');
  /* DÉCLARÉ N'EST PAS COMPLET. Compter les déclarations faisait passer une étape à
     « Terminée » alors qu'un de ses livrables portait ses propres réserves. La dernière
     déclaration d'un livrable fait foi — un livrable repris et achevé doit pouvoir passer
     de partiel à complet, sinon la réserve devient une condamnation. */
  const declared = new Set();
  const complete = new Set();
  const reserves = new Map();
  const cleared = new Set();
  const journal = !existsSync(ledger) ? [] : traduireJournal(readFileSync(ledger, 'utf8').split('\n').filter(Boolean)
    .flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } }));
  for (const e of journal) {
    if (e.event === 'WP_DECLARED' && e.work_product) {
      /* UNE INSTANCE EST UNE UNITÉ À PART ENTIÈRE. Compter WP-17 sans son instance
         mélangeait deux releases dans un seul compteur : la seconde aurait hérité de
         l'avancement de la première. */
      const k = e.instance ? `${e.work_product}@${e.instance}` : e.work_product;
      declared.add(k);
      if (e.completion === 'complet') { complete.add(k); reserves.delete(k); }
      else { complete.delete(k); reserves.set(k, [].concat(e.reserves || [])); }
    }
    if (e.event === 'GATE_CLEARED' && e.gate) cleared.add(e.gate);
  }

  const values = (r.notion_workspace.databases.find(d => d.id === 'etapes')?.status_values) || [];
  const [NEUF, ENCOURS, FINI] = values;

  return r.steps.map(st => {
    /* Le dénominateur compte les livrables à chemin FIXE, plus chaque INSTANCE qui existe
       réellement — c'est-à-dire qui a été déclarée au journal.
       Un livrable à chemin paramétré n'a pas de ligne tant que sa release n'existe pas :
       le compter d'avance rendrait l'étape éternellement incomplète. Mais l'ignorer APRÈS
       est le défaut symétrique, et il est passé inaperçu jusqu'à la première release : deux
       livrables déclarés avec leurs réserves, et l'étape annoncée « Non commencée · 0 / 0 ».
       Un tableau de bord plus IGNORANT que les livrables qu'il résume ne sert personne, pas
       plus qu'un tableau de bord plus optimiste. */
    /* Le socle technique (SOC-nn) n'est pas un livrable présenté : il n'entre pas dans
       l'avancement qu'on montre. La tour et les gates, eux, continuent de le contrôler. */
    const all = r.work_products.filter(w => w.step === st.id && !w.interne);
    const fixed = all.filter(w => !perInstance(w)).map(w => ({ id: w.id, wp: w.id }));
    const live = [];
    for (const w of all.filter(perInstance))
      for (const k of declared)
        if (k.startsWith(w.id + '@')) live.push({ id: k, wp: w.id });
    const instanciables = [...fixed, ...live];
    const posed = instanciables.filter(u => declared.has(u.id));
    const done = instanciables.filter(u => complete.has(u.id));
    const held = posed.filter(u => !complete.has(u.id));
    const cad = byId(r.cadences, st.cadence);
    const gatesPassed = (cad?.gates || []).length > 0 && (cad.gates || []).every(g => cleared.has(g));

    /* Une étape n'est TERMINÉE que si chacun de ses livrables instanciables est déclaré
       COMPLET. Un seul partiel la laisse en cours — c'est tout l'objet de la correction :
       un tableau de bord plus optimiste que le livrable qu'il résume ne sert personne. */
    const statut = posed.length === 0 ? NEUF
      : (done.length === instanciables.length && (live.length + fixed.length === all.length || gatesPassed)) ? FINI
      : ENCOURS;

    const avancement = held.length
      ? `${done.length} / ${instanciables.length} livrable(s) · ${held.length} avec réserves`
      : `${done.length} / ${instanciables.length} livrable(s)`;

    return {
      key: `step:${st.id}`, step: st.id,
      properties: { statut, avancement },
      declared: posed.map(u => u.id),
      complete: done.map(u => u.id),
      /* Les réserves REMONTENT : une réserve qu'il faut ouvrir un fichier pour voir est une
         réserve que personne ne lit. */
      reserves: Object.fromEntries(held.map(u => [u.id, reserves.get(u.id) || []])),
      /* Différé = un livrable d'instance dont AUCUNE instance n'existe encore. */
      deferred: all.filter(w => perInstance(w) && ![...declared].some(k => k.startsWith(w.id + '@'))).length
    };
  });
}

export function linkStatus(root) {
  const proj = loadProject(root);
  if (!proj) return { ok: true, note: "aucune arborescence product/ — rien à relier" };

  /* L'UNITÉ EST LE LIVRABLE, PAS LE FICHIER. SOC-01 porte trois fichiers et SOC-02 deux :
     compter par fichier annonçait « 5 produits » pour DEUX livrables, et déclarait non
     reliés des fichiers qui n'ont pas à l'être séparément. Un livrable a une ligne dans
     l'espace de travail, pas une par fichier.

     ET LE POINTEUR A DEUX DOMICILES DÉCLARÉS. Le front-matter pour un livrable Markdown ;
     la carte des identifiants pour un livrable qui ne peut pas en porter — un YAML, dont
     la clôture « --- » ouvrirait un second document. Ne lire que le premier déclarait non
     relié un livrable que « apf notion link » venait de relier : le rapport ignorait le
     domicile que le registre lui-même déclare. */
  const map = readMap(root);
  const byWp = new Map();
  for (const e of (proj.entities || []).filter(x => x.work_product)) {
    const cur = byWp.get(e.work_product) || { work_product: e.work_product, files: [], url: null };
    cur.files.push(e.file);
    if (e.notion && !cur.url) cur.url = e.notion;
    byWp.set(e.work_product, cur);
  }
  for (const wp of byWp.values()) if (!wp.url) wp.url = map[`link:${wp.work_product}`] || null;

  const produced = [...byWp.values()];
  const linked = produced.filter(w => w.url);
  return {
    ok: true, blocking: false,
    produced: produced.length, linked: linked.length,
    unlinked: produced.filter(w => !w.url).map(w => `${w.work_product} — ${w.files.join(' · ')}`),
    note: "Rapport, jamais refus : une indisponibilité de l'espace de travail ne bloque pas un gate."
  };
}

/** Cohérence du plan avec le registre — vérifiable hors ligne, donc contrôlable par K6. */
export function planFindings() {
  const r = registry(), N = r.notion_workspace, f = [];
  if (!N) { return ["registre : aucun espace de travail déclaré"]; }
  /* Le contrôle porte sur la COHÉRENCE du plan avec le registre, pas sur un projet :
     il se calcule donc sur une identité fictive, jamais sur celle d'un produit. */
  const plan = planShape();

  /* Les étapes sont des LIGNES : c'est leur couverture qu'on vérifie, pas des pages. */
  const steps = new Set(r.steps.map(s => s.id));
  const covered = new Set(plan.step_rows.map(n => n.key.slice(5)));
  for (const s of steps) if (!covered.has(s)) f.push(`espace de travail : étape ${s} sans ligne`);
  for (const c of covered) if (!steps.has(c)) f.push(`espace de travail : ligne d'étape orpheline — ${c}`);

  if (plan.summary.lignes_instanciees + plan.summary.lignes_differees !== r.work_products.length)
    f.push('espace de travail : le plan ne couvre pas tous les livrables');
  for (const row of plan.rows)
    if (!row.template.sections.length) f.push(`espace de travail : ${row.key} sans plan de contenu — le gabarit serait vide`);

  const roles = new Set(['projection', 'natif']);
  const byId2 = new Map((N.databases || []).map(d => [d.id, d]));
  for (const d of N.databases || []) {
    if (!roles.has(d.role)) f.push(`base ${d.id} : rôle inconnu — ${d.role}`);
    if (d.role === 'natif' && !d.frozen_at)
      f.push(`base ${d.id} : native sans gel déclaré — ce qui s'écrit hors de Git doit y être figé à un gate, sinon la CI cesse d'être la preuve`);

    /* DÉFAUT RÉEL, CORRIGÉ ICI. Trois bases sur six n'avaient aucune propriété
       déclarée. L'adaptateur devait donc DESSINER un schéma que le registre était
       censé calculer — la première projection non générée du système. */
    const props = d.properties;
    if (!props || !Object.keys(props).length)
      f.push(`base ${d.id} : aucune propriété déclarée — l'adaptateur devrait inventer son schéma, donc dessiner une projection`);
    else {
      const titles = Object.entries(props).filter(([, t]) => t === 'titre');
      if (titles.length !== 1)
        f.push(`base ${d.id} : ${titles.length} propriété(s) de type titre — il en faut exactement une`);
      for (const [k, t] of Object.entries(props)) {
        const m = /^relation (\S+)$/.exec(String(t));
        if (m && !byId2.has(m[1]))
          f.push(`base ${d.id} : propriété ${k} en relation vers une base inconnue — ${m[1]}`);
      }
    }
    if (d.status_driven_by && !(d.status_values || []).length)
      f.push(`base ${d.id} : statut piloté par événements mais aucune valeur déclarée`);
  }

  /* DÉFAUT RÉEL, CORRIGÉ ICI. La base livrables déclarait « responsible » et
     « accountable » séparément quand les lignes du MÊME plan émettaient
     « responsible_accountable ». Une ligne écrivait dans une propriété inexistante, et
     rien ne le voyait : un plan peut être cohérent avec le registre et incohérent avec
     lui-même. */
  for (const row of [...plan.step_rows, ...plan.rows]) {
    const d = byId2.get(row.database);
    if (!d) { f.push(`espace de travail : ligne ${row.key} dans une base non déclarée — ${row.database}`); continue; }
    for (const k of Object.keys(row.properties || {}))
      if (!(d.properties || {})[k])
        f.push(`base ${row.database} : la ligne ${row.key} écrit « ${k} », absent du schéma déclaré`);
  }

  /* LES TYPES, PAS SEULEMENT LES NOMS. Les contrôles ne regardaient que les NOMS de
     propriétés : deux types faux sont donc passés jusqu'au connecteur, qui a refusé
     l'écriture. « selection » n'est un contrôle que si l'on vérifie ce qu'on y écrit. */
  const VOC = Object.keys(N.property_types?.vocabulary || {});
  if (!VOC.length) f.push("espace de travail : aucun vocabulaire de types déclaré — « selection » ne serait qu'un mot");
  const typeOf = t => /^relation /.test(String(t)) ? 'relation' : String(t);
  for (const d of N.databases || [])
    for (const [k, t] of Object.entries(d.properties || {}))
      if (VOC.length && !VOC.includes(typeOf(t)))
        f.push(`base ${d.id} : propriété ${k} de type inconnu — ${t}`);

  for (const row of [...plan.step_rows, ...plan.rows]) {
    const d = byId2.get(row.database);
    if (!d) continue;
    for (const [k, v] of Object.entries(row.properties || {})) {
      const t = typeOf((d.properties || {})[k]);
      if (!t) continue;
      if (t === 'selection') {
        if (Array.isArray(v))
          f.push(`base ${row.database} : ${row.key} écrit une LISTE dans « ${k} », déclaré en sélection simple`);
        else if (typeof v === 'string' && /\s[·|,;]\s/.test(v))
          f.push(`base ${row.database} : ${row.key} écrit une valeur composite dans « ${k} » — « ${v} » — alors qu'une sélection est atomique`);
        else if (typeof v === 'string' && v.length > 60)
          f.push(`base ${row.database} : ${row.key} écrit une phrase dans « ${k} », déclaré en sélection — une sélection n'est pas du texte libre`);
      }
      if (t === 'selection multiple' && !Array.isArray(v))
        f.push(`base ${row.database} : ${row.key} écrit une valeur simple dans « ${k} », déclaré en sélection multiple`);
      if (t === 'nombre' && typeof v !== 'number')
        f.push(`base ${row.database} : ${row.key} écrit « ${v} » dans « ${k} », déclaré numérique`);
    }
  }

  /* UN CHIFFRE ANNONCÉ ET NON RECALCULÉ EST DÉJÀ FAUX — le registre l'écrit, et le
     critère de sortie de l'activité 1 en portait deux, restés à l'ancienne forme. */
  for (const a of r.activities || [])
    for (const [champ, texte] of Object.entries({ entry: a.entry, exit: a.exit, task: a.task }))
      if (typeof texte === 'string') {
        const m = /(\d+)\s+(nœuds?|bases?|vues?|lignes?)\b/.exec(texte);
        if (m) f.push(`activité ${a.id} : son ${champ} annonce « ${m[0]} » — une quantité que « apf notion plan » recalcule ne se recopie pas en prose`);
      }

  /* Sans arborescence, une base sans vue est une base qu'on ne parcourt pas. */
  for (const d of N.databases || [])
    if (d.role === 'projection' && d.source && !(d.views || []).length && d.id !== 'journal' && d.id !== 'gates')
      f.push(`base ${d.id} : projection sans vue — les vues sont le seul chemin d'accès`);

  const nav = plan.summary.noeuds_navigation;
  if (N.navigation?.fixed_nodes !== nav)
    f.push(`espace de travail : le registre annonce ${N.navigation?.fixed_nodes} nœuds de navigation, le plan en calcule ${nav} — un chiffre annoncé et non recalculé est déjà faux`);
  if (!N.connector?.on_absence) f.push("espace de travail : comportement en l'absence de connecteur non déclaré");
  if (!N.root_location?.required_at) f.push("espace de travail : la base d'accueil n'est pas déclarée comme entrée obligatoire — une ligne de projet se crée toujours dans une base qui préexiste");
  if (!N.project_row?.status_mapping?.length) f.push("espace de travail : aucun statut d'avancement déclaré pour la ligne de projet");
  if (!N.project_row?.on_schema_mismatch) f.push("espace de travail : rien ne dit quoi faire si la base d'accueil n'a pas de statut — un agent modifierait un schéma qui ne lui appartient pas");
  if (!N.may_block_an_activity) f.push("espace de travail : la distinction gate / activité n'est pas écrite, elle se perdra");
  const phaseIds = (N.execution_order?.phases || []).map(p2 => p2.id);
  if (phaseIds.join(',') !== '1,2,3,4,5') f.push(`espace de travail : phases d'exécution incomplètes ou désordonnées — ${phaseIds.join(',')}`);
  {
    const created = new Set();
    for (const ph of plan.phases)
      for (const o of ph.operations) {
        if (o.parent_key && !created.has(o.parent_key))
          f.push(`espace de travail : ${o.key} référence son parent ${o.parent_key} avant sa création`);
        created.add(o.key);
      }
  }
  if (!N.never_blocks) f.push("espace de travail : la clause de non-blocage n'est pas déclarée");
  return f;
}

/* ── où écrire un livrable ───────────────────────────────────────────────
 *
 * La question que l'agent se pose à chaque activité, et à laquelle rien ne répondait :
 * « je produis WP-02, où va-t-il ? ». La réponse tient en un mot — UPDATE. La ligne a
 * été créée au bootstrap avec son gabarit et le statut « À produire ». En créer une
 * seconde donnerait deux pages pour un livrable, donc deux vérités. */
export function where(work_product, root = process.cwd()) {
  const r = registry();
  const w = byId(r.work_products, work_product);
  if (!w) return { ok: false, reason: `livrable inconnu — ${work_product}` };
  const plan = workspacePlan(root);
  if (plan.blocked) return { ok: false, reason: plan.reason };
  const row = plan.rows.find(x => x.key === w.id);
  const step = byId(r.steps, w.step);
  const map = readMap(root);

  return {
    ok: true,
    action: row ? 'update' : 'create',
    why: row
      ? "La ligne existe depuis le bootstrap, avec son gabarit et le statut « À produire ». La mettre à jour ; en créer une seconde donnerait deux pages pour un livrable, donc deux vérités."
      : "Livrable par-instance : sa ligne se crée à l'existence de la release, de la slice ou de la version — « apf notion instance ».",
    database: 'livrables',
    row_key: w.id,
    /* La clé de carte est celle que le PLAN émet — « SOC-01 », pas « row:SOC-01 ».
       Le préfixe cherché ici n'existait nulle part : la ligne était cartographiée et
       « apf notion where » rendait page_id: null, donc le pointeur bidirectionnel ne se
       posait jamais. Une clé inventée au point de lecture est une clé qui ne résout pas. */
    page_id: map[w.id] || null,
    appears_in: { step: w.step, page: `${step.id}  ${step.name}`,
                  page_id: map[`step:${w.step}`] || null,
                  how: `vue de la base « livrables » filtrée sur etape = ${w.step}` },
    git_path: `product/${(w.base || '')}${(w.files || [])[0] || ''}`,
    sections: (w.sections || []).map(x => x.title),
    properties_to_update: ['statut', 'chemin_git', 'commit'],
    completion: w.completion,
    body: `apf notion page ${w.id} — le corps complet, calculé depuis le fichier Git`
  };
}

/* Corps de la page : miroir complet du fichier Git, front-matter retiré. */
export function pageBody(root, work_product) {
  const r = registry();
  const w = byId(r.work_products, work_product);
  if (!w) return { ok: false, reason: `livrable inconnu — ${work_product}` };
  const N = r.notion_workspace;
  /* UN LIVRABLE A AUTANT DE FICHIERS QUE LE REGISTRE LUI EN DÉCLARE, et la page les porte
     TOUS. Ne projeter que le premier — ce que faisait « find » — donnait une page qui a
     l'air complète et ne l'est pas : SOC-02 montrait ses contraintes et taisait son
     inventaire de l'existant, SOC-01 montrait son schéma et taisait son identité et sa
     carte. C'est le mensonge le plus coûteux de la projection, parce qu'il ne laisse
     aucune trace : rien, sur la page, ne dit qu'il manque quelque chose.
     Et il rendrait FAUX le contrôle de fraîcheur : « apf notion drift » compare les
     commits de TOUS les fichiers du livrable. Une page amputée serait déclarée à jour. */
  const found = (loadProject(root)?.entities || []).filter(x => x.work_product === work_product);
  if (!found.length) return { ok: false, reason: `${work_product} n'existe pas encore sur disque — produire avant de projeter` };

  /* L'ORDRE EST CELUI DU REGISTRE, jamais celui du parcours de disque. Un balayage de
     repertoire rend « constraints.md » avant « existing-system.md » — l'inverse de l'ordre
     dans lequel le registre les declare, donc l'inverse de l'ordre dans lequel ils se
     lisent. Et surtout : il n'est pas STABLE. Deux projections successives du meme
     livrable pourraient reordonner la page sans qu'aucun fichier ait change, ce qui rend
     tout diff de page ininterpretable. */
  const declared = (w.files || []).map(f => `product/${w.base || ''}${f}`);
  const rank = f => { const i = declared.indexOf(f); return i < 0 ? declared.length : i; };
  /* UN FICHIER QUI N'EST PAS DU MARKDOWN EST CLÔTURÉ, jamais versé tel quel dans la page.
     Verser du YAML dans du Markdown ne le rend pas illisible à moitié : le rendu avale
     l'indentation, qui est la SYNTAXE du YAML. La page cesse alors d'être reconciliable
     avec le dépôt — la seule chose qu'une projection doit garantir. */
  const fence = f => (f.match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();
  const NOT_MARKDOWN = { yaml: 'yaml', yml: 'yaml', json: 'json', mjs: 'javascript',
                         js: 'javascript', ts: 'typescript', sh: 'bash', sql: 'sql' };

  const parts = found
    .sort((a, b) => rank(a.file) - rank(b.file))
    .map(e => {
      const raw = readFileSync(join(root, e.file), 'utf8').replace(FM, '').trimStart();
      const lang = NOT_MARKDOWN[fence(e.file)];
      return { file: e.file, fenced: Boolean(lang),
               body: lang ? '```' + lang + '\n' + raw.replace(/\s*$/, '') + '\n```' : raw };
    });

  /* Chaque fichier est annoncé par son chemin Git. Concaténer sans dire d'où vient quoi
     rendrait la page illisible au premier livrable à trois fichiers, et surtout
     irréconciliable avec le dépôt — or c'est la seule chose qu'une projection doit
     garantir. Un livrable mono-fichier ne gagne aucun titre : il n'y a rien à départager. */
  const body = parts.length === 1 ? parts[0].body
    : parts.map(p => `## \`${p.file}\`\n\n${p.body}`).join('\n\n---\n\n');

  return {
    ok: true, work_product,
    source: parts.length === 1 ? parts[0].file : parts.map(p => p.file),
    banner: N.page_body.banner,
    header: pageTemplate(w).header,
    body,
    note: N.page_body.comments
  };
}

/* Lignes d'une instance — release, slice ou version. Jamais créées à vide. « sprint » est lu « slice ». */
export function instancePlan(kind, id) {
  const r = registry();
  const token = { release: '{release-id}', slice: '{slice-id}', sprint: '{slice-id}', version: '{version}' }[kind];
  if (!token) return { ok: false, reason: `type d'instance inconnu — ${kind}. Attendu : release · slice · version` };
  if (!id) return { ok: false, reason: "identifiant d'instance requis — une ligne ne se crée pas à vide" };
  /* Une release ne crée PAS les lignes de ses slices : leurs chemins portent
     {release-id} ET {slice-id}, et la slice n'existe pas encore. Ne filtrer que sur
     {release-id} créerait des lignes pour des slices à venir. */
  const exclude = kind === 'release' ? '{slice-id}' : null;
  const rows = r.work_products
    .filter(w => {
      const full = (w.base || '') + (w.files || []).join(' ');
      return full.includes(token) && !(exclude && full.includes(exclude));
    })
    .map(w => {
      const base = (w.base || '').replaceAll(token, id);
      const file = ((w.files || [])[0] || '').replaceAll(token, id);
      return { op: 'row', database: 'livrables', key: `${w.id}@${id}`, work_product: w.id,
               properties: { identifiant: w.id, nom: w.name, etape: w.step, instance: id,
                             statut: 'À produire', chemin_git: `product/${base}${file}` },
               template: pageTemplate(w) };
    });
  return { ok: true, kind, instance: id, rows, count: rows.length,
           note: "Créées maintenant parce que l'instance existe. Avant, elles auraient préempté une décision non prise." };
}

/* ── carte des identifiants ──────────────────────────────────────────────
 * Stockée dans SOC-01, qui est déjà « le registre canonique et la configuration
 * projet ». Sans elle, un rejeu recrée tout : c'est elle qui porte l'idempotence. */
const MAP = (root) => join(root, 'product', cheminDe('SOC-01', 'workspace-map.yaml'));

export function readMap(root) {
  const f = MAP(root);
  return existsSync(f) ? (yaml.load(readFileSync(f, 'utf8')) || {}) : {};
}

export function writeMap(root, key, id) {
  const m = readMap(root);
  /* UN NŒUD NE SE RECRÉE PAS ; UNE DATE SE RÉÉCRIT. La carte porte deux natures de clés :
     des identifiants de pages et de bases — immuables, deux valeurs seraient deux
     vérités — et le journal « sync:<WP> », qui dit à quel commit la page a été écrite.
     Un livrable vivant est réécrit à chaque révision ; refuser de re-dater sa projection
     rendait « apf notion sync » inutilisable dès la deuxième écriture, et forçait une
     édition à la main de la carte — exactement ce que la commande existe pour éviter. */
  const journal = key.startsWith('sync:');
  if (!journal && m[key] && m[key] !== id)
    return { ok: false, reason: `${key} est déjà associé à ${m[key]} — un nœud ne se recrée pas ; corriger la carte ou supprimer le doublon` };
  const previous = journal && m[key] && m[key] !== id ? m[key] : null;
  m[key] = id;
  writeFileSync(MAP(root), yaml.dump(m, { lineWidth: 120, sortKeys: true }));
  return { ok: true, key, id, entries: Object.keys(m).length, ...(previous ? { previous } : {}) };
}
