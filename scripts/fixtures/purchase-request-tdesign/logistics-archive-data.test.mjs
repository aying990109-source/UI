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
const history = load('./history.ts'), data = load('./logistics-archive-data.ts', { './history': history });
const initial = data.initialLogisticsArchiveState;

test('warehouse priority ignores disabled rows, matches site and purpose, and retains tie order', () => {
  const state = initial(), original = structuredClone(state), backup = state.warehouses[1];
  assert.equal(data.preferredWarehouse(state, 'US', 'FBA').id, 'CK-001');
  assert.equal(data.preferredWarehouse(state, 'CA', 'Canada').id, 'CK-004');
  assert.equal(data.preferredWarehouse(state, 'CA', 'FBA'), undefined);
  const tied = data.saveWarehouse(state, { ...backup, order: 10 }, backup.id);
  assert.equal(data.preferredWarehouse(tied, 'US', 'FBA').id, 'CK-001');
  const changed = data.saveWarehouse(tied, { ...backup, order: 1, address: 'Updated synthetic address' }, backup.id);
  assert.equal(data.preferredWarehouse(changed, 'US', 'FBA').id, backup.id);
  assert.match(changed.warehouses[1].timeline.at(-1).comment, /地址.*Updated synthetic address.*排序.*10 → 1/);
  assert.deepEqual(state, original);
});

test('warehouse editing preserves identity and validates duplicate names and ordering', () => {
  const state = initial(), row = state.warehouses[0];
  assert.equal(data.saveWarehouse(state, row, row.id), state);
  assert.throws(() => data.saveWarehouse(state, { ...row, name: 'Renamed' }, row.id), /保留仓名/);
  assert.throws(() => data.saveWarehouse(state, { ...row, site: 'CA' }, row.id), /保留仓名/);
  assert.throws(() => data.saveWarehouse(state, row), /仓名已存在/);
  assert.throws(() => data.saveWarehouse(state, { ...row, order: 0 }, row.id), /排序/);
  const added = data.saveWarehouse(state, { ...row, name: 'New example', order: 10 });
  assert.equal(added.warehouses.at(-1).id, 'CK-007');
  assert.equal(data.preferredWarehouse(added, 'US', 'FBA').id, 'CK-001');
});

test('carrier identities reject duplicates and default pointers cannot be changed by profile edits', () => {
  const state = initial(), row = state.carriers[0];
  assert.throws(() => data.saveCarrier(state, { ...row, name: 'Other' }), /重复/);
  assert.throws(() => data.saveCarrier(state, { ...row, code: '' }), /重复/);
  const updated = data.saveCarrier(state, { ...row, defaultTemplateId: 'MB-004', status: '停用' }, row.id);
  assert.equal(updated.carriers[0].defaultTemplateId, 'MB-001');
  assert.match(updated.carriers[0].timeline.at(-1).comment, /合作状态：启用 → 停用/);
  assert.deepEqual(updated.versions, state.versions);
});

test('new template starts with an unmapped disabled V1 and cannot be selected as default', () => {
  const state = initial(), draft = { carrierId: 'WLS-001', name: '示例新模板', transport: '快递', status: '启用', defaultVersionId: 'VER-001' };
  const next = data.saveTemplate(state, draft), template = next.templates.at(-1), version = next.versions.at(-1);
  assert.equal(template.defaultVersionId, ''); assert.equal(version.templateId, template.id);
  assert.equal(data.versionStage(version), '待适配'); assert.equal(version.status, '停用');
  assert.throws(() => data.makeDefaultTemplate(next, template.id), /先核对/);
  assert.throws(() => data.saveTemplate(next, draft), /已有/);
  assert.throws(() => data.setVersionStatus(next, version.id, true, true), /未核对/);
});

