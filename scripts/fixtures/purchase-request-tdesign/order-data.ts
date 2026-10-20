import { createEvent, type DetailEvent } from './history';

export const orderPages = { dailyShipping: '每日订单发货', afterSales: '售后记录', reshipments: '补发表' };
export const orderGroups = ['运营一组', '运营二组'];
export const orderShops = ['North Home · US（示例）', 'Maple Living · CA（示例）'];
export const transitStates = ['未登记', '待揽收', '运输中', '已签收', '运输异常', '已退回'] as const;
export type Goods = { id: string; product: string; model: string; color: string; quantity: number };
export type DailyLine = Goods & { order: string; platform: string; shop: string; group: string; date: string; country: string; address: string; channel: string; price: number; status: '待发货' | '已发货'; remark: string; timeline: DetailEvent[] };
export type AfterSale = { id: string; order: string; shop: string; group: string; date: string; reason: string; description: string; items: Goods[]; status: '待处理' | '处理中' | '已结案'; nextDate: string; resolution: string; timeline: DetailEvent[] };
export type Parcel = { id: string; order: string; channel: string; tracking: string; status: typeof transitStates[number]; date: string; handler: string; allocations: Record<string, number> };
export type Reshipment = { id: string; sourceId: string; order: string; shop: string; group: string; date: string; purpose: '补发' | '换货'; items: Goods[]; parcels: Parcel[]; remark: string; deleted: boolean; timeline: DetailEvent[] };
export type OrderState = { daily: DailyLine[]; afterSales: AfterSale[]; reshipments: Reshipment[] };
export type OrderDraft = { order: string; shop: string; group: string; items: Goods[]; remark: string; reason: string };
export const today = () => createEvent('', '', '').time.slice(0, 10);
const event = (label: string, comment: string) => createEvent(label, '演示用户', comment);
const requireText = (value: string, name: string) => { if (!value.trim()) throw new Error(`请填写${name}`); };
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
function validateItems(items: Goods[]) {
  if (!items.length) throw new Error('至少添加一项商品');
  if (new Set(items.map(item => item.id)).size !== items.length || items.some(item => !item.id)) throw new Error('商品标识重复或缺失');
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) throw new Error('商品数量须为正整数');
  }
}
function validateDraft(draft: OrderDraft) {
  requireText(draft.order, '原始订单编号'); requireText(draft.shop, '店铺');
  if (!orderGroups.includes(draft.group)) throw new Error('请选择所属小组');
  validateItems(draft.items);
}

