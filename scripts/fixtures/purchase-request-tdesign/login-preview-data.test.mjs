import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('./login-preview-data.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const data = {};
new Function('exports', code)(data);

test('preview login rejects empty and incorrect credentials and accepts only the synthetic account', () => {
  assert.equal(data.validatePreviewLogin('   ', '').field, 'username');
  assert.equal(data.validatePreviewLogin('demo.admin', '').field, 'password');
  assert.equal(data.validatePreviewLogin('other', 'demo12345').field, 'credentials');
  assert.equal(data.validatePreviewLogin('demo.admin', 'wrong').field, 'credentials');
  assert.equal(data.validatePreviewLogin('demo.admin', 'demo12345 ').field, 'credentials');
  assert.equal(data.validatePreviewLogin(' demo.admin ', 'demo12345'), null);
});
