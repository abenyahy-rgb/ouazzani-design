/* Correspondance capacité de connecteur → outils réels.
 *
 * Module SÉPARÉ, et c'est délibéré : build/build-adapter.mjs écrit des fichiers dès son
 * chargement. K6 a besoin de cette table pour refuser un évaluateur qui déclarerait un
 * outil d'écriture de connecteur — l'importer depuis l'adaptateur aurait régénéré tout
 * le plugin à chaque « apf check ». Une table n'a pas d'effet de bord ; un générateur si.
 *
 * C'est ici, et seulement ici, que la capacité harness-notion-connector du registre
 * rencontre des noms d'outils. Le noyau nomme la capacité, jamais l'outil.
 *
 * La séparation lecture / écriture n'est pas cosmétique : un évaluateur reçoit la
 * lecture — il doit pouvoir consulter ce qu'il juge — et JAMAIS l'écriture. */

export const WORKSPACE_READ = [
  'mcp__Notion__notion-fetch',
  'mcp__Notion__notion-search'
];

export const WORKSPACE_WRITE = [
  'mcp__Notion__notion-create-pages',
  'mcp__Notion__notion-update-page',
  'mcp__Notion__notion-create-database',
  'mcp__Notion__notion-create-view',
  'mcp__Notion__notion-move-pages'
];

export const WORKSPACE_TOOLS = { read: WORKSPACE_READ, write: WORKSPACE_WRITE };
