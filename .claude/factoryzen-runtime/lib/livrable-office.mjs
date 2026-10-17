/* LE LIVRABLE EN FICHIER OFFICE — le contenu réel d'un projet, dans le format que son
 * gabarit déclare (PowerPoint ou Word).
 *
 * Le Markdown du dépôt reste la version que la machine contrôle. Le lecteur, lui, ouvre le
 * fichier Office : il est CALCULÉ depuis le Markdown, jamais tenu à la main, et il se
 * régénère à chaque déclaration. Ce module ne dessine rien : il lit les fichiers du livrable
 * et rend un modèle neutre, que render/livrable-pptx.mjs et render/livrable-docx.mjs
 * dessinent dans la charte des gabarits. */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { registry, byId, cheminDe } from './registry.mjs';
import { decoupe, titreDe, phraseDe, essentielDe } from './pack.mjs';
import { evaluer } from './exhibits.mjs';
import { officeDe, nomFichierOffice } from './gabarit-office.mjs';
import { redaction } from './templates.mjs';
import yaml from './yaml.mjs';

const safe = (fn, f = null) => { try { return fn(); } catch { return f; } };

/** Les fichiers Markdown d'un livrable présents dans le projet, collections comprises. */
function fichiersPresents(projet, w) {
  const base = join(projet, 'product', w.base || '');
  const out = [];
  for (const motif of w.files || []) {
    if (motif.endsWith('/')) {
      const dir = join(base, motif);
      if (!existsSync(dir)) continue;
      for (const f of readdirSync(dir).sort())
        if (f.endsWith('.md') && statSync(join(dir, f)).isFile()) out.push(motif + f);
    } else if (motif.endsWith('.md') && existsSync(join(base, motif))) out.push(motif);
  }
  return out.map(rel => ({ rel, chemin: 'product/' + (w.base || '') + rel, abs: join(base, rel) }));
}

/** Les sections H2 d'un corps Markdown, dans l'ordre, avec leur texte. */
function sectionsDe(corps) {
  const out = [];
  let cur = null;
  for (const l of corps.split(/\r?\n/)) {
    const m = /^##\s+(.+?)\s*$/.exec(l);
    if (m && !/^###/.test(l)) { cur = { titre: m[1], md: [] }; out.push(cur); continue; }
    if (cur) cur.md.push(l);
  }
  return out.map(s => ({ titre: s.titre, md: s.md.join('\n').replace(/^\s*---\s*$/gm, '').trim() }));
}

/** Le modèle d'un livrable produit, prêt à rendre. null si rien n'est produit. */
export function modeleLivrable(projet, id) {
  const r = registry();
  const w = byId(r.work_products, id);
  if (!w) return null;
  const fichiers = fichiersPresents(projet, w);
  if (!fichiers.length) return null;
  const R = redaction() || {}, C = R.cloture || {};
  const VERIF = C.verifier || 'Ce qui reste à vérifier', REP = C.reperes || 'Repères de méthode';
  const produit = safe(() => (yaml.load(decoupe(readFileSync(join(projet, 'product', cheminDe('SOC-01', 'project.yaml')), 'utf8')).corps) || {}).name, null);

  /* Une entité machine d'une collection — étape, release, story : front-matter « type » —
     est lue par les contrôles, pas par un lecteur. Elle n'entre pas dans le document. */
  const lus = fichiers.map(f => ({ ...f, ...decoupe(readFileSync(f.abs, 'utf8')) })).filter(f => !f.tete.type);
  if (!lus.length) return null;
  const parts = lus.map(f => {
    const { tete, corps } = f;
    const secs = sectionsDe(corps);
    const verifier = secs.find(s => s.titre === VERIF);
    const reperes = secs.find(s => s.titre === REP);
    const exhibits = [].concat(tete.exhibits || []).map(e => evaluer(e, { wp: w.id, file: f.rel }));
    return {
      chemin: f.chemin, fichier: f.rel,
      completion: tete.completion || 'inconnu',
      reserves: [].concat(tete.reserves || []).filter(Boolean).map(String),
      titre: titreDe(corps) || f.rel,
      phrase: phraseDe(corps),
      essentiel: essentielDe(corps),
      /* une section dont la réponse tient dans son titre garde sa place : c'est une réponse */
      sections: secs.filter(s => s !== verifier && s !== reperes),
      verifier: verifier?.md || '',
      reperes: reperes?.md || '',
      formats: exhibits.filter(e => e.ok).map(e => ({ type: 'format', format: e.format, nom_format: e.nom, reference: e.reference,
        question: e.question, wp: w.id, etape: w.step, chemin: f.chemin, titre: e.titre, source: e.source,
        completion: tete.completion, donnees: e.donnees, calcul: e.calcul, constats: e.constats })),
      formats_refuses: exhibits.filter(e => !e.ok).map(e => ({ format: e.nom || e.format, defauts: e.defauts })),
      corps,
    };
  });

  const etats = parts.map(p => p.completion);
  return {
    id: w.id, nom: w.name, etape: w.step,
    nom_etape: (r.steps || []).find(s => s.id === w.step)?.name || w.step,
    produit, office: officeDe(w.id), fichier_office: nomFichierOffice(w.id),
    completion: etats.every(e => e === 'complet') ? 'complet' : 'partiel',
    controle: String(w.controlled_at || ''), responsable: w.responsible_accountable || '',
    parts,
  };
}

/** Les livrables d'un projet qui ont au moins un fichier produit. */
export function livrablesProduits(projet) {
  return registry().work_products.filter(w => fichiersPresents(projet, w).length).map(w => w.id);
}

/** Où le fichier Office d'un livrable s'écrit dans le projet : hors de product/, que la
 *  garde et K2 réservent aux chemins déclarés. */
export const dossierLivrablesOffice = projet => join(projet, 'dist', 'livrables');
