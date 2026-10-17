/* Projection d'un dépôt produit en pack de planches.
 *
 * Le pack n'est pas un livrable : c'est une PROJECTION des livrables gouvernés.
 * Il se recalcule à chaque commit, et il grandit quand un livrable apparaît —
 * jamais l'inverse. Aucun contenu n'est saisi ici : tout est lu dans product/.
 *
 * Ce module ne rend rien. Il produit un MODÈLE typé, que le rendu consomme :
 * le plugin reste sans dépendance, et le format de sortie reste un choix du rendu.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { registry, cheminDe } from './registry.mjs';
import { evaluer, formatsPortesPar } from './exhibits.mjs';
import { applies } from './conditions.mjs';
import yaml from './yaml.mjs';

/** Sépare le front-matter YAML du corps. Un fichier sans front-matter n'en a pas. */
export function decoupe(texte) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(texte);
  if (!m) return { tete: {}, corps: texte };
  let tete = {};
  try { tete = yaml.load(m[1]) || {}; } catch { tete = {}; }
  return { tete, corps: texte.slice(m[0].length) };
}

/** Premier titre de niveau 1. C'est le titre de la planche. */
export function titreDe(corps) {
  const m = /^#\s+(.+)$/m.exec(corps);
  return m ? m[1].trim() : null;
}

/** Première citation en bloc, aplatie. Elle sert d'accroche. */
export function accrocheDe(corps) {
  const lignes = corps.split(/\r?\n/);
  const bloc = [];
  for (const l of lignes) {
    if (l.startsWith('>')) bloc.push(l.replace(/^>\s?/, '').trim());
    else if (bloc.length) break;
  }
  const t = bloc.join(' ').replace(/\s+/g, ' ').replace(/\*\*/g, '').trim();
  return t || null;
}

/** La réponse du livrable : la phrase qui suit « En une phrase. », aplatie. C'est le titre
 *  d'action de sa planche — une planche dit ce qu'il faut retenir, pas de quoi elle parle. */
export function phraseDe(corps) {
  const m = /\*\*En une phrase\.\*\*[ \t]*([\s\S]*?)(?:\r?\n\s*\r?\n|$)/.exec(corps);
  const t = m ? propre(m[1].replace(/\s+/g, ' ')) : '';
  return t || null;
}

/** Les puces de « L'essentiel », aplaties, quatre au plus. */
export function essentielDe(corps) {
  const m = /^###\s+L'essentiel\s*$([\s\S]*?)(?=^#{1,3}\s|^---\s*$)/m.exec(corps);
  if (!m) return [];
  const puces = [];
  for (const l of m[1].split(/\r?\n/)) {
    if (/^\s*[-*]\s+/.test(l)) puces.push(l.replace(/^\s*[-*]\s+/, ''));
    else if (puces.length && /^\s+\S/.test(l)) puces[puces.length - 1] += ' ' + l.trim();
  }
  return puces.map(p => propre(p.replace(/\s+/g, ' '))).filter(Boolean).slice(0, 4);
}

const SECTIONS_DE_STANDARD = new Set(["Ce qui reste à vérifier", "Repères de méthode", "Sources"]);
/** La synthèse d'un fichier rédigé au standard : ses sections « clé — réponse », une ligne
 *  chacune. Un fichier à fiches se résume par ses fiches ; c'est son meilleur tableau. */
export function syntheseDe(corps, maxLignes = 10) {
  const lignes = [];
  for (const m of corps.matchAll(/^##\s+(.+?)\s+—\s+(.+)$/gm)) {
    if (SECTIONS_DE_STANDARD.has(m[1].trim())) continue;
    lignes.push([propre(m[1]), propre(m[2])]);
  }
  const fiches = lignes.filter(l => /^[A-Z]{2,4}-[\w.]+$/.test(l[0])).length;
  if (fiches < 2 && lignes.length < 4) return null;
  return { entetes: ['', 'Ce qui est établi'], lignes: lignes.slice(0, maxLignes), tronque: lignes.length > maxLignes };
}

/** Premier tableau markdown, en-têtes et lignes. C'est l'exhibit. */
export function tableauDe(corps, maxLignes = 6, maxCols = 5) {
  const lignes = corps.split(/\r?\n/);
  for (let i = 0; i < lignes.length - 1; i++) {
    if (!/^\s*\|/.test(lignes[i])) continue;
    if (!/^\s*\|[\s:|-]+\|\s*$/.test(lignes[i + 1])) continue;
    const cellules = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => propre(c));
    const entetes = cellules(lignes[i]).slice(0, maxCols);
    if (!entetes.some(Boolean)) continue;   /* une table de fiche (en-têtes vides) n'est pas un exhibit */
    const corpsT = [];
    for (let j = i + 2; j < lignes.length && /^\s*\|/.test(lignes[j]); j++) {
      const r = cellules(lignes[j]).slice(0, maxCols);
      if (r.some(c => c)) corpsT.push(r);
      if (corpsT.length >= maxLignes) break;
    }
    /* Un tableau de tirets est un registre vide : il ne fait pas un exhibit. */
    if (!corpsT.length || corpsT.every(r => r.filter(c => !c || /^[—–-]$/.test(c)).length * 2 >= r.length)) continue;
    return { entetes, lignes: corpsT, tronque: corpsT.length >= maxLignes };
  }
  return null;
}

