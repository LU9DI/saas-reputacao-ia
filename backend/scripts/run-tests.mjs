import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const testsDir = join(root, 'tests');

function collect(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(path));
    else if (entry.isFile() && entry.name.endsWith('.test.ts')) out.push(path);
  }
  return out;
}

const files = collect(testsDir).sort();
if (files.length === 0) {
  console.error('Nenhum teste encontrado em backend/tests.');
  process.exit(1);
}

const bin = process.platform === 'win32'
  ? join(root, 'node_modules', '.bin', 'tsx.cmd')
  : join(root, 'node_modules', '.bin', 'tsx');

let failed = 0;

for (const file of files) {
  const relativeFile = relative(root, file);
  console.log('\n=== ' + relativeFile + ' ===');

  const result = spawnSync(bin, ['--test', relativeFile], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });

  if (result.error) {
    console.error('Falha ao iniciar o runner para ' + relativeFile + ': ' + result.error.message);
    failed += 1;
    continue;
  }

  if ((result.status ?? 1) !== 0) failed += 1;
}

if (failed > 0) {
  console.error('\n' + failed + ' arquivo(s) de teste falharam.');
  process.exit(1);
}

console.log('\nTodos os ' + files.length + ' arquivos de teste passaram.');
process.exit(0);
