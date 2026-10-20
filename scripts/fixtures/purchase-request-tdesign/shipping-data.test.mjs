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
const history = load('./history.ts');
const data = load('./data.ts', { './history': history });
const processing = load('./processing-data.ts', { './data': data, './history': history });
const shipping = load('./shipping-data.ts', { './data': data, './history': history, './processing-data': processing });

function checkBalances(state) {
  for (const row of state.schedules) {
    const used = shipping.totalQuantity(state.manifests.flatMap(m => m.lines).filter(line => line.scheduleId === row.id));
    assert.ok(used <= row.quantity);
  }
  for (const line of state.manifests.flatMap(row => row.lines)) {
    assert.ok(line.confirmed <= line.quantity);
    assert.ok(shipping.allocated(state, line.id) <= line.confirmed);
    assert.equal(line.quantity % line.carton, 0);
    assert.equal(line.confirmed % line.carton, 0);
  }
}

test('seed balances preserve whole cartons and two independent reservations', () => {
  const state = shipping.initialShippingState();
  checkBalances(state);
  assert.equal(shipping.manifestStatus(state, state.manifests[0]), '待核对');
  assert.equal(shipping.manifestStatus(state, state.manifests[1]), '部分确认');
  assert.equal(shipping.manifestStatus(state, state.manifests.at(-1)), '已全部分配');
  for (const row of [...state.schedules, ...state.manifests, ...state.dispatches]) assert.deepEqual(row.timeline.map(event => event.time), row.timeline.map(event => event.time).sort());
  for (const row of state.manifests) assert.equal(row.timeline.some(event => event.label === '分配物流单'), shipping.manifestAllocated(state, row) > 0);
});

test('batch confirmation is atomic when any draft is missing data', () => {
  const state = shipping.initialShippingState(), before = structuredClone(state);
  assert.throws(() => shipping.confirmSchedules(state, state.schedules.slice(0, 2).map(row => row.id)), /资料齐全/);
  assert.deepEqual(state, before);
  const next = shipping.confirmSchedules(state, [state.schedules[0].id]);
  assert.equal(next.schedules[0].status, '已确认');
  assert.equal(next.schedules[0].timeline.at(-1).label, '确认出货排期');
});

test('source picks split by supplier and cannot be consumed twice or exceed balance', () => {
  const state = shipping.initialShippingState(), sources = shipping.shippingSources(state, 'preparation');
  const picks = sources.map(row => ({ id: row.id, boxes: row.available / row.carton }));
  const before = structuredClone(state), next = shipping.createManifests(state, picks);
  assert.equal(next.manifests.length - state.manifests.length, new Set(sources.map(row => row.supplier)).size);
  assert.equal(shipping.shippingSources(next, 'preparation').length, 0);
  assert.equal(next.schedules.find(row => row.id === picks[0].id).timeline.at(-1).label, '选入核对资料');
  assert.throws(() => shipping.createManifests(next, picks), /不能超过/);
  for (const boxes of [0, -1, 1.5, NaN, Infinity, 999]) assert.throws(() => shipping.createManifests(state, [{ id: sources[0].id, boxes }]), /不能超过/);
  assert.throws(() => shipping.createManifests(state, [picks[0], picks[0]]), /重复/);
  assert.deepEqual(state, before);
  checkBalances(next);
});

test('confirmed goods alone enter logistics; transport mismatch and mixed warehouses are rejected', () => {
  const state = shipping.initialShippingState(), source = shipping.shippingSources(state, 'dispatch')[0];
  const picks = [{ id: source.id, boxes: 1 }], sea = shipping.carrierTemplates[0].name, air = shipping.carrierTemplates[1].name;
  assert.throws(() => shipping.createDispatch(state, [{ id: state.manifests[0].lines[0].id, boxes: 1 }], sea, ''), /不能超过/);
  assert.throws(() => shipping.createDispatch(state, picks, air, ''), /变更原因/);
  const other = shipping.shippingSources(state, 'dispatch').find(row => row.warehouse !== source.warehouse);
  assert.throws(() => shipping.createDispatch(state, [...picks, { id: other.id, boxes: 1 }], sea, ''), /同一目的仓/);
  const next = shipping.createDispatch(state, picks, air, '活动补货加急');
  assert.equal(next.dispatches[0].changeReason, '活动补货加急');
  assert.equal(next.dispatches[0].transport, '空运');
  assert.equal(next.manifests.find(row => row.id === source.manifestId).timeline.at(-1).label, '分配物流单');
  assert.equal(shipping.shippingSources(next, 'dispatch').find(row => row.id === source.id).available, source.available - source.carton);
  checkBalances(next);
});

test('logistics rejects capacity overflow without changing source balances', () => {
  const state = shipping.initialShippingState(), source = state.manifests[0].lines[0];
  source.quantity = source.carton * 51; source.confirmed = source.quantity;
  const before = structuredClone(state);
  assert.throws(() => shipping.createDispatch(state, [{ id: source.id, boxes: 51 }], shipping.carrierTemplates[0].name, ''), /50 箱/);
  source.boxVolume = 31;
  assert.throws(() => shipping.createDispatch(state, [{ id: source.id, boxes: 1 }], shipping.carrierTemplates[0].name, ''), /30 立方米/);
  assert.deepEqual(state.dispatches, before.dispatches);
});

test('confirm, export, send, register and tracking retain audit history and guard state', () => {
  let state = shipping.initialShippingState();
  const manifest = state.manifests[0];
  state = shipping.confirmManifest(state, manifest.id);
  assert.equal(shipping.confirmed(state.manifests[0]), shipping.totalQuantity(manifest.lines));
  assert.throws(() => shipping.confirmManifest(state, manifest.id), /没有待核对/);
  state = shipping.createDispatch(state, [{ id: manifest.lines[0].id, boxes: 2 }], shipping.carrierTemplates[0].name, '');
  const id = state.dispatches[0].id;
  assert.throws(() => shipping.changeDispatch(state, id, 'send'), /先生成/);
  assert.throws(() => shipping.changeDispatch(state, id, 'tracking', '在途'), /已登记运单/);
  for (const action of ['export', 'send']) state = shipping.changeDispatch(state, id, action);
  assert.throws(() => shipping.changeDispatch(state, id, 'trackingNo', 'DEMO-YH-26101601'), /已用于/);
  state = shipping.changeDispatch(state, id, 'trackingNo', 'DEMO-NEW-0001');
  const original = '预计下周到港，尚未抵达。\n请等待物流商进一步确认。';
  state = shipping.changeDispatch(state, id, 'tracking', original);
  assert.equal(state.dispatches[0].trackingStage, '在途');
  assert.equal(state.dispatches[0].timeline.at(-1).comment, original);
  assert.strictEqual(shipping.changeDispatch(state, id, 'tracking', original), state);
  assert.equal(state.dispatches[0].timeline.length, 5);
  checkBalances(state);
});
