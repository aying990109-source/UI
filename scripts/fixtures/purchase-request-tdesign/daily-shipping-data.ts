import { dailyStatusLabel, type DailyLine } from './order-data';

// Field order and headers follow ERP backend/app/order_processing.py XLSX_TEMPLATE_HEADERS.
export const dailyWorkbookColumns = [
  ['shipping_status', '单选项'], ['order_date', '今日订单日期'], ['lingxing_order_no', '【必要】系统单号'],
  ['reference_no', '【必要】参考号'], ['platform_order_no', '【必要】平台单号'], ['group_name', '【必要】组别'],
  ['store', '【必要】店铺'], ['product_name', '【必要】品名'], ['model', '【必要】型号'], ['quantity', '【必要】数量'],
  ['address', '【必要】地址合并，不含地址3（收件人，地址行1，地址行2，城市，省/州，邮编，电话）'],
  ['price', '【必要】价格（减去平台费）'], ['country', '【必要】国家'],
  ['shipping_channel', '【必要】发货渠道【保留字段】'], ['channel_detail', '【必要】备注/渠道明细【保留字段】'],
  ['source_remark', '备注'],
] as const satisfies readonly (readonly [keyof DailyLine, string])[];

export function dailyWorkbook(rows: DailyLine[]) {
  return {
    headers: dailyWorkbookColumns.map(([, label]) => label),
    rows: rows.map(row => dailyWorkbookColumns.map(([key]) => key === 'shipping_status' ? dailyStatusLabel(row.shipping_status) : row[key])),
  };
}

export type DailyFilters = { query: string; group: string; channel: string; dates: string[] };
export function filterDaily(rows: DailyLine[], filters: DailyFilters) {
  const query = filters.query.trim().toLocaleLowerCase();
  return rows.filter(row => (!filters.group || row.group_name === filters.group)
    && (!filters.channel || row.shipping_channel === filters.channel)
    && (!filters.dates[0] || row.order_date >= filters.dates[0])
    && (!filters.dates[1] || row.order_date <= filters.dates[1])
    && (!query || [row.lingxing_order_no, row.reference_no, row.platform_order_no, row.group_name, row.store,
      row.product_name, row.model, row.asin, row.address, row.country, row.shipping_channel, row.channel_detail,
      row.multichannel_order_no, row.gift_order_no, row.estimated_arrival, row.source_remark, row.internal_remark]
      .some(value => value.toLocaleLowerCase().includes(query))));
}
