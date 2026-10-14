import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMonthlyReportRecipients } from '../routes/monthlyReportJobsRoutes.js';

describe('destinatários do relatório mensal', () => {
  it('usa o e-mail principal quando não há destinatários configurados', async () => {
    const db = { get: async () => ({ email: 'financeiro@example.com' }) };
    assert.deepEqual(await resolveMonthlyReportRecipients(db, 'empresa-1', null), [{ canal: 'email', destino: 'financeiro@example.com' }]);
  });
  it('retorna lista vazia quando não há destinatários nem e-mail principal', async () => {
    const db = { get: async () => undefined };
    assert.deepEqual(await resolveMonthlyReportRecipients(db, 'empresa-2', null), []);
  });
  it('propaga falhas na consulta de e-mail', async () => {
    const db = { get: async () => { throw new Error('database unavailable'); } };
    await assert.rejects(() => resolveMonthlyReportRecipients(db, 'empresa-3', null), /database unavailable/);
  });
  it('preserva destinatários explícitos sem consultar o banco', async () => {
    const db = { get: async () => { throw new Error('should not query'); } };
    const raw = JSON.stringify([{ canal: 'email', destino: 'financeiro@example.com' }]);
    assert.deepEqual(await resolveMonthlyReportRecipients(db, 'empresa-4', raw), [{ canal: 'email', destino: 'financeiro@example.com' }]);
  });
});
