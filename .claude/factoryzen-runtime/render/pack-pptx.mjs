/* Rendu PowerPoint du pack — charte « encre et os ».
 *
 * Consomme le MODÈLE que lib/pack.mjs projette du dépôt : il ne lit aucun livrable, ne
 * calcule rien, ne choisit aucun chiffre. Chaque planche de format reçoit des nombres
 * déjà vérifiés par lib/exhibits.mjs ; une planche refusée n'arrive jamais ici.
 *
 * Séparé du plugin : le plugin reste sans dépendance, le rendu en a une (pptxgenjs),
 * vendorée dans vendor/office/ : rien à installer.
 *
 *   node render/pack-pptx.mjs <projet> [cadence] [--couverture image.png] [--sortie fichier.pptx] */

import { PptxGenJS } from '../lib/office.mjs';
import { recompresser } from './zip-office.mjs';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packModel } from '../lib/pack.mjs';
import { nombre as nombreFr, plage as plageFr, grandeur } from '../lib/exhibits.mjs';
import { ENCRE, OS, OS2, PAPIER, AMBRE, AMBRE_C, AMBRE_T, MUET_S, MUET_C, TRAIT, GRIS, NUIT, TXT_C, TXT_S, TXT_SD } from './palette.mjs';


/* ── charte ───────────────────────────────────────────────────────────── */
const DISP = 'Arial', CORPS = 'Calibri', CIT = 'Cambria';
const W = 13.333, M = 0.95, LARG = W - 2 * M, DROITE = W - M;

/* ── les mentions fixes des planches que les gabarits emploient, par langue ──
   Le modèle dit sa langue (modele.lang) ; un pack de projet n'en dit pas : il est en français. */
const MOTS = {
  fr: {
    tag: { 'sourcé': 'SOURCÉ', 'hypothèse': 'HYPOTHÈSE', 'règle': 'RÈGLE', 'cible': 'CIBLE', 'calcul': 'CALCUL' },
    formatRef: 'FORMAT DE RÉFÉRENCE   ', consigne: 'Consigne', exemple: 'Exemple',
    gabarit: 'GABARIT', commentServir: 'Comment se servir de ce gabarit',
    modeSuite: " Une planche par section du standard ; les notes de l'orateur répètent la consigne. Le Markdown du dépôt reste la version que la machine contrôle.",
    fichier: (r, n) => `FICHIER ${r} / ${n}`,
    phraseTitre: '[la réponse du livrable, en une phrase, comme titre de la planche]',
    reponse: '[votre réponse en une ligne]',
    zone: '[Le contenu de la section : un tableau, un schéma ou trois points — ce que la consigne demande, sourcé et daté]',
    sep: ' : ', regle: 'Règle', uneParFiche: 'UNE PLANCHE PAR FICHE', enonce: '[énoncé]',
    champs: ['Champ', 'À écrire', 'Ce que le champ exige'],
    verifierZone: "[Ce qui n'est pas établi, pourquoi cela compte, ce qu'il faut pour le savoir]",
    methode: r => `Méthode : ${r}.`,
    communiqueDate: (d, e) => `${d}   ·   communiqué fictif, écrit le ${e}`,
    citation: t => `« ${t} »`,
    citationStatut: (a, st) => `${a} — citation ${st}${st === 'visée' ? ', à obtenir' : ''}.`,
    oblige: 'CE QUE LE COMMUNIQUÉ OBLIGE À TRANCHER',
    bmc: {}, fragile: "NE TIENT QU'À DES HYPOTHÈSES", operateurs: 'OPÉRATEURS DU SERVICE', sansOperateur: m => `Aucun opérateur — ${m}`,
    famille: { client: 'CLIENT', operateur: 'OPÉRATEUR' },
    bmcPied: (h, n) => `Gras : décision · encre : établi · ambre : hypothèse à tester (H-n) · gris : inconnu. ${h} éléments sur ${n} reposent sur une hypothèse.`,
    dimFormat: 'Dimensionnement par le bas', fourchette: (b, h) => ` (${b} à ${h})`, verifie: ' — vérifié',
    resultat: 'Le résultat', resultatTexte: (a, c) => `${a} annoncé ; le calcul, fourchettes propagées, donne ${c}.`,
    hypPortent: n => `${n} hypothèses le portent`, sensibilite: 'La sensibilité',
    sensibiliteTexte: 'Chaque facteur pèse en proportion : un écart de moitié sur une hypothèse double ou divise le résultat.',
    poolsFormat: 'Profit pools · Bain, adapté', libre: 'libre',
    longueur: "Longueur proportionnelle au chiffre d'affaires annuel ; partie claire : haut de fourchette.",
    rapport: 'LE RAPPORT QUI COMPTE', contre: (a, b, c, d) => `${a} ${b}, contre ${c} ${d}.`, libres: 'RÉSERVOIRS LIBRES',
    sansMarge: "Un pool de chiffre d'affaires, pas encore de profit : aucune marge n'est connue.",
    ddpFormat: 'Discovery-Driven Planning · McGrath', ecart: "L'ÉCART", marge: 'LA MARGE',
    exiges: (l, n) => `${l}, contre ${n} exigés.`, source: s => `Source : ${s}`,
    rapporte: (a, b) => `À ce niveau, la cible rapporte ${a}, pas ${b}.`, fermer: "FERMER L'ÉCART — CALCULÉ",
    retenir: 'Retenir', enMoyenne: (n, l) => `en moyenne ${n} ${l} ou plus.`,
    auLieu: (a, c, b) => `${a} ${c} au lieu de ${b}.`, impossible: (a, c, b) => `${a} ${c} : impossible, au-delà de ${b}.`,
    couvre: "La référence couvre l'exigence : la cible est atteignable sur ce facteur.",
    rang: 'RANG DE TEST', carte: ['NOUS CROYONS QUE', 'NOUS LE VÉRIFIONS PAR', 'NOUS AVONS TORT SI', 'AVANT LE'],
    metFormat: "Métriques d'entrée et de sortie · Amazon", entrees: 'ENTRÉES — CHAQUE SEMAINE',
    inter: 'RÉSULTATS INTERMÉDIAIRES', finaux: 'RÉSULTATS FINAUX', cible: c => `cible : ${c}`, sansCible: 'sans cible — à fixer par le porteur',
    avantVente: (a, n) => `${a} résultat(s) sur ${n} se mesurent avant la première vente.  `,
    entreesSans: n => `${n} entrée(s) sans cible : une entrée sans cible est un vœu.`, chaque: 'Chaque entrée porte sa cible.',
    eco: { format: 'Économie unitaire · INSEAD NBV', pour: u => `POUR UN ${u.toUpperCase()}`, calcul: 'CALCUL',
      lignes: { revenu: 'Revenu', cout: 'Coût de service', marge: 'Marge de contribution', vie: 'Durée de vie', ltv: 'Valeur vie client', cac: "Coût d'acquisition" },
      vie: (n, per) => `${n} ${per}${per === 'mois' ? '' : 's'} — 1 / attrition`, ratio: 'LTV / CAC', recup: 'RÉCUPÉRATION DE L\'ACQUISITION', piste: 'PISTE',
      mois: 'mois', repereRatio: 'repère : 3 ou plus', repereRecup: 'repère : 12 mois ou moins', reperePiste: (t, c) => `${t} ÷ ${c} par mois`,
      pied: 'Chaque entrée dit son origine ; marge, durée de vie, valeur vie client, LTV / CAC, récupération et piste sont calculées. Les repères se signalent, ils ne bloquent pas.' },
    appr: { format: "Cartes d'apprentissage · INSEAD NBV", echelle: 'PLUS HAUT ÉCHELON QUI A TRANCHÉ — PAR HYPOTHÈSE', critique: 'CRITIQUE',
      verdict: { 'confirmée': 'CONFIRMÉE', 'infirmée': 'INFIRMÉE', 'non_tranchée': 'NON TRANCHÉE' }, cartes: ['NOUS PENSIONS', 'NOUS AVONS FAIT', 'NOUS AVONS OBSERVÉ', 'DONC NOUS DÉCIDONS'],
      critere: (t, d) => `Critère écrit le ${d} : ${t}`,
      pied: ok => `Propos < intérêt observé < acte < paiement. Un propos ne tranche rien ; une preuve SYNTHETIC n'est pas une observation. ${ok ? "Au moins une hypothèse critique est tranchée par l'acte." : "Aucune hypothèse critique n'atteint l'acte : G0 ne passe qu'avec une réserve."}` },
    invest: { format: 'Investisseurs ciblés · INSEAD NBV', tete: ['Investisseur', 'Structure', 'Secteur', 'Géographie', 'Portefeuille', 'Performance', 'Ticket', 'Accès', 'Score'],
      ticket: { adapte: 'adapté', trop_grand: 'trop grand', trop_petit: 'trop petit', inconnu: '—' }, acces: { chaud: 'chaud', froid: 'froid' },
      pied: (b, n) => `● oui  ◐ partiel  ○ non — critères INSEAD NBV, chacun sourcé. ${b} personne(s) bien placée(s) sur ${n}.` },
    pitch: { sur: 'PITCH INVESTISSEURS  ·  SEED DECK Y COMBINATOR', noms: { probleme: 'Problème', solution: 'Solution', traction: 'Traction', apprentissages: 'Apprentissages', intuition: 'Intuition singulière',
      modele: 'Modèle économique', marche: 'Marché', concurrence: 'Concurrence', equipe: 'Équipe', demande: 'La demande' },
      tag: { 'établi': 'ÉTABLI', 'décision': 'DÉCISION', 'hypothèse': 'HYPOTHÈSE', 'inconnu': 'INCONNU' }, sources: 'Sources : ', aDecider: 'À DÉCIDER',
      apprentissages: 'Apprentissages', mantra: 'MANTRA', positionnement: 'POSITIONNEMENT',
      echelle: { propos: 'Propos', interet: 'Intérêt observé', action: 'Acte', paiement: 'Paiement' }, echelleTitre: 'ÉCHELLE DE FIABILITÉ — PLUS HAUT ÉCHELON ATTEINT',
      resultat: { argent: 'ARGENT', temps: 'TEMPS', facilite: 'FACILITÉ', opportunite: 'OPPORTUNITÉ' }, resultatTitre: 'CE QUE LE CLIENT Y GAGNE',
      cartes: ['NOUS PENSIONS', 'NOUS AVONS OBSERVÉ', 'DONC NOUS DÉCIDONS'], avantage: 'AVANTAGE DÉLOYAL — CE QUI NE SE COPIE PAS',
      types: { direct: 'DIRECT', indirect: 'INDIRECT', futur: 'FUTUR', statu_quo: 'STATU QUO' }, histoire: 'UNE PERSONNE',
      forces: { couts_de_changement: 'Coûts de changement', revenus_recurrents: 'Revenus récurrents', encaisser_avant_depenser: 'Encaisser avant de dépenser',
        structure_de_couts: 'Structure de coûts', autres_font_le_travail: "D'autres font le travail", scalabilite: 'Scalabilité', protection: 'Protection' },
      economie: (l, c, r) => `LTV ${l}  ·  CAC ${c}  ·  LTV / CAC ${r}`, manques: 'MANQUES — FINANCÉS PAR LA DEMANDE', tranche: 'CET ARGENT TRANCHE' },
    perFormat: 'Persona · A. Cooper', per: { objectifs: 'Ce qu\'il cherche à faire', frustrations: 'Ce qui l\'en empêche', comportements: 'Ce qu\'il fait aujourd\'hui', contexte: 'Son contexte' },
    fictif: 'PRÉNOM FICTIF', sources: n => `${n} source${n > 1 ? 's' : ''}`,
    perPied: (n, h, niv) => `Chaque trait cite deux sources indépendantes au moins (S-nn) ; en ambre, une hypothèse à tester (HYP-nn). ${h} trait(s) sur ${n} restent à tester. Niveau d'evidence : ${niv}.`,
    empFormat: 'Empathy map · D. Gray, XPLANE', emp: { dit: 'Dit', pense: 'Pense', fait: 'Fait', ressent: 'Ressent', douleurs: 'Douleurs', gains: 'Gains' },
    empVide: 'Rien ne le fonde : laissé vide plutôt qu\'imaginé.',
    empPied: 'Dit : citations littérales. Fait : ce que les sources rapportent. Pense et ressent : des inférences, chacune avec ses sources ; en ambre, une hypothèse à tester.',
    jouFormat: 'Journey map · service design', jou: { fait: 'Ce qu\'il fait', contact: 'Par où il passe', pense: 'Ce qu\'il pense', emotion: 'Ce qu\'il ressent', irritants: 'Irritants · opportunités' },
    bas: 'MOMENT DE VÉRITÉ', haut: 'POINT HAUT', inconnue: 'Étape qu\'aucune source ne décrit',
    jouPied: (a, n) => `Émotion de −2 à +2, tirée des sources ; la courbe, le point haut et le point bas sont calculés. Amplitude ${a}. ${n} sources.`,
  },
  en: {
    tag: { 'sourcé': 'SOURCED', 'hypothèse': 'HYPOTHESIS', 'règle': 'RULE', 'cible': 'TARGET', 'calcul': 'COMPUTED' },
    formatRef: 'REFERENCE FORMAT   ', consigne: 'Instruction', exemple: 'Example',
    gabarit: 'TEMPLATE', commentServir: 'How to use this template',
    modeSuite: ' One slide per section of the standard; the speaker notes repeat the instruction. The Markdown in the repository remains the version the machine checks.',
    fichier: (r, n) => `FILE ${r} / ${n}`,
    phraseTitre: "[the work product's answer, in one sentence, as the slide title]",
    reponse: '[your answer in one line]',
    zone: '[The content of the section: a table, a diagram or three points — what the instruction asks for, sourced and dated]',
    sep: ': ', regle: 'Rule', uneParFiche: 'ONE SLIDE PER SHEET', enonce: '[statement]',
    champs: ['Field', 'To write', 'What the field requires'],
    verifierZone: '[What is not established, why it matters, what it takes to find out]',
    methode: r => `Method: ${r}.`,
    communiqueDate: (d, e) => `${d}   ·   fictional press release, written on ${e}`,
    citation: t => `“${t}”`,
    citationStatut: (a, st) => `${a} — ${st === 'visée' ? 'target quote, still to be obtained' : st === 'obtenue' ? 'quote obtained' : `quote ${st}`}.`,
    oblige: 'WHAT THE PRESS RELEASE FORCES US TO DECIDE',
    bmc: { partenaires: 'Key partners', activites: 'Key activities', ressources: 'Key resources', proposition: 'Value proposition',
           relations: 'Customer relationships', canaux: 'Channels', segments: 'Customer segments', couts: 'Cost structure', revenus: 'Revenue streams' },
    fragile: 'RESTS ONLY ON HYPOTHESES', operateurs: 'SERVICE OPERATORS', sansOperateur: m => `No operator — ${m}`,
    famille: { client: 'CUSTOMER', operateur: 'OPERATOR' },
    bmcPied: (h, n) => `Bold: decision · ink: established · amber: hypothesis to test (H-n) · grey: unknown. ${h} items out of ${n} rest on a hypothesis.`,
    dimFormat: 'Bottom-up sizing', fourchette: (b, h) => ` (${b} to ${h})`, verifie: ' — verified',
    resultat: 'The result', resultatTexte: (a, c) => `${a} announced; the computation, ranges propagated, gives ${c}.`,
    hypPortent: n => `${n} hypotheses carry it`, sensibilite: 'Sensitivity',
    sensibiliteTexte: 'Each factor weighs proportionally: a gap of half on one hypothesis doubles or halves the result.',
    poolsFormat: 'Profit pools · Bain, adapted', libre: 'unserved',
    longueur: 'Length proportional to annual revenue; light part: top of the range.',
    rapport: 'THE RATIO THAT MATTERS', contre: (a, b, c, d) => `${a} ${b}, against ${c} ${d}.`, libres: 'UNSERVED POOLS',
    sansMarge: 'A revenue pool, not yet a profit pool: no margin is known.',
    ddpFormat: 'Discovery-Driven Planning · McGrath', ecart: 'THE GAP', marge: 'THE HEADROOM',
    exiges: (l, n) => `${l}, against ${n} required.`, source: s => `Source: ${s}`,
    rapporte: (a, b) => `At this level, the target yields ${a}, not ${b}.`, fermer: 'CLOSING THE GAP — COMPUTED',
    retenir: 'Retain', enMoyenne: (n, l) => `on average ${n} ${l} or more.`,
    auLieu: (a, c, b) => `${a} ${c} instead of ${b}.`, impossible: (a, c, b) => `${a} ${c}: impossible, beyond ${b}.`,
    couvre: 'The reference covers the requirement: the target is reachable on this factor.',
    rang: 'TEST RANK', carte: ['WE BELIEVE THAT', 'WE WILL VERIFY IT BY', 'WE ARE WRONG IF', 'BEFORE'],
    metFormat: 'Input and output metrics · Amazon', entrees: 'INPUTS — EVERY WEEK',
    inter: 'INTERMEDIATE OUTCOMES', finaux: 'FINAL OUTCOMES', cible: c => `target: ${c}`, sansCible: 'no target — to be set by the owner',
    avantVente: (a, n) => `${a} outcome(s) out of ${n} can be measured before the first sale.  `,
    entreesSans: n => `${n} input(s) without a target: an input without a target is a wish.`, chaque: 'Every input carries its target.',
    eco: { format: 'Unit economics · INSEAD NBV', pour: u => `FOR ONE ${u.toUpperCase()}`, calcul: 'COMPUTED',
      lignes: { revenu: 'Revenue', cout: 'Cost to serve', marge: 'Contribution margin', vie: 'Lifetime', ltv: 'Lifetime value', cac: 'Acquisition cost' },
      vie: (n, per) => `${n} ${per === 'mois' ? 'months' : 'years'} — 1 / churn`, ratio: 'LTV / CAC', recup: 'ACQUISITION PAYBACK', piste: 'RUNWAY',
      mois: 'months', repereRatio: 'benchmark: 3 or more', repereRecup: 'benchmark: 12 months or less', reperePiste: (t, c) => `${t} ÷ ${c} per month`,
      pied: 'Each input states its origin; margin, lifetime, lifetime value, LTV / CAC, payback and runway are computed. Benchmarks are flagged, they do not block.' },
    appr: { format: 'Learning cards · INSEAD NBV', echelle: 'HIGHEST RUNG THAT SETTLED IT — PER HYPOTHESIS', critique: 'CRITICAL',
      verdict: { 'confirmée': 'CONFIRMED', 'infirmée': 'DISPROVEN', 'non_tranchée': 'UNSETTLED' }, cartes: ['WE BELIEVED', 'WE DID', 'WE OBSERVED', 'THEREFORE WE DECIDE'],
      critere: (t, d) => `Criterion written on ${d}: ${t}`,
      pied: ok => `Statement < observed interest < action < payment. A statement settles nothing; SYNTHETIC evidence is not an observation. ${ok ? 'At least one critical hypothesis is settled by action.' : 'No critical hypothesis reaches action: G0 passes only with a reservation.'}` },
    invest: { format: 'Targeted investors · INSEAD NBV', tete: ['Investor', 'Firm', 'Sector', 'Geography', 'Portfolio', 'Track record', 'Ticket', 'Access', 'Score'],
      ticket: { adapte: 'fits', trop_grand: 'too large', trop_petit: 'too small', inconnu: '—' }, acces: { chaud: 'warm', froid: 'cold' },
      pied: (b, n) => `● yes  ◐ partial  ○ no — INSEAD NBV criteria, each sourced. ${b} well-placed people out of ${n}.` },
    pitch: { sur: 'INVESTOR PITCH  ·  Y COMBINATOR SEED DECK', noms: { probleme: 'Problem', solution: 'Solution', traction: 'Traction', apprentissages: 'Learnings', intuition: 'Unique insight',
      modele: 'Business model', marche: 'Market', concurrence: 'Competition', equipe: 'Team', demande: 'The ask' },
      tag: { 'établi': 'ESTABLISHED', 'décision': 'DECISION', 'hypothèse': 'HYPOTHESIS', 'inconnu': 'UNKNOWN' }, sources: 'Sources: ', aDecider: 'TO DECIDE',
      apprentissages: 'Learnings', mantra: 'MANTRA', positionnement: 'POSITIONING',
      echelle: { propos: 'Statement', interet: 'Observed interest', action: 'Action', paiement: 'Payment' }, echelleTitre: 'RELIABILITY LADDER — HIGHEST RUNG REACHED',
      resultat: { argent: 'MONEY', temps: 'TIME', facilite: 'EASE', opportunite: 'OPPORTUNITY' }, resultatTitre: 'WHAT THE CUSTOMER GAINS',
      cartes: ['WE BELIEVED', 'WE OBSERVED', 'THEREFORE WE DECIDE'], avantage: 'UNFAIR ADVANTAGE — WHAT CANNOT BE COPIED',
      types: { direct: 'DIRECT', indirect: 'INDIRECT', futur: 'FUTURE', statu_quo: 'STATUS QUO' }, histoire: 'ONE PERSON',
      forces: { couts_de_changement: 'Switching costs', revenus_recurrents: 'Recurring revenue', encaisser_avant_depenser: 'Earning before spending',
        structure_de_couts: 'Cost structure', autres_font_le_travail: 'Others do the work', scalabilite: 'Scalability', protection: 'Protection' },
      economie: (l, c, r) => `LTV ${l}  ·  CAC ${c}  ·  LTV / CAC ${r}`, manques: 'GAPS — FUNDED BY THE ASK', tranche: 'THIS MONEY SETTLES' },
    perFormat: 'Persona · A. Cooper', per: { objectifs: 'What they are trying to do', frustrations: 'What gets in the way', comportements: 'What they do today', contexte: 'Their context' },
    fictif: 'FICTIONAL NAME', sources: n => `${n} source${n > 1 ? 's' : ''}`,
    perPied: (n, h, niv) => `Each trait cites at least two independent sources (S-nn); in amber, a hypothesis to test (HYP-nn). ${h} trait(s) out of ${n} remain to be tested. Evidence level: ${niv}.`,
    empFormat: 'Empathy map · D. Gray, XPLANE', emp: { dit: 'Says', pense: 'Thinks', fait: 'Does', ressent: 'Feels', douleurs: 'Pains', gains: 'Gains' },
    empVide: 'Nothing supports it: left empty rather than imagined.',
    empPied: 'Says: literal quotes. Does: what the sources report. Thinks and feels: inferences, each with its sources; in amber, a hypothesis to test.',
    jouFormat: 'Journey map · service design', jou: { fait: 'What they do', contact: 'Touchpoints', pense: 'What they think', emotion: 'How they feel', irritants: 'Pain points · opportunities' },
    bas: 'MOMENT OF TRUTH', haut: 'HIGH POINT', inconnue: 'Step no source describes',
    jouPied: (a, n) => `Emotion from −2 to +2, drawn from the sources; the curve, the high point and the low point are computed. Amplitude ${a}. ${n} sources.`,
  },
};
/** Un nombre écrit à la française, réécrit à l'anglaise : 18 000 → 18,000 ; 21,6 → 21.6 ; 22 M → 22M. */
const chiffresEn = t => String(t).replace(/(\d),(\d)/g, '$1.$2').replace(/(\d)[ \u202f\u00a0](?=\d{3}\b)/g, '$1,').replace(/(\d)[ \u202f\u00a0]M\b/g, '$1M');


