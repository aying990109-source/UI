import { createEvent, type DetailEvent } from './history';

export const brandPricingPages = { brandArchive: '品牌档案', productPricing: '产品定价' };
export type Profile = Record<string, string>;
export const brandFields = [
  ['ziniaoStatus', '紫鸟主体', '基本资料', 'text'], ['category', '品牌类别', '基本资料', 'text'], ['brandType', '品牌类型', '基本资料', 'text'], ['usageStatus', '使用状态', '基本资料', 'text'], ['amazonAbuse', 'Amazon 滥用标记', '基本资料', 'text'],
  ['applicationNumber', 'TM 标', '商标与宣誓', 'text'], ['registrationNumber', 'R 标', '商标与宣誓', 'text'], ['registryStatus', 'USPTO 状态', '商标与宣誓', 'text'], ['applicationDate', 'TM 注册日期', '商标与宣誓', 'date'], ['registrationDate', 'R 注册日期', '商标与宣誓', 'date'], ['declarationStatus', '宣誓状态', '商标与宣誓', 'text'], ['firstWindow', '5–6 年宣誓', '商标与宣誓', 'window'], ['secondWindow', '9–10 年宣誓', '商标与宣誓', 'window'],
  ['holderZh', '持有者（中）', '权属资料', 'text'], ['holderEn', '持有者（英）', '权属资料', 'text'], ['attorney', '品牌律师', '权属资料', 'textarea'], ['statusRemark', '状态备注', '权属资料', 'textarea'],
  ['snapshotTotal', '累计授权店铺', '来源数量快照', 'number'], ['snapshotActive', '授权中', '来源数量快照', 'number'], ['snapshotCancelled', '已取消', '来源数量快照', 'number'], ['snapshotStopped', '停用', '来源数量快照', 'number'], ['snapshotDate', '资料截至日期', '来源数量快照', 'date'],
] as const;
export const brandSections = ['基本资料', '商标与宣誓', '权属资料', '来源数量快照'] as const;
export type DemoAuthorization = { id: string; scope: string; sid: string; store: string; country: string; status: '有效' | '已取消' | '停用'; date: string; version?: number };
export type DemoBrand = { id: string; name: string; profile: Profile; reviewNote: string; reconciled: boolean; version: number; updated: string; authorizations: DemoAuthorization[]; timeline: DetailEvent[] };
export type BrandDraft = { name: string; profile: Profile; reviewNote: string; reconciled: boolean; version: number };
export type PricingProduct = { id: string; name: string; spec: string; supplier: string; country: string; reference: string; active: boolean };
export type PriceDraft = { productId: string; spec: string; country: string; source: string; cost: string; multiplier: string; status: string; reason: string; version: number };
export type DemoPrice = PriceDraft & { id: string; reference: string; guidance: string | null; updated: string; timeline: DetailEvent[] };
export type BrandPricingState = { brands: DemoBrand[]; prices: DemoPrice[]; relations: Record<string, DemoAuthorization[]> };
export const priceSources = { domestic: '国内货源', local: '当地货源' };
export const costLabels = { domestic: '入仓总成本', local: '一件代发总报价' };
export const pricingProducts: PricingProduct[] = [
  { id: 'BP-001', name: '折叠收纳箱', spec: '48 L / 单件', supplier: '青禾家居（示例）', country: 'CN', reference: '28.50', active: true },
  { id: 'BP-002', name: '折叠收纳箱', spec: '48 L / 单件', supplier: '远山日用（示例）', country: 'CN', reference: '30.00', active: true },
  { id: 'BP-003', name: '折叠收纳箱', spec: '60 L / 单件', supplier: '北美仓配（示例）', country: 'US', reference: '15.00', active: true },
  { id: 'BP-004', name: '桌面理线盒', spec: '28 × 12 × 10 cm / 单件', supplier: '枫叶供货（示例）', country: 'CA', reference: '8.20', active: true },
  { id: 'BP-005', name: '旅行收纳袋', spec: '4 件套', supplier: '青禾家居（示例）', country: 'CN', reference: '', active: true },
  { id: 'BP-006', name: '旧款理线盒', spec: '旧款', supplier: '历史供货（示例）', country: 'CN', reference: '10.00', active: false },
];
export class MaintenanceError extends Error { constructor(message: string, public field: string) { super(message); } }
const fail = (message: string, field: string): never => { throw new MaintenanceError(message, field); };
const event = (label: string, comment: string) => createEvent(label, '演示维护员', comment);
const text = (value: string, field: string, label: string, max: number, required = false) => { const result = value.trim(); if (required && !result) fail(`请填写${label}。`, field); if (result.length > max) fail(`${label}不能超过 ${max} 个字符。`, field); return result; };
export const currency = (country: string) => country === 'US' ? 'USD' : 'CAD';
export const productFor = (id: string) => pricingProducts.find(row => row.id === id)!;
export const brandDraft = (row?: DemoBrand): BrandDraft => ({ name: row?.name || '', profile: { ...row?.profile }, reviewNote: row?.reviewNote || '', reconciled: row?.reconciled || false, version: row?.version || 0 });
export const priceDraft = (row?: DemoPrice): PriceDraft => row ? { productId: row.productId, spec: row.spec, country: row.country, source: row.source, cost: row.cost, multiplier: row.multiplier, status: row.status, reason: '', version: row.version } : { productId: '', spec: '', country: 'US', source: 'domestic', cost: '', multiplier: '4', status: 'active', reason: '', version: 0 };

