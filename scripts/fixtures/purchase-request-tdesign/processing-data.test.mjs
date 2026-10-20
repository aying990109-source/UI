import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// In-memory transpilation follows the repository's fixture tests; no temporary artifacts.
function load(file, dependencies = {}) {
  const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(name => { assert.ok(name in dependencies, `Unexpected import: ${name}`); return dependencies[name]; }, exports);
  return exports;
}
const history = load('./history.ts');
const requests = load('./data.ts', { './history': history });
const data = load('./processing-data.ts', { './data': requests, './history': history });

test('request timelines stop at known events and rejection never invents approval', () => {
  for (const row of requests.sampleRows) {
    assert.equal(row.timeline[0].label, '提交申请');
    assert.deepEqual(row.timeline.map(event => event.time), row.timeline.map(event => event.time).sort());
    const expected = { 审批中: '提交申请', 采购复审: '审批通过', 待采购: '采购复审通过', 已下单: '采购下单', 运输中: '运输中', 已到港: '已到港', 已上架: '已上架', 已驳回: '审批驳回' };
    assert.equal(row.timeline.at(-1).label, expected[row.status]);
    if (row.status === '已驳回') assert.deepEqual(row.timeline.map(event => event.label), ['提交申请', '审批驳回']);
  }
});

test('request fixtures cover every filter status and only pending requests need approval', () => {
  assert.deepEqual(new Set(requests.sampleRows.map(row => row.status)), new Set(requests.requestStages));
  for (const row of requests.sampleRows) {
    assert.ok(requests.stageTheme[row.status]);
    if (row.awaitingMyApproval) assert.equal(row.status, '审批中');
  }
});

test('processing history reflects its own review phase and partial order quantity', () => {
  for (const row of data.purchaseLines) {
    assert.equal(row.timeline.some(event => event.label === '采购复审通过'), !row.review);
    assert.equal(row.timeline.some(event => event.label === '采购下单'), row.ordered > 0);
    assert.deepEqual(row.timeline.map(event => event.time), row.timeline.map(event => event.time).sort());
  }
  assert.match(data.purchaseLines[12].timeline.at(-1).comment, /本次下单 168 件，未下单 192 件/);
});

test('review edits retain earlier history, original values and the full adjustment reason', () => {
  const row = data.purchaseLines[0], before = structuredClone(row);
  const reason = '补充活动备货\n已核对库存与整箱数量';
  const saved = data.saveReviewDetails(row, { ...row, planned: 372, adjustmentReason: reason });
  assert.deepEqual(saved.timeline.slice(0, -1), row.timeline);
  assert.equal(saved.timeline.length, row.timeline.length + 1);
  assert.match(saved.timeline.at(-1).comment, /计划采购量：360 → 372/);
  assert.ok(saved.timeline.at(-1).comment.includes(reason));
  assert.equal(saved.timeline.at(-1).operator, '演示用户');
  assert.deepEqual(row, before, 'Saving must not rewrite prior records');
  assert.deepEqual(data.saveReviewDetails(saved, { ...saved }).timeline, saved.timeline, 'Unchanged saves must not create events');
});

test('seeded ordered and remaining quantities retain whole cartons', () => {
  for (const row of data.purchaseLines.filter(row => row.executionCarton)) {
    assert.equal(row.ordered % row.executionCarton, 0, row.id);
    assert.equal(data.remaining(row) % row.executionCarton, 0, row.id);
  }
  assert.equal(data.purchaseLines[12].ordered, 168);
  assert.equal(data.remaining(data.purchaseLines[12]), 192);
});

test('preview preserves supplier/company/type boundaries and the remaining quantity', () => {
  const eligible = data.purchaseLines.filter(row => !row.review && data.remaining(row) > 0 && !data.missingFields(row).length);
  const before = structuredClone(eligible);
  const orders = data.previewOrders(eligible, 50);
  assert.ok(orders.length > 1);
  assert.equal(orders.flatMap(order => order.lines).reduce((n, row) => n + row.planned, 0), eligible.reduce((n, row) => n + data.remaining(row), 0));
  for (const order of orders) for (const row of order.lines) {
    assert.equal(row.supplier, order.supplier);
    assert.equal(row.company, order.company);
    assert.equal(row.purchaseType, order.purchaseType);
  }
  const partial = eligible.find(row => row.ordered > 0);
  assert.ok(partial);
  assert.equal(orders.flatMap(order => order.lines).find(row => row.id === partial.id).planned, partial.planned - partial.ordered);
  assert.deepEqual(eligible, before, 'Preview must not mutate source records');
  assert.deepEqual(data.previewOrders(eligible.map(row => ({ ...row, ordered: row.planned })), 60), [], 'Fully ordered sources cannot generate again');
});

test('unreviewed, missing supplier/price/carton and empty selections cannot generate', () => {
  const ready = data.purchaseLines.find(row => !row.review && !data.missingFields(row).length && data.remaining(row) > 0);
  assert.ok(ready);
  for (const patch of [{ review: true }, { supplier: '' }, { price: null }, { price: 0 }, { executionCarton: null }]) {
    assert.deepEqual(data.previewOrders([{ ...ready, ...patch }], 1), []);
  }
  assert.deepEqual(data.previewOrders([], 1), []);
});
