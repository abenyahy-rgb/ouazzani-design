#!/usr/bin/env node
/* Génère l'adaptateur Claude Code — agents/ et skills/ — depuis core/method.yaml.
 *
 * C'est ici, et seulement ici, que le noyau rencontre un harness : profil d'outillage →
 * liste d'outils, classe de capacité → modèle, et capacité de connecteur → outils réels.
 * Le registre ne nomme ni outil ni modèle ; l'adaptateur ne porte aucune règle. */
import { MODELES_PAR_CLASSE, EFFORT_ADAPTATEUR, classeDuJuge, modeleDuJuge } from './modeles.mjs';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { registry, ROOT, cheminDe } from '../lib/registry.mjs';
/* La table capacité de connecteur → outils vit dans son propre module : K6 en a besoin,
   et importer ce générateur régénérerait le plugin à chaque contrôle. */
import { WORKSPACE_READ, WORKSPACE_WRITE } from './harness-tools.mjs';

const r = registry();

/* ── les seules tables propres au harness ─────────────────────────────── */
/* WebSearch est donné aux rôles qui produisent ; la garde le refuse hors des activités qui
   déclarent la recherche web (web_research.who.granted_at) — la capacité est accordée à une
   ACTIVITÉ, jamais à un rôle. Un évaluateur n'a que WebFetch : il vérifie une citation contre
   sa source, il ne va pas chercher de quoi étayer son verdict. */
const TOOLS = {
  evaluator:    'Read, Grep, Glob, WebFetch',
  auditor:      'Read, Grep, Glob, WebFetch',
  evidence:     'Read, Grep, Glob, Edit, Write, Bash, WebFetch, WebSearch',
  producer:     'Read, Grep, Glob, Edit, Write, Bash, WebFetch, WebSearch',
  orchestrator: 'Read, Grep, Glob, Edit, Write, Bash, WebFetch, WebSearch'
};

const profileOf = id => r.tools_profiles.find(p => p.id === id);

/* Un profil qui EXÉCUTE sans écrire reçoit Bash restreint aux motifs que le registre
   déclare — jamais Bash nu. Un profil sans écriture ne reçoit aucun outil d'écriture de
   connecteur : la règle se lit sur `writes`, plus sur le nom du profil. */
const toolsFor = profile => {
  const p = profileOf(profile) || {};
  return [TOOLS[profile], ...(p.executes || []).map(x => `Bash(${x})`), ...WORKSPACE_READ,
    ...(p.writes === false ? [] : WORKSPACE_WRITE)].join(', ');
};
const EFFORT = EFFORT_ADAPTATEUR;
const COLOR  = { evaluator:'orange', auditor:'yellow', evidence:'green', producer:'blue', orchestrator:'purple' };
const RANK = ['ÉCONOMIQUE', 'INTERMÉDIAIRE', 'AVANCÉE', 'POINTE'];

/* R1 et R5 — la classe et le modèle du juge sont DÉRIVÉS (build/modeles.mjs), jamais
   des valeurs par défaut. */
export const criticClass = () => classeDuJuge(r);
export const judgeModel = () => modeleDuJuge(r);
const modelsOf = cls => MODELES_PAR_CLASSE[cls] || [];
const modelOf = a => RANK.includes(a.capability_class) ? modelsOf(a.capability_class)[0] ?? 'opus' : judgeModel().model;

/* Le contrat d'entrée d'un profil, tel que le registre le déclare. Un profil sans contrat
   arrête la génération : K6 le refuse aussi, mais un agent généré sans contrat d'entrée
   serait déjà chargé par le harness. */
function entreeDe(profile) {
  const e = r.handover?.agent_entry?.[profile];
  if (!e?.length) throw new Error(`adaptateur : profil ${profile} sans contrat d'entrée — handover.agent_entry.${profile}`);
  return e;
}

/* Les conduites d'interrogatoire portées par les skills d'un ensemble d'activités. */
function conduitesDe(acts) {
  const ids = new Set(String(acts).split(/,\s*/).map(x => x.trim()));
  return (r.skills || []).filter(s => s.conduite && String(s.activities).split(/,\s*/).some(x => ids.has(x)))
    .map(s => ({ ...s.conduite, skill: s.id, activites: String(s.activities).split(/,\s*/).filter(x => ids.has(x)) }));
}

