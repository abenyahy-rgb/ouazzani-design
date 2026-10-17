import { MODELES_PAR_CLASSE } from '../build/modeles.mjs';
import { ecartsDeRoutage } from './routage.mjs';
import { lireSynthese } from './autopilote.mjs';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { registry, ROOT } from './registry.mjs';
import { vendorFindings } from './vendor.mjs';
import { provenanceFindings } from './provenance.mjs';
import { planFindings } from './notion.mjs';
import { researchFindings } from './research.mjs';
import { responsibleRoles } from './registry.mjs';
import { templateFindings, checkArtifactForm } from './templates.mjs';
import { controlerCampagne, SUX_SOCLE } from './sux.mjs';
import { formeControles } from './controles-projet.mjs';
import { couvertureActeurs } from './acteurs.mjs';
/* La table des outils de connecteur, importée depuis son module dédié — jamais depuis
   le générateur, qui écrit des fichiers dès son chargement. */
import { WORKSPACE_TOOLS } from '../build/harness-tools.mjs';
export { loadProject } from './project.mjs';

/* Un nom de champ qui a l'allure d'une donnée personnelle (K4, propriété des données). */
const DONNEE_PERSONNELLE = /(^|_)(e?mail|courriel|phone|telephone|tel|mobile|birth|naissance|first_?name|last_?name|prenom|nom|surname|full_?name|address|adresse|iban|ssn|passport|passeport|gps|latitude|longitude|ip_?address|avatar|photo)($|_)/i;

/* Les huit contrôles déterministes. Liste CLOSE : non extensible sans MCR.
 *
 * scope 'method'  — vérifiable sur le registre seul, donc exécutable dès aujourd'hui
 *                   dans ce dépôt et en intégration continue.
 * scope 'project' — exige une arborescence product/ instanciée. L'algorithme est écrit ;
 *                   sans instance, le contrôle rend SKIPPED et ne peut jamais rendre PASS
 *                   par défaut : un contrôle qui passe faute de données est un mensonge. */

const ok   = (id, n, msg)  => ({ id, name: n, status: 'PASS',    detail: msg, findings: [] });
const fail = (id, n, f)    => ({ id, name: n, status: 'FAIL',    detail: `${f.length} défaut(s)`, findings: f });
const skip = (id, n, why)  => ({ id, name: n, status: 'SKIPPED', detail: why, findings: [] });
const res  = (id, n, f, m) => f.length ? fail(id, n, f) : ok(id, n, m);

const EVALUATORS = ['critic(·)', 'conformance-auditor'];
/* Les blocs de définition d'un agent. « rules » est le métier du rôle : un agent qui ne sait
   que son périmètre ne sait pas bien faire son travail. */
const AGENT_BLOCKS = ['capability_class', 'mandate', 'write_boundary', 'separation_of_duties', 'activities', 'rules'];

/* LES CAMPAGNES SUX, REJOUÉES SUR LEURS OCTETS (MCR-001). Celle du socle, avant G0, et celle
   de chaque release, en validation : une campagne présente qui viole le protocole — pare-feu,
   candidat, vocabulaire, interaction réelle, patterns, étiquetage — fait échouer le pack.
   Une campagne ABSENTE n'est pas un constat ici : c'est la gate qui réclame son livrable. */
function campagnesSux(root, f) {
  const dirs = [SUX_SOCLE];
  const rel = join(root, 'product', 'releases');
  if (existsSync(rel)) for (const r of readdirSync(rel)) dirs.push(`releases/${r}/research/tests/sux/`);
  let n = 0;
  for (const d of dirs) {
    const socle = d === SUX_SOCLE;
    const c = controlerCampagne(root, d, socle ? null : { commit: null, fichier: null });
    if (!c.presente) continue;
    n++;
    for (const x of c.findings) f.push(`${x.id} : ${x.texte}`);
  }
  return n ? ` · ${n} campagne(s) SUX rejouée(s)` : '';
}

/* LA FORME DES CONTRÔLES DU PROJET — vérifiée ici sans rien exécuter : K7 tourne aussi dans
   le Launchpad, sur un instantané du dépôt, où le code d'un projet ne s'exécute jamais. */
function formeDesControles(root, f) {
  const c = formeControles(root);
  if (!c.present) return '';
  for (const x of c.findings) f.push(`contrôle du projet : ${x}`);
  return ` · ${c.controles || 0} contrôle(s) du projet déclaré(s)`;
}

const g0Franchie = root => {
  try { return JSON.parse(readFileSync(join(root, 'runs', 'tower.json'), 'utf8')).gates?.G0?.status === 'CLEARED'; } catch { return false; }
};

