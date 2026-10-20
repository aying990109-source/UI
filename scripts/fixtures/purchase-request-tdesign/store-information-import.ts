import { parseCsvRows } from '../../../src/lib/csv';
import { createEvent } from './history';
import type { BrandPricingState, DemoAuthorization } from './brand-pricing-data';
import { authorizationScope, demoPersonnel, projectStoreAuthorizations, saveStoreInformation, storeProfileFields, storeWorkbookHeaders, type StoreImportPlan, type StoreInfo, type StoreProfile } from './store-information-data';

const authHeaders = ['授权品牌ID', '授权品牌名称', '授权状态', '授权日期', '授权版本'] as const;
const split = (value: string) => value.split(/[,，、\n]/).map(item => item.trim()).filter(Boolean);
const validDate = (value: string) => { const parsed = new Date(`${value}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; };
const whole = (value: string) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : -1;
const relation = (brands: BrandPricingState, brandId: string, scope: string) => brands.relations[brandId]?.find(item => item.scope === scope);

function parseAuthorizations(source: Record<string, string>, row: StoreInfo, brands: BrandPricingState | undefined, errors: string[]) {
  const raw = authHeaders.map(header => source[header] || '');
  if (raw.every(value => !value.trim())) return [];
  if (!brands) { errors.push('授权列需要品牌档案状态，无法在当前预检中校验。'); return []; }
  const columns = raw.map(value => value.replaceAll('\r\n', '\n').split('\n').map(item => item.trim()));
  const size = Math.max(...columns.map(items => items.length));
  if (size > 100 || columns.some(items => items.length !== size && (items.length !== 1 || items[0]))) { errors.push('授权各列须按换行逐项对应，最多 100 项。'); return []; }
  const expanded = columns.map(items => items.length === size ? items : Array(size).fill(''));
  const result: StoreImportPlan['authorizationChanges'] = [], seen = new Set<string>();
  for (let index = 0; index < size; index++) {
    const [id, name, rawStatus, rawDate, rawVersion] = expanded.map(items => items[index]);
    const brand = brands.brands.find(item => id ? item.id === id : item.name === name);
    if (!brand || id && name && brand.name !== name) { errors.push(`第 ${index + 1} 项授权品牌 ID/名称未匹配档案。`); continue; }
    if (seen.has(brand.id)) { errors.push(`第 ${index + 1} 项授权品牌重复。`); continue; }
    seen.add(brand.id);
    const scope = authorizationScope(row), before = relation(brands, brand.id, scope);
    const status = (rawStatus || before?.status || '有效') as DemoAuthorization['status'];
    const day = rawDate === '未填写' ? '' : rawDate || before?.date || '';
    if (!['有效', '已取消', '停用'].includes(status)) errors.push(`第 ${index + 1} 项授权状态无效。`);
    if (day && !validDate(day)) errors.push(`第 ${index + 1} 项授权日期无效。`);
    const changed = !before || status !== before.status || day !== before.date;
    if (before && changed && !rawVersion) errors.push(`第 ${index + 1} 项修改已有授权须填写授权版本。`);
    const version = rawVersion ? whole(rawVersion) : before?.version || 1;
    const expectedVersion = before ? version : 0;
    if (before && (rawVersion || status !== before.status || day !== before.date) && version !== (before.version || 1)) errors.push(`第 ${index + 1} 项授权版本不匹配。`);
    if (!before && rawVersion) errors.push(`第 ${index + 1} 项新授权不能填写版本。`);
    result.push({ brandId: brand.id, scope, status, date: day, version: expectedVersion });
  }
  return result;
}

export function previewStoreWorkbook(rows: StoreInfo[], csv: string, brands?: BrandPricingState): StoreImportPlan[] {
  const table = parseCsvRows(csv), headers = table[0]?.map(value => value.trim()) || [];
  if (!headers.length || new Set(headers).size !== headers.length || headers.some(header => !storeWorkbookHeaders.includes(header)) || storeProfileFields.some(([, label]) => !headers.includes(label))) throw new Error('工作簿须包含原表 16 列，表头不得重复或含未知列。');
  const plans: StoreImportPlan[] = [], seenSids = new Set<string>();
  for (const [index, cells] of table.slice(1).entries()) {
    const source = Object.fromEntries(headers.map((header, column) => [header, (cells[column] || '').trim()]));
    if (Object.values(source).every(value => !value) || source['店铺简称'] === '【示例行，导入前请删除】') continue;
    const sid = source['领星店铺ID'] || '', id = source['档案ID'] || '', row = rows.find(item => item.sid === sid);
    const errors: string[] = [], warnings: string[] = [];
    const profile = Object.fromEntries(storeProfileFields.map(([key, label]) => [key, source[label] || ''])) as StoreProfile;
    if (!row) errors.push('领星店铺 ID 未匹配已归组站点；请先在店铺归组建立站点。');
    if (row && id && id !== row.id) errors.push('档案 ID 与领星店铺 ID 不匹配。');
    if (row && row.hasDossier && !id) errors.push('更新须填写导出的档案 ID。');
    if (row && source['小组ID'] !== row.groupId) errors.push('小组 ID 与当前归组不匹配。');
    if (row && profile.sites !== row.country) errors.push('站点国家须与当前归组一致。');
    if (!profile.name) errors.push('请填写店铺名。');
    if (seenSids.has(sid)) errors.push('同一文件不能多次维护同一店铺 ID。');
    seenSids.add(sid);
    const version = whole(source['版本'] || '0'), shortVersion = whole(source['简称版本'] || '0'), statusVersion = whole(source['账号状态版本'] || '0');
    if (row && (row.hasDossier && version !== row.version || !row.hasDossier && version !== 0)) errors.push('档案版本不匹配，请重新导出。');
    if (row && profile.shortName !== row.profile.shortName && shortVersion !== row.shortVersion) errors.push('修改简称须填写当前简称版本。');
    if (row && profile.statuses !== row.profile.statuses && statusVersion !== row.statusVersion) errors.push('修改账号状态须填写当前账号状态版本。');
    if (source['清空简称'] && source['清空简称'] !== '是' || source['清空简称'] === '是' && profile.shortName) errors.push('清空简称请填“是”并将简称留空。');
    if (source['清空账号状态'] && source['清空账号状态'] !== '是' || source['清空账号状态'] === '是' && profile.statuses) errors.push('清空账号状态请填“是”并将状态留空。');
    if (row && !profile.shortName && !source['清空简称']) profile.shortName = row.profile.shortName;
    if (row && !profile.statuses && !source['清空账号状态']) profile.statuses = row.profile.statuses;
    if (profile.balance && !/^-?\d+(?:\.\d{1,2})?$/.test(profile.balance)) errors.push('余额须为最多两位小数的金额。');
    if (profile.openedOn && !validDate(profile.openedOn)) errors.push('下店时间无效。');
    const ownerIds = split(source['负责人ID'] || '');
    if (row && ownerIds.some(owner => !demoPersonnel.some(person => person.id === owner && person.groupId === row.groupId))) errors.push('负责人 ID 须属于当前小组。');
    if (!ownerIds.length && profile.ownerText) warnings.push('来源负责人原文已保留；未匹配工作台负责人 ID。');
    const rawGrade = source['店铺等级'] || '', grade = rawGrade ? rawGrade === '未评级' ? '' : rawGrade : row?.grade || '', gradeVersion = whole(source['店铺配置版本'] || '0');
    if (rawGrade && !/^(?:未评级|A[1-5]|B[1-5]|C[1-5])$/.test(rawGrade)) errors.push('店铺等级无效。');
    if (row && grade !== row.grade && gradeVersion !== row.gradeVersion) errors.push('修改等级须提供当前店铺配置版本。');
    if (headers.some(header => header.endsWith('（只读）') && source[header])) warnings.push('只读列不会回导改写。');
    const authorizationCells = Object.fromEntries(authHeaders.map(header => [header, source[header] || '']));
    const authorizationChanges = row ? parseAuthorizations(source, { ...row, profile }, brands, errors) : [];
    plans.push({ line: index + 2, sid, id: row?.id || id, version, shortVersion, statusVersion, shortName: profile.shortName, name: profile.name, groupId: source['小组ID'] || '', balance: profile.balance, multichannel: profile.multichannel, statuses: profile.statuses, remark: profile.remark, profile, ownerIds, grade, gradeVersion, authorizationCells, authorizationChanges, source, action: row?.hasDossier ? '更新' : '新增', errors, warnings, selected: !errors.length, done: false });
  }
  const changes = new Map<string, string>();
  for (const plan of plans) for (const auth of plan.authorizationChanges) {
    const key = `${auth.brandId}:${auth.scope}`, value = `${auth.status}:${auth.date}`;
    if (changes.has(key) && changes.get(key) !== value) plan.errors.push('同简称美洲站点的同一品牌授权冲突，请统一状态和日期。');
    changes.set(key, value);
  }
  for (const plan of plans) if (plan.errors.length) plan.selected = false;
  return plans;
}

export function commitStoreWorkbook(rows: StoreInfo[], plans: StoreImportPlan[], brands?: BrandPricingState): { rows: StoreInfo[]; plans: StoreImportPlan[]; brands?: BrandPricingState } {
  let nextRows = rows, nextBrands = brands;
  const results = plans.map(plan => {
    if (!plan.selected || plan.done || plan.errors.length) return plan;
    try {
      const row = nextRows.find(value => value.sid === plan.sid);
      if (!row) throw new Error('关联店铺已不存在。');
      if (row.version !== plan.version || row.shortVersion !== plan.shortVersion || row.statusVersion !== plan.statusVersion) throw new Error('档案或共享字段版本已变化，请重新预检。');
      if (row.grade !== plan.grade && row.gradeVersion !== plan.gradeVersion) throw new Error('店铺等级版本已变化，请重新预检。');
      if (plan.authorizationChanges.length && !nextBrands) throw new Error('缺少品牌授权状态，当前行不能提交。');
      for (const change of plan.authorizationChanges) {
        const before = nextBrands && relation(nextBrands, change.brandId, change.scope);
        if ((before ? before.version || 1 : 0) !== change.version && (!before || before.status !== change.status || before.date !== change.date)) throw new Error('品牌授权版本已变化，请重新预检。');
      }
      const changedProfile = storeProfileFields.some(([key]) => row.profile[key] !== plan.profile[key]) || JSON.stringify(row.ownerIds) !== JSON.stringify(plan.ownerIds);
      const candidate = changedProfile || !row.hasDossier ? saveStoreInformation(nextRows, row.id, { profile: plan.profile, ownerIds: plan.ownerIds, expectedVersion: plan.version, expectedShortVersion: plan.shortVersion, expectedStatusVersion: plan.statusVersion, reason: `XLSX 第 ${plan.line} 行回导` }) : nextRows;
      nextRows = candidate.map(item => item.sid === row.sid && item.grade !== plan.grade ? { ...item, grade: plan.grade === '未评级' ? '' : plan.grade, gradeVersion: item.gradeVersion + 1, timeline: [...item.timeline, createEvent('回导店铺等级', '资料维护员（示例）', `第 ${plan.line} 行：${plan.grade || '未评级'}。`)] } : item);
      if (nextBrands) {
        let updated = nextBrands;
        for (const change of plan.authorizationChanges) {
          const before = relation(updated, change.brandId, change.scope);
          if (before && before.status === change.status && before.date === change.date) continue;
          const brand = updated.brands.find(item => item.id === change.brandId)!;
          const link: DemoAuthorization = { id: before?.id || `AUTH-DEMO-${change.brandId}-${change.scope}`, scope: change.scope, sid: row.sid, store: row.profile.name, country: row.country, status: change.status, date: change.date, version: (before?.version || 0) + 1 };
          updated = { ...updated, relations: { ...updated.relations, [brand.id]: [...(updated.relations[brand.id] || []).filter(item => item.scope !== change.scope), link] }, brands: updated.brands.map(item => item.id === brand.id ? { ...item, version: item.version + 1, timeline: [...item.timeline, createEvent('店铺 XLSX 维护共享授权', '资料维护员（示例）', `${change.scope} → ${change.status}。`)] } : item) };
        }
        nextBrands = projectStoreAuthorizations(updated, nextRows);
      }
      return { ...plan, done: true };
    } catch (cause) { return { ...plan, errors: [(cause as Error).message], selected: false }; }
  });
  return { rows: nextRows, plans: results, brands: nextBrands };
}