/** Retire le balisage inline : une planche n'affiche pas d'astérisques. */
function propre(s) {
  return String(s)
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_]/g, '')
    .trim();
}

function fichiersDe(base, motif) {
  if (motif.endsWith('/')) {
    const dir = join(base, motif);
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter(f => statSync(join(dir, f)).isFile())
      .map(f => motif + f);
  }
  return existsSync(join(base, motif)) ? [motif] : [];
}

/** État d'un livrable : ses fichiers présents, leur complétude, leurs réserves. */
export function etatLivrable(projet, wp) {
  const base = join(projet, 'product', wp.base || '');
  const presents = [];
  for (const motif of wp.files || []) {
    for (const rel of fichiersDe(base, motif)) {
      if (!rel.endsWith('.md') && !rel.endsWith('.yaml')) continue;
      const abs = join(base, rel);
      const { tete, corps } = decoupe(readFileSync(abs, 'utf8'));
      /* Le format de présentation se lit dans le front-matter, se contrôle et se calcule
         ici : le rendu reçoit des nombres vérifiés, jamais des données à interpréter. */
      const exhibits = [].concat(tete.exhibits || []).map(e => evaluer(e, { wp: wp.id, file: motif }));
      const attendus = formatsPortesPar(wp.id, motif).filter(f => !exhibits.some(e => e.format === f.id));
      presents.push({
        chemin: 'product/' + (wp.base || '') + rel,
        exhibits,
        formats_manquants: attendus.map(f => ({ id: f.id, nom: f.nom })),
        completion: tete.completion || 'inconnu',
        reserves: Array.isArray(tete.reserves) ? tete.reserves : [],
        titre: titreDe(corps),
        accroche: accrocheDe(corps),
        phrase: phraseDe(corps),
        essentiel: essentielDe(corps),
        tableau: syntheseDe(corps) || tableauDe(corps),
      });
    }
  }
  /* « Sans objet » est un état de la MÉTHODE, pas du fichier : il vient d'une condition du
     registre déclarée ou détectée pour le projet, avec le fait qui la tranche. Un livrable
     hors portée qui porte quand même des fichiers est lu comme tel — la dispense s'arrête
     à la première ligne écrite. */
  const portee = applies(projet, wp.id);
  const etats = presents.map(f => f.completion);
  const etat = !presents.length ? (portee.applies ? 'absent' : 'sans_objet')
    : etats.every(e => e === 'complet') ? 'complet' : 'partiel';
  return { id: wp.id, nom: wp.name, etape: wp.step, base: wp.base, etat, fichiers: presents,
           ...(portee.applies ? {} : { condition: portee.condition, fait: portee.reason }) };
}

