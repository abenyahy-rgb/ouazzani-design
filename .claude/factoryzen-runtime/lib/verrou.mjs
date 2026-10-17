/* LE VERROU DES IDENTIFIANTS ET DES CHEMINS PUBLIÉS — ce que des dépôts portent déjà.
 *
 * Un identifiant de livrable ou un chemin d'artefact publié vit dans des dépôts : leur
 * journal, leur état de tour, leurs front-matter, leurs fichiers. Le faire disparaître du
 * registre sans migration rend ce travail illisible du jour au lendemain — et rien ne
 * l'empêchait : la renumérotation n'avait de migration que parce qu'on avait pensé à l'écrire.
 *
 * lib/identifiants-publies.json garde tout ce qui a été publié ; il ne fait que grandir
 * (npm run verrou, appelé par npm run build). Le test refuse qu'une entrée du verrou ne soit
 * ni vivante, ni prise en charge par une migration : une table de renumérotation, la liste
 * des livrables retirés, ou la table de disposition. Changer un identifiant ou un chemin
 * sans écrire sa migration fait donc échouer npm test. */
import { readFileSync } from 'node:fs';

export const FICHIER = new URL('./identifiants-publies.json', import.meta.url);
const DISPOSITION = new URL('./disposition-par-etape.json', import.meta.url);

export const lireVerrou = () => { try { return JSON.parse(readFileSync(FICHIER, 'utf8')); } catch { return { identifiants: [], chemins: [] }; } };
export const lireDisposition = () => JSON.parse(readFileSync(DISPOSITION, 'utf8'));

/** Ce que le registre publie aujourd'hui : identifiants et chemins (sous product/). */
export function publies(r) {
  return {
    identifiants: r.work_products.map(w => w.id),
    chemins: r.work_products.flatMap(w => (w.files || []).map(f => `${w.base || ''}${f}`)),
  };
}

/* UN IDENTIFIANT EST PRIS EN CHARGE PAR SA DERNIÈRE APPARITION. Le même numéro peut quitter
   un livrable et en désigner un autre à la version suivante : WP-30 était le journal de build
   avant la numérotation 3, c'est aujourd'hui l'enregistrement de déploiement. Qu'il figure
   comme source d'une ancienne table n'excuse donc rien. On suit chaque identifiant dans
   l'ordre des versions — retraits avant la numérotation 2, puis chaque table, sources avant
   cibles dans une même version : s'il apparaît en dernier comme SOURCE, une migration l'a
   emmené ailleurs ; en dernier comme CIBLE, il est redevenu vivant, et doit l'être encore. */
function emmenes(r) {
  const dernier = new Map();
  for (const x of r.retired_work_products?.list || []) dernier.set(x.id, 'source');
  const versions = [...(r.renumbered_work_products?.versions || [])].sort((a, b) => a.numerotation - b.numerotation);
  for (const v of versions) {
    for (const x of v.map || []) dernier.set(x.from, 'source');
    for (const x of v.map || []) dernier.set(x.to, 'cible');
  }
  return new Set([...dernier].filter(([, k]) => k === 'source').map(([id]) => id));
}

/** Ce qui est vivant ou pris en charge par une migration. */
export function pris_en_charge(r, disposition = lireDisposition()) {
  const actuel = publies(r);
  return {
    identifiants: new Set([...actuel.identifiants, ...emmenes(r)]),
    chemins: new Set([...actuel.chemins, ...(disposition.paires || []).map(p => p.ancien)]),
    /* un chemin paramétré déplacé : le fichier lui-même, ou tout ce qu'emporte son dossier */
    parametres: (disposition.parametres || []).map(p => p.ancien),
  };
}

const emporte = (ok, chemin) => ok.chemins.has(chemin)
  || ok.parametres.some(a => (a.endsWith('/') ? chemin.startsWith(a) : chemin === a));

/** Les entrées du verrou que rien ne prend en charge : chacune est une migration manquante. */
export function orphelins(r, verrou = lireVerrou(), disposition = lireDisposition()) {
  const ok = pris_en_charge(r, disposition);
  return {
    identifiants: verrou.identifiants.filter(x => !ok.identifiants.has(x)),
    chemins: verrou.chemins.filter(x => !emporte(ok, x)),
  };
}

/** Le verrou augmenté de ce que le registre publie — jamais diminué. */
export function augmenter(r, verrou = lireVerrou(), disposition = lireDisposition()) {
  const ok = pris_en_charge(r, disposition);
  const tri = a => [...new Set(a)].sort((x, y) => x.localeCompare(y, 'fr', { numeric: true }));
  return {
    note: "Identifiants de livrable et chemins sous product/ déjà publiés. Ce fichier ne fait que grandir (npm run verrou) ; une entrée qui n'est plus vivante doit être prise en charge par une migration — renumbered_work_products, retired_work_products ou lib/disposition-par-etape.json.",
    identifiants: tri([...verrou.identifiants, ...ok.identifiants]),
    chemins: tri([...verrou.chemins, ...ok.chemins]),
  };
}
