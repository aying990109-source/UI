import type { AccessState, Member } from './access-preview-data';

export type PersonnelScope = { kind: 'all' | 'department' | 'group'; id: string };
export type PersonnelFilters = { query: string; status: string; roleId: string };

export function filterPersonnel(members: Member[], scope: PersonnelScope, filters: PersonnelFilters) {
  const query = filters.query.trim().toLowerCase();
  return members.filter(member =>
    (scope.kind === 'all' || (scope.kind === 'department' ? member.departmentId === scope.id : member.groupId === scope.id)) &&
    `${member.name} ${member.username} ${member.id} ${member.department} ${member.group}`.toLowerCase().includes(query) &&
    (filters.status === 'all' || member.active === (filters.status === 'active')) &&
    (!filters.roleId || member.roleIds.includes(filters.roleId)));
}

export function personnelTree(state: AccessState, query: string) {
  const keyword = query.trim().toLowerCase();
  return state.departments.map(department => {
    const departmentMatches = department.name.toLowerCase().includes(keyword);
    const children = state.groups.filter(group => group.departmentId === department.id &&
      (departmentMatches || group.name.toLowerCase().includes(keyword))).map(group => ({
      value: `group:${group.id}`, label: group.name, kind: 'group' as const, id: group.id,
      count: state.members.filter(member => member.groupId === group.id).length,
    }));
    return {
      value: `department:${department.id}`, label: department.name, kind: 'department' as const, id: department.id,
      count: state.members.filter(member => member.departmentId === department.id).length,
      children, visible: departmentMatches || children.length > 0,
    };
  }).filter(department => department.visible);
}
