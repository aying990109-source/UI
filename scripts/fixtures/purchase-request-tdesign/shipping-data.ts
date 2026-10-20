import { products } from './data';
import { createEvent, type DetailEvent } from './history';
import { suppliers } from './processing-data';

export const shippingPages = { schedule: '出货排期', preparation: '出货核对', dispatch: '物流下单' } as const;
export type ShippingPage = keyof typeof shippingPages;
export const warehouses = ['洛杉矶一仓', '美东新泽西仓', '多伦多仓'];
export const carrierTemplates = [
  { name: '远航物流（示例）', template: '北美海运标准模板（示例）', transport: '普通海运' },
  { name: '捷达国际（示例）', template: '北美空运标准模板（示例）', transport: '空运' },
];
export type Goods = { id: string; scheduleId: string; order: string; product: string; sku: string; supplier: string; warehouse: string; site: string; carton: number; boxVolume: number; quantity: number; transport: string };
export type Schedule = Goods & { date: string; delivery: string; status: '草稿' | '已确认'; pickup: string; remark: string; timeline: DetailEvent[] };
export type ManifestLine = Goods & { confirmed: number };
export type Manifest = { id: string; date: string; supplier: string; lines: ManifestLine[]; timeline: DetailEvent[] };
export type DispatchStatus = '草稿' | '已导出' | '已发送，待回运单' | '已接单，处理中';
export type DispatchLine = Goods & { manifestId: string; manifestLineId: string };
export type ShippingDispatch = { id: string; date: string; carrier: string; template: string; transport: string; changeReason: string; warehouse: string; lines: DispatchLine[]; status: DispatchStatus; file: string; trackingNo: string; trackingText: string; trackingStage: string; timeline: DetailEvent[] };
export type ShippingState = { schedules: Schedule[]; manifests: Manifest[]; dispatches: ShippingDispatch[] };
export type Source = Goods & { available: number; manifestId?: string; manifestLineId?: string };
export type Pick = { id: string; boxes: number };

export const totalQuantity = (rows: { quantity: number }[]) => rows.reduce((sum, row) => sum + row.quantity, 0);
export const totalBoxes = (rows: Goods[]) => rows.reduce((sum, row) => sum + row.quantity / row.carton, 0);
export const totalVolume = (rows: Goods[]) => rows.reduce((sum, row) => sum + row.quantity / row.carton * row.boxVolume, 0);
export const allocated = (state: ShippingState, lineId: string) => totalQuantity(state.dispatches.flatMap(row => row.lines).filter(line => line.manifestLineId === lineId));
export const confirmed = (manifest: Manifest) => manifest.lines.reduce((n, line) => n + line.confirmed, 0);
export const manifestAllocated = (state: ShippingState, manifest: Manifest) => manifest.lines.reduce((n, line) => n + allocated(state, line.id), 0);
export function manifestStatus(state: ShippingState, row: Manifest) {
  const used = manifestAllocated(state, row), total = totalQuantity(row.lines), checked = confirmed(row);
  return used === total ? '已全部分配' : used > 0 ? '部分分配' : checked === total ? '待物流下单' : checked > 0 ? '部分确认' : '待核对';
}

export function shippingSources(state: ShippingState, mode: 'preparation' | 'dispatch'): Source[] {
  if (mode === 'preparation') return state.schedules.filter(row => row.status === '已确认').map(row => ({ ...row, available: row.quantity - totalQuantity(state.manifests.flatMap(m => m.lines).filter(line => line.scheduleId === row.id)) })).filter(row => row.available > 0);
  return state.manifests.flatMap(manifest => manifest.lines.map(line => ({ ...line, manifestId: manifest.id, manifestLineId: line.id, available: line.confirmed - allocated(state, line.id) }))).filter(row => row.available > 0);
}

function pickedSources(state: ShippingState, mode: 'preparation' | 'dispatch', picks: Pick[]) {
  if (!picks.length) throw new Error('请至少选择一条来源。');
  if (new Set(picks.map(pick => pick.id)).size !== picks.length) throw new Error('同一来源不能重复选择。');
  const sources = shippingSources(state, mode);
  return picks.map(pick => {
    const source = sources.find(row => row.id === pick.id);
    if (!source || !Number.isSafeInteger(pick.boxes) || pick.boxes < 1 || pick.boxes * source.carton > source.available) throw new Error('选货箱数须为正整数，且不能超过来源可用箱数。');
    return { ...source, quantity: pick.boxes * source.carton };
  });
}

export function createManifests(state: ShippingState, picks: Pick[]): ShippingState {
  const rows = pickedSources(state, 'preparation', picks);
  const groups = [...new Set(rows.map(row => row.supplier))];
  const created = groups.map((supplier, index): Manifest => {
    const id = `HD-DEMO-${String(state.manifests.length + index + 1).padStart(4, '0')}`;
    const lines = rows.filter(row => row.supplier === supplier).map((row, i) => ({ ...row, id: `${id}-${i + 1}`, confirmed: 0 }));
    return { id, supplier, date: '2026-10-17', lines, timeline: [createEvent('生成核对资料', '演示用户', `从 ${lines.length} 条已确认排期选货，共 ${totalQuantity(lines)} 件 / ${totalBoxes(lines)} 箱。`)] };
  });
  return { ...state, manifests: [...created, ...state.manifests], schedules: state.schedules.map(schedule => {
    const picked = rows.find(row => row.id === schedule.id);
    if (!picked) return schedule;
    const manifest = created.find(row => row.supplier === picked.supplier)!;
    return { ...schedule, timeline: [...schedule.timeline, createEvent('选入核对资料', '演示用户', `${manifest.id}：选货 ${picked.quantity} 件 / ${picked.quantity / picked.carton} 箱。`)] };
  }) };
}

