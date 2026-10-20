import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
function load(file, dependencies = {}) {
  const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(name => { assert.ok(name in dependencies, `Unexpected import: ${name}`); return dependencies[name]; }, exports);
  return exports;
}
const history = load('./history.ts'), csvLib = load('../../../src/lib/csv.ts'), links = load('./link-maintenance-data.ts', { './history': history });
const transfer = load('./link-transfer-data.ts', { '../../../src/lib/csv': csvLib, './link-maintenance-data': links });
const csv = values => values.map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
test('all three create templates accept their own headers without failure-report columns', () => {
  const state = links.initialLinkState();
  for (const [kind, rows] of [['reviews', state.reviews], ['sOrders', state.sOrders], ['vines', state.vines]]) {
    assert.deepEqual(transfer.previewLinkWorkbook(kind, 'create', rows, csv([transfer.headersFor(kind, 'create')])), []);
  }
});
test('Review XLSX operator and result modes preserve boundaries and per-row errors', () => {
  const rows = links.initialLinkState().reviews, headers = transfer.headersFor('reviews', 'operator');
  const input = csv([headers, transfer.exportRow('reviews', 'operator', rows[0]).map((value, index) => headers[index] === '直评操作需求' ? '新的操作要求' : value), transfer.exportRow('reviews', 'operator', rows[1]).map((value, index) => headers[index] === '版本' ? '99' : value)]);
  const plans = transfer.previewLinkWorkbook('reviews', 'operator', rows, input);
  assert.equal(plans[0].errors.length, 0); assert.match(plans[1].errors.join(), /版本/);
  const result = transfer.commitLinkWorkbook('reviews', 'operator', rows, plans, false);
  assert.equal(result.rows[0].requirement, '新的操作要求'); assert.equal(result.rows[1].version, rows[1].version);
  assert.deepEqual(result.plans.map(plan => plan.done), [true, false]);
  const retryHeaders = [...headers, '原始行号', '错误说明'];
  const repaired = transfer.exportRow('reviews', 'operator', rows[0]); repaired[headers.indexOf('直评操作需求')] = '修正后的需求';
  const retry = transfer.previewLinkWorkbook('reviews', 'operator', rows, csv([retryHeaders, [...repaired, '3', '旧版本已修正']]));
  assert.equal(retry[0].errors.length, 0); assert.equal(retry[0].selected, true);
  const resource = rows[1], resultHeaders = transfer.headersFor('reviews', 'result');
  const resourcePlan = transfer.previewLinkWorkbook('reviews', 'result', rows, csv([resultHeaders, resultHeaders.map(header => ({ '需求ID': resource.id, '版本': resource.version, '资源显示状态': '已掉评', '实际上评日期': '2026-10-16' })[header] ?? '')]));
  assert.match(resourcePlan[0].errors.join(), /资源显示结果|当前状态|原因/);
});
test('Vine XLSX preview rejects whole batch when any row is invalid and skips unchanged', () => {
  const rows = links.initialLinkState().vines, target = rows[3], headers = transfer.headersFor('vines', 'progress');
  const unchanged = transfer.previewLinkWorkbook('vines', 'progress', rows, csv([headers, transfer.exportRow('vines', 'progress', target)]));
  assert.equal(unchanged[0].skipped, true);
  const good = transfer.exportRow('vines', 'progress', target).map((value, index) => headers[index] === '认领数量' ? '16' : value);
  const bad = [...good]; bad[headers.indexOf('需求ID')] = 'missing-id';
  const plans = transfer.previewLinkWorkbook('vines', 'progress', rows, csv([headers, good, bad]));
  assert.equal(plans[0].errors.length, 0); assert.ok(plans[1].errors.length);
  assert.throws(() => transfer.commitLinkWorkbook('vines', 'progress', rows, plans, false), /整批/);
  assert.equal(rows[3].claimed, 15);
});
