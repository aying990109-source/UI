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
const history = load('./history.ts'), data = load('./catalog-data.ts', { './history': history });

test('same-name masters retain stable identities and shared edits do not overwrite independent supplies', () => {
  const state = data.initialCatalogState(), before = structuredClone(state), master = state.products[0];
  const next = data.saveMaster(state, { ...master, model: 'NEW-72' });
  assert.notEqual(next.products[0].id, master.id); assert.equal(next.products[0].name, master.name);
  const edited = data.saveMaster(next, { ...master, name: '新公共品名', hs: '123456', remark: '核对完毕' }, master.id);
  assert.equal(edited.products.find(row => row.id === master.id).name, '新公共品名');
  assert.deepEqual(edited.supplies, state.supplies); assert.deepEqual(state, before);
  assert.match(edited.products.find(row => row.id === master.id).timeline.at(-1).comment, /海关编码.*123456/);
  assert.throws(() => data.saveMaster(state, { ...master, hs: '12A' }, master.id));
  assert.throws(() => data.saveMaster(state, { ...master, name: ' ' }));
  assert.throws(() => data.saveMaster(state, master, 'missing'));
});

test('supply identity checks duplicate combinations, country support and active source without mutation', () => {
  const state = data.initialCatalogState(), before = structuredClone(state), supply = state.supplies[0];
  assert.throws(() => data.saveSupply(state, supply));
  assert.throws(() => data.saveSupply(state, { ...supply, country: 'US' }, supply.id));
  assert.throws(() => data.saveSupply(state, { ...supply, masterId: 'CP-005', profileId: 'GYS-001-O', country: 'CA' }));
  assert.throws(() => data.saveSupply(state, { ...supply, masterId: 'CP-005', profileId: 'GYS-004-D' }));
  const next = data.saveSupply(state, { ...supply, masterId: 'CP-005', profileId: 'GYS-003-O', country: 'CA', currency: 'CAD' });
  assert.equal(next.supplies[0].lastOrdered, ''); assert.equal(next.supplies[0].country, 'CA');
  assert.deepEqual(state, before);
});

test('reference price edits preserve order facts, history covers all changed pricing fields and no-op is quiet', () => {
  const state = data.initialCatalogState(), row = state.supplies[0];
  assert.equal(data.saveSupply(state, row, row.id), state);
  const next = data.saveSupply(state, { ...row, price: 31.2, basis: '不含税含运费', carton: 24, remark: '新报价', lastOrdered: '2099-01-01' }, row.id);
  const updated = next.supplies.find(item => item.id === row.id);
  assert.equal(updated.lastOrdered, row.lastOrdered); assert.equal(updated.price, 31.2);
  for (const expected of ['28.5 → 31.2', '12 → 24', '不含税含运费', '新报价']) assert.ok(updated.timeline.at(-1).comment.includes(expected));
  assert.equal(data.productTimeline(next, state.products[0]).length, data.productTimeline(state, state.products[0]).length + 1);
  for (const value of [0, -1, 1.5, NaN, Infinity]) assert.throws(() => data.saveSupply(state, { ...row, carton: value }, row.id));
  for (const value of [-1, NaN, Infinity]) assert.throws(() => data.saveSupply(state, { ...row, price: value }, row.id));
  assert.deepEqual(next.companies, state.companies);
});

test('supplier profiles keep stable identities on rename and disable, cannot be deleted or silently retyped', () => {
  const state = data.initialCatalogState(), row = state.suppliers[0];
  const next = data.saveSupplier(state, { ...row, name: '示例新名称', profiles: row.profiles.map((profile, i) => i === 0 ? { ...profile, status: '停用', contact: '新联系人' } : profile) }, row.id);
  assert.equal(next.suppliers[0].profiles[0].id, row.profiles[0].id);
  assert.equal(data.supplierFor(next, state.supplies[0].profileId).supplier.name, '示例新名称');
  assert.match(next.suppliers[0].timeline.at(-1).comment, /启用 → 停用/);
  assert.throws(() => data.saveSupplier(state, { ...row, profiles: [row.profiles[1]] }, row.id));
  assert.throws(() => data.saveSupplier(state, { ...row, name: state.suppliers[1].name }, row.id));
  assert.throws(() => data.saveSupplier(state, { ...row, profiles: [] }));
  assert.equal(data.saveSupplier(state, row, row.id), state);
});

test('company default moves atomically with history on both records and no fallback after disabling', () => {
  const state = data.initialCatalogState(), [first, second] = state.companies;
  const next = data.saveCompany(state, { ...second, isDefault: true }, second.id);
  assert.equal(next.companies.filter(row => row.isDefault).length, 1);
  assert.equal(next.companies.find(row => row.id === second.id).isDefault, true);
  assert.match(next.companies.find(row => row.id === first.id).timeline.at(-1).comment, /CGF-002/);
  const disabled = data.saveCompany(next, { ...next.companies[1], status: '停用' }, second.id);
  assert.equal(disabled.companies.filter(row => row.isDefault && row.status === '启用').length, 0);
  assert.equal(disabled.companies.find(row => row.id === first.id).isDefault, false);
  const cleared = data.saveCompany(next, { ...next.companies[1], isDefault: false }, second.id);
  assert.equal(cleared.companies.filter(row => row.isDefault).length, 0);
  assert.deepEqual(cleared.products, state.products);
});

test('conflicting full company name cannot clear the default, short names are not identity', () => {
  const state = data.initialCatalogState(), before = structuredClone(state), [first, second] = state.companies;
  assert.throws(() => data.saveCompany(state, { ...second, name: first.name, isDefault: true }, second.id));
  assert.deepEqual(state, before);
  const next = data.saveCompany(state, { ...second, name: '示例第三采购单位', shortName: first.shortName });
  assert.equal(next.companies.length, state.companies.length + 1);
  assert.equal(next.companies[0].shortName, first.shortName);
  assert.equal(data.saveCompany(state, first, first.id), state);
});
