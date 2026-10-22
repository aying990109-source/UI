import { allocated, type Goods, type Parcel, type Reshipment } from './order-data';

export type ReshipmentLine = { id: string; request: Reshipment; item: Goods; parcel?: Parcel; quantity: number; first: boolean; span: number };
export type ReshipmentFilters = { query: string; group: string; shop: string; status: string; creator: string; handler: string; channel: string; createdDates: string[]; shippedDates: string[] };
export const emptyReshipmentFilters: ReshipmentFilters = { query: '', group: '', shop: '', status: '', creator: '', handler: '', channel: '', createdDates: [], shippedDates: [] };
// Creation facts come from the creation event, never the most recent shipping update.
export const reshipmentCreation = (row: Reshipment) => row.timeline.find(entry => entry.label === '创建补发申请');

export function reshipmentLines(records: Reshipment[]): ReshipmentLine[] {
  return records.flatMap(request => {
    const lines: ReshipmentLine[] = [];
    for (const parcel of request.parcels) for (const item of request.items) {
      const quantity = parcel.allocations[item.id] || 0;
      if (quantity > 0) lines.push({ id: `${request.id}:${parcel.id}:${item.id}`, request, item, parcel, quantity, first: false, span: 1 });
    }
    for (const item of request.items) {
      const quantity = item.quantity - allocated(request, item.id);
      if (quantity > 0) lines.push({ id: `${request.id}:remaining:${item.id}`, request, item, quantity, first: false, span: 1 });
    }
    if (lines[0]) { lines[0].first = true; lines[0].span = lines.length; }
    return lines;
  });
}

const includes = (value: string, query: string) => value.toLowerCase().includes(query.trim().toLowerCase());
const inRange = (date: string, range: string[]) => (!range[0] || date >= range[0]) && (!range[1] || date <= range[1]);
export function filterReshipments(records: Reshipment[], filters: ReshipmentFilters) {
  return records.filter(row => {
    const creation = reshipmentCreation(row);
    if (row.deleted || (filters.group && row.group !== filters.group) || (filters.shop && row.shop !== filters.shop)) return false;
    if (!includes(creation?.operator || '', filters.creator) || !inRange(creation?.time.slice(0, 10) || row.date, filters.createdDates)) return false;
    const searchable = [row.id, row.order, row.shop, row.sourceId, row.remark, ...row.items.flatMap(item => [item.model, item.color]), ...row.parcels.flatMap(parcel => [parcel.order, parcel.tracking])].join(' ');
    if (!includes(searchable, filters.query)) return false;
    const parcelFilter = filters.status || filters.handler.trim() || filters.channel.trim() || filters.shippedDates.some(Boolean);
    return !parcelFilter || row.parcels.some(parcel => (!filters.status || parcel.status === filters.status) && includes(parcel.handler, filters.handler) && includes(parcel.channel, filters.channel) && inRange(parcel.date, filters.shippedDates));
  });
}

export function reshipmentExport(records: Reshipment[]) {
  return {
    headers: ['补发申请编号', '店铺名', '原始订单编号', '型号', '颜色', '数量', '备注', '创建人', '组别', '处理人', '补发系统单号', '补发日期', '发货渠道', '运单号', '运输状态', '创建日期', '申请用途', '包裹编号'],
    rows: reshipmentLines(records).map(({ request, item, parcel, quantity }) => {
      const creation = reshipmentCreation(request);
      return [request.id, request.shop, request.order, item.model, item.color, quantity, request.remark, creation?.operator || '', request.group, parcel?.handler || '', parcel?.order || '', parcel?.date || '', parcel?.channel || '', parcel?.tracking || '', parcel?.status || '未分包', creation?.time || request.date, request.purpose, parcel?.id || ''];
    }),
  };
}