/** Le modèle du pack. Une cadence, ses étapes, ses livrables, ses planches. */
export function packModel(projet, cadence = 'C1') {
  const r = registry();
  const cad = (r.cadences || []).find(c => c.id === cadence);
  if (!cad) throw new Error('cadence inconnue : ' + cadence);
  const nomEtape = id => (r.steps || []).find(s => s.id === id)?.name || id;

  const sections = cad.steps.map(sid => {
    const wps = r.work_products.filter(w => w.step === sid).map(w => etatLivrable(projet, w));
    return { etape: sid, nom: nomEtape(sid), livrables: wps };
  });

  /* Un livrable sans objet n'est ni produit ni manquant : il sort du dénominateur, et son
     nombre se dit à part — le compter « produit » flatterait l'état, le compter « absent »
     exigerait un remplissage. */
  const fait = w => w.etat === 'partiel' || w.etat === 'complet';
  const dus = l => l.filter(w => w.etat !== 'sans_objet');
  const tous = sections.flatMap(s => s.livrables);
  const produits = tous.filter(fait);
  const sansObjet = tous.filter(w => w.etat === 'sans_objet');
  let produit = null;
  try {
    const f = join(projet, 'product', cheminDe('SOC-01', 'project.yaml'));
    /* project.yaml peut porter un front-matter de livrable : l'identité est dans le corps. */
    if (existsSync(f)) produit = (yaml.load(decoupe(readFileSync(f, 'utf8')).corps) || {}).name || null;
  } catch { produit = null; }
  const planches = [{ type: 'couverture', cadence, nom: cad.name, produit }];
  planches.push({
    type: 'etat', cadence,
    total: dus(tous).length, produits: produits.length, sans_objet: sansObjet.length,
    lignes: sections.map(s => ({
      etape: s.etape, nom: s.nom,
      total: dus(s.livrables).length,
      produits: s.livrables.filter(fait).length,
      sans_objet: s.livrables.length - dus(s.livrables).length,
    })),
  });
  const defauts = [], manquants = [];
  for (const s of sections) {
    planches.push({ type: 'etape', etape: s.etape, nom: s.nom, livrables: s.livrables.map(w => ({
      id: w.id, nom: w.nom, etat: w.etat,
      formats: formatsDuLivrable(w.id).map(f => f.nom) })) });
    for (const w of s.livrables) {
      for (const f of w.fichiers) {
        /* Un format vérifié devient une planche. Un format en défaut n'en devient PAS une :
           on ne montre pas au client un chiffre que la machine dément. Le défaut est nommé. */
        const bons = f.exhibits.filter(e => e.ok);
        for (const e of bons) planches.push({
          type: 'format', format: e.format, nom_format: e.nom, reference: e.reference, question: e.question,
          wp: w.id, etape: s.etape, chemin: f.chemin, titre: e.titre, source: e.source,
          completion: f.completion, donnees: e.donnees, calcul: e.calcul, constats: e.constats });
        for (const e of f.exhibits.filter(x => !x.ok))
          defauts.push({ wp: w.id, chemin: f.chemin, format: e.nom || e.format, defauts: e.defauts });
        for (const m of f.formats_manquants)
          manquants.push({ wp: w.id, chemin: f.chemin, format: m.nom });
        if (bons.length) continue;  // la planche de format remplace le tableau générique
        if (!f.tableau) continue;   // sans exhibit, pas de planche : on ne meuble pas
        planches.push({
          type: 'exhibit', wp: w.id, etape: s.etape, chemin: f.chemin,
          titre: f.titre || w.nom, accroche: f.accroche, phrase: f.phrase, essentiel: f.essentiel,
          completion: f.completion, tableau: f.tableau,
        });
      }
    }
  }
  /* Une réserve répétée dans chaque fichier d'un livrable est UNE réserve : la compter six
     fois gonflerait l'inquiétude sans rien dire de plus. */
  const vues = new Set();
  const reserves = tous.flatMap(w => w.fichiers.flatMap(f => f.reserves.map(t => ({ wp: w.id, chemin: f.chemin, texte: t }))))
    .filter(r => { const k = r.wp + '\u0000' + r.texte; if (vues.has(k)) return false; vues.add(k); return true; });
  const constats = planches.filter(p => p.type === 'format').flatMap(p => p.constats.map(t => ({ wp: p.wp, format: p.nom_format, texte: t })));
  if (reserves.length) planches.push({ type: 'reserves', reserves });
  return { cadence, nom: cad.name, produit, sections, planches, defauts, manquants, constats,
           compte: { total: dus(tous).length, produits: produits.length, sans_objet: sansObjet.length, reserves: reserves.length,
                     formats: planches.filter(p => p.type === 'format').length, defauts: defauts.length } };
}

/** Les formats de présentation que le gabarit assigne à un livrable, tous fichiers confondus. */
function formatsDuLivrable(wpId) {
  const w = (registry().work_products || []).find(x => x.id === wpId);
  return (w?.files || []).flatMap(f => formatsPortesPar(wpId, f));
}

export default { packModel, etatLivrable, decoupe, titreDe, accrocheDe, tableauDe };
