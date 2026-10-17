import { routage, contexte, roles as rolesRoutage } from './routage.mjs';
import { enAttente, aRatifier, ratifier, ajouterDecision } from './decisions.mjs';
import { demarrer, arreter, prochaineAction, enregistrerVerdict, deleguerALOuverture, repondre, mettreEnFile, reprise, etatAutopilote } from './autopilote.mjs';
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, readdirSync, statSync } from 'node:fs';
import { traceTower } from './trace.mjs';
import { applies as wpApplies } from './conditions.mjs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './registry.mjs';
import { registry, byId, activityFragment, actorMayOpen, responsibleRoles } from './registry.mjs';
import { executerControles } from './controles-projet.mjs';
import { runAll, loadProject } from './checks.mjs';
import { vendorFindings } from './vendor.mjs';
import { composeModel, composePrototype } from './living.mjs';
import { workspacePlan, link as notionLink, linkStatus, where as notionWhere, instancePlan, sync as notionSync, projectRowBody, pullProjection } from './notion.mjs';
import { workspaceDrift } from './drift.mjs';
import { claimFindings } from './research.mjs';
import { renderTemplate, checkArtifactForm } from './templates.mjs';
import { NUMEROTATION } from './numerotation.mjs';
import { aligner } from './alignement.mjs';

/* TOUR DE CONTRÔLE.
 *
 * Ce qu'elle est. Le point de jonction entre les agents et les étapes : l'unique
 * endroit où l'on obtient le fragment d'une activité, où l'on déclare un livrable, où
 * l'on demande une gate, où l'on gèle un socle. Elle tient l'état du run et l'écrit
 * dans un journal append-only.
 *
 * Ce qu'elle N'EST PAS, et il faut le dire clairement : elle n'est pas un pare-feu.
 * Un serveur MCP ne voit que les opérations qu'il expose. Un agent qui écrit un fichier
 * avec l'outil natif du harness ne passe pas par elle et elle ne peut pas l'en empêcher.
 * Aucune tour de contrôle logicielle ne peut prévenir ce qu'elle ne voit pas.
 *
 * Ce qu'elle apporte malgré cela, et qui est le vrai mécanisme :
 *   1. Elle est la SEULE source du fragment d'activité. Un agent qui ne l'appelle pas
 *      n'a pas ses consignes — le contournement coûte l'information, pas seulement la
 *      conformité.
 *   2. Elle est la SEULE voie vers une gate. Une gate n'est franchie que si la tour a
 *      constaté le pack complet ET qu'une autorité humaine a tranché.
 *   3. Elle rend le contournement PROUVABLE. Tout livrable présent sur disque sans
 *      entrée de déclaration correspondante au journal est un trou que K8 voit, en
 *      local comme en intégration continue. Elle ne prévient pas : elle rend l'écart
 *      impossible à cacher, ce qui est le seul pouvoir réel d'une tour de contrôle.
 *
 * La prévention en boucle reste le rôle des hooks (spécifiques au harness), du
 * pre-commit et de la CI. Aucune logique de contrôle ne vit ici en propre : la tour
 * appelle les mêmes contrôles K1–K8 que la CLI et la CI. */

const S = (p) => join(p, 'runs', 'tower.json');
const L = (p) => join(p, 'runs', 'ledger.ndjson');

/* Fabrique, jamais constante partagée : un état vide littéral est copié en surface,
   donc deux projets se partageraient le MÊME tableau `opened` dans un seul processus.
   La garde en boucle voyait alors une activité ouverte dans un dépôt qui n'en avait pas. */
const empty = () => ({ version: 1, run: null, opened: [], declared: [], gates: {}, baselines: {}, directions: [] });

export function loadState(project) {
  const f = S(project);
  return existsSync(f) ? { ...empty(), ...JSON.parse(readFileSync(f, 'utf8')) } : empty();
}

