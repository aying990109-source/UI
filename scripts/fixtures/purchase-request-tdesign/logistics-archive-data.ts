import { createEvent, type DetailEvent } from './history';

export const logisticsArchivePages = { warehouses: '海外仓', carriers: '物流商' };
export type ArchivePage = keyof typeof logisticsArchivePages;
export type Status = '启用' | '停用';
type Base = { id: string; timeline: DetailEvent[] };
export type Warehouse = Base & { name: string; site: string; purpose: string; region: string; address: string; order: number; status: Status; remark: string };
export type Carrier = Base & { name: string; code: string; contact: string; phone: string; order: number; status: Status; remark: string; defaultTemplateId: string };
export type Template = Base & { carrierId: string; name: string; transport: string; status: Status; defaultVersionId: string };
export const mappingColumns = ['Reference', 'Product Name', 'Quantity', 'Cartons', 'Destination'] as const;
export const sampleFields = { reference: '参考单号', product: '品名', quantity: '总件数', cartons: '总箱数', country: '目的国家' };
export type SampleField = keyof typeof sampleFields;
export type Mapping = Record<(typeof mappingColumns)[number], SampleField | ''>;
export type DemoInput = { reference: string; product: string; quantity: number; cartons: number; country: string };
export type TemplateVersion = Base & { templateId: string; revision: number; mapping: Mapping; mapped: boolean; reviewed: boolean; status: Status; sample: { id: string; mapping: string; cells: (string | number)[]; input: DemoInput } | null };
export type LogisticsArchiveState = { warehouses: Warehouse[]; carriers: Carrier[]; templates: Template[]; versions: TemplateVersion[] };
export type Draft<T> = Omit<T, 'id' | 'timeline'>;
const seedEvent = (comment: string) => createEvent('建立档案', '档案维护员（示例）', comment, '2026-10-10 09:30:00');
const event = (label: string, comment: string) => createEvent(label, '演示用户', comment);
const nextId = (prefix: string, rows: Base[]) => `${prefix}-${String(Math.max(0, ...rows.map(row => Number(row.id.split('-').at(-1)) || 0)) + 1).padStart(3, '0')}`;
function get<T extends Base>(rows: T[], id: string): T { const row = rows.find(row => row.id === id); if (!row) throw new Error('记录不存在，请重新选择'); return row; }
function text(value: string, label: string) { if (!value.trim()) throw new Error(`请填写${label}`); return value.trim(); }
function status(value: string) { if (!['启用', '停用'].includes(value)) throw new Error('状态无效'); }
function sortOrder(value: number) { if (!Number.isInteger(value) || value < 1 || value > 999999) throw new Error('排序须为 1 至 999999 的整数'); }
function diff<T extends object>(before: T, after: T, fields: Partial<Record<keyof T, string>>) { return (Object.keys(fields) as (keyof T)[]).filter(key => before[key] !== after[key]).map(key => `${fields[key]}：${before[key] || '未填写'} → ${after[key] || '未填写'}`).join('；'); }
const fullMapping = (): Mapping => ({ Reference: 'reference', 'Product Name': 'product', Quantity: 'quantity', Cartons: 'cartons', Destination: 'country' });
export const demoInput = (): DemoInput => ({ reference: 'DEMO-LOG-001', product: '折叠收纳箱（演示）', quantity: 120, cartons: 10, country: 'US' });