test('mapping changes invalidate samples and reviewed versions require a copy', () => {
  const state = initial(), version = state.versions[2], mapping = state.versions[0].mapping;
  const sampled = data.generateSample(state, version.id, data.demoInput()), previousId = sampled.versions[2].sample.id;
  const changed = data.saveMapping(sampled, version.id, { ...mapping, Quantity: 'cartons', Cartons: 'quantity' });
  assert.equal(changed.versions[2].sample, null);
  assert.throws(() => data.reviewVersion(changed, version.id, previousId, true, true, ''), /失效/);
  assert.throws(() => data.saveMapping(state, 'VER-001', mapping), /复制/);
  assert.throws(() => data.saveMapping(state, version.id, { ...mapping, Cartons: 'quantity' }), /不同/);
  assert.equal(sampled.versions[2].sample.id, previousId);
});

test('samples use mapped values, validate quantity, and review requires the current sample and explicit confirmation', () => {
  const state = initial(), input = data.demoInput();
  assert.throws(() => data.generateSample(state, 'VER-003', { ...input, cartons: 121 }), /箱数/);
  assert.throws(() => data.generateSample(state, 'VER-002', input), /已适配/);
  const first = data.generateSample(state, 'VER-003', input), oldId = first.versions[2].sample.id;
  const second = data.generateSample(first, 'VER-003', { ...input, quantity: 240 });
  const sample = second.versions[2].sample;
  assert.deepEqual(sample.cells, [input.reference, input.product, 240, 10, 'US']);
  assert.throws(() => data.reviewVersion(second, 'VER-003', oldId, true, true, ''), /失效/);
  assert.throws(() => data.reviewVersion(second, 'VER-003', sample.id, true, false, ''), /确认/);
  const reviewed = data.reviewVersion(second, 'VER-003', sample.id, true, true, '已逐列核对');
  assert.equal(reviewed.versions[2].reviewed, true); assert.equal(reviewed.templates[2].defaultVersionId, 'VER-003');
  assert.equal(reviewed.carriers[1].defaultTemplateId, 'MB-003');
  assert.equal(data.usableTemplate(reviewed, reviewed.templates[2]), true);
  assert.match(data.carrierTimeline(reviewed, 'WLS-002').at(-1).comment, /已逐列核对/);
});

test('rejection needs a reason and clears adaptation and sample without changing old defaults', () => {
  const state = data.generateSample(initial(), 'VER-003', data.demoInput()), sample = state.versions[2].sample;
  assert.throws(() => data.reviewVersion(state, 'VER-003', sample.id, false, false, ' '), /原因/);
  const rejected = data.reviewVersion(state, 'VER-003', sample.id, false, false, '数量列映射不符');
  assert.equal(rejected.versions[2].sample, null); assert.equal(data.versionStage(rejected.versions[2]), '待适配');
  assert.equal(rejected.versions[2].timeline.at(-1).comment, '数量列映射不符');
  assert.deepEqual(rejected.templates, state.templates); assert.deepEqual(rejected.carriers, state.carriers);
});

test('copy preserves defaults until approval and disabling a default never silently falls back', () => {
  const state = initial(), copied = data.forkVersion(state, 'VER-001'), version = copied.versions.at(-1);
  assert.equal(version.revision, 2); assert.equal(version.sample, null); assert.equal(version.reviewed, false);
  assert.equal(copied.templates[0].defaultVersionId, 'VER-001'); assert.equal(copied.carriers[0].defaultTemplateId, 'MB-001');
  const sampled = data.generateSample(copied, version.id, data.demoInput());
  const reviewed = data.reviewVersion(sampled, version.id, sampled.versions.at(-1).sample.id, true, true, '');
  assert.equal(reviewed.templates[0].defaultVersionId, version.id);
  assert.equal(reviewed.versions[0].status, '启用');
  const stopped = data.setVersionStatus(reviewed, version.id, false, false);
  assert.equal(stopped.templates[0].defaultVersionId, version.id);
  assert.equal(data.usableTemplate(stopped, stopped.templates[0]), false);
  assert.throws(() => data.setVersionStatus(stopped, version.id, false, true), /只能/);
  const restored = data.setVersionStatus(stopped, 'VER-001', true, true);
  assert.equal(restored.templates[0].defaultVersionId, 'VER-001');
  assert.equal(data.usableTemplate(restored, restored.templates[0]), true);
});
