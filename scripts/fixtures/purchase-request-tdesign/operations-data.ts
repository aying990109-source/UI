import { products } from './data';
import { createEvent, type DetailEvent } from './history';

export const operationPages = { replenishment: '补货申请', listing: '上架申请', inventory: '库存明细' };
export type OperationPage = keyof typeof operationPages;
export const groups = ['运营一组', '运营二组'];
export const shops = ['North Home · US（示例）', 'Maple Living · CA（示例）'];
export type Supply = { id: string; product: string; sku: string; model: string; group: string; site: string; warehouse: string; carton: number; ordered: number; transported: number; shelved: number; consumed: number; returned: number; eligible: number; timeline: DetailEvent[] };
export type Replenishment = { id: string; sourceId: string; group: string; quantity: number; shop: string; asin: string; fnsku: string; msku: string; remark: string; date: string; status: '待货源确认' | '待申请审批' | '待发货' | '已驳回' | '已撤回'; timeline: DetailEvent[] };
export type Listing = { id: string; product: string; group: string; shop: string; price: number; title: string; bullets: string; image: string; remark: string; date: string; ean: string; asin: string; brand: string; status: '待审批' | '已完成' | '已驳回' | '已撤回'; timeline: DetailEvent[] };
export type OperationsState = { sources: Supply[]; replenishments: Replenishment[]; listings: Listing[]; eanSequence: number };
export type ListingDraft = Pick<Listing, 'product' | 'group' | 'shop' | 'price' | 'title' | 'bullets' | 'image' | 'remark'>;
export type ReplenishmentDraft = Pick<Replenishment, 'sourceId' | 'group' | 'quantity' | 'shop' | 'asin' | 'fnsku' | 'msku' | 'remark'>;
export const reserved = (state: OperationsState, id: string) => state.replenishments.filter(row => row.sourceId === id && ['待申请审批', '待发货'].includes(row.status)).reduce((sum, row) => sum + row.quantity, 0);
export function inventoryValues(state: OperationsState, source: Supply) {
  const occupied = reserved(state, source.id), inside = source.shelved - source.consumed + source.returned;
  const invalid = source.transported > source.ordered || source.shelved > source.transported || inside < 0 || occupied > source.transported - source.consumed + source.returned;
  if (invalid) return { pending: null, transit: null, available: null, total: null, occupied, issue: '来源数量待核对' };
  const pending = source.ordered - source.transported, available = Math.max(0, inside - occupied);
  const transit = source.transported - source.shelved - Math.max(0, occupied - inside);
  return { pending, transit, available, total: pending + transit + available, occupied, issue: '' };
}
export function allowance(state: OperationsState, source: Supply) {
  return inventoryValues(state, source).issue ? 0 : Math.max(0, source.eligible - source.consumed + source.returned - reserved(state, source.id));
}
export function inventoryProducts(state: OperationsState, query = '', group = '') {
  const rows = state.sources.filter(source => (!query.trim() || `${source.id} ${source.product} ${source.sku}`.toLowerCase().includes(query.trim().toLowerCase())) && (!group || source.group === group));
  return [...new Set(rows.map(source => source.product))].map(product => {
    const sources = rows.filter(source => source.product === product), values = sources.map(source => inventoryValues(state, source));
    const incomplete = values.some(value => value.issue);
    const sum = (key: 'pending' | 'transit' | 'available' | 'total') => incomplete ? null : values.reduce((sum, value) => sum + value[key]!, 0);
    return { id: product, sources, group: [...new Set(sources.map(source => source.group))].join('、'), incomplete, pending: sum('pending'), transit: sum('transit'), available: sum('available'), total: sum('total') };
  });
}
const today = () => createEvent('', '', '').time.slice(0, 10);
function fail(message: string): never { throw new Error(message); }
function sourceEvent(state: OperationsState, id: string, label: string, comment: string) {
  return state.sources.map(source => source.id === id ? { ...source, timeline: [...source.timeline, createEvent(label, '演示用户', comment)] } : source);
}
export function createReplenishment(state: OperationsState, draft: ReplenishmentDraft): OperationsState {
  const source = state.sources.find(row => row.id === draft.sourceId);
  if (!source) fail('请选择有效采购来源。');
  if (!groups.includes(draft.group)) fail('请选择申请小组。');
  if (!Number.isSafeInteger(draft.quantity) || draft.quantity <= 0 || draft.quantity % source.carton) fail(`申请数量须为 ${source.carton} 件的正整数倍。`);
  if (draft.quantity > allowance(state, source)) fail('申请数量超过来源可申请额度，请减少数量。');
  if (!shops.includes(draft.shop) || (source.site === 'CA') !== draft.shop.includes('CA')) fail('请选择与来源站点一致的店铺。');
  if (![draft.asin, draft.fnsku, draft.msku].every(value => value.trim())) fail('请补齐 ASIN、FNSKU 和 MSKU。');
  const id = `BH-DEMO-${String(state.replenishments.length + 1).padStart(4, '0')}`, cross = source.group !== draft.group;
  const row: Replenishment = { ...draft, id, date: today(), status: cross ? '待货源确认' : '待申请审批', timeline: [createEvent('提交补货申请', '演示用户', `${draft.quantity} 件；${cross ? '跨组申请，等待货源确认后预留。' : '同组申请，已预留来源数量。'}`)] };
  return { ...state, replenishments: [row, ...state.replenishments], sources: cross ? state.sources : sourceEvent(state, source.id, '补货预留', `${id} 预留 ${draft.quantity} 件。`) };
}
export function changeReplenishment(state: OperationsState, id: string, action: 'approve' | 'reject' | 'withdraw', reason = ''): OperationsState {
  const row = state.replenishments.find(item => item.id === id);
  if (!row || !['待货源确认', '待申请审批'].includes(row.status)) fail('当前状态不能执行此操作。');
  if (action === 'reject' && !reason.trim()) fail('请填写驳回原因。');
  const source = state.sources.find(item => item.id === row.sourceId)!;
  const acquire = action === 'approve' && row.status === '待货源确认', release = action !== 'approve' && row.status === '待申请审批';
  if (acquire && row.quantity > allowance(state, source)) fail('来源额度已变化，无法确认此申请。');
  const status = action === 'withdraw' ? '已撤回' : action === 'reject' ? '已驳回' : acquire ? '待申请审批' : '待发货';
  const label = action === 'approve' ? acquire ? '货源确认' : '申请审批通过' : action === 'reject' ? '审批驳回' : '撤回申请';
  return { ...state, sources: acquire || release ? sourceEvent(state, source.id, acquire ? '补货预留' : '释放补货预留', `${row.id}：${row.quantity} 件。`) : state.sources,
    replenishments: state.replenishments.map(item => item.id === id ? { ...item, status, timeline: [...item.timeline, { ...createEvent(label, action === 'withdraw' ? '演示用户' : '审批人（示例）', reason.trim() || (acquire ? '已预留数量，继续等待申请审批。' : action === 'approve' ? '等待补货处理发货，尚未发生出库。' : '已释放本申请预留。')), rejected: action === 'reject' }] } : item) };
}
export function saveListing(state: OperationsState, draft: ListingDraft, id?: string): OperationsState {
  if (![draft.product, draft.group, draft.shop, draft.title, draft.bullets, draft.image].every(value => value.trim())) fail('请补齐商品、归属、店铺、主图、标题和五点描述。');
  if (!groups.includes(draft.group) || !shops.includes(draft.shop)) fail('请选择有效小组和店铺。');
  if (!Number.isFinite(draft.price) || draft.price <= 0) fail('定价须大于 0。');
  const prior = id ? state.listings.find(row => row.id === id) : undefined;
  if (id && (!prior || prior.status === '已完成')) fail('当前申请不能修改重提。');
  if (prior && prior.group !== draft.group) fail('修改时不能变更原申请归属。');
  const row: Listing = { ...draft, id: prior?.id || `SJ-DEMO-${String(state.listings.length + 1).padStart(4, '0')}`, date: prior?.date || today(), status: '待审批', ean: '', asin: '', brand: '', timeline: [...(prior?.timeline || []), createEvent(prior ? '修改并提交' : '提交上架申请', '演示用户', prior ? '保留原申请与历史，重新等待审批。' : '商品刊登申请，等待审批后分配示例 EAN。')] };
  return { ...state, listings: prior ? state.listings.map(item => item.id === id ? row : item) : [row, ...state.listings] };
}
export function changeListing(state: OperationsState, id: string, action: 'approve' | 'reject' | 'withdraw' | 'identity', values = { reason: '', asin: '', brand: '' }): OperationsState {
  const row = state.listings.find(item => item.id === id);
  if (!row || (action === 'identity' ? row.status !== '已完成' : row.status !== '待审批')) fail('当前状态不能执行此操作。');
  if (action === 'reject' && !values.reason.trim()) fail('请填写驳回原因。');
  if (action === 'identity' && !values.asin.trim() && !values.brand.trim()) fail('请至少填写 ASIN 或品牌。');
  if (action === 'identity' && row.asin === values.asin.trim() && row.brand === values.brand.trim()) return state;
  const label = { approve: '审批通过并分配示例 EAN', reject: '审批驳回', withdraw: '撤回申请', identity: '补充刊登资料' }[action];
  const ean = action === 'approve' ? `DEMO-EAN-${String(state.eanSequence + 1).padStart(6, '0')}` : row.ean;
  const next: Listing = { ...row, ean, status: action === 'identity' ? row.status : action === 'approve' ? '已完成' : action === 'reject' ? '已驳回' : '已撤回', ...(action === 'identity' ? { asin: values.asin.trim(), brand: values.brand.trim() } : {}), timeline: [...row.timeline, { ...createEvent(label, '演示用户', action === 'approve' ? `${ean}；仅为样板标识，不是正式条码。` : action === 'identity' ? `ASIN：${values.asin.trim() || '—'}；品牌：${values.brand.trim() || '—'}` : values.reason.trim() || '保留申请与历史。'), rejected: action === 'reject' }] };
  return { ...state, eanSequence: state.eanSequence + Number(action === 'approve'), listings: state.listings.map(item => item.id === id ? next : item) };
}

