#!/usr/bin/env node
/* Serveur MCP — tour de contrôle de la factory.
 *
 * Transport stdio, JSON-RPC 2.0 délimité par lignes. Zéro dépendance : le serveur ne
 * porte AUCUNE logique de contrôle. Il expose les opérations de lib/tower.mjs, qui sont
 * les mêmes que celles appelées par `apf tower`, par les hooks et par la CI. Une règle
 * qui vivrait ici serait une neuvième source de vérité.
 *
 * Portée honnête : ce serveur ne voit que ce qu'on lui demande. Il ne remplace ni les
 * hooks (seuls capables d'arrêter une écriture avant qu'elle ait lieu) ni la CI (seule
 * source de preuve opposable). Il tient l'état, il refuse les transitions illégitimes,
 * et il journalise — ce qui rend tout contournement visible. */

import { OPERATIONS } from '../lib/tower.mjs';
import { registry } from '../lib/registry.mjs';

const PROJECT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const PROTOCOL = '2024-11-05';

const SCHEMAS = {
  activity:     { type: 'string', description: "Identifiant d'activité, 0 (socle automatique) à 26" },
  actor:        { type: 'string', description: "Rôle de l'agent appelant, ex. product-lead" },
  work_product: { type: 'string', description: 'Identifiant de livrable, ex. WP-02' },
  path:         { type: 'string', description: 'Chemin atomique écrit, relatif à la racine du produit' },
  evidence:     { type: 'array', items: { type: 'string' }, description: 'Références de preuve' },
  gate:         { type: 'string', description: 'G0 · G1 · K1 · G3 · G4' },
  human:        { type: 'string', description: "Personne qui tranche. Une gate humaine n'est jamais franchie par un agent." },
  decision:     { type: 'string', description: 'Motif consigné au journal' },
  baseline:     { type: 'string', description: 'design · technique' },
  elements:     { type: 'array', items: { type: 'string' }, description: 'Éléments gelés en CORE INVARIANT' },
  id:           { type: 'string', description: 'Identifiant de skill' },
  completion:   { type: 'string', enum: ['complet', 'partiel'], description: "Complétude déclarée — jamais tacite. « complet » est confronté à la forme du gabarit." },
  reserves:     { type: 'array', items: { type: 'string' }, description: 'Obligatoires si partiel : ce qui manque, en clair' },
  instance:     { type: 'string', description: 'Release, slice ou version pour un livrable à chemin paramétré — « REL-x », « REL-x/S-01 », « v1.2.0 »' },
  mode:         { type: 'string', enum: ['atelier', 'decideur'], description: "Conduite du run (MCR-007) : « atelier », l'intention recueillie une question à la fois ; « decideur », l'équipe produit depuis le mandat et ne sollicite le décideur qu'aux points de passage" },
  engageante:   { type: 'boolean', description: 'La décision engage le porteur — dépense, publication en son nom, irréversible : elle arrête le run même en mode décideur' }
};
const REQUIRED = {
  factory_open_activity: ['activity'],
  factory_declare: ['activity', 'work_product'],
  factory_request_gate: ['gate'],
  factory_clear_gate: ['gate'],
  factory_freeze_baseline: ['baseline'],
  factory_resolve_skill: ['id']
};

const tools = OPERATIONS.map(o => ({
  name: o.name,
  description: o.desc,
  inputSchema: {
    type: 'object',
    properties: Object.fromEntries(o.args.map(a => [a, SCHEMAS[a]])),
    required: REQUIRED[o.name] || []
  }
}));

function callTool(name, args) {
  const op = OPERATIONS.find(o => o.name === name);
  if (!op) return { isError: true, content: [{ type: 'text', text: `Opération inconnue : ${name}` }] };
  let out;
  try { out = op.fn(PROJECT, args || {}); }
  catch (e) { return { isError: true, content: [{ type: 'text', text: `Échec : ${e.message}` }] }; }
  return { isError: out?.ok === false, content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] };
}

function handle(msg) {
  const { id, method, params } = msg;
  const reply = result => ({ jsonrpc: '2.0', id, result });
  switch (method) {
    case 'initialize': {
      const r = registry();
      return reply({
        protocolVersion: PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: { name: 'factory-control-tower', version: String(r.method.version) },
        instructions:
          "Tour de contrôle de l'Autonomous Product Factory. Ouvrez toujours une activité par " +
          "factory_open_activity avant de produire : c'est la seule source du fragment, de la " +
          "frontière d'écriture et du critère de sortie. Déclarez chaque livrable par factory_declare. " +
          "Une gate se demande (factory_request_gate) et ne se franchit qu'avec une autorité humaine nommée."
      });
    }
    case 'notifications/initialized': return null;
    case 'ping':       return reply({});
    case 'tools/list': return reply({ tools });
    case 'tools/call': return reply(callTool(params?.name, params?.arguments));
    default:
      return id === undefined ? null
        : { jsonrpc: '2.0', id, error: { code: -32601, message: `Méthode inconnue : ${method}` } };
  }
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buf += chunk;
  let nl;
  while ((nl = buf.indexOf('\n')) !== -1) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); }
    catch { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON invalide' } }) + '\n'); continue; }
    const out = handle(msg);
    if (out) process.stdout.write(JSON.stringify(out) + '\n');
  }
});
process.stdin.on('end', () => process.exit(0));
