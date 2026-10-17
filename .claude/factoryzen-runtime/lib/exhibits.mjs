/* Formats de présentation — core/templates.yaml, bloc « exhibits ».
 *
 * Un livrable se montre à un client dans le format qui fait référence pour sa question :
 * compte de résultat inversé, dimensionnement par le bas, cartes de test… Ce module lit
 * les DONNÉES que le livrable porte dans son front-matter (clé « exhibits »), les
 * contrôle, et CALCULE ce qu'un consultant aurait calculé à la main. Il ne rend rien :
 * il produit un modèle que le pack projette et que le rendu dessine.
 *
 * Trois engagements :
 *   - ce qui se calcule est calculé, et le texte qui l'annonce est vérifié ;
 *   - une donnée manquante n'est jamais remplie : la planche est refusée, le défaut nommé ;
 *   - un format n'est porté que par le fichier que le gabarit lui assigne.
 *
 * Distinction tenue partout : un DÉFAUT empêche la planche (la forme est fausse) ; un
 * CONSTAT est ce que le calcul révèle sur le produit (l'exigence dépasse la référence).
 * Un constat n'est pas une faute du livrable — c'est souvent la raison d'être du format. */

import { templates } from './templates.mjs';
import { registry, byId } from './registry.mjs';
import { gabaritsEn } from './i18n.mjs';

/** Les formats déclarés au gabarit ; dans une autre langue, leur nom, leur question et leur
 *  exemple traduits (core/i18n/templates.<langue>.yaml) — mêmes ids, mêmes règles de calcul. */
export const formatsDeclares = lang => (lang && lang !== 'fr' ? gabaritsEn(lang) : templates()).exhibits?.formats || [];
export const formatDe = id => formatsDeclares().find(f => f.id === id) || null;
const tolerance = () => Number(templates().exhibits?.tolerance ?? 0.15);

/* ── nombres ──────────────────────────────────────────────────────────── */

/** Une grandeur : centrale, basse, haute. Un nombre seul est une fourchette nulle. */
export function grandeur(valeur, fourchette) {
  if (Array.isArray(valeur) && valeur.length === 2 && valeur.every(Number.isFinite))
    return { c: (valeur[0] + valeur[1]) / 2, b: Math.min(...valeur), h: Math.max(...valeur) };
  if (!Number.isFinite(valeur)) return null;
  if (Array.isArray(fourchette) && fourchette.length === 2 && fourchette.every(Number.isFinite))
    return { c: valeur, b: Math.min(...fourchette), h: Math.max(...fourchette) };
  return { c: valeur, b: valeur, h: valeur };
}
const fois = (x, y) => ({ c: x.c * y.c, b: x.b * y.b, h: x.h * y.h });
const divise = (x, y) => ({ c: x.c / y.c, b: x.b / y.h, h: x.h / y.b });
const estFourchette = g => g && Math.abs(g.h - g.b) > 1e-9 * Math.max(1, Math.abs(g.c));

/** Écriture française d'un nombre, arrondie pour être lue. */
export function nombre(n, { approx = false, decimales } = {}) {
  if (!Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  let v = n, suffixe = '';
  if (a >= 1e6) { v = n / 1e6; suffixe = ' M'; }
  let d = decimales ?? (Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? (suffixe ? 0 : 0) : 1);
  if (approx && !suffixe && a >= 1000) {           // deux chiffres significatifs
    const p = Math.pow(10, Math.floor(Math.log10(a)) - 1);
    v = Math.round(n / p) * p; d = 0;
  }
  let t = v.toFixed(d);
  if (d > 0) t = t.replace(/\.?0+$/, '');
  const [ent, dec] = t.split('.');
  const groupe = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (approx ? '≈ ' : '') + groupe + (dec ? ',' + dec : '') + suffixe;
}
export const plage = (g, o) => !g ? '—' : estFourchette(g)
  ? nombre(g.b, o).replace(/ M$/, '') + ' – ' + nombre(g.h, o) : nombre(g.c, o);

/* ── contrôles communs ────────────────────────────────────────────────── */

const vide = v => v === undefined || v === null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);

/* Un format porté par un DOSSIER (« personas/ ») est porté par chacun de ses fichiers :
   une planche par persona, par carte, par parcours. */
const portePar = (porte, file) => String(porte || '').endsWith('/')
  ? String(file).includes(porte) : String(file).endsWith(porte);

/* LES TRAITS DE RECHERCHE — persona, empathy map, journey map. Un trait est recevable s'il
   cite au moins deux sources DISTINCTES (S-nn, E-nn), ou s'il se déclare hypothèse avec sa
   référence HYP-nn. La machine ne juge pas l'indépendance de deux sources — WP-04 la déclare
   et le critic la vérifie — mais elle refuse un trait qu'une seule parole porte. */