export function updateDaily(state: OrderState, ids: string[], status: DailyLine['status'], remark?: string): OrderState {
  if (!['待发货', '已发货'].includes(status)) throw new Error('请选择发货状态');
  if (!ids.length || ids.some(id => !state.daily.some(line => line.id === id))) throw new Error('请选择有效明细');
  const orders = new Set(state.daily.filter(line => ids.includes(line.id)).map(line => line.order));
  return { ...state, daily: state.daily.map(line => {
    if (!orders.has(line.order) || line.status === status && (remark === undefined || remark === line.remark)) return line;
    const note = remark === undefined ? line.remark : remark;
    return { ...line, status, remark: note, timeline: [...line.timeline, event('维护发货资料', `${line.status} → ${status}${remark === undefined ? '' : `；内部备注：${note || '已清空'}`}。同步同系统单号全部明细。`)] };
  }) };
}
export function createAfterSale(state: OrderState, draft: OrderDraft): OrderState {
  validateDraft(draft); requireText(draft.reason, '问题原因'); requireText(draft.remark, '问题描述');
  const row: AfterSale = { id: `SH-DEMO-${String(state.afterSales.length + 1).padStart(4, '0')}`, order: draft.order.trim(), shop: draft.shop.trim(), group: draft.group, items: structuredClone(draft.items), date: today(), reason: draft.reason.trim(), description: draft.remark.trim(), nextDate: '', resolution: '', status: '待处理', timeline: [event('登记售后', `${draft.reason}：${draft.remark}。人工登记，未关联导入订单。`)] };
  return { ...state, afterSales: [row, ...state.afterSales] };
}
export function createDirectReshipment(state: OrderState, draft: OrderDraft): OrderState {
  validateDraft(draft);
  const row = newReshipment(state, draft, '', '补发');
  return { ...state, reshipments: [row, ...state.reshipments] };
}
function newReshipment(state: OrderState, draft: OrderDraft, sourceId: string, purpose: Reshipment['purpose']): Reshipment {
  return { id: `BF-DEMO-${String(state.reshipments.length + 1).padStart(4, '0')}`, sourceId, order: draft.order.trim(), shop: draft.shop.trim(), group: draft.group, date: today(), purpose, items: structuredClone(draft.items), parcels: [], remark: draft.remark.trim(), deleted: false, timeline: [event('创建补发申请', `${sourceId ? `来源 ${sourceId} · ${purpose}` : '直接申请 · 无关联售后'}；${draft.items.reduce((sum, item) => sum + item.quantity, 0)} 件。`)] };
}
export function followAfterSale(state: OrderState, id: string, action: '沟通跟进' | '补发' | '换货' | '结案' | '重新打开', note: string, nextDate = '', quantities: Record<string, number> = {}): OrderState {
  const row = state.afterSales.find(row => row.id === id);
  if (!row) throw new Error('售后记录不存在');
  requireText(note, action === '结案' ? '结案说明' : '处理说明');
  if (action === '重新打开' ? row.status !== '已结案' : row.status === '已结案') throw new Error('当前状态不支持此操作');
  if (!['沟通跟进', '补发', '换货', '结案', '重新打开'].includes(action)) throw new Error('不支持的处理方式');
  if (nextDate && (!validDate(nextDate) || nextDate < today())) throw new Error('下次跟进日期不能早于今天');
  let reshipments = state.reshipments;
  let comment = note.trim();
  if (action === '补发' || action === '换货') {
    if (Object.keys(quantities).some(key => !row.items.some(item => item.id === key))) throw new Error('商品不属于当前售后');
    const items = row.items.filter(item => quantities[item.id] > 0).map(item => ({ ...item, quantity: quantities[item.id] }));
    validateItems(items);
    if (Object.values(quantities).some(value => !Number.isSafeInteger(value) || value < 0) || items.some(item => item.quantity > row.items.find(source => source.id === item.id)!.quantity)) throw new Error('本次申请量不能超过涉事商品数量');
    const request = newReshipment(state, { ...row, items, remark: note }, id, action);
    reshipments = [request, ...reshipments]; comment += `；已创建 ${request.id}，${action} ${items.reduce((sum, item) => sum + item.quantity, 0)} 件，待维护发货资料。`;
  }
  return { ...state, reshipments, afterSales: state.afterSales.map(item => item.id !== id ? item : { ...item, status: action === '结案' ? '已结案' : '处理中', resolution: action === '结案' ? note.trim() : action === '重新打开' ? '' : item.resolution, nextDate: action === '结案' ? '' : nextDate, timeline: [...item.timeline, event(action, comment)] }) };
}
export const allocated = (row: Reshipment, itemId: string) => row.parcels.reduce((sum, parcel) => sum + (parcel.allocations[itemId] || 0), 0);
export function reshipmentStage(row: Reshipment) {
  if (!row.parcels.length) return '待登记';
  if (row.parcels.some(parcel => parcel.status === '运输异常' || parcel.status === '已退回')) return '需跟进';
  if (row.items.every(item => allocated(row, item.id) === item.quantity) && row.parcels.every(parcel => parcel.status === '已签收')) return '已签收';
  return '已登记';
}
export function saveParcels(state: OrderState, id: string, parcels: Parcel[], remark: string): OrderState {
  const row = state.reshipments.find(row => row.id === id && !row.deleted);
  if (!row) throw new Error('申请不存在或已删除');
  if (new Set(parcels.map(parcel => parcel.id)).size !== parcels.length) throw new Error('包裹标识重复');
  for (const parcel of parcels) {
    if (!transitStates.includes(parcel.status)) throw new Error('请选择有效运输状态');
    if (!validDate(parcel.date)) throw new Error('请填写有效补发日期');
    requireText(parcel.handler, '处理人');
    const values = Object.entries(parcel.allocations);
    if (!values.length || values.some(([key, value]) => !row.items.some(item => item.id === key) || !Number.isSafeInteger(value) || value < 1)) throw new Error('每个包裹须分配有效商品及正整数数量');
  }
  if (row.items.some(item => parcels.reduce((sum, parcel) => sum + (parcel.allocations[item.id] || 0), 0) > item.quantity)) throw new Error('所有包裹合计不能超过本次申请量');
  const shippingChanged = JSON.stringify(parcels) !== JSON.stringify(row.parcels);
  if (!shippingChanged && remark === row.remark) return state;
  const changes: string[] = [];
  const fields = [['order', '系统单号'], ['channel', '渠道'], ['tracking', '运单号'], ['status', '运输状态'], ['date', '补发日期'], ['handler', '处理人']] as const;
  for (const parcelId of new Set([...row.parcels, ...parcels].map(parcel => parcel.id))) {
    const before = row.parcels.find(parcel => parcel.id === parcelId), after = parcels.find(parcel => parcel.id === parcelId);
    const details: string[] = [];
    for (const [key, label] of fields) {
      if (before?.[key] !== after?.[key]) details.push(`${label}：${before?.[key] || '未填写'} → ${after?.[key] || '未填写'}`);
    }
    row.items.forEach((item, i) => {
      const previous = before?.allocations[item.id] || 0, current = after?.allocations[item.id] || 0;
      if (previous !== current) details.push(`商品 ${i + 1}（${[item.product, item.model, item.color].filter(Boolean).join(' / ') || '未填写名称'}）：${previous} → ${current} 件`);
    });
    const position = after ? parcels.indexOf(after) : row.parcels.indexOf(before!);
    if (details.length) changes.push(`${!before ? '新增' : !after ? '移除' : '修改'}包裹 ${position + 1}\n${details.join('\n')}`);
  }
  if (remark !== row.remark) changes.push(`申请备注：${row.remark || '未填写'} → ${remark || '未填写'}`);
  const next = { ...row, parcels: structuredClone(parcels), remark, timeline: [...row.timeline, event(shippingChanged ? '补发发货更新' : '修改备注', changes.join('\n') || '调整包裹顺序')] };
  return { ...state, reshipments: state.reshipments.map(item => item.id === id ? next : item) };
}
export function deleteReshipment(state: OrderState, id: string, reason: string): OrderState {
  requireText(reason, '删除原因');
  if (!state.reshipments.some(row => row.id === id && !row.deleted)) throw new Error('申请不存在或已删除');
  return { ...state, reshipments: state.reshipments.map(row => row.id !== id ? row : { ...row, deleted: true, timeline: [...row.timeline, event('删除补发申请', reason.trim())] }) };
}
export function afterTimeline(state: OrderState, row: AfterSale) {
  return [...row.timeline, ...state.reshipments.filter(item => item.sourceId === row.id).flatMap(item => item.timeline.filter(entry => ['补发发货更新', '删除补发申请'].includes(entry.label)).map(entry => ({ ...entry, comment: `${item.id} · ${entry.comment}` })))].sort((a, b) => a.time.localeCompare(b.time));
}
export const currentReshipments = (state: OrderState, sourceId: string) => state.reshipments.filter(row => !row.deleted && row.sourceId === sourceId);

