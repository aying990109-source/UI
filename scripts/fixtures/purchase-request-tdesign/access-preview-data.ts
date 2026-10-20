import { createEvent, type DetailEvent } from './history';

export const accessPreviewPages = { personnel: '人员与组织', roles: '角色权限', ownership: '单据归属', audit: '权限记录' };
export const accessFeatures = ['采购申请', '店铺信息', '品牌档案', '销售数据', '目标管理'] as const;
export const accessScopes = ['本人', '本组', '负责小组', '全公司'] as const;
export type Member = { id: string; name: string; username: string; departmentId: string; department: string; groupId: string; group: string; roleIds: string[]; active: boolean; version: number; timeline: DetailEvent[] };
export type Role = { id: string; name: string; builtin: boolean; active: boolean; grants: Record<string, { read: string[]; edit: string[] }>; version: number; timeline: DetailEvent[] };
export type Ownership = { id: string; type: string; source: string; applicant: string; groupId: string; group: string; status: 'pending' | 'confirmed'; version: number; timeline: DetailEvent[] };
export type AccessAudit = { id: string; time: string; actor: string; event: string; target: string; summary: string };
export type AccessGroup = { id: string; name: string; departmentId: string; leaderId: string; version: number; timeline: DetailEvent[] };
export type AccessDepartment = { id: string; name: string; managerId: string; selfApproverId: string; version: number; timeline: DetailEvent[] };
export type AccessState = { members: Member[]; roles: Role[]; groups: AccessGroup[]; departments: AccessDepartment[]; ownerships: Ownership[]; audits: AccessAudit[] };
export const accessGroups = [{ id: 'home', name: '家居组' }, { id: 'daily', name: '日用组' }, { id: 'outdoor', name: '户外组' }];
const stamp = (event: string, summary: string) => createEvent(event, '演示管理员', summary);
const audit = (state: AccessState, event: string, target: string, summary: string): AccessAudit[] => [{ id: `AUD-${String(state.audits.length + 1).padStart(3, '0')}`, time: stamp(event, summary).time, actor: '演示管理员', event, target, summary }, ...state.audits];
export function initialAccessState(): AccessState {
  const roles: Role[] = [
    { id: 'ROLE-ADMIN', name: '内置管理员', builtin: true, active: true, grants: Object.fromEntries(accessFeatures.map(feature => [feature, { read: ['全公司'], edit: ['全公司'] }])), version: 1, timeline: [createEvent('建立内置角色', '系统（示例）', '启用功能内的内置管理员配置不可逐项削减。', '2026-10-10 10:00:00')] },
    { id: 'ROLE-OPS', name: '运营专员', builtin: false, active: true, grants: { '采购申请': { read: ['本人', '本组'], edit: ['本人'] }, '店铺信息': { read: ['本组'], edit: [] }, '销售数据': { read: ['本组'], edit: [] } }, version: 1, timeline: [createEvent('建立角色', '演示管理员', '读取与编辑范围分别配置。', '2026-10-10 11:00:00')] },
    { id: 'ROLE-MANAGER', name: '小组负责人', builtin: false, active: true, grants: { '采购申请': { read: ['本组', '负责小组'], edit: ['本组'] }, '店铺信息': { read: ['本组'], edit: ['本组'] }, '目标管理': { read: ['本组'], edit: ['本组'] } }, version: 1, timeline: [createEvent('建立角色', '演示管理员', '业务指定审批职责另行校验。', '2026-10-10 12:00:00')] },
  ];
  const members: Member[] = [
    { id: 'USER-001', name: '演示管理员', username: 'demo.admin', departmentId: 'ops', department: '运营部', groupId: 'home', group: '家居组', roleIds: ['ROLE-ADMIN'], active: true, version: 1, timeline: [createEvent('建立人员', '系统（示例）', '内置管理员示例。', '2026-10-10 10:00:00')] },
    { id: 'USER-002', name: '林同学', username: 'lin.demo', departmentId: 'ops', department: '运营部', groupId: 'home', group: '家居组', roleIds: ['ROLE-OPS'], active: true, version: 1, timeline: [createEvent('建立人员', '演示管理员', '当前归属家居组。', '2026-10-10 11:00:00')] },
    { id: 'USER-003', name: '周同学', username: 'zhou.demo', departmentId: 'commerce', department: '商务部', groupId: 'daily', group: '日用组', roleIds: ['ROLE-MANAGER'], active: true, version: 1, timeline: [createEvent('建立人员', '演示管理员', '指定小组负责人示例。', '2026-10-10 12:00:00')] },
  ];
  const ownerships: Ownership[] = [
    { id: 'OWN-001', type: '采购申请', source: 'CG20261017023', applicant: '林同学', groupId: 'home', group: '家居组', status: 'confirmed', version: 1, timeline: [createEvent('创建时确认归属快照', '系统（示例）', '人员后来调组不会迁移历史单据。', '2026-10-17 10:00:00')] },
    { id: 'OWN-002', type: '采购申请', source: 'CG20261016018', applicant: '周同学', groupId: 'daily', group: '日用组', status: 'pending', version: 1, timeline: [createEvent('历史归属待核对', '系统（示例）', '需独立管理权限与原因确认。', '2026-10-16 10:00:00')] },
  ];
  const groups = accessGroups.map((group, index) => ({ ...group, departmentId: index === 1 ? 'commerce' : 'ops', leaderId: index === 1 ? 'USER-003' : '', version: 1, timeline: [createEvent('建立小组', '系统（示例）', '合成组织示例。', '2026-10-10 10:00:00')] }));
  const departments: AccessDepartment[] = [{ id: 'ops', name: '运营部', managerId: '', selfApproverId: '', version: 1, timeline: [createEvent('建立部门', '系统（示例）', '合成组织示例。', '2026-10-10 10:00:00')] }, { id: 'commerce', name: '商务部', managerId: '', selfApproverId: '', version: 1, timeline: [createEvent('建立部门', '系统（示例）', '合成组织示例。', '2026-10-10 10:00:00')] }];
  return { members, roles, groups, departments, ownerships, audits: [{ id: 'AUD-001', time: '2026-10-16 10:00:00', actor: '系统（示例）', event: '历史归属待核对', target: 'OWN-002', summary: '待确认归属不会自动授予跨组数据访问。' }] };
}
export function saveMember(state: AccessState, id: string, version: number, draft: { name: string; username: string; departmentId: string; groupId: string; roleIds: string[]; active: boolean; reason: string }): AccessState {
  const old = state.members.find(row => row.id === id); if (!old || old.version !== version) throw new Error('人员版本已变化，请重新打开。');
  const department = state.departments.find(row => row.id === draft.departmentId), group = state.groups.find(row => row.id === draft.groupId);
  if (!department || draft.groupId && (!group || group.departmentId !== department.id) || !draft.name.trim() || !/^[a-z0-9._-]{3,64}$/i.test(draft.username.trim())) throw new Error('请填写姓名、合法账号名，并选择匹配的部门与小组。');
  if (state.members.some(row => row.id !== id && row.username.toLowerCase() === draft.username.trim().toLowerCase())) throw new Error('登录账号名已存在。');
  if (draft.roleIds.some(roleId => !state.roles.some(role => role.id === roleId && role.active))) throw new Error('所选角色不存在或已停用。');
  if (!draft.reason.trim()) throw new Error('请填写人员变更原因。');
  if (old.roleIds.includes('ROLE-ADMIN') && (!draft.active || !draft.roleIds.includes('ROLE-ADMIN')) && !state.members.some(row => row.id !== id && row.active && row.roleIds.includes('ROLE-ADMIN'))) throw new Error('不能移除最后一名有效内置管理员。');
  if (old.id === 'USER-003' && !draft.active && state.ownerships.some(row => row.status === 'pending')) throw new Error('存在待办审批或待确认归属，先完成交接。');
  if ((old.groupId !== draft.groupId || !draft.active) && state.groups.some(group => group.leaderId === id)) throw new Error('该人员仍是小组负责人，请先在小组维护中完成负责人交接。');
  if ((old.departmentId !== draft.departmentId || draft.groupId !== old.groupId && !!draft.groupId || !draft.active) && state.departments.some(dept => dept.managerId === id || dept.selfApproverId === id)) throw new Error('该人员仍承担部门审批职责，请先在部门维护中完成交接。');
  const changed = old.name !== draft.name || old.username !== draft.username || old.departmentId !== draft.departmentId || old.groupId !== draft.groupId || old.active !== draft.active || JSON.stringify(old.roleIds) !== JSON.stringify(draft.roleIds);
  if (!changed) return state;
  const event = stamp('人员与组织变更', `${old.name}：${old.department}/${old.group} → ${department.name}/${group?.name || '直属部门'}；角色 ${draft.roleIds.join('、') || '无'}；原因：${draft.reason.trim()}。历史单据归属不自动迁移。`);
  const member = { ...old, name: draft.name.trim(), username: draft.username.trim(), departmentId: department.id, department: department.name, groupId: group?.id || '', group: group?.name || '直属部门', roleIds: [...draft.roleIds], active: draft.active, version: old.version + 1, timeline: [...old.timeline, event] };
  return { ...state, members: state.members.map(row => row.id === id ? member : row), audits: audit(state, '人员与组织变更', id, event.comment) };
}
export function saveRole(state: AccessState, id: string, version: number, draft: { name: string; active: boolean; grants: Role['grants']; reason: string }): AccessState {
  const old = state.roles.find(row => row.id === id); if (!old || old.version !== version) throw new Error('角色版本已变化，请重新打开。');
  if (old.builtin) throw new Error('内置管理员的功能配置不可逐项削减。');
  if (!draft.name.trim() || !draft.reason.trim()) throw new Error('请填写角色名与变更原因。');
  if (state.roles.some(row => row.id !== id && row.name === draft.name.trim())) throw new Error('角色名已存在。');
  for (const [feature, scopes] of Object.entries(draft.grants)) {
    if (!accessFeatures.includes(feature as (typeof accessFeatures)[number]) || scopes.read.some(value => !accessScopes.includes(value as (typeof accessScopes)[number])) || scopes.edit.some(value => !accessScopes.includes(value as (typeof accessScopes)[number]) || !scopes.read.includes('全公司') && !scopes.read.includes(value))) throw new Error('编辑范围必须包含在该功能查看范围内。');
  }
  const changed = old.name !== draft.name || old.active !== draft.active || JSON.stringify(old.grants) !== JSON.stringify(draft.grants);
  if (!changed) return state;
  const event = stamp('角色配置变更', `${old.name} → ${draft.name.trim()}；原因：${draft.reason.trim()}。`);
  const role = { ...old, name: draft.name.trim(), active: draft.active, grants: structuredClone(draft.grants), version: old.version + 1, timeline: [...old.timeline, event] };
  return { ...state, roles: state.roles.map(row => row.id === id ? role : row), audits: audit(state, '角色配置变更', id, event.comment) };
}
export function confirmOwnership(state: AccessState, id: string, version: number, groupId: string, reason: string): AccessState {
  const old = state.ownerships.find(row => row.id === id); if (!old || old.version !== version) throw new Error('归属版本已变化，请重新打开。');
  if (old.status !== 'pending') throw new Error('只有待核对归属可确认；已确认单据不能任意转组。');
  const group = state.groups.find(row => row.id === groupId); if (!group || !reason.trim()) throw new Error('请选择确认小组并填写原因。');
  const event = stamp('确认历史单据归属', `${old.source}：${group.name}；原因：${reason.trim()}。`);
  const row: Ownership = { ...old, groupId: group.id, group: group.name, status: 'confirmed', version: old.version + 1, timeline: [...old.timeline, event] };
  return { ...state, ownerships: state.ownerships.map(item => item.id === id ? row : item), audits: audit(state, '确认历史单据归属', id, event.comment) };
}
export function createMember(state: AccessState, draft: Parameters<typeof saveMember>[3]): AccessState {
  const department = state.departments.find(row => row.id === draft.departmentId), group = state.groups.find(row => row.id === draft.groupId);
  if (!department || draft.groupId && (!group || group.departmentId !== department.id) || !draft.name.trim() || !/^[a-z0-9._-]{3,64}$/i.test(draft.username.trim()) || !draft.reason.trim()) throw new Error('请填写姓名、合法账号名、部门和创建原因。');
  if (state.members.some(row => row.username.toLowerCase() === draft.username.trim().toLowerCase())) throw new Error('登录账号名已存在。');
  if (draft.roleIds.some(id => !state.roles.some(role => role.id === id && role.active))) throw new Error('所选角色不存在或已停用。');
  const id = `USER-${String(Math.max(0, ...state.members.map(row => Number(row.id.replace('USER-', '')) || 0)) + 1).padStart(3, '0')}`;
  const summary = `建立合成人员 ${draft.name.trim()}；原因：${draft.reason.trim()}。不创建真实登录凭据。`;
  const member: Member = { id, name: draft.name.trim(), username: draft.username.trim(), departmentId: department.id, department: department.name, groupId: group?.id || '', group: group?.name || '直属部门', roleIds: [...draft.roleIds], active: draft.active, version: 1, timeline: [stamp('建立人员', summary)] };
  return { ...state, members: [...state.members, member], audits: audit(state, '建立人员', id, summary) };
}
export function createRole(state: AccessState, draft: Parameters<typeof saveRole>[3]): AccessState {
  if (!draft.name.trim() || !draft.reason.trim() || state.roles.some(row => row.name === draft.name.trim())) throw new Error('请填写唯一角色名与创建原因。');
  for (const [feature, scopes] of Object.entries(draft.grants)) if (!accessFeatures.includes(feature as typeof accessFeatures[number]) || scopes.read.some(value => !accessScopes.includes(value as typeof accessScopes[number])) || scopes.edit.some(value => !accessScopes.includes(value as typeof accessScopes[number]) || !scopes.read.includes('全公司') && !scopes.read.includes(value))) throw new Error('编辑范围必须包含在该功能查看范围内。');
  const id = `ROLE-${String(Math.max(0, ...state.roles.map(row => Number(row.id.replace('ROLE-', '')) || 0)) + 1).padStart(3, '0')}`;
  const summary = `建立合成角色 ${draft.name.trim()}；原因：${draft.reason.trim()}。`;
  return { ...state, roles: [...state.roles, { id, name: draft.name.trim(), builtin: false, active: draft.active, grants: structuredClone(draft.grants), version: 1, timeline: [stamp('建立角色', summary)] }], audits: audit(state, '建立角色', id, summary) };
}
export function saveGroup(state: AccessState, id: string, version: number, draft: { name: string; departmentId: string; leaderId: string; reason: string }): AccessState {
  const old = state.groups.find(row => row.id === id);
  if (old && old.version !== version) throw new Error('小组版本已变化，请重新打开。');
  if (!draft.name.trim() || !draft.reason.trim() || !state.departments.some(row => row.id === draft.departmentId) || old && old.departmentId !== draft.departmentId || state.groups.some(row => row.id !== id && row.name === draft.name.trim())) throw new Error('请填写唯一小组名、所属部门与变更原因；已有小组不能直接转部门。');
  if (draft.leaderId && !state.members.some(row => row.id === draft.leaderId && row.active && row.groupId === id)) throw new Error('负责人须为当前小组的有效人员。');
  if (old && old.name === draft.name.trim() && old.leaderId === draft.leaderId) return state;
  const groupId = old?.id || `group-${Math.max(0, ...state.groups.map(row => Number(row.id.replace('group-', '')) || 0)) + 1}`;
  const summary = `${old ? '维护' : '建立'}小组 ${draft.name.trim()}；原因：${draft.reason.trim()}。历史单据归属名称保留原快照。`;
  const group: AccessGroup = { id: groupId, name: draft.name.trim(), departmentId: draft.departmentId, leaderId: draft.leaderId, version: (old?.version || 0) + 1, timeline: [...(old?.timeline || []), stamp(old ? '小组变更' : '建立小组', summary)] };
  return { ...state, groups: old ? state.groups.map(row => row.id === id ? group : row) : [...state.groups, group], members: old ? state.members.map(row => row.groupId === id ? { ...row, group: group.name } : row) : state.members, audits: audit(state, old ? '小组变更' : '建立小组', groupId, summary) };
}
export function saveDepartment(state: AccessState, id: string, version: number, draft: { name: string; managerId: string; selfApproverId: string; reason: string }): AccessState {
  const old = state.departments.find(row => row.id === id);
  if (old && old.version !== version) throw new Error('部门版本已变化，请重新打开。');
  if (!draft.name.trim() || !draft.reason.trim() || state.departments.some(row => row.id !== id && row.name === draft.name.trim())) throw new Error('请填写唯一部门名与变更原因。');
  if (draft.managerId && draft.managerId === draft.selfApproverId) throw new Error('经理本人申请的审批人不能是经理本人。');
  for (const userId of [draft.managerId, draft.selfApproverId].filter(Boolean)) {
    const person = state.members.find(row => row.id === userId && row.active);
    if (!person || !person.roleIds.some(roleId => { const role = state.roles.find(value => value.id === roleId && value.active); return !!role?.grants['采购申请']?.edit.length; })) throw new Error('部门经理与替代审批人须为有效人员，且具备采购申请审批配置。');
  }
  if (draft.managerId && state.groups.some(group => group.leaderId === draft.managerId)) throw new Error('组长改任部门经理前须先交接小组负责人。');
  if (old && old.name === draft.name.trim() && old.managerId === draft.managerId && old.selfApproverId === draft.selfApproverId) return state;
  const departmentId = old?.id || `dept-${Math.max(0, ...state.departments.map(row => Number(row.id.replace('dept-', '')) || 0)) + 1}`;
  const summary = `${old ? '维护' : '建立'}部门 ${draft.name.trim()}；经理 ${draft.managerId || '未指定'}；本人申请审批人 ${draft.selfApproverId || '未指定'}；原因：${draft.reason.trim()}。`;
  const department: AccessDepartment = { id: departmentId, name: draft.name.trim(), managerId: draft.managerId, selfApproverId: draft.selfApproverId, version: (old?.version || 0) + 1, timeline: [...(old?.timeline || []), stamp(old ? '部门配置变更' : '建立部门', summary)] };
  const members = state.members.map(row => row.departmentId !== departmentId ? row : draft.managerId === row.id && row.groupId ? { ...row, department: department.name, groupId: '', group: '直属部门', version: row.version + 1, timeline: [...row.timeline, stamp('部门经理直属部门', '任命部门经理后，从原小组转为部门直属。')] } : { ...row, department: department.name });
  return { ...state, departments: old ? state.departments.map(row => row.id === id ? department : row) : [...state.departments, department], members, audits: audit(state, old ? '部门配置变更' : '建立部门', departmentId, summary) };
}
