/* Gabarit d'un livrable en Word — pour les livrables qui se consultent et font référence.
 *
 * Le document se remplit tel quel : les crochets marquent ce qui reste à écrire, chaque
 * section porte sa consigne et l'exemple filé (ChantierClair) dans des encadrés à supprimer
 * avant diffusion. La structure est celle du standard de rédaction, lue dans le même
 * modèle que la version PowerPoint (lib/gabarit-office.mjs). */

import { docx } from '../lib/office.mjs';
import { recompresser } from './zip-office.mjs';
import { ENCRE, AMBRE, AMBRE_T, OS, MUET, TRAIT, TXT_C } from './palette.mjs';


/* ── charte, alignée sur le pack ─────────────────────────────────────── */
const CORPS = 'Calibri', DISP = 'Arial', MONO = 'Consolas';
const LARG = 9638;   /* A4, marges de 2 cm : 11906 − 2 × 1134 */
const INTERIEUR = LARG - 300;   /* un tableau dans un encadré : la largeur moins ses marges */

/* ── les mentions fixes, par langue (le modèle dit la sienne : g.lang) ── */
const MOTS = {
  fr: {
    gabarit: 'GABARIT', fichier: 'FICHIER', qui: 'Qui le rédige, qui en répond', controle: 'Contrôlé en',
    fichiers: 'Fichiers du dépôt', complet: 'Il est complet quand',
    source: 'Le Markdown du dépôt reste la version que la machine contrôle ; ce document en est la forme de travail.',
    titre: '[Titre : le sujet, dit comme le client le dirait]', phrase: '[la réponse du livrable, en une phrase]',
    collection: f => `Collection ${f} — un fichier par entité`, machine: f => `Fichier machine ${f} — ce que chaque section doit prouver`,
    enonce: '[énoncé]', sep: ' : ', regle: 'Règle', uneFiche: 'Une fiche par entrée : copier ce bloc autant de fois que nécessaire.',
    reponse: '[votre réponse en une ligne]', formats: 'Formats de présentation',
    question: '**La question à laquelle il répond.**', reference: '**Référence.**',
    exhibits: f => `Les données de ce format se portent dans la clé « exhibits » du front-matter de ${f}. La planche est dessinée et vérifiée par le calcul lors de « apf pack » : un chiffre que le calcul dément n'est pas montré.`,
    titreDoc: n => `Gabarit — ${n}`, pied: 'Gabarit Autonomous Product Factory · page ',
  },
  en: {
    gabarit: 'TEMPLATE', fichier: 'FILE', qui: 'Who writes it, who answers for it', controle: 'Controlled at',
    fichiers: 'Repository files', complet: 'It is complete when',
    source: 'The Markdown in the repository remains the version the machine checks; this document is its working form.',
    titre: '[Title: the subject, put the way the client would put it]', phrase: "[the work product's answer, in one sentence]",
    collection: f => `Collection ${f} — one file per entity`, machine: f => `Machine file ${f} — what each section must prove`,
    enonce: '[statement]', sep: ': ', regle: 'Rule', uneFiche: 'One sheet per entry: copy this block as many times as needed.',
    reponse: '[your answer in one line]', formats: 'Presentation formats',
    question: '**The question it answers.**', reference: '**Reference.**',
    exhibits: f => `The data for this format goes under the "exhibits" key of the front-matter of ${f}. The slide is drawn and checked by computation during "apf pack": a figure the computation contradicts is not shown.`,
    titreDoc: n => `Template — ${n}`, pied: 'Autonomous Product Factory template · page ',
  },
};

