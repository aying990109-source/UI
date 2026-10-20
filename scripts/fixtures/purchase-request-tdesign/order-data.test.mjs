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
const history = load('./history.ts'), data = load('./order-data.ts', { './history': history });
const draft = { order: 'SALE-DEMO-TEST', shop: data.orderShops[0], group: data.orderGroups[0], items: [{ id: 'new-item', model: 'MODEL', product: '测试商品', color: '灰色', quantity: 2 }], remark: '核实问题说明', reason: '商品破损' };
const parcel = (item, quantity, overrides = {}) => ({ id: 'new-parcel', order: '', channel: '', tracking: 'DEMO-TRACK', status: '未登记', date: data.today(), handler: '演示用户', allocations: { [item.id]: quantity }, ...overrides });

test('daily maintenance deduplicates orders and includes lines outside selection without changing source facts', () => {
  const state = data.initialOrderState(), before = structuredClone(state);
  const next = data.updateDaily(state, [state.daily[0].id, state.daily[1].id], '已发货', '核对完成');
  assert.deepEqual(state, before);
  const changed = next.daily.filter(row => row.order === state.daily[0].order);
  assert.equal(changed.length, 2);
  for (const row of changed) { assert.equal(row.status, '已发货'); assert.equal(row.remark, '核对完成'); assert.equal(row.timeline.length, 2); }
  assert.equal(next.daily[2], state.daily[2]); assert.equal(changed[0].address, state.daily[0].address);
  assert.deepEqual(data.updateDaily(next, [changed[0].id], '已发货', '核对完成'), next);
  const reverted = data.updateDaily(next, [changed[0].id], '待发货'); assert.equal(reverted.daily[1].remark, '核对完成');
  assert.throws(() => data.updateDaily(state, [], '已发货')); assert.throws(() => data.updateDaily(state, ['missing'], '已发货'));
});

test('independent registration and direct reshipment never infer association from matching order numbers', () => {
  const initial = data.initialOrderState();
  let state = data.createAfterSale(initial, draft); const source = state.afterSales[0];
  state = data.createAfterSale(state, draft); assert.equal(state.afterSales.length, initial.afterSales.length + 2);
  state = data.createDirectReshipment(state, draft);
  assert.equal(state.reshipments[0].sourceId, ''); assert.equal(data.currentReshipments(state, source.id).length, 0);
  assert.deepEqual(state.daily, initial.daily);
  for (const quantity of [0, -1, 1.5, Infinity, NaN]) assert.throws(() => data.createAfterSale(initial, { ...draft, items: [{ ...draft.items[0], quantity }] }));
  assert.throws(() => data.createAfterSale(initial, { ...draft, reason: '' }));
  assert.throws(() => data.createDirectReshipment(initial, { ...draft, group: 'unknown' }));
});

test('follow-up creates one linked application atomically and preserves independent repeated purposes', () => {
  const state = data.initialOrderState(), source = state.afterSales[1], item = source.items[0], before = structuredClone(state);
  assert.throws(() => data.followAfterSale(state, source.id, '补发', '', '', { [item.id]: 1 }));
  assert.throws(() => data.followAfterSale(state, source.id, '补发', '说明', '', { [item.id]: item.quantity + 1 }));
  assert.throws(() => data.followAfterSale(state, source.id, '补发', '说明', '', { missing: 1 }));
  assert.deepEqual(state, before);
  let next = data.followAfterSale(state, source.id, '补发', '补发处理', '', { [item.id]: item.quantity });
  assert.equal(next.reshipments.length, state.reshipments.length + 1); assert.equal(next.reshipments[0].sourceId, source.id);
  assert.equal(next.afterSales.find(row => row.id === source.id).status, '处理中');
  next = data.followAfterSale(next, source.id, '换货', '新的独立申请', '', { [item.id]: item.quantity });
  assert.equal(next.reshipments[0].purpose, '换货'); assert.equal(next.reshipments[1].purpose, '补发');
});

test('parcel allocation checks aggregate quantities, required facts and explicit status without closing source', () => {
  let state = data.createDirectReshipment(data.initialOrderState(), draft); const request = state.reshipments[0], item = request.items[0];
  for (const parcels of [[parcel(item, 3)], [parcel(item, 1.5)], [parcel(item, 1, { date: '2026-02-30' })], [parcel(item, 1, { handler: ' ' })], [parcel(item, 1), parcel(item, 2, { id: 'second' })]]) assert.throws(() => data.saveParcels(state, request.id, parcels, ''));
  state = data.saveParcels(state, request.id, [parcel(item, 1)], ''); assert.equal(state.reshipments[0].parcels[0].status, '未登记'); assert.equal(data.reshipmentStage(state.reshipments[0]), '已登记');
  state = data.saveParcels(state, request.id, [parcel(item, 1, { status: '已签收' }), parcel(item, 1, { id: 'second', status: '已签收' })], ''); assert.equal(data.reshipmentStage(state.reshipments[0]), '已签收');
  const linked = state.reshipments.find(row => row.sourceId), source = state.afterSales.find(row => row.id === linked.sourceId);
  const next = data.saveParcels(state, linked.id, [parcel(linked.items[0], linked.items[0].quantity, { status: '已签收' })], '');
  assert.deepEqual(next.afterSales.find(row => row.id === source.id), source); assert.equal(source.status, '处理中');
});

