/* L'AUTOPILOTE DE LA CADENCE C1 (MCR-002).
 *
 * Avant G0, l'humain intervenait à chaque étape, pour trois raisons confondues :
 *   CONTINUATION  rien n'enchaînait une activité à la suivante — il tapait « continue » ;
 *   VALIDATION    la boucle producteur ↔ critic était écrite au registre et exécutée par rien ;
 *   DÉCISION      ce qui lui revient vraiment.
 * Ce module supprime les deux premières. Il CALCULE l'action suivante depuis l'état de la tour
 * — ouvrir, produire, juger, reprendre, corriger, s'arrêter — et le hook Stop du harness refuse
 * la fin de tour tant qu'il reste une action et que le run progresse. La troisième entre en file
 * (lib/decisions.mjs) : l'humain y répond quand il veut, et ratifie en G0.
 *
 * Ce que l'autopilote ne fait JAMAIS : décider à la place de l'humain sur son intention, sur un
 * arbitrage de fond, sur le corpus réel ; franchir un gate ; présenter un verdict qu'il n'a pas
 * lu dans le fichier déposé. La convergence se lit dans le verdict du critic, pas dans le
 * compte rendu de l'orchestrateur. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, isAbsolute } from 'node:path';
import { registry, byId } from './registry.mjs';
import { loadState, saveState, constatGate } from './tower.mjs';
import { applies as wpApplies } from './conditions.mjs';
import { routage } from './routage.mjs';
import { ajouterDecision, ingererReponses, enAttente, bloquantes, aRatifier, trancher } from './decisions.mjs';

const conf = () => registry().autopilote || {};
const refuse = (reason, extra = {}) => ({ ...extra, ok: false, verdict: 'REFUSÉ', reason });
const grant = (extra = {}) => ({ ...extra, ok: true, verdict: 'ACCORDÉ' });
const porteurs = a => String(a.responsible).split(/ (?:et|puis) |·/).map(x => x.trim()).filter(Boolean);
const INSTANCES = () => (registry().agents.find(x => x.instances)?.instances || []);

/* ── démarrer, arrêter ─────────────────────────────────────────────────── */

export function demarrer(project, { par } = {}) {
  if (!par) return refuse("l'autopilote se démarre au nom d'une personne : « par » — c'est elle qui ratifiera en G0");
  const st = loadState(project);
  if (st.gates.G0?.status === 'CLEARED') return refuse('G0 est franchie : la cadence C1 est close, il n\'y a plus rien à piloter');
  st.autopilote = { actif: true, portee: conf().portee || 'C1', par, depuis: new Date().toISOString(),
    delegation: `DLG-${new Date().toISOString().slice(0, 10)}`, relances: 0, dernier_progres: null };
  saveState(project, st, { event: 'AUTOPILOT_STARTED', by: par, delegation: st.autopilote.delegation });
  return grant({ autopilote: st.autopilote, action: prochaineAction(project) });
}

export function arreter(project, { raison, par } = {}) {
  const st = loadState(project);
  if (!st.autopilote?.actif) return grant({ deja: true });
  st.autopilote.actif = false;
  st.autopilote.arret = { raison: raison || 'arrêt demandé', par: par || null, at: new Date().toISOString() };
  saveState(project, st, { event: 'AUTOPILOT_STOPPED', reason: st.autopilote.arret.raison, by: par || null });
  return grant({ autopilote: st.autopilote });
}

/* ── le critic d'un livrable ───────────────────────────────────────────── */

/** Le critic qui juge un livrable : celui que l'activité ou le critère de complétude nomme, à
 *  défaut celui de la dimension du producteur. null si le livrable n'en a pas. */
export function criticDe(wpId) {
  const r = registry(), c = conf().critics || {};
  if ((c.sans_critic || []).includes(wpId)) return null;
  const w = byId(r.work_products, wpId), a = w && byId(r.activities, w.activity);
  const texte = [a?.verification, a?.exit, w?.completion].join(' ');
  const nomme = /critic\(([\wéè-]+)\)/.exec(texte)?.[1];
  if (nomme) return INSTANCES().includes(nomme) ? `critic-${nomme}` : `critic(${nomme})`;
  for (const p of a ? porteurs(a) : []) if (c.par_producteur?.[p]) return c.par_producteur[p];
  return null;
}

