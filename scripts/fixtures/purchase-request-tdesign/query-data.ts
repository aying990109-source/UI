export const queryPages = { orderQuery: '订单查询', pricingQuery: '定价查询', brandQuery: '品牌查询' };
export type QueryPage = keyof typeof queryPages;
export type QueryFilters = { query: string; country: string; source: string };
export const emptyQuery = (): QueryFilters => ({ query: '', country: '', source: '' });
export const queryExamples: Record<QueryPage, string[]> = { orderQuery: ['折叠收纳箱', '112-1000001-2000001', 'US 家居'], pricingQuery: ['折叠收纳箱', '桌面理线盒'], brandQuery: ['DEMO NORTH', '示例品牌'] };
export const queryRules: Record<QueryPage, string> = {
  orderQuery: '平台/系统单号、品名、店铺名；多个关键词同时匹配。完整 Amazon 格式单号精确匹配。',
  pricingQuery: '请输入完整品名；忽略首尾空白和英文大小写，内部空格、标点须一致。仅查询启用定价。',
  brandQuery: '完整名称匹配；忽略首尾空白和英文大小写，不做模糊、别名或全半角转换。',
};
export type TrackingValue = { source: string; number: string; note: string };
export type QueryOrder = {
  id: string; platformOrder: string; systemOrder: string; date: string; site: string; store: string; originalStore: string; group: string;
  product: string; model: string; quantity: number; sku: string; shippingChannel: string; expectedArrival: string; tracking: TrackingValue[]; logisticsNote: string;
  related: string; sourcePrice: string; importedAt: string; sourceFile: string; sourceNote: string;
};
export type QueryPrice = { id: string; product: string; spec: string; country: string; source: string; currency: string; guidance: number | null; updated: string; active: boolean };
export type BrandResult = { name: string; exists: boolean };

// shortcut: standalone synthetic read projections; replace with authorized API projections when this fixture moves to production.
export function initialQueryData() {
  const orders: QueryOrder[] = Array.from({ length: 14 }, (_, i) => {
    const n = i + 1, pair = i === 1 ? 1 : n, site = i % 3 === 2 ? 'CA' : 'US';
    return { id: `CX-${String(n).padStart(3, '0')}`, platformOrder: `112-${String(1000000 + pair)}-${String(2000000 + pair)}`, systemOrder: `SYS-DEMO-${String(n).padStart(4, '0')}`, date: `2026-10-${String(16 - Math.floor(i / 3)).padStart(2, '0')}`, site, store: i === 4 ? '' : `${site} 家居一店（示例）`, originalStore: `${site} HOME ORIGINAL ${i % 2 + 1}`, group: site === 'US' ? '北美一组（示例）' : '加拿大组（示例）', product: i < 12 ? '折叠收纳箱' : '桌面理线盒', model: i % 2 ? 'ST-60' : 'ST-48', quantity: i === 1 ? 2 : 1, sku: `SKU-DEMO-${n}`, shippingChannel: i === 2 ? '' : i % 2 ? '国内直发（示例）' : '海外仓（示例）', expectedArrival: i === 2 ? '' : `2026-10-${String(22 + Math.floor(i / 3)).padStart(2, '0')}`, tracking: i === 2 ? [] : [{ source: '原表运单号', number: `DEMO-TRACK-${pair}`, note: '合成运单，不可用于外部查询' }, ...(i === 0 ? [{ source: '原表自动读取列', number: 'DEMO-TRACK-OTHER', note: '来源值不同，请核对；不是实时接口结果' }] : i === 3 ? [{ source: '原表自动读取列', number: `DEMO-TRACK-${pair}`, note: '与原表运单号相同，保留两个来源' }] : [])], logisticsNote: i === 2 ? '原表未提供物流资料，不代表未发货。' : '物流字段来自导入总表，本样板未连接物流服务。', related: i === 1 ? 'SYS-DEMO-0001' : '', sourcePrice: i === 2 ? '0' : i % 2 ? '59.90' : '49.90', importedAt: '2026-10-16 18:20:00', sourceFile: '订单总表示例_20261016.xlsx', sourceNote: '独立合成记录，不来自真实客户订单。' };
  });
  const prices: QueryPrice[] = [
    { id: 'DJ-001', product: '折叠收纳箱', spec: '48 L / 单件', country: 'US', source: '国内货源', currency: 'USD', guidance: 49.9, updated: '2026-10-16 10:15:00', active: true },
    { id: 'DJ-002', product: '折叠收纳箱', spec: '48 L / 两件装', country: 'US', source: '国内货源', currency: 'USD', guidance: 89.9, updated: '2026-10-16 10:20:00', active: true },
    { id: 'DJ-003', product: '折叠收纳箱', spec: '60 L / 单件', country: 'US', source: '当地货源', currency: 'USD', guidance: 64, updated: '2026-10-15 11:10:00', active: true },
    { id: 'DJ-004', product: '折叠收纳箱', spec: '48 L / 单件', country: 'CA', source: '国内货源', currency: 'CAD', guidance: 68, updated: '2026-10-15 11:30:00', active: true },
    { id: 'DJ-005', product: '折叠收纳箱', spec: '60 L / 单件', country: 'CA', source: '当地货源', currency: 'CAD', guidance: null, updated: '2026-10-14 09:40:00', active: true },
    { id: 'DJ-006', product: '折叠收纳箱', spec: '旧版 / 单件', country: 'US', source: '国内货源', currency: 'USD', guidance: 40, updated: '2026-09-10 10:00:00', active: false },
    { id: 'DJ-007', product: '桌面理线盒', spec: '28 × 12 × 10 cm / 单件', country: 'US', source: '国内货源', currency: 'USD', guidance: 24, updated: '2026-10-12 14:10:00', active: true },
    { id: 'DJ-008', product: 'Storage Box', spec: '48 L / each', country: 'US', source: '国内货源', currency: 'USD', guidance: 49.9, updated: '2026-10-16 10:15:00', active: true },
  ];
  return { orders, prices, brands: ['DEMO NORTH', '示例品牌', 'DEMO & CO'] };
}

