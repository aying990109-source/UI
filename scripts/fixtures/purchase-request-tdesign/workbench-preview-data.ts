import { createEvent, type DetailEvent } from './history';

export const workbenchPages = { workbenchHome: '工作台' };
export type PersonalTask = { id: string; title: string; dueOn: string; note: string; status: 'open' | 'done' | 'deleted'; version: number; completedAt: string; linkedEvent: string; timeline: DetailEvent[] };
export type BusinessItem = { id: string; title: string; kind: 'business' | 'team'; sourcePage: string; sourceId: string; dueOn: string; group: string; note: string };
export type CalendarEvent = { id: string; date: string; market: 'US' | 'CA' | 'CN'; platform: string; title: string; type: string; source: string; verification: 'verified' | 'estimated' | 'unknown' | 'source_failed'; followed: boolean; version: number; timeline: DetailEvent[] };
export type Suggestion = { id: string; eventId: string; title: string; status: 'pending' | 'ignored' | 'accepted'; version: number; taskId: string };
export type EventCandidate = { id: string; title: string; market: CalendarEvent['market']; platform: string; date: string; status: 'pending' | 'published' | 'rejected'; reason: string };
export type WorkbenchState = { tasks: PersonalTask[]; business: BusinessItem[]; events: CalendarEvent[]; suggestions: Suggestion[]; candidates: EventCandidate[] };
export const businessDate = '2026-10-18';
export function todayFocus(state: WorkbenchState, date = businessDate) {
  return [
    ...state.tasks.filter(row => row.status === 'open' && row.dueOn === date).map(row => ({ kind: 'personal' as const, id: row.id, title: row.title, dueOn: row.dueOn, subtitle: '个人待办' })),
    ...state.business.filter(row => row.dueOn === date).map(row => ({ kind: row.kind, id: row.id, title: row.title, dueOn: row.dueOn, subtitle: `${row.sourceId} · ${row.group}`, sourcePage: row.sourcePage })),
  ].sort((a, b) => a.dueOn.localeCompare(b.dueOn) || Number(b.kind === 'personal') - Number(a.kind === 'personal') || a.id.localeCompare(b.id));
}
const validDate = (value: string) => { const parsed = new Date(`${value}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; };
const event = (label: string, comment: string) => createEvent(label, '演示用户', comment);
export function initialWorkbench(): WorkbenchState {
  return {
    tasks: [
      { id: 'TASK-001', title: '核对家居组采购申请', dueOn: '2026-10-18', note: '个人计划，不代表采购复审已完成。', status: 'open', version: 1, completedAt: '', linkedEvent: '', timeline: [createEvent('建立个人待办', '演示用户', '计划 2026-10-18 完成。', '2026-10-16 10:00:00')] },
      { id: 'TASK-002', title: '准备假日促销素材', dueOn: '2026-10-20', note: '关联 US 公开活动。', status: 'open', version: 1, completedAt: '', linkedEvent: 'EV-001', timeline: [createEvent('建立关联待办', '演示用户', '活动变更不自动改个人计划日期。', '2026-10-16 11:00:00')] },
      { id: 'TASK-003', title: '整理示例复盘', dueOn: '2026-10-17', note: '已完成记录仍保留计划日期。', status: 'done', version: 2, completedAt: '2026-10-17 16:30:00', linkedEvent: '', timeline: [createEvent('建立个人待办', '演示用户', '计划 2026-10-17。', '2026-10-16 12:00:00'), createEvent('完成待办', '演示用户', '完成时间 2026-10-17 16:30。', '2026-10-17 16:30:00')] },
    ],
    business: [
      { id: 'BIZ-001', title: '采购申请待复审', kind: 'business', sourcePage: 'review', sourceId: 'CG20261017022', dueOn: '2026-10-18', group: '家居组', note: '在采购处理原模块办理，工作台不能勾选完成。' },
      { id: 'BIZ-002', title: '补货处理待收标签', kind: 'business', sourcePage: 'replenishmentProcessing', sourceId: 'BH-CL-202610002', dueOn: '', group: '运营二组', note: '本地队列快照；跳转后按编号核对，非自动投影。' },
      { id: 'TEAM-001', title: '售后记录待跟进', kind: 'team', sourcePage: 'afterSales', sourceId: 'SH-DEMO-0002', dueOn: '2026-10-20', group: '日用组', note: '本地队列快照；团队队列不计入个人待办摘要。' },
    ],
    events: [
      { id: 'EV-001', date: '2026-10-20', market: 'US', platform: 'Amazon', title: '秋季促销准备日（示例）', type: '电商活动', source: '本地合成公开资料', verification: 'estimated', followed: true, version: 1, timeline: [createEvent('登记公开活动', '系统（示例）', '来源日期按当地日历展示。', '2026-10-10 10:00:00')] },
      { id: 'EV-002', date: '2026-10-26', market: 'CA', platform: 'Amazon', title: '加站点检查日（示例）', type: '电商活动', source: '本地合成公开资料', verification: 'unknown', followed: false, version: 1, timeline: [createEvent('登记公开活动', '系统（示例）', '未经人工核实的活动不能视为真实来源。', '2026-10-10 11:00:00')] },
      { id: 'EV-003', date: '2026-10-01', market: 'CN', platform: '公共', title: '国庆节', type: '公共假日', source: '固定示例日期', verification: 'verified', followed: false, version: 1, timeline: [createEvent('登记公共假日', '系统（示例）', '公共假日不表示在线采集成功。', '2026-10-01 08:00:00')] },
      { id: 'EV-004', date: '2026-10-28', market: 'US', platform: 'Amazon', title: '来源待恢复的活动（示例）', type: '电商活动', source: '合成采集失败快照', verification: 'source_failed', followed: false, version: 1, timeline: [createEvent('来源采集失败', '系统（示例）', '本地样板无在线重试。', '2026-10-18 09:00:00')] },
    ],
    suggestions: [{ id: 'SUG-001', eventId: 'EV-002', title: '准备 CA 活动资料', status: 'pending', version: 1, taskId: '' }],
    candidates: [{ id: 'CAND-001', title: 'US 平台活动候选（示例）', market: 'US', platform: 'Amazon', date: '2026-11-03', status: 'pending', reason: '日期证据不足，等待人工复核。' }],
  };
}
export function saveCalendarEvent(state: WorkbenchState, draft: Pick<CalendarEvent, 'title' | 'date' | 'market' | 'platform' | 'type' | 'source' | 'verification'> & { reason: string }, id?: string, version = 0): WorkbenchState {
  const old = id ? state.events.find(row => row.id === id) : undefined;
  if (id && (!old || old.version !== version)) throw new Error('活动版本已变化，请重新打开。');
  if (!draft.title.trim() || !validDate(draft.date) || !draft.platform.trim() || !draft.reason.trim()) throw new Error('请填写活动名称、有效日期、平台和维护原因。');
  const next: CalendarEvent = { id: old?.id || `EV-${String(state.events.length + 1).padStart(3, '0')}`, title: draft.title.trim(), date: draft.date, market: draft.market, platform: draft.platform.trim(), type: draft.type, source: draft.source.trim() || '人工维护（示例）', verification: draft.verification, followed: old?.followed || false, version: version + 1, timeline: [...(old?.timeline || []), event(old ? '人工维护活动' : '人工建立活动', `原因：${draft.reason.trim()}。个人待办日期不自动改变。`)] };
  return { ...state, events: old ? state.events.map(row => row.id === id ? next : row) : [...state.events, next] };
}
export function resolveCandidate(state: WorkbenchState, id: string, action: 'publish' | 'reject', reason: string): WorkbenchState {
  const candidate = state.candidates.find(row => row.id === id); if (!candidate || candidate.status !== 'pending') throw new Error('候选已处理。');
  if (!reason.trim()) throw new Error('请填写人工复核原因。');
  const next = { ...state, candidates: state.candidates.map(row => row.id === id ? { ...row, status: action === 'publish' ? 'published' as const : 'rejected' as const, reason: reason.trim() } : row) };
  return action === 'publish' ? saveCalendarEvent(next, { title: candidate.title, date: candidate.date, market: candidate.market, platform: candidate.platform, type: '电商活动', source: '人工复核候选（示例）', verification: 'estimated', reason }) : next;
}
export function saveTask(state: WorkbenchState, draft: { title: string; dueOn: string; note: string; linkedEvent: string }, id?: string, version = 0): WorkbenchState {
  const old = id ? state.tasks.find(row => row.id === id) : undefined;
  if (id && (!old || old.version !== version)) throw new Error('待办版本已变化，请重新打开。');
  if (old && old.status !== 'open') throw new Error('已完成待办须先单独恢复，才能修改内容或日期。');
  if (!draft.title.trim() || !validDate(draft.dueOn)) throw new Error('请填写待办标题与有效计划日期。');
  if (draft.linkedEvent && !state.events.some(item => item.id === draft.linkedEvent)) throw new Error('关联活动不存在。');
  if (old && old.title === draft.title && old.dueOn === draft.dueOn && old.note === draft.note && old.linkedEvent === draft.linkedEvent) return state;
  const next: PersonalTask = { ...draft, id: id || `TASK-${String(state.tasks.length + 1).padStart(3, '0')}`, status: 'open', version: version + 1, completedAt: '', timeline: [...(old?.timeline || []), event(old ? '修改个人待办' : '建立个人待办', `计划 ${draft.dueOn}；${draft.linkedEvent ? `关联 ${draft.linkedEvent}` : '无活动关联'}。`)] };
  return { ...state, tasks: old ? state.tasks.map(item => item.id === id ? next : item) : [next, ...state.tasks] };
}
export function changeTask(state: WorkbenchState, id: string, version: number, action: 'complete' | 'restore' | 'delete'): WorkbenchState {
  const row = state.tasks.find(item => item.id === id); if (!row || row.version !== version) throw new Error('待办版本已变化，请重新打开。');
  if (row.status === 'deleted' || action === 'complete' && row.status !== 'open' || action === 'restore' && row.status !== 'done') throw new Error('当前状态不能执行此操作。');
  const audit = event(action === 'complete' ? '完成个人待办' : action === 'restore' ? '恢复个人待办' : '删除个人待办', `计划日期保持 ${row.dueOn}。`);
  const next: PersonalTask = { ...row, status: action === 'complete' ? 'done' : action === 'restore' ? 'open' : 'deleted', version: row.version + 1, completedAt: action === 'complete' ? audit.time : action === 'restore' ? '' : row.completedAt, timeline: [...row.timeline, audit] };
  return { ...state, tasks: state.tasks.map(item => item.id === id ? next : item) };
}
export function changeFollow(state: WorkbenchState, eventId: string, version: number): WorkbenchState {
  const row = state.events.find(item => item.id === eventId); if (!row || row.version !== version) throw new Error('活动版本已变化。');
  const next = { ...row, followed: !row.followed, version: row.version + 1, timeline: [...row.timeline, event(row.followed ? '取消关注活动' : '关注活动', '关注只改变个人提醒。')] };
  return { ...state, events: state.events.map(item => item.id === eventId ? next : item) };
}
export function changeSuggestion(state: WorkbenchState, id: string, version: number, action: 'ignore' | 'restore' | 'accept', dueOn = ''): WorkbenchState {
  const row = state.suggestions.find(item => item.id === id); if (!row || row.version !== version) throw new Error('准备建议版本已变化。');
  if (action === 'accept' && !validDate(dueOn)) throw new Error('采纳建议须先选择个人待办计划日期。');
  if (action === 'restore' && row.status !== 'ignored' || action === 'ignore' && row.status !== 'pending' || action === 'accept' && row.status !== 'pending') throw new Error('当前建议状态不能执行此操作。');
  const next = action === 'accept' ? saveTask(state, { title: row.title, dueOn, note: '由准备建议采纳；不表示活动或业务完成。', linkedEvent: row.eventId }) : state;
  return { ...next, suggestions: next.suggestions.map(item => item.id === id ? { ...item, status: action === 'accept' ? 'accepted' : action === 'ignore' ? 'ignored' : 'pending', version: item.version + 1, taskId: action === 'accept' ? next.tasks[0].id : item.taskId } : item) };
}