function agentFile(a, instance) {
  const id = instance ? `critic-${instance}` : a.id;
  const p = profileOf(a.tools_profile);
  const acts = a.activities;
  const where = /^[\d,\s\-]+$/.test(acts) ? `aux activités ${acts}` : acts;
  const desc = instance
    ? `Pose au plus sept critiques de ${instance} sur un artefact produit par un autre rôle, au format que grill-me interroge. LECTURE SEULE : il ne corrige rien et ne tranche rien — le porteur décide de chaque critique. Utiliser sur ${where}.`
    : `${a.mandate} Intervient ${where}.`;

  const body = [
`# ${id}`, '',
`> Fichier **généré** depuis \`core/method.yaml\` par \`build/build-adapter.mjs\`.`,
`> Ne pas éditer à la main : la prochaine génération l'écrase, et la CI refuse le diff.`, '',
'## Mandat', '', a.mandate, ''];

  if (instance) body.push('## Domaine', '',
    `Ce critic critique la dimension **${instance}**, sur l'artefact et sa surface seulement — jamais sur le raisonnement de son producteur.`, '',
    ...(j => [`**Indépendance de modèle (R5) : ${j.independance}** — ce critic tourne sur \`${j.model}\`, les producteurs sur ${j.producteurs.map(m => `\`${m}\``).join(', ')}. ${j.independance === 'DISTINCT' ? 'Un rôle distinct sur un modèle distinct.' : 'Choix du porteur (MCR-004) : un seul modèle servi. L\'indépendance vient de l\'humain, qui tranche chaque critique.'}`, ''])(judgeModel()));

  body.push('## Frontière d\'écriture', '', a.write_boundary, '',
    `**Profil d'outillage : \`${a.tools_profile}\`.** ${p.rule}`, '',
    '## Séparation des devoirs', '', a.separation_of_duties, '',
    /* LE MÉTIER DU RÔLE, PAS SEULEMENT SON PÉRIMÈTRE. Quatre champs disaient où un agent
       écrit et ce qu'il ne fait pas ; aucun ne disait comment bien faire son travail, et les
       cinq critics étaient identiques à un mot près. Les règles sont communes au rôle ; les
       contrôles du domaine sont propres à chaque instance de critic. */
    ...(a.rules?.length ? ['## Règles de travail', '', ...a.rules.map((x, i) => `${i + 1}. ${x}`), ''] : []),
    ...(instance && a.instance_checks?.[instance]?.length
      ? ['## Contrôles du domaine', '', ...a.instance_checks[instance].map(x => `- ${x}`), ''] : []),
    /* LE CONTRAT D'ENTRÉE EST CELUI DU PROFIL (MCR-003). Un texte figé disait à tous les agents,
       critics compris, de « poser une seule salve de quatre questions » : il contredisait
       NOT_VALIDATED, et un sous-agent ne peut pas attendre l'humain. Le texte vient du registre. */
    '## Contrat d\'entrée', '',
    ...entreeDe(a.tools_profile).flatMap(x => [x, '']),
    /* UNE CONDUITE D'INTERROGATOIRE NE SE DÉLÈGUE PAS. Un sous-agent ne peut pas attendre la
       réponse de l'humain : lui confier l'interrogatoire, c'est lui faire deviner les réponses. */
    ...conduitesDe(acts).flatMap(c => [`**Activité ${c.activites.join(', ')} — ${c.nom.toLowerCase()}.** L'interrogatoire se conduit dans la conversation principale, par le skill \`${c.skill}\`, jamais dans ce sous-agent : un sous-agent ne peut pas attendre la réponse de l'humain. Ce rôle reçoit le Journal d'interrogatoire confirmé et rédige à partir de lui ; il ne pose pas les questions.`, '']),
    /* UN CRITIC REND SES CRITIQUES, RIEN D'AUTRE (MCR-004) : le format de retour générique et
       le handover d'un rôle qui écrit ne lui servent pas, et coûtaient du contexte à chaque appel. */
    ...(instance ? [] : ['## Evidence et handover', '',
    'Un handover ne signifie pas « tâche terminée ». Il signifie que les sorties sont versionnées aux chemins déclarés au registre, que les vérifications de l\'activité ont été exécutées, que les écarts et les unknowns sont visibles, et que le destinataire peut poursuivre sans reconstruire un contexte resté dans la tête de l\'agent.', '',
    /* Déclarer et repasser les contrôles ne concernent que les rôles qui écrivent : un juge sans
       écriture ni apf recevrait une consigne qu'il ne peut pas suivre. */
    ...(p.writes !== false && r.completion_declaration?.contract ? [r.completion_declaration.contract, ''] : []),
    ...(p.writes !== false && r.handover?.passes ? [r.handover.passes, ''] : [])]),
    /* LE FORMAT DE RETOUR, POUR TOUS (MCR-003) — critics compris : leurs critiques en sont le livrable. */
    '## Format de retour', '',
    r.handover.return_format.intro, '',
    ...r.handover.return_format.items.map((x, i) => `${i + 1}. ${x}`), '',
    ...(p.writes === false && r.handover.return_format.evaluators ? [r.handover.return_format.evaluators, ''] : []),
    '## Où lire la méthode', '',
    'Ne jamais charger le registre entier. Demander le fragment de l\'activité en cours :', '',
    '```bash', 'apf show activity <n>     # entrées, tâche, vérification, sorties, livrables',
    'apf show wp <WP-nn>       # plan de contenu et critère de complétude',
    'apf template <WP-nn>      # squelette à remplir — mêmes sections, guide et exemple par section',
    'apf show gate <Gn>        # la frontière suivante et son pack de preuves', '```', '',
    `_Classe de capacité déclarée : ${a.capability_class}, effort ${a.effort}. ${a.class_rationale}_`);

  const fm = ['---', `name: ${id}`, `description: ${JSON.stringify(desc)}`,
    `tools: ${toolsFor(a.tools_profile)}`, `model: ${modelOf(a)}`,
    `effort: ${EFFORT[a.effort] ?? 'high'}`, `color: ${COLOR[a.tools_profile]}`, '---', ''];
  return fm.join('\n') + body.join('\n') + '\n';
}

