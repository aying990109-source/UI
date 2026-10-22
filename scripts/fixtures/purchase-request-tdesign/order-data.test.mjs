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
const daily = load('./daily-shipping-data.ts', { './order-data': data });
const reshipmentView = load('./reshipment-data.ts', { './order-data': data });

test('reshipment display preserves each allocation and remainder without multiplying quantities', () => {
  const state = data.initialOrderState(), before = structuredClone(state);
  const request = state.reshipments.find(row => row.id === 'BF-DEMO-0004');
  const lines = reshipmentView.reshipmentLines([request]);
  assert.equal(lines.length, 4);
  assert.equal(lines.filter(line => line.first).length, 1);
  assert.equal(lines[0].span, 4);
  assert.equal(new Set(lines.map(line => line.id)).size, lines.length);
  for (const item of request.items) assert.equal(lines.filter(line => line.item.id === item.id).reduce((sum, line) => sum + line.quantity, 0), item.quantity);
  assert.equal(lines.find(line => !line.parcel).quantity, 1);
  assert.equal(reshipmentView.reshipmentCreation(request).operator, '林晓（示例）');
  assert.deepEqual(state, before);
});

test('reshipment filters keep whole requests and require shipping filters on the same parcel', () => {
  const records = data.initialOrderState().reshipments;
  const filter = changes => reshipmentView.filterReshipments(records, { ...reshipmentView.emptyReshipmentFilters, ...changes });
  assert.deepEqual(filter({ query: 'track-demo-003-a' }).map(row => row.id), ['BF-DEMO-0004']);
  assert.equal(reshipmentView.reshipmentLines(filter({ query: 'track-demo-003-a' })).length, 4);
  assert.equal(filter({ status: '运输中', handler: '周宁' }).length, 0);
  assert.equal(filter({ status: '运输中', handler: '陈晨', channel: '标准', shippedDates: ['2026-10-18', '2026-10-18'] }).length, 1);
  assert.equal(filter({ creator: '林晓', createdDates: ['2026-10-18', '2026-10-18'] }).length, 0);
  assert.equal(filter({ creator: '林晓', createdDates: ['2026-10-17', '2026-10-17'] }).length, 1);
  assert.equal(filter({ query: 'not-found' }).length, 0);
  const deleted = data.deleteReshipment(data.initialOrderState(), 'BF-DEMO-0004', '测试删除');
  assert.equal(reshipmentView.filterReshipments(deleted.reshipments, { ...reshipmentView.emptyReshipmentFilters, query: 'SALE-DEMO-0007' }).length, 0);
});

