import { createEvent, type DetailEvent } from './history';

export const utilityPages = { itemManagement: '物品管理', systemSettings: '系统设置' };
export type BasicItem = { id: string; name: string; category: string; unit: string; note: string; active: boolean; version: number; timeline: DetailEvent[] };
export type ItemDraft = Pick<BasicItem, 'name' | 'category' | 'unit' | 'note' | 'active'> & { reason: string };
export const initialBasicItems = (): BasicItem[] => [
  { id: 'ITEM-001', name: '文件夹', category: '办公用品', unit: '个', note: '基础物品，不绑定采购产品主档。', active: true, version: 1, timeline: [createEvent('登记物品', '演示维护员', '合成基础物品。', '2026-10-15 10:00:00')] },
  { id: 'ITEM-002', name: '打包胶带', category: '耗材', unit: '卷', note: '库存和采购关系尚未定义。', active: true, version: 1, timeline: [createEvent('登记物品', '演示维护员', '合成基础物品。', '2026-10-15 11:00:00')] },
];
export function saveBasicItem(rows: BasicItem[], draft: ItemDraft, id?: string, version = 0): BasicItem[] {
  const old = id ? rows.find(row => row.id === id) : undefined;
  if (id && (!old || old.version !== version)) throw new Error('物品版本已变化，请重新打开。');
  if (!draft.name.trim() || !draft.category.trim() || !draft.unit.trim() || !draft.reason.trim()) throw new Error('请填写名称、类别、单位和维护原因。');
  if (rows.some(row => row.id !== id && row.name.toLowerCase() === draft.name.trim().toLowerCase())) throw new Error('物品名称已存在。');
  if (old && old.name === draft.name.trim() && old.category === draft.category.trim() && old.unit === draft.unit.trim() && old.note === draft.note.trim() && old.active === draft.active) return rows;
  const next: BasicItem = { id: old?.id || `ITEM-${String(Math.max(0, ...rows.map(row => Number(row.id.replace('ITEM-', '')) || 0)) + 1).padStart(3, '0')}`, name: draft.name.trim(), category: draft.category.trim(), unit: draft.unit.trim(), note: draft.note.trim(), active: draft.active, version: version + 1, timeline: [...(old?.timeline || []), createEvent(old ? '维护物品' : '登记物品', '演示维护员', `原因：${draft.reason.trim()}。不修改采购产品主档。`)] };
  return old ? rows.map(row => row.id === id ? next : row) : [next, ...rows];
}
export type InterfacePreferences = { density: 'standard' | 'compact'; defaultPage: 'requests' | 'workbenchHome'; theme: 'system' | 'light' | 'dark' };
declare global { var previewTheme: { read: () => InterfacePreferences; save: (next: InterfacePreferences) => InterfacePreferences; apply: (theme: InterfacePreferences['theme']) => void }; }
export const defaultPreferences: InterfacePreferences = { density: 'standard', defaultPage: 'requests', theme: 'system' };
export function readPreferences(): InterfacePreferences {
  return globalThis.previewTheme.read();
}
export function savePreferences(next: InterfacePreferences): InterfacePreferences {
  return globalThis.previewTheme.save(next);
}
