import {downloadBlob} from "./download";

type Cell = string | number | null | undefined;
type Dropdowns = Record<number, string[] | {formula: string}>;
type SimpleWorkbookOptions = {
  dropdowns?: Dropdowns;
  lockedColumns?: number[];
  referenceColumns?: number[];
  hiddenColumns?: number[];
  columnWidths?: number[];
  textColumns?: number[];
  headerColors?: Record<number,'green'|'red'>;
  headerHeight?: number;
  rowHeight?: number;
  borderedTable?: boolean;
  maxBytes?: number;
};

export async function readWorkbookRows(file: File, options: { preserveAllRows?: boolean; preserveSheetRowNumbers?: boolean; rejectFormulaColumns?: string[]; maxExpandedBytes?: number; maxRows?: number; maxColumns?: number; meaningfulHeaders?: string[]; expectedFirstSheetName?: string; allowedSheetNames?: string[]; rejectAllFormulas?: boolean } = {}): Promise<string> {
  const entries = await unzip(await file.arrayBuffer(), options.maxExpandedBytes);
  const firstSheet = /<sheet\b[^>]*\/>/.exec(textEntry(entries, "xl/workbook.xml"))?.[0] ?? '';
  const sheetNames = [...textEntry(entries, 'xl/workbook.xml').matchAll(/<sheet\b[^>]*\/>/g)].map(match=>unescapeXml(attr(match[0],'name')??''));
  if(options.expectedFirstSheetName && sheetNames[0]!==options.expectedFirstSheetName) throw new Error('首张工作表与当前模式不匹配，请使用对应模板。');
  if(options.allowedSheetNames && (sheetNames.some(name=>!options.allowedSheetNames!.includes(name)) || new Set(sheetNames).size!==sheetNames.length)) throw new Error('文件含未知或重复业务工作表，请使用对应模板。');
  const relationshipId = attr(firstSheet, 'r:id');
  const relationship = [...textEntry(entries, "xl/_rels/workbook.xml.rels").matchAll(/<Relationship\b[^>]*\/>/g)]
    .find(match => attr(match[0], 'Id') === relationshipId)?.[0] ?? '';
  const target = attr(relationship, 'Target');
  if (!target || attr(relationship, 'TargetMode') === 'External') throw new Error('无法读取 XLSX 首张工作表。');
  const sheetXml = textEntry(entries, new URL(unescapeXml(target), 'https://workbook.invalid/xl/').pathname.slice(1));
  const sharedStrings = parseSharedStrings(textEntry(entries, "xl/sharedStrings.xml", true));
  const dateStyles = parseDateStyles(textEntry(entries, "xl/styles.xml", true));
  const rows = parseSheetRows(sheetXml, sharedStrings, dateStyles, options.maxRows, options.maxColumns, options.preserveSheetRowNumbers, new Set(options.rejectFormulaColumns),options.rejectAllFormulas);
  const selectedRows = options.preserveAllRows || options.preserveSheetRowNumbers ? rows : keepBusinessRows(rows,options.meaningfulHeaders);
  return selectedRows.map((row) => {
    const cells = options.preserveAllRows
      ? Array.from({ length: Math.max(rows[0]?.length ?? 0, row.length) }, (_, index) => row[index] ?? "")
      : row;
    return cells.map(csvEscape).join(",");
  }).join("\r\n");
}

export function downloadSimpleWorkbook(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: Cell[][],
  options: SimpleWorkbookOptions = {},
) {
  downloadMultiSheetWorkbook(filename, [{name: sheetName, headers, rows, options}]);
}

export function downloadMultiSheetWorkbook(
  filename: string,
  sheets: Array<{ name: string; headers: string[]; rows: Cell[][]; options?: SimpleWorkbookOptions; hidden?: boolean }>,
) {
  downloadWorkbook(filename,buildMultiSheetWorkbook(sheets),sheets[0]?.options?.maxBytes);
}

