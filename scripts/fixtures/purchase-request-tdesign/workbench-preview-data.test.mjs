import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const load = (file, dependencies = {}) => { const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText; const exports = {}; new Function('require', 'exports', code)(name => { assert.ok(name in dependencies, `Unexpected import: ${name}`); return dependencies[name]; }, exports); return exports; };
const data = load('./workbench-preview-data.ts', { './history': load('./history.ts') });
test('today focus includes only open personal and due business items in stable order', () => {
  const state = data.initialWorkbench();
  assert.deepEqual(data.todayFocus(state).map(row => row.id), ['TASK-001', 'BIZ-001']);
  const changed = data.changeTask(state, 'TASK-001', 1, 'complete');
  assert.deepEqual(data.todayFocus(changed).map(row => row.id), ['BIZ-001']);
  assert.equal(data.todayFocus(state, '2026-10-20').some(row => row.id === 'TEAM-001'), true);
});
test('personal task completion, restoration and deletion preserve due date and version', () => {
  const state = data.initialWorkbench(), row = state.tasks[0];
  assert.throws(() => data.saveTask(state, { title: '无日期', dueOn: '', note: '', linkedEvent: '' }), /计划日期/);
  const done = data.changeTask(state, row.id, row.version, 'complete'), completed = done.tasks[0];
  assert.equal(completed.dueOn, row.dueOn); assert.ok(completed.completedAt);
  assert.throws(() => data.saveTask(done, { title: '同时编辑', dueOn: row.dueOn, note: '', linkedEvent: '' }, row.id, completed.version), /先单独恢复/);
  const restored = data.changeTask(done, row.id, completed.version, 'restore').tasks[0];
  assert.equal(restored.status, 'open'); assert.equal(restored.completedAt, '');
  assert.equal(data.changeTask({ ...state, tasks: [restored, ...state.tasks.slice(1)] }, row.id, restored.version, 'delete').tasks[0].status, 'deleted');
});
test('business source links cannot be marked personal done; suggestion needs a date', () => {
  const state = data.initialWorkbench(), suggestion = state.suggestions[0];
  assert.ok(state.business.every(item => item.sourcePage && !('status' in item)));
  assert.throws(() => data.changeSuggestion(state, suggestion.id, suggestion.version, 'accept', ''), /计划日期/);
  const next = data.changeSuggestion(state, suggestion.id, suggestion.version, 'accept', '2026-10-24');
  assert.equal(next.suggestions[0].status, 'accepted'); assert.equal(next.tasks[0].dueOn, '2026-10-24');
  assert.equal(next.business.length, state.business.length);
});
test('event maintenance and candidate review preserve follow and task plan dates', () => {
  const state = data.initialWorkbench(), event = state.events[0], task = state.tasks[1];
  const revised = data.saveCalendarEvent(state, { title: event.title, date: '2026-10-21', market: event.market, platform: event.platform, type: event.type, source: event.source, verification: 'estimated', reason: '人工日期核对' }, event.id, event.version);
  assert.equal(revised.events[0].followed, true);
  assert.equal(revised.tasks[1].dueOn, task.dueOn);
  assert.throws(() => data.saveCalendarEvent(revised, { title: event.title, date: event.date, market: event.market, platform: event.platform, type: event.type, source: '', verification: 'unknown', reason: '旧版本' }, event.id, event.version), /版本/);
  const candidate = state.candidates[0];
  assert.throws(() => data.resolveCandidate(state, candidate.id, 'publish', ''), /原因/);
  const published = data.resolveCandidate(state, candidate.id, 'publish', '补足人工核对');
  assert.equal(published.candidates[0].status, 'published'); assert.ok(published.events.some(item => item.title === candidate.title));
});