const SOURCE_RE = /^[SE]-\d{2,}$/;
function traits(liste, bloc, fmt, d, { min = 2, citation = false } = {}) {
  const items = [].concat(liste || []).map(it => typeof it === 'string' ? { texte: it } : { ...it });
  const maxE = fmt.max_elements || 4, maxM = fmt.max_mots_element || 16;
  if (items.length > maxE) d.defauts.push(`« ${bloc} » : ${items.length} éléments, ${maxE} au plus`);
  let hyp = 0;
  for (const it of items) {
    const court = String(it.texte || '').slice(0, 40);
    if (vide(it.texte)) { d.defauts.push(`« ${bloc} » : élément sans texte`); continue; }
    if (String(it.texte).split(/\s+/).filter(Boolean).length > maxM) d.defauts.push(`« ${bloc} » : « ${court}… » dépasse ${maxM} mots`);
    if (it.statut === 'hypothèse') {
      hyp++;
      if (vide(it.ref)) d.defauts.push(`« ${bloc} » : l'hypothèse « ${court} » ne dit pas laquelle — référence HYP-nn attendue`);
      continue;
    }
    const src = [...new Set([].concat(it.sources || []).map(String))];
    if (src.some(x => !SOURCE_RE.test(x))) d.defauts.push(`« ${bloc} » : « ${court} » cite une source qui n'est ni S-nn ni E-nn`);
    if (src.length < min) d.defauts.push(`« ${bloc} » : « ${court} » repose sur ${src.length ? 'une seule source' : 'aucune source'} — ${min} attendues, ou une hypothèse HYP-nn`);
    if (citation && !/^\s*[«"“]/.test(it.texte)) d.defauts.push(`« ${bloc} » : « ${court} » n'est pas une citation littérale entre guillemets`);
  }
  return { items, hypotheses: hyp };
}
const sourcesDe = (...listes) => [...new Set(listes.flat().flatMap(it => [].concat(it?.sources || [], it?.source || [])).map(String).filter(x => SOURCE_RE.test(x)))].sort();
const ORIGINES = ['sourcé', 'hypothèse', 'règle', 'cible', 'calcul'];

function communs(ex, fmt, defauts) {
  for (const k of [...(templates().exhibits?.commun?.champs || []), ...(fmt.champs || [])])
    if (vide(ex[k])) defauts.push(`champ « ${k} » absent`);
  const t = String(ex.titre || '').trim().toLowerCase();
  if (t && (t === fmt.nom.toLowerCase() || t.split(/\s+/).length < 5))
    defauts.push('le titre nomme le sujet au lieu de donner la réponse');
}

/** Écart relatif d'un nombre annoncé au nombre calculé. */
function annonce(attendu, g) {
  const a = grandeur(attendu);
  if (!a) return { ok: true };
  const tol = tolerance();
  const rel = (x, y) => Math.abs(x - y) / Math.max(Math.abs(x), 1e-12);
  const ok = estFourchette(a) ? rel(a.b, g.b) <= tol && rel(a.h, g.h) <= tol : rel(a.c, g.c) <= tol;
  return { ok, a };
}

/* ── évaluateurs, un par format ───────────────────────────────────────── */

const EVAL = {

  communique(ex, fmt, d) {
    const mots = [].concat(ex.paragraphes || []).join(' ').split(/\s+/).filter(Boolean).length;
    if (mots > (fmt.max_mots || 200)) d.defauts.push(`le corps compte ${mots} mots, au-delà de ${fmt.max_mots || 200} : la promesse ne tient pas en une page`);
    const c = ex.citation || {};
    if (!vide(ex.citation)) {
      if (vide(c.texte)) d.defauts.push('citation sans texte');
      if (!['visée', 'obtenue'].includes(c.statut)) d.defauts.push('citation sans statut « visée » ou « obtenue » — une citation visée ne se présente pas comme obtenue');
      if (c.statut === 'visée') d.constats.push('la citation est visée, pas obtenue');
    }
    return { mots, oblige: [].concat(ex.oblige || []) };
  },

  /* LES INVESTISSEURS CIBLÉS — INSEAD NBV, chapitre 4 : des personnes, quatre critères chacune,
     chaque critère prouvé et sourcé ; un concurrent en portefeuille disqualifie. */
  investisseurs(ex, fmt, d) {
    const CRITERES = [['secteur', 'secteur et modèle'], ['geographie', 'géographie'], ['portefeuille', 'portefeuille'], ['performance', 'performance']];
    const NOTE = { oui: 2, partiel: 1, non: 0 };
    const SRC = /^(S|E|DEC)-\d{2,}$/;
    const STRUCT = /\b(capital|ventures?|partners|fund|fonds|invest(ments)?|holding|group|sas|sa|llc|ltd)\b/i;
    const cible = ex.cible || {}, montant = Number(cible.montant);
    const liste = [].concat(ex.investisseurs || []);
    const min = fmt.min_investisseurs || 3, max = fmt.max_investisseurs || 8;
    if (liste.length < min) d.defauts.push(`${liste.length} investisseur(s) : ${min} au moins`);
    if (liste.length > max) d.defauts.push(`${liste.length} investisseurs : ${max} au plus — une liste ciblée, pas un annuaire`);
    const lignes = [];
    for (const inv of liste) {
      const nom = String(inv.nom || '').trim(), qui = nom || '∅';
      if (nom.split(/\s+/).filter(Boolean).length < 2 || STRUCT.test(nom)) d.defauts.push(`« ${qui} » : une personne nommée par son prénom et son nom, pas une structure`);
      if (!SRC.test(String(inv.profil || ''))) d.defauts.push(`« ${qui} » : profil public non sourcé — S-nn attendu`);
      let score = 0;
      const notes = {};
      for (const [k, lib] of CRITERES) {
        const c = inv[k] || {};
        if (!(c.adequation in NOTE)) { d.defauts.push(`« ${qui} » · ${lib} : adéquation absente — oui, partiel ou non`); continue; }
        if (!String(c.preuve || '').trim()) d.defauts.push(`« ${qui} » · ${lib} : la preuve manque`);
        if (!SRC.test(String(c.source || ''))) d.defauts.push(`« ${qui} » · ${lib} : sans source — S-nn attendu`);
        notes[k] = c.adequation; score += NOTE[c.adequation];
      }
      const concurrents = [].concat(inv.portefeuille?.concurrents || []);
      if (concurrents.length) d.defauts.push(`« ${qui} » : concurrent direct en portefeuille (${concurrents.join(', ')}) — disqualifié`);
      const t = inv.ticket || {};
      let ticket = null;
      if (Number.isFinite(Number(t.min)) && Number.isFinite(Number(t.max))) {
        if (!SRC.test(String(t.source || ''))) d.defauts.push(`« ${qui} » · ticket : sans source`);
        ticket = Number.isFinite(montant) ? (Number(t.min) > montant ? 'trop_grand' : Number(t.max) < montant * 0.05 ? 'trop_petit' : 'adapte') : 'inconnu';
        if (ticket === 'trop_grand') d.constats.push(`« ${qui} » : son ticket minimal dépasse le montant demandé`);
      } else d.constats.push(`« ${qui} » : ticket habituel inconnu`);
      const acces = inv.acces?.type;
      if (!['chaud', 'froid'].includes(acces)) d.defauts.push(`« ${qui} » : accès non déclaré — chaud (par qui) ou froid`);
      else if (acces === 'chaud' && !String(inv.acces.via || '').trim()) d.defauts.push(`« ${qui} » : introduction chaude sans dire par qui`);
      lignes.push({ nom, structure: inv.structure || '', score, notes, ticket, t, acces, via: inv.acces?.via || null, concurrents });
    }
    lignes.sort((a, b) => b.score - a.score || (a.acces === 'chaud' ? -1 : 1));
    const bien = lignes.filter(l => l.score >= 6 && !l.concurrents.length);
    if (lignes.length && bien.length < min) d.constats.push(`${bien.length} personne(s) bien placée(s) sur ${lignes.length} : la liste reste à renforcer`);
    if (lignes.length && !lignes.some(l => l.acces === 'chaud')) d.constats.push('aucune introduction chaude : chaque contact partira à froid');
    return { cible, lignes, bien: bien.length };
  },

  /* LE PITCH INVESTISSEURS — le seed deck de Y Combinator, une idée par planche (K. Hale),
     enrichi des outils du New Business Venturing d'INSEAD : positionnement en deux phrases,
     mantra, échelle de fiabilité des preuves, cartes d'apprentissage, économie unitaire,
     concurrence typée, équipe par activité clé. Rien n'y est inventé. */
  pitch(ex, fmt, d) {
    const ORDRE = fmt.ordre || ['probleme', 'solution', 'traction', 'apprentissages', 'intuition', 'modele', 'marche', 'concurrence', 'equipe', 'demande'];
    const NOMS = { probleme: 'Problème', solution: 'Solution', traction: 'Traction', apprentissages: 'Apprentissages', intuition: 'Intuition singulière',
      modele: 'Modèle économique', marche: 'Marché', concurrence: 'Concurrence', equipe: 'Équipe', demande: 'La demande' };
    const STATUTS = ['établi', 'décision', 'hypothèse', 'inconnu'];
    const ECHELLE = ['propos', 'interet', 'action', 'paiement'];
    const FORCES = ['couts_de_changement', 'revenus_recurrents', 'encaisser_avant_depenser', 'structure_de_couts', 'autres_font_le_travail', 'scalabilite', 'protection'];
    const RESULTATS = ['argent', 'temps', 'facilite', 'opportunite'];
    const TYPES = ['direct', 'indirect', 'futur', 'statu_quo'];
    const REF = /^(WP|SOC|S|E|DEC|DIR|MET|OUT|HYP|STG|JRN|REL|PER)-\d{2,}$/, HYP = /^HYP-\d{2,}$/;
    const maxP = fmt.max_points || 3, maxM = fmt.max_mots_point || 12;
    const mots = t => String(t || '').split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
    let hyp = 0, n = 0;
    const fonde = (it, lieu) => {
      if (!STATUTS.includes(it.statut)) { d.defauts.push(`${lieu} sans statut — établi, décision, hypothèse ou inconnu`); return; }
      if (it.statut === 'hypothèse') { hyp++; if (!HYP.test(String(it.ref || ''))) d.defauts.push(`${lieu} : l'hypothèse ne dit pas laquelle — référence HYP-nn attendue`); return; }
      if (it.statut === 'inconnu') return;
      if (!REF.test(String(it.source || ''))) d.defauts.push(`${lieu} : « ${it.statut} » sans ce qui le fonde — WP-nn, S-nn, E-nn, DEC-nn ou MET-nn attendu`);
    };
    const statutDe = x => x.statut || (x.source ? 'établi' : undefined);

    /* l'ouverture : accroche YC, mantra, positionnement en deux phrases */
    if (mots(ex.accroche) > (fmt.max_mots_accroche || 14)) d.defauts.push(`l'accroche dépasse ${fmt.max_mots_accroche || 14} mots : elle se dit d'une traite`);
    const nm = mots(ex.mantra);
    if (ex.mantra && (nm < 2 || nm > 4)) d.defauts.push(`le mantra compte ${nm} mot(s) : deux à quatre, ce que l'entreprise défend`);
    const P = ex.positionnement || {};
    const manquePos = ['pour', 'qui', 'produit', 'categorie', 'benefice', 'contrairement_a', 'difference'].filter(k => !String(P[k] || '').trim());
    if (ex.positionnement && manquePos.length) d.defauts.push(`positionnement incomplet — ${manquePos.join(', ')} : « Pour… qui…, … est un… qui…. Contrairement à…, … »`);
    const positionnement = manquePos.length ? null
      : [`Pour ${P.pour} qui ${P.qui}, ${P.produit} est ${P.categorie} qui ${P.benefice}.`, `Contrairement ${/^(les|des|aux)\b/i.test(P.contrairement_a) ? P.contrairement_a.replace(/^les\b/i, 'aux') : `à ${P.contrairement_a}`}, ${P.difference}.`];

    const planches = [].concat(ex.planches || []);
    const cles = planches.map(p => p?.cle);
    for (const c of ORDRE) if (!cles.includes(c)) d.defauts.push(`planche « ${NOMS[c]} » absente`);
    for (const c of cles) if (!ORDRE.includes(c)) d.defauts.push(`planche « ${c} » inconnue — ${ORDRE.join(', ')}`);
    const presentes = cles.filter(c => ORDRE.includes(c));
    if (presentes.join() !== ORDRE.filter(c => presentes.includes(c)).join()) d.defauts.push(`planches hors de l'ordre : ${ORDRE.map(c => NOMS[c]).join(' → ')}`);

    const sortie = [];
    let echelon = -1;
    for (const p of planches.filter(x => ORDRE.includes(x?.cle)).sort((a, b) => ORDRE.indexOf(a.cle) - ORDRE.indexOf(b.cle))) {
      const nom = NOMS[p.cle], t = String(p.titre || '').trim();
      if (!t) d.defauts.push(`« ${nom} » : titre absent`);
      else if (mots(t) < 5 || t.toLowerCase() === nom.toLowerCase()) d.defauts.push(`« ${nom} » : le titre nomme la planche au lieu de donner l'idée`);
      const points = [].concat(p.points || []).map(x => typeof x === 'string' ? { texte: x } : { ...x });
      if (points.length > maxP) d.defauts.push(`« ${nom} » : ${points.length} points, ${maxP} au plus — une idée par planche`);
      for (const it of points) {
        n++;
        const court = String(it.texte || '').slice(0, 40);
        if (!String(it.texte || '').trim()) { d.defauts.push(`« ${nom} » : point sans texte`); continue; }
        if (mots(it.texte) > maxM) d.defauts.push(`« ${nom} » : « ${court}… » dépasse ${maxM} mots`);
        fonde(it, `« ${nom} » · « ${court} »`);
      }
      const ch = p.chiffre && typeof p.chiffre === 'object' ? { ...p.chiffre } : null;
      if (ch) {
        n++;
        if (!String(ch.valeur ?? '').trim()) d.defauts.push(`« ${nom} » : grand chiffre sans valeur`);
        fonde({ statut: statutDe(ch), source: ch.source, ref: ch.ref }, `« ${nom} » · chiffre « ${ch.valeur} »`);
      }
      const extra = {};
      if (p.cle === 'probleme') {
        const h = p.histoire || {};
        if (!/^PER-\d{2,}$/.test(String(h.persona || '')) || !String(h.texte || '').trim()) d.defauts.push("« Problème » : l'histoire d'une personne manque — un persona PER-nn de la recherche, et ce qu'il vit");
        else { if (mots(h.texte) > 30) d.defauts.push("« Problème » : l'histoire dépasse trente mots"); extra.histoire = h; }
      }
      if (p.cle === 'solution') {
        const r = p.resultat || {};
        if (!RESULTATS.includes(r.type) || !String(r.texte || '').trim()) d.defauts.push("« Solution » : le résultat pour le client manque — argent, temps, facilité ou opportunité, et en quoi");
        else { fonde({ statut: statutDe(r), source: r.source, ref: r.ref }, '« Solution » · résultat'); extra.resultat = r; }
      }
      if (p.cle === 'traction') {
        for (const x of [...points, ...(ch ? [ch] : [])]) {
          const f = x.fiabilite;
          if (String(x.niveau || '').toUpperCase() === 'SYNTHETIC') { d.defauts.push(`« Traction » : « ${String(x.texte || x.valeur).slice(0, 40)} » est une preuve SYNTHETIC — ce n'est pas de la traction`); continue; }
          if (f === undefined) continue;
          if (!ECHELLE.includes(f)) { d.defauts.push(`« Traction » : fiabilité « ${f} » inconnue — ${ECHELLE.join(' < ')}`); continue; }
          if (f === 'propos') d.defauts.push(`« Traction » : « ${String(x.texte || x.valeur).slice(0, 40)} » n'est qu'un propos — une promesse n'est pas de la traction`);
          if (statutDe(x) === 'établi') echelon = Math.max(echelon, ECHELLE.indexOf(f));
        }
        extra.echelon = echelon >= 0 ? ECHELLE[echelon] : null;
        if (echelon < 0) d.constats.push("aucune traction établie sur l'échelle de fiabilité : c'est la première question qu'un investisseur posera");
        else if (echelon < ECHELLE.indexOf('action')) d.constats.push(`la traction plafonne à « ${ECHELLE[echelon]} » : pas encore de preuve par l'acte`);
        else if (echelon < ECHELLE.indexOf('paiement')) d.constats.push("la traction atteint l'acte, pas encore le paiement");
      }
      if (p.cle === 'apprentissages') {
        const cartes = [].concat(p.cartes || []);
        if (!cartes.length) d.defauts.push("« Apprentissages » : aucune carte — nous pensions, nous avons observé, donc nous décidons");
        if (cartes.length > maxP) d.defauts.push(`« Apprentissages » : ${cartes.length} cartes, ${maxP} au plus`);
        cartes.forEach((c, i) => {
          for (const k of ['pensions', 'observe', 'decidons']) if (!String(c[k] || '').trim()) d.defauts.push(`« Apprentissages » · carte ${i + 1} : « ${k} » absent`);
          if (!HYP.test(String(c.ref || ''))) d.defauts.push(`« Apprentissages » · carte ${i + 1} : l'hypothèse testée manque — HYP-nn`);
          if (!ECHELLE.includes(c.fiabilite)) d.defauts.push(`« Apprentissages » · carte ${i + 1} : fiabilité de l'observation absente — ${ECHELLE.join(' < ')}`);
          if (!REF.test(String(c.source || ''))) d.defauts.push(`« Apprentissages » · carte ${i + 1} : l'observation ne cite pas sa source`);
        });
        extra.cartes = cartes;
      }
      if (p.cle === 'intuition') {
        const av = p.avantage || {};
        if (!String(av.texte || '').trim()) d.defauts.push("« Intuition » : l'avantage déloyal manque — ce que les concurrents ne peuvent pas copier");
        else { fonde({ statut: statutDe(av), source: av.source, ref: av.ref }, '« Intuition » · avantage'); extra.avantage = av; }
      }
      if (p.cle === 'modele') {
        const e = p.economie || {}, L = e.ltv || {}, C = e.cac || {};
        if (!Number.isFinite(Number(L.valeur)) || !Number.isFinite(Number(C.valeur)) || !Number(C.valeur)) d.defauts.push("« Modèle » : l'économie unitaire manque — valeur vie client (ltv) et coût d'acquisition (cac), chiffrés");
        else {
          fonde({ statut: L.statut, source: L.source, ref: L.ref }, '« Modèle » · LTV');
          fonde({ statut: C.statut, source: C.source, ref: C.ref }, '« Modèle » · CAC');
          extra.ratio = Number(L.valeur) / Number(C.valeur);
          extra.economie = e;
          if (extra.ratio < 3) d.constats.push(`LTV / CAC = ${extra.ratio.toFixed(1)} : sous le repère de 3 qu'un investisseur attend`);
        }
        const forces = [].concat(p.forces || []);
        const inconnues = forces.filter(f => !FORCES.includes(f));
        if (inconnues.length) d.defauts.push(`« Modèle » : force(s) inconnue(s) — ${inconnues.join(', ')} ; ${FORCES.join(', ')}`);
        if (!forces.length) d.constats.push("« Modèle » : aucune des sept forces du modèle n'est revendiquée");
        extra.forces = forces.filter(f => FORCES.includes(f));
      }
      if (p.cle === 'marche' && ch && !/^WP-02$/.test(String(ch.source || ''))) d.constats.push(`le marché ne vient pas du dimensionnement par le bas de WP-02 (${ch.source || ch.ref || 'sans source'})`);
      if (p.cle === 'concurrence') {
        const types = points.map(x => x.type);
        if (types.some(x => !TYPES.includes(x))) d.defauts.push(`« Concurrence » : chaque alternative déclare son type — ${TYPES.join(', ')}`);
        if (!types.includes('statu_quo')) d.defauts.push("« Concurrence » : le statu quo manque — ce que la cible fait aujourd'hui sans le produit");
        if (!types.some(x => x === 'direct' || x === 'indirect')) d.defauts.push('« Concurrence » : aucun concurrent direct ni indirect nommé');
      }
      if (p.cle === 'equipe') {
        if (points.some(x => !String(x.activite || '').trim())) d.defauts.push("« Équipe » : chaque membre dit l'activité clé qu'il couvre");
        extra.manques = [].concat(p.manques || []);
        if (extra.manques.length) d.constats.push(`l'équipe déclare ${extra.manques.length} manque(s) : la demande les finance`);
      }
      if (p.cle === 'demande') {
        if (!ch || ch.statut !== 'décision') d.constats.push("le montant demandé n'est pas une décision du porteur : il reste à décider");
        const tr = [].concat(p.tranche || []);
        if (!tr.length || tr.some(x => !HYP.test(String(x)))) d.defauts.push("« La demande » : les hypothèses critiques que l'argent va trancher manquent — HYP-nn");
        extra.tranche = tr;
      }
      if (!ch && !points.length && !Object.keys(extra).length) d.defauts.push(`« ${nom} » : ni chiffre ni point — une planche vide n'a rien à dire`);
      sortie.push({ cle: p.cle, nom, titre: t, chiffre: ch, points, ...extra });
    }
    if (n) d.constats.push(`${hyp} élément(s) sur ${n} reposent sur une hypothèse à tester`);
    return { planches: sortie, hypotheses: hyp, elements: n, entreprise: ex.entreprise, accroche: ex.accroche, mantra: ex.mantra || null, positionnement, pos: manquePos.length ? null : P };
  },

  bmc(ex, fmt, d) {
    const BLOCS = [['partenaires', 'Partenaires clés'], ['activites', 'Activités clés'], ['ressources', 'Ressources clés'],
      ['proposition', 'Proposition de valeur'], ['relations', 'Relations clients'], ['canaux', 'Canaux'],
      ['segments', 'Segments de clientèle'], ['couts', 'Structure de coûts'], ['revenus', 'Sources de revenus']];
    const STATUTS = ['établi', 'décision', 'hypothèse', 'inconnu'];
    const maxE = fmt.max_elements || 5, maxM = fmt.max_mots_element || 12;
    const blocs = {}, fragiles = [], refs = new Set();
    const compte = Object.fromEntries(STATUTS.map(k => [k, 0]));
    for (const [cle, nom] of BLOCS) {
      const items = [].concat(ex[cle] || []).map(it => typeof it === 'string' ? { texte: it } : { ...it });
      if (items.length > maxE) d.defauts.push(`« ${nom} » : ${items.length} éléments, ${maxE} au plus — un canvas est une synthèse`);
      for (const it of items) {
        const court = String(it.texte || '').slice(0, 40);
        if (vide(it.texte)) d.defauts.push(`« ${nom} » : élément sans texte`);
        if (String(it.texte || '').split(/\s+/).filter(Boolean).length > maxM) d.defauts.push(`« ${nom} » : « ${court}… » dépasse ${maxM} mots`);
        if (!STATUTS.includes(it.statut)) d.defauts.push(`« ${nom} » : « ${court} » sans statut — établi, décision, hypothèse ou inconnu`);
        else compte[it.statut]++;
        if (it.statut === 'hypothèse') { if (vide(it.ref)) d.defauts.push(`« ${nom} » : l'hypothèse « ${court} » ne dit pas laquelle — référence HYP-nn attendue`); else refs.add(it.ref); }
      }
      if (items.length && items.every(it => it.statut === 'hypothèse' || it.statut === 'inconnu')) fragiles.push(nom);
      blocs[cle] = { nom, items };
    }
    const n = Object.values(compte).reduce((a, b) => a + b, 0);
    if (n) d.constats.push(`${compte['hypothèse']} élément(s) sur ${n} reposent sur une hypothèse à tester, ${compte.inconnu} restent inconnu(s)`);
    for (const f of fragiles) d.constats.push(`le bloc « ${f} » ne repose que sur des hypothèses ou des inconnus : c'est là que le modèle peut tomber`);
    /* LES OPÉRATEURS DU SERVICE (MCR-006). Les segments disent les clients ; il faut aussi dire
       qui fait tourner le service, ou décider qu'il n'y a personne. */
    const operateurs = [].concat(ex.operateurs || []).map(o => typeof o === 'string' ? { nom: o } : { ...o });
    if (ex.operateurs === undefined && vide(ex.sans_operateur))
      d.defauts.push("opérateurs du service non déclarés — « operateurs » (qui fait tourner le service) ou « sans_operateur » avec son motif : un opérateur oublié, ce sont ses écrans qui manquent");
    if (!operateurs.length && ex.operateurs !== undefined && vide(ex.sans_operateur))
      d.defauts.push("« operateurs » vide sans motif — « sans_operateur » dit pourquoi personne ne fait tourner le service");
    for (const o of operateurs) {
      const qui = o.nom || '?';
      if (vide(o.nom)) d.defauts.push('opérateur sans nom');
      if (vide(o.activite)) d.defauts.push(`opérateur « ${qui} » : l'activité clé qu'il porte n'est pas dite`);
      if (vide(o.voit_fait)) d.defauts.push(`opérateur « ${qui} » : ce qu'il voit et fait dans le produit n'est pas dit — ce sont ses écrans`);
      if (o.statut && !STATUTS.includes(o.statut)) d.defauts.push(`opérateur « ${qui} » : statut « ${o.statut} »`);
      if (o.statut === 'hypothèse' && vide(o.ref)) d.defauts.push(`opérateur « ${qui} » : hypothèse sans référence HYP-nn`);
    }
    if (!vide(ex.sans_operateur) && operateurs.length) d.defauts.push('« sans_operateur » et des opérateurs déclarés à la fois : il faut choisir');
    if (!vide(ex.sans_operateur)) d.constats.push(`aucun opérateur, décidé : ${ex.sans_operateur}`);
    return { blocs, compte, fragiles, refs: [...refs], operateurs, sans_operateur: ex.sans_operateur || null };
  },

  dimensionnement(ex, fmt, d) {
    const chaine = [].concat(ex.chaine || []);
    if (!chaine.length) return null;
    let courant = null;
    const etapes = [], resultats = [];
    chaine.forEach((e, i) => {
      const lib = e.libelle || `étape ${i + 1}`;
      if (i === 0 || e.op === undefined) {
        if (i > 0) { d.defauts.push(`« ${lib} » : opération absente`); return; }
        courant = grandeur(e.valeur, e.fourchette);
        if (!courant) { d.defauts.push(`« ${lib} » : point de départ sans valeur`); return; }
        etapes.push({ op: null, libelle: lib, origine: e.origine, source: e.source, valeur: courant });
      } else if (e.op === '=') {
        if (!courant) return;
        const v = annonce(e.attendu, courant);
        if (!v.ok) d.defauts.push(`« ${lib} » : le texte annonce ${plage(v.a)}, le calcul donne ${plage(courant)}`);
        const r = { libelle: lib, calcule: courant, affiche: v.ok && v.a ? v.a : courant, verifie: !!v.a && v.ok };
        resultats.push(r);
        etapes.push({ op: '=', libelle: lib, origine: 'calcul', valeur: r.affiche, calcule: courant });
      } else if (e.op === '×' || e.op === '÷') {
        const g = grandeur(e.valeur, e.fourchette);
        if (!g) { d.defauts.push(`« ${lib} » : facteur sans valeur`); return; }
        if (!courant) return;
        courant = e.op === '×' ? fois(courant, g) : divise(courant, g);
        etapes.push({ op: e.op, libelle: lib, origine: e.origine, source: e.source, valeur: g, fourchette: Array.isArray(e.fourchette) });
      } else d.defauts.push(`« ${lib} » : opération « ${e.op} » inconnue — × ÷ ou =`);
      if (e.op !== '=' && !ORIGINES.includes(e.origine)) d.defauts.push(`« ${lib} » : origine « ${e.origine ?? '∅'} » — sourcé, hypothèse ou règle`);
      if (e.origine === 'sourcé' && vide(e.source)) d.defauts.push(`« ${lib} » : déclaré sourcé sans source — c'est une hypothèse`);
    });
    if (chaine.length && chaine[chaine.length - 1].op !== '=') d.defauts.push('la chaîne ne se termine pas par un résultat « = »');
    const hyp = etapes.filter(e => e.origine === 'hypothèse');
    if (hyp.length) d.constats.push(`${hyp.length} hypothèse(s) portent le résultat : ${hyp.map(h => h.libelle).join(' · ')}`);
    return { etapes, resultats, resultat: resultats[resultats.length - 1] || null };
  },

  reservoirs(ex, fmt, d) {
    const attributs = [].concat(ex.attributs || []);
    const pools = [].concat(ex.reservoirs || []).map((p, i) => {
      const ca = grandeur(p.ca);
      if (!ca) d.defauts.push(`réservoir « ${p.nom || i + 1} » sans chiffre d'affaires`);
      for (const a of attributs) if (vide(p.valeurs?.[a])) d.defauts.push(`réservoir « ${p.nom || i + 1} » : attribut « ${a} » non renseigné`);
      return { nom: p.nom, ca, libre: vide(p.occupe_par), occupe_par: p.occupe_par || null, marge: p.marge ?? null, valeurs: p.valeurs || {} };
    });
    if (pools.length < 2) d.defauts.push('un seul réservoir : rien à comparer');
    const max = Math.max(...pools.map(p => p.ca?.h || 0), 0);
    pools.forEach(p => { p.part = p.ca && max ? { b: p.ca.b / max, h: p.ca.h / max } : null; });
    if (!pools.some(p => p.libre)) d.constats.push('aucun réservoir libre : toute la valeur est déjà prise');
    const sansMarge = pools.every(p => p.marge === null);
    if (sansMarge) d.constats.push("aucune marge connue : c'est un pool de chiffre d'affaires, pas encore de profit");
    let rapport = null;
    if (ex.rapport) {
      const n = grandeur(ex.rapport.numerateur?.valeur), q = grandeur(ex.rapport.denominateur?.valeur);
      if (!n || !q) d.defauts.push('rapport : numérateur ou dénominateur sans valeur');
      else rapport = { valeur: n.c / q.c, numerateur: { ...ex.rapport.numerateur, g: n }, denominateur: { ...ex.rapport.denominateur, g: q }, libelle: ex.rapport.libelle || '' };
    }
    return { attributs, reservoirs: pools, sans_marge: sansMarge, rapport };
  },

  'compte-inverse'(ex, fmt, d) {
    const cible = grandeur(ex.cible?.valeur);
    if (!cible) { d.defauts.push('cible sans valeur'); return null; }
    let courant = cible.c;
    const etapes = [{ op: null, valeur: cible.c, libelle: ex.cible.libelle || '', origine: ex.cible.origine || 'cible', resultat: cible.c }];
    const chaine = [].concat(ex.chaine || []);
    const exposants = [];
    for (const e of chaine) {
      const v = Number(e.valeur);
      if (!Number.isFinite(v) || v === 0) { d.defauts.push(`« ${e.libelle || '?'} » : valeur absente ou nulle`); return null; }
      if (e.op !== '×' && e.op !== '÷') { d.defauts.push(`« ${e.libelle || '?'} » : opération « ${e.op ?? '∅'} » — × ou ÷`); return null; }
      if (!ORIGINES.includes(e.origine)) d.defauts.push(`« ${e.libelle} » : origine « ${e.origine ?? '∅'} » — sourcé, hypothèse, règle ou cible`);
      courant = e.op === '×' ? courant * v : courant / v;
      exposants.push(e.op === '×' ? 1 : -1);
      etapes.push({ op: e.op, valeur: v, libelle: e.libelle, origine: e.origine, ref: e.ref || null, donne: e.donne || null, resultat: courant });
    }
    const exige = courant;
    const ref = Number(ex.reference?.valeur);
    if (!Number.isFinite(ref)) { d.defauts.push("référence sans valeur : l'exigence ne se confronte à rien"); return { etapes, exige }; }
    if (vide(ex.reference?.source)) d.defauts.push('référence sans source');
    const ecart = exige > ref * (1 + 1e-9);
    const rapport = exige / ref;
    const leviers = [];
    if (ecart) {
      d.constats.push(`il faut ${nombre(exige)} ${ex.exige}, la référence en observe ${nombre(ref)} : à ce niveau, la cible rapporte ${nombre(cible.c * ref / exige, { approx: true })}, pas ${nombre(cible.c)}`);
      chaine.forEach((e, i) => {
        if (!e.levier) return;
        const requis = exposants[i] === -1 ? Number(e.valeur) * rapport : Number(e.valeur) / rapport;
        const borne = Number.isFinite(e.max) ? e.max : null;
        const possible = borne === null || requis <= borne;
        leviers.push({ verbe: e.levier, libelle: e.libelle, court: e.court || null, actuel: Number(e.valeur), requis,
          arrondi: e.entier ? Math.ceil(requis - 1e-9) : null, possible, borne });
      });
    }
    return { cible: { ...ex.cible, valeur: cible.c }, etapes, exige, exige_libelle: ex.exige, reference: { ...ex.reference, valeur: ref },
             ecart, rapport, rendement_a_la_reference: cible.c * ref / exige, leviers };
  },

  'test-cards'(ex, fmt, d) {
    const CH = ['croyons', 'verifions', 'tort_si', 'avant', 'rang'];
    const cartes = [].concat(ex.cartes || []).map(c => ({ ...c }));
    for (const c of cartes) {
      for (const k of CH) if (vide(c[k])) d.defauts.push(`${c.id || 'carte'} : « ${k} » absent`);
      if (!vide(c.tort_si) && !/\d|\b(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|vingt)\b/i.test(String(c.tort_si)))
        d.defauts.push(`${c.id || 'carte'} : « nous avons tort si » sans seuil chiffré — il ne réfute rien`);
    }
    const ids = cartes.map(c => c.id).filter(Boolean);
    if (new Set(ids).size !== ids.length) d.defauts.push('deux cartes portent le même identifiant');
    cartes.sort((a, b) => (a.rang ?? 99) - (b.rang ?? 99));
    const premier = cartes.filter(c => c.rang === Math.min(...cartes.map(x => x.rang ?? 99)));
    return { cartes, premier_rang: premier.map(c => c.id) };
  },

  metriques(ex, fmt, d) {
    const res = [].concat(ex.resultats || []), ent = [].concat(ex.entrees || []);
    const ids = new Set(res.map(r => r.id));
    for (const r of res) {
      for (const k of ['id', 'nom', 'cible', 'quand', 'niveau']) if (vide(r[k])) d.defauts.push(`${r.id || 'résultat'} : « ${k} » absent`);
      if (r.niveau && !['intermediaire', 'final'].includes(r.niveau)) d.defauts.push(`${r.id} : niveau « ${r.niveau} » — intermediaire ou final`);
      if (r.aujourdhui === undefined) d.defauts.push(`${r.id} : valeur actuelle absente — écrire « non mesuré » plutôt que rien`);
    }
    const aretes = [];
    const lie = (de, vers, qui) => { if (!ids.has(vers)) d.defauts.push(`${qui} alimente « ${vers} », qui n'est pas un résultat déclaré`); else aretes.push([de, vers]); };
    ent.forEach((e, i) => {
      if (vide(e.nom)) d.defauts.push(`entrée ${i + 1} sans nom`);
      if (vide(e.alimente)) d.defauts.push(`entrée « ${e.nom} » n'alimente aucun résultat`);
      [].concat(e.alimente || []).forEach(v => lie('E' + i, v, `« ${e.nom} »`));
    });
    const sansCible = ent.filter(e => vide(e.cible)).map(e => e.nom);
    if (sansCible.length) d.constats.push(`${sansCible.length === ent.length ? 'aucune entrée ne porte de cible' : `${sansCible.length} entrée(s) sans cible`} — ${sansCible.join(' · ')} : un vœu, pas encore une métrique`);
    res.forEach(r => [].concat(r.alimente || []).forEach(v => lie(r.id, v, r.id)));
    const atteint = new Set();
    let front = ent.map((_, i) => 'E' + i);
    while (front.length) {
      const suiv = [];
      for (const n of front) for (const [a, b] of aretes) if (a === n && !atteint.has(b)) { atteint.add(b); suiv.push(b); }
      front = suiv;
    }
    for (const r of res.filter(r => r.niveau === 'final'))
      if (!atteint.has(r.id)) d.defauts.push(`${r.id} « ${r.nom} » : aucune entrée ne l'atteint — un résultat que rien n'alimente ne se pilote pas`);
    const avantVente = res.filter(r => r.avant_vente).length;
    return { resultats: res, entrees: ent, aretes, avant_vente: avantVente };
  },
};

Object.assign(EVAL, {
  persona(ex, fmt, d) {
    if (!/^PER-\d{2,}$/.test(String(ex.id || ''))) d.defauts.push(`identifiant « ${ex.id ?? '∅'} » — PER-nn attendu`);
    if (!['DOCUMENTARY', 'EMPIRICAL'].includes(ex.niveau)) d.defauts.push(`niveau d'evidence « ${ex.niveau ?? '∅'} » — DOCUMENTARY ou EMPIRICAL`);
    /* DEUX FAMILLES (MCR-006) : le client qui paie ou utilise, l'opérateur qui fait tourner le
       service. Un persona sans famille laisse passer l'oubli que TennisCoach a payé : les écrans du coach. */
    if (!['client', 'operateur'].includes(ex.famille)) d.defauts.push(`famille « ${ex.famille ?? '∅'} » — client ou operateur`);
    else if (ex.famille === 'operateur' && vide(ex.operateur)) d.defauts.push("persona opérateur sans le nom de l'opérateur du canevas qu'il incarne — champ « operateur »");
    const c = ex.citation || {};
    if (vide(c.texte) || !SOURCE_RE.test(String(c.source || ''))) d.defauts.push('citation sans texte ou sans source S-nn / E-nn — une phrase écrite pour le persona n\'est pas une citation');
    const blocs = {};
    let hyp = 0;
    for (const [cle, nom] of [['objectifs', 'Objectifs'], ['frustrations', 'Frustrations'], ['comportements', 'Comportements'], ['contexte', 'Contexte']]) {
      const t = traits(ex[cle], nom, fmt, d);
      blocs[cle] = t.items; hyp += t.hypotheses;
    }
    const curseurs = [].concat(ex.curseurs || []).map(k => ({ ...k }));
    for (const k of curseurs) {
      const pos = Number(k.position);
      if (vide(k.gauche) || vide(k.droite)) d.defauts.push('curseur sans ses deux pôles');
      if (!(pos >= 0 && pos <= 1)) d.defauts.push(`curseur « ${k.gauche} ↔ ${k.droite} » : position ${k.position ?? '∅'} — entre 0 et 1`);
      if ([...new Set([].concat(k.sources || []))].length < 2) d.defauts.push(`curseur « ${k.gauche} ↔ ${k.droite} » : deux sources attendues`);
    }
    if (curseurs.length > 4) d.defauts.push(`${curseurs.length} curseurs, 4 au plus`);
    const sources = sourcesDe(...Object.values(blocs), curseurs, [c]);
    const n = Object.values(blocs).reduce((a, b) => a + b.length, 0);
    if (hyp) d.constats.push(`${hyp} trait(s) sur ${n} restent des hypothèses à tester`);
    if (ex.niveau === 'DOCUMENTARY') d.constats.push('persona DOCUMENTARY : des paroles lues, pas des comportements observés');
    return { blocs, curseurs, citation: c, sources, traits: n, hypotheses: hyp };
  },

  'empathy-map'(ex, fmt, d) {
    if (!/^PER-\d{2,}$/.test(String(ex.persona || ''))) d.defauts.push(`persona « ${ex.persona ?? '∅'} » — PER-nn attendu`);
    const Q = [['dit', 'Dit', { min: 1, citation: true }], ['fait', 'Fait', {}], ['pense', 'Pense', {}], ['ressent', 'Ressent', {}],
               ['douleurs', 'Douleurs', {}], ['gains', 'Gains', {}]];
    const cadrans = {}, vides = [];
    let hyp = 0;
    for (const [cle, nom, o] of Q) {
      const t = traits(ex[cle], nom, fmt, d, o);
      cadrans[cle] = t.items; hyp += t.hypotheses;
      if (!t.items.length) vides.push(nom);
    }
    if (vides.length) d.constats.push(`cadran(s) sans fondement : ${vides.join(' · ')} — laissé(s) vide(s) plutôt qu'imaginé(s)`);
    const inferes = [...cadrans.pense, ...cadrans.ressent];
    if (inferes.length && inferes.every(it => it.statut === 'hypothèse')) d.constats.push("ce qu'elle pense et ressent ne repose encore que sur des hypothèses");
    return { cadrans, sources: sourcesDe(...Object.values(cadrans)), hypotheses: hyp, vides };
  },

  'journey-map'(ex, fmt, d) {
    if (!/^PER-\d{2,}$/.test(String(ex.persona || ''))) d.defauts.push(`persona « ${ex.persona ?? '∅'} » — PER-nn attendu`);
    const etapes = [].concat(ex.etapes || []).map(e => ({ ...e }));
    const min = fmt.min_etapes || 3, max = fmt.max_etapes || 8;
    if (etapes.length < min || etapes.length > max) d.defauts.push(`${etapes.length} étape(s) — entre ${min} et ${max}`);
    for (const e of etapes) {
      const nom = e.nom || '?';
      if (vide(e.nom)) d.defauts.push('étape sans nom');
      if (e.inconnue) continue;
      for (const k of ['fait', 'contact', 'pense']) if (vide(e[k])) d.defauts.push(`« ${nom} » : « ${k} » absent — ou l'étape est déclarée inconnue`);
      if (!Number.isInteger(e.emotion) || e.emotion < -2 || e.emotion > 2) d.defauts.push(`« ${nom} » : émotion « ${e.emotion ?? '∅'} » — un entier de −2 à +2`);
      const src = [...new Set([].concat(e.sources || []))];
      if (src.length < 2) d.defauts.push(`« ${nom} » : ${src.length ? 'une seule source' : 'aucune source'} — deux attendues, ou l'étape est déclarée inconnue`);
    }
    const notees = etapes.map((e, i) => ({ i, v: e.emotion })).filter(x => Number.isInteger(x.v));
    if (!notees.length) return { etapes, courbe: [] };
    const haut = notees.reduce((a, b) => b.v > a.v ? b : a), bas = notees.reduce((a, b) => b.v < a.v ? b : a);
    const b = etapes[bas.i];
    const opp = [].concat(b.opportunites || []);
    if (![].concat(b.irritants || []).length) d.defauts.push(`le point bas « ${b.nom} » ne porte aucun irritant — c'est le moment de vérité`);
    if (!opp.length) d.defauts.push(`le point bas « ${b.nom} » ne porte aucune opportunité — le parcours ne dit pas ce que le produit doit changer`);
    for (const o of opp) if (typeof o === 'object' && vide(o.ref) && [].concat(o.sources || []).length < 2)
      d.defauts.push(`opportunité « ${String(o.texte || '').slice(0, 40)} » : ni HYP-nn ni deux sources`);
    const amplitude = haut.v - bas.v;
    d.constats.push(`point bas : « ${b.nom} » (${bas.v}) ; point haut : « ${etapes[haut.i].nom} » (${haut.v}) ; amplitude ${amplitude}`);
    const inconnues = etapes.filter(e => e.inconnue).map(e => e.nom);
    if (inconnues.length) d.constats.push(`étape(s) qu'aucune source ne décrit : ${inconnues.join(' · ')}`);
    return { etapes, courbe: etapes.map(e => Number.isInteger(e.emotion) ? e.emotion : null), haut: haut.i, bas: bas.i, amplitude,
             sources: sourcesDe(etapes) };
  },
});

/* LES CARTES D'APPRENTISSAGE — ce que des personnes réelles ont FAIT devant le produit
   (INSEAD NBV ; Strategyzer, Learning Card). Une carte par test : son hypothèse, son critère
   écrit AVANT, ce qui a été observé, l'échelon de fiabilité de l'observation, le verdict et la
   décision. La machine calcule, pour chaque hypothèse critique, le plus haut échelon qui l'a
   tranchée : un propos ne tranche rien, une preuve SYNTHETIC n'est pas une observation. */
Object.assign(EVAL, {
  apprentissages(ex, fmt, d) {
    const ECHELLE = ['propos', 'interet', 'action', 'paiement'];
    const VERDICTS = ['confirmée', 'infirmée', 'non_tranchée'];
    const HYP = /^HYP-\d{2,}$/, PREUVE = /^E-\d{2,}$/;
    const jour = v => { const t = v instanceof Date ? v.getTime() : Date.parse(String(v ?? '')); return Number.isFinite(t) ? t : null; };
    const date = v => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v));
    const hyps = [].concat(ex.hypotheses || []).map(h => ({ ...h, critique: h.critique !== false }));
    for (const h of hyps) {
      if (!HYP.test(String(h.id || ''))) d.defauts.push(`hypothèse « ${h.id ?? '∅'} » — HYP-nn attendu`);
      if (vide(h.enjeu)) d.defauts.push(`${h.id || 'hypothèse'} : son enjeu n'est pas dit`);
    }
    if (hyps.length && !hyps.some(h => h.critique)) d.defauts.push("aucune hypothèse critique : les tests ne disent pas ce qui peut tout arrêter");
    const cartes = [].concat(ex.cartes || []).map(c => ({ ...c }));
    const ids = cartes.map(c => c.id).filter(Boolean);
    if (new Set(ids).size !== ids.length) d.defauts.push('deux cartes portent le même identifiant');
    for (const c of cartes) {
      const qui = c.id || 'carte';
      for (const k of ['pensions', 'fait', 'observe', 'decidons']) if (vide(c[k])) d.defauts.push(`${qui} : « ${k} » absent`);
      if (!HYP.test(String(c.ref || ''))) d.defauts.push(`${qui} : l'hypothèse testée manque — HYP-nn`);
      const cr = typeof c.critere === 'string' ? { texte: c.critere } : (c.critere || {});
      if (vide(cr.texte)) d.defauts.push(`${qui} : aucun critère de réussite — un test sans critère écrit avant ne prouve rien`);
      else if (jour(cr.ecrit_le) === null) d.defauts.push(`${qui} : le critère n'est pas daté — rien ne montre qu'il a été écrit avant le test`);
      else if (jour(c.teste_le) !== null && jour(cr.ecrit_le) > jour(c.teste_le))
        d.defauts.push(`${qui} : critère écrit le ${date(cr.ecrit_le)}, après le test du ${date(c.teste_le)} — il confirme ce qu'on a lu`);
      if (!PREUVE.test(String(c.source || ''))) d.defauts.push(`${qui} : l'observation ne cite pas sa preuve E-nn — l'export brut sous results/`);
      if (String(c.niveau || '').toUpperCase() === 'SYNTHETIC') d.defauts.push(`${qui} : preuve SYNTHETIC — un utilisateur simulé n'est pas une observation`);
      if (!ECHELLE.includes(c.fiabilite)) d.defauts.push(`${qui} : échelon de fiabilité « ${c.fiabilite ?? '∅'} » — ${ECHELLE.join(' < ')}`);
      if (!VERDICTS.includes(c.verdict)) d.defauts.push(`${qui} : verdict « ${c.verdict ?? '∅'} » — confirmée, infirmée ou non_tranchée`);
      if (c.fiabilite === 'propos' && c.verdict === 'confirmée') d.defauts.push(`${qui} : un propos ne confirme pas une hypothèse — « j'achèterais » n'est pas un achat`);
    }
    /* le plus haut échelon qui a TRANCHÉ chaque hypothèse — confirmée ou infirmée, jamais un propos */
    const connues = new Set(hyps.map(h => h.id));
    const orphelines = [...new Set(cartes.map(c => c.ref).filter(r => HYP.test(String(r || '')) && !connues.has(r)))];
    const lignes = [...hyps, ...orphelines.map(id => ({ id, enjeu: null, critique: false }))].map(h => {
      const sienne = cartes.filter(c => c.ref === h.id);
      const tranchantes = sienne.filter(c => ['confirmée', 'infirmée'].includes(c.verdict) && ECHELLE.includes(c.fiabilite)
        && c.fiabilite !== 'propos' && String(c.niveau || '').toUpperCase() !== 'SYNTHETIC');
      const rang = Math.max(-1, ...tranchantes.map(c => ECHELLE.indexOf(c.fiabilite)));
      const decisive = tranchantes.filter(c => ECHELLE.indexOf(c.fiabilite) === rang).at(-1);
      return { id: h.id, enjeu: h.enjeu || null, critique: h.critique, cartes: sienne.map(c => c.id),
        echelon: rang >= 0 ? ECHELLE[rang] : null, verdict: decisive ? decisive.verdict : 'non_tranchée' };
    });
    const critiques = lignes.filter(l => l.critique);
    const parActe = critiques.filter(l => ECHELLE.indexOf(l.echelon) >= ECHELLE.indexOf('action'));
    if (critiques.length && !parActe.length)
      d.constats.push("aucune hypothèse critique tranchée par un acte ou un paiement : le socle se construirait sur des paroles — G0 ne passe qu'avec une réserve");
    const ouvertes = critiques.filter(l => l.verdict === 'non_tranchée').map(l => l.id);
    if (ouvertes.length) d.constats.push(`hypothèse(s) critique(s) non tranchée(s) : ${ouvertes.join(' · ')} — chacune garde son prochain test`);
    const infirmees = lignes.filter(l => l.verdict === 'infirmée').map(l => l.id);
    if (infirmees.length) d.constats.push(`infirmée(s) : ${infirmees.join(' · ')} — la thèse est reprise`);
    if (orphelines.length) d.constats.push(`carte(s) sur une hypothèse non déclarée critique : ${orphelines.join(' · ')}`);
    return { echelle: ECHELLE, hypotheses: lignes, cartes, tranchee_par_acte: parActe.length > 0,
      plus_haut: critiques.reduce((m, l) => Math.max(m, ECHELLE.indexOf(l.echelon)), -1) };
  },
});