test('reshipment export includes all 15 business fields with independent order and date meanings', () => {
  const request = data.initialOrderState().reshipments.find(row => row.id === 'BF-DEMO-0004');
  const output = reshipmentView.reshipmentExport([request]);
  const fields = ['店铺名', '原始订单编号', '型号', '颜色', '数量', '备注', '创建人', '组别', '处理人', '补发系统单号', '补发日期', '发货渠道', '运单号', '运输状态', '创建日期'];
  for (const field of fields) assert.ok(output.headers.includes(field), field);
  assert.equal(output.rows.length, 4);
  const cell = (row, field) => row[output.headers.indexOf(field)];
  assert.equal(output.rows.reduce((sum, row) => sum + cell(row, '数量'), 0), 5);
  assert.equal(cell(output.rows[0], '原始订单编号'), 'SALE-DEMO-0007');
  assert.equal(cell(output.rows[0], '补发系统单号'), 'ERP-DEMO-003-A');
  assert.equal(cell(output.rows[0], '创建日期'), '2026-10-17 09:30:00');
  assert.equal(cell(output.rows[0], '补发日期'), '2026-10-18');
  assert.equal(cell(output.rows[3], '补发日期'), '');
  assert.equal(cell(output.rows[3], '运输状态'), '未分包');
});
const draft = { order: 'SALE-DEMO-TEST', shop: data.orderShops[0], group: data.orderGroups[0], items: [{ id: 'new-item', model: 'MODEL', product: '测试商品', color: '灰色', quantity: 2 }], remark: '核实问题说明', reason: '商品破损' };
test('follow-up plans use Beijing calendar days across month, year and leap boundaries', () => {
  assert.equal(data.afterSaleToday(new Date('2026-10-20T16:01:00Z')), '2026-10-21');
  assert.equal(data.afterSaleToday(new Date('2026-10-20T15:59:00Z')), '2026-10-20');
  assert.equal(data.plannedFollowUpDate(3, '2026-10-30'), '2026-11-02');
  assert.equal(data.plannedFollowUpDate(1, '2026-12-31'), '2027-01-01');
  assert.equal(data.plannedFollowUpDate(1, '2028-02-28'), '2028-02-29');
  assert.equal(data.plannedFollowUpDate(1, '2026-02-28'), '2026-03-01');
  for (const days of ['', 0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) assert.equal(data.plannedFollowUpDate(days, '2026-10-21'), '');
  assert.equal(data.plannedFollowUpDate(2, '2026-02-30'), '');
});

test('after-sale list separates processing, plans, order identity and update history', () => {
  const state = data.initialOrderState(), row = state.afterSales[0], pending = state.afterSales[4];
  assert.equal(data.afterSaleHandlingEvents(row).length, 3);
  assert.equal(data.afterSaleHandlingEvents(row)[0].time, '2026-10-20 10:10:00');
  assert.equal(data.afterSaleHandlingEvents(pending).length, 0);
  const output = data.afterSaleExport(state, [row, pending, state.afterSales[3]]);
  const cell = (index, field) => output.rows[index][output.headers.indexOf(field)];
  assert.equal(cell(0, '原始订单编号'), row.order);
  assert.equal(cell(0, '登记人'), row.timeline[0].operator);
  assert.equal(cell(0, '下次跟进时间'), '2026-10-23');
  assert.equal(cell(1, '最新处理时间'), '');
  assert.equal(cell(2, '下次跟进时间'), '');
  assert.match(data.afterSaleResult(state, state.afterSales[1]), /补发申请/);
  const date = data.plannedFollowUpDate(3);
  const updated = data.followAfterSale(state, pending.id, '沟通跟进', '已核实顾客反馈', date);
  const changed = updated.afterSales.find(item => item.id === pending.id);
  assert.equal(changed.nextDate, date);
  assert.ok(data.afterSaleHandlingEvents(changed)[0].comment.includes(date));
  assert.equal(pending.nextDate, '');
});
const parcel = (item, quantity, overrides = {}) => ({ id: 'new-parcel', order: '', channel: '', tracking: 'DEMO-TRACK', status: '未登记', date: data.today(), handler: '演示用户', allocations: { [item.id]: quantity }, ...overrides });

test('daily maintenance deduplicates orders and includes lines outside selection without changing source facts', () => {
  const state = data.initialOrderState(), before = structuredClone(state);
  const next = data.updateDaily(state, [state.daily[0].id, state.daily[1].id], 'shipped', '核对完成');
  assert.deepEqual(state, before);
  const changed = next.daily.filter(row => row.lingxing_order_no === state.daily[0].lingxing_order_no);
  assert.equal(changed.length, 2);
  for (const row of changed) {
    assert.equal(row.shipping_status, 'shipped'); assert.equal(row.internal_remark, '核对完成'); assert.equal(row.timeline.length, 2);
    const { shipping_status, internal_remark, timeline, ...source } = row;
    const { shipping_status: oldStatus, internal_remark: oldRemark, timeline: oldTimeline, ...oldSource } = state.daily.find(item => item.id === row.id);
    assert.deepEqual(source, oldSource);
  }
  assert.equal(next.daily[2], state.daily[2]); assert.equal(changed[0].address, state.daily[0].address);
  assert.deepEqual(data.updateDaily(next, [changed[0].id], 'shipped', '核对完成'), next);
  const reverted = data.updateDaily(next, [changed[0].id], 'pending'); assert.equal(reverted.daily[1].internal_remark, '核对完成');
  assert.throws(() => data.updateDaily(state, [], 'shipped')); assert.throws(() => data.updateDaily(state, ['missing'], 'shipped'));
  assert.throws(() => data.updateDaily(state, [state.daily[0].id], 'unknown'));
  assert.throws(() => data.updateDaily(state, [state.daily[0].id], undefined));
});

test('daily workbook follows all 16 ERP columns without leaking internal notes into the source remark', () => {
  const row = { ...data.initialOrderState().daily[0], reference_no: '00001234', price: 0, source_remark: '源表备注', internal_remark: '仅内部可见' };
  const workbook = daily.dailyWorkbook([row]);
  assert.deepEqual(workbook.headers, ['单选项', '今日订单日期', '【必要】系统单号', '【必要】参考号', '【必要】平台单号', '【必要】组别', '【必要】店铺', '【必要】品名', '【必要】型号', '【必要】数量', '【必要】地址合并，不含地址3（收件人，地址行1，地址行2，城市，省/州，邮编，电话）', '【必要】价格（减去平台费）', '【必要】国家', '【必要】发货渠道【保留字段】', '【必要】备注/渠道明细【保留字段】', '备注']);
  assert.deepEqual(workbook.rows[0], ['待发货', row.order_date, row.lingxing_order_no, '00001234', row.platform_order_no, row.group_name, row.store, row.product_name, row.model, row.quantity, row.address, 0, row.country, row.shipping_channel, row.channel_detail, '源表备注']);
  assert.ok(!workbook.rows[0].includes('仅内部可见'));
  assert.equal(daily.dailyWorkbook([{ ...row, shipping_status: 'shipped' }]).rows[0][0], '已发货');
});

test('daily filters search the actual reference, channel, source and internal fields and use order date', () => {
  const rows = data.initialOrderState().daily, empty = { query: '', group: '', channel: '', dates: [] };
  for (const field of ['reference_no', 'platform_order_no', 'product_name', 'model', 'asin', 'address', 'channel_detail', 'source_remark']) {
    const marked = [{ ...rows[0], [field]: '唯一检索值' }, rows[1]];
    assert.deepEqual(daily.filterDaily(marked, { ...empty, query: ' 唯一检索值 ' }).map(row => row.id), [rows[0].id]);
  }
  assert.equal(daily.filterDaily(rows, { ...empty, query: 'ref-demo-001' }).length, 2);
  assert.equal(daily.filterDaily(rows, { ...empty, dates: ['2026-10-16', '2026-10-16'] }).length, 2);
  assert.equal(daily.filterDaily(rows, { ...empty, group: rows[0].group_name, channel: rows[2].shipping_channel }).length, 0);
  const next = data.updateDaily({ ...data.initialOrderState(), daily: rows }, [rows[0].id], 'pending', '内部检索');
  assert.equal(daily.filterDaily(next.daily, { ...empty, query: '内部检索' }).length, 2);
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

test('follow-up item edits belong to the new request without rewriting the source or bypassing its quantity cap', () => {
  const state = data.initialOrderState(), source = state.afterSales[0], item = source.items[0];
  source.items = [...source.items, { ...item, id: 'second-source-item', model: 'SECOND' }];
  const before = structuredClone(state);
  const next = data.followAfterSale(state, source.id, '补发', '确认补发规格', '', { [item.id]: 1 }, { [item.id]: { model: ' BX-NEW ', color: ' 白色 ' } });
  assert.deepEqual(state, before);
  assert.deepEqual(next.afterSales[0].items, source.items);
  assert.deepEqual(next.reshipments[0].items, [{ ...item, model: 'BX-NEW', color: '白色', quantity: 1 }]);
  assert.equal(next.reshipments[0].sourceId, source.id);
  assert.throws(() => data.followAfterSale(state, source.id, '补发', '超量', '', { [item.id]: item.quantity + 1 }, { [item.id]: { model: 'BX-NEW', color: '白色' } }), /不能超过/);
  assert.throws(() => data.followAfterSale(state, source.id, '补发', '越界商品', '', { [item.id]: 1 }, { missing: { model: 'OTHER', color: '' } }), /不属于/);
  assert.throws(() => data.followAfterSale(state, source.id, '补发', '已全部移除', '', {}), /至少添加/);
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