/** Le critic de domaine que le projet a instancié à l'activité 3 (gabarit templates/
 *  domain-critic.md) : « critic-domain-<domaine> », dans .claude/agents/ du projet. */
export function agentDomaine(project) {
  const dir = join(project, '.claude', 'agents');
  if (!project || !existsSync(dir)) return null;
  return readdirSync(dir).filter(f => /^critic-domain-.+\.md$/.test(f)).sort()[0]?.replace(/\.md$/, '') || null;
}
/* « critic(domaine) » se porte par l'instance du projet : le même rôle sous son nom propre. */
const memeCritic = (qui, attendu) => qui === attendu || (attendu === 'critic(domaine)' && /^critic-domain-/.test(qui));

/* ── le verdict, lu dans le fichier déposé ─────────────────────────────── */

const SYNTHESE = /S[ÉE]V[ÉE]RIT[ÉE]S\s*[—–-]+\s*BLOCKER\s*:\s*(\d+)\s*[·|,]\s*MAJOR\s*:\s*(\d+)\s*[·|,]\s*MINOR\s*:\s*(\d+)/i;

/** La ligne de synthèse d'un verdict déposé — { blockers, majors, minors } ou null. */
export function lireSynthese(texte) {
  const m = SYNTHESE.exec(String(texte || ''));
  return m ? { blockers: +m[1], majors: +m[2], minors: +m[3] } : null;
}

/* LES CRITIQUES (MCR-004) : « ### CRIT-n — énoncé », puis Observé, Pourquoi, Sévérité,
   Recommandation. Le critic critique ; le porteur tranche. */
const BLOC_CRIT = /^#{2,4}\s*(CRIT-\d+)\s*[—–:-]+\s*(.+)$/gm;
export function lireCritiques(texte) {
  const t = String(texte || ''), out = [], heads = [...t.matchAll(BLOC_CRIT)];
  heads.forEach((h, i) => {
    const corps = t.slice(h.index + h[0].length, i + 1 < heads.length ? heads[i + 1].index : t.length);
    const champ = re => (re.exec(corps)?.[1] || '').trim();
    const reco = /Recommandation\s*:\s*(Retenir|[ÉE]carter)\b\s*[—–:,.-]?\s*(.*)/i.exec(corps);
    out.push({ id: h[1], titre: h[2].trim(), severite: champ(/S[ée]v[ée]rit[ée]\s*:\s*(BLOCKER|MAJOR|MINOR)/i).toUpperCase() || null,
      observe: champ(/Observ[ée]\s*:\s*(.+)/i), pourquoi: champ(/Pourquoi\s*:\s*(.+)/i),
      recommandation: reco ? (/^r/i.test(reco[1]) ? 'Retenir' : 'Écarter') : null, motif: reco?.[2]?.trim() || '' });
  });
  return out;
}
const RAYON = { BLOCKER: 9, MAJOR: 6, MINOR: 3 };

