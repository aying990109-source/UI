import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('./support-preview-data.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const data = {};
new Function('exports', code)(data);
test('fixed help answers cite an article and unknown questions stay unknown', () => {
  assert.equal(data.helpArticles.length, 4);
  assert.equal(data.answerSupportQuestion('如何核对店铺授权？').articleId, 'store');
  assert.match(data.answerSupportQuestion('请预测下个月利润').answer, /没有足够依据/);
  assert.throws(() => data.answerSupportQuestion('   '), /请输入问题/);
});
