import { createEvent, type DetailEvent } from './history';

export const replenishmentProcessingPages = { replenishmentProcessing: '补货处理' };
export type ProcessingStage = 'pending_lock' | 'pending_labels' | 'ready_to_dispatch' | 'partial_dispatch' | 'completed' | 'cancelled';
export type Dispatch = { id: string; quantity: number; warehouse: string; date: string; reference: string; evidence: string; returned: number; version: number };
export type Cancellation = { id: string; quantity: number; status: 'pending' | 'approved' | 'rejected'; version: number };
export type ProcessingRow = { id: string; source: string; product: string; group: string; shop: string; warehouse: string; carton: number; requested: number; cancelled: number; dispatches: Dispatch[]; cancellations: Cancellation[]; stage: ProcessingStage; version: number; timeline: DetailEvent[] };
export type ProcessingAction = 'lock-confirm' | 'lock-failed' | 'labels-confirm' | 'dispatch' | 'cancel-approve' | 'cancel-reject' | 'return';
export type ProcessingInput = { quantity?: number; reason?: string; targetId?: string; warehouse?: string; date?: string; reference?: string; evidence?: string };
export const stageName: Record<ProcessingStage, string> = { pending_lock: '待锁仓', pending_labels: '待收标签', ready_to_dispatch: '待发货', partial_dispatch: '部分发货', completed: '已完成', cancelled: '已取消' };
export const processingActions: Record<ProcessingAction, string> = { 'lock-confirm': '确认已锁仓', 'lock-failed': '记录锁仓问题', 'labels-confirm': '确认收到标签', dispatch: '登记发货', 'cancel-approve': '确认未发取消', 'cancel-reject': '驳回未发取消', return: '登记可用退仓' };
export const dispatched = (row: ProcessingRow) => row.dispatches.reduce((sum, value) => sum + value.quantity, 0);
export const unsent = (row: ProcessingRow) => row.requested - dispatched(row) - row.cancelled;
export const pendingCancellation = (row: ProcessingRow) => row.cancellations.filter(value => value.status === 'pending').reduce((sum, value) => sum + value.quantity, 0);
export const dispatchable = (row: ProcessingRow) => unsent(row) - pendingCancellation(row);
export const returnable = (row: ProcessingRow) => row.dispatches.reduce((sum, value) => sum + value.quantity - value.returned, 0);

export function allowedProcessingActions(row: ProcessingRow): ProcessingAction[] {
  const decisions: ProcessingAction[] = pendingCancellation(row) ? ['cancel-approve', 'cancel-reject'] : [];
  if (row.stage === 'pending_lock') return ['lock-confirm', 'lock-failed', ...decisions];
  if (row.stage === 'pending_labels') return ['labels-confirm', ...decisions];
  if (['ready_to_dispatch', 'partial_dispatch'].includes(row.stage)) return [...(dispatchable(row) ? ['dispatch' as const] : []), ...decisions, ...(returnable(row) ? ['return' as const] : [])];
  return [...decisions, ...(returnable(row) ? ['return' as const] : [])];
}

