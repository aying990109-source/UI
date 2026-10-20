import type { AfterSalesStore } from '../../../src/lib/types';
import { parseCsvRows } from '../../../src/lib/csv';
import { storeView } from '../../../src/features/middle-data/store-group-view';
import { createEvent, type DetailEvent } from './history';

export const middlePages = { eanPool: 'EAN 码池', storeBindings: '店铺归组' };
export const eanStatuses = { available: '可用', issued: '已发放', disabled: '停用' };
export const demoGroups = [{ id: 'group-home', name: '家居组' }, { id: 'group-daily', name: '日用组' }, { id: 'group-outdoor', name: '户外组' }];
export const demoOwners = [{ id: 'owner-lin', name: '林同学（示例）', groupIds: ['group-home'] }, { id: 'owner-chen', name: '陈同学（示例）', groupIds: ['group-home', 'group-daily'] }];
export type EanRecord = { id: string; code: string; status: keyof typeof eanStatuses; asin: string; user: string; brand: string; product: string; request: string; issuedAt: string; addedBy: string; addedAt: string; timeline: DetailEvent[] };
export type DemoStore = AfterSalesStore & { references: string[]; dossier: { groupId: string; ownerIds: string[]; sourceOwners: string } | null; timeline: DetailEvent[] };
export type StoreDraft = { sid: string; name: string; country: string; platform: string; groupId: string; grade: string; active: boolean; reason: string; version: number };
export type ImportRow = { line: number; code: string; success: boolean; message: string };
export type EanImport = { id: string; source: string; rows: ImportRow[]; timeline: DetailEvent[] };
export type MiddleState = { codes: EanRecord[]; stores: DemoStore[]; imports: EanImport[] };
const seeded = (label: string, time: string, comment: string): DetailEvent => ({ label, time, comment, operator: '中台维护员（示例）' });
export const groupName = (id: string | null) => demoGroups.find(row => row.id === id)?.name || '未归组';

export function initialMiddleState(): MiddleState {
  // shortcut: independent synthetic pools; connect authorized server transactions when this fixture moves to production.
  const codes: EanRecord[] = Array.from({ length: 15 }, (_, i) => {
    const code = String(1001 + i).padStart(13, '0'), status = i < 3 ? 'issued' : i > 12 ? 'disabled' : 'available';
    const addedAt = '2026-10-10 09:00:00', issuedAt = status === 'issued' ? `2026-10-12 10:0${i}:00` : '';
    return { id: `EC-${String(i + 1).padStart(3, '0')}`, code, status, asin: status === 'issued' ? `DEMO-ASIN-${i + 1}` : '', user: status === 'issued' ? '演示运营员' : '', brand: status === 'issued' ? 'DEMO NORTH' : '', product: status === 'issued' ? ['折叠收纳箱', '桌面理线盒', '旅行收纳袋'][i] : '', request: status === 'issued' ? `LIST-DEMO-${i + 1}` : '', addedBy: '中台维护员（示例）', addedAt, issuedAt, timeline: [seeded('加入码池', addedAt, '合成码值，仅用于本页演示。'), ...(status === 'issued' ? [seeded('审批发放（历史示例）', issuedAt, `绑定 LIST-DEMO-${i + 1}，仅展示已存在的示例关联。`)] : status === 'disabled' ? [seeded('历史停用记录', '2026-10-13 11:00:00', '示例池中的既有停用状态，本页不提供停用或回收操作。')] : [])] };
  });
  const stores: DemoStore[] = Array.from({ length: 12 }, (_, i) => {
    const country = ['US', 'CA', 'UK', 'DE'][i % 4], groupId = i === 2 || i === 6 ? null : demoGroups[i % 3].id;
    return { sid: `DEMO-SID-${String(i + 1).padStart(3, '0')}`, name: `${['橡木家居', '晴川生活', '远行户外'][Math.floor(i / 4)]}-${country}`, shortName: i === 6 ? '' : `${['橡木', '晴川', '远行'][Math.floor(i / 4)]}${country}`, country, platform: i === 10 ? 'eBay' : 'Amazon', groupId, groupName: groupName(groupId), departmentId: null, grade: i % 3 ? 'A1' : '', active: i !== 4, version: 1, accountStatuses: i === 1 ? ['存在停用风险'] : i === 5 ? ['停用', '待核验'] : i === 6 ? [] : ['正常'], references: i === 0 ? ['已保存的平台订单快照'] : i === 4 ? ['售后记录'] : [], dossier: i === 3 ? { groupId: groupId!, ownerIds: ['owner-lin', 'owner-chen'], sourceOwners: '林同学、陈同学（原表文字）' } : null, timeline: [seeded('建立归组档案', '2026-10-10 09:30:00', `站点 ${country}；${groupId ? `归属${groupName(groupId)}` : '待分配小组'}；工作台${i === 4 ? '停用' : '启用'}。`)] };
  });
  return { codes, stores, imports: [] };
}