/* ── gabarits : un exemple Markdown lu pour une planche ──────────────── */
const nu = t => String(t ?? '').replace(/`([^`]*)`/g, '$1').replace(/\*\*([^*]*)\*\*/g, '$1').replace(/\*([^*\s][^*]*)\*/g, '$1').trim();
/** Le premier tableau d'un exemple, et le texte qui l'entoure, séparés. */
function decoupeExemple(md) {
  const lignes = String(md || '').split(/\r?\n/), texte = [];
  let table = null;
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    if (!table && /^\s*\|/.test(l) && /^\s*\|[\s:|-]+\|\s*$/.test(lignes[i + 1] || '')) {
      const cel = x => x.trim().replace(/^\||\|$/g, '').split('|').map(c => nu(c));
      const tete = cel(l), corps = [];
      i += 1;
      while (i + 1 < lignes.length && /^\s*\|/.test(lignes[i + 1])) corps.push(cel(lignes[++i]));
      table = { tete, corps };
      continue;
    }
    if (/^```/.test(l)) continue;
    if (l.trim()) texte.push(nu(l.replace(/^\s*[-*]\s+/, '• ').replace(/^\s*>\s?/, '')));
  }
  return { texte: texte.join('\n'), table };
}

/* ── livrables réels : un corps de section lu en blocs ───────────────── */
/** Paragraphes, puces, tableaux d'une section Markdown, dans l'ordre. Les blocs de code
 *  et les sous-titres deviennent du texte : une planche n'affiche pas de balisage. */
