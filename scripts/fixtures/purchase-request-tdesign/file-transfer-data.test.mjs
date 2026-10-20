import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

function load(path, dependencies = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('exports', 'require', code)(exports, name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency ${name}`);
    return dependencies[name];
  });
  return exports;
}
const csv = load('../../../src/lib/csv.ts');
const { readImportTable, fileTableCsv, maxImportRows, maxImportBytes } = load('./file-transfer-data.ts', { '../../../src/lib/csv': csv });
const headers = ['编号', '名称', '数量'];

test('CSV export and import preserve Chinese, quoted multiline cells and leading zeros', () => {
  const data = { headers, rows: [['00123', '示例,\n"收纳箱"', 12], ['002', '第二件', 0]] };
  const text = fileTableCsv(data);
  assert.ok(text.startsWith('\ufeff'));
  assert.deepEqual(readImportTable(text, headers), { headers, rows: data.rows.map(row => row.map(String)) });
});

test('header order may change but missing, extra and duplicated headers fail', () => {
  assert.deepEqual(readImportTable('名称,数量,编号\n商品,8,001', headers).rows, [['001', '商品', '8']]);
  for (const text of ['编号,名称\n1,商品', '编号,名称,数量,额外\n1,商品,1,x', '编号,名称,名称\n1,商品,x']) assert.throws(() => readImportTable(text, headers), /表头/);
});

test('empty files, malformed rows, empty identities and oversized files are rejected', () => {
  for (const text of ['', '编号,名称,数量', '编号,名称,数量\n1,商品', '编号,名称,数量\n,商品,2', '编号,名称,数量\n1,"商品,2']) assert.throws(() => readImportTable(text, headers));
  assert.throws(() => readImportTable('x'.repeat(maxImportBytes + 1), headers), /2 MB/);
  assert.throws(() => readImportTable('编号,名称,数量\n' + '1,商品,2\n'.repeat(maxImportRows + 1), headers), /5000/);
  assert.throws(() => readImportTable('编号,名称,数量\n1,坏\u0000内容,2', headers), /控制字符/);
});

test('exports neutralize spreadsheet formulas including whitespace prefixes', () => {
  const values = ['=SUM(1,2)', ' \t+cmd', '@formula', '-command'];
  const data = { headers: ['值'], rows: values.map(value => [value]) };
  assert.deepEqual(csv.parseCsvRows(fileTableCsv(data)).slice(1).flat(), values.map(value => `'${value}`));
  assert.deepEqual(csv.parseCsvRows(fileTableCsv({ headers: ['数值'], rows: [[-12]] })), [['数值'], ['-12']]);
});
