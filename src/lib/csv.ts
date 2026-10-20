// Preview only; the server remains responsible for business validation.
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  function finish() { row.push(cell); if (row.some(value => value.trim())) rows.push(row); row = []; cell = ''; }
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted || !cell) quoted = !quoted;
      else cell += char;
    } else if (!quoted && char === ',') { row.push(cell); cell = ''; }
    else if (!quoted && (char === '\n' || char === '\r')) { finish(); if (char === '\r' && source[i + 1] === '\n') i++; }
    else cell += char;
  }
  if (quoted) throw new Error('CSV 引号未闭合，请检查内容后重试。');
  if (cell || row.length) finish();
  return rows;
}
