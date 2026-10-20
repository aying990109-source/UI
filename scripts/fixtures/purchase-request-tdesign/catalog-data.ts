import { createEvent, type DetailEvent } from './history';

export const catalogPages = { products: '产品主档', suppliers: '供应商', companies: '采购方' };
export type CatalogPage = keyof typeof catalogPages;
export type Status = '启用' | '停用';
type RecordBase = { id: string; timeline: DetailEvent[] };
export type Master = RecordBase & { name: string; model: string; spec: string; color: string; alias: string; status: Status; remark: string; declaration: string; declarationEn: string; hs: string; material: string; usage: string; brand: string };
export type Profile = { id: string; kind: '国内采购' | '海外当地采购'; sites: string[]; status: Status; contact: string; phone: string; address: string; settlement: string };
export type Supplier = RecordBase & { name: string; shortName: string; profiles: Profile[] };
export type Company = RecordBase & { name: string; shortName: string; contact: string; phone: string; address: string; receiving: string; isDefault: boolean; status: Status; remark: string };
export type Supply = RecordBase & { masterId: string; profileId: string; country: string; carton: number; unit: string; price: number; currency: string; basis: string; status: Status; remark: string; lastOrdered: string };
export type CatalogState = { products: Master[]; suppliers: Supplier[]; companies: Company[]; supplies: Supply[] };
export type Draft<T> = Omit<T, 'id' | 'timeline'>;
const seed = (comment: string, date = '2026-10-09') => [createEvent('建立档案', '档案维护员（示例）', comment, `${date} 09:30:00`)];
const event = (label: string, comment: string) => createEvent(label, '演示用户', comment);
const nextId = (prefix: string, records: RecordBase[]) => `${prefix}-${String(Math.max(0, ...records.map(row => Number(row.id.split('-').at(-1)) || 0)) + 1).padStart(3, '0')}`;
const requireText = (value: string, label: string) => { if (!value.trim()) throw new Error(`请填写${label}`); return value.trim(); };
const describe = (value: unknown): string => value === '' ? '未填写' : typeof value === 'boolean' ? value ? '是' : '否' : Array.isArray(value) ? value.join('、') || '未选择' : String(value);
function changes<T extends object>(before: T, after: T, labels: Partial<Record<keyof T, string>>) {
  return (Object.keys(labels) as (keyof T)[]).filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(key => `${labels[key]}：${describe(before[key])} → ${describe(after[key])}`).join('；');
}
function exists<T extends RecordBase>(rows: T[], id?: string) { const row = rows.find(row => row.id === id); if (id && !row) throw new Error('档案不存在，请重新选择'); return row; }

