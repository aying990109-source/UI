import { parseCsvRows } from '../../../src/lib/csv';
import { date, reviewAction, saveReview, saveSOrder, saveVine, sOrderAction, vineAction, vineStatus, type Review, type SOrder, type Vine } from './link-maintenance-data';

export type TransferKind = 'reviews' | 'sOrders' | 'vines';
export type TransferMode = 'report' | 'create' | 'operator' | 'result' | 'operations' | 'resource' | 'progress';
export type TransferRow = Review | SOrder | Vine;
export type TransferPlan = { line: number; raw: Record<string, string>; id: string; version: number; action: string; errors: string[]; warnings: string[]; selected: boolean; done: boolean; skipped: boolean };
const identity = ['需求ID', '版本'];
const review = { store: '店铺', product: '品名', asin: 'ASIN', appliedOn: '申请日期', requirement: '直评操作需求', operatorNote: '运营备注' };
const sOrder = { scheduledOn: '排单日期', salesStore: '销售店铺', orderStore: '下单店铺', channel: '配送渠道', product: '品名', asin: 'ASIN', keyword: '关键词', position: '位置', price: '售价', reviewText: '评价内容', feedbackText: '反馈内容', operationsNote: '运营备注' };
const vine = { store: '店铺', brand: '品牌', product: '品名', asin: 'ASIN', registered: '注册数量', fee: '费用', currency: '币种' };
const resultHeaders = ['资源显示状态', '实际上评日期', '资源备注', '变更原因'];
const resourceHeaders = ['资源编码', '账号情况', '评价结果', '反馈结果', '结果备注'];
const progressHeaders = ['认领数量', '评论数量', '采集日期', '变更原因'];
const fieldMap = { reviews: review, sOrders: sOrder, vines: vine };
export const modesFor = (kind: TransferKind): TransferMode[] => kind === 'vines' ? ['report', 'create', 'progress'] : kind === 'reviews' ? ['report', 'create', 'operator', 'result'] : ['report', 'create', 'operations', 'resource'];
export const modeNames: Record<TransferMode, string> = { report: '只读明细', create: '新建', operator: '运营回导', result: '资源结果', operations: '运营回导', resource: '资源结果', progress: '进度回导' };
export function headersFor(kind: TransferKind, mode: TransferMode): string[] {
  if (mode === 'create') return Object.values(fieldMap[kind]).filter(label => kind !== 'reviews' || label !== '申请日期');
  if (mode === 'operator' || mode === 'operations') return [...identity, ...Object.values(fieldMap[kind]), '重新提交退回需求'];
  if (mode === 'result') return [...identity, ...resultHeaders];
  if (mode === 'resource') return [...identity, ...resourceHeaders];
  if (mode === 'progress') return [...identity, ...progressHeaders];
  return [...identity, ...Object.values(fieldMap[kind]), '审核状态', '执行结果'];
}
export function exportRow(kind: TransferKind, mode: TransferMode, row: TransferRow): string[] {
  const values: Record<string, string> = { '需求ID': row.id, '版本': String(row.version), '审核状态': row.approval,
    '执行结果': kind === 'vines' ? vineStatus(row as Vine) : kind === 'reviews' ? (row as Review).resource : (row as SOrder).resourceCode,
    '资源显示状态': (row as Review).resource || '', '实际上评日期': (row as Review).shownOn || '', '资源备注': (row as Review).resultNote || '',
    '资源编码': (row as SOrder).resourceCode || '', '账号情况': (row as SOrder).accountSituation || '', '评价结果': (row as SOrder).reviewResult || '', '反馈结果': (row as SOrder).feedbackResult || '', '结果备注': (row as SOrder).resultNote || '',
    '认领数量': (row as Vine).claimed === null ? '' : String((row as Vine).claimed), '评论数量': (row as Vine).reviews === null ? '' : String((row as Vine).reviews), '采集日期': (row as Vine).observedOn || '' };
  for (const [key, label] of Object.entries(fieldMap[kind])) values[label] = String((row as unknown as Record<string, unknown>)[key] ?? '');
  return headersFor(kind, mode).map(header => values[header] || '');
}
const payload = (kind: TransferKind, raw: Record<string, string>, before?: TransferRow) => Object.fromEntries(Object.entries(fieldMap[kind]).map(([key, label]) => [key, label in raw ? raw[label] : String((before as unknown as Record<string, unknown> | undefined)?.[key] ?? '')]));
function apply(kind: TransferKind, mode: TransferMode, rows: TransferRow[], plan: TransferPlan): TransferRow[] {
  const raw = plan.raw, before = rows.find(row => row.id === plan.id);
  if (mode !== 'create' && (!before || before.version !== plan.version)) throw new Error('记录或版本已变化，请重新导出并预检。');
  if (mode === 'create') {
    if (kind === 'reviews') return saveReview(rows as Review[], { ...payload(kind, raw), appliedOn: date() } as Parameters<typeof saveReview>[1]);
    if (kind === 'sOrders') return saveSOrder(rows as SOrder[], payload(kind, raw) as Parameters<typeof saveSOrder>[1]);
    return saveVine(rows as Vine[], { ...payload(kind, raw), registered: Number(raw['注册数量']) } as Parameters<typeof saveVine>[1]);
  }
  if (mode === 'operator' && kind === 'reviews') {
    const prior = before as Review, next = saveReview(rows as Review[], payload(kind, raw, prior) as Parameters<typeof saveReview>[1], prior.id, prior.version);
    const after = next.find(row => row.id === prior.id)!;
    if (raw['重新提交退回需求'] === '是' && prior.approval === 'returned' && after.version !== prior.version) return reviewAction(next, prior.id, after.version, 'resubmit');
    return next;
  }
  if (mode === 'operations' && kind === 'sOrders') {
    const prior = before as SOrder, next = saveSOrder(rows as SOrder[], payload(kind, raw, prior) as Parameters<typeof saveSOrder>[1], prior.id, prior.version);
    const after = next.find(row => row.id === prior.id)!;
    if (raw['重新提交退回需求'] === '是' && prior.approval === 'returned' && after.version !== prior.version) return sOrderAction(next, prior.id, after.version, 'resubmit');
    return next;
  }
  if (mode === 'result' && kind === 'reviews') { const old = before as Review, resource = (raw['资源显示状态'] ?? old.resource) as Review['resource'], shownOn = raw['实际上评日期'] ?? old.shownOn, note = raw['资源备注'] ?? old.resultNote; if (old.resource === resource && old.shownOn === shownOn && old.resultNote === note) return rows; return reviewAction(rows as Review[], old.id, old.version, 'result', { resource, shownOn, note, reason: raw['变更原因'] }); }
  if (mode === 'resource' && kind === 'sOrders') { const old = before as SOrder, resourceCode = raw['资源编码'] ?? old.resourceCode, accountSituation = raw['账号情况'] ?? old.accountSituation, reviewResult = raw['评价结果'] ?? old.reviewResult, feedbackResult = raw['反馈结果'] ?? old.feedbackResult, note = raw['结果备注'] ?? old.resultNote; if (old.resourceCode === resourceCode && old.accountSituation === accountSituation && old.reviewResult === reviewResult && old.feedbackResult === feedbackResult && old.resultNote === note) return rows; return sOrderAction(rows as SOrder[], old.id, old.version, 'result', { resourceCode, accountSituation, reviewResult, feedbackResult, note }); }
  if (mode === 'progress' && kind === 'vines') { const old = before as Vine, claimed = raw['认领数量'] ? Number(raw['认领数量']) : old.claimed!, reviews = raw['评论数量'] ? Number(raw['评论数量']) : old.reviews!, observedOn = raw['采集日期'] || old.observedOn; if (old.claimed === claimed && old.reviews === reviews && old.observedOn === observedOn) return rows; return vineAction(rows as Vine[], old.id, old.version, 'progress', { claimed, reviews, observedOn, reason: raw['变更原因'] }); }
  throw new Error('当前模式只读或不适用于本页面。');
}
export function previewLinkWorkbook(kind: TransferKind, mode: TransferMode, rows: TransferRow[], csv: string): TransferPlan[] {
  if (mode === 'report') throw new Error('只读明细不能直接回导，请选择对应可写模式。');
  if (!modesFor(kind).includes(mode)) throw new Error('文件模式与页面不匹配。');
  const table = parseCsvRows(csv), headers = table[0]?.map(value => value.trim()) || [], required = headersFor(kind, mode), allowed = [...required, '原始行号', '错误说明'];
  if (!headers.length || new Set(headers).size !== headers.length || headers.some(header => !allowed.includes(header)) || mode !== 'create' && identity.some(header => !headers.includes(header)) || mode === 'create' && required.some(header => !headers.includes(header))) throw new Error('XLSX 表头与当前文件模式不匹配。');
  const plans: TransferPlan[] = [], seen = new Set<string>();
  for (const [index, cells] of table.slice(1).entries()) {
    const raw = Object.fromEntries(headers.map((header, column) => [header, (cells[column] || '').trim()]));
    if (Object.values(raw).every(value => !value)) continue;
    const id = raw['需求ID'] || '', version = Number(raw['版本'] || 0), before = rows.find(row => row.id === id), errors: string[] = [], warnings: string[] = [];
    if (mode !== 'create' && (!id || !Number.isSafeInteger(version) || !before || before.version !== version)) errors.push('需求 ID 或版本不匹配。');
    if (mode !== 'create' && seen.has(id)) errors.push('同一文件不能重复维护需求 ID。');
    seen.add(id);
    if (mode === 'create') {
      const store = raw['店铺'] || raw['销售店铺'] || '', asin = raw['ASIN'] || '';
      if (rows.some(row => row.store === store && row.asin === asin)) warnings.push('已有相同店铺与 ASIN 的可见需求，请核对重复。');
      if (kind === 'vines' && plans.some(item => item.raw['店铺'] === store && item.raw['ASIN'] === asin)) errors.push('文件内同店铺同 ASIN 重复。');
    }
    const plan: TransferPlan = { line: index + 2, raw, id, version, action: modeNames[mode], errors, warnings, selected: !errors.length, done: false, skipped: false };
    if (!errors.length) try {
      const after = apply(kind, mode, rows, plan);
      if (mode !== 'create' && after === rows) { plan.skipped = true; plan.selected = false; plan.action = '无变化'; }
    } catch (cause) { errors.push((cause as Error).message); plan.selected = false; }
    plans.push(plan);
  }
  return plans;
}
export function commitLinkWorkbook(kind: TransferKind, mode: TransferMode, rows: TransferRow[], plans: TransferPlan[], acknowledgeDuplicates: boolean): { rows: TransferRow[]; plans: TransferPlan[]; atomic: boolean } {
  const chosen = plans.filter(plan => plan.selected && !plan.done && !plan.skipped);
  if (!chosen.length) throw new Error('请选择至少一条可提交的预检行。');
  if (!acknowledgeDuplicates && chosen.some(plan => plan.warnings.length)) throw new Error('请先确认重复需求提醒。');
  if (kind === 'vines') {
    if (plans.some(plan => plan.errors.length)) throw new Error('Vine 文件有错误行；整批确认前请修正完整文件并重新预检。');
    let next = rows;
    for (const plan of chosen) next = apply(kind, mode, next, plan);
    return { rows: next, plans: plans.map(plan => chosen.includes(plan) ? { ...plan, done: true } : plan), atomic: true };
  }
  let next = rows;
  const results = plans.map(plan => {
    if (!chosen.includes(plan)) return plan;
    try { next = apply(kind, mode, next, plan); return { ...plan, done: true }; }
    catch (cause) { return { ...plan, selected: false, errors: [(cause as Error).message] }; }
  });
  return { rows: next, plans: results, atomic: false };
}