export const CHECKS = {

  /* ── K1 · couverture du squelette ──────────────────────────────────── */
  K1: (proj) => {
    const n = 'Couverture du squelette';
    if (!proj) return skip('K1', n, "aucune arborescence product/ — exige STG et REL instanciés");
    const f = [];
    for (const [stg, links] of Object.entries(proj.stageLinks || {})) {
      const intro = links.filter(l => l.type === 'INTRODUCES');
      if (intro.length !== 1) f.push(`${stg} porte ${intro.length} lien INTRODUCES, il en faut exactement 1`);
      const introSeq = intro.length ? proj.releaseOrder.indexOf(intro[0].release) : Infinity;
      for (const l of links.filter(l => l.type === 'DEPENDS-ON'))
        if (proj.releaseOrder.indexOf(l.release) < introSeq)
          f.push(`${stg} : ${l.release} en DEPENDS-ON précède la release qui introduit l'étape`);
      for (const l of links.filter(l => l.type === 'ENRICHES')) {
        if (!intro.length) f.push(`${stg} : ${l.release} ENRICHES une étape jamais introduite`);
        else if (proj.releaseOrder.indexOf(l.release) < introSeq)
          f.push(`${stg} : ${l.release} ENRICHES avant l'introduction de l'étape`);
      }
    }
    /* LES DEUX FAMILLES D'ACTEURS (MCR-006). Le squelette couvre le client ET chaque opérateur
       du canevas : un opérateur sans étape, ce sont ses écrans qui manqueront au socle. Avant
       G0, l'écart bloque ; après G0, il ne rouvre pas le gel en silence : il est rapporté, à
       traiter par la prochaine release ou une réouverture de G0 décidée par le porteur. */
    const c = proj.root ? couvertureActeurs(proj.root, proj.entities.filter(e => e.type === 'stage')) : { present: false, findings: [] };
    let apres = '';
    if (c.findings.length) {
      if (g0Franchie(proj.root)) apres = ` · ${c.findings.length} écart(s) d'acteurs rapporté(s) après G0, non bloquant(s) : ${c.findings.join(' ; ')}`;
      else f.push(...c.findings);
    }
    const fam = !c.present ? '' : !c.declare ? '' : c.operateurs.length ? ` · ${c.operateurs.length} opérateur(s) couvert(s) : ${c.operateurs.map(o => o.nom).join(', ')}` : ` · aucun opérateur, décidé`;
    return res('K1', n, f, `chaque étape porte exactement un INTRODUCES${fam}${apres}`);
  },

  /* ── K2 · intégrité du registre ────────────────────────────────────── */
  K2: () => {
    const r = registry(), n = 'Intégrité du registre', f = [];
    const seen = new Map();
    const VALID = /^[A-Za-z0-9_.{}\-]+(\/[A-Za-z0-9_.{}\-]+)*\/?$/;
    for (const w of r.work_products) {
      if (!w.activity) f.push(`${w.id} n'est produit par aucune activité`);
      if (w.base && !VALID.test(w.base)) f.push(`${w.id} : base non conforme — ${w.base}`);
      if (!(w.files || []).length) { f.push(`${w.id} : aucun fichier déclaré`); continue; }
      for (const file of w.files) {
        if (!VALID.test(file)) { f.push(`${w.id} : chemin non conforme — ${file}`); continue; }
        const full = (w.base || '') + file;
        if (seen.has(full)) f.push(`chemin revendiqué par ${seen.get(full)} et ${w.id} — ${full}`);
        else seen.set(full, w.id);
      }
    }
    /* Forme canonique : une slice appartient à une release, jamais au produit.
       Le chemin court slices/{id}/ est explicitement non normatif — et son aîné
       sprints/{id}/ avait survécu six fois tant que le champ était de la prose. */
    for (const w of r.work_products) {
      if (/^(slices|sprints)\//.test(w.base || ''))
        f.push(`${w.id} : chemin court non normatif — une slice vit sous releases/{release-id}/slices/{slice-id}/`);
      if (/^releases\/\{release-id\}\/slices\//.test(w.base || '') && !/\{slice-id\}/.test(w.base))
        f.push(`${w.id} : chemin de slice sans {slice-id}`);
      if (/\{sprint-id\}|\/sprints\//.test((w.base || '') + (w.files || []).join(' ')))
        f.push(`${w.id} : chemin de sprint — la boucle est désormais une boucle de slices : releases/{release-id}/slices/{slice-id}/`);
    }
    /* Les étapes sont une collection : leur libellé existe une fois. Toute référence
       doit résoudre, et un livrable est toujours classé dans l'étape de son activité —
       la duplication du libellé avait déjà produit deux variantes divergentes. */
    const steps = new Map((r.steps || []).map(s => [s.id, s]));
    if (!steps.size) f.push('aucune collection steps déclarée');
    for (const a of r.activities) {
      const s = steps.get(a.step);
      if (!s) f.push(`activité ${a.id} : étape inconnue — ${a.step}`);
      else if (s.cadence !== a.cadence) f.push(`activité ${a.id} : étape ${a.step} n'appartient pas à ${a.cadence}`);
    }
    const stepOfAct = new Map(r.activities.map(a => [String(a.id), a.step]));
    for (const w of r.work_products) {
      if (!steps.has(w.step)) { f.push(`${w.id} : étape inconnue — ${w.step}`); continue; }
      const expected = stepOfAct.get(String(w.activity));
      if (expected && expected !== w.step)
        f.push(`${w.id} : classé en ${w.step} alors que son activité ${w.activity} est en ${expected}`);
    }
    for (const s of steps.values())
      if (!r.activities.some(a => a.step === s.id)) f.push(`étape ${s.id} sans aucune activité`);

    /* Le skill d'une activité doit résoudre. « — » laissait croire qu'aucun outillage
       n'existait alors que l'obligation en désignait un : c'est ce qui rendait la
       chaîne illisible depuis l'activité. */
    const skills = new Map((r.skills || []).map(s => [s.id, s]));
    for (const a of r.activities) {
      for (const ref of String(a.skill || '').split(',').map(x => x.trim()).filter(x => x && x !== '—'))
        if (!skills.has(ref)) f.push(`activité ${a.id} : skill inconnu — ${ref}`);
    }
    for (const s of skills.values()) {
      if (s.origin === 'external') {
        const adopted = (r.external_capabilities?.adopted || []).some(c => c.id === s.capability);
        if (!adopted) f.push(`skill ${s.id} : externe sans capacité adoptée — ${s.capability}`);
        if (s.generated) f.push(`skill ${s.id} : externe marqué comme généré — un skill externe est copié verbatim, jamais régénéré`);
        if (s.vendored !== true) f.push(`skill ${s.id} : externe non vendoré — le plugin ne le livrerait pas`);
      } else if (s.generated === false) f.push(`skill ${s.id} : skill du noyau non généré`);
      if (!r.activities.some(a => String(a.skill || '').split(',').map(x => x.trim()).includes(s.id)))
        f.push(`skill ${s.id} : référencé par aucune activité`);
    }

    /* UNE ACTIVITÉ CITÉE PAR UN RÔLE OU UN SKILL EXISTE, et un rôle cite ce qu'il porte.
       Après une renumérotation, release-engineer disait encore intervenir « aux activités 24,
       25, 26 » d'un registre qui s'arrêtait à 23, et cinq rôles taisaient une activité qu'ils
       portaient : la description d'un agent est ce sur quoi le harness le choisit. Un numéro
       ou une plage doit résoudre vers une activité, un identifiant de gate vers une gate ; les
       mots (« tous les gates ») ne citent rien. */
    const actIds = new Set(r.activities.map(a => String(a.id)));
    const gateIds = new Set(r.gates.map(g => g.id));
    const cited = (who, s) => String(s ?? '').split(/,\s*/).map(x => x.trim()).filter(Boolean).flatMap(t => {
      const m = /^(\d+)\s*-\s*(\d+)$/.exec(t);
      if (m) return Array.from({ length: Math.max(0, +m[2] - +m[1] + 1) }, (_, i) => String(+m[1] + i));
      if (/^\d+$/.test(t)) return [t];
      if (/^[A-Z]\d+$/.test(t) && !gateIds.has(t)) f.push(`${who} cite ${t}, ni activité ni gate du registre`);
      return [];
    });
    const citedBy = new Map();
    for (const a of r.agents) {
      const own = cited(`rôle ${a.id}`, a.activities);
      citedBy.set(a.id, new Set(own));
      for (const n of own) if (!actIds.has(n)) f.push(`rôle ${a.id} cite l'activité ${n}, absente du registre`);
    }
    for (const s of r.skills || [])
      for (const n of cited(`skill ${s.id}`, s.activities))
        if (!actIds.has(n)) f.push(`skill ${s.id} cite l'activité ${n}, absente du registre`);
    for (const a of r.activities)
      for (const who of responsibleRoles(a.responsible || ''))
        if (citedBy.has(who) && citedBy.get(who).size && !citedBy.get(who).has(String(a.id)))
          f.push(`rôle ${who} porte l'activité ${a.id} sans la citer — sa description la tait`);

    const ids = new Set(r.work_products.map(w => w.id));
    for (const a of r.activities)
      for (const w of a.work_products)
        if (!ids.has(w)) f.push(`activité ${a.id} cite ${w}, absent du registre`);
    for (const w of r.work_products)
      if (!r.activities.some(a => a.work_products.includes(w.id)))
        f.push(`${w.id} n'est référencé par aucune activité`);
    /* L'ÉCHELLE D'ÉVOLUTION : chaque MCR déclarée a son document, un statut de l'échelle, et
       une ADOPTÉE porte son origine ; aucun document de MCR n'existe hors du registre. */
    const ev = r.method_evolution || {};
    const niveaux = new Set((ev.levels || []).map(l => l.id));
    const declares = new Set();
    for (const c of ev.changes || []) {
      declares.add(c.document);
      if (!niveaux.has(c.statut) || c.statut === 'OBSERVATION') f.push(`${c.id} : statut « ${c.statut} » hors de l'échelle — PROPOSÉE ou ADOPTÉE`);
      if (!c.document || !existsSync(join(ROOT, c.document))) f.push(`${c.id} : document ${c.document || '(absent)'} introuvable`);
      if (c.statut === 'ADOPTÉE' && !(c.origine || []).length) f.push(`${c.id} : ADOPTÉE sans origine — une règle porte les observations et les runs qui l'ont prouvée`);
    }
    const mcrDir = join(ROOT, 'core', 'mcr');
    if (existsSync(mcrDir)) for (const d of readdirSync(mcrDir).filter(x => x.endsWith('.md')))
      if (!declares.has(`core/mcr/${d}`)) f.push(`core/mcr/${d} : MCR hors registre — method_evolution.changes ne la déclare pas`);
    return res('K2', n, f, `${seen.size} chemins atomiques déclarés, chacun revendiqué une seule fois · ${(ev.changes || []).length} MCR à l'échelle d'évolution`);
  },

  /* ── K3 · chaîne de traçabilité ────────────────────────────────────── */
  K3: (proj) => {
    const n = 'Intégrité de la chaîne de traçabilité';
    if (!proj) return skip('K3', n, "aucune arborescence product/ — exige les entités instanciées");
    const f = [];
    for (const s of proj.stories || []) {
      if (!s.epic)    f.push(`${s.id} ne trace vers aucun Epic`);
      if (!s.journey) f.push(`${s.id} ne trace vers aucun parcours cible`);
      for (const ac of s.acs || [])
        if (ac.material && !(ac.evidence || []).length) f.push(`${ac.id} matériel sans evidence exécutée`);
    }
    return res('K3', n, f, 'aucune entité orpheline');
  },

  /* ── K4 · intégrité du socle ───────────────────────────────────────── */
  K4: (proj) => {
    const n = 'Intégrité du socle';
    if (!proj) return skip('K4', n, "aucune arborescence product/ — exige l'historique Git du dépôt hôte");
    const f = [];
    const frozen = proj.spine.filter(e => e.category === 'CORE INVARIANT');
    for (const e of frozen) {
      if (!e.frozen_at) f.push(`${e.id} : CORE INVARIANT sans gate de gel déclaré`);
      if (e.modified_in && e.modified_in !== 'C1')
        f.push(`${e.id} : modifié en cadence ${e.modified_in} — interdit hors C1 (EX3)`);
    }

    /* SOCLE DE DONNÉES. Le noyau sémantique est figé en G0 ; la couche dérivée vit.
       Ce qui rend la donnée contrôlable est la LIAISON : un champ qui n'atterrit sur
       aucun terme du glossaire est une dérive sémantique. Sans ce contrôle, le modèle
       ne survivait à G0 que sous forme d'un document décrivant le monde au jour du gate. */
    const bind = proj.binding;
    let nBound = 0;
    if (bind) {
      const terms = new Set(bind.glossary || []);
      const cats  = new Set(bind.truth_categories || []);
      for (const e of bind.entities || []) {
        for (const [fld, b] of Object.entries(e.fields || {})) {
          nBound++;
          const w = `${e.name}.${fld}`;
          if (!b?.term)  { f.push(`${w} : ne résout vers aucun terme du glossaire — dérive sémantique`); continue; }
          if (terms.size && !terms.has(b.term)) f.push(`${w} : terme « ${b.term} » absent du glossaire`);
          if (!b.truth)  f.push(`${w} : aucune catégorie de vérité`);
          else if (cats.size && !cats.has(b.truth)) f.push(`${w} : catégorie de vérité inconnue — ${b.truth}`);
          if (!['CORE INVARIANT', 'EXTENSION'].includes(b.classification))
            f.push(`${w} : non classé CORE INVARIANT ou EXTENSION`);
          if (b.classification === 'CORE INVARIANT' && b.modified_in && b.modified_in !== 'C1')
            f.push(`${w} : champ CORE INVARIANT modifié en ${b.modified_in} — interdit hors C1 (EX3)`);
        }
      }
      /* PROPRIÉTÉ DES DONNÉES PERSONNELLES. Une entité qui porte une donnée personnelle se
         rattache à son propriétaire — sinon ni l'accès, ni l'effacement, ni l'export ne savent
         à qui elle appartient, et c'est en revue d'ingénierie qu'on le découvre. Une entité
         dont un champ a l'allure d'une donnée personnelle doit le DÉCLARER (personal_data :
         true ou false) ; déclarée personnelle, elle nomme son owner, Entité.champ, résolu dans
         cette même table. */
      const champs = new Set((bind.entities || []).flatMap(e => Object.keys(e.fields || {}).map(x => `${e.name}.${x}`)));
      const noms = new Set((bind.entities || []).map(e => e.name));
      for (const e of bind.entities || []) {
        const suspects = Object.keys(e.fields || {}).filter(x => DONNEE_PERSONNELLE.test(x));
        if (e.personal_data === undefined && suspects.length)
          f.push(`${e.name} : ${suspects.slice(0, 3).join(', ')} — donnée personnelle probable ; déclarer personal_data (true ou false)`);
        if (e.personal_data === true) {
          if (!e.owner) f.push(`${e.name} : données personnelles sans propriétaire — owner: Entité.champ manquant`);
          else if (!champs.has(e.owner) && !noms.has(e.owner))
            f.push(`${e.name} : owner « ${e.owner} » ne résout vers aucune entité ni aucun champ de la table de liaison`);
        }
      }
      for (const m of bind.migrations || [])
        if (!m.story) f.push(`migration ${m.id} : orpheline — aucune story ne la motive, donc changement de socle non déclaré`);
    }

    /* PROTOTYPE VIVANT. Il est COMPOSÉ, donc sa conformité se prouve par recomposition :
       un écran qui ne trace ni vers une étape du socle ni vers un delta déclaré n'est
       pas une nouveauté, c'est un design non subordonné. Trois prototypes figés à trois
       niveaux ne disaient rien de l'état du produit au sprint N. */
    const comp = proj.composition;
    let nScreens = 0;
    if (comp) {
      if (!comp.spine_commit) f.push('prototype vivant : manifeste sans commit de socle — la composition n\'est pas reproductible');
      if (!comp.composed_at)  f.push('prototype vivant : manifeste non daté — impossible de savoir de quel sprint il date');
      const stages = new Set(proj.entities.filter(e => e.type === 'stage').map(e => e.id));
      const deltas = new Set((comp.deltas || []).map(d => d.id));
      if (comp.deltas && !comp.deltas.every((d, i) => (d.order ?? i) >= ((comp.deltas[i - 1]?.order) ?? -1)))
        f.push('prototype vivant : deltas non ordonnés — une composition non ordonnée n\'est pas déterministe');
      for (const sc of comp.screens || []) {
        nScreens++;
        const okStage = sc.stage && stages.has(sc.stage);
        const okDelta = sc.delta && deltas.has(sc.delta);
        if (!okStage && !okDelta)
          f.push(`prototype vivant : écran ${sc.id} non subordonné — ne trace ni vers une étape du socle ni vers un delta déclaré`);
      }
      for (const stg of stages)
        if (!(comp.screens || []).some(sc => sc.stage === stg))
          f.push(`prototype vivant : étape ${stg} inatteignable après composition — un delta a cassé le squelette`);
      if (comp.hand_edited) f.push('prototype vivant : édité à la main — il est composé, pas écrit ; une édition directe le rend faux dès la recomposition suivante');
    }

    if (!frozen.length && !bind && !comp)
      return skip('K4', n, 'aucun CORE INVARIANT, aucune liaison de données, aucun manifeste de composition');
    return res('K4', n, f, `${frozen.length} CORE INVARIANT figés en G0 · ${nBound} champs liés · ${nScreens} écrans composés`);
  },

  /* ── K5 · Builder ≠ Judge ──────────────────────────────────────────── */
  K5: () => {
    const r = registry(), n = 'Builder ≠ Judge', f = [];
    for (const a of r.activities) {
      if (!a.responsible || !a.accountable) { f.push(`activité ${a.id} : R ou A manquant`); continue; }
      if (a.responsible.trim() === a.accountable.trim())
        f.push(`activité ${a.id} : l'Accountable est son propre Responsible`);
      for (const e of EVALUATORS)
        if (a.accountable.includes(e) && a.responsible.includes(e))
          f.push(`activité ${a.id} : ${e} tient R et A simultanément`);
    }
    for (const w of r.work_products) {
      const ra = w.responsible_accountable || '';
      const [resp, acc] = ra.split('/').map(s => (s || '').trim());
      if (resp && acc && resp === acc) f.push(`${w.id} : R et A identiques (${resp})`);
    }
    return res('K5', n, f, `${r.activities.length} activités et ${r.work_products.length} livrables contrôlés`);
  },

  /* ── K6 · restriction d'outillage ──────────────────────────────────── */
  K6: (proj) => {
    const r = registry(), n = "Restriction d'outillage", f = [];
    const BLOCKS = AGENT_BLOCKS;
    const profiles = new Map((r.tools_profiles || []).map(p => [p.id, p]));
    if (!profiles.size) f.push("aucun profil d'outillage déclaré");

    for (const a of r.agents) {
      for (const b of BLOCKS) if (!a[b] || (Array.isArray(a[b]) && !a[b].length)) f.push(`agent ${a.id} : bloc « ${b} » absent`);
      if (!a.tools_profile) { f.push(`agent ${a.id} : aucun profil d'outillage`); continue; }
      if (!profiles.has(a.tools_profile)) { f.push(`agent ${a.id} : profil inconnu — ${a.tools_profile}`); continue; }
      const evaluator = /critic/.test(a.id) || a.id === 'conformance-auditor';
      if (evaluator && profiles.get(a.tools_profile).writes)
        f.push(`agent ${a.id} : évaluateur avec un profil qui autorise l'écriture — P2 devient une consigne`);
      if (a.id === 'quality-engineer' && !/EVIDENCE BOUNDARY/.test(a.write_boundary || ''))
        f.push('quality-engineer : evidence boundary non déclarée');
      /* Cinq critics identiques à un mot près rendaient des PASS sur deux propriétés
         vérifiées sur trois : chaque instance porte les contrôles de SON domaine. */
      for (const i of a.instances || [])
        if (!(a.instance_checks?.[i] || []).length) f.push(`agent ${a.id} : instance ${i} sans contrôles du domaine`);
      for (const k of Object.keys(a.instance_checks || {}))
        if (!(a.instances || []).includes(k)) f.push(`agent ${a.id} : contrôles du domaine « ${k} » pour une instance inexistante`);
      const prof = profiles.get(a.tools_profile);
      if (prof.executes && prof.writes !== false)
        f.push(`profil ${prof.id} : « executes » ne restreint que les profils sans écriture — ailleurs, Bash est déjà entier`);
      for (const x of prof.executes || [])
        if (!/^apf(:\*)?$/.test(x)) f.push(`profil ${prof.id} : exécution « ${x} » hors des commandes de contrôle de la méthode`);
    }

    /* LE CONTRAT D'ENTRÉE ET LE RAPPORT DE RETOUR D'UN SOUS-AGENT (MCR-003). Chaque profil
       porté par un agent a son contrat d'entrée : un rôle qui écrit s'arrête sur BLOCKED ou
       procède sous UNVALIDATED ; un rôle sans écriture rend NOT_VALIDATED. Un texte commun
       disait à un critic de « poser une salve de questions » — ce qu'aucun juge ne fait et
       qu'aucun sous-agent ne peut faire. */
    const H = r.handover || {};
    const entree = id => H.agent_entry?.[id] || [];
    for (const id of new Set(r.agents.map(a => a.tools_profile).filter(x => profiles.has(x)))) {
      const e = entree(id), txt = e.join(' ');
      if (!e.length) { f.push(`profil ${id} : contrat d'entrée absent — handover.agent_entry.${id}`); continue; }
      if (profiles.get(id).writes === false) {
        if (!/NOT_VALIDATED/.test(txt)) f.push(`profil ${id} : un rôle sans écriture rend NOT_VALIDATED sur un input absent — son contrat d'entrée ne le dit pas`);
      } else if (!/BLOCKED — input manquant/.test(txt) || !/UNVALIDATED/.test(txt))
        f.push(`profil ${id} : le contrat d'entrée d'un rôle qui écrit nomme BLOCKED — input manquant et UNVALIDATED`);
    }
    if (!(H.return_format?.items || []).length) f.push('handover.return_format : aucun item — un sous-agent rendrait la main sans rapport structuré');

    /* L'adaptateur est une projection : ce que le harness applique doit correspondre au
       registre. Un fichier d'agent édité à la main rendrait la restriction fictive. */
    const dir = join(ROOT, 'agents');
    if (existsSync(dir)) {
      const expected = new Set();
      for (const a of r.agents)
        (a.instances ?? [null]).forEach(i => expected.add((i ? `critic-${i}` : a.id) + '.md'));
      const found = new Set(readdirSync(dir).filter(x => x.endsWith('.md')));
      for (const e of expected) if (!found.has(e)) f.push(`adaptateur : ${e} manquant — lancer npm run adapter`);
      for (const g of found) if (!expected.has(g)) f.push(`adaptateur : ${g} n'existe pas au registre`);
      for (const g of found) {
        const head = readFileSync(join(dir, g), 'utf8').split('---')[1] || '';
        const tools = /tools:\s*(.+)/.exec(head)?.[1] ?? '';
        /* Un évaluateur ne doit déclarer AUCUN outil d'écriture — natif ou de
           connecteur. Ne surveiller que Write, Edit et NotebookEdit laissait passer
           l'écriture dans l'espace de travail : un critic aurait pu modifier ce qu'il
           juge, et le contrôle n'aurait rien vu. Les motifs de connecteur viennent de
           l'adaptateur, jamais du registre. */
        if (/^critic-|^conformance-auditor/.test(g)) {
          if (/\b(Write|Edit|NotebookEdit)\b/.test(tools))
            f.push(`adaptateur : ${g} déclare un outil d'écriture alors que son rôle est évaluateur`);
          const w = (WORKSPACE_TOOLS?.write || []).filter(t => tools.includes(t));
          if (w.length)
            f.push(`adaptateur : ${g} déclare un outil d'ÉCRITURE de connecteur — ${w.join(', ')} — alors que son rôle est évaluateur`);
          /* Bash NU écrit n'importe où : un évaluateur ne le reçoit que restreint à apf. */
          for (const b of tools.split(',').map(x => x.trim()).filter(x => /^Bash\b/.test(x)))
            if (!/^Bash\(apf(:\*)?\)$/.test(b))
              f.push(`adaptateur : ${g} déclare ${b} — un évaluateur n'exécute que apf, jamais une commande quelconque`);
        }
        /* Les règles déclarées au registre doivent être RENDUES : un bloc qui n'atteint pas le
           fichier que le harness charge est une règle que personne ne lit. */
        const body = readFileSync(join(dir, g), 'utf8');
        const id = g.replace(/\.md$/, '');
        const ag = r.agents.find(a => a.id === id || (a.instances || []).some(i => `critic-${i}` === id));
        if (ag?.rules?.length && !body.includes('## Règles de travail'))
          f.push(`adaptateur : ${g} ne rend pas ses règles de travail — lancer npm run adapter`);
        if (ag?.instances && !body.includes('## Contrôles du domaine'))
          f.push(`adaptateur : ${g} ne rend pas ses contrôles du domaine — lancer npm run adapter`);
        if (ag && entree(ag.tools_profile).some(x => !body.includes(x)))
          f.push(`adaptateur : ${g} ne rend pas le contrat d'entrée de son profil — lancer npm run adapter`);
        /* Un juge ne reçoit jamais le contrat d'un producteur : il y lirait « procéder sous
           hypothèses », et un verdict sous hypothèse n'est pas un verdict. */
        if (ag && profiles.get(ag.tools_profile)?.writes === false)
          for (const [id, e] of Object.entries(H.agent_entry || {}))
            if (profiles.get(id)?.writes !== false && e.some(x => body.includes(x)))
              f.push(`adaptateur : ${g} rend le contrat d'entrée du profil ${id} alors que son rôle est évaluateur`);
        if (ag && H.return_format?.items?.length && (!body.includes('## Format de retour') || H.return_format.items.some(x => !body.includes(x))))
          f.push(`adaptateur : ${g} ne rend pas le format de retour — lancer npm run adapter`);
      }
    } else f.push("adaptateur : agents/ absent — le plugin n'expose aucun rôle");

    /* Une obligation qui cite un outillage doit citer une CAPACITÉ DÉCLARÉE, jamais une
       périphrase. C'est ce contrôle qui manquait : le registre a porté pendant plusieurs
       commits la mention « adopté et épinglé au registre des capacités » alors que ce
       registre n'existait plus, et rien ne l'a vu. */
    const ext = r.external_capabilities || {};
    /* Les capacités NATIVES du harness sont des capacités : les omettre ici obligeait à
       sauter les références « harness-* » sur leur préfixe, ce qui laissait passer toute
       référence pendante ainsi nommée. Le test du registre l'exigeait déjà. */
    const known = new Map([...(ext.adopted || []), ...(ext.rejected || []), ...(ext.harness_native || [])].map(c => [c.id, c]));
    const rejected = new Set((ext.rejected || []).map(c => c.id));
    const sources = new Set((ext.sources || []).map(s => s.id));
    for (const c of ext.adopted || []) {
      if (!sources.has(c.source)) f.push(`capacité ${c.id} : source inconnue — ${c.source}`);
      if (!c.gate) f.push(`capacité ${c.id} : niveau de porte d'adoption non déclaré`);
      if (!c.audit?.verdict) f.push(`capacité ${c.id} : adoptée sans verdict d'audit`);
    }
    for (const s of ext.sources || [])
      if (!/^[0-9a-f]{40}$/.test(s.pinned_commit || '')) f.push(`source ${s.id} : version non épinglée`);
    for (const o of r.adapter_obligations || []) {
      if (!o.capability) { f.push(`obligation « ${o.obligation.slice(0, 50)}… » : outillage cité sans identifiant de capacité`); continue; }
      /* Une capacité native du harness reste une capacité : la sauter sur son PRÉFIXE
         laissait passer toute référence pendante qu'on nommait « harness-quelque-chose ».
         Elle doit être déclarée en harness_native comme les autres le sont ailleurs — le
         test du registre l'exigeait déjà, ce contrôle ne le voyait pas. */
      if (!known.has(o.capability)) f.push(`obligation : capacité ${o.capability} absente du registre — référence pendante`);
      else if (rejected.has(o.capability)) f.push(`obligation : capacité ${o.capability} est REJETÉE et pourtant référencée`);
    }

    /* Un skill externe est LIVRÉ avec le plugin, donc copié. Une copie non contrôlée
       serait une seconde source de vérité : l'empreinte de chaque fichier vendoré est
       recalculée ici et confrontée au registre. Un octet modifié fait échouer K6. */
    f.push(...vendorFindings());

    /* Même famille que le vendoring — le déclaré confronté au réel, une marche plus haut :
       le plugin EXÉCUTÉ est-il bien celui que le dépôt produit épingle ? Se rabattre sur un
       autre exemplaire est légitime ; le faire en silence ne l'est pas. */
    f.push(...provenanceFindings(proj?.root || process.env.CLAUDE_PROJECT_DIR || process.cwd()));

    /* Le PLAN de l'espace de travail est calculé hors ligne : il est donc vérifiable
       comme n'importe quelle projection. Ce qui n'est PAS contrôlé ici, délibérément :
       l'état réel de l'espace distant. Y adosser un contrôle mettrait un service tiers
       sur le chemin critique de la gouvernance — « apf notion status » rapporte. */
    f.push(...planFindings());

    /* LE PORTEUR D'UNE ACTIVITÉ DOIT SE RÉSOUDRE VERS UN AGENT DÉCLARÉ. Sans ce contrôle,
       une activité dont le champ « responsible » ne résout vers personne est INOUVRABLE et
       rien ne le dit : la tour refuse, et son refus ressemble à une séparation des rôles qui
       fonctionne. C'est exactement ce qui s'est produit sur neuf activités. */
    for (const a of r.activities) {
      if (!a.responsible) continue;
      if (!responsibleRoles(a.responsible).length)
        f.push(`activité ${a.id} : « ${a.responsible} » ne résout vers aucun agent déclaré — l'activité est inouvrable`);
    }

    /* UNE CAPACITÉ D'ACCÈS À L'EXTÉRIEUR EST UNE RESTRICTION D'OUTILLAGE, donc K6. Elle est
       accordée à des ACTIVITÉS et jamais à des rôles — un même rôle cherche légitimement en
       activité 3 et abusivement en activité 20, où chercher sert à justifier ce qu'on vient
       d'écrire. Le déclaré est confronté au réel dans les deux sens. */
    f.push(...researchFindings());

    /* La tour de contrôle expose des opérations ; le manifeste doit la déclarer, sinon
       aucun agent ne l'atteint et la jonction agents ↔ étapes n'existe pas. */
    const mf = join(ROOT, '.claude-plugin/plugin.json');
    if (existsSync(mf)) {
      const m = JSON.parse(readFileSync(mf, 'utf8'));
      const srv = m.mcpServers?.['factory-control-tower'];
      if (!srv) f.push('plugin.json : tour de contrôle non déclarée — aucun agent ne peut ouvrir une activité');
      else if (!JSON.stringify(srv.args || []).includes('mcp/server.mjs'))
        f.push('plugin.json : la tour de contrôle ne pointe pas sur mcp/server.mjs');
      if (!existsSync(join(ROOT, 'mcp/server.mjs'))) f.push('mcp/server.mjs absent — la tour est déclarée mais introuvable');
      const declared = (r.control_tower?.operations || []).map(o => o.name).sort();
      if (declared.length) {
        const src = readFileSync(join(ROOT, 'lib/tower.mjs'), 'utf8');
        const shipped = [...src.matchAll(/name: '(factory_[a-z_]+)'/g)].map(x => x[1]).sort();
        for (const o of declared) if (!shipped.includes(o)) f.push(`tour : opération ${o} déclarée au registre, absente du serveur`);
        for (const o of shipped) if (!declared.includes(o)) f.push(`tour : opération ${o} servie sans être déclarée au registre`);
      } else f.push('registre : la tour de contrôle ne déclare aucune opération');
    }

    /* ARBORESCENCE. Un dossier que le harness découvre sans que le registre le connaisse
       est une capacité hors gouvernance ; un dossier déclaré et absent est une promesse
       non tenue. Les deux sont refusés ici. */
    const L = r.plugin_layout;
    let nTk = 0, nExt = 0;
    if (!L) f.push('registre : aucune arborescence de plugin déclarée');
    else {
      for (const d of L.directories || []) {
        const abs = join(ROOT, d.path.replace(/\{[^}]+\}.*$/, ''));
        if (!existsSync(abs)) { f.push(`arborescence : ${d.path} déclaré au registre, absent du dépôt`); continue; }
        if (d.path === 'skills/{id}/references/')
          for (const sk of r.skills.filter(x => x.origin === 'core'))
            if (!existsSync(join(ROOT, 'skills', sk.id, 'references')))
              f.push(`arborescence : skills/${sk.id}/references/ absent — SKILL.md porterait tout le détail`);
      }
      const known = new Set((L.directories || []).map(d => d.path.split('/')[0]));
      for (const d of ['agents', 'skills', 'commands', 'hooks', 'templates', 'vendor', 'mcp', 'core'])
        if (existsSync(join(ROOT, d)) && !known.has(d))
          f.push(`arborescence : ${d}/ existe et découvrable, inconnu du registre — capacité hors gouvernance`);

      /* PLAFOND DE CONTEXTE. Un SKILL.md est chargé dès que le skill est retenu : au-delà
         du plafond il facture son détail à toute activité qui le touche. C'est le contrôle
         qui a manqué le plus longtemps — cinq skills le dépassaient sans que rien ne le dise. */
      const cap = L.context_budget?.skill_md_tokens ?? 2000;
      const tokensOf = file => Math.round(Buffer.byteLength(readFileSync(file)) / 3.6);
      for (const sk of r.skills.filter(x => x.origin === 'core')) {
        const file = join(ROOT, 'skills', sk.id, 'SKILL.md');
        if (!existsSync(file)) { f.push(`skill ${sk.id} : SKILL.md absent`); continue; }
        const tk = tokensOf(file);
        nTk = Math.max(nTk, tk);
        if (tk > cap) f.push(`skill ${sk.id} : SKILL.md ≈ ${tk} tokens, plafond ${cap} — descendre le détail en references/`);
      }

      /* UN SKILL.MD EXTERNE EST CHARGÉ EXACTEMENT COMME CELUI DU NOYAU : le plafond s'y
         applique aussi. Le contrôle ne regardait que les skills du noyau — un skill externe
         pouvait donc facturer n'importe quel volume sans que rien ne le dise, et c'est
         précisément le trou qu'avait le plafond avant qu'il n'existe, une famille plus loin.
         Un externe ne peut pas être découpé : la copie est verbatim, et redescendre son
         détail en references/ serait un fork. Le dépassement est donc LÉGAL À UNE CONDITION —
         la capacité adoptée DÉCLARE son coût, chiffré et motivé. Le silence redevient un
         défaut, et une montée de version qui alourdit le fichier fait échouer le contrôle
         au lieu de passer inaperçue. */
      for (const sk of r.skills.filter(x => x.origin === 'external' && x.vendor_path)) {
        const file = join(ROOT, sk.vendor_path, 'SKILL.md');
        if (!existsSync(file)) continue;            // absence déjà rapportée par le vendoring
        const tk = tokensOf(file);
        nExt = Math.max(nExt, tk);
        if (tk <= cap) continue;
        const cost = (ext.adopted || []).find(c => c.id === sk.capability)?.context_cost;
        if (!cost)
          f.push(`skill ${sk.id} : SKILL.md externe ≈ ${tk} tokens, plafond ${cap}, aucun coût de contexte déclaré — un dépassement non déclaré est facturé en silence`);
        else if (cost.skill_md_tokens !== tk)
          f.push(`capacité ${sk.capability} : coût de contexte déclaré ${cost.skill_md_tokens} tokens, mesuré ${tk} — le déclaré a dérivé du réel`);
        else if (!cost.accepted_because)
          f.push(`capacité ${sk.capability} : coût de contexte chiffré sans motif d'acceptation — un chiffre sans motif n'est pas une décision`);
      }
    }

    /* Le manifeste de marketplace est ce qui rend le plugin INSTALLABLE. Il redéclare
       le nom et la version : deux valeurs écrites deux fois sans contrôle ont déjà
       divergé ailleurs dans ce dépôt. */
    const mkt = join(ROOT, '.claude-plugin/marketplace.json');
    if (!existsSync(mkt)) f.push("marketplace : .claude-plugin/marketplace.json absent — le plugin n'est pas installable");
    else if (existsSync(mf)) {
      const M = JSON.parse(readFileSync(mkt, 'utf8'));
      const P = JSON.parse(readFileSync(mf, 'utf8'));
      const e = (M.plugins || []).find(x => x.name === P.name);
      if (!M.name || !M.owner?.name) f.push('marketplace : nom ou propriétaire absent');
      if (!e) f.push(`marketplace : ne publie pas le plugin ${P.name}`);
      else {
        if (e.version !== P.version) f.push(`marketplace : version ${e.version} contre ${P.version} au manifeste du plugin`);
        if (!e.source) f.push(`marketplace : ${e.name} sans source`);
      }
    }

    /* Le manifeste doit déclarer les hooks : la garde en boucle est le SEUL mécanisme
       capable d'arrêter une écriture avant qu'elle ait lieu. Non déclarée, elle n'existe pas. */
    if (existsSync(mf)) {
      const m = JSON.parse(readFileSync(mf, 'utf8'));
      if (!m.hooks) f.push('plugin.json : aucun hook déclaré — plus rien n\'arrête une écriture avant qu\'elle ait lieu');
      else if (!existsSync(join(ROOT, 'hooks/hooks.json'))) f.push('plugin.json : hooks déclarés, hooks/hooks.json absent');
      else {
        const h = JSON.parse(readFileSync(join(ROOT, 'hooks/hooks.json'), 'utf8'));
        const cmds = JSON.stringify(h);
        if (!/apf["'\\]*\s+guard/.test(cmds)) f.push('hooks : le hook n\'appelle pas « apf guard » — une règle vivrait alors dans le hook');
        if (!/CLAUDE_PLUGIN_ROOT/.test(cmds)) f.push('hooks : chemin non résolu depuis la racine du plugin');
      }
    }

    /* R1 — le juge n'est jamais sur une classe inférieure au producteur. Contrôlée ici
       plutôt que par un neuvième contrôle : la liste est close, et R1 porte sur la classe
       de capacité d'un rôle, qui est le domaine de K6. */
    const RANK = ['ÉCONOMIQUE', 'INTERMÉDIAIRE', 'AVANCÉE', 'POINTE'];
    const parClasse = MODELES_PAR_CLASSE;
    /* Le rang d'un modèle : la plus haute classe où la table servie le déclare. */
    const MODEL_RANK = {};
    for (const [c, ms] of Object.entries(parClasse)) for (const m of ms || []) MODEL_RANK[m] = Math.max(MODEL_RANK[m] ?? -1, RANK.indexOf(c));
    const clsOf = id => r.agents.find(a => a.id === id)?.capability_class;
    let maxProd = -1;
    const modelesProd = new Set();
    for (const a of r.activities)
      for (const who of String(a.responsible).split(/ (?:et|puis) |·/).map(x => x.trim()))
        if (RANK.includes(clsOf(who))) { maxProd = Math.max(maxProd, RANK.indexOf(clsOf(who))); if (parClasse[clsOf(who)]?.[0]) modelesProd.add(parClasse[clsOf(who)][0]); }
    if (!Object.keys(MODEL_RANK).length) f.push('R1/R5 : table des modèles de l\'adaptateur vide (build/modeles.mjs)');
    if (existsSync(dir))
      for (const g of readdirSync(dir).filter(x => /^critic-/.test(x))) {
        const txt = readFileSync(join(dir, g), 'utf8');
        const model = /model:\s*(\S+)/.exec(txt)?.[1];
        if (MODEL_RANK[model] === undefined) { f.push(`R1 : ${g} déclare un modèle hors de la table servie — ${model}`); continue; }
        if (MODEL_RANK[model] < maxProd)
          f.push(`R1 : ${g} routé en ${model}, en dessous du producteur le plus élevé (${RANK[maxProd]}) — un juge plus faible que le builder ne voit pas ce que le builder a raté`);
        /* R5 — un juge sur le modèle d'un producteur doit le DIRE : son verdict est corrélé. */
        const declare = /Indépendance de modèle \(R5\) : (DISTINCT|CORRÉLÉ)/.exec(txt)?.[1];
        if (!declare) f.push(`R5 : ${g} ne déclare pas son indépendance de modèle`);
        else if (modelesProd.has(model) && declare !== 'CORRÉLÉ')
          f.push(`R5 : ${g} tourne sur ${model}, le modèle d'un producteur qu'il juge, sans se déclarer CORRÉLÉ — son verdict passerait pour indépendant`);
        else if (!modelesProd.has(model) && declare !== 'DISTINCT')
          f.push(`R5 : ${g} se déclare CORRÉLÉ sur ${model}, qu'aucun producteur n'emploie`);
      }

    /* R6 — la modulation s'applique : R1 et R5 tiennent dans TOUS les contextes qu'elle peut
       produire, et l'invocation des sous-agents passe par la garde. */
    f.push(...ecartsDeRoutage(r));
    if ((r.routing?.modulation || []).length && existsSync(join(ROOT, 'hooks/hooks.json'))) {
      const pre = JSON.parse(readFileSync(join(ROOT, 'hooks/hooks.json'), 'utf8')).hooks?.PreToolUse || [];
      if (!pre.some(h => /\bAgent\b/.test(h.matcher || '') && /apf["'\\]*\s+guard/.test(JSON.stringify(h.hooks))))
        f.push('R6 : aucun hook ne fait passer l\'invocation des sous-agents (Agent) par « apf guard » — la modulation resterait une consigne');
    }

    return res('K6', n, f, `${r.agents.length} rôles, ${profiles.size} profils, ${(L?.directories || []).length} dossiers déclarés, SKILL.md le plus lourd ≈ ${nTk} tk / ${L?.context_budget?.skill_md_tokens}, externe le plus lourd ≈ ${nExt} tk à coût déclaré · R1, R5 et R6 satisfaites sur tous les contextes · ${(ext.adopted||[]).length} capacités externes épinglées, tour à ${(r.control_tower?.operations||[]).length} opérations, espace de travail à ${(r.notion_workspace?.databases||[]).length} bases et ${(r.notion_workspace?.navigation?.fixed_nodes)} nœuds`);
  },

  /* ── K7 · complétude du pack de preuves ────────────────────────────── */
  K7: (proj) => {
    const r = registry(), n = 'Complétude du pack de preuves', f = [];
    for (const g of r.gates)
      if (!(g.evidence_pack || []).length) f.push(`gate ${g.id} : aucun pack de preuves déclaré`);
    for (const w of r.work_products) {
      if (!(w.sections || []).length) f.push(`${w.id} : aucun plan de contenu déclaré`);
      if (!w.completion)              f.push(`${w.id} : aucun critère de complétude`);
    }
    /* LES GABARITS SONT SUBORDONNÉS AU REGISTRE : un titre de section qui diverge est un
       défaut de méthode, pas une variante. Vérifié ici, sur le registre seul. */
    for (const x of templateFindings()) f.push(`gabarit : ${x}`);
    if (f.length) return fail('K7', n, f);
    if (!proj) return ok('K7', n, `structure vérifiée sur ${r.gates.length} gates et ${r.work_products.length} livrables, gabarits cohérents ; complétude d'un pack réel et forme des livrables : à l'instanciation`);
    for (const p of proj.packs || [])
      for (const el of (r.gates.find(g => g.id === p.gate)?.evidence_pack || []))
        if (!(p.present || []).includes(el)) f.push(`pack ${p.gate} : élément absent — ${el}`);

    /* FORME DES LIVRABLES DÉCLARÉS COMPLETS. La tour a confronté le fichier à son gabarit au
       moment de la déclaration ; la CI le REJOUE, parce qu'un fichier peut changer après.
       Seule la DERNIÈRE déclaration d'un livrable fait foi (completion_declaration.last_wins). */
    const towerFile = join(proj.root, 'runs', 'tower.json');
    if (existsSync(towerFile)) {
      let st = null;
      try { st = JSON.parse(readFileSync(towerFile, 'utf8')); } catch { f.push('runs/tower.json illisible'); }
      const last = new Map();
      for (const d of st?.declared || []) last.set(`${d.work_product}@${JSON.stringify(d.instance || null)}`, d);
      let nForm = 0;
      for (const d of last.values()) {
        if (d.completion !== 'complet') continue;
        nForm++;
        const form = checkArtifactForm(proj.root, d.work_product, { instance: d.instance || undefined, completion: 'complet' });
        for (const x of form.findings) f.push(`${d.work_product} déclaré complet : ${x}`);
      }
      const sux = campagnesSux(proj.root, f) + formeDesControles(proj.root, f);
      return res('K7', n, f, `chaque élément de charte présent · ${nForm} livrable(s) complet(s) conformes à leur gabarit${sux}`);
    }
    const sux = campagnesSux(proj.root, f) + formeDesControles(proj.root, f);
    return res('K7', n, f, `chaque élément de charte présent${sux}`);
  },

  /* ── K8 · Run Ledger et déclarations ───────────────────────────────── */
  K8: (proj) => {
    const n = 'Run Ledger et déclarations';
    if (!proj) return skip('K8', n, "aucune arborescence runs/ — exige un Run ouvert");
    const f = [];
    for (const run of proj.runs || []) {
      if (!run.cadence)  f.push(`run ${run.id} : cadence non déclarée`);
      if (!run.opened_at) f.push(`run ${run.id} : ledger non ouvert avant la première activité`);
      if (run.path === 'EXPRESS' && !run.path_declared_before_start)
        f.push(`run ${run.id} : chemin EXPRESS déclaré a posteriori — écart MAJOR`);
      if ((run.convergence_rounds || 0) > 2) f.push(`run ${run.id} : ${run.convergence_rounds} tours de convergence, la limite est 2 (EX1)`);
      for (const g of run.gate_decisions || [])
        if (g.approval_expired) f.push(`run ${run.id} : décision ${g.id} sur approbation expirée`);
    }
    /* DÉTECTION DE CONTOURNEMENT DE LA TOUR.
       La tour de contrôle ne peut pas empêcher une écriture native — mais tout livrable
       tracé présent sur disque sans déclaration correspondante au journal est un trou.
       C'est le mécanisme réel : elle ne prévient pas, elle rend l'écart PROUVABLE. */
    const towerFile = join(proj.root, 'runs', 'tower.json');
    if (existsSync(towerFile)) {
      const st = JSON.parse(readFileSync(towerFile, 'utf8'));
      const declared = new Set((st.declared || []).map(d => d.work_product));
      const onDisk = new Set((proj.entities || []).map(e => e.work_product).filter(Boolean));
      for (const w of onDisk)
        if (!declared.has(w)) f.push(`${w} présent sur disque sans déclaration à la tour — écriture hors tour de contrôle`);
      for (const [g, v] of Object.entries(st.gates || {}))
        if (v.status === 'CLEARED' && !v.by) f.push(`gate ${g} franchie sans autorité nommée`);
      /* L'AUTOPILOTE (MCR-002) : chaque tour enregistré se relit dans son verdict déposé. Un
         compte réécrit dans l'état, ou un verdict retouché après coup, se voit ici. */
      for (const [wp, b] of Object.entries(st.boucles || {}))
        for (const t of b.tours || []) {
          const fv = join(proj.root, t.path || '');
          if (!t.path || !existsSync(fv)) { f.push(`${wp} tour ${t.n} : verdict ${t.path || '∅'} introuvable — un tour sans verdict déposé ne compte pas`); continue; }
          const syn = lireSynthese(readFileSync(fv, 'utf8'));
          if (!syn || syn.blockers !== t.blockers || syn.majors !== t.majors)
            f.push(`${wp} tour ${t.n} : le verdict déposé ne dit pas ce que l'état enregistre (${t.blockers} BLOCKER, ${t.majors} MAJOR)`);
        }
      if (st.gates?.G0?.status === 'CLEARED')
        for (const d of st.decisions || []) if (d.statut === 'EN_ATTENTE' || d.statut === 'DÉLÉGUÉE')
          f.push(`${d.id} ${d.statut === 'DÉLÉGUÉE' ? 'déléguée et jamais ratifiée' : 'en attente'} alors que G0 est franchie`);
    } else if ((proj.entities || []).some(e => e.work_product))
      f.push('des livrables tracés existent mais runs/tower.json est absent — le run n\'est jamais passé par la tour de contrôle');

    return res('K8', n, f, 'ledger ouvert, cadence et chemin déclarés, aucune écriture hors tour');
  }
};

export function runAll(proj = null) {
  return Object.keys(CHECKS).sort().map(id => CHECKS[id](proj));
}
