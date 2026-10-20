import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync(new URL('./list-filter-toolbar-layout.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const layout = {};
new Function('exports', code)(layout);
const { fieldWidthForLayout, planToolbar, selectFieldWidth, toolbarGap, toolbarRowWidth } = layout;

const purchase = {
  width: 1257, create: 140, fields: [220, 156, 128, 260], query: 76, reset: 48, batch: 0,
  actions: [], filterButtons: [77, 119, 119, 119, 119], actionButton: 108, mergedButton: 85,
};

test('fields stay in business order and only the trailing fields that do not fit are collected', () => {
  const full = planToolbar(purchase);
  assert.equal(full.visibleFields, 4);
  assert.ok(toolbarRowWidth(purchase, full) <= purchase.width);
  const exact = toolbarRowWidth(purchase, full);
  assert.equal(planToolbar({ ...purchase, width: exact }).visibleFields, 4);
  assert.equal(planToolbar({ ...purchase, width: exact - 1 }).visibleFields, 3);
  assert.equal(planToolbar({ ...purchase, width: 1097 }).visibleFields, 3);
  assert.equal(planToolbar({ ...purchase, width: 731 }).visibleFields, 1);
});

test('auxiliary actions yield space before filters; narrow layouts preserve commands and actions', () => {
  const withActions = { ...purchase, width: 1097, actions: [120, 140] };
  const planned = planToolbar(withActions);
  assert.equal(planned.inlineActions, 0);
  assert.equal(planned.visibleFields, 2);
  assert.ok(toolbarRowWidth(withActions, planned) <= withActions.width);
  const narrow = planToolbar({ ...withActions, width: 257 });
  assert.equal(narrow.visibleFields, 0);
  assert.equal(narrow.commandsInline, false);
  assert.equal(narrow.merged, true);
  assert.ok(toolbarRowWidth({ ...withActions, width: 257 }, narrow) <= 257);
});

test('a page with no create or query keeps all fitting fields and has no empty filter disclosure', () => {
  const sizes = { ...purchase, width: 500, create: 0, fields: [128, 128], query: 0, reset: 0 };
  const planned = planToolbar(sizes);
  assert.equal(planned.visibleFields, 2);
  assert.equal(toolbarRowWidth(sizes, planned), 268);
});

test('short options remain compact while a keyword field receives the spare width', () => {
  assert.equal(selectFieldWidth(56), 98);
  assert.equal(selectFieldWidth(114), 156);
  assert.equal(selectFieldWidth(400), 240);
  assert.equal(selectFieldWidth(400, true), 280);
  const store = { ...purchase, width: 937, create: 0, fields: [220, 98, 98, 126], query: 0, reset: 60 };
  const planned = planToolbar(store);
  assert.equal(planned.visibleFields, 4);
  assert.equal(toolbarGap('field', 'field'), 12);
  assert.equal(toolbarRowWidth(store, planned), 662);
  assert.ok(store.width - toolbarRowWidth(store, planned) >= 180);
});

test('a narrow keyword toolbar keeps search on its own row before moving other controls', () => {
  const compact = { ...purchase, width: 257, keywordFirst: true, filterButtons: [100, 120, 120, 120, 120] };
  const planned = planToolbar(compact);
  assert.equal(planned.visibleFields, 1);
  assert.equal(planned.commandsInline, false);
  assert.ok(toolbarRowWidth(compact, planned) <= compact.width);
});

test('a hidden field retains its last actual width until its displayed text changes', () => {
  const measured = fieldWidthForLayout('全部国家', 56, 150, undefined);
  const hidden = fieldWidthForLayout('全部国家', 56, undefined, measured);
  assert.equal(hidden.width, 150);
  const sizes = { ...purchase, width: 140, create: 0, fields: [hidden.width], query: 0, reset: 0 };
  assert.equal(planToolbar(sizes).visibleFields, 0);
  assert.equal(planToolbar({ ...sizes, fields: [fieldWidthForLayout('全部国家', 56, undefined, measured).width] }).visibleFields, 0);
  assert.equal(fieldWidthForLayout('US', 14, undefined, measured).width, 56);
  assert.equal(fieldWidthForLayout('全部国家', 70, undefined, measured).width, 112);
});

test('a selected hidden filter still fits beside create at a 320px viewport', () => {
  const compact = { ...purchase, width: 257, filterButtons: [100, 120, 120, 120, 120] };
  const planned = planToolbar(compact);
  assert.equal(toolbarGap('create', 'filter', true), 8);
  assert.equal(planned.visibleFields, 0);
  assert.equal(planned.commandsInline, false);
  assert.ok(toolbarRowWidth(compact, planned) <= compact.width);
});