export function enregistrerVerdict(project, { work_product, critic, path }) {
  const r = registry();
  const w = byId(r.work_products, work_product);
  if (!w) return refuse(`livrable inconnu — ${work_product}`);
  const attendu = criticDe(work_product);
  if (!attendu) return refuse(`${work_product} n'a pas de critic sous l'autopilote`);
  const qui = String(critic || '').split(':').pop();
  if (!memeCritic(qui, attendu)) return refuse(`${work_product} est critiqué par ${attendu}, pas par ${critic}`);
  if (!path) return refuse('« path » absent : les critiques se déposent telles quelles avant d\'être enregistrées');
  const rel = (isAbsolute(path) ? relative(project, path) : path).split('\\').join('/');
  if (!rel.startsWith(`runs/reviews/${work_product}/`)) return refuse(`dépôt attendu sous runs/reviews/${work_product}/ — reçu ${rel}`);
  const f = join(project, rel);
  if (!existsSync(f)) return refuse(`critiques introuvables : ${rel} — déposer d'abord ce que le critic a rendu`);
  const texte = readFileSync(f, 'utf8');
  const syn = lireSynthese(texte);
  if (!syn) return refuse(`${rel} : ligne de synthèse absente — « SÉVÉRITÉS — BLOCKER: n · MAJOR: n · MINOR: n ».`);
  const crits = lireCritiques(texte);
  if (!crits.length && /NOT_VALIDATED/.test(texte)) return refuse(`${rel} : NOT_VALIDATED — le critic n'a pas pu lire l'artefact. Corriger ce qui lui est remis, puis le relancer.`);
  const compte = k => crits.filter(c => c.severite === k).length;
  if (compte('BLOCKER') !== syn.blockers || compte('MAJOR') !== syn.majors || compte('MINOR') !== syn.minors || crits.length !== syn.blockers + syn.majors + syn.minors)
    return refuse(`${rel} : la synthèse annonce ${syn.blockers}/${syn.majors}/${syn.minors}, les CRIT-n en portent ${compte('BLOCKER')}/${compte('MAJOR')}/${compte('MINOR')} sur ${crits.length} — un compte qui ne correspond pas est refusé`);
  const incompletes = crits.filter(c => !c.severite || !c.recommandation).map(c => c.id);
  if (incompletes.length) return refuse(`${rel} : ${incompletes.join(', ')} sans sévérité ou sans recommandation (Retenir / Écarter)`);

  const st = loadState(project);
  st.boucles ||= {};
  const b = st.boucles[work_product] ||= { critic: attendu, tours: [], statut: 'À_TRIER' };
  const n = b.tours.length + 1;
  /* chaque critique devient une décision du porteur : il la retient ou l'écarte */
  const decs = crits.map(c => ajouterDecision(st, { type: 'critique', activite: w.activity, work_product,
    objet: `${work_product} · r${n} · ${c.id} — ${c.titre}`,
    question: [c.observe, c.pourquoi].filter(Boolean).join(' — ').slice(0, 400) || c.titre,
    options: ['Retenir', 'Écarter'], recommandation: `${c.recommandation}${c.motif ? ` — ${c.motif}` : ''}`,
    rayon: RAYON[c.severite], positions: [rel], par: attendu }));
  b.tours.push({ n, path: rel, ...syn, critiques: decs.map(d => d.id), at: new Date().toISOString() });
  b.statut = decs.length ? 'À_TRIER' : 'CONVERGÉ';
  saveState(project, st, { event: 'VERDICT_RECORDED', work_product, critic: attendu, ...(qui !== attendu ? { par: qui } : {}), round: n,
    blockers: syn.blockers, majors: syn.majors, minors: syn.minors, statut: b.statut, critiques: decs.map(d => d.id) });
  return grant({ work_product, tour: n, ...syn, statut: b.statut, critiques: decs.map(d => ({ id: d.id, objet: d.objet, recommandation: d.recommandation })) });
}

/* ── les délégations, appliquées à l'ouverture ─────────────────────────── */

/** Sous autopilote, ouvrir une activité qui porte une délégation la met en file, appliquée par
 *  défaut. Appelée par la tour à l'ouverture ; rend les décisions déléguées de l'activité. */
export function deleguerALOuverture(st, a) {
  if (!st.autopilote?.actif) return [];
  return (conf().delegations || []).filter(d => String(d.activite) === String(a.id)).map(d => {
    const options = d.depart ? (a.point_de_depart?.options || []) : ['Valider', 'Reprendre'];
    return ajouterDecision(st, { type: d.depart ? 'depart' : 'revue', activite: a.id, objet: d.objet,
      question: d.depart ? a.point_de_depart?.question : d.objet, options,
      choix_applique: String(options[0] ?? 'Valider').split(/\s+—\s+/)[0], rayon: d.rayon, par: `factory-lead (${st.autopilote.delegation})` });
  });
}

