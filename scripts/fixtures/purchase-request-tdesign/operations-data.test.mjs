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
const history = load('./history.ts'), requests = load('./data.ts', { './history': history });
const op = load('./operations-data.ts', { './data': requests, './history': history });
const replenishment = (state, overrides = {}) => { const source = state.sources[0]; return { sourceId: source.id, group: source.group, quantity: source.carton * 2, shop: op.shops[0], asin: 'DEMO-ASIN', fnsku: 'DEMO-FNSKU', msku: 'DEMO-MSKU', remark: '', ...overrides }; };
const listing = { product: '可折叠收纳箱 45L', group: op.groups[0], shop: op.shops[0], price: 19.99, title: '收纳箱示例', bullets: '第一点\n第二点\n第三点\n第四点\n第五点', image: 'data:image/png;base64,c2FtcGxl', remark: '' };

test('inventory separates physical, reserved, transit and allowance; anomalies propagate rather than zero', () => {
  const state = op.initialOperationsState(), source = state.sources[0], value = op.inventoryValues(state, source);
  assert.equal(value.pending, 240);
  assert.equal(value.available, 180);
  assert.equal(value.transit, 180);
  assert.equal(value.total, 600);
  assert.equal(op.allowance(state, source), 240);
  const invalid = state.sources.at(-1);
  assert.equal(op.inventoryValues(state, invalid).total, null);
  assert.equal(op.allowance(state, invalid), 0);
  const group = op.inventoryProducts(state).find(row => row.id === invalid.product);
  assert.equal(group.incomplete, true); assert.equal(group.total, null);
  assert.equal(op.inventoryProducts(state, source.id)[0].sources.length, 1);
  assert.equal(op.inventoryProducts(state, 'not-present').length, 0);
});

test('same-group submission reserves once; approval never consumes stock; withdrawal releases', () => {
  const state = op.initialOperationsState(), before = structuredClone(state), source = state.sources[0];
  const created = op.createReplenishment(state, replenishment(state)), row = created.replenishments[0];
  assert.deepEqual(state, before); assert.equal(row.status, '待申请审批');
  assert.equal(op.allowance(created, source), op.allowance(state, source) - row.quantity);
  assert.equal(op.inventoryValues(created, source).available, op.inventoryValues(state, source).available - row.quantity);
  const approved = op.changeReplenishment(created, row.id, 'approve');
  assert.equal(approved.replenishments[0].status, '待发货');
  assert.equal(op.reserved(approved, source.id), op.reserved(created, source.id));
  assert.equal(approved.sources[0].consumed, source.consumed);
  assert.throws(() => op.changeReplenishment(approved, row.id, 'approve'));
  const withdrawn = op.changeReplenishment(created, row.id, 'withdraw');
  assert.equal(op.allowance(withdrawn, source), op.allowance(state, source));
  assert.equal(withdrawn.sources[0].timeline.at(-1).label, '释放补货预留');
});

test('cross-group requests reserve only at source confirmation and recheck competing quantity', () => {
  let state = op.initialOperationsState(); const source = state.sources[0], initial = op.reserved(state, source.id);
  state = op.createReplenishment(state, replenishment(state, { group: op.groups[1], quantity: 180 }));
  const row = state.replenishments[0]; assert.equal(row.status, '待货源确认'); assert.equal(op.reserved(state, source.id), initial);
  const confirmed = op.changeReplenishment(state, row.id, 'approve');
  assert.equal(confirmed.replenishments[0].status, '待申请审批'); assert.equal(op.reserved(confirmed, source.id), initial + 180);
  const rejected = op.changeReplenishment(confirmed, row.id, 'reject', '额度调整');
  assert.equal(op.reserved(rejected, source.id), initial); assert.equal(rejected.replenishments[0].timeline.at(-1).comment, '额度调整');
  const competing = op.createReplenishment(state, replenishment(state, { quantity: 120 }));
  const snapshot = structuredClone(competing);
  assert.throws(() => op.changeReplenishment(competing, row.id, 'approve'), /额度/); assert.deepEqual(competing, snapshot);
});

test('replenishment validates whole cartons, balance, site and required identities atomically', () => {
  const state = op.initialOperationsState(), before = structuredClone(state);
  for (const quantity of [0, -1, 13, 99996, NaN, Infinity]) assert.throws(() => op.createReplenishment(state, replenishment(state, { quantity })));
  assert.throws(() => op.createReplenishment(state, replenishment(state, { shop: op.shops[1] })), /站点/);
  assert.throws(() => op.createReplenishment(state, replenishment(state, { fnsku: ' ' })), /FNSKU/);
  assert.throws(() => op.changeReplenishment(state, state.replenishments[0].id, 'reject', ' '), /原因/);
  assert.deepEqual(state, before);
});

test('listing requires core assets and positive price, approval allocates unique demo identity once', () => {
  const state = op.initialOperationsState();
  for (const field of ['product', 'group', 'shop', 'title', 'bullets', 'image']) assert.throws(() => op.saveListing(state, { ...listing, [field]: '' }));
  for (const price of [0, -1, NaN, Infinity]) assert.throws(() => op.saveListing(state, { ...listing, price }));
  const created = op.saveListing(state, listing), row = created.listings[0]; assert.equal(row.ean, ''); assert.equal(row.status, '待审批');
  const approved = op.changeListing(created, row.id, 'approve'), completed = approved.listings[0];
  assert.equal(completed.status, '已完成'); assert.match(completed.ean, /^DEMO-EAN-/);
  assert.equal(new Set(approved.listings.filter(row => row.ean).map(row => row.ean)).size, approved.listings.filter(row => row.ean).length);
  assert.throws(() => op.changeListing(approved, row.id, 'approve'));
  assert.throws(() => op.saveListing(approved, listing, row.id));
  const supplemented = op.changeListing(approved, row.id, 'identity', { reason: '', asin: 'DEMO-NEW', brand: '演示品牌' });
  assert.equal(supplemented.listings[0].ean, completed.ean); assert.equal(supplemented.eanSequence, approved.eanSequence);
  assert.equal(op.changeListing(supplemented, row.id, 'identity', { reason: '', asin: 'DEMO-NEW', brand: '演示品牌' }), supplemented);
});

test('listing rejection and resubmission retain original identity, ownership and full timeline', () => {
  let state = op.saveListing(op.initialOperationsState(), listing); const id = state.listings[0].id;
  assert.throws(() => op.changeListing(state, id, 'reject'), /原因/);
  state = op.changeListing(state, id, 'reject', { reason: '补充尺寸', asin: '', brand: '' });
  const before = state.listings[0];
  assert.equal(before.ean, '');
  assert.throws(() => op.saveListing(state, { ...listing, group: op.groups[1] }, id), /归属/);
  state = op.saveListing(state, { ...listing, title: '补充尺寸后的标题' }, id);
  assert.equal(state.listings[0].id, id); assert.equal(state.listings[0].status, '待审批');
  assert.deepEqual(state.listings[0].timeline.slice(0, -1), before.timeline);
  for (const row of [...state.sources, ...state.replenishments, ...state.listings]) assert.deepEqual(row.timeline.map(event => event.time), row.timeline.map(event => event.time).sort());
});
