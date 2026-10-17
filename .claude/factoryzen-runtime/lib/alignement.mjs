/* L'ALIGNEMENT D'UN DÉPÔT SUR LE PLUGIN — à chaque porte d'entrée, pas seulement au
 * launchpad.
 *
 * Les migrations (numérotation, disposition) ne tournaient qu'au provisionnement, donc à la
 * synchronisation du launchpad. Une session Claude ouverte sur un dépôt pas encore
 * synchronisé travaillait avec le plugin récent sur un état ancien : elle écrivait des
 * identifiants nouveaux dans un journal ancien, que la migration suivante aurait relus de
 * travers. Désormais chaque opération de la tour, l'entretien d'ouverture de session et le
 * provisionnement passent ici d'abord. Les migrations sont idempotentes et se gardent
 * elles-mêmes : à jour, l'alignement coûte la lecture d'un champ.
 *
 * LE SENS INVERSE EST UN REFUS. Un plugin plus ancien que le dépôt — un sous-module resté à
 * une vieille épingle — ne sait pas lire ce que le dépôt porte : il écrirait d'anciens
 * identifiants après la marque de migration. Il n'écrit donc plus rien, et dit pourquoi. */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { migrerDisposition } from './disposition.mjs';
import { migrerNumerotation, NUMEROTATION } from './numerotation.mjs';

/** La numérotation que porte le dépôt : null sans run, 1 pour un run d'avant la renumérotation. */
export function numerotationDuDepot(root) {
  const f = join(root, 'runs', 'tower.json');
  if (!existsSync(f)) return null;
  try { return JSON.parse(readFileSync(f, 'utf8')).numerotation || 1; } catch { return null; }
}

/** Le dépôt est-il plus récent que ce plugin ? Rend null s'il ne l'est pas, sinon le refus. */
export function depotEnAvance(root) {
  const depot = numerotationDuDepot(root);
  if (depot == null || depot <= NUMEROTATION) return null;
  return {
    depot, plugin: NUMEROTATION,
    reason: `ce plugin est plus ancien que le dépôt — numérotation ${depot} au dépôt, ${NUMEROTATION} au plugin. `
      + "Il ne sait pas lire ses identifiants : il n'écrit rien. Mettre à jour le plugin (« git submodule update --remote .factoryzen »), "
      + 'ou synchroniser le projet depuis le launchpad, qui épingle le plugin déployé.',
  };
}

/** Aligne le dépôt sur ce plugin : numérotation d'abord — tout ce qui suit lit les
 *  identifiants d'aujourd'hui —, puis disposition. Rend { ok, numerotation, disposition }
 *  ou, si le dépôt est en avance, { ok: false, reason }. */
export function aligner(root) {
  const avance = depotEnAvance(root);
  if (avance) return { ok: false, ...avance };
  const numerotation = migrerNumerotation(root);
  const disposition = migrerDisposition(root);
  return { ok: true, numerotation, disposition };
}
