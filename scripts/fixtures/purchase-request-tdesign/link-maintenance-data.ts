import { createEvent, type DetailEvent } from './history';

export const linkMaintenancePages = { reviewRequests: 'Review直评需求', sOrderRequests: '运营单需求', vinePlans: 'Vine评价计划' };
export type Approval = 'pending' | 'approved' | 'returned' | 'cancelled';
export const approvalLabel: Record<Approval, string> = { pending: '待审核', approved: '已通过', returned: '已退回', cancelled: '已取消' };
export type LinkBase = { id: string; store: string; product: string; asin: string; owner: string; group: string; approval: Approval; version: number; timeline: DetailEvent[] };
export type Review = LinkBase & { appliedOn: string; requirement: string; operatorNote: string; resource: 'hidden' | 'shown' | 'dropped'; shownOn: string; resultNote: string };
export type SOrder = LinkBase & { scheduledOn: string; salesStore: string; orderStore: string; channel: 'FBM' | 'FBA'; keyword: string; position: string; price: string; reviewText: string; feedbackText: string; operationsNote: string; resourceCode: string; accountSituation: string; reviewResult: string; feedbackResult: string; resultNote: string };
export type Vine = LinkBase & { brand: string; registered: number; fee: string; currency: 'USD' | 'CAD'; submittedOn: string; claimed: number | null; reviews: number | null; observedOn: string };
export type LinkState = { reviews: Review[]; sOrders: SOrder[]; vines: Vine[] };
export const date = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const validDate = (value: string) => { const parsed = new Date(`${value}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; };
const dateNotFuture = (value: string) => validDate(value) && value <= date();
const event = (label: string, note: string) => createEvent(label, '演示用户', note);
const requireRow = <T extends LinkBase>(rows: T[], id: string, version: number) => { const row = rows.find(item => item.id === id); if (!row) throw new Error('记录不存在，请重新选择。'); if (row.version !== version) throw new Error('记录版本已变化，请重新打开。'); return row; };
const asinValid = (value: string) => /^[A-Z0-9]{10}$/.test(value.trim().toUpperCase());
export const reviewResourceLabel = { hidden: '未展示', shown: '已展示', dropped: '已掉评' };

export function initialLinkState(): LinkState {
  const reviews: Review[] = ['pending', 'approved', 'returned', 'cancelled', 'approved'].map((approval, index) => ({ id: `RV-DEMO-${String(index + 1).padStart(3, '0')}`, store: index % 2 ? '示例北区-CA' : '示例北区-US', product: ['折叠收纳架', '桌面收纳盒'][index % 2], asin: `B0DEMO000${index + 1}`, owner: '林同学（示例）', group: '家居组', approval: approval as Approval, version: 1, appliedOn: '2026-10-12', requirement: `请核对${index % 2 ? '桌面收纳盒' : '折叠收纳架'}直评资源需求（示例）。`, operatorNote: '', resource: index === 4 ? 'shown' : 'hidden', shownOn: index === 4 ? '2026-10-16' : '', resultNote: '', timeline: [createEvent('提交直评需求', '运营员（示例）', '等待审核。', '2026-10-12 10:00:00'), ...(approval === 'pending' ? [] : [createEvent(approval === 'approved' ? '审核通过' : approval === 'returned' ? '审核退回' : '取消需求', '审核人（示例）', '保留合成审批记录。', '2026-10-13 10:00:00')])] }));
  const sOrders: SOrder[] = ['pending', 'approved', 'returned', 'cancelled'].map((approval, index) => ({ id: `SO-DEMO-${String(index + 1).padStart(3, '0')}`, store: index % 2 ? '示例北区-CA' : '示例北区-US', salesStore: '示例北区-US', orderStore: index % 2 ? '示例北区-CA' : '示例北区-US', product: ['折叠收纳架', '桌面收纳盒'][index % 2], asin: `B0DEMO010${index + 1}`, owner: '林同学（示例）', group: '家居组', approval: approval as Approval, version: 1, scheduledOn: '2026-10-18', channel: index % 2 ? 'FBA' : 'FBM', keyword: '收纳架', position: '首页（示例）', price: '18.50', reviewText: '请关注收纳体验。', feedbackText: '', operationsNote: '', resourceCode: index === 1 ? 'SO-RESOURCE-001' : '', accountSituation: index === 1 ? '正常' : '', reviewResult: '', feedbackResult: '', resultNote: '', timeline: [createEvent('提交运营单需求', '运营员（示例）', '等待指定审核人。', '2026-10-12 11:00:00'), ...(approval === 'pending' ? [] : [createEvent(approval === 'approved' ? '指定审核人通过' : approval === 'returned' ? '指定审核人退回' : '取消需求', '审核人（示例）', '保留合成审批记录。', '2026-10-13 11:00:00')])] }));
  const vines: Vine[] = ['pending', 'approved', 'returned', 'approved'].map((approval, index) => ({ id: `VN-DEMO-${String(index + 1).padStart(3, '0')}`, store: index % 2 ? '示例北区-CA' : '示例北区-US', product: ['折叠收纳架', '桌面收纳盒'][index % 2], asin: `B0DEMO020${index + 1}`, owner: '林同学（示例）', group: '家居组', approval: approval as Approval, version: 1, brand: 'DEMO NORTH', registered: 20 + index * 10, fee: String(index * 10), currency: index % 2 ? 'CAD' : 'USD', submittedOn: index === 3 ? '2026-09-01' : '', claimed: index === 3 ? 15 : null, reviews: index === 3 ? 10 : null, observedOn: index === 3 ? '2026-10-17' : '', timeline: [createEvent('提交 Vine 评价计划', '运营员（示例）', '等待部门指定审核人。', '2026-10-12 11:00:00'), ...(approval === 'pending' ? [] : [createEvent(approval === 'approved' ? '审批通过' : '审批退回', '审核人（示例）', '审批与提报状态独立。', '2026-10-13 11:00:00')])] }));
  return { reviews, sOrders, vines };
}

export function saveReview(rows: Review[], draft: Pick<Review, 'store' | 'product' | 'asin' | 'appliedOn' | 'requirement' | 'operatorNote'>, id?: string, version = 0): Review[] {
  const old = id ? requireRow(rows, id, version) : undefined;
  if (old && !['pending', 'returned'].includes(old.approval)) throw new Error('当前审核状态不能编辑。');
  if (!draft.store.trim() || !draft.product.trim() || !asinValid(draft.asin) || !draft.requirement.trim() || !dateNotFuture(draft.appliedOn)) throw new Error('请填写店铺、品名、10 位 ASIN、有效申请日期和操作需求。');
  const changed = !old || ['store', 'product', 'asin', 'appliedOn', 'requirement', 'operatorNote'].some(key => old[key as keyof Review] !== draft[key as keyof typeof draft]);
  if (!changed) return rows;
  const next: Review = { ...(old || { id: `RV-DEMO-${String(rows.length + 1).padStart(3, '0')}`, owner: '演示运营员', group: '家居组', approval: 'pending', version: 0, resource: 'hidden', shownOn: '', resultNote: '', timeline: [] }), ...draft, asin: draft.asin.trim().toUpperCase(), version: version + 1, timeline: [...(old?.timeline || []), event(old ? '保存直评需求修改' : '提交直评需求', old?.approval === 'returned' ? '保留退回状态，需另行重提。' : '等待审核；旧版本审核将被阻止。')] };
  return old ? rows.map(value => value.id === id ? next : value) : [next, ...rows];
}
export function reviewAction(rows: Review[], id: string, version: number, action: 'approve' | 'return' | 'cancel' | 'resubmit' | 'result', input: { reason?: string; resource?: Review['resource']; shownOn?: string; note?: string } = {}): Review[] {
  const row = requireRow(rows, id, version), reason = input.reason?.trim() || '';
  if (action === 'resubmit' && row.approval !== 'returned' || ['approve', 'return'].includes(action) && row.approval !== 'pending' || action === 'cancel' && !['pending', 'returned'].includes(row.approval) || action === 'result' && row.approval !== 'approved') throw new Error('当前状态不能执行此操作。');
  if (action === 'return' && !reason) throw new Error('请填写退回原因。');
  if (action === 'result') { if (!input.resource || !['hidden', 'shown', 'dropped'].includes(input.resource)) throw new Error('请选择资源显示结果。'); if (input.resource !== 'hidden' && !dateNotFuture(input.shownOn || '')) throw new Error('已展示或已掉评需填写不晚于今天的实际上评日期。'); if ((row.resource !== 'hidden' && input.resource === 'hidden' || row.resource === 'dropped' && input.resource === 'shown' || input.resource === 'dropped' || row.shownOn && row.shownOn !== input.shownOn) && !reason) throw new Error('掉评、恢复或纠正日期须填写原因。'); }
  const next: Review = { ...row, approval: action === 'approve' ? 'approved' : action === 'return' ? 'returned' : action === 'cancel' ? 'cancelled' : action === 'resubmit' ? 'pending' : row.approval, resource: action === 'result' ? input.resource! : row.resource, shownOn: action === 'result' ? input.resource === 'hidden' ? '' : input.shownOn! : row.shownOn, resultNote: action === 'result' ? input.note || '' : row.resultNote, version: row.version + 1, timeline: [...row.timeline, event({ approve: '审核通过', return: '审核退回', cancel: '取消需求', resubmit: '重新提交审核', result: '更新资源结果' }[action], reason || (action === 'result' ? `${reviewResourceLabel[input.resource!]}；实际上评 ${input.shownOn || '未记录'}；${input.note || '无备注'}` : '状态已更新。'))] };
  return rows.map(value => value.id === id ? next : value);
}

export function saveSOrder(rows: SOrder[], draft: Pick<SOrder, 'scheduledOn' | 'salesStore' | 'orderStore' | 'channel' | 'product' | 'asin' | 'keyword' | 'position' | 'price' | 'reviewText' | 'feedbackText' | 'operationsNote'>, id?: string, version = 0): SOrder[] {
  const old = id ? requireRow(rows, id, version) : undefined;
  if (old && !['pending', 'returned'].includes(old.approval)) throw new Error('当前审核状态不能编辑。');
  if (!dateNotFuture(draft.scheduledOn) && !validDate(draft.scheduledOn) || !draft.salesStore || !draft.orderStore || !draft.product.trim() || !asinValid(draft.asin) || !/^(?:\d+)(?:\.\d{1,2})?$/.test(draft.price) || Number(draft.price) <= 0) throw new Error('请填写排单日期、销售/下单店铺、品名、10 位 ASIN 和正数售价。');
  if (old && (Object.keys(draft) as (keyof typeof draft)[]).every(key => String(old[key]) === String(draft[key]))) return rows;
  const next: SOrder = { ...(old || { id: `SO-DEMO-${String(rows.length + 1).padStart(3, '0')}`, store: draft.salesStore, owner: '演示运营员', group: '家居组', approval: 'pending', version: 0, resourceCode: '', accountSituation: '', reviewResult: '', feedbackResult: '', resultNote: '', timeline: [] }), ...draft, store: draft.salesStore, asin: draft.asin.trim().toUpperCase(), version: version + 1, timeline: [...(old?.timeline || []), event(old ? '保存运营单需求修改' : '提交运营单需求', '指定审核人重新核对当前版本。')] };
  return old ? rows.map(value => value.id === id ? next : value) : [next, ...rows];
}
export function sOrderAction(rows: SOrder[], id: string, version: number, action: 'approve' | 'return' | 'cancel' | 'resubmit' | 'result', input: { reason?: string; resourceCode?: string; accountSituation?: string; reviewResult?: string; feedbackResult?: string; note?: string } = {}): SOrder[] {
  const row = requireRow(rows, id, version), reason = input.reason?.trim() || '';
  if (action === 'resubmit' && row.approval !== 'returned' || ['approve', 'return'].includes(action) && row.approval !== 'pending' || action === 'cancel' && !['pending', 'returned'].includes(row.approval) || action === 'result' && row.approval !== 'approved') throw new Error('当前状态不能执行此操作。');
  if (['return', 'cancel'].includes(action) && !reason) throw new Error('请填写退回或取消原因。');
  if (action === 'result' && (!input.resourceCode?.trim() || input.accountSituation?.includes('异常') && !input.note?.trim())) throw new Error('资源编码必填；异常账号情况须填写备注。');
  const next: SOrder = { ...row, approval: action === 'approve' ? 'approved' : action === 'return' ? 'returned' : action === 'cancel' ? 'cancelled' : action === 'resubmit' ? 'pending' : row.approval, resourceCode: action === 'result' ? input.resourceCode!.trim() : row.resourceCode, accountSituation: action === 'result' ? input.accountSituation || '' : row.accountSituation, reviewResult: action === 'result' ? input.reviewResult || '' : row.reviewResult, feedbackResult: action === 'result' ? input.feedbackResult || '' : row.feedbackResult, resultNote: action === 'result' ? input.note || '' : row.resultNote, version: row.version + 1, timeline: [...row.timeline, event({ approve: '指定审核人通过', return: '指定审核人退回', cancel: '取消需求', resubmit: '重新提交审核', result: '更新运营单资源结果' }[action], reason || (action === 'result' ? `编码 ${input.resourceCode}；账号 ${input.accountSituation || '未填写'}；评价结果 ${input.reviewResult || '未填写'}；反馈结果 ${input.feedbackResult || '未填写'}。` : '保留申请与审批历史。'))] };
  return rows.map(value => value.id === id ? next : value);
}

export function vineStatus(row: Vine, today = date()): string {
  if (!row.submittedOn) return '未提报';
  if (row.claimed === null || row.reviews === null || row.claimed < 0 || row.reviews < 0 || row.reviews > row.claimed || row.claimed > row.registered) throw new Error('Vine 数量无效。');
  if (row.reviews === row.claimed && row.claimed === row.registered) return '已结束 · 评论收齐';
  const day = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${row.submittedOn}T00:00:00Z`)) / 86400000);
  if (day > 90) return '已结束 · 期限届满';
  if (row.claimed === row.registered) return '等待回评';
  if (row.claimed === 0) return '待开始';
  return '进行中';
}
export function saveVine(rows: Vine[], draft: Pick<Vine, 'store' | 'brand' | 'product' | 'asin' | 'registered' | 'fee' | 'currency'>, id?: string, version = 0): Vine[] {
  const old = id ? requireRow(rows, id, version) : undefined;
  if (old && !['pending', 'returned'].includes(old.approval)) throw new Error('当前审批状态不能编辑。');
  if (!draft.store || !draft.brand.trim() || !draft.product.trim() || !asinValid(draft.asin) || !Number.isSafeInteger(draft.registered) || draft.registered <= 0 || !/^\d+(?:\.\d{1,2})?$/.test(draft.fee)) throw new Error('请填写店铺、品牌、品名、10 位 ASIN、正整数注册量及非负费用。');
  if (old && (Object.keys(draft) as (keyof typeof draft)[]).every(key => String(old[key]) === String(draft[key]))) return rows;
  const next: Vine = { ...(old || { id: `VN-DEMO-${String(rows.length + 1).padStart(3, '0')}`, owner: '演示运营员', group: '家居组', approval: 'pending', version: 0, submittedOn: '', claimed: null, reviews: null, observedOn: '', timeline: [] }), ...draft, asin: draft.asin.trim().toUpperCase(), version: version + 1, timeline: [...(old?.timeline || []), event(old ? '修改 Vine 计划' : '提交 Vine 计划', '审批与实际提报分开记录。')] };
  return old ? rows.map(value => value.id === id ? next : value) : [next, ...rows];
}
export function vineAction(rows: Vine[], id: string, version: number, action: 'approve' | 'return' | 'cancel' | 'resubmit' | 'submission' | 'progress' | 'correction', input: { reason?: string; submittedOn?: string; claimed?: number; reviews?: number; observedOn?: string; registered?: number; fee?: string; currency?: Vine['currency'] } = {}): Vine[] {
  const row = requireRow(rows, id, version), reason = input.reason?.trim() || '';
  if (action === 'resubmit' && row.approval !== 'returned' || ['approve', 'return'].includes(action) && row.approval !== 'pending' || action === 'cancel' && (row.approval === 'cancelled' || !!row.submittedOn) || action === 'submission' && (row.approval !== 'approved' || !!row.submittedOn) || action === 'progress' && !row.submittedOn) throw new Error('当前状态不能执行此操作。');
  if (['return', 'cancel', 'correction'].includes(action) && !reason) throw new Error('请填写退回、取消或修正原因。');
  const progress = ['submission', 'progress'].includes(action) || action === 'correction' && !!row.submittedOn;
  const registered = action === 'correction' ? input.registered ?? row.registered : row.registered;
  if (action === 'correction' && (!Number.isSafeInteger(registered) || registered <= 0 || !/^\d+(?:\.\d{1,2})?$/.test(input.fee ?? row.fee))) throw new Error('注册数和费用无效。');
  if (action === 'correction' && !row.submittedOn && input.submittedOn) throw new Error('首次提报请使用登记实际提报；管理修正不能代办提报。');
  const submittedOn = action === 'submission' || action === 'correction' && input.submittedOn ? input.submittedOn! : row.submittedOn;
  const claimed = progress ? input.claimed : row.claimed, reviews = progress ? input.reviews : row.reviews, observedOn = progress ? input.observedOn || '' : row.observedOn;
  if (progress && (!dateNotFuture(submittedOn) || !dateNotFuture(observedOn) || observedOn < submittedOn || action === 'progress' && observedOn < row.observedOn || !Number.isSafeInteger(claimed) || !Number.isSafeInteger(reviews) || claimed! < 0 || reviews! < 0 || reviews! > claimed! || claimed! > registered)) throw new Error('请核对提报/采集日期及 0 ≤ 评论数 ≤ 认领数 ≤ 注册数。');
  if (action === 'progress' && (claimed! < row.claimed! || reviews! < row.reviews!) && !reason) throw new Error('数量降低须填写变更原因。');
  const next: Vine = { ...row, approval: action === 'approve' ? 'approved' : action === 'return' ? 'returned' : action === 'cancel' ? 'cancelled' : action === 'resubmit' ? 'pending' : row.approval, registered, fee: action === 'correction' ? input.fee ?? row.fee : row.fee, currency: action === 'correction' ? input.currency ?? row.currency : row.currency, submittedOn, claimed: claimed ?? null, reviews: reviews ?? null, observedOn, version: row.version + 1, timeline: [...row.timeline, event({ approve: '审批通过', return: '审批退回', cancel: '取消计划', resubmit: '重新提交审批', submission: '登记实际提报', progress: '更新 Vine 进度', correction: '管理修正' }[action], reason || (progress ? `提报 ${submittedOn}；认领 ${claimed}；评论 ${reviews}；采集 ${observedOn}。` : '状态已更新。'))] };
  return rows.map(value => value.id === id ? next : value);
}
