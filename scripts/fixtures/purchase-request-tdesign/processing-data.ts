import { sampleRows, type RequestRow } from './data';
import { createEvent, seedRequestTimeline } from './history';

export const processingPages = { review: '待复审', demand: '采购需求明细', summary: '采购汇总', orders: '采购订单' } as const;
export type ProcessingPage = keyof typeof processingPages;
export type PurchaseLine = RequestRow & {
  review: boolean; supplier: string; company: string; price: number | null;
  planned: number; ordered: number; executionCarton: number | null; adjustmentReason: string;
};
export type PurchaseGroup = { id: string; supplier: string; company: string; purchaseType: string; lines: PurchaseLine[] };
export type DemoOrder = PurchaseGroup & { date: string; delivery: string; orderStatus: string };
export const suppliers = ['宁波禾木家居有限公司', '杭州简物生活用品有限公司', '深圳知物科技有限公司'];
export const companies = ['星海商贸有限公司', '星海国际贸易有限公司'];

export const purchaseLines: PurchaseLine[] = sampleRows.slice(0, 18).map((row, i) => {
  const ordered = i >= 14 ? row.quantity : i === 12 ? Math.floor(row.quantity / (row.carton ?? 1) / 2) * (row.carton ?? 1) : 0;
  const timeline = seedRequestTimeline(row.date, row.applicant, row.quantity, i < 6 ? '采购复审' : '待采购');
  if (ordered) timeline.push(createEvent('采购下单', '采购员（示例）', `本次下单 ${ordered} 件，未下单 ${row.quantity - ordered} 件。`, '2026-10-16 14:30:00'));
  return {
  ...row, review: i < 6, supplier: i === 1 ? '' : suppliers[i % 3], company: companies[i % 2],
  price: i === 2 ? null : [18.5, 32, 9.8, 12.6, 28, 46.5, 21, 8.4][i % 8],
  planned: row.quantity, ordered, timeline,
  executionCarton: row.carton, adjustmentReason: '',
  };
});

export function saveReviewDetails(previous: PurchaseLine, next: PurchaseLine): PurchaseLine {
  const fields = { supplier: '供应商', price: '采购单价', company: '采购方', planned: '计划采购量', executionCarton: '本次装箱数', adjustmentReason: '数量调整原因' } as const;
  const changes = (Object.keys(fields) as (keyof typeof fields)[])
    .filter(key => previous[key] !== next[key])
    .map(key => `${fields[key]}：${previous[key] === '' || previous[key] == null ? '未填写' : previous[key]} → ${next[key] === '' || next[key] == null ? '未填写' : next[key]}`);
  return { ...next, timeline: changes.length ? [...previous.timeline, createEvent('修改复审资料', '演示用户', changes.join('\n'))] : previous.timeline };
}

export const missingFields = (row: PurchaseLine) => [
  ...(!row.supplier ? ['供应商'] : []), ...(row.price == null || row.price <= 0 ? ['采购单价'] : []),
  ...(!row.executionCarton ? ['本次装箱数'] : []),
];
export const remaining = (row: PurchaseLine) => row.planned - row.ordered;
export const demandStatus = (row: PurchaseLine) => row.ordered === row.planned ? '已下单' : row.ordered > 0 ? '部分下单' : '待采购';
export const sum = (rows: PurchaseLine[], get: (row: PurchaseLine) => number) => rows.reduce((total, row) => total + get(row), 0);
export const quantity = (value: number) => value.toLocaleString('zh-CN');
export const money = (value: number) => value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function groupLines(rows: PurchaseLine[]): PurchaseGroup[] {
  const groups = new Map<string, PurchaseGroup>();
  for (const row of rows) {
    const id = JSON.stringify([row.purchaseType, row.company, row.supplier]);
    const group = groups.get(id) ?? { id, supplier: row.supplier, company: row.company, purchaseType: row.purchaseType, lines: [] };
    group.lines.push(row);
    groups.set(id, group);
  }
  return [...groups.values()];
}

export const initialOrders: DemoOrder[] = groupLines(purchaseLines.filter(row => row.ordered > 0).map(row => ({ ...row, planned: row.ordered }))).map((group, i) => ({
  ...group, id: `PO202610${16001 + i}`, date: '2026-10-16', delivery: i === 1 ? '' : '2026-10-26', orderStatus: i === 2 ? '已入国内仓' : '待交货',
}));

export function previewOrders(rows: PurchaseLine[], sequence: number): DemoOrder[] {
  if (!rows.length || rows.some(row => row.review || remaining(row) <= 0 || missingFields(row).length)) return [];
  return groupLines(rows.map(row => ({ ...row, planned: remaining(row) }))).map((group, i) => ({
    ...group, id: `PO-DEMO-${String(sequence + i).padStart(4, '0')}`, date: '2026-10-17', delivery: '', orderStatus: '已下单',
  }));
}

export function exportDemo(name: string, headers: string[], rows: (string | number)[][]) {
  const cell = (value: string | number) => `"${String(value).replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
  const content = [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${name}-示例数据.csv`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
