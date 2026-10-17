/* Un fichier Office est une archive ZIP. Les bibliothèques de rendu l'écrivent sans
   compression, avec des entrées de dossier et « [Content_Types].xml » à n'importe quelle
   place : certains lecteurs le refusent alors (« source file could not be loaded »), et le
   fichier pèse le triple. On réécrit l'archive : types en tête, sans dossiers, compressée. */
import { JSZip } from '../lib/office.mjs';

export async function recompresser(brut) {
  const lu = await JSZip.loadAsync(brut), zip = new JSZip();
  const noms = Object.keys(lu.files).filter(n => !lu.files[n].dir)
    .sort((x, y) => (y === '[Content_Types].xml') - (x === '[Content_Types].xml'));
  for (const n of noms) zip.file(n, await lu.files[n].async('nodebuffer'), { createFolders: false });
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
}