export function saveState(project, st, entry) {
  mkdirSync(join(project, 'runs'), { recursive: true });
  writeFileSync(S(project), JSON.stringify(st, null, 2) + '\n');
  if (entry) appendFileSync(L(project), JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');
  return st;
}

/* extra est étalé AVANT le verdict : un constat imbriqué ne doit jamais pouvoir
   réécrire ok ni verdict — c'est exactement comme un refus se transforme en accord. */
const refuse = (reason, extra = {}) => ({ ...extra, ok: false, verdict: 'REFUSÉ', reason });
const grant  = (extra = {}) => ({ ...extra, ok: true, verdict: 'ACCORDÉ' });

/** Chemins atomiques qu'une activité autorise à écrire — sa frontière d'écriture. */
export function writeBoundary(activityId) {
  const r = registry();
  const a = byId(r.activities, activityId);
  if (!a) return [];
  return r.work_products
    .filter(w => a.work_products.includes(w.id))
    .flatMap(w => (w.files || []).map(f => `product/${w.base}${f}`));
}

/* ── 1 · où en est le run ──────────────────────────────────────────────── */
export function state(project) {
  const r = registry(), st = loadState(project);
  const cleared = Object.entries(st.gates).filter(([, g]) => g.status === 'CLEARED').map(([k]) => k);
  const last = st.opened[st.opened.length - 1] || null;
  return {
    run: st.run, current_activity: last?.activity ?? null, current_step: last?.step ?? null,
    gates: r.gates.map(g => ({ id: g.id, name: g.name, authority: g.authority, status: st.gates[g.id]?.status || 'OUVERTE' })),
    gates_cleared: cleared,
    baselines_frozen: Object.keys(st.baselines),
    declared: st.declared.length,
    /* La dernière direction humaine se lit avec l'état : c'est elle qui dit ce qu'on a changé
       depuis la dernière gate. */
    directions: (st.directions || []).length,
    last_direction: (st.directions || [])[(st.directions || []).length - 1] || null,
    reachable_cadences: reachable(cleared)
  };
}

function reachable(cleared) {
  const r = registry(), out = [];
  for (const c of r.cadences) {
    out.push(c.id);
    if (!(c.gates || []).filter(g => g !== 'K1').every(g => cleared.includes(g))) break;
  }
  return out;
}

/* ── 2 · ouvrir une activité : unique source du fragment ───────────────── */
function routageDe(a, ctx) {
  const r = registry(), porteurs = String(a.responsible).split(/ (?:et|puis) |·/).map(x => x.trim());
  const une = id => { const x = routage(id, ctx, r); return x && { model: x.modele, effort: x.effort_adaptateur, classe: x.classe,
    modulations: x.modulations.map(m => `${m.id} ${m.effet} — ${m.raison}`) }; };
  return {
    contexte: { cadence: ctx.cadence, tier: ctx.tier, reprise: ctx.reprise, express: ctx.express },
    porteurs: Object.fromEntries(porteurs.map(id => [id, une(id)]).filter(([, v]) => v)),
    critics: Object.fromEntries(rolesRoutage(r).filter(id => id.startsWith('critic-')).map(id => [id, une(id)])),
    consigne: "Invoquer chaque rôle avec ce « model » et cet « effort » : la garde refuse un rôle de la méthode invoqué autrement (R6).",
  };
}

/** Le modèle et l'effort d'un rôle, dans le contexte de l'activité ouverte ou dans celui donné. */
export function route(project, { agent, activity, tier, reprise, express } = {}) {
  if (!agent) return refuse('factory_route : nommez le rôle — « agent »');
  const st = loadState(project);
  const ctx = activity != null ? contexte(activity, { tier, reprise, express }) : (st.routage || contexte(null, { tier, reprise, express }));
  const x = routage(String(agent).split(':').pop(), ctx);
  if (!x) return refuse(`rôle inconnu de la méthode — ${agent}`);
  return grant({ role: x.role, model: x.modele, effort: x.effort_adaptateur, classe: x.classe, effort_registre: x.effort,
                 contexte: { activite: ctx.activite ?? null, cadence: ctx.cadence, tier: ctx.tier, reprise: ctx.reprise, express: ctx.express },
                 base: { model: x.base.modele, effort: x.base.effort_adaptateur }, modulations: x.modulations });
}

export function openActivity(project, { activity, actor, tier, reprise, express }) {
  const r = registry();
  const a = byId(r.activities, activity);
  if (!a) return refuse(`activité inconnue — ${activity}`);
  const st = loadState(project);
  const cleared = Object.entries(st.gates).filter(([, g]) => g.status === 'CLEARED').map(([k]) => k);
  if (!reachable(cleared).includes(a.cadence))
    return refuse(`cadence ${a.cadence} non atteignable : une gate antérieure n'est pas franchie`,
                  { gates_ouvertes: r.cadences.flatMap(c => c.gates).filter(g => g !== 'K1' && !cleared.includes(g)) });
  /* UNE ACTIVITÉ EST SOUVENT PORTÉE PAR PLUSIEURS RÔLES — « product-lead puis factory-lead »,
     « quality-engineer produit · critic(quality) classe ». Comparer l'acteur à la CHAÎNE par
     égalité stricte refusait tout le monde : neuf activités sur vingt-six étaient
     inouvrables, et le refus avait l'apparence d'un contrôle qui marche. Le refus subsiste
     pour un acteur hors composition, et il NOMME désormais les porteurs. */
  if (actor && a.responsible) {
    const may = actorMayOpen(actor, a.responsible);
    if (!may.ok)
      return refuse(`séparation des rôles : l'activité ${activity} est portée par ${may.roles.join(' · ')}, pas ${actor}`,
                    { porteurs: may.roles, declare_au_registre: a.responsible });
  }

  /* L'ESPACE DE TRAVAIL DOIT ÊTRE À JOUR AVANT D'OUVRIR LA SUITE. Un livrable produit dont
     la page est périmée fait lire au comité une version que le dépôt a dépassée — pire
     qu'une page absente, qui au moins ne ment pas.
     La portée est délibérée et bornée : ce refus arrête une ACTIVITÉ, jamais une gate.
     Adosser une gate à l'état d'un tiers mettrait un service extérieur sur le chemin d'une
     décision humaine, et c'est ce que le registre interdit. Le calcul est hors ligne :
     comparaison Git, aucun appel au tiers. */
  const d = workspaceDrift(project);
  if (!d.ok)
    return refuse(`espace de travail non à jour : ${d.drift.length} livrable(s) produit(s) dont la projection ne suit pas`,
                  { drift: d.drift, portee: d.scope,
                    remede: "projeter puis « apf notion sync <WP> », qui date la projection dans la carte" });

  const frag = activityFragment(activity);
  const boundary = writeBoundary(activity);
  /* Un run qui naît porte la numérotation en cours : la migration de numérotation ne
     touchera jamais un projet ouvert après elle. */
  if (!st.run) { st.run = `RUN-${new Date().toISOString().slice(0, 10)}`; st.numerotation = NUMEROTATION; }
  st.opened.push({ activity: a.id, step: a.step, actor: actor || null, at: new Date().toISOString() });
  /* LE CONTEXTE DE ROUTAGE (R6) est consigné à l'ouverture : la garde le relit à chaque
     invocation d'un rôle. La réouverture se lit dans l'état — un gate de la cadence déjà
     refusé ou renvoyé à l'itération —, elle ne se déclare pas seulement. */
  const refuse_ = (r.cadences.find(c => c.id === a.cadence)?.gates || [])
    .some(g => /REFUS|ITÉR/i.test(String(st.gates[g]?.decision || '')));
  st.routage = { ...contexte(a.id, { tier, reprise: reprise || refuse_, express }), at: new Date().toISOString() };
  /* Sous autopilote, la délégation de l'activité entre en file, appliquée par défaut (MCR-002). */
  const delegues = deleguerALOuverture(st, a);
  saveState(project, st, { event: 'ACTIVITY_OPEN', activity: a.id, step: a.step, actor: actor || null,
                           routage: { tier: st.routage.tier, reprise: st.routage.reprise, express: st.routage.express } });

  /* LE SQUELETTE EST SERVI, PAS POINTÉ. Une consigne « partir de apf template » n'oblige
     personne ; un squelette rendu avec le fragment est ce que l'agent a sous les yeux. Il
     porte les sections du registre, le fichier de chacune, la règle et le guide. À la
     déclaration, la tour confronte le livrable à cette même forme. */
  const tmpl = Object.fromEntries((a.work_products || []).map(id => [id, renderTemplate(id)]));
  const routees = reservesRoutees(st, a);
  return grant({
    fragment: frag,
    write_boundary: boundary,
    skill: a.skill,
    /* LE ROUTAGE EST SERVI avec le fragment : chaque porteur et chaque critic, avec le modèle
       et l'effort à passer à l'invocation. La garde refuse l'invocation qui s'en écarte. */
    routage: routageDe(a, st.routage),
    ...(delegues.length ? { autopilote: { delegations: delegues.map(d => ({ id: d.id, objet: d.objet, choix_applique: d.choix_applique })),
      consigne: "Sous autopilote : appliquer le choix déjà consigné, sans poser la question. L'humain le ratifie en G0, ou le tranche autrement et l'activité se rouvre." } } : {}),
    /* LA CONDUITE VOYAGE AVEC LE FRAGMENT. Une règle d'interrogatoire écrite seulement dans un
       skill n'oblige que celui qui l'ouvre ; servie à l'ouverture, elle est sous les yeux de la
       conversation qui pose les questions. */
    ...(() => {
      const ids = String(a.skill || '').split(',').map(x => x.trim());
      const c = (r.skills || []).filter(s => ids.includes(s.id) && s.conduite)
        .map(s => ({ skill: s.id, id: s.conduite.id, nom: s.conduite.nom, lieu: s.conduite.lieu, regles: s.conduite.regles }));
      return c.length ? { conduite: c.length === 1 ? c[0] : c } : {};
    })(),
    /* LE POINT DE DÉPART EST SERVI, LUI AUSSI. Une activité qui part d'un existant — le
       design system de départ (8), le départ d'architecture (11) — reçoit son contenu et la
       question à poser : on ne commence pas par une page blanche, et on ne garde rien sans que
       l'humain l'ait dit. Le mécanisme est le même pour toute activité qui déclare un
       point_de_depart au registre ; seule la consigne dit où la décision se consigne. */
    ...(a.point_de_depart ? { point_de_depart: servirDepart(a) } : {}),
    exit_criterion: a.exit,
    /* UNE RÉSERVE ROUTÉE NE SE PERD PAS (MCR-003). Un livrable partiel qui renvoie une réserve
       à une activité ultérieure ne la faisait voir qu'à qui relisait ce livrable : l'activité
       destinataire s'ouvrait sans elle. Elle est rendue ici, où l'agent la lit avant de produire. */
    ...(routees.length ? { reserves_routees: { liste: routees,
      consigne: "Réserves ouvertes qui citent cette activité ou l'un de ses livrables. Chacune reçoit ici une disposition : levée, reportée avec sa destination, ou acceptée par un humain nommé. Une réserve qui disparaît sans disposition est une perte, pas une levée." } } : {}),
    templates: tmpl,
    note: "Frontière d'écriture indicative ici, opposable au commit : tout chemin hors de cette liste est refusé par K2. Chaque livrable est déclaré contre son squelette : un H2 manquant ou vide refuse « complet »."
  });
}

/** Les réserves ouvertes — dernière déclaration « partiel » de chaque livrable — qui citent
 *  l'activité par son numéro (« activité 11 », « activités 11 et 17 ») ou l'un de ses
 *  livrables par son identifiant. La dernière déclaration fait foi : une réserve levée par un
 *  « complet » ultérieur n'est plus rappelée. */
export function reservesRoutees(st, a) {
  const last = new Map();
  for (const d of st.declared || []) last.set(d.work_product, d);
  const wps = new Set(a.work_products || []);
  const citeActivite = txt => [...String(txt).matchAll(/activit[ée]s?\s+((?:\d+(?:\s*(?:,|et|&)\s*)?)+)/gi)]
    .some(m => m[1].match(/\d+/g).map(Number).includes(Number(a.id)));
  const citeLivrable = txt => (String(txt).match(/\bWP-\d+\b/g) || []).some(w => wps.has(w));
  const out = [];
  for (const d of last.values()) {
    if (d.completion !== 'partiel') continue;
    for (const reserve of d.reserves || [])
      if (citeActivite(reserve) || citeLivrable(reserve))
        out.push({ work_product: d.work_product, activite_source: d.activity, reserve });
  }
  return out;
}

/* LA CONSIGNE D'UN POINT DE DÉPART — où la décision se consigne, et ce que le départ devient
   une fois gardé. Elle vit ici, pas au registre : le fragment d'activité a un budget, et la
   consigne n'est lue que par l'agent qui ouvre l'activité. Une activité sans consigne propre
   reçoit la consigne commune. */
const CONSIGNE_COMMUNE = "Montrer le départ sur le produit, puis poser la question — une seule, réponse recommandée en premier — et consigner la décision avec qui l'a prise.";
const CONSIGNES_DEPART = {
  8: "Appliquer le départ à un vrai écran du produit, le montrer, puis poser la question — une seule, réponse recommandée en premier — et consigner la décision dans la section « Design system de départ et décision ». Gardé ou adapté : partir de ses fichiers de tokens pour écrire tokens.json, puis générer tokens.css. Quel que soit le choix, tokens.json déclare le groupe color.role : ce sont ces rôles qui habillent les livrables Word et PowerPoint du projet.",
  11: "Confronter le départ au squelette entier et aux contraintes de l'existant, puis poser la question — une seule, réponse recommandée en premier — et consigner la décision dans la première ADR de WP-13, avec qui l'a prise. Gardé ou adapté : reprendre ses ADR dans decisions/adr/, chacune revérifiée sur le produit, et ses fonctions de fitness dans la CI ; chaque écart au départ est une ADR qui nomme l'alternative rejetée. Remplacé : l'ADR le dit, et le départ devient l'alternative rejetée. Les versions s'épinglent sur la documentation du jour, jamais recopiées du départ.",
};

/** Le point de départ d'une activité, tel que la tour le sert à l'ouverture : la référence
 *  en entier, les fichiers par leur chemin réel — un dossier avec la liste de ce qu'il
 *  porte —, la question, les options, les garde-fous et la consigne. */
export function servirDepart(a) {
  const d = a.point_de_depart;
  const lire = f => { try { return readFileSync(join(ROOT, f), 'utf8'); } catch { return null; } };
  /* Les fichiers servis ne sont pas recopiés dans la réponse : la tour donne leur rôle et leur
     chemin réel, que l'agent lit quand il en dérive ceux du projet. */
  const fichier = f => {
    const chemin = join(ROOT, f.chemin), present = existsSync(chemin);
    const dossier = present && statSync(chemin).isDirectory();
    return { role: f.role, chemin, present, ...(dossier ? { liste: readdirSync(chemin).filter(n => !n.startsWith('.')).sort() } : {}) };
  };
  return {
    nom: d.nom, fichier: d.fichier, contenu: lire(d.fichier),
    fichiers: (d.fichiers || []).map(fichier),
    question: d.question, options: d.options, garde_fous: d.garde_fous || [],
    consigne: CONSIGNES_DEPART[a.id] || CONSIGNE_COMMUNE,
  };
}

/* ── 3 · déclarer un livrable produit ──────────────────────────────────── */
export const COMPLETION = ['complet', 'partiel'];

export function declare(project, { activity, work_product, path, evidence, completion, reserves, instance }) {
  const r = registry();
  const a = byId(r.activities, activity);
  if (!a) return refuse(`activité inconnue — ${activity}`);
  if (!a.work_products.includes(work_product))
    return refuse(`${work_product} n'appartient pas à l'activité ${activity}`, { attendus: a.work_products });
  const allowed = writeBoundary(activity);
  if (path && !allowed.includes(path))
    return refuse(`chemin hors frontière d'écriture — ${path}`, { autorisés: allowed });
  const w = byId(r.work_products, work_product);

  /* DÉCLARER N'EST PAS ACHEVER, et la tour ne pouvait pas faire la différence.
     L'avancement se calculait sur le nombre de déclarations : un livrable déposé avec ses
     réserves comptait autant qu'un livrable fini. Une étape s'affichait « Terminée · 5/5 »
     alors que l'un de ses livrables disait lui-même que son critère de vérification n'était
     pas satisfait. Le tableau de bord était PLUS OPTIMISTE que le livrable qu'il résumait —
     exactement la divergence que la méthode existe pour empêcher.

     LE CRITÈRE DE COMPLÉTUDE EST EN PROSE : aucune machine ne le vérifie. La tour ne peut
     donc pas CALCULER la complétude — elle peut, et doit, EXIGER qu'on se prononce. Le
     critère était déjà rendu ici, mais APRÈS l'acceptation : il informait, il ne demandait
     jamais. Il est désormais posé en question, et l'absence de réponse est un refus.

     POURQUOI REFUSER PLUTÔT QUE SUPPOSER. Supposer « complet » rendrait le défaut à
     l'identique. Supposer « partiel » ferait porter au producteur une réserve qu'il n'a pas
     émise. Refuser coûte une phrase à celui qui sait, au moment où elle est la moins chère. */
  if (!COMPLETION.includes(completion))
    return refuse(`complétude non déclarée pour ${work_product} — « complet » ou « partiel », jamais tacite`,
                  { critere_de_completude: w.completion,
                    pourquoi: "Déclarer n'est pas achever. Sans cette réponse, un livrable déposé avec ses réserves compterait comme fini, et l'étape s'afficherait terminée alors qu'elle ne l'est pas.",
                    si_partiel: 'joindre « reserves » : ce qui manque, en clair' });

  const res = [].concat(reserves || []).map(String).filter(Boolean);
  if (completion === 'partiel' && !res.length)
    return refuse(`${work_product} est déclaré partiel sans réserve nommée`,
                  { pourquoi: "Un « partiel » sans réserve est un « complet » qui n'ose pas le dire : il ne dit à personne ce qui reste à faire." });
  if (completion === 'complet' && res.length)
    return refuse(`${work_product} est déclaré complet ET porte ${res.length} réserve(s)`,
                  { reserves: res, pourquoi: 'Un livrable complet n\'a pas de réserve. Déclarer « partiel », ou lever les réserves.' });

  /* LE GABARIT EST UN CONTRÔLE, PAS UNE CONSIGNE. Jusqu'ici la tour rendait les titres de
     section APRÈS avoir accepté, sans jamais lire le fichier : un « complet » sur un
     fichier vide passait. Elle confronte désormais le livrable à sa forme — fichiers
     déclarés présents, front-matter requis, un H2 par section au titre exact, non vide.
     « complet » exige zéro écart ; « partiel » consigne les écarts sans refuser : c'est
     précisément ce que partiel veut dire. Ce que la tour ne voit toujours pas : un fichier
     jamais déclaré. K8 le rend visible ; K7 rejoue ce contrôle sur le dépôt. */
  const inst = instance || instanceFromPath(path);
  const form = checkArtifactForm(project, work_product, { instance: inst, completion });
  if (completion === 'complet' && !form.ok)
    return refuse(`${work_product} déclaré complet mais sa forme ne l'est pas — ${form.findings.length} écart(s)`,
                  { ecarts: form.findings, observations: form.observations, fichiers: form.files,
                    remede: "compléter les sections nommées, ou déclarer « partiel » avec ces écarts en réserves",
                    squelette: 'apf template ' + work_product });

  const st = loadState(project);
  st.declared.push({ activity, work_product, path: path || null, instance: inst || null, evidence: evidence || [],
                     completion, reserves: res, form_findings: form.findings.length, at: new Date().toISOString() });
  saveState(project, st, { event: 'WP_DECLARED', activity, work_product, path: path || null, instance: inst || null,
                           completion, reserves: res, form_findings: form.findings.length });
  /* LE LIVRABLE SE LIT DANS LE FORMAT QUE SON GABARIT DÉCLARE. Le Markdown est la version
     contrôlée ; le PowerPoint ou le Word est ce que le comité ouvre. Il est écrit ICI, à chaque
     déclaration, parce qu'une consigne « pense à l'exporter » n'oblige personne : les projets
     déclaraient leurs livrables et aucun fichier Office n'existait. Le rendu tourne dans un
     processus à part, borné dans le temps, et ÉCHOUE EN OUVRANT : un rendu raté est signalé,
     il ne défait jamais une déclaration déjà consignée. Un élément interne du socle n'a pas
     de fichier Office : il ne se présente à personne. */
  const office = w.interne ? null : rendreOffice(project, work_product);
  return grant({ completion_declaree: completion, reserves: res,
                 office,
                 forme: { conforme: form.ok, ecarts: form.findings, observations: form.observations },
                 critere_de_completude: w.completion,
                 controlled_at: w.controlled_at, sections: (w.sections || []).map(s => s.title),
                 note: completion === 'partiel'
                   ? "Consigné partiel : l'étape ne s'affichera pas terminée, et les réserves suivent le livrable jusqu'au gate."
                   : "Consigné complet : cette affirmation est opposable au gate, et un critic la confrontera au critère ci-dessus." });
}

/** Écrit le fichier Office d'un livrable déclaré. Rend { fichier, format } ou { erreur, remede }. */
export function rendreOffice(project, work_product) {
  try {
    const r = spawnSync(process.execPath, [join(ROOT, 'bin', 'apf'), 'livrable', work_product, '--json'],
      { cwd: project, encoding: 'utf8', timeout: 90000 });
    const res = JSON.parse(String(r.stdout || '').trim().split('\n').pop() || '[]')[0];
    if (res?.fichier) return { format: res.office, fichier: res.fichier.replace(project + '/', ''), completion: res.completion };
    return { erreur: res?.erreur || res?.raison || (r.error?.message) || String(r.stderr || 'rendu sans sortie').slice(0, 300),
             remede: `apf livrable ${work_product}` };
  } catch (e) { return { erreur: e.message, remede: `apf livrable ${work_product}` }; }
}

/** Une instance devinée depuis un chemin RÉEL — product/releases/REL-x/slices/S-01/… — quand
    l'appelant n'en donne pas. Un chemin encore paramétré ne dit rien. */
function instanceFromPath(path) {
  if (!path) return null;
  const m = /releases\/([^/{}]+)(?:\/(?:slices|sprints)\/([^/{}]+))?/.exec(path);
  if (m) return { release: m[1], slice: m[2] };
  const v = /deployments\/([^/{}]+)/.exec(path);
  return v ? { version: v[1] } : null;
}

/* ── 4 · demander une gate : constat, jamais décision ──────────────────── */
export function requestGate(project, { gate }) {
  const c = constatGate(project, { gate });
  if (!c.ok) return c;
  const st = loadState(project);
  saveState(project, st, { event: 'GATE_REQUESTED', gate, ready: c.verdict === 'PRÊT', missing: c.work_products_missing.length,
    sans_objet: c.work_products_sans_objet.map(h => h.work_product), failed: c.controls_failed.map(x => x.id) });
  return c;
}

/** Le même constat, SANS rien consigner : ce que l'autopilote relit à chaque action — un
 *  constat qui écrirait au journal se ferait passer pour du progrès. */
export function constatGate(project, { gate }) {
  const r = registry();
  const g = byId(r.gates, gate);
  if (!g) return refuse(`gate inconnue — ${gate}`);
  const st = loadState(project);
  const declaredWps = new Set(st.declared.map(d => d.work_product));
  const due = r.work_products.filter(w => w.controlled_at === gate);
  /* UN LIVRABLE SANS OBJET N'EST PAS MANQUANT. Le réclamer ferait porter au projet une
     dette qui n'existe pas, et une liste qui réclame l'impossible s'apprend à s'ignorer.
     Il est CONSIGNÉ à part, avec le fait qui le tranche : un silence ne vaut pas dispense. */
  const hors = [];
  const exigibles = due.filter(w => {
    const a = wpApplies(project, w.id);
    if (a.applies) return true;
    hors.push({ work_product: w.id, name: w.name, condition: a.condition, fait: a.reason, note: a.note });
    return false;
  });
  const missing = exigibles.filter(w => !declaredWps.has(w.id)).map(w => `${w.id} — ${w.name}`);
  const controls = runAll(loadProject(project));
  const failed = controls.filter(c => c.status === 'FAIL');
  /* Les contrôles du projet s'exécutent ICI, dans l'environnement du projet : une gate ne se
     déclare pas prête sur un produit qui viole ses propres règles. */
  const pc = executerControles(project);
  if (pc.present && pc.findings.length) failed.push({ id: 'PC', status: 'FAIL', findings: pc.findings });
  /* G0 SOUS AUTOPILOTE : un arbitrage ou une décision bloquante en attente empêche le gate ;
     les décisions déléguées sont présentées à ratifier, par rayon d'impact (MCR-002). */
  const attente = g.id === 'G0' ? enAttente(st) : [];
  const ratif = g.id === 'G0' ? aRatifier(st) : [];
  const nAff = r.autopilote?.ratification?.affiches || 10;
  const ready = !missing.length && !failed.length && !attente.length;
  return {
    ...(g.id === 'G0' && (st.decisions || []).length ? {
      decisions_en_attente: attente.map(d => ({ id: d.id, type: d.type, objet: d.objet, activite: d.activite })),
      a_ratifier: ratif.slice(0, nAff).map(d => ({ id: d.id, objet: d.objet, choix_applique: d.choix_applique, rayon: d.rayon, activite: d.activite })),
      a_ratifier_au_dela: Math.max(0, ratif.length - nAff),
    } : {}),
    ok: true, verdict: ready ? 'PRÊT' : 'INCOMPLET',
    gate: g.id, question: g.question, authority: g.authority, automated: g.automated === true,
    evidence_pack: g.evidence_pack, work_products_missing: missing, work_products_sans_objet: hors,
    controls_failed: failed.map(c => ({ id: c.id, findings: c.findings })),
    note: g.automated ? "Checkpoint automatisé : le verdict de la tour suffit."
                      : "La tour constate. Elle ne franchit pas : l'autorité est humaine et non délégable."
  };
}

/* ── 5 · franchir une gate : exige un humain nommé ─────────────────────── */
/* G4 — LA GATE DE PRODUCTION VAUT POUR UN BUILD. Elle « vaut pour un hash de build, et pour
   7 jours » : franchie sans empreinte, elle autoriserait n'importe quelle version ; sans
   échéance, une autorisation de lundi couvrirait la release d'un mois plus tard. En tier R3,
   deux autorités DISTINCTES, enregistrées séparément. La décision consignée ici est celle que
   le workflow de mise en production relit (releaseCheck) avant tout déploiement : le relecteur
   requis de l'environnement « prod » approuve le job, la tour prouve que G4 l'a décidé. */
export const G4_VALIDITE_JOURS = 7;
const DECISIONS_G4 = ['AUTORISER', 'AUTORISER AVEC DÉPLOIEMENT PROGRESSIF', 'REFUSER'];

export function clearGate(project, { gate, human, decision, build, tier, second }) {
  const r = registry();
  const g = byId(r.gates, gate);
  if (!g) return refuse(`gate inconnue — ${gate}`);
  if (g.id === 'G4') {
    if (!build || !/^[0-9a-f]{7,64}$|^sha256:[0-9a-f]{64}$/i.test(String(build)))
      return refuse("G4 vaut pour un hash de build : donnez « build » — le commit ou l'empreinte acceptés en QA. Sans lui, l'autorisation couvrirait n'importe quelle version.");
    if (!DECISIONS_G4.includes(decision))
      return refuse(`G4 : décision attendue parmi ${DECISIONS_G4.join(' · ')}`);
    if (tier === 'R3' && (!second || String(second).trim().toLowerCase() === String(human || '').trim().toLowerCase()))
      return refuse('G4 en tier R3 : deux autorités DISTINCTES, enregistrées séparément — « human » et « second ».');
  }
  const rq = requestGate(project, { gate });
  if (rq.verdict !== 'PRÊT') return refuse('pack incomplet ou contrôle en échec', rq);
  if (!g.automated && !human)
    return refuse(`${g.id} : autorité ${g.authority}. Un agent ne peut pas franchir une gate humaine — nommez la personne qui tranche.`);
  const st = loadState(project);
  const at = new Date();
  st.gates[gate] = { status: 'CLEARED', by: human || 'tour (checkpoint automatisé)', decision: decision || null, at: at.toISOString() };
  const ev = { event: 'GATE_CLEARED', gate, by: st.gates[gate].by, decision: decision || null };
  if (g.id === 'G4') {
    const a = { build: String(build).toLowerCase(), decision, by: human, second: second || null, tier: tier || null,
                at: at.toISOString(), expires_at: new Date(+at + G4_VALIDITE_JOURS * 86_400_000).toISOString() };
    Object.assign(st.gates[gate], { build: a.build, second: a.second, tier: a.tier, expires_at: a.expires_at });
    st.production = [...(st.production || []), a];
    Object.assign(ev, { build: a.build, second: a.second, tier: a.tier, expires_at: a.expires_at });
  }
  /* G0 RATIFIE ce que l'autopilote a délégué, au nom de l'autorité qui franchit, et clôt la
     cadence qu'il pilotait. */
  if (g.id === 'G0') {
    const ratifiees = ratifier(st, human || st.gates[gate].by);
    if (ratifiees.length) ev.ratifiees = ratifiees;
    if (st.autopilote?.actif) { st.autopilote.actif = false; st.autopilote.arret = { raison: 'G0 franchie', at: st.gates[gate].at }; }
  }
  saveState(project, st, ev);
  return grant({ gate, cleared_by: st.gates[gate].by, ...(ev.ratifiees ? { ratifiees: ev.ratifiees } : {}), ...(g.id === 'G4' ? { build: st.gates[gate].build, expires_at: st.gates[gate].expires_at } : {}),
                 reachable_cadences: state(project).reachable_cadences });
}

/** Ce build peut-il partir en production ? Relu par le workflow de mise en production, AVANT
 *  tout déploiement : G4 franchie pour CE build, décision d'autoriser, dans sa validité. Un
 *  build désigné par commit et par empreinte est accepté si l'un des deux a été autorisé. */
export function releaseCheck(project, { build, maintenant } = {}) {
  const builds = String(build || '').toLowerCase().split(/[\s,]+/).filter(Boolean);
  if (!builds.length) return refuse('release-check : aucun build donné — le commit ou l\'empreinte du candidat');
  const st = loadState(project), now = maintenant ? new Date(maintenant) : new Date();
  const pour = (st.production || []).filter(a => builds.some(b => a.build === b || (b.length >= 7 && a.build.startsWith(b)) || (a.build.length >= 7 && b.startsWith(a.build))));
  const derniere = pour.sort((a, b) => b.at.localeCompare(a.at))[0];
  if (!derniere) return refuse(`G4 n'a jamais été franchie pour ${builds.join(' / ')} — la mise en production est refusée. Une approbation de l'environnement « prod » ne remplace pas la gate.`);
  if (derniere.decision === 'REFUSER') return refuse(`G4 a REFUSÉ ce build le ${derniere.at.slice(0, 10)} (${derniere.by}).`, { autorisation: derniere });
  if (Date.parse(derniere.expires_at) < +now) return refuse(`L'autorisation G4 de ce build a expiré le ${derniere.expires_at.slice(0, 10)} — ${G4_VALIDITE_JOURS} jours. Refranchir G4.`, { autorisation: derniere });
  return grant({ autorisation: derniere, note: `G4 ${derniere.decision} par ${derniere.by}${derniere.second ? ` et ${derniere.second}` : ''}, jusqu'au ${derniere.expires_at.slice(0, 10)}.` });
}

/* ── 5 bis · consigner une direction humaine donnée hors gate ──────────────
   La tour consignait les décisions DE GATE. Les directions qui ont le plus réorienté un run
   réel — une seule plateforme, un seul dépôt, un canal de validation — n'étaient prises
   nulle part : elles vivaient dans la conversation, et la conversation était la mémoire du
   design. Elle se compacte, elle se perd, elle ne se rejoue pas. Une direction est donc
   consignée MOT POUR MOT, avec son test de budget — ce qui change ET ce qui reste
   inchangé : une direction sans son « inchangé » se lit plus large qu'elle n'a été dite. */
export const IMPACTS = ['AUCUN', 'PÉRIMÈTRE DE RELEASE', 'CANAL DE VALIDATION', 'PRODUIT', 'MÉTHODE'];
const liste = v => [].concat(v ?? []).map(x => String(x).trim()).filter(Boolean);

export function recordDirection(project, { by, verbatim, scope, impact, changes, unchanged } = {}) {
  if (!String(by || '').trim())
    return refuse('une direction est donnée par un humain nommé — « by » manque');
  if (!String(verbatim || '').trim())
    return refuse('une direction se consigne MOT POUR MOT — « verbatim » manque',
                  { pourquoi: "Une direction reformulée est une interprétation : c'est elle, et non la phrase dite, qui serait rejouée." });
  const imp = String(impact || '').trim().toUpperCase();
  if (!IMPACTS.includes(imp))
    return refuse(`impact produit non déclaré ou inconnu — ${impact ?? '(absent)'}`, { attendus: IMPACTS });
  const ch = liste(changes), un = liste(unchanged);
  if (!ch.length || !un.length)
    return refuse('test de budget incomplet : ce qui CHANGE et ce qui reste INCHANGÉ sont tous deux requis',
                  { changes: ch, unchanged: un });
  const st = loadState(project);
  st.directions = st.directions || [];
  const d = { id: `DIR-${String(st.directions.length + 1).padStart(2, '0')}`, by: String(by).trim(), verbatim: String(verbatim),
              scope: scope ? String(scope) : null, impact: imp, changes: ch, unchanged: un, at: new Date().toISOString() };
  st.directions.push(d);
  saveState(project, st, { event: 'DIRECTION_RECORDED', ...d });
  /* Une direction qui corrige la MÉTHODE n'est pas seulement une consigne pour ce run : c'est
     un constat sur la méthode, qui remonte par l'échelle d'évolution. */
  const obs = imp === 'MÉTHODE'
    ? recordObservation(project, { par: d.by, constat: d.verbatim, preuve: `direction ${d.id}`, concerne: scope || null })
    : null;
  return grant({ direction: d.id, ...(obs?.observation ? { observation: obs.observation } : {}),
    note: imp === 'PRODUIT'
      ? "Impact PRODUIT : la direction est consignée, mais elle appelle une décision formelle — ADR, ou gate si elle touche ce qu'une gate a figé. Ne pas construire dessus avant."
      : 'Consignée au Run Ledger. Agir dessus maintenant ; elle se relit au prochain « apf tower factory_state ».' });
}

/* ── 5 bis · un constat sur la MÉTHODE ─────────────────────────────────────
   L'échelle d'évolution (method_evolution) commence ici : un constat daté, sourcé, sans
   effet sur la méthode. Il ne devient une méthode proposée que par une MCR, et une règle
   que si un défaut prouvé la justifie. Une observation ne change rien à elle seule : c'est
   ce qui la distingue d'une initiative. */
export function recordObservation(project, { par, constat, preuve, concerne, proposition } = {}) {
  if (!String(par || '').trim()) return refuse('une observation a un auteur — « par » manque');
  if (!String(constat || '').trim()) return refuse('une observation dit ce qui a été constaté — « constat » manque');
  if (!String(preuve || '').trim())
    return refuse('une observation sans preuve est une opinion — « preuve » manque (fichier, commit, direction, verdict)');
  const st = loadState(project);
  st.observations = st.observations || [];
  const o = { id: `OBS-${String(st.observations.length + 1).padStart(2, '0')}`, par: String(par).trim(), constat: String(constat),
              preuve: String(preuve), concerne: concerne ? String(concerne) : null, proposition: proposition ? String(proposition) : null,
              niveau: 'OBSERVATION', at: new Date().toISOString() };
  st.observations.push(o);
  saveState(project, st, { event: 'METHOD_OBSERVATION', ...o });
  return grant({ observation: o.id,
    note: "Constat consigné, SANS effet sur la méthode. Il remonte au Launchpad avec ceux des autres projets ; une MCR le transforme en méthode proposée, jamais un agent en cours d'activité." });
}

/* ── 5 ter · le résumé d'ouverture de session ──────────────────────────────
   Une session reprise reconstruisait l'état depuis sa mémoire, ou ne le reconstruisait pas.
   Le résumé est CALCULÉ depuis runs/tower.json : activité ouverte et ce qui lui manque,
   dernière gate, dernière direction, réserves ouvertes, prochaine action. Il ne dit que ce
   que la tour sait — les BLOCKER vivent dans les verdicts de revue, il ne les compte pas.
   Rien d'ouvert : null, et la session s'ouvre sans résumé. */
export function brief(project) {
  if (!existsSync(S(project))) return null;
  const r = registry(), st = loadState(project);
  const last = new Map();
  for (const d of st.declared || []) last.set(d.work_product, d);
  const open = st.opened[st.opened.length - 1] || null;
  const a = open ? byId(r.activities, open.activity) : null;
  const manquants = a ? (a.work_products || []).filter(w => last.get(w)?.completion !== 'complet') : [];
  const cleared = Object.entries(st.gates || {}).filter(([, g]) => g.status === 'CLEARED').sort((x, y) => String(x[1].at).localeCompare(String(y[1].at)));
  const gate = cleared[cleared.length - 1];
  const dir = (st.directions || [])[(st.directions || []).length - 1];
  const reserves = [...last.values()].filter(d => d.completion === 'partiel').map(d => `${d.work_product} (${(d.reserves || []).length})`);
  /* La prochaine action se déduit de l'activité ouverte : ses livrables d'abord, puis la gate
     qui les contrôle — K1 et G3 se redemandent à chaque slice —, puis l'activité suivante. Sans
     activité ouverte, la première gate de cadence non franchie. */
  const PAR_SLICE = new Set(['K1', 'G3']);
  const gateDe = a ? (a.work_products || []).map(w => String(byId(r.work_products, w)?.controlled_at || '').split(/\s/)[0]).find(g => byId(r.gates, g)) : null;
  const suivante = a ? r.activities[r.activities.findIndex(x => x.id === a.id) + 1] : null;
  const premiereGate = r.cadences.flatMap(c => (c.gates || []).filter(g => g !== 'K1')).find(g => st.gates?.[g]?.status !== 'CLEARED');
  const demander = g => `demander la gate ${g} — apf tower factory_request_gate '{"gate":"${g}"}'`;
  const next = a && manquants.length ? `activité ${a.id} — ${a.name} : déclarer ${manquants.join(', ')} (« complet » ou « partiel » avec réserves)`
    : a && gateDe && (PAR_SLICE.has(gateDe) || st.gates?.[gateDe]?.status !== 'CLEARED') ? demander(gateDe)
    : a && suivante ? `ouvrir l'activité ${suivante.id} — ${suivante.name}`
    : premiereGate ? demander(premiereGate) : 'aucune gate ouverte';
  return [
    `État du run ${st.run || '(non ouvert)'} — calculé par la tour depuis runs/tower.json, à relire par « apf tower factory_state » :`,
    `- Activité ouverte : ${a ? `${a.id} — ${a.name}${manquants.length ? ` · à déclarer complets : ${manquants.join(', ')}` : ' · livrables déclarés complets'}` : 'aucune'}`,
    `- Dernière gate franchie : ${gate ? `${gate[0]} par ${gate[1].by}${gate[1].at ? `, ${String(gate[1].at).slice(0, 10)}` : ''}` : 'aucune'}`,
    `- Dernière direction humaine : ${dir ? `${dir.id}, ${dir.by}, ${dir.at.slice(0, 10)} — « ${dir.verbatim.slice(0, 160)}${dir.verbatim.length > 160 ? '…' : ''} » · impact ${dir.impact}` : 'aucune consignée'}`,
    `- Réserves ouvertes : ${reserves.length ? reserves.join(', ') : 'aucune'}`,
    `- Prochaine action : ${next}`,
    ...(() => {
      /* Ce qui attend l'humain, à l'ouverture de la session : il le voit avant de demander. */
      const att = (st.decisions || []).filter(d => d.statut === 'EN_ATTENTE');
      if (!att.length && !st.autopilote?.actif) return [];
      const n = t => att.filter(d => d.type === t).length, bl = att.filter(d => d.bloquante).length;
      return [`- Vous attendent : ${n('critique')} critique(s) à trier (/factory-tri), ${n('arbitrage')} arbitrage(s)${bl ? `, ${bl} décision(s) bloquante(s)` : ''} · les boucles : apf tableau`];
    })(),
    ...(() => {
      /* L'ACCUEIL : une activité menée en conversation (skill à conduite) et pas encore
         produite s'ouvre au premier message du porteur, quel qu'il soit — il arrive pour
         répondre, pas pour lancer une commande. */
      const sk = a ? (r.skills || []).find(s => s.conduite && String(a.skill || '').split(',').map(x => x.trim()).includes(s.id)) : null;
      if (!sk || !manquants.length) return [];
      return [`- Accueil : au premier message du porteur (« factory start », « bonjour »…), sauf s'il demande autre chose, ouvrir l'${a.name.toLowerCase()} avec le skill ${sk.id} — une phrase d'accueil, puis sa Question 1, une seule, avec la réponse recommandée. Ne pas demander s'il veut commencer.`];
    })(),
    '- Les BLOCKER ne sont pas tenus par la tour : les lire dans les verdicts de revue avant de conclure qu\'il n\'y en a aucun.',
  ].join('\n');
}

/* ── 6 · geler un socle : G0 seulement ─────────────────────────────────── */
export function freezeBaseline(project, { baseline, elements, human }) {
  const st = loadState(project);
  if (st.gates.G0?.status === 'CLEARED')
    return refuse('G0 est franchie : un CORE INVARIANT ne se gèle plus après le gate — il se modifie par exception EX déclarée.');
  /* Sous autopilote, factory-lead gèle à TITRE PROVISOIRE, sous la délégation du run : rien
     n'est irréversible avant G0, qui ratifie (MCR-002). Hors autopilote, un humain nommé. */
  const provisoire = !human && st.autopilote?.actif;
  if (!human && !provisoire) return refuse('le gel d\'un socle est une décision humaine — nommez la personne qui tranche');
  const par = human || `factory-lead (${st.autopilote.delegation})`;
  st.baselines[baseline] = { elements: elements || [], by: par, at: new Date().toISOString(), ...(provisoire ? { provisoire: true } : {}) };
  const dec = provisoire ? ajouterDecision(st, { type: 'gel', activite: st.opened?.at(-1)?.activity ?? null, objet: `Gel provisoire du socle « ${baseline} »`,
    options: ['Ratifier le gel', 'Rouvrir le socle'], choix_applique: 'Ratifier le gel', rayon: 7, par }) : null;
  saveState(project, st, { event: 'BASELINE_FROZEN', baseline, count: (elements || []).length, by: par, ...(dec ? { provisoire: true, decision: dec.id } : {}) });
  return grant({ baseline, frozen: (elements || []).length, ...(dec ? { provisoire: true, decision: dec.id } : {}) });
}

/* ── 7 · contrôles ─────────────────────────────────────────────────────── */
export function check(project) {
  const results = runAll(loadProject(project));
  const vend = vendorFindings();
  return {
    ok: !results.some(c => c.status === 'FAIL') && !vend.length,
    controls: results.map(c => ({ id: c.id, name: c.name, status: c.status, detail: c.detail, findings: c.findings })),
    vendor: vend
  };
}

/* ── 8 · résoudre un skill, externe compris ────────────────────────────── */
export function resolveSkill(id) {
  const r = registry();
  const s = byId(r.skills, id);
  if (!s) return refuse(`skill inconnu — ${id}`);
  const vend = vendorFindings().filter(x => x.includes(id));
  return grant({
    id: s.id, origin: s.origin, mandate: s.mandate,
    path: s.origin === 'external' ? s.vendor_path : `skills/${s.id}`,
    shipped_with_plugin: true,
    integrity: s.origin === 'external' ? (vend.length ? 'DÉRIVE' : 'CONFORME AU COMMIT ÉPINGLÉ') : 'GÉNÉRÉ DEPUIS LE REGISTRE',
    findings: vend
  });
}

/** Table des opérations — source unique pour le serveur MCP et pour la CLI. */
const RAW_OPERATIONS = [
  { name: 'factory_state',           fn: (p) => state(p),                   args: [],                                        desc: "Où en est le run : activité courante, gates franchies, socles gelés, cadences atteignables." },
  { name: 'factory_open_activity',   fn: openActivity,                      args: ['activity', 'actor', 'tier', 'reprise', 'express'], desc: "Ouvre une activité et rend son fragment compilé, sa frontière d'écriture, son critère de sortie, les réserves ouvertes qui lui sont routées et le routage de ses rôles — modèle et effort de chaque porteur et de chaque critic dans le contexte (cadence, tier, réouverture, chemin EXPRESS). Unique source du fragment : refuse si une gate antérieure est ouverte ou si le rôle ne correspond pas." },
  { name: 'factory_route',           fn: route,                             args: ['agent', 'activity', 'tier', 'reprise', 'express'], desc: "Le modèle et l'effort d'un rôle de la méthode dans le contexte de l'activité ouverte, ou dans celui donné, avec les modulations appliquées et leur motif (R6). Constat, jamais décision." },
  { name: 'factory_declare',         fn: declare,                           args: ['activity', 'work_product', 'path', 'evidence', 'completion', 'reserves', 'instance'], desc: "Déclare un livrable produit. Refuse un livrable étranger à l'activité, un chemin hors frontière, une complétude tacite, et un « complet » dont la forme ne l'est pas — fichiers, front-matter, un H2 par section du registre." },
  { name: 'factory_request_gate',    fn: requestGate,                       args: ['gate'],                                  desc: "Constate l'état d'une gate : pack, livrables manquants, contrôles en échec. Constat, jamais décision." },
  { name: 'factory_clear_gate',      fn: clearGate,                         args: ['gate', 'human', 'decision', 'build', 'tier', 'second'], desc: "Franchit une gate. Exige un pack complet, zéro contrôle en échec, et une autorité humaine nommée. G4 exige en plus le build autorisé (commit ou empreinte acceptés en QA), une décision AUTORISER · AUTORISER AVEC DÉPLOIEMENT PROGRESSIF · REFUSER, et en tier R3 une seconde autorité distincte ; elle vaut 7 jours." },
  { name: 'factory_release_check',   fn: releaseCheck,                      args: ['build'],                                 desc: "Ce build peut-il partir en production ? Relu par le workflow de mise en production avant tout déploiement : G4 franchie pour CE build, décision d'autoriser, dans sa validité. Constat, jamais décision." },
  { name: 'factory_record_observation', fn: recordObservation,              args: ['par', 'constat', 'preuve', 'concerne', 'proposition'], desc: "Consigne un CONSTAT sur la méthode — ce qui a manqué, coûté ou trompé —, daté et prouvé, au premier niveau de l'échelle d'évolution. Sans effet sur la méthode : seule une MCR en fait une méthode proposée." },
  { name: 'factory_record_direction', fn: recordDirection,                  args: ['by', 'verbatim', 'scope', 'impact', 'changes', 'unchanged'], desc: "Consigne une direction humaine donnée hors gate, mot pour mot, avec ce qui change, ce qui reste inchangé et son impact produit — AUCUN · PÉRIMÈTRE DE RELEASE · CANAL DE VALIDATION · PRODUIT. La mémoire d'un run ne vit jamais dans la conversation." },
  { name: 'factory_freeze_baseline', fn: freezeBaseline,                   args: ['baseline', 'elements', 'human'],         desc: "Gèle un socle en CORE INVARIANT. Refusé après G0." },
  { name: 'factory_check',           fn: (p) => check(p),                   args: [],                                        desc: "Exécute les huit contrôles déterministes et l'intégrité du vendoring." },
  { name: 'factory_resolve_skill',   fn: (p, a) => resolveSkill(a.id),      args: ['id'],                                    desc: "Résout un skill vers son chemin livré et son verdict d'intégrité — externe compris." },
  { name: 'factory_derive_model',    fn: (p) => log(p, 'MODEL_DERIVED', composeModel(p)),         args: [], desc: "Dérive le modèle de données du schéma exécuté et le lie au glossaire. Rend la liste des champs non résolus : un champ sans terme de glossaire est une dérive sémantique que K4 refuse." },
  { name: 'factory_compose_prototype', fn: (p) => log(p, 'PROTOTYPE_COMPOSED', composePrototype(p)), args: [], desc: "Recompose le prototype vivant — socle ⊕ deltas de release ⊕ deltas de sprint, dans l'ordre. Rend les écrans non subordonnés et les étapes devenues inatteignables." },
  { name: 'factory_workspace_plan',  fn: (p) => pullProjection(p, 'factory_workspace_plan') || (workspacePlan(p)), args: [], desc: "Rend le PLAN de l'espace de travail lisible, calculé depuis le registre. Le nom du produit se LIT dans l'identité recueillie à l'activité 1 — il ne se passe pas en argument : un produit nommé depuis une ligne de commande est nommé hors de toute activité, donc hors gouvernance." },
  { name: 'factory_workspace_link',  fn: (p, a) => pullProjection(p, 'factory_workspace_link') || (log(p, 'WORKSPACE_LINKED', notionLink(p, a))), args: ['work_product', 'url'], desc: "Relie un livrable produit à sa page dans l'espace de travail. Le pointeur est bidirectionnel : la page porte en retour le chemin et le commit." },
  { name: 'factory_workspace_sync',   fn: (p, a) => pullProjection(p, 'factory_workspace_sync') || (log(p, 'WORKSPACE_SYNCED', notionSync(p, a))), args: ['work_product'], desc: "Date la projection d'un livrable au commit courant, APRÈS avoir écrit la page. Sans cette date, la page est reliée mais sa fraîcheur est invérifiable, et l'ouverture de l'activité suivante est refusée." },
  { name: 'factory_source_claim',    fn: (p, a) => claimFindings(a || {}), args: ['url', 'consulted_at', 'verbatim'], desc: "Une affirmation issue d'une recherche est-elle recevable ? Elle l'est si elle porte adresse, date et citation littérale — sinon elle est rétrogradée en UNVALIDATED et porte un HYP-nn. « J'ai cherché sur Internet » est aussi invérifiable qu'une invention, et plus confiant." },
  { name: 'factory_workspace_project', fn: (p) => projectRowBody(p), args: [], desc: "Le corps de la ligne de projet : étape courante, avancement de chaque étape, gates franchies. CALCULÉ depuis le journal — le statut de la ligne ne bouge qu'aux gates et laisserait le projet inerte pendant toute une cadence. Écrit dans le CORPS de la page, jamais dans une colonne : la base d'accueil appartient à l'organisation." },
  { name: 'factory_workspace_drift',  fn: (p) => workspaceDrift(p),          args: [],                                        desc: "Ce qui a été produit dans Git et n'a pas suivi dans l'espace de travail. Calculé HORS LIGNE par comparaison Git : la tour ne fait aucun appel au service tiers. Une dérive arrête une ACTIVITÉ, jamais une gate." },
  { name: 'factory_workspace_status', fn: (p) => pullProjection(p, 'factory_workspace_status') || (linkStatus(p)), args: [], desc: "Rapporte quels livrables sont reliés et lesquels ne le sont pas. RAPPORTE, ne refuse pas : l'espace de travail ne bloque jamais un gate." },
  { name: 'factory_workspace_where',  fn: (p, a) => pullProjection(p, 'factory_workspace_where') || (notionWhere(a?.work_product, p)), args: ['work_product'], desc: "Où va ce livrable dans l'espace de travail, et surtout : UPDATE ou CREATE. La ligne existe depuis le bootstrap — en créer une seconde donnerait deux pages pour un livrable, donc deux vérités." },
  { name: 'factory_autopilot_start',  fn: demarrer,                          args: ['par'],                                   desc: "Démarre l'autopilote de la cadence C1, au nom de la personne qui ratifiera en G0. La tour calcule ensuite chaque action ; le hook Stop refuse la fin de tour tant qu'il en reste une et que le run progresse." },
  { name: 'factory_autopilot_stop',   fn: arreter,                           args: ['raison', 'par'],                         desc: "Arrête l'autopilote. Rien n'est défait : l'état, les verdicts et la file de décisions restent." },
  { name: 'factory_next',             fn: (p) => prochaineAction(p),         args: [],                                        desc: "L'action suivante de l'autopilote : INTERROGER, OUVRIR, PRODUIRE, JUGER, REPRENDRE, CORRIGER, ou un arrêt — STOP_DECISION, STOP_G0. Avec, pour chaque rôle, le modèle et l'effort à passer à l'invocation. Constat, jamais décision." },
  { name: 'factory_record_verdict',   fn: enregistrerVerdict,                args: ['work_product', 'critic', 'path'],        desc: "Enregistre les critiques d'un critic, lues dans le fichier déposé : chaque CRIT-n — sévérité, recommandation — entre en file comme décision CRITIQUE que le porteur retient ou écarte, et la synthèse doit en donner le compte exact. Aucune critique : le livrable converge. Le critic ne tranche rien (MCR-004)." },
  { name: 'factory_queue_decision',   fn: mettreEnFile,                      args: ['type', 'activite', 'objet', 'question', 'options', 'bloquante', 'rayon', 'par'], desc: "Met en file une décision qui revient à l'humain. Bloquante — intention, irréversible, corpus réel — elle arrête l'autopilote ; sinon elle attend G0 sans l'arrêter." },
  { name: 'factory_answer_decision',  fn: repondre,                          args: ['id', 'by', 'choix', 'note'],             desc: "L'humain tranche une décision de la file, nommément. Tranchée autrement que le défaut appliqué, elle rouvre l'activité qui l'avait appliqué. Le Launchpad dépose la même réponse en fichier, ingéré à l'action suivante." },
  { name: 'factory_autopilot_resume', fn: reprise,                           args: ['activite'],                              desc: "Sort de la file la reprise d'une décision tranchée autrement, une fois l'activité rouverte et ses livrables redéclarés, et rend l'action suivante." },
  { name: 'factory_autopilot_state',  fn: (p) => etatAutopilote(p),          args: [],                                        desc: "L'état de l'autopilote : actif ou non, file des décisions, boucles producteur ↔ critic, ce qui reste à ratifier et à trancher." },
  { name: 'factory_workspace_instance', fn: (p, a) => pullProjection(p, 'factory_workspace_instance') || (instancePlan(a?.kind, a?.instance)), args: ['kind', 'instance'], desc: "Crée les lignes d'une instance qui existe désormais — release, sprint ou version. Une release ne crée pas les lignes de ses sprints." }
];

/* LA COUTURE ENTRE LA TRACE ET LE LEDGER. Le ledger consigne ce qui est DÉCIDÉ, et lui
   seul est opposable. La trace veut en plus savoir QUAND la décision est tombée dans la
   session — sinon une suite d'appels d'outils flotte entre deux lignes de journal sans
   qu'on sache à quelle activité elle appartenait. Seules les opérations qui DÉCIDENT sont
   tracées : tracer les lectures noierait le signal sous l'état rafraîchi en boucle. */
const DECIDING = new Set(['factory_open_activity', 'factory_declare', 'factory_request_gate',
                          'factory_clear_gate', 'factory_record_direction', 'factory_record_observation', 'factory_freeze_baseline']);

/* L'ALIGNEMENT AVANT TOUTE OPÉRATION. Le dépôt est migré sur ce plugin avant d'être lu ou
   écrit — une session ouverte avant la synchronisation du launchpad ne mélange plus deux
   numérotations — et un plugin plus ancien que le dépôt refuse au lieu d'écrire ce qu'il
   lirait de travers. Les opérations sans dépôt (un skill à résoudre, une affirmation à
   juger) ne touchent à rien : elles passent. */
const SANS_DEPOT = new Set(['factory_resolve_skill', 'factory_source_claim']);
const aligne = o => SANS_DEPOT.has(o.name) ? o : {
  ...o,
  fn: (project, args) => {
    const a = aligner(project);
    if (!a.ok) return refuse(a.reason, { numerotation: { depot: a.depot, plugin: a.plugin } });
    return o.fn(project, args);
  },
};

export const OPERATIONS = RAW_OPERATIONS.map(aligne).map(o => !DECIDING.has(o.name) ? o : {
  ...o,
  fn: (project, args) => {
    const r = o.fn(project, args);
    try { traceTower(project, o.name, r); } catch { /* la trace n'arrête jamais la tour */ }
    return r;
  },
});

/* Les régénérations passent par la tour pour être JOURNALISÉES : un prototype recomposé
   sans trace ne dit pas de quel sprint il date, ce qui est exactement le défaut corrigé. */
function log(project, event, result) {
  const st = loadState(project);
  saveState(project, st, { event, ok: result.ok === true, detail: result.reason || null });
  return result;
}