export function createDispatch(state: ShippingState, picks: Pick[], carrierName: string, changeReason: string): ShippingState {
  const rows = pickedSources(state, 'dispatch', picks), carrier = carrierTemplates.find(row => row.name === carrierName);
  if (!carrier) throw new Error('请选择物流商及对应模板。');
  if (new Set(rows.map(row => row.warehouse)).size !== 1) throw new Error('同一物流单只能选择同一目的仓，请调整所选来源。');
  if (totalBoxes(rows) > 50 || totalVolume(rows) > 30) throw new Error('每个物流单最多 50 箱、30 立方米，请减少选货数量。');
  if (rows.some(row => row.transport !== carrier.transport) && !changeReason.trim()) throw new Error('实际运输方式与排期不同，请填写变更原因。');
  const id = `WL-DEMO-${String(state.dispatches.length + 1).padStart(4, '0')}`;
  const order: ShippingDispatch = { id, date: '2026-10-17', carrier: carrier.name, template: carrier.template, transport: carrier.transport, changeReason: changeReason.trim(), warehouse: rows[0].warehouse,
    lines: rows.map(row => ({ ...row, manifestId: row.manifestId!, manifestLineId: row.manifestLineId! })), status: '草稿', file: '', trackingNo: '', trackingText: '', trackingStage: '',
    timeline: [createEvent('创建物流单', '演示用户', `从已确认核对资料分配 ${totalQuantity(rows)} 件 / ${totalBoxes(rows)} 箱。${changeReason.trim() ? `\n运输方式变更：${changeReason.trim()}` : ''}`)] };
  return { ...state, dispatches: [order, ...state.dispatches], manifests: state.manifests.map(manifest => {
    const selected = rows.filter(row => row.manifestId === manifest.id);
    return selected.length ? { ...manifest, timeline: [...manifest.timeline, createEvent('分配物流单', '演示用户', `${id}：分配 ${totalQuantity(selected)} 件 / ${totalBoxes(selected)} 箱。`)] } : manifest;
  }) };
}

export function confirmSchedules(state: ShippingState, ids: string[]): ShippingState {
  if (!ids.length) throw new Error('请选择待确认的排期。');
  const rows = ids.map(id => state.schedules.find(row => row.id === id));
  if (rows.some(row => !row || row.status !== '草稿' || !row.date || !row.warehouse || !row.pickup)) throw new Error('仅可确认资料齐全的草稿，请补齐出货日期、目的仓和提货仓。');
  const event = createEvent('确认出货排期', '演示用户', '计划数量已确认，可进入出货核对选货。');
  return { ...state, schedules: state.schedules.map(row => ids.includes(row.id) ? { ...row, status: '已确认', timeline: [...row.timeline, event] } : row) };
}

export function confirmManifest(state: ShippingState, id: string): ShippingState {
  const row = state.manifests.find(row => row.id === id);
  if (!row || confirmed(row) === totalQuantity(row.lines)) throw new Error('当前资料没有待核对数量。');
  const next = { ...row, lines: row.lines.map(line => ({ ...line, confirmed: line.quantity })), timeline: [...row.timeline, createEvent('确认核对资料', '演示用户', `本次确认 ${totalQuantity(row.lines) - confirmed(row)} 件，可分配物流单。`)] };
  return { ...state, manifests: state.manifests.map(row => row.id === id ? next : row) };
}

export function changeDispatch(state: ShippingState, id: string, action: 'export' | 'send' | 'trackingNo' | 'tracking', value = ''): ShippingState {
  const row = state.dispatches.find(row => row.id === id);
  if (!row) throw new Error('物流单不存在。');
  const next = { ...row }, text = value.trim();
  let event: DetailEvent;
  if (action === 'export') {
    if (!['草稿', '已导出'].includes(row.status)) throw new Error('当前状态不能生成示例文件。');
    next.file = `${row.id}-示例清单.csv`; next.status = '已导出';
    event = createEvent('生成示例文件', '演示用户', next.file);
  } else if (action === 'send') {
    if (row.status !== '已导出' || !row.file) throw new Error('请先生成有效的示例文件。');
    next.status = '已发送，待回运单'; event = createEvent('记录发送', '演示用户', `已记录 ${row.file} 的示例发送状态。`);
  } else if (action === 'trackingNo') {
    if (!['已导出', '已发送，待回运单'].includes(row.status) || !row.file || !text) throw new Error('请先生成示例文件，并填写运单号。');
    if (state.dispatches.some(other => other.id !== id && other.trackingNo === text)) throw new Error('该运单号已用于其他示例物流单。');
    next.status = '已接单，处理中'; next.trackingNo = text; next.trackingStage = '在途';
    event = createEvent('登记运单', '演示用户', `运单号：${text}`);
  } else {
    if (row.status !== '已接单，处理中' || !row.trackingNo || !text) throw new Error('仅已登记运单的物流单可保存非空物流信息。');
    if (text === row.trackingText) return state;
    next.trackingText = text; event = createEvent('更新物流信息', '演示用户', text);
  }
  next.timeline = [...row.timeline, event];
  return { ...state, dispatches: state.dispatches.map(row => row.id === id ? next : row) };
}

