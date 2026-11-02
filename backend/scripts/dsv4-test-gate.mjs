#!/usr/bin/env node
/**
 * DSV4 Bloco E — gate de testes anti-mascaramento e anti-obsolescência.
 *
 * Problema: F7 (EF-05) e T6 (EF-18) documentam defeitos AINDA ABERTOS e falham
 * por desenho. Removê-los ou silenciá-los (skip/todo) mascararia a falha.
 *
 * Solução (O1): allowlist explícita em tests/known-failures.json + este gate.
 *
 * Invariantes:
 *   I1 — todo teste FORA da allowlist deve PASSAR
 *   I2 — todo teste NA allowlist deve FALHAR (se passar, a entrada está obsoleta
 *        e a correção foi feita sem limpar a lista)  -> anti-obsolescência
 *   I3 — toda entrada da allowlist deve corresponder a um teste existente
 *   I4 — a allowlist é impressa no log (visibilidade permanente)
 *
 * Exit codes: 0 = aprovado · 1 = violação de invariante · 2 = falha de infraestrutura
 *
 * Runner: DSV4_TEST_RUNNER (default: "npx --yes tsx", o runner oficial).
 *         Ex.: DSV4_TEST_RUNNER=node node scripts/dsv4-test-gate.mjs
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = join(SCRIPT_DIR, '..');
const TESTS_DIR = join(BACKEND_ROOT, 'tests');
const ALLOWLIST_PATH = join(TESTS_DIR, 'known-failures.json');
const RUNNER = (process.env.DSV4_TEST_RUNNER || 'npx --yes tsx').trim().split(/\s+/);

const IGNORED_FILE = (name) => name.startsWith('integration.') && name.endsWith('.test.ts');
const IS_TEST_FILE = (name) => name.endsWith('.test.ts') && !IGNORED_FILE(name);

function listTestFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listTestFiles(full));
    else if (IS_TEST_FILE(entry)) out.push(full);
  }
  return out;
}

function readAllowlist() {
  const raw = readFileSync(ALLOWLIST_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed?.entries)) throw new Error('allowlist invalida: falta "entries"');
  return parsed.entries;
}

/** Executa um arquivo de teste e devolve os resultados de nível superior do TAP. */
function runTestFile(file) {
  const args = [...RUNNER.slice(1), '--test', '--test-reporter=tap', relative(BACKEND_ROOT, file)];
  const res = spawnSync(RUNNER[0], args, {
    cwd: BACKEND_ROOT,
    encoding: 'utf8',
    timeout: 600000,
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'test' },
  });
  if (res.error) {
    console.error(`[gate] falha ao executar o runner "${RUNNER.join(' ')}": ${res.error.message}`);
    process.exit(2);
  }
  const stdout = res.stdout || '';
  const relName = relative(BACKEND_ROOT, file);
  const results = [];
  const ignored = [];
  let fileLevel = false;
  for (const line of stdout.split('\n')) {
    // Apenas nível superior: linhas TAP de subteste são indentadas.
    const match = /^(not ok|ok)\s+\d+\s+-\s+(.*)$/.exec(line);
    if (!match) continue;
    const name = match[2].trim();
    if (/\s+#\s*(SKIP|TODO)\b/i.test(name)) {
      ignored.push(name);
      continue;
    }
    // Node emite um pseudo-teste com o caminho do arquivo quando ele nem carrega.
    if (name === relName || name === relative(TESTS_DIR, file)) { fileLevel = true; continue; }
    results.push({ ok: match[1] === 'ok', name });
  }
  return { status: res.status, results, ignored, fileLevel, stderr: res.stderr || '' };
}

function matches(entry, testName) {
  return testName === entry.test || testName.startsWith(`${entry.test} `);
}

function main() {
  const allowlist = readAllowlist();
  const files = listTestFiles(TESTS_DIR);
  const violations = [];
  const matchedEntries = new Set();
  let total = 0;
  let passed = 0;
  let knownFail = 0;

  console.log(`[gate] runner: ${RUNNER.join(' ')}`);
  console.log(`[gate] allowlist (${allowlist.length}): ${allowlist.map((e) => `${e.test}/${e.file}`).join(', ') || '(vazia)'}`);
  console.log('[gate] I4 — allowlist impressa para visibilidade permanente');

  for (const file of files) {
    const name = relative(TESTS_DIR, file);
    const { status, results, ignored, fileLevel } = runTestFile(file);

    for (const testName of ignored) {
      violations.push({ kind: 'I1', detail: `${name} :: "${testName}" foi SKIP/TODO; testes ignorados não são aceitos pelo gate` });
    }

    if (fileLevel || (results.length === 0 && status !== 0)) {
      violations.push({ kind: 'I1', detail: `${name}: falha em nível de arquivo (runner status ${status})` });
      continue;
    }

    for (const result of results) {
      total += 1;
      const entry = allowlist.find((candidate) => candidate.file === name && matches(candidate, result.name));
      if (entry) {
        matchedEntries.add(entry);
        if (result.ok) {
          // I2: estava na allowlist (deveria falhar) e passou.
          violations.push({
            kind: 'I2',
            detail: `${name} :: "${result.name}" passou mas consta como known-fail (${entry.ef}) — remova a entrada da allowlist`,
          });
        } else {
          knownFail += 1;
          console.log(`[gate] known-fail OK  ${name} :: ${result.name}  (${entry.ef} ${entry.requirement})`);
        }
      } else if (!result.ok) {
        // I1: falha inesperada.
        violations.push({ kind: 'I1', detail: `${name} :: "${result.name}" falhou e não está na allowlist` });
      } else {
        passed += 1;
      }
    }
  }

  // I3: entradas órfãs.
  for (const entry of allowlist) {
    if (!matchedEntries.has(entry)) {
      violations.push({ kind: 'I3', detail: `entrada órfã na allowlist: ${entry.test}/${entry.file} (${entry.ef})` });
    }
  }

  console.log('');
  console.log(`[gate] arquivos: ${files.length} · testes: ${total} · pass: ${passed} · known-fail: ${knownFail}`);
  if (violations.length === 0) {
    console.log('[gate] RESULTADO: APROVADO (I1, I2, I3 satisfeitos)');
    process.exit(0);
  }
  for (const violation of violations) console.error(`[gate] VIOLAÇÃO ${violation.kind}: ${violation.detail}`);
  console.error(`[gate] RESULTADO: REPROVADO (${violations.length} violação(ões))`);
  process.exit(1);
}

main();