export function blocsSection(md) {
  const L = String(md || '').split(/\r?\n/), out = [];
  for (let i = 0; i < L.length; i++) {
    const l = L[i];
    if (!l.trim()) continue;
    if (/^\s*\|/.test(l) && /^\s*\|[\s:|-]+\|\s*$/.test(L[i + 1] || '')) {
      const cel = x => x.trim().replace(/^\||\|$/g, '').split('|').map(c => nu(c));
      const tete = cel(l), corps = [];
      i += 1;
      while (i + 1 < L.length && /^\s*\|/.test(L[i + 1])) corps.push(cel(L[++i]));
      out.push({ type: 'table', tete, corps });
      continue;
    }
    if (/^```/.test(l)) { while (++i < L.length && !/^```/.test(L[i])); continue; }
    if (/^\s*[-*]\s+/.test(l)) { out.push({ type: 'puce', texte: nu(l.replace(/^\s*[-*]\s+/, '')) }); continue; }
    if (/^\s*\d+\.\s+/.test(l)) { out.push({ type: 'puce', texte: nu(l.replace(/^\s*\d+\.\s+/, '')) }); continue; }
    const t = nu(l.replace(/^#{3,6}\s+/, '').replace(/^\s*>\s?/, ''));
    const prev = out[out.length - 1];
    if (prev?.type === 'texte' && !/^#{3,6}\s/.test(l) && !/^\s*>/.test(l) && !prev.fin) prev.texte += ' ' + t;
    else out.push({ type: 'texte', texte: t, titre: /^#{3,6}\s/.test(l) || undefined });
    if (/[.:!?»]$/.test(t)) out[out.length - 1].fin = true;
  }
  return out;
}

export function rendrePack(modele, { couverture = null } = {}) {
  const MT = MOTS[modele.lang] || MOTS.fr, TAG = MT.tag;
  const nombre = modele.lang === 'en' ? (n, o) => chiffresEn(nombreFr(n, o)) : nombreFr;
  const plage = modele.lang === 'en' ? (g, o) => chiffresEn(plageFr(g, o)) : plageFr;
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = `${modele.produit || 'Produit'} — ${modele.nom}`;
  let page = 0;

  /* ── primitives ─────────────────────────────────────────────────────── */
  const planche = (sombre, image) => {
    page += 1;
    const s = pres.addSlide();
    s.background = { color: sombre ? ENCRE : OS };
    if (image) s.addImage({ path: image, x: 0, y: 0, w: W, h: 7.5 });
    s.sombre = !!sombre;
    return s;
  };
  const txt = (s, t, x, y, w, h, o = {}) => s.addText(t, Object.assign({
    x, y, w, h, isTextBox: true, margin: 0, valign: 'top', fontFace: CORPS, fontSize: 11,
    color: s.sombre ? TXT_S : TXT_C, lineSpacing: Math.round((o.fontSize || 11) * 1.32) }, o));
  const boite = (s, x, y, w, h, o = {}) => s.addShape(pres.ShapeType.rect, { x, y, w, h,
    fill: o.fill ? { color: o.fill } : { type: 'none' },
    line: o.line ? { color: o.line, width: o.lw || 0.75, dashType: o.dash ? 'dash' : 'solid' } : { type: 'none' } });
  const filet = (s, x, y, w, c) => boite(s, x, y, w, 0.012, { fill: c || TRAIT });
  const trait = (s, x1, y1, x2, y2, o = {}) => s.addShape(pres.ShapeType.line, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    flipH: x2 < x1, flipV: y2 < y1,
    line: { color: o.c || GRIS, width: o.lw || 1, dashType: o.dash ? 'dash' : 'solid', endArrowType: o.fleche ? 'triangle' : undefined } });
  const petit = (s, t, x, y, w, c, o = {}) => txt(s, t, x, y, w, 0.24, Object.assign({ fontFace: DISP, fontSize: 8, bold: true,
    charSpacing: 1.3, color: c || (s.sombre ? MUET_S : MUET_C), valign: 'middle' }, o));
  const pied = (s, source) => {
    if (source) txt(s, source, M, 6.93, LARG - 0.8, 0.3, { fontSize: 7.5, color: s.sombre ? MUET_S : MUET_C, valign: 'middle', lineSpacing: 10 });
    txt(s, String(page), DROITE - 0.5, 6.95, 0.5, 0.26, { fontSize: 8, color: s.sombre ? MUET_S : MUET_C, align: 'right', valign: 'middle' });
  };
  const entete = (s, sur, titre, format, taille = 22) => {
    boite(s, M, 0.58, 0.42, 0.035, { fill: AMBRE });
    petit(s, sur, M, 0.7, 6.5);
    if (format) txt(s, MT.formatRef + format.toUpperCase(), DROITE - 5.8, 0.7, 5.8, 0.24,
      { fontFace: DISP, fontSize: 8, bold: true, charSpacing: 1.1, color: AMBRE, align: 'right', valign: 'middle' });
    txt(s, titre, M, 1.05, LARG, 0.85, { fontFace: DISP, fontSize: titre.length > 120 ? 20 : taille, bold: true,
      color: s.sombre ? OS : ENCRE, charSpacing: -0.3, lineSpacing: Math.round(taille * 1.12) });
  };
  const origine = (s, o, x, y) => petit(s, TAG[o] || String(o || '').toUpperCase(), x, y, 1.2, o === 'hypothèse' ? AMBRE : MUET_C, { fontSize: 7 });
  const tableau = (s, lignes, x, y, colW, o = {}) => {
    const fs = o.fontSize || 9.5;
    const rows = lignes.map((l, i) => l.map((cel, j) => {
      const c = typeof cel === 'string' ? { text: cel } : cel;
      const tete = i === 0;
      const opt = Object.assign({
        fontFace: tete ? DISP : CORPS, fontSize: tete ? 7.5 : fs, bold: tete || (j === 0 && o.premiereGrasse),
        color: tete ? (s.sombre ? MUET_S : MUET_C) : (s.sombre ? TXT_S : (j === 0 && o.premiereGrasse ? ENCRE : TXT_C)),
        charSpacing: tete ? 1 : 0, valign: tete ? 'bottom' : 'top', margin: [3, 9, 3, 0],
        border: [{ type: 'none' }, { type: 'none' }, { pt: tete ? 1 : 0.6, color: tete ? (s.sombre ? MUET_S : ENCRE) : (s.sombre ? NUIT : TRAIT) }, { type: 'none' }],
      }, c.options || {});
      return { text: tete ? String(c.text).toUpperCase() : String(c.text ?? ''), options: opt };
    }));
    s.addTable(rows, { x, y, colW, rowH: o.rowH, autoPage: false });
  };
  const sur = p => `${p.etape}  ·  ${String(p.nom_format || '').toUpperCase()}`;
  const fmtRef = p => String(p.reference || '').split(/[,—]/)[0].trim();


  /* ── primitives de gabarit ──────────────────────────────────────────── */
  const gabZone = (s, x, y, w, h, t, sombre) => {
    boite(s, x, y, w, h, { line: sombre ? NUIT : GRIS, dash: true });
    txt(s, t, x + 0.25, y + 0.25, w - 0.5, h - 0.5, { fontSize: 12, color: AMBRE, lineSpacing: 16 });
  };
  const gabConsigne = (s, lignes, x, y, w, h, sombre) => {
    boite(s, x, y, w, h, { fill: sombre ? NUIT : AMBRE_T });
    petit(s, String(modele.libelles?.consigne_visible || MT.consigne).toUpperCase(), x + 0.18, y + 0.1, w - 0.3, AMBRE);
    const t = lignes.filter(Boolean).join('\n');
    txt(s, t, x + 0.18, y + 0.4, w - 0.36, h - 0.5, { fontSize: t.length > 420 ? 8.5 : t.length > 260 ? 9.5 : 10.5, color: sombre ? TXT_S : TXT_C, lineSpacing: 13, fit: 'shrink' });
  };
  const gabExemple = (s, ex, x, y, w, h, sombre) => {
    boite(s, x, y, w, h, { fill: sombre ? NUIT : OS2 });
    petit(s, String(modele.libelles?.exemple_visible || MT.exemple).toUpperCase(), x + 0.18, y + 0.1, w - 0.3, MUET_C);
    let yy = y + 0.4;
    const bas = y + h - 0.1;
    if (ex.titre) { txt(s, ex.titre, x + 0.18, yy, w - 0.36, 0.5, { fontSize: 10, bold: true, color: sombre ? OS : ENCRE, lineSpacing: 12.5 }); yy += Math.ceil(ex.titre.length / 62) * 0.19 + 0.12; }
    const texte = String(ex.texte || '');
    const place = ex.table ? Math.min(0.9, (bas - yy) * 0.4) : bas - yy;
    if (texte) {
      const court = texte.length > place * 330 ? texte.slice(0, Math.max(60, Math.floor(place * 330))).replace(/\s+\S*$/, '') + ' …' : texte;
      txt(s, court, x + 0.18, yy, w - 0.36, place, { fontSize: 9.5, color: sombre ? TXT_S : TXT_C, lineSpacing: 12.5 });
      yy += Math.min(place, Math.ceil(court.length / 70 + court.split('\n').length - 1) * 0.17 + 0.1);
    }
    if (ex.table && yy < bas - 0.3) {
      const n = Math.min(4, Math.max(ex.table.tete.length, ...ex.table.corps.map(r => r.length)));
      const lignes = Math.max(1, Math.min(ex.table.corps.length, Math.floor((bas - yy) / 0.3) - 1));
      const rows = [ex.table.tete.slice(0, n).map(c => c || ''), ...ex.table.corps.slice(0, lignes).map(r => r.slice(0, n).map(c => String(c || '').slice(0, 90)))];
      const colW = n === 2 ? [(w - 0.36) * 0.36, (w - 0.36) * 0.64] : Array(n).fill((w - 0.36) / n);
      tableau(s, rows, x + 0.18, yy, colW, { fontSize: 8, premiereGrasse: true });
    }
  };

  /* ── planches génériques ────────────────────────────────────────────── */
  const GEN = {
    couverture(p) {
      const s = planche(true, couverture && existsSync(couverture) ? couverture : null);
      boite(s, M, 1.2, 0.42, 0.035, { fill: AMBRE });
      petit(s, modele.surtitre || `${(modele.produit || '').toUpperCase()}  ·  PACK DE CADRAGE ${p.cadence}`, M, 1.32, 8, MUET_S);
      txt(s, p.nom, M, 2.3, 7.6, 2.0, { fontFace: DISP, fontSize: 46, bold: true, color: OS, lineSpacing: 51, charSpacing: -0.8 });
      const c = modele.compte;
      const accroche = modele.accroche || `${c.produits} livrables sur ${c.total}, chacun présenté dans le format qui fait référence pour sa question. ${c.formats} planche(s) de format vérifiées par le calcul.`;
      /* une accroche longue se resserre au lieu de déborder sur la mention */
      const fsA = accroche.length > 520 ? 10.5 : accroche.length > 360 ? 12 : 14;
      txt(s, accroche, M, 4.45, 6.6, 1.95, { fontSize: fsA, lineSpacing: Math.round(fsA * 1.4) });
      txt(s, `${modele.mention || 'Projection du dépôt'}  ·  ${new Date().toISOString().slice(0, 10)}`, M, 6.55, 8, 0.3, { fontSize: 9.5, color: MUET_S });
    },
    etat(p) {
      const s = planche(false);
      entete(s, "L'ÉTAT DU CADRAGE", `${p.produits} livrables produits sur ${p.total} dus, ${modele.compte.formats} présentés dans leur format de référence`, null);
      const parEtape = id => modele.planches.filter(x => x.type === 'format' && x.etape === id).length;
      tableau(s, [['Étape', 'Nom', 'Livrables', 'Planches de format'],
        ...p.lignes.map(l => [{ text: l.etape, options: { bold: true, color: AMBRE, fontFace: DISP } }, { text: l.nom, options: { bold: true, color: ENCRE } },
          `${l.produits} / ${l.total}${l.sans_objet ? ` + ${l.sans_objet} sans objet` : ''}`, String(parEtape(l.etape) || '—')])], M, 2.1, [1.0, 5.4, 2.4, 2.63], { fontSize: 12, rowH: 0.5 });
      pied(s, (p.sans_objet ? `Sans objet : livrable hors portée par une condition de la méthode, déclarée pour ce projet. ` : '') + 'Un livrable absent n\'a pas de planche : le pack grandit quand le dépôt grandit, jamais l\'inverse.');
    },
    etape(p) {
      const s = planche(true);
      txt(s, p.etape, M - 0.08, 1.2, 4.5, 1.4, { fontFace: DISP, fontSize: 84, bold: true, color: AMBRE, charSpacing: -2 });
      txt(s, p.nom, M, 2.85, 5.9, 1.3, { fontFace: DISP, fontSize: 32, bold: true, color: OS, lineSpacing: 37, charSpacing: -0.4 });
      boite(s, 7.2, 1.3, 0.012, 5.1, { fill: NUIT });
      petit(s, 'LIVRABLE', 7.65, 1.3, 2.4, AMBRE);
      petit(s, 'FORMAT DE RÉFÉRENCE', 10.1, 1.3, 2.3, AMBRE);
      /* Une ligne par format : la hauteur d'un livrable suit le nombre de ses formats. */
      const lignes = l => Math.max(2, Math.ceil(l.nom.length / 26), (l.formats || []).reduce((n, f) => n + Math.ceil(f.length / 30), 0));
      const total = p.livrables.reduce((n, l) => n + lignes(l), 0);
      const u = Math.min(0.36, 4.9 / total);
      let y = 1.75;
      p.livrables.forEach(l => {
        const h = lignes(l) * u;
        filet(s, 7.65, y - 0.08, DROITE - 7.65, NUIT);
        txt(s, l.nom, 7.65, y, 2.3, h - 0.06, { fontFace: DISP, fontSize: u < 0.3 ? 9.5 : 11, bold: true, color: l.etat === 'absent' ? TXT_SD : OS, lineSpacing: 13 });
        txt(s, l.formats?.length ? l.formats.join('\n') : (l.etat === 'sans_objet' ? 'sans objet' : '—'), 10.1, y, 2.3, h - 0.06,
          { fontSize: u < 0.3 ? 9 : 10, color: l.formats?.length ? TXT_S : TXT_SD, lineSpacing: 13, paraSpaceAfter: 5 });
        y += h;
      });
      pied(s, '');
    },
    exhibit(p) {
      /* Au standard de rédaction, la planche porte la RÉPONSE du livrable en titre, son
         essentiel en bandeau, puis son tableau. Un fichier d'avant le standard garde son
         titre et son accroche. */
      const s = planche(false);
      const action = p.phrase || p.titre;
      if (p.phrase) {
        boite(s, M, 0.58, 0.42, 0.035, { fill: AMBRE });
        petit(s, `${p.etape}  ·  ${p.titre}`.toUpperCase(), M, 0.7, LARG);
        const fs = action.length <= 110 ? 22 : action.length <= 190 ? 18 : 15;
        txt(s, action, M, 1.0, LARG, 1.05, { fontFace: DISP, fontSize: fs, bold: true, color: ENCRE, charSpacing: -0.3, lineSpacing: Math.round(fs * 1.15), valign: 'top' });
      } else entete(s, `${p.etape}  ·  ${p.wp}`, action, null);
      let y = p.phrase ? 2.2 : 1.95;
      const puces = p.phrase ? (p.essentiel || []) : [];
      if (puces.length) {
        const n = puces.length, g = 0.3, w = (LARG - g * (n - 1)) / n;
        puces.forEach((t, i) => {
          const x = M + i * (w + g);
          filet(s, x, y, w, AMBRE);
          txt(s, t, x, y + 0.08, w, 1.0, { fontSize: t.length > 150 ? 9.5 : 10.5, color: ENCRE, lineSpacing: 13.5, valign: 'top' });
        });
        y += 1.3;
      } else if (p.accroche) { txt(s, p.accroche, M, y, LARG, 0.6, { fontFace: CIT, italic: true, fontSize: 12, color: ENCRE, lineSpacing: 16 }); y += 0.75; }
      const poids = p.tableau.entetes.map((e, j) => Math.max(j ? 4 : 8, ...[e, ...p.tableau.lignes.map(l => l[j] || '')].map(t => Math.min(60, String(t).length))));
      const somme = poids.reduce((a, b) => a + b, 0);
      const larg = poids.map(x => LARG * x / somme);
      const corpsT = p.tableau.entetes.some(Boolean) ? [p.tableau.entetes, ...p.tableau.lignes] : p.tableau.lignes;
      tableau(s, corpsT, M, y, larg, { premiereGrasse: p.tableau.entetes.some(Boolean), fontSize: p.tableau.lignes.length > 5 ? 9.5 : 10.5 });
      pied(s, `Source : ${p.chemin}${p.completion === 'partiel' ? ' — livrable partiel, réserves en fin de pack' : ''}`);
    },


    /* ── livrables réels : le contenu du projet, dans la charte des gabarits ── */
    'liv-ouverture'(p) {
      const s = planche(false);
      boite(s, M, 0.58, 0.42, 0.035, { fill: AMBRE });
      petit(s, `${p.etape}  ·  ${p.titre}`.toUpperCase(), M, 0.7, LARG);
      const t = p.phrase || p.titre;
      const fs = t.length <= 110 ? 24 : t.length <= 190 ? 20 : 16;
      txt(s, t, M, 1.05, LARG, 1.6, { fontFace: DISP, fontSize: fs, bold: true, color: ENCRE, charSpacing: -0.3, lineSpacing: Math.round(fs * 1.18) });
      const puces = (p.essentiel || []).slice(0, 4);
      if (puces.length) {
        petit(s, String(modele.libelles?.essentiel || "L'essentiel").toUpperCase(), M, 3.0, 4, MUET_C);
        const n = puces.length, g = 0.3, w = (LARG - g * (n - 1)) / n;
        puces.forEach((x, i) => { filet(s, M + i * (w + g), 3.3, w, AMBRE);
          txt(s, x, M + i * (w + g), 3.42, w, 2.9, { fontSize: x.length > 170 ? 11 : 12.5, color: ENCRE, lineSpacing: x.length > 170 ? 14.5 : 16.5 }); });
      }
      pied(s, `Source : ${p.chemin}${p.completion === 'partiel' ? ' — livrable partiel, réserves en fin de document' : ''}`);
    },
    'liv-section'(p) {
      const s = planche(false);
      boite(s, M, 0.58, 0.42, 0.035, { fill: AMBRE });
      petit(s, `${p.etape}  ·  ${p.sujet}${p.suite ? '  ·  SUITE' : ''}`.toUpperCase(), M, 0.7, LARG);
      const fs = p.titre.length <= 80 ? 22 : p.titre.length <= 150 ? 18 : 15;
      txt(s, p.titre, M, 1.05, LARG, 1.0, { fontFace: DISP, fontSize: fs, bold: true, color: ENCRE, charSpacing: -0.3, lineSpacing: Math.round(fs * 1.15) });
      let y = 2.25;
      const bas = 6.7;
      const table = p.blocs.find(b => b.type === 'table');
      const textes = p.blocs.filter(b => b.type !== 'table');
      /* le texte avant le tableau l'introduit ; s'il n'y a pas de tableau, il est la section */
      const budget = table ? 420 : 1250;
      let lu = 0;
      const runs = [];
      for (const b of textes) {
        if (lu >= budget) break;
        let t = b.texte;
        if (lu + t.length > budget) t = t.slice(0, Math.max(40, budget - lu)).replace(/\s+\S*$/, '') + ' …';
        lu += t.length;
        runs.push({ text: t, options: { bullet: b.type === 'puce' ? { indent: 14 } : false, bold: !!b.titre, breakLine: true, paraSpaceAfter: 6 } });
      }
      if (runs.length) {
        const h = table ? Math.min(1.5, 0.3 + lu / 420) : bas - y;
        txt(s, runs, M, y, LARG, h, { fontSize: table ? 11.5 : lu > 800 ? 12 : 13.5, color: TXT_C, lineSpacing: table ? 15 : 18, fit: 'shrink' });
        y += table ? h + 0.15 : h;
      }
      if (table) {
        const n = Math.min(5, Math.max(table.tete.length, ...table.corps.map(r => r.length)));
        const fiche = !table.tete.some(Boolean);
        const lignes = table.corps.map(r => r.slice(0, n).map(c => String(c || '').slice(0, 220)));
        const poids = Array.from({ length: n }, (_, j) => Math.max(fiche && j === 0 ? 14 : 6, ...[table.tete[j] || '', ...lignes.map(r => r[j] || '')].map(t => Math.min(70, String(t).length))));
        const somme = poids.reduce((a, b) => a + b, 0);
        const rows = fiche ? [Array(n).fill(''), ...lignes] : [table.tete.slice(0, n), ...lignes];
        const longueur = lignes.reduce((a, r) => a + r.join('').length, 0);
        tableau(s, rows, M, y, poids.map(x => LARG * x / somme), { premiereGrasse: true, fontSize: lignes.length > 7 || longueur > 1100 ? 9 : lignes.length > 4 ? 10 : 11 });
      }
      pied(s, `Source : ${p.chemin}${p.tronque ? ' — texte intégral dans le fichier' : ''}`);
    },
    'liv-cloture'(p) {
      const s = planche(true);
      boite(s, M, 0.58, 0.42, 0.035, { fill: AMBRE });
      petit(s, `${p.etape}  ·  ${p.sujet}`.toUpperCase(), M, 0.7, LARG);
      txt(s, String(modele.libelles?.verifier || 'Ce qui reste à vérifier'), M, 1.05, LARG, 0.7, { fontFace: DISP, fontSize: 24, bold: true, color: OS });
      const t = blocsSection(p.verifier).map(b => (b.type === 'puce' ? '• ' : '') + b.texte).join('\n\n').slice(0, 900);
      if (t) txt(s, t, M, 1.95, 6.6, 3.9, { fontSize: 12, color: TXT_S, lineSpacing: 16.5, fit: 'shrink' });
      if (p.reserves.length) {
        petit(s, 'RÉSERVES DÉCLARÉES', 7.95, 1.95, 4, AMBRE);
        txt(s, p.reserves.slice(0, 5).map((r, i) => ({ text: r.slice(0, 260), options: { bullet: { indent: 12 }, breakLine: i < Math.min(5, p.reserves.length) - 1, paraSpaceAfter: 6 } })),
          7.95, 2.3, DROITE - 7.95, 3.6, { fontSize: 10, color: TXT_S, lineSpacing: 13, fit: 'shrink' });
      }
      if (p.reperes) {
        petit(s, String(modele.libelles?.reperes || 'Repères de méthode').toUpperCase(), M, 6.05, 4, MUET_S);
        txt(s, (t => t.length > 380 ? t.slice(0, 380).replace(/\s+\S*$/, '') + ' …' : t)(nu(p.reperes).replace(/\s+/g, ' ')), M, 6.3, LARG, 0.5, { fontSize: 8.5, color: MUET_S, lineSpacing: 11 });
      }
      pied(s, '');
    },

    /* ── planches de gabarit : ce qui reste à écrire est entre crochets, en ambre ── */
    'gab-mode'(p) {
      const s = planche(false);
      entete(s, `${MT.gabarit}  ·  ${p.etape}  ·  ${p.nom_etape}`.toUpperCase(), MT.commentServir, null);
      /* l'objet occupe la hauteur qu'il lui faut : le tableau se place dessous, jamais dessus */
      const fsO = String(p.objet || '').length > 600 ? 11 : 13, parLigne = fsO === 13 ? 150 : 178;
      const hO = Math.max(0.55, Math.ceil(String(p.objet || '').length / parLigne) * fsO * 1.32 / 72 + 0.1);
      txt(s, p.objet, M, 1.85, LARG, hO, { fontSize: fsO, color: TXT_C, lineSpacing: Math.round(fsO * 1.32) });
      tableau(s, [['', ''], ...p.lignes.map(([a, b]) => [{ text: a, options: { bold: true, color: ENCRE } }, b])], M, Math.max(2.6, 1.85 + hO + 0.2), [3.0, LARG - 3.0], { fontSize: 11 });
      boite(s, M, 5.45, LARG, 1.15, { fill: AMBRE_T });
      petit(s, (p.libelles.consigne_visible || MT.consigne).toUpperCase(), M + 0.2, 5.55, 4, AMBRE);
      txt(s, `${p.libelles.a_supprimer}${MT.modeSuite}`,
        M + 0.2, 5.85, LARG - 0.4, 0.7, { fontSize: 10.5, color: TXT_C, lineSpacing: 14 });
      pied(s, '');
    },
    'gab-fichier'(p) {
      const s = planche(true);
      petit(s, MT.fichier(p.rang, p.nombre), M, 1.3, 6, AMBRE);
      txt(s, p.chemin, M, 1.75, LARG, 0.9, { fontFace: DISP, fontSize: 30, bold: true, color: OS, charSpacing: -0.4 });
      txt(s, p.sections.join('\n'), M, 3.0, LARG, 3.4, { fontSize: 13, color: TXT_S, lineSpacing: 20 });
      pied(s, '');
    },
    'gab-ouverture'(p) {
      const s = planche(false);
      boite(s, M, 0.58, 0.42, 0.035, { fill: AMBRE });
      petit(s, `${p.etape}  ·  ${p.chemin}`.toUpperCase(), M, 0.7, LARG);
      txt(s, [{ text: `${p.libelles.phrase} `, options: { color: ENCRE } }, { text: MT.phraseTitre, options: { color: AMBRE } }],
        M, 1.05, LARG, 0.85, { fontFace: DISP, fontSize: 22, bold: true, charSpacing: -0.3 });
      petit(s, p.libelles.essentiel.toUpperCase(), M, 2.05, 4, MUET_C);
      const w = (LARG - 0.6) / 3;
      [0, 1, 2].forEach(i => { filet(s, M + i * (w + 0.3), 2.35, w, AMBRE); txt(s, '[…]', M + i * (w + 0.3), 2.45, w, 0.7, { fontSize: 12, color: AMBRE }); });
      gabConsigne(s, [p.libelles.phrase_guide, p.libelles.essentiel_guide], M, 3.55, 4.3, 3.0);
      gabExemple(s, { texte: `${p.libelles.phrase} ${p.ouverture.phrase}\n\n${p.ouverture.essentiel.map(e => '• ' + e).join('\n')}` }, M + 4.6, 3.55, LARG - 4.6, 3.0);
      s.addNotes(`${p.libelles.phrase_guide}\n${p.libelles.essentiel_guide}`);
      pied(s, '');
    },
    'gab-section'(p) {
      const s = planche(false);
      boite(s, M, 0.58, 0.42, 0.035, { fill: AMBRE });
      petit(s, `${p.etape}  ·  ${p.chemin}`.toUpperCase(), M, 0.7, LARG);
      const titre = p.redige ? [{ text: p.titre + p.libelles.tiret, options: { color: ENCRE } }, { text: MT.reponse, options: { color: AMBRE } }] : [{ text: p.titre, options: { color: ENCRE } }];
      txt(s, titre, M, 1.05, LARG, 0.85, { fontFace: DISP, fontSize: 22, bold: true, charSpacing: -0.3 });
      gabZone(s, M, 2.1, 6.4, 4.5, MT.zone);
      gabConsigne(s, [p.guide, p.regle && `${MT.regle}${MT.sep}${p.regle}`], 7.65, 2.1, DROITE - 7.65, 1.6);
      gabExemple(s, { titre: p.redige && p.reponse ? `${p.titre}${p.libelles.tiret}${p.reponse}` : '', ...decoupeExemple(p.exemple) }, 7.65, 3.85, DROITE - 7.65, 2.75);
      s.addNotes([p.guide, p.regle && `${MT.regle}${MT.sep}${p.regle}`].filter(Boolean).join('\n'));
      pied(s, '');
    },
    'gab-fiche'(p) {
      const s = planche(false);
      boite(s, M, 0.58, 0.42, 0.035, { fill: AMBRE });
      petit(s, `${p.etape}  ·  ${p.chemin}  ·  ${MT.uneParFiche}`.toUpperCase(), M, 0.7, LARG);
      txt(s, [{ text: p.prefixe + p.libelles.tiret, options: { color: ENCRE } }, { text: MT.enonce, options: { color: AMBRE } }], M, 1.05, LARG, 0.85, { fontFace: DISP, fontSize: 22, bold: true });
      txt(s, '[…]', M, 1.85, 6.4, 0.4, { fontSize: 12, color: AMBRE });
      if (p.champs.length) tableau(s, [MT.champs, ...p.champs.map(c => [{ text: c.titre, options: { bold: true, color: ENCRE } }, { text: '[…]', options: { color: AMBRE } }, { text: c.guide, options: { fontSize: 8.5, color: MUET_C } }])],
        M, 2.35, [1.9, 1.3, 3.2], { fontSize: 10.5 });
      gabConsigne(s, [p.guide], 7.65, 2.1, DROITE - 7.65, 1.35);
      gabExemple(s, { titre: `${p.id_exemple}${p.libelles.tiret}${p.reponse}`, texte: decoupeExemple(p.exemple).texte,
        table: p.champs.length ? { tete: ['', ''], corps: p.champs.map(c => [c.titre, c.exemple || '—']) } : null }, 7.65, 3.6, DROITE - 7.65, 3.0);
      s.addNotes([p.guide, ...p.champs.map(c => `${c.titre}${MT.sep}${c.guide}`)].join('\n'));
      pied(s, '');
    },
    'gab-cloture'(p) {
      const s = planche(true);
      boite(s, M, 0.58, 0.42, 0.035, { fill: AMBRE });
      petit(s, `${p.etape}  ·  ${p.chemin}`.toUpperCase(), M, 0.7, LARG);
      txt(s, p.libelles.verifier, M, 1.05, LARG, 0.7, { fontFace: DISP, fontSize: 24, bold: true, color: OS });
      gabZone(s, M, 1.95, 6.4, 3.6, MT.verifierZone, true);
      gabConsigne(s, [p.libelles.verifier_guide], 7.65, 1.95, DROITE - 7.65, 1.3, true);
      gabExemple(s, { texte: p.verifier }, 7.65, 3.45, DROITE - 7.65, 2.1, true);
      petit(s, p.libelles.reperes.toUpperCase(), M, 5.85, 4, MUET_S);
      txt(s, p.reperes, M, 6.12, LARG, 0.6, { fontSize: 9.5, color: MUET_S, lineSpacing: 12 });
      s.addNotes(p.libelles.verifier_guide);
      pied(s, '');
    },
    constats() {
      if (!modele.constats.length) return;
      const s = planche(false);
      entete(s, 'CE QUE LE CALCUL RÉVÈLE', `${modele.constats.length} constats tirés des chiffres du dossier — aucun n'a été écrit à la main`, null);
      modele.constats.slice(0, 9).forEach((c, i) => {
        const y = 2.05 + i * 0.52;
        filet(s, M, y - 0.06, LARG, i ? TRAIT : ENCRE);
        petit(s, c.format.toUpperCase(), M, y, 3.2, /n'atteint|dépasse|il faut/.test(c.texte) ? AMBRE : MUET_C, { fontSize: 7.5 });
        txt(s, c.texte, M + 3.4, y - 0.02, LARG - 3.4, 0.46, { fontSize: 11, color: ENCRE, lineSpacing: 14 });
      });
      pied(s, 'Un constat n\'est pas une faute du dossier : c\'est ce que les chiffres du dossier disent, une fois enchaînés.');
    },
    defauts() {
      if (!modele.defauts.length && !modele.manquants.length) return;
      const s = planche(false);
      entete(s, 'PLANCHES REFUSÉES', 'Ces planches ne sont pas montrées : leurs données sont incomplètes ou démenties par le calcul', null);
      const lignes = [['Livrable', 'Format', 'Défaut'],
        ...modele.defauts.flatMap(d => d.defauts.map(x => [d.wp, d.format, x])),
        ...modele.manquants.map(m => [m.wp, m.format, 'données absentes — clé « exhibits » du front-matter'])].slice(0, 13);
      tableau(s, lignes, M, 2.05, [1.2, 3.2, 7.03], { premiereGrasse: true, fontSize: 10 });
      pied(s, 'On ne montre pas à un client un chiffre que la machine dément.');
    },
    reserves(p) {
      /* Pagination par hauteur, pas par nombre : une réserve longue prend la place qu'elle
         occupe, et ne déborde jamais sur la suivante. Une ligne ≈ 140 caractères à 10,5 pt. */
      const haut = r => 0.22 * Math.max(1, Math.ceil(r.texte.length / 140)) + 0.2;
      const pages = [[]];
      let libre = 4.7;
      for (const r of p.reserves) {
        if (haut(r) > libre && pages.at(-1).length) { pages.push([]); libre = 4.7; }
        pages.at(-1).push(r); libre -= haut(r);
      }
      for (const page of pages) {
        const s = planche(true);
        boite(s, M, 0.58, 0.42, 0.035, { fill: AMBRE });
        petit(s, 'CE QUI RESTE À VÉRIFIER', M, 0.7, 6.5);
        txt(s, `${p.reserves.length} réserves déclarées par les livrables`, M, 1.05, LARG, 0.7, { fontFace: DISP, fontSize: 24, bold: true, color: OS });
        let y = 2.0;
        for (const r of page) {
          filet(s, M, y - 0.06, LARG, NUIT);
          petit(s, r.wp, M, y, 1.0, AMBRE);
          txt(s, r.texte, M + 1.2, y - 0.02, LARG - 1.2, haut(r) - 0.06, { fontSize: 10.5, color: OS, lineSpacing: 13.5, valign: 'top' });
          y += haut(r);
        }
        pied(s, 'Chaque réserve est portée par le livrable qui la déclare ; aucune n\'est comblée par une estimation.');
      }
    },
  };

  /* ── planches de format ─────────────────────────────────────────────── */
  const FMT = {

    communique(p) {
      const s = planche(false), d = p.donnees;
      entete(s, sur(p), p.titre, 'Amazon · Working Backwards');
      const x = M, y = 2.05, w = 7.7, h = 4.65, ix = x + 0.4, iw = w - 0.8;
      boite(s, x, y, w, h, { fill: PAPIER, line: TRAIT });
      petit(s, MT.communiqueDate(d.date, d.ecrit_le).toUpperCase(), ix, y + 0.28, iw, AMBRE, { fontSize: 7.5 });
      txt(s, d.titre_communique, ix, y + 0.6, iw, 0.9, { fontFace: DISP, fontSize: 20, bold: true, color: ENCRE, lineSpacing: 24 });
      txt(s, d.sous_titre, ix, y + 1.45, iw, 0.6, { fontFace: CIT, italic: true, fontSize: 12, lineSpacing: 16 });
      const mots = p.calcul?.mots || 0;
      txt(s, [].concat(d.paragraphes).join('\n\n'), ix, y + 2.12, iw, 1.5, { fontSize: mots > 110 ? 9.5 : 10.5, lineSpacing: mots > 110 ? 12.5 : 14 });
      if (d.citation) {
        txt(s, MT.citation(d.citation.texte), ix, y + 3.62, iw, 0.45, { fontFace: CIT, italic: true, fontSize: 11.5, color: ENCRE, lineSpacing: 15 });
        txt(s, `${MT.citationStatut(d.citation.auteur, d.citation.statut)}   ${d.appel || ''}`, ix, y + 4.12, iw, 0.3, { fontSize: 8.5, color: MUET_C });
      }
      const rx = 9.05, rw = DROITE - rx;
      petit(s, MT.oblige, rx, 2.05, rw, AMBRE);
      [].concat(p.calcul?.oblige || []).slice(0, 3).forEach((n, i) => {
        const yy = 2.5 + i * 1.4;
        filet(s, rx, yy, rw, i ? TRAIT : ENCRE);
        txt(s, n.titre, rx, yy + 0.12, rw, 0.3, { fontFace: DISP, fontSize: 12, bold: true, color: ENCRE });
        txt(s, n.texte, rx, yy + 0.5, rw, 0.85, { fontSize: 10.5, lineSpacing: 14 });
      });
      pied(s, p.source || MT.methode(p.reference));
    },

    /* ── la recherche, planche par personne ─────────────────────────────── */
    persona(p) {
      const s = planche(false), c = p.calcul, d = p.donnees;
      entete(s, sur(p), p.titre, MT.perFormat);
      const y0 = 2.0, h = 4.72, lw = 3.75;
      boite(s, M, y0, lw, h, { fill: PAPIER, line: TRAIT });
      const ini = String(d.nom || d.id || '?').replace(/[—–-].*$/, '').trim().split(/\s+/).map(m => m[0]).join('').slice(0, 2).toUpperCase();
      s.addShape(pres.ShapeType.ellipse, { x: M + 0.3, y: y0 + 0.3, w: 0.95, h: 0.95, fill: { color: AMBRE_T }, line: { color: AMBRE, width: 1 } });
      txt(s, ini, M + 0.3, y0 + 0.3, 0.95, 0.95, { fontFace: DISP, fontSize: 22, bold: true, color: ENCRE, align: 'center', valign: 'middle' });
      petit(s, `${d.id}  ·  ${MT.famille[d.famille] || ''}${d.operateur ? ' · ' + d.operateur.toUpperCase() : ''}  ·  ${d.niveau || ''}`, M + 1.45, y0 + 0.32, lw - 1.6, AMBRE, { fontSize: 7.5 });
      txt(s, String(d.nom || '').replace(/\s*[—–]\s.*$/, ''), M + 1.45, y0 + 0.58, lw - 1.6, 0.4, { fontFace: DISP, fontSize: 17, bold: true, color: ENCRE });
      petit(s, MT.fictif, M + 1.45, y0 + 0.98, lw - 1.6, MUET_C, { fontSize: 6.5 });
      txt(s, d.archetype || '', M + 0.3, y0 + 1.42, lw - 0.6, 0.5, { fontSize: 11, color: TXT_C, lineSpacing: 14 });
      txt(s, MT.citation(c.citation.texte), M + 0.3, y0 + 1.98, lw - 0.6, 1.25, { fontFace: CIT, italic: true, fontSize: 15, color: ENCRE, lineSpacing: 19 });
      petit(s, c.citation.source, M + 0.3, y0 + 3.2, 1.5, MUET_C, { fontSize: 7 });
      /* les curseurs de comportement : ce qui distingue cette personne des autres */
      (c.curseurs || []).slice(0, 3).forEach((k, i) => {
        const yy = y0 + 3.55 + i * 0.4, x1 = M + 0.3, x2 = M + lw - 0.3;
        txt(s, k.gauche, x1, yy, (x2 - x1) / 2, 0.18, { fontSize: 7, color: MUET_C });
        txt(s, k.droite, x1 + (x2 - x1) / 2, yy, (x2 - x1) / 2, 0.18, { fontSize: 7, color: MUET_C, align: 'right' });
        boite(s, x1, yy + 0.24, x2 - x1, 0.03, { fill: TRAIT });
        const px = x1 + (x2 - x1) * Math.max(0, Math.min(1, Number(k.position)));
        s.addShape(pres.ShapeType.ellipse, { x: px - 0.07, y: yy + 0.185, w: 0.14, h: 0.14, fill: { color: ENCRE }, line: { type: 'none' } });
      });
      const rx = M + lw + 0.25, rw = DROITE - rx, cw = (rw - 0.2) / 2, ch = (h - 0.2) / 2;
      [['objectifs', 0, 0], ['frustrations', 1, 0], ['comportements', 0, 1], ['contexte', 1, 1]].forEach(([cle, i, j]) => {
        const x = rx + i * (cw + 0.2), y = y0 + j * (ch + 0.2);
        filet(s, x, y, cw, cle === 'frustrations' ? AMBRE : ENCRE);
        petit(s, MT.per[cle].toUpperCase(), x, y + 0.08, cw, cle === 'frustrations' ? AMBRE : MUET_C, { fontSize: 7.5 });
        const items = c.blocs[cle] || [];
        const runs = items.flatMap((it, k) => {
          const h_ = it.statut === 'hypothèse';
          return [{ text: it.texte, options: { bullet: true, color: h_ ? AMBRE : ENCRE, fontSize: 11 } },
                  { text: `  ${h_ ? it.ref : [].concat(it.sources || []).join(' · ')}`, options: { color: h_ ? AMBRE : MUET_C, fontSize: 7.5, breakLine: k < items.length - 1 } }];
        });
        if (runs.length) txt(s, runs, x, y + 0.4, cw, ch - 0.45, { lineSpacing: 14, paraSpaceAfter: 6 });
      });
      pied(s, MT.perPied(c.traits, c.hypotheses, d.niveau) + `  ${MT.sources(c.sources.length)}${MT.sep}${c.sources.join(', ')}.`);
    },

    'empathy-map'(p) {
      const s = planche(false), c = p.calcul;
      entete(s, sur(p), p.titre, MT.empFormat);
      const y0 = 2.0, hq = 1.62, g = 0.12, qw = (LARG - g) / 2;
      /* les étiquettes des cadrans de droite s'alignent à droite : le centre appartient à la personne */
      const cadran = (cle, x, y, w, hh, accent, droite = false) => {
        boite(s, x, y, w, hh, { fill: accent ? AMBRE_T : PAPIER, line: TRAIT });
        petit(s, MT.emp[cle].toUpperCase(), x + 0.18, y + 0.1, w - 0.36, accent ? AMBRE : MUET_C, { fontSize: 7.5, align: droite ? 'right' : 'left' });
        const items = c.cadrans[cle] || [];
        if (!items.length) { txt(s, MT.empVide, x + 0.18, y + 0.42, w - 0.36, 0.4, { fontSize: 9.5, italic: true, color: MUET_C }); return; }
        const runs = items.flatMap((it, k) => {
          const h_ = it.statut === 'hypothèse';
          return [{ text: it.texte, options: { bullet: true, color: h_ ? AMBRE : ENCRE, fontSize: 10.5, fontFace: cle === 'dit' ? CIT : CORPS, italic: cle === 'dit' } },
                  { text: `  ${h_ ? it.ref : [].concat(it.sources || []).join(' · ')}`, options: { color: h_ ? AMBRE : MUET_C, fontSize: 7.5, breakLine: k < items.length - 1 } }];
        });
        txt(s, runs, x + 0.18, y + 0.4, w - 0.36, hh - 0.45, { lineSpacing: 13.5, paraSpaceAfter: 4 });
      };
      cadran('dit', M, y0, qw, hq); cadran('pense', M + qw + g, y0, qw, hq, false, true);
      cadran('fait', M, y0 + hq + g, qw, hq); cadran('ressent', M + qw + g, y0 + hq + g, qw, hq, false, true);
      /* la personne au centre, comme sur le canevas */
      const cx = M + LARG / 2, cy = y0 + hq + g / 2, r = 0.42;
      s.addShape(pres.ShapeType.ellipse, { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, fill: { color: ENCRE }, line: { color: OS, width: 2 } });
      txt(s, p.donnees.persona, cx - r, cy - r, 2 * r, 2 * r, { fontFace: DISP, fontSize: 10, bold: true, color: OS, align: 'center', valign: 'middle' });
      const yb = y0 + 2 * hq + 2 * g, hb = 6.75 - yb;
      cadran('douleurs', M, yb, qw, hb, true); cadran('gains', M + qw + g, yb, qw, hb);
      pied(s, `${MT.empPied}  ${MT.sources(c.sources.length)}${MT.sep}${c.sources.join(', ')}.`);
    },

    'journey-map'(p) {
      const s = planche(false), c = p.calcul, et = c.etapes, n = et.length;
      entete(s, sur(p), p.titre, MT.jouFormat);
      const lab = 1.5, x0 = M + lab, cw = (LARG - lab) / n;
      const rangs = [['tete', 2.0, 0.42], ['fait', 2.48, 0.72], ['contact', 3.24, 0.4], ['pense', 3.68, 0.72], ['emotion', 4.46, 1.2], ['irritants', 5.72, 1.02]];
      for (const [cle, y, hh] of rangs) {
        if (cle === 'tete') continue;
        petit(s, MT.jou[cle].toUpperCase(), M, y + 0.02, lab - 0.12, cle === 'emotion' ? AMBRE : MUET_C, { fontSize: 7, valign: 'top' });
        filet(s, M, y - 0.04, LARG, TRAIT);
      }
      const [, ye, he] = rangs[4];
      /* la courbe garde de la place sous le point bas et au-dessus du point haut pour leur étiquette */
      const yv = v => ye + he / 2 - (v / 2) * (he / 2 - 0.32);
      et.forEach((e, i) => {
        const x = x0 + i * cw, bas = i === c.bas, haut = i === c.haut;
        boite(s, x + 0.04, 2.0, cw - 0.08, 0.42, { fill: bas ? AMBRE : ENCRE });
        txt(s, e.nom, x + 0.12, 2.0, cw - 0.24, 0.42, { fontFace: DISP, fontSize: n > 6 ? 8.5 : 9.5, bold: true, color: bas ? ENCRE : OS, valign: 'middle', fit: 'shrink' });
        if (e.inconnue) { txt(s, MT.inconnue, x + 0.1, 2.5, cw - 0.2, 3.2, { fontSize: 9, italic: true, color: MUET_C, align: 'center', valign: 'middle' }); return; }
        txt(s, e.fait, x + 0.1, 2.5, cw - 0.2, 0.7, { fontSize: 9, color: ENCRE, lineSpacing: 11.5, fit: 'shrink' });
        txt(s, e.contact, x + 0.1, 3.26, cw - 0.2, 0.38, { fontSize: 8.5, color: TXT_C, lineSpacing: 11, fit: 'shrink' });
        txt(s, e.pense, x + 0.1, 3.7, cw - 0.2, 0.7, { fontFace: CIT, italic: true, fontSize: 9, color: TXT_C, lineSpacing: 11.5, fit: 'shrink' });
        const runs = [...[].concat(e.irritants || []).map(t => ({ text: `▼ ${t}`, options: { color: AMBRE, breakLine: true } })),
                      ...[].concat(e.opportunites || []).map(o => ({ text: `↗ ${typeof o === 'string' ? o : o.texte}${o.ref ? `  ${o.ref}` : ''}`, options: { color: ENCRE, bold: true, breakLine: true } }))];
        if (runs.length) txt(s, runs, x + 0.1, 5.74, cw - 0.2, 0.98, { fontSize: 8.5, lineSpacing: 11, fit: 'shrink' });
      });
      /* la courbe émotionnelle : zéro en pointillé, un segment par passage d'étape */
      trait(s, x0, yv(0), x0 + n * cw, yv(0), { c: TRAIT, dash: true, lw: 0.75 });
      const pts = et.map((e, i) => Number.isInteger(e.emotion) && !e.inconnue ? [x0 + (i + 0.5) * cw, yv(e.emotion)] : null);
      for (let i = 1; i < pts.length; i++) if (pts[i - 1] && pts[i]) trait(s, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], { c: ENCRE, lw: 2 });
      pts.forEach((pt, i) => {
        if (!pt) return;
        /* l'étiquette du point haut au-dessus de lui, celle du point bas en dessous */
        if (i === c.bas || i === c.haut)
          petit(s, i === c.bas ? MT.bas : MT.haut, pt[0] - cw / 2, i === c.bas ? pt[1] + 0.13 : pt[1] - 0.37, cw, i === c.bas ? AMBRE : MUET_C, { fontSize: 6.5, align: 'center' });
        const r = i === c.bas || i === c.haut ? 0.11 : 0.075;
        s.addShape(pres.ShapeType.ellipse, { x: pt[0] - r, y: pt[1] - r, w: 2 * r, h: 2 * r,
          fill: { color: i === c.bas ? AMBRE : ENCRE }, line: { color: OS, width: 1 } });
      });
      pied(s, MT.jouPied(c.amplitude, c.sources.length) + `  ${c.sources.join(', ')}.`);
    },

    /* ── l'économie unitaire : la chaîne d'un client à gauche, les trois chiffres qui décident à droite ── */
    'economie-unitaire'(p) {
      const s = planche(false), c = p.calcul, EC = MT.eco, en = modele.lang === 'en';
      entete(s, sur(p), p.titre, EC.format);
      const per = en ? (c.periode === 'mois' ? 'month' : 'year') : c.periode;
      const eur = v => (en ? `€${nombre(v)}` : `${nombre(v)} €`);
      const tag = x => x.origine === 'hypothèse' ? `${MT.tag['hypothèse']}  ${x.ref}` : x.origine === 'sourcé' ? `${MT.tag['sourcé']}  ${x.source}` : MT.tag[x.origine] || '';
      const lignes = [
        ['', EC.lignes.revenu, `${eur(c.revenu.valeur)} / ${per}`, tag(c.revenu), c.revenu.origine],
        ['−', EC.lignes.cout, `${eur(c.cout_service.valeur)} / ${per}`, tag(c.cout_service), c.cout_service.origine],
        ['=', EC.lignes.marge, `${eur(c.marge)} / ${per}  ·  ${nombre(100 * c.taux_marge, { decimales: 0 })} %`, EC.calcul, 'calcul'],
        ['×', EC.lignes.vie, EC.vie(nombre(c.vie, { decimales: 0 }), c.periode), tag(c.attrition), c.attrition.origine],
        ['=', EC.lignes.ltv, eur(Math.round(c.ltv)), EC.calcul, 'calcul'],
        ['÷', EC.lignes.cac, eur(c.cac.valeur), tag(c.cac), c.cac.origine],
      ];
      const x0 = M, w0 = 6.7, y0 = 2.0, rh = 0.66;
      petit(s, EC.pour(c.unite || ''), x0, y0, w0, AMBRE, { fontSize: 7.5 });
      lignes.forEach(([op, lib, val, t, o], i) => {
        const y = y0 + 0.34 + i * rh, res = op === '=';
        if (res) boite(s, x0, y, w0, rh - 0.08, { fill: PAPIER, line: TRAIT });
        else filet(s, x0, y, w0, TRAIT);
        txt(s, op, x0 + 0.1, y + 0.1, 0.3, 0.42, { fontFace: DISP, fontSize: 16, bold: true, color: AMBRE });
        txt(s, lib, x0 + 0.45, y + 0.16, 2.2, 0.3, { fontSize: 11, color: TXT_C, bold: res });
        txt(s, val, x0 + 2.65, y + 0.1, 2.5, 0.42, { fontFace: DISP, fontSize: res ? 16 : 14, bold: true, color: ENCRE });
        petit(s, t, x0 + 5.15, y + 0.14, w0 - 5.2, o === 'hypothèse' ? AMBRE : MUET_C, { fontSize: 7, align: 'right' });
      });
      /* à droite : LTV / CAC, la récupération, la piste — chacun contre son repère */
      const rx = x0 + w0 + 0.45, rw = DROITE - rx;
      const blocs = [[EC.ratio, `${nombre(c.ratio, { decimales: 1 })} ×`, EC.repereRatio, c.ratio >= 3],
        [EC.recup, `${nombre(c.recuperation, { decimales: 0 })} ${EC.mois}`, EC.repereRecup, c.recuperation <= 12 * (c.periode === 'mois' ? 1 : 1)],
        ...(c.piste !== null ? [[EC.piste, `${nombre(c.piste, { decimales: 0 })} ${EC.mois}`, EC.reperePiste(eur(c.tresorerie.valeur), eur(c.consommation.valeur)), c.piste >= c.recuperation]] : [])];
      blocs.forEach(([lib, val, rep, ok], i) => {
        const y = y0 + i * 1.6;
        boite(s, rx, y, rw, 1.45, { fill: ok ? ENCRE : AMBRE_T, line: ok ? undefined : AMBRE });
        s.sombre = ok;
        petit(s, lib, rx + 0.25, y + 0.14, rw - 0.5, ok ? MUET_S : AMBRE, { fontSize: 7.5 });
        txt(s, val, rx + 0.25, y + 0.42, rw - 0.5, 0.6, { fontFace: DISP, fontSize: 30, bold: true, color: ok ? OS : ENCRE, valign: 'middle' });
        txt(s, rep, rx + 0.25, y + 1.05, rw - 0.5, 0.3, { fontSize: 9, color: ok ? TXT_S : TXT_C });
        s.sombre = false;
      });
      pied(s, EC.pied);
    },

    /* ── les cartes d'apprentissage : l'échelle de la preuve par hypothèse, puis les cartes ── */
    apprentissages(p) {
      const c = p.calcul, AP = MT.appr, EC = MT.pitch.echelle, n = c.echelle.length;
      const hyps = c.hypotheses.slice(0, 5), cartes = c.cartes;
      for (let k = 0; k < Math.max(1, cartes.length); k += 2) {
        const s = planche(false), lot = cartes.slice(k, k + 2);
        entete(s, sur(p), p.titre, AP.format);
        /* à gauche : chaque hypothèse sur l'échelle, jusqu'au plus haut échelon qui l'a tranchée */
        const lx = M, lw = 4.75, y0 = 2.0, rh = Math.min(0.92, 4.6 / Math.max(1, hyps.length));
        petit(s, AP.echelle, lx, y0, lw, AMBRE, { fontSize: 7 });
        const cw = (lw - 0.06 * (n - 1)) / n;
        c.echelle.forEach((e, j) => petit(s, EC[e].toUpperCase(), lx + j * (cw + 0.06), y0 + 0.28, cw, MUET_C, { fontSize: 6, align: 'center' }));
        hyps.forEach((h, i) => {
          const y = y0 + 0.55 + i * rh, rang = c.echelle.indexOf(h.echelon), inf = h.verdict === 'infirmée';
          txt(s, [{ text: `${h.id}  `, options: { bold: true, color: ENCRE } }, { text: h.enjeu || '', options: { color: TXT_C } }],
            lx, y, lw - 1.2, 0.3, { fontSize: 9, fit: 'shrink' });
          petit(s, `${h.critique ? AP.critique + ' · ' : ''}${AP.verdict[h.verdict] || ''}`, lx + lw - 1.6, y + 0.03, 1.6, inf ? AMBRE : h.verdict === 'confirmée' ? ENCRE : MUET_C, { fontSize: 6.5, align: 'right' });
          c.echelle.forEach((_, j) => boite(s, lx + j * (cw + 0.06), y + 0.32, cw, 0.2,
            j <= rang ? { fill: inf ? AMBRE : ENCRE } : { fill: PAPIER, line: TRAIT }));
        });
        /* à droite : les cartes, nous pensions — fait — observé — donc */
        const rx = lx + lw + 0.35, rw = DROITE - rx, ch = (4.72 - 0.16) / 2;
        lot.forEach((x, i) => {
          const y = y0 + i * (ch + 0.16), inf = x.verdict === 'infirmée';
          boite(s, rx, y, rw, ch, { fill: PAPIER, line: TRAIT });
          petit(s, `${x.id}  ·  ${x.ref}  ·  ${(EC[x.fiabilite] || '').toUpperCase()}  ·  ${AP.verdict[x.verdict] || ''}`, rx + 0.18, y + 0.1, rw - 0.36, inf ? AMBRE : ENCRE, { fontSize: 7 });
          const cr = typeof x.critere === 'string' ? { texte: x.critere } : (x.critere || {});
          const jour = v => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v || '—'));
          txt(s, AP.critere(cr.texte || '—', jour(cr.ecrit_le)), rx + 0.18, y + 0.34, rw - 0.36, 0.22, { fontSize: 8.5, italic: true, color: MUET_C });
          const lab = 1.55, rows = [x.pensions, x.fait, `${x.observe}  ${x.source || ''}`, x.decidons], lh = (ch - 0.72) / 4;
          rows.forEach((t, j) => {
            const yy = y + 0.64 + j * lh;
            petit(s, AP.cartes[j], rx + 0.18, yy, lab - 0.1, j === 3 ? AMBRE : MUET_C, { fontSize: 6.5, valign: 'top' });
            txt(s, String(t || ''), rx + 0.18 + lab, yy - 0.03, rw - 0.36 - lab, lh, { fontSize: 10, color: j === 3 ? ENCRE : TXT_C, bold: j === 3, lineSpacing: 12.5, valign: 'top', margin: 0 });
          });
        });
        pied(s, AP.pied(c.tranchee_par_acte));
      }
    },

    /* ── les investisseurs ciblés : une ligne par personne, classée par adéquation ── */
    investisseurs(p) {
      const s = planche(false), c = p.calcul, IV = MT.invest;
      entete(s, sur(p), p.titre, IV.format);
      const pt = { oui: '●', partiel: '◐', non: '○' };
      const money = v => { const k = Math.round(Number(v) / 1000); return modele.lang === 'en' ? `€${k.toLocaleString('en-GB')}k` : `${nombre(k)} k€`; };
      const lignes = [IV.tete, ...c.lignes.map(l => [
        { text: l.nom, options: { bold: true, color: ENCRE } }, l.structure,
        ...['secteur', 'geographie', 'portefeuille', 'performance'].map(k => ({ text: pt[l.notes[k]] || '—', options: { fontSize: 14, color: l.notes[k] === 'oui' ? ENCRE : l.notes[k] === 'partiel' ? AMBRE : MUET_C } })),
        Number.isFinite(Number(l.t?.min)) ? `${money(l.t.min)} – ${money(l.t.max)} · ${IV.ticket[l.ticket] || ''}` : '—',
        { text: `${IV.acces[l.acces] || '—'}${l.via ? ' — ' + l.via : ''}`, options: { color: l.acces === 'chaud' ? ENCRE : MUET_C } },
        { text: `${l.score} / 8`, options: { bold: true, color: l.score >= 6 ? ENCRE : AMBRE } }])];
      tableau(s, lignes, M, 2.05, [1.45, 1.55, 0.95, 1.15, 1.3, 1.3, 1.5, 1.33, 0.9], { fontSize: 9.5 });
      pied(s, IV.pied(c.bien, c.lignes.length));
    },

    /* ── le pitch investisseurs : onze planches, lisibles du fond de la salle (K. Hale),
          aux outils du New Business Venturing d'INSEAD ── */
    pitch(p) {
      const c = p.calcul, PT = MT.pitch, en = modele.lang === 'en';
      const fondDe = it => it.statut === 'hypothèse' ? `${PT.tag['hypothèse']}  ${it.ref || ''}` : it.statut === 'inconnu' ? PT.tag.inconnu
        : `${PT.tag[it.statut] || ''}  ${it.source || ''}`.trim();
      const st = x => x.statut || (x.source ? 'établi' : 'inconnu');
      const euros = v => en ? `€${Number(v).toLocaleString('en-GB')}` : `${nombre(Number(v))} €`;
      /* l'ouverture : le nom, l'accroche, le mantra, le positionnement */
      const o = planche(true);
      petit(o, PT.sur, M, 0.9, LARG, AMBRE, { fontSize: 9 });
      txt(o, c.entreprise || '', M, 1.35, LARG, 1.2, { fontFace: DISP, fontSize: 58, bold: true, color: OS, charSpacing: -1, lineSpacing: 62 });
      txt(o, c.accroche || '', M, 2.6, LARG * 0.85, 0.9, { fontFace: DISP, fontSize: 24, color: TXT_S, lineSpacing: 29 });
      if (c.mantra) { boite(o, M, 3.85, 0.6, 0.05, { fill: AMBRE }); petit(o, PT.mantra, M, 4.0, 3, MUET_S, { fontSize: 8 });
        txt(o, String(c.mantra).toUpperCase(), M, 4.25, LARG, 0.6, { fontFace: DISP, fontSize: 22, bold: true, color: AMBRE, charSpacing: 1 }); }
      const pos = c.pos ? (en ? [`For ${c.pos.pour} who ${c.pos.qui}, ${c.pos.produit} is ${c.pos.categorie} that ${c.pos.benefice}.`, `Unlike ${c.pos.contrairement_a}, ${c.pos.difference}.`] : c.positionnement) : null;
      if (pos) { petit(o, PT.positionnement, M, 5.05, 4, MUET_S, { fontSize: 8 });
        txt(o, pos.join(' '), M, 5.3, LARG * 0.9, 1.2, { fontFace: CIT, italic: true, fontSize: 13.5, color: TXT_S, lineSpacing: 18 }); }
      pied(o, '');

      c.planches.forEach((pl, i) => {
        const sombre = pl.cle === 'demande', s = planche(sombre), encre = sombre ? OS : ENCRE, muet = sombre ? MUET_S : MUET_C;
        petit(s, `${String(i + 2).padStart(2, '0')}  ·  ${(PT.noms[pl.cle] || pl.nom).toUpperCase()}`, M, 0.55, LARG, AMBRE, { fontSize: 9 });
        txt(s, pl.titre, M, 0.9, LARG, 1.6, { fontFace: DISP, fontSize: pl.titre.length > 95 ? 26 : 30, bold: true, color: encre, charSpacing: -0.5,
          lineSpacing: pl.titre.length > 95 ? 31 : 36 });
        const ch = pl.chiffre, pts = pl.points || [], y0 = 2.75;
        const gauche = ch || pl.resultat || pl.avantage;
        const xp = gauche ? M + 5.6 : M, wp = gauche ? LARG - 5.6 : LARG;

        if (pl.cle === 'apprentissages') {
          const cartes = pl.cartes || [], gw = 0.18, cw = (LARG - gw * (cartes.length - 1)) / Math.max(1, cartes.length);
          cartes.forEach((k, j) => {
            const x = M + j * (cw + gw);
            boite(s, x, y0, cw, 3.85, { fill: PAPIER, line: TRAIT });
            PT.cartes.forEach((lib, m) => {
              const yy = y0 + 0.2 + m * 1.12;
              petit(s, lib, x + 0.25, yy, cw - 0.5, m === 2 ? AMBRE : MUET_C, { fontSize: 7.5 });
              txt(s, [k.pensions, k.observe, k.decidons][m] || '', x + 0.25, yy + 0.28, cw - 0.5, 0.78, { fontFace: m === 2 ? DISP : CORPS, bold: m === 2, fontSize: m === 2 ? 14 : 13, color: ENCRE, lineSpacing: m === 2 ? 17 : 16 });
            });
            petit(s, `${k.ref || ''}  ·  ${(PT.echelle[k.fiabilite] || '').toUpperCase()}  ·  ${k.source || ''}`, x + 0.25, y0 + 3.5, cw - 0.5, AMBRE, { fontSize: 7 });
          });
          pied(s, PT.sources + [...new Set(cartes.flatMap(k => [k.ref, k.source]).filter(Boolean))].join(' · '));
          return;
        }

        if (ch) {
          const hyp = ch.statut === 'hypothèse', aDecider = pl.cle === 'demande' && ch.statut !== 'décision';
          txt(s, String(ch.valeur), M, y0 - 0.1, 5.3, 1.25, { fontFace: DISP, fontSize: String(ch.valeur).length > 9 ? 46 : 62, bold: true,
            color: hyp ? AMBRE : encre, charSpacing: -1.5, lineSpacing: 66 });
          txt(s, ch.libelle || '', M, y0 + 1.2, 5.0, 0.6, { fontSize: 14, color: sombre ? TXT_S : TXT_C, lineSpacing: 18 });
          const rung = ch.fiabilite ? `  ·  ${(PT.echelle[ch.fiabilite] || '').toUpperCase()}` : '';
          petit(s, (aDecider ? PT.aDecider : fondDe({ statut: st(ch), source: ch.source, ref: ch.ref })) + rung, M, y0 + 1.85, 5.0, hyp || aDecider ? AMBRE : muet, { fontSize: 8 });
        } else if (pl.resultat || pl.avantage) {
          const r = pl.resultat || pl.avantage, hyp = r.statut === 'hypothèse';
          petit(s, pl.resultat ? `${PT.resultatTitre}  ·  ${PT.resultat[r.type] || ''}` : PT.avantage, M, y0, 5.2, AMBRE, { fontSize: 8 });
          txt(s, r.texte, M, y0 + 0.32, 5.1, 1.6, { fontFace: DISP, fontSize: 24, bold: true, color: hyp ? AMBRE : encre, lineSpacing: 29 });
          petit(s, fondDe({ statut: st(r), source: r.source, ref: r.ref }), M, y0 + 1.95, 5.0, hyp ? AMBRE : muet, { fontSize: 8 });
        }
        if (ch && pl.cle === 'modele' && pl.economie) {
          const e = pl.economie;
          txt(s, PT.economie(euros(e.ltv.valeur), euros(e.cac.valeur), pl.ratio.toFixed(1).replace('.', en ? '.' : ',')), M, y0 + 2.25, 5.2, 0.4,
            { fontFace: DISP, fontSize: 13, bold: true, color: pl.ratio < 3 ? AMBRE : encre });
        }

        pts.forEach((it, k) => {
          const yy = y0 + k * 1.05, hyp = it.statut === 'hypothèse';
          if (k) filet(s, xp, yy - 0.12, wp, sombre ? NUIT : TRAIT);
          const avant = it.type ? `${PT.types[it.type] || it.type}  ·  ` : it.activite ? `${String(it.activite).toUpperCase()}  ·  ` : '';
          const rung = it.fiabilite ? `  ·  ${(PT.echelle[it.fiabilite] || '').toUpperCase()}` : '';
          txt(s, it.texte, xp, yy, wp, 0.66, { fontFace: DISP, fontSize: gauche ? 18 : 20, bold: true, color: hyp ? AMBRE : encre, lineSpacing: gauche ? 22 : 24 });
          petit(s, avant + fondDe(it) + rung, xp, yy + 0.64, wp, hyp ? AMBRE : muet, { fontSize: 7.5 });
        });

        /* le bas de planche : ce que la méthode NBV y ajoute */
        const yb = 5.55;
        if (pl.histoire) {
          boite(s, M, yb - 0.1, LARG, 1.15, { fill: sombre ? NUIT : PAPIER, line: TRAIT });
          petit(s, `${PT.histoire}  ·  ${pl.histoire.persona}${pl.histoire.source ? '  ·  ' + pl.histoire.source : ''}`, M + 0.25, yb, 6, AMBRE, { fontSize: 7.5 });
          txt(s, pl.histoire.texte, M + 0.25, yb + 0.28, LARG - 0.5, 0.7, { fontFace: CIT, italic: true, fontSize: 15, color: ENCRE, lineSpacing: 19 });
        }
        if (pl.cle === 'traction') {
          petit(s, PT.echelleTitre, M, yb - 0.05, LARG, muet, { fontSize: 7.5 });
          const E = ['propos', 'interet', 'action', 'paiement'], ew = (LARG - 0.3) / 4, haut = E.indexOf(pl.echelon || '');
          E.forEach((e, j) => {
            const atteint = j <= haut && j > 0;
            boite(s, M + j * (ew + 0.1), yb + 0.25, ew, 0.55, { fill: j === haut ? AMBRE : atteint ? AMBRE_T : PAPIER, line: TRAIT });
            txt(s, PT.echelle[e], M + j * (ew + 0.1), yb + 0.25, ew, 0.55, { fontFace: DISP, fontSize: 12, bold: j === haut, align: 'center', valign: 'middle',
              color: j === haut ? OS : j === 0 ? MUET_C : ENCRE });
          });
        }
        if (pl.cle === 'modele' && (pl.forces || []).length) {
          txt(s, pl.forces.map(f => PT.forces[f] || f).join('   ·   '), xp, yb + 0.35, wp, 0.4, { fontFace: DISP, fontSize: 12, bold: true, color: encre });
        }
        if (pl.cle === 'equipe' && (pl.manques || []).length) {
          petit(s, PT.manques, M, yb + 0.15, LARG, AMBRE, { fontSize: 7.5 });
          txt(s, pl.manques.join('  ·  '), M, yb + 0.42, LARG, 0.5, { fontFace: DISP, fontSize: 15, bold: true, color: AMBRE });
        }
        if (pl.cle === 'demande' && (pl.tranche || []).length) {
          petit(s, PT.tranche, M, yb + 0.15, LARG, AMBRE, { fontSize: 7.5 });
          txt(s, pl.tranche.join('   ·   '), M, yb + 0.42, LARG, 0.5, { fontFace: DISP, fontSize: 18, bold: true, color: OS });
        }
        const srcs = [...new Set([ch, pl.resultat, pl.avantage, pl.histoire, ...pts].filter(Boolean).flatMap(x => [x.source, x.ref, x.persona]).filter(Boolean))];
        pied(s, srcs.length ? PT.sources + srcs.join(' · ') : '');
      });
    },

    bmc(p) {
      const s = planche(false), c = p.calcul;
      entete(s, sur(p), p.titre, 'Business Model Canvas · Osterwalder');
      const g = 0.08, y0 = 1.98, hHaut = 3.22, yBas = y0 + hHaut + g, hBas = 6.72 - yBas;
      const cw = (LARG - 4 * g) / 5, X = i => M + i * (cw + g), demi = (hHaut - g) / 2;
      const cases = [
        ['partenaires', X(0), y0, cw, hHaut], ['activites', X(1), y0, cw, demi], ['ressources', X(1), y0 + demi + g, cw, demi],
        ['proposition', X(2), y0, cw, hHaut], ['relations', X(3), y0, cw, demi], ['canaux', X(3), y0 + demi + g, cw, demi],
        ...(c.operateurs?.length || c.sans_operateur ? [['segments', X(4), y0, cw, hHaut * 0.55 - g / 2]] : [['segments', X(4), y0, cw, hHaut]]),
        ['couts', M, yBas, (LARG - g) / 2, hBas], ['revenus', M + (LARG + g) / 2, yBas, (LARG - g) / 2, hBas],
      ];
      for (const [cle, x, y, w, h] of cases) {
        const b = c.blocs[cle], fragile = c.fragiles.includes(b.nom), cle2 = cle === 'proposition';
        boite(s, x, y, w, h, { fill: cle2 ? AMBRE_T : PAPIER, line: fragile ? AMBRE : TRAIT, lw: fragile ? 1.25 : 0.75, dash: fragile });
        petit(s, (MT.bmc[cle] || b.nom).toUpperCase(), x + 0.12, y + 0.06, w - 0.24, fragile ? AMBRE : MUET_C, { fontSize: 7 });
        const runs = b.items.map((it, i) => ({
          text: it.texte + (it.statut === 'hypothèse' ? `\u00a0\u00a0${String(it.ref).replace(/-/g, '\u2011')}` : it.statut === 'inconnu' ? '  ?' : ''),
          options: { breakLine: i < b.items.length - 1, paraSpaceAfter: 4,
            bold: it.statut === 'décision', italic: it.statut === 'inconnu',
            color: it.statut === 'hypothèse' ? AMBRE : it.statut === 'inconnu' ? MUET_C : ENCRE } }));
        const large = w > 3;
        if (runs.length) txt(s, runs, x + 0.12, y + 0.34, w - 0.24, h - 0.4, { fontSize: large ? 9.5 : 9, lineSpacing: 11.5 });
        if (fragile) petit(s, MT.fragile, x + 0.12, y + h - 0.28, w - 0.24, AMBRE, { fontSize: 6.5 });
      }
      /* la seconde famille d'acteurs : sous les segments clients, ceux qui font tourner le service */
      if (c.operateurs?.length || c.sans_operateur) {
        const y = y0 + hHaut * 0.55 + g / 2, h = hHaut * 0.45 - g / 2;
        boite(s, X(4), y, cw, h, { fill: PAPIER, line: ENCRE, lw: 1 });
        petit(s, MT.operateurs, X(4) + 0.12, y + 0.06, cw - 0.24, ENCRE, { fontSize: 7 });
        const runs = c.operateurs.length ? c.operateurs.map((o, i) => ({ text: `${o.nom}${o.statut === 'hypothèse' ? `\u00a0\u00a0${String(o.ref || '').replace(/-/g, '\u2011')}` : ''}`,
          options: { breakLine: i < c.operateurs.length - 1, paraSpaceAfter: 4, bold: o.statut === 'décision', color: o.statut === 'hypothèse' ? AMBRE : ENCRE } }))
          : [{ text: MT.sansOperateur(c.sans_operateur), options: { italic: true, color: MUET_C } }];
        txt(s, runs, X(4) + 0.12, y + 0.34, cw - 0.24, h - 0.4, { fontSize: 9, lineSpacing: 11.5 });
      }
      const k = c.compte;
      pied(s, `${MT.bmcPied(k['hypothèse'], Object.values(k).reduce((a, b) => a + b, 0))} ${p.source || ''}`);
    },

    dimensionnement(p) {
      const s = planche(false), et = p.calcul.etapes;
      entete(s, sur(p), p.titre, MT.dimFormat);
      const parLigne = Math.min(5, Math.ceil(et.length / 2)), gap = 0.18;
      const bw = (LARG - (parLigne - 1) * gap) / parLigne, bh = 1.4;
      const final = et.length - 1;
      et.forEach((e, i) => {
        const x = M + (i % parLigne) * (bw + gap), y = 2.05 + Math.floor(i / parLigne) * (bh + 0.22);
        const resultat = e.op === '=', fin = i === final;
        boite(s, x, y, bw, bh, { fill: fin ? AMBRE : resultat ? ENCRE : PAPIER, line: fin || resultat ? undefined : TRAIT });
        s.sombre = resultat && !fin;
        const tag = (e.op ? e.op + '  ' : '') + (TAG[e.origine] || '');
        petit(s, tag, x + 0.15, y + 0.12, bw - 0.25, fin ? ENCRE : e.origine === 'hypothèse' ? AMBRE : s.sombre ? MUET_S : MUET_C, { fontSize: 7.5 });
        const g = e.valeur, val = e.fourchette ? nombre(g.c) : plage(g);
        txt(s, val, x + 0.15, y + 0.4, bw - 0.25, 0.5, { fontFace: DISP, fontSize: val.length > 11 ? 15 : val.length > 7 ? 18 : 22, bold: true,
          color: fin ? ENCRE : s.sombre ? OS : ENCRE, valign: 'middle' });
        const four = e.fourchette ? MT.fourchette(nombre(g.b), nombre(g.h)) : '';
        const verif = resultat && p.calcul.resultats.find(r => r.libelle === e.libelle)?.verifie ? MT.verifie : '';
        txt(s, e.libelle + four + verif, x + 0.15, y + 0.92, bw - 0.25, 0.45, { fontSize: 9, color: fin ? ENCRE : s.sombre ? TXT_S : TXT_C, lineSpacing: 11 });
        s.sombre = false;
      });
      const r = p.calcul.resultat, hyp = et.filter(e => e.origine === 'hypothèse');
      const yb = 2.05 + 2 * (bh + 0.22) + 0.1;
      filet(s, M, yb, LARG, ENCRE);
      const cols = [
        [MT.resultat, r ? MT.resultatTexte(plage(r.affiche), plage(r.calcule)) : '—'],
        [MT.hypPortent(hyp.length), hyp.map(h => h.libelle).join(' · ')],
        [MT.sensibilite, MT.sensibiliteTexte],
      ];
      cols.forEach((c, i) => txt(s, [{ text: c[0] + '  ', options: { bold: true, color: ENCRE, fontFace: DISP } }, { text: c[1] }],
        M + i * (LARG / 3), yb + 0.15, LARG / 3 - 0.3, 0.95, { fontSize: 10, lineSpacing: 13 }));
      pied(s, p.source || MT.methode(p.reference));
    },

    reservoirs(p) {
      const s = planche(false), c = p.calcul, unite = p.donnees.unite ? ' ' + p.donnees.unite : '';
      entete(s, sur(p), p.titre, MT.poolsFormat);
      const x0 = M, bmax = 4.3, max = Math.max(...c.reservoirs.map(r => r.ca?.h || 0));
      c.reservoirs.slice(0, 4).forEach((r, i) => {
        const y = 2.05 + i * 0.9;
        txt(s, r.nom, x0, y, 7.6, 0.28, { fontFace: DISP, fontSize: 11, bold: true, color: ENCRE });
        const wb = r.ca.b / max * bmax, wh = r.ca.h / max * bmax;
        boite(s, x0, y + 0.34, Math.max(wb, 0.04), 0.42, { fill: r.libre ? AMBRE : GRIS });
        boite(s, x0 + wb, y + 0.34, Math.max(wh - wb, 0.02), 0.42, { fill: r.libre ? AMBRE_C : TRAIT });
        txt(s, [{ text: plage(r.ca) + unite, options: { breakLine: true } }, { text: r.libre ? MT.libre : r.occupe_par, options: { fontSize: 9, bold: false } }],
          x0 + wh + 0.12, y + 0.3, 8.75 - (x0 + wh + 0.12), 0.5, { fontFace: DISP, fontSize: 11, bold: true, color: r.libre ? AMBRE : ENCRE, valign: 'middle', lineSpacing: 13 });
      });
      const yt = 2.05 + Math.min(4, c.reservoirs.length) * 0.9 + 0.05;
      txt(s, MT.longueur, x0, yt - 0.1, 7.6, 0.25, { fontSize: 8.5, italic: true, color: MUET_C });
      tableau(s, [['', ...c.reservoirs.map(r => r.nom.split(/[,—]/)[0].trim())],
        ...c.attributs.map(a => [a, ...c.reservoirs.map(r => ({ text: r.valeurs[a], options: r.libre ? { color: AMBRE, bold: true } : {} }))])],
        x0, yt + 0.2, [1.9, ...c.reservoirs.map(() => 5.7 / c.reservoirs.length)], { premiereGrasse: true, fontSize: 9.5 });
      const rx = 9.1, rw = DROITE - rx;
      boite(s, rx, 2.05, rw, 4.6, { fill: ENCRE });
      s.sombre = true;
      if (c.rapport) {
        petit(s, MT.rapport, rx + 0.3, 2.3, rw - 0.6, AMBRE);
        txt(s, nombre(c.rapport.valeur, { approx: true, decimales: 0 }), rx + 0.3, 2.65, rw - 0.6, 0.95, { fontFace: DISP, fontSize: 60, bold: true, color: OS });
        txt(s, c.rapport.libelle, rx + 0.3, 3.62, rw - 0.6, 0.95, { fontFace: DISP, fontSize: 11.5, bold: true, color: OS, lineSpacing: 15 });
        txt(s, MT.contre(plage(c.rapport.numerateur.g), c.rapport.numerateur.libelle, plage(c.rapport.denominateur.g), c.rapport.denominateur.libelle),
          rx + 0.3, 4.62, rw - 0.6, 0.85, { fontSize: 9.5, lineSpacing: 12.5 });
      } else {
        petit(s, MT.libres, rx + 0.3, 2.3, rw - 0.6, AMBRE);
        txt(s, String(c.reservoirs.filter(r => r.libre).length), rx + 0.3, 2.65, rw - 0.6, 0.95, { fontFace: DISP, fontSize: 60, bold: true, color: OS });
        txt(s, c.reservoirs.filter(r => r.libre).map(r => `${r.nom} — ${plage(r.ca)}${unite}`).join('\n'), rx + 0.3, 3.65, rw - 0.6, 1.4, { fontFace: DISP, fontSize: 11.5, bold: true, color: OS, lineSpacing: 15 });
      }
      if (c.sans_marge) {
        filet(s, rx + 0.3, 5.55, rw - 0.6, NUIT);
        txt(s, MT.sansMarge, rx + 0.3, 5.65, rw - 0.6, 0.8, { fontSize: 9.5, italic: true, color: AMBRE_C, lineSpacing: 13 });
      }
      s.sombre = false;
      pied(s, p.source || MT.methode(p.reference));
    },

    'compte-inverse'(p) {
      const s = planche(false), c = p.calcul;
      entete(s, sur(p), p.titre, MT.ddpFormat);
      const et = c.etapes, pas = Math.min(0.62, 4.3 / et.length);
      et.forEach((e, i) => {
        const y = 2.08 + i * pas, fin = i === et.length - 1;
        if (fin) boite(s, M, y - 0.06, 7.75, pas - 0.04, { fill: AMBRE_T }); else filet(s, M, y - 0.06, 7.75);
        txt(s, e.op || '', M + 0.05, y, 0.3, 0.38, { fontFace: DISP, fontSize: 15, bold: true, color: MUET_C, valign: 'middle' });
        txt(s, nombre(e.valeur), M + 0.4, y, 1.2, 0.38, { fontFace: DISP, fontSize: 14, bold: true, color: ENCRE, valign: 'middle' });
        txt(s, e.libelle, M + 1.65, y, 2.9, pas - 0.1, { fontSize: 9, valign: 'middle', lineSpacing: 11 });
        origine(s, e.origine, M + 4.6, y + 0.07);
        if (e.op) {
          txt(s, '→ ' + nombre(e.resultat), M + 5.55, y - 0.02, 2.2, 0.3, { fontFace: DISP, fontSize: 12.5, bold: true, color: fin ? AMBRE : ENCRE });
          txt(s, e.donne || '', M + 5.55, y + 0.25, 2.2, 0.26, { fontSize: 8, color: MUET_C });
        }
      });
      const rx = 9.1, rw = DROITE - rx, ref = c.reference;
      petit(s, c.ecart ? MT.ecart : MT.marge, rx, 2.05, rw, AMBRE);
      txt(s, nombre(ref.valeur), rx, 2.35, 1.6, 0.8, { fontFace: DISP, fontSize: 44, bold: true, color: ENCRE });
      txt(s, MT.exiges(ref.libelle, nombre(c.exige)), rx + 1.55, 2.42, rw - 1.55, 0.75, { fontSize: 10, lineSpacing: 13 });
      txt(s, MT.source(ref.source), rx, 3.2, rw, 0.26, { fontSize: 8, italic: true, color: MUET_C });
      if (c.ecart) {
        txt(s, MT.rapporte(nombre(c.rendement_a_la_reference, { approx: true }), nombre(c.cible.valeur)), rx, 3.5, rw, 0.55, { fontFace: DISP, fontSize: 12, bold: true, color: ENCRE, lineSpacing: 16 });
        filet(s, rx, 4.15, rw, ENCRE);
        petit(s, MT.fermer, rx, 4.22, rw, MUET_C);
        const pct = (v, b) => b === 1 ? nombre(v * 100, { decimales: 0 }) + ' %' : nombre(v);
        const lignes = [[MT.retenir, MT.enMoyenne(nombre(c.exige), c.exige_libelle), true],
          ...c.leviers.map(l => l.possible
            ? [l.verbe, MT.auLieu(l.arrondi ?? pct(l.requis, l.borne), l.court || l.libelle.split(/[,—]/)[0].trim(), pct(l.actuel, l.borne)), true]
            : [l.verbe, MT.impossible(pct(l.requis, l.borne), l.court || l.libelle.split(/[,—]/)[0].trim(), pct(l.borne, l.borne)), false])];
        lignes.slice(0, 4).forEach((l, i) => txt(s, [{ text: `${i + 1}  ${l[0]} `, options: { bold: true, color: l[2] ? ENCRE : MUET_C, fontFace: DISP } },
          { text: l[1], options: { color: l[2] ? TXT_C : MUET_C } }], rx, 4.52 + i * 0.52, rw, 0.5, { fontSize: 10, lineSpacing: 12.5 }));
      } else txt(s, MT.couvre, rx, 3.28, rw, 0.6, { fontFace: DISP, fontSize: 12, bold: true, color: ENCRE });
      pied(s, p.source || MT.methode(p.reference));
    },

    'test-cards'(p) {
      const cartes = p.calcul.cartes;
      for (let k = 0; k < cartes.length; k += 5) {
        const s = planche(false), lot = cartes.slice(k, k + 5);
        entete(s, sur(p), p.titre, 'Test Cards · Strategyzer');
        const cw = (LARG - (lot.length - 1) * 0.16) / lot.length;
        lot.forEach((c, i) => {
          const x = M + i * (cw + 0.16), y = 2.05, h = 4.6, fort = p.calcul.premier_rang.includes(c.id);
          boite(s, x, y, cw, h, { fill: fort ? ENCRE : PAPIER, line: fort ? undefined : TRAIT });
          s.sombre = fort;
          const ix = x + 0.18, iw = cw - 0.34;
          txt(s, String(c.rang), ix, y + 0.14, 0.5, 0.55, { fontFace: DISP, fontSize: 30, bold: true, color: AMBRE });
          petit(s, MT.rang, ix + 0.5, y + 0.2, iw - 0.5, fort ? MUET_S : MUET_C, { fontSize: 7 });
          txt(s, `${c.id}  ·  ${c.enjeu || ''}`, ix + 0.5, y + 0.42, iw - 0.5, 0.45, { fontFace: DISP, fontSize: 9.5, bold: true, color: fort ? OS : ENCRE, lineSpacing: 11.5 });
          [[MT.carte[0], c.croyons], [MT.carte[1], c.verifions], [MT.carte[2], c.tort_si], [MT.carte[3], c.avant]].forEach((f, j) => {
            const yy = y + 0.95 + j * 0.9;
            filet(s, ix, yy, iw, fort ? NUIT : TRAIT);
            petit(s, f[0], ix, yy + 0.06, iw, j === 2 ? AMBRE : fort ? MUET_S : MUET_C, { fontSize: 7 });
            txt(s, String(f[1]), ix, yy + 0.32, iw, 0.56, { fontSize: 10, color: fort ? OS : j === 2 ? ENCRE : TXT_C, bold: j === 2, lineSpacing: 12.5 });
          });
          s.sombre = false;
        });
        pied(s, p.source || MT.methode(p.reference));
      }
    },

    metriques(p) {
      const s = planche(false), c = p.calcul;
      entete(s, sur(p), p.titre, MT.metFormat);
      const cx = [M, 5.15, 9.2], cw = [3.25, 3.1, DROITE - 9.2];
      petit(s, MT.entrees, cx[0], 1.95, cw[0], AMBRE);
      petit(s, MT.inter, cx[1], 1.95, cw[1]);
      petit(s, MT.finaux, cx[2], 1.95, cw[2]);
      const pos = new Map();
      const colonne = (items, col, h) => {
        const pas = Math.min(h + 0.25, 3.7 / Math.max(1, items.length));
        items.forEach((it, i) => pos.set(it.key, { x: cx[col], y: 2.3 + i * pas, w: cw[col], h, col }));
      };
      colonne(c.entrees.map((e, i) => ({ key: 'E' + i })), 0, 0.7);
      colonne(c.resultats.filter(r => r.niveau === 'intermediaire').map(r => ({ key: r.id })), 1, 1.15);
      colonne(c.resultats.filter(r => r.niveau === 'final').map(r => ({ key: r.id })), 2, 1.15);
      c.entrees.forEach((e, i) => {
        const b = pos.get('E' + i);
        boite(s, b.x, b.y, b.w, b.h, { line: AMBRE, lw: 1, dash: true });
        txt(s, e.nom, b.x + 0.15, b.y + 0.1, b.w - 0.3, 0.3, { fontFace: DISP, fontSize: 11, bold: true, color: ENCRE });
        txt(s, e.cible ? MT.cible(e.cible) : MT.sansCible, b.x + 0.15, b.y + 0.4, b.w - 0.3, 0.25, { fontSize: 8.5, italic: !e.cible, color: e.cible ? ENCRE : MUET_C });
      });
      for (const r of c.resultats) {
        const b = pos.get(r.id);
        boite(s, b.x, b.y, b.w, b.h, { fill: PAPIER, line: TRAIT });
        petit(s, r.id, b.x + 0.15, b.y + 0.06, 1.2, MUET_C, { fontSize: 7 });
        txt(s, r.nom, b.x + 0.15, b.y + 0.28, b.w - 0.3, 0.3, { fontFace: DISP, fontSize: 11, bold: true, color: ENCRE });
        txt(s, [{ text: `${r.aujourdhui}  →  `, options: { color: MUET_C } }, { text: r.cible, options: { color: AMBRE, bold: true } }], b.x + 0.15, b.y + 0.58, b.w - 0.3, 0.3, { fontFace: DISP, fontSize: (String(r.aujourdhui) + r.cible).length > 22 ? 10.5 : 13 });
        txt(s, r.quand, b.x + 0.15, b.y + 0.86, b.w - 0.3, 0.25, { fontSize: 8.5, color: MUET_C });
      }
      c.aretes.forEach(([a, b], i) => {
        const A = pos.get(a), B = pos.get(b);
        if (!A || !B) return;
        const decal = ((i % 3) - 1) * 0.12, y1 = A.y + A.h / 2 + decal, y2 = B.y + B.h / 2 + decal, c = a.startsWith('E') ? GRIS : ENCRE;
        const bas = Math.max(...[...pos.values()].filter(v => v.col === 1).map(v => v.y + v.h), 0);
        if (A.col === 0 && B.col === 2 && y1 > bas + 0.05) {
          const xm = B.x - 0.3;            // sous la colonne du milieu, puis remonter vers la cible
          trait(s, A.x + A.w, y1, xm, y1, { c });
          trait(s, xm, y1, xm, y2, { c });
          trait(s, xm, y2, B.x, y2, { fleche: true, c });
        } else trait(s, A.x + A.w, y1, B.x, y2, { fleche: true, c });
      });
      filet(s, M, 6.1, LARG, ENCRE);
      const sansCible = c.entrees.filter(e => !e.cible).length;
      txt(s, [{ text: MT.avantVente(c.avant_vente, c.resultats.length), options: { bold: true, color: ENCRE, fontFace: DISP } },
        { text: sansCible ? MT.entreesSans(sansCible) : MT.chaque }],
        M, 6.22, LARG, 0.45, { fontSize: 10.5, lineSpacing: 14 });
      pied(s, p.source || MT.methode(p.reference));
    },
  };

  /* ── assemblage ─────────────────────────────────────────────────────── */
  for (const p of modele.planches) {
    if (p.type === 'format') { (FMT[p.format] || (() => {}))(p); continue; }
    if (p.type === 'reserves') { GEN.constats(); GEN.defauts(); GEN.reserves(p); continue; }
    if (GEN[p.type]) GEN[p.type](p);
  }
  if (!modele.planches.some(p => p.type === 'reserves')) { GEN.constats(); GEN.defauts(); }
  return pres;
}

/** Écrit le pack d'un projet. Rend le chemin écrit. */
export async function ecrirePack(projet, cadence = 'C1', { sortie, couverture } = {}) {
  const modele = packModel(projet, cadence);
  const pres = rendrePack(modele, { couverture });
  const f = sortie || join(projet, 'dist', `pack-${cadence}.pptx`);
  mkdirSync(dirname(f), { recursive: true });
  /* pptxgenjs écrit ses parties sans compression : un pack de trente planches pèse alors
     près d'un mégaoctet, et certains clients de messagerie le bloquent. On recompresse. */
  /* [Content_Types].xml en tête et aucune entrée de dossier : l'ordre que PowerPoint écrit lui-même. */
  writeFileSync(f, await recompresser(await pres.write({ outputType: 'nodebuffer' })));
  return { fichier: f, planches: pres.slides.length, compte: modele.compte };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  const opt = k => { const i = a.indexOf(k); return i >= 0 ? a.splice(i, 2)[1] : undefined; };
  const couverture = opt('--couverture'), sortie = opt('--sortie');
  const [projet = '.', cadence = 'C1'] = a;
  ecrirePack(resolve(projet), cadence, { couverture: couverture && resolve(couverture), sortie: sortie && resolve(sortie) })
    .then(r => console.log(`${r.fichier} — ${r.planches} planches, dont ${r.compte.formats} de format vérifiées`))
    .catch(e => { console.error(e.message); process.exit(1); });
}
