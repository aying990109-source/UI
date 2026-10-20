import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const directory = new URL('./fixtures/purchase-request-tdesign/', import.meta.url);
const files = readdirSync(directory).filter(name => name.endsWith('.test.mjs')).sort()
  .map(name => fileURLToPath(new URL(name, directory)));
if (!files.length) throw new Error('没有找到样板测试。');
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