export function initialOrderState(): OrderState {
  const products = ['可折叠收纳箱', '不锈钢保温杯', '桌面理线盒', '旅行收纳袋', '厨房置物架', '笔记本支架'];
  const goods = (i: number): Goods => ({ id: `item-${i}`, product: products[i % 6], model: ['BX-45L', 'CUP-600', 'CB-03', 'BAG-06', 'KR-02', 'LS-01'][i % 6], color: ['灰色', '银色', '白色'][i % 3], quantity: i % 2 + 1 });
  const daily: DailyLine[] = Array.from({ length: 8 }, (_, i) => {
    const n = Math.floor(i / 2), date = `2026-10-${16 - n}`;
    const timeline = [createEvent('导入每日发货', '导入人（示例）', '合成工作簿示例，来源字段只读。', `${date} 09:00:00`)];
    if (n % 2) timeline.push(createEvent('维护发货资料', '处理人（示例）', '同系统单号全部商品已标记发货。', `${date} 11:00:00`));
    return { ...goods(i), id: `daily-${i}`, order: `LX-DEMO-00${n + 1}`, platform: `DEMO-PLATFORM-${n + 1}`, shop: orderShops[n % 2], group: orderGroups[n % 2], date, country: n % 2 ? 'CA' : 'US', address: 'Demo Customer, 100 Example Avenue, Demo City（虚构地址）', channel: n % 2 ? '海外仓（示例）' : '多渠道（示例）', price: 18.9 + i * 2, status: n % 2 ? '已发货' : '待发货', remark: n % 2 ? '已核对订单资料（示例）' : '', timeline };
  });
  const afterSales: AfterSale[] = products.map((product, i) => {
    const date = `2026-10-${16 - i}`, status = (['待处理', '处理中', '处理中', '已结案', '待处理', '处理中'] as const)[i];
    const row: AfterSale = { id: `SH-DEMO-000${i + 1}`, order: `SALE-DEMO-000${i + 1}`, shop: orderShops[i % 2], group: orderGroups[i % 2], date, reason: ['商品破损', '未收到货', '错发/漏发', '质量问题', '物流异常', '与描述不符'][i], description: `${product}问题待核实；顾客提供的资料为合成示例。`, items: [goods(i)], status, nextDate: status === '处理中' ? '2026-10-20' : '', resolution: status === '已结案' ? '已与顾客沟通解决（示例）' : '', timeline: [createEvent('登记售后', '运营（示例）', '人工登记独立问题，未关联导入订单。', `${date} 09:00:00`)] };
    if (status !== '待处理') row.timeline.push(createEvent(status === '已结案' ? '结案' : '沟通跟进', '运营（示例）', status === '已结案' ? row.resolution : '已联系顾客核实情况。', `${date} 10:00:00`));
    return row;
  });
  const reshipments: Reshipment[] = [1, 2, 5].map((n, i) => {
    const source = afterSales[n], item = source.items[0], id = `BF-DEMO-000${i + 1}`, time = `${source.date} 12:00:00`;
    source.timeline.push(createEvent(i === 1 ? '换货' : '补发', '运营（示例）', `创建 ${id}；待维护发货资料。`, time));
    const row: Reshipment = { id, sourceId: source.id, order: source.order, shop: source.shop, group: source.group, date: source.date, purpose: i === 1 ? '换货' : '补发', items: structuredClone(source.items), parcels: [], deleted: false, remark: '独立补发申请示例', timeline: [createEvent('创建补发申请', '运营（示例）', `来源 ${source.id}`, time)] };
    if (i > 0) {
      row.parcels = [{ id: `parcel-${i}`, order: `ERP-DEMO-${i}`, channel: '海外仓（示例）', tracking: `TRACK-DEMO-${i}`, status: i === 1 ? '已签收' : '运输异常', date: '2026-10-16', handler: '处理人（示例）', allocations: { [item.id]: item.quantity } }];
      row.timeline.push(createEvent('补发发货更新', '处理人（示例）', `包裹 ${row.parcels[0].tracking}，明确登记：${row.parcels[0].status}。`, '2026-10-16 15:00:00'));
    }
    return row;
  });
  return { daily, afterSales, reshipments };
}