export function rendreGabaritDocx(g) {
  const d = docx;
  const { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
          HeadingLevel, AlignmentType, LevelFormat, PageBreak, Footer, Header, PageNumber, TableLayoutType } = d;
  const L = g.libelles, T = MOTS[g.lang] || MOTS.fr;

  /* ── texte ──────────────────────────────────────────────────────────── */
  /** Gras, italique et code en ligne : le balisage des exemples devient de la mise en forme. */
  const runs = (texte, o = {}) => {
    const out = [];
    const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
    let k = 0, m;
    const s = String(texte);
    while ((m = re.exec(s))) {
      if (m.index > k) out.push(new TextRun({ text: s.slice(k, m.index), ...o }));
      const t = m[0];
      if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), ...o, bold: true }));
      else if (t.startsWith('`')) out.push(new TextRun({ text: t.slice(1, -1), ...o, font: MONO }));
      else out.push(new TextRun({ text: t.slice(1, -1), ...o, italics: true }));
      k = m.index + t.length;
    }
    if (k < s.length) out.push(new TextRun({ text: s.slice(k), ...o }));
    return out;
  };
  const para = (texte, o = {}, p = {}) => new Paragraph({ children: runs(texte, o), spacing: { after: 120 }, ...p });
  const aEcrire = t => new Paragraph({ children: [new TextRun({ text: `[${t}]`, color: AMBRE })], spacing: { after: 160 } });
  const puce = (texte, o = {}) => new Paragraph({ children: runs(texte, o), numbering: { reference: 'puces', level: 0 }, spacing: { after: 60 } });

  const bordure = { style: BorderStyle.SINGLE, size: 4, color: TRAIT };
  const sansBord = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const cellule = (enfants, w, o = {}) => new TableCell({
    children: enfants, width: { size: w, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 }, ...o });

  /** Tableau Markdown → tableau Word. Une première ligne d'en-têtes vides (fiche) n'est pas rendue. */
  const tableauMd = (lignes, o = {}) => {
    const T = o.largeur || LARG;
    const cel = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    const tete = cel(lignes[0]), corps = lignes.slice(2).map(cel);
    const rangs = tete.some(Boolean) ? [tete, ...corps] : corps;
    const n = Math.max(...rangs.map(r => r.length));
    const poids = Array.from({ length: n }, (_, j) => Math.max(8, ...rangs.map(r => Math.min(70, (r[j] || '').length))));
    const somme = poids.reduce((a, b) => a + b, 0);
    const larg = poids.map(p => Math.floor(T * p / somme));
    larg[n - 1] += T - larg.reduce((a, b) => a + b, 0);
    return new Table({
      width: { size: T, type: WidthType.DXA }, columnWidths: larg, layout: TableLayoutType.FIXED,
      rows: rangs.map((r, i) => new TableRow({ children: larg.map((w, j) => cellule(
        [new Paragraph({ children: runs(r[j] || '', { size: 18, ...(o.couleur ? { color: o.couleur } : {}), bold: (tete.some(Boolean) && i === 0) || undefined }) })], w,
        { borders: { top: sansBord, left: sansBord, right: sansBord, bottom: bordure },
          shading: tete.some(Boolean) && i === 0 ? { type: ShadingType.CLEAR, fill: OS, color: 'auto' } : undefined })) })),
    });
  };

  /** Un exemple en Markdown — paragraphes, puces, tableaux, blocs de code — en blocs Word. */
  const blocsMd = (md, o = {}) => {
    const out = [], lignes = String(md || '').split(/\r?\n/);
    for (let i = 0; i < lignes.length; i++) {
      const l = lignes[i];
      if (/^```/.test(l)) {
        const code = [];
        while (++i < lignes.length && !/^```/.test(lignes[i])) code.push(lignes[i]);
        code.forEach(c => out.push(new Paragraph({ children: [new TextRun({ text: c || ' ', font: MONO, size: 17, ...o })], spacing: { after: 0 } })));
        continue;
      }
      if (/^\s*\|/.test(l) && /^\s*\|[\s:|-]+\|\s*$/.test(lignes[i + 1] || '')) {
        const t = [l];
        while (i + 1 < lignes.length && /^\s*\|/.test(lignes[i + 1])) t.push(lignes[++i]);
        out.push(tableauMd(t, { couleur: o.color, largeur: INTERIEUR }), new Paragraph({ spacing: { after: 60 }, children: [] }));
        continue;
      }
      if (/^\s*[-*]\s+/.test(l)) { out.push(puce(l.replace(/^\s*[-*]\s+/, ''), { size: 19, ...o })); continue; }
      if (/^\s*>\s?/.test(l)) { out.push(para(l.replace(/^\s*>\s?/, ''), { italics: true, size: 19, ...o })); continue; }
      if (!l.trim()) continue;
      /* une ligne indentée de YAML ou de liste se garde telle quelle */
      if (/^\s{2,}\S/.test(l) || /^[\w-]+:\s/.test(l)) { out.push(new Paragraph({ children: [new TextRun({ text: l, font: MONO, size: 17, ...o })], spacing: { after: 0 } })); continue; }
      out.push(para(l, { size: 19, ...o }));
    }
    return out;
  };

  /** Encadré à supprimer avant diffusion : la consigne, puis l'exemple filé. */
  const encadre = (libelle, enfants, fond) => new Table({
    width: { size: LARG, type: WidthType.DXA }, columnWidths: [LARG], layout: TableLayoutType.FIXED,
    rows: [new TableRow({ children: [cellule([
      new Paragraph({ children: [new TextRun({ text: libelle.toUpperCase(), bold: true, size: 15, color: AMBRE, font: DISP, characterSpacing: 20 })], spacing: { after: 60 } }),
      ...enfants], LARG, { shading: { type: ShadingType.CLEAR, fill: fond, color: 'auto' },
        borders: { top: sansBord, bottom: sansBord, left: sansBord, right: sansBord } })] })],
  });
  const espace = () => new Paragraph({ spacing: { after: 120 }, children: [] });
  const consigne = (...textes) => {
    const t = textes.filter(Boolean);
    return t.length ? [encadre(L.consigne_visible || 'Consigne', t.map(x => para(x, { size: 18, color: TXT_C }, { spacing: { after: 40 } })), AMBRE_T), espace()] : [];
  };
  const exemple = enfants => enfants.length ? [encadre(L.exemple_visible || 'Exemple', enfants, OS), espace()] : [];

  /** Une fiche : identifiant et énoncé en titre, champs en tableau à libellés gras. */
  const tableFiche = (champs, valeur, T = LARG) => {
    const w1 = 3000, w2 = T - w1;
    return new Table({
      width: { size: T, type: WidthType.DXA }, columnWidths: [w1, w2], layout: TableLayoutType.FIXED,
      rows: champs.map(c => new TableRow({ children: [
        cellule([new Paragraph({ children: [new TextRun({ text: c.titre, bold: true, size: 19 })] })], w1, { borders: { top: sansBord, left: sansBord, right: sansBord, bottom: bordure } }),
        cellule([new Paragraph({ children: runs(valeur(c), { size: 19, ...(valeur === aRemplir ? { color: AMBRE } : {}) }) })], w2, { borders: { top: sansBord, left: sansBord, right: sansBord, bottom: bordure } }),
      ] })),
    });
  };
  const aRemplir = () => '[…]';

  /* ── corps ──────────────────────────────────────────────────────────── */
  const enfants = [];
  const h = (texte, niveau) => new Paragraph({ heading: niveau, children: runs(texte), keepNext: true });

  /* page de garde : ce qu'est ce gabarit, et comment s'en servir */
  enfants.push(
    new Paragraph({ children: [new TextRun({ text: `${T.gabarit}  ·  ${g.etape}  ·  ${g.nom_etape}`.toUpperCase(), bold: true, size: 16, color: AMBRE, font: DISP, characterSpacing: 30 })], spacing: { after: 240 } }),
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: g.nom })] }),
    para(g.objet, { size: 22, color: TXT_C }, { spacing: { after: 360 } }),
  );
  enfants.push(tableauMd([
    '| | |', '|---|---|',
    `| **${T.qui}** | ${g.responsable} |`,
    `| **${T.controle}** | ${g.controle} |`,
    `| **${T.fichiers}** | ${g.fichiers.map(f => f.chemin).join(' · ')} |`,
    ...(g.completude ? [`| **${T.complet}** | ${String(g.completude).replace(/\s+/g, ' ')} |`] : []),
  ]), espace());
  enfants.push(...consigne(L.a_supprimer, T.source));

  for (const f of g.fichiers) {
    enfants.push(new Paragraph({ children: [new PageBreak()] }));
    enfants.push(new Paragraph({ children: [new TextRun({ text: `${T.fichier}  ·  ${f.chemin}`, bold: true, size: 15, color: MUET, font: DISP, characterSpacing: 20 })], spacing: { after: 200 } }));

    if (f.nature === 'redige') {
      const o = f.ouverture;
      enfants.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: T.titre, color: AMBRE })] }));
      enfants.push(new Paragraph({ children: [new TextRun({ text: L.phrase + ' ', bold: true }), new TextRun({ text: T.phrase, color: AMBRE })], spacing: { after: 160 } }));
      enfants.push(...consigne(L.phrase_guide), ...exemple(o.phrase ? [para(`**${L.phrase}** ${o.phrase}`, { size: 19 })] : []));
      enfants.push(h(L.essentiel, HeadingLevel.HEADING_3));
      ['[…]', '[…]', '[…]'].forEach(t => enfants.push(new Paragraph({ children: [new TextRun({ text: t, color: AMBRE })], numbering: { reference: 'puces', level: 0 } })));
      enfants.push(espace(), ...consigne(L.essentiel_guide), ...exemple(o.essentiel.map(e => puce(e, { size: 19 }))));
    } else {
      enfants.push(h(f.nature === 'collection' ? T.collection(f.file) : f.nature === 'machine' ? T.machine(f.file) : f.file, HeadingLevel.HEADING_1));
    }

    for (const b of f.blocs) {
      if (b.type === 'fiche') {
        const pre = (/^([A-Z]{2,4}-(?:nn(?:\.n)?|nom|name|vX\.Y))/.exec(b.titre) || [b.titre])[0].replace(/-nn\b/, '-01');
        enfants.push(h(`${pre}${L.tiret}${T.enonce}`, HeadingLevel.HEADING_2));
        enfants.push(aEcrire('…'));
        if (b.champs.length) enfants.push(tableFiche(b.champs, aRemplir), espace());
        enfants.push(...consigne(b.guide, b.regle && `${T.regle}${T.sep}${b.regle}`, ...b.champs.map(c => `${c.titre}${T.sep}${c.guide}`)));
        const ex = [para(`**${b.id_exemple}${L.tiret}${b.reponse}**`, { size: 19 }), ...blocsMd(b.exemple)];
        if (b.champs.length) ex.push(tableFiche(b.champs, c => c.exemple || '—', INTERIEUR));
        enfants.push(...exemple(b.exemple || b.reponse ? ex : []));
        enfants.push(new Paragraph({ children: [new TextRun({ text: T.uneFiche, italics: true, size: 17, color: MUET })], spacing: { after: 200 } }));
      } else {
        const titre = f.nature === 'redige' ? `${b.titre}${L.tiret}${T.reponse}` : b.titre;
        enfants.push(h(titre, HeadingLevel.HEADING_2));
        enfants.push(aEcrire('…'));
        enfants.push(...consigne(b.guide, b.regle && `${T.regle}${T.sep}${b.regle}`));
        const ex = [];
        if (f.nature === 'redige' && b.reponse) ex.push(para(`**${b.titre}${L.tiret}${b.reponse}**`, { size: 19 }));
        ex.push(...blocsMd(f.nature === 'machine' && b.exemple && !/^```/.test(b.exemple) ? '```\n' + b.exemple + '\n```' : b.exemple));
        enfants.push(...exemple(ex.length ? ex : []));
      }
    }

    if (f.nature === 'redige') {
      enfants.push(h(L.verifier, HeadingLevel.HEADING_2), aEcrire('…'));
      enfants.push(...consigne(L.verifier_guide), ...exemple(f.ouverture.verifier ? [para(f.ouverture.verifier, { size: 19 })] : []));
      enfants.push(h(L.reperes, HeadingLevel.HEADING_2), para(g.reperes, { size: 19, color: MUET }));
    }
  }

  /* formats de présentation : décrits ici, dessinés par le pack */
  const fmts = g.formats;
  if (fmts.length) {
    enfants.push(new Paragraph({ children: [new PageBreak()] }), h(T.formats, HeadingLevel.HEADING_1));
    for (const f of fmts) {
      enfants.push(h(f.nom, HeadingLevel.HEADING_2), para(`${T.question} ${f.question}`, { size: 19 }),
        para(`${T.reference} ${f.reference}`, { size: 19 }),
        ...consigne(T.exhibits(f.file)));
    }
  }

  const doc = new Document({
    creator: 'Autonomous Product Factory', title: T.titreDoc(g.nom), description: g.objet,
    styles: {
      default: { document: { run: { font: CORPS, size: 21, color: ENCRE } } },
      paragraphStyles: [
        { id: 'Title', name: 'Title', basedOn: 'Normal', run: { font: DISP, size: 44, bold: true, color: ENCRE }, paragraph: { spacing: { after: 200 } } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: DISP, size: 32, bold: true, color: ENCRE }, paragraph: { spacing: { before: 120, after: 200 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: DISP, size: 25, bold: true, color: ENCRE }, paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: DISP, size: 21, bold: true, color: AMBRE }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
      ],
    },
    numbering: { config: [{ reference: 'puces', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }] }] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${g.etape} · ${g.nom}`, size: 15, color: MUET, font: DISP })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: T.pied, size: 15, color: MUET }), new TextRun({ children: [PageNumber.CURRENT], size: 15, color: MUET })] })] }) },
      children: enfants,
    }],
  });
  return { doc, Packer: d.Packer };
}

/** Le gabarit Word en mémoire. */
export async function gabaritDocxBuffer(g) {
  const { doc, Packer } = rendreGabaritDocx(g);
  return recompresser(await Packer.toBuffer(doc));
}