/* L'ÉCONOMIE UNITAIRE — ce qu'un client rapporte, ce qu'il coûte à gagner, et quand l'argent
   revient (INSEAD NBV). Les entrées se déclarent avec leur origine ; la machine calcule la
   marge, la durée de vie, la valeur vie client, LTV / CAC, la récupération et la piste, et
   confronte ce que le texte annonce à ce calcul. */
Object.assign(EVAL, {
  'economie-unitaire'(ex, fmt, d) {
    const PERIODES = { mois: 1, an: 12, annee: 12, année: 12 };
    const HYP = /^HYP-\d{2,}$/, PREUVE = /^E-\d{2,}$/;
    const parMois = PERIODES[String(ex.periode || '').toLowerCase()];
    if (!parMois) d.defauts.push(`période « ${ex.periode ?? '∅'} » — mois ou an`);
    const lire = (cle, nom, { min = 0, max = Infinity, strict = false } = {}) => {
      const x = ex[cle];
      if (!x || typeof x !== 'object') return null;
      const v = Number(x.valeur);
      if (!Number.isFinite(v) || v < min || v > max || (strict && v === min)) { d.defauts.push(`${nom} : valeur « ${x.valeur ?? '∅'} » hors domaine`); return null; }
      if (!ORIGINES.includes(x.origine)) d.defauts.push(`${nom} : origine « ${x.origine ?? '∅'} » — sourcé, hypothèse ou règle`);
      if (x.origine === 'sourcé' && vide(x.source)) d.defauts.push(`${nom} : déclaré sourcé sans source — c'est une hypothèse`);
      if (x.origine === 'hypothèse' && !HYP.test(String(x.ref || ''))) d.defauts.push(`${nom} : hypothèse sans référence HYP-nn`);
      return { ...x, valeur: v };
    };
    const rev = lire('revenu', 'revenu', { strict: true }), cout = lire('cout_service', 'coût de service');
    const att = lire('attrition', 'attrition', { max: 1, strict: true }), cac = lire('cac', "coût d'acquisition", { strict: true });
    const tre = lire('tresorerie', 'trésorerie'), cons = lire('consommation', 'consommation', { strict: true });
    if (!rev || !cout || !att || !cac || !parMois) return null;
    const marge = rev.valeur - cout.valeur;
    if (marge <= 0) { d.defauts.push(`marge de contribution ${nombre(marge)} par ${ex.periode} : chaque client creuse la perte`); return { marge }; }
    const vie = 1 / att.valeur, ltv = marge * vie, ratio = ltv / cac.valeur, recuperation = (cac.valeur / marge) * parMois;
    const piste = tre && cons ? tre.valeur / cons.valeur : null;
    if (cac.origine === 'sourcé' && !PREUVE.test(String(cac.source))) d.constats.push("le coût d'acquisition cite une source qui n'est pas une preuve E-nn des tests de marché");
    if (cac.origine !== 'sourcé') d.constats.push("coût d'acquisition non mesuré : une hypothèse, que les tests de marché doivent trancher");
    if (ratio < 3) d.constats.push(`LTV / CAC = ${nombre(ratio, { decimales: 1 })} : sous le repère de 3`);
    if (recuperation > 12) d.constats.push(`récupération en ${nombre(recuperation, { decimales: 0 })} mois : au-delà de douze mois`);
    if (piste !== null && piste < recuperation) d.constats.push(`piste de ${nombre(piste, { decimales: 0 })} mois, plus courte que la récupération d'un client`);
    const an = ex.annonce || {};
    for (const [k, nom, calc] of [['ltv', 'valeur vie client', ltv], ['ratio', 'LTV / CAC', ratio], ['recuperation', 'récupération', recuperation]]) {
      if (an[k] === undefined) continue;
      const { ok } = annonce(an[k], { c: calc, b: calc, h: calc });
      if (!ok) d.defauts.push(`${nom} annoncée ${an[k]}, le calcul donne ${nombre(calc, { decimales: k === 'ratio' ? 1 : 0 })}`);
    }
    return { unite: ex.unite, periode: ex.periode, revenu: rev, cout_service: cout, attrition: att, cac, tresorerie: tre, consommation: cons,
      marge, taux_marge: marge / rev.valeur, vie, ltv, ratio, recuperation, piste };
  },
});