export function initialCatalogState(): CatalogState {
  const products: Master[] = [
    ['折叠收纳箱', 'ST-48', '48 L / 三面开门', '奶油白'], ['折叠收纳箱', 'ST-60', '60 L / 双开门', '浅灰'], ['桌面理线盒', 'CB-02', '28 × 12 × 10 cm', '白色'], ['可调节电脑支架', 'LS-06', '六档高度', '银色'], ['旅行分装瓶', 'TB-04', '四件套 / 100 ml', '雾蓝'], ['厨房置物架', 'KR-03', '三层 / 伸缩款', '黑色'],
  ].map(([name, model, spec, color], i) => ({ id: `CP-00${i + 1}`, name, model, spec, color, alias: '', status: i === 5 ? '停用' : '启用', remark: i === 5 ? '旧款保留查阅，后续使用升级型号。' : '', declaration: name, declarationEn: ['Storage box', 'Storage box', 'Cable organizer', 'Laptop stand', 'Travel bottle', 'Kitchen rack'][i], hs: '', material: i === 3 || i === 5 ? '金属' : '塑料', usage: ['家居收纳', '家居收纳', '线材整理', '电脑支撑', '旅行收纳', '厨房收纳'][i], brand: '无品牌', timeline: seed(`${name} · ${model}，建立公共资料。`) }));
  const profile = (id: string, kind: Profile['kind'], contact: string, sites = ['US', 'CA']): Profile => ({ id, kind, sites, status: '启用', contact, phone: '000-0000-0000', address: kind === '国内采购' ? '示例园区 A 栋（合成地址）' : 'Example Park, Unit 8（合成地址）', settlement: kind === '国内采购' ? '月结 30 天' : '付款后发货' });
  const suppliers: Supplier[] = [
    { id: 'GYS-001', name: '示例华辰家居用品有限公司', shortName: '华辰家居', profiles: [profile('GYS-001-D', '国内采购', '陈女士（示例）'), profile('GYS-001-O', '海外当地采购', 'Alex（示例）', ['US'])], timeline: seed('建立主体及国内、海外采购资料。') },
    { id: 'GYS-002', name: '示例远洋生活科技有限公司', shortName: '远洋生活', profiles: [profile('GYS-002-D', '国内采购', '林先生（示例）')], timeline: seed('建立主体及国内采购资料。', '2026-10-10') },
    { id: 'GYS-003', name: 'Example North Supply Ltd.（示例）', shortName: 'North Supply', profiles: [profile('GYS-003-O', '海外当地采购', 'Sam（示例）', ['CA'])], timeline: seed('建立加拿大当地采购资料。', '2026-10-11') },
    { id: 'GYS-004', name: '示例恒安五金制品有限公司', shortName: '恒安五金', profiles: [{ ...profile('GYS-004-D', '国内采购', '周女士（示例）'), status: '停用' }], timeline: [...seed('建立国内采购资料。'), createEvent('停用采购资料', '档案维护员（示例）', '旧供应渠道保留，停止新采购。', '2026-10-15 14:20:00')] },
  ];
  const supplies: Supply[] = [
    ['CP-001', 'GYS-001-D', 'CN', 12, 28.5, 'CNY'], ['CP-001', 'GYS-002-D', 'CN', 12, 29.8, 'CNY'], ['CP-001', 'GYS-001-O', 'US', 6, 8.2, 'USD'], ['CP-002', 'GYS-001-D', 'CN', 8, 36, 'CNY'], ['CP-003', 'GYS-002-D', 'CN', 24, 12.5, 'CNY'], ['CP-004', 'GYS-003-O', 'CA', 10, 18, 'CAD'], ['CP-006', 'GYS-004-D', 'CN', 6, 52, 'CNY'],
  ].map(([masterId, profileId, country, carton, price, currency], i) => ({ id: `GH-00${i + 1}`, masterId: String(masterId), profileId: String(profileId), country: String(country), carton: Number(carton), price: Number(price), currency: String(currency), unit: '件', basis: '含税，不含运费', status: i === 6 ? '停用' : '启用', remark: '', lastOrdered: i < 2 ? `2026-10-${15 - i}` : '', timeline: seed(`建立供货，参考价 ${currency} ${price}/件。`) }));
  const companies: Company[] = [
    ['示例云桥供应链有限公司', '云桥供应链', '苏女士（示例）', '送货上门'], ['示例星禾贸易有限公司', '星禾贸易', '张先生（示例）', '预约自提'], ['示例东岸采购有限公司', '东岸采购', '刘女士（示例）', '送货上门'],
  ].map(([name, shortName, contact, receiving], i) => ({ id: `CGF-00${i + 1}`, name, shortName, contact, receiving, phone: '000-0000-0000', address: `示例商务园 ${i + 1} 栋（合成地址）`, isDefault: i === 0, status: i === 2 ? '停用' : '启用', remark: '', timeline: seed(`${name}${i === 0 ? '，设为默认采购方' : ''}。`) }));
  return { products, suppliers, companies, supplies };
}