function skillParts(s) {
  const acts = String(s.activities).split(/,\s*/).map(n => r.activities.find(a => String(a.id) === n)).filter(Boolean);
  const wps = acts.flatMap(a => a.work_products).map(id => r.work_products.find(w => w.id === id)).filter(Boolean);
  const desc = `${s.mandate.split('.')[0]}. Utiliser ${acts.length > 1 ? 'aux activités' : 'à l\'activité'} ${s.activities} de la méthode — ${acts.map(a => a.name).join(' · ')}.`;

  /* DIVULGATION PROGRESSIVE. SKILL.md est chargé dès que le skill est retenu : il porte
     le mandat, l'index et les interdits, rien de plus. Le détail — critères d'entrée et
     de sortie par activité, plan de contenu par livrable — descend en references/, lu
     seulement quand l'agent en a besoin. Sans ce partage, cinq skills dépassaient le
     plafond de 2 000 tokens, dont celui ajouté en dernier à 2 848. */
  const skill = ['---', `name: ${s.id}`, `description: ${JSON.stringify(desc)}`, '---', '',
`# ${s.id}`, '',
'> Fichier **généré** depuis `core/method.yaml`. Ne pas éditer à la main.', '',
'## Mandat', '', s.mandate, '',
    /* LA CONDUITE EST LUE AVANT TOUT LE RESTE. Elle dit comment parler à l'humain pendant
       l'activité ; laissée en références, elle serait lue après la première salve. */
    ...(s.conduite ? [`## Conduite — ${s.conduite.nom}`, '', String(s.conduite.motif).replace(/\s+/g, ' ').trim(), '',
      `**Où.** ${s.conduite.lieu}`, '', ...s.conduite.regles.map((x, i) => `${i + 1}. ${x}`), '',
      'Format d\'une question en texte :', '', '```',
      'Question 3 · 5 branches ouvertes',
      '**<titre court>** — <pourquoi elle compte maintenant, en une phrase>',
      '<la question>',
      '➡️ Recommandé : <la réponse> — <son motif>', '```', '',
      'Si `grill-me` ou `grilling` est chargé pendant l\'activité, garder son arbre de décisions et sa frontière, **jamais son format en tours** : cette conduite prime.', '',
      '**Cette conduite est contrôlée.** Un appel au mécanisme de questions structurées qui porte plusieurs questions est refusé ; un tour dont le texte en pose plusieurs est renvoyé une fois pour n\'en garder qu\'une. Une phrase rhétorique terminée par « ? » compte : l\'écrire en affirmation. Une question rapportée entre guillemets, en citation ou dans un bloc de code ne compte pas.', ''] : []),
    /* LE COMMENT, PAS À PAS. L'index des activités dit ce qui doit être vrai à chaque sortie ;
       il ne dit pas dans quel ordre on y arrive. Une procédure déclarée au registre est lue
       avant l'index, parce qu'elle règle la séquence de tout ce qui suit. */
    ...(s.procedure?.length ? ['## Procédure', '', ...s.procedure.map((x, i) => `${i + 1}. ${x}`), ''] : []),
'## Activités outillées', '',
'| Activité | Nom | Responsible | Accountable |', '|---|---|---|---|'];
  for (const a of acts) skill.push(`| ${a.id} | ${a.name} | \`${a.responsible}\` | \`${a.accountable}\` |`);
  skill.push('', 'Critères d\'entrée, tâche, vérification et sortie de chacune : **`references/activites.md`**.', '',
    '## Livrables', '', '| Livrable | Chemin | Contrôlé en |', '|---|---|---|');
  for (const w of wps) skill.push(`| ${w.id} — ${w.name} | \`${(w.base || '') + (w.files || []).join(' · ')}\` | ${w.controlled_at} |`);
  skill.push('', 'Plan de contenu et critère de complétude de chacun : **`references/livrables.md`**.', '',
    '## Contrat d\'entrée', '',
    'Si un artefact d\'entrée déclaré manque, retourner `BLOCKED — input manquant`. Ne jamais inférer : produire sur un matériau deviné donne un résultat plausible et invérifiable, ce que la méthode existe pour empêcher.', '',
    /* Certaines activités portent un ARRÊT DUR dans leur critère d'entrée. Il est
       remonté ici, où l'agent le lit avant de commencer, plutôt que laissé dans les
       références qu'il n'ouvrira peut-être qu'après avoir produit. */
    ...acts.filter(a => /BLOCKED/.test(a.entry)).flatMap(a => [
      `**Activité ${a.id} — arrêt dur.** ${a.entry}`, '',
      'Ces inputs se RECUEILLENT auprès d\'un humain, dans la salve unique de quatre questions au maximum (EX2). Ne jamais les dériver du nom du dépôt, du contexte de la session, ni d\'un fichier existant.', '']),
    '## Vérification avant handover', '',
    'Partir du squelette rendu par `apf template <WP-nn>` : il porte les sections du registre dans l\'ordre, la règle et le guide de chacune, et le critère de complétude. Ne jamais renommer ni omettre un H2 — le titre est une clé.', '',
    'Chaque livrable existe au chemin déclaré, porte toutes les sections de son plan de contenu et satisfait son critère de complétude.', '',
    /* Les trois passages et l'hygiène des contrôles viennent du registre : le générateur ne
       porte aucune règle. */
    r.handover.passes, '', r.handover.project_checks, '',
    /* RENDRE LA MAIN DESCEND EN RÉFÉRENCES. Le format Office et la projection dans l'espace
       de travail étaient recopiés dans les treize SKILL.md : vingt-cinq lignes identiques,
       sans objet dans un espace tiré, qui consommaient le plafond de contexte de chacun. */
    '**Puis rendre la main** — format Office, projection dans l\'espace de travail, pointeur bidirectionnel : **`references/rendre-la-main.md`**. La projection est sans objet si SOC-01 porte `workspace_kind: launchpad` : le commit est la page.', '',
    '## Ne pas faire', '',
    '- Écrire hors des chemins déclarés au registre : un artefact à un chemin non déclaré est invisible à la gouvernance et fait échouer K2.',
    '- Franchir un gate ou déclarer un livrable approuvé. Ce skill prépare la décision, il ne la prend pas.',
    '- Modifier un CORE INVARIANT du socle depuis une cadence autre que C1. Émettre un finding et router vers G0 (EX3).');

  const refActs = [`# ${s.id} — activités outillées`, '',
    '> Généré depuis `core/method.yaml`. Chargé à la demande, jamais d\'office.', ''];
  for (const a of acts) refActs.push(
    `## Activité ${a.id} — ${a.name}`, '', `**Entrée.** ${a.entry}`, '', `**Tâche.** ${a.task}`, '',
    `**Vérification.** ${a.verification}`, '', `**Sortie.** ${a.exit}`, '',
    `Responsible : \`${a.responsible}\` · Accountable : \`${a.accountable}\` · Cadence ${a.cadence}, étape ${a.step}`, '');

  const refWps = [`# ${s.id} — livrables`, '',
    '> Généré depuis `core/method.yaml`. Le plan de contenu est le squelette du fichier, pas une suggestion.', ''];
  for (const w of wps) {
    refWps.push(`## ${w.id} — ${w.name}`, '', `\`${(w.base || '') + (w.files || []).join(' · ')}\``, '',
      `Cycle de vie : ${w.lifecycle} · contrôlé en ${w.controlled_at} · R/A : ${w.responsible_accountable}`, '', w.purpose, '');
    for (const sec of w.sections || []) refWps.push(`- **${sec.title}**${sec.rule ? ` — ${sec.rule}` : ''}`);
    refWps.push('', `**Complétude.** ${w.completion}`, '');
    if (w.specimen) refWps.push('```', w.specimen, '```', '');
  }
  return { skill: skill.join('\n') + '\n', activites: refActs.join('\n'), livrables: refWps.join('\n'), rendre: refHandover(s) };
}