test('current projection excludes deleted requests while history retains changes and removal, no resurrection', () => {
  let state = data.initialOrderState(); const request = state.reshipments[1], source = state.afterSales.find(row => row.id === request.sourceId);
  const beforeHistory = data.afterTimeline(state, source).length;
  state = data.saveParcels(state, request.id, request.parcels, '仅改备注');
  assert.equal(data.afterTimeline(state, source).length, beforeHistory);
  state = data.saveParcels(state, request.id, [], '清空发货资料'); assert.equal(data.reshipmentStage(state.reshipments[1]), '待登记');
  assert.equal(data.afterTimeline(state, source).length, beforeHistory + 1);
  assert.throws(() => data.deleteReshipment(state, request.id, ' '));
  state = data.deleteReshipment(state, request.id, '重复申请');
  assert.equal(data.currentReshipments(state, source.id).length, 0); assert.equal(data.afterTimeline(state, source).at(-1).label, '删除补发申请');
  assert.deepEqual(state.afterSales.find(row => row.id === source.id), source);
  assert.throws(() => data.saveParcels(state, request.id, request.parcels, '')); assert.throws(() => data.deleteReshipment(state, request.id, '重复'));
});

test('parcel history preserves metadata, same-total item reallocation and concurrent remark edits', () => {
  const items = [draft.items[0], { ...draft.items[0], id: 'second-item', product: '第二商品', model: 'SECOND' }];
  let state = data.createDirectReshipment(data.initialOrderState(), { ...draft, items });
  const request = state.reshipments[0];
  const before = parcel(items[0], 1, { order: 'ERP-BEFORE', channel: '渠道甲', date: '2026-10-15', handler: '处理人甲' });
  state = data.saveParcels(state, request.id, [before], '旧备注');
  for (const [key, value] of Object.entries({ order: 'ERP-AFTER', channel: '渠道乙', date: '2026-10-16', handler: '处理人乙' })) {
    const next = data.saveParcels(state, request.id, [{ ...before, [key]: value }], '旧备注');
    const comment = next.reshipments[0].timeline.at(-1).comment;
    assert.ok(comment.includes(`${before[key]} → ${value}`), `${key} must retain before and after`);
  }
  state = data.saveParcels(state, request.id, [{ ...before, allocations: { [items[1].id]: 1 } }], '新备注');
  const comment = state.reshipments[0].timeline.at(-1).comment;
  assert.match(comment, /测试商品.*1 → 0 件/); assert.match(comment, /第二商品.*0 → 1 件/);
  assert.ok(comment.includes('旧备注 → 新备注'));
  const final = data.saveParcels(state, request.id, state.reshipments[0].parcels, '');
  assert.equal(final.reshipments[0].timeline.at(-1).label, '修改备注');
  assert.ok(final.reshipments[0].timeline.at(-1).comment.includes('新备注 → 未填写'));
  assert.ok(state.reshipments[0].timeline.some(entry => entry.comment.includes('新增包裹 1')));
});

test('manual closure clears schedule, rejects follow-up until reopened, histories remain chronological', () => {
  let state = data.initialOrderState(); const source = state.afterSales[1];
  assert.throws(() => data.followAfterSale(state, source.id, '沟通跟进', '说明', '2020-01-01'));
  state = data.followAfterSale(state, source.id, '结案', '问题已解决'); const closed = state.afterSales.find(row => row.id === source.id);
  assert.equal(closed.status, '已结案'); assert.equal(closed.nextDate, '');
  assert.throws(() => data.followAfterSale(state, source.id, '沟通跟进', '说明'));
  state = data.followAfterSale(state, source.id, '重新打开', '顾客补充问题'); const reopened = state.afterSales.find(row => row.id === source.id);
  assert.equal(reopened.status, '处理中'); assert.equal(reopened.resolution, '');
  for (const row of [...state.daily, ...state.afterSales, ...state.reshipments]) assert.deepEqual(row.timeline.map(event => event.time), row.timeline.map(event => event.time).sort());
});
