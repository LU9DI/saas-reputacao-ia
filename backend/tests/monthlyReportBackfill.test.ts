import test from 'node:test';
import assert from 'node:assert/strict';
import { backfillSubscriptionDays, subscriptionDayFromExpiry } from '../routes/monthlyReportJobsRoutes.js';

test('usa o dia do fim do ciclo quando válido e não inventa aniversário quando ausente/inválido', () => {
  assert.equal(subscriptionDayFromExpiry('2026-11-18T12:00:00.000Z'), 18);
  assert.equal(subscriptionDayFromExpiry(null), null);
  assert.equal(subscriptionDayFromExpiry('  '), null);
  assert.equal(subscriptionDayFromExpiry('data-inválida'), null);
});

test('preenche o aniversário de empresas ativas elegíveis sem o campo', async () => {
  const updates: Array<{ day: number; id: string }> = [];
  const db = {
    async all(sql: string) {
      assert.match(sql, /relatorio_dia_assinatura IS NULL/);
      assert.match(sql, /'pro','ultra','corporativo','corporate','corp','rei'/);
      assert.match(sql, /'ativo','active'/);
      return [
        { id: 'e1', expira_em: '2026-11-18T12:00:00.000Z' },
        { id: 'e2', expira_em: null },
        { id: 'e3', expira_em: '2026-12-31T23:59:59.000Z' },
      ];
    },
    async run(sql: string, params: any[]) {
      assert.match(sql, /UPDATE empresas SET relatorio_dia_assinatura = \?/);
      assert.match(sql, /relatorio_dia_assinatura IS NULL/);
      updates.push({ day: Number(params[0]), id: String(params[1]) });
      return { changes: 1 };
    },
  };

  const total = await backfillSubscriptionDays(db as any, new Date('2026-10-07T00:00:00.000Z'));
  assert.equal(total, 2);
  assert.deepEqual(updates, [
    { day: 18, id: 'e1' },
    { day: 31, id: 'e3' },
  ]);
});

test('não sobrescreve empresas que já têm o aniversário definido', async () => {
  const db = {
    async all() {
      return [{ id: 'e1', expira_em: '2026-11-18T12:00:00.000Z' }];
    },
    async run(_sql: string, params: any[]) {
      // Simula o UPDATE condicional: a empresa já tem valor, nada muda.
      assert.equal(params[1], 'e1');
      return { changes: 0 };
    },
  };

  assert.equal(await backfillSubscriptionDays(db as any), 0);
});

test('planos sem o benefício ficam fora do backfill', async () => {
  const db = {
    async all(sql: string) {
      assert.doesNotMatch(sql, /'inicial'|'trial'/);
      return [] as Array<{ id: string; expira_em?: string | null }>;
    },
    async run() {
      throw new Error('não deveria atualizar nenhuma empresa');
    },
  };

  assert.equal(await backfillSubscriptionDays(db as any), 0);
});
