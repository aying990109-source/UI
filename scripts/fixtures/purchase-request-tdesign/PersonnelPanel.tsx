import { FileTransferActions } from './FileTransferActions';
import { useState } from 'react';
import { Button, Empty, Input, Pagination, PrimaryTable, Select, Tree, type PrimaryTableCol } from 'tdesign-react';
import { AddIcon, ChevronDownIcon, SearchIcon } from 'tdesign-icons-react';
import { MobilePagination } from './PreviewPagination';
import type { AccessState, Member } from './access-preview-data';
import { filterPersonnel, personnelTree, type PersonnelScope } from './personnel-view';
import './personnel.css';

type Props = {
  state: AccessState;
  columns: PrimaryTableCol<Member>[];
  onCreateMember: (departmentId: string, groupId: string) => void;
  onEditDepartment: (id: string) => void;
  onDepartmentDetail: (id: string) => void;
  onEditGroup: (id: string) => void;
};

export function PersonnelPanel({ state, columns, onCreateMember, onEditDepartment, onDepartmentDetail, onEditGroup }: Props) {
  const [scope, setScope] = useState<PersonnelScope>({ kind: 'all', id: '' });
  const [organizationQuery, setOrganizationQuery] = useState('');
  const [query, setQuery] = useState(''), [status, setStatus] = useState('all'), [roleId, setRoleId] = useState('');
  const [expanded, setExpanded] = useState<string[]>(state.departments.map(row => `department:${row.id}`));
  const [organizationOpen, setOrganizationOpen] = useState(false);
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(10);
  const tree = personnelTree(state, organizationQuery);
  const group = scope.kind === 'group' ? state.groups.find(row => row.id === scope.id) : undefined;
  const department = state.departments.find(row => row.id === (scope.kind === 'department' ? scope.id : group?.departmentId));
  const createMember = () => onCreateMember(department?.id || state.departments[0]?.id || '', group?.id || '');
  const title = group?.name || department?.name || '全部人员';
  const memberName = (id: string) => state.members.find(row => row.id === id)?.name || '未指定';
  const members = filterPersonnel(state.members, scope, { query, status, roleId });
  const current = Math.min(page, Math.max(1, Math.ceil(members.length / pageSize)));
  const selectScope = (next: PersonnelScope) => { setScope(next); setPage(1); };
  const reset = () => { setQuery(''); setStatus('all'); setRoleId(''); setPage(1); };
  const hasFilters = !!query || status !== 'all' || !!roleId;

  return <section className="personnel-workspace" aria-label="人员与组织">
    <h1 className="sr-only">人员与组织</h1>
    <aside className={`personnel-organizations${organizationOpen ? ' is-open' : ''}`} aria-label="组织筛选">
      <div className="personnel-organizations-heading">
        <h2>组织架构</h2>
        <Button className="personnel-organizations-toggle" variant="text" aria-expanded={organizationOpen} aria-controls="personnel-organization-content" onClick={() => setOrganizationOpen(!organizationOpen)}>{organizationOpen ? '收起' : '展开'}<ChevronDownIcon /></Button>
      </div>
      <div className="personnel-organization-content" id="personnel-organization-content">
        <label className="personnel-tree-search"><span className="sr-only">搜索部门或小组</span><Input value={organizationQuery} clearable prefixIcon={<SearchIcon />} placeholder="搜索部门或小组" onChange={setOrganizationQuery} /></label>
        <nav className="personnel-tree" aria-label="选择部门或小组">
          <button type="button" className="personnel-all" aria-pressed={scope.kind === 'all'} onClick={() => selectScope({ kind: 'all', id: '' })}><span>全部人员</span><span className="personnel-count">{state.members.length}</span></button>
          <Tree data={tree} hover activable actived={scope.kind === 'all' ? [] : [`${scope.kind}:${scope.id}`]} expanded={organizationQuery.trim() ? tree.map(node => node.value) : expanded} onExpand={values => setExpanded(values.map(String))} transition={false}
            onActive={(_values, { node }) => selectScope({ kind: node.data.kind, id: node.data.id })}
            empty={<p className="personnel-tree-empty">未找到部门或小组</p>}
            icon={node => Array.isArray(node.data.children) && node.data.children.length ? <button type="button" className="personnel-tree-toggle" aria-label={`${node.expanded ? '收起' : '展开'}${node.label}`} aria-expanded={node.expanded} disabled={!!organizationQuery.trim()} onClick={event => { event.stopPropagation(); setExpanded(values => node.expanded ? values.filter(value => value !== node.value) : [...values, String(node.value)]); }}><ChevronDownIcon className={node.expanded ? '' : 'is-collapsed'} /></button> : null}
            label={node => <button type="button" className="personnel-tree-node" aria-pressed={scope.kind === node.data.kind && scope.id === node.data.id} onClick={event => { event.stopPropagation(); selectScope({ kind: node.data.kind, id: node.data.id }); }}><span className="personnel-node-name">{node.label}</span><span className="personnel-count">{node.data.count}</span></button>}
          />
        </nav>
        <div className="personnel-organization-actions"><Button variant="outline" onClick={() => onEditDepartment('new')}>建立部门</Button><Button variant="outline" onClick={() => onEditGroup('new')}>建立小组</Button></div>
      </div>
    </aside>
    <div className="personnel-content">
      <header className="personnel-heading">
        <div><h2>{group && <span className="personnel-parent">{department?.name} / </span>}{title}</h2><p>{scope.kind === 'all' ? `${state.departments.length} 个部门 · ${state.groups.length} 个小组` : group ? `负责人：${memberName(group.leaderId)} · v${group.version}` : `包含部门直属及下属小组人员 · v${department?.version}`}</p></div>
        <div className="personnel-heading-actions">{scope.kind === 'department' && department && <><Button variant="text" theme="primary" onClick={() => onDepartmentDetail(department.id)}>部门详情</Button><Button variant="outline" onClick={() => onEditDepartment(department.id)}>配置部门</Button></>}{group && <Button variant="outline" onClick={() => onEditGroup(group.id)}>维护小组</Button>}<Button theme="primary" icon={<AddIcon />} onClick={createMember}>建立合成人员</Button></div>
      </header>
      {scope.kind === 'department' && department && <div className="personnel-department-meta"><span>部门经理：{memberName(department.managerId)}</span><span>经理本人申请审批人：{memberName(department.selfApproverId)}</span></div>}
      <div className="personnel-filters" role="search" aria-label="筛选人员">
        <label className="personnel-keyword"><span>关键词</span><Input value={query} prefixIcon={<SearchIcon />} clearable placeholder="搜索姓名、账号或组织" onChange={value => { setQuery(value); setPage(1); }} /></label>
        <label><span>人员状态</span><Select autoWidth value={status} options={[{ value: 'all', label: '全部状态' }, { value: 'active', label: '启用' }, { value: 'disabled', label: '停用' }]} onChange={value => { setStatus(String(value)); setPage(1); }} /></label>
        <label><span>绑定角色</span><Select autoWidth value={roleId} clearable placeholder="全部角色" options={state.roles.map(row => ({ value: row.id, label: row.name }))} onChange={value => { setRoleId(String(value || '')); setPage(1); }} /></label>
        <Button variant="outline" onClick={reset}>重置筛选</Button>
      </div>
      <div className="list-filter-files" role="group" aria-label="导入导出"><FileTransferActions title="人员与组织" data={{ headers: ['人员编号', '姓名', '账号', '部门', '小组', '角色', '状态'], rows: members.map(row => [row.id, row.name, row.username, row.department, row.group, row.roleIds.map(id => state.roles.find(role => role.id === id)?.name || id).join('、'), row.active ? '启用' : '停用']) }} /></div>
      <div className="personnel-results"><span role="status">共 {members.length} 名人员{hasFilters ? ' · 已筛选' : ''}</span><span>调组不迁移历史单据归属</span></div>
      {members.length ? <>
        <div className="table-scroll personnel-table" role="region" tabIndex={0} aria-label="人员列表，可横向滚动"><PrimaryTable rowKey="id" data={members.slice((current - 1) * pageSize, current * pageSize)} columns={columns} size="small" hover tableLayout="fixed" /></div>
        <div className="personnel-pagination"><Pagination current={current} pageSize={pageSize} total={members.length} pageSizeOptions={[10, 20, 50]} showJumper={false} onChange={info => { setPage(info.pageSize !== pageSize ? 1 : info.current); setPageSize(info.pageSize); }} /></div>
        <div className="personnel-mobile-pagination"><MobilePagination current={current} pageSize={pageSize} total={members.length} onChange={setPage} /></div>
      </> : <div className="personnel-empty"><Empty title={hasFilters ? '没有符合筛选条件的人员' : '当前组织暂无人员'} description={`当前范围：${title}`} action={hasFilters ? <Button variant="outline" onClick={reset}>重置筛选</Button> : <Button variant="outline" onClick={createMember}>建立合成人员</Button>} /></div>}
    </div>
  </section>;
}