export function initialOperationsState(): OperationsState {
  const sources: Supply[] = Array.from({ length: 10 }, (_, i) => {
    const product = products[i % products.length], carton = product.carton || 20;
    const ordered = carton * 60, transported = carton * (i === 9 ? 65 : 40), shelved = carton * 25, consumed = carton * 5;
    return { id: `CG-KC-202610${String(i + 1).padStart(3, '0')}`, product: product.name, sku: product.code, model: product.color, group: groups[i % 2], site: i % 3 === 2 ? 'CA' : 'US', warehouse: i % 3 === 2 ? '多伦多仓' : '洛杉矶一仓', carton, ordered, transported, shelved, consumed, returned: 0, eligible: carton * 30, timeline: [
      createEvent('采购下单', '采购员（示例）', `${ordered} 件。`, '2026-10-01 10:00:00'), createEvent('登记运输事实', '物流专员（示例）', `${transported} 件进入运输。`, '2026-10-04 12:00:00'), createEvent('实物上架确认', '仓库核对员（示例）', `${shelved} 件；实物日期 2026-10-10。`, '2026-10-11 09:00:00'), createEvent('补货发货', '采购员（示例）', `累计已消耗 ${consumed} 件。`, '2026-10-13 14:00:00'),
    ] };
  });
  const replenishments: Replenishment[] = sources.slice(0, 6).map((source, i) => {
    const status: Replenishment['status'] = (['待申请审批', '待货源确认', '待发货', '已驳回', '已撤回', '待申请审批'] as const)[i];
    const timeline = [createEvent('提交补货申请', '演示用户', `${source.carton * 5} 件；${status === '待货源确认' ? '跨组等待货源确认，尚未预留。' : '同组申请，提交时预留。'}`, '2026-10-15 10:00:00')];
    if (['待发货', '已驳回', '已撤回'].includes(status)) timeline.push({ ...createEvent(status === '待发货' ? '申请审批通过' : status === '已驳回' ? '审批驳回' : '撤回申请', '审批人（示例）', status === '待发货' ? '待补货发货。' : '已释放预留。', '2026-10-16 11:00:00'), rejected: status === '已驳回' });
    return { id: `BH2026101500${i + 1}`, sourceId: source.id, group: status === '待货源确认' ? groups[1 - i % 2] : source.group, quantity: source.carton * 5, shop: shops[source.site === 'CA' ? 1 : 0], asin: `DEMO-ASIN-${i + 1}`, fnsku: `DEMO-FNSKU-${i + 1}`, msku: `DEMO-MSKU-${i + 1}`, remark: '常规补货（示例）', date: '2026-10-15', status, timeline };
  });
  for (const row of replenishments) {
    if (row.status === '待货源确认') continue;
    const source = sources.find(source => source.id === row.sourceId)!;
    source.timeline.push(createEvent('补货预留', '演示用户', `${row.id}：${row.quantity} 件。`, '2026-10-15 10:00:00'));
    if (['已驳回', '已撤回'].includes(row.status)) source.timeline.push(createEvent('释放补货预留', '演示用户', `${row.id}：${row.quantity} 件。`, '2026-10-16 11:00:00'));
  }
  const listings: Listing[] = products.slice(0, 6).map((product, i) => {
    const status = (['待审批', '已完成', '已驳回', '已撤回', '待审批', '已完成'] as const)[i], ean = status === '已完成' ? `DEMO-EAN-${String(i + 1).padStart(6, '0')}` : '';
    const timeline = [createEvent('提交上架申请', '演示用户', '提交商品刊登资料。', '2026-10-15 09:00:00')];
    if (status !== '待审批') timeline.push({ ...createEvent(status === '已完成' ? '审批通过并分配示例 EAN' : status === '已驳回' ? '审批驳回' : '撤回申请', '审批人（示例）', ean || (status === '已驳回' ? '请补充商品尺寸和使用场景。' : '补充资料后重新提交。'), '2026-10-16 10:00:00'), rejected: status === '已驳回' });
    return { id: `SJ2026101500${i + 1}`, product: product.name, group: groups[i % 2], shop: shops[i % 2], price: 19.99 + i * 3, title: `${product.name} · ${product.color} · 日常家居系列（示例）`, bullets: '适合日常家居使用\n尺寸信息见产品资料\n便于整理与收纳\n多场景搭配\n包装内容见商品说明', image: '', remark: '合成商品资料；主图待本地补充', date: '2026-10-15', ean, asin: status === '已完成' ? `DEMO-ASIN-L${i}` : '', brand: status === '已完成' ? '示例品牌' : '', status, timeline };
  });
  return { sources, replenishments, listings, eanSequence: 6 };
}