export function initialLogisticsArchiveState(): LogisticsArchiveState {
  const warehouses: Warehouse[] = [
    ['美西一号仓（示例）', 'US', 'FBA', '美国 · 加州', 10, '启用'], ['美西备用仓（示例）', 'US', 'FBA', '美国 · 内华达州', 20, '启用'], ['美东自发货仓（示例）', 'US', 'FBM', '美国 · 新泽西州', 10, '启用'], ['加拿大中转仓（示例）', 'CA', 'Canada', '加拿大 · 安大略省', 10, '启用'], ['eBay 专用仓（示例）', 'US', 'eBay', '美国 · 德克萨斯州', 10, '启用'], ['美西旧仓（示例）', 'US', 'FBA', '美国 · 加州', 5, '停用'],
  ].map(([name, site, purpose, region, order, status], i) => ({ id: `CK-00${i + 1}`, name: String(name), site: String(site), purpose: String(purpose), region: String(region), order: Number(order), status: status as Status, address: `Example Warehouse Park, Building ${i + 1}（合成地址）`, remark: i === 5 ? '历史仓库停用，保留查阅。' : '', timeline: [seedEvent(`建立 ${name}，用途 ${purpose}，排序 ${order}。`)] }));
  const carriers: Carrier[] = [
    ['示例远航国际物流', 'YH', '周女士（示例）', '启用', 'MB-001'], ['示例联桥供应链', 'LQ', '陈先生（示例）', '启用', ''], ['示例海程货运', 'HC', '张女士（示例）', '停用', 'MB-004'],
  ].map(([name, code, contact, status, defaultTemplateId], i) => ({ id: `WLS-00${i + 1}`, name, code, contact, status: status as Status, defaultTemplateId, phone: '000-0000-0000', order: (i + 1) * 10, remark: i === 2 ? '暂停合作，历史资料保留。' : '', timeline: [seedEvent(`建立 ${name}，状态 ${status}。`)] }));
  const templates: Template[] = [
    ['WLS-001', '海运标准下单模板', '普通海运', 'VER-001'], ['WLS-001', '空运下单模板', '空运', ''], ['WLS-002', '北美海运模板', '普通海运', ''], ['WLS-003', '历史海运模板', '普通海运', 'VER-004'],
  ].map(([carrierId, name, transport, defaultVersionId], i) => ({ id: `MB-00${i + 1}`, carrierId, name, transport, defaultVersionId, status: '启用', timeline: [seedEvent(`建立 ${name}，使用内置演示表结构。`)] }));
  const versions: TemplateVersion[] = templates.map((template, i) => {
    const reviewed = i === 0 || i === 3, mapping = fullMapping();
    if (i === 1) { mapping.Quantity = ''; mapping.Cartons = ''; }
    const input = demoInput(), id = `VER-00${i + 1}`;
    return { id, templateId: template.id, revision: 1, mapping, mapped: i !== 1, reviewed, status: reviewed ? '启用' : '停用', sample: reviewed ? { id: `SAMPLE-${id}-seed`, input, mapping: JSON.stringify(mapping), cells: mappingColumns.map(column => input[mapping[column] as SampleField]) } : null, timeline: [seedEvent('建立内置表结构的示例版本 V1。'), ...(reviewed ? [createEvent('样例核对通过', '档案维护员（示例）', '核对演示字段，启用为系列默认 V1。', '2026-10-11 14:20:00')] : [])] };
  });
  return { warehouses, carriers, templates, versions };
}

export function preferredWarehouse(state: LogisticsArchiveState, site: string, purpose: string) { return state.warehouses.filter(row => row.site === site && row.purpose === purpose && row.status === '启用').sort((a, b) => a.order - b.order)[0]; }
export function usableTemplate(state: LogisticsArchiveState, template: Template) { const version = state.versions.find(row => row.id === template.defaultVersionId && row.templateId === template.id); return template.status === '启用' && !!version?.reviewed && version.status === '启用' && version.mapped; }
export function versionStage(version: TemplateVersion) { return version.reviewed ? version.status === '启用' ? '已核对启用' : '已核对停用' : !version.mapped ? '待适配' : version.sample ? '待核对样例' : '待生成样例'; }
export function carrierTimeline(state: LogisticsArchiveState, carrierId: string) { const carrier = get(state.carriers, carrierId), templates = state.templates.filter(row => row.carrierId === carrierId); return [...carrier.timeline, ...templates.flatMap(template => [...template.timeline.map(item => ({ ...item, label: `${item.label} · ${template.name}` })), ...state.versions.filter(row => row.templateId === template.id).flatMap(version => version.timeline.map(item => ({ ...item, label: `${item.label} · ${template.name} V${version.revision}` })))])].sort((a, b) => a.time.localeCompare(b.time)); }