export function supplierFor(state: CatalogState, profileId: string) { const supplier = state.suppliers.find(row => row.profiles.some(profile => profile.id === profileId)); return { supplier, profile: supplier?.profiles.find(profile => profile.id === profileId) }; }
export function productTimeline(state: CatalogState, master: Master) { return [...master.timeline, ...state.supplies.filter(row => row.masterId === master.id).flatMap(row => row.timeline.map(item => ({ ...item, label: `${item.label} · ${row.id}` })))].sort((a, b) => a.time.localeCompare(b.time)); }
export function saveMaster(state: CatalogState, draft: Draft<Master>, id?: string): CatalogState {
  const old = exists(state.products, id), value = { ...draft, name: requireText(draft.name, '品名') };
  if (value.hs && !/^\d+$/.test(value.hs)) throw new Error('海关编码只能包含数字');
  const comment = old ? changes(old, value, { name: '品名', model: '型号', spec: '规格', color: '颜色', alias: '兼容写法', status: '状态', remark: '备注', declaration: '申报中文名', declarationEn: '申报英文名', hs: '海关编码', material: '材质', usage: '用途', brand: '申报品牌' }) : `${value.name} · ${value.model || '型号未填写'}，建立公共资料。`;
  if (old && !comment) return state;
  const row: Master = { ...value, id: id || nextId('CP', state.products), timeline: [...old?.timeline || [], event(old ? '修改公共资料' : '建立产品主档', comment)] };
  return { ...state, products: old ? state.products.map(item => item.id === id ? row : item) : [row, ...state.products] };
}
export function saveSupplier(state: CatalogState, draft: Draft<Supplier>, id?: string): CatalogState {
  const old = exists(state.suppliers, id), name = requireText(draft.name, '供应商名称');
  if (state.suppliers.some(row => row.id !== id && row.name === name)) throw new Error('已存在相同完整名称的供应商');
  if (!draft.profiles.length || new Set(draft.profiles.map(row => row.kind)).size !== draft.profiles.length) throw new Error('请至少保留一种采购方式，每种方式只能有一份资料');
  if (old?.profiles.some(row => !draft.profiles.some(next => next.id === row.id && next.kind === row.kind))) throw new Error('已有采购资料须保留；停止使用请设为停用');
  const recordId = id || nextId('GYS', state.suppliers), profiles = draft.profiles.map(profile => ({ ...profile, id: profile.id || `${recordId}-${profile.kind === '国内采购' ? 'D' : 'O'}`, sites: [...new Set(profile.sites)] }));
  if (profiles.some(row => row.sites.some(site => !['US', 'CA'].includes(site)))) throw new Error('支持站点仅限 US 和 CA');
  const descriptions = [old ? changes<Draft<Supplier>>(old, { ...draft, name }, { name: '完整名称', shortName: '简称' }) : `建立主体 ${name}`];
  for (const profile of profiles) { const previous = old?.profiles.find(row => row.id === profile.id); const diff = previous ? changes(previous, profile, { status: '状态', sites: '支持站点', contact: '联系人', phone: '电话', address: '地址', settlement: '结算方式' }) : '新增采购资料'; if (diff) descriptions.push(`${profile.kind}：${diff}`); }
  const comment = descriptions.filter(Boolean).join('；'); if (old && !comment) return state;
  const row: Supplier = { ...draft, name, profiles, id: recordId, timeline: [...old?.timeline || [], event(old ? '更新供应商资料' : '建立供应商', comment)] };
  return { ...state, suppliers: old ? state.suppliers.map(item => item.id === id ? row : item) : [row, ...state.suppliers] };
}
export function saveCompany(state: CatalogState, draft: Draft<Company>, id?: string): CatalogState {
  const old = exists(state.companies, id), value = { ...draft, name: requireText(draft.name, '采购方名称') };
  if (state.companies.some(row => row.id !== id && row.name === value.name)) throw new Error('已存在相同完整名称的采购方');
  const comment = old ? changes(old, value, { name: '完整名称', shortName: '简称', contact: '联系人', phone: '电话', address: '地址', receiving: '收货方式', status: '状态', isDefault: '默认采购方', remark: '备注' }) : `建立采购方 ${value.name}${value.isDefault ? '，设为默认' : ''}`;
  if (old && !comment) return state;
  const row: Company = { ...value, id: id || nextId('CGF', state.companies), timeline: [...old?.timeline || [], event(old ? '更新采购方资料' : '建立采购方', comment)] };
  const companies = state.companies.map(item => item.id === id ? row : value.isDefault && item.isDefault ? { ...item, isDefault: false, timeline: [...item.timeline, event('取消默认采购方', `默认采购方改为 ${row.name}（${row.id}）。`)] } : item);
  return { ...state, companies: old ? companies : [row, ...companies] };
}
export function saveSupply(state: CatalogState, draft: Draft<Supply>, id?: string): CatalogState {
  const old = exists(state.supplies, id), master = exists(state.products, draft.masterId), { supplier, profile } = supplierFor(state, draft.profileId);
  if (!master || !supplier || !profile) throw new Error('请选择有效产品与供应商采购资料');
  if (old && (old.masterId !== draft.masterId || old.profileId !== draft.profileId || old.country !== draft.country)) throw new Error('供货身份不可更换，请另建供货');
  if (!old && (master.status !== '启用' || profile.status !== '启用')) throw new Error('停用的产品或采购资料不能新增供货');
  if (!old && !(profile.kind === '国内采购' ? draft.country === 'CN' : profile.sites.includes(draft.country))) throw new Error('供货国家不在该采购资料支持范围内');
  if (state.supplies.some(row => row.id !== id && row.masterId === draft.masterId && row.profileId === draft.profileId && row.country === draft.country)) throw new Error('该产品、供应商采购资料与国家已有供货，请编辑原记录');
  if (!Number.isInteger(draft.carton) || draft.carton <= 0) throw new Error('装箱数须为正整数');
  if (!Number.isFinite(draft.price) || draft.price < 0) throw new Error('参考单价须为非负数');
  const value = { ...draft, unit: requireText(draft.unit, '采购单位'), currency: requireText(draft.currency, '币种'), basis: requireText(draft.basis, '价格口径'), lastOrdered: old?.lastOrdered || '' };
  const comment = old ? changes(old, value, { carton: '装箱数', price: '采购参考单价', currency: '币种', unit: '采购单位', basis: '价格口径', status: '状态', remark: '备注' }) : `${supplier.name} · ${draft.country}；参考价 ${value.currency} ${value.price}/${value.unit}；${value.basis}；${value.carton} 件/箱`;
  if (old && !comment) return state;
  const row: Supply = { ...value, id: id || nextId('GH', state.supplies), timeline: [...old?.timeline || [], event(old ? '修改供货资料' : '新增供货', comment)] };
  return { ...state, supplies: old ? state.supplies.map(item => item.id === id ? row : item) : [row, ...state.supplies] };
}