/* Commun à tous les skills, donc écrit une fois ici et copié dans chaque references/ : un
   skill se lit seul, il ne renvoie jamais au dossier d'un autre. */
function refHandover(s) {
  return [`# ${s.id} — rendre la main`, '',
    '> Généré depuis `core/method.yaml`. Lu après la vérification du SKILL.md, jamais à sa place.', '',
    '## Format Office', '',
    '`factory_declare` écrit le livrable en PowerPoint ou Word dans `dist/livrables/` (champ `office` de la réponse). En cas d\'erreur : `apf livrable <WP-nn>`. Ne jamais l\'éditer à la main : il est calculé depuis le Markdown.', '',
    '## Projection dans l\'espace de travail', '',
    '**Si SOC-01 porte `workspace_kind: launchpad`** (dépôt lancé depuis le launchpad), il n\'y a rien à projeter : le workflow du dépôt dépose l\'état à chaque push, `apf notion status` rend « sans objet », et la page est le commit. Sinon, dans cet ordre :', '',
    '```bash',
    'apf notion where <WP-nn>   # la destination, et surtout l\'ACTION',
    'apf notion page  <WP-nn>   # le corps : miroir complet du fichier Git, bandeau compris',
    '#  … mettre à jour la page EXISTANTE via le connecteur …',
    'apf notion link  <WP-nn> <url>',
    '```', '',
    '**La ligne existe déjà** : créée au bootstrap avec son gabarit et le statut « À produire ». L\'action rendue est `update`. Ne jamais créer une seconde ligne — deux pages pour un livrable, ce sont deux vérités. Ne jamais rédiger le corps : il est calculé.', '',
    'Le pointeur est bidirectionnel : le front-matter porte l\'adresse de la page, la page porte en retour le chemin et le commit. Un livrable lisible d\'un seul côté n\'est relié à rien.', '',
    'La liaison ne bloque aucun GATE : `apf notion status` rapporte, il ne refuse pas.', ''].join('\n');
}