export function normalizeExact(value: string) { return value.trim().toLowerCase(); }
export function isExactOrderNumber(value: string) { return /^\d{3}-\d{7}-\d{7}$/.test(value.trim()); }
export function requireQuery(value: string) { if (!value.trim()) throw new Error('请先输入查询条件'); if (value.trim().length > 200) throw new Error('查询条件不能超过 200 个字符'); return value.trim(); }
export function searchOrders(rows: QueryOrder[], raw: string) {
  const query = requireQuery(raw), exact = isExactOrderNumber(query), words = query.toLowerCase().split(/\s+/);
  return rows.filter(row => exact ? row.platformOrder === query || row.systemOrder === query : words.every(word => `${row.platformOrder} ${row.systemOrder} ${row.product} ${row.store} ${row.originalStore}`.toLowerCase().includes(word)))
    .sort((a, b) => b.date.localeCompare(a.date) || b.systemOrder.localeCompare(a.systemOrder) || b.id.localeCompare(a.id));
}
export function searchPrices(rows: QueryPrice[], filters: QueryFilters) {
  const query = normalizeExact(requireQuery(filters.query));
  if (filters.country && !['US', 'CA'].includes(filters.country)) throw new Error('请选择有效国家');
  if (filters.source && !['国内货源', '当地货源'].includes(filters.source)) throw new Error('请选择有效货源类型');
  return rows.filter(row => row.active && normalizeExact(row.product) === query && (!filters.country || row.country === filters.country) && (!filters.source || row.source === filters.source));
}
export function searchBrand(brands: string[], raw: string): BrandResult {
  const query = requireQuery(raw), name = brands.find(brand => normalizeExact(brand) === normalizeExact(query));
  return { name: name || query, exists: name !== undefined };
}
export function trackingGroups(row: QueryOrder) {
  const groups = new Map<string, string[]>();
  for (const item of row.tracking) {
    const number = item.number.trim();
    if (!number) continue;
    const sources = groups.get(number) || [];
    if (item.source && !sources.includes(item.source)) sources.push(item.source);
    groups.set(number, sources);
  }
  return [...groups].map(([number, sources]) => ({ number, sources }));
}
export function trackingConflict(row: QueryOrder) { return trackingGroups(row).length > 1; }
export function priceText(row: QueryPrice) { return row.guidance === null || row.guidance <= 0 ? '暂无报价' : `${row.currency} ${row.guidance.toFixed(2)}`; }