export const evaluateurs = () => Object.keys(EVAL);

/** Évalue un exhibit. { ok, format, defauts, constats, calcul }. */
export function evaluer(ex, porteur = null) {
  const d = { defauts: [], constats: [] };
  const fmt = formatDe(ex?.format);
  if (!fmt) return { ok: false, format: ex?.format ?? null, defauts: [`format « ${ex?.format ?? '∅'} » non déclaré au gabarit`], constats: [], calcul: null };
  if (porteur && (porteur.wp !== fmt.porte.wp || !portePar(fmt.porte.file, porteur.file || '')))
    d.defauts.push(`porté par ${porteur.wp} · ${porteur.file}, déclaré pour ${fmt.porte.wp} · ${fmt.porte.file}`);
  communs(ex, fmt, d.defauts);
  let calcul = null;
  try { calcul = EVAL[fmt.id](ex, fmt, d); } catch (e) { d.defauts.push('calcul impossible — ' + e.message); }
  return { ok: !d.defauts.length, format: fmt.id, nom: fmt.nom, reference: fmt.reference, question: fmt.question,
           titre: ex.titre, source: ex.source || null, donnees: ex, calcul, defauts: d.defauts, constats: d.constats };
}

/** Les formats qu'un fichier doit porter : ceux que le gabarit lui assigne. */
export const formatsPortesPar = (wpId, file, lang) =>
  formatsDeclares(lang).filter(f => f.porte?.wp === wpId && portePar(f.porte.file, file));