export function buildMultiSheetWorkbook(sheets:Array<{ name: string; headers: string[]; rows: Cell[][]; options?: SimpleWorkbookOptions; hidden?: boolean }>) {
  return formattedWorkbookBytes(sheets.map(sheet => ({
    name: sheet.name,
    hidden: sheet.hidden,
    xml: simpleSheetXml(
      sheet.headers, sheet.rows, sheet.options?.dropdowns ?? {}, sheet.options?.lockedColumns ?? [],
      sheet.options?.referenceColumns ?? [], sheet.options?.columnWidths, sheet.options?.hiddenColumns ?? [],
      sheet.options?.headerColors ?? {}, sheet.options?.headerHeight,
      sheet.options?.rowHeight, sheet.options?.borderedTable, sheet.options?.textColumns,
    ),
  })), stylesXml());
}

export function downloadFormattedWorkbook(
  filename: string,
  sheets: Array<{ name: string; xml: string; hidden?: boolean }>,
  styles: string = stylesXml(),
  maxBytes?: number,
) {
  downloadWorkbook(filename,formattedWorkbookBytes(sheets,styles),maxBytes);
}

function formattedWorkbookBytes(sheets:Array<{name:string;xml:string;hidden?:boolean}>,styles:string) {
  const files: Record<string, string> = {
    "[Content_Types].xml": multiSheetContentTypesXml(sheets.length),
    "_rels/.rels": relsXml(),
    "xl/workbook.xml": multiSheetWorkbookXml(sheets.map((sheet) => sheet.name), sheets.flatMap((sheet,index) => sheet.hidden ? [index] : [])),
    "xl/_rels/workbook.xml.rels": multiSheetWorkbookRelsXml(sheets.length),
    "xl/styles.xml": styles,
  };
  sheets.forEach((sheet, index) => {
    files[`xl/worksheets/sheet${index + 1}.xml`] = sheet.xml;
  });
  return zip(files);
}