export function validDate(raw: string, field: string) {
  if (!raw) return '';
  const date = new Date(`${raw}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number(raw.slice(0, 4)) < 1 || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== raw) fail('请输入 YYYY-MM-DD 格式的有效日期。', field);
  return raw;
}
export function validateProfile(raw: Profile): Profile {
  const result: Profile = {};
  for (const [key, label, , kind] of brandFields) {
    let value = text(raw[key] || '', key, label, kind === 'textarea' ? 4000 : 500);
    if (kind === 'date') value = validDate(value, key);
    if (kind === 'number' && value && (!/^\d+$/.test(value) || Number(value) > 1000000)) fail(`${label}须为 0 至 1000000 的整数。`, key);
    if (kind === 'window' && value && !['—', '-', '无'].includes(value)) { const parts = value.split('~').map(part => part.trim()); if (parts.length !== 2 || !parts[0] || !parts[1] || validDate(parts[0], key) > validDate(parts[1], key)) fail(`${label}须为有效的起止日期，开始不晚于结束。`, key); value = parts.join(' ~ '); }
    result[key] = kind === 'number' && value ? String(Number(value)) : value;
  }
  const counts = ['snapshotTotal', 'snapshotActive', 'snapshotCancelled', 'snapshotStopped'].map(key => result[key]);
  if (counts.some(Boolean) && (counts.some(value => value === '') || Number(counts[0]) !== counts.slice(1).reduce((sum, value) => sum + Number(value), 0))) fail('来源数量快照须四项完整，且累计等于授权中、已取消和停用之和。', 'snapshotTotal');
  return result;
}
export function brandIssues(row: DemoBrand, brands: DemoBrand[]) {
  const p = row.profile, issues: string[] = [];
  for (const [key, label] of [['applicationNumber', 'TM 标'], ['registrationNumber', 'R 标']]) if (p[key] && !['无', '-', '—'].includes(p[key]) && brands.some(other => other.id !== row.id && other.profile[key] === p[key])) issues.push(`${label}与其他品牌重复，请核查。`);
  if (p.brandType?.includes('欧标')) issues.push('“欧标”与登记地区的关系待核实。');
  if (p.registryStatus === 'Active' && /失效|拒绝/.test(p.usageStatus || '')) issues.push('登记状态与使用状态不同，请核查资料时间和含义。');
  for (const [key, years] of [['firstWindow', 5], ['secondWindow', 9]] as const) if (p.registrationDate && p[key]?.includes(' ~ ')) { const year = Number(p.registrationDate.slice(0, 4)), tail = p.registrationDate.slice(4), expected = `${year + years}${tail} ~ ${year + years + 1}${tail}`; try { validDate(`${year + years}${tail}`, key); validDate(`${year + years + 1}${tail}`, key); if (p[key] !== expected) issues.push(`${years}–${years + 1} 年宣誓与注册周年模式不同，请核查原文。`); } catch { /* Leap-day anniversaries are not inferred. */ } }
  return issues;
}
export const activeAuthorizations = (row: DemoBrand) => row.authorizations.filter(item => item.status === '有效').length;
const matches = (haystack: string, query: string) => query.toLowerCase().trim().split(/\s+/).every(word => haystack.toLowerCase().includes(word));
export function filterBrands(rows: DemoBrand[], filters: { search: string; category: string; registry: string; review: string }) {
  return rows.filter(row => matches([row.name, row.profile.applicationNumber, row.profile.registrationNumber, row.profile.holderZh, row.profile.holderEn].join(' '), filters.search) && (!filters.category || row.profile.category === filters.category) && (!filters.registry || row.profile.registryStatus === filters.registry) && (!filters.review || (filters.review === 'issues' ? brandIssues(row, rows).length > 0 : row.reconciled === (filters.review === 'reviewed'))));
}
export function filterPrices(rows: DemoPrice[], filters: { search: string; country: string; source: string; status: string }) {
  return rows.filter(row => { const product = productFor(row.productId); return matches([row.id, row.productId, product.name, product.supplier, row.spec].join(' '), filters.search) && (!filters.country || row.country === filters.country) && (!filters.source || row.source === filters.source) && (!filters.status || row.status === filters.status); });
}
export function saveBrand(state: BrandPricingState, draft: BrandDraft, id?: string): BrandPricingState {
  const old = id ? state.brands.find(row => row.id === id) : undefined;
  if (id && !old) fail('品牌档案不存在。', 'name');
  if (old && old.version !== draft.version) fail('档案已被修改，请重新打开表单。', 'name');
  const name = text(draft.name, 'name', '品牌名称', 200, true), profile = validateProfile(draft.profile), reviewNote = text(draft.reviewNote, 'reviewNote', '核查说明', 2000);
  if (state.brands.some(row => row.id !== id && row.name.toLowerCase() === name.toLowerCase())) fail('该品牌名称已收录，请编辑已有档案。', 'name');
  const changes = [['name', '品牌名称', old?.name, name], ...brandFields.map(([key, label]) => [key, label, old?.profile[key], profile[key]]), ['reviewNote', '核查说明', old?.reviewNote, reviewNote], ['reconciled', '授权明细核对', old?.reconciled ? '已核对' : '待核对', draft.reconciled ? '已核对' : '待核对']].filter(([, , before, after]) => (before || '') !== (after || '')).map(([, label, before, after]) => `${label}：${before || '未记录'} → ${after || '未记录'}`);
  if (old && !changes.length) return state;
  const audit = event(old ? '更新品牌档案' : '建立品牌档案', changes.join('；'));
  const row: DemoBrand = { id: id || `BR-${String(state.brands.length + 1).padStart(3, '0')}`, name, profile, reviewNote, reconciled: draft.reconciled, version: (old?.version || 0) + 1, updated: audit.time, authorizations: old?.authorizations || [], timeline: [...(old?.timeline || []), audit] };
  return { ...state, brands: old ? state.brands.map(item => item.id === id ? row : item) : [row, ...state.brands] };
}

function decimalUnits(raw: string, places: number, max: bigint, field: string) {
  const value = raw.trim();
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${places}})?$`).test(value) || value.length > 40) fail(field === 'cost' ? '成本须为非负数，最多两位小数。' : '倍率须大于 0，最多四位小数。', field);
  const [whole, fraction = ''] = value.split('.'), units = BigInt(whole) * 10n ** BigInt(places) + BigInt(fraction.padEnd(places, '0'));
  if (units > max || (field === 'multiplier' && units === 0n)) fail(field === 'cost' ? '成本不能超过 10 亿。' : '倍率须大于 0 且不超过 1000。', field);
  return units;
}
const formatCents = (units: bigint) => `${units / 100n}.${String(units % 100n).padStart(2, '0')}`;
export function calculatePrice(cost: string, multiplier: string) {
  const factor = decimalUnits(multiplier, 4, 10000000n, 'multiplier'), cents = cost.trim() ? decimalUnits(cost, 2, 100000000000n, 'cost') : 0n;
  return { cost: cents ? formatCents(cents) : '', multiplier: `${factor / 10000n}.${String(factor % 10000n).padStart(4, '0')}`, guidance: cents ? formatCents((cents * factor + 5000n) / 10000n) : null };
}
export function savePrice(state: BrandPricingState, draft: PriceDraft, id?: string): BrandPricingState {
  const old = id ? state.prices.find(row => row.id === id) : undefined;
  if (id && !old) fail('定价不存在。', 'spec');
  if (old && old.version !== draft.version) fail('定价已被修改，请重新打开表单。', 'spec');
  if (old && draft.productId !== old.productId) fail('已有定价不能更换供货记录，请新建定价。', 'productId');
  const product = productFor(draft.productId);
  if (!product || (!old && !product.active)) fail('请选择有效的产品供应商记录。', 'productId');
  if (!['US', 'CA'].includes(draft.country) || !['domestic', 'local'].includes(draft.source) || !['active', 'disabled'].includes(draft.status)) fail('国家、货源或状态不正确。', 'country');
  if ((!old || old.country !== draft.country || old.source !== draft.source) && product.country !== (draft.source === 'domestic' ? 'CN' : draft.country)) fail('供货记录国家与货源不匹配，请选择对应的供货记录；已有定价更换档案需另建。', 'source');
  const spec = text(draft.spec, 'spec', '销售规格', 300, true), reason = text(draft.reason, 'reason', '定价说明或修改原因', 500, true), values = calculatePrice(draft.cost, draft.multiplier);
  if (state.prices.some(row => row.id !== id && row.productId === product.id && row.spec === spec && row.country === draft.country && row.source === draft.source)) fail('该供货记录、销售规格、国家和货源已存在定价，请编辑已有记录。', 'spec');
  const after = { ...draft, spec, reason, ...values, reference: product.reference };
  const changes = old ? [['销售规格', old.spec, after.spec], ['国家', old.country, after.country], ['货源', priceSources[old.source as keyof typeof priceSources], priceSources[after.source as keyof typeof priceSources]], ['成本或报价', old.cost || '暂无报价', after.cost || '暂无报价'], ['倍率', old.multiplier, after.multiplier], ['指导价', old.guidance || '暂无报价', after.guidance || '暂无报价'], ['状态', old.status === 'active' ? '启用' : '停用', after.status === 'active' ? '启用' : '停用']].filter(([, before, next]) => before !== next).map(([label, before, next]) => `${label}：${before} → ${next}`).join('；') : `${product.name} / ${spec}；${draft.country} ${priceSources[draft.source as keyof typeof priceSources]}；成本 ${values.cost || '暂无报价'} × ${values.multiplier}，指导价 ${values.guidance || '暂无报价'} ${currency(draft.country)}`;
  const audit = event(old ? '更新定价并生效' : '建立定价并生效', `${changes || '核对并保留现有定价'}。原因：${reason}`), row: DemoPrice = { ...after, id: id || `PR-${String(state.prices.length + 1).padStart(3, '0')}`, version: (old?.version || 0) + 1, updated: audit.time, timeline: [...(old?.timeline || []), audit] };
  return { ...state, prices: old ? state.prices.map(item => item.id === id ? row : item) : [row, ...state.prices] };
}