/** Les réserves d'un livrable semé par défaut deviennent des décisions DÉLÉGUÉES : le défaut
 *  reste appliqué, le porteur le revoit quand il veut et le ratifie en G0. Sous autopilote
 *  seulement ; rend les décisions ajoutées. */
export function deleguerReserves(project, { activite, work_product, reserves = [] }) {
  const st = loadState(project);
  if (!st.autopilote?.actif || !reserves.length) return [];
  const out = reserves.map(q => ajouterDecision(st, { type: 'revue', activite, work_product, objet: `${work_product} · ${q}`,
    question: `${q} — le défaut du socle est appliqué. Le garder ?`, options: ['Valider', 'Reprendre'], choix_applique: 'Valider',
    rayon: 6, par: `factory-lead (${st.autopilote.delegation || 'socle'})` }));
  saveState(project, st, { event: 'RESERVES_DELEGATED', work_product, decisions: out.map(d => d.id) });
  return out;
}

/* ── l'action suivante ─────────────────────────────────────────────────── */

const derniereDecl = (st, wp) => [...(st.declared || [])].reverse().find(d => d.work_product === wp);
/* Un livrable partiel dont chaque réserve est DÉLÉGUÉE — le défaut appliqué, ratifié en G0 —
   ne retient pas la boucle : c'est le cas du socle semé à la création du projet. Tranchée
   autrement, la délégation rouvre l'activité (reprise), comme toute délégation. */
const delegue = (st, wp) => {
  const ds = (st.decisions || []).filter(d => d.work_product === wp && d.type === 'revue' && d.choix_applique != null);
  return ds.length > 0 && ds.every(d => d.statut === 'DÉLÉGUÉE' || d.statut === 'RATIFIÉE' || (d.statut === 'TRANCHÉE' && String(d.choix) === String(d.choix_applique)));
};
const complet = (st, wp) => { const d = derniereDecl(st, wp); return d?.completion === 'complet' || (d?.completion === 'partiel' && delegue(st, wp)); };
const avecConduite = a => {
  const ids = String(a.skill || '').split(',').map(x => x.trim());
  return (registry().skills || []).some(s => ids.includes(s.id) && s.conduite);
};
const route = (st, id) => {
  const x = routage(String(id).split(':').pop(), st.routage || {});
  return x ? { role: id, model: x.modele, effort: x.effort_adaptateur } : { role: id };
};

/**
 * L'action que l'autopilote doit exécuter maintenant. { type, … } — type parmi :
 *   INACTIF · INTERROGER · OUVRIR · PRODUIRE · JUGER · REPRENDRE · REPRENDRE_DECISION ·
 *   GATE · CORRIGER · STOP_DECISION · STOP_G0.
 * « leger » ne rejoue pas les contrôles du gate : c'est ce qu'appelle le hook Stop.
 * Ingère les réponses déposées par le Launchpad ; n'écrit rien d'autre.
 */