export function initialShippingState(): ShippingState {
  const schedules: Schedule[] = Array.from({ length: 12 }, (_, i) => {
    const product = products[i % products.length], id = `PQ202610${String(17001 + i)}`, carton = product.carton ?? 20;
    return { id, scheduleId: id, order: `PO202610${String(16001 + i)}`, product: product.name, sku: product.code, supplier: suppliers[i % 3], warehouse: i === 1 ? '' : warehouses[i % 3], site: i % 3 === 2 ? 'CA' : 'US', carton, boxVolume: [0.064, 0.048, 0.032][i % 3], quantity: carton * [30, 20, 15, 10][i % 4], transport: '普通海运', date: `2026-10-${20 + i % 5}`, delivery: '2026-10-19', status: i < 4 ? '草稿' : '已确认', pickup: ['宁波集货仓', '深圳集货仓'][i % 2], remark: i === 1 ? '待确认目的仓' : '',
      timeline: [createEvent('生成排期草稿', '采购员（示例）', '采购订单已填写交期，生成出货计划。', '2026-10-16 09:00:00'), ...(i >= 4 ? [createEvent('确认出货排期', '采购员（示例）', '计划数量及目的仓已确认。', '2026-10-16 10:00:00')] : [])] };
  });
  const manifests: Manifest[] = schedules.slice(4, 9).map((source, i) => {
    const id = `HD2026101600${i + 1}`, checked = i === 0 ? 0 : i === 1 ? source.carton * Math.floor(source.quantity / source.carton / 2) : source.quantity;
    return { id, date: '2026-10-16', supplier: source.supplier, lines: [{ ...source, id: `${id}-1`, confirmed: checked }], timeline: [createEvent('生成核对资料', '采购员（示例）', `从排期 ${source.id} 选货 ${source.quantity} 件。`, '2026-10-16 11:00:00'), ...(checked ? [createEvent('确认核对资料', '核对员（示例）', `已确认 ${checked} 件。`, '2026-10-16 14:00:00')] : [])] };
  });
  const dispatches: ShippingDispatch[] = manifests.slice(2).map((manifest, i) => {
    const source = manifest.lines[0], id = `WL2026101600${i + 1}`, q = i === 2 ? source.quantity : source.carton * Math.floor(source.quantity / source.carton / 2);
    const row: ShippingDispatch = { id, date: '2026-10-16', carrier: carrierTemplates[0].name, template: carrierTemplates[0].template, transport: '普通海运', changeReason: '', warehouse: source.warehouse, lines: [{ ...source, quantity: q, manifestId: manifest.id, manifestLineId: source.id }], status: i === 0 ? '已接单，处理中' : i === 1 ? '已导出' : '草稿', file: i < 2 ? `${id}-示例清单.csv` : '', trackingNo: i === 0 ? 'DEMO-YH-26101601' : '', trackingText: i === 0 ? '货物已装柜，预计 10 月 21 日开船。' : '', trackingStage: i === 0 ? '在途' : '', timeline: [createEvent('创建物流单', '物流专员（示例）', `分配 ${q} 件。`, '2026-10-16 15:00:00')] };
    if (i < 2) row.timeline.push(createEvent('生成示例文件', '物流专员（示例）', row.file, '2026-10-16 15:20:00'));
    if (i === 0) row.timeline.push(createEvent('记录发送', '物流专员（示例）', '记录示例文件发送。', '2026-10-16 16:00:00'), createEvent('登记运单', '物流专员（示例）', row.trackingNo, '2026-10-17 09:00:00'), createEvent('更新物流信息', '物流专员（示例）', row.trackingText, '2026-10-17 10:00:00'));
    return row;
  });
  return {
    schedules: schedules.map(row => {
      const manifest = manifests.find(manifest => manifest.lines.some(line => line.scheduleId === row.id));
      return manifest ? { ...row, timeline: [...row.timeline, createEvent('选入核对资料', '采购员（示例）', `${manifest.id}：选货 ${row.quantity} 件。`, '2026-10-16 11:00:00')] } : row;
    }),
    manifests: manifests.map(row => {
      const dispatch = dispatches.find(dispatch => dispatch.lines.some(line => line.manifestId === row.id));
      return dispatch ? { ...row, timeline: [...row.timeline, createEvent('分配物流单', '物流专员（示例）', `${dispatch.id}：分配 ${totalQuantity(dispatch.lines)} 件。`, '2026-10-16 15:00:00')] } : row;
    }), dispatches,
  };
}