/** Cohérence gabarit ↔ registre ↔ code. Liste vide = cohérent. */
export function exhibitFindings() {
  const f = [], r = registry(), vus = new Set();
  for (const fmt of formatsDeclares()) {
    if (vus.has(fmt.id)) f.push(`format « ${fmt.id} » déclaré deux fois`);
    vus.add(fmt.id);
    for (const k of ['nom', 'reference', 'question', 'porte', 'champs', 'regles'])
      if (vide(fmt[k])) f.push(`format « ${fmt.id} » : « ${k} » absent`);
    const w = byId(r.work_products, fmt.porte?.wp);
    if (!w) f.push(`format « ${fmt.id} » : porté par ${fmt.porte?.wp}, livrable inconnu du registre`);
    else if (!(w.files || []).includes(fmt.porte.file)) f.push(`format « ${fmt.id} » : file « ${fmt.porte.file} » n'est pas un fichier déclaré au registre pour ${w.id}`);
    if (!EVAL[fmt.id]) f.push(`format « ${fmt.id} » : aucun évaluateur — la machine ne saurait pas le vérifier`);
  }
  for (const id of Object.keys(EVAL)) if (!vus.has(id)) f.push(`évaluateur « ${id} » sans format déclaré au gabarit`);
  return f;
}

export default { evaluer, exhibitFindings, formatsPortesPar, formatDe, formatsDeclares, nombre, plage, grandeur };