export function prochaineAction(project, { leger = false, ingerer = true } = {}) {
  const r = registry(), sat = conf().satisfaction || {};
  const st = loadState(project);
  /* « ingerer: false » : lecture seule — le Launchpad montre l'état sans le modifier */
  if (ingerer && ingererReponses(project, st)) saveState(project, st, { event: 'DECISIONS_INGESTED' });
  if (!st.autopilote?.actif) return { type: 'INACTIF', note: "factory_autopilot_start pour démarrer — l'humain reste au-dessus de la boucle." };
  const portee = st.autopilote.portee || 'C1';

  if (st.reprises?.length) {
    const p = st.reprises[0];
    return { type: 'REPRENDRE_DECISION', activite: p.activite, decision: p.decision, choix: p.choix,
      consigne: `L'humain a tranché ${p.decision} autrement que le défaut appliqué : rouvrir l'activité ${p.activite}, appliquer « ${p.choix} », redéclarer ses livrables, puis factory_autopilot_resume.` };
  }
  const bloq = bloquantes(st);
  if (bloq.length) return { type: 'STOP_DECISION', decisions: bloq.map(d => ({ id: d.id, objet: d.objet, question: d.question, options: d.options })),
    consigne: "Une décision que seul l'humain peut prendre : l'exposer, une question à la fois, et attendre. Rien ne la remplace." };

  /* Les critiques en attente de tri ne bloquent pas les livrables suivants : elles s'accumulent,
     et le porteur les trie à la fin de chaque étape de C1 où il en reste (MCR-004). */
  const aTrier = [];
  const stopTri = () => ({ type: 'STOP_TRI', critiques: aTrier.map(({ d }) => ({ id: d.id, objet: d.objet, question: d.question,
      recommandation: d.recommandation, rayon: d.rayon, depot: d.positions?.[0] || null })).sort((x, y) => y.rayon - x.rayon),
    consigne: "Trier les critiques avec grill-me (le skill route vers grilling) : une critique par question, sa recommandation en premier et son motif ; le porteur répond Retenir ou Écarter. Consigner chaque réponse : factory_answer_decision {id, by, choix}. Puis reprendre la boucle." });

  for (const a of r.activities.filter(x => x.cadence === portee)) {
    if (aTrier.some(x => x.etape !== a.step)) return stopTri();
    const wps = (a.work_products || []).filter(w => wpApplies(project, w).applies);
    const ouverte = (st.opened || []).some(o => String(o.activity) === String(a.id));
    const faits = wps.filter(w => complet(st, w));
    if (avecConduite(a) && faits.length < wps.length)
      return { type: 'INTERROGER', activite: a.id, nom: a.name, ouvrir: !ouverte, work_products: wps.filter(w => !complet(st, w)),
        consigne: "L'intention se recueille avec l'humain, dans cette conversation, une question à la fois. L'autopilote reprend quand ses livrables sont déclarés complets." };
    if (!ouverte) return { type: 'OUVRIR', activite: a.id, nom: a.name,
      appel: { op: 'factory_open_activity', args: { activity: a.id, actor: porteurs(a)[0] } } };
    const manquants = wps.filter(w => !complet(st, w));
    if (manquants.length) return { type: 'PRODUIRE', activite: a.id, nom: a.name, work_products: manquants,
      roles: porteurs(a).map(p => route(st, p)),
      depart: a.point_de_depart ? (st.decisions || []).find(d => d.type === 'depart' && String(d.activite) === String(a.id))?.id || null : null,
      consigne: "Invoquer chaque porteur avec son model et son effort ; il produit à partir du fragment de l'activité et déclare chaque livrable (factory_declare). Une décision manquante qui n'est que de l'information devient une HYP-nn ; une décision que seul l'humain peut prendre entre en file : factory_queue_decision, bloquante." };
    for (const w of wps) {
      const critic = criticDe(w);
      if (!critic) continue;
      const b = st.boucles?.[w];
      const agent = critic === 'critic(domaine)' ? agentDomaine(project) : critic;
      const qui = agent || critic, aInstancier = critic === 'critic(domaine)' && !agent
        ? " Aucun critic de domaine n'est instancié dans .claude/agents/ : l'instancier d'abord depuis le gabarit templates/domain-critic.md (activité 3)." : '';
      if (!b?.tours?.length) return { type: 'JUGER', activite: a.id, work_product: w, tour: 1, critic: { ...route(st, critic), agent: qui },
        depot: `runs/reviews/${w}/${critic.replace(/[()]/g, '-').replace(/-$/, '')}-r1.md`,
        consigne: `Invoquer ${qui} sur ${w} : au plus sept critiques au format CRIT-n, chacune avec sa recommandation. Déposer sa sortie TELLE QUELLE au chemin indiqué, puis factory_record_verdict (critic : ${qui}). Le critic ne tranche rien : le porteur triera.${aInstancier}` };
      if (b.statut === 'CONVERGÉ' || b.statut === 'ARBITRAGE') continue;
      const dernier = b.tours.at(-1);
      /* un tour enregistré avant MCR-004 n'a pas de critiques à trier : ses constats ne sont
         ni triés ni repris. Il ne vaut pas satisfaction — on recritique, au format CRIT-n. */
      if (!Array.isArray(dernier.critiques)) {
        const n = b.tours.length + 1;
        return { type: 'JUGER', activite: a.id, work_product: w, tour: n, critic: { ...route(st, critic), agent: qui },
          depot: `runs/reviews/${w}/${critic.replace(/[()]/g, '-').replace(/-$/, '')}-r${n}.md`,
          consigne: `Le tour ${dernier.n} de ${w} date d'avant MCR-004 : ses constats n'ont été ni triés ni repris. Invoquer ${qui} sur ${w} tel qu'il est : au plus sept critiques CRIT-n avec recommandation, déposées telles quelles au chemin indiqué, puis factory_record_verdict. Le porteur triera.` };
      }
      const decs = (st.decisions || []).filter(d => (dernier.critiques || []).includes(d.id));
      const attente = decs.filter(d => d.statut === 'EN_ATTENTE');
      if (attente.length) { aTrier.push(...attente.map(d => ({ d, etape: a.step }))); continue; }
      const retenues = decs.filter(d => /^retenir/i.test(String(d.choix || '')));
      if (!retenues.length) continue;
      const trie = Math.max(...decs.map(d => Date.parse(d.tranchee_le || d.at || 0)));
      if (Date.parse(derniereDecl(st, w)?.at || 0) > trie) continue;
      return { type: 'REPRENDRE', activite: a.id, work_product: w, critiques: retenues.map(d => ({ id: d.id, objet: d.objet, note: d.note || null })),
        roles: porteurs(a).map(p => route(st, p)),
        consigne: `Reprendre ${w} sur les seules critiques que le porteur a retenues, puis le redéclarer complet. Les critiques écartées ne se traitent pas.` };
    }
  }
  if (aTrier.length) return stopTri();

  if (leger) return { type: 'GATE', gate: 'G0', consigne: 'Toutes les activités de C1 sont satisfaites : constater G0 (factory_next).' };
  const c = constatGate(project, { gate: 'G0' });
  if (c.work_products_missing?.length || c.controls_failed?.length)
    return { type: 'CORRIGER', gate: 'G0', manquants: c.work_products_missing, controles: c.controls_failed,
      consigne: 'Le pack de G0 n\'est pas prêt : traiter chaque manque et chaque contrôle en échec, dans l\'activité qui le porte.' };
  const att = enAttente(st);
  return { type: 'STOP_G0', gate: 'G0', pret: !att.length,
    a_trancher: att.map(d => ({ id: d.id, type: d.type, objet: d.objet, question: d.question, options: d.options, positions: d.positions })),
    a_ratifier: c.a_ratifier || [], a_ratifier_au_dela: c.a_ratifier_au_dela || 0,
    consigne: att.length
      ? "Avant G0, l'humain tranche chaque arbitrage (factory_answer_decision ou le Launchpad). Puis il franchit G0, qui ratifie les décisions déléguées."
      : "Le pack de G0 est prêt. L'humain ratifie les décisions déléguées et franchit G0 — l'autopilote ne franchit jamais un gate." };
}

