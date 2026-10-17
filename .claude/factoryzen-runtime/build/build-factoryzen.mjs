#!/usr/bin/env node
/* Génère dist/FactoryZen.html depuis core/method.yaml — et dist/FactoryZen.en.html depuis le
 * même registre, lu à travers sa surcouche anglaise (core/i18n/en.yaml, core/i18n/templates.en.yaml).
 * FactoryZen est une PROJECTION. Il n'est jamais édité à la main : c'est ce qui rend
 * la divergence entre le registre et sa vue structurellement impossible, plutôt
 * qu'interdite par une consigne que rien ne contrôle. Une langue de plus ne change ni un id
 * ni une règle : seulement le texte, et les mentions fixes de la page (table LIBELLES). */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { registry } from '../lib/registry.mjs';
import { apercuGabarit } from '../lib/templates.mjs';
import { formatsPortesPar } from '../lib/exhibits.mjs';
import { officeDe, nomFichierOffice, sousDossierOffice } from '../lib/gabarit-office.mjs';
import { registreEn, roleEn, baselineEn } from '../lib/i18n.mjs';
import { ROOT } from '../lib/registry.mjs';
import { join } from 'node:path';

/* ── les mentions fixes de la page, par langue ──────────────────────── */
const LIBELLES = {
  fr: {
    fige: 'fige', autoK: "Automatique · avant l'activité 1", autoN: 'socle technique écrit sans personne — aucune question à l\'humain',
    tache: 'Tâche', sortie: 'Sortie', skill: 'Skill', mode: 'Mode', entree: 'Entrée', verification: 'Vérification', ra: 'R / A',
    livrables: 'Livrables', activite: id => `Activité ${id}`,
    depart: 'Point de départ', puisQ: 'puis une question :', ou: 'ou', fournis: 'Fichiers fournis',
    question: 'La question posée :', gardeFous: 'Garde-fous', reference: f => `La référence complète — ${f}`,
    gabaritOffice: n => `Gabarit ${n}`, consulter: 'Consulter', telecharger: o => `Télécharger le .${o}`,
    resume: (nf, nfmt, nm) => `${nf} fichier${nf > 1 ? 's' : ''} rédigé${nf > 1 ? 's' : ''}${nfmt ? ` · ${nfmt} format${nfmt > 1 ? 's' : ''} de présentation` : ''}${nm ? ` · ${nm} section${nm > 1 ? 's' : ''} machine` : ''}`,
    pasStandard: 'pas encore au standard de rédaction', gabarit: 'Gabarit',
    tplStandard: 'Le livrable tel qu\'il s\'écrit, sur l\'exemple ChantierClair', tplGuide: 'Guide et exemple par section',
    officePptx: 'se présente à une autorité : une planche par section, consigne et exemple à côté',
    officeDocx: 'se consulte et fait référence : une section par titre, consigne et exemple en encadré',
    consignes: 'Consignes de rédaction, section par section', machineStd: 'Fichiers machine et collections', sections: 'Sections',
    controleEn: 'Contrôlé en', baseline: 'Baseline', cycle: 'Cycle de vie', raLong: 'Responsible / Accountable', chemin: 'Chemin au registre',
    plan: 'Plan de contenu', extrait: 'Extrait', completude: 'Critère de complétude',
    deplier: 'Déplier tous les gabarits', replier: 'Replier tous les gabarits',
    barre: "Chaque livrable porte son gabarit : le livrable tel qu'il s'écrira, rempli sur le produit fictif ChantierClair, avec ses consignes et ses formats de présentation. C1 est au standard de rédaction ; C2 à C4 montrent encore leur guide section par section.",
    automatise: ' · AUTOMATISÉ', autorite: 'Autorité', decision: 'Décision', refus: 'Chemin de refus', delai: 'Délai / expiration',
    pack: 'Pack de preuves — chaque élément obligatoire',
    activites: 'Activités', ecritDans: 'Écrit dans', separation: 'Séparation', motifClasse: 'Motif de classe',
    activitesDe: a => `Activités ${a}`, externe: 'EXTERNE, ÉPINGLÉ', noyau: 'NOYAU, GÉNÉRÉ', source: 'Source', commit: 'Commit', capacite: 'Capacité',
    livreIci: 'Livré ici', genere: 'Généré', genereNon: 'non — copie verbatim du commit épinglé, jamais régénérée ; toute modification locale fait échouer K6',
    bloque: 'bloque', portee: 'portée', etat: 'État', pourquoi: 'Pourquoi', controlePar: 'contrôlé par',
    niveau: 'Niveau', definition: 'Définition', consequence: 'Conséquence',
    protocole: 'Protocole générique — toute situation non couverte par les exceptions nommées', nommees: 'Les exceptions nommées',
    prefixe: 'Préfixe', entite: 'Entité', produiteEn: 'Produite en', amont: "Trace vers l'amont", controleeEn: 'Contrôlée en',
    classes: 'Classes de capacité — aucun nom de modèle dans le référentiel', classe: 'Classe', usage: 'Usage', cout: 'Coût relatif',
    regles: 'Les règles', modulation: 'Modulation dynamique', declencheur: 'Déclencheur', effet: 'Effet',
    porte: ' · porte ', rejetee: ' · REJETÉE', ecrit: 'Écrit', etatPropre: 'État propre', dependances: 'Dépendances', verdict: 'Verdict',
    ecartMethode: 'Écart de méthode', reexamen: 'Réexamen',
    sources: 'Sources épinglées', depot: 'Dépôt', commitEpingle: 'Commit épinglé', date: 'Date',
    adoptees: n => `Adoptées — ${n}`, rejetees: n => `Rejetées, avec motif — ${n}`, natives: 'Natives du harness — hors porte d\'adoption',
    identifiant: 'Identifiant', nature: 'Nature', nonAuditees: n => `Non auditées — ${n}, donc non adoptées`,
    obligations: "Obligations du noyau, outillage de l'adaptateur", obligation: 'Obligation portée par le noyau', ouEcrite: 'Où elle est écrite',
    outillage: "Outillage de l'adaptateur", resultat: 'Une obligation s\'écrit comme un <b>résultat vérifiable</b>, jamais comme l\'usage d\'un outil nommé.',
    porteAdoption: "Porte d'adoption — proportionnelle à la capacité d'action, neutre à l'origine", critere: 'Critère', porteCol: 'Porte',
    operation: 'Opération', arguments: 'Arguments', faitRefuse: "Ce qu'elle fait, ce qu'elle refuse",
    pouvoirs: n => `Ce qu'elle refuse — ${n} pouvoirs`, limites: n => `Ce qu'elle ne peut pas — ${n} limites, énoncées plutôt que masquées`,
    application: "Modèle d'application", element: 'Élément', ou: 'Où', transport: 'Transport', entree2: "Point d'entrée",
    declare: 'Déclaré dans', logique: 'Logique',
    dossier: 'Dossier', decouverte: 'Découverte', generee: 'Généré', sourceCol: 'Source', controleParCol: 'Contrôlé par', oui: 'oui', non: 'non',
    plafond: n => `Plafond de contexte — ${n} tokens par SKILL.md`, estimation: 'Estimation :',
    contrat: 'Contrat', jamais: 'Ne bloque jamais', quiFait: 'Qui fait quoi', navigation: 'Navigation',
    arbo: n => `Arborescence — ${n} nœuds de navigation, invariants`, noeud: 'Nœud', par: 'Par', libelle: 'Libellé', contenu: 'Contenu',
    bases: n => `Bases — ${n}`, base: 'Base', role: 'Rôle', sens: "Sens d'écriture", gel: 'Gel',
    natif: '<b>NATIF</b> — écrit ici', projection: 'projection — lecture seule',
    connexion: 'Connexion — vérifiée avant toute écriture', connecteur: 'Connecteur absent', racine: 'Emplacement racine absent',
    gateOu: 'Gate ou activité ?', corps: m => `Corps de la page — ${m}`,
    ordre: "Ordre d'exécution — un nœud déjà cartographié n'est jamais recréé", phase: 'Phase', quoi: 'Quoi', pourquoiOrdre: 'Pourquoi cet ordre',
    instanciation: "Instanciation à l'activité 1", noeuds: 'nœuds de navigation', pages: 'pages fixes', basesN: 'bases',
    lignes: 'lignes au bootstrap', differees: 'différées', gabaritsLiaison: 'Gabarits et liaison', pointeur: 'Pointeur bidirectionnel',
    stats: ['cadences', 'étapes', 'activités', 'livrables', 'gates', 'agents', 'skills', 'opérations de la tour', 'contrôles actifs', 'principes'],
    lede: "Le référentiel canonique de la Factory, en un seul endroit : ce qu'elle exécute, ce qu'elle produit, qui en répond, ce qu'elle contrôle et ce qu'elle refuse. Cette page est <b>générée depuis <code>core/method.yaml</code></b> — elle ne peut pas diverger du registre, parce qu'elle n'en est pas une copie.",
    sommaire: 'Sommaire', filtrer: 'Filtrer FactoryZen…', hint: "Le filtre porte sur l'ensemble de FactoryZen — identifiants, noms, chemins, énoncés.",
    cible: (a, n) => `<b>Référentiel CIBLE.</b> ${a} contrôles sur ${n} s'exécutent aujourd'hui sur le registre seul. Les autres ont leur algorithme écrit et attendent une arborescence produit instanciée. Un contrôle de portée projet ne rend jamais PASS faute de données.`,
    source1: "<b>Une seule source.</b> <code>core/method.yaml</code>. Cette page, les fragments servis aux agents et les gabarits d'espace de travail en sont des projections générées. Un artefact maintenu à la main à côté du registre diverge en quelques semaines : c'est la faute que P4 interdit et qu'une compilation rend impossible.",
    genereLe: d => `Généré le ${d}`,
  },
  en: {
    fige: 'freezes', autoK: 'Automatic · before activity 1', autoN: 'technical foundation written with no one involved — no question to the human',
    tache: 'Task', sortie: 'Exit', skill: 'Skill', mode: 'Mode', entree: 'Entry', verification: 'Verification', ra: 'R / A',
    livrables: 'Work products', activite: id => `Activity ${id}`,
    depart: 'Starting point', puisQ: 'then one question:', ou: 'or', fournis: 'Files provided',
    question: 'The question asked:', gardeFous: 'Guardrails', reference: f => `The full reference — ${f}`,
    gabaritOffice: n => `${n} template`, consulter: 'View', telecharger: o => `Download the .${o}`,
    resume: (nf, nfmt, nm) => `${nf} written file${nf > 1 ? 's' : ''}${nfmt ? ` · ${nfmt} presentation format${nfmt > 1 ? 's' : ''}` : ''}${nm ? ` · ${nm} machine section${nm > 1 ? 's' : ''}` : ''}`,
    pasStandard: 'not yet at the writing standard', gabarit: 'Template',
    tplStandard: 'The work product as it is written, on the ChantierClair example', tplGuide: 'Guide and example per section',
    officePptx: 'presented to an authority: one slide per section, instruction and example alongside',
    officeDocx: 'consulted and used as a reference: one section per heading, instruction and example in a box',
    consignes: 'Writing instructions, section by section', machineStd: 'Machine files and collections', sections: 'Sections',
    controleEn: 'Controlled at', baseline: 'Baseline', cycle: 'Lifecycle', raLong: 'Responsible / Accountable', chemin: 'Path in the registry',
    plan: 'Content outline', extrait: 'Excerpt', completude: 'Completion criterion',
    deplier: 'Expand all templates', replier: 'Collapse all templates',
    barre: 'Each work product carries its template: the work product as it will be written, filled in on the fictional product ChantierClair, with its instructions and its presentation formats. C1 is at the writing standard; C2 to C4 still show their guide section by section.',
    automatise: ' · AUTOMATED', autorite: 'Authority', decision: 'Decision', refus: 'Refusal routing', delai: 'Deadline / expiry',
    pack: 'Evidence pack — every item required',
    activites: 'Activities', ecritDans: 'Writes to', separation: 'Separation', motifClasse: 'Class rationale',
    activitesDe: a => `Activities ${a}`, externe: 'EXTERNAL, PINNED', noyau: 'CORE, GENERATED', source: 'Source', commit: 'Commit', capacite: 'Capability',
    livreIci: 'Delivered here', genere: 'Generated', genereNon: 'no — verbatim copy of the pinned commit, never regenerated; any local change makes K6 fail',
    bloque: 'blocks', portee: 'scope', etat: 'Status', pourquoi: 'Why', controlePar: 'controlled by',
    niveau: 'Level', definition: 'Definition', consequence: 'Consequence',
    protocole: 'Generic protocol — any situation not covered by the named exceptions', nommees: 'The named exceptions',
    prefixe: 'Prefix', entite: 'Entity', produiteEn: 'Produced at', amont: 'Traces upstream to', controleeEn: 'Controlled at',
    classes: 'Capability classes — no model name in the reference', classe: 'Class', usage: 'Usage', cout: 'Relative cost',
    regles: 'The rules', modulation: 'Dynamic modulation', declencheur: 'Trigger', effet: 'Effect',
    porte: ' · gate ', rejetee: ' · REJECTED', ecrit: 'Writes', etatPropre: 'Own state', dependances: 'Dependencies', verdict: 'Verdict',
    ecartMethode: 'Method gap', reexamen: 'Revisit',
    sources: 'Pinned sources', depot: 'Repository', commitEpingle: 'Pinned commit', date: 'Date',
    adoptees: n => `Adopted — ${n}`, rejetees: n => `Rejected, with reason — ${n}`, natives: 'Harness-native — outside the adoption gate',
    identifiant: 'Identifier', nature: 'Nature', nonAuditees: n => `Not audited — ${n}, hence not adopted`,
    obligations: 'Core obligations, adapter tooling', obligation: 'Obligation carried by the core', ouEcrite: 'Where it is written',
    outillage: 'Adapter tooling', resultat: 'An obligation is written as a <b>verifiable result</b>, never as the use of a named tool.',
    porteAdoption: 'Adoption gate — proportional to the capacity to act, neutral as to origin', critere: 'Criterion', porteCol: 'Gate',
    operation: 'Operation', arguments: 'Arguments', faitRefuse: 'What it does, what it refuses',
    pouvoirs: n => `What it refuses — ${n} powers`, limites: n => `What it cannot do — ${n} limits, stated rather than hidden`,
    application: 'Enforcement model', element: 'Element', ou: 'Where', transport: 'Transport', entree2: 'Entry point',
    declare: 'Declared in', logique: 'Logic',
    dossier: 'Directory', decouverte: 'Discovery', generee: 'Generated', sourceCol: 'Source', controleParCol: 'Controlled by', oui: 'yes', non: 'no',
    plafond: n => `Context ceiling — ${n} tokens per SKILL.md`, estimation: 'Estimate:',
    contrat: 'Contract', jamais: 'Never blocks', quiFait: 'Who does what', navigation: 'Navigation',
    arbo: n => `Tree — ${n} navigation nodes, invariant`, noeud: 'Node', par: 'Per', libelle: 'Label', contenu: 'Content',
    bases: n => `Databases — ${n}`, base: 'Database', role: 'Role', sens: 'Write direction', gel: 'Freeze',
    natif: '<b>NATIVE</b> — written here', projection: 'projection — read only',
    connexion: 'Connection — checked before any write', connecteur: 'Connector missing', racine: 'Root location missing',
    gateOu: 'Gate or activity?', corps: m => `Page body — ${m}`,
    ordre: 'Execution order — a node already mapped is never recreated', phase: 'Phase', quoi: 'What', pourquoiOrdre: 'Why this order',
    instanciation: 'Instantiation at activity 1', noeuds: 'navigation nodes', pages: 'fixed pages', basesN: 'databases',
    lignes: 'rows at bootstrap', differees: 'deferred', gabaritsLiaison: 'Templates and linking', pointeur: 'Bidirectional pointer',
    stats: ['cadences', 'steps', 'activities', 'work products', 'gates', 'agents', 'skills', 'control tower operations', 'active controls', 'principles'],
    lede: "The Factory's canonical reference, in one place: what it executes, what it produces, who answers for it, what it controls and what it refuses. This page is <b>generated from <code>core/method.yaml</code></b> — it cannot diverge from the registry, because it is not a copy of it.",
    sommaire: 'Contents', filtrer: 'Filter FactoryZen…', hint: 'The filter covers all of FactoryZen — identifiers, names, paths, statements.',
    cible: (a, n) => `<b>TARGET reference.</b> ${a} controls out of ${n} run today on the registry alone. The others have their algorithm written and are waiting for an instantiated product tree. A project-scope control never returns PASS for lack of data.`,
    source1: '<b>A single source.</b> <code>core/method.yaml</code>. This page, the fragments served to agents and the workspace templates are generated projections of it. An artifact maintained by hand next to the registry diverges within a few weeks: that is the fault P4 forbids and that a compilation makes impossible.',
    genereLe: d => `Generated on ${d}`,
  },
};

