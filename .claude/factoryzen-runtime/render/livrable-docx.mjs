/* Un livrable réel en Word — dans la charte des gabarits.
 *
 * Le document reprend le Markdown du dépôt tel qu'il est écrit : ouverture, sections
 * « clé — réponse », tableaux et fiches, ce qui reste à vérifier, réserves, repères. Les
 * formats de présentation y sont résumés par leur titre et leurs constats calculés ; leur
 * planche dessinée vit dans le pack. Aucun texte n'est ajouté ni réécrit. */

import { docx } from '../lib/office.mjs';
import { recompresser } from './zip-office.mjs';
import { redaction } from '../lib/templates.mjs';
import { ENCRE, AMBRE, AMBRE_T, OS, MUET, TRAIT, TXT_C } from './palette.mjs';

const CORPS = 'Calibri', DISP = 'Arial', MONO = 'Consolas';
const LARG = 9638;

export function rendreLivrableDocx(m) {
  const { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
          HeadingLevel, AlignmentType, LevelFormat, PageBreak, Footer, Header, PageNumber, TableLayoutType } = docx;
  const R = redaction() || {}, O = R.ouverture || {}, C = R.cloture || {};

  const runs = (texte, o = {}) => {
    const out = [], s = String(texte ?? ''), re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)]+\))/g;
    let k = 0, x;
    while ((x = re.exec(s))) {
      if (x.index > k) out.push(new TextRun({ text: s.slice(k, x.index), ...o }));
      const t = x[0];
      if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), ...o, bold: true }));
      else if (t.startsWith('`')) out.push(new TextRun({ text: t.slice(1, -1), ...o, font: MONO }));
      else if (t.startsWith('[')) out.push(new TextRun({ text: t.replace(/^\[([^\]]+)\].*$/, '$1'), ...o, underline: {} }));
      else out.push(new TextRun({ text: t.slice(1, -1), ...o, italics: true }));
      k = x.index + t.length;
    }
    if (k < s.length) out.push(new TextRun({ text: s.slice(k), ...o }));
    return out;
  };
  const para = (t, o = {}, p = {}) => new Paragraph({ children: runs(t, o), spacing: { after: 120 }, ...p });
  const puce = (t, o = {}) => new Paragraph({ children: runs(t, o), numbering: { reference: 'puces', level: 0 }, spacing: { after: 60 } });
  const bord = { style: BorderStyle.SINGLE, size: 4, color: TRAIT }, nul = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const cellule = (enfants, w, o = {}) => new TableCell({ children: enfants, width: { size: w, type: WidthType.DXA },
    margins: { top: 70, bottom: 70, left: 110, right: 110 }, borders: { top: nul, left: nul, right: nul, bottom: bord }, ...o });

  const tableau = lignes => {
    const cel = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    const tete = cel(lignes[0]), corps = lignes.slice(2).map(cel);
    const avecTete = tete.some(Boolean), rangs = avecTete ? [tete, ...corps] : corps;
    const n = Math.max(...rangs.map(r => r.length));
    const poids = Array.from({ length: n }, (_, j) => Math.max(!avecTete && j === 0 ? 18 : 8, ...rangs.map(r => Math.min(70, (r[j] || '').length))));
    const somme = poids.reduce((a, b) => a + b, 0);
    const larg = poids.map(p => Math.floor(LARG * p / somme));
    larg[n - 1] += LARG - larg.reduce((a, b) => a + b, 0);
    return new Table({ width: { size: LARG, type: WidthType.DXA }, columnWidths: larg, layout: TableLayoutType.FIXED,
      rows: rangs.map((r, i) => new TableRow({ children: larg.map((w, j) => cellule(
        [new Paragraph({ children: runs(r[j] || '', { size: 19, bold: (avecTete && i === 0) || (!avecTete && j === 0) || undefined }) })], w,
        { shading: avecTete && i === 0 ? { type: ShadingType.CLEAR, fill: OS, color: 'auto' } : undefined })) })) });
  };
  const encadre = (libelle, enfants, fond) => new Table({ width: { size: LARG, type: WidthType.DXA }, columnWidths: [LARG], layout: TableLayoutType.FIXED,
    rows: [new TableRow({ children: [cellule([
      new Paragraph({ children: [new TextRun({ text: libelle.toUpperCase(), bold: true, size: 15, color: AMBRE, font: DISP, characterSpacing: 20 })], spacing: { after: 60 } }),
      ...enfants], LARG, { shading: { type: ShadingType.CLEAR, fill: fond, color: 'auto' }, borders: { top: nul, bottom: nul, left: nul, right: nul } })] })] });
  const vide = () => new Paragraph({ spacing: { after: 120 }, children: [] });

  /** Le Markdown d'une section, bloc par bloc. */
  const blocs = md => {
    const out = [], L = String(md || '').split(/\r?\n/);
    for (let i = 0; i < L.length; i++) {
      const l = L[i];
      if (/^```/.test(l)) {
        while (++i < L.length && !/^```/.test(L[i])) out.push(new Paragraph({ children: [new TextRun({ text: L[i] || ' ', font: MONO, size: 17 })], spacing: { after: 0 } }));
        continue;
      }
      if (/^\s*\|/.test(l) && /^\s*\|[\s:|-]+\|\s*$/.test(L[i + 1] || '')) {
        const t = [l];
        while (i + 1 < L.length && /^\s*\|/.test(L[i + 1])) t.push(L[++i]);
        out.push(tableau(t), vide());
        continue;
      }
      const h = /^(#{3,6})\s+(.+)$/.exec(l);
      if (h) { out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: runs(h[2]), keepNext: true })); continue; }
      if (/^\s*[-*]\s+/.test(l)) { out.push(puce(l.replace(/^\s*[-*]\s+/, ''))); continue; }
      if (/^\s*\d+\.\s+/.test(l)) { out.push(puce(l.replace(/^\s*\d+\.\s+/, ''))); continue; }
      if (/^\s*>\s?/.test(l)) {
        const q = [l.replace(/^\s*>\s?/, '')];
        while (i + 1 < L.length && /^\s*>/.test(L[i + 1])) q.push(L[++i].replace(/^\s*>\s?/, ''));
        out.push(encadre('À retenir', q.filter(x => x.trim()).map(x => para(x, { size: 20 }, { spacing: { after: 40 } })), AMBRE_T), vide());
        continue;
      }
      if (/^\s*---\s*$/.test(l) || !l.trim()) continue;
      const p = [l];
      while (i + 1 < L.length && L[i + 1].trim() && !/^(\s*[-*|>]|\s*\d+\.|#{1,6}\s|```|\s*---\s*$)/.test(L[i + 1])) p.push(L[++i]);
      out.push(para(p.join(' ')));
    }
    return out;
  };

  const enfants = [
    new Paragraph({ children: [new TextRun({ text: `${m.produit ? m.produit + '  ·  ' : ''}${m.etape}  ·  ${m.nom_etape}`.toUpperCase(), bold: true, size: 16, color: AMBRE, font: DISP, characterSpacing: 30 })], spacing: { after: 240 } }),
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: m.nom })] }),
    tableau(['| | |', '|---|---|',
      `| **État** | ${m.completion === 'complet' ? 'Complet' : 'Partiel — réserves déclarées'} |`,
      `| **Qui le rédige, qui en répond** | ${m.responsable} |`,
      `| **Contrôlé en** | ${m.controle} |`,
      `| **Fichiers du dépôt** | ${m.parts.map(f => f.chemin).join(' · ')} |`]),
    vide(),
    para('Document calculé depuis le Markdown du dépôt, qui reste la version contrôlée. Le modifier ici ne change pas le livrable : corriger le fichier source, puis régénérer.', { size: 17, color: MUET, italics: true }),
  ];

  m.parts.forEach((f, k) => {
    if (k > 0 || m.parts.length > 1) enfants.push(new Paragraph({ children: [new PageBreak()] }));
    enfants.push(new Paragraph({ children: [new TextRun({ text: `FICHIER  ·  ${f.chemin}`, bold: true, size: 15, color: MUET, font: DISP, characterSpacing: 20 })], spacing: { after: 160 } }));
    enfants.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: runs(f.titre) }));
    if (f.phrase) enfants.push(para(`**${O.phrase || 'En une phrase.'}** ${f.phrase}`, { size: 23 }, { spacing: { after: 200 } }));
    if (f.essentiel.length) {
      enfants.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: runs(O.essentiel || "L'essentiel"), keepNext: true }));
      f.essentiel.forEach(e => enfants.push(puce(e)));
      enfants.push(vide());
    }
    for (const fm of f.formats) {
      enfants.push(encadre(`Format de présentation — ${fm.nom_format}`, [
        para(`**${fm.titre}**`, { size: 20 }),
        ...[].concat(fm.constats || []).map(c => puce(c, { size: 19 })),
        para('La planche dessinée et vérifiée par le calcul est dans le pack PowerPoint.', { size: 17, color: MUET, italics: true }),
      ], OS), vide());
    }
    for (const s of f.sections) {
      enfants.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: runs(s.titre), keepNext: true }));
      enfants.push(...blocs(s.md));
    }
    if (f.verifier || f.reserves.length) {
      enfants.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: runs(C.verifier || 'Ce qui reste à vérifier'), keepNext: true }));
      enfants.push(...blocs(f.verifier));
      if (f.reserves.length) enfants.push(encadre('Réserves déclarées', f.reserves.map(r => puce(r, { size: 19 })), AMBRE_T), vide());
    }
    if (f.reperes) {
      enfants.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: runs(C.reperes || 'Repères de méthode'), keepNext: true }));
      enfants.push(...blocs(f.reperes).map(b => b));
    }
  });

  return new Document({
    creator: 'Autonomous Product Factory', title: `${m.produit ? m.produit + ' — ' : ''}${m.nom}`,
    styles: {
      default: { document: { run: { font: CORPS, size: 21, color: ENCRE } } },
      paragraphStyles: [
        { id: 'Title', name: 'Title', basedOn: 'Normal', run: { font: DISP, size: 44, bold: true, color: ENCRE }, paragraph: { spacing: { after: 240 } } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: DISP, size: 32, bold: true, color: ENCRE }, paragraph: { spacing: { before: 120, after: 200 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: DISP, size: 25, bold: true, color: ENCRE }, paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: DISP, size: 21, bold: true, color: AMBRE }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
      ],
    },
    numbering: { config: [{ reference: 'puces', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }] }] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${m.etape} · ${m.nom}`, size: 15, color: MUET, font: DISP })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Projection du dépôt · page ', size: 15, color: MUET }), new TextRun({ children: [PageNumber.CURRENT], size: 15, color: MUET })] })] }) },
      children: enfants,
    }],
  });
}

export async function livrableDocxBuffer(m) {
  return recompresser(await docx.Packer.toBuffer(rendreLivrableDocx(m)));
}
