import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync(new URL('./date-range-presets.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const ranges = {};
new Function('exports', code)(ranges);

test('Shanghai business days and inclusive rolling ranges cross UTC day and year boundaries', () => {
  const at = ranges.datePresetRanges(new Date('2026-12-31T16:30:00Z'));
  assert.deepEqual(at[0], ['2027-01-01', '2027-01-01']);
  assert.deepEqual(at[2], ['2026-12-26', '2027-01-01']);
  assert.deepEqual(at[4], ['2027-01-01', '2027-01-31']);
  assert.deepEqual(at[5], ['2026-12-01', '2026-12-31']);
  assert.deepEqual(at[6], ['2027-01-01', '2027-12-31']);
  assert.deepEqual(at[7], []);
  assert.equal(ranges.matchingDatePreset(at[0], at), 0);
  assert.equal(ranges.matchingDatePreset([], at), 7);
  assert.equal(ranges.matchingDatePreset(['2027-01-01'], at), -1);
});
