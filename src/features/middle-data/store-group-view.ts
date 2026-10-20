import type {AfterSalesStore, StoreBrandSummary} from '../../lib/types';

const sites = ['US', 'CA', 'MX', 'BR', 'UK', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'PL', 'BE', 'JP', 'AU', 'SG', 'AE', 'SA', 'IN', 'TR'];
const collator = new Intl.Collator('zh-CN', {numeric: true, sensitivity: 'base'});
const countryAliases = [
  'US 美国', 'CA 加拿大', 'MX 墨西哥', 'BR 巴西', 'UK GB 英国', 'DE 德国', 'FR 法国',
  'IT 意大利', 'ES 西班牙', 'NL 荷兰', 'SE 瑞典', 'PL 波兰', 'BE 比利时', 'JP 日本',
  'AU 澳大利亚', 'SG 新加坡', 'AE 阿联酋', 'SA 沙特阿拉伯', 'IN 印度', 'TR 土耳其', 'CN 中国',
].map(aliases => aliases.toLocaleLowerCase().split(' '));
export function storeNameParts(name: string) {
  const match = name.trim().match(/^(.*)-([A-Za-z]{2})$/);
  const site = match?.[2].toUpperCase() ?? '';
  return match && sites.includes(site) ? {family: match[1], site} : {family: name.trim(), site: ''};
}
export function storeView(stores: AfterSalesStore[], filters: {search: string; country: string; group: string; active: string}, related: {
  groups?: {id: string; name: string}[];
  brands?: StoreBrandSummary['brands'];
} = {}) {
  const terms = filters.search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const groups = new Map((related.groups ?? []).map(group => [group.id, group.name]));
  return stores.filter(store => {
    if ((filters.country && store.country !== filters.country)
      || (filters.group && store.groupId !== filters.group)
      || (filters.active && store.active !== (filters.active === 'active'))) return false;
    if (!terms.length) return true;
    const country = (store.country ?? '').trim().toLocaleLowerCase();
    const text = [store.name, store.shortName, store.sid, store.platform, store.grade || '未评级',
      store.groupId ? store.groupName || groups.get(store.groupId) || store.groupId : '',
      ...(countryAliases.find(aliases => aliases.includes(country)) ?? [country]),
      ...(related.brands?.[store.sid] ?? []).map(brand => brand.name),
    ].map(value => (value ?? '').toLocaleLowerCase());
    const statuses = [...(store.accountStatuses ?? []), store.active ? '启用' : '停用', store.groupId ? '已归组' : '未归组']
      .map(value => value.trim().toLocaleLowerCase());
    return terms.every(term => statuses.includes(term) || text.some(value => value.includes(term)));
  })
    .sort((a, b) => {
      const left = storeNameParts(a.name), right = storeNameParts(b.name);
      return collator.compare(left.family, right.family) || sites.indexOf(left.site) - sites.indexOf(right.site)
        || collator.compare(a.name, b.name) || collator.compare(a.sid, b.sid);
    });
}
