/* LE ROUTAGE APPLIQUÉ (R6).
 *
 * Le registre module la classe d'un rôle selon le contexte — cadence du socle, tier de
 * risque, réouverture d'un gate refusé, chemin EXPRESS. Un fichier d'agent ne porte qu'un
 * modèle : tant que la modulation n'était que lue, une revue de sécurité en tier R3 tournait
 * sur le modèle d'une slice routinière. Ce module CALCULE le modèle et l'effort d'un rôle dans
 * un contexte ; la tour le rend à l'ouverture d'une activité, la garde refuse l'invocation
 * qui s'en écarte, K6 rejoue R1 et R5 sur tous les contextes possibles.
 *
 * Deux règles de report, qui sont celles du registre :
 *   - une montée de classe qui ôterait au juge tout modèle distinct (R5), qui dépasserait la
 *     classe la plus haute, ou dont la classe sert le même modèle, se reporte sur l'EFFORT,
 *     d'un niveau (R2 : l'effort d'abord) ;
 *   - une descente ne passe jamais sous INTERMÉDIAIRE : ÉCONOMIQUE est disqualifiée pour tout
 *     rôle qui charge une baseline.
 * Fonctions pures : le registre et la table des modèles de l'adaptateur, rien d'autre. */
import { registry } from './registry.mjs';
import { MODELES_PAR_CLASSE, EFFORT_ADAPTATEUR, modeleDuJuge } from '../build/modeles.mjs';

export const CLASSES = ['ÉCONOMIQUE', 'INTERMÉDIAIRE', 'AVANCÉE', 'POINTE'];
const PLANCHER = CLASSES.indexOf('INTERMÉDIAIRE');
const modelesDe = c => MODELES_PAR_CLASSE[c] || [];
const estCritic = id => String(id).startsWith('critic-');

/** La plus haute classe où l'adaptateur sert ce modèle. */
export const classeDuModele = m => CLASSES.reduce((k, c, i) => modelesDe(c).includes(m) ? i : k, -1);

/** Les rôles de la méthode, tels que les fichiers d'agents les nomment. */
export const roles = (r = registry()) =>
  (r.agents || []).flatMap(a => a.instances ? a.instances.map(i => `critic-${i}`) : [a.id]);

/** Les rôles qui PRODUISENT : ceux qu'une activité nomme responsables. */
export const producteurs = (r = registry()) => {
  const ids = new Set((r.agents || []).filter(a => !a.instances).map(a => a.id)), out = new Set();
  for (const a of r.activities)
    for (const who of String(a.responsible).split(/ (?:et|puis) |·/).map(x => x.trim()))
      if (ids.has(who)) out.add(who);
  return [...out];
};

function base(r, id) {
  if (estCritic(id)) {
    const a = (r.agents || []).find(x => x.instances && x.instances.includes(id.slice(7)));
    if (!a) return null;
    const j = modeleDuJuge(r);
    return { classe: CLASSES[classeDuModele(j.model)], modele: j.model, effort: a.effort };
  }
  const a = (r.agents || []).find(x => x.id === id && !x.instances);
  if (!a || !CLASSES.includes(a.capability_class)) return null;
  return { classe: a.capability_class, modele: modelesDe(a.capability_class)[0], effort: a.effort };
}

const nomme = id => x => x === id || (x === 'critic(·)' && estCritic(id));
const concerne = (m, id) => !(m.sauf || []).some(nomme(id)) && (m.agents === '*' || (m.agents || []).some(nomme(id)));
function declenche(m, ctx) {
  const q = m.quand || {};
  if (!Object.keys(q).length) return false;
  if (q.cadence != null && ctx.cadence !== q.cadence) return false;
  if (q.tier != null && ![].concat(q.tier).includes(ctx.tier)) return false;
  if (q.reprise != null && !!ctx.reprise !== !!q.reprise) return false;
  if (q.express != null && !!ctx.express !== !!q.express) return false;
  return true;
}

/* Un producteur ne monte en classe c que si un juge peut encore tourner sur un AUTRE modèle,
   de classe c ou plus haute (R1 puis R5) — quand l'adaptateur sert un second modèle. Une
   montée vers une classe qui sert le même modèle n'achète rien : elle se reporte sur l'effort. */
const jugeLibre = c => CLASSES.slice(c).flatMap(modelesDe).some(m => m !== modelesDe(CLASSES[c])[0]);

/**
 * Le modèle et l'effort d'un rôle dans un contexte { cadence, tier, reprise, express }.
 * Rend null pour un rôle que la méthode ne connaît pas.
 */
