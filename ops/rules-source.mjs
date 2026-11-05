// Firebase Rules can contain comments. Keep the original source for rollback;
// strip comments only for JSON validation and semantic hash comparison.
export function parseRulesSource(source) {
  if (typeof source !== 'string') throw new Error('Rules source must be text');
  let clean = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i], next = source[i + 1];
    if (quoted) {
      clean += char;
      if (char === '\\') { if (next !== undefined) clean += source[++i]; }
      else if (char === '"') quoted = false;
    } else if (char === '"') {
      quoted = true;clean += char;
    } else if (char === '/' && next === '/') {
      clean += ' ';i++;
      while (i + 1 < source.length && !/[\r\n]/.test(source[i + 1])) i++;
    } else if (char === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      if (end < 0) throw new Error('Unterminated rules comment');
      clean += ' ';i = end + 1;
    } else clean += char;
  }
  return JSON.parse(clean);
}