/* ── le hook Stop : la fin de tour refusée tant que le run progresse ───── */

const lignesJournal = project => {
  const f = join(project, 'runs', 'ledger.ndjson');
  return existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).length : 0;
};
const LAISSE_FINIR = new Set(['INACTIF', 'INTERROGER', 'STOP_DECISION', 'STOP_TRI', 'STOP_G0']);

/** Le verdict du hook Stop. { bloquer: bool, raison } — bloquer refuse la fin de tour. */
export function decisionStop(project) {
  const st = loadState(project);
  if (!st.autopilote?.actif) return { bloquer: false, raison: 'autopilote inactif' };
  const a = prochaineAction(project, { leger: true });
  if (LAISSE_FINIR.has(a.type)) return { bloquer: false, raison: `${a.type} : la main revient à l'humain` };
  const max = conf().relance?.max_relances || 200, n = lignesJournal(project);
  const s2 = loadState(project);
  if (s2.autopilote.dernier_progres === n) {
    s2.autopilote.calages = (s2.autopilote.calages || 0) + 1;
    saveState(project, s2, { event: 'AUTOPILOT_STALLED', action: a.type, activity: a.activite ?? null });
    return { bloquer: false, raison: `aucun progrès depuis la dernière relance (${a.type}) : arrêt, pas de relance à vide` };
  }
  if ((s2.autopilote.relances || 0) >= max) return { bloquer: false, raison: `budget de relances atteint (${max})` };
  s2.autopilote.relances = (s2.autopilote.relances || 0) + 1;
  s2.autopilote.dernier_progres = n;
  saveState(project, s2);
  const quoi = a.activite != null ? ` — activité ${a.activite}${a.work_product ? `, ${a.work_product}` : ''}` : '';
  return { bloquer: true, raison: `Autopilote actif : action suivante ${a.type}${quoi}. ${a.consigne ? `${a.consigne} ` : ''}Exécuter « apf tower factory_next » et poursuivre ; ne rendre la main qu'à un arrêt (STOP_*, INTERROGER).` };
}