/* ── commandes : une par opération de la tour, plus les projections ───── */
function commandFiles() {
  const T = r.control_tower;
  const out = [];
  const cmd = (name, desc, hint, body, tools = 'Bash(apf:*)') =>
    out.push([`commands/factory-${name}.md`,
      ['---', `description: ${JSON.stringify(desc)}`, ...(hint ? [`argument-hint: ${hint}`] : []),
       `allowed-tools: ${tools}`, '---', '', body, ''].join('\n')]);

  cmd('status', "Où en est le run : activité courante, gates franchies, socles gelés, cadences atteignables.", null,
    ['Exécuter `apf tower factory_state` et rendre l\'état sans le commenter.', '',
     'Puis nommer la prochaine frontière et ce qui manque pour l\'atteindre.'].join('\n'));

  cmd('open', "Ouvrir une activité et recevoir son fragment, sa frontière d'écriture et son critère de sortie.", '[numéro d\'activité]',
    ['Exécuter `apf tower factory_open_activity \'{"activity":"$1"}\'`.', '',
     'La tour est la SEULE source du fragment : ne jamais lire `core/method.yaml` pour s\'en passer.',
     'Un refus n\'est pas un obstacle à contourner — c\'est une gate antérieure ouverte ou un rôle qui n\'est pas responsable de cette activité.', '',
     'Si la réponse porte une `conduite`, elle règle toute la conversation de l\'activité et prime sur le format des skills invoqués. Pour une conduite « une question à la fois » : poser UNE question par message dans cette conversation — jamais dans un sous-agent —, attendre la réponse, consigner la ligne au Journal d\'interrogatoire, puis seulement poser la suivante.'].join('\n'));

  const AP = r.autopilote;
  if (AP) cmd('run', "Autopilote de la cadence C1 : enchaîner les activités jusqu'à G0, l'humain au-dessus de la boucle.", '[votre nom — celui qui ratifiera en G0]',
    ['## Démarrer', '',
     `Si l'autopilote n'est pas actif : \`apf tower factory_autopilot_start '{"par":"$1"}'\`. Sans nom, demander à l'humain le sien — une seule question —, c'est lui qui ratifiera en G0.`, '',
     '## La boucle — sans rendre la main', '',
     "Répéter jusqu'à un arrêt : `apf tower factory_next`, puis exécuter l'action rendue.", '',
     `- **INTERROGER** : ouvrir l'activité si besoin, puis conduire l'interrogatoire avec l'humain dans cette conversation, une question à la fois. C'est le seul moment où il est attendu.`,
     `- **OUVRIR** : appeler l'opération rendue (\`factory_open_activity\`). Si la réponse porte \`autopilote.delegations\`, appliquer le choix consigné sans poser la question.`,
     `- **PRODUIRE** : invoquer chaque rôle avec le \`model\` et l'\`effort\` rendus — la garde refuse un autre routage. Il produit depuis le fragment et déclare chaque livrable (\`factory_declare\`).`,
     `- **JUGER** : invoquer le critic avec son routage. Il rend au plus sept critiques au format CRIT-n, chacune avec sa recommandation — il ne tranche rien. Déposer sa sortie TELLE QUELLE au chemin \`depot\`, puis \`factory_record_verdict\` : chaque critique entre en file pour le porteur, et la boucle passe au livrable suivant.`,
     `- **REPRENDRE** : renvoyer le livrable à son producteur avec les seules critiques que le porteur a RETENUES ; les écartées ne se traitent pas ; redéclarer.`,
     `- **REPRENDRE_DECISION** : l'humain a tranché autrement qu'un défaut délégué ; rouvrir l'activité, appliquer son choix, redéclarer, puis \`factory_autopilot_resume\`.`,
     `- **CORRIGER** : traiter chaque manque et chaque contrôle en échec du pack de G0 dans l'activité qui le porte.`, '',
     '## Les arrêts', '',
     "- **STOP_TRI** : à la fin d'une étape de C1, les critiques en attente. Les trier avec le porteur par grill-me (le skill route vers `grilling`) : une critique par question, la recommandation du critic en premier ; sa réponse, Retenir ou Écarter, par `factory_answer_decision`. C'est lui qui juge de la pertinence — jamais le critic, jamais l'orchestrateur.",
     "- **STOP_DECISION** : une décision que seul l'humain peut prendre. L'exposer, une question à la fois, et attendre. La réponse : `factory_answer_decision`.",
     "- **STOP_G0** : le pack est prêt. Présenter les décisions à trancher, puis les décisions déléguées à ratifier, par rayon d'impact. L'autopilote ne franchit JAMAIS G0 : c'est l'humain, nommément.", '',
     "Une décision qui n'est que de l'information devient une HYP-nn et la boucle continue. Une décision qui revient à l'humain entre en file (`factory_queue_decision`) — bloquante si elle porte sur son intention, sur un irréversible ou sur le corpus réel ; sinon elle attend G0 sans arrêter la boucle.", '',
     "Le hook Stop refuse la fin de tour tant qu'il reste une action et que le run progresse : ne pas rendre la main entre deux actions. Il la rend de lui-même à un arrêt, ou quand rien n'a bougé depuis la relance précédente."].join('\n'),
    /* l'orchestrateur invoque les rôles et dépose leurs verdicts : il lui faut l'invocation et l'écriture */
    'Bash(apf:*), Agent, Task, Read, Write, Edit, Glob, Grep');

  if (AP) cmd('tri', "Trier les critiques en attente avec grill-me : le porteur retient ou écarte chacune.", null,
    ["Exécuter `apf tower factory_autopilot_state` et prendre les décisions de type `critique` au statut EN_ATTENTE, par rayon décroissant.", '',
     "Les trier par grill-me — le skill route vers `grilling` : UNE critique par question, avec ce qui est observé, pourquoi cela compte, puis la recommandation du critic et son motif en premier. Le porteur répond Retenir ou Écarter, et peut motiver.", '',
     "Consigner chaque réponse aussitôt : `apf tower factory_answer_decision '{\"id\":\"DEC-nn\",\"by\":\"<son nom>\",\"choix\":\"Retenir\",\"note\":\"…\"}'`.", '',
     "Ne jamais trancher à sa place, ni regrouper deux critiques dans une question. Une critique retenue part en reprise chez le producteur ; une critique écartée est close."].join('\n'),
    'Bash(apf:*), Skill');

  cmd('gate', "Constater l'état d'une gate : pack de preuves, livrables manquants, contrôles en échec.", '[G0 | G1 | K1 | G3 | G4]',
    ['Exécuter `apf tower factory_request_gate \'{"gate":"$1"}\'`.', '',
     'Rendre le verdict tel quel. La tour constate ; elle ne franchit pas.',
     'Une gate humaine ne se franchit jamais depuis une session d\'agent : elle exige une autorité nommée.'].join('\n'));

  cmd('check', `Exécuter les ${r.controls.length} contrôles déterministes et l'intégrité du vendoring.`, null,
    ['Exécuter `apf check`.', '',
     'Un SKIPPED ne vaut pas un PASS : il attend une instance de projet. Ne jamais le présenter comme un succès.',
     'Pour chaque FAIL, nommer le défaut et le chemin concerné avant de proposer quoi que ce soit.'].join('\n'));

  cmd('living', "Régénérer les deux artefacts vivants : modèle de données dérivé et prototype composé.", null,
    ['Exécuter `apf tower factory_derive_model` puis `apf tower factory_compose_prototype`.', '',
     'Les deux sont CALCULÉS. Ne jamais corriger un champ non résolu en éditant le fichier dérivé :',
     `la liaison se fait dans \`product/${cheminDe('WP-10', 'binding.yaml')}\`, la composition dans les deltas déclarés.`].join('\n'));

  cmd('catalog', "Situer un objet de la méthode : activité, livrable, gate, agent, skill, contrôle.", '[activity|wp|gate|agent|skill|control] [id]',
    ['Exécuter `apf show $1 $2`. Sans argument, exécuter `apf stats`.', '',
     `Ne jamais charger le registre entier : un fragment d'activité coûte moins de 2 % de sa taille.`].join('\n'));

  const W = r.notion_workspace;
  cmd('workspace', "Instancier ou compléter l'espace de travail lisible, et projeter un livrable dans sa page.", '[plan | where WP-nn | instance release REL-1 | status | link WP-nn URL]',
    ['## Espace de travail TIRÉ', '',
     `Si \`product/${cheminDe('SOC-01', 'project.yaml')}\` porte \`workspace_kind: launchpad\`, cet espace est une projection TIRÉE : le workflow du dépôt dépose l\'état à chaque push sur la branche par défaut. Toute opération ci-dessous rend « sans objet » avec l\'adresse de la page. Ne rien instancier, ne rien relier : committer et pousser.`, '',
     '## Préalable — vérifié AVANT toute écriture', '',
     `1. Le connecteur d'espace de travail répond. ${W.connector.on_absence}`,
     `2. L'emplacement de la racine est fourni. ${W.root_location.on_absence}`,
     "Une instanciation à moitié faite laisse un espace qu'un rejeu ne sait pas distinguer d'un espace complet.", '',
     '## `plan` — instancier ou compléter', '',
     "Exécuter `apf tower factory_workspace_plan` et appliquer les phases **dans l'ordre rendu** :", '',
     ...W.execution_order.phases.map(ph => `${ph.id}. **${ph.name}**${ph.note ? ` — ${ph.note}` : ''}`), '',
     `${W.execution_order.rule} Après chaque création, enregistrer l'identifiant : \`apf notion map --set <clé> <id>\`.`, '',
     "Le plan est CALCULÉ depuis le registre. Ne jamais le réécrire ni dessiner une page à la main : une page dessinée à la main est une projection non générée, donc une divergence en attente.", '',
     '## `where WP-nn` — où va ce livrable', '',
     'Exécuter `apf notion where $2`. La réponse porte une **action** :', '',
     "- `update` — la ligne existe depuis le bootstrap. La mettre à jour. **Ne jamais en créer une seconde** : deux pages pour un livrable, ce sont deux vérités.",
     '- `create` — livrable par-instance ; sa ligne se crée par `apf notion instance`.', '',
     'Le corps de la page vient de `apf notion page $2` : miroir complet du fichier Git, bandeau compris. Ne pas le rédiger.', '',
     '## `instance <release|slice|version> <id>`', '',
     "Crée les lignes d'une instance qui existe désormais. Une release ne crée pas les lignes de ses slices.", '',
     '## `status` et `link`', '',
     '`apf notion status` · `apf notion link $2 $3`.', '',
     `⚠ ${W.never_blocks.split('.')[0]}. En revanche l'activité 1 a cet espace pour sortie : sans connecteur, elle rend BLOCKED.`].join('\n'),
    ['Bash(apf:*)', ...WORKSPACE_READ, ...WORKSPACE_WRITE].join(', '));

  const declared = (T.operations || []).map(o => o.name);
  if (!declared.includes('factory_state')) throw new Error('commandes : la tour ne déclare plus factory_state');
  return out;
}

