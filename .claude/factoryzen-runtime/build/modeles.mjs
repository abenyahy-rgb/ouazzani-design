/* LA TABLE DES MODÈLES DE L'ADAPTATEUR CLAUDE CODE — par classe de capacité, par ordre de
 * préférence. Le noyau (core/method.yaml) ne nomme aucun modèle : il raisonne en classes,
 * et la correspondance appartient à l'adaptateur. Un producteur prend le premier modèle de
 * sa classe ; un juge, le premier qui n'est celui d'aucun producteur (R5). Le classement
 * d'un modèle dans une classe est une déclaration, à recalibrer sur preuve. Un modèle que le
 * compte ne sert pas casse le sous-agent qui le nomme : le retirer d'ici suffit à revenir à
 * un verdict déclaré CORRÉLÉ. Lu par build/build-adapter.mjs et par K6 (lib/checks.mjs). */
export const MODELES_PAR_CLASSE = {
  'ÉCONOMIQUE':    ['haiku'],
  'INTERMÉDIAIRE': ['sonnet'],
  'AVANCÉE':       ['opus'],
  /* MCR-004 — choix du porteur : aucun rôle sur Fable. Fable coûtait 2,5 fois Opus par jeton
     et les critics y passaient le plus clair du budget ; la classe la plus haute est servie par
     Opus 5.5. Sans second modèle, les critics sont CORRÉLÉS (R5) et le disent : leur
     indépendance vient désormais du porteur, qui tranche chaque critique. */
  'POINTE':        ['opus'],
};

/* L'échelle d'effort du registre (routing.efforts) et sa traduction dans l'adaptateur. */
export const EFFORT_ADAPTATEUR = { 'faible': 'low', 'moyen': 'medium', 'élevé': 'high', 'très élevé': 'xhigh', 'maximal': 'max' };

const RANG = ['ÉCONOMIQUE', 'INTERMÉDIAIRE', 'AVANCÉE', 'POINTE'];
const modelesDe = cls => MODELES_PAR_CLASSE[cls] || [];

/* Les classes des producteurs : chaque rôle nommé responsable d'une activité. */
const classesDesProducteurs = r => {
  const clsOf = id => r.agents.find(a => a.id === id)?.capability_class, cls = [];
  for (const a of r.activities)
    for (const who of String(a.responsible).split(/ (?:et|puis) |·/).map(x => x.trim()))
      if (RANG.includes(clsOf(who))) cls.push(clsOf(who));
  return cls;
};

/* R1 — le juge n'est jamais sur une classe inférieure au producteur. La classe d'un critic
   n'est PAS une valeur par défaut : elle est DÉRIVÉE du maximum des classes des producteurs
   qu'il juge. Tant qu'elle était un `?? opus`, R1 n'était satisfaite que par coïncidence. */
export const classeDuJuge = r => RANG[Math.max(0, ...classesDesProducteurs(r).map(c => RANG.indexOf(c)))];

/* R5 — le juge tourne sur un autre MODÈLE que ses producteurs : le premier modèle de la
   classe dérivée par R1, ou d'une classe supérieure, qui n'est celui d'aucun producteur.
   À défaut, le même modèle, déclaré CORRÉLÉ : R1 passe avant R5, la différence ne s'achète
   jamais par une classe inférieure. */
export function modeleDuJuge(r) {
  const cls = classeDuJuge(r);
  const prod = [...new Set(classesDesProducteurs(r).map(c => modelesDe(c)[0]).filter(Boolean))];
  for (const c of RANG.slice(RANG.indexOf(cls)))
    for (const m of modelesDe(c)) if (!prod.includes(m)) return { model: m, independance: 'DISTINCT', producteurs: prod };
  return { model: modelesDe(cls)[0] ?? 'opus', independance: 'CORRÉLÉ', producteurs: prod };
}