/* Le titre, le compte et l'accroche de chaque partie, par langue. */
const PARTIES = {
  fr: (r, x) => ({
    vue: ["Vue d'ensemble", `${r.cadences.length} cadences`, "Quatre boucles imbriquées qui ne tournent pas au même rythme. Le premier jalon d'un projet n'est pas un sprint : c'est G0."],
    act: ['Activités', `${r.activities.length} activités`, "Chaque activité porte ses critères d'entrée, sa tâche, sa vérification, ses critères de sortie, et un Accountable qui n'est jamais son producteur — contrôlé par K5."],
    liv: ['Livrables', `${x.presentes.length} work products`, "Pour chaque livrable : son plan de contenu, son propriétaire, et le critère qui se vérifie plutôt que se déclare. Le plan de contenu devient le squelette du fichier en Git, la page modèle dans l'espace de travail, et le contrôle de complétude au gate."],
    gat: ['Gates et checkpoint', `${r.gates.length} frontières`, "Cinq décisions humaines et un contrôle automatisé. K1 remplace deux anciens gates : ce qu'ils vérifiaient est très majoritairement décidable, et le temps humain est la ressource la plus rare de la Factory."],
    age: ['Agents', `${r.agents.length} rôles`, "Neuf rôles génériques. Les critics de domaine ne sont pas embarqués : le plugin livre le gabarit, le projet instancie."],
    arb: ['Arborescence', `${(r.plugin_layout?.directories || []).length} dossiers`, "Ce que le plugin livre, où le harness le découvre, et qui le contrôle. Un dossier découvrable que le registre ignore est une capacité hors gouvernance ; un dossier déclaré et absent est une promesse non tenue. K6 refuse les deux."],
    tow: ['Tour de contrôle', `${(r.control_tower?.operations || []).length} opérations`, "La jonction entre les agents et les étapes. Serveur MCP : seule source du fragment d'activité, seule voie vers une gate, seul point de gel d'un socle. Elle n'est pas un pare-feu — elle ne voit pas les écritures natives du harness — mais elle rend le contournement prouvable : un livrable sur disque sans déclaration au journal est un trou que K8 voit."],
    esp: ['Espace de travail', `${(r.notion_workspace?.databases || []).length} bases`, `L'espace lisible par ceux qui n'ouvriront jamais un dépôt. ${r.notion_workspace?.shape || ''} Il ne bloque jamais un gate : y adosser un contrôle mettrait un service tiers sur le chemin critique de la gouvernance.`],
    ski: ['Skills', `${r.skills.filter(s => s.origin === 'core').length} + ${r.skills.filter(s => s.origin === 'external').length}`, "Un skill existe quand un agent produit sans lui un résultat plausible mais invérifiable. Et il encode un mécanisme, jamais un contenu. Les skills du NOYAU sont projetés depuis le registre ; les skills EXTERNES sont LIVRÉS AVEC LE PLUGIN, copiés verbatim depuis un commit épinglé. Une référence sans copie ne garantissait pas leur présence à l'exécution ; une copie sans contrôle serait une seconde source de vérité. Les deux défauts sont écartés par l'empreinte : chaque fichier vendoré est rehaché à chaque contrôle."],
    ctl: ['Contrôles déterministes', `${x.nActive} / ${r.controls.length} actifs`, "La liste est CLOSE — non extensible sans Method Change Request. Plancher garanti : pre-commit et intégration continue. Un contrôle de portée projet ne rend jamais PASS faute d'instance : il rend SKIPPED."],
    pri: ['Principes', `${r.principles.length} principes`, "Six, contre treize en v4.0 : sept étaient des corollaires. Chacun porte le contrôle qui le rend opposable."],
    ech: ['Échelles', `${r.scales.length} échelles`, "Une seule échelle de risque, une seule taxonomie de sévérité. Deux étiquettes obligatoires qui ne sont pas des échelles de pilotage."],
    exc: ['Exceptions', `1 protocole + ${r.exceptions.named.length}`, "Un catalogue d'exceptions grossit d'une entrée par incident, indéfiniment. Quatre subsistent : celles dont le comportement ne se déduit pas du protocole."],
    tra: ['Traçabilité', `${r.traceability.length} entités`, "La traçabilité n'est pas un fichier, c'est une chaîne de liens typés. Un maillon manquant est un BLOCKER au gate qui en dépend."],
    rou: ['Routing', `${r.routing.rules.length} règles`, "Les règles importent davantage que toute table d'affectation : elles restent vraies quand la gamme de modèles change."],
    cap: ['Capacités externes', `${(x.ext.adopted || []).length} adoptées · ${(x.ext.rejected || []).length} rejetées`, "Toute capacité externe référencée par un adaptateur figure ici, avec sa version épinglée et son verdict d'audit. Les REJETS y figurent aussi : c'est la partie la plus utile, celle qui évite de réexaminer six mois plus tard un candidat déjà écarté. Une obligation citant une capacité absente de cette collection est une référence pendante, refusée par K6."],
    ada: ['Noyau et adaptateur', `${r.adapter_obligations.length} obligations`, "Le noyau porte l'obligation, opposable et indépendante de l'outil. L'adaptateur déclare l'outillage qui la satisfait."],
  }),
  en: (r, x) => ({
    vue: ['Overview', `${r.cadences.length} cadences`, "Four nested loops that do not turn at the same pace. A project's first milestone is not a sprint: it is G0."],
    act: ['Activities', `${r.activities.length} activities`, 'Each activity carries its entry criteria, its task, its verification, its exit criteria, and an Accountable who is never its producer — controlled by K5.'],
    liv: ['Work products', `${x.presentes.length} work products`, 'For each work product: its content outline, its owner, and the criterion that is verified rather than declared. The content outline becomes the skeleton of the file in Git, the template page in the workspace, and the completeness check at the gate.'],
    gat: ['Gates and checkpoint', `${r.gates.length} boundaries`, 'Five human decisions and one automated control. K1 replaces two former gates: what they checked is overwhelmingly decidable, and human time is the scarcest resource in the Factory.'],
    age: ['Agents', `${r.agents.length} roles`, 'Nine generic roles. Domain critics are not embedded: the plugin ships the template, the project instantiates it.'],
    arb: ['Plugin tree', `${(r.plugin_layout?.directories || []).length} directories`, 'What the plugin ships, where the harness discovers it, and who controls it. A discoverable directory the registry ignores is a capability outside governance; a declared directory that is missing is a broken promise. K6 refuses both.'],
    tow: ['Control tower', `${(r.control_tower?.operations || []).length} operations`, "The junction between the agents and the steps. MCP server: the only source of the activity fragment, the only route to a gate, the only point where a foundation is frozen. It is not a firewall — it does not see the harness's native writes — but it makes bypassing provable: a work product on disk with no declaration in the ledger is a hole K8 sees."],
    esp: ['Workspace', `${(r.notion_workspace?.databases || []).length} databases`, `The space readable by those who will never open a repository. ${r.notion_workspace?.shape || ''} It never blocks a gate: hanging a control on it would put a third-party service on the critical path of governance.`],
    ski: ['Skills', `${r.skills.filter(s => s.origin === 'core').length} + ${r.skills.filter(s => s.origin === 'external').length}`, 'A skill exists when an agent, without it, produces a plausible but unverifiable result. And it encodes a mechanism, never a content. CORE skills are projected from the registry; EXTERNAL skills are SHIPPED WITH THE PLUGIN, copied verbatim from a pinned commit. A reference without a copy did not guarantee their presence at run time; a copy without a control would be a second source of truth. Both faults are ruled out by the fingerprint: every vendored file is rehashed at every check.'],
    ctl: ['Deterministic controls', `${x.nActive} / ${r.controls.length} active`, 'The list is CLOSED — not extensible without a Method Change Request. Guaranteed floor: pre-commit and continuous integration. A project-scope control never returns PASS for lack of an instance: it returns SKIPPED.'],
    pri: ['Principles', `${r.principles.length} principles`, 'Six, against thirteen in v4.0: seven were corollaries. Each carries the control that makes it enforceable.'],
    ech: ['Scales', `${r.scales.length} scales`, 'A single risk scale, a single severity taxonomy. Two mandatory labels that are not steering scales.'],
    exc: ['Exceptions', `1 protocol + ${r.exceptions.named.length}`, 'A catalogue of exceptions grows by one entry per incident, indefinitely. Four remain: those whose behaviour cannot be deduced from the protocol.'],
    tra: ['Traceability', `${r.traceability.length} entities`, 'Traceability is not a file, it is a chain of typed links. A missing link is a BLOCKER at the gate that depends on it.'],
    rou: ['Routing', `${r.routing.rules.length} rules`, 'The rules matter more than any assignment table: they remain true when the range of models changes.'],
    cap: ['External capabilities', `${(x.ext.adopted || []).length} adopted · ${(x.ext.rejected || []).length} rejected`, 'Every external capability referenced by an adapter appears here, with its pinned version and its audit verdict. REJECTIONS appear too: it is the most useful part, the one that avoids re-examining six months later a candidate already ruled out. An obligation citing a capability missing from this collection is a dangling reference, refused by K6.'],
    ada: ['Core and adapter', `${r.adapter_obligations.length} obligations`, 'The core carries the obligation, enforceable and independent of the tool. The adapter declares the tooling that satisfies it.'],
  }),
};