/* ── écriture ────────────────────────────────────────────────────────── */
/* APF_ADAPTER_OUT : générer ailleurs que dans le plugin — le test de fraîcheur compare une
   génération dans un dossier temporaire au plugin, sans réécrire agents/ pendant que les
   autres suites le lisent. */
const OUT = process.env.APF_ADAPTER_OUT || ROOT;
for (const d of ['agents', 'skills', 'commands', 'hooks']) rmSync(join(OUT, d), { recursive: true, force: true });
mkdirSync(join(OUT, 'agents'), { recursive: true });

let nAgents = 0;
for (const a of r.agents) {
  if (a.instances) for (const i of a.instances) {
    writeFileSync(join(OUT, 'agents', `critic-${i}.md`), agentFile(a, i)); nAgents++;
  } else {
    writeFileSync(join(OUT, 'agents', `${a.id}.md`), agentFile(a)); nAgents++;
  }
}
/* Un skill externe n'est PAS genere : il est VENDORE — copie verbatim depuis le commit
   epingle, sous vendor/, et livre avec le plugin via plugin.json -> skills. Le generer
   reviendrait a le reecrire depuis le registre, donc a le forker. Le risque de la copie
   n'est pas ecarte par une consigne mais par l'empreinte : lib/vendor.mjs rehache chaque
   fichier a chaque controle, et K6 echoue sur un octet modifie. */