function multiSheetContentTypesXml(count: number) {
  const sheets = Array.from({ length: count }, (_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
}

function relsXml() {
  return `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
}

function multiSheetWorkbookXml(sheetNames: string[], hiddenSheets: number[] = []) {
  const sheets = sheetNames.map((sheetName, index) => `<sheet name="${escapeXml(sheetName)}" sheetId="${index + 1}" r:id="rId${index + 1}"${hiddenSheets.includes(index) ? ' state="hidden"' : ''}/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets}</sheets><calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`;
}

function multiSheetWorkbookRelsXml(count: number) {
  const sheets = Array.from({ length: count }, (_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets}<Relationship Id="rId${count + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
}

function simpleSheetXml(headers: string[], rows: Cell[][], dropdowns: Dropdowns, lockedColumns: number[], referenceColumns: number[], columnWidths?: number[], hiddenColumns: number[] = [], headerColors: Record<number,'green'|'red'> = {}, headerHeight?: number, rowHeight?: number, borderedTable = false, textColumns: number[] = []) {
  const allRows = [headers, ...rows];
  const reference = new Set([...lockedColumns,...referenceColumns]);
  const hidden = new Set(hiddenColumns);
  const cells = allRows.map((row, rowIndex) => {
    const height=rowIndex===0?headerHeight:rowHeight;
    return `<row r="${rowIndex + 1}"${height ? ` ht="${height}" customHeight="1"` : ''}>${row.map((cell, columnIndex) => simpleCellXml(rowIndex + 1, columnIndex + 1, cell, reference, headerColors[columnIndex + 1], borderedTable, textColumns.includes(columnIndex + 1))).join("")}</row>`;
  }).join("");
  const maxRow = Math.max(rows.length + 1, 100);
  const validations = Object.entries(dropdowns).map(([column, values]) => {
    const formula = Array.isArray(values) ? `"${escapeXml(values.map((value) => value.replaceAll('"', '""')).join(","))}"` : escapeXml(values.formula);
    const col = columnName(Number(column));
    return `<dataValidation type="list" allowBlank="1" showErrorMessage="0" sqref="${col}2:${col}${maxRow}"><formula1>${formula}</formula1></dataValidation>`;
  }).join("");
  const protection = lockedColumns.length ? '<sheetProtection sheet="1" objects="1" scenarios="1"/>' : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>${headers.map((_, index) => `<col min="${index + 1}" max="${index + 1}" width="${columnWidths?.[index] ?? (index === 0 ? 20 : 14)}" customWidth="1"${textColumns.includes(index + 1) ? ' style="11"' : ''}${hidden.has(index + 1) ? ' hidden="1"' : ''}/>`).join("")}</cols><sheetData>${cells}</sheetData>${protection}${validations ? `<dataValidations count="${Object.keys(dropdowns).length}">${validations}</dataValidations>` : ""}</worksheet>`;
}

function simpleCellXml(row: number, column: number, value: Cell, lockedColumns: Set<number>, headerColor?: 'green'|'red', borderedTable = false, textOnly = false) {
  const ref = `${columnName(column)}${row}`;
  const styleId = row === 1 ? (headerColor==='green' ? 4 : 1) : lockedColumns.has(column) ? 2 : 3;
  const style = ` s="${textOnly&&row>1?(lockedColumns.has(column)?12:11):row===1&&headerColor==='red'?(borderedTable?10:9):styleId+(borderedTable?4:0)}"`;
  if (!textOnly && typeof value === "string" && value.startsWith("=")) return `<c r="${ref}"${style}><f>${escapeXml(value.slice(1))}</f></c>`;
  if (!textOnly && typeof value === "number") return `<c r="${ref}"${style}><v>${value}</v></c>`;
  const content=String(value ?? "");
  return `<c r="${ref}" t="inlineStr"${style}><is><t${/\s/.test(content.slice(0,1)+content.slice(-1))||/[\r\n]/.test(content)?' xml:space="preserve"':''}>${escapeXml(content)}</t></is></c>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFECEFF3"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF92D050"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFF0000"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="13"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyProtection="1"><protection locked="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyProtection="1"><protection locked="0"/></xf><xf numFmtId="0" fontId="1" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyProtection="1"><protection locked="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyProtection="1"><protection locked="0"/></xf><xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyProtection="1"><protection locked="0"/></xf><xf numFmtId="49" fontId="0" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyProtection="1"><protection locked="1"/></xf></cellXfs></styleSheet>`;
}

