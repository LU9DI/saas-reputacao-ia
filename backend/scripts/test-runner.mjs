#!/usr/bin/env node
/**
 * Runner de testes multiplataforma (Windows, macOS e Linux).
 *
 * Substitui o encadeamento de utilitários POSIX (busca + pipe), indisponível
 * no PowerShell/Windows, mantendo
 * exatamente a mesma separação de suítes:
 *
 *   node scripts/test-runner.mjs              # suíte padrão, exclui *.pg.test.ts
 *   node scripts/test-runner.mjs --postgres   # apenas *.pg.test.ts
 *   node scripts/test-runner.mjs --list       # lista os arquivos (JSON)
 *
 * Funciona igual em `cmd.exe`, PowerShell e bash: não depende de utilitários
 * POSIX, usa apenas APIs do Node e `path` para separadores nativos.
 */
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, '..');
const defaultTestsDir = path.join(backendRoot, 'tests');

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function isPostgresTest(file) {
  return file.endsWith('.pg.test.ts');
}

/**
 * Lista os arquivos de teste aplicando a separação padrão/PostgreSQL.
 * Retorna caminhos absolutos ordenados.
 */
export function listTestFiles({ dir = defaultTestsDir, postgres = false } = {}) {
  const stat = statSync(dir);
  const root = stat.isDirectory() ? dir : path.dirname(dir);
  return walk(root)
    .filter((file) => file.endsWith('.test.ts'))
    .filter((file) => (postgres ? isPostgresTest(file) : !isPostgresTest(file)));
}

export function parseArgs(argv = process.argv.slice(2)) {
  const options = { postgres: false, dir: defaultTestsDir, list: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--postgres') options.postgres = true;
    else if (arg === '--list') options.list = true;
    else if (arg === '--dir') {
      index += 1;
      if (!argv[index]) throw new Error('--dir exige um caminho');
      options.dir = path.resolve(argv[index]);
    } else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Argumento desconhecido: ${arg}`);
  }
  return options;
}

function main() {
  const options = parseArgs();
  if (options.help) {
    console.log('Uso: node scripts/test-runner.mjs [--postgres] [--list] [--dir <pasta>]');
    return 0;
  }

  const files = listTestFiles(options);
  if (options.list) {
    process.stdout.write(`${JSON.stringify(files, null, 2)}\n`);
    return 0;
  }
  if (files.length === 0) {
    console.error(`Nenhum teste encontrado em ${options.dir} (postgres=${options.postgres}).`);
    return 1;
  }

  const args = ['--import', 'tsx', '--test', ...files];
  const result = spawnSync(process.execPath, args, { cwd: backendRoot, stdio: 'inherit', env: process.env });
  if (result.error) {
    console.error('Falha ao executar os testes:', result.error.message);
    return 1;
  }
  return result.status ?? 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error('test-runner:', error?.message || error);
    process.exitCode = 1;
  }
}
