import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const code = ts.transpileModule(readFileSync(new URL('./query-data.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const data = {};
new Function('exports', code)(data);

test('exact platform lookup retains multiple system records and also matches an exact system number', () => {
  const { orders } = data.initialQueryData();
  const found = data.searchOrders(orders, ' 112-1000001-2000001 ');
  assert.equal(found.length, 2); assert.notEqual(found[0].systemOrder, found[1].systemOrder);
  assert.deepEqual(data.searchOrders([{ ...orders[0], platformOrder: 'different', systemOrder: '112-1000001-2000001' }], '112-1000001-2000001').map(row => row.id), ['CX-001']);
  assert.equal(data.searchOrders(orders, '112-1000001-2000000').length, 0);
});

test('order keywords are ANDed and restricted to supported fields without guessed store names', () => {
  const { orders } = data.initialQueryData(), before = structuredClone(orders);
  assert.equal(data.searchOrders(orders, '折叠收纳箱').length, 12);
  const found = data.searchOrders(orders, ' US   家居 ');
  assert.ok(found.length > 0); assert.ok(found.every(row => row.site === 'US' && row.store.includes('家居')));
  assert.ok(!found.some(row => row.id === 'CX-005'));
  assert.ok(data.searchOrders(orders, 'us home original 1').some(row => row.id === 'CX-005'));
  for (const query of ['ST-48', 'DEMO-TRACK-1', '北美一组', '订单总表示例']) assert.equal(data.searchOrders(orders, query).length, 0);
  assert.deepEqual(orders, before);
});

test('order results sort stably and logistics disagreement or absence never asserts shipment state', () => {
  const { orders } = data.initialQueryData(), found = data.searchOrders(orders, '折叠收纳箱');
  assert.deepEqual(found.slice(0, 3).map(row => row.systemOrder), ['SYS-DEMO-0003', 'SYS-DEMO-0002', 'SYS-DEMO-0001']);
  assert.equal(data.trackingConflict(orders[0]), true);
  assert.equal(data.trackingConflict({ ...orders[0], tracking: [{ number: 'same' }, { number: 'same' }] }), false);
  assert.equal(orders[2].sourcePrice, '0'); assert.equal(orders[2].tracking.length, 0);
  assert.equal('shipmentStatus' in orders[2], false); assert.match(orders[2].logisticsNote, /不代表未发货/);
  assert.equal(orders[2].shippingChannel, ''); assert.equal(orders[2].expectedArrival, '');
  assert.deepEqual(data.trackingGroups(orders[0]).map(item => item.number), ['DEMO-TRACK-1', 'DEMO-TRACK-OTHER']);
  assert.deepEqual(data.trackingGroups(orders[3])[0].sources, ['原表运单号', '原表自动读取列']);
});

test('pricing requires the complete name, preserves internal spacing, and filters active country/source combinations', () => {
  const { prices } = data.initialQueryData(), filters = { query: '折叠收纳箱', country: '', source: '' };
  assert.equal(data.searchPrices(prices, filters).length, 5);
  assert.equal(data.searchPrices(prices, { ...filters, query: '折叠' }).length, 0);
  assert.equal(data.searchPrices(prices, { ...filters, query: ' storage BOX ' }).length, 1);
  assert.equal(data.searchPrices(prices, { ...filters, query: 'Storage  Box' }).length, 0);
  assert.deepEqual(data.searchPrices(prices, { ...filters, country: 'CA', source: '当地货源' }).map(row => row.id), ['DJ-005']);
  assert.throws(() => data.searchPrices(prices, { ...filters, country: 'CN' }), /有效国家/);
  assert.throws(() => data.searchPrices(prices, { ...filters, source: '未知' }), /有效货源/);
});

test('read projections omit sensitive pricing/contact fields and absent quotes are never displayed as free prices', () => {
  const { prices, orders } = data.initialQueryData();
  assert.equal(data.priceText(prices[4]), '暂无报价');
  assert.equal(data.priceText({ ...prices[0], guidance: 0 }), '暂无报价');
  assert.equal(data.priceText(prices[0]), 'USD 49.90'); assert.equal(data.priceText(prices[3]), 'CAD 68.00');
  for (const row of prices) for (const key of ['supplier', 'cost', 'multiplier', 'referencePrice', 'productId']) assert.equal(key in row, false);
  for (const row of orders) for (const key of ['address', 'phone', 'email', 'customer']) assert.equal(key in row, false);
});

test('brand lookup reports only collection status without fuzzy, alias, or width normalization', () => {
  const { brands } = data.initialQueryData();
  assert.deepEqual(data.searchBrand(brands, ' demo north '), { name: 'DEMO NORTH', exists: true });
  for (const query of ['DEMO', 'DEMO  NORTH', 'ＤＥＭＯ NORTH', 'DEMO AND CO']) assert.equal(data.searchBrand(brands, query).exists, false);
  assert.deepEqual(Object.keys(data.searchBrand(brands, '示例品牌')).sort(), ['exists', 'name']);
});

test('empty or oversized input is an error rather than an empty match or brand absence', () => {
  const state = data.initialQueryData();
  for (const query of [' ', 'a'.repeat(201)]) {
    assert.throws(() => data.searchOrders(state.orders, query));
    assert.throws(() => data.searchPrices(state.prices, { query, country: '', source: '' }));
    assert.throws(() => data.searchBrand(state.brands, query));
  }
});