const E = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const H = a => a.join('');
const srch = t => `data-t="${E(String(t).toLowerCase())}"`;
const groupBy = (list, key) => list.reduce((m, x) => ((m[x[key]] ||= []).push(x), m), {});

/* ── gabarits : le livrable tel qu'il s'écrit ──────────────────────────
   Un rendu Markdown minimal, sans dépendance : titres, paragraphes, gras, listes, citations,
   tableaux, filets. C'est tout ce qu'un gabarit au standard emploie. */
const inline = t => E(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
function mdHTML(md) {
  const L = String(md).split('\n'), out = [];
  let i = 0;
  while (i < L.length) {
    const l = L[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = /^(#{1,3}) (.+)$/.exec(l))) { out.push(`<h${m[1].length + 3} class="d${m[1].length}">${inline(m[2])}</h${m[1].length + 3}>`); i++; continue; }
    if (/^---\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (/^\|/.test(l)) {
      const rows = [];
      while (i < L.length && /^\|/.test(L[i])) rows.push(L[i++]);
      const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(rows[0]), body = rows.slice(2).map(cells);
      const vide = head.every(c => !c);
      out.push(`<table class="dt${vide ? ' kv2' : ''}">${vide ? '' : `<thead><tr>${H(head.map(c => `<th>${inline(c)}</th>`))}</tr></thead>`}<tbody>${H(body.map(r => `<tr>${H(r.map(c => `<td>${inline(c)}</td>`))}</tr>`))}</tbody></table>`);
      continue;
    }
    if (/^\s*[-*] /.test(l)) {
      const items = [];
      while (i < L.length && /^\s*[-*] /.test(L[i])) items.push(L[i++].replace(/^\s*[-*] /, ''));
      out.push(`<ul>${H(items.map(x => `<li>${inline(x)}</li>`))}</ul>`); continue;
    }
    if (/^> ?/.test(l)) {
      const q = [];
      while (i < L.length && /^> ?/.test(L[i])) q.push(L[i++].replace(/^> ?/, ''));
      out.push(`<blockquote>${inline(q.join(' '))}</blockquote>`); continue;
    }
    const p = [];
    while (i < L.length && L[i].trim() && !/^(#{1,3} |---\s*$|\||\s*[-*] |> ?)/.test(L[i])) p.push(L[i++]);
    out.push(`<p>${inline(p.join(' '))}</p>`);
  }
  return out.join('');
}

/** FactoryZen dans une langue : le HTML complet. */
export function factoryZen(lang = 'fr') {
const T = LIBELLES[lang] || LIBELLES.fr;
const r = lang === 'fr' ? registry() : registreEn(lang);
const role = s => roleEn(lang, s);
/* LES LIVRABLES PRÉSENTÉS. Les éléments internes du socle (SOC-nn) sont écrits par l'activité
   0 automatique et gouvernent le dépôt ; ils ne se présentent pas au business owner. */
const presentes = r.work_products.filter(w => !w.interne);
const CATK = Object.keys(r.categories);
const catName = k => r.categories[k]?.name ?? k;
const stepLabel = id => { const s = r.steps.find(x => x.id === id); return s ? `${s.id} — ${s.name}` : id; };
const path = w => (w.base || '') + (w.files || []).join(' · ');

/* ── vue d'ensemble ─────────────────────────────────────────────────── */
const flow = H(r.cadences.map(c => `
 <div class="fl-row"><div class="fl-cad">
   <span class="id">${E(c.id)}</span><h4>${E(c.name)}</h4>
   <div class="f">${E(c.frequence)} · ${T.fige} ${E(c.fige)}</div>
   <ul class="stepl">${H(c.steps.map(id => { const s = r.steps.find(x => x.id === id);
     return `<li><b>${E(id)}</b> ${E(s ? s.name : id)}</li>`; }))}</ul>
 </div></div>
 ${H(c.gates.map(g => `<div class="fl-g${g.startsWith('K') ? ' auto' : ''}">${E(g)}</div>`))}`));

/* ── activités ──────────────────────────────────────────────────────── */
/* UNE ACTIVITÉ AUTOMATIQUE N'EST PAS UNE ÉTAPE DU PARCOURS HUMAIN : elle se lit comme un
   bandeau replié, « avant l'activité 1 », et son détail se déplie pour qui veut l'auditer. */
const autoCard = a => `<details class="act-auto srch" ${srch(a.name + ' ' + a.task + ' ' + a.step)}>
  <summary><span class="act-auto-k">${T.autoK}</span><b>${E(a.name)}</b><span class="act-auto-n">${T.autoN}</span></summary>
  <p class="act-auto-p">${E(a.automatique)}</p>
  <dl class="kv" style="border-top:0;padding-top:0;margin-top:8px">
   <dt>${T.tache}</dt><dd>${E(a.task)}</dd><dt>${T.sortie}</dt><dd>${E(a.exit)}</dd>
   <dt>${T.skill}</dt><dd class="mono" style="font-size:12px">${E(a.skill)}</dd>
  </dl></details>`;
/* LE POINT DE DÉPART D'UNE ACTIVITÉ, CONSULTABLE : la palette en pastilles s'il en porte une,
   la question qui sera posée, puis la référence entière — dans la langue de la page quand elle
   existe (<fichier>.<langue>.md), le fichier source sinon. Les fichiers sont liés en relatif
   vers depart/<dossier>/<fichier>, que le launchpad sert depuis templates/ ; un dossier
   déclaré se déplie en ses fichiers. Une fonction : mdHTML est déclarée plus bas. */
const sousTemplates = chemin => chemin.replace(/^templates\//, '').replace(/\/$/, '');
const lienDepart = chemin => 'depart/' + sousTemplates(chemin).split('/').map(encodeURIComponent).join('/');
const departFichiers = f => {
  const abs = join(ROOT, f.chemin);
  let dossier = false;
  try { dossier = statSync(abs).isDirectory(); } catch { /* absent : lié tel quel */ }
  return dossier ? readdirSync(abs).filter(n => !n.startsWith('.')).sort().map(n => `${f.chemin.replace(/\/?$/, '/')}${n}`) : [f.chemin];
};
const departHTML = a => {
  const d = a.point_de_depart;
  if (!d) return '';
  const traduit = lang === 'fr' ? null : d.fichier.replace(/\.md$/, `.${lang}.md`);
  const fichier = traduit && existsSync(join(ROOT, traduit)) ? traduit : d.fichier;
  const md = readFileSync(join(ROOT, fichier), 'utf8');
  const couleurs = [...md.matchAll(/^\|\s*([^|]+?)\s*\|\s*`(#[0-9a-fA-F]{6})`\s*\|/gm)].map(m => ({ nom: m[1], hex: m[2] }));
  const verbes = (d.options || []).map(o => String(o).split(/\s+—\s+/)[0].toLowerCase());
  const choix = verbes.length > 1 ? `${verbes.slice(0, -1).join(', ')} ${T.ou} ${verbes[verbes.length - 1]}` : verbes.join('');
  const base = sousTemplates(d.fichier).split('/')[0] + '/';
  return `<details class="depart"><summary><span class="tpl-k">${T.depart}</span><b>${E(d.nom)}</b><span class="depart-q">${T.puisQ} ${E(choix)}</span></summary>
   ${couleurs.length ? `<div class="depart-pal">${H(couleurs.map(c => `<span class="depart-c"><i style="background:${E(c.hex)}"></i>${E(c.nom)} <span class="mono">${E(c.hex)}</span></span>`))}</div>` : ''}
   ${d.fichiers?.length ? `<p class="sub">${T.fournis}</p><ul class="depart-o">${H(d.fichiers.map(f => `<li>${H(departFichiers(f).map(c => `<a href="${E(lienDepart(c))}" target="_blank" rel="noopener"><b class="mono">${E(sousTemplates(c).slice(base.length))}</b></a>`)).replace(/<\/a><a/g, '</a> · <a')} — ${E(f.role)}</li>`))}</ul>` : ''}
   <p class="depart-qq"><b>${T.question}</b> ${E(d.question)}</p>
   <ul class="depart-o">${H(d.options.map(o => `<li>${E(o)}</li>`))}</ul>
   ${d.garde_fous?.length ? `<p class="sub">${T.gardeFous}</p><ul class="depart-o">${H(d.garde_fous.map(g => `<li>${E(g)}</li>`))}</ul>` : ''}
   <details class="depart-ref"><summary>${E(T.reference(fichier))}</summary><div class="paper">${mdHTML(md)}</div></details>
  </details>`;
};
const actCard = a => a.automatique ? autoCard(a) : `<article class="card srch" ${srch(a.name + ' ' + a.responsible + ' ' + a.task + ' ' + a.step)} style="--k:var(--navy)">
  <p class="eyebrow">${E(T.activite(a.id))} · ${E(a.cadence)}</p><h4>${E(a.name)}</h4>
  <dl class="kv" style="border-top:0;padding-top:0;margin-top:8px">
   ${a.mode ? `<dt>${T.mode}</dt><dd>${E(a.mode)}</dd>` : ''}<dt>${T.entree}</dt><dd>${E(a.entry)}</dd><dt>${T.tache}</dt><dd>${E(a.task)}</dd>
   <dt>${T.verification}</dt><dd>${E(a.verification)}</dd><dt>${T.sortie}</dt><dd>${E(a.exit)}</dd>
   <dt>${T.ra}</dt><dd>${E(role(a.responsible))} <span style="color:var(--mute)">/</span> ${E(role(a.accountable))}</dd>
   <dt>${T.skill}</dt><dd class="mono" style="font-size:12px">${E(a.skill)}</dd>
   <dt>${T.livrables}</dt><dd>${H(a.work_products.map(w => `<span class="tag">${E(w)}</span>`))}</dd>
  </dl>${departHTML(a)}</article>`;

const acts = H(r.cadences.map(c => {
  const inCad = r.activities.filter(a => a.cadence === c.id);
  const steps = groupBy(inCad, 'step');
  return `<h3 class="grp">${E(c.id)} — ${E(c.name)} · ${E(c.frequence)}</h3>` +
    H(Object.entries(steps).map(([s, list]) =>
      `<h3 class="grp" style="margin-top:18px;color:var(--slate)">${E(stepLabel(s))}</h3>
       <div class="grid g2">${H(list.map(actCard))}</div>`));
}));

/* LE GABARIT OFFICE, À CONSULTER ET À TÉLÉCHARGER. Les liens sont relatifs : la page les
   trouve à côté d'elle — sous /methodology/gabarits/ dans le launchpad, parmi les fichiers
   publiés de l'artifact. L'aperçu PDF est calculé par build/build-gabarits-pdf.mjs. Une
   autre langue a son sous-dossier : gabarits/en/. */
const sous = sousDossierOffice(lang);
const lienGabarit = f => 'gabarits/' + sous + encodeURIComponent(f);
const lienApercu = f => 'gabarits/' + sous + 'apercu/' + encodeURIComponent(f.replace(/\.(pptx|docx)$/, '.pdf'));
const nomOffice = id => nomFichierOffice(id, lang);
const officeHTML = w => {
  const o = officeDe(w.id);
  if (!o) return '';
  const f = nomOffice(w.id), nom = o === 'pptx' ? 'PowerPoint' : 'Word';
  return `<div class="wp-office"><span class="tpl-k">${E(T.gabaritOffice(nom))}</span>
   <a class="wp-office-a" href="${E(lienApercu(f))}" target="_blank" rel="noopener">${T.consulter}</a>
   <a class="wp-office-a" href="${E(lienGabarit(f))}" download="${E(f)}">${E(T.telecharger(o))}</a>
   <span class="wp-office-f">${E(f)}</span></div>`;
};

const gabaritHTML = w => {
  const a = apercuGabarit(w.id, lang);
  if (!a) return '';
  const fmts = (w.files || []).flatMap(f => formatsPortesPar(w.id, f, lang));
  const resume = a.standard ? T.resume(a.fichiers.length, fmts.length, a.machine.length) : T.pasStandard;
  return `<details class="tpl${a.standard ? ' ok' : ''}">
  <summary><span class="tpl-k">${T.gabarit}</span><span class="tpl-t">${a.standard ? T.tplStandard : T.tplGuide}</span><span class="tpl-n">${E(resume)}</span></summary>
  <div class="tpl-body">
   ${officeDe(w.id) ? `<p class="tpl-office"><span class="tpl-k">${officeDe(w.id) === 'pptx' ? 'PowerPoint' : 'Word'}</span> <a href="${E(lienGabarit(nomOffice(w.id)))}" download="${E(nomOffice(w.id))}"><b>${E(nomOffice(w.id))}</b></a> <span class="mono">dist/gabarits/${E(sous)} · apf template ${E(w.id)} --office${lang === 'fr' ? '' : ` --lang ${E(lang)}`}</span> — ${officeDe(w.id) === 'pptx' ? T.officePptx : T.officeDocx}.</p>` : ''}
   ${fmts.length ? `<div class="tpl-fmts">${H(fmts.map(f => `<div class="tpl-fmt"><b>${E(f.nom)}</b><span>${E(f.question)}</span><i>${E(f.reference)}</i></div>`))}</div>` : ''}
   ${H(a.fichiers.map(f => `<div class="tpl-file"><p class="tpl-path">${E(f.chemin)}</p><div class="paper">${mdHTML(f.md)}</div></div>`))}
   ${a.consignes.length ? `<details class="tpl-cons"><summary>${T.consignes}</summary><table class="dt"><tbody>${H(a.consignes.map(c => `<tr><td><b>${E(c.title)}</b><br><span class="mono">${E(c.file)}</span></td><td>${E(c.guide)}</td></tr>`))}</tbody></table></details>` : ''}
   ${a.machine.length ? `<div class="tpl-mach"><p class="sub">${a.standard ? T.machineStd : T.sections}</p>${H(a.machine.map(m => `<div class="tpl-sec"><b>${E(m.title)}</b> <span class="mono">${E(m.file)}</span><p>${E(m.guide)}</p><pre>${E(m.example)}</pre></div>`))}</div>` : ''}
  </div></details>`;
};

/* ── livrables ──────────────────────────────────────────────────────── */
const meta = (l, v, cls) => `<div class="mi"><dt>${E(l)}</dt><dd class="${cls || ''}">${E(v)}</dd></div>`;
const wpHTML = w => `<article class="wp srch" ${srch(w.id + ' ' + w.name + ' ' + w.purpose + ' ' + path(w))}
   style="--k:var(--c-${w.category});--kb:var(--c-${w.category}-bg)">
  <div class="wp-top"><div class="wp-id">${E(w.id)}</div>
   <div class="wp-t"><h4 class="wp-name">${E(w.name)}</h4><p class="wp-purpose">${E(w.purpose)}</p></div>
   <span class="chip">${E(catName(w.category))}</span></div>
  <dl class="wp-meta">${meta(T.activite('').trim(), w.activity)}${meta(T.controleEn, role(w.controlled_at))}${meta(T.baseline, baselineEn(lang, w.baseline))}${meta(T.cycle, w.lifecycle)}${meta(T.raLong, role(w.responsible_accountable))}</dl>
  <dl class="wp-meta">${meta(T.chemin, path(w), 'path')}</dl>
  <div class="wp-body${w.specimen ? ' has-spec' : ''}">
   <div><p class="sub">${T.plan}</p><ol class="outline">${H((w.sections || []).map(s =>
     `<li><b>${E(s.title)}</b>${s.rule ? `<span class="rule">${E(s.rule)}</span>` : ''}</li>`))}</ol></div>
   ${w.specimen ? `<div><p class="sub">${T.extrait}</p><div class="spec"><pre>${E(w.specimen)}</pre></div></div>` : ''}
  </div>
  <div class="wp-body" style="padding-top:0"><div class="done"><b>${T.completude}</b>${E(w.completion)}</div></div>
  ${officeHTML(w)}
  ${gabaritHTML(w)}
 </article>`;

const wps = `<div class="tpl-bar"><button type="button" data-tpl>${T.deplier}</button><span>${T.barre}</span></div>` + H(r.cadences.map(c => {
  const inCad = presentes.filter(w => w.cadence === c.id);
  const steps = groupBy(inCad, 'step');
  return `<h3 class="grp">${E(c.id)} — ${E(c.name)} · ${E(c.frequence)}</h3>` +
    H(Object.entries(steps).map(([s, list]) => {
      const gate = r.gates.find(g => c.gates.includes(g.id) && list.some(w => w.controlled_at === g.id));
      return `<h3 class="grp" style="margin-top:18px;color:var(--slate)">${E(stepLabel(s))}</h3>
       <div class="grid">${H(list.map(wpHTML))}</div>` +
       (gate ? `<div class="gate"><span class="g">${E(gate.id)}</span><span class="q">${E(gate.question)}</span><span class="a">${E(gate.authority)}</span></div>` : '');
    }));
}));

/* ── gates · agents · skills · contrôles ────────────────────────────── */
const gates = `<div class="grid">${H(r.gates.map(g => `
 <article class="card srch" ${srch(g.id + ' ' + g.name + ' ' + g.question)} style="--k:${g.automated ? 'var(--accent)' : 'var(--ink)'}">
  <p class="eyebrow">${E(g.id)} · ${E(g.cadence)}${g.automated ? T.automatise : ''}</p><h4>${E(g.name)}</h4>
  <p style="font-family:Spectral,serif;font-style:italic;font-size:1rem;color:var(--ink)">${E(g.question)}</p>
  <dl class="kv"><dt>${T.autorite}</dt><dd>${E(g.authority)}</dd>
   <dt>${T.decision}</dt><dd class="mono" style="font-size:11.5px">${E(g.decisions)}</dd>
   <dt>${T.refus}</dt><dd>${E(g.refusal_routing)}</dd>
   <dt>${T.delai}</dt><dd>${E(g.expiry)}</dd></dl>
  <p class="sub" style="margin-top:12px">${T.pack}</p>
  <ul class="tight">${H(g.evidence_pack.map(p => `<li>${E(p)}</li>`))}</ul></article>`))}</div>`;

const agents = `<div class="grid g2">${H(r.agents.map(a => `
 <article class="card srch" ${srch(a.id + ' ' + a.mandate)} style="--k:var(--c-reg)">
  <p class="eyebrow mono">${E(baselineEn(lang, a.capability_class))}</p>
  <h4 style="font-family:'IBM Plex Mono',monospace;font-size:.98rem">${E(a.id)}</h4><p>${E(a.mandate)}</p>
  <dl class="kv"><dt>${T.activites}</dt><dd>${E(a.activities)}</dd><dt>${T.ecritDans}</dt><dd>${E(a.write_boundary)}</dd>
   <dt>${T.separation}</dt><dd>${E(a.separation_of_duties)}</dd>
   <dt>${T.motifClasse}</dt><dd style="color:var(--slate)">${E(a.class_rationale)}</dd></dl></article>`))}</div>`;

const srcOf = id => (r.external_capabilities?.sources || []).find(x => x.id === id);
const skills = `<div class="grid g2">${H(r.skills.map(s => {
  const ext = s.origin === 'external', src = ext ? srcOf(s.source) : null;
  return `<article class="card srch" ${srch(s.id + ' ' + s.mandate + ' ' + s.origin)} style="--k:var(--c-${ext ? 'des' : 'spec'})">
  <p class="eyebrow">${E(T.activitesDe(s.activities))} · ${ext ? T.externe : T.noyau}</p>
  <h4 style="font-family:'IBM Plex Mono',monospace;font-size:.98rem">${E(s.id)}</h4><p>${E(s.mandate)}</p>
  ${ext ? `<dl class="kv"><dt>${T.source}</dt><dd class="mono">${E(src?.repository ?? s.source)}</dd>
    <dt>${T.commit}</dt><dd class="mono">${E(String(src?.pinned_commit ?? '').slice(0, 12))}</dd>
    <dt>${T.capacite}</dt><dd><span class="tag">${E(s.capability)}</span></dd>
    <dt>${T.livreIci}</dt><dd class="mono">${E(s.vendor_path)}</dd>
    <dt>${T.genere}</dt><dd>${T.genereNon}</dd></dl>` : ''}
  </article>`; }))}</div>`;

const controls = `<div class="grid g2">${H(r.controls.map(k => `
 <article class="card srch" ${srch(k.id + ' ' + k.name + ' ' + k.verifies)} style="--k:${k.implemented ? 'var(--ok)' : 'var(--mute)'}">
  <p class="eyebrow">${E(k.id)} · ${T.bloque} ${E(k.blocks)} · ${T.portee} ${E(k.scope)}</p><h4>${E(k.name)}</h4>
  <p>${E(k.verifies)}</p>
  <dl class="kv"><dt>${T.etat}</dt><dd><b>${E(k.status)}</b></dd>
   <dt>${T.pourquoi}</dt><dd style="color:var(--slate)">${E(k.rationale)}</dd></dl></article>`))}</div>`;

/* ── principes · échelles · exceptions · trace · routing · adaptateur ── */
const principles = `<div class="grid g2">${H(r.principles.map(p => `
 <article class="card srch" ${srch(p.id + ' ' + p.name + ' ' + p.rule)} style="--k:var(--accent)">
  <p class="eyebrow">${E(p.id)} · ${T.controlePar} ${E(p.controlled_by)}</p><h4>${E(p.name)}</h4><p>${E(p.rule)}</p></article>`))}</div>`;

const scales = H(r.scales.map(s => `
 <h3 class="grp">${E(s.name)}</h3>
 <div class="tblwrap srch" ${srch(s.name + ' ' + s.levels.map(l => l.id).join(' '))}><table class="tbl">
  <thead><tr><th>${T.niveau}</th><th>${T.definition}</th><th>${T.consequence}</th></tr></thead>
  <tbody>${H(s.levels.map(l => `<tr><td class="mono"><b>${E(l.id)}</b></td><td>${E(l.definition)}</td><td>${E(l.consequence)}</td></tr>`))}</tbody>
 </table></div><p class="blk-lede" style="margin-top:10px">${E(s.note)}</p>`));

const exceptions = `
 <h3 class="grp">${T.protocole}</h3>
 <div class="card" style="--k:var(--navy)"><ol class="outline">${H(r.exceptions.protocol.map(p =>
   `<li><b>${E(p.step)}</b><span class="rule">${E(p.rule)}</span></li>`))}</ol></div>
 <h3 class="grp">${T.nommees}</h3>
 <div class="grid g2">${H(r.exceptions.named.map(x => `
  <article class="card srch" ${srch(x.id + ' ' + x.situation)} style="--k:var(--crit)">
   <p class="eyebrow">${E(x.id)}</p><h4>${E(x.situation)}</h4><p>${E(x.behaviour)}</p>
   <dl class="kv"><dt>${T.autorite}</dt><dd>${E(x.authority)}</dd></dl></article>`))}</div>`;

const trace = `<div class="tblwrap"><table class="tbl">
 <thead><tr><th>${T.prefixe}</th><th>${T.entite}</th><th>${T.produiteEn}</th><th>${T.amont}</th><th>${T.controleeEn}</th></tr></thead>
 <tbody>${H(r.traceability.map(t => `<tr><td class="mono"><b>${E(t.prefix)}</b></td><td>${E(t.entity)}</td><td class="mono">${E(t.produced_at)}</td><td>${E(t.traces_to)}</td><td class="mono">${E(t.controlled_at)}</td></tr>`))}</tbody></table></div>`;

const routing = `
 <h3 class="grp">${T.classes}</h3>
 <div class="tblwrap"><table class="tbl"><thead><tr><th>${T.classe}</th><th>${T.usage}</th><th>${T.cout}</th></tr></thead>
  <tbody>${H(r.routing.classes.map(c => `<tr><td class="mono"><b>${E(c.id)}</b></td><td>${E(c.usage)}</td><td class="mono">${E(c.relative_cost)}</td></tr>`))}</tbody></table></div>
 <h3 class="grp">${T.regles}</h3>
 <div class="grid g2">${H(r.routing.rules.map(x => `<article class="card" style="--k:var(--navy)">
   <p class="eyebrow">${E(x.id)}</p><h4 style="font-size:.98rem">${E(x.rule)}</h4><p>${E(x.rationale)}</p></article>`))}</div>
 <h3 class="grp">${T.modulation}</h3>
 <div class="tblwrap"><table class="tbl"><thead><tr><th>${T.declencheur}</th><th>${T.effet}</th></tr></thead>
  <tbody>${H(r.routing.modulation.map(m => `<tr><td>${E(m.trigger)}</td><td class="mono">${E(m.effect)}</td></tr>`))}</tbody></table></div>`;

const ext = r.external_capabilities || {};
const capCard = (c, ok) => `<article class="card srch" ${srch(c.id + ' ' + (c.role || c.reason))} style="--k:${ok ? 'var(--ok)' : 'var(--crit)'}">
  <p class="eyebrow">${E(c.id)}${c.gate ? T.porte + E(c.gate) : ''}${ok ? '' : T.rejetee}</p>
  <h4 style="font-family:'IBM Plex Mono',monospace;font-size:.96rem">${E(c.id)}</h4>
  <p>${E(c.role || c.reason)}</p>
  <dl class="kv">${ok ? `<dt>${T.ecrit}</dt><dd>${E(c.audit?.writes)}</dd><dt>${T.etatPropre}</dt><dd>${E(c.audit?.state)}</dd><dt>${T.dependances}</dt><dd>${E(c.audit?.dependencies)}</dd><dt>${T.verdict}</dt><dd><b>${E(c.audit?.verdict)}</b></dd>${c.method_gap ? `<dt>${T.ecartMethode}</dt><dd style="color:var(--slate)">${E(c.method_gap)}</dd>` : ''}` : `<dt>${T.reexamen}</dt><dd>${E(c.revisit)}</dd>`}</dl></article>`;

const capabilities = `
 <h3 class="grp">${T.sources}</h3>
 <div class="tblwrap"><table class="tbl"><thead><tr><th>${T.source}</th><th>${T.depot}</th><th>${T.commitEpingle}</th><th>${T.date}</th></tr></thead>
  <tbody>${H((ext.sources || []).map(s => `<tr><td class="mono"><b>${E(s.id)}</b></td><td class="mono">${E(s.repository)}</td><td class="mono">${E(String(s.pinned_commit).slice(0, 12))}</td><td class="mono">${E(s.pinned_date)}</td></tr>`))}</tbody></table></div>
 <h3 class="grp">${T.adoptees((ext.adopted || []).length)}</h3>
 <div class="grid g2">${H((ext.adopted || []).map(c => capCard(c, true)))}</div>
 <h3 class="grp">${T.rejetees((ext.rejected || []).length)}</h3>
 <div class="grid g2">${H((ext.rejected || []).map(c => capCard(c, false)))}</div>
 <h3 class="grp">${T.natives}</h3>
 <div class="tblwrap"><table class="tbl"><thead><tr><th>${T.identifiant}</th><th>${T.nature}</th></tr></thead>
  <tbody>${H((ext.harness_native || []).map(c => `<tr><td class="mono"><b>${E(c.id)}</b></td><td>${E(c.note)}</td></tr>`))}</tbody></table></div>
 <h3 class="grp">${T.nonAuditees((ext.not_assessed || []).length)}</h3>
 <p class="blk-lede">${H((ext.not_assessed || []).map(x => `<span class="tag">${E(x)}</span>`))}</p>`;

const adapter = `
 <h3 class="grp">${T.obligations}</h3>
 <div class="tblwrap"><table class="tbl"><thead><tr><th>${T.obligation}</th><th>${T.ouEcrite}</th><th>${T.outillage}</th></tr></thead>
  <tbody>${H(r.adapter_obligations.map(o => `<tr><td>${E(o.obligation)}</td><td class="mono">${E(o.written_at)}</td><td>${E(o.tooling)}<br><span class="tag">${E(o.capability)}</span></td></tr>`))}</tbody></table></div>
 <p class="blk-lede" style="margin-top:12px">${T.resultat}</p>
 <h3 class="grp">${T.porteAdoption}</h3>
 <div class="tblwrap"><table class="tbl"><thead><tr><th>${T.niveau}</th><th>${T.critere}</th><th>${T.porteCol}</th></tr></thead>
  <tbody>${H(r.adoption_gate.map(a => `<tr><td class="mono"><b>${E(a.level)}</b></td><td>${E(a.criterion)}</td><td>${E(a.gate)}</td></tr>`))}</tbody></table></div>`;

/* ── tour de contrôle ───────────────────────────────────────────────── */
const TW = r.control_tower || { operations: [], powers: [], limits: [] };
const tower = `
 <div class="tblwrap"><table class="tbl"><thead><tr><th>${T.operation}</th><th>${T.arguments}</th><th>${T.faitRefuse}</th></tr></thead>
  <tbody>${H((TW.operations || []).map(o => `<tr><td class="mono"><b>${E(o.name)}</b></td><td class="mono">${E((o.args || []).join(' · ') || '—')}</td><td>${E(o.purpose)}</td></tr>`))}</tbody></table></div>
 <h3 class="grp">${T.pouvoirs((TW.powers || []).length)}</h3>
 <div class="grid g2">${H((TW.powers || []).map(x => `<article class="card srch" ${srch(x)} style="--k:var(--ok)"><p>${E(x)}</p></article>`))}</div>
 <h3 class="grp">${T.limites((TW.limits || []).length)}</h3>
 <div class="grid g2">${H((TW.limits || []).map(x => `<article class="card srch" ${srch(x)} style="--k:var(--warn,#b45309)"><p>${E(x)}</p></article>`))}</div>
 <h3 class="grp">${T.application}</h3>
 <p class="blk-lede">${E(TW.enforcement_model)}</p>
 <div class="tblwrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>${T.element}</th><th>${T.ou}</th></tr></thead><tbody>
  <tr><td>${T.transport}</td><td class="mono">${E(TW.transport)}</td></tr>
  <tr><td>${T.entree2}</td><td class="mono">${E(TW.entrypoint)}</td></tr>
  <tr><td>${T.declare}</td><td class="mono">${E(TW.declared_in)}</td></tr>
  <tr><td>${T.logique}</td><td class="mono">${E(TW.logic)}</td></tr>
  <tr><td>${T.etat}</td><td class="mono">${E(TW.state)}</td></tr>
 </tbody></table></div>`;

/* ── arborescence du plugin ─────────────────────────────────────────── */
const PL = r.plugin_layout || { directories: [], context_budget: {} };
const layout = `
 <div class="tblwrap"><table class="tbl"><thead><tr><th>${T.dossier}</th><th>${T.decouverte}</th><th>${T.generee}</th><th>${T.sourceCol}</th><th>${T.controleParCol}</th></tr></thead>
  <tbody>${H((PL.directories || []).map(d => `<tr><td class="mono"><b>${E(d.path)}</b></td><td>${E(d.discovery)}</td><td>${d.generated ? T.oui : T.non}</td><td>${E(d.source)}</td><td class="mono">${E(d.controlled_by)}</td></tr>`))}</tbody></table></div>
 <h3 class="grp">${E(T.plafond(PL.context_budget?.skill_md_tokens ?? ''))}</h3>
 <p class="blk-lede">${E(PL.context_budget?.rationale)}</p>
 <p class="blk-lede" style="margin-top:8px"><b>${T.estimation}</b> ${E(PL.context_budget?.estimator)}</p>`;

/* ── espace de travail lisible ──────────────────────────────────────── */
const N = r.notion_workspace || { databases: [], tree: [] };
const nplan = (() => { try { return JSON.parse(execSync('node ' + join(ROOT, 'bin/apf') + ' notion plan', { encoding: 'utf8' })); }
                       catch { return null; } })();
const workspace = `
 <div class="grid g2">
  <article class="card" style="--k:var(--ok)"><p class="eyebrow">${T.contrat}</p><p>${E(N.contract)}</p></article>
  <article class="card" style="--k:var(--warn,#b45309)"><p class="eyebrow">${T.jamais}</p><p>${E(N.never_blocks)}</p></article>
  <article class="card" style="--k:var(--navy)"><p class="eyebrow">${T.quiFait}</p><p>${E(N.execution)}</p></article>
  <article class="card" style="--k:var(--navy)"><p class="eyebrow">${T.navigation}</p><p>${E(N.navigation?.principle)}</p></article>
 </div>
 <h3 class="grp">${E(T.arbo(N.navigation?.fixed_nodes ?? ''))}</h3>
 <div class="tblwrap"><table class="tbl"><thead><tr><th>${T.noeud}</th><th>${T.par}</th><th>${T.libelle}</th><th>${T.contenu}</th></tr></thead>
  <tbody>${H((N.tree || []).map(t => `<tr><td class="mono"><b>${E(t.kind)}</b></td><td class="mono">${E(t.per || '—')}</td><td class="mono">${E(t.label)}</td><td>${E(t.content || '')}</td></tr>`))}</tbody></table></div>
 <p class="blk-lede" style="margin-top:10px">${E(N.navigation?.growth)}</p>
 <h3 class="grp">${E(T.bases((N.databases || []).length))}</h3>
 <div class="tblwrap"><table class="tbl"><thead><tr><th>${T.base}</th><th>${T.role}</th><th>${T.sens}</th><th>${T.gel}</th></tr></thead>
  <tbody>${H((N.databases || []).map(d => `<tr><td class="mono"><b>${E(d.id)}</b></td><td>${d.role === 'natif' ? T.natif : T.projection}</td><td class="mono">${E(d.writes)}</td><td>${E(d.frozen_at || '—')}</td></tr>`))}</tbody></table></div>
 <h3 class="grp">${T.connexion}</h3>
 <div class="grid g2">
  <article class="card" style="--k:var(--crit)"><p class="eyebrow">${T.connecteur}</p><p>${E(N.connector?.on_absence)}</p></article>
  <article class="card" style="--k:var(--crit)"><p class="eyebrow">${T.racine}</p><p>${E(N.root_location?.what)}</p><p><b>${E(N.root_location?.on_absence)}</b></p></article>
  <article class="card" style="--k:var(--warn,#b45309)"><p class="eyebrow">${T.gateOu}</p><p>${E(N.may_block_an_activity)}</p></article>
  <article class="card" style="--k:var(--c-des)"><p class="eyebrow">${E(T.corps(N.page_body?.mode ?? ''))}</p><p>${E(N.page_body?.rule)}</p><p>${E(N.page_body?.comments)}</p></article>
 </div>
 <h3 class="grp">${T.ordre}</h3>
 <div class="tblwrap"><table class="tbl"><thead><tr><th>${T.phase}</th><th>${T.quoi}</th><th>${T.pourquoiOrdre}</th></tr></thead>
  <tbody>${H((N.execution_order?.phases || []).map(ph => `<tr><td class="mono"><b>${E(ph.id)}</b></td><td>${E(ph.name)}</td><td>${E(ph.note || '')}</td></tr>`))}</tbody></table></div>
 <h3 class="grp">${T.instanciation}</h3>
 ${nplan ? `<div class="stats" style="margin:0 0 12px">
   <div class="st"><b>${E(nplan.summary.noeuds_navigation)}</b><span>${T.noeuds}</span></div>
   <div class="st"><b>${E(nplan.summary.pages_totales)}</b><span>${T.pages}</span></div>
   <div class="st"><b>${E(nplan.summary.bases)}</b><span>${T.basesN}</span></div>
   <div class="st"><b>${E(nplan.summary.lignes_instanciees)}</b><span>${T.lignes}</span></div>
   <div class="st"><b>${E(nplan.summary.lignes_differees)}</b><span>${T.differees}</span></div>
  </div>` : ''}
 <p class="blk-lede">${E(N.instantiation?.rationale)} ${E(N.instantiation?.idempotent)}</p>
 <h3 class="grp">${T.gabaritsLiaison}</h3>
 <div class="grid g2">
  <article class="card" style="--k:var(--c-des)"><p class="eyebrow">${T.gabarit}</p><p>${E(N.templates?.rule)}</p></article>
  <article class="card" style="--k:var(--c-spec)"><p class="eyebrow">${T.pointeur}</p><p>${E(N.link?.shape)}</p><p>${E(N.link?.rationale)}</p></article>
 </div>`;

/* ── assemblage ─────────────────────────────────────────────────────── */
const nSteps = new Set(r.activities.map(a => a.cadence + a.step)).size;
const nActive = r.controls.filter(c => c.implemented).length;
const P = (PARTIES[lang] || PARTIES.fr)(r, { presentes, nActive, ext });
const CORPS = { vue: flow, act: acts, liv: wps, gat: gates, age: agents, arb: layout, tow: tower, esp: workspace, ski: skills,
  ctl: controls, pri: principles, ech: scales, exc: exceptions, tra: trace, rou: routing, cap: capabilities, ada: adapter };
const SECTIONS = Object.keys(CORPS).map(id => [id, P[id][0], P[id][1], CORPS[id], P[id][2]]);

const STATS = [r.cadences.length, nSteps, r.activities.length, presentes.length, r.gates.length, r.agents.length,
  r.skills.length, (r.control_tower?.operations || []).length, `${nActive}/${r.controls.length}`, r.principles.length].map((v, i) => [v, T.stats[i]]);

let head = readFileSync(join(ROOT, 'build/factoryzen-head.html'), 'utf8');
if (lang !== 'fr') head = head.replace('<title>FactoryZen</title>', `<title>FactoryZen</title>\n<!-- ${lang.toUpperCase()} : core/method.yaml lu à travers core/i18n/${lang}.yaml et core/i18n/templates.${lang}.yaml. -->`);
void CATK;

const html = head + `<div class="shell">
<header class="mast">
  <p class="kicker">${E(r.method.name)} · v${E(r.method.version)}</p>
  <h1>FactoryZen</h1>
  <p class="lede">${T.lede}</p>
  <div class="stats">${H(STATS.map(([v, l]) => `<div class="st"><b>${E(v)}</b><span>${E(l)}</span></div>`))}</div>
</header>
<div class="cols">
  <nav class="rail" aria-label="${T.sommaire}">
    <input class="find" id="find" type="search" placeholder="${T.filtrer}" autocomplete="off">
    <ul class="railList">${H(SECTIONS.map(([id, t, n]) => `<li><a href="#${id}">${E(t)}<i>${E(String(n).split(' ')[0])}</i></a></li>`))}</ul>
    <p class="hint">${T.hint}</p>
  </nav>
  <main>${H(SECTIONS.map(([id, t, n, body, lede]) =>
    `<section class="blk" id="${id}"><div class="blk-h"><h2>${E(t)}</h2><span class="num">${E(n)}</span></div>
     <p class="blk-lede">${E(lede)}</p>${body}</section>`))}</main>
</div>
<footer>
  <p>${T.cible(E(nActive), E(r.controls.length))}</p>
  <p>${T.source1}</p>
  <p class="mono" style="font-size:11.5px;color:var(--mute)">${T.genereLe(new Date().toISOString().slice(0, 10))} · ${E(r.method.status)}</p>
</footer></div>
<script>
document.querySelectorAll('[data-tpl]').forEach(b=>b.addEventListener('click',()=>{
 const tous=[...document.querySelectorAll('details.tpl')];const ouvrir=tous.some(d=>!d.open);
 tous.forEach(d=>d.open=ouvrir);document.querySelectorAll('[data-tpl]').forEach(x=>x.textContent=ouvrir?'${T.replier.replace(/'/g, "\\'")}':'${T.deplier.replace(/'/g, "\\'")}');}));
const find=document.getElementById('find');
find.addEventListener('input',()=>{
 const q=find.value.trim().toLowerCase();
 document.querySelectorAll('.srch').forEach(el=>el.classList.toggle('hidden',q.length>1&&!el.dataset.t.includes(q)));
 document.querySelectorAll('section.blk').forEach(s=>{
   const items=s.querySelectorAll('.srch');
   const vis=[...items].filter(i=>!i.classList.contains('hidden')).length;
   s.classList.toggle('hidden',q.length>1&&items.length>0&&vis===0);});
});
</script>`;
return { html, r, presentes, nActive };
}

/* FactoryZen dans chaque langue de la méthode : dist/FactoryZen.html, dist/FactoryZen.<langue>.html. */
export const fichierFactoryZen = lang => lang === 'fr' ? 'dist/FactoryZen.html' : `dist/FactoryZen.${lang}.html`;

import { resolve as resoudre } from 'node:path';
import { fileURLToPath } from 'node:url';
if (process.argv[1] && resoudre(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { LANGUES } = await import('../lib/i18n.mjs');
  mkdirSync(join(ROOT, 'dist'), { recursive: true });
  for (const lang of LANGUES) {
    const { html, r, presentes, nActive } = factoryZen(lang);
    writeFileSync(join(ROOT, fichierFactoryZen(lang)), html);
    console.log(`${fichierFactoryZen(lang)} — ${(html.length / 1024).toFixed(1)} ko · ${r.activities.length} activités · ${presentes.length} livrables · ${nActive}/${r.controls.length} contrôles actifs`);
  }
}
