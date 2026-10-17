/* Point d'entrée UNIQUE des bibliothèques de rendu Office (PowerPoint, Word, ZIP).
 * Elles sont VENDORÉES — vendor/office/office.mjs, un bundle sans dépendance épinglé par
 * empreinte au registre (runtime_dependencies → office) — parce que Claude Code installe un
 * plugin par clone et n'exécute aucune installation : une dépendance npm serait absente chez
 * chaque projet. Aucun autre fichier n'importe le bundle directement. */
export { PptxGenJS, docx, JSZip } from '../vendor/office/office.mjs';
