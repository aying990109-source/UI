import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const load = (file, dependencies = {}) => { const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText; const exports = {}; new Function('require', 'exports', code)(name => { assert.ok(name in dependencies, `Unexpected import: ${name}`); return dependencies[name]; }, exports); return exports; };
const data = load('./access-preview-data.ts', { './history': load('./history.ts') });
test('member move does not move history and last admin is protected', () => {
  const state = data.initialAccessState(), admin = state.members[0], member = state.members[1];
  assert.throws(() => data.saveMember(state, admin.id, admin.version, { ...admin, roleIds: [], reason: '测试' }), /最后一名/);
  const next = data.saveMember(state, member.id, member.version, { ...member, departmentId: 'commerce', groupId: 'daily', reason: '组织调整' });
  assert.equal(next.members[1].group, '日用组'); assert.equal(next.ownerships[0].group, '家居组');
  assert.equal(next.audits[0].target, member.id);
  assert.throws(() => data.saveMember(next, member.id, member.version, { ...member, departmentId: 'commerce', groupId: 'daily', reason: '重试' }), /版本/);
});
test('role edits stay within read scopes; ownership confirms pending only', () => {
  const state = data.initialAccessState(), role = state.roles[1], pending = state.ownerships[1];
  assert.throws(() => data.saveRole(state, state.roles[0].id, 1, { name: '管理员', active: true, grants: {}, reason: '测试' }), /内置管理员/);
  assert.throws(() => data.saveRole(state, role.id, role.version, { name: role.name, active: true, grants: { '采购申请': { read: ['本人'], edit: ['全公司'] } }, reason: '测试' }), /编辑范围/);
  const covered = data.saveRole(state, role.id, role.version, { name: role.name, active: true, grants: { '采购申请': { read: ['全公司'], edit: ['本人'] } }, reason: '全公司查看本人编辑' });
  assert.deepEqual(covered.roles[1].grants['采购申请'], { read: ['全公司'], edit: ['本人'] });
  assert.throws(() => data.saveRole(state, role.id, role.version, { name: role.name, active: true, grants: { '采购申请': { read: ['本组'], edit: ['负责小组'] } }, reason: '测试' }), /编辑范围/);
  const next = data.confirmOwnership(state, pending.id, pending.version, 'home', '核对原始申请');
  assert.equal(next.ownerships[1].group, '家居组'); assert.equal(next.ownerships[1].status, 'confirmed');
  assert.throws(() => data.confirmOwnership(next, pending.id, pending.version + 1, 'daily', '再转组'), /只有待核对/);
});
test('local member, role and group creation record changes without moving ownership snapshots', () => {
  let state = data.initialAccessState();
  state = data.createRole(state, { name: '只读核查', active: true, grants: { '销售数据': { read: ['全公司'], edit: [] } }, reason: '演示' });
  assert.ok(state.roles.some(row => row.name === '只读核查'));
  state = data.createMember(state, { name: '陈同学', username: 'chen.demo', departmentId: 'ops', groupId: 'home', roleIds: [state.roles.at(-1).id], active: true, reason: '演示' });
  const member = state.members.at(-1);
  assert.equal(member.group, '家居组');
  state = data.saveGroup(state, 'home', 1, { name: '家居运营组', departmentId: 'ops', leaderId: member.id, reason: '更名与负责人' });
  assert.equal(state.groups[0].leaderId, member.id);
  assert.equal(state.members.at(-1).group, '家居运营组');
  assert.equal(state.ownerships[0].group, '家居组');
  assert.throws(() => data.saveGroup(state, 'daily', 1, { name: '日用组', departmentId: 'commerce', leaderId: member.id, reason: '越组' }), /负责人/);
});
test('group leader must hand off before moving or disabling', () => {
  const state = data.initialAccessState(), leader = state.members[2];
  assert.throws(() => data.saveMember(state, leader.id, leader.version, { ...leader, departmentId: 'ops', groupId: 'home', reason: '调组' }), /负责人交接/);
  assert.throws(() => data.saveMember(state, leader.id, leader.version, { ...leader, active: false, reason: '停用' }), /交接|待办/);
  const handed = data.saveGroup(state, 'daily', 1, { name: '日用组', departmentId: 'commerce', leaderId: '', reason: '先交接' });
  const moved = data.saveMember(handed, leader.id, leader.version, { ...leader, departmentId: 'ops', groupId: 'home', reason: '交接后调组' });
  assert.equal(moved.members[2].groupId, 'home'); assert.equal(moved.ownerships[1].group, '日用组');
  assert.throws(() => data.saveGroup(state, 'new', 0, { name: '新组', departmentId: 'ops', leaderId: leader.id, reason: '跨组指派' }), /负责人/);
});
test('department manager becomes direct report and cannot approve own request', () => {
  const state = data.initialAccessState();
  assert.throws(() => data.saveDepartment(state, 'ops', 1, { name: '运营部', managerId: 'USER-001', selfApproverId: 'USER-001', reason: '错误配置' }), /不能是经理本人/);
  const next = data.saveDepartment(state, 'ops', 1, { name: '运营部', managerId: 'USER-001', selfApproverId: 'USER-002', reason: '配置审批职责' });
  assert.equal(next.members[0].groupId, ''); assert.equal(next.members[0].departmentId, 'ops');
  assert.equal(next.departments[0].selfApproverId, 'USER-002');
  assert.throws(() => data.saveMember(next, 'USER-001', next.members[0].version, { ...next.members[0], groupId: 'home', reason: '回组' }), /部门审批职责/);
  assert.equal(next.ownerships[0].group, '家居组');
});
