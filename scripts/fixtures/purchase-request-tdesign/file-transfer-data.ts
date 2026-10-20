import { parseCsvRows } from '../../../src/lib/csv';

export type FileTable = { headers: string[]; rows: (string | number)[][] };
export const maxImportBytes = 2 * 1024 * 1024;
export const maxImportRows = 5000;

export function readImportTable(text: string, headers: string[]): FileTable {
  if (new TextEncoder().encode(text).length > maxImportBytes) throw new Error('文件超过 2 MB，请拆分后再导入。');
  const [actual, ...rows] = parseCsvRows(text);
  if (!actual || actual.length !== headers.length || new Set(actual).size !== actual.length || headers.some(header => !actual.includes(header))) {
    throw new Error('表头不匹配，请使用本页下载的 CSV 模板，保留全部列名。');
  }
  if (!rows.length) throw new Error('文件只有表头或没有数据，请填写至少一行。');
  if (rows.length > maxImportRows) throw new Error(`单次最多导入 ${maxImportRows} 行，请拆分文件。`);
  const indexes = headers.map(header => actual.indexOf(header));
  return { headers: [...headers], rows: rows.map((row, index) => {
    if (row.length !== headers.length) throw new Error(`第 ${index + 2} 行列数不正确，请检查逗号和引号。`);
    if (row.some(cell => cell.length > 10000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(cell))) throw new Error(`第 ${index + 2} 行包含过长内容或不支持的控制字符。`);
    if (!row[indexes[0]].trim()) throw new Error(`第 ${index + 2} 行“${headers[0]}”不能为空。`);
    return indexes.map(column => row[column]);
  }) };
}

export function fileTableCsv(data: FileTable): string {
  const cell = (value: string | number) => {
    const raw = String(value);
    const safe = typeof value === 'string' && /^[\s]*[=+@-]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return '\ufeff' + [data.headers, ...data.rows].map(row => row.map(cell).join(',')).join('\r\n');
}