export function applyProcessingAction(rows: ProcessingRow[], id: string, action: ProcessingAction, expectedVersion: number, input: ProcessingInput = {}): ProcessingRow[] {
  const row = rows.find(value => value.id === id);
  if (!row) throw new Error('补货记录不存在，请重新选择。');
  const dispatch = row.dispatches.find(value => value.id === input.targetId);
  const cancellation = row.cancellations.find(value => value.id === input.targetId);
  const target = action === 'return' ? dispatch : action.startsWith('cancel-') ? cancellation : row;
  if (!target || target.version !== expectedVersion) throw new Error('目标明细版本已变化，请关闭后重新查看。');
  if (!allowedProcessingActions(row).includes(action)) throw new Error('当前阶段不能执行此操作。');
  if (action.startsWith('cancel-') && cancellation?.status !== 'pending') throw new Error('取消明细已处理。');
  const quantity = input.quantity || 0;
  if (action === 'lock-failed' && !input.reason?.trim()) throw new Error('请填写未能整单锁仓的原因。');
  if (['dispatch', 'return'].includes(action) && (!Number.isSafeInteger(quantity) || quantity <= 0)) throw new Error('数量须为正整数。');
  if (action === 'dispatch' && quantity > dispatchable(row)) throw new Error('本次发货不能超过扣除待取消后的可发数量。');
  if (action === 'return' && dispatch && quantity > dispatch.quantity - dispatch.returned) throw new Error('退回数量不能超过该笔发货未退数量。');
  if (action === 'dispatch' && (!input.warehouse?.trim() || !validDate(input.date))) throw new Error('请填写发货仓库和有效日期。');
  if (action === 'return' && (!input.warehouse?.trim() || !input.evidence?.trim())) throw new Error('请填写退回仓库并附可用退回凭证。');
  const note = action === 'dispatch' ? `明细 ${row.id}-D${row.dispatches.length + 1}：实际发货 ${quantity} 件，${input.warehouse}，${input.date}；待取消 ${pendingCancellation(row)} 件；${input.reference || '无参考号'}。` : action === 'return' ? `明细 ${input.targetId}：实际退回可用 ${quantity} 件，${input.warehouse}；凭证 ${input.evidence}；原已发量不变。` : action === 'cancel-approve' ? `取消明细 ${input.targetId}：确认 ${cancellation!.quantity} 件，释放相应预留。` : action === 'cancel-reject' ? `取消明细 ${input.targetId}：驳回，预留不释放。` : action === 'lock-confirm' ? '已在线下完成整单锁仓；样板不调用领星。' : action === 'labels-confirm' ? '已在线下收到箱唛与商品标签。' : input.reason!.trim();
  const next: ProcessingRow = { ...row, version: row.version + 1, dispatches: [...row.dispatches], cancellations: [...row.cancellations], timeline: [...row.timeline, createEvent(processingActions[action], '采购员（示例）', `${note}${input.reason?.trim() && action !== 'lock-failed' ? `说明：${input.reason.trim()}` : ''}`)] };
  if (action === 'lock-confirm') next.stage = 'pending_labels';
  if (action === 'labels-confirm') next.stage = 'ready_to_dispatch';
  if (action === 'dispatch') next.dispatches.push({ id: `${row.id}-D${row.dispatches.length + 1}`, quantity, warehouse: input.warehouse!.trim(), date: input.date!, reference: input.reference || '', evidence: input.evidence || '', returned: 0, version: 1 });
  if (action === 'return') next.dispatches = next.dispatches.map(value => value.id === input.targetId ? { ...value, returned: value.returned + quantity, version: value.version + 1 } : value);
  if (action.startsWith('cancel-')) { next.cancellations = next.cancellations.map(value => value.id === input.targetId ? { ...value, status: action === 'cancel-approve' ? 'approved' : 'rejected', version: value.version + 1 } : value); if (action === 'cancel-approve') next.cancelled += cancellation!.quantity; }
  if (unsent(next) === 0 && !pendingCancellation(next)) next.stage = dispatched(next) ? 'completed' : 'cancelled';
  else if (dispatched(next)) next.stage = 'partial_dispatch';
  return rows.map(value => value.id === id ? next : value);
}

function validDate(raw?: string) { if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false; const date = new Date(`${raw}T00:00:00Z`); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === raw; }

export function initialProcessingRows(): ProcessingRow[] {
  const stages: ProcessingStage[] = ['pending_lock', 'pending_labels', 'ready_to_dispatch', 'partial_dispatch', 'completed', 'cancelled'];
  return stages.map((stage, index) => {
    const id = `BH-CL-202610${String(index + 1).padStart(3, '0')}`, warehouse = index % 2 ? '多伦多仓' : '洛杉矶一仓', requested = 120 + index * 20, sent = stage === 'partial_dispatch' ? 40 : stage === 'completed' ? requested : 0;
    return { id, source: `CG-KC-202610${String(index + 1).padStart(3, '0')}`, product: ['折叠收纳架', '厨房置物架', '桌面收纳盒'][index % 3], group: index % 2 ? '运营二组' : '运营一组', shop: index % 2 ? 'Maple Living · CA（示例）' : 'North Home · US（示例）', warehouse, carton: 20, requested, cancelled: stage === 'cancelled' ? requested : 0, dispatches: sent ? [{ id: `${id}-D1`, quantity: sent, warehouse, date: '2026-10-17', reference: '样板历史发货', evidence: '', returned: 0, version: 1 }] : [], cancellations: stage === 'partial_dispatch' ? [{ id: `${id}-C1`, quantity: 20, status: 'pending', version: 1 }] : stage === 'cancelled' ? [{ id: `${id}-C1`, quantity: requested, status: 'approved', version: 2 }] : [], stage, version: 1,
      timeline: [createEvent('补货申请审批通过', '审批人（示例）', `申请 ${requested} 件，进入采购处理。`, '2026-10-15 10:00:00'), ...(index > 0 ? [createEvent('确认已锁仓', '采购员（示例）', '已在线下确认锁仓。', '2026-10-16 10:00:00')] : []), ...(index > 1 && index < 5 ? [createEvent('确认收到标签', '采购员（示例）', '已在线下收到标签。', '2026-10-16 14:00:00')] : []), ...(sent ? [createEvent('登记发货', '采购员（示例）', `累计实际发货 ${sent} 件。`, '2026-10-17 09:00:00')] : []), ...(stage === 'partial_dispatch' ? [createEvent('申请取消未发部分', '运营员（示例）', '待采购处理 20 件；暂不可发，预留尚未释放。', '2026-10-17 10:00:00')] : []), ...(stage === 'cancelled' ? [createEvent('确认未发取消', '采购员（示例）', `确认 ${requested} 件，保留申请历史。`, '2026-10-17 09:00:00')] : [])] };
  });
}