let nSkills = 0, nExternal = 0, nRefs = 0;
for (const s of r.skills) {
  if (s.origin === 'external') { nExternal++; continue; }
  const parts = skillParts(s);
  mkdirSync(join(OUT, 'skills', s.id, 'references'), { recursive: true });
  writeFileSync(join(OUT, 'skills', s.id, 'SKILL.md'), parts.skill); nSkills++;
  writeFileSync(join(OUT, 'skills', s.id, 'references', 'activites.md'), parts.activites);
  writeFileSync(join(OUT, 'skills', s.id, 'references', 'livrables.md'), parts.livrables);
  writeFileSync(join(OUT, 'skills', s.id, 'references', 'rendre-la-main.md'), parts.rendre); nRefs += 3;
}

for (const [rel, body] of commandFiles()) {
  mkdirSync(join(OUT, 'commands'), { recursive: true });
  writeFileSync(join(OUT, rel), body);
}
const nCmds = commandFiles().length;

/* DEUX FAMILLES DE HOOKS, et leur différence est la doctrine.
 *
 * LA GARDE décide : elle refuse une écriture hors frontière, et elle refuse aussi quand
 * elle ne peut pas juger (sûreté inverse). Elle sort en 2.
 *
 * LA TRACE observe : elle ne décide rien et sort TOUJOURS en 0. Un hook PreToolUse qui
 * échoue refuse l'écriture — une trace cassée arrêterait donc le travail qu'elle est
 * censée regarder. Le registre le pose en règle (observability.fail_open) ; ici on
 * l'applique.
 *
 * Aucune règle ne vit dans ce fichier : les deux commandes sont celles qu'appellent aussi
 * le pre-commit et la CI, donc elles ne peuvent pas diverger. */