function downloadWorkbook(filename: string, bytes: Uint8Array, maxBytes = Infinity) {
  if (bytes.byteLength > maxBytes) throw new Error(`导出文件超过${Math.round(maxBytes/1_000_000)}MB，请缩小筛选或分批选择。`);
  downloadBlob(filename, new Blob([arrayBufferFrom(bytes)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
}

function zip(files: Record<string, string>) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(text);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(8, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    chunks.push(local, data);
    const dir = new Uint8Array(46 + nameBytes.length);
    const dirView = new DataView(dir.buffer);
    dirView.setUint32(0, 0x02014b50, true);
    dirView.setUint16(4, 20, true);
    dirView.setUint16(6, 20, true);
    dirView.setUint32(16, crc, true);
    dirView.setUint32(20, data.length, true);
    dirView.setUint32(24, data.length, true);
    dirView.setUint16(28, nameBytes.length, true);
    dirView.setUint32(42, offset, true);
    dir.set(nameBytes, 46);
    central.push(dir);
    offset += local.length + data.length;
  }
  const centralOffset = offset;
  const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, central.length, true);
  endView.setUint16(10, central.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, centralOffset, true);
  return concat([...chunks, ...central, end]);
}

async function unzip(buffer: ArrayBuffer, maxBytes = Infinity) {
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder();
  const entries = new Map<string, string>();
  const eocd = findEndOfCentralDirectory(bytes);
  const dirOffset = new DataView(bytes.buffer, bytes.byteOffset + eocd).getUint32(16, true);
  const dirCount = new DataView(bytes.buffer, bytes.byteOffset + eocd).getUint16(10, true);
  let offset = dirOffset;
  let expanded = 0;
  for (let entryIndex = 0; entryIndex < dirCount; entryIndex += 1) {
    const dirView = new DataView(bytes.buffer, bytes.byteOffset + offset);
    if (dirView.getUint32(0, true) !== 0x02014b50) break;
    const method = dirView.getUint16(10, true);
    const compressedSize = dirView.getUint32(20, true);
    const expandedSize = dirView.getUint32(24, true);
    if (expanded + expandedSize > maxBytes) throw new Error('XLSX 展开内容过大，请减少行数或另存 CSV。');
    const nameLength = dirView.getUint16(28, true);
    const extraLength = dirView.getUint16(30, true);
    const commentLength = dirView.getUint16(32, true);
    const localOffset = dirView.getUint32(42, true);
    const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    const localView = new DataView(bytes.buffer, bytes.byteOffset + localOffset);
    const localNameLength = localView.getUint16(26, true);
    const localExtraLength = localView.getUint16(28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const data = bytes.slice(dataStart, dataStart + compressedSize);
    if (method !== 0 && method !== 8) throw new Error('不支持此 XLSX 压缩格式。');
    const content = method === 0 ? data : await inflateRaw(data, maxBytes - expanded);
    expanded += content.byteLength;
    if (expanded > maxBytes) throw new Error('XLSX 展开内容过大，请减少行数或另存 CSV。');
    entries.set(name, decoder.decode(content));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function findEndOfCentralDirectory(bytes: Uint8Array) {
  for (let index = bytes.length - 22; index >= 0; index -= 1) {
    if (new DataView(bytes.buffer, bytes.byteOffset + index).getUint32(0, true) === 0x06054b50) return index;
  }
  throw new Error("无法读取 XLSX 文件目录。");
}

async function inflateRaw(data: Uint8Array, maxBytes: number) {
  const stream = new Blob([arrayBufferFrom(data)]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {await reader.cancel(); throw new Error('XLSX 展开内容过大，请减少行数或另存 CSV。');}
      chunks.push(value);
    }
  } finally {reader.releaseLock();}
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {result.set(chunk, offset); offset += chunk.byteLength;}
  return result;
}

function arrayBufferFrom(bytes: Uint8Array) {
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}

function textEntry(entries: Map<string, string>, name: string, optional = false) {
  const value = entries.get(name);
  if (value === undefined && !optional) throw new Error("无法读取 XLSX 工作表。");
  return value ?? "";
}

function parseSharedStrings(xml: string) {
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(match => cellText(match[1]));
}

function cellText(xml: string) {
  return [...xml.replace(/<rPh\b[^>]*>[\s\S]*?<\/rPh>/g, '').matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
    .map(match => unescapeXml(match[1])).join('');
}

function parseSheetRows(xml: string, sharedStrings: string[], dateStyles: Set<number> = new Set(), maxRows = Infinity, maxColumns = 16384, preserveSheetRowNumbers = false, rejectFormulaColumns: Set<string> = new Set(), rejectAllFormulas = false) {
  const rows: string[][] = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rowNumber = Number(/\br="(\d+)"/.exec(rowMatch[0].slice(0,rowMatch[0].indexOf('>')+1))?.[1] ?? rows.length+1);
    if (preserveSheetRowNumbers && (!Number.isSafeInteger(rowNumber) || rowNumber<=rows.length || rowNumber>maxRows)) throw new Error('XLSX 行地址超出允许范围。');
    const values: string[] = [];
    for (const cellMatch of (rowMatch[1] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = /r="([A-Z]+)\d+"/.exec(cellMatch[1])?.[1] ?? "A";
      const index = columnIndex(ref) - 1;
      if (index < 0 || index >= maxColumns) throw new Error('XLSX 列地址超出允许范围，请使用导入模板。');
      const type = /t="([^"]+)"/.exec(cellMatch[1])?.[1];
      const styleIndex = Number(/s="(\d+)"/.exec(cellMatch[1])?.[1] ?? -1);
      const body = cellMatch[2] ?? '';
      if (/<f\b/.test(body)) {
        if (rejectAllFormulas || rejectFormulaColumns.has((rows[0]?.[index] ?? '').trim())) throw new Error(`可写列或系统列含公式：${rows[0][index]}`);
        values[index] = "";
        continue;
      }
      const raw = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";
      if (type === 'inlineStr') { values[index] = cellText(body); continue; }
      values[index] = type === "s"
        ? sharedStrings[Number(raw)] ?? ""
        : dateStyles.has(styleIndex) && isNumeric(raw)
          ? excelSerialDate(Number(raw))
          : unescapeXml(raw);
    }
    if (preserveSheetRowNumbers) {
      while (rows.length<rowNumber-1) rows.push([]);
      rows.push(values.map(value => value ?? ''));
    } else if (values.some(Boolean)) rows.push(values.map(value => value ?? ''));
    if (rows.length > maxRows) throw new Error('XLSX 数据行数过多，请拆分文件。');
  }
  return rows;
}

function parseDateStyles(stylesXml: string) {
  const customDateFormats = new Set<number>();
  for (const match of stylesXml.matchAll(/<numFmt\b[^>]*\/>/g)) {
    const numFmtId = Number(attr(match[0], "numFmtId") ?? -1);
    const formatCode = attr(match[0], "formatCode") ?? "";
    if (numFmtId >= 0 && isDateFormat(unescapeXml(formatCode))) customDateFormats.add(numFmtId);
  }
  const dateStyles = new Set<number>();
  const cellXfs = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(stylesXml)?.[1] ?? "";
  [...cellXfs.matchAll(/<xf\b[^>]*\/>|<xf\b[^>]*>[\s\S]*?<\/xf>/g)].forEach((match, index) => {
    const numFmtId = Number(attr(match[0], "numFmtId") ?? 0);
    if (isBuiltinDateFormat(numFmtId) || customDateFormats.has(numFmtId)) dateStyles.add(index);
  });
  return dateStyles;
}

function attr(xml: string, name: string) {
  return new RegExp(`${name}="([^"]*)"`).exec(xml)?.[1];
}

function isBuiltinDateFormat(numFmtId: number) {
  return (
    (numFmtId >= 14 && numFmtId <= 22) ||
    (numFmtId >= 27 && numFmtId <= 36) ||
    (numFmtId >= 45 && numFmtId <= 47) ||
    (numFmtId >= 50 && numFmtId <= 58)
  );
}

function isDateFormat(formatCode: string) {
  const stripped = formatCode
    .replace(/"[^"]*"/g, "")
    .replace(/\\./g, "")
    .replace(/\[[^\]]*]/g, "")
    .toLowerCase();
  return /[ymd]/.test(stripped) && !/[#0?]/.test(stripped.replace(/[ymdhsa\/:\-.\s]/g, ""));
}

function isNumeric(value: string) {
  return /^-?\d+(?:\.\d+)?$/.test(value.trim());
}

function excelSerialDate(serial: number) {
  const millis = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(millis).toISOString().slice(0, 10);
}

function keepBusinessRows(rows: string[][], meaningful?: string[]) {
  if(!meaningful)return rows;
  const [headers, ...body] = rows;
  if (!headers) return rows;
  const meaningfulHeaders = new Set(meaningful);
  const meaningfulIndexes = headers
    .map((header, index) => meaningfulHeaders.has(header) ? index : -1)
    .filter((index) => index >= 0);
  return [
    headers,
    ...body.filter((row) => meaningfulIndexes.some((index) => String(row[index] ?? "").trim())),
  ];
}

function csvEscape(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function concat(chunks: Uint8Array[]) {
  const output = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function columnName(index: number) {
  let name = "";
  while (index > 0) {
    const mod = (index - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    index = Math.floor((index - mod) / 26);
  }
  return name;
}

function columnIndex(name: string) {
  return [...name].reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0);
}

export function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function unescapeXml(value: string) {
  return value.replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_, code: string) => String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code)))
    .replaceAll("&quot;", '"').replaceAll('&apos;', "'").replaceAll("&gt;", ">").replaceAll("&lt;", "<").replaceAll("&amp;", "&");
}