export function routage(id, ctx = {}, r = registry()) {
  const b = base(r, id);
  if (!b) return null;
  const efforts = r.routing?.efforts || ['faible', 'moyen', 'élevé', 'très élevé', 'maximal'];
  let c = CLASSES.indexOf(b.classe), e = Math.max(0, efforts.indexOf(b.effort)), modele = b.modele;
  const modulations = [], libre = modeleDuJuge(r).independance === 'DISTINCT';
  const versEffort = (m, raison) => {
    if (e < efforts.length - 1) { e++; modulations.push({ id: m.id, effet: 'effort', raison }); }
    else modulations.push({ id: m.id, effet: 'sans effet', raison: `${raison} ; effort déjà maximal` });
  };
  for (const m of r.routing?.modulation || []) {
    if (!declenche(m, ctx) || !concerne(m, id)) continue;
    if (m.delta > 0) {
      const cible = c + 1;
      if (cible >= CLASSES.length || !modelesDe(CLASSES[cible]).length) versEffort(m, 'aucune classe au-dessus');
      else if (modelesDe(CLASSES[cible])[0] === modele) versEffort(m, `${CLASSES[cible]} sert le même modèle — ${modele}`);
      else if (!estCritic(id) && libre && !jugeLibre(cible)) versEffort(m, `en ${CLASSES[cible]}, le juge n'aurait plus de modèle distinct (R5)`);
      else { c = cible; modele = modelesDe(CLASSES[c])[0]; modulations.push({ id: m.id, effet: 'classe', raison: `${CLASSES[c - 1]} → ${CLASSES[c]}` }); }
    } else if (m.delta < 0) {
      if (c - 1 < PLANCHER) modulations.push({ id: m.id, effet: 'sans effet', raison: 'jamais sous INTERMÉDIAIRE' });
      else { c--; modele = modelesDe(CLASSES[c])[0]; modulations.push({ id: m.id, effet: 'classe', raison: `${CLASSES[c + 1]} → ${CLASSES[c]}` }); }
    }
  }
  return { role: id, classe: CLASSES[c], modele, effort: efforts[e], effort_adaptateur: EFFORT_ADAPTATEUR[efforts[e]],
           base: { ...b, effort_adaptateur: EFFORT_ADAPTATEUR[b.effort] }, modulations };
}

/** Le contexte de routage d'une activité : sa cadence, et ce que l'appelant déclare. */
export function contexte(activite, { tier, reprise, express } = {}, r = registry()) {
  const a = r.activities.find(x => String(x.id) === String(activite));
  return { activite: a ? a.id : activite, cadence: a?.cadence || null, tier: tier || 'R1', reprise: !!reprise, express: !!express };
}

/** Tous les contextes que les modulations peuvent produire — ce que K6 rejoue. */
export function contextesPossibles(r = registry()) {
  const out = [];
  for (const cadence of [null, ...r.cadences.map(c => c.id)])
    for (const tier of ['R1', 'R2', 'R3'])
      for (const reprise of [false, true])
        for (const express of [false, true]) out.push({ cadence, tier, reprise, express });
  return out;
}

/** R1 et R5 sous modulation, et la forme des modulations — les écarts, pour K6. */
export function ecartsDeRoutage(r = registry()) {
  const f = [], connus = new Set([...roles(r), 'critic(·)']);
  for (const m of r.routing?.modulation || []) {
    const q = m.quand || {};
    if (!m.id) f.push(`modulation « ${m.trigger} » sans identifiant`);
    if (!Object.keys(q).length || Object.keys(q).some(k => !['cadence', 'tier', 'reprise', 'express'].includes(k)))
      f.push(`${m.id || m.trigger} : condition « quand » absente ou inconnue — une modulation sans condition exécutable reste une consigne`);
    if (![1, -1].includes(m.delta)) f.push(`${m.id || m.trigger} : delta attendu +1 ou −1`);
    if (m.agents !== '*' && !(Array.isArray(m.agents) && m.agents.length)) f.push(`${m.id || m.trigger} : agents attendus — « * » ou une liste`);
    for (const x of [...(Array.isArray(m.agents) ? m.agents : []), ...(m.sauf || [])])
      if (!connus.has(x)) f.push(`${m.id || m.trigger} : rôle inconnu — ${x}`);
  }
  const prods = producteurs(r), critics = roles(r).filter(estCritic);
  const libre = modeleDuJuge(r).independance === 'DISTINCT';
  for (const ctx of contextesPossibles(r)) {
    const p = prods.map(id => routage(id, ctx, r)).filter(Boolean);
    const haut = Math.max(-1, ...p.map(x => classeDuModele(x.modele)));
    const modelesProd = new Set(p.map(x => x.modele));
    for (const id of critics) {
      const j = routage(id, ctx, r);
      if (!j) continue;
      const lieu = `${id} (${ctx.cadence || 'hors cadence'}, ${ctx.tier}${ctx.reprise ? ', reprise' : ''}${ctx.express ? ', EXPRESS' : ''})`;
      if (classeDuModele(j.modele) < haut) f.push(`R1 : ${lieu} sur ${j.modele}, sous le producteur le plus élevé`);
      /* R5 ne se viole que si un modèle distinct était servi : sans second modèle (MCR-004),
         le critic est CORRÉLÉ par choix déclaré, et son fichier le dit (contrôlé par K6). */
      if (libre && modelesProd.has(j.modele)) f.push(`R5 : ${lieu} sur ${j.modele}, le modèle d'un producteur qu'il juge`);
    }
  }
  return [...new Set(f)];
}
