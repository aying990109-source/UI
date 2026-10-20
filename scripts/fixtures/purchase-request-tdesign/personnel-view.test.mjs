import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const load = (file, dependencies = {}) => {
  const { outputText } = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } });
  const exports = {};
  new Function('require', 'exports', outputText)(name => { assert.ok(name in dependencies, `Unexpected import: ${name}`); return dependencies[name]; }, exports);
  return exports;
};
const { initialAccessState, saveDepartment, saveGroup, createMember } = load('./access-preview-data.ts', { './history': load('./history.ts') });
const { filterPersonnel, personnelTree } = load('./personnel-view.ts');
const filters = { query: '', status: 'all', roleId: '' };

test('department scope includes direct reports and subgroups, without leaking other departments', () => {
  const state = initialAccessState();
  state.members[0] = { ...state.members[0], groupId: '', group: '直属部门' };
  assert.deepEqual(filterPersonnel(state.members, { kind: 'department', id: 'ops' }, filters).map(row => row.id), ['USER-001', 'USER-002']);
  assert.deepEqual(filterPersonnel(state.members, { kind: 'group', id: 'home' }, filters).map(row => row.id), ['USER-002']);
  assert.equal(filterPersonnel(state.members, { kind: 'group', id: 'outdoor' }, filters).length, 0);
});

test('keyword, role, status and organization filters intersect; clearing filters keeps scope', () => {
  const state = initialAccessState();
  state.members[1].active = false;
  const scope = { kind: 'department', id: 'ops' };
  assert.deepEqual(filterPersonnel(state.members, scope, { query: ' LIN.DEMO ', status: 'disabled', roleId: 'ROLE-OPS' }).map(row => row.id), ['USER-002']);
  assert.equal(filterPersonnel(state.members, scope, { ...filters, roleId: 'ROLE-MANAGER' }).length, 0);
  assert.equal(filterPersonnel(state.members, scope, { ...filters, status: 'active' }).length, 1);
  assert.equal(filterPersonnel(state.members, scope, filters).length, 2);
});

test('organization search retains ancestors, empty groups and totals independent of filters', () => {
  const state = initialAccessState();
  const groupResult = personnelTree(state, '户外');
  assert.equal(groupResult.length, 1);
  assert.equal(groupResult[0].label, '运营部');
  assert.equal(groupResult[0].count, 2);
  assert.deepEqual(groupResult[0].children.map(row => [row.label, row.count]), [['户外组', 0]]);
  assert.deepEqual(personnelTree(state, '运营部')[0].children.map(row => row.id), ['home', 'outdoor']);
  assert.deepEqual(personnelTree(state, '不存在'), []);
});

test('new organizations and members appear immediately; renames preserve selection by ID', () => {
  let state = saveDepartment(initialAccessState(), 'new', 0, { name: '测试部门', managerId: '', selfApproverId: '', reason: '测试组织树' });
  const department = state.departments.at(-1);
  state = saveGroup(state, 'new', 0, { name: '测试小组', departmentId: department.id, leaderId: '', reason: '测试组织树' });
  const group = state.groups.at(-1);
  state = createMember(state, { name: '测试人员', username: 'tree.demo', departmentId: department.id, groupId: group.id, roleIds: [], active: true, reason: '测试计数' });
  state = saveGroup(state, group.id, 1, { name: '更名小组', departmentId: department.id, leaderId: '', reason: '测试稳定选择' });
  assert.equal(filterPersonnel(state.members, { kind: 'group', id: group.id }, filters)[0].group, '更名小组');
  assert.deepEqual(personnelTree(state, '更名')[0].children.map(row => [row.label, row.count]), [['更名小组', 1]]);
});