/* ── l'état, pour la tour et le Launchpad ──────────────────────────────── */

export function etatAutopilote(project, { lectureSeule = false } = {}) {
  const st = loadState(project);
  const dir = join(project, 'runs', 'decisions');
  const deposees = existsSync(dir) ? readdirSync(dir).filter(f => /\.reponse\.ya?ml$/.test(f) && !(st.reponses_ingerees || []).includes(f))
    .map(f => f.replace(/\.reponse\.ya?ml$/, '')) : [];
  const action = st.autopilote?.actif ? prochaineAction(project, { leger: true, ingerer: !lectureSeule }) : null;
  return { autopilote: st.autopilote || null, decisions: st.decisions || [], boucles: st.boucles || {},
    a_ratifier: aRatifier(st).map(d => d.id), en_attente: enAttente(st).map(d => d.id), reponses_deposees: deposees,
    action: action ? { type: action.type, activite: action.activite ?? null, work_product: action.work_product ?? null } : null };
}

/** factory_answer_decision : l'humain tranche depuis la conversation. */
export function repondre(project, { id, by, choix, note }) {
  const st = loadState(project);
  const v = trancher(st, { id, by, choix, note });
  if (!v.ok) return refuse(v.raison);
  if (!v.deja) saveState(project, st, { event: 'DECISION_ANSWERED', decision: id, by, choice: String(choix), reopens: !!v.reprise });
  return grant({ decision: v.decision, rouvre: !!v.reprise });
}

/** factory_queue_decision : un agent met en file ce que seul l'humain peut trancher. */
export function mettreEnFile(project, { type, activite, objet, question, options, bloquante, rayon, par }) {
  if (!objet) return refuse('« objet » absent : une décision dit ce qu\'elle tranche');
  const st = loadState(project);
  const d = ajouterDecision(st, { type: type || (bloquante ? 'bloquante' : 'arbitrage'), activite, objet, question, options, bloquante, rayon, par });
  saveState(project, st, { event: 'DECISION_QUEUED', decision: d.id, type: d.type, bloquante: d.bloquante });
  return grant({ decision: d });
}

/** factory_autopilot_resume : une reprise de décision traitée sort de la file. */
export function reprise(project, { activite } = {}) {
  const st = loadState(project);
  const avant = (st.reprises || []).length;
  /* sans activité nommée, la première reprise en file ; sinon, celles de l'activité nommée */
  st.reprises = activite == null ? (st.reprises || []).slice(1) : (st.reprises || []).filter(p => String(p.activite) !== String(activite));
  saveState(project, st, { event: 'AUTOPILOT_RESUMED', cleared: avant - st.reprises.length });
  return grant({ action: prochaineAction(project) });
}
