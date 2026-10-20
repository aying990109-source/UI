import { createEvent, type DetailEvent } from './history';

export const salesTargetPages = { sales: '销售数据', targets: '目标管理' };
export type SaleState = 'complete' | 'partial' | 'uncollected' | 'source_failed' | 'fx_pending' | 'no_stores' | 'future';
export type SaleContribution = { sid: string; country: string; currency: string; original: string | null; fx: string | null; usdCents: number | null; status: string; sourceOn: string; ownerGroup: string };
export type SaleMonth = { id: string; groupId: string; group: string; year: number; month: number; state: SaleState; update: string; cutoff: string; formalCents: number | null; partialCents: number | null; contributions: SaleContribution[]; timeline: DetailEvent[] };
export type TargetPlan = { id: string; groupId: string; group: string; year: number; startMonth: number; totalCents: number; originalCents: number; months: Record<number, number>; version: number; timeline: DetailEvent[] };
export const saleLabels: Record<SaleState, string> = { complete: '完整', partial: '部分已取得', uncollected: '尚未采集', source_failed: '来源失败', fx_pending: '汇率待核验', no_stores: '无应纳入店铺', future: '未来月份' };
export const groups = [{ id: 'home', name: '家居组' }, { id: 'daily', name: '日用组' }, { id: 'outdoor', name: '户外组' }];
export const money = (cents: number | null) => cents === null ? '—' : `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export function cents(raw: string): number { if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(raw.trim())) throw new Error('金额须为非负数，最多两位小数。'); const [whole, fraction = ''] = raw.trim().split('.'); const value = Number(whole) * 100 + Number(fraction.padEnd(2, '0')); if (!Number.isSafeInteger(value) || value > 100_000_000_000) throw new Error('金额超过允许范围。'); return value; }
export const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;
export function initialSaleMonths(): SaleMonth[] {
  const state: SaleState[][] = [['complete', 'complete', 'partial'], ['complete', 'fx_pending', 'source_failed'], ['no_stores', 'uncollected', 'partial']];
  return groups.flatMap((group, g) => [8, 9, 10].map((month, m) => {
    const status = state[g][m], base = (g + 1) * (m + 2) * 135_000;
    const contributions: SaleContribution[] = status === 'no_stores' ? [] : [
      { sid: `${group.id.toUpperCase()}-SID-US`, country: 'US', currency: status === 'fx_pending' ? 'CAD' : 'USD', original: status === 'uncollected' ? null : (base / 100).toFixed(2), fx: status === 'fx_pending' ? null : '1.0000', usdCents: ['complete', 'partial', 'source_failed'].includes(status) ? base : null, status: status === 'fx_pending' ? '原币已取到，汇率待核验' : status === 'source_failed' ? '本次更新失败，保留旧可靠金额' : status === 'uncollected' ? '尚未采集' : '已核验', sourceOn: `2026-${String(month).padStart(2, '0')}-17`, ownerGroup: group.name },
      { sid: `${group.id.toUpperCase()}-SID-CA`, country: 'CA', currency: 'CAD', original: status === 'complete' || status === 'source_failed' ? '1200.00' : null, fx: status === 'complete' || status === 'source_failed' ? '0.7350' : null, usdCents: status === 'complete' || status === 'source_failed' ? 88_200 : null, status: status === 'complete' || status === 'source_failed' ? '原币及月汇率已核验' : '证据未完整', sourceOn: `2026-${String(month).padStart(2, '0')}-17`, ownerGroup: group.name },
    ];
    const formalCents = status === 'complete' || status === 'source_failed' ? base + 88_200 : null;
    const partialCents = ['complete', 'partial', 'source_failed'].includes(status) ? base + (status === 'partial' ? 0 : 88_200) : null;
    return { id: `${group.id}-${monthKey(2026, month)}`, groupId: group.id, group: group.name, year: 2026, month, state: status, update: status === 'source_failed' ? '最近采集失败；旧可靠值保留' : status === 'fx_pending' ? '汇率证据待核验' : '最近来源核对 2026-10-17', cutoff: '2026-10-18', formalCents, partialCents, contributions, timeline: [createEvent('取得销售来源快照', '系统（示例）', `销售日归属 ${group.name}；${saleLabels[status]}。`, '2026-10-17 16:00:00')] };
  }));
}
export function saleSummary(rows: SaleMonth[]) {
  const applicable = rows.filter(row => !['future', 'no_stores'].includes(row.state));
  const complete = applicable.length > 0 && applicable.every(row => row.formalCents !== null);
  return { formalCents: complete ? applicable.reduce((sum, row) => sum + row.formalCents!, 0) : null, partialCents: applicable.some(row => row.partialCents !== null) ? applicable.reduce((sum, row) => sum + (row.partialCents || 0), 0) : null, complete, unknown: applicable.filter(row => row.formalCents === null).length };
}
export function legalStart(year: number, now = '2026-10-18') { const currentYear = Number(now.slice(0, 4)), month = Number(now.slice(5, 7)); if (year < currentYear) throw new Error('已结束年度不能首次制定目标。'); return year === currentYear ? Math.max(8, month) : 1; }
export function saveTarget(plans: TargetPlan[], draft: { groupId: string; year: number; total: string; months: Record<number, string>; mode: 'create' | 'reallocate' | 'revise_total'; reason: string; version: number }, now = '2026-10-18'): TargetPlan[] {
  const group = groups.find(item => item.id === draft.groupId); if (!group) throw new Error('小组无效。');
  const old = plans.find(item => item.groupId === draft.groupId && item.year === draft.year);
  if ((draft.mode === 'create') !== !old) throw new Error('该小组年度计划状态已变化，请重新打开。');
  if (old && draft.version !== old.version) throw new Error('计划版本已变化，请重新打开。');
  if (old && !draft.reason.trim()) throw new Error('修订须填写原因。');
  const startMonth = old?.startMonth || legalStart(draft.year, now), current = Number(now.slice(5, 7)), currentYear = Number(now.slice(0, 4));
  const values: Record<number, number> = {};
  for (let month = startMonth; month <= 12; month++) {
    values[month] = cents(draft.months[month] ?? '');
    if (old && draft.year === currentYear && month < current && values[month] !== old.months[month]) throw new Error(`${month} 月已锁定，不能修订。`);
  }
  const totalCents = cents(draft.total), sum = Object.values(values).reduce((sum, value) => sum + value, 0);
  if (totalCents <= 0) throw new Error('年度目标须大于零。');
  if (sum !== totalCents) throw new Error(`覆盖月份合计 ${money(sum)} 必须等于总目标 ${money(totalCents)}。`);
  if (old && draft.mode === 'reallocate' && totalCents !== old.totalCents) throw new Error('重新分配不得改变年度总目标；请选择修订总额。');
  if (old && draft.mode === 'revise_total' && totalCents === old.totalCents) throw new Error('年度总额未变化；请选择重新分配。');
  if (old && Object.entries(values).every(([month, value]) => old.months[Number(month)] === value)) throw new Error('月度目标没有变化。');
  const audit = createEvent(old ? '修订年度目标' : '首次制定年度目标', '目标管理者（示例）', `${old ? `模式 ${draft.mode}；原因：${draft.reason.trim()}；` : ''}覆盖 ${startMonth}–12 月；总额 ${money(totalCents)}。`);
  const next: TargetPlan = { id: old?.id || `TG-${draft.groupId}-${draft.year}`, groupId: group.id, group: group.name, year: draft.year, startMonth, totalCents, originalCents: old?.originalCents ?? totalCents, months: values, version: (old?.version || 0) + 1, timeline: [...(old?.timeline || []), audit] };
  return old ? plans.map(item => item.id === old.id ? next : item) : [...plans, next];
}
export function initialTargets(): TargetPlan[] {
  const draft = (groupId: string, monthly: number) => ({ groupId, year: 2026, total: String(monthly * 3), months: { 10: String(monthly), 11: String(monthly), 12: String(monthly) }, mode: 'create' as const, reason: '', version: 0 });
  return saveTarget(saveTarget([], draft('home', 12000)), draft('daily', 9000));
}
export function targetProgress(plan: TargetPlan, sales: SaleMonth[], throughMonth = plan.year < 2026 ? 12 : plan.year === 2026 ? 10 : 0) {
  const covered = sales.filter(row => row.groupId === plan.groupId && row.year === plan.year && row.month >= plan.startMonth && row.month <= throughMonth);
  const targetCents = Object.entries(plan.months).filter(([month]) => Number(month) <= throughMonth).reduce((sum, [, value]) => sum + value, 0);
  const summary = saleSummary(covered);
  const expectedMonths = Math.max(0, throughMonth - plan.startMonth + 1);
  const complete = expectedMonths > 0 && covered.length === expectedMonths && summary.complete;
  const formalCents = complete ? summary.formalCents : null;
  return { ...summary, formalCents, complete, targetCents, expectedMonths, observedMonths: covered.length, attainment: formalCents === null || !targetCents ? null : formalCents / targetCents };
}
export function targetSummary(plans: TargetPlan[], sales: SaleMonth[], year: number) {
  const entries = plans.filter(plan => plan.year === year).map(plan => ({ plan, progress: targetProgress(plan, sales) }));
  const targetCents = entries.reduce((sum, item) => sum + item.progress.targetCents, 0);
  const complete = entries.length > 0 && entries.every(item => item.progress.complete);
  const formalCents = complete ? entries.reduce((sum, item) => sum + item.progress.formalCents!, 0) : null;
  const partialCents = entries.some(item => item.progress.partialCents !== null) ? entries.reduce((sum, item) => sum + (item.progress.partialCents || 0), 0) : null;
  return { groups: entries.length, targetCents, formalCents, partialCents, complete, attainment: formalCents === null || !targetCents ? null : formalCents / targetCents };
}