export function saveWarehouse(state: LogisticsArchiveState, draft: Draft<Warehouse>, id?: string): LogisticsArchiveState {
  const old = id ? get(state.warehouses, id) : undefined, name = text(draft.name, '仓库名称');
  if (!['US', 'CA'].includes(draft.site) || !['FBA', 'FBM', 'eBay', 'Canada', 'Other'].includes(draft.purpose)) throw new Error('请选择有效站点和用途');
  if (old && (name !== old.name || draft.site !== old.site)) throw new Error('本样板编辑保留仓名及站点，身份变更请另建档案');
  if (state.warehouses.some(row => row.id !== id && row.name === name)) throw new Error('该仓名已存在，请编辑原档案');
  sortOrder(draft.order); status(draft.status);
  const value = { ...draft, name }, comment = old ? diff<Draft<Warehouse>>(old, value, { purpose: '用途', region: '地区', address: '地址', order: '排序', status: '状态', remark: '备注' }) : `${name} · ${value.site} / ${value.purpose}，排序 ${value.order}。`;
  if (old && !comment) return state;
  const row: Warehouse = { ...value, id: id || nextId('CK', state.warehouses), timeline: [...old?.timeline || [], event(old ? '更新仓库资料' : '建立海外仓', comment)] };
  return { ...state, warehouses: old ? state.warehouses.map(item => item.id === id ? row : item) : [...state.warehouses, row] };
}
export function saveCarrier(state: LogisticsArchiveState, draft: Draft<Carrier>, id?: string): LogisticsArchiveState {
  const old = id ? get(state.carriers, id) : undefined, value = { ...draft, name: text(draft.name, '物流商名称'), code: draft.code.trim(), defaultTemplateId: old?.defaultTemplateId || '' };
  if (state.carriers.some(row => row.id !== id && (row.name === value.name || value.code && row.code === value.code))) throw new Error('物流商名称或编码重复，请核对已有档案');
  sortOrder(value.order); status(value.status);
  const comment = old ? diff<Draft<Carrier>>(old, value, { name: '名称', code: '编码', contact: '联系人', phone: '联系方式', order: '排序', status: '合作状态', remark: '备注' }) : `建立 ${value.name}，状态 ${value.status}。`;
  if (old && !comment) return state;
  const row: Carrier = { ...value, id: id || nextId('WLS', state.carriers), timeline: [...old?.timeline || [], event(old ? '更新物流商档案' : '建立物流商', comment)] };
  return { ...state, carriers: old ? state.carriers.map(item => item.id === id ? row : item) : [...state.carriers, row] };
}
export function saveTemplate(state: LogisticsArchiveState, draft: Draft<Template>, id?: string): LogisticsArchiveState {
  get(state.carriers, draft.carrierId); const old = id ? get(state.templates, id) : undefined;
  if (old && old.carrierId !== draft.carrierId) throw new Error('模板归属不可更改');
  const value = { ...draft, name: text(draft.name, '模板名称'), transport: text(draft.transport, '运输方式'), defaultVersionId: old?.defaultVersionId || '' }; status(value.status);
  if (state.templates.some(row => row.id !== id && row.carrierId === value.carrierId && row.name === value.name)) throw new Error('同物流商已有该模板名称');
  const comment = old ? diff<Draft<Template>>(old, value, { name: '模板名称', transport: '运输方式', status: '系列状态' }) : '使用内置五列表结构建立示例模板及未启用 V1。';
  if (old && !comment) return state;
  const row: Template = { ...value, id: id || nextId('MB', state.templates), timeline: [...old?.timeline || [], event(old ? '修改模板系列' : '建立模板系列', comment)] };
  return { ...state, templates: old ? state.templates.map(item => item.id === id ? row : item) : [...state.templates, row], versions: old ? state.versions : [...state.versions, { id: nextId('VER', state.versions), templateId: row.id, revision: 1, mapping: { Reference: '', 'Product Name': '', Quantity: '', Cartons: '', Destination: '' }, mapped: false, reviewed: false, status: '停用', sample: null, timeline: [event('建立示例版本', '内置五列表结构；请先配置字段映射。')] }] };
}
export function makeDefaultTemplate(state: LogisticsArchiveState, id: string): LogisticsArchiveState {
  const template = get(state.templates, id), carrier = get(state.carriers, template.carrierId);
  if (!usableTemplate(state, template)) throw new Error('请先核对启用该系列的默认版本');
  if (carrier.defaultTemplateId === id) return state;
  return { ...state, carriers: state.carriers.map(row => row.id === carrier.id ? { ...row, defaultTemplateId: id, timeline: [...row.timeline, event('切换默认模板', `${row.defaultTemplateId || '未设置'} → ${id}（${template.name}）；已有单据不改绑。`)] } : row) };
}
export function saveMapping(state: LogisticsArchiveState, id: string, mapping: Mapping): LogisticsArchiveState {
  const version = get(state.versions, id); if (version.reviewed) throw new Error('曾核对启用的版本不可原位修改，请复制为新版本');
  const values = mappingColumns.map(column => mapping[column]);
  if (values.some(value => !value || !(value in sampleFields)) || new Set(values).size !== 5) throw new Error('请为五列分别选择一个不同的来源字段');
  const comment = mappingColumns.filter(column => mapping[column] !== version.mapping[column]).map(column => `${column}：${sampleFields[version.mapping[column] as SampleField] || '未映射'} → ${sampleFields[mapping[column] as SampleField]}`).join('；');
  return { ...state, versions: state.versions.map(row => row.id === id ? { ...row, mapping: { ...mapping }, mapped: true, sample: null, timeline: [...row.timeline, event('保存字段映射', `${comment || '重新确认映射'}；旧演示样例已清除，需重新生成并核对。`)] } : row) };
}
export function generateSample(state: LogisticsArchiveState, id: string, input: DemoInput): LogisticsArchiveState {
  const version = get(state.versions, id); if (!version.mapped || version.reviewed) throw new Error('仅已适配且尚未核对的版本可生成样例');
  const value = { ...input, reference: text(input.reference, '演示参考单号'), product: text(input.product, '演示品名') };
  if (!Number.isInteger(value.quantity) || value.quantity <= 0 || !Number.isInteger(value.cartons) || value.cartons <= 0 || value.cartons > value.quantity || !['US', 'CA'].includes(value.country)) throw new Error('件数和箱数须为正整数，箱数不超过件数，国家须为 US 或 CA');
  const sample = { id: `${id}-S${version.timeline.length + 1}`, mapping: JSON.stringify(version.mapping), input: { ...value }, cells: mappingColumns.map(column => value[version.mapping[column] as SampleField]) };
  return { ...state, versions: state.versions.map(row => row.id === id ? { ...row, sample, timeline: [...row.timeline, event('生成演示样例', `${sample.id} · ${value.reference} · ${value.product} · ${value.quantity} 件 / ${value.cartons} 箱 · ${value.country}。`)] } : row) };
}
export function reviewVersion(state: LogisticsArchiveState, id: string, sampleId: string, approve: boolean, checked: boolean, reason: string): LogisticsArchiveState {
  const version = get(state.versions, id), template = get(state.templates, version.templateId);
  if (version.reviewed) throw new Error('已核对版本不能再次核对，请复制为新版本');
  if (!version.mapped || !version.sample || version.sample.id !== sampleId || version.sample.mapping !== JSON.stringify(version.mapping)) throw new Error('样例已失效，请重新生成并核对');
  if (approve && !checked) throw new Error('请先确认已核对当前演示样例');
  if (!approve && !reason.trim()) throw new Error('退回适配须填写原因');
  return { ...state, versions: state.versions.map(row => row.id === id ? { ...row, reviewed: approve, mapped: approve, status: approve ? '启用' : '停用', sample: approve ? row.sample : null, timeline: [...row.timeline, event(approve ? '核对通过并启用' : '退回适配', approve ? `核对 ${sampleId}；系列默认 ${template.defaultVersionId || '未设置'} → ${id}。${reason.trim()}` : reason.trim())] } : row), templates: approve ? state.templates.map(row => row.id === template.id ? { ...row, defaultVersionId: id } : row) : state.templates, carriers: approve ? state.carriers.map(row => row.id === template.carrierId && !row.defaultTemplateId ? { ...row, defaultTemplateId: template.id } : row) : state.carriers };
}
export function forkVersion(state: LogisticsArchiveState, id: string): LogisticsArchiveState {
  const source = get(state.versions, id); if (!source.reviewed) throw new Error('尚未核对的版本可直接编辑映射');
  const revision = Math.max(...state.versions.filter(row => row.templateId === source.templateId).map(row => row.revision)) + 1;
  const row: TemplateVersion = { ...source, id: nextId('VER', state.versions), revision, mapping: { ...source.mapping }, reviewed: false, status: '停用', sample: null, timeline: [event('复制为新版本', `从 ${source.id} / V${source.revision} 复制映射为 V${revision}；旧默认保持，需重新生成样例并核对。`)] };
  return { ...state, versions: [...state.versions.map(item => item.id === id ? { ...item, timeline: [...item.timeline, event('复制新版本', `创建 ${row.id} / V${revision}，原版本不变。`)] } : item), row] };
}
export function setVersionStatus(state: LogisticsArchiveState, id: string, active: boolean, makeDefault: boolean): LogisticsArchiveState {
  const version = get(state.versions, id), template = get(state.templates, version.templateId);
  if (!version.reviewed || !version.mapped) throw new Error('未核对的版本不能直接启用');
  if (!active && makeDefault) throw new Error('只能将启用版本设为默认');
  if ((version.status === '启用') === active && (!makeDefault || template.defaultVersionId === id)) return state;
  return { ...state, versions: state.versions.map(row => row.id === id ? { ...row, status: active ? '启用' : '停用', timeline: [...row.timeline, event(active ? '启用版本' : '停用版本', `${row.status} → ${active ? '启用' : '停用'}${makeDefault ? `；系列默认 ${template.defaultVersionId || '未设置'} → ${id}` : '；默认指向不变'}。已有单据不改绑，停用可能阻止重新生成文件。`)] } : row), templates: makeDefault ? state.templates.map(row => row.id === template.id ? { ...row, defaultVersionId: id } : row) : state.templates };
}
