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
const data = load('./brand-pricing-data.ts', { './history': load('./history.ts') });

test('brand edits preserve authorization projections, original snapshot and complete history; reject duplicates and stale edits', () => {
  const state = data.initialBrandPricingState(), before = structuredClone(state), old = state.brands[0];
  const draft = { ...data.brandDraft(old), name: '品牌调整示例', reconciled: true, reviewNote: '已核对原表口径' };
  const next = data.saveBrand(state, draft, old.id), row = next.brands[0];
  assert.deepEqual(state, before); assert.deepEqual(row.authorizations, old.authorizations); assert.equal(row.profile.snapshotTotal, '7');
  assert.equal(data.activeAuthorizations(row), 2); assert.equal(row.timeline.length, 2); assert.match(row.timeline[1].comment, /DEMO NORTH → 品牌调整示例/);
  assert.equal(row.version, 2); assert.equal(data.saveBrand(next, data.brandDraft(row), row.id), next);
  assert.throws(() => data.saveBrand(next, draft, old.id), /已被修改/);
  assert.throws(() => data.saveBrand(state, { ...data.brandDraft(), name: ' demo north ' }), /已收录/);
  assert.throws(() => data.saveBrand(state, { ...draft, name: 'x'.repeat(201) }), /200/);
});
test('brand source dates, windows and snapshots enforce actual dates and a complete consistent snapshot', () => {
  for (const date of ['2026-02-29', '2026-04-31', '0000-01-01', '26-1-1']) assert.throws(() => data.validDate(date, 'date'), /有效日期/);
  assert.equal(data.validDate('2024-02-29', 'date'), '2024-02-29');
  for (const profile of [{ snapshotTotal: '1' }, { snapshotTotal: '2', snapshotActive: '1', snapshotCancelled: '0', snapshotStopped: '0' }, { snapshotActive: '-1' }, { snapshotTotal: '1000001' }, { firstWindow: '2026-06-15 ~ 2025-06-15' }, { firstWindow: '2026-06-15' }]) assert.throws(() => data.validateProfile(profile));
  const zero = data.validateProfile({ snapshotTotal: '0', snapshotActive: '0', snapshotCancelled: '0', snapshotStopped: '0', firstWindow: '—' });
  assert.equal(zero.snapshotTotal, '0'); assert.equal(zero.firstWindow, '—');
});
test('brand review is advisory; filters use exact status and AND keywords', () => {
  const state = data.initialBrandPricingState(), filters = { search: '', category: '', registry: '', review: '' };
  assert.equal(data.brandIssues(state.brands[1], state.brands).length, 2);
  assert.ok(data.saveBrand(state, { ...data.brandDraft(state.brands[1]), reviewNote: '保留来源状态待核查' }, state.brands[1].id));
  assert.equal(data.filterBrands(state.brands, { ...filters, search: 'DEMO SHARED' }).length, 2);
  assert.equal(data.filterBrands(state.brands, { ...filters, registry: 'Act' }).length, 0);
  assert.equal(data.filterBrands(state.brands, { ...filters, review: 'pending' }).length, 4);
});
test('guidance uses exact half-up rounding, canonical decimal units and bounded nonzero multiplier', () => {
  assert.deepEqual(data.calculatePrice('10.01', '1.5'), { cost: '10.01', multiplier: '1.5000', guidance: '15.02' });
  assert.equal(data.calculatePrice('0.01', '0.5').guidance, '0.01');
  assert.equal(data.calculatePrice('1000000000', '1000').guidance, '1000000000000.00');
  for (const cost of ['', '0', '0.00']) assert.equal(data.calculatePrice(cost, '4').guidance, null);
  for (const [cost, factor] of [['-1', '4'], ['1.001', '4'], ['1000000000.01', '4'], ['1e2', '4'], ['1', '0'], ['1', '-1'], ['1', '1000.0001'], ['1', '1.00001'], ['1', '']]) assert.throws(() => data.calculatePrice(cost, factor));
});
test('pricing validates source geography, immutable supply record, reason, version and uniqueness including disabled records', () => {
  const state = data.initialBrandPricingState(), old = state.prices[0], draft = { ...data.priceDraft(old), reason: '调整成本' };
  assert.throws(() => data.savePrice(state, { ...draft, source: 'local' }, old.id), /不匹配/);
  assert.throws(() => data.savePrice(state, { ...draft, productId: 'BP-002' }, old.id), /不能更换/);
  assert.throws(() => data.savePrice(state, { ...draft, reason: '' }, old.id), /请填写/);
  assert.throws(() => data.savePrice(state, { ...draft, version: 0 }, old.id), /已被修改/);
  assert.throws(() => data.savePrice(state, { ...draft, productId: 'BP-006', spec: 'new' }), /有效/);
  assert.throws(() => data.savePrice(state, { ...data.priceDraft(state.prices.at(-1)), reason: '重复' }), /已存在/);
  assert.throws(() => data.savePrice(state, { ...draft, spec: 'new', country: 'GB' }), /不正确/);
});
test('pricing save and disable retain references and append full audit without mutating prior state', () => {
  const state = data.initialBrandPricingState(), before = structuredClone(state), old = state.prices[0];
  const next = data.savePrice(state, { ...data.priceDraft(old), cost: '10.01', multiplier: '1.5', status: 'disabled', reason: '样例：核对费用后停用' }, old.id), row = next.prices[0];
  assert.deepEqual(state, before); assert.equal(row.guidance, '15.02'); assert.equal(row.reference, '28.50'); assert.equal(row.status, 'disabled');
  assert.equal(row.version, 2); assert.equal(row.timeline.length, 2); assert.match(row.timeline[1].comment, /启用 → 停用/); assert.match(row.timeline[1].comment, /核对费用/);
  const changedCountry = data.savePrice(next, { ...data.priceDraft(row), country: 'CA', cost: '', reason: '加拿大报价待核算' }, row.id).prices[0];
  assert.equal(changedCountry.guidance, null); assert.equal(changedCountry.reference, '28.50'); assert.equal(changedCountry.timeline.length, 3);
});
test('supplier record remains part of pricing identity and all pricing filters compose', () => {
  const state = data.initialBrandPricingState(), draft = { ...data.priceDraft(), productId: 'BP-001', spec: '新销售组合', cost: '20', reason: '新增组合' };
  const first = data.savePrice(state, draft), second = data.savePrice(first, { ...draft, productId: 'BP-002' });
  assert.equal(second.prices.length, 14);
  const filters = { search: '折叠 青禾', country: 'US', source: 'domestic', status: 'active' };
  assert.equal(data.filterPrices(second.prices, filters).length, 4);
  assert.equal(data.filterPrices(second.prices, { ...filters, country: 'CA' }).length, 0);
});
