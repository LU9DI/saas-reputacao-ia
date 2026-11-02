/**
 * Worker de concorrência real do DOT.
 *
 * Cada instância deste script roda em um processo Node separado, com o próprio
 * pool de conexões e o próprio estado em memória. Assim os testes de
 * concorrência não podem ser vencidos pelo mutex em memória de
 * `dotActionQueue.ts`: a única proteção possível é a do PostgreSQL.
 *
 * Uso: tsx dotConcurrencyWorker.ts <approve|execute> <empresaId> <actionId> <startAtMs>
 */
import { initDB, getDb } from '../../lib/db.js';
import { approveDotAction, executeDotAction } from '../../services/dotActionQueue.js';

type Mode = 'approve' | 'execute';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const [modeRaw, empresaId, actionIdRaw, startAtRaw] = process.argv.slice(2);
  const mode = String(modeRaw || '') as Mode;
  if (mode !== 'approve' && mode !== 'execute') {
    throw new Error(`Modo inválido: ${modeRaw}`);
  }
  const actionId = Number(actionIdRaw);
  if (!empresaId || !Number.isInteger(actionId)) {
    throw new Error('Parâmetros inválidos: empresaId e actionId são obrigatórios.');
  }

  await initDB();

  // Barreira temporal: os processos partem na mesma janela de milissegundos.
  const startAt = Number(startAtRaw || 0);
  while (Date.now() < startAt) await sleep(1);

  const result = mode === 'approve'
    ? await approveDotAction(empresaId, actionId, 'user-concorrencia')
    : await executeDotAction(empresaId, actionId, 'user-concorrencia');

  process.stdout.write(`${JSON.stringify({ mode, result })}\n`);
  const db = getDb() as unknown as { close?: () => Promise<void> };
  if (typeof db.close === 'function') await db.close();
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error('WORKER_ERROR', error?.stack || String(error));
    process.exit(1);
  });
