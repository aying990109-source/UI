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
const data = load('./link-maintenance-data.ts', { './history': load('./history.ts') });
test('review, S order and Vine keep approval separate from resource/progress', () => {
  const initial = data.initialLinkState();
  assert.ok(initial.reviews.every(row => row.asin.length === 10));
  assert.ok(initial.sOrders.every(row => row.asin.length === 10));
  assert.ok(initial.vines.every(row => row.asin.length === 10));
  const review = initial.reviews[4];
  assert.throws(() => data.reviewAction([review], review.id, review.version, 'result', { resource: 'hidden', shownOn: review.shownOn }), /原因/);
  const corrected = data.reviewAction([review], review.id, review.version, 'result', { resource: 'hidden', shownOn: review.shownOn, reason: '核对展示状态' })[0];
  assert.equal(corrected.shownOn, ''); assert.equal(corrected.approval, 'approved');
  const edited = data.saveReview([initial.reviews[0]], { ...initial.reviews[0], requirement: '更新后的真实操作需求' }, initial.reviews[0].id, initial.reviews[0].version)[0];
  assert.throws(() => data.reviewAction([edited], edited.id, 1, 'approve'), /版本/);
  const sOrder = initial.sOrders[1];
  const result = data.sOrderAction([sOrder], sOrder.id, sOrder.version, 'result', { resourceCode: 'RESOURCE-2', accountSituation: '正常', reviewResult: '已展示', feedbackResult: '待观察' })[0];
  assert.equal(result.approval, 'approved'); assert.equal(result.resourceCode, 'RESOURCE-2');
  const vine = initial.vines[1];
  assert.throws(() => data.vineAction([vine], vine.id, vine.version, 'correction', { reason: '核对', submittedOn: '2026-10-17' }), /首次提报/);
  assert.equal(data.vineStatus(vine), '未提报');
  const day90 = { ...initial.vines[3], submittedOn: '2026-07-20', claimed: 1, reviews: 0 };
  assert.equal(data.vineStatus(day90, '2026-10-18'), '进行中');
  assert.equal(data.vineStatus(day90, '2026-10-19'), '已结束 · 期限届满');
});
