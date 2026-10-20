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
const history = load('./history.ts'), csv = load('../../../src/lib/csv.ts'), view = load('../../../src/features/middle-data/store-group-view.ts');
const data = load('./middle-data.ts', { './history': history, '../../../src/lib/csv': csv, '../../../src/features/middle-data/store-group-view': view });

test('EAN keeps leading zeros, rejects non-ASCII/invalid length and never overwrites issued codes', () => {
  const state = data.initialMiddleState(), before = structuredClone(state);
  const next = data.addEan(state, ' 0000000009001 ');
  assert.equal(next.codes[0].code, '0000000009001'); assert.equal(next.codes[0].status, 'available'); assert.equal(next.codes[0].request, '');
  assert.equal(next.codes[0].timeline.length, 1); assert.deepEqual(state, before);
  for (const value of ['', '123', '１２３４５６７８９０１２３', '00000000090010', '12345678901e3']) assert.throws(() => data.addEan(state, value));
  assert.throws(() => data.addEan(state, state.codes[0].code), /已存在/); assert.deepEqual(state.codes[0], before.codes[0]);
});
test('EAN import commits valid rows, reports existing and in-file duplicates, skips blanks and retains old records', () => {
  const state = data.initialMiddleState(), before = structuredClone(state);
  const { state: next, batch } = data.importEans(state, '\ufeffEAN Code\r\n"0000000009001"\r\n\r\n0000000009001\r\n0000000001001\r\n12345\r\n0000000009002', 'mixed.csv');
  assert.equal(next.codes.length, state.codes.length + 2); assert.deepEqual(batch.rows.map(row => row.success), [true, false, false, false, true]);
  assert.match(batch.timeline[0].comment, /成功 2 条，失败 3 条/);
  assert.equal(next.codes.filter(row => row.code === '0000000009001').length, 1); assert.deepEqual(next.codes.find(row => row.id === 'EC-001'), before.codes[0]); assert.deepEqual(state, before);
  const retry = data.importEans(next, 'EAN\n0000000009001\n0000000009002', 'retry.csv');
  assert.equal(retry.state.codes.length, next.codes.length); assert.ok(retry.batch.rows.every(row => !row.success));
  for (const text of ['Wrong\n1234567890123', 'EAN Code', 'EAN Code\n"broken', `EAN Code\n${'0000000009001\n'.repeat(501)}`]) assert.throws(() => data.importEans(state, text, 'bad.csv'));
});
test('EAN export chooses only selected filtered records or all matches, preserving string codes', () => {
  const state = data.initialMiddleState(), rows = state.codes.filter(row => row.status === 'available');
  assert.equal(data.chosenEans(rows, []).length, 10); assert.equal(data.chosenEans(rows, [rows[0].id, state.codes[0].id]).length, 1);
  const exported = data.eanExportRows(data.chosenEans(rows, [rows[0].id]));
  assert.equal(exported[0][0], rows[0].code); assert.equal(exported[0][1], '可用'); assert.equal(exported[0].length, 9);
});
test('store identity rejects duplicate/imported SID and preserves shared fields, country and independent status', () => {
  const state = data.initialMiddleState(), before = structuredClone(state), row = state.stores[1], draft = data.storeDraft(row);
  assert.throws(() => data.saveStore(state, draft), /已存在/);
  assert.throws(() => data.saveStore(state, { ...draft, sid: 'local-import:1' }), /导入来源/);
  assert.throws(() => data.saveStore(state, { ...draft, groupId: 'invalid' }), /有效小组/);
  assert.throws(() => data.saveStore(state, { ...draft, reason: '' }, row.sid), /修改原因/);
  assert.throws(() => data.saveStore(state, { ...draft, reason: '核对', version: 0 }, row.sid), /已更新/);
  const next = data.saveStore(state, { ...draft, sid: 'forged', country: 'XX', active: false, reason: '暂停工作台使用' }, row.sid), updated = next.stores.find(item => item.sid === row.sid);
  assert.equal(updated.sid, row.sid); assert.equal(updated.country, row.country); assert.equal(updated.shortName, row.shortName); assert.deepEqual(updated.accountStatuses, row.accountStatuses); assert.equal(updated.active, false); assert.deepEqual(state, before);
  const fresh = data.saveStore(state, { ...data.storeDraft(), sid: 'DEMO-SID-013', name: '新站点', groupId: 'group-home' }).stores[0];
  assert.equal(fresh.dossier, null); assert.deepEqual(fresh.accountStatuses, []); assert.equal(fresh.active, true);
});
test('both order snapshots and after-sales references block reassignment atomically while same-group edits work', () => {
  const state = data.initialMiddleState(), before = structuredClone(state);
  for (const row of [state.stores[0], state.stores[4]]) {
    const groupId = row.groupId === 'group-daily' ? 'group-home' : 'group-daily';
    assert.throws(() => data.saveStore(state, { ...data.storeDraft(row), groupId, name: '不得部分保存', reason: '转组' }, row.sid), /不能转组/);
    const next = data.saveStore(state, { ...data.storeDraft(row), active: !row.active, reason: '工作台启停' }, row.sid);
    assert.equal(next.stores.find(item => item.sid === row.sid).groupId, row.groupId);
  }
  assert.deepEqual(state, before);
});
test('store handoff moves dossier group, removes only out-of-group owners, preserves source text and complete history', () => {
  const state = data.initialMiddleState(), row = state.stores[3];
  const next = data.saveStore(state, { ...data.storeDraft(row), groupId: 'group-daily', name: '橡木新名称-DE', platform: 'eBay', grade: 'B2', active: false, reason: '职责调整' }, row.sid), updated = next.stores.find(item => item.sid === row.sid);
  assert.equal(updated.dossier.groupId, 'group-daily'); assert.deepEqual(updated.dossier.ownerIds, ['owner-chen']); assert.equal(updated.dossier.sourceOwners, row.dossier.sourceOwners);
  for (const text of ['店铺名称', '平台', '等级', '所属小组', '工作台状态', '林同学', '职责调整', '源表负责人文字保留']) assert.ok(updated.timeline.at(-1).comment.includes(text));
  assert.equal(updated.timeline.length, row.timeline.length + 1); assert.deepEqual(row.dossier.ownerIds, ['owner-lin', 'owner-chen']);
  assert.equal(data.saveStore(next, { ...data.storeDraft(updated), reason: '无变化' }, row.sid), next);
  const pending = state.stores[2], assigned = data.saveStore(state, { ...data.storeDraft(pending), groupId: 'group-home', reason: '分配' }, pending.sid).stores.find(item => item.sid === pending.sid);
  assert.equal(assigned.dossier, null);
});
test('store search reuses AND/country aliases and exact status labels; filters intersect without guessing normality', () => {
  const state = data.initialMiddleState(), filter = search => ({ search, country: '', group: '', active: '' });
  assert.ok(data.filterStores(state.stores, filter('橡木 美国 amazon')).some(row => row.sid === 'DEMO-SID-001'));
  assert.deepEqual(data.filterStores(state.stores, filter('GB')).map(row => row.sid), data.filterStores(state.stores, filter('英国')).map(row => row.sid));
  const stopped = data.filterStores(state.stores, filter('停用')); assert.ok(stopped.some(row => row.sid === 'DEMO-SID-005')); assert.ok(stopped.some(row => row.sid === 'DEMO-SID-006')); assert.ok(!stopped.some(row => row.sid === 'DEMO-SID-002'));
  assert.ok(!data.filterStores(state.stores, filter('正常')).some(row => row.sid === 'DEMO-SID-007'));
  assert.ok(data.filterStores(state.stores, { ...filter('已归组'), country: 'US', group: 'group-home', active: 'active' }).every(row => row.country === 'US' && row.groupId === 'group-home' && row.active));
});
