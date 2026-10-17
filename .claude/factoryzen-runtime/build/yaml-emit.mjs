/* Émetteur YAML déterministe, sans dépendance.
   Réémettre le registre doit produire un diff minimal et lisible en PR :
   un registre qu'on ne peut pas relire dans une revue n'est pas une source. */
const needsQuote = s =>
  /^[\s]|[\s]$|^[-?:,\[\]{}#&*!|>'"%@`]|:\s|\s#|^$|^(true|false|null|yes|no|on|off|~)$|^[\d.+-]+$/i.test(s);

function scalar(v, ind) {
  if (v === null || v === undefined) return '~';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  const s = String(v);
  if (s.includes('\n')) return '|-\n' + s.split('\n').map(l => ' '.repeat(ind + 2) + l).join('\n');
  if (s.length > 92 || needsQuote(s)) return JSON.stringify(s);
  return s;
}

export function emit(o, ind = 0) {
  const p = ' '.repeat(ind);
  if (Array.isArray(o)) return o.map(v =>
    (v && typeof v === 'object')
      ? p + '- ' + emit(v, ind + 2).replace(/^\s+/, '')
      : p + '- ' + scalar(v, ind)).join('\n');
  return Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) return `${p}${k}:\n${emit(v, ind + 2)}`;
    if (Array.isArray(v)) return v.length ? `${p}${k}:\n${emit(v, ind + 2)}` : `${p}${k}: []`;
    return `${p}${k}: ${scalar(v, ind)}`;
  }).join('\n');
}
