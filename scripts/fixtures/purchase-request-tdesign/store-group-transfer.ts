import { parseCsvRows } from '../../../src/lib/csv';
import { saveStore, type MiddleState, type StoreDraft } from './middle-data';

export const groupCsvHeaders = ['SID', '店铺名称', '国家', '平台', '所属小组ID', '等级', '工作台状态', '版本', '修改原因'];
export type GroupPlan = { line: number; source: Record<string, string>; sid: string; action: '新增' | '更新'; errors: string[]; selected: boolean };
const draftFrom = (source: Record<string, string>): StoreDraft => ({ sid: source['SID'] || '', name: source['店铺名称'] || '', country: source['国家'] || '', platform: source['平台'] || '', groupId: source['所属小组ID'] || '', grade: source['等级'] || '', active: source['工作台状态'] !== '停用', version: Number(source['版本'] || 0), reason: source['修改原因'] || '' });
export function previewGroupCsv(state: MiddleState, csv: string): GroupPlan[] {
  const table = parseCsvRows(csv), headers = table[0]?.map(value => value.trim()) || [];
  if (headers.length !== groupCsvHeaders.length || headers.some((value, index) => value !== groupCsvHeaders[index])) throw new Error('店铺归组 CSV 表头须与模板完全一致。');
  const seen = new Set<string>();
  return table.slice(1).flatMap((cells, index) => {
    const source = Object.fromEntries(headers.map((header, column) => [header, (cells[column] || '').trim()]));
    if (Object.values(source).every(value => !value)) return [];
    const sid = source['SID'] || '', old = state.stores.find(row => row.sid === sid), errors: string[] = [];
    if (!sid || seen.has(sid)) errors.push(!sid ? 'SID 不能为空。' : '文件内 SID 重复。');
    seen.add(sid);
    if (!['启用', '停用'].includes(source['工作台状态'] || '')) errors.push('工作台状态须为启用或停用。');
    if (!old && source['工作台状态'] === '停用') errors.push('新店铺先建立为启用，再单独维护停用。');
    if (old && Number(source['版本']) !== old.version || !old && source['版本']) errors.push('版本不匹配：新店铺版本应留空，更新须填写当前版本。');
    if (old && source['国家'] !== old.country) errors.push('已存在站点国家不能通过归组 CSV 修改。');
    try { saveStore(state, draftFrom(source), old?.sid); } catch (cause) { errors.push((cause as Error).message); }
    return [{ line: index + 2, source, sid, action: old ? '更新' as const : '新增' as const, errors, selected: !errors.length }];
  });
}
export function commitGroupCsv(state: MiddleState, plans: GroupPlan[]): MiddleState {
  if (!plans.length || plans.some(plan => plan.errors.length || !plan.selected)) throw new Error('整批预检未通过；请修正所有行后重新确认。');
  let next = state;
  for (const plan of plans) {
    const old = next.stores.find(row => row.sid === plan.sid);
    if (old && Number(plan.source['版本']) !== old.version || !old && plan.source['版本']) throw new Error(`第 ${plan.line} 行版本已变化，整批未提交。`);
    next = saveStore(next, draftFrom(plan.source), old?.sid);
  }
  return next;
}