// shortcut: isolated synthetic maintenance state; connect authorized API projections when implementing production pages.
export function initialBrandPricingState(): BrandPricingState {
  const names = ['DEMO NORTH', 'DEMO & CO', '青禾示例', '远山示例', 'DEMO FIELD', 'DEMO LOFT', 'DEMO TRAIL', 'DEMO HOME', 'DEMO DAILY', 'DEMO COVE', 'DEMO GROVE', 'DEMO STUDIO'];
  const brands = names.map((name, i): DemoBrand => ({ id: `BR-${String(i + 1).padStart(3, '0')}`, name, version: 1, updated: '2026-10-16 14:30:00', profile: { category: i % 2 ? '21' : '20', brandType: i === 2 ? '欧标（原文）' : '文字商标（示例）', usageStatus: i === 1 ? '已失效（原文）' : '使用中', registryStatus: i === 3 ? 'Under Examination' : 'Active', declarationStatus: i ? '未记录' : '资料待核对', applicationNumber: i < 2 ? 'TM-DEMO-SHARED' : `TM-DEMO-${i + 1}`, registrationNumber: `R-DEMO-${i + 1}`, registrationDate: '2020-06-15', firstWindow: i ? '' : '2025-06-15 ~ 2026-06-15', holderZh: '示例品牌持有机构', ziniaoStatus: '示例运营主体', ...(i === 0 ? { snapshotTotal: '7', snapshotActive: '5', snapshotCancelled: '1', snapshotStopped: '1', snapshotDate: '2026-09-30' } : {}) }, reviewNote: i ? '' : '原表数量与现有明细不同，待核对资料截至时间。', reconciled: i > 3, authorizations: i ? [] : [ { id: 'AUTH-DEMO-1', scope: 'americas:示例北区', sid: 'BR-SID-US', store: '示例北区-US', country: 'US', status: '有效', date: '2026-09-20' }, { id: 'AUTH-DEMO-1', scope: 'americas:示例北区', sid: 'BR-SID-CA', store: '示例北区-CA', country: 'CA', status: '有效', date: '2026-09-20' }, { id: 'AUTH-DEMO-2', scope: 'site:BR-SID-DE', sid: 'BR-SID-DE', store: '示例欧洲-DE', country: 'DE', status: '已取消', date: '2026-09-22' } ], timeline: [createEvent('建立品牌档案', '中台维护员（示例）', '资料与授权均为合成示例，不代表注册有效性或使用权。', '2026-10-16 14:30:00')] }));
  const relations = Object.fromEntries(brands.map(brand => [brand.id, [...new Map(brand.authorizations.map(link => [link.id, link])).values()]]));
  let state: BrandPricingState = { brands, prices: [], relations };
  for (let i = 0; i < 12; i++) { const product = pricingProducts[i % 5]; state = savePrice(state, { productId: product.id, spec: i < 5 ? product.spec : `${product.spec} · 组合 ${Math.floor(i / 5) + 1}`, country: product.country === 'CA' ? 'CA' : 'US', source: product.country === 'CN' ? 'domestic' : 'local', cost: i === 3 ? '' : String(10 + i), multiplier: '4', status: i === 11 ? 'disabled' : 'active', reason: '合成定价示例', version: 0 }); }
  return { ...state, prices: state.prices.reverse().map(row => ({ ...row, updated: '2026-10-16 16:00:00', timeline: row.timeline.map(item => ({ ...item, time: '2026-10-16 16:00:00' })) })) };
}
