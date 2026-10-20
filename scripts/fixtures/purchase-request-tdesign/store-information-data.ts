import { createEvent, type DetailEvent } from './history';
import type { BrandPricingState, DemoAuthorization } from './brand-pricing-data';

export const storeInformationPages = { storeInformation: '店铺信息' };
export const storeProfileFields = [
  ['shortName', '店铺简称', '基本资料'], ['name', '店铺名', '基本资料'], ['category', '账号分类', '基本资料'], ['sites', '站点', '基本资料'], ['openedOn', '下店时间', '基本资料'], ['ownerText', '店铺负责人', '基本资料'],
  ['statuses', '账号状态', '账号与品牌'], ['multichannel', '多渠道功能', '账号与品牌'], ['brands', '品牌', '账号与品牌'], ['retainedBrands', '预估保留品牌', '账号与品牌'],
  ['balance', '账户余额【美】', '余额与提款'], ['balanceLabel', '公式', '余额与提款'], ['withdrawal', '提款情况', '余额与提款'],
  ['remark', '备注', '备注与来源'], ['sourceGroup', '组别', '备注与来源'], ['sourceUpdatedAt', '最后修改时间', '备注与来源'],
] as const;
export type StoreProfile = Record<(typeof storeProfileFields)[number][0], string>;
export type StoreInfo = { id: string; sid: string; country: string; grade: string; gradeVersion: number; hasDossier: boolean; groupId: string; group: string; ownerIds: string[]; active: boolean; profile: StoreProfile; version: number; shortVersion: number; statusVersion: number; withdrawalMarks: { standard: string; invoice: string }; timeline: DetailEvent[] };
export type StoreDraft = { profile: StoreProfile; ownerIds: string[]; expectedVersion: number; expectedShortVersion: number; expectedStatusVersion: number; reason: string };
export const demoPersonnel = [{ id: 'owner-lin', name: '林同学（示例）', groupId: 'home' }, { id: 'owner-chen', name: '陈同学（示例）', groupId: 'home' }, { id: 'owner-zhou', name: '周同学（示例）', groupId: 'daily' }];
export const storeWorkbookHeaders = [...storeProfileFields.map(([, label]) => label), '档案ID', '版本', '小组ID', '负责人ID', '领星店铺ID', '账号状态版本', '清空账号状态', '当前授权品牌（只读）', '店铺等级', '店铺配置版本', '简称版本', '清空简称', '授权品牌ID', '授权品牌名称', '授权状态', '授权日期', '授权版本', '所属小组（只读）', '当前负责人（只读）', '标准提款时间（只读）', '发票提款时间（只读）', '资料更新时间（只读）'];
export type StoreImportPlan = { line: number; sid: string; id: string; version: number; shortVersion: number; statusVersion: number; shortName: string; name: string; groupId: string; balance: string; multichannel: string; statuses: string; remark: string; profile: StoreProfile; ownerIds: string[]; grade: string; gradeVersion: number; authorizationCells: Record<string, string>; authorizationChanges: { brandId: string; scope: string; status: DemoAuthorization['status']; date: string; version: number }[]; source: Record<string, string>; action: '新增' | '更新'; errors: string[]; warnings: string[]; selected: boolean; done: boolean };
const validStoreDate = (value: string) => { const parsed = new Date(`${value}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; };
const profile = (name: string, shortName: string, country: string, index: number): StoreProfile => ({ shortName, name, category: index % 2 ? '运营账号' : '品牌账号', sites: country, openedOn: '2024-06-15', ownerText: index % 2 ? '周同学（原表）' : '林同学（原表）', statuses: index === 1 ? '停用,待核验' : '正常', multichannel: index === 2 ? '异常' : '正常', brands: index < 2 ? 'DEMO NORTH（原表文字）' : '', retainedBrands: '', balance: index === 2 ? '-120.50' : String((index + 1) * 1200) + '.00', balanceLabel: '来源表金额', withdrawal: '', remark: '合成店铺资料', sourceGroup: index % 2 ? '日用组' : '家居组', sourceUpdatedAt: '2026-10-12 11:00:00' });
export function initialStoreInformation(): StoreInfo[] {
  const definitions = [['BR-SID-US', '示例北区-US', '示例北区', 'US'], ['BR-SID-CA', '示例北区-CA', '示例北区', 'CA'], ['BR-SID-DE', '示例欧洲-DE', '示例欧洲', 'DE'], ['STORE-SID-004', '远行户外-US', '远行户外', 'US'], ['STORE-SID-005', '晴川生活-CA', '晴川生活', 'CA'], ['STORE-SID-006', '日用小馆-UK', '日用小馆', 'UK'], ['STORE-SID-007', '花园家居-US', '花园家居', 'US'], ['STORE-SID-008', '桌面工坊-DE', '桌面工坊', 'DE']];
  return [...definitions.map(([sid, name, shortName, country], index) => ({ id: `SI-${String(index + 1).padStart(3, '0')}`, sid, country, grade: index % 3 ? 'A1' : 'A2', gradeVersion: 1, hasDossier: true, groupId: index % 2 ? 'daily' : 'home', group: index % 2 ? '日用组' : '家居组', ownerIds: [index % 2 ? 'owner-zhou' : 'owner-lin'], active: index !== 4, profile: profile(name, shortName, country, index), version: 1, shortVersion: 1, statusVersion: 1, withdrawalMarks: { standard: '', invoice: '' }, timeline: [createEvent('建立店铺信息档案', '资料维护员（示例）', `关联 ${sid}；账号状态与工作台启停独立。`, '2026-10-12 11:00:00')] })), { id: 'SI-009', sid: 'STORE-SID-009', country: 'US', grade: '', gradeVersion: 1, hasDossier: false, groupId: 'home', group: '家居组', ownerIds: [], active: true, profile: profile('待完善示例-US', '待完善示例', 'US', 8), version: 0, shortVersion: 1, statusVersion: 1, withdrawalMarks: { standard: '', invoice: '' }, timeline: [createEvent('店铺归组已存在，资料待完善', '系统（示例）', '首次保存可建立资料档案。', '2026-10-12 11:00:00')] }];
}
export const ownerNames = (row: StoreInfo) => row.ownerIds.map(id => demoPersonnel.find(person => person.id === id)?.name || id).join('、') || row.profile.ownerText || '未填写负责人';
export const authorizationScope = (row: StoreInfo) => ['US', 'CA', 'MX', 'BR'].includes(row.country) && row.profile.shortName.trim() ? `americas:${row.profile.shortName.trim()}` : `site:${row.sid}`;
export const authorizationsFor = (row: StoreInfo, brands: BrandPricingState) => brands.brands.flatMap(brand => brand.authorizations.filter(link => link.sid === row.sid && link.scope === authorizationScope(row)).map(link => ({ brand: brand.name, brandId: brand.id, status: link.status, scope: link.scope, date: link.date })));
export function projectStoreAuthorizations(brands: BrandPricingState, stores: StoreInfo[]): BrandPricingState {
  return { ...brands, brands: brands.brands.map(brand => {
    const relations = brands.relations[brand.id] || [];
    const authorizations = relations.flatMap(link => stores.filter(store => authorizationScope(store) === link.scope).map(store => ({ ...link, sid: store.sid, store: store.profile.name, country: store.country })));
    return { ...brand, authorizations };
  }) };
}
export function filterStoreInformation(rows: StoreInfo[], filters: { search: string; country: string; group: string; status: string; quick: string }) {
  const terms = filters.search.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return rows.filter(row => terms.every(term => `${row.sid} ${row.profile.shortName} ${row.profile.name} ${ownerNames(row)} ${row.profile.brands}`.toLocaleLowerCase().includes(term)) && (!filters.country || row.country === filters.country) && (!filters.group || row.groupId === filters.group) && (!filters.status || row.profile.statuses.split(',').map(value => value.trim()).includes(filters.status)) && (!filters.quick || filters.quick === 'negative' && Number(row.profile.balance) < 0 || filters.quick === 'abnormal' && row.profile.multichannel === '异常' || filters.quick === 'unowned' && !row.ownerIds.length));
}
export function saveStoreInformation(rows: StoreInfo[], id: string, draft: StoreDraft): StoreInfo[] {
  const row = rows.find(value => value.id === id);
  if (!row) throw new Error('店铺资料不存在，请刷新后重试。');
  if (row.version !== draft.expectedVersion || row.shortVersion !== draft.expectedShortVersion || row.statusVersion !== draft.expectedStatusVersion) throw new Error('资料或共享字段版本已变化，请重新打开。');
  const p = draft.profile;
  if (!p.name.trim()) throw new Error('请填写店铺名。');
  if (p.sites !== row.country) throw new Error('关联站点国家不可在资料表单中修改。');
  if (p.balance && !/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(p.balance)) throw new Error('余额须为有效金额，最多两位小数。');
  if (p.openedOn && !validStoreDate(p.openedOn)) throw new Error('下店时间须为有效日期。');
  if (draft.ownerIds.some(owner => !demoPersonnel.some(person => person.id === owner && person.groupId === row.groupId))) throw new Error('负责人须属于当前小组。');
  if (!draft.reason.trim()) throw new Error('请填写资料修改原因。');
  const changed = storeProfileFields.filter(([key]) => p[key].trim() !== row.profile[key]).map(([, label]) => label);
  if (JSON.stringify(draft.ownerIds) !== JSON.stringify(row.ownerIds)) changed.push('当前负责人' as (typeof changed)[number]);
  if (!changed.length && row.hasDossier) return rows;
  const next: StoreInfo = { ...row, hasDossier: true, profile: { ...p, balance: p.balance.replaceAll(',', '') }, ownerIds: [...draft.ownerIds], version: row.version + 1, shortVersion: row.shortVersion + Number(p.shortName !== row.profile.shortName), statusVersion: row.statusVersion + Number(p.statuses !== row.profile.statuses), timeline: [...row.timeline, createEvent(row.hasDossier ? '保存店铺资料' : '首次建立店铺资料', '资料维护员（示例）', `修改：${changed.join('、')}；原因：${draft.reason.trim()}。`)] };
  return rows.map(value => value.id === id ? next : value);
}
export function markWithdrawal(rows: StoreInfo[], sid: string, kind: 'standard' | 'invoice'): StoreInfo[] {
  const row = rows.find(value => value.sid === sid);
  if (!row) throw new Error('站点不存在。');
  const event = createEvent(kind === 'standard' ? '记录标准提款时间' : '记录发票提款时间', '资料维护员（示例）', '只记录操作时间，不表示外部转账或余额扣减。');
  return rows.map(value => value.sid === sid ? { ...value, withdrawalMarks: { ...value.withdrawalMarks, [kind]: event.time }, timeline: [...value.timeline, event] } : value);
}
export { previewStoreWorkbook, commitStoreWorkbook } from './store-information-import';
