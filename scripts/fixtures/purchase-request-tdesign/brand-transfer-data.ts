import { parseCsvRows } from '../../../src/lib/csv';
import { brandFields, saveBrand, type BrandPricingState, type DemoAuthorization, type BrandDraft } from './brand-pricing-data';
import { authorizationScope, projectStoreAuthorizations, type StoreInfo } from './store-information-data';
import { createEvent } from './history';

export const brandWorkbookHeaders = ['品牌ID', '版本', '品牌名称', ...brandFields.map(([, label]) => label), '授权明细核对', '核查说明'];
export const authorizationWorkbookHeaders = ['品牌ID', '领星店铺ID', '授权状态', '授权日期', '授权版本'];
export type BrandImportPlan = { line: number; source: Record<string, string>; id: string; action: '新增' | '更新'; errors: string[]; selected: boolean; done: boolean };
export type AuthorizationImportPlan = { line: number; source: Record<string, string>; key: string; action: '新增' | '更新'; errors: string[]; selected: boolean; done: boolean };
const validDate = (value: string) => { const parsed = new Date(`${value}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; };
const parse = (csv: string, required: string[]) => {
  const table = parseCsvRows(csv), headers = table[0]?.map(value => value.trim()) || [], allowed = [...required, '原始行号', '错误说明'];
  if (!headers.length || new Set(headers).size !== headers.length || headers.some(header => !allowed.includes(header)) || required.some(header => !headers.includes(header))) throw new Error('XLSX 表头与当前模板不匹配。');
  return table.slice(1).flatMap((cells, index) => { const source = Object.fromEntries(headers.map((header, column) => [header, (cells[column] || '').trim()])); return Object.values(source).every(value => !value) ? [] : [{ line: index + 2, source }]; });
};
const brandDraftFrom = (source: Record<string, string>): BrandDraft => ({ name: source['品牌名称'] || '', version: Number(source['版本'] || 0), profile: Object.fromEntries(brandFields.map(([key, label]) => [key, source[label] || ''])), reconciled: source['授权明细核对'] === '已核对', reviewNote: source['核查说明'] || '' });
export function previewBrandWorkbook(state: BrandPricingState, csv: string): BrandImportPlan[] {
  const seen = new Set<string>();
  return parse(csv, brandWorkbookHeaders).map(({ line, source }) => {
    const id = source['品牌ID'] || '', old = state.brands.find(row => row.id === id), errors: string[] = [], key = id || source['品牌名称'].toLowerCase();
    if (seen.has(key)) errors.push('文件内品牌重复。'); seen.add(key);
    if (id && !old) errors.push('品牌 ID 未匹配档案。');
    if (!id && source['版本']) errors.push('新品牌版本须留空。');
    if (!['已核对', '待核对'].includes(source['授权明细核对'])) errors.push('核对状态须为已核对或待核对。');
    try { saveBrand(state, brandDraftFrom(source), id || undefined); } catch (cause) { errors.push((cause as Error).message); }
    return { line, source, id, action: old ? '更新' as const : '新增' as const, errors, selected: !errors.length, done: false };
  });
}
export function commitBrandWorkbook(state: BrandPricingState, plans: BrandImportPlan[], stores: StoreInfo[]): { state: BrandPricingState; plans: BrandImportPlan[] } {
  let next = state;
  const results = plans.map(plan => {
    if (!plan.selected || plan.done || plan.errors.length) return plan;
    try { next = saveBrand(next, brandDraftFrom(plan.source), plan.id || undefined); return { ...plan, done: true }; }
    catch (cause) { return { ...plan, errors: [...plan.errors, (cause as Error).message], selected: false }; }
  });
  return { state: projectStoreAuthorizations(next, stores), plans: results };
}
export function saveAuthorization(state: BrandPricingState, stores: StoreInfo[], draft: { brandId: string; sid: string; status: DemoAuthorization['status']; date: string; version: number; reason?: string }): BrandPricingState {
  const brand = state.brands.find(row => row.id === draft.brandId), store = stores.find(row => row.sid === draft.sid);
  if (!brand || !store) throw new Error('品牌 ID 或店铺 SID 不存在。');
  if (!['有效', '已取消', '停用'].includes(draft.status) || draft.date && !validDate(draft.date)) throw new Error('授权状态或日期无效。');
  const scope = authorizationScope(store), relations = state.relations[brand.id] || [], old = relations.find(link => link.scope === scope);
  if (old && (old.version || 1) !== draft.version || !old && draft.version !== 0) throw new Error('授权版本已变化，请重新导出。');
  if (old && old.status === draft.status && old.date === draft.date) return state;
  const link: DemoAuthorization = { id: old?.id || `AUTH-${brand.id}-${relations.length + 1}`, scope, sid: store.sid, store: store.profile.name, country: store.country, status: draft.status, date: draft.date, version: (old ? old.version || 1 : 0) + 1 };
  const audit = createEvent(old ? '维护品牌授权' : '建立品牌授权', '资料维护员（示例）', `${scope}：${old?.status || '未登记'} → ${draft.status}；日期 ${draft.date || '未填写'}；原因：${draft.reason?.trim() || '批量回导'}。`);
  const next = { ...state, relations: { ...state.relations, [brand.id]: old ? relations.map(item => item.scope === scope ? link : item) : [...relations, link] }, brands: state.brands.map(row => row.id === brand.id ? { ...row, version: row.version + 1, updated: audit.time, timeline: [...row.timeline, audit] } : row) };
  return projectStoreAuthorizations(next, stores);
}
export function previewAuthorizationWorkbook(state: BrandPricingState, stores: StoreInfo[], csv: string): AuthorizationImportPlan[] {
  const seen = new Set<string>();
  return parse(csv, authorizationWorkbookHeaders).map(({ line, source }) => {
    const store = stores.find(row => row.sid === source['领星店铺ID']), key = `${source['品牌ID']}:${store ? authorizationScope(store) : source['领星店铺ID']}`, old = state.relations[source['品牌ID']]?.find(row => store && row.scope === authorizationScope(store)), errors: string[] = [];
    if (seen.has(key)) errors.push('同一品牌与覆盖范围在文件内重复。'); seen.add(key);
    const version = source['授权版本'] ? Number(source['授权版本']) : 0;
    if (old && !source['授权版本']) errors.push('更新已有授权须填写授权版本。');
    try { saveAuthorization(state, stores, { brandId: source['品牌ID'], sid: source['领星店铺ID'], status: source['授权状态'] as DemoAuthorization['status'], date: source['授权日期'], version }); } catch (cause) { errors.push((cause as Error).message); }
    return { line, source, key, action: old ? '更新' as const : '新增' as const, errors, selected: !errors.length, done: false };
  });
}
export function commitAuthorizationWorkbook(state: BrandPricingState, stores: StoreInfo[], plans: AuthorizationImportPlan[]): { state: BrandPricingState; plans: AuthorizationImportPlan[] } {
  let next = state;
  const results = plans.map(plan => {
    if (!plan.selected || plan.done || plan.errors.length) return plan;
    try { next = saveAuthorization(next, stores, { brandId: plan.source['品牌ID'], sid: plan.source['领星店铺ID'], status: plan.source['授权状态'] as DemoAuthorization['status'], date: plan.source['授权日期'], version: plan.source['授权版本'] ? Number(plan.source['授权版本']) : 0 }); return { ...plan, done: true }; }
    catch (cause) { return { ...plan, errors: [...plan.errors, (cause as Error).message], selected: false }; }
  });
  return { state: next, plans: results };
}
export function authorizationExportRows(state: BrandPricingState, stores: StoreInfo[]) {
  const rows: (string | number)[][] = []; let uncovered = 0;
  for (const brand of state.brands) for (const link of state.relations[brand.id] || []) {
    const matching = stores.filter(store => authorizationScope(store) === link.scope);
    const representative = matching.find(store => store.sid === link.sid) || matching[0];
    if (!representative) { uncovered++; continue; }
    rows.push([brand.id, representative.sid, link.status, link.date, link.version || 1]);
  }
  return { rows, uncovered };
}