export function normalizeEan(value: string) { const code = value.trim(); if (!/^[0-9]{13}$/.test(code)) throw new Error('EAN Code 必须是 13 位数字，请保留开头的 0。'); return code; }
export function addEan(state: MiddleState, value: string, source = '手动添加'): MiddleState {
  const code = normalizeEan(value); if (state.codes.some(row => row.code === code)) throw new Error('EAN Code 已存在，不会覆盖原记录。');
  const event = createEvent('加入码池', '演示用户', source), row: EanRecord = { id: `EC-${String(state.codes.length + 1).padStart(3, '0')}`, code, status: 'available', asin: '', user: '', brand: '', product: '', request: '', issuedAt: '', addedBy: event.operator, addedAt: event.time, timeline: [event] };
  return { ...state, codes: [row, ...state.codes] };
}
export function importEans(state: MiddleState, text: string, source: string): { state: MiddleState; batch: EanImport } {
  if (text.length > 1000000) throw new Error('示例导入内容最多 1 MB，请拆分后重试。');
  const table = parseCsvRows(text), headers = table[0]?.map(value => value.trim()) || [], aliases = ['EAN Code', 'EAN', 'EAN码', 'EAN 码'];
  const index = headers.findIndex(value => aliases.includes(value));
  if (index < 0) throw new Error('CSV 缺少 EAN Code 列，请使用模板表头。');
  if (table.length < 2) throw new Error('CSV 没有可导入的数据行。');
  if (table.length > 501) throw new Error('示例一次最多导入 500 条，请拆分后重试。');
  let next = state;
  const rows = table.slice(1).map((cells, i): ImportRow => {
    const code = (cells[index] || '').trim();
    try { next = addEan(next, code, `${source} · 数据行 ${i + 2}（含表头，不计空行）`); return { line: i + 2, code, success: true, message: '已加入可用码池' }; }
    catch (cause) { return { line: i + 2, code, success: false, message: (cause as Error).message }; }
  });
  const successes = rows.filter(row => row.success).length;
  const batch: EanImport = { id: `IMP-${String(state.imports.length + 1).padStart(3, '0')}`, source, rows, timeline: [createEvent('导入处理完成', '演示用户', `${source}：成功 ${successes} 条，失败 ${rows.length - successes} 条。有效行已保存，原有码值未覆盖。`)] };
  return { state: { ...next, imports: [...state.imports, batch] }, batch };
}
export function eanExportRows(rows: EanRecord[]) { return rows.map(row => [row.code, eanStatuses[row.status], row.asin, row.user, row.brand, row.product, row.issuedAt, row.addedBy, row.addedAt]); }
export function chosenEans(rows: EanRecord[], selected: (string | number)[]) { return selected.length ? rows.filter(row => selected.includes(row.id)) : rows; }
export function storeDraft(row?: DemoStore): StoreDraft { return { sid: row?.sid || '', name: row?.name || '', country: row?.country || '', platform: row?.platform || '', groupId: row?.groupId || '', grade: row?.grade || '', active: row?.active ?? true, reason: '', version: row?.version || 1 }; }
export function filterStores(stores: DemoStore[], filters: { search: string; country: string; group: string; active: string }) { return storeView(stores, filters, { groups: demoGroups }) as DemoStore[]; }
export function saveStore(state: MiddleState, draft: StoreDraft, sid?: string): MiddleState {
  const old = sid ? state.stores.find(row => row.sid === sid) : undefined;
  if (sid && !old) throw new Error('店铺已不存在，请关闭后重试。');
  const identity = old?.sid || draft.sid.trim(), name = draft.name.trim(), platform = draft.platform.trim(), grade = draft.grade.trim(), reason = draft.reason.trim();
  if (!identity || !name || !draft.groupId) throw new Error('请填写店铺名称、领星店铺 ID 和所属小组。');
  if (identity.startsWith('local-import:')) throw new Error('导入来源身份不能作为平台店铺归组维护。');
  if (identity.length > 100 || name.length > 150 || platform.length > 100 || grade.length > 100 || draft.country.length > 20 || reason.length > 500) throw new Error('输入超过字段长度限制，请精简后保存。');
  if (!demoGroups.some(group => group.id === draft.groupId)) throw new Error('请选择有效小组。');
  if (!old && state.stores.some(row => row.sid === identity)) throw new Error('该 SID 已存在，请编辑原店铺。');
  if (old && old.version !== draft.version) throw new Error('店铺已更新，请关闭表单后重新打开。');
  if (old && !reason) throw new Error('请填写修改原因。');
  const changes: string[] = [], moved = !!old && old.groupId !== draft.groupId;
  if (moved && old.references.length) throw new Error(`该站点已有${old.references.join('、')}，不能转组；原归组保持不变。`);
  if (old) for (const [key, label, value] of [['name', '店铺名称', name], ['platform', '平台', platform], ['grade', '等级', grade], ['groupId', '所属小组', draft.groupId], ['active', '工作台状态', draft.active]] as const) {
    const previous = old[key]; if (previous !== value) { const format = (item: string | boolean | null | undefined) => key === 'active' ? item ? '启用' : '停用' : key === 'groupId' ? groupName(String(item || '')) : item || '未填写'; changes.push(`${label}：${format(previous)} → ${format(value)}`); }
  }
  if (old && !changes.length) return state;
  let dossier = old?.dossier ? { ...old.dossier, ownerIds: [...old.dossier.ownerIds] } : null;
  if (moved && dossier) {
    const removed = dossier.ownerIds.filter(id => !demoOwners.find(owner => owner.id === id)?.groupIds.includes(draft.groupId));
    dossier = { ...dossier, groupId: draft.groupId, ownerIds: dossier.ownerIds.filter(id => !removed.includes(id)) };
    changes.push(`运营资料交接至${groupName(draft.groupId)}；${removed.length ? `移除当前负责人：${removed.map(id => demoOwners.find(owner => owner.id === id)?.name || id).join('、')}` : '当前负责人保持'}；源表负责人文字保留`);
  }
  const event = createEvent(old ? '更新店铺归组' : '建立归组档案', '演示用户', old ? `${changes.join('；')}。原因：${reason}` : `${name} · ${identity} · ${groupName(draft.groupId)}；工作台启用。`);
  const row: DemoStore = { ...(old || { shortName: '', departmentId: null, references: [], accountStatuses: [], timeline: [] }), sid: identity, name, platform, grade, country: old?.country ?? draft.country.trim(), groupId: draft.groupId, groupName: groupName(draft.groupId), active: old ? draft.active : true, version: (old?.version || 0) + 1, dossier, timeline: [...(old?.timeline || []), event] };
  return { ...state, stores: old ? state.stores.map(item => item.sid === sid ? row : item) : [row, ...state.stores] };
}
