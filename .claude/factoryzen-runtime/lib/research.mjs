import { registry } from './registry.mjs';

/* CAPACITÉ DE RECHERCHE — ce qui la rend utilisable sans la rendre dangereuse.
 *
 * LE BESOIN. Les activités 3, 4, 6, 10 et 13 doivent établir des faits EXTÉRIEURS — sources
 * approuvées du domaine, ce que les gens font réellement, licences et coûts des
 * dépendances. Aucun sponsor ne les détient. Sans accès, un agent n'a que deux issues :
 * rendre tout en UNVALIDATED, ou inventer. La méthode interdit la seconde, et la première
 * vide les activités de recherche de leur objet.
 *
 * LA LIGNE, ET ELLE EST NETTE. Sourcer n'est pas inférer. Un agent qui lit une source et
 * rapporte ce qu'elle dit produit un FAIT ; un agent qui produit une affirmation plausible
 * parce qu'elle sonne juste produit une fiction — et une fiction sourcée « sur Internet »
 * est PLUS dangereuse qu'une invention avouée, parce qu'elle est plus confiante.
 *
 * POURQUOI LA CAPACITÉ EST ACCORDÉE À DES ACTIVITÉS ET JAMAIS À DES RÔLES. product-lead
 * porte les activités 2, 3, 13, 17, 18 et 19. La lui donner par son PROFIL la lui
 * donnerait aussi en activité 20, où il rédige le contrat de slice — exactement le moment où
 * chercher sert à justifier ce qu'on vient d'écrire. Une restriction d'outillage qui ne
 * sait pas distinguer les moments du même rôle n'est pas une restriction.
 *
 * CE QUE CE MODULE CONTRÔLE. Que la liste déclarée au registre et les activités qui la
 * portent coïncident, dans les DEUX sens ; qu'aucune activité évaluée ne la porte ; que la
 * règle de recevabilité existe et nomme ses trois champs. Une liste annoncée et non
 * recalculée est déjà fausse. */

export function researchFindings() {
  const r = registry();
  const w = r.web_research;
  const f = [];

  if (!w) return ['web_research : section absente du registre — la capacité de recherche n’est déclarée nulle part'];

  /* La règle de recevabilité est la seule chose qui distingue une source d'un souvenir.
     Sans ses trois champs, « j'ai cherché sur Internet » est invérifiable. */
  const fields = w.recevabilite?.fields || [];
  for (const need of ['url', 'consulted_at', 'verbatim'])
    if (!fields.includes(need))
      f.push(`web_research : la recevabilité ne nomme pas « ${need} » — une affirmation sans ${need} n'est pas rejouable par un tiers`);
  if (!w.recevabilite?.on_missing)
    f.push("web_research : rien ne dit ce qui arrive à une affirmation non sourcée — une règle sans conséquence est une consigne");
  if (!w.never)
    f.push("web_research : rien n'interdit de chercher ce que seul l'humain détient — chercher une décision de sponsor est la même faute que l'inventer");

  /* LE DÉCLARÉ CONFRONTÉ AU RÉEL, dans les deux sens. Une activité qui porte la capacité
     sans figurer à la liste l'a obtenue sans décision ; une activité listée qui ne la
     porte pas fait mentir la liste. Les deux sont des FAIL. */
  const declaredAt = (w.who?.granted_at || []).map(String).sort();
  const carrying = r.activities
    .filter(a => (a.capabilities || []).includes(w.capability))
    .map(a => String(a.id)).sort();

  for (const id of carrying)
    if (!declaredAt.includes(id))
      f.push(`web-research : l'activité ${id} porte la capacité sans figurer à web_research.who.granted_at — accordée sans décision`);
  for (const id of declaredAt)
    if (!carrying.includes(id))
      f.push(`web-research : l'activité ${id} est déclarée bénéficiaire et ne porte pas la capacité — la liste ment`);

  /* UN ÉVALUATEUR QUI CHERCHE DES FAITS EN CHERCHE POUR ÉTAYER SON VERDICT. La capacité
     est donc refusée à toute activité portée par un rôle en lecture seule. */
  const profiles = Object.fromEntries((r.agents || []).map(a => [a.id, a.tools_profile]));
  const readOnly = new Set((r.tools_profiles || []).filter(p => p.writes === false).map(p => p.id));
  for (const a of r.activities.filter(x => (x.capabilities || []).includes(w.capability))) {
    const owners = String(a.responsible || '').split(/\s*(?:,|et|puis)\s*/).filter(Boolean);
    for (const o of owners)
      if (readOnly.has(profiles[o]))
        f.push(`web-research : l'activité ${a.id} est portée par ${o}, en lecture seule — un évaluateur qui cherche des faits en cherche pour étayer son verdict`);
    if (!a.capabilities_note)
      f.push(`web-research : l'activité ${a.id} porte la capacité sans dire POURQUOI — une capacité sans motif se propage`);
  }

  /* Le profil existe-t-il, et dit-il qu'il lit l'extérieur ? Un profil déclaré sans cette
     marque serait indistinguable d'un producteur ordinaire. */
  const prof = (r.tools_profiles || []).find(p => p.reads_web);
  if (!prof) f.push("web_research : aucun profil d'outillage ne déclare lire l'extérieur — la capacité n'a pas de porteur");
  else if (prof.writes !== true)
    f.push(`web_research : le profil ${prof.id} lit l'extérieur sans pouvoir écrire — il ne pourrait rien consigner de ce qu'il trouve`);

  return f;
}

/* RECEVABILITÉ D'UNE AFFIRMATION SOURCÉE — utilisable par un agent avant de l'écrire.
 * Rend ce qui manque, jamais un booléen : « non recevable » n'apprend rien à celui qui
 * doit corriger. */
export function claimFindings(claim = {}) {
  const need = registry().web_research?.recevabilite?.fields || ['url', 'consulted_at', 'verbatim'];
  const missing = need.filter(k => !String(claim[k] ?? '').trim());
  return {
    ok: missing.length === 0,
    missing,
    verdict: missing.length === 0 ? 'RECEVABLE' : 'UNVALIDATED',
    why: missing.length === 0
      ? 'Adresse, date et citation littérale : un tiers peut rejouer et contredire.'
      : `Manque ${missing.join(', ')}. L'affirmation est rétrogradée en UNVALIDATED et porte un HYP-nn — jamais effacée : ce qu'un agent a cru savoir est une information sur l'agent.`
  };
}
