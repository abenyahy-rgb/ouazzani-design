/* LA PALETTE DES FICHIERS OFFICE — gabarits et livrables, Word et PowerPoint.
 *
 * Elle ne se recopie plus : elle se LIT dans les rôles d'un design system (tokens.json,
 * groupe color.role). Les gabarits de la méthode lisent le départ standard
 * (templates/design-system/tokens.json) ; les livrables d'un projet lisent d'abord le
 * design system du projet, celui que l'activité 6 a gardé, adapté ou remplacé et stocké en
 * C1.4 (product/C1.4-socle/design-system/tokens.json). Un rôle que le projet ne déclare pas
 * reprend celui du départ : un projet qui n'a encore rien décidé suit le départ.
 *
 * Les noms exportés sont ceux des rôles qu'ils tenaient dans l'ancienne palette ambre — les
 * gabarits n'ont pas changé de forme. Ce sont des liaisons VIVANTES : utiliserPalette() les
 * réaffecte, et chaque script de rendu qui les importe voit aussitôt la palette du projet. */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export const ROLES = ['titre', 'nuit', 'accent', 'accent-sombre', 'encadre', 'fond', 'fond-second', 'papier',
  'texte', 'texte-sombre', 'texte-discret', 'texte-discret-sombre', 'filet', 'trait'];

/** Le chemin du design system d'un projet, dans ses livrables de C1.4. */
export const tokensDuProjet = projet => join(projet, 'product', 'C1.4-socle', 'design-system', 'tokens.json');

const hex = v => {
  const s = typeof v === 'string' ? v : v && typeof v === 'object' ? (v.hex || '') : '';
  const m = /^#?([0-9a-f]{6})$/i.exec(String(s).trim());
  return m ? m[1].toUpperCase() : null;
};

/** Les rôles d'un tokens.json, résolus en hex — alias {color.x}, hex, ou objet { hex }. */
export function lireRoles(tokens) {
  const chemin = (p) => p.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), tokens);
  const resoudre = (v, garde = 0) => {
    if (garde > 8) return null;
    if (v && typeof v === 'object' && '$value' in v) return resoudre(v.$value, garde + 1);
    const alias = typeof v === 'string' && /^\{([^}]+)\}$/.exec(v.trim());
    if (alias) return resoudre(chemin(alias[1]), garde + 1);
    return hex(v);
  };
  const role = tokens?.color?.role || {};
  return Object.fromEntries(ROLES.map(r => [r, resoudre(role[r])]).filter(([, v]) => v));
}

const lireJson = f => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return null; } };

/** Les rôles du départ standard : la palette par défaut. */
export const DEFAUT = Object.freeze(lireRoles(lireJson(new URL('../templates/design-system/tokens.json', import.meta.url)) || {}));

/** La palette d'un projet : ses rôles déclarés en C1.4, complétés par le départ. */
export function paletteDuProjet(projet) {
  const f = tokensDuProjet(projet);
  const propres = existsSync(f) ? lireRoles(lireJson(f) || {}) : {};
  return { ...DEFAUT, ...propres };
}

/** Une empreinte de palette : elle change dès qu'un rôle change, et seulement alors. */
export const empreintePalette = roles => createHash('sha1').update(ROLES.map(r => `${r}=${roles[r] || ''}`).join(';')).digest('hex').slice(0, 12);

export let ENCRE, NUIT, AMBRE, AMBRE_C, AMBRE_T, OS, OS2, PAPIER, TXT_C, TXT_S, TXT_SD, MUET, MUET_C, MUET_S, TRAIT, GRIS;

/** Pose la palette que liront les scripts de rendu. Sans argument : le départ standard. */
export function utiliserPalette(roles = DEFAUT) {
  const r = { ...DEFAUT, ...roles };
  ENCRE = r.titre; NUIT = r.nuit; AMBRE = r.accent; AMBRE_C = r['accent-sombre']; AMBRE_T = r.encadre;
  OS = r.fond; OS2 = r['fond-second']; PAPIER = r.papier; TXT_C = r.texte; TXT_S = r['texte-sombre'];
  TXT_SD = r['texte-discret-sombre']; MUET = MUET_C = MUET_S = r['texte-discret']; TRAIT = r.filet; GRIS = r.trait;
  return r;
}
utiliserPalette();