mkdirSync(join(OUT, 'hooks'), { recursive: true });
const APF = '"${CLAUDE_PLUGIN_ROOT}/bin/apf"';
const traced = (event, timeout = 5) => ({ hooks: [{ type: 'command', command: `${APF} trace hook ${event}`, timeout }] });
const hookSpec = {
  SessionStart:     [traced('SessionStart')],
  UserPromptSubmit: [traced('UserPromptSubmit')],
  PreToolUse: [
    { matcher: 'Write|Edit|NotebookEdit', hooks: [{ type: 'command', command: `${APF} guard`, timeout: 10 }] },
    /* Bash passe aussi par la garde, pour une seule raison : un rôle en lecture seule n'y
       exécute que apf. Pour tout autre agent, la garde ne rend aucune décision. */
    ...(r.tools_profiles.some(p => p.writes === false && p.executes?.length)
      ? [{ matcher: 'Bash', hooks: [{ type: 'command', command: `${APF} guard`, timeout: 10 }] }] : []),
    /* La conduite d'interrogatoire, opposable : un appel qui pose plusieurs questions est refusé
       avant que l'humain ne les voie. Sans conduite active, le contrôle laisse tout passer. */
    /* L'invocation d'un sous-agent passe par la garde : un rôle de la méthode tourne sur le
       modèle et l'effort de son contexte (R6). Hors activité ouverte, aucune décision. */
    ...((r.routing?.modulation || []).length ? [{ matcher: 'Agent|Task', hooks: [{ type: 'command', command: `${APF} guard`, timeout: 10 }] }] : []),
    /* La recherche web passe par la garde : accordée aux activités qui la déclarent, refusée ailleurs. */
    ...((r.web_research?.who?.granted_at || []).length ? [{ matcher: 'WebSearch', hooks: [{ type: 'command', command: `${APF} guard`, timeout: 10 }] }] : []),
    ...((r.skills || []).some(s => s.conduite) ? [{ matcher: 'AskUserQuestion', hooks: [{ type: 'command', command: `${APF} conduite question`, timeout: 5 }] }] : []),
    { matcher: '*', ...traced('PreToolUse') },
  ],
  PostToolUse:  [{ matcher: '*', ...traced('PostToolUse') }],
  SubagentStop: [traced('SubagentStop')],
  /* Le transcript se lit à la fin du tour : c'est la seule source qui dise quel modèle a
     RÉELLEMENT servi, et un fichier de plusieurs mégaoctets demande plus que cinq secondes. */
  Stop:         [traced('Stop', 15),
    /* À la fin du tour, le texte rendu : plus d'une question et le tour est renvoyé, une fois. */
    ...((r.skills || []).some(s => s.conduite) ? [{ hooks: [{ type: 'command', command: `${APF} conduite fin`, timeout: 10 }] }] : []),
    /* L'autopilote : la fin de tour est refusée tant qu'il reste une action et que le run progresse. */
    ...(r.autopilote ? [{ hooks: [{ type: 'command', command: `${APF} autopilote stop`, timeout: 15 }] }] : [])],
};
writeFileSync(join(OUT, 'hooks/hooks.json'), JSON.stringify({ hooks: hookSpec }, null, 2) + '\n');
const nHooks = Object.values(hookSpec).flat().length;
console.log(`agents/ — ${nAgents} définitions (critic dérivé en ${criticClass()}, sur ${judgeModel().model} — ${judgeModel().independance}) · skills/ — ${nSkills} générés + ${nRefs} références · commands/ — ${nCmds} · hooks/ — ${nHooks} · vendor/ — ${nExternal} externes livrés verbatim, épinglés`);
